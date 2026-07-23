import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function RentLedgerIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4h16v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />
      <path d="M9 13l2 2 4-4" />
      <path d="M8 8h8" />
      <path d="M8 11h5" />
    </svg>
  );
}
