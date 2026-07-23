import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function TenantsIcon(props: IconProps) {
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
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="10" r="2" />
      <path d="M15 20c0-1.7 1.3-3 3-3s3 1.3 3 3" />
    </svg>
  );
}
