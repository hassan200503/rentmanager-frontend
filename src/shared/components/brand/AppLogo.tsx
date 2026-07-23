import { type SVGProps } from "react";

interface AppLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function AppLogo({ size = 28, ...props }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="6" y="4" width="5" height="24" rx="2" fill="currentColor" />
      <path d="M11 4h5a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6h-5" fill="currentColor" />
      <path d="M17 8L25 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
