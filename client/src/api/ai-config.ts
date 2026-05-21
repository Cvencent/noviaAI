import { apiClient } from './client';
import { AIConfigMap, AIConfig } from '@/types/ai-config';

export const aiConfigApi = {
  async getConfigs(): Promise<AIConfigMap> {
    const response = await apiClient.get('/ai-config');
    return response.data;
  },

  async getDefaults(): Promise<AIConfigMap> {
    const response = await apiClient.get('/ai-config/defaults');
    return response.data;
  },

  async getConfig(action: string): Promise<AIConfig> {
    const response = await apiClient.get(`/ai-config/${action}`);
    return response.data;
  },

  async updateConfig(action: string, config: AIConfig): Promise<AIConfig> {
    const response = await apiClient.put(`/ai-config/${action}`, config);
    return response.data;
  },

  async batchUpdate(configs: { action: string; config: AIConfig }[]): Promise<any> {
    const response = await apiClient.post('/ai-config/batch', configs);
    return response.data;
  },
};
