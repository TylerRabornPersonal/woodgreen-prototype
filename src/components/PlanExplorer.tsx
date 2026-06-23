"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FloorPlan from "./FloorPlan";
import type { Floor, Office } from "@/lib/inventory";
import { officeListPrice, money } from "@/lib/engine";

export default function PlanExplorer({
  floors,
  officesByFloor,
}: {
  floors: Floor[];
  officesByFloor: Record<string, Office[]>;
}) {
  const router = useRouter();
  const [active, setActive] = useState(floors[0]?.id);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const floor = floors.find((f) => f.id === active) ?? floors[0];
  const allOffices = useMemo(() => Object.values(officesByFloor).flat(), [officesByFloor]);

  const toggle = (slug: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });

  const chosen = allOffices.filter((o) => selected.has(o.slug));
  const runningTotal = chosen.reduce((sum, o) => sum + officeListPrice(o.rate, false), 0);

  const continueToConfigure = () => {
    if (!chosen.length) return;
    router.push(`/configure?offices=${chosen.map((o) => o.slug).join(",")}`);
  };

  return (
    <div>
      <div className="switcher">
        {floors.map((f) => (
          <button key={f.id} className={f.id === active ? "on" : ""} onClick={() => setActive(f.id)}>
            {f.short}
          </button>
        ))}
      </div>

      <FloorPlan offices={officesByFloor[floor.id] ?? []} selected={selected} onToggle={toggle} />

      {/* sticky selection bar */}
      <div className={`selbar${chosen.length ? " active" : ""}`}>
        <div className="wrap selbar-inner">
          {chosen.length === 0 ? (
            <span className="selbar-empty">No offices selected yet. Click rooms on any floor to build your package.</span>
          ) : (
            <>
              <div className="selbar-count">
                <strong>{chosen.length}</strong> office{chosen.length > 1 ? "s" : ""} selected
                <span className="selbar-codes">{chosen.map((o) => o.code).join(" · ")}</span>
              </div>
              <div className="selbar-total">
                <span className="k">List total</span>
                <span className="v">{money(runningTotal)}/mo</span>
              </div>
              <button className="btn btn-pop" onClick={continueToConfigure}>Continue →</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
