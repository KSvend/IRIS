import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadFilteredPosts } from "@/lib/data/load-csv";
import type { CountryCode, NarrativeCategory, FilterOptions } from "@/lib/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const country = request.nextUrl.searchParams.get("country") as CountryCode | null;
  const topicId = request.nextUrl.searchParams.get("topic");
  const categoriesRaw = request.nextUrl.searchParams.get("categories");
  const categories = categoriesRaw
    ? (categoriesRaw.split(",") as NarrativeCategory[])
    : undefined;
  const limitRaw = request.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? parseInt(limitRaw, 10) : 50;

  const opts: FilterOptions = {
    country: country || undefined,
    categories,
  };

  let posts = await loadFilteredPosts(opts);

  // Filter by specific topic if requested
  if (topicId) {
    posts = posts.filter((p) => p.topics[topicId]);
  }

  // Sort by date descending, then take limit
  posts.sort((a, b) => {
    const da = a.postDate || a.commentDate || "";
    const db = b.postDate || b.commentDate || "";
    return db.localeCompare(da);
  });

  const sliced = posts.slice(0, limit);

  // Return a lightweight projection (no full topic map per post)
  const result = sliced.map((p) => ({
    postId: p.postId,
    platform: p.platform,
    postDate: p.postDate,
    postText: p.postText,
    commentId: p.commentId,
    commentText: p.commentText,
    commentDate: p.commentDate,
    country: p.country,
    primaryTopic: p.primaryTopic,
    // EA-HS model
    eaHsPred: p.eaHsPred,
    eaHsConf: p.eaHsConf,
    eaHsNormal: p.eaHsNormal,
    eaHsAbusive: p.eaHsAbusive,
    eaHsHate: p.eaHsHate,
    // Phoenix toxicity
    probToxicity: p.probToxicity,
    probSevereToxicity: p.probSevereToxicity,
    probInsult: p.probInsult,
    probIdentityAttack: p.probIdentityAttack,
    probThreat: p.probThreat,
    // Country model
    countryModelPred: p.countryModelPred,
    countryModelConf: p.countryModelConf,
    // Engagement
    likeCount: p.likeCount,
    shareCount: p.shareCount,
    commentCount: p.commentCount,
  }));

  return NextResponse.json({
    posts: result,
    totalCount: posts.length,
  });
}
