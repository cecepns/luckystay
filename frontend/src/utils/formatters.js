/**
 * Common formatting helpers
 */

export const formatRupiah = (number) => {
  if (number === null || number === undefined || number === '') return "Rp 0";
  const num = typeof number === 'number' ? number : parseFloat(String(number).replace(/[^0-9.-]+/g, ""));
  if (isNaN(num) || !isFinite(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDateIndo = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 1;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end - start;
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 1;
};

import { getUploadUrl } from './endpoints';

export const getImageUrl = (path) => {
  return getUploadUrl(path);
};

/**
 * Robustly converts any date input (YYYY-MM-DD, ISO string, Date object)
 * into a local YYYY-MM-DD string without UTC timezone shift.
 */
export const formatLocalDateString = (val) => {
  if (!val) return '';
  // If it's already a clean YYYY-MM-DD string, return as-is
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    return val.trim();
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    return typeof val === 'string' ? val.slice(0, 10) : '';
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the next consecutive calendar day in YYYY-MM-DD format
 */
export const getNextLocalDateString = (dateString) => {
  if (!dateString) return '';
  const clean = formatLocalDateString(dateString);
  const [y, m, d] = clean.split('-').map(Number);
  const nextDate = new Date(y, m - 1, d + 1);
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

