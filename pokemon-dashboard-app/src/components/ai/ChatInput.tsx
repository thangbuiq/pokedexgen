'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

const SUGGESTED_PROMPTS = [
  'Compare Charizard and Blastoise',
  'Build me a balanced team',
  'What counters Mewtwo?',
  'Best fire-type team?',
  'Explain type matchups',
  'Strongest dragon types',
]

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [input, isLoading, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    },
    [handleSend]
  )

  const handleSuggestionClick = useCallback((prompt: string) => {
    setInput(prompt)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Suggestions */}
      {showSuggestions && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--card-border)] shadow-lg z-30 animate-[slide-in_0.15s_ease-out]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
            Suggested questions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSuggestionClick(prompt)}
                className="px-3 py-1.5 rounded-full text-[11px] bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--card-border)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all duration-200 whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input container */}
      <div
        className={[
          'flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-200',
          'bg-[var(--surface-hover)] border',
          isFocused
            ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
            : 'border-[var(--card-border)]',
        ].join(' ')}
      >
        {/* Sparkle / suggestions button */}
        <button
          type="button"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className={[
            'shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200',
            showSuggestions
              ? 'text-[var(--accent)] bg-red-500/10'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
          ].join(' ')}
          aria-label="Show suggested prompts"
          title="Suggested questions"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
        </button>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isLoading ? 'Generating response...' : 'Ask about Pokemon...'}
          disabled={isLoading}
          maxLength={800}
          className="flex-1 border-none outline-none text-[16px] sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] py-2 min-w-0 select-none selection:bg-transparent bg-transparent"
          style={{ background: 'none', border: 'none', boxShadow: 'none', borderRadius: 0 }}
          aria-label="Chat message input"
          autoComplete="off"
        />

        {/* Character count */}
        {input.length > 0 && (
          <span className="text-[10px] text-[var(--text-muted)] tabular-nums shrink-0">
            {input.length}/800
          </span>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className={[
            'shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200',
            input.trim() && !isLoading
              ? 'bg-gradient-to-br from-[var(--accent)] to-red-600 text-white hover:scale-110 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]'
              : 'bg-[var(--surface-hover)] text-[var(--text-muted)]',
          ].join(' ')}
          aria-label="Send message"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx={12}
                cy={12}
                r={10}
                stroke="currentColor"
                strokeWidth={4}
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
