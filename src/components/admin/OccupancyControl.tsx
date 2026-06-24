"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_OCCUPANCY,
  OCCUPANCY_PRESETS,
  loadOccupancy,
  saveOccupancy,
  occupancyLabel,
  type Occupancy,
} from "@/lib/occupancy";

/** Reads the shared demo-occupancy setting and keeps in sync across the console. */
export function useOccupancy(): [Occupancy, (o: Occupancy) => void] {
  const [occ, setOcc] = useState<Occupancy>(DEFAULT_OCCUPANCY);
  useEffect(() => {
    setOcc(loadOccupancy());
    const refresh = () => setOcc(loadOccupancy());
    window.addEventListener("wg-occupancy", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("wg-occupancy", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const set = (o: Occupancy) => {
    saveOccupancy(o);
    setOcc(o);
  };
  return [occ, set];
}

/** Segmented control to set the building's demo occupancy. */
export function OccupancyControl({ occ, onChange, label = "Demo occupancy" }: { occ: Occupancy; onChange: (o: Occupancy) => void; label?: string }) {
  return (
    <div className="occ-control">
      <span className="occ-control-label">{label}</span>
      <span className="seg seg-xs">
        {OCCUPANCY_PRESETS.map((v) => (
          <button key={v} className={occ === v ? "on" : ""} onClick={() => onChange(v)}>
            {occupancyLabel(v)}
          </button>
        ))}
      </span>
    </div>
  );
}
