import type {
  AiIndicator,
  Author,
  Comment,
  CommunityObservation,
  Notification,
  PollutionTag,
  Report,
  WaterLocation,
} from "@/types";
import { INDICATOR_SPECS } from "@/lib/ai/scoring";

/**
 * Row → view model mappers.
 *
 * Postgres returns snake_case and `jsonb` as `unknown`; the UI wants camelCase
 * and typed arrays. Keeping the coercion here means no component ever has to
 * know what shape the database uses.
 */

type Row = Record<string, unknown>;

export function mapReportDetail(row: Row): Report {
  const location: WaterLocation | null = row.location_id
    ? {
        id: String(row.location_id),
        name: String(row.location_name ?? "Unnamed water body"),
        slug: String(row.location_slug ?? ""),
        type: (row.water_body_type as WaterLocation["type"]) ?? "other",
        region: (row.region as string) ?? null,
        country: (row.country as string) ?? null,
        lat: Number(row.latitude ?? 0),
        lng: Number(row.longitude ?? 0),
        description: null,
      }
    : null;

  const author: Author = {
    id: String(row.user_id),
    name: String(row.author_name ?? "Anonymous contributor"),
    avatarUrl: (row.author_avatar as string) ?? null,
    role: (row.author_role as Author["role"]) ?? "user",
    points: Number(row.author_points ?? 0),
  };

  return {
    id: String(row.id),
    title: String(row.title ?? "Untitled report"),
    description: (row.description as string) ?? null,
    observations: asStringArray(row.observations) as CommunityObservation[],
    status: (row.status as Report["status"]) ?? "approved",
    isPublic: row.is_public !== false,
    shareToken: String(row.share_token ?? ""),
    viewCount: Number(row.view_count ?? 0),
    createdAt: isoString(row.created_at),
    updatedAt: isoString(row.updated_at ?? row.created_at),
    imageUrl: String(row.image_url ?? ""),
    thumbnailUrl: (row.thumbnail_url as string) ?? null,
    capturedAt: row.captured_at ? isoString(row.captured_at) : null,
    lat: Number(row.latitude ?? 0),
    lng: Number(row.longitude ?? 0),
    location,
    analysis: {
      id: String(row.analysis_id ?? row.id),
      model: String(row.model ?? "unknown"),
      pollutionScore: Number(row.pollution_score ?? 0),
      waterQuality: (row.water_quality as Report["analysis"]["waterQuality"]) ?? "Moderate",
      clarityScore: Number(row.clarity_score ?? 0),
      confidence: Number(row.confidence ?? 0),
      detectedObjects: asStringArray(row.detected_objects),
      pollutionTags: asStringArray(row.pollution_tags).filter(isPollutionTag),
      explanation: String(row.explanation ?? ""),
      recommendations: asStringArray(row.recommendations),
      indicators: mapIndicators(row.indicators),
      createdAt: isoString(row.analysed_at ?? row.created_at),
    },
    author,
    commentCount: Number(row.comment_count ?? 0),
  };
}

export function mapLocation(row: Row): WaterLocation {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    type: (row.water_body_type as WaterLocation["type"]) ?? "other",
    region: (row.region as string) ?? null,
    country: (row.country as string) ?? null,
    lat: Number(row.latitude ?? 0),
    lng: Number(row.longitude ?? 0),
    description: (row.description as string) ?? null,
  };
}

export function mapComment(row: Row): Comment {
  const profile = (row.profiles ?? {}) as Row;
  return {
    id: String(row.id),
    body: String(row.body ?? ""),
    createdAt: isoString(row.created_at),
    author: {
      id: String(row.user_id),
      name: String(profile.full_name ?? "Anonymous contributor"),
      avatarUrl: (profile.avatar_url as string) ?? null,
      role: (profile.role as Author["role"]) ?? "user",
      points: Number(profile.points ?? 0),
    },
  };
}

export function mapNotification(row: Row): Notification {
  return {
    id: String(row.id),
    kind: (row.kind as Notification["kind"]) ?? "nearby_report",
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    reportId: (row.report_id as string) ?? null,
    locationId: (row.location_id as string) ?? null,
    readAt: row.read_at ? isoString(row.read_at) : null,
    createdAt: isoString(row.created_at),
  };
}

export function mapProfile(row: Row): Author {
  return {
    id: String(row.id),
    name: String(row.full_name ?? row.email ?? "Anonymous contributor"),
    avatarUrl: (row.avatar_url as string) ?? null,
    role: (row.role as Author["role"]) ?? "user",
    points: Number(row.points ?? 0),
  };
}

function mapIndicators(value: unknown): AiIndicator[] {
  if (!Array.isArray(value)) return [];

  const mapped: Array<AiIndicator | null> = value.map((entry) => {
    if (!entry || typeof entry !== "object") return null;
    const obj = entry as Row;
    const spec = INDICATOR_SPECS.find((s) => s.key === String(obj.key ?? ""));
    if (!spec) return null;

    return {
      key: spec.key,
      label: String(obj.label ?? spec.label),
      severity: Number(obj.severity ?? 0),
      detected: obj.detected !== false,
      note: obj.note ? String(obj.note) : undefined,
    };
  });

  return mapped.filter((v): v is AiIndicator => v !== null);
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function isPollutionTag(value: string): value is PollutionTag {
  return INDICATOR_SPECS.some((s) => s.key === value && s.key !== "clarity");
}

function isoString(value: unknown) {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}
