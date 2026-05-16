export interface Project {
  id: string
  userId: string
  title: string
  subtitle?: string
  synopsis: string
  genre: string
  tags: string[]
  status: string
  wordCount: number
  createdAt: string
  updatedAt: string
  worldSettings?: WorldSetting[]
  characters?: Character[]
  scenes?: Scene[]
  plots?: Plot[]
  chapters?: Chapter[]
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

export interface WorldSettingItem {
  id: string
  worldSettingId: string
  name: string
  description?: string
  details?: any
  createdAt: string
  updatedAt: string
}

export interface Character {
  id: string
  projectId: string
  name: string
  role?: string
  appearance?: string
  personality?: string
  background?: string
  goals?: string
  flaws?: string
  arc?: string
  voice?: string
  notes?: string
  createdAt: string
  updatedAt: string
  relationshipsFrom?: CharacterRelationship[]
  relationshipsTo?: CharacterRelationship[]
}

export interface CharacterRelationship {
  id: string
  fromId: string
  toId: string
  relationship: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Scene {
  id: string
  projectId: string
  title: string
  summary?: string
  location?: string
  timePeriod?: string
  characters: string[]
  content?: string
  order?: number
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
  plotPoints?: PlotPoint[]
}

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

export interface Chapter {
  id: string
  projectId: string
  title: string
  order: number
  status: string
  wordCount: number
  summary?: string
  createdAt: string
  updatedAt: string
  contents?: ChapterContent[]
  summaries?: ChapterSummary[]
}

export interface ChapterContent {
  id: string
  chapterId: string
  content: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface ChapterSummary {
  id: string
  chapterId: string
  summary: string
  createdAt: string
  updatedAt: string
}

export interface CreateProjectDto {
  title: string
  subtitle?: string
  synopsis: string
  genre: string
  tags?: string[]
  status?: string
  wordCount?: number
}

export interface UpdateProjectDto {
  title?: string
  subtitle?: string
  synopsis?: string
  genre?: string
  tags?: string[]
  status?: string
  wordCount?: number
}
