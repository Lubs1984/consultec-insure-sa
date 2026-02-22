import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format bytes to human-readable string. */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Truncate string with ellipsis. */
export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}…` : str;
}

/** Get initials from a name (e.g. "John Doe" → "JD"). */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/** Delay (for optimistic UI & debounce helpers). */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
