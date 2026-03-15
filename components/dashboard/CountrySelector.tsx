"use client";

import type { CountryCode } from "@/lib/types";
import { COUNTRIES } from "@/lib/types";

interface Props {
  selected?: CountryCode;
  onChange: (code: CountryCode | undefined) => void;
}

export function CountrySelector({ selected, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-slate-800/50 p-1">
      <button
        onClick={() => onChange(undefined)}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          !selected
            ? "bg-slate-700 text-white"
            : "text-slate-400 hover:text-white"
        }`}
      >
        All
      </button>
      {(Object.values(COUNTRIES)).map((country) => (
        <button
          key={country.code}
          onClick={() => onChange(country.code)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            selected === country.code
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {country.label}
        </button>
      ))}
    </div>
  );
}
