/**
 * Multi-Currency Financial Ledger & Accounting Governance Engine (V2)
 *
 * Enforces strict GAAP-aligned separation for fitness coaching economics:
 * 1. Multi-Currency Isolation: Strictly segregates EGP, SAR, and USD (zero uncalibrated blending).
 * 2. Cash vs. Accrual Recognition: Distinguishes Collected Cash from Outstanding Receivables.
 * 3. Country-Aware Currency Detection (Saudi Arabia +966 -> SAR, Egypt +20 -> EGP).
 * 4. Zero Emojis and clean executive Arabic formatting.
 */

export const SUPPORTED_CURRENCIES = Object.freeze({
  EGP: "EGP",
  SAR: "SAR",
  USD: "USD"
});

export const CURRENCY_SYMBOLS_AR = Object.freeze({
  EGP: "ج.م",
  SAR: "ر.س",
  USD: "دولار"
});

/**
 * Resolves appropriate currency from transaction attributes, phone number, or country metadata.
 */
export function resolveTransactionCurrency(item = {}) {
  // 1. Direct explicit currency tag
  if (item.currency && typeof item.currency === "string") {
    const clean = item.currency.trim().toUpperCase();
    if (Object.values(SUPPORTED_CURRENCIES).includes(clean)) {
      return clean;
    }
  }

  // 2. Client phone prefix
  const phone = String(item.phone_number || item.phone || item.client?.phone_number || "").trim();
  if (phone.startsWith("+966") || phone.startsWith("00966") || phone.startsWith("966")) {
    return SUPPORTED_CURRENCIES.SAR;
  }
  if (phone.startsWith("+20") || phone.startsWith("0020") || phone.startsWith("01") || phone.startsWith("20")) {
    return SUPPORTED_CURRENCIES.EGP;
  }

  // 3. Country code fallback
  const country = String(item.country || item.client?.country || "").trim().toUpperCase();
  if (country === "SA" || country === "SAUDI" || country === "KSA") {
    return SUPPORTED_CURRENCIES.SAR;
  }

  return SUPPORTED_CURRENCIES.EGP;
}

/**
 * Formats amount with proper Arabic currency label.
 */
export function formatCurrencyAmount(amount = 0, currency = SUPPORTED_CURRENCIES.EGP) {
  const numeric = Math.round(Number(amount) || 0);
  const symbol = CURRENCY_SYMBOLS_AR[currency] || currency;
  return `${numeric.toLocaleString("en-US")} ${symbol}`;
}

/**
 * Computes multi-currency isolated ledger from a collection of clients or orders.
 */
export function computeMultiCurrencyFinancialLedger(items = []) {
  const ledger = {
    [SUPPORTED_CURRENCIES.EGP]: {
      currency: SUPPORTED_CURRENCIES.EGP,
      symbol_ar: CURRENCY_SYMBOLS_AR.EGP,
      total_contract_value: 0,
      collected_cash: 0,
      outstanding_receivables: 0,
      refunded_amount: 0,
      active_clients_count: 0,
      total_transactions: 0
    },
    [SUPPORTED_CURRENCIES.SAR]: {
      currency: SUPPORTED_CURRENCIES.SAR,
      symbol_ar: CURRENCY_SYMBOLS_AR.SAR,
      total_contract_value: 0,
      collected_cash: 0,
      outstanding_receivables: 0,
      refunded_amount: 0,
      active_clients_count: 0,
      total_transactions: 0
    },
    [SUPPORTED_CURRENCIES.USD]: {
      currency: SUPPORTED_CURRENCIES.USD,
      symbol_ar: CURRENCY_SYMBOLS_AR.USD,
      total_contract_value: 0,
      collected_cash: 0,
      outstanding_receivables: 0,
      refunded_amount: 0,
      active_clients_count: 0,
      total_transactions: 0
    }
  };

  if (!Array.isArray(items)) {
    return { by_currency: ledger, total_records: 0 };
  }

  for (const item of items) {
    const currency = resolveTransactionCurrency(item);
    const targetBucket = ledger[currency] || ledger[SUPPORTED_CURRENCIES.EGP];

    const price = Number(item.subscription_price ?? item.amount_paid ?? item.price ?? 0);
    const paymentStatus = String(item.payment_status || "PENDING").toUpperCase();
    const isClientActive = item.subscription_status === "ACTIVE" || item.subscription_status === "FROZEN" || item.status === "ACTIVE";

    targetBucket.total_transactions += 1;
    targetBucket.total_contract_value += price;

    if (isClientActive) {
      targetBucket.active_clients_count += 1;
    }

    if (paymentStatus === "PAID" || paymentStatus === "COMPLETED") {
      targetBucket.collected_cash += price;
    } else if (paymentStatus === "REFUNDED") {
      targetBucket.refunded_amount += price;
    } else if (paymentStatus === "PARTIAL") {
      const paid = Number(item.amount_paid_partial || item.paid_amount || price * 0.5);
      targetBucket.collected_cash += paid;
      targetBucket.outstanding_receivables += Math.max(0, price - paid);
    } else {
      // PENDING / UNPAID
      targetBucket.outstanding_receivables += price;
    }
  }

  return {
    by_currency: ledger,
    total_records: items.length
  };
}
