import { ArrowLeftRight } from "lucide-react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function TransactionsIcon(props: IconProps) {
  return <ArrowLeftRight strokeWidth={2} {...props} />;
}