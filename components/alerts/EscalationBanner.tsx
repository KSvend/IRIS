import type { Alert } from "@/lib/types";

interface Props {
  alerts: Alert[];
}

export function EscalationBanner({ alerts }: Props) {
  const actionAlerts = alerts.filter((a) => a.severity === "action");

  if (actionAlerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
        <span className="text-sm font-semibold text-red-400">
          {actionAlerts.length} Critical Alert{actionAlerts.length > 1 ? "s" : ""}
        </span>
        <span className="text-xs text-red-400/60">
          Immediate attention required
        </span>
      </div>
      <p className="mt-1 text-xs text-red-300/70">
        {actionAlerts[0].title}
        {actionAlerts.length > 1 &&
          ` and ${actionAlerts.length - 1} more critical alerts`}
      </p>
    </div>
  );
}
