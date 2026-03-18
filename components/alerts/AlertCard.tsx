import type { Alert } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { COUNTRIES } from "@/lib/types";

interface Props {
  alert: Alert;
}

export function AlertCard({ alert }: Props) {
  const country = COUNTRIES[alert.country];

  return (
    <div className="border-b border-[var(--divider)] px-4 py-3 transition-all duration-[150ms] hover:bg-[var(--surface-muted)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge severity={alert.severity} />
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.04em] ${
                alert.alertType === "immediate"
                  ? "bg-[#D05454]/10 text-[var(--error)]"
                  : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
              }`}
            >
              {alert.alertType === "immediate" ? "Live" : "Digest"}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {country?.label || alert.country}
            </span>
            {alert.timestamp && (
              <span className="text-xs text-[var(--text-muted)]">
                {alert.timestamp.slice(0, 10)}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-primary)] leading-snug">{alert.title}</p>
          {alert.topics.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {alert.topics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]"
                >
                  {topic}
                </span>
              ))}
              {alert.topics.length > 3 && (
                <span className="text-[10px] text-[var(--text-muted)]">
                  +{alert.topics.length - 3} more
                </span>
              )}
            </div>
          )}
          {alert.escalationIndicators.length > 0 && (
            <div className="mt-1 text-[10px] text-[var(--error)]">
              Escalation: {alert.escalationIndicators[0].slice(0, 60)}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
