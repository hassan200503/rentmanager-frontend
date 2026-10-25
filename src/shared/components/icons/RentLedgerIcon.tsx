import { ClipboardList } from "lucide-react";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function RentLedgerIcon(props: IconProps) {
  return <ClipboardList strokeWidth={2} {...props} />;
}