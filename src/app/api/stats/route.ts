import { NextResponse } from "next/server";
import { capabilities } from "@/lib/env";
import { platformStats } from "@/lib/data/repository";

export async function GET() {
  try {
    const stats = await platformStats();

    return NextResponse.json(
      { stats, capabilities },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("[api/stats]", error);
    return NextResponse.json({ error: "Could not load stats." }, { status: 500 });
  }
}
