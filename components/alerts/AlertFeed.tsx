"use client";

import { useState } from "react";
import type { Alert, AlertType } from "@/lib/types";
import { AlertCard } from "./AlertCard";

interface Props {
  alerts: Alert[];
}

const TABS: { label: string; value: AlertType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Immediate", value: "immediate" },
  { label: "Digest", value: "digest" },
];

export function AlertFeed({ alerts }: Props) {
  const [tab, setTab] = useState<AlertType | "all">("all");

  const filtered =
    tab === "all" ? alerts : alerts.filter((a) => a.alertType === tab);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--divider)] px-4 pb-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all duration-[150ms] ${
              tab === t.value
                ? "bg-[var(--surface-muted)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {t.label}
            {t.value !== "all" && (
              <span className="ml-1 text-[var(--text-muted)]">
                {alerts.filter((a) =>
                  t.value === "all" ? true : a.alertType === t.value
                ).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-[var(--text-muted)]">
          No {tab === "all" ? "active" : tab} alerts
        </div>
      ) : (
        <div className="max-h-[450px] overflow-y-auto scrollbar-thin">
          {filtered.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
