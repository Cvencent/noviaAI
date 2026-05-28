export interface Conversation {
  id: string
  projectId: string
  title: string
  type: 'general' | 'character' | 'plot' | 'world' | 'chapter' | 'outline'
  createdAt: Date
  updatedAt: Date
  messages?: Message[]
}

export interface ActionSuggestion {
  title: string
  description: string
  actionType: string
  parameters: ActionParameter[]
}

export interface ActionParameter {
  name: string
  value: any
  description?: string
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actionsJson?: any
  cardsJson?: ChoiceCard[] | string
  actionCards?: ActionSuggestion[]
}

export interface StreamState {
  status: 'RUNNING' | 'COMPLETED' | 'FAILED'
  requestMessageId?: string
  request?: {
    message: string
    provider?: string
    chapterId?: string
    chapterContent?: string
    chapterTitle?: string
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  }
  error?: string
  updatedAt?: string
}

export interface ChoiceCard {
  id: string
  title: string
  description: string
  content?: any
  actionType: string
  selectedAt?: string
}

export interface ConversationFocusTarget {
  conversationId: string
  messageId: string
  cardId?: string
  nonce: number
}
