"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CountrySelector } from "@/components/dashboard/CountrySelector";
import { CategoryFilter } from "@/components/dashboard/CategoryFilter";
import { NarrativeWheel } from "@/components/visualizations/NarrativeWheel";
import { EastAfricaMap } from "@/components/visualizations/EastAfricaMap";
import { TrendChart } from "@/components/visualizations/TrendChart";
import { SeverityGauge } from "@/components/visualizations/SeverityGauge";
import { AlertFeed } from "@/components/alerts/AlertFeed";
import { EscalationBanner } from "@/components/alerts/EscalationBanner";
import { Card } from "@/components/ui/Card";
import type {
  CountryCode,
  NarrativeCategory,
  NarrativeNode,
  Alert,
  TrendPoint,
} from "@/lib/types";

export default function DashboardPage() {
  const [country, setCountry] = useState<CountryCode | undefined>();
  const [categories, setCategories] = useState<NarrativeCategory[]>([]);
  const [narrativeData, setNarrativeData] = useState<NarrativeNode | null>(
    null
  );
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (categories.length > 0) params.set("categories", categories.join(","));
    const qs = params.toString() ? `?${params.toString()}` : "";

    const [narrativeRes, alertRes, trendRes] = await Promise.all([
      fetch(`/api/narratives${qs}`),
      fetch(`/api/alerts${qs}`),
      fetch(`/api/trends${qs}`),
    ]);

    const [narratives, alertData, trendData] = await Promise.all([
      narrativeRes.json(),
      alertRes.json(),
      trendRes.json(),
    ]);

    setNarrativeData(narratives);
    setAlerts(alertData);
    setTrends(trendData);
    setLoading(false);
  }, [country, categories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const actionCount = alerts.filter((a) => a.severity === "action").length;
  const alertCount = alerts.filter((a) => a.severity === "alert").length;
  const watchCount = alerts.filter((a) => a.severity === "watch").length;

  const maxSeverity =
    actionCount > 0 ? "action" : alertCount > 0 ? "alert" : "watch";

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                Early Warning Dashboard
              </h1>
              <p className="text-sm text-slate-500">
                Hate speech & disinformation monitoring — South Sudan, Kenya,
                Somalia
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
            <div className="text-slate-500">Loading data...</div>
          </div>
        ) : (
          <>
            {/* Main grid: Wheel + Map + Gauge */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Narrative Wheel */}
              <div className="lg:col-span-6">
                <Card title="Narrative Wheel">
                  {narrativeData && (
                    <NarrativeWheel
                      data={narrativeData}
                      width={520}
                      height={520}
                    />
                  )}
                </Card>
              </div>

              {/* Map + Gauge */}
              <div className="lg:col-span-6 space-y-6">
                <Card title="East Africa — Alert Map">
                  <EastAfricaMap
                    alerts={alerts}
                    selectedCountry={country}
                    onCountryClick={(code) =>
                      setCountry(code === country ? undefined : code)
                    }
                    width={480}
                    height={350}
                  />
                </Card>

                <div className="grid grid-cols-2 gap-6">
                  <Card title="Threat Level">
                    <SeverityGauge
                      level={maxSeverity as "action" | "alert" | "watch"}
                      actionCount={actionCount}
                      alertCount={alertCount}
                      watchCount={watchCount}
                    />
                  </Card>

                  <Card title="Stats">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Total Alerts</span>
                        <span className="font-semibold text-white">
                          {alerts.length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Critical</span>
                        <span className="font-semibold text-red-400">
                          {actionCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Elevated</span>
                        <span className="font-semibold text-orange-400">
                          {alertCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Monitoring</span>
                        <span className="font-semibold text-yellow-400">
                          {watchCount}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Bottom row: Trends + Alert Feed */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <Card title="Narrative Trends Over Time">
                  <TrendChart data={trends} width={640} height={250} />
                </Card>
              </div>
              <div className="lg:col-span-5">
                <Card title="Alert Feed">
                  <AlertFeed alerts={alerts} />
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
