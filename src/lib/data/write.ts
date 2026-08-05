import "server-only";

import { randomUUID } from "node:crypto";
import type {
  Analysis,
  Author,
  Comment,
  CommunityObservation,
  ModerationStatus,
  Report,
  VisionAnalysis,
  WaterBodyType,
  WaterLocation,
} from "@/types";
import { env, hasSupabase } from "@/lib/env";
import { slugify } from "@/lib/utils";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase/server";
import { mapReportDetail } from "./mappers";
import {
  addDemoComment,
  addDemoReport,
  demoData,
  removeDemoReport,
} from "./demo-store";
import { sampleWaterImage } from "./sample-image";

/**
 * Write path.
 *
 * Reads live in `repository.ts`; mutations live here because they need the
 * service-role client (an AI score must not be writable from a browser
 * session) and because the demo branch has to mutate the in-memory store.
 */

export interface CreateReportInput {
  userId: string;
  author: Author;
  title: string;
  description: string | null;
  observations: CommunityObservation[];
  analysis: VisionAnalysis;
  model: string;
  latencyMs: number;
  simulated: boolean;
  capturedAt: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  mimeType: string;
  features: unknown;
  lat: number;
  lng: number;
  location:
    | { id: string }
    | {
        name: string;
        waterBodyType: WaterBodyType;
        region: string | null;
        lat: number;
        lng: number;
      };
  /** Compressed image bytes. Uploaded to storage when Supabase is configured. */
  imageBuffer: Buffer;
  imageName: string;
}

export async function createReport(
  input: CreateReportInput,
): Promise<{ id: string }> {
  return hasSupabase() ? createReportSupabase(input) : createReportDemo(input);
}

/* ------------------------------------------------------------------ *
 * Supabase path
 * ------------------------------------------------------------------ */

async function createReportSupabase(input: CreateReportInput) {
  const supabase = await createServerSupabase();
  if (!supabase) throw new Error("Supabase client unavailable");

  // The analysis row must be written with elevated rights so a client can
  // never forge or edit a score; fall back to the user session if no service
  // key is configured (RLS then applies).
  const writer = createAdminSupabase() ?? supabase;

  const locationId = await resolveLocationId(input);

  /* ------------------------------ storage ------------------------------ */
  const extension = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
  const storagePath = `${input.userId}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, input.imageBuffer, {
      contentType: input.mimeType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(storagePath);

  /* ------------------------------ upload row ------------------------------ */
  const { data: upload, error: uploadRowError } = await supabase
    .from("uploads")
    .insert({
      user_id: input.userId,
      location_id: locationId,
      image_url: publicUrl,
      storage_path: storagePath,
      width: input.width,
      height: input.height,
      bytes: input.bytes,
      mime_type: input.mimeType,
      captured_at: input.capturedAt,
      latitude: input.lat,
      longitude: input.lng,
      image_features: input.features ?? null,
    })
    .select("id")
    .single();

  if (uploadRowError || !upload) {
    // Don't leave an orphaned object behind if the row insert failed.
    await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Could not record upload: ${uploadRowError?.message}`);
  }

  /* ------------------------------ analysis ------------------------------ */
  const { error: analysisError } = await writer.from("ai_analysis").insert({
    upload_id: upload.id,
    model: input.model,
    pollution_score: input.analysis.pollution_score,
    water_quality: input.analysis.water_quality,
    clarity_score: input.analysis.clarity_score,
    confidence: input.analysis.confidence,
    detected_objects: input.analysis.detected_objects,
    pollution_tags: input.analysis.pollution_tags,
    explanation: input.analysis.explanation,
    recommendations: input.analysis.recommendations,
    indicators: input.analysis.indicators,
    raw_response: input.analysis,
    latency_ms: input.latencyMs,
    is_simulated: input.simulated,
  });

  if (analysisError) {
    throw new Error(`Could not record analysis: ${analysisError.message}`);
  }

  /* ------------------------------- report ------------------------------- */
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      upload_id: upload.id,
      user_id: input.userId,
      location_id: locationId,
      title: input.title,
      description: input.description,
      observations: input.observations,
      // Critical findings go through a human before they hit the public map.
      status: input.analysis.pollution_score >= 90 ? "pending" : "approved",
    })
    .select("id")
    .single();

  if (reportError || !report) {
    throw new Error(`Could not create report: ${reportError?.message}`);
  }

  return { id: report.id };
}

async function resolveLocationId(input: CreateReportInput) {
  if ("id" in input.location) return input.location.id;

  const supabase = await createServerSupabase();
  if (!supabase) throw new Error("Supabase client unavailable");

  const slug = slugify(input.location.name);

  const { data: existing } = await supabase
    .from("locations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("locations")
    .insert({
      name: input.location.name,
      slug,
      water_body_type: input.location.waterBodyType,
      region: input.location.region,
      latitude: input.location.lat,
      longitude: input.location.lng,
      created_by: input.userId,
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(`Could not create location: ${error?.message}`);
  }

  return created.id as string;
}

/* ------------------------------------------------------------------ *
 * Demo path — mutate the in-memory dataset
 * ------------------------------------------------------------------ */

function createReportDemo(input: CreateReportInput) {
  const data = demoData();
  const id = `rep-live-${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  // Bound to a local so the discriminated-union narrowing survives into the
  // `find` callback below.
  const target = input.location;

  const location: WaterLocation =
    "id" in target
      ? (data.locations.find((l) => l.id === target.id) ?? {
          id: target.id,
          name: "Unknown location",
          slug: "unknown",
          type: "other",
          region: null,
          country: null,
          lat: input.lat,
          lng: input.lng,
          description: null,
        })
      : {
          id: `loc-live-${randomUUID().slice(0, 8)}`,
          name: target.name,
          slug: slugify(target.name),
          type: target.waterBodyType,
          region: target.region,
          country: null,
          lat: target.lat,
          lng: target.lng,
          description: null,
        };

  const analysis: Analysis = {
    id: `ana-live-${randomUUID().slice(0, 8)}`,
    model: input.model,
    pollutionScore: input.analysis.pollution_score,
    waterQuality: input.analysis.water_quality,
    clarityScore: input.analysis.clarity_score,
    confidence: input.analysis.confidence,
    detectedObjects: input.analysis.detected_objects,
    pollutionTags: input.analysis.pollution_tags,
    explanation: input.analysis.explanation,
    recommendations: input.analysis.recommendations,
    indicators: input.analysis.indicators,
    createdAt: now,
  };

  // No object storage in demo mode: embed the real upload as a data URL so the
  // report the user just created shows their actual photograph.
  const imageUrl =
    input.imageBuffer.length > 0 && input.imageBuffer.length < 3_500_000
      ? `data:${input.mimeType};base64,${input.imageBuffer.toString("base64")}`
      : sampleWaterImage(id, analysis.pollutionScore, analysis.pollutionTags);

  const report: Report = {
    id,
    title: input.title,
    description: input.description,
    observations: input.observations,
    status: analysis.pollutionScore >= 90 ? "pending" : "approved",
    isPublic: true,
    shareToken: `sh_${randomUUID().replace(/-/g, "").slice(0, 18)}`,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
    imageUrl,
    thumbnailUrl: null,
    capturedAt: input.capturedAt ?? now,
    lat: input.lat,
    lng: input.lng,
    location,
    analysis,
    author: input.author,
    commentCount: 0,
  };

  addDemoReport(report);
  return { id };
}

/* ------------------------------------------------------------------ *
 * Comments
 * ------------------------------------------------------------------ */

export async function addComment(input: {
  reportId: string;
  userId: string;
  author: Author;
  body: string;
}): Promise<Comment> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("comments")
      .insert({
        report_id: input.reportId,
        user_id: input.userId,
        body: input.body,
      })
      .select("id, created_at")
      .single();

    if (error || !data) throw new Error(`Could not post comment: ${error?.message}`);

    return {
      id: data.id as string,
      body: input.body,
      createdAt: data.created_at as string,
      author: input.author,
    };
  }

  const comment: Comment = {
    id: `cmt-${input.reportId.slice(4)}-${randomUUID().slice(0, 6)}`,
    body: input.body,
    createdAt: new Date().toISOString(),
    author: input.author,
  };

  addDemoComment(comment, input.reportId);
  return comment;
}

/* ------------------------------------------------------------------ *
 * Moderation
 * ------------------------------------------------------------------ */

export async function setReportStatus(
  reportId: string,
  status: ModerationStatus,
): Promise<Report | null> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", reportId);

    if (error) throw new Error(`Moderation failed: ${error.message}`);

    const { data } = await supabase
      .from("report_details")
      .select("*")
      .eq("id", reportId)
      .maybeSingle();

    return data ? mapReportDetail(data) : null;
  }

  const report = demoData().reports.find((r) => r.id === reportId);
  if (!report) return null;
  report.status = status;
  report.updatedAt = new Date().toISOString();
  return report;
}

export async function deleteReport(reportId: string): Promise<boolean> {
  const supabase = await createServerSupabase();

  if (supabase) {
    // Fetch the storage path first — the cascade removes the row, not the file.
    const { data: report } = await supabase
      .from("reports")
      .select("upload_id, uploads(storage_path)")
      .eq("id", reportId)
      .maybeSingle();

    const storagePath = (
      report as { uploads?: { storage_path?: string | null } } | null
    )?.uploads?.storage_path;

    const { error } = await supabase.from("reports").delete().eq("id", reportId);
    if (error) throw new Error(`Delete failed: ${error.message}`);

    if (storagePath) {
      await supabase.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .remove([storagePath])
        .catch(() => {
          // A leftover object is preferable to failing the user's delete.
        });
    }

    return true;
  }

  return removeDemoReport(reportId);
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const supabase = await createServerSupabase();

  if (supabase) {
    let query = supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    if (ids?.length) query = query.in("id", ids);

    const { error } = await query;
    if (error) throw new Error(`Could not mark as read: ${error.message}`);
    return;
  }

  const now = new Date().toISOString();
  for (const notification of demoData().notifications) {
    if (ids?.length && !ids.includes(notification.id)) continue;
    notification.readAt ??= now;
  }
}

export async function updateProfile(input: {
  userId: string;
  fullName?: string;
  bio?: string | null;
  region?: string | null;
  notifyNearby?: boolean;
  notifyTrend?: boolean;
  notifyRadiusKm?: number;
  homeLat?: number | null;
  homeLng?: number | null;
}) {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...(input.fullName !== undefined ? { full_name: input.fullName } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.region !== undefined ? { region: input.region } : {}),
        ...(input.notifyNearby !== undefined
          ? { notify_nearby: input.notifyNearby }
          : {}),
        ...(input.notifyTrend !== undefined
          ? { notify_trend: input.notifyTrend }
          : {}),
        ...(input.notifyRadiusKm !== undefined
          ? { notify_radius_km: input.notifyRadiusKm }
          : {}),
        ...(input.homeLat !== undefined ? { home_latitude: input.homeLat } : {}),
        ...(input.homeLng !== undefined ? { home_longitude: input.homeLng } : {}),
      })
      .eq("id", input.userId);

    if (error) throw new Error(`Could not save profile: ${error.message}`);
    return;
  }

  const author = demoData().authors.find((a) => a.id === input.userId);
  if (author && input.fullName) author.name = input.fullName;
}
