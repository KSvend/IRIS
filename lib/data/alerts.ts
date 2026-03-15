import type {
  MonitoringPost,
  Alert,
  AlertType,
  SeverityLevel,
  CountryCode,
  NarrativeCategory,
} from "../types";
import { THRESHOLDS, NARRATIVE_TOPICS, ESCALATION_INDICATORS } from "../constants";
import { loadFilteredPosts } from "./load-csv";
import { getPostDate, TOPIC_CATEGORY_MAP } from "./utils";

function getSeverity(post: MonitoringPost): SeverityLevel | null {
  if (post.eaHsHate >= THRESHOLDS.action.eaHsHate) return "action";
  if (post.eaHsHate >= THRESHOLDS.alert.eaHsHate) return "alert";
  if (
    post.eaHsHate >= THRESHOLDS.watch.eaHsHate ||
    (post.countryModelConf &&
      post.countryModelConf >= THRESHOLDS.watch.countryModelConf)
  )
    return "watch";
  return null;
}

function getActiveTopics(post: MonitoringPost): string[] {
  return NARRATIVE_TOPICS.filter((t) => post.topics[t.id]).map((t) => t.label);
}

function getCategory(post: MonitoringPost): NarrativeCategory {
  const active = NARRATIVE_TOPICS.filter((t) => post.topics[t.id]);
  if (active.length === 0) return "hate_speech";
  return active[0].category;
}

function getPrimaryCategory(post: MonitoringPost): NarrativeCategory {
  for (const [topicId, isActive] of Object.entries(post.topics)) {
    if (isActive && TOPIC_CATEGORY_MAP[topicId]) {
      return TOPIC_CATEGORY_MAP[topicId];
    }
  }
  return "hate_speech";
}

function matchEscalationIndicators(post: MonitoringPost): string[] {
  const indicators: string[] = [];
  const text = (post.commentText || post.postText || "").toLowerCase();

  if (
    (text.includes("revenge") || text.includes("retaliat")) &&
    post.probThreat > 0.3
  )
    indicators.push(ESCALATION_INDICATORS[0]);
  if (
    (text.includes("join") ||
      text.includes("telegram") ||
      text.includes("whatsapp")) &&
    post.eaHsHate > 0.5
  )
    indicators.push(ESCALATION_INDICATORS[1]);
  if (post.probIdentityAttack > 0.5 && post.probThreat > 0.3)
    indicators.push(ESCALATION_INDICATORS[2]);
  if (
    (text.includes("rumour") ||
      text.includes("rumor") ||
      text.includes("breaking")) &&
    post.shareCount > 50
  )
    indicators.push(ESCALATION_INDICATORS[3]);
  if (
    (text.includes("un ") ||
      text.includes("undp") ||
      text.includes("igad")) &&
    post.eaHsHate > 0.3
  )
    indicators.push(ESCALATION_INDICATORS[4]);

  return indicators;
}

// Spike detection: compare daily count to rolling average
function detectSpike(
  dayCounts: Map<string, number>,
  date: string,
  windowDays = 7,
  threshold = 2
): boolean {
  const dates = Array.from(dayCounts.keys()).sort();
  const dateIdx = dates.indexOf(date);
  if (dateIdx < 1) return false;

  const windowStart = Math.max(0, dateIdx - windowDays);
  let sum = 0;
  let count = 0;
  for (let i = windowStart; i < dateIdx; i++) {
    sum += dayCounts.get(dates[i]) || 0;
    count++;
  }

  if (count === 0) return true; // first day with data = spike
  const avg = sum / count;
  const today = dayCounts.get(date) || 0;
  return today > avg * threshold && today >= 3;
}

export async function generateAlerts(
  country?: CountryCode,
  limit = 50,
  categories?: NarrativeCategory[],
  alertTypeFilter?: AlertType
): Promise<Alert[]> {
  const posts = await loadFilteredPosts({ country, categories });
  const alerts: Alert[] = [];

  // Group posts by category + date for spike detection
  const categoryDateCounts = new Map<string, Map<string, number>>();
  for (const post of posts) {
    const severity = getSeverity(post);
    if (!severity) continue;

    const cat = getPrimaryCategory(post);
    const date = getPostDate(post);
    const key = `${cat}`;
    if (!categoryDateCounts.has(key)) {
      categoryDateCounts.set(key, new Map());
    }
    const dateCounts = categoryDateCounts.get(key)!;
    dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
  }

  // Track which category+date combos have spikes
  const spikeSet = new Set<string>();
  for (const [cat, dateCounts] of categoryDateCounts) {
    for (const date of dateCounts.keys()) {
      if (detectSpike(dateCounts, date)) {
        spikeSet.add(`${cat}:${date}`);
      }
    }
  }

  // Generate alerts per post
  for (const post of posts) {
    const severity = getSeverity(post);
    if (!severity) continue;

    const cat = getPrimaryCategory(post);
    const date = getPostDate(post);
    const topics = getActiveTopics(post);
    const escalation = matchEscalationIndicators(post);
    const text = post.commentText || post.postText || "";

    // Determine alert type based on policy
    let alertType: AlertType;
    if (cat === "rumor_misinfo") {
      // Misinfo: always immediate
      alertType = "immediate";
    } else if (cat === "hate_speech" || cat === "violent_extremism") {
      // HS/VE: only immediate on spikes
      alertType = spikeSet.has(`${cat}:${date}`) ? "immediate" : "digest";
    } else {
      // Peace/cross-cutting: digest only
      alertType = "digest";
    }

    // Skip peace_counter and cross_cutting from immediate alerts
    if (
      (cat === "peace_counter" || cat === "cross_cutting") &&
      alertType === "immediate"
    ) {
      alertType = "digest";
    }

    alerts.push({
      id: `alert-${post.postId}-${post.commentId || "p"}`,
      timestamp: post.commentDate || post.postDate || "",
      country: post.country as CountryCode,
      severity,
      alertType,
      title: `${severity.toUpperCase()}: ${topics[0] || "Hate Speech Detected"} in ${post.country}`,
      description: `${cat === "rumor_misinfo" ? "Misinformation" : severity === "action" ? "Critical" : severity === "alert" ? "Elevated" : "Monitored"} content detected on ${post.platform}`,
      narrativeCategory: getCategory(post),
      topics,
      postCount: 1,
      sampleText: text.slice(0, 200),
      escalationIndicators: escalation,
    });
  }

  // Sort: immediate first, then by severity, then by timestamp
  const typeOrder: Record<AlertType, number> = { immediate: 0, digest: 1 };
  const severityOrder: Record<SeverityLevel, number> = {
    action: 0,
    alert: 1,
    watch: 2,
  };
  alerts.sort(
    (a, b) =>
      typeOrder[a.alertType] - typeOrder[b.alertType] ||
      severityOrder[a.severity] - severityOrder[b.severity] ||
      b.timestamp.localeCompare(a.timestamp)
  );

  // Filter by alert type if specified
  let filtered = alerts;
  if (alertTypeFilter) {
    filtered = alerts.filter((a) => a.alertType === alertTypeFilter);
  }

  return filtered.slice(0, limit);
}
