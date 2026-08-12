import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a DateOnly string (yyyy-MM-dd) without timezone issues.
 * JavaScript's new Date("2026-01-13") interprets as UTC midnight,
 * which can shift the date in different timezones.
 * This function parses as local time to avoid that issue.
 */
export function parseDateOnly(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  // Handle both "2026-01-13" and "2026-01-13T00:00:00" formats
  const datePart = dateString.split('T')[0];
  const parts = datePart.split('-');

  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  return new Date(year, month, day);
}

/**
 * Format a date string or Date object for display.
 * Handles DateOnly strings without timezone issues.
 * Uses the application-wide dd-MMM-yyyy display standard.
 */
export function formatDate(dateValue: string | Date | null | undefined): string {
  const date = dateValue instanceof Date ? dateValue : parseDateOnly(dateValue);
  if (!date || Number.isNaN(date.getTime())) return "-";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getDate().toString().padStart(2, '0');
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day}-${monthName}-${year}`;
}

/**
 * Get today's date as a yyyy-MM-dd string.
 * Uses local time to avoid timezone issues.
 */
export function getTodayDateOnly(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object to yyyy-MM-dd string.
 * Uses local time to avoid timezone issues.
 */
export function formatDateToISO(date: Date | null | undefined): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object for display.
 * Uses local time to avoid timezone issues.
 */
export function formatDateForDisplay(date: Date | null | undefined): string {
  if (!date) return "-";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

/** Format a timestamp for consistent user-visible display in local time. */
export function formatDateTimeForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getDate().toString().padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
