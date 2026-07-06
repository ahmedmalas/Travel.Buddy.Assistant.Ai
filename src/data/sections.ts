export type TravelSection = {
  title: string;
  eyebrow: string;
  description: string;
};

export const travelSections: TravelSection[] = [
  {
    title: 'Itinerary Builder',
    eyebrow: 'Plan',
    description: 'Create structured day-by-day travel plans from one intelligent workspace.',
  },
  {
    title: 'Destination Discovery',
    eyebrow: 'Discover',
    description: 'Compare destinations, neighbourhoods, seasons, travel styles, and local highlights.',
  },
  {
    title: 'Destination Workspace',
    eyebrow: 'Command',
    description: 'Save places with reminders, notes, priorities, and map-ready structure for each destination.',
  },
  {
    title: 'Budget Intelligence',
    eyebrow: 'Compare',
    description: 'Estimate trip costs across flights, hotels, transport, activities, meals, and extras.',
  },
  {
    title: 'Booking Organiser',
    eyebrow: 'Organise',
    description: 'Keep confirmations, documents, timings, preferences, and travel notes in one place.',
  },
  {
    title: 'AI Concierge',
    eyebrow: 'Assist',
    description: 'Ask for help with flights, hotels, restaurants, tours, transfers, cruises, and local guidance.',
  },
];
