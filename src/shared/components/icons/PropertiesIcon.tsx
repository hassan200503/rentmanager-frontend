import { Building2 } from "lucide-react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function PropertiesIcon(props: IconProps) {
  return <Building2 strokeWidth={2} {...props} />;
}