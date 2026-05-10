'use client'

import { useMemo } from 'react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

const SCALING_PATTERN = /(\d*\.?\d+x)/gi

function getScalingBadgeStyle(mult: string): { bg: string; text: string; label: string } {
  const num = parseFloat(mult)
  if (num === 0 || mult === '0x') return { bg: 'bg-[#201122]', text: 'text-white', label: '0x' }
  if (num <= 0.25) return { bg: 'bg-[#8b2500]', text: 'text-white', label: mult }
  if (num <= 0.5) return { bg: 'bg-[#8B1A1A]', text: 'text-white', label: mult }
  if (num >= 4) return { bg: 'bg-[#2d6a1e]', text: 'text-white', label: mult }
  if (num >= 2) return { bg: 'bg-[#166534]', text: 'text-white', label: mult }
  if (num === 1) return { bg: 'bg-[var(--surface)]', text: 'text-[var(--text-muted)]', label: mult }
  return { bg: 'bg-[var(--surface-hover)]', text: 'text-[var(--text-secondary)]', label: mult }
}

function renderMarkdown(text: string): string {
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-bold text-purple-600 dark:text-purple-400">$1</strong>'
  )
  html = html.replace(/\*(.+?)\*/g, '<em class="italic text-purple-500/80">$1</em>')
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--card-border)] text-[var(--accent)] text-[11px] font-mono">$1</code>'
  )

  html = html.replace(SCALING_PATTERN, (match) => {
    const style = getScalingBadgeStyle(match)
    return `<span class="inline-flex items-center px-1.5 py-px rounded text-[11px] font-bold font-mono border ${style.bg} ${style.text} border-white/10">${style.label}</span>`
  })

  html = html.replace(
    /^- (.+)$/gm,
    '<li class="ml-4 list-disc text-[var(--text-secondary)]">$1</li>'
  )
  html = html.replace(
    /^(\d+)\. (.+)$/gm,
    '<li class="ml-4 list-decimal text-[var(--text-secondary)]">$2</li>'
  )
  html = html.replace(/\n/g, '<br />')
  return html
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user'

  const renderedContent = useMemo(() => renderMarkdown(content), [content])

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-[slide-in_0.2s_ease-out]`}
      role="listitem"
    >
      <div
        className={[
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words',
          isUser
            ? 'bg-[var(--accent)] text-white rounded-br-md'
            : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] rounded-bl-md border border-[var(--card-border)]',
        ].join(' ')}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div
            className="text-[13px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        )}
      </div>
    </div>
  )
}
