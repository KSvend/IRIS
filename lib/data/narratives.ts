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

export function buildHierarchyFromPosts(
  posts: MonitoringPost[],
  filterCategories?: NarrativeCategory[]
): NarrativeNode {
  // Which topics to include
  const activeTopic = (filterCategories && filterCategories.length > 0)
    ? NARRATIVE_TOPICS.filter((t) => filterCategories.includes(t.category))
    : NARRATIVE_TOPICS;

  // Count topic occurrences
  const topicCounts: Record<string, number> = {};
  for (const topic of activeTopic) {
    topicCounts[topic.id] = 0;
  }
  for (const post of posts) {
    for (const topic of activeTopic) {
      if (post.topics[topic.id]) {
        topicCounts[topic.id]++;
      }
    }
  }

  // Group topics by category → subcategory
  const categories = new Map<
    NarrativeCategory,
    Map<string, { id: string; label: string; count: number }[]>
  >();

  for (const topic of activeTopic) {
    if (!categories.has(topic.category)) {
      categories.set(topic.category, new Map());
    }
    const subcats = categories.get(topic.category)!;
    if (!subcats.has(topic.subcategory)) {
      subcats.set(topic.subcategory, []);
    }
    subcats.get(topic.subcategory)!.push({
      id: topic.id,
      label: topic.label,
      count: topicCounts[topic.id],
    });
  }

  // Build D3 hierarchy
  const children: NarrativeNode[] = [];

  for (const [category, subcats] of categories) {
    const categoryChildren: NarrativeNode[] = [];

    for (const [subcatName, topics] of subcats) {
      const topicNodes: NarrativeNode[] = topics
        .filter((t) => t.count > 0)
        .map((t) => ({
          name: t.id,
          label: t.label,
          value: t.count,
          category,
          color: CATEGORY_COLORS[category],
        }));

      // Only include subcategory if it has data
      if (topicNodes.length > 0) {
        categoryChildren.push({
          name: subcatName,
          label: subcatName,
          children: topicNodes,
          category,
          color: CATEGORY_COLORS[category],
        });
      }
    }

    if (categoryChildren.length > 0) {
      children.push({
        name: category,
        label: CATEGORY_LABELS[category],
        children: categoryChildren,
        category,
        color: CATEGORY_COLORS[category],
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
