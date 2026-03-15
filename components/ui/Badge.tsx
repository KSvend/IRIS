import { SEVERITY_COLORS } from "@/lib/constants";
import type { SeverityLevel } from "@/lib/types";

interface Props {
  severity: SeverityLevel;
  className?: string;
}

export function Badge({ severity, className = "" }: Props) {
  const color = SEVERITY_COLORS[severity];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {severity}
    </span>
  );
}
