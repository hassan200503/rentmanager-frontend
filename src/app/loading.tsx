import { PlatformLogoMark } from "@/shared/components/brand";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg dark:bg-bg-dark px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5 dark:bg-slate-100">
        <PlatformLogoMark size={26} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <span className="flex items-center gap-1 font-brand text-sm font-semibold tracking-[-0.01em] text-fg dark:text-fg-dark">
          <span>Rent</span>
          <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-emerald-200">
            Manager
          </span>
        </span>
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
        <span className="text-xs text-fg-muted dark:text-fg-muted-dark">Preparing your workspace…</span>
      </div>
    </div>
  );
}
