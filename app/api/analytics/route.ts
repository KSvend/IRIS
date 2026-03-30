import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadFilteredPosts } from "@/lib/data/load-csv";
import type { CountryCode, NarrativeCategory, FilterOptions, ToxicityLevel } from "@/lib/types";

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

  const opts: FilterOptions = {
    country: country || undefined,
    categories,
  };
  const posts = await loadFilteredPosts(opts);

  // EA-HS distribution
  const eaHs = { hate: 0, abusive: 0, normal: 0 };
  let eaHsConfSum = 0;
  let eaHsConfCount = 0;

  // Toxicity distribution
  const toxicity: Record<string, Record<ToxicityLevel, number>> = {
    probToxicity: { high: 0, medium: 0, low: 0, none: 0 },
    probSevereToxicity: { high: 0, medium: 0, low: 0, none: 0 },
    probInsult: { high: 0, medium: 0, low: 0, none: 0 },
    probIdentityAttack: { high: 0, medium: 0, low: 0, none: 0 },
    probThreat: { high: 0, medium: 0, low: 0, none: 0 },
  };

  // Country model distribution
  const countryModel: Record<string, number> = {};

  // Per-country EA-HS breakdown
  const byCountry: Record<string, { hate: 0; abusive: 0; normal: 0 }> = {};

  for (const post of posts) {
    // EA-HS
    if (post.eaHsPred === "Hate") eaHs.hate++;
    else if (post.eaHsPred === "Abusive") eaHs.abusive++;
    else eaHs.normal++;

    if (post.eaHsConf > 0) {
      eaHsConfSum += post.eaHsConf;
      eaHsConfCount++;
    }

    // Per-country
    if (!byCountry[post.country]) {
      byCountry[post.country] = { hate: 0, abusive: 0, normal: 0 };
    }
    if (post.eaHsPred === "Hate") byCountry[post.country].hate++;
    else if (post.eaHsPred === "Abusive") byCountry[post.country].abusive++;
    else byCountry[post.country].normal++;

    // Toxicity
    toxicity.probToxicity[post.probToxicity]++;
    toxicity.probSevereToxicity[post.probSevereToxicity]++;
    toxicity.probInsult[post.probInsult]++;
    toxicity.probIdentityAttack[post.probIdentityAttack]++;
    toxicity.probThreat[post.probThreat]++;

    // Country model
    if (post.countryModelPred) {
      countryModel[post.countryModelPred] = (countryModel[post.countryModelPred] || 0) + 1;
    }
  }

  return NextResponse.json({
    totalPosts: posts.length,
    eaHs,
    eaHsAvgConf: eaHsConfCount > 0 ? eaHsConfSum / eaHsConfCount : 0,
    toxicity,
    countryModel,
    byCountry,
  });
}
