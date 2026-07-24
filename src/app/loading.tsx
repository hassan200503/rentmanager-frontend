export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg dark:bg-bg-dark">
      <div className="flex flex-col items-center gap-3">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand animate-pulse">
          <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2 9h9M11 2v7" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="9" width="11" height="13" rx="2" fill="currentColor" opacity="0.15" />
        </svg>
        <p className="text-sm text-fg-muted dark:text-fg-muted-dark">Loading...</p>
      </div>
    </div>
  );
}