import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function PropertiesIcon(props: IconProps) {
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
      <path d="M3 21V9l9-6 9 6v12" />
      <path d="M9 21V13h6v8" />
      <path d="M3 21h18" />
    </svg>
  );
}
