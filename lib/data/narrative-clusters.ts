import type {
  EmergingTrend,
  CountryCode,
  NarrativeCategory,
} from "../types";
import { NARRATIVE_TOPICS, CATEGORY_LABELS } from "../constants";
import { loadFilteredPosts } from "./load-csv";
import { getPostDate, TOPIC_CATEGORY_MAP } from "./utils";

/**
 * Detect emerging trends using a dual approach:
 * 1. Topic-level: compare recent vs baseline for each topic+country (when topic data exists)
 * 2. EA-HS model: detect spikes in hate/abusive content per country
 * 3. Content-topic based: use gather_topic and content_topic fields for broader coverage
 *
 * The algorithm auto-detects the effective date range of topic data and
 * falls back to EA-HS model trends when topic data is stale.
 */
export async function detectEmergingTrends(options?: {
  country?: CountryCode;
  categories?: NarrativeCategory[];
}): Promise<EmergingTrend[]> {
  const posts = await loadFilteredPosts({
    country: options?.country,
    categories: options?.categories,
  });

  if (posts.length === 0) return [];

  // Find overall date range
  let maxDate = "";
  for (const p of posts) {
    const d = getPostDate(p);
    if (d > maxDate) maxDate = d;
  }
  if (!maxDate) return [];

  const maxD = new Date(maxDate);
  const trends: EmergingTrend[] = [];

  // ── Strategy 1: EA-HS model trends per country ──────────────
  // Compare last 7 days vs prior 21 days for hate/abusive classification rates
  const recent7Str = new Date(maxD.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const baseline28Str = new Date(maxD.getTime() - 28 * 86400000).toISOString().slice(0, 10);

  const countries: CountryCode[] = options?.country
    ? [options.country]
    : ["KE", "SO", "SS"];
  const countryNames: Record<CountryCode, string> = {
    KE: "Kenya",
    SO: "Somalia",
    SS: "South Sudan",
  };

  for (const country of countries) {
    const countryPosts = posts.filter((p) => p.country === country);

    // EA-HS hate rate comparison
    let recentHate = 0, recentAbusive = 0, recentTotal = 0;
    let baselineHate = 0, baselineAbusive = 0, baselineTotal = 0;

    for (const post of countryPosts) {
      const d = getPostDate(post);
      if (d < baseline28Str) continue;

      if (d >= recent7Str) {
        recentTotal++;
        if (post.eaHsPred === "Hate") recentHate++;
        else if (post.eaHsPred === "Abusive") recentAbusive++;
      } else {
        baselineTotal++;
        if (post.eaHsPred === "Hate") baselineHate++;
        else if (post.eaHsPred === "Abusive") baselineAbusive++;
      }
    }

    // Hate speech rate
    if (recentTotal > 10 && baselineTotal > 10) {
      const recentHateRate = recentHate / recentTotal;
      const baselineHateRate = baselineHate / baselineTotal;

      if (baselineHateRate > 0) {
        const ratio = recentHateRate / baselineHateRate;
        if (ratio > 2 && recentHate > 3) {
          trends.push({
            id: `eahs-hate-spike-${country}`,
            detectedAt: maxDate,
            country,
            category: "hate_speech",
            topicIds: [],
            topicLabels: ["EA-HS Hate Classification"],
            direction: "spike",
            magnitude: Math.round((ratio - 1) * 100),
            description: `Spike in hate-classified content in ${countryNames[country]} (+${Math.round((ratio - 1) * 100)}% rate)`,
            postCount: recentHate,
            baselineCount: Math.round(baselineHate / 3), // normalise to 7-day equiv
          });
        } else if (ratio > 1.3 && recentHate > 2) {
          trends.push({
            id: `eahs-hate-rising-${country}`,
            detectedAt: maxDate,
            country,
            category: "hate_speech",
            topicIds: [],
            topicLabels: ["EA-HS Hate Classification"],
            direction: "rising",
            magnitude: Math.round((ratio - 1) * 100),
            description: `Rising hate-classified content in ${countryNames[country]} (+${Math.round((ratio - 1) * 100)}%)`,
            postCount: recentHate,
            baselineCount: Math.round(baselineHate / 3),
          });
        } else if (ratio < 0.5 && baselineHate > 5) {
          trends.push({
            id: `eahs-hate-falling-${country}`,
            detectedAt: maxDate,
            country,
            category: "hate_speech",
            topicIds: [],
            topicLabels: ["EA-HS Hate Classification"],
            direction: "falling",
            magnitude: Math.round((1 - ratio) * 100),
            description: `Decline in hate-classified content in ${countryNames[country]} (\u2212${Math.round((1 - ratio) * 100)}%)`,
            postCount: recentHate,
            baselineCount: Math.round(baselineHate / 3),
          });
        }
      }

      // Abusive rate
      const recentAbusiveRate = recentAbusive / recentTotal;
      const baselineAbusiveRate = baselineAbusive / baselineTotal;

      if (baselineAbusiveRate > 0) {
        const ratio = recentAbusiveRate / baselineAbusiveRate;
        if (ratio > 2 && recentAbusive > 5) {
          trends.push({
            id: `eahs-abusive-spike-${country}`,
            detectedAt: maxDate,
            country,
            category: "cross_cutting",
            topicIds: [],
            topicLabels: ["EA-HS Abusive Classification"],
            direction: "spike",
            magnitude: Math.round((ratio - 1) * 100),
            description: `Spike in abusive content in ${countryNames[country]} (+${Math.round((ratio - 1) * 100)}% rate)`,
            postCount: recentAbusive,
            baselineCount: Math.round(baselineAbusive / 3),
          });
        } else if (ratio > 1.3 && recentAbusive > 3) {
          trends.push({
            id: `eahs-abusive-rising-${country}`,
            detectedAt: maxDate,
            country,
            category: "cross_cutting",
            topicIds: [],
            topicLabels: ["EA-HS Abusive Classification"],
            direction: "rising",
            magnitude: Math.round((ratio - 1) * 100),
            description: `Rising abusive content in ${countryNames[country]} (+${Math.round((ratio - 1) * 100)}%)`,
            postCount: recentAbusive,
            baselineCount: Math.round(baselineAbusive / 3),
          });
        }
      }
    }

    // ── Toxicity signals ──
    let recentToxHigh = 0, baselineToxHigh = 0;
    for (const post of countryPosts) {
      const d = getPostDate(post);
      if (d < baseline28Str) continue;
      const isHighTox = post.probToxicity === "high" || post.probSevereToxicity === "high";
      if (d >= recent7Str) {
        if (isHighTox) recentToxHigh++;
      } else {
        if (isHighTox) baselineToxHigh++;
      }
    }

    const baselineToxRate = baselineTotal > 0 ? baselineToxHigh / baselineTotal : 0;
    const recentToxRate = recentTotal > 0 ? recentToxHigh / recentTotal : 0;

    if (baselineToxRate > 0 && recentToxHigh > 3) {
      const ratio = recentToxRate / baselineToxRate;
      if (ratio > 2) {
        trends.push({
          id: `tox-spike-${country}`,
          detectedAt: maxDate,
          country,
          category: "hate_speech",
          topicIds: [],
          topicLabels: ["High Toxicity Content"],
          direction: "spike",
          magnitude: Math.round((ratio - 1) * 100),
          description: `Spike in high-toxicity content in ${countryNames[country]} (+${Math.round((ratio - 1) * 100)}% rate)`,
          postCount: recentToxHigh,
          baselineCount: Math.round(baselineToxHigh / 3),
        });
      } else if (ratio > 1.3) {
        trends.push({
          id: `tox-rising-${country}`,
          detectedAt: maxDate,
          country,
          category: "hate_speech",
          topicIds: [],
          topicLabels: ["High Toxicity Content"],
          direction: "rising",
          magnitude: Math.round((ratio - 1) * 100),
          description: `Rising high-toxicity content in ${countryNames[country]} (+${Math.round((ratio - 1) * 100)}%)`,
          postCount: recentToxHigh,
          baselineCount: Math.round(baselineToxHigh / 3),
        });
      }
    }

    // ── Volume-based: overall post volume per country ──
    if (recentTotal > 20 && baselineTotal > 20) {
      const recentDailyAvg = recentTotal / 7;
      const baselineDailyAvg = baselineTotal / 21;
      const volRatio = recentDailyAvg / baselineDailyAvg;

      if (volRatio > 2) {
        trends.push({
          id: `volume-spike-${country}`,
          detectedAt: maxDate,
          country,
          category: "cross_cutting",
          topicIds: [],
          topicLabels: ["Post Volume"],
          direction: "spike",
          magnitude: Math.round((volRatio - 1) * 100),
          description: `Monitoring volume spike in ${countryNames[country]} (+${Math.round((volRatio - 1) * 100)}%)`,
          postCount: recentTotal,
          baselineCount: Math.round(baselineTotal / 3),
        });
      } else if (volRatio > 1.4) {
        trends.push({
          id: `volume-rising-${country}`,
          detectedAt: maxDate,
          country,
          category: "cross_cutting",
          topicIds: [],
          topicLabels: ["Post Volume"],
          direction: "rising",
          magnitude: Math.round((volRatio - 1) * 100),
          description: `Rising monitoring volume in ${countryNames[country]} (+${Math.round((volRatio - 1) * 100)}%)`,
          postCount: recentTotal,
          baselineCount: Math.round(baselineTotal / 3),
        });
      }
    }
  }

  // ── Strategy 2: Topic-level trends (when topic data is fresh enough) ──
  // Find the latest post with topic flags to determine if data is usable
  let maxTopicDate = "";
  for (const post of posts) {
    for (const topic of NARRATIVE_TOPICS) {
      if (post.topics[topic.id]) {
        const d = getPostDate(post);
        if (d > maxTopicDate) maxTopicDate = d;
      }
    }
    // Early exit optimization
    if (maxTopicDate >= recent7Str) break;
  }

  if (maxTopicDate && maxTopicDate > baseline28Str) {
    // Topic data exists within our analysis window — use topic-based analysis
    const topicRecent7 = new Date(new Date(maxTopicDate).getTime() - 7 * 86400000)
      .toISOString()
      .slice(0, 10);
    const topicBaseline28 = new Date(new Date(maxTopicDate).getTime() - 28 * 86400000)
      .toISOString()
      .slice(0, 10);

    type Key = string;
    const recentCounts = new Map<Key, number>();
    const baselineCounts = new Map<Key, number>();

    for (const post of posts) {
      const date = getPostDate(post);
      if (!date || date < topicBaseline28 || date > maxTopicDate) continue;

      for (const topic of NARRATIVE_TOPICS) {
        if (!post.topics[topic.id]) continue;
        const key = `${topic.id}:${post.country}`;

        if (date >= topicRecent7) {
          recentCounts.set(key, (recentCounts.get(key) || 0) + 1);
        }
        baselineCounts.set(key, (baselineCounts.get(key) || 0) + 1);
      }
    }

    for (const topic of NARRATIVE_TOPICS) {
      for (const country of countries) {
        const key = `${topic.id}:${country}`;
        const recentCount = recentCounts.get(key) || 0;
        const totalBaseline = baselineCounts.get(key) || 0;
        const baselineOnlyCount = totalBaseline - recentCount;
        const recentRate = recentCount / 7;
        const baselineRate = baselineOnlyCount / 21;

        if (baselineRate === 0 && recentCount <= 1) continue;
        if (recentCount === 0 && baselineOnlyCount < 3) continue;

        let direction: "spike" | "rising" | "falling" | null = null;
        let magnitude = 0;

        if (baselineRate > 0) {
          const ratio = recentRate / baselineRate;
          if (ratio > 2.5 && recentCount > 3) {
            direction = "spike";
            magnitude = Math.round((ratio - 1) * 100);
          } else if (ratio > 1.3 && recentCount > 2) {
            direction = "rising";
            magnitude = Math.round((ratio - 1) * 100);
          } else if (ratio < 0.5 && baselineOnlyCount > 3) {
            direction = "falling";
            magnitude = Math.round((1 - ratio) * 100);
          }
        } else if (recentCount > 2) {
          direction = "spike";
          magnitude = 999;
        }

        if (!direction) continue;

        let description: string;
        if (direction === "spike") {
          description = `Spike in ${topic.label} in ${countryNames[country]} (+${magnitude}%)`;
        } else if (direction === "rising") {
          description = `Rising ${topic.label} activity in ${countryNames[country]} (+${magnitude}%)`;
        } else {
          description = `Decline in ${topic.label} in ${countryNames[country]} (\u2212${magnitude}%)`;
        }

        trends.push({
          id: `topic-${topic.id}-${country}-${direction}`,
          detectedAt: maxTopicDate,
          country,
          category: topic.category,
          topicIds: [topic.id],
          topicLabels: [topic.label],
          direction,
          magnitude,
          description,
          postCount: recentCount,
          baselineCount: Math.round(baselineOnlyCount / 3),
        });
      }
    }
  }

  // Sort by direction priority (spikes first) then magnitude
  const dirOrder: Record<string, number> = { spike: 0, rising: 1, falling: 2 };
  trends.sort(
    (a, b) =>
      dirOrder[a.direction] - dirOrder[b.direction] ||
      b.magnitude - a.magnitude
  );

  return trends.slice(0, 20);
}
