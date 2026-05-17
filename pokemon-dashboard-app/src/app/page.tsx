'use client'

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { HowToGuide } from '@/components/ui/HowToGuide'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PokemonGridSkeleton } from '@/components/ui/Skeleton'
import { PokemonGrid } from '@/components/pokedex/PokemonGrid'
import { PokemonDetailModal } from '@/components/pokedex/PokemonDetailModal'
import { AIChatbot } from '@/components/ai/AIChatbot'
import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import { type PokemonRow } from '@/lib/types/pokemon'
import { parseTypes } from '@/lib/utils/pokemon'
import { useJSONQuery } from '@/lib/hooks/useJSONQuery'
import { ALL_TYPES } from '@/lib/type-effectiveness'

// ===== Constants =================================================================

type SortKey = 'id' | 'name' | 'total_stats'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'id', label: '#' },
  { key: 'name', label: 'Name' },
  { key: 'total_stats', label: 'Stats' },
]

// ===== Main Component =========================================================

function HomeContent() {
  useSearchParams() // required for Suspense boundary - reads URL params below
  const [search, setSearch] = useState('')
  const [activeTypes, setActiveTypes] = useState<Set<PokemonType>>(new Set())
  const [sortBy, setSortBy] = useState<SortKey>('id')
  const [selected, setSelected] = useState<PokemonRow | null>(null)

  const [showTypeFilter, setShowTypeFilter] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const hasSetInitialSelected = useRef(false)

  // ===== URL sync ============================================================

  useEffect(() => {
    if (!hasSetInitialSelected.current) {
      hasSetInitialSelected.current = true
      return
    }
    const url = new URL(window.location.href)
    if (!selected) {
      url.searchParams.delete('id')
    } else {
      url.searchParams.set('id', String(selected.id))
    }
    window.history.replaceState({}, '', url)
  }, [selected])

  // ===== Data ================================================================

  const { data, loading, error } = useJSONQuery<PokemonRow>('pokemon.json')

  const enrichedData = useMemo(() => {
    if (!data) return []
    const seen = new Set<number>()
    const result: PokemonRow[] = []

    for (const p of data) {
      if (seen.has(p.id)) continue
      if (!p.sprite_url) continue
      seen.add(p.id)

      const parsed = parseTypes(p.types || p.type_names || '')
      result.push({
        ...p,
        parsedTypes: parsed,
        primaryType: parsed[0] ?? 'normal',
        lowerName: p.name.toLowerCase(),
        lowerJpName: p.japanese_name?.toLowerCase() ?? '',
      })
    }
    return result
  }, [data])

  const pokemonByName = useMemo(() => {
    const map = new Map<string, PokemonRow>()
    for (const pokemon of enrichedData) {
      if (!map.has(pokemon.name)) {
        map.set(pokemon.name, pokemon)
      }
    }
    return map
  }, [enrichedData])

  const pokemonById = useMemo(() => {
    const map = new Map<number, PokemonRow>()
    for (const pokemon of enrichedData) {
      if (!map.has(pokemon.id)) {
        map.set(pokemon.id, pokemon)
      }
    }
    return map
  }, [enrichedData])

  // ===== Initial selection from URL ==========================================

  useEffect(() => {
    if (!enrichedData.length) return
    const urlParams = new URLSearchParams(window.location.search)
    const idParam = urlParams.get('id')
    if (!idParam) return
    const id = parseInt(idParam, 10)
    if (Number.isNaN(id)) return
    const pokemon = pokemonById.get(id)
    if (pokemon) setSelected(pokemon)
  }, [enrichedData, pokemonById])

  // ===== Filtering & Sorting =================================================

  const toggleType = useCallback((type: PokemonType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    let result = enrichedData

    // Fuzzy-ish search (includes + handles common misspellings via substring matching)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((p) => {
        if (p.lowerName!.includes(q)) return true
        if (p.lowerJpName!.includes(q)) return true
        // Simple fuzzy: check if all characters appear in order
        let idx = 0
        for (const char of q) {
          idx = p.lowerName!.indexOf(char, idx)
          if (idx === -1) return false
          idx++
        }
        return true
      })
    }

    // Type filter (AND logic - must match ALL selected types)
    if (activeTypes.size > 0) {
      result = result.filter((p) => {
        return [...activeTypes].every((t) => p.parsedTypes!.includes(t))
      })
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === 'name') return a.lowerName!.localeCompare(b.lowerName!)
      if (sortBy === 'total_stats') return b.total_stats - a.total_stats
      return a.id - b.id
    })
  }, [enrichedData, search, activeTypes, sortBy])

  // ===== Loading / Error ====================================================

  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 h-11 rounded-lg bg-[var(--surface-hover)] animate-pulse" />
          <div className="flex gap-1.5">
            {SORT_OPTIONS.map(({ key }) => (
              <div
                key={key}
                className="w-14 h-10 rounded-lg bg-[var(--surface-hover)] animate-pulse"
              />
            ))}
          </div>
        </div>
        <PokemonGridSkeleton count={12} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-400"
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
        </div>
        <p className="text-red-400 text-sm">Failed to load Pokemon data</p>
        <p className="text-[var(--text-muted)] text-xs">{error.message}</p>
      </div>
    )
  }

  // ===== Render ==============================================================

  return (
    <div>
      <HowToGuide title="Pokédex Guide">
        Search or filter by type, then click any Pokémon to view stats, type matchups, evolution
        chain, moves, and fight simulation. Use the sort buttons to reorder by ID, name, or total
        stats.
      </HowToGuide>

      {/* == Search & Sort ================================================ */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Pokemon"
            className="w-full pl-10 pr-10 py-2.5 rounded-lg glass text-[16px] sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-[var(--card-border)] transition-all"
            aria-label="Search Pokemon by name"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label="Clear search"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex gap-1.5" role="group" aria-label="Sort options">
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={[
                'px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 border',
                sortBy === key
                  ? 'glass text-[var(--text-primary)] border-[var(--card-border)] shadow-[0_0_10px_var(--card-border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface)]',
              ].join(' ')}
              aria-pressed={sortBy === key}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* == Type Filter Pills ============================================ */}

      {/* Mobile: toggle button + collapsible badge grid */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setShowTypeFilter(!showTypeFilter)}
          className={[
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-[family-name:var(--font-pixel)] uppercase tracking-wider transition-all duration-300 border-2',
            showTypeFilter
              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-[0_0_16px_var(--accent-glow)]'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--card-border)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]',
          ].join(' ')}
          aria-expanded={showTypeFilter}
          aria-controls="mobile-type-filter"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${showTypeFilter ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          Filter by Type
          {activeTypes.size > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[9px] font-bold">
              {activeTypes.size}
            </span>
          )}
        </button>

        {showTypeFilter && (
          <div
            id="mobile-type-filter"
            className="mt-3 grid grid-cols-3 gap-2 animate-[slide-in_0.2s_ease-out]"
          >
            {ALL_TYPES.map((type) => {
              const isActive = activeTypes.has(type)
              const color = typeColorMap[type]
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={[
                    'flex items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[10px] font-[family-name:var(--font-pixel)] uppercase tracking-wider transition-all duration-200',
                    isActive
                      ? 'ring-2 ring-offset-1 ring-purple-400 scale-105'
                      : 'opacity-80 hover:opacity-100 hover:scale-105',
                  ].join(' ')}
                  style={{
                    backgroundColor: color,
                    color: '#fff',
                    boxShadow: isActive
                      ? `0 0 12px ${color}80, 0 0 4px #a855f7`
                      : `0 0 6px ${color}30`,
                    border: `1px solid ${color}`,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="shrink-0"
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                  {type}
                </button>
              )
            })}
            {activeTypes.size > 0 && (
              <button
                onClick={() => setActiveTypes(new Set())}
                className="col-span-3 mt-1 py-1.5 rounded-lg text-[10px] font-[family-name:var(--font-pixel)] uppercase tracking-wider text-[var(--text-muted)] border border-dashed border-[var(--card-border)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop: inline flex-wrap badges */}
      <div className="hidden sm:flex flex-wrap gap-2 mb-6" role="group" aria-label="Type filters">
        {ALL_TYPES.map((type) => {
          const isActive = activeTypes.has(type)
          const color = typeColorMap[type]
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-[family-name:var(--font-pixel)] uppercase tracking-wider transition-all duration-300 border-2 flex items-center gap-1.5',
                isActive ? 'scale-105 brightness-110' : 'hover:scale-105 hover:brightness-125',
              ].join(' ')}
              style={{
                backgroundColor: color,
                color: '#fff',
                borderColor: isActive ? '#a855f7' : color,
                boxShadow: isActive
                  ? `0 0 0 2px ${color}60, 0 0 20px ${color}80, 0 0 8px #a855f7`
                  : `0 0 8px ${color}40`,
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
              aria-pressed={isActive}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.boxShadow = `0 0 16px ${color}60, 0 0 32px ${color}30`
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.boxShadow = `0 0 8px ${color}40`
                }
              }}
            >
              {isActive && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="shrink-0"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
              {type}
            </button>
          )
        })}
      </div>

      {/* == Pokemon Grid ================================================ */}
      <PokemonGrid pokemon={filtered} onSelect={(p) => setSelected(p)} />

      {/* == Detail Modal =================================================== */}
      {selected && (
        <PokemonDetailModal
          selected={selected}
          allPokemon={data ?? []}
          pokemonByName={pokemonByName}
          onClose={() => setSelected(null)}
          onSelectPokemon={(pokemon) => setSelected(pokemon as PokemonRow)}
        />
      )}

      <AIChatbot isOpen={isChatOpen} onToggle={() => setIsChatOpen((o) => !o)} />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <LoadingSpinner size={64} />
          <p className="text-[var(--text-secondary)] text-sm font-[family-name:var(--font-pixel)] tracking-wider">
            LOADING...
          </p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
