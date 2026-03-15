import type { Alert } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { COUNTRIES } from "@/lib/types";

interface Props {
  alert: Alert;
}

export function AlertCard({ alert }: Props) {
  const country = COUNTRIES[alert.country];

  return (
    <div className="border-b border-slate-800 px-4 py-3 transition-colors hover:bg-slate-800/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge severity={alert.severity} />
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                alert.alertType === "immediate"
                  ? "bg-red-900/30 text-red-400"
                  : "bg-slate-700/50 text-slate-500"
              }`}
            >
              {alert.alertType === "immediate" ? "Live" : "Digest"}
            </span>
            <span className="text-xs text-slate-500">
              {country?.label || alert.country}
            </span>
            {alert.timestamp && (
              <span className="text-xs text-slate-600">
                {alert.timestamp.slice(0, 10)}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 leading-snug">{alert.title}</p>
          {alert.topics.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {alert.topics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400"
                >
                  {topic}
                </span>
              ))}
              {alert.topics.length > 3 && (
                <span className="text-[10px] text-slate-500">
                  +{alert.topics.length - 3} more
                </span>
              )}
            </div>
          )}
          {alert.escalationIndicators.length > 0 && (
            <div className="mt-1 text-[10px] text-red-400/80">
              Escalation: {alert.escalationIndicators[0].slice(0, 60)}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
