import { Archive } from "lucide-react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ArchiveIcon(props: IconProps) {
  return <Archive strokeWidth={2} {...props} />;
}