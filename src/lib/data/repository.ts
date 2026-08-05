import "server-only";

import type {
  Achievement,
  Author,
  Comment,
  LeaderboardEntry,
  Notification,
  Paginated,
  PlatformStats,
  Report,
  ReportFilters,
  TrendAnalysis,
  UserStats,
  WaterLocation,
  WaterQuality,
} from "@/types";
import { hasSupabase } from "@/lib/env";
import { haversineKm } from "@/lib/utils";
import { analyseTrend } from "@/lib/ai/trend";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  mapComment,
  mapLocation,
  mapNotification,
  mapProfile,
  mapReportDetail,
} from "./mappers";
import { demoData } from "./demo-store";

/**
 * The single data-access surface for the whole app.
 *
 * Every function has two implementations behind one signature: Supabase when
 * credentials exist, the bundled demo dataset otherwise. Pages and API routes
 * never branch on which backend is live.
 */

const DEFAULT_PAGE_SIZE = 12;

/* ------------------------------------------------------------------ *
 * Reports
 * ------------------------------------------------------------------ */

export async function listReports(
  filters: ReportFilters = {},
): Promise<Paginated<Report>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(60, filters.pageSize ?? DEFAULT_PAGE_SIZE);

  const supabase = await createServerSupabase();

  if (supabase) {
    let query = supabase
      .from("report_details")
      .select("*", { count: "exact" });

    query = applySupabaseFilters(query, filters);

    switch (filters.sort) {
      case "worst":
        query = query.order("pollution_score", { ascending: false });
        break;
      case "best":
        query = query.order("pollution_score", { ascending: true });
        break;
      case "popular":
        query = query.order("view_count", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * pageSize;
    const { data, count, error } = await query.range(from, from + pageSize - 1);

    if (error) throw new Error(`listReports failed: ${error.message}`);

    const total = count ?? 0;
    return {
      items: (data ?? []).map(mapReportDetail),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  const filtered = filterDemoReports(filters);
  const sorted = sortDemoReports(filtered, filters.sort);
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    page,
    pageSize,
    total: sorted.length,
    totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
  };
}

export async function getReport(id: string): Promise<Report | null> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("report_details")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`getReport failed: ${error.message}`);
    return data ? mapReportDetail(data) : null;
  }

  return demoData().reports.find((r) => r.id === id) ?? null;
}

export async function getReportByShareToken(
  token: string,
): Promise<Report | null> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("report_details")
      .select("*")
      .eq("share_token", token)
      .maybeSingle();

    if (error) throw new Error(`getReportByShareToken failed: ${error.message}`);
    return data ? mapReportDetail(data) : null;
  }

  return demoData().reports.find((r) => r.shareToken === token) ?? null;
}

/** Reports inside a map viewport. Capped so a world-zoom pan stays fast. */
export async function reportsInBounds(bounds: {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  limit?: number;
}): Promise<Report[]> {
  const supabase = await createServerSupabase();
  const limit = bounds.limit ?? 1500;

  if (supabase) {
    const { data, error } = await supabase.rpc("reports_in_bounds", {
      min_lat: bounds.minLat,
      min_lng: bounds.minLng,
      max_lat: bounds.maxLat,
      max_lng: bounds.maxLng,
      max_rows: limit,
    });

    if (error) throw new Error(`reportsInBounds failed: ${error.message}`);
    return (data ?? []).map(mapReportDetail);
  }

  return demoData()
    .reports.filter(
      (r) =>
        r.status === "approved" &&
        r.isPublic &&
        r.lat >= bounds.minLat &&
        r.lat <= bounds.maxLat &&
        r.lng >= bounds.minLng &&
        r.lng <= bounds.maxLng,
    )
    .slice(0, limit);
}

/** Every public approved report — the map's initial payload. */
export async function allMapReports(): Promise<Report[]> {
  return reportsInBounds({
    minLat: -90,
    minLng: -180,
    maxLat: 90,
    maxLng: 180,
    limit: 3000,
  });
}

export async function listUserReports(
  userId: string,
  limit = 8,
): Promise<Report[]> {
  const { items } = await listReports({
    userId,
    status: "all",
    pageSize: limit,
    sort: "recent",
  });
  return items;
}

/* ------------------------------------------------------------------ *
 * Locations & trend
 * ------------------------------------------------------------------ */

export async function listLocations(): Promise<WaterLocation[]> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name");
    if (error) throw new Error(`listLocations failed: ${error.message}`);
    return (data ?? []).map(mapLocation);
  }

  return [...demoData().locations].sort((a, b) => a.name.localeCompare(b.name));
}

export async function searchLocations(
  term: string,
  limit = 8,
): Promise<Array<WaterLocation & { reportCount: number; avgScore: number | null }>> {
  const needle = term.trim().toLowerCase();
  const locations = await listLocations();

  const matches = needle
    ? locations.filter(
        (l) =>
          l.name.toLowerCase().includes(needle) ||
          l.region?.toLowerCase().includes(needle) ||
          l.country?.toLowerCase().includes(needle) ||
          l.type.includes(needle),
      )
    : locations;

  // Rank exact prefix matches above substring matches.
  matches.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(needle) ? 0 : 1;
    const bStarts = b.name.toLowerCase().startsWith(needle) ? 0 : 1;
    return aStarts - bStarts || a.name.localeCompare(b.name);
  });

  const trimmed = matches.slice(0, limit);
  const stats = await Promise.all(
    trimmed.map(async (location) => {
      const reports = await reportsForLocation(location.id);
      const avg =
        reports.length > 0
          ? Math.round(
              reports.reduce((s, r) => s + r.analysis.pollutionScore, 0) /
                reports.length,
            )
          : null;
      return { ...location, reportCount: reports.length, avgScore: avg };
    }),
  );

  return stats;
}

export async function reportsForLocation(locationId: string): Promise<Report[]> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("report_details")
      .select("*")
      .eq("location_id", locationId)
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    if (error) throw new Error(`reportsForLocation failed: ${error.message}`);
    return (data ?? []).map(mapReportDetail);
  }

  return demoData()
    .reports.filter((r) => r.location?.id === locationId && r.status === "approved")
    .sort(
      (a, b) =>
        new Date(a.capturedAt ?? a.createdAt).getTime() -
        new Date(b.capturedAt ?? b.createdAt).getTime(),
    );
}

export async function getLocationTrend(
  locationId: string,
): Promise<TrendAnalysis> {
  return analyseTrend(await reportsForLocation(locationId));
}

/** Locations ranked by severity — drives the "hotspots" panel. */
export async function worstLocations(limit = 6) {
  const locations = await listLocations();

  const scored = await Promise.all(
    locations.map(async (location) => {
      const reports = await reportsForLocation(location.id);
      if (!reports.length) return null;
      const latest = reports[reports.length - 1];
      const avg = Math.round(
        reports.reduce((s, r) => s + r.analysis.pollutionScore, 0) / reports.length,
      );
      return {
        location,
        reportCount: reports.length,
        averageScore: avg,
        latestScore: latest.analysis.pollutionScore,
        trend: analyseTrend(reports),
      };
    }),
  );

  return scored
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.latestScore - a.latestScore)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ *
 * Stats
 * ------------------------------------------------------------------ */

export async function platformStats(): Promise<PlatformStats> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const [{ data: stats }, { data: qualityRows }] = await Promise.all([
      supabase.rpc("platform_stats"),
      supabase.from("ai_analysis").select("water_quality"),
    ]);

    const breakdown = emptyBreakdown();
    for (const row of qualityRows ?? []) {
      const key = (row as { water_quality: WaterQuality }).water_quality;
      if (key in breakdown) breakdown[key] += 1;
    }

    const s = (stats ?? {}) as Record<string, number>;
    return {
      reports: s.reports ?? 0,
      locations: s.locations ?? 0,
      contributors: s.contributors ?? 0,
      averageScore: s.averageScore ?? 0,
      criticalCount: s.criticalCount ?? 0,
      analysedImages: s.analysedImages ?? 0,
      countries: s.countries ?? 0,
      qualityBreakdown: breakdown,
    };
  }

  const { reports, locations, authors } = demoData();
  const approved = reports.filter((r) => r.status === "approved");
  const breakdown = emptyBreakdown();
  for (const report of approved) breakdown[report.analysis.waterQuality] += 1;

  return {
    reports: approved.length,
    locations: locations.length,
    contributors: new Set(approved.map((r) => r.author.id)).size || authors.length,
    averageScore: approved.length
      ? Math.round(
          approved.reduce((s, r) => s + r.analysis.pollutionScore, 0) /
            approved.length,
        )
      : 0,
    criticalCount: approved.filter((r) => r.analysis.pollutionScore >= 81).length,
    analysedImages: reports.length,
    countries: new Set(locations.map((l) => l.country).filter(Boolean)).size,
    qualityBreakdown: breakdown,
  };
}

export async function userStats(userId: string): Promise<UserStats> {
  const { items: reports } = await listReports({
    userId,
    status: "all",
    pageSize: 60,
  });
  const leaderboard = await leaderboardEntries(200);
  const entry = leaderboard.find((e) => e.user.id === userId);

  const scores = reports.map((r) => r.analysis.pollutionScore);

  return {
    reports: reports.length,
    locations: new Set(reports.map((r) => r.location?.id).filter(Boolean)).size,
    averageScore: scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0,
    bestScore: scores.length ? Math.min(...scores) : null,
    worstScore: scores.length ? Math.max(...scores) : null,
    points: entry?.points ?? 0,
    rank: entry?.rank ?? null,
    streakDays: contributionStreak(reports),
    criticalFindings: reports.filter((r) => r.analysis.pollutionScore >= 81).length,
  };
}

/** Consecutive days, counting back from the most recent upload. */
function contributionStreak(reports: Report[]) {
  if (!reports.length) return 0;

  const days = [
    ...new Set(
      reports.map((r) => new Date(r.createdAt).toISOString().slice(0, 10)),
    ),
  ].sort((a, b) => (a < b ? 1 : -1));

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]).getTime();
    const curr = new Date(days[i]).getTime();
    if (Math.round((prev - curr) / 86_400_000) === 1) streak += 1;
    else break;
  }
  return streak;
}

export async function leaderboardEntries(
  limit = 20,
): Promise<LeaderboardEntry[]> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("rank")
      .limit(limit);

    if (error) throw new Error(`leaderboard failed: ${error.message}`);

    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        rank: Number(r.rank ?? 0),
        user: mapProfile(r),
        reports: Number(r.report_count ?? 0),
        points: Number(r.points ?? 0),
        averageScore: Number(r.avg_score ?? 0),
        regions: Number(r.location_count ?? 0),
      };
    });
  }

  const { authors, reports } = demoData();

  const rows = authors
    .map((author) => {
      const own = reports.filter(
        (r) => r.author.id === author.id && r.status === "approved",
      );
      return {
        user: author,
        reports: own.length,
        points: author.points,
        averageScore: own.length
          ? Math.round(
              own.reduce((s, r) => s + r.analysis.pollutionScore, 0) / own.length,
            )
          : 0,
        regions: new Set(own.map((r) => r.location?.region).filter(Boolean)).size,
      };
    })
    .sort((a, b) => b.points - a.points || b.reports - a.reports)
    .slice(0, limit);

  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}

/* ------------------------------------------------------------------ *
 * Achievements — derived, never stored
 * ------------------------------------------------------------------ */

export function buildAchievements(stats: UserStats): Achievement[] {
  const defs: Array<Omit<Achievement, "unlocked" | "progress">> = [
    { id: "first-drop", name: "First Drop", description: "Publish your first water assessment.", icon: "droplet", tier: "bronze", target: 1 },
    { id: "field-analyst", name: "Field Analyst", description: "Publish 10 verified assessments.", icon: "scan", tier: "silver", target: 10 },
    { id: "basin-guardian", name: "Basin Guardian", description: "Publish 50 verified assessments.", icon: "shield", tier: "gold", target: 50 },
    { id: "cartographer", name: "Cartographer", description: "Document 5 distinct water bodies.", icon: "map", tier: "silver", target: 5 },
    { id: "first-responder", name: "First Responder", description: "Detect 3 critical pollution events.", icon: "siren", tier: "gold", target: 3 },
    { id: "streak-keeper", name: "Streak Keeper", description: "Contribute on 7 consecutive days.", icon: "flame", tier: "silver", target: 7 },
    { id: "reputation", name: "Trusted Observer", description: "Earn 500 contribution points.", icon: "award", tier: "platinum", target: 500 },
  ];

  const progressFor: Record<string, number> = {
    "first-drop": stats.reports,
    "field-analyst": stats.reports,
    "basin-guardian": stats.reports,
    cartographer: stats.locations,
    "first-responder": stats.criticalFindings,
    "streak-keeper": stats.streakDays,
    reputation: stats.points,
  };

  return defs.map((def) => {
    const progress = Math.min(def.target, progressFor[def.id] ?? 0);
    return { ...def, progress, unlocked: progress >= def.target };
  });
}

/* ------------------------------------------------------------------ *
 * Comments & notifications
 * ------------------------------------------------------------------ */

export async function listComments(reportId: string): Promise<Comment[]> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(full_name, avatar_url, role, points)")
      .eq("report_id", reportId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`listComments failed: ${error.message}`);
    return (data ?? []).map(mapComment);
  }

  return demoData()
    .comments.filter((c) => c.id.startsWith(`cmt-${reportId.slice(4)}`))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function listNotifications(
  userId: string,
  limit = 30,
): Promise<Notification[]> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`listNotifications failed: ${error.message}`);
    return (data ?? []).map(mapNotification);
  }

  return demoData().notifications.slice(0, limit);
}

/* ------------------------------------------------------------------ *
 * Nearby — powers the notification radius and "similar sites" panel
 * ------------------------------------------------------------------ */

export async function nearbyReports(
  origin: { lat: number; lng: number },
  radiusKm: number,
  excludeReportId?: string,
): Promise<Array<Report & { distanceKm: number }>> {
  // One degree of latitude ≈ 111 km; widen the box a little for longitude
  // convergence at high latitude, then filter precisely with haversine.
  const latPad = radiusKm / 111;
  const lngPad = radiusKm / (111 * Math.max(0.2, Math.cos((origin.lat * Math.PI) / 180)));

  const candidates = await reportsInBounds({
    minLat: origin.lat - latPad,
    maxLat: origin.lat + latPad,
    minLng: origin.lng - lngPad,
    maxLng: origin.lng + lngPad,
    limit: 400,
  });

  return candidates
    .filter((r) => r.id !== excludeReportId)
    .map((r) => ({ ...r, distanceKm: haversineKm(origin, { lat: r.lat, lng: r.lng }) }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

export async function moderationQueue(limit = 40): Promise<Report[]> {
  const { items } = await listReports({
    status: "all",
    pageSize: limit,
    sort: "recent",
  });
  // Pending first, then flagged, then everything else.
  const weight = { pending: 0, flagged: 1, approved: 2, rejected: 3 };
  return items.sort((a, b) => weight[a.status] - weight[b.status]);
}

export async function listProfiles(limit = 60): Promise<Author[]> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("points", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`listProfiles failed: ${error.message}`);
    return (data ?? []).map(mapProfile);
  }

  return [...demoData().authors].sort((a, b) => b.points - a.points).slice(0, limit);
}

/* ------------------------------------------------------------------ *
 * Filtering helpers
 * ------------------------------------------------------------------ */

type SupabaseQuery = {
  eq: (column: string, value: unknown) => SupabaseQuery;
  gte: (column: string, value: unknown) => SupabaseQuery;
  lte: (column: string, value: unknown) => SupabaseQuery;
  or: (filter: string) => SupabaseQuery;
};

function applySupabaseFilters<T extends SupabaseQuery>(
  query: T,
  filters: ReportFilters,
): T {
  let q = query;

  if (filters.status && filters.status !== "all") q = q.eq("status", filters.status) as T;
  else if (!filters.status) q = q.eq("status", "approved") as T;

  if (filters.userId) q = q.eq("user_id", filters.userId) as T;
  if (filters.locationId) q = q.eq("location_id", filters.locationId) as T;
  if (filters.region) q = q.eq("region", filters.region) as T;
  if (filters.waterBodyType && filters.waterBodyType !== "all") {
    q = q.eq("water_body_type", filters.waterBodyType) as T;
  }
  if (filters.quality && filters.quality !== "all") {
    q = q.eq("water_quality", filters.quality) as T;
  }
  if (typeof filters.minScore === "number") {
    q = q.gte("pollution_score", filters.minScore) as T;
  }
  if (typeof filters.maxScore === "number") {
    q = q.lte("pollution_score", filters.maxScore) as T;
  }
  if (filters.from) q = q.gte("created_at", filters.from) as T;
  if (filters.to) q = q.lte("created_at", filters.to) as T;
  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, "");
    q = q.or(
      `title.ilike.%${term}%,location_name.ilike.%${term}%,region.ilike.%${term}%`,
    ) as T;
  }

  return q;
}

function filterDemoReports(filters: ReportFilters): Report[] {
  const status = filters.status ?? "approved";
  const needle = filters.q?.trim().toLowerCase();

  return demoData().reports.filter((report) => {
    if (status !== "all" && report.status !== status) return false;
    if (filters.userId && report.author.id !== filters.userId) return false;
    if (filters.locationId && report.location?.id !== filters.locationId) return false;
    if (filters.region && report.location?.region !== filters.region) return false;
    if (
      filters.waterBodyType &&
      filters.waterBodyType !== "all" &&
      report.location?.type !== filters.waterBodyType
    ) {
      return false;
    }
    if (
      filters.quality &&
      filters.quality !== "all" &&
      report.analysis.waterQuality !== filters.quality
    ) {
      return false;
    }
    if (
      typeof filters.minScore === "number" &&
      report.analysis.pollutionScore < filters.minScore
    ) {
      return false;
    }
    if (
      typeof filters.maxScore === "number" &&
      report.analysis.pollutionScore > filters.maxScore
    ) {
      return false;
    }
    if (filters.from && new Date(report.createdAt) < new Date(filters.from)) return false;
    if (filters.to && new Date(report.createdAt) > new Date(filters.to)) return false;

    if (needle) {
      const haystack = [
        report.title,
        report.description ?? "",
        report.location?.name ?? "",
        report.location?.region ?? "",
        report.location?.country ?? "",
        ...report.analysis.detectedObjects,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
}

function sortDemoReports(reports: Report[], sort: ReportFilters["sort"]) {
  const copy = [...reports];
  switch (sort) {
    case "worst":
      return copy.sort(
        (a, b) => b.analysis.pollutionScore - a.analysis.pollutionScore,
      );
    case "best":
      return copy.sort(
        (a, b) => a.analysis.pollutionScore - b.analysis.pollutionScore,
      );
    case "popular":
      return copy.sort((a, b) => b.viewCount - a.viewCount);
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

function emptyBreakdown(): Record<WaterQuality, number> {
  return { Excellent: 0, Good: 0, Moderate: 0, Poor: 0, Critical: 0 };
}

export const backend = hasSupabase() ? "supabase" : ("demo" as const);
