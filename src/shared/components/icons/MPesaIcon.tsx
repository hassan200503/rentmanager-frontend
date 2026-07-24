import { Smartphone } from "lucide-react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function MPesaIcon(props: IconProps) {
  return <Smartphone strokeWidth={2} {...props} />;
}