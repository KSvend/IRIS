"use client";

import type { CountryCode } from "@/lib/types";
import { COUNTRIES } from "@/lib/types";

interface Props {
  selected?: CountryCode;
  onChange: (code: CountryCode | undefined) => void;
}

export function CountrySelector({ selected, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
      <button
        onClick={() => onChange(undefined)}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-[150ms] ${
          !selected
            ? "bg-white text-[var(--text-primary)] shadow-[var(--shadow-soft)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        }`}
      >
        All
      </button>
      {(Object.values(COUNTRIES)).map((country) => (
        <button
          key={country.code}
          onClick={() => onChange(country.code)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-[150ms] ${
            selected === country.code
              ? "bg-white text-[var(--text-primary)] shadow-[var(--shadow-soft)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {country.label}
        </button>
      ))}
    </div>
  );
}
