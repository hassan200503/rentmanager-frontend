import { Users } from "lucide-react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function TenantsIcon(props: IconProps) {
  return <Users strokeWidth={2} {...props} />;
}