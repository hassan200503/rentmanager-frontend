import { AppLogo } from "@/shared/components/brand";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg dark:bg-bg-dark px-6">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand/25">
        <AppLogo size={26} className="text-white" />
        <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <span className="font-display text-sm font-semibold tracking-tight text-fg dark:text-fg-dark">
          RentManager
        </span>
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
        <span className="text-xs text-fg-muted dark:text-fg-muted-dark">Preparing your workspace…</span>
      </div>
    </div>
  );
}