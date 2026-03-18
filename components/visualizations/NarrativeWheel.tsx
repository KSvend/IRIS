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
  node: NarrativeNode | null;
  totalValue: number;
  depth: number;
}

const EA_HS_COLORS = {
  hate: "#D05454",
  abusive: "#E07B39",
  normal: "#3BAA7F",
};

function MiniBar({ segments, total }: {
  segments: { value: number; color: string }[];
  total: number;
}) {
  if (total === 0) return null;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
      {segments.map((seg, i) =>
        seg.value > 0 ? (
          <div
            key={i}
            className="h-full"
            style={{
              width: `${(seg.value / total) * 100}%`,
              backgroundColor: seg.color,
            }}
          />
        ) : null
      )}
    </div>
  );
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
    node: null,
    totalValue: 0,
    depth: 0,
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
      .style("stroke", "#FFFFFF")
      .style("stroke-width", "1.5px")
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
          node: d.data,
          totalValue: d.value || 0,
          depth: d.depth,
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
      .style("font-weight", (d) => (d.depth === 1 ? "500" : "400"))
      .style("fill", "#111111")
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
      .style("font-weight", "500")
      .style("fill", "#111111")
      .text("Narratives");

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .style("font-size", "11px")
      .style("fill", "#6B6B6B")
      .text(`${partitioned.value?.toLocaleString() || 0} posts`);
  }, [data, width, height, innerRadius, radius, onTopicClick]);

  useEffect(() => {
    renderWheel();
  }, [renderWheel]);

  const node = tooltip.node;
  const eaHs = node?.eaHs;
  const eaHsTotal = eaHs ? eaHs.hate + eaHs.abusive + eaHs.normal : 0;

  // Position tooltip to avoid going off-screen
  const tooltipLeft = tooltip.x > width * 0.6 ? tooltip.x - 280 : tooltip.x + 16;
  const tooltipTop = tooltip.y > height * 0.7 ? tooltip.y - 120 : tooltip.y - 10;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      />
      {tooltip.visible && node && (
        <div
          className="absolute pointer-events-none z-10 rounded-lg border border-[var(--border-subtle)] bg-white px-4 py-3 shadow-[var(--shadow-elevated)]"
          style={{
            left: tooltipLeft,
            top: tooltipTop,
            width: 264,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="font-medium text-[13px] text-[var(--text-primary)] leading-snug">
              {node.label}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] tabular-nums whitespace-nowrap">
              {tooltip.totalValue.toLocaleString()} posts
            </div>
          </div>

          {/* Category / subcategory breadcrumb */}
          <div className="text-[10px] text-[var(--text-muted)] capitalize mb-2">
            {(node.category || "").replace(/_/g, " ")}
            {node.subcategory && ` \u203A ${node.subcategory}`}
          </div>

          {/* Description (for leaf topics) */}
          {node.description && (
            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] mb-2.5">
              {node.description}
            </p>
          )}

          {/* EA-HS breakdown */}
          {eaHs && eaHsTotal > 0 && (
            <div className="space-y-1 mb-2.5">
              <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
                EA-HS classification
              </div>
              <MiniBar
                total={eaHsTotal}
                segments={[
                  { value: eaHs.hate, color: EA_HS_COLORS.hate },
                  { value: eaHs.abusive, color: EA_HS_COLORS.abusive },
                  { value: eaHs.normal, color: EA_HS_COLORS.normal },
                ]}
              />
              <div className="flex gap-3 text-[10px] text-[var(--text-secondary)]">
                {eaHs.hate > 0 && (
                  <span style={{ color: EA_HS_COLORS.hate }}>
                    {eaHs.hate} hate
                  </span>
                )}
                {eaHs.abusive > 0 && (
                  <span style={{ color: EA_HS_COLORS.abusive }}>
                    {eaHs.abusive} abusive
                  </span>
                )}
                {eaHs.normal > 0 && (
                  <span style={{ color: EA_HS_COLORS.normal }}>
                    {eaHs.normal} normal
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Toxicity flag */}
          {(node.toxHigh || 0) > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] mb-2.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#D05454]" />
              <span className="text-[var(--text-secondary)]">
                {node.toxHigh} posts flagged high toxicity
              </span>
            </div>
          )}

          {/* Key themes */}
          {node.sampleThemes && node.sampleThemes.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Key themes
              </div>
              <div className="flex flex-wrap gap-1">
                {node.sampleThemes.map((theme) => (
                  <span
                    key={theme}
                    className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Platform */}
          {node.topPlatform && (
            <div className="text-[10px] text-[var(--text-muted)] mt-2 uppercase">
              Mostly on {node.topPlatform}
            </div>
          )}

          {/* Click hint for leaf topics */}
          {tooltip.depth === 3 && (
            <div className="text-[10px] text-[var(--accent)] mt-2 pt-1.5 border-t border-[var(--border-subtle)]">
              Click to see post-level analysis →
            </div>
          )}
        </div>
      )}
    </div>
  );
}
