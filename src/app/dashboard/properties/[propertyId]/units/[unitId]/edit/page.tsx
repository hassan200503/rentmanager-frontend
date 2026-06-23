import { redirect } from "next/navigation";
import { useRouter, useParams } from "next/navigation";
import { useUnit } from "@/features/unit/hooks/use-unit";
import { useUpdateUnit } from "@/features/unit/hooks/use-update-unit";
import { UnitForm } from "@/features/unit/components/unit-form";
import { Loading } from "@/app/loading";
import { ErrorBoundary } from "@/app/error";

export default function EditUnitPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const unitId = params.unitId as string;

  const { unit, isLoading: loadingUnit, error: errorUnit } = useUnit(unitId);
  const { updateUnit, isLoading: loadingUpdate, error: errorUpdate } = useUpdateUnit();

  if (loadingUnit) return <Loading />;
  if (errorUnit) return <ErrorBoundary error={errorUnit} />;
  if (!unit) return redirect(`/dashboard/properties/${propertyId}/units`);

  const handleSubmit = async (data: any) => {
    await updateUnit({ id: unitId, payload: data });
    router.push(`/dashboard/properties/${propertyId}/units/${unitId}`);
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Edit Unit</h1>
      <UnitForm
        defaultValues={unit}
        onSubmit={handleSubmit}
        loading={loadingUpdate}
        submitLabel="Update Unit"
      />
    </div>
  );
}
