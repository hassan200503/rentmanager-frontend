"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { useUnit } from "@/features/unit/hooks/use-unit";
import { UnitDetails } from "@/features/unit/components/unit-details";
import Loading from "@/app/loading";

export default function UnitDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const unitId = params.unitId as string;

  const { data: unit, isLoading, error } = useUnit(unitId);

  useEffect(() => {
    if (!isLoading && !error && !unit) {
      router.replace(`/dashboard/properties/${propertyId}/units`);
    }
  }, [isLoading, error, unit, router, propertyId]);

  if (isLoading) return <Loading />;
  if (error) {
    return (
        <div className="p-6 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p className="text-red-600">{error.message}</p>
        </div>
    );
  }
  if (!unit) return null;

  return (
      <div className="p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-semibold mb-4">Unit Details</h1>
        <UnitDetails unit={unit} />
      </div>
  );
}