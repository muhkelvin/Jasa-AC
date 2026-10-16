import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number as Indonesian Rupiah (e.g. Rp 150.000)
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format PK capacity (e.g. "1 PK", "0,5 PK", "1,5 PK")
export function formatPK(capacity: number): string {
  const formatted = capacity % 1 === 0 ? capacity.toFixed(0) : capacity.toFixed(1).replace(".", ",");
  return `${formatted} PK`;
}

// Format Indonesian standard date & time
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Format short date (e.g. 17 Okt 2026)
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// Format short time (e.g. 14:30)
export function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
