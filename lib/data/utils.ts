import type { MonitoringPost, NarrativeCategory } from "../types";
import { NARRATIVE_TOPICS } from "../constants";

// O(1) lookup: topic ID → category
export const TOPIC_CATEGORY_MAP: Record<string, NarrativeCategory> =
  Object.fromEntries(
    NARRATIVE_TOPICS.map((t) => [t.id, t.category])
  ) as Record<string, NarrativeCategory>;

// Check if a post has any active topic in the given categories
export function postMatchesCategories(
  post: MonitoringPost,
  categories: NarrativeCategory[]
): boolean {
  if (categories.length === 0) return true; // empty = all
  for (const [topicId, isActive] of Object.entries(post.topics)) {
    if (isActive && categories.includes(TOPIC_CATEGORY_MAP[topicId])) {
      return true;
    }
  }
  // Also check ML scores as fallback for posts with no topic flags
  if (categories.includes("hate_speech") && post.eaHsHate > 0.5) return true;
  if (categories.includes("peace_counter") && post.eaHsNormal > 0.7) return true;
  return false;
}

// Get normalized date from a post (YYYY-MM-DD)
export function getPostDate(post: MonitoringPost): string {
  const raw = post.commentDate || post.postDate || "";
  return raw.slice(0, 10);
}
