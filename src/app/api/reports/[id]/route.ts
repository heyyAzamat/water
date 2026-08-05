import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getReport } from "@/lib/data/repository";
import { deleteReport, setReportStatus } from "@/lib/data/write";

const patchSchema = z.object({
  status: z.enum(["pending", "approved", "flagged", "rejected"]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  // A non-public or unapproved report is only visible to its author or staff.
  if (report.status !== "approved" || !report.isPublic) {
    const user = await getCurrentUser();
    const privileged =
      user &&
      (user.id === report.author.id ||
        user.role === "admin" ||
        user.role === "moderator");

    if (!privileged) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }
  }

  return NextResponse.json(report);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return NextResponse.json(
      { error: "Moderator access required." },
      { status: 403 },
    );
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 422 });
  }

  const { id } = await params;

  try {
    const report = await setReportStatus(id, parsed.data.status);
    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    revalidatePath("/admin");
    revalidatePath("/reports");
    revalidatePath(`/reports/${id}`);
    revalidatePath("/map");

    return NextResponse.json({ id, status: parsed.data.status });
  } catch (error) {
    console.error("[api/reports PATCH]", error);
    return NextResponse.json({ error: "Moderation failed." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const report = await getReport(id);
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const isOwner = report.author.id === user.id;
  const isStaff = user.role === "admin" || user.role === "moderator";
  if (!isOwner && !isStaff) {
    return NextResponse.json(
      { error: "You can only delete your own reports." },
      { status: 403 },
    );
  }

  try {
    await deleteReport(id);

    revalidatePath("/admin");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    revalidatePath("/map");

    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    console.error("[api/reports DELETE]", error);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
