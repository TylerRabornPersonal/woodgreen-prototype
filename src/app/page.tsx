import { getFloors, getOfficesByFloor } from "@/lib/data";
import PlanExplorer from "@/components/PlanExplorer";
import type { Office } from "@/lib/inventory";

export default async function HomePage() {
  const floors = await getFloors();
  const entries = await Promise.all(
    floors.map(async (f) => [f.id, await getOfficesByFloor(f.id)] as const),
  );
  const officesByFloor: Record<string, Office[]> = Object.fromEntries(entries);

  return (
    <div className="wrap page">
      <h2 className="section">Select your offices</h2>
      <p className="lead">
        Browse the building floor by floor and select the offices you want — pick as many as you
        like across any floor, then press Continue to choose your term and furnishing and add
        shared rooms. Multi-office and term discounts apply automatically.
      </p>
      <PlanExplorer floors={floors} officesByFloor={officesByFloor} />
      <p className="placeholder-note">
        Floor plans shown are schematic placeholders. Real plan geometry drops in without changing
        the selection flow.
      </p>
    </div>
  );
}
