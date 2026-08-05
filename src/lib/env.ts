/**
 * Environment access with graceful degradation.
 *
 * AquaVision is designed to boot and demo with zero configuration:
 *  - no Supabase keys  → the in-memory demo dataset backs every read
 *  - no vision API key → the colourimetric heuristic engine analyses uploads
 *
 * Adding keys switches each subsystem to the real thing without code changes.
 */

function optional(key: string) {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",

  SUPABASE_URL: optional("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: optional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: optional("SUPABASE_SERVICE_ROLE_KEY"),
  SUPABASE_STORAGE_BUCKET: optional("SUPABASE_STORAGE_BUCKET") ?? "water-uploads",

  GOOGLE_GENERATIVE_AI_API_KEY: optional("GOOGLE_GENERATIVE_AI_API_KEY"),
  VISION_MODEL: optional("VISION_MODEL") ?? "gemini-2.5-flash",
  VISION_TIMEOUT_MS: Number(optional("VISION_TIMEOUT_MS") ?? 45_000),

  SITE_URL:
    optional("NEXT_PUBLIC_SITE_URL") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),

  /** Radius used when deciding whether a new report counts as "nearby". */
  NEARBY_RADIUS_KM: Number(optional("NEARBY_RADIUS_KM") ?? 25),
} as const;

export function hasSupabase() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

export function hasSupabaseAdmin() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasVisionKey() {
  return Boolean(env.GOOGLE_GENERATIVE_AI_API_KEY);
}

/** True when the platform is running entirely on the bundled demo dataset. */
export function isDemoMode() {
  return !hasSupabase();
}

export const capabilities = {
  get database() {
    return hasSupabase() ? "supabase" : "demo";
  },
  get vision() {
    return hasVisionKey() ? "gemini" : "heuristic";
  },
  get storage() {
    return hasSupabase() ? "supabase-storage" : "in-memory";
  },
} as const;
