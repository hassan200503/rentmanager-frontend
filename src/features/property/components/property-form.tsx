import { Path, useForm } from "react-hook-form";
import { CreatePropertyRequest } from "../types/property-request";
import { PropertyType } from "../types/property";
import { PropertyFormValues, propertySchema } from "../validations/property-schema";

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

    const submit = handleSubmit((values) => {
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

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                    <span className="text-sm font-medium">Name</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        placeholder="Green Villa"
                        {...register("name")}
                    />
                    {errors.name && (
                        <span className="text-xs text-red-600">{errors.name.message}</span>
                    )}
                </label>

                <label className="space-y-1">
                    <span className="text-sm font-medium">Type</span>
                    <select
                        className="w-full rounded border px-3 py-2"
                        {...register("propertyType")}
                    >
                        {Object.values(PropertyType).map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <label className="block space-y-1">
                <span className="text-sm font-medium">Description</span>
                <textarea
                    className="min-h-24 w-full rounded border px-3 py-2"
                    placeholder="Short property description"
                    {...register("description")}
                />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                    <span className="text-sm font-medium">Street Address</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        {...register("address.streetAddress")}
                    />
                    {errors.address?.streetAddress && (
                        <span className="text-xs text-red-600">
                            {errors.address.streetAddress.message}
                        </span>
                    )}
                </label>

                <label className="space-y-1">
                    <span className="text-sm font-medium">City</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        {...register("address.city")}
                    />
                    {errors.address?.city && (
                        <span className="text-xs text-red-600">
                            {errors.address.city.message}
                        </span>
                    )}
                </label>

                <label className="space-y-1">
                    <span className="text-sm font-medium">State</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        {...register("address.state")}
                    />
                </label>

                <label className="space-y-1">
                    <span className="text-sm font-medium">Postal Code</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        {...register("address.postalCode")}
                    />
                </label>

                <label className="space-y-1">
                    <span className="text-sm font-medium">Country</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        {...register("address.country")}
                    />
                    {errors.address?.country && (
                        <span className="text-xs text-red-600">
                            {errors.address.country.message}
                        </span>
                    )}
                </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                    <span className="text-sm font-medium">Latitude</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        type="number"
                        step="0.0000001"
                        {...register("geoLocation.latitude", { valueAsNumber: true })}
                    />
                    {errors.geoLocation?.latitude && (
                        <span className="text-xs text-red-600">
                            {errors.geoLocation.latitude.message}
                        </span>
                    )}
                </label>

                <label className="space-y-1">
                    <span className="text-sm font-medium">Longitude</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        type="number"
                        step="0.0000001"
                        {...register("geoLocation.longitude", { valueAsNumber: true })}
                    />
                    {errors.geoLocation?.longitude && (
                        <span className="text-xs text-red-600">
                            {errors.geoLocation.longitude.message}
                        </span>
                    )}
                </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-1">
                    <span className="text-sm font-medium">Total Area</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        type="number"
                        step="0.01"
                        {...register("dimensions.totalArea", { valueAsNumber: true })}
                    />
                    {errors.dimensions?.totalArea && (
                        <span className="text-xs text-red-600">
                            {errors.dimensions.totalArea.message}
                        </span>
                    )}
                </label>

                <label className="space-y-1">
                    <span className="text-sm font-medium">Occupied Area</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        type="number"
                        step="0.01"
                        {...register("dimensions.occupiedArea", { valueAsNumber: true })}
                    />
                    {errors.dimensions?.occupiedArea && (
                        <span className="text-xs text-red-600">
                            {errors.dimensions.occupiedArea.message}
                        </span>
                    )}
                </label>

                <label className="space-y-1">
                    <span className="text-sm font-medium">Unit Count</span>
                    <input
                        className="w-full rounded border px-3 py-2"
                        type="number"
                        {...register("dimensions.unitCount", { valueAsNumber: true })}
                    />
                    {errors.dimensions?.unitCount && (
                        <span className="text-xs text-red-600">
                            {errors.dimensions.unitCount.message}
                        </span>
                    )}
                </label>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
            >
                {loading ? "Saving..." : submitLabel}
            </button>
        </form>
    );
};
