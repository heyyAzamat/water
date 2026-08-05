import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { updateProfile } from "@/lib/data/write";

const schema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(280).nullish(),
  region: z.string().trim().max(120).nullish(),
  notifyNearby: z.boolean().optional(),
  notifyTrend: z.boolean().optional(),
  notifyRadiusKm: z.number().int().min(1).max(500).optional(),
  homeLat: z.number().min(-90).max(90).nullish(),
  homeLng: z.number().min(-180).max(180).nullish(),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid profile data.",
        issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      },
      { status: 422 },
    );
  }

  // Coordinates only make sense as a pair — a lone latitude would silently
  // disable the nearby-alert radius.
  const { homeLat, homeLng } = parsed.data;
  if ((homeLat == null) !== (homeLng == null)) {
    return NextResponse.json(
      { error: "Provide both latitude and longitude, or neither." },
      { status: 422 },
    );
  }

  try {
    await updateProfile({ userId: user.id, ...parsed.data });
    revalidatePath("/profile");
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/profile PATCH]", error);
    return NextResponse.json(
      { error: "Could not save your profile." },
      { status: 500 },
    );
  }
}
