// web/src/features/pdf-simulator/types/chat.ts

export type ChatMessageRole = 'user' | 'ai' | 'system'

export type RightTab = 'chat' | 'sim' | 'notes'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  timestamp: Date
  sourceHighlight?: { text: string; page: number }
  relatedFormulas?: string[]
  keyTakeaways?: string[]
  conceptTitle?: string
  selectedText?: string
  surroundingContext?: string
  isLoading?: boolean
  isStreaming?: boolean
  isError?: boolean
  /** Exact system + conversation payload sent to the LLM. */
  llmPrompt?: string
  /** Pasted or snipped image shown in this user bubble only. */
  image?: string
}
