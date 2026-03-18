// Core types for the Brace4Peace Early Warning System

export type CountryCode = "KE" | "SO" | "SS";

export interface Country {
  code: CountryCode;
  name: string;
  label: string;
}

export const COUNTRIES: Record<CountryCode, Country> = {
  KE: { code: "KE", name: "Kenya", label: "Kenya" },
  SO: { code: "SO", name: "Somalia", label: "Somalia" },
  SS: { code: "SS", name: "South Sudan", label: "South Sudan" },
};

// Severity levels for the alert system
export type SeverityLevel = "watch" | "alert" | "action";

// Phoenix toxicity levels (categorical, not numeric)
export type ToxicityLevel = "low" | "medium" | "high" | "none";

// A single social media post/comment from the monitoring data
export interface MonitoringPost {
  platform: string;
  postId: string;
  postDate: string;
  postText: string;
  commentId?: string;
  commentText?: string;
  commentDate?: string;
  country: string;
  gatherTopic: string;
  contentTopic: string;
  primaryTopic: string;

  // Phoenix toxicity scores (categorical: low/medium/high)
  probToxicity: ToxicityLevel;
  probSevereToxicity: ToxicityLevel;
  probInsult: ToxicityLevel;
  probIdentityAttack: ToxicityLevel;
  probThreat: ToxicityLevel;

  // EA-HS model scores (floats 0-1)
  eaHsNormal: number;
  eaHsAbusive: number;
  eaHsHate: number;
  eaHsPred: string;
  eaHsConf: number;

  // Country-specific model
  countryModelPred?: string;
  countryModelConf?: number;

  // Topic flags (boolean columns)
  topics: Record<string, boolean>;

  // Engagement
  likeCount: number;
  shareCount: number;
  commentCount: number;
}

// Narrative taxonomy hierarchy
export type NarrativeCategory =
  | "hate_speech"
  | "violent_extremism"
  | "rumor_misinfo"
  | "peace_counter"
  | "cross_cutting";

export interface NarrativeTopic {
  id: string;
  label: string;
  category: NarrativeCategory;
  subcategory: string;
  csvColumn: string;
  description?: string;
}

export interface NarrativeNode {
  name: string;
  label: string;
  value?: number;
  children?: NarrativeNode[];
  category?: NarrativeCategory;
  color?: string;
  // Enriched analysis data for tooltips
  description?: string;
  eaHs?: { hate: number; abusive: number; normal: number };
  toxHigh?: number;
  sampleThemes?: string[];
  topPlatform?: string;
  subcategory?: string;
}

// Alert types: immediate (real-time) vs digest (weekly summary)
export type AlertType = "immediate" | "digest";

// Alert from the early warning system
export interface Alert {
  id: string;
  timestamp: string;
  country: CountryCode;
  severity: SeverityLevel;
  alertType: AlertType;
  title: string;
  description: string;
  narrativeCategory: NarrativeCategory;
  topics: string[];
  postCount: number;
  sampleText?: string;
  escalationIndicators: string[];
}

// Time-series data point for trend charts
export interface TrendPoint {
  date: string;
  country: CountryCode;
  category: NarrativeCategory;
  count: number;
  avgSeverity: number;
}

// Subcategory-level trend point for drill-down
export interface SubTrendPoint extends TrendPoint {
  subcategory: string;
}

// Emerging trend detected by the clustering system
export interface EmergingTrend {
  id: string;
  detectedAt: string;
  country: CountryCode;
  category: NarrativeCategory;
  topicIds: string[];
  topicLabels: string[];
  direction: "rising" | "falling" | "spike";
  magnitude: number;
  description: string;
  postCount: number;
  baselineCount: number;
}

// Time window for timeline slider
export interface TimeWindow {
  startDate: string;
  endDate: string;
}

// Filter options for data loading
export interface FilterOptions {
  country?: CountryCode;
  categories?: NarrativeCategory[];
  startDate?: string;
  endDate?: string;
}

// Dashboard overview stats
export interface DashboardStats {
  totalPosts: number;
  hateSpeechCount: number;
  veCount: number;
  peaceCount: number;
  activeAlerts: number;
  countryCounts: Record<CountryCode, number>;
}

// Connector interface for data sources
export interface IConnector {
  name: string;
  fetch(options?: {
    country?: CountryCode;
    startDate?: string;
    endDate?: string;
  }): Promise<MonitoringPost[]>;
}
