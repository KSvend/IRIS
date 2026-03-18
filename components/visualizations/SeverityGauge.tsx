"use client";

import { SEVERITY_COLORS } from "@/lib/constants";
import type { SeverityLevel } from "@/lib/types";

interface Props {
  level: SeverityLevel;
  actionCount: number;
  alertCount: number;
  watchCount: number;
}

export function SeverityGauge({
  level,
  actionCount,
  alertCount,
  watchCount,
}: Props) {
  const total = actionCount + alertCount + watchCount;
  const labels: Record<SeverityLevel, string> = {
    action: "CRITICAL",
    alert: "ELEVATED",
    watch: "MONITORING",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Gauge circle */}
      <div
        className="relative flex h-24 w-24 items-center justify-center rounded-full border-[3px]"
        style={{
          borderColor: SEVERITY_COLORS[level],
        }}
      >
        <div className="text-center">
          <div className="text-2xl font-medium text-[var(--text-primary)]">{total}</div>
          <div className="text-[10px] uppercase tracking-[0.04em] text-[var(--text-muted)]">Alerts</div>
        </div>
      </div>

      {/* Status label */}
      <div
        className="rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.04em]"
        style={{
          backgroundColor: `${SEVERITY_COLORS[level]}12`,
          color: SEVERITY_COLORS[level],
        }}
      >
        {labels[level]}
      </div>

      {/* Breakdown */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: SEVERITY_COLORS.action }}
          />
          <span className="text-[var(--text-secondary)]">{actionCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: SEVERITY_COLORS.alert }}
          />
          <span className="text-[var(--text-secondary)]">{alertCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: SEVERITY_COLORS.watch }}
          />
          <span className="text-[var(--text-secondary)]">{watchCount}</span>
        </div>
      </div>
    </div>
  );
}
