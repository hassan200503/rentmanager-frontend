import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function MPesaIcon(props: IconProps) {
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
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M12 18h.01" />
      <path d="M10 8l-2 4h4l-2 4" />
    </svg>
  );
}
