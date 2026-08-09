interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-emerald-400">
        <span className="w-8 h-px bg-gradient-to-r from-transparent to-emerald-500/60" aria-hidden="true" />
        {eyebrow}
        <span className="w-8 h-px bg-gradient-to-l from-transparent to-emerald-500/60" aria-hidden="true" />
      </span>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white mt-4 [text-wrap:balance]">
        {title}
      </h2>
      {description && (
        <p className="text-white/55 mt-4 text-base leading-relaxed [text-wrap:balance]">{description}</p>
      )}
    </div>
  );
}