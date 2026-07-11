import { useContext } from 'react';
import { TripCommandContext } from './TripProvider';

export function useTripCommand() {
  const context = useContext(TripCommandContext);
  if (!context) {
    throw new Error('useTripCommand must be used within a TripProvider.');
  }
  return context;
}
