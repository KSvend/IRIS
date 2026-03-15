"use client";

import { useMemo } from "react";
import type { CountryCode, Alert } from "@/lib/types";
import { COUNTRY_COORDS, SEVERITY_COLORS } from "@/lib/constants";
import { createProjection } from "@/lib/geo/projection";
import geoData from "@/lib/geo/east-africa.json";

interface Props {
  alerts: Alert[];
  selectedCountry?: CountryCode;
  onCountryClick?: (code: CountryCode) => void;
  width?: number;
  height?: number;
}

const TARGET_COUNTRIES: Record<string, CountryCode> = {
  Kenya: "KE",
  Somalia: "SO",
  "South Sudan": "SS",
  "S. Sudan": "SS",
};

export function EastAfricaMap({
  alerts,
  selectedCountry,
  onCountryClick,
  width = 400,
  height = 400,
}: Props) {
  const { projection, pathGenerator } = useMemo(
    () => createProjection(width, height),
    [width, height]
  );

  // Aggregate alerts by country for hotspot markers
  const countryAlerts = useMemo(() => {
    const counts: Record<
      CountryCode,
      { total: number; maxSeverity: string; actionCount: number }
    > = {
      KE: { total: 0, maxSeverity: "watch", actionCount: 0 },
      SO: { total: 0, maxSeverity: "watch", actionCount: 0 },
      SS: { total: 0, maxSeverity: "watch", actionCount: 0 },
    };

    for (const alert of alerts) {
      if (alert.country in counts) {
        counts[alert.country].total++;
        if (alert.severity === "action") {
          counts[alert.country].maxSeverity = "action";
          counts[alert.country].actionCount++;
        } else if (
          alert.severity === "alert" &&
          counts[alert.country].maxSeverity !== "action"
        ) {
          counts[alert.country].maxSeverity = "alert";
        }
      }
    }
    return counts;
  }, [alerts]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const features = (geoData as any).features || [];

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Background */}
        <rect width={width} height={height} fill="#0f172a" rx={8} />

        {/* Country shapes */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {features.map((feature: any, i: number) => {
          const name = feature.properties?.name || feature.properties?.NAME || "";
          const code = TARGET_COUNTRIES[name];
          const isTarget = !!code;
          const isSelected = code === selectedCountry;

          return (
            <path
              key={i}
              d={pathGenerator(feature) || ""}
              fill={
                isSelected
                  ? "#1e3a5f"
                  : isTarget
                    ? "#1e293b"
                    : "#0f172a"
              }
              stroke={isTarget ? "#334155" : "#1e293b"}
              strokeWidth={isSelected ? 2 : isTarget ? 1 : 0.5}
              className={isTarget ? "cursor-pointer transition-colors hover:fill-[#1e3a5f]" : ""}
              onClick={() => {
                if (code && onCountryClick) onCountryClick(code);
              }}
            />
          );
        })}

        {/* Alert hotspot markers */}
        {(Object.entries(COUNTRY_COORDS) as [CountryCode, [number, number]][]).map(
          ([code, coords]) => {
            const projected = projection(coords);
            if (!projected) return null;
            const [x, y] = projected;
            const alertData = countryAlerts[code];
            const markerRadius = Math.min(6 + alertData.total * 0.5, 20);
            const color =
              SEVERITY_COLORS[alertData.maxSeverity] || SEVERITY_COLORS.watch;

            return (
              <g key={code}>
                {/* Pulse ring */}
                {alertData.total > 0 && (
                  <circle
                    cx={x}
                    cy={y}
                    r={markerRadius + 4}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    opacity={0.4}
                    className="animate-ping"
                  />
                )}
                {/* Main marker */}
                <circle
                  cx={x}
                  cy={y}
                  r={markerRadius}
                  fill={color}
                  opacity={0.7}
                  className="cursor-pointer transition-opacity hover:opacity-100"
                  onClick={() => onCountryClick?.(code)}
                />
                {/* Count label */}
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dy="0.35em"
                  fill="white"
                  fontSize={10}
                  fontWeight={700}
                  className="pointer-events-none"
                >
                  {alertData.total}
                </text>
                {/* Country label */}
                <text
                  x={x}
                  y={y + markerRadius + 14}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={11}
                  fontWeight={500}
                  className="pointer-events-none"
                >
                  {code === "SS" ? "S. Sudan" : code === "KE" ? "Kenya" : "Somalia"}
                </text>
              </g>
            );
          }
        )}
      </svg>
    </div>
  );
}
