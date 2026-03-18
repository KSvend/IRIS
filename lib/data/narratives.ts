import type {
  MonitoringPost,
  NarrativeNode,
  NarrativeCategory,
  CountryCode,
  FilterOptions,
} from "../types";
import {
  NARRATIVE_TOPICS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "../constants";
import { loadFilteredPosts } from "./load-csv";

// Build the narrative wheel hierarchy from post data
export async function buildNarrativeHierarchy(
  country?: CountryCode,
  categories?: NarrativeCategory[],
  startDate?: string,
  endDate?: string
): Promise<NarrativeNode> {
  const opts: FilterOptions = { country, categories, startDate, endDate };
  const posts = await loadFilteredPosts(opts);
  return buildHierarchyFromPosts(posts, categories);
}

// Extract key themes from posts by finding most common significant words/phrases
function extractThemes(posts: MonitoringPost[], maxThemes = 3): string[] {
  // Collect text from posts
  const texts = posts
    .slice(0, 100) // Cap for performance
    .map((p) => (p.commentText || p.postText || "").toLowerCase());

  if (texts.length === 0) return [];

  // Count meaningful word pairs (bigrams) for richer themes
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "and", "but", "or", "nor",
    "not", "no", "so", "if", "then", "than", "that", "this", "these",
    "those", "it", "its", "of", "in", "on", "at", "to", "for", "with",
    "by", "from", "up", "out", "about", "into", "through", "during",
    "before", "after", "above", "below", "between", "under", "again",
    "further", "once", "here", "there", "when", "where", "why", "how",
    "all", "both", "each", "few", "more", "most", "other", "some", "such",
    "only", "own", "same", "just", "very", "also", "now", "even", "still",
    "already", "yet", "too", "well", "back", "also", "get", "got", "go",
    "going", "went", "come", "came", "make", "made", "take", "took",
    "know", "knew", "think", "thought", "see", "saw", "say", "said",
    "tell", "told", "give", "gave", "use", "used", "find", "found",
    "want", "need", "try", "let", "put", "keep", "set", "seem",
    "help", "show", "hear", "play", "run", "move", "live", "believe",
    "bring", "happen", "must", "like", "amp", "https", "http", "www",
    "com", "rt", "via", "they", "them", "their", "he", "she", "him",
    "her", "his", "we", "us", "our", "you", "your", "my", "me", "i",
    "what", "which", "who", "whom", "one", "two", "new", "old", "big",
    "long", "much", "many", "way", "day", "time", "year", "people",
    "over", "been", "being", "will", "don", "doesn", "didn", "won",
    "can", "t", "s", "re", "ve", "ll", "d", "m",
  ]);

  const wordFreq: Record<string, number> = {};

  for (const text of texts) {
    const words = text
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    // Count individual meaningful words
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }

    // Count bigrams for richer phrases
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      wordFreq[bigram] = (wordFreq[bigram] || 0) + 1;
    }
  }

  // Get top themes, preferring bigrams, min frequency of 2
  return Object.entries(wordFreq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => {
      // Prefer bigrams over single words at similar frequency
      const aBoost = a[0].includes(" ") ? 1.5 : 1;
      const bBoost = b[0].includes(" ") ? 1.5 : 1;
      return b[1] * bBoost - a[1] * aBoost;
    })
    .slice(0, maxThemes)
    .map(([word]) => word);
}

// Get the dominant platform
function topPlatform(posts: MonitoringPost[]): string | undefined {
  const counts: Record<string, number> = {};
  for (const p of posts) {
    const plat = (p.platform || "unknown").toLowerCase();
    counts[plat] = (counts[plat] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0];
}

export function buildHierarchyFromPosts(
  posts: MonitoringPost[],
  filterCategories?: NarrativeCategory[]
): NarrativeNode {
  // Only include posts classified as Hate or Abusive by EA-HS model
  // Normal posts are excluded from the narrative wheel to focus on harmful content
  const harmfulPosts = posts.filter(
    (p) => p.eaHsPred === "Hate" || p.eaHsPred === "Abusive"
  );

  // Which topics to include
  const activeTopic = (filterCategories && filterCategories.length > 0)
    ? NARRATIVE_TOPICS.filter((t) => filterCategories.includes(t.category))
    : NARRATIVE_TOPICS;

  // Collect posts per topic and compute analytics
  const topicPosts: Record<string, MonitoringPost[]> = {};
  for (const topic of activeTopic) {
    topicPosts[topic.id] = [];
  }
  for (const post of harmfulPosts) {
    for (const topic of activeTopic) {
      if (post.topics[topic.id]) {
        topicPosts[topic.id].push(post);
      }
    }
  }

  // Compute enriched data for each topic
  const topicAnalytics: Record<string, {
    count: number;
    eaHs: { hate: number; abusive: number; normal: number };
    toxHigh: number;
    sampleThemes: string[];
    topPlatform?: string;
    description?: string;
  }> = {};

  for (const topic of activeTopic) {
    const tPosts = topicPosts[topic.id];
    const count = tPosts.length;

    const eaHs = { hate: 0, abusive: 0, normal: 0 };
    let toxHigh = 0;

    for (const p of tPosts) {
      if (p.eaHsPred === "Hate") eaHs.hate++;
      else if (p.eaHsPred === "Abusive") eaHs.abusive++;
      else eaHs.normal++;

      if (p.probToxicity === "high" || p.probSevereToxicity === "high") {
        toxHigh++;
      }
    }

    topicAnalytics[topic.id] = {
      count,
      eaHs,
      toxHigh,
      sampleThemes: count > 0 ? extractThemes(tPosts) : [],
      topPlatform: count > 0 ? topPlatform(tPosts) : undefined,
      description: topic.description,
    };
  }

  // Group topics by category → subcategory
  const categories = new Map<
    NarrativeCategory,
    Map<string, typeof activeTopic>
  >();

  for (const topic of activeTopic) {
    if (!categories.has(topic.category)) {
      categories.set(topic.category, new Map());
    }
    const subcats = categories.get(topic.category)!;
    if (!subcats.has(topic.subcategory)) {
      subcats.set(topic.subcategory, []);
    }
    subcats.get(topic.subcategory)!.push(topic);
  }

  // Build D3 hierarchy with enriched nodes
  const children: NarrativeNode[] = [];

  for (const [category, subcats] of categories) {
    const categoryChildren: NarrativeNode[] = [];

    for (const [subcatName, topics] of subcats) {
      const topicNodes: NarrativeNode[] = topics
        .filter((t) => topicAnalytics[t.id].count > 0)
        .map((t) => {
          const analytics = topicAnalytics[t.id];
          return {
            name: t.id,
            label: t.label,
            value: analytics.count,
            category,
            color: CATEGORY_COLORS[category],
            description: analytics.description,
            eaHs: analytics.eaHs,
            toxHigh: analytics.toxHigh,
            sampleThemes: analytics.sampleThemes,
            topPlatform: analytics.topPlatform,
            subcategory: t.subcategory,
          };
        });

      // Only include subcategory if it has data
      if (topicNodes.length > 0) {
        // Aggregate subcategory-level analytics
        const subcatEaHs = { hate: 0, abusive: 0, normal: 0 };
        let subcatToxHigh = 0;
        for (const node of topicNodes) {
          if (node.eaHs) {
            subcatEaHs.hate += node.eaHs.hate;
            subcatEaHs.abusive += node.eaHs.abusive;
            subcatEaHs.normal += node.eaHs.normal;
          }
          subcatToxHigh += node.toxHigh || 0;
        }

        categoryChildren.push({
          name: subcatName,
          label: subcatName,
          children: topicNodes,
          category,
          color: CATEGORY_COLORS[category],
          eaHs: subcatEaHs,
          toxHigh: subcatToxHigh,
          subcategory: subcatName,
        });
      }
    }

    if (categoryChildren.length > 0) {
      // Aggregate category-level analytics
      const catEaHs = { hate: 0, abusive: 0, normal: 0 };
      let catToxHigh = 0;
      for (const child of categoryChildren) {
        if (child.eaHs) {
          catEaHs.hate += child.eaHs.hate;
          catEaHs.abusive += child.eaHs.abusive;
          catEaHs.normal += child.eaHs.normal;
        }
        catToxHigh += child.toxHigh || 0;
      }

      children.push({
        name: category,
        label: CATEGORY_LABELS[category],
        children: categoryChildren,
        category,
        color: CATEGORY_COLORS[category],
        eaHs: catEaHs,
        toxHigh: catToxHigh,
      });
    }
  }

  // If no data at all, provide a minimal placeholder structure
  if (children.length === 0) {
    for (const [category, label] of Object.entries(CATEGORY_LABELS)) {
      children.push({
        name: category,
        label,
        category: category as NarrativeCategory,
        color: CATEGORY_COLORS[category as NarrativeCategory],
        value: 1,
      });
    }
  }

  return {
    name: "root",
    label: "Narratives",
    children,
  };
}
