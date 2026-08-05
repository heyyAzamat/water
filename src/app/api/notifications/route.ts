import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications } from "@/lib/data/repository";
import { markNotificationsRead } from "@/lib/data/write";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const notifications = await listNotifications(user.id, 50);

  return NextResponse.json(
    {
      notifications,
      unread: notifications.filter((n) => !n.readAt).length,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const patchSchema = z.object({
  ids: z.array(z.string().min(1).max(80)).max(200).optional(),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 422 });
  }

  try {
    await markNotificationsRead(user.id, parsed.data.ids);
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/notifications PATCH]", error);
    return NextResponse.json(
      { error: "Could not update notifications." },
      { status: 500 },
    );
  }
}
