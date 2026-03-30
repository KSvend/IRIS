import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectEmergingTrends } from "@/lib/data/narrative-clusters";
import type { CountryCode, NarrativeCategory } from "@/lib/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const country = request.nextUrl.searchParams.get("country") as CountryCode | null;
  const categoriesRaw = request.nextUrl.searchParams.get("categories");
  const categories = categoriesRaw
    ? (categoriesRaw.split(",") as NarrativeCategory[])
    : undefined;

  const trends = await detectEmergingTrends({
    country: country || undefined,
    categories,
  });

  return NextResponse.json(trends);
}
