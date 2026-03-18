"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CountrySelector } from "@/components/dashboard/CountrySelector";
import { CategoryFilter } from "@/components/dashboard/CategoryFilter";
import { NarrativeWheel } from "@/components/visualizations/NarrativeWheel";
import { EastAfricaMap } from "@/components/visualizations/EastAfricaMap";
import { TrendChart } from "@/components/visualizations/TrendChart";
import { AlertFeed } from "@/components/alerts/AlertFeed";
import { EscalationBanner } from "@/components/alerts/EscalationBanner";
import { AnalyticsPanel } from "@/components/dashboard/AnalyticsPanel";
import { EmergingTrends } from "@/components/dashboard/EmergingTrends";
import { Card } from "@/components/ui/Card";
import type {
  CountryCode,
  NarrativeCategory,
  NarrativeNode,
  Alert,
  TrendPoint,
  SubTrendPoint,
  EmergingTrend,
} from "@/lib/types";

export default function DashboardPage() {
  const [country, setCountry] = useState<CountryCode | undefined>();
  const [categories, setCategories] = useState<NarrativeCategory[]>([]);
  const [narrativeData, setNarrativeData] = useState<NarrativeNode | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [emergingTrends, setEmergingTrends] = useState<EmergingTrend[]>([]);
  const [loading, setLoading] = useState(true);

  // Trend drill-down state
  const [drilledCategory, setDrilledCategory] = useState<NarrativeCategory | undefined>();
  const [subTrends, setSubTrends] = useState<SubTrendPoint[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (categories.length > 0) params.set("categories", categories.join(","));
    const qs = params.toString() ? `?${params.toString()}` : "";

    const [narrativeRes, alertRes, trendRes, emergingRes] = await Promise.all([
      fetch(`/api/narratives${qs}`),
      fetch(`/api/alerts${qs}`),
      fetch(`/api/trends${qs}`),
      fetch(`/api/emerging-trends${qs}`),
    ]);

    const [narratives, alertData, trendData, emergingData] = await Promise.all([
      narrativeRes.json(),
      alertRes.json(),
      trendRes.json(),
      emergingRes.json(),
    ]);

    setNarrativeData(narratives);
    setAlerts(alertData);
    setTrends(trendData);
    setEmergingTrends(emergingData);
    setDrilledCategory(undefined);
    setSubTrends([]);
    setLoading(false);
  }, [country, categories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Drill into a category's subcategory trends
  const handleCategoryDrill = useCallback(
    async (cat: NarrativeCategory) => {
      const params = new URLSearchParams();
      if (country) params.set("country", country);
      if (categories.length > 0) params.set("categories", categories.join(","));
      params.set("drillCategory", cat);

      const res = await fetch(`/api/trends?${params.toString()}`);
      const data: SubTrendPoint[] = await res.json();
      setDrilledCategory(cat);
      setSubTrends(data);
    },
    [country, categories]
  );

  const handleDrillBack = useCallback(() => {
    setDrilledCategory(undefined);
    setSubTrends([]);
  }, []);

  const actionCount = alerts.filter((a) => a.severity === "action").length;
  const alertCount = alerts.filter((a) => a.severity === "alert").length;
  const watchCount = alerts.filter((a) => a.severity === "watch").length;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-[1120px] px-6 py-10 space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-[28px] font-medium text-[var(--text-primary)] leading-tight">
                Early warning dashboard
              </h1>
              <p className="text-[15px] text-[var(--text-secondary)] mt-1">
                Hate speech and disinformation monitoring — South Sudan, Kenya, Somalia
              </p>
            </div>
            <CountrySelector selected={country} onChange={setCountry} />
          </div>
          <CategoryFilter selected={categories} onChange={setCategories} />
        </div>

        {/* Escalation banner */}
        <EscalationBanner alerts={alerts} />

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-[var(--text-muted)]">Loading data...</div>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-6">
              <Card>
                <div className="space-y-1">
                  <div className="text-[13px] uppercase tracking-[0.04em] text-[var(--text-muted)]">Total alerts</div>
                  <div className="text-[28px] font-medium text-[var(--text-primary)] leading-tight">{alerts.length}</div>
                </div>
              </Card>
              <Card>
                <div className="space-y-1">
                  <div className="text-[13px] uppercase tracking-[0.04em] text-[var(--text-muted)]">Critical</div>
                  <div className="text-[28px] font-medium text-[var(--error)] leading-tight">{actionCount}</div>
                </div>
              </Card>
              <Card>
                <div className="space-y-1">
                  <div className="text-[13px] uppercase tracking-[0.04em] text-[var(--text-muted)]">Elevated</div>
                  <div className="text-[28px] font-medium text-[var(--warning)] leading-tight">{alertCount}</div>
                </div>
              </Card>
              <Card>
                <div className="space-y-1">
                  <div className="text-[13px] uppercase tracking-[0.04em] text-[var(--text-muted)]">Monitoring</div>
                  <div className="text-[28px] font-medium text-[var(--text-primary)] leading-tight">{watchCount}</div>
                </div>
              </Card>
            </div>

            {/* Main grid: Wheel + Map */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card title="Narrative wheel">
                {narrativeData && (
                  <NarrativeWheel
                    data={narrativeData}
                    width={480}
                    height={480}
                  />
                )}
              </Card>

              <Card title="East Africa — alert map">
                <EastAfricaMap
                  alerts={alerts}
                  selectedCountry={country}
                  onCountryClick={(code) =>
                    setCountry(code === country ? undefined : code)
                  }
                  width={480}
                  height={400}
                />
              </Card>
            </div>

            {/* Emerging trends */}
            {emergingTrends.length > 0 && (
              <Card title="Emerging trends">
                <EmergingTrends trends={emergingTrends} />
              </Card>
            )}

            {/* Analytics: EA-HS + Toxicity */}
            <Card title="Classification analytics">
              <AnalyticsPanel country={country} categories={categories} />
            </Card>

            {/* Trends with drill-down */}
            <Card title={drilledCategory ? `Trend drill-down \u2014 ${drilledCategory.replace(/_/g, " ")}` : "Narrative trends over time"}>
              <TrendChart
                data={trends}
                subData={subTrends}
                drilledCategory={drilledCategory}
                onCategoryClick={handleCategoryDrill}
                onBack={handleDrillBack}
                width={1060}
                height={280}
              />
            </Card>

            {/* Alert Feed */}
            <Card title="Alert feed">
              <AlertFeed alerts={alerts} />
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
