'use client';

import React from 'react';

interface TrendPoint {
  label: string;
  value: number;
}

interface MinimalTrendChartProps {
  title: string;
  subtitle?: string;
  unit: string;
  points: TrendPoint[];
  baseline?: number;
  target?: number;
  decimals?: number;
  highlightColor?: string;
}

/**
 * Apple-style Dark Grid Trend Canvas with Electric Lime (#C7FF2E) path and pin markers.
 */
export function MinimalTrendChart({
  title,
  subtitle,
  unit,
  points,
  baseline,
  target,
  decimals = 1,
  highlightColor = '#C7FF2E',
}: MinimalTrendChartProps) {
  if (points.length === 0) return null;

  const width = 560;
  const height = 190;
  const padLeft = 36;
  const padRight = 64;
  const padTop = 34;
  const padBottom = 34;

  const allValues = [
    ...points.map((p) => p.value),
    ...(baseline && baseline > 0 ? [baseline] : []),
    ...(target && target > 0 ? [target] : []),
  ];

  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.08 || 1;
  const range = Math.max(0.0001, maxVal - minVal);

  const getX = (idx: number) => {
    if (points.length === 1) return width / 2;
    return (
      padLeft +
      (idx / (points.length - 1)) * (width - padLeft - padRight)
    );
  };

  const getY = (val: number) => {
    return (
      padTop +
      (1 - (val - minVal) / range) * (height - padTop - padBottom)
    );
  };

  const polylinePoints = points
    .map((pt, idx) => `${getX(idx)},${getY(pt.value)}`)
    .join(' ');

  const lastPt = points[points.length - 1];

  const formatV = (v: number) =>
    v.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h4 className="font-serif text-lg text-[var(--ink)]">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-[#808080]">{subtitle}</p>
          )}
        </div>
        <span className="bento-pill-tag text-xs font-mono">
          Dalam {unit}
        </span>
      </div>

      <div className="nota-graph-paper p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={`Grafik tren ${title}`}
        >
          {/* Optional Target dashed line */}
          {target !== undefined && target > 0 && (
            <g>
              <line
                x1={padLeft}
                y1={getY(target)}
                x2={width - padRight}
                y2={getY(target)}
                stroke="#C7FF2E"
                strokeWidth="1.4"
                strokeDasharray="5 4"
                opacity="0.65"
              />
              <text
                x={width - padRight + 6}
                y={getY(target) + 4}
                fontSize="10"
                fontWeight="600"
                fill="#C7FF2E"
                className="font-mono"
              >
                Target {formatV(target)}
              </text>
            </g>
          )}

          {/* Optional Baseline dotted line */}
          {baseline !== undefined && baseline > 0 && (
            <g>
              <line
                x1={padLeft}
                y1={getY(baseline)}
                x2={width - padRight}
                y2={getY(baseline)}
                stroke="#808080"
                strokeWidth="1.2"
                strokeDasharray="2 3"
                opacity="0.7"
              />
              <text
                x={padLeft}
                y={getY(baseline) - 6}
                fontSize="10"
                fontWeight="500"
                fill="#808080"
                className="font-mono"
              >
                Awal: {formatV(baseline)}
              </text>
            </g>
          )}

          {/* Main Trend Line */}
          <polyline
            fill="none"
            stroke={highlightColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
            className="route-path-anim"
          />

          {/* Data nodes & direct labels */}
          {points.map((pt, idx) => {
            const cx = getX(idx);
            const cy = getY(pt.value);
            const isFirst = idx === 0;
            const isLast = idx === points.length - 1;

            return (
              <g key={pt.label}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isLast ? 6 : 4}
                  fill={isLast ? '#C7FF2E' : '#FFFFFF'}
                  stroke="#0F0F0F"
                  strokeWidth="2"
                />
                {(isFirst || isLast || idx === 3 || idx === 5) && (
                  <text
                    x={cx}
                    y={cy - 11}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isLast ? '700' : '500'}
                    fill={isLast ? '#C7FF2E' : '#FFFFFF'}
                    className="font-mono"
                  >
                    {formatV(pt.value)}
                  </text>
                )}
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#808080"
                  className="font-mono"
                >
                  {pt.label.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Direct end label */}
          {lastPt && (
            <text
              x={getX(points.length - 1) + 10}
              y={getY(lastPt.value) + 4}
              fontSize="11"
              fontWeight="700"
              fill="#C7FF2E"
              className="font-mono"
            >
              {formatV(lastPt.value)}
              {unit === '%' ? '%' : ''}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}

/**
 * Compact inline sparkline for individual metric Bento cards.
 */
export function MetricSparkline({
  values,
  color = '#C7FF2E',
}: {
  values: number[];
  color?: string;
}) {
  if (values.length < 2) return null;
  const w = 88;
  const h = 30;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.0001, max - min);

  const pts = values
    .map((v, i) => {
      const x = 4 + (i / (values.length - 1)) * (w - 8);
      const y = 4 + (1 - (v - min) / span) * (h - 8);
      return `${x},${y}`;
    })
    .join(' ');

  const lastVal = values[values.length - 1];
  const lastX = w - 4;
  const lastY = 4 + (1 - (lastVal - min) / span) * (h - 8);

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible shrink-0"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
      <circle cx={lastX} cy={lastY} r="3.5" fill={color} />
    </svg>
  );
}
