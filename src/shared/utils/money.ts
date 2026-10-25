/**
 * The backend serializes every BigDecimal (money AND rate/percentage
 * fields) as a JSON string, never a raw number — see the backend's
 * JacksonConfig. A raw JSON number becomes an IEEE-754 double in the
 * browser, which is exactly the precision loss a monetary amount can't
 * tolerate. `MoneyValue` is the wire type every API money/rate field should
 * be typed as from here on.
 *
 * `toMoneyNumber` is the one place that converts back to a JS number for
 * display-side math (formatting, sorting, simple totals) — safe for
 * currency amounts at this app's scale (Kenyan rent/deposit figures, not
 * billions), even though JS numbers aren't arbitrary-precision. Anything
 * that needs to be precision-exact belongs server-side in BigDecimal, not
 * recomputed here.
 */
export type MoneyValue = string | number | null | undefined;

export function toMoneyNumber(value: MoneyValue): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Canonical currency formatter — replaces the 20+ duplicated
 * `Intl.NumberFormat("en-KE", { currency: "KES" })` definitions scattered
 * across the app. Accepts the wire type directly so call sites don't each
 * need their own `Number(...)` coercion.
 *
 * Default rounding keeps genuine sub-unit cents rather than always rounding
 * to whole shillings: an amount of "0.50" renders as "Ksh 0.50", not
 * "Ksh 1" or "Ksh 0" — but an amount that's already a whole number, zero
 * included, still renders with no decimal places ("Ksh 0", never
 * "Ksh 0.00"). Four call sites across the tenant portal (the dashboard, the
 * rent ledger, the shared tenant-format helpers, and a balance card)
 * independently reimplemented exactly this rule before being consolidated
 * here — worth keeping as the default rather than a rare edge case nobody
 * asked for, since real proration/overpayment reconciliation figures can
 * land under one shilling. Pass `maximumFractionDigits` explicitly to
 * override (e.g. `formatCurrencyPrecise` below always wants 2dp).
 */
export function formatCurrency(
  value: MoneyValue,
  options?: { currency?: string; maximumFractionDigits?: number; minimumFractionDigits?: number }
): string {
  const { currency = "KES", minimumFractionDigits } = options ?? {};
  const amount = toMoneyNumber(value);
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? (amount !== 0 && Math.abs(amount) < 1 ? 2 : 0);
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(amount);
}

/** Two-decimal-place variant, for receipts/statements where cents matter. */
export function formatCurrencyPrecise(value: MoneyValue, currency = "KES"): string {
  return formatCurrency(value, { currency, maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

/** For a rate/percentage field (also serialized as a string) — e.g. "5.00" -> "5.00%". */
export function formatRate(value: MoneyValue): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return `${toMoneyNumber(value).toFixed(2)}%`;
}
