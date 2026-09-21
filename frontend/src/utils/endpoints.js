/**
 * Centralized API Endpoints Definition
 * Rule: All endpoints MUST be defined here, never hardcode in components/pages!
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
  },

  USER: {
    MY_BOOKINGS: "/user/my-bookings",
  },

  PROPERTIES: {
    LIST: "/properties",
    DETAIL: (id) => `/properties/${id}`,
    CREATE: "/properties",
    UPDATE: (id) => `/properties/${id}`,
    DELETE: (id) => `/properties/${id}`,
  },

  BOOKINGS: {
    LIST: "/bookings",
    DETAIL: (identifier) => `/bookings/${identifier}`,
    CREATE: "/bookings",
    UPDATE: (id) => `/bookings/${id}`,
    DELETE: (id) => `/bookings/${id}`,
    UPLOAD_PROOF: (invoiceNumber) => `/bookings/${invoiceNumber}/payment-proof`,
    APPROVE: (id) => `/bookings/${id}/approve`,
    REJECT: (id) => `/bookings/${id}/reject`,
    SYNC_HOSTEX: (id) => `/bookings/${id}/hostex-sync`,
  },

  HOSTEX: {
    STATUS: "/hostex/status",
  },

  PAYMENTS: {
    BANK_ACCOUNTS: "/bank-accounts",
    CREATE: "/bank-accounts",
    UPDATE: (id) => `/bank-accounts/${id}`,
    DELETE: (id) => `/bank-accounts/${id}`,
  },

  CITIES: {
    LIST: "/cities",
    ALL: "/cities/all",
    CREATE: "/cities",
    UPDATE: (id) => `/cities/${id}`,
    DELETE: (id) => `/cities/${id}`,
  },

  PROPERTY_TYPES: {
    LIST: "/property-types",
    ALL: "/property-types/all",
    CREATE: "/property-types",
    UPDATE: (id) => `/property-types/${id}`,
    DELETE: (id) => `/property-types/${id}`,
  },

  REVIEWS: {
    PUBLIC: "/reviews",
    ADMIN_LIST: "/reviews/admin",
    SUBMIT: "/reviews",
    ADMIN_CREATE: "/reviews/admin",
    UPDATE: (id) => `/reviews/${id}`,
    DELETE: (id) => `/reviews/${id}`,
  },

  SYSTEM: {
    HEALTH: "/health",
  },
};
