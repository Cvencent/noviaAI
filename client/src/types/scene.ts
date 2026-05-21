export interface Scene {
  id: string
  projectId: string
  title: string
  summary?: string
  location?: string
  timePeriod?: string
  characters: string
  content?: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface CreateSceneDto {
  title: string
  summary?: string
  location?: string
  timePeriod?: string
  characters?: string
  content?: string
  order?: number
}

export interface UpdateSceneDto {
  title?: string
  summary?: string
  location?: string
  timePeriod?: string
  characters?: string
  content?: string
  order?: number
}

export interface ReorderScenesDto {
  sceneIds: string[]
}
