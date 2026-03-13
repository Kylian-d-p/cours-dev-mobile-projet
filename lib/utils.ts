import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isValidDateInput(text: string): boolean {
  // Strict YYYY-MM-DD check.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const parsed = parseDateInput(text);
  // Ensure normalization matches input (guards against 2026-02-31 rolling over).
  return formatDateForInput(parsed) === text;
}

export function parseDateInput(text: string): Date {
  // Interpret as local date at midnight.
  return new Date(`${text}T00:00:00`);
}