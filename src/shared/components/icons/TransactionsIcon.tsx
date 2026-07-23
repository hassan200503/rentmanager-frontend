import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function TransactionsIcon(props: IconProps) {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M16.5 7.5l3 3-3 3" />
      <path d="M7.5 16.5l-3-3 3-3" />
      <path d="M19.5 10.5v-4h-4" />
      <path d="M4.5 13.5v4h4" />
    </svg>
  );
}
