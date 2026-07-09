import { Path, useForm } from "react-hook-form";
import { CreatePropertyRequest } from "../types/property-request";
import { PropertyType } from "../types/property";
import {
  PropertyFormValues,
  propertySchema,
} from "../validations/property-schema";
import { useRef, useState } from "react";

type PropertyFormProps = {
  onSubmit: (data: CreatePropertyRequest, imageFile?: File) => Promise<void> | void;
  loading?: boolean;
  submitLabel?: string;
};

const defaultValues: PropertyFormValues = {
  name: "",
  propertyType: PropertyType.APARTMENT,
  description: "",
  address: {
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Kenya",
  },
  geoLocation: {
    latitude: 0,
    longitude: 0,
  },
  dimensions: {
    totalArea: 1,
    occupiedArea: 0,
    unitCount: 0,
  },
};

export const PropertyForm = ({
                               onSubmit,
                               loading = false,
                               submitLabel = "Save",
                             }: PropertyFormProps) => {
  const imageFileRef = useRef<File | undefined>(undefined);
  // Added for parity with UnitForm's "filename feedback on image selection" fix —
  // upload previously gave no visual confirmation that a file was selected.
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PropertyFormValues>({ defaultValues });

  // eslint-disable-next-line react-hooks/refs
  const submit = handleSubmit(async (values) => {
    const parsed = propertySchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        setError(issue.path.join(".") as Path<PropertyFormValues>, {
          type: "manual",
          message: issue.message,
        });
      });
      return;
    }

    return onSubmit(parsed.data, imageFileRef.current);
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    imageFileRef.current = file;
    setSelectedFileName(file.name);
  };

  return (
      <form onSubmit={submit} className="space-y-6">
        {/* Basic info */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="form-label">Name</span>
            <input
                className="form-input"
                placeholder="Green Villa"
                {...register("name")}
            />
            {errors.name && (
                <span className="text-xs text-danger">{errors.name.message}</span>
            )}
          </label>

          <label className="space-y-1">
            <span className="form-label">Type</span>
            <select className="form-input" {...register("propertyType")}>
              {Object.values(PropertyType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
              ))}
            </select>
          </label>
        </div>

        {/* Description */}
        <label className="block space-y-1">
          <span className="form-label">Description</span>
          <textarea
              className="form-input min-h-[100px]"
              placeholder="Short property description"
              {...register("description")}
          />
        </label>

        {/* Address */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="form-label">Street Address</span>
            <input className="form-input" {...register("address.streetAddress")} />
            {errors.address?.streetAddress && (
                <span className="text-xs text-danger">
              {errors.address.streetAddress.message}
            </span>
            )}
          </label>

          <label className="space-y-1">
            <span className="form-label">City</span>
            <input className="form-input" {...register("address.city")} />
            {errors.address?.city && (
                <span className="text-xs text-danger">
              {errors.address.city.message}
            </span>
            )}
          </label>

          <label className="space-y-1">
            <span className="form-label">State</span>
            <input className="form-input" {...register("address.state")} />
            {/* Was previously missing while every other address field rendered its error —
                added for consistency; harmless if the schema never populates this path. */}
            {errors.address?.state && (
                <span className="text-xs text-danger">
              {errors.address.state.message}
            </span>
            )}
          </label>

          <label className="space-y-1">
            <span className="form-label">Postal Code</span>
            <input className="form-input" {...register("address.postalCode")} />
            {errors.address?.postalCode && (
                <span className="text-xs text-danger">
              {errors.address.postalCode.message}
            </span>
            )}
          </label>

          <label className="space-y-1">
            <span className="form-label">Country</span>
            <input className="form-input" {...register("address.country")} />
            {errors.address?.country && (
                <span className="text-xs text-danger">
              {errors.address.country.message}
            </span>
            )}
          </label>
        </div>

        {/* GeoLocation */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="form-label">Latitude</span>
            <input
                className="form-input font-data"
                type="number"
                step="0.0000001"
                {...register("geoLocation.latitude", { valueAsNumber: true })}
            />
            {errors.geoLocation?.latitude && (
                <span className="text-xs text-danger">
              {errors.geoLocation.latitude.message}
            </span>
            )}
          </label>

          <label className="space-y-1">
            <span className="form-label">Longitude</span>
            <input
                className="form-input font-data"
                type="number"
                step="0.0000001"
                {...register("geoLocation.longitude", { valueAsNumber: true })}
            />
            {errors.geoLocation?.longitude && (
                <span className="text-xs text-danger">
              {errors.geoLocation.longitude.message}
            </span>
            )}
          </label>
        </div>

        {/* Dimensions */}
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <span className="form-label">Total Area</span>
            <input
                className="form-input font-data"
                type="number"
                step="0.01"
                {...register("dimensions.totalArea", { valueAsNumber: true })}
            />
            {errors.dimensions?.totalArea && (
                <span className="text-xs text-danger">
              {errors.dimensions.totalArea.message}
            </span>
            )}
          </label>

          <label className="space-y-1">
            <span className="form-label">Occupied Area</span>
            <input
                className="form-input font-data"
                type="number"
                step="0.01"
                {...register("dimensions.occupiedArea", { valueAsNumber: true })}
            />
            {errors.dimensions?.occupiedArea && (
                <span className="text-xs text-danger">
              {errors.dimensions.occupiedArea.message}
            </span>
            )}
          </label>

          <label className="space-y-1">
            <span className="form-label">Unit Count</span>
            <input
                className="form-input font-data"
                type="number"
                {...register("dimensions.unitCount", { valueAsNumber: true })}
            />
            {errors.dimensions?.unitCount && (
                <span className="text-xs text-danger">
              {errors.dimensions.unitCount.message}
            </span>
            )}
          </label>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <span className="form-label">Property Image</span>
          <div className="flex items-center gap-3">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                id="property-image-upload"
                onChange={handleImageChange}
            />
            <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                    document.getElementById("property-image-upload")?.click()
                }
            >
              Upload Image
            </button>
            {selectedFileName && (
                <span className="text-sm text-ink-muted truncate max-w-[200px]">
              {selectedFileName}
            </span>
            )}
          </div>
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