'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChatMessage } from '@/components/ai/ChatMessage'
import { ChatInput } from '@/components/ai/ChatInput'
import { fetchChatResponse, type ChatMessage as ChatMessageType } from '@/lib/ai-client'

interface AIChatbotProps {
  isOpen: boolean
  onToggle: () => void
}

const WELCOME_MESSAGE: ChatMessageType = {
  role: 'assistant',
  content:
    "Hi! I'm your **Pokemon AI assistant**. Ask me anything:\n\n- Compare Pokemon stats\n- Build competitive teams\n- Find type counters\n- Check evolution chains\n- Analyze matchups\n\nWhat would you like to know?",
}

export function AIChatbot({ isOpen, onToggle }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasAutoScrolled = useRef(false)
  const messagesRef = useRef<ChatMessageType[]>([WELCOME_MESSAGE])

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
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && !hasAutoScrolled.current) {
      hasAutoScrolled.current = true
      setTimeout(scrollToBottom, 100)
    }
  }, [isOpen, scrollToBottom])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSend = useCallback(async (message: string) => {
    setError(null)
    const userMessage: ChatMessageType = { role: 'user', content: message }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    const history = messagesRef.current.filter((m) => m !== WELCOME_MESSAGE)

    try {
      const result = await fetchChatResponse([...history, userMessage])
      setIsLoading(false)
      if (result.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: result.response }])
      } else {
        setError(result.error)
      }
    } catch {
      setIsLoading(false)
      setError('Something went wrong. Please try again.')
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle()
      }
    },
    [isOpen, onToggle]
  )

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40" onClick={onToggle} aria-hidden="true" />}

      <div
        className={[
          'fixed z-[200] flex flex-col bg-[var(--background)]',
          'border border-[var(--card-border)] shadow-2xl',
          'transition-all duration-300 ease-in-out',
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
          'inset-0 m-0 !rounded-none',
          'sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[400px] sm:max-h-[560px] sm:h-auto sm:!rounded-2xl',
        ].join(' ')}
        role="complementary"
        aria-label="AI Pokemon Assistant"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)] shrink-0 sm:!rounded-t-2xl !rounded-none">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 flex items-center justify-center">
                <Image
                  src="/pokeball.png"
                  alt="Pokeball"
                  width={28}
                  height={28}
                  className="object-contain drop-shadow-sm"
                  unoptimized
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                Pokemon AI
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <span
                      className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                    Thinking
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

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-none px-4 py-3 custom-scrollbar"
          role="log"
          aria-live="polite"
        >
          {messages.map((msg, i) => (
            <ChatMessage key={`${msg.role}-${i}`} role={msg.role} content={msg.content} />
          ))}

          {isLoading && (
            <div className="flex justify-start mb-3 animate-[slide-in_0.2s_ease-out]">
              <div className="bg-[var(--surface-hover)] border border-[var(--card-border)] rounded-2xl rounded-bl-md px-4 py-3">
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

          {error && (
            <div className="flex justify-center mb-3">
              <div className="w-full rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs text-red-400">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
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
                  <span className="font-medium">Error</span>
                </div>
                <p className="leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="mt-2 text-[11px] text-red-400 underline hover:text-red-300 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>

        <div className="shrink-0 px-4 py-3 border-t border-[var(--card-border)] bg-[var(--background)]">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>

      {!isOpen && (
        <button
          onClick={onToggle}
          className={[
            'fixed z-[200] bottom-5 right-5',
            'flex items-center gap-2',
            'px-4 py-2.5 rounded-full',
            'bg-gradient-to-r from-[var(--accent)] to-purple-500',
            'text-white text-sm font-medium',
            'shadow-lg shadow-purple-500/25',
            'hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105',
            'active:scale-95 transition-all duration-300',
            'animate-[slide-in_0.3s_ease-out]',
            'group',
          ].join(' ')}
          aria-label="Open AI Pokemon Assistant"
        >
          <Image
            src="/pokeball.png"
            alt="Pokeball"
            width={22}
            height={22}
            className="shrink-0 object-contain animate-bounce"
            style={{ animationDuration: '2s' }}
            unoptimized
          />
          <span className="font-semibold whitespace-nowrap">Ask &rsquo;em all</span>
        </button>
      )}
    </>
  )
}
