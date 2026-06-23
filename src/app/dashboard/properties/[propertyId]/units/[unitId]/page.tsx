import { redirect } from "next/navigation";
import { useRouter, useParams } from "next/navigation";
import { useUnit } from "@/features/unit/hooks/use-unit";
import { UnitDetails } from "@/features/unit/components/unit-details";
import { Loading } from "@/app/loading";
import { ErrorBoundary } from "@/app/error";

export default function UnitDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const unitId = params.unitId as string;

  const { unit, isLoading, error } = useUnit(unitId);

  if (isLoading) return <Loading />;
  if (error) return <ErrorBoundary error={error} />;
  if (!unit) return redirect(`/dashboard/properties/${propertyId}/units`);

  return (
    <div className="p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Unit Details</h1>
      <UnitDetails unit={unit} />
    </div>
  );
}
