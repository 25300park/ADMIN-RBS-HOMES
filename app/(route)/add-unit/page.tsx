import { getUnitForEdit } from "@/actions/add-unit-action";
import UnifiedAdminForm from "./form";

interface AddUnitPageProps {
  searchParams: {
    id?: string;
  };
}

export default async function AddUnitPage({ searchParams }: AddUnitPageProps) {
  const unitId = searchParams?.id ? parseInt(searchParams.id) : null;
  let initialData = null;

  if (unitId) {
    initialData = await getUnitForEdit(unitId);
  }

  return (
    <div>
      <UnifiedAdminForm initialData={initialData} />
    </div>
  );
}