type SectionTitleProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">{description}</p>
    </header>
  );
}
