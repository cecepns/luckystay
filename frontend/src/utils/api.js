import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.kingcreativestudio.my.id/luckystay/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Jika data adalah FormData, hapus Content-Type agar browser/axios otomatis menyematkan boundary multipart/form-data
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Terjadi kesalahan pada sistem";
    return Promise.reject({ ...error, customMessage: message });
  }
);
