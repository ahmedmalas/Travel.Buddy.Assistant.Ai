import { SectionCard } from './SectionCard';
import { TripPlatform } from './trip-platform/TripPlatform';
import { travelSections } from '../data/sections';

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-sky-300">Travel Buddy</p>
          <h1 className="mt-2 text-2xl font-bold">Assistant AI</h1>
        </div>
        <a className="rounded-full border border-white/15 px-5 py-2 text-sm text-slate-200" href="#trip-platform">
          Open trip platform
        </a>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-sky-300">AI travel concierge</p>
            <h2 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Plan smarter trips from one powerful travel assistant.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Research flights, hotels, areas, budgets, restaurants, activities, tours, transfers, cruises, and local guidance without jumping across endless tabs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full bg-white/10 px-4 py-2">Flights</span>
              <span className="rounded-full bg-white/10 px-4 py-2">Hotels</span>
              <span className="rounded-full bg-white/10 px-4 py-2">Itineraries</span>
              <span className="rounded-full bg-white/10 px-4 py-2">Concierge</span>
            </div>
          </div>

          <div id="assistant" className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-sky-950/30">
            <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Assistant preview</p>
            <div className="mt-6 space-y-4 text-sm text-slate-200">
              <p className="rounded-2xl bg-slate-900 p-4">Find me the best 10-day Japan trip for food, culture, shopping, and value.</p>
              <p className="rounded-2xl bg-sky-400/10 p-4 text-sky-100">I will compare cities, flights, hotels, neighbourhoods, restaurants, activities, transport, and budget options.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-12 md:grid-cols-2 lg:grid-cols-3">
          {travelSections.map((section) => (
            <SectionCard key={section.title} section={section} />
          ))}
        </section>

        <div id="trip-platform">
          <TripPlatform />
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-500">
        Travel Buddy Assistant AI — Slices 9–52 local-first platform foundation.
      </footer>
    </div>
  );
}
