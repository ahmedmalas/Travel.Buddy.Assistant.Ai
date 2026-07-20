import { useMemo, useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { Field, Panel, PrimaryButton, SecondaryButton, StatusBanner, inputClassName } from './shared/ui';

type ConciergeMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendation?: { title: string; detail: string };
};

function buildResponse(question: string, tripName: string, destination: string): ConciergeMessage {
  const q = question.toLowerCase();
  let title = 'Trip planning suggestion';
  let detail =
    'I can help organise flights, stays, itinerary days, transport, dining, and local activities. Live supplier inventory is not connected — recommendations are planning guidance only.';

  if (q.includes('flight') || q.includes('airport')) {
    title = 'Flight planning';
    detail = `For ${destination || 'your trip'}, set origin/destination with airport autocomplete, pick dates on the calendar, then save the search to the Flights workspace. Compare options externally and store the chosen segment here.`;
  } else if (q.includes('hotel') || q.includes('stay') || q.includes('accommodation')) {
    title = 'Hotel planning';
    detail = `Use Hotels to capture destination, check-in/out, guests, and preferences for ${tripName || 'this trip'}. Save the plan, then attach a confirmation once you book.`;
  } else if (q.includes('itinerary') || q.includes('day') || q.includes('schedule')) {
    title = 'Itinerary creation';
    detail = 'Open Itinerary to add days, times, locations, and notes. I can drop a recommended activity into your itinerary when you choose Save recommendation.';
  } else if (q.includes('restaurant') || q.includes('food') || q.includes('dining')) {
    title = 'Dining ideas';
    detail = `Shortlist neighbourhood restaurants near ${destination || 'your base'}, note dietary needs, and add dinner blocks to the itinerary. This is not a live reservation system.`;
  } else if (q.includes('transfer') || q.includes('taxi') || q.includes('transport') || q.includes('train')) {
    title = 'Transport planning';
    detail = 'Use Transport / Move services to capture pickup, drop-off, mode, and timing. Save as planned ground transport until a booking is confirmed.';
  } else if (q.includes('cruise')) {
    title = 'Cruise planning';
    detail = 'Record sailing window, ports, cabin preferences, and budget in Travel services → Cruises, then add sea days to the itinerary.';
  } else if (q.includes('budget') || q.includes('cost') || q.includes('money')) {
    title = 'Budget organisation';
    detail = 'Track estimates in Budget and mark planned vs confirmed spend. No live fare quotes are shown here.';
  } else if (q.includes('nearby') || q.includes('activity') || q.includes('things to do')) {
    title = 'Nearby recommendations';
    detail = `Based on ${destination || 'your destination'}, add morning/afternoon activity blocks, keep travel times realistic, and pin places in Maps.`;
  }

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: detail,
    recommendation: { title, detail },
  };
}

export function ConciergePlanPanel() {
  const { activeVaultTrip, addStop, canEditTrip } = useSharedTripStore();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ConciergeMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask about flights, hotels, itineraries, transport, dining, cruises, nearby activities, or budgets. Recommendations are planning guidance — not confirmed bookings.',
    },
  ]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const contextLabel = useMemo(
    () =>
      [activeVaultTrip.tripName, activeVaultTrip.destination].filter(Boolean).join(' · ') || 'No active trip details yet',
    [activeVaultTrip.destination, activeVaultTrip.tripName],
  );

  const ask = () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    const userMessage: ConciergeMessage = { id: crypto.randomUUID(), role: 'user', text: trimmed };
    const assistant = buildResponse(trimmed, activeVaultTrip.tripName, activeVaultTrip.destination);
    setMessages((current) => [...current, userMessage, assistant]);
    setQuestion('');
    setFeedback(null);
  };

  const saveRecommendation = (message: ConciergeMessage) => {
    if (!message.recommendation || !canEditTrip) return;
    addStop({
      title: message.recommendation.title,
      location: activeVaultTrip.destination || 'To decide',
      date: activeVaultTrip.departureDate || '',
      category: 'activity',
      notes: `${message.recommendation.detail}\n\n(Source: Concierge Plan recommendation — not a confirmed booking.)`,
      currency: activeVaultTrip.currency,
    });
    setFeedback('Recommendation saved into the itinerary as a planning item.');
  };

  return (
    <Panel
      title="Concierge Plan"
      description="Structured trip assistance using your saved trip context. Recommendations are clearly planning-only — never treated as live bookings."
    >
      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-400">Trip context: {contextLabel}</p>
      {feedback ? <StatusBanner kind="success" message={feedback} /> : null}
      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`rounded-2xl p-3 text-sm ${
              message.role === 'user' ? 'bg-slate-900 text-slate-100' : 'bg-sky-400/10 text-sky-50'
            }`}
          >
            <p>{message.text}</p>
            {message.recommendation && canEditTrip ? (
              <SecondaryButton className="mt-3" type="button" onClick={() => saveRecommendation(message)}>
                Save recommendation to itinerary
              </SecondaryButton>
            ) : null}
          </article>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <Field label="Ask the concierge" htmlFor="concierge-question">
          <input
            id="concierge-question"
            className={inputClassName}
            value={question}
            placeholder="e.g. Help me plan flights and a food-focused itinerary"
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') ask();
            }}
          />
        </Field>
        <div className="flex items-end">
          <PrimaryButton type="button" onClick={ask}>
            Ask
          </PrimaryButton>
        </div>
      </div>
    </Panel>
  );
}
