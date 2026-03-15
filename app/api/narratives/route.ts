import { NextRequest, NextResponse } from "next/server";
import { buildNarrativeHierarchy } from "@/lib/data/narratives";
import type { CountryCode, NarrativeCategory } from "@/lib/types";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") as CountryCode | null;
  const categoriesRaw = request.nextUrl.searchParams.get("categories");
  const categories = categoriesRaw
    ? (categoriesRaw.split(",") as NarrativeCategory[])
    : undefined;
  const startDate = request.nextUrl.searchParams.get("startDate") || undefined;
  const endDate = request.nextUrl.searchParams.get("endDate") || undefined;

  const hierarchy = await buildNarrativeHierarchy(
    country || undefined,
    categories,
    startDate,
    endDate
  );
  return NextResponse.json(hierarchy);
}
