import { AppShell } from './components/AppShell';
import { ItinerarySection } from './features/itinerary/sections/ItinerarySection';

export default function App() {
  return (
    <AppShell>
      <ItinerarySection />
    </AppShell>
  );
}
