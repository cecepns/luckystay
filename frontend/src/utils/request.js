import { api } from "./api";

/**
 * Reusable request helpers for standardized API interactions
 */
export const request = {
  get: async (url, params = {}, config = {}) => {
    const response = await api.get(url, { params, ...config });
    return response.data;
  },

  post: async (url, data = {}, config = {}) => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  put: async (url, data = {}, config = {}) => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  delete: async (url, config = {}) => {
    const response = await api.delete(url, config);
    return response.data;
  },

  upload: async (url, formData, config = {}) => {
    const response = await api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });
    return response.data;
  },

  uploadPut: async (url, formData, config = {}) => {
    const response = await api.put(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });
    return response.data;
  },
};
