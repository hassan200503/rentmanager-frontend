import { UserCog } from "lucide-react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function TeamIcon(props: IconProps) {
  return <UserCog strokeWidth={2} {...props} />;
}