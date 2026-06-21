"use client";

import { useRouter } from "next/navigation";
import { PropertyForm } from "@/features/property/components/property-form";
import { useCreateProperty } from "@/features/property/hooks/use-create-property";
import { CreatePropertyRequest } from "@/features/property/types/property-request";

export default function CreatePropertyPage() {
  const router = useRouter();
  const { createProperty, isLoading } = useCreateProperty();

  const handleSubmit = async (data: CreatePropertyRequest) => {
    const result = await createProperty(data);
    router.push(`/dashboard/properties/${result.propertyId}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Create Property
        </h1>
        <p className="text-sm text-gray-500">
          Add a new property to your portfolio
        </p>
      </div>

      <PropertyForm onSubmit={handleSubmit} loading={isLoading} />
    </div>
  );
}
