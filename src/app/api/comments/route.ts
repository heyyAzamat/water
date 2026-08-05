import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getReport, listComments } from "@/lib/data/repository";
import { addComment } from "@/lib/data/write";

const postSchema = z.object({
  reportId: z.string().min(1).max(80),
  body: z.string().trim().min(1).max(2000),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get("reportId");

  if (!reportId) {
    return NextResponse.json({ error: "reportId is required." }, { status: 400 });
  }

  const comments = await listComments(reportId);
  return NextResponse.json({ comments });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to join the discussion." },
      { status: 401 },
    );
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A comment must be between 1 and 2000 characters." },
      { status: 422 },
    );
  }

  const report = await getReport(parsed.data.reportId);
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  try {
    const comment = await addComment({
      reportId: parsed.data.reportId,
      userId: user.id,
      author: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        points: user.points,
      },
      body: parsed.data.body,
    });

    revalidatePath(`/reports/${parsed.data.reportId}`);
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("[api/comments POST]", error);
    return NextResponse.json(
      { error: "Could not post your comment." },
      { status: 500 },
    );
  }
}
