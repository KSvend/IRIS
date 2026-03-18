"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CountrySelector } from "@/components/dashboard/CountrySelector";
import { NarrativeWheel } from "@/components/visualizations/NarrativeWheel";
import { PostDrillDown } from "@/components/dashboard/PostDrillDown";
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
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const params = country ? `?country=${country}` : "";
    const res = await fetch(`/api/narratives${params}`);
    setData(await res.json());
  }, [country]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle wheel click — extract topic ID from NarrativeNode.name
  const handleTopicClick = useCallback((node: NarrativeNode) => {
    // Only leaf nodes (actual topics) have names matching topic IDs
    const topic = NARRATIVE_TOPICS.find((t) => t.id === node.name);
    if (topic) {
      setSelectedTopicId(topic.id);
    }
  }, []);

  // Handle taxonomy pill click
  const handleTaxonomyClick = useCallback((topicId: string) => {
    setSelectedTopicId(topicId);
  }, []);

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
      <div className="mx-auto max-w-[1120px] px-6 py-10 space-y-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-medium text-[var(--text-primary)] leading-tight">
              Narrative analysis
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)] mt-1">
              Explore hate speech narratives across the taxonomy
            </p>
          </div>
          <CountrySelector selected={country} onChange={setCountry} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Large wheel */}
          <div className="lg:col-span-7">
            <Card title="Full narrative wheel">
              {data && (
                <NarrativeWheel
                  data={data}
                  width={600}
                  height={600}
                  onTopicClick={handleTopicClick}
                />
              )}
            </Card>
          </div>

          {/* Topic detail + taxonomy */}
          <div className="lg:col-span-5 space-y-6">
            {/* Post drill-down when topic is selected */}
            {selectedTopicId ? (
              <Card title="Topic analysis">
                <PostDrillDown
                  topicId={selectedTopicId}
                  country={country}
                  onClose={() => setSelectedTopicId(null)}
                />
              </Card>
            ) : (
              <Card title="Select a topic">
                <div className="flex items-center justify-center py-8 text-[13px] text-[var(--text-muted)]">
                  Click a topic on the wheel or taxonomy below to see post-level analysis
                </div>
              </Card>
            )}

            {/* Full taxonomy explorer */}
            <Card title="Narrative taxonomy">
              <div className="max-h-[600px] overflow-y-auto space-y-4 scrollbar-thin">
                {Object.entries(grouped).map(([category, subcats]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[
                              category as keyof typeof CATEGORY_COLORS
                            ],
                        }}
                      />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {
                          CATEGORY_LABELS[
                            category as keyof typeof CATEGORY_LABELS
                          ]
                        }
                      </span>
                    </div>

                    {Object.entries(subcats).map(([subcat, topics]) => (
                      <div key={subcat} className="ml-5 mb-2">
                        <div className="text-xs font-medium text-[var(--text-muted)] mb-1">
                          {subcat}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {topics.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => handleTaxonomyClick(t.id)}
                              className={`rounded px-1.5 py-0.5 text-[10px] cursor-pointer transition-all duration-[150ms] ${
                                selectedTopicId === t.id
                                  ? "bg-[var(--accent)] text-white font-medium"
                                  : "bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]"
                              }`}
                            >
                              {t.label}
                            </button>
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
