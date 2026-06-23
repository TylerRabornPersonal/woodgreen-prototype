import { getFloors, getOfficesByFloor, getAddOns } from "@/lib/data";
import HomeExperience from "@/components/HomeExperience";
import type { Office } from "@/lib/inventory";

export default async function HomePage() {
  const [floors, addOns] = await Promise.all([getFloors(), getAddOns()]);
  const entries = await Promise.all(
    floors.map(async (f) => [f.id, await getOfficesByFloor(f.id)] as const),
  );
  const officesByFloor: Record<string, Office[]> = Object.fromEntries(entries);

  return <HomeExperience floors={floors} officesByFloor={officesByFloor} addOns={addOns} />;
}
