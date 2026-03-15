import fs from "fs";
import path from "path";
import Papa from "papaparse";
import type { MonitoringPost, CountryCode, FilterOptions } from "../types";
import { NARRATIVE_TOPICS } from "../constants";

const DATA_DIR = path.join(process.cwd(), "public", "data");

// Map CSV country values to our country codes
function toCountryCode(raw: string): CountryCode | null {
  const lower = raw?.toLowerCase().trim();
  if (lower === "kenya" || lower === "ke") return "KE";
  if (lower === "somalia" || lower === "so") return "SO";
  if (lower === "south sudan" || lower === "south_sudan" || lower === "ss")
    return "SS";
  return null;
}

function parseNumber(val: string | undefined): number {
  if (!val || val === "") return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function parseBool(val: string | undefined): boolean {
  if (!val || val === "") return false;
  const v = val.trim().toLowerCase();
  if (v === "true" || v === "yes") return true;
  // Topic columns are float scores — treat anything > 0 as true
  const n = parseFloat(v);
  return !isNaN(n) && n > 0;
}

// Parse a single CSV row into a MonitoringPost
function parseRow(row: Record<string, string>): MonitoringPost | null {
  const country = toCountryCode(row.country || "");
  if (!country) return null;

  // Extract topic flags
  const topics: Record<string, boolean> = {};
  for (const topic of NARRATIVE_TOPICS) {
    topics[topic.id] = parseBool(row[topic.csvColumn]);
  }

  // Country-specific model
  let countryModelPred: string | undefined;
  let countryModelConf: number | undefined;
  if (country === "KE") {
    countryModelPred = row.Polarization_Kenya_pred;
    countryModelConf = parseNumber(row.Polarization_Kenya_conf);
  } else if (country === "SO") {
    countryModelPred = row.Afxumo_Somali_pred;
    countryModelConf = parseNumber(row.Afxumo_Somali_conf);
  } else if (country === "SS") {
    countryModelPred = row.HateSpeech_Sudan_pred;
    countryModelConf = parseNumber(row.HateSpeech_Sudan_conf);
  }

  return {
    platform: row.platform || "",
    postId: row.post_id || "",
    postDate: row.post_date || "",
    postText: row.post_text_pi || "",
    commentId: row.comment_id || undefined,
    commentText: row.comment_text_pi || undefined,
    commentDate: row.comment_date || undefined,
    country,
    gatherTopic: row.gather_topic || "",
    contentTopic: row.content_topic || "",
    primaryTopic: row.primary_topic || "",
    probToxicity: parseNumber(row.prob_toxicity),
    probSevereToxicity: parseNumber(row.prob_severe_toxicity),
    probInsult: parseNumber(row.prob_insult),
    probIdentityAttack: parseNumber(row.prob_identity_attack),
    probThreat: parseNumber(row.prob_threat),
    eaHsNormal: parseNumber(row.EA_HS_Normal),
    eaHsAbusive: parseNumber(row.EA_HS_Abusive),
    eaHsHate: parseNumber(row.EA_HS_Hate),
    eaHsPred: row.EA_HS_pred || "",
    eaHsConf: parseNumber(row.EA_HS_conf),
    countryModelPred,
    countryModelConf,
    topics,
    likeCount: parseNumber(row.post_like_count),
    shareCount: parseNumber(row.post_share_count),
    commentCount: parseNumber(row.post_comment_count),
  };
}

// Load all CSV files and return parsed posts
let _cache: MonitoringPost[] | null = null;

export async function loadAllPosts(): Promise<MonitoringPost[]> {
  if (_cache) return _cache;

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".csv"));
  const allPosts: MonitoringPost[] = [];

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const result = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
    });

    for (const row of result.data) {
      const post = parseRow(row);
      if (post) allPosts.push(post);
    }
  }

  _cache = allPosts;
  return allPosts;
}

export async function loadPostsByCountry(
  country?: CountryCode
): Promise<MonitoringPost[]> {
  return loadFilteredPosts({ country });
}

// General-purpose filtered post loading
export async function loadFilteredPosts(
  options: FilterOptions = {}
): Promise<MonitoringPost[]> {
  const { postMatchesCategories, getPostDate } = await import("./utils");
  let posts = await loadAllPosts();

  if (options.country) {
    posts = posts.filter((p) => p.country === options.country);
  }

  if (options.categories && options.categories.length > 0) {
    posts = posts.filter((p) =>
      postMatchesCategories(p, options.categories!)
    );
  }

  if (options.startDate) {
    posts = posts.filter((p) => getPostDate(p) >= options.startDate!);
  }

  if (options.endDate) {
    posts = posts.filter((p) => getPostDate(p) <= options.endDate!);
  }

  return posts;
}
