export interface WorldSettingItem {
  id: string
  worldSettingId: string
  name: string
  description?: string
  details?: any
  createdAt: string
  updatedAt: string
}

export interface WorldSetting {
  id: string
  projectId: string
  category: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  items?: WorldSettingItem[]
}

export interface CreateWorldSettingDto {
  category: string
  name: string
  description?: string
  items?: CreateWorldSettingItemDto[]
}

export interface CreateWorldSettingItemDto {
  name: string
  description?: string
  details?: any
}

export interface UpdateWorldSettingDto {
  category?: string
  name?: string
  description?: string
  items?: UpdateWorldSettingItemDto[]
}

export interface UpdateWorldSettingItemDto {
  name?: string
  description?: string
  details?: any
}
