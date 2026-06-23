"use client";

import { useRouter, useParams } from "next/navigation";
import { useCreateUnit } from "@/features/unit/hooks/use-create-unit";
import { UnitForm } from "@/features/unit/components/unit-form";
import Loading from "@/app/loading";
import { ErrorBoundary } from "@/app/error";

export default function CreateUnitPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;

  const { createUnit, isLoading, error } = useCreateUnit();

  const handleSubmit = async (data: any) => {
    const result = await createUnit({ propertyId, ...data });
    if (result?.unitId) {
      router.push(
        `/dashboard/properties/${propertyId}/units/${result.unitId}`
      );
    }
  };

  if (error) {
    return <ErrorBoundary error={error} />;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Add New Unit</h1>
      <UnitForm
        onSubmit={handleSubmit}
        loading={isLoading}
        submitLabel="Create Unit"
      />
    </div>
  );
}
