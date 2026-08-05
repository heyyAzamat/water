import { NextResponse } from "next/server";
import { searchLocations } from "@/lib/data/repository";

/** Autocomplete endpoint for the water-body search box. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = (searchParams.get("q") ?? "").slice(0, 120);
  const limit = Math.min(20, Number(searchParams.get("limit") ?? 8) || 8);

  try {
    const results = await searchLocations(term, limit);

    return NextResponse.json(
      { term, results },
      {
        headers: {
          // Autocomplete over a slow-changing list — a short shared cache
          // removes almost all of the keystroke traffic.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("[api/locations/search]", error);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
