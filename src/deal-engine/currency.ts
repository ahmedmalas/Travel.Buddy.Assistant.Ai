/** Demo FX table — clearly estimated, not live market rates. */
const DEMO_RATES_TO_GBP: Record<string, number> = {
  GBP: 1,
  EUR: 0.86,
  USD: 0.79,
  CHF: 0.89,
};

export interface ConvertedMoney {
  amount: number;
  currency: string;
  sourceCurrency: string;
  sourceAmount: number;
  rate: number;
  exchangeRateTimestamp: string;
  freshness: 'estimated';
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  at = new Date().toISOString(),
): ConvertedMoney {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  const fromRate = DEMO_RATES_TO_GBP[from];
  const toRate = DEMO_RATES_TO_GBP[to];
  if (fromRate == null || toRate == null) {
    throw new Error(`Unsupported demo currency conversion: ${from} → ${to}`);
  }
  const inGbp = amount * fromRate;
  const converted = toRate === 0 ? 0 : inGbp / toRate;
  return {
    amount: Math.round(converted * 100) / 100,
    currency: to,
    sourceCurrency: from,
    sourceAmount: amount,
    rate: from === to ? 1 : fromRate / toRate,
    exchangeRateTimestamp: at,
    freshness: 'estimated',
  };
}
