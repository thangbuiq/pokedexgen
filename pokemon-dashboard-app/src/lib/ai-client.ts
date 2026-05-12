import type {
  ChatMessage,
  ChatResult,
  ChatRequest,
  ChatSuccessResponse,
  ChatErrorResponse,
} from './types/chat'

const REQUEST_TIMEOUT_MS = 30000

export async function fetchChatResponse(messages: ChatMessage[]): Promise<ChatResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const payload: ChatRequest = {
      messages: messages.filter((m) => m.content.trim().length > 0).slice(-20),
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
