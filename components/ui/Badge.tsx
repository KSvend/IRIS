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
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] ${className}`}
      style={{
        backgroundColor: `${color}12`,
        color,
        border: `1px solid ${color}25`,
      }}
    >
      {severity}
    </span>
  );
}
