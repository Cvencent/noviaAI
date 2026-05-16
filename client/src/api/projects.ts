import axios from 'axios'
import type { 
  Project, 
  CreateProjectDto, 
  UpdateProjectDto 
} from '../types/project'

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

export const projectsApi = {
  async getAll(): Promise<Project[]> {
    const response = await apiClient.get('/projects')
    return response.data
  },

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get(`/projects/${id}`)
    return response.data
  },

  async create(data: CreateProjectDto): Promise<Project> {
    const response = await apiClient.post('/projects', data)
    return response.data
  },

  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    const response = await apiClient.put(`/projects/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`)
  },

  async export(id: string): Promise<void> {
    const response = await apiClient.get(`/projects/${id}/export`, {
      responseType: 'blob',
    })
    
    const contentDisposition = response.headers['content-disposition']
    let filename = `project_${id}_${Date.now()}.json`
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  async import(jsonData: object): Promise<Project> {
    const response = await apiClient.post('/projects/import', jsonData)
    return response.data
  },
}
