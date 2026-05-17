'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import { type PokemonRow } from '@/lib/types/pokemon'
import { parseTypes } from '@/lib/utils/pokemon'
import { isSpriteMissing, getSpriteUrl as OFFICIAL_ARTWORK } from '@/lib/sprites'

// ===== Types ==================================================================

interface PokemonGridProps {
  pokemon: PokemonRow[]
  onSelect: (pokemon: PokemonRow) => void
}

interface PokemonCardProps {
  pkmn: PokemonRow
  onSelect: (pokemon: PokemonRow) => void
}

// Memoized card component — prevents re-renders when parent state changes
const PokemonCard = memo(function PokemonCard({ pkmn, onSelect }: PokemonCardProps) {
  const types = pkmn.parsedTypes ?? parseTypes(pkmn.types || pkmn.type_names || '')
  const primary = pkmn.primaryType ?? types[0] ?? 'normal'
  const primaryColor = typeColorMap[primary]

  return (
    <div className="animate-[slide-in_0.3s_ease-out]" role="listitem">
      <Card pokemonType={primary} hover className="cursor-pointer group h-full">
        <button
          onClick={() => onSelect(pkmn)}
          className="w-full text-left bg-transparent border-0 p-0 m-0 cursor-pointer"
          aria-label={`View ${pkmn.name} details`}
        >
          <div className="relative w-full aspect-square mb-3 flex items-center justify-center overflow-hidden rounded-lg">
            <div
              className="absolute inset-0 opacity-20 group-hover:opacity-35 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at center, ${primaryColor}50 0%, transparent 70%)`,
              }}
            />
            <Image
              src={OFFICIAL_ARTWORK(pkmn.id)}
              alt={`Official artwork of ${pkmn.name}`}
              width={120}
              height={120}
              loading="lazy"
              className={[
                'relative z-10 group-hover:scale-110 transition-transform duration-500',
                isSpriteMissing(pkmn.id) ? 'brightness-0 opacity-50' : '',
              ].join(' ')}
              unoptimized
            />
          </div>

          <h3 className="text-[var(--text-primary)] font-semibold text-sm capitalize mb-0.5 group-hover:text-[var(--text-secondary)] transition-colors duration-300">
            {pkmn.name}
          </h3>

          {pkmn.japanese_name && (
            <p className="text-[var(--text-muted)] text-[10px] mb-0.5 font-[family-name:var(--font-pixel)] tracking-wider">
              {pkmn.japanese_name}
            </p>
          )}

          <p className="text-[var(--text-muted)] text-[10px] mb-2 font-[family-name:var(--font-pixel)] tracking-wider">
            #{String(pkmn.id).padStart(3, '0')}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {types.map((type) => (
              <Badge key={`${pkmn.id}-${type}`} type={type} />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
            <span className="text-[var(--text-muted)] text-xs">Total</span>
            <span className="text-sm font-bold" style={{ color: primaryColor }}>
              {pkmn.total_stats}
            </span>
          </div>
        </button>
      </Card>
    </div>
  )
})

// ===== Component ==============================================================

const BATCH_SIZE = 24

export function PokemonGrid({ pokemon, onSelect }: PokemonGridProps) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset visible count when filtered data changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
  }, [pokemon])

  // IntersectionObserver for infinite scroll
  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + BATCH_SIZE, pokemon.length))
  }, [pokemon.length])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const visiblePokemon = pokemon.slice(0, visibleCount)

  if (pokemon.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-muted)] text-lg mb-2">No Pokemon found</p>
        <p className="text-[var(--text-muted)] text-sm">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <>
      <p className="text-[var(--text-muted)] text-xs mb-4">{pokemon.length} Pokemon found</p>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4"
        role="list"
        aria-label="Pokemon grid"
      >
        {visiblePokemon.map((pkmn) => (
          <div key={pkmn.id} className="animate-[slide-in_0.3s_ease-out]" role="listitem">
            <PokemonCard pkmn={pkmn} onSelect={onSelect} />
          </div>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      {visibleCount < pokemon.length && (
        <div ref={sentinelRef} className="flex justify-center py-8" aria-hidden="true">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)] animate-spin" />
        </div>
      )}
    </>
  )
}
