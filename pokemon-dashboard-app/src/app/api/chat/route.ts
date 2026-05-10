import { NextRequest, NextResponse } from 'next/server'
import { buildMessages, MAX_COMPLETION_TOKENS } from '@/lib/prompts'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const TIMEOUT_MS = 25000
const MAX_MESSAGE_LENGTH = 800
const MAX_HISTORY_EXCHANGES = 5

interface ChatRequestBody {
  message: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

function sanitizeString(input: string, maxLength: number): string {
  return input.slice(0, maxLength).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
}

function validateMessages(
  history: unknown
): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!Array.isArray(history)) return []

  const MAX_HISTORY_MESSAGES = MAX_HISTORY_EXCHANGES * 2

  return history
    .filter(
      (item): item is { role: 'user' | 'assistant'; content: string } =>
        typeof item === 'object' &&
        item !== null &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string' &&
        item.content.length > 0
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => ({
      role: item.role,
      content: sanitizeString(item.content, 1000),
    }))
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI API key not configured. Please set OPENAI_API_KEY in your environment.' },
      { status: 500 }
    )
  }

  let body: ChatRequestBody
  try {
    const raw = await request.json()
    if (!raw || typeof raw !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON object.' },
        { status: 400 }
      )
    }
    if (typeof raw.message !== 'string' || raw.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string.' },
        { status: 400 }
      )
    }

    body = {
      message: sanitizeString(raw.message, MAX_MESSAGE_LENGTH),
      conversationHistory: validateMessages(raw.conversationHistory),
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
  }

  const userMessage = body.message.trim()
  console.log('[chat] input:', userMessage)

  const messages = buildMessages(userMessage, body.conversationHistory ?? [])
  const systemContent = messages[0]?.content || ''
  const hasContext = systemContent.includes('Relevant Pokemon')
  console.log('[chat] context — has Pokemon data:', hasContext)

  if (!hasContext) {
    console.log('[chat] no Pokemon found in database')
    return NextResponse.json({
      response:
        "I couldn't find any Pokemon matching your query. Please double-check the spelling of the Pokemon name(s) and try again. If you used a non-English name, try the English name instead.",
    })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        max_tokens: MAX_COMPLETION_TOKENS,
        temperature: 0.4,
        top_p: 0.95,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[chat] API error (${response.status}):`, errorText)

      let parsedError = errorText
      try {
        const json = JSON.parse(errorText)
        parsedError = json.error?.message || json.message || errorText
      } catch {}

      if (response.status === 429) {
        return NextResponse.json({ error: `Rate limited: ${parsedError}` }, { status: 429 })
      }
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your OPENAI_API_KEY configuration.' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: `API error (${response.status}): ${parsedError}` },
        { status: 502 }
      )
    }

    const data = await response.json()

    if (!data.choices?.[0]?.message?.content) {
      console.error('[chat] unexpected response:', JSON.stringify(data).slice(0, 500))
      return NextResponse.json(
        { error: 'Received an empty response from the AI service.' },
        { status: 502 }
      )
    }

    const answer = data.choices[0].message.content
    console.log('[chat] output:', answer.slice(0, 200))

    return NextResponse.json({ response: answer })
  } catch (err) {
    clearTimeout(timeoutId)

    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. Please try a shorter question or try again later.' },
        { status: 504 }
      )
    }

    const message = err instanceof Error ? err.message : 'Network error'
    console.error('[chat] error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export const runtime = 'nodejs'
