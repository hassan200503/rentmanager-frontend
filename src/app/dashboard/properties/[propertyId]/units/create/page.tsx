"use client";

import { useRouter, useParams } from "next/navigation";
import { useCreateUnit } from "@/features/unit/hooks/use-create-unit";
import { UnitForm } from "@/features/unit/components/unit-form";
import Loading from "@/app/loading";

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
    // Simple error display; Next.js will handle full error boundaries elsewhere
    return (
      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Error</h2>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
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
