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
        className="relative flex h-24 w-24 items-center justify-center rounded-full border-4"
        style={{
          borderColor: SEVERITY_COLORS[level],
          boxShadow: `0 0 20px ${SEVERITY_COLORS[level]}40`,
        }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{total}</div>
          <div className="text-[10px] text-slate-400">ALERTS</div>
        </div>
      </div>

      {/* Status label */}
      <div
        className="rounded-full px-3 py-1 text-xs font-bold tracking-wider"
        style={{
          backgroundColor: `${SEVERITY_COLORS[level]}20`,
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
          <span className="text-slate-400">{actionCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: SEVERITY_COLORS.alert }}
          />
          <span className="text-slate-400">{alertCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: SEVERITY_COLORS.watch }}
          />
          <span className="text-slate-400">{watchCount}</span>
        </div>
      </div>
    </div>
  );
}
