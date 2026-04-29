import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { withTokenRefresh } from "./tokenRefresh";

const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (!config || config.url?.startsWith("/auth/")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;
      try {
        return await withTokenRefresh(() => api(config));
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
