'use client'

import { useMemo, useEffect, useState } from 'react'
import { PokemonCard } from './PokemonCard'
import { getPokemonId, getPokemonInfo, loadPokemonLookup } from '@/lib/pokemon-lookup'

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

  // Bold — RED for Pokemon theme
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-red-500">$1</strong>')
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

function linkifyPokemonNames(html: string): string {
  // Find Pokemon names in the already-rendered HTML and wrap them in links
  // We operate on the text content, not the HTML tags
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      let result = text

      // Find all Pokemon names and replace with links
      const names = new Map<string, number>()
      const words = text.split(/(\s+)/)
      for (const word of words) {
        const clean = word.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()
        if (clean.length < 3) continue
        const id = getPokemonId(clean)
        if (id !== undefined) {
          names.set(word, id)
        }
      }

      // Replace from longest to shortest to avoid partial matches
      const sorted = [...names.entries()].sort((a, b) => b[0].length - a[0].length)
      for (const [name, id] of sorted) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        result = result.replace(
          new RegExp(`(?<!<[^>]*)\\b${escaped}\\b`, 'g'),
          `<a href="https://pokedexgen.vercel.app/?id=${id}" target="_blank" rel="noopener noreferrer" class="text-red-400 hover:text-red-300 underline font-semibold transition-colors">${name}</a>`
        )
      }

      if (result !== text) {
        const wrapper = document.createElement('span')
        wrapper.innerHTML = result
        node.parentNode?.replaceChild(wrapper, node)
      }
    } else {
      for (const child of Array.from(node.childNodes)) {
        walk(child)
      }
    }
  }

  for (const child of Array.from(tempDiv.childNodes)) {
    walk(child)
  }

  return tempDiv.innerHTML
}

function extractPokemonFromContent(content: string): Array<{
  id: number
  name: string
  types: string[]
  stats: {
    hp: number
    attack: number
    defense: number
    special_attack: number
    special_defense: number
    speed: number
    total: number
  }
  height?: number
  weight?: number
}> {
  const found = new Map<number, ReturnType<typeof getPokemonInfo>>()

  // Try to find Pokemon names in the text
  const words = content.split(/\s+/)
  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()
    if (clean.length < 3) continue
    const id = getPokemonId(clean)
    if (id !== undefined && !found.has(id)) {
      const info = getPokemonInfo(id)
      if (info) found.set(id, info)
    }
  }

  // Also try to parse any JSON blocks that might contain structured Pokemon data
  try {
    const jsonMatches = content.match(/\{[\s\S]*?"name"[\s\S]*?\}/g)
    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match)
          if (parsed.name && parsed.id) {
            const info = getPokemonInfo(parsed.id)
            if (info && !found.has(parsed.id)) {
              found.set(parsed.id, info)
            }
          }
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item.name && item.id) {
                const info = getPokemonInfo(item.id)
                if (info && !found.has(item.id)) {
                  found.set(item.id, info)
                }
              }
            }
          }
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }

  return [...found.values()].filter(Boolean) as Array<{
    id: number
    name: string
    types: string[]
    stats: {
      hp: number
      attack: number
      defense: number
      special_attack: number
      special_defense: number
      speed: number
      total: number
    }
    height?: number
    weight?: number
  }>
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user'
  const [linkedHtml, setLinkedHtml] = useState('')

  // Load Pokemon lookup on mount
  useEffect(() => {
    loadPokemonLookup().catch(() => {})
  }, [])

  const baseHtml = useMemo(() => renderMarkdown(content), [content])

  // Client-side only: linkify Pokemon names
  useEffect(() => {
    setLinkedHtml(linkifyPokemonNames(baseHtml))
  }, [baseHtml])

  const mentionedPokemon = useMemo(() => {
    if (isUser) return []
    return extractPokemonFromContent(content)
  }, [content, isUser])

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-[slide-in_0.2s_ease-out]`}
      role="listitem"
    >
      <div
        className={[
          'max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words',
          isUser
            ? 'bg-[var(--accent)] text-white rounded-br-md'
            : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] rounded-bl-md border border-[var(--card-border)]',
        ].join(' ')}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <>
            <div
              className="text-[13px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: linkedHtml || baseHtml }}
            />
            {mentionedPokemon.length > 0 && (
              <div className="mt-3 pt-2 border-t border-[var(--card-border)]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Related Pokemon
                </p>
                <div className="space-y-2">
                  {mentionedPokemon.map((p) => (
                    <PokemonCard key={p.id} {...p} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
