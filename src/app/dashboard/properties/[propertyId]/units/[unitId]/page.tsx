"use client";

import { useRouter, useParams } from "next/navigation";
import { useUnit } from "@/features/unit/hooks/use-unit";
import { UnitDetails } from "@/features/unit/components/unit-details";
import Loading from "@/app/loading";

export default function UnitDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const unitId = params.unitId as string;

  const { unit, isLoading, error } = useUnit(unitId);

  if (isLoading) return <Loading />;
  if (error) {
    // Simple error display; Next.js will handle full error boundaries elsewhere
    return (
      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Error</h2>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }
  if (!unit) {
    // navigate back to the units list for the property
    router.replace(`/dashboard/properties/${propertyId}/units`);
    return null;
  }

  return (
    <div className="p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Unit Details</h1>
      <UnitDetails unit={unit} />
    </div>
  );
}
