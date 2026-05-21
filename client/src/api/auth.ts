import { apiClient } from './client';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
}

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async getMe(): Promise<AuthResponse['user']> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
