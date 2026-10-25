import { type SVGProps } from "react";

interface AppLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function AppLogo({ size = 24, ...props }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 9h9M11 2v7" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="9" width="11" height="13" rx="2" fill="currentColor" opacity="0.15" />
      <path d="M13 12h7M13 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}