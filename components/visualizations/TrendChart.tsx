"use client";

import { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";
import type { TrendPoint } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/constants";

interface Props {
  data: TrendPoint[];
  width?: number;
  height?: number;
}

export function TrendChart({ data, width = 700, height = 250 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const renderChart = useCallback(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 120, bottom: 30, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Aggregate by date and category
    const aggregated = new Map<string, Map<string, number>>();
    for (const point of data) {
      if (!aggregated.has(point.date)) {
        aggregated.set(point.date, new Map());
      }
      const dateMap = aggregated.get(point.date)!;
      dateMap.set(
        point.category,
        (dateMap.get(point.category) || 0) + point.count
      );
    }

    const dates = Array.from(aggregated.keys()).sort();
    const categories = Object.keys(CATEGORY_COLORS);

    // Scales
    const x = d3
      .scalePoint()
      .domain(dates)
      .range([0, innerWidth]);

    const maxY = d3.max(
      dates,
      (date) => {
        const dateMap = aggregated.get(date)!;
        return d3.max(categories, (cat) => dateMap.get(cat) || 0) || 0;
      }
    ) || 10;

    const y = d3
      .scaleLinear()
      .domain([0, maxY * 1.1])
      .range([innerHeight, 0]);

    // Axes
    const xTickCount = Math.min(dates.length, 8);
    const xTickInterval = Math.max(1, Math.floor(dates.length / xTickCount));
    const xTickValues = dates.filter((_, i) => i % xTickInterval === 0);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(x).tickValues(xTickValues).tickSize(-innerHeight)
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "#1e293b").attr("stroke-dasharray", "2,2")
      )
      .call((g) =>
        g.selectAll(".tick text").attr("fill", "#64748b").attr("font-size", "10px")
      );

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "#1e293b").attr("stroke-dasharray", "2,2")
      )
      .call((g) =>
        g.selectAll(".tick text").attr("fill", "#64748b").attr("font-size", "10px")
      );

    // Lines for each category
    for (const cat of categories) {
      const lineData = dates
        .map((date) => ({
          date,
          value: aggregated.get(date)?.get(cat) || 0,
        }))
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
        .attr("stroke", CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS])
        .attr("stroke-width", 2)
        .attr("d", line);
    }

    // Legend
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width - margin.right + 10},${margin.top})`
      );

    categories.forEach((cat, i) => {
      const row = legend.append("g").attr("transform", `translate(0,${i * 20})`);
      row
        .append("rect")
        .attr("width", 12)
        .attr("height", 3)
        .attr("y", 5)
        .attr("fill", CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS]);
      row
        .append("text")
        .attr("x", 16)
        .attr("y", 9)
        .attr("fill", "#94a3b8")
        .attr("font-size", "9px")
        .text(CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]);
    });
  }, [data, width, height]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-500 text-sm"
        style={{ width, height }}
      >
        No trend data available
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    />
  );
}
