"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as d3Hierarchy from "d3-hierarchy";
import * as d3Shape from "d3-shape";
import * as d3Scale from "d3-scale";
import * as d3 from "d3";
import type { NarrativeNode } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/constants";

interface Props {
  data: NarrativeNode;
  width?: number;
  height?: number;
  onTopicClick?: (topic: NarrativeNode) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
  category: string;
}

export function NarrativeWheel({
  data,
  width = 600,
  height = 600,
  onTopicClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: "",
    value: 0,
    category: "",
  });

  const radius = Math.min(width, height) / 2;
  const innerRadius = radius * 0.15;

  const renderWheel = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Build hierarchy
    const root = d3Hierarchy
      .hierarchy(data)
      .sum((d: NarrativeNode) => d.value || 0)
      .sort(
        (a: d3Hierarchy.HierarchyNode<NarrativeNode>, b: d3Hierarchy.HierarchyNode<NarrativeNode>) =>
          (b.value || 0) - (a.value || 0)
      );

    // Create partition layout (sunburst)
    const partition = d3Hierarchy
      .partition<NarrativeNode>()
      .size([2 * Math.PI, radius - innerRadius]);

    const partitioned = partition(root);

    type RectNode = d3Hierarchy.HierarchyRectangularNode<NarrativeNode>;

    // Arc generator
    const arc = d3Shape
      .arc<RectNode>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => d.y0 + innerRadius)
      .outerRadius((d) => d.y1 + innerRadius - 1)
      .padAngle(0.005)
      .padRadius(innerRadius);

    // Color scale - use category colors with opacity for depth
    const opacityScale = d3Scale
      .scaleLinear()
      .domain([1, 3])
      .range([0.95, 0.6]);

    function getColor(d: RectNode): string {
      const cat = d.data.category || d.ancestors().find((a) => a.data.category)?.data.category;
      const baseColor =
        CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || "#6b7280";
      const opacity = opacityScale(d.depth);
      return d3.color(baseColor)?.copy({ opacity }) + "" || baseColor;
    }

    // Draw arcs (skip root)
    const nodes = partitioned.descendants().filter((d) => d.depth > 0) as RectNode[];

    const paths = g
      .selectAll("path")
      .data(nodes)
      .join("path")
      .attr("d", arc as unknown as string)
      .style("fill", (d) => getColor(d))
      .style("stroke", "#1a1a2e")
      .style("stroke-width", "1px")
      .style("cursor", "pointer")
      .style("transition", "opacity 0.2s");

    paths
      .on("mouseenter", function (_event, d) {
        d3.select(this).style("opacity", 0.8);
        const [x, y] = arc.centroid(d);
        setTooltip({
          visible: true,
          x: x + width / 2,
          y: y + height / 2,
          label: d.data.label,
          value: d.value || 0,
          category:
            d.data.category || d.parent?.data.category || "",
        });
      })
      .on("mouseleave", function () {
        d3.select(this).style("opacity", 1);
        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .on("click", (_, d) => {
        if (onTopicClick && d.data) onTopicClick(d.data);
      });

    // Add text labels for larger arcs
    const labelNodes = partitioned.descendants().filter((d) => {
      return d.depth > 0 && d.x1 - d.x0 > 0.12;
    }) as RectNode[];

    g.selectAll("text")
      .data(labelNodes)
      .join("text")
      .attr("transform", (d) => {
        const angle = ((d.x0 + d.x1) / 2) * (180 / Math.PI) - 90;
        const r = (d.y0 + d.y1) / 2 + innerRadius;
        return `rotate(${angle}) translate(${r},0) rotate(${angle > 90 ? 180 : 0})`;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => {
        const angle = ((d.x0 + d.x1) / 2) * (180 / Math.PI) - 90;
        return angle > 90 ? "end" : "start";
      })
      .style("font-size", (d) => (d.depth === 1 ? "11px" : "9px"))
      .style("font-weight", (d) => (d.depth === 1 ? "600" : "400"))
      .style("fill", "#e2e8f0")
      .style("pointer-events", "none")
      .text((d) => {
        const maxLen = d.depth === 1 ? 18 : 14;
        const label = d.data.label;
        return label.length > maxLen
          ? label.slice(0, maxLen - 1) + "\u2026"
          : label;
      });

    // Center label
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.3em")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", "#e2e8f0")
      .text("Narratives");

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .style("font-size", "11px")
      .style("fill", "#94a3b8")
      .text(`${partitioned.value?.toLocaleString() || 0} posts`);
  }, [data, width, height, innerRadius, radius, onTopicClick]);

  useEffect(() => {
    renderWheel();
  }, [renderWheel]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      />
      {tooltip.visible && (
        <div
          className="absolute pointer-events-none z-10 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-sm shadow-xl backdrop-blur"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
          }}
        >
          <div className="font-semibold text-white">{tooltip.label}</div>
          <div className="text-slate-400">
            {tooltip.value.toLocaleString()} posts
          </div>
          <div className="text-xs text-slate-500 capitalize">
            {(tooltip.category || "").replace(/_/g, " ")}
          </div>
        </div>
      )}
    </div>
  );
}
