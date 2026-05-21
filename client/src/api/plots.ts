import { apiClient } from './client'

export interface PlotPoint {
  id: string
  plotId: string
  title: string
  type: string
  description?: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface Plot {
  id: string
  projectId: string
  title: string
  description?: string
  status: string
  createdAt: string
  updatedAt: string
  plotPoints: PlotPoint[]
}

export interface CreatePlotDto {
  title: string
  description?: string
  status?: string
}

export interface UpdatePlotDto {
  title?: string
  description?: string
  status?: string
}

export interface CreatePlotPointDto {
  title: string
  type: string
  description?: string
  order?: number
}

export interface UpdatePlotPointDto {
  title?: string
  type?: string
  description?: string
  order?: number
}

export const plotsApi = {
  async getAll(projectId: string): Promise<Plot[]> {
    const response = await apiClient.get(`/projects/${projectId}/plots`)
    return response.data
  },

  async getById(projectId: string, plotId: string): Promise<Plot> {
    const response = await apiClient.get(`/projects/${projectId}/plots/${plotId}`)
    return response.data
  },

  async create(projectId: string, data: CreatePlotDto): Promise<Plot> {
    const response = await apiClient.post(`/projects/${projectId}/plots`, data)
    return response.data
  },

  async update(projectId: string, plotId: string, data: UpdatePlotDto): Promise<Plot> {
    const response = await apiClient.put(`/projects/${projectId}/plots/${plotId}`, data)
    return response.data
  },

  async delete(projectId: string, plotId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/plots/${plotId}`)
  },

  async addPlotPoint(
    projectId: string,
    plotId: string,
    data: CreatePlotPointDto,
  ): Promise<PlotPoint> {
    const response = await apiClient.post(
      `/projects/${projectId}/plots/${plotId}/points`,
      data,
    )
    return response.data
  },

  async updatePlotPoint(
    projectId: string,
    plotId: string,
    pointId: string,
    data: UpdatePlotPointDto,
  ): Promise<PlotPoint> {
    const response = await apiClient.put(
      `/projects/${projectId}/plots/${plotId}/points/${pointId}`,
      data,
    )
    return response.data
  },

  async deletePlotPoint(
    projectId: string,
    plotId: string,
    pointId: string,
  ): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/plots/${plotId}/points/${pointId}`)
  },

  async reorderPlotPoints(
    projectId: string,
    plotId: string,
    pointIds: string[],
  ): Promise<Plot> {
    const response = await apiClient.put(
      `/projects/${projectId}/plots/${plotId}/points/reorder`,
      { pointIds },
    )
    return response.data
  },
}
