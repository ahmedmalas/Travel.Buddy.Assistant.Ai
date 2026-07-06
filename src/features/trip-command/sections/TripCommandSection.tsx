import { SectionTitle } from '../../../shared/components/SectionTitle';
import { ActiveDestinationPanel } from '../components/ActiveDestinationPanel';
import { ActiveTripSwitcher } from '../components/ActiveTripSwitcher';
import { TripCommandOverview } from '../components/TripCommandOverview';

export function TripCommandSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <SectionTitle
        description="One active trip source of truth for brief, destination workspace, reminders, notes, and future itinerary/map/budget/document/AI modules."
        eyebrow="Slice 3"
        title="Unified trip command model"
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <TripCommandOverview />
        <div className="space-y-5">
          <ActiveTripSwitcher />
          <ActiveDestinationPanel />
        </div>
      </div>
    </section>
  );
}
