export interface UserMessage {
  role: 'user'
  content: string
}

export interface AssistantMessage {
  role: 'assistant'
  content: string
}

export type ChatMessage = UserMessage | AssistantMessage

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
