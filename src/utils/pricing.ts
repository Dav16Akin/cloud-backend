// src/utils/pricing.ts
//
// Converts OpenProvider's wholesale price (returned in USD or EUR) into
// a retail NGN price with Nupat's markup applied. Centralizing this in
// one place means every domain/SSL endpoint charges consistently and
// the markup or exchange rate can be tuned from a single spot.

// TODO: replace with your actual decision — flat % vs flat NGN fee.
// Using a flat percentage placeholder for now.
const MARKUP_PERCENTAGE = 0.20; // 20% on top of wholesale — placeholder, confirm real value

// TODO: replace with a live FX rate lookup (e.g. a daily-cached call to
// an FX API) instead of a hardcoded constant — exchange rates move and
// a stale rate either erodes your margin or overcharges customers.
const USD_TO_NGN = 1400; // placeholder — confirm current rate or wire up a live source
const EUR_TO_NGN = 1640; // placeholder — confirm current rate or wire up a live source

type SupportedCurrency = "USD" | "EUR" | "NGN";

/**
 * Converts a wholesale price in USD/EUR/NGN into a final NGN retail price,
 * with markup applied. Always rounds up to the nearest whole Naira so
 * Nupat never under-charges due to rounding.
 */
export function calculateRetailPriceNGN(
  wholesaleAmount: number,
  wholesaleCurrency: SupportedCurrency,
): number {
  let amountInNGN: number;

  switch (wholesaleCurrency) {
    case "USD":
      amountInNGN = wholesaleAmount * USD_TO_NGN;
      break;
    case "EUR":
      amountInNGN = wholesaleAmount * EUR_TO_NGN;
      break;
    case "NGN":
      amountInNGN = wholesaleAmount;
      break;
    default:
      throw new Error(`Unsupported currency: ${wholesaleCurrency}`);
  }

  const withMarkup = amountInNGN * (1 + MARKUP_PERCENTAGE);
  return Math.ceil(withMarkup);
}