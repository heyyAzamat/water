import { NextResponse } from "next/server";
import { z } from "zod";
import { analyseImage } from "@/lib/ai/vision";
import { getCurrentUser } from "@/lib/auth";

/** Vision calls can take a while on a cold model; give them room. */
export const maxDuration = 60;

const featuresSchema = z
  .object({
    mean: z.object({ r: z.number(), g: z.number(), b: z.number() }),
    brightness: z.number(),
    saturation: z.number(),
    contrast: z.number(),
    greenExcess: z.number(),
    brownness: z.number(),
    whiteRatio: z.number(),
    darkRatio: z.number(),
    specularRatio: z.number(),
    edgeDensity: z.number(),
    hueEntropy: z.number(),
    unnaturalHueRatio: z.number(),
    hueHistogram: z.array(z.number()),
    width: z.number(),
    height: z.number(),
  })
  .nullable()
  .optional();

const bodySchema = z.object({
  // ~8 MB of base64 ≈ 6 MB binary; the client compresses to ~1.5 MB.
  imageBase64: z.string().min(64).max(11_000_000),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  features: featuresSchema,
  context: z
    .object({
      locationName: z.string().max(200).nullish(),
      waterBodyType: z.string().max(40).nullish(),
      region: z.string().max(120).nullish(),
      capturedAt: z.string().max(40).nullish(),
      userNotes: z.string().max(4000).nullish(),
      observations: z.array(z.string().max(40)).max(12).optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to analyse an image." },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid analysis request.",
        issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      },
      { status: 422 },
    );
  }

  try {
    const envelope = await analyseImage({
      imageBase64: parsed.data.imageBase64,
      mimeType: parsed.data.mimeType,
      features: parsed.data.features ?? null,
      context: parsed.data.context,
    });

    return NextResponse.json(envelope, {
      // A fresh analysis of a fresh upload is never cacheable.
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[api/analyze]", error);
    return NextResponse.json(
      { error: "The analysis engine could not process this image." },
      { status: 502 },
    );
  }
}
