import type {
  MonitoringPost,
  TrendPoint,
  SubTrendPoint,
  CountryCode,
  NarrativeCategory,
  DashboardStats,
} from "../types";
import { NARRATIVE_TOPICS } from "../constants";
import { loadFilteredPosts, loadAllPosts } from "./load-csv";
import { getPostDate } from "./utils";

function getCategoryForPost(post: MonitoringPost): NarrativeCategory {
  const categoryCounts: Record<NarrativeCategory, number> = {
    hate_speech: 0,
    violent_extremism: 0,
    rumor_misinfo: 0,
    peace_counter: 0,
    cross_cutting: 0,
  };

  for (const topic of NARRATIVE_TOPICS) {
    if (post.topics[topic.id]) {
      categoryCounts[topic.category]++;
    }
  }

  let maxCategory: NarrativeCategory = "hate_speech";
  let maxCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxCategory = cat as NarrativeCategory;
    }
  }

  if (maxCount === 0) {
    if (post.eaHsHate > 0.5) return "hate_speech";
    if (post.eaHsAbusive > 0.5) return "cross_cutting";
    return "peace_counter";
  }

  return maxCategory;
}

export async function buildTrends(
  country?: CountryCode,
  categories?: NarrativeCategory[]
): Promise<TrendPoint[]> {
  const posts = await loadFilteredPosts({ country, categories });
  const trends = new Map<string, TrendPoint>();

  for (const post of posts) {
    const date = getPostDate(post);
    if (!date || date.length < 10) continue;

    const category = getCategoryForPost(post);
    const key = `${date}-${post.country}-${category}`;

    if (!trends.has(key)) {
      trends.set(key, {
        date,
        country: post.country as CountryCode,
        category,
        count: 0,
        avgSeverity: 0,
      });
    }

    const point = trends.get(key)!;
    point.avgSeverity =
      (point.avgSeverity * point.count + post.eaHsHate) / (point.count + 1);
    point.count++;
  }

  const result = Array.from(trends.values());
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

// Drill-down: trends at subcategory level for a specific category
export async function buildSubTrends(
  country?: CountryCode,
  drillCategory?: NarrativeCategory,
  categories?: NarrativeCategory[]
): Promise<SubTrendPoint[]> {
  const filterCats = drillCategory ? [drillCategory] : categories;
  const posts = await loadFilteredPosts({ country, categories: filterCats });
  const trends = new Map<string, SubTrendPoint>();

  // Get topics for the drilled category
  const relevantTopics = drillCategory
    ? NARRATIVE_TOPICS.filter((t) => t.category === drillCategory)
    : NARRATIVE_TOPICS;

  for (const post of posts) {
    const date = getPostDate(post);
    if (!date || date.length < 10) continue;

    // For each active topic in the drilled category, count it under its subcategory
    for (const topic of relevantTopics) {
      if (!post.topics[topic.id]) continue;

      const key = `${date}-${post.country}-${topic.subcategory}`;

      if (!trends.has(key)) {
        trends.set(key, {
          date,
          country: post.country as CountryCode,
          category: topic.category,
          subcategory: topic.subcategory,
          count: 0,
          avgSeverity: 0,
        });
      }

      const point = trends.get(key)!;
      point.avgSeverity =
        (point.avgSeverity * point.count + post.eaHsHate) / (point.count + 1);
      point.count++;
    }
  }

  const result = Array.from(trends.values());
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

export async function getDashboardStats(
  country?: CountryCode
): Promise<DashboardStats> {
  const posts = await loadFilteredPosts({ country });
  const allPosts = await loadAllPosts();

  let hateSpeechCount = 0;
  let veCount = 0;
  let peaceCount = 0;
  let activeAlerts = 0;
  const countryCounts: Record<CountryCode, number> = { KE: 0, SO: 0, SS: 0 };

  for (const post of posts) {
    const cat = getCategoryForPost(post);
    if (cat === "hate_speech") hateSpeechCount++;
    else if (cat === "violent_extremism") veCount++;
    else if (cat === "peace_counter") peaceCount++;

    if (post.eaHsHate > 0.5) activeAlerts++;

    if (post.country in countryCounts) {
      countryCounts[post.country as CountryCode]++;
    }
  }

  for (const post of allPosts) {
    if (post.country in countryCounts) {
      countryCounts[post.country as CountryCode]++;
    }
  }

  return {
    totalPosts: posts.length,
    hateSpeechCount,
    veCount,
    peaceCount,
    activeAlerts,
    countryCounts,
  };
}
