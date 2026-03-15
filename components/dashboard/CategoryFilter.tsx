"use client";

import type { NarrativeCategory } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/constants";

interface Props {
  selected: NarrativeCategory[];
  onChange: (categories: NarrativeCategory[]) => void;
}

const ALL_CATEGORIES: NarrativeCategory[] = [
  "hate_speech",
  "violent_extremism",
  "rumor_misinfo",
  "peace_counter",
  "cross_cutting",
];

export function CategoryFilter({ selected, onChange }: Props) {
  const isAllSelected = selected.length === 0;

  function toggle(cat: NarrativeCategory) {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-800/50 p-1">
      <button
        onClick={() => onChange([])}
        className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
          isAllSelected
            ? "bg-slate-700 text-white"
            : "text-slate-400 hover:text-white"
        }`}
      >
        All
      </button>
      {ALL_CATEGORIES.map((cat) => {
        const isActive = isAllSelected || selected.includes(cat);
        return (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !isAllSelected && isActive
                ? "bg-slate-700 text-white"
                : isAllSelected
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-400"
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                backgroundColor: CATEGORY_COLORS[cat],
                opacity: isActive ? 1 : 0.3,
              }}
            />
            {CATEGORY_LABELS[cat]}
          </button>
        );
      })}
    </div>
  );
}
