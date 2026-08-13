import {
  Building2,
  Building,
  Home,
  House,
  BedDouble,
  School,
  Warehouse,
  Store,
  Briefcase,
  KeyRound,
  DoorOpen,
} from "lucide-react";
import { PropertyType } from "@/features/property/types/property";

export interface PropertyTypeStyle {
  icon: typeof Building2;
  color: string;
}

export const TYPE_STYLE: Record<string, PropertyTypeStyle> = {
  [PropertyType.APARTMENT]: { icon: Building2, color: "var(--color-brand)" },
  [PropertyType.BEDSITTER]: { icon: BedDouble, color: "var(--color-info)" },
  [PropertyType.STUDIO]: { icon: DoorOpen, color: "var(--color-brand-400)" },
  [PropertyType.MAISONETTE]: { icon: House, color: "var(--color-success)" },
  [PropertyType.VILLA]: { icon: Home, color: "var(--color-warning)" },
  [PropertyType.COMMERCIAL]: { icon: Store, color: "var(--color-danger)" },
  [PropertyType.OFFICE]: { icon: Briefcase, color: "var(--color-fg-muted)" },
  [PropertyType.WAREHOUSE]: { icon: Warehouse, color: "var(--color-fg-subtle)" },
  [PropertyType.HOSTEL]: { icon: School, color: "var(--color-brand-700)" },
  [PropertyType.AIRBNB]: { icon: KeyRound, color: "var(--color-warning)" },
};

export const TYPE_LABEL: Record<string, string> = {
  [PropertyType.APARTMENT]: "Apartment",
  [PropertyType.BEDSITTER]: "Bedsitter",
  [PropertyType.STUDIO]: "Studio",
  [PropertyType.MAISONETTE]: "Maisonette",
  [PropertyType.VILLA]: "Villa",
  [PropertyType.COMMERCIAL]: "Commercial",
  [PropertyType.OFFICE]: "Office",
  [PropertyType.WAREHOUSE]: "Warehouse",
  [PropertyType.HOSTEL]: "Hostel",
  [PropertyType.AIRBNB]: "Airbnb",
};

export function typeStyle(type: string): PropertyTypeStyle {
  return TYPE_STYLE[type] ?? { icon: Building, color: "var(--color-fg-muted)" };
}

export function typeLabel(type: string): string {
  return TYPE_LABEL[type] ?? `${type.charAt(0)}${type.slice(1).toLowerCase()}`;
}