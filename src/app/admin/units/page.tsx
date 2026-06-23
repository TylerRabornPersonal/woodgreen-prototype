"use client";

import { useState } from "react";
import { units, floorLabels } from "@/lib/admin/mock";

const FLOORS = Object.keys(floorLabels);

export default function UnitsPage() {
  const [status, setStatus] = useState<"all" | "leased" | "available">("all");
  const [floor, setFloor] = useState<string>("all");

  const filtered = units.filter(
    (u) => (status === "all" || u.status === status) && (floor === "all" || u.floorId === floor),
  );
  const leased = units.filter((u) => u.status === "leased").length;

  return (
    <div>
      <header className="portal-head">
        <div>
          <h1 className="portal-h1">Units</h1>
          <p className="portal-sub">{leased} leased · {units.length - leased} available · {units.length} total offices</p>
        </div>
      </header>

      <div className="filters">
        <div className="filter-group">
          {(["all", "leased", "available"] as const).map((s) => (
            <button key={s} className={`chip${status === s ? " on" : ""}`} onClick={() => setStatus(s)}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <button className={`chip${floor === "all" ? " on" : ""}`} onClick={() => setFloor("all")}>All floors</button>
          {FLOORS.map((f) => (
            <button key={f} className={`chip${floor === f ? " on" : ""}`} onClick={() => setFloor(f)}>{floorLabels[f]}</button>
          ))}
        </div>
      </div>

      <div className="unit-grid">
        {filtered.map((u) => (
          <div key={u.slug} className={`unit ${u.status}`}>
            <div className="unit-top">
              <span className="unit-code">{u.code}</span>
              <span className={`unit-badge ${u.status}`}>{u.status}</span>
            </div>
            <div className="unit-meta">{floorLabels[u.floorId]} · {u.sqft} SF</div>
            <div className="unit-tenant">{u.tenant ?? "—"}</div>
          </div>
        ))}
        {filtered.length === 0 && <p className="portal-note">No units match these filters.</p>}
      </div>
    </div>
  );
}
