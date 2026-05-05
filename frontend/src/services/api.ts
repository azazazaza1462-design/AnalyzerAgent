import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { CreateClientConfig } from "./generated/client.gen";
import { withTokenRefresh } from "./tokenRefresh";

// Shared axios instance for ad-hoc calls. The generated SDK uses its own
// instance configured by createClientConfig below, but follows the same
// baseURL/credentials/interceptor conventions.
const api = axios.create({
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

    if (!config || config.url?.startsWith("/api/v1/auth/")) {
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

// Used by services/generated/client.gen.ts to configure the OpenAPI client.
// Paths in the generated SDK are absolute (e.g. "/api/v1/jobs"), so baseURL
// stays empty — the Vite dev server proxies /api/* to the backend.
export const createClientConfig: CreateClientConfig = (override) => ({
  ...override,
  baseURL: "",
  withCredentials: true,
});

export default api;
