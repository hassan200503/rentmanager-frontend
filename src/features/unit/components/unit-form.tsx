"use client";

import { Path, useForm } from "react-hook-form";
import { UnitStatus } from "../types/unit";
import { CreateUnitRequest } from "../types/unit-request";
import { UnitFormValues, unitSchema } from "../validations/unit-schema";

type UnitFormProps = {
  propertyId: string;
  defaultValues?: Partial<UnitFormValues>;
  onSubmit: (data: CreateUnitRequest) => Promise<void> | void;
  loading?: boolean;
  submitLabel?: string;
};

const emptyValues = (propertyId: string): UnitFormValues => ({
  propertyId,
  unitNumber: "",
  status: UnitStatus.VACANT,
  monthlyRent: 0,
  depositAmount: 0,
  bedrooms: 0,
  bathrooms: 0,
  squareFootage: undefined,
  description: "",
  imageUrl: "",
});

export const UnitForm = ({
  propertyId,
  defaultValues,
  onSubmit,
  loading = false,
  submitLabel = "Save",
}: UnitFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UnitFormValues>({
    defaultValues: { ...emptyValues(propertyId), ...defaultValues },
  });

  const submit = handleSubmit(async (values) => {
    const parsed = unitSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        setError(issue.path.join(".") as Path<UnitFormValues>, {
          type: "manual",
          message: issue.message,
        });
      });
      return;
    }

    return onSubmit(parsed.data as CreateUnitRequest);
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview only — real upload is handled after creation via useUploadUnitImageMutation
    const previewUrl = URL.createObjectURL(file);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setValue("imageUrl", previewUrl);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Basic info */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Unit Number</span>
          <input
            className="input-field"
            placeholder="A-101"
            {...register("unitNumber")}
          />
          {errors.unitNumber && (
            <span className="text-xs text-danger">
              {errors.unitNumber.message}
            </span>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Status</span>
          <select className="input-field" {...register("status")}>
            {Object.values(UnitStatus).map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          {errors.status && (
            <span className="text-xs text-danger">{errors.status.message}</span>
          )}
        </label>
      </div>

      {/* Pricing */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">
            Monthly Rent (KES)
          </span>
          <input
            className="input-field"
            type="number"
            step="1"
            placeholder="25000"
            {...register("monthlyRent", { valueAsNumber: true })}
          />
          {errors.monthlyRent && (
            <span className="text-xs text-danger">
              {errors.monthlyRent.message}
            </span>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">
            Deposit Amount (KES)
          </span>
          <input
            className="input-field"
            type="number"
            step="1"
            placeholder="50000"
            {...register("depositAmount", { valueAsNumber: true })}
          />
          {errors.depositAmount && (
            <span className="text-xs text-danger">
              {errors.depositAmount.message}
            </span>
          )}
        </label>
      </div>

      {/* Configuration */}
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Bedrooms</span>
          <input
            className="input-field"
            type="number"
            min="0"
            {...register("bedrooms", { valueAsNumber: true })}
          />
          {errors.bedrooms && (
            <span className="text-xs text-danger">
              {errors.bedrooms.message}
            </span>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Bathrooms</span>
          <input
            className="input-field"
            type="number"
            min="0"
            {...register("bathrooms", { valueAsNumber: true })}
          />
          {errors.bathrooms && (
            <span className="text-xs text-danger">
              {errors.bathrooms.message}
            </span>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">
            Square Footage
          </span>
          <input
            className="input-field"
            type="number"
            step="0.01"
            placeholder="Optional"
            {...register("squareFootage", { valueAsNumber: true })}
          />
          {errors.squareFootage && (
            <span className="text-xs text-danger">
              {errors.squareFootage.message}
            </span>
          )}
        </label>
      </div>

      {/* Description */}
      <label className="block space-y-1">
        <span className="text-sm font-medium text-gray-700">Description</span>
        <textarea
          className="input-field min-h-[100px]"
          placeholder="Short unit description"
          {...register("description")}
        />
      </label>

      {/* Image Upload */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Unit Image</span>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="unit-image-upload"
            onChange={handleImageChange}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              document.getElementById("unit-image-upload")?.click()
            }
          >
            Upload Image
          </button>
        </div>
        {errors.imageUrl && (
          <span className="text-xs text-danger">{errors.imageUrl.message}</span>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`btn-primary w-full ${loading ? "opacity-60" : ""}`}
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
};
