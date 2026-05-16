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
  fromCharacter?: {
    id: string
    name: string
  }
  toCharacter?: {
    id: string
    name: string
  }
}

export interface CreateCharacterDto {
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
}

export interface UpdateCharacterDto {
  name?: string
  role?: string
  appearance?: string
  personality?: string
  background?: string
  goals?: string
  flaws?: string
  arc?: string
  voice?: string
  notes?: string
}

export interface CreateCharacterRelationshipDto {
  fromId: string
  toId: string
  relationship: string
  description?: string
}

export interface UpdateCharacterRelationshipDto {
  relationship: string
  description?: string
}
