import axios from 'axios'
import type {
  WorldSetting,
  CreateWorldSettingDto,
  UpdateWorldSettingDto,
} from '../types/world-setting'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const worldSettingsApi = {
  async getAll(projectId: string): Promise<WorldSetting[]> {
    const response = await apiClient.get(`/projects/${projectId}/world-settings`)
    return response.data
  },

  async getByCategory(projectId: string, category: string): Promise<WorldSetting[]> {
    const response = await apiClient.get(`/projects/${projectId}/world-settings`, {
      params: { category },
    })
    return response.data
  },

  async getCategories(projectId: string): Promise<string[]> {
    const response = await apiClient.get(`/projects/${projectId}/world-settings/categories`)
    return response.data
  },

  async getById(projectId: string, id: string): Promise<WorldSetting> {
    const response = await apiClient.get(`/projects/${projectId}/world-settings/${id}`)
    return response.data
  },

  async create(projectId: string, data: CreateWorldSettingDto): Promise<WorldSetting> {
    const response = await apiClient.post(`/projects/${projectId}/world-settings`, data)
    return response.data
  },

  async update(
    projectId: string,
    id: string,
    data: UpdateWorldSettingDto,
  ): Promise<WorldSetting> {
    const response = await apiClient.put(`/projects/${projectId}/world-settings/${id}`, data)
    return response.data
  },

  async delete(projectId: string, id: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/world-settings/${id}`)
  },
}
