import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import {
  HumanMessage,
  AIMessage,
  ToolMessage,
  SystemMessage,
  BaseMessage,
} from '@langchain/core/messages'
import { pokemonTools, toolsByName } from '@/lib/langchain-tools'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const TIMEOUT_MS = 25000

const SYSTEM_PROMPT = `You are a Pokemon data assistant with access to tools that query a Pokemon database.

Rules:
1. Only answer Pokemon-related questions.
2. If asked about non-Pokemon topics, politely decline and suggest asking about Pokemon instead.
3. Use the available tools to fetch accurate data instead of guessing.
4. Be concise and cite specific stats when possible.`

interface ClientMessage {
  role: string
  content: string | null
}

function sanitizeContent(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.slice(0, 4000).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
}

function buildLangChainMessages(clientMessages: ClientMessage[]): BaseMessage[] {
  const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT)]

  for (const msg of clientMessages.slice(-20)) {
    if (!msg || typeof msg !== 'object') continue
    const content = sanitizeContent(msg.content)

    if (msg.role === 'user') {
      messages.push(new HumanMessage(content))
    } else if (msg.role === 'assistant') {
      messages.push(new AIMessage(content))
    }
  }

  return messages
}

function createModel() {
  return new ChatOpenAI({
    model: OPENAI_MODEL,
    temperature: 0.4,
    maxTokens: 800,
    apiKey: OPENAI_API_KEY,
    configuration: { baseURL: OPENAI_BASE_URL },
    timeout: TIMEOUT_MS,
  }).bindTools(pokemonTools)
}

function extractErrorInfo(err: unknown): { message: string; status?: number } {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    if (msg.includes('timeout'))
      return { message: 'Request timed out. Please try again later.', status: 504 }
    if (msg.includes('rate limit') || msg.includes('429'))
      return { message: `Rate limited: ${err.message}`, status: 429 }
    if (msg.includes('401') || msg.includes('403') || msg.includes('invalid api key')) {
      return {
        message: 'Invalid API key. Please check your OPENAI_API_KEY configuration.',
        status: 500,
      }
    }
    return { message: err.message }
  }
  return { message: 'Unknown error occurred' }
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI API key not configured. Please set OPENAI_API_KEY in your environment.' },
      { status: 500 }
    )
  }

  let clientMessages: ClientMessage[]
  try {
    const raw = await request.json()
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.messages)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { messages: [...] }.' },
        { status: 400 }
      )
    }
    clientMessages = raw.messages
      .filter((m: unknown) => m && typeof m === 'object')
      .map((m: { role?: string; content?: string | null }) => ({
        role: String(m.role || ''),
        content: m.content ?? null,
      }))
      .filter((m: ClientMessage) => ['user', 'assistant'].includes(m.role))
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
  }

  if (clientMessages.length === 0) {
    return NextResponse.json({ error: 'No valid messages provided.' }, { status: 400 })
  }

  try {
    const model = createModel()
    let messages = buildLangChainMessages(clientMessages)

    // Pass 1: Ask the model (it may decide to call tools)
    const firstResponse = await model.invoke(messages)
    console.log(
      '[chat] first response finish_reason:',
      firstResponse.response_metadata?.finish_reason
    )

    // If no tool calls, return the response directly
    const toolCalls = firstResponse.tool_calls
    if (!toolCalls || toolCalls.length === 0) {
      const answer = String(firstResponse.content || 'I am not sure how to answer that.')
      console.log('[chat] direct response:', answer.slice(0, 200))
      return NextResponse.json({ response: answer })
    }

    // Execute tool calls
    console.log('[chat] executing tools:', toolCalls.map((tc) => tc.name).join(', '))

    const toolMessages: ToolMessage[] = []
    for (const tc of toolCalls) {
      const t = toolsByName.get(tc.name)
      if (!t) {
        toolMessages.push(
          new ToolMessage(JSON.stringify({ error: `Unknown tool: ${tc.name}` }), tc.id ?? 'unknown')
        )
        continue
      }

      try {
        const result = await (t as { invoke: (args: unknown) => Promise<string> }).invoke(tc.args)
        toolMessages.push(new ToolMessage(String(result), tc.id ?? 'unknown'))
      } catch (toolErr) {
        const errMsg = toolErr instanceof Error ? toolErr.message : 'Tool execution failed'
        toolMessages.push(new ToolMessage(JSON.stringify({ error: errMsg }), tc.id ?? 'unknown'))
      }
    }

    // Pass 2: Send tool results back to the model
    messages = [...messages, firstResponse, ...toolMessages]
    const finalResponse = await model.invoke(messages)

    const answer = String(finalResponse.content || 'I am not sure how to answer that.')
    console.log('[chat] tool response:', answer.slice(0, 200))
    return NextResponse.json({ response: answer })
  } catch (err) {
    const { message, status } = extractErrorInfo(err)
    console.error('[chat] error:', message)
    return NextResponse.json({ error: message }, { status: status || 502 })
  }
}

export const runtime = 'nodejs'
