"use client";

import { useRouter } from "next/navigation";
import { PropertyForm } from "@/features/property/components/property-form";
import { useCreateProperty } from "@/features/property/hooks/use-create-property";
import { CreatePropertyRequest } from "@/features/property/types/property-request";
import { propertyMediaApi } from "@/features/property/api/property-media-api";
import { toast } from "sonner";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export default function CreatePropertyPage() {
  const router = useRouter();
  const { createProperty, isLoading } = useCreateProperty();

  const handleSubmit = async (data: CreatePropertyRequest, imageFile?: File) => {
    const result = await createProperty(data);

    if (imageFile && result.propertyId) {
      try {
        await propertyMediaApi.upload(result.propertyId, imageFile, true);
        toast.success("Property photo uploaded successfully");
      } catch (error) {
        toast.error(
            getProcessErrorMessage(error, "Property was created, but photo upload failed.")
        );
      }
    }

    router.push(`/dashboard/properties/${result.propertyId}`);
  };

  return (
      <div className="page-container max-w-3xl">
        <button
            onClick={() => router.push("/dashboard/properties")}
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to properties
        </button>

        <div className="mb-6 animate-fade-in-up">
          <h1 className="page-title mb-1">Create property</h1>
          <p className="page-subtitle mb-0">Add a new property to your portfolio</p>
        </div>

        <div className="card animate-fade-in-up">
          <PropertyForm onSubmit={handleSubmit} loading={isLoading} />
        </div>
      </div>
  );
}