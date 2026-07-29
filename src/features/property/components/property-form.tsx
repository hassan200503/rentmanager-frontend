import { Path, useForm } from "react-hook-form";
import { CreatePropertyRequest } from "../types/property-request";
import { PropertyType } from "../types/property";
import {
  PropertyFormValues,
  propertySchema,
} from "../validations/property-schema";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  MapPin,
  Ruler,
  ImagePlus,
  X,
  Loader2,
} from "lucide-react";

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

function SectionHeader({
                         icon: Icon,
                         title,
                         description,
                       }: {
  icon: typeof Building2;
  title: string;
  description?: string;
}) {
  return (
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink/[0.05]">
          <Icon className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink leading-tight">{title}</h3>
          {description && (
              <p className="text-xs text-ink-muted leading-tight mt-0.5">{description}</p>
          )}
        </div>
      </div>
  );
}

export const PropertyForm = ({
                               onSubmit,
                               loading = false,
                               submitLabel = "Save",
                             }: PropertyFormProps) => {
  const imageFileRef = useRef<File | undefined>(undefined);
  // Added for parity with UnitForm's "filename feedback on image selection" fix —
  // upload previously gave no visual confirmation that a file was selected.
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleRemoveImage = () => {
    imageFileRef.current = undefined;
    setSelectedFileName(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    const input = document.getElementById("property-image-upload") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  // Revoke the object URL on unmount / when replaced, so we don't leak
  // blob URLs as the user swaps images before submitting.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
      <form onSubmit={submit} className="space-y-8">
        {/* Basic info */}
        <div>
          <SectionHeader icon={Building2} title="Basic information" />
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

            <label className="block space-y-1 md:col-span-2">
              <span className="form-label">Description</span>
              <textarea
                  className="form-input min-h-[100px]"
                  placeholder="Short property description"
                  {...register("description")}
              />
            </label>
          </div>
        </div>

        {/* Address + GeoLocation */}
        <div className="border-t border-ink/10 pt-8">
          <SectionHeader
              icon={MapPin}
              title="Location"
              description="Where the property is physically located"
          />
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

          <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t border-dashed border-ink/10">
            <label className="space-y-1">
              <span className="form-label">Latitude</span>
              <input
                  className="form-input font-data"
                  type="number"
                  step="0.0000001"
                  placeholder="-1.2921"
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
                  placeholder="36.8219"
                  {...register("geoLocation.longitude", { valueAsNumber: true })}
              />
              {errors.geoLocation?.longitude && (
                  <span className="text-xs text-danger">
                {errors.geoLocation.longitude.message}
              </span>
              )}
            </label>
          </div>
        </div>

        {/* Dimensions */}
        <div className="border-t border-ink/10 pt-8">
          <SectionHeader
              icon={Ruler}
              title="Dimensions"
              description="Total floor area and unit count"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1">
              <span className="form-label">Total Area (m²)</span>
              <input
                  className="form-input font-data"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("dimensions.totalArea", { valueAsNumber: true })}
              />
              {errors.dimensions?.totalArea && (
                  <span className="text-xs text-danger">
                {errors.dimensions.totalArea.message}
              </span>
              )}
            </label>

            <label className="space-y-1">
              <span className="form-label">Occupied Area (m²)</span>
              <input
                  className="form-input font-data"
                  type="number"
                  step="0.01"
                  min="0"
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
                  min="0"
                  {...register("dimensions.unitCount", { valueAsNumber: true })}
              />
              {errors.dimensions?.unitCount && (
                  <span className="text-xs text-danger">
                {errors.dimensions.unitCount.message}
              </span>
              )}
            </label>
          </div>
        </div>

        {/* Image Upload */}
        <div className="border-t border-ink/10 pt-8">
          <SectionHeader icon={ImagePlus} title="Property photo" />

          <input
              type="file"
              accept="image/*"
              className="hidden"
              id="property-image-upload"
              onChange={handleImageChange}
          />

          {previewUrl ? (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={previewUrl}
                    alt="Selected property"
                    className="h-20 w-20 rounded-lg object-cover border border-ink/10"
                />
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate max-w-[240px]">{selectedFileName}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button
                        type="button"
                        className="text-xs font-medium text-brand dark:text-brand-300 hover:underline"
                        onClick={() => document.getElementById("property-image-upload")?.click()}
                    >
                      Change
                    </button>
                    <button
                        type="button"
                        className="text-xs font-medium text-danger inline-flex items-center gap-1 hover:underline"
                        onClick={handleRemoveImage}
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
          ) : (
              <button
                  type="button"
                  onClick={() => document.getElementById("property-image-upload")?.click()}
                  className="flex flex-col items-center justify-center gap-2 w-full rounded-lg border border-dashed border-ink/15 bg-ink/[0.015] py-8 text-center hover:bg-ink/[0.03] hover:border-ink/25 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.05]">
                  <ImagePlus className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                </div>
                <span className="text-sm font-medium text-ink">Click to upload a photo</span>
                <span className="text-xs text-ink-muted">PNG or JPG</span>
              </button>
          )}
        </div>

        {/* Submit */}
        <div className="border-t border-ink/10 pt-6">
          <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full inline-flex items-center justify-center gap-2 ${loading ? "opacity-60" : ""}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {loading ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
  );
};