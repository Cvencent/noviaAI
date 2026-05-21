import { apiClient } from './client';
import { ApiKey } from '@/types/ai-config';

interface CreateApiKeyDto {
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
}

interface UpdateApiKeyDto {
  name?: string;
  baseUrl?: string;
  isActive?: boolean;
}

export const apiKeysApi = {
  async getAll(): Promise<ApiKey[]> {
    const response = await apiClient.get('/api-keys');
    return response.data;
  },

  async getById(id: string): Promise<ApiKey> {
    const response = await apiClient.get(`/api-keys/${id}`);
    return response.data;
  },

  async create(dto: CreateApiKeyDto): Promise<ApiKey> {
    const response = await apiClient.post('/api-keys', dto);
    return response.data;
  },

  async update(id: string, dto: UpdateApiKeyDto): Promise<ApiKey> {
    const response = await apiClient.put(`/api-keys/${id}`, dto);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api-keys/${id}`);
  },
};
