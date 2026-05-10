interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  conversationHistory: ChatMessage[]
}

interface ChatSuccessResponse {
  response: string
  usage?: {
    prompt: number
    completion: number
    total: number
  }
}

interface ChatErrorResponse {
  error: string
}

type ChatResult =
  | { ok: true; response: string; usage?: ChatSuccessResponse['usage'] }
  | { ok: false; error: string; status?: number }

const REQUEST_TIMEOUT_MS = 30000

export async function fetchChatResponse(
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const payload: ChatRequest = {
      message: message.trim().slice(0, 800),
      conversationHistory: conversationHistory
        .filter((m) => m.content.trim().length > 0)
        .slice(-10),
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMessage = `Request failed (${response.status})`
      try {
        const body = (await response.json()) as ChatErrorResponse
        if (body.error) errorMessage = body.error
      } catch {}
      return { ok: false, error: errorMessage, status: response.status }
    }

    const data = (await response.json()) as ChatSuccessResponse

    if (!data.response || data.response.trim().length === 0) {
      return { ok: false, error: 'Received an empty response.' }
    }

    return { ok: true, response: data.response, usage: data.usage }
  } catch (err) {
    clearTimeout(timeoutId)

    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, error: 'Request timed out. Please try again.' }
    }

    const message = err instanceof Error ? err.message : 'Network error'
    return { ok: false, error: `Connection failed: ${message}` }
  }
}

export type { ChatMessage, ChatResult }
