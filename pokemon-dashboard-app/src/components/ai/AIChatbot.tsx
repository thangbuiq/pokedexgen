'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChatMessage } from '@/components/ai/ChatMessage'
import { ChatInput } from '@/components/ai/ChatInput'
import { useStreamingText } from '@/hooks/useStreamingText'
import { fetchChatResponse, type ChatMessage as ChatMessageType } from '@/lib/ai-client'

interface AIChatbotProps {
  isOpen: boolean
  onToggle: () => void
}

const WELCOME_MESSAGE: ChatMessageType = {
  role: 'assistant',
  content:
    "Hi! I'm your **Pokemon AI assistant**. Ask me anything:\n\n- Compare Pokemon stats\n- Build competitive teams\n- Find type counters\n- Check evolution chains\n- Analyze matchups\n\nWhat would you like to know?",
  timestamp: Date.now(),
}

const THINKING_STEPS = [
  'Analyzing your question...',
  'Searching the PokeDex database...',
  'Comparing stats and types...',
  'Building your answer...',
]

export function AIChatbot({ isOpen, onToggle }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [thinkingStep, setThinkingStep] = useState(0)
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasAutoScrolled = useRef(false)
  const messagesRef = useRef<ChatMessageType[]>([WELCOME_MESSAGE])
  const thinkingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamingKeyRef = useRef<string>('')

  const { displayedText, isComplete, isStreaming, stop } = useStreamingText(
    streamingContent || '',
    {
      speed: 40,
    }
  )

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, displayedText, scrollToBottom])

  useEffect(() => {
    if (isOpen && !hasAutoScrolled.current) {
      hasAutoScrolled.current = true
      setTimeout(scrollToBottom, 100)
    }
  }, [isOpen, scrollToBottom])

  // Thinking step animation
  useEffect(() => {
    if (isLoading) {
      setThinkingStep(0)
      thinkingIntervalRef.current = setInterval(() => {
        setThinkingStep((prev) => (prev + 1) % THINKING_STEPS.length)
      }, 2000)
    } else {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current)
        thinkingIntervalRef.current = null
      }
    }
    return () => {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current)
      }
    }
  }, [isLoading])

  // When streaming completes, add the full message to the list
  useEffect(() => {
    if (isComplete && streamingContent && !isLoading) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: streamingContent,
          timestamp: Date.now(),
          toolsUsed: ['search_pokemon'],
        },
      ])
      setStreamingContent(null)
    }
  }, [isComplete, streamingContent, isLoading])

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      const scrollY = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY.replace('-', ''), 10))
      }
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  const handleSend = useCallback(async (message: string) => {
    setError(null)
    setLastFailedMessage(null)
    const userMessage: ChatMessageType = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    const history = messagesRef.current.filter((m) => m !== WELCOME_MESSAGE)

    try {
      const result = await fetchChatResponse([...history, userMessage])
      setIsLoading(false)
      if (result.ok) {
        streamingKeyRef.current = `streaming-${Date.now()}`
        setStreamingContent(result.response)
      } else {
        setError(result.error)
        setLastFailedMessage(message)
      }
    } catch {
      setIsLoading(false)
      setError('Something went wrong. Please try again.')
      setLastFailedMessage(message)
    }
  }, [])

  const handleRetry = useCallback(() => {
    if (lastFailedMessage) {
      setError(null)
      handleSend(lastFailedMessage)
    }
  }, [lastFailedMessage, handleSend])

  const handleStop = useCallback(() => {
    stop()
    setIsLoading(false)
    if (streamingContent) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: streamingContent,
          timestamp: Date.now(),
          toolsUsed: ['search_pokemon'],
        },
      ])
      setStreamingContent(null)
    }
  }, [stop, streamingContent])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle()
      }
    },
    [isOpen, onToggle]
  )

  // Build the visible message list: include streaming message if active
  const visibleMessages = [...messages]
  if (isStreaming || (streamingContent && !isComplete)) {
    visibleMessages.push({
      role: 'assistant',
      content: displayedText,
      timestamp: Date.now(),
      toolsUsed: ['search_pokemon'],
    })
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40" onClick={onToggle} aria-hidden="true" />}

      <div
        className={[
          'fixed z-[200] flex flex-col',
          'bg-gradient-to-b from-[var(--background)] to-[var(--surface)]',
          'border border-[var(--card-border)]',
          'shadow-2xl shadow-black/20',
          'transition-all duration-300 ease-out',
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
          'inset-0 m-0 !rounded-none h-dvh',
          'sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[420px] sm:max-h-[600px] sm:h-auto sm:!rounded-2xl',
        ].join(' ')}
        role="complementary"
        aria-label="AI Pokemon Assistant"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--card-border)] shrink-0 sm:!rounded-t-2xl !rounded-none sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Image
                src="/pokeball.png"
                alt="Pokeball"
                width={22}
                height={22}
                className="object-contain drop-shadow-sm"
                unoptimized
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                Pokemon AI
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400" />
                    </span>
                    {THINKING_STEPS[thinkingStep]}
                  </span>
                ) : isStreaming ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    Generating response...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Online
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isStreaming && (
              <button
                onClick={handleStop}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--card-border)] hover:border-[var(--accent)] transition-all duration-200"
                title="Stop generating"
              >
                Stop
              </button>
            )}
            <button
              onClick={onToggle}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all duration-200"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-none px-4 py-4 custom-scrollbar"
          role="log"
          aria-live="polite"
        >
          {visibleMessages.map((msg, i) => {
            const isStreamingMsg =
              msg.role === 'assistant' && i === visibleMessages.length - 1 && isStreaming
            const key = isStreamingMsg
              ? streamingKeyRef.current
              : `${msg.role}-${i}-${msg.timestamp || i}`
            return (
              <ChatMessage
                key={key}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
                toolsUsed={msg.toolsUsed}
                isStreaming={isStreamingMsg}
              />
            )
          })}

          {/* Loading indicator (before streaming starts) */}
          {isLoading && !streamingContent && (
            <div className="flex justify-start mb-4 animate-[slide-in_0.2s_ease-out]">
              <div className="bg-[var(--surface)] border border-[var(--card-border)] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex justify-center mb-4 animate-[slide-in_0.2s_ease-out]">
              <div className="w-full rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg
                    className="w-4 h-4 shrink-0 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="font-medium text-red-400 text-sm">Error</span>
                </div>
                <p className="text-xs text-red-300/80 leading-relaxed">{error}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-[11px] text-red-400 hover:text-red-300 underline transition-colors font-medium"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 py-3 mb-4 border-t border-[var(--card-border)] bg-[var(--background)]/80 backdrop-blur-md safe-area-bottom">
          <ChatInput onSend={handleSend} isLoading={isLoading || isStreaming} />
        </div>
      </div>

      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className={[
            'fixed z-[200] bottom-5 right-5',
            'flex items-center gap-2.5',
            'px-5 py-3 rounded-full',
            'bg-gradient-to-r from-[var(--accent)] to-purple-600',
            'text-white text-sm font-semibold',
            'shadow-xl shadow-purple-500/30',
            'hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-105',
            'active:scale-95 transition-all duration-300',
            'animate-[slide-in_0.4s_ease-out]',
            'group',
          ].join(' ')}
          aria-label="Open AI Pokemon Assistant"
        >
          <div className="relative">
            <Image
              src="/pokeball.png"
              alt="Pokeball"
              width={22}
              height={22}
              className="shrink-0 object-contain group-hover:animate-bounce"
              style={{ animationDuration: '1.5s' }}
              unoptimized
            />
          </div>
          <span className="font-semibold whitespace-nowrap">Ask &rsquo;em all</span>
        </button>
      )}
    </>
  )
}
