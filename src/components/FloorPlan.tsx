"use client";

import { useMemo } from "react";
import type { Office } from "@/lib/inventory";
import { officeListPrice, money, CONFIG, type EngineConfig } from "@/lib/engine";

/**
 * Placeholder 2D floor plan. Rooms are laid out along a central corridor in two
 * banks — a schematic stand-in for real CAD. Click toggles selection (you can
 * pick several offices, then Continue). Swap the geometry for an SVG traced from
 * the real plans later; the select targets stay the same.
 */

const ROOM_W = 128;
const ROOM_H = 92;
const GAP = 6;
const PAD = 14;
const CORRIDOR_H = 46;

export default function FloorPlan({
  offices,
  selected,
  onToggle,
  furnished = false,
  cfg = CONFIG,
}: {
  offices: Office[];
  selected: Set<string>;
  onToggle: (slug: string) => void;
  furnished?: boolean;
  cfg?: EngineConfig;
}) {
  const { rects, width, height } = useMemo(() => {
    const half = Math.ceil(offices.length / 2);
    const top = offices.slice(0, half);
    const bottom = offices.slice(half);
    const cols = Math.max(top.length, bottom.length);

    const width = PAD * 2 + cols * ROOM_W + (cols - 1) * GAP;
    const topY = PAD;
    const corridorY = topY + ROOM_H;
    const bottomY = corridorY + CORRIDOR_H;
    const height = bottomY + ROOM_H + PAD;

    const place = (arr: Office[], y: number) =>
      arr.map((o, i) => ({ o, x: PAD + i * (ROOM_W + GAP), y, w: ROOM_W, h: ROOM_H }));

    return { rects: [...place(top, topY), ...place(bottom, bottomY)], width, height };
  }, [offices]);

  const corridorY = PAD + ROOM_H;

  return (
    <div className="plan-shell">
      <span className="watermark">Placeholder plan</span>
      <div className="plan">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Floor plan">
          <rect className="bldg-outline" x={4} y={4} width={width - 8} height={height - 8} rx={10} />
          <rect className="corridor" x={PAD} y={corridorY} width={width - PAD * 2} height={CORRIDOR_H} rx={6} />
          {rects.map(({ o, x, y, w, h }) => {
            const price = officeListPrice(o.rate, false, cfg); // o.rate is already the furnishing-resolved base
            const isSel = selected.has(o.slug);
            const cls = `room${o.premium ? " prem" : ""}${o.taken ? " taken" : ""}${isSel ? " sel" : ""}`;
            return (
              <g
                key={o.slug}
                className={cls}
                onClick={() => !o.taken && onToggle(o.slug)}
                aria-label={`${o.code} ${o.taken ? "occupied" : money(price) + " per month"}${isSel ? " (selected)" : ""}`}
              >
                <rect x={x} y={y} width={w} height={h} rx={7} />
                {isSel && (
                  <g>
                    <circle cx={x + w - 16} cy={y + 16} r={9} className="sel-dot" />
                    <path
                      d={`M ${x + w - 20} ${y + 16} l 3 3 l 5 -6`}
                      className="sel-check"
                      fill="none"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}
                <text className="code" x={x + 11} y={y + 26}>{o.code}</text>
                <text className="rent" x={x + 11} y={y + h - 26}>{o.sqft} SF</text>
                <text className="rent" x={x + 11} y={y + h - 11}>
                  {o.taken ? "Occupied" : `${money(price)}/mo`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="legend">
        <span className="sw"><span className="chip" /> Available</span>
        <span className="sw"><span className="chip sel" /> Selected</span>
        <span className="sw"><span className="chip prem" /> Premium floor</span>
        <span className="sw"><span className="chip taken" /> Occupied</span>
        <span className="sw" style={{ marginLeft: "auto" }}>Prices {furnished ? "furnished" : "unfurnished"} · {furnished ? "incl. furniture" : "set furnishing & term above"}</span>
      </div>
    </div>
  );
}
