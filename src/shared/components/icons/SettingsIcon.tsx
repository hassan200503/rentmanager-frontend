import { Settings } from "lucide-react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function SettingsIcon(props: IconProps) {
  return <Settings strokeWidth={2} {...props} />;
}