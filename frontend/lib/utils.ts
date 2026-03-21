import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Parses a date string (YYYY-MM-DD or ISO) into a local Date object at 00:00:00.
 * This avoids the pitfall where new Date("YYYY-MM-DD") is treated as UTC midnights.
 */
export function parseLocalDate(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());

  // Try to extract YYYY, MM, DD
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // 0-indexed
    const day = parseInt(match[3]);
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  // Fallback for other formats
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Checks if a target date is within a start and end date range (inclusive).
 */
export function isWithinDateRange(
  target: string | Date | null | undefined,
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): boolean {
  const targetDate = parseLocalDate(target);
  if (!targetDate) return false;

  const startDate = start ? parseLocalDate(start) : null;
  const endDate = end ? parseLocalDate(end) : null;

  if (startDate && targetDate < startDate) return false;
  if (endDate) {
    // Set end date to end of day just in case, though parseLocalDate already sets to start of day
    const fullEndDate = new Date(endDate);
    fullEndDate.setHours(23, 59, 59, 999);
    if (targetDate > fullEndDate) return false;
  }

  return true;
}
export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '0';
  
  let num: number;
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.-]/g, '');
    num = parseFloat(cleaned);
  } else {
    num = amount;
  }
  
  if (isNaN(num)) return '0';

  // Use Math.round to avoid floating point artifacts and get a clean integer
  // if decimals are not needed. If you want decimals, use toFixed(2).
  // The user requested it to be clean like 40000.
  return `${Math.round(num).toLocaleString()}`;
}

export function numberToWords(amount: number): string {
  if (amount === 0) return 'Zero';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
  };

  const roundedAmount = Math.round(amount);
  return 'Rupees ' + convert(roundedAmount).trim() + ' Only';
}
