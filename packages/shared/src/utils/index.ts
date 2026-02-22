// ─────────────────────────────────────────────────────────────────────────────
// SA ID Number Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a South African ID number using the Luhn algorithm and
 * extracts date of birth, gender, and citizenship.
 */
export function validateSaIdNumber(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;

  // Date of birth: YYMMDD
  const year = id.substring(0, 2);
  const month = id.substring(2, 4);
  const day = id.substring(4, 6);

  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);

  if (monthNum < 1 || monthNum > 12) return false;
  if (dayNum < 1 || dayNum > 31) return false;

  // Luhn algorithm
  const digits = id.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = digits[i] ?? 0;
    if (i % 2 === 0) {
      sum += digit;
    } else {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[12];
}

export interface SaIdInfo {
  dateOfBirth: Date;
  gender: 'male' | 'female';
  isCitizen: boolean;
  isSouthAfrican: boolean;
}

export function parseSaIdNumber(id: string): SaIdInfo | null {
  if (!validateSaIdNumber(id)) return null;

  const yearStr = id.substring(0, 2);
  const month = id.substring(2, 4);
  const day = id.substring(4, 6);
  const genderDigit = parseInt(id.substring(6, 10), 10);

  // Determine century: if year >= current year's last 2 digits, it's 1900s
  const currentYear = new Date().getFullYear() % 100;
  const year = parseInt(yearStr, 10);
  const fullYear = year > currentYear ? 1900 + year : 2000 + year;

  const citizenshipDigit = parseInt(id.substring(10, 11), 10);

  return {
    dateOfBirth: new Date(`${fullYear}-${month}-${day}`),
    gender: genderDigit >= 5000 ? 'male' : 'female',
    isCitizen: citizenshipDigit === 0,
    isSouthAfrican: citizenshipDigit === 0 || citizenshipDigit === 1,
  };
}

/**
 * Returns a masked SA ID for logging (last 4 digits visible).
 * Input:  8001015009087
 * Output: XXXXXXXXX9087
 */
export function maskSaIdNumber(id: string): string {
  if (id.length !== 13) return 'XXXXXXXXXXXXX';
  return `XXXXXXXXX${id.substring(9)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency / ZAR Formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format cents to a ZAR currency string.
 * Input:  10050 (cents)
 * Output: "R 100.50"
 */
export function formatZar(cents: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format cents to a compact ZAR string for small spaces.
 * Input:  100050 (cents)
 * Output: "R 1 000.50"
 */
export function formatZarCompact(cents: number): string {
  return `R ${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
}

/** Convert a ZAR decimal amount to cents (integer). */
export function zarToCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Convert cents to ZAR decimal. */
export function centsToZar(cents: number): number {
  return cents / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// SA Phone Number Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a South African mobile number to E.164 format (+27XXXXXXXXX).
 */
export function normaliseSaMobile(mobile: string): string | null {
  const cleaned = mobile.replace(/\s|-|\(|\)/g, '');

  if (/^\+27[6-8]\d{8}$/.test(cleaned)) return cleaned;
  if (/^0[6-8]\d{8}$/.test(cleaned)) return `+27${cleaned.substring(1)}`;
  if (/^27[6-8]\d{8}$/.test(cleaned)) return `+${cleaned}`;

  return null;
}

export function isSaMobile(mobile: string): boolean {
  return normaliseSaMobile(mobile) !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Date / SAST Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Format a date in South African dd MMM yyyy format. */
export function formatSaDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  }).format(new Date(date));
}

/** Format a datetime in SA format with time. */
export function formatSaDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Johannesburg',
    hour12: false,
  }).format(new Date(date));
}

/** Returns the SAST offset (UTC+2). */
export function getSastNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
}

/** Add specified number of years to a date. */
export function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/** Add specified number of days to a date. */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// VAT Utilities (SA VAT Act, standard rate 15%)
// ─────────────────────────────────────────────────────────────────────────────

export const SA_VAT_RATE = 0.15;

export function calculateVat(amountExclCents: number): number {
  return Math.round(amountExclCents * SA_VAT_RATE);
}

export function addVat(amountExclCents: number): number {
  return amountExclCents + calculateVat(amountExclCents);
}

export function extractVat(amountInclCents: number): number {
  return Math.round(amountInclCents * (SA_VAT_RATE / (1 + SA_VAT_RATE)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Clawback Utilities
// ─────────────────────────────────────────────────────────────────────────────

export const CLAWBACK_WATCH_DAYS = 730; // 2 years

/**
 * Calculate clawback percentage based on days since policy commencement.
 * Year 1 (0–365 days): 100%
 * Year 2 (366–730 days): 50%
 * After Year 2: 0%
 */
export function calculateClawbackPercentage(commencementDate: Date, lapseDate: Date): number {
  const daysDiff = Math.floor(
    (lapseDate.getTime() - commencementDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff <= 365) return 100;
  if (daysDiff <= 730) return 50;
  return 0;
}

export function calculateClawbackAmount(
  commissionPaidCents: number,
  commencementDate: Date,
  lapseDate: Date,
): number {
  const pct = calculateClawbackPercentage(commencementDate, lapseDate);
  return Math.round(commissionPaidCents * (pct / 100));
}
