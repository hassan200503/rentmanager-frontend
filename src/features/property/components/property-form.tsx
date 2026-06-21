import { Path, useForm } from "react-hook-form";
import { CreatePropertyRequest } from "../types/property-request";
import { PropertyType } from "../types/property";
import {
  PropertyFormValues,
  propertySchema,
} from "../validations/property-schema";
import { propertyApi } from "../api/property-api";

type PropertyFormProps = {
  onSubmit: (data: CreatePropertyRequest) => Promise<void> | void;
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
  imageUrl: "",
};

export const PropertyForm = ({
  onSubmit,
  loading = false,
  submitLabel = "Save",
}: PropertyFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PropertyFormValues>({ defaultValues });

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

    return onSubmit(parsed.data);
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple preview – real upload should be handled by the caller after creation.
    const previewUrl = URL.createObjectURL(file);
    // Set preview URL into the form (imageUrl field)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setValue("imageUrl", previewUrl);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Basic info */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Name</span>
          <input
            className="input-field"
            placeholder="Green Villa"
            {...register("name")}
          />
          {errors.name && (
            <span className="text-xs text-danger">{errors.name.message}</span>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Type</span>
          <select className="input-field" {...register("propertyType")}>
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
        <span className="text-sm font-medium text-gray-700">
          Description
        </span>
        <textarea
          className="input-field min-h-[100px]"
          placeholder="Short property description"
          {...register("description")}
        />
      </label>

      {/* Address */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">
            Street Address
          </span>
          <input className="input-field" {...register("address.streetAddress")} />
          {errors.address?.streetAddress && (
            <span className="text-xs text-danger">
              {errors.address.streetAddress.message}
            </span>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">City</span>
          <input className="input-field" {...register("address.city")} />
          {errors.address?.city && (
            <span className="text-xs text-danger">
              {errors.address.city.message}
            </span>
          )}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">State</span>
          <input className="input-field" {...register("address.state")} />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Postal Code</span>
          <input className="input-field" {...register("address.postalCode")} />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Country</span>
          <input className="input-field" {...register("address.country")} />
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
          <span className="text-sm font-medium text-gray-700">Latitude</span>
          <input
            className="input-field"
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
          <span className="text-sm font-medium text-gray-700">Longitude</span>
          <input
            className="input-field"
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
          <span className="text-sm font-medium text-gray-700">Total Area</span>
          <input
            className="input-field"
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
          <span className="text-sm font-medium text-gray-700">
            Occupied Area
          </span>
          <input
            className="input-field"
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
          <span className="text-sm font-medium text-gray-700">Unit Count</span>
          <input
            className="input-field"
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
        <span className="text-sm font-medium text-gray-700">
          Property Image
        </span>
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
