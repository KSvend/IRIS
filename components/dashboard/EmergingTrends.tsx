"use client";

import type { EmergingTrend } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/constants";

interface Props {
  trends: EmergingTrend[];
}

function DirectionIcon({ direction }: { direction: EmergingTrend["direction"] }) {
  if (direction === "spike") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <path d="M8 2L14 10H2L8 2Z" fill="#D05454" />
        <path d="M8 5L11 10H5L8 5Z" fill="#fff" opacity="0.4" />
      </svg>
    );
  }
  if (direction === "rising") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <path d="M4 12L8 4L12 12" stroke="#E07B39" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M4 4L8 12L12 4" stroke="#3BAA7F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MagnitudeBadge({ direction, magnitude }: { direction: EmergingTrend["direction"]; magnitude: number }) {
  const bg =
    direction === "spike"
      ? "bg-[#D05454]/10 text-[#D05454]"
      : direction === "rising"
      ? "bg-[#E07B39]/10 text-[#E07B39]"
      : "bg-[#3BAA7F]/10 text-[#3BAA7F]";

  const sign = direction === "falling" ? "−" : "+";
  const display = magnitude > 900 ? "NEW" : `${sign}${magnitude}%`;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums ${bg}`}>
      {display}
    </span>
  );
}

export function EmergingTrends({ trends }: Props) {
  if (trends.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)] text-sm">
        No emerging trends detected in the current time window
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trends.map((trend) => (
        <div
          key={trend.id}
          className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-white px-4 py-3 transition-colors hover:bg-[var(--surface-muted)]"
        >
          <DirectionIcon direction={trend.direction} />

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">
                {trend.description}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <MagnitudeBadge direction={trend.direction} magnitude={trend.magnitude} />

              <span
                className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: CATEGORY_COLORS[trend.category] + "15",
                  color: CATEGORY_COLORS[trend.category],
                }}
              >
                {CATEGORY_LABELS[trend.category]}
              </span>

              {trend.topicLabels.map((label) => (
                <span
                  key={label}
                  className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]"
                >
                  {label}
                </span>
              ))}

              <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                {trend.postCount} posts (7d) vs {trend.baselineCount} baseline
              </span>
            </div>
          </div>

          <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap uppercase">
            {trend.country}
          </span>
        </div>
      ))}
    </div>
  );
}
