import type { ChatMessage, ChatResult, ChatRequest } from './types/chat'

const REQUEST_TIMEOUT_MS = 30000

async function parseErrorBody(response: Response): Promise<{ error: string; status: number }> {
  let errorMessage = `Request failed (${response.status})`
  try {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await response.json()
      if (body.error) errorMessage = body.error
    } else {
      const text = await response.text()
      if (text) errorMessage = text.slice(0, 500)
    }
  } catch {}
  return { error: errorMessage, status: response.status }
}

function buildPayload(messages: ChatMessage[]): ChatRequest {
  return {
    messages: messages.filter((m) => m.content.trim().length > 0).slice(-20),
  }
}

/** Non-streaming fetch. Kept for backward compatibility. */
export async function fetchChatResponse(messages: ChatMessage[]): Promise<ChatResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(messages)),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const { error, status } = await parseErrorBody(response)
      return { ok: false, error, status }
    }

    // Non-streaming endpoint may still return streaming text/plain.
    // Fall back to reading full body if content-type is not json.
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/plain')) {
      const text = await response.text()
      if (!text.trim()) return { ok: false, error: 'Received an empty response.' }
      return { ok: true, response: text }
    }

    const data = await response.json()
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

interface StreamOptions {
  signal?: AbortSignal
}

/**
 * Streaming chat response using ReadableStream + getReader.
 *
 * Calls `onChunk` with each text token as it arrives from the server.
 * Returns a result indicating success or error.
 *
 * Pattern from: https://rebeccamdeprey.com/blog/render-openai-stream-responses-with-react
 */
export async function streamChatResponse(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  options: StreamOptions = {}
): Promise<ChatResult> {
  const { signal } = options

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(messages)),
      signal,
    })

    if (!response.ok) {
      const { error, status } = await parseErrorBody(response)
      return { ok: false, error, status }
    }

    if (!response.body) {
      return { ok: false, error: 'Response body is empty.' }
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        onChunk(value)
      }
    }

    return { ok: true }
  } catch (err) {
    // Let AbortError propagate so callers can distinguish user-initiated stops
    if (err instanceof Error && err.name === 'AbortError') {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Network error'
    return { ok: false, error: `Connection failed: ${message}` }
  }
}

export type { ChatMessage, ChatResult }
