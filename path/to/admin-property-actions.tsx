import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { updateProperty } from "../actions/property.actions";
import { PropertyType } from "../types/property";

const PROPERTY_TYPES = {
  APARTMENT: "APARTMENT",
  BEDSITTER: "BEDSITTER",
  STUDIO: "STUDIO",
  MAISONETTE: "MAISONETTE",
  VILLA: "VILLA",
  COMMERCIAL: "COMMERCIAL",
  OFFICE: "OFFICE",
  WAREHOUSE: "WAREHOUSE",
  HOSTEL: "HOSTEL",
};

export const PropertyActions = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [propertyType, setPropertyType] = useState(PropertyType.APARTMENT);

  const handleUpdate = (propertyId: string) => {
    dispatch(
      updateProperty({
        id: propertyId,
        type: propertyType,
      })
    );
  };

  return (
    <div>
      <button onClick={() => router.push('/admin/properties/edit/1')}>Edit Property</button>
      <button onClick={() => router.push('/admin/properties/create')}>Create Property</button>
    </div>
  );
};
