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
      <h2 className="section">Find your office</h2>
      <p className="lead">
        Browse the building floor by floor. Click any available room to see details, choose your
        term and furnishing, add storage or a conference room, and reserve it — multi-office and
        term discounts apply automatically.
      </p>
      <PlanExplorer floors={floors} officesByFloor={officesByFloor} />
      <p className="placeholder-note">
        Floor plans shown are schematic placeholders. Real plan geometry drops in without changing
        the selection flow.
      </p>
    </div>
  );
}
