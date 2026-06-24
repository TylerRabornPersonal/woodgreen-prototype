"use client";

import { useMemo } from "react";
import type { Office } from "@/lib/inventory";
import { officeListPrice, money, CONFIG, type EngineConfig, type Term } from "@/lib/engine";
import { tracedPlanFor } from "@/lib/floorplans";

/**
 * 2D floor plan. Where a traced plan exists for the floor (see lib/floorplans),
 * the real geometry is rendered — offices punch through a solid floor fill and
 * highlight green on select; everything else (halls, baths, lobby) collapses
 * into the fill, with shared amenities like the conference room shown as
 * display-only blocks. Floors without a traced plan fall back to the schematic
 * placeholder grid below.
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
  term = 12,
}: {
  offices: Office[];
  selected: Set<string>;
  onToggle: (slug: string) => void;
  furnished?: boolean;
  cfg?: EngineConfig;
  term?: Term;
}) {
  const traced = tracedPlanFor(offices[0]?.floorId);
  // Term discount shown live on the plan, mirroring how furnishing already adjusts price.
  const termFactor = 1 - (cfg.termDiscount[term] ?? 0);

  // Placeholder-grid layout — computed unconditionally to keep hook order stable.
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

  const legend = (
    <div className="legend">
      <span className="sw"><span className="chip" /> Available</span>
      <span className="sw"><span className="chip sel" /> Selected</span>
      {traced ? (
        traced.fixed.length > 0 && <span className="sw"><span className="chip conf" /> Shared</span>
      ) : (
        <span className="sw"><span className="chip prem" /> Premium floor</span>
      )}
      <span className="sw"><span className="chip taken" /> Occupied</span>
      <span className="sw" style={{ marginLeft: "auto" }}>
        Prices {furnished ? "furnished" : "unfurnished"} · {furnished ? "incl. furniture" : "set furnishing & term above"}
      </span>
    </div>
  );

  // ── Real traced plan ───────────────────────────────────────────────
  if (traced) {
    const byCode = new Map(offices.map((o) => [o.code, o]));

    return (
      <div className="plan-shell">
        <div className={`plan traced floor-${offices[0]?.floorId ?? ""}`}>
          <svg viewBox={traced.vb} role="img" aria-label="Floor plan">
            <polygon className="plan-fill" points={traced.fill} />

            {traced.fixed.map((f, i) => {
              const cx = f.x + f.w / 2;
              const cy = f.y + f.h / 2;
              return (
                <g key={`fixed-${i}`} className={`plan-fixed ${f.kind}`}>
                  <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={7} />
                  <text className="ff-label" x={cx} y={cy - 2} textAnchor="middle">{f.label}</text>
                  {f.sub && <text className="ff-sub" x={cx} y={cy + 16} textAnchor="middle">{f.sub}</text>}
                </g>
              );
            })}

            {Object.entries(traced.rooms).map(([code, r]) => {
              const o = byCode.get(code);
              if (!o) return null;
              const price = officeListPrice(o.rate, false, cfg) * termFactor;
              const isSel = selected.has(o.slug);
              const cx = r.x + r.w / 2;
              const cy = r.y + r.h / 2;
              const cls = `room${o.premium ? " prem" : ""}${o.taken ? " taken" : ""}${isSel ? " sel" : ""}`;
              return (
                <g
                  key={o.slug}
                  className={cls}
                  onClick={() => !o.taken && onToggle(o.slug)}
                  aria-label={`${o.code} ${o.taken ? "occupied" : money(price) + " per month"}${isSel ? " (selected)" : ""}`}
                >
                  {r.points ? (
                    <polygon points={r.points} />
                  ) : (
                    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={7} />
                  )}
                  {isSel && (
                    <g>
                      <circle cx={r.x + r.w - 18} cy={r.y + 18} r={9} className="sel-dot" />
                      <path
                        d={`M ${r.x + r.w - 22} ${r.y + 18} l 3 3 l 5 -6`}
                        className="sel-check"
                        fill="none"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  )}
                  <text className="code" x={cx} y={cy - 10} textAnchor="middle">{o.code}</text>
                  <text className="rent" x={cx} y={cy + 9} textAnchor="middle">{o.sqft} SF</text>
                  <text className="rent" x={cx} y={cy + 26} textAnchor="middle">
                    {o.taken ? "Occupied" : `${money(price)}/mo`}
                  </text>
                </g>
              );
            })}

            {traced.walls.map((pts, i) => (
              <polyline key={`wall-${i}`} className="bldg-outline" points={pts} fill="none" />
            ))}
          </svg>
        </div>
        {legend}
      </div>
    );
  }

  // ── Fallback: schematic placeholder grid ───────────────────────────
  const corridorY = PAD + ROOM_H;

  return (
    <div className="plan-shell">
      <span className="watermark">Placeholder plan</span>
      <div className="plan">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Floor plan">
          <rect className="bldg-outline" x={4} y={4} width={width - 8} height={height - 8} rx={10} />
          <rect className="corridor" x={PAD} y={corridorY} width={width - PAD * 2} height={CORRIDOR_H} rx={6} />
          {rects.map(({ o, x, y, w, h }) => {
            const price = officeListPrice(o.rate, false, cfg) * termFactor; // o.rate is already the furnishing-resolved base
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
      {legend}
    </div>
  );
}
