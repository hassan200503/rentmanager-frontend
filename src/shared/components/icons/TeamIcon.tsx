import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function TeamIcon(props: IconProps) {
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
      <circle cx="6" cy="7" r="2.5" />
      <path d="M2 21c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="18" cy="7" r="2.5" />
      <path d="M14 21c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="12" cy="8" r="2" />
      <path d="M10 21a2 2 0 0 1 4 0" />
    </svg>
  );
}
