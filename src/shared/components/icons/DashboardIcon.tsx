import { LayoutDashboard } from "lucide-react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function DashboardIcon(props: IconProps) {
  return <LayoutDashboard strokeWidth={2} {...props} />;
}