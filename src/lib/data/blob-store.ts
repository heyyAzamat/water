import "server-only";

import { del, list, put } from "@vercel/blob";
import type { Comment, Report } from "@/types";
import type { DemoDataset } from "./demo-store";

/**
 * Durable storage for the no-database mode, on Vercel Blob.
 *
 * Without it, published reports live only in one server instance's memory:
 * the instance that rendered the list page never sees a report another
 * instance accepted, and everything vanishes on a cold start. Here every
 * report, its photo and its comments are written to Blob, and each instance
 * re-reads the store before answering, so all of them see the same data.
 *
 * Layout:
 *   photos/<reportId>.<ext>              the uploaded image (public URL)
 *   reports/<reportId>.json              the full report
 *   comments/<reportId>/<commentId>.json one file per comment
 *
 * Active only when BLOB_READ_WRITE_TOKEN is set; otherwise every call is a
 * no-op and the store behaves exactly as before (in memory).
 */

export const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Re-reading Blob on every call of a single render would be wasteful. */
const SYNC_INTERVAL_MS = 2_000;
const SYNC_KEY = Symbol.for("aquavision.blob-sync");

type SyncState = { at: number; pending: Promise<void> | null };

function syncState(): SyncState {
  const holder = globalThis as unknown as { [SYNC_KEY]?: SyncState };
  holder[SYNC_KEY] ??= { at: 0, pending: null };
  return holder[SYNC_KEY];
}

async function listAll(prefix: string) {
  const blobs: { pathname: string; url: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

async function readJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Brings the in-memory dataset in line with what is stored in Blob. */
export async function syncFromBlob(data: DemoDataset, force = false) {
  if (!blobEnabled) return;

  const state = syncState();
  if (state.pending) return state.pending;
  if (!force && Date.now() - state.at < SYNC_INTERVAL_MS) return;

  state.pending = (async () => {
    try {
      const [reportBlobs, commentBlobs] = await Promise.all([
        listAll("reports/"),
        listAll("comments/"),
      ]);

      const storedIds = new Set(
        reportBlobs.map((b) => b.pathname.slice("reports/".length, -".json".length)),
      );

      // Reports deleted elsewhere disappear here too.
      data.reports = data.reports.filter((r) => storedIds.has(r.id));

      // Re-read every report: status or comment counts may have changed.
      const reports = await Promise.all(
        reportBlobs.map((b) => readJson<Report>(b.url)),
      );
      const byId = new Map(data.reports.map((r) => [r.id, r]));
      for (const report of reports) {
        if (!report) continue;
        byId.set(report.id, report);
        if (
          report.location &&
          !data.locations.some((l) => l.id === report.location!.id)
        ) {
          data.locations.push(report.location);
        }
      }
      data.reports = [...byId.values()].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const known = new Set(data.comments.map((c) => c.id));
      const fresh = commentBlobs.filter((b) => {
        const id = b.pathname.split("/").pop()!.slice(0, -".json".length);
        return !known.has(id);
      });
      const comments = await Promise.all(
        fresh.map((b) => readJson<Comment>(b.url)),
      );
      for (const comment of comments) if (comment) data.comments.push(comment);
      for (const report of data.reports) {
        report.commentCount = commentBlobs.filter(
          (b) => b.pathname.split("/")[1] === report.id,
        ).length;
      }

      state.at = Date.now();
    } catch (error) {
      // Serve what is in memory rather than failing the page.
      console.error("[blob-store] sync failed", error);
    } finally {
      state.pending = null;
    }
  })();

  return state.pending;
}

/** Uploads the photo and returns its public URL. */
export async function savePhoto(reportId: string, buffer: Buffer, mimeType: string) {
  const extension =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const blob = await put(`photos/${reportId}.${extension}`, buffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}

export async function saveReport(report: Report) {
  if (!blobEnabled) return;
  await put(`reports/${report.id}.json`, JSON.stringify(report), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
  syncState().at = 0;
}

export async function saveComment(reportId: string, comment: Comment) {
  if (!blobEnabled) return;
  await put(`comments/${reportId}/${comment.id}.json`, JSON.stringify(comment), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  syncState().at = 0;
}

export async function removeStoredReport(reportId: string) {
  if (!blobEnabled) return;
  const [photos, comments] = await Promise.all([
    listAll(`photos/${reportId}.`),
    listAll(`comments/${reportId}/`),
  ]);
  await del([
    `reports/${reportId}.json`,
    ...photos.map((b) => b.url),
    ...comments.map((b) => b.url),
  ]);
  syncState().at = 0;
}
