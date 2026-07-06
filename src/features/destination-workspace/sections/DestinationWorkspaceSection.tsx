import { SectionTitle } from '../../../shared/components/SectionTitle';
import { DestinationWorkspace } from '../components/DestinationWorkspace';

export function DestinationWorkspaceSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <SectionTitle
        description="Save places with context, track what matters, and keep reminder timing visible. This workspace is map-ready now and live-map-ready for a future slice."
        eyebrow="Slice 2"
        title="Destination workspace: map, notes, reminders"
      />
      <div className="mt-8">
        <DestinationWorkspace />
      </div>
    </section>
  );
}
