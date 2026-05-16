import axios from 'axios'
import type {
  Character,
  CreateCharacterDto,
  UpdateCharacterDto,
  CreateCharacterRelationshipDto,
  UpdateCharacterRelationshipDto,
  CharacterRelationship,
} from '../types/character'

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

export const charactersApi = {
  async getAll(projectId: string): Promise<Character[]> {
    const response = await apiClient.get(`/projects/${projectId}/characters`)
    return response.data
  },

  async getById(projectId: string, characterId: string): Promise<Character> {
    const response = await apiClient.get(
      `/projects/${projectId}/characters/${characterId}`
    )
    return response.data
  },

  async create(projectId: string, data: CreateCharacterDto): Promise<Character> {
    const response = await apiClient.post(
      `/projects/${projectId}/characters`,
      data
    )
    return response.data
  },

  async update(
    projectId: string,
    characterId: string,
    data: UpdateCharacterDto
  ): Promise<Character> {
    const response = await apiClient.put(
      `/projects/${projectId}/characters/${characterId}`,
      data
    )
    return response.data
  },

  async delete(projectId: string, characterId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/characters/${characterId}`)
  },

  async createRelationship(
    projectId: string,
    data: CreateCharacterRelationshipDto
  ): Promise<CharacterRelationship> {
    const response = await apiClient.post(
      `/projects/${projectId}/characters/relationships`,
      data
    )
    return response.data
  },

  async updateRelationship(
    projectId: string,
    relationshipId: string,
    data: UpdateCharacterRelationshipDto
  ): Promise<CharacterRelationship> {
    const response = await apiClient.put(
      `/projects/${projectId}/characters/relationships/${relationshipId}`,
      data
    )
    return response.data
  },

  async deleteRelationship(
    projectId: string,
    relationshipId: string
  ): Promise<void> {
    await apiClient.delete(
      `/projects/${projectId}/characters/relationships/${relationshipId}`
    )
  },
}
