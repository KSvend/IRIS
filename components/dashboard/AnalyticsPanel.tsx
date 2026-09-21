"use client";

import { useState, useEffect, useCallback } from "react";
import type { CountryCode, NarrativeCategory, ToxicityLevel } from "@/lib/types";

interface AnalyticsData {
  totalPosts: number;
  eaHs: { hate: number; abusive: number; normal: number };
  eaHsAvgConf: number;
  toxicity: Record<string, Record<ToxicityLevel, number>>;
  countryModel: Record<string, number>;
  byCountry: Record<string, { hate: number; abusive: number; normal: number }>;
}

interface Props {
  country?: CountryCode;
  categories: NarrativeCategory[];
}

const EA_HS_COLORS = {
  Hate: "#D05454",
  Abusive: "#E07B39",
  Normal: "#3BAA7F",
};

const TOXICITY_LABELS: Record<string, string> = {
  probToxicity: "Toxicity",
  probSevereToxicity: "Severe Toxicity",
  probInsult: "Insult",
  probIdentityAttack: "Identity Attack",
  probThreat: "Threat",
};

const LEVEL_COLORS: Record<ToxicityLevel, string> = {
  high: "#D05454",
  medium: "#E07B39",
  low: "#D4922A",
  none: "#E4E4E0",
};

const COUNTRY_LABELS: Record<string, string> = {
  KE: "Kenya",
  SO: "Somalia",
  SS: "South Sudan",
};

function HorizontalBar({
  segments,
  total,
}: {
  segments: { value: number; color: string; label: string }[];
  total: number;
}) {
  if (total === 0) return <div className="h-2 w-full rounded-full bg-[var(--surface-muted)]" />;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
      {segments.map((seg) =>
        seg.value > 0 ? (
          <div
            key={seg.label}
            className="h-full transition-all duration-300"
            style={{
              width: `${(seg.value / total) * 100}%`,
              backgroundColor: seg.color,
            }}
          />
        ) : null
      )}
    </div>
  );
}

export function AnalyticsPanel({ country, categories }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (categories.length > 0) params.set("categories", categories.join(","));
    const qs = params.toString() ? `?${params.toString()}` : "";

    try {
      const res = await fetch(`/api/analytics${qs}`);
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [country, categories]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-6 text-[13px] text-[var(--text-muted)]">
        {loading ? "Loading analytics\u2026" : "No data available"}
      </div>
    );
  }

  const { eaHs, toxicity, byCountry, totalPosts } = data;
  const eaHsTotal = eaHs.hate + eaHs.abusive + eaHs.normal;
  const hatePercent = eaHsTotal > 0 ? ((eaHs.hate / eaHsTotal) * 100).toFixed(1) : "0";
  const abusivePercent = eaHsTotal > 0 ? ((eaHs.abusive / eaHsTotal) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* EA-HS Classification Overview */}
      <div className="space-y-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">
          EA-HS model classification
        </div>

        {/* Big numbers */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <div className="text-[24px] font-medium tabular-nums" style={{ color: EA_HS_COLORS.Hate }}>
              {eaHs.hate}
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Hate ({hatePercent}%)
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[24px] font-medium tabular-nums" style={{ color: EA_HS_COLORS.Abusive }}>
              {eaHs.abusive}
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Abusive ({abusivePercent}%)
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[24px] font-medium tabular-nums" style={{ color: EA_HS_COLORS.Normal }}>
              {eaHs.normal}
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Normal
            </div>
          </div>
        </div>

        {/* Aggregate bar */}
        <HorizontalBar
          total={eaHsTotal}
          segments={[
            { value: eaHs.hate, color: EA_HS_COLORS.Hate, label: "Hate" },
            { value: eaHs.abusive, color: EA_HS_COLORS.Abusive, label: "Abusive" },
            { value: eaHs.normal, color: EA_HS_COLORS.Normal, label: "Normal" },
          ]}
        />

        {/* Per-country breakdown */}
        {Object.keys(byCountry).length > 1 && (
          <div className="space-y-2 pt-1">
            {Object.entries(byCountry).map(([code, dist]) => {
              const countryTotal = dist.hate + dist.abusive + dist.normal;
              return (
                <div key={code} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-secondary)]">
                      {COUNTRY_LABELS[code] || code}
                    </span>
                    <span className="text-[var(--text-muted)] tabular-nums">
                      {dist.hate} hate / {countryTotal} posts
                    </span>
                  </div>
                  <HorizontalBar
                    total={countryTotal}
                    segments={[
                      { value: dist.hate, color: EA_HS_COLORS.Hate, label: "Hate" },
                      { value: dist.abusive, color: EA_HS_COLORS.Abusive, label: "Abusive" },
                      { value: dist.normal, color: EA_HS_COLORS.Normal, label: "Normal" },
                    ]}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--divider)]" />

      {/* Phoenix Toxicity Breakdown */}
      <div className="space-y-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">
          Phoenix toxicity signals
        </div>

        <div className="space-y-2.5">
          {Object.entries(TOXICITY_LABELS).map(([key, label]) => {
            const levels = toxicity[key];
            if (!levels) return null;
            const total = levels.high + levels.medium + levels.low + levels.none;
            const flagged = levels.high + levels.medium;

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">{label}</span>
                  <span className="text-[var(--text-muted)] tabular-nums">
                    {flagged > 0 ? (
                      <>
                        <span style={{ color: flagged > 0 ? LEVEL_COLORS.medium : undefined }}>
                          {flagged}
                        </span>
                        {" "}flagged
                      </>
                    ) : (
                      "none"
                    )}
                  </span>
                </div>
                <HorizontalBar
                  total={total}
                  segments={[
                    { value: levels.high, color: LEVEL_COLORS.high, label: "high" },
                    { value: levels.medium, color: LEVEL_COLORS.medium, label: "medium" },
                    { value: levels.low, color: LEVEL_COLORS.low, label: "low" },
                    { value: levels.none, color: LEVEL_COLORS.none, label: "none" },
                  ]}
                />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-3 text-[10px] text-[var(--text-muted)] pt-1">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS.high }} />
            High
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS.medium }} />
            Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS.low }} />
            Low
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS.none }} />
            None
          </span>
        </div>
      </div>
    </div>
  );
}
