"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CountrySelector } from "@/components/dashboard/CountrySelector";
import { NarrativeWheel } from "@/components/visualizations/NarrativeWheel";
import { Card } from "@/components/ui/Card";
import {
  NARRATIVE_TOPICS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "@/lib/constants";
import type { CountryCode, NarrativeNode } from "@/lib/types";

export default function NarrativesPage() {
  const [country, setCountry] = useState<CountryCode | undefined>();
  const [data, setData] = useState<NarrativeNode | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<NarrativeNode | null>(
    null
  );

  const fetchData = useCallback(async () => {
    const params = country ? `?country=${country}` : "";
    const res = await fetch(`/api/narratives${params}`);
    setData(await res.json());
  }, [country]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group topics by category for the taxonomy view
  const grouped = NARRATIVE_TOPICS.reduce(
    (acc, topic) => {
      if (!acc[topic.category]) acc[topic.category] = {};
      if (!acc[topic.category][topic.subcategory])
        acc[topic.category][topic.subcategory] = [];
      acc[topic.category][topic.subcategory].push(topic);
      return acc;
    },
    {} as Record<string, Record<string, typeof NARRATIVE_TOPICS>>
  );

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              Narrative Analysis
            </h1>
            <p className="text-sm text-slate-500">
              Explore hate speech narratives across the taxonomy
            </p>
          </div>
          <CountrySelector selected={country} onChange={setCountry} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Large wheel */}
          <div className="lg:col-span-7">
            <Card title="Full Narrative Wheel">
              {data && (
                <NarrativeWheel
                  data={data}
                  width={600}
                  height={600}
                  onTopicClick={setSelectedTopic}
                />
              )}
            </Card>
          </div>

          {/* Topic detail + taxonomy */}
          <div className="lg:col-span-5 space-y-6">
            {/* Selected topic detail */}
            {selectedTopic && (
              <Card title="Selected Topic">
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-white">
                    {selectedTopic.label}
                  </h4>
                  {selectedTopic.category && (
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[selectedTopic.category]}20`,
                        color:
                          CATEGORY_COLORS[selectedTopic.category],
                      }}
                    >
                      {CATEGORY_LABELS[selectedTopic.category]}
                    </span>
                  )}
                  {selectedTopic.value !== undefined && (
                    <p className="text-sm text-slate-400">
                      {selectedTopic.value.toLocaleString()} posts detected
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Full taxonomy explorer */}
            <Card title="Narrative Taxonomy">
              <div className="max-h-[600px] overflow-y-auto space-y-4 scrollbar-thin">
                {Object.entries(grouped).map(([category, subcats]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[
                              category as keyof typeof CATEGORY_COLORS
                            ],
                        }}
                      />
                      <span className="text-sm font-semibold text-slate-300">
                        {
                          CATEGORY_LABELS[
                            category as keyof typeof CATEGORY_LABELS
                          ]
                        }
                      </span>
                    </div>

                    {Object.entries(subcats).map(([subcat, topics]) => (
                      <div key={subcat} className="ml-5 mb-2">
                        <div className="text-xs font-medium text-slate-500 mb-1">
                          {subcat}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {topics.map((t) => (
                            <span
                              key={t.id}
                              className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 cursor-pointer hover:bg-slate-700 transition-colors"
                            >
                              {t.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
