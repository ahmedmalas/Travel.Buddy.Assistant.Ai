import type { TravelSection } from '../data/sections';

type SectionCardProps = {
  section: TravelSection;
};

export function SectionCard({ section }: SectionCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-slate-950/20 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">{section.eyebrow}</p>
      <h3 className="mt-4 text-xl font-semibold text-white">{section.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{section.description}</p>
    </article>
  );
}
