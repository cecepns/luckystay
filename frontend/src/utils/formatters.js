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

export const getImageUrl = (path) => {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed || trimmed === '[object Object]' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
    return '';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kingcreativestudio.my.id/luckystay/api';
  if (apiUrl && !cleanPath.startsWith('http')) {
    return `${apiUrl.replace(/\/api\/?$/, '')}${cleanPath}`;
  }
  return cleanPath;
};

