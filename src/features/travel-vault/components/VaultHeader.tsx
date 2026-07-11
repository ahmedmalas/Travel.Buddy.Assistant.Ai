import { CommandKpiCard } from '../../trip-command/components/CommandKpiCard';
import type { VaultCountsByType } from '../model/travelVault.types';

type VaultHeaderProps = {
  totalItems: number;
  expiringSoonCount: number;
  countsByType: VaultCountsByType;
};

export function VaultHeader({ totalItems, expiringSoonCount, countsByType }: VaultHeaderProps) {
  const transportCount = countsByType.flight + countsByType.ticket + countsByType.reservation;
  const financeCount = countsByType.receipt + countsByType.invoice;

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-sky-500/5 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-sky-200">Travel vault</p>
        <h3 className="mt-2 text-2xl font-bold text-white">Trip document command centre</h3>
        <p className="mt-2 text-sm text-slate-300">Organize critical records with local-first metadata and search-ready indexing.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <CommandKpiCard hint="All vault records" label="Total items" value={`${totalItems}`} />
        <CommandKpiCard hint="Passport/visa/insurance visibility" label="Expiring soon" value={`${expiringSoonCount}`} />
        <CommandKpiCard hint="Flights, tickets, reservations" label="Transport docs" value={`${transportCount}`} />
        <CommandKpiCard hint="Receipts + invoices" label="Finance docs" value={`${financeCount}`} />
      </div>
    </div>
  );
}
