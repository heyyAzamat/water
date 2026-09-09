/**
 * AquaVision AI — shared domain types.
 *
 * These mirror the PostgreSQL schema in `supabase/migrations`. Row types are
 * snake_case (what Postgres returns); the view models the UI consumes are
 * camelCase and are produced by the mappers in `src/lib/data/mappers.ts`.
 */

export type WaterBodyType =
  | "river"
  | "lake"
  | "reservoir"
  | "pond"
  | "canal"
  | "sea"
  | "wetland"
  | "other";

export type WaterQuality =
  | "Excellent"
  | "Good"
  | "Moderate"
  | "Poor"
  | "Critical";

export type TrendDirection = "improving" | "stable" | "worsening" | "unknown";

export type UserRole = "user" | "moderator" | "admin";

export type ModerationStatus = "pending" | "approved" | "flagged" | "rejected";

export type PollutionTag =
  | "plastic"
  | "floating_garbage"
  | "oil_film"
  | "foam"
  | "algae_bloom"
  | "unnatural_color"
  | "turbidity"
  | "industrial_discharge"
  | "sewage"
  | "dead_fish"
  | "construction_debris"
  | "eutrophication";

export type CommunityObservation =
  | "bad_smell"
  | "dead_fish"
  | "foam"
  | "illegal_dumping"
  | "nearby_factory"
  | "discolored_water"
  | "oil_sheen"
  | "excess_vegetation";

/* ------------------------------------------------------------------ *
 * Row shapes (database)
 * ------------------------------------------------------------------ */

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  region: string | null;
  points: number;
  created_at: string;
}

export interface LocationRow {
  id: string;
  name: string;
  slug: string;
  water_body_type: WaterBodyType;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  created_at: string;
}

export interface UploadRow {
  id: string;
  user_id: string;
  location_id: string | null;
  image_url: string;
  thumbnail_url: string | null;
  storage_path: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  mime_type: string | null;
  captured_at: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface AiAnalysisRow {
  id: string;
  upload_id: string;
  model: string;
  pollution_score: number;
  water_quality: WaterQuality;
  clarity_score: number;
  confidence: number;
  detected_objects: string[];
  pollution_tags: PollutionTag[];
  explanation: string;
  recommendations: string[];
  indicators: AiIndicator[];
  raw_response: unknown;
  latency_ms: number | null;
  created_at: string;
}

export interface ReportRow {
  id: string;
  upload_id: string;
  user_id: string;
  location_id: string | null;
  title: string;
  description: string | null;
  observations: CommunityObservation[];
  severity_override: number | null;
  status: ModerationStatus;
  is_public: boolean;
  share_token: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommentRow {
  id: string;
  report_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  report_id: string | null;
  location_id: string | null;
  read_at: string | null;
  created_at: string;
}

export type NotificationKind =
  | "nearby_report"
  | "pollution_increase"
  | "critical_trend"
  | "comment"
  | "achievement"
  | "moderation";

/* ------------------------------------------------------------------ *
 * AI contract
 * ------------------------------------------------------------------ */

/** One measured dimension of the vision analysis, 0–100 severity. */
export interface AiIndicator {
  key: PollutionTag | "clarity";
  label: string;
  /** 0 = not present / pristine, 100 = severe */
  severity: number;
  detected: boolean;
  note?: string;
}

/** The exact JSON contract the vision model is asked to return. */
export interface VisionAnalysis {
  pollution_score: number;
  water_quality: WaterQuality;
  clarity_score: number;
  confidence: number;
  detected_objects: string[];
  pollution_tags: PollutionTag[];
  explanation: string;
  recommendations: string[];
  indicators: AiIndicator[];
  is_water_body: boolean;
  scene_summary: string;
}

export interface AnalysisEnvelope {
  analysis: VisionAnalysis;
  model: string;
  latencyMs: number;
  /** True when the heuristic engine produced the result (no API key set). */
  simulated: boolean;
}

/* ------------------------------------------------------------------ *
 * View models
 * ------------------------------------------------------------------ */

export interface Author {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  points: number;
}

export interface WaterLocation {
  id: string;
  name: string;
  slug: string;
  type: WaterBodyType;
  region: string | null;
  country: string | null;
  lat: number;
  lng: number;
  description: string | null;
}

export interface Analysis {
  id: string;
  model: string;
  pollutionScore: number;
  waterQuality: WaterQuality;
  clarityScore: number;
  confidence: number;
  detectedObjects: string[];
  pollutionTags: PollutionTag[];
  explanation: string;
  recommendations: string[];
  indicators: AiIndicator[];
  createdAt: string;
}

export interface Report {
  id: string;
  title: string;
  description: string | null;
  observations: CommunityObservation[];
  status: ModerationStatus;
  isPublic: boolean;
  shareToken: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  capturedAt: string | null;
  lat: number;
  lng: number;
  location: WaterLocation | null;
  analysis: Analysis;
  author: Author;
  commentCount: number;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
}

export interface Notification {
  id: string;
  kind: NotificationKind;
  /** English fallback, used when the locale has no template for `kind`. */
  title: string;
  body: string;
  /**
   * Substitution values for the localised `kind` template. Rows written before
   * localisation (and any produced outside this app) omit this, in which case
   * the stored `title`/`body` are rendered as-is.
   */
  params?: NotificationParams;
  reportId: string | null;
  locationId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationParams {
  location?: string;
  author?: string;
  score?: number;
  grade?: string;
  count?: number;
  badge?: string;
  nextBadge?: string;
}

/* ------------------------------------------------------------------ *
 * Analytics / trend
 * ------------------------------------------------------------------ */

export interface TrendPoint {
  date: string;
  score: number;
  reportId: string;
  quality: WaterQuality;
  confidence: number;
}

export interface TrendAnalysis {
  direction: TrendDirection;
  /** Score delta between the earliest and latest window, negative = cleaner. */
  delta: number;
  /** Least-squares slope in score-points per day. */
  slopePerDay: number;
  /** 0–1, how much of the variance the linear fit explains. */
  reliability: number;
  sampleSize: number;
  spanDays: number;
  firstScore: number;
  latestScore: number;
  average: number;
  /** Model-projected score 30 days out, clamped to 0–100. */
  projectedScore: number | null;
  summary: string;
  points: TrendPoint[];
}

export interface PlatformStats {
  reports: number;
  locations: number;
  contributors: number;
  averageScore: number;
  criticalCount: number;
  analysedImages: number;
  countries: number;
  qualityBreakdown: Record<WaterQuality, number>;
}

export interface UserStats {
  reports: number;
  locations: number;
  averageScore: number;
  bestScore: number | null;
  worstScore: number | null;
  points: number;
  rank: number | null;
  streakDays: number;
  criticalFindings: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: Author;
  reports: number;
  points: number;
  averageScore: number;
  regions: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  progress: number;
  target: number;
  unlocked: boolean;
}

/* ------------------------------------------------------------------ *
 * Query / filter contracts
 * ------------------------------------------------------------------ */

export interface ReportFilters {
  q?: string;
  from?: string;
  to?: string;
  region?: string;
  waterBodyType?: WaterBodyType | "all";
  quality?: WaterQuality | "all";
  minScore?: number;
  maxScore?: number;
  locationId?: string;
  userId?: string;
  status?: ModerationStatus | "all";
  sort?: "recent" | "worst" | "best" | "popular";
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
