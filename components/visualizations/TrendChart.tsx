"use client";

import { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";
import type { TrendPoint, SubTrendPoint, NarrativeCategory } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/constants";

interface Props {
  data: TrendPoint[];
  subData?: SubTrendPoint[];
  drilledCategory?: NarrativeCategory;
  onCategoryClick?: (category: NarrativeCategory) => void;
  onBack?: () => void;
  width?: number;
  height?: number;
}

// Generate shades for subcategory lines within a category colour
function generateShades(baseColor: string, count: number): string[] {
  if (count <= 1) return [baseColor];
  const base = d3.color(baseColor);
  if (!base) return Array(count).fill(baseColor);
  const shades: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const lighter = d3.interpolateLab(
      d3.lab(base).brighter(0.8).formatRgb(),
      d3.lab(base).darker(0.6).formatRgb()
    )(t);
    shades.push(lighter);
  }
  return shades;
}

// Shared axis rendering
function renderAxes(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScalePoint<string>,
  y: d3.ScaleLinear<number, number>,
  dates: string[],
  innerWidth: number,
  innerHeight: number
) {
  const xTickCount = Math.min(dates.length, 8);
  const xTickInterval = Math.max(1, Math.floor(dates.length / xTickCount));
  const xTickValues = dates.filter((_, i) => i % xTickInterval === 0);

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickValues(xTickValues).tickSize(-innerHeight))
    .call((sel) => sel.select(".domain").remove())
    .call((sel) =>
      sel.selectAll(".tick line").attr("stroke", "#E4E4E0").attr("stroke-dasharray", "2,2")
    )
    .call((sel) =>
      sel.selectAll(".tick text").attr("fill", "#9A9A94").attr("font-size", "10px")
    );

  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth))
    .call((sel) => sel.select(".domain").remove())
    .call((sel) =>
      sel.selectAll(".tick line").attr("stroke", "#E4E4E0").attr("stroke-dasharray", "2,2")
    )
    .call((sel) =>
      sel.selectAll(".tick text").attr("fill", "#9A9A94").attr("font-size", "10px")
    );
}

export function TrendChart({
  data,
  subData,
  drilledCategory,
  onCategoryClick,
  onBack,
  width = 700,
  height = 280,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const isDrilled = !!drilledCategory && !!subData && subData.length > 0;

  const renderChart = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 140, bottom: 30, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (isDrilled) {
      // ── DRILLED VIEW: subcategory lines ──
      const aggregated = new Map<string, Map<string, number>>();
      for (const point of subData!) {
        if (!aggregated.has(point.date)) {
          aggregated.set(point.date, new Map());
        }
        const dateMap = aggregated.get(point.date)!;
        dateMap.set(point.subcategory, (dateMap.get(point.subcategory) || 0) + point.count);
      }

      const dates = Array.from(aggregated.keys()).sort();
      const subcategories = Array.from(new Set(subData!.map((d) => d.subcategory))).sort();
      const baseColor = CATEGORY_COLORS[drilledCategory!];
      const colors = generateShades(baseColor, subcategories.length);
      const colorMap = new Map(subcategories.map((s, i) => [s, colors[i]]));

      const x = d3.scalePoint().domain(dates).range([0, innerWidth]);
      const maxY = d3.max(dates, (date) => {
        const dateMap = aggregated.get(date)!;
        return d3.max(subcategories, (s) => dateMap.get(s) || 0) || 0;
      }) || 10;
      const y = d3.scaleLinear().domain([0, maxY * 1.1]).range([innerHeight, 0]);

      renderAxes(g, x, y, dates, innerWidth, innerHeight);

      for (const sub of subcategories) {
        const lineData = dates
          .map((date) => ({ date, value: aggregated.get(date)?.get(sub) || 0 }))
          .filter((d) => d.value > 0);
        if (lineData.length < 2) continue;

        const line = d3
          .line<{ date: string; value: number }>()
          .x((d) => x(d.date)!)
          .y((d) => y(d.value))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(lineData)
          .attr("fill", "none")
          .attr("stroke", colorMap.get(sub) || baseColor)
          .attr("stroke-width", 2)
          .attr("d", line);
      }

      // Legend
      const legend = svg
        .append("g")
        .attr("transform", `translate(${width - margin.right + 10},${margin.top})`);

      subcategories.forEach((sub, i) => {
        const row = legend.append("g").attr("transform", `translate(0,${i * 18})`);
        row.append("rect").attr("width", 12).attr("height", 3).attr("y", 5)
          .attr("fill", colorMap.get(sub) || baseColor);
        row.append("text").attr("x", 16).attr("y", 9).attr("fill", "#6B6B6B").attr("font-size", "9px")
          .text(sub.length > 18 ? sub.slice(0, 17) + "\u2026" : sub);
      });
    } else {
      // ── DEFAULT VIEW: category lines ──
      if (data.length === 0) return;

      const aggregated = new Map<string, Map<string, number>>();
      for (const point of data) {
        if (!aggregated.has(point.date)) aggregated.set(point.date, new Map());
        const dateMap = aggregated.get(point.date)!;
        dateMap.set(point.category, (dateMap.get(point.category) || 0) + point.count);
      }

      const dates = Array.from(aggregated.keys()).sort();
      const categories = Object.keys(CATEGORY_COLORS);

      const x = d3.scalePoint().domain(dates).range([0, innerWidth]);
      const maxY = d3.max(dates, (date) => {
        const dateMap = aggregated.get(date)!;
        return d3.max(categories, (cat) => dateMap.get(cat) || 0) || 0;
      }) || 10;
      const y = d3.scaleLinear().domain([0, maxY * 1.1]).range([innerHeight, 0]);

      renderAxes(g, x, y, dates, innerWidth, innerHeight);

      for (const cat of categories) {
        const lineData = dates
          .map((date) => ({ date, value: aggregated.get(date)?.get(cat) || 0 }))
          .filter((d) => d.value > 0);
        if (lineData.length < 2) continue;

        const line = d3
          .line<{ date: string; value: number }>()
          .x((d) => x(d.date)!)
          .y((d) => y(d.value))
          .curve(d3.curveMonotoneX);

        const path = g.append("path")
          .datum(lineData)
          .attr("fill", "none")
          .attr("stroke", CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS])
          .attr("stroke-width", 2)
          .attr("d", line);

        if (onCategoryClick) {
          path
            .style("cursor", "pointer")
            .on("mouseenter", function () { d3.select(this).attr("stroke-width", 4); })
            .on("mouseleave", function () { d3.select(this).attr("stroke-width", 2); })
            .on("click", () => { onCategoryClick(cat as NarrativeCategory); });
        }
      }

      // Legend
      const legend = svg
        .append("g")
        .attr("transform", `translate(${width - margin.right + 10},${margin.top})`);

      categories.forEach((cat, i) => {
        const row = legend.append("g")
          .attr("transform", `translate(0,${i * 20})`)
          .style("cursor", onCategoryClick ? "pointer" : "default");
        if (onCategoryClick) row.on("click", () => onCategoryClick(cat as NarrativeCategory));

        row.append("rect").attr("width", 12).attr("height", 3).attr("y", 5)
          .attr("fill", CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS]);
        row.append("text").attr("x", 16).attr("y", 9).attr("fill", "#6B6B6B").attr("font-size", "9px")
          .text(CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]);
      });
    }
  }, [data, subData, isDrilled, drilledCategory, onCategoryClick, width, height]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  if (data.length === 0 && !isDrilled) {
    return (
      <div className="flex items-center justify-center text-[var(--text-muted)] text-sm" style={{ width, height }}>
        No trend data available
      </div>
    );
  }

  return (
    <div>
      {isDrilled && onBack && (
        <button onClick={onBack} className="mb-2 flex items-center gap-1 text-[12px] text-[var(--accent)] hover:underline">
          <span>{"\u2190"}</span> Back to all categories
        </button>
      )}
      <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} />
      {!isDrilled && onCategoryClick && (
        <p className="text-[10px] text-[var(--text-muted)] mt-1">Click a line or legend item to drill into subcategories</p>
      )}
    </div>
  );
}
