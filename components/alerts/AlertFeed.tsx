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
      <div className="flex gap-1 border-b border-slate-800 px-4 pb-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
              tab === t.value
                ? "bg-slate-700 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
            {t.value !== "all" && (
              <span className="ml-1 text-slate-600">
                {alerts.filter((a) =>
                  t.value === "all" ? true : a.alertType === t.value
                ).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-slate-500">
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
