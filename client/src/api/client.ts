import axios, { AxiosError, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/auth';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class ApiErrorHandler {
  static fromAxiosError(error: AxiosError): ApiError {
    const errorMessage =
      (error.response?.data as any)?.message ||
      error.message ||
      '请求失败';

    return {
      message: errorMessage,
      status: error.response?.status,
      code: (error.response?.data as any)?.code || error.code,
      details: error.response?.data
    };
  }
}

const shouldRetry = (error: AxiosError): boolean => {
  if (!error.config) return false;

  const { status } = error.response || {};
  const method = error.config.method?.toUpperCase();

  if (!method || ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return false;
  }

  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  const isNetworkError = !error.response;

  return isNetworkError || (status !== undefined && retryableStatuses.includes(status));
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const retryRequest = async (
  error: AxiosError, retries: number = 0): Promise<AxiosResponse> => {
  if (retries >= MAX_RETRIES || !shouldRetry(error)) {
    throw error;
  }

  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
  return apiClient({ ...error.config! });
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (shouldRetry(error)) {
      const retryCount = (error.config as any)?._retryCount || 0;
      if (retryCount < MAX_RETRIES) {
        (error.config as any)!._retryCount = retryCount + 1;
        return retryRequest(error, retryCount);
      }
    }

    return Promise.reject(error);
  }
);
