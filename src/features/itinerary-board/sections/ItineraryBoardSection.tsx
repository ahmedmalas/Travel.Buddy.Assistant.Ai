import { SectionTitle } from '../../../shared/components/SectionTitle';
import { ItineraryBoard } from '../components/ItineraryBoard';

export function ItineraryBoardSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <SectionTitle
        description="Schedule saved places into day-by-day timeline plans with time, duration, and buffer controls. Built for command-centre planning, not generic calendars."
        eyebrow="Slice 4"
        title="Daily itinerary planning board"
      />
      <div className="mt-8">
        <ItineraryBoard />
      </div>
    </section>
  );
}
