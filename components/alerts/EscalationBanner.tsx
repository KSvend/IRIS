import type { Alert } from "@/lib/types";

interface Props {
  alerts: Alert[];
}

export function EscalationBanner({ alerts }: Props) {
  const actionAlerts = alerts.filter((a) => a.severity === "action");

  if (actionAlerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#D05454]/20 bg-[#D05454]/5 px-5 py-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--error)] opacity-50" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--error)]" />
        </span>
        <span className="text-sm font-medium text-[var(--error)]">
          {actionAlerts.length} Critical alert{actionAlerts.length > 1 ? "s" : ""}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          Immediate attention required
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">
        {actionAlerts[0].title}
        {actionAlerts.length > 1 &&
          ` and ${actionAlerts.length - 1} more critical alerts`}
      </p>
    </div>
  );
}
