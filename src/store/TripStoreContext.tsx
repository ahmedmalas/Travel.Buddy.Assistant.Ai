import { createContext, useContext, type ReactNode } from 'react';
import { useTripStore } from './useTripStore';

export type {
  BackupSnapshot,
  Booking,
  Expense,
  ImportPreview,
  IntegrityHistoryImportPreview,
  IntegrityTrendWindow,
  PackingItem,
  PackingList,
  SnapshotCleanupMode,
  SnapshotHistoryImportPreview,
  TripData,
  TripSetupInput,
  TripStop,
  Traveller,
} from './useTripStore';

type TripStoreValue = ReturnType<typeof useTripStore>;

const TripStoreContext = createContext<TripStoreValue | null>(null);

export function TripStoreProvider({ children }: { children: ReactNode }) {
  const store = useTripStore();
  return <TripStoreContext.Provider value={store}>{children}</TripStoreContext.Provider>;
}

export function useSharedTripStore(): TripStoreValue {
  const value = useContext(TripStoreContext);
  if (!value) {
    throw new Error('useSharedTripStore must be used within TripStoreProvider.');
  }
  return value;
}
