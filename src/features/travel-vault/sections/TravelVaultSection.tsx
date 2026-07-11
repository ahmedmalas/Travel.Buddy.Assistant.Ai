import { SectionTitle } from '../../../shared/components/SectionTitle';
import { TravelVault } from '../components/TravelVault';

export function TravelVaultSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <SectionTitle
        description="Local-first trip vault for flights, hotels, insurance, passport, visa, tickets, reservations, receipts, invoices, PDFs, images, and notes."
        eyebrow="Slice 5"
        title="Travel vault documents"
      />
      <div className="mt-8">
        <TravelVault />
      </div>
    </section>
  );
}
