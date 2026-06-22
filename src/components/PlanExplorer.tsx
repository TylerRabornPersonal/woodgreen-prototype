"use client";

import { useState } from "react";
import FloorPlan from "./FloorPlan";
import type { Floor, Office } from "@/lib/inventory";

export default function PlanExplorer({
  floors,
  officesByFloor,
}: {
  floors: Floor[];
  officesByFloor: Record<string, Office[]>;
}) {
  const [active, setActive] = useState(floors[0]?.id);
  const floor = floors.find((f) => f.id === active) ?? floors[0];

  return (
    <div>
      <div className="switcher">
        {floors.map((f) => (
          <button key={f.id} className={f.id === active ? "on" : ""} onClick={() => setActive(f.id)}>
            {f.short}
          </button>
        ))}
      </div>
      <FloorPlan offices={officesByFloor[floor.id] ?? []} />
    </div>
  );
}
