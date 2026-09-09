import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CommunityObservation, WaterBodyType } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { listReports } from "@/lib/data/repository";
import { createReport } from "@/lib/data/write";
import { normaliseAnalysis } from "@/lib/ai/scoring";
import { getLocale } from "@/lib/i18n/server";

export const maxDuration = 60;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const WATER_TYPES = [
  "river",
  "lake",
  "reservoir",
  "pond",
  "canal",
  "sea",
  "wetland",
  "other",
] as const;

const OBSERVATIONS = [
  "bad_smell",
  "dead_fish",
  "foam",
  "illegal_dumping",
  "nearby_factory",
  "discolored_water",
  "oil_sheen",
  "excess_vegetation",
] as const;

const payloadSchema = z.object({
  analysis: z.unknown(),
  model: z.string().min(1).max(120),
  latencyMs: z.number().int().nonnegative().max(600_000),
  simulated: z.boolean(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(4000).nullish(),
  observations: z.array(z.enum(OBSERVATIONS)).max(12).default([]),
  capturedAt: z.string().datetime().nullish(),
  width: z.number().int().positive().max(20_000).nullish(),
  height: z.number().int().positive().max(20_000).nullish(),
  bytes: z.number().int().positive().max(MAX_IMAGE_BYTES).nullish(),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  features: z.unknown().nullish(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  location: z.union([
    z.object({ id: z.string().min(1).max(80) }),
    z.object({
      name: z.string().trim().min(2).max(160),
      waterBodyType: z.enum(WATER_TYPES),
      // Normalise the optional field to `null` so the write layer never has to
      // distinguish "absent" from "explicitly empty".
      region: z
        .string()
        .trim()
        .max(120)
        .nullish()
        .transform((value) => value ?? null),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  ]),
});

/* ------------------------------- GET ------------------------------- */

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const page = Number(params.get("page") ?? 1);
  const pageSize = Number(params.get("pageSize") ?? 12);

  try {
    const result = await listReports({
      q: params.get("q") ?? undefined,
      region: params.get("region") ?? undefined,
      locationId: params.get("locationId") ?? undefined,
      userId: params.get("userId") ?? undefined,
      waterBodyType: (params.get("type") as WaterBodyType | null) ?? undefined,
      quality: (params.get("quality") as never) ?? undefined,
      minScore: params.has("minScore") ? Number(params.get("minScore")) : undefined,
      maxScore: params.has("maxScore") ? Number(params.get("maxScore")) : undefined,
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      sort: (params.get("sort") as never) ?? undefined,
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 12,
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("[api/reports GET]", error);
    return NextResponse.json({ error: "Could not load reports." }, { status: 500 });
  }
}

/* ------------------------------- POST ------------------------------- */

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to publish a report." },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 },
    );
  }

  const rawPayload = form.get("payload");
  if (typeof rawPayload !== "string") {
    return NextResponse.json({ error: "Missing payload." }, { status: 400 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawPayload);
  } catch {
    return NextResponse.json({ error: "Payload is not valid JSON." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid report payload.",
        issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      },
      { status: 422 },
    );
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image exceeds the 8 MB upload limit." },
      { status: 413 },
    );
  }
  if (file.type !== parsed.data.mimeType) {
    return NextResponse.json(
      { error: "Declared MIME type does not match the uploaded file." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Re-normalise server-side: the client could have posted anything, and the
    // score must always come out of our own scoring engine.
    const analysis = normaliseAnalysis(parsed.data.analysis, await getLocale());

    const { id } = await createReport({
      userId: user.id,
      author: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        points: user.points,
      },
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      observations: parsed.data.observations as CommunityObservation[],
      analysis,
      model: parsed.data.model,
      latencyMs: parsed.data.latencyMs,
      simulated: parsed.data.simulated,
      capturedAt: parsed.data.capturedAt ?? null,
      width: parsed.data.width ?? null,
      height: parsed.data.height ?? null,
      bytes: parsed.data.bytes ?? file.size,
      mimeType: parsed.data.mimeType,
      features: parsed.data.features ?? null,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      location: parsed.data.location,
      imageBuffer: buffer,
      imageName: file.name,
    });

    // The new report should appear immediately everywhere it is listed.
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidatePath("/map");
    revalidatePath("/");

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[api/reports POST]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not publish this report.",
      },
      { status: 500 },
    );
  }
}
