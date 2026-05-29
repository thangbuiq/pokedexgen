export interface UserMessage {
  role: 'user'
  content: string
  timestamp?: number
  toolsUsed?: string[]
}

export interface AssistantMessage {
  role: 'assistant'
  content: string
  timestamp?: number
  toolsUsed?: string[]
}

export type ChatMessage = UserMessage | AssistantMessage

export interface StreamingState {
  isStreaming: boolean
  displayedText: string
  isComplete: boolean
  stop: () => void
}

export interface ChatRequest {
  messages: ChatMessage[]
}

export interface ChatSuccessResponse {
  response: string
  usage?: {
    prompt: number
    completion: number
    total: number
  }
}

export interface ChatErrorResponse {
  error: string
}

export type ChatResult =
  | { ok: true; response: string; usage?: ChatSuccessResponse['usage'] }
  | { ok: false; error: string; status?: number }
