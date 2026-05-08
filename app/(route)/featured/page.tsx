import { FeaturedUnitList } from "@/components/featured-unit";
import { getAllUnits } from "@/actions/featured-action";

export default async function FeaturedPage() {
  const initialData = await getAllUnits();

  return (
    <div className="w-full px-2">
      <h1 className="text-2xl font-bold mb-6">Featured Property Management</h1>
      <FeaturedUnitList initialData={initialData} />
    </div>
  );
}
