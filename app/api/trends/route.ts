import { NextRequest, NextResponse } from "next/server";
import { buildTrends, buildSubTrends } from "@/lib/data/trends";
import type { CountryCode, NarrativeCategory } from "@/lib/types";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") as CountryCode | null;
  const categoriesRaw = request.nextUrl.searchParams.get("categories");
  const categories = categoriesRaw
    ? (categoriesRaw.split(",") as NarrativeCategory[])
    : undefined;
  const drillCategory = request.nextUrl.searchParams.get("drillCategory") as NarrativeCategory | null;

  if (drillCategory) {
    const subTrends = await buildSubTrends(
      country || undefined,
      drillCategory,
      categories
    );
    return NextResponse.json(subTrends);
  }

  const trends = await buildTrends(country || undefined, categories);
  return NextResponse.json(trends);
}
