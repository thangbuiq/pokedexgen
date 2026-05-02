'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { HowToGuide } from '@/components/ui/HowToGuide'
import { PokemonSprite } from '@/components/ui/PokemonSprite'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import { getSpriteUrl, isSpriteMissing } from '@/lib/sprites'
import styles from '../team/team-builder.module.css'

interface PokemonData {
  id: number
  name: string
  type_names: string
  hp: number
  attack: number
  defense: number
  special_attack: number
  special_defense: number
  speed: number
  types: PokemonType[]
}

const MAX_STAT = 255
const COMPARISON_COLORS = ['#ff6b35', '#3b82f6', '#22c55e', '#facc15', '#ec4899', '#67e8f9']
const MAX_SELECTED = 6

function parseTypes(type_names: string): PokemonType[] {
  return [
    ...new Set(
      type_names
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t): t is PokemonType => ALL_TYPES.includes(t as PokemonType))
    ),
  ]
}

function getTotalStats(p: PokemonData): number {
  return p.hp + p.attack + p.defense + p.special_attack + p.special_defense + p.speed
}

function getPhysicalBulk(p: PokemonData): number {
  return p.hp * p.defense
}

function getSpecialBulk(p: PokemonData): number {
  return p.hp * p.special_defense
}

function getSpeedTier(speed: number): { label: string; color: string } {
  if (speed >= 130) return { label: 'Extreme', color: '#dc2626' }
  if (speed >= 120) return { label: 'Very Fast', color: '#ea580c' }
  if (speed >= 100) return { label: 'Fast', color: '#ca8a04' }
  if (speed >= 90) return { label: 'Average', color: '#65a30d' }
  if (speed >= 70) return { label: 'Below Avg', color: '#0891b2' }
  if (speed >= 50) return { label: 'Slow', color: '#2563eb' }
  return { label: 'Trick Room', color: '#7c3aed' }
}

function getStatTier(value: number): { label: string; color: string } {
  if (value >= 150) return { label: 'Godly', color: '#dc2626' }
  if (value >= 120) return { label: 'Excellent', color: '#ea580c' }
  if (value >= 100) return { label: 'Great', color: '#ca8a04' }
  if (value >= 80) return { label: 'Good', color: '#65a30d' }
  if (value >= 60) return { label: 'Average', color: '#0891b2' }
  return { label: 'Poor', color: '#6b7280' }
}

function getRole(p: PokemonData): { label: string; icon: string; desc: string } {
  const bulk = getPhysicalBulk(p) + getSpecialBulk(p)
  const off = Math.max(p.attack, p.special_attack)
  const def = Math.max(p.defense, p.special_defense)

  if (p.speed >= 100 && off >= 100) {
    return { label: 'Sweeper', icon: '⚡', desc: 'Fast hard hitter' }
  }
  if (off >= 120 && p.speed >= 70) {
    return { label: 'Wallbreaker', icon: '💥', desc: 'Breaks through walls' }
  }
  if (bulk >= 15000 && off >= 80) {
    return { label: 'Tank', icon: '🛡️', desc: 'Hits back while taking hits' }
  }
  if (bulk >= 16000 && off < 80) {
    return { label: 'Wall', icon: '🧱', desc: 'Absorbs damage' }
  }
  if (p.speed < 60 && off >= 90) {
    return { label: 'TR Attacker', icon: '🐢', desc: 'Trick Room sweeper' }
  }
  if (def >= 100 && p.hp >= 80 && off < 90) {
    return { label: 'Support', icon: '🔧', desc: 'Utility & setup' }
  }
  if (off >= 90 && def >= 80 && p.speed >= 70) {
    return { label: 'All-Rounder', icon: '⭐', desc: 'Balanced stats' }
  }
  return { label: 'Specialist', icon: '🔮', desc: 'Niche role' }
}

function getBSTTier(total: number): { label: string; color: string } {
  if (total >= 680) return { label: 'Legendary', color: '#dc2626' }
  if (total >= 580) return { label: 'Pseudo-Legend', color: '#ea580c' }
  if (total >= 530) return { label: 'Fully Evolved', color: '#ca8a04' }
  if (total >= 480) return { label: 'Mid Stage', color: '#65a30d' }
  if (total >= 400) return { label: 'Early Stage', color: '#0891b2' }
  return { label: 'Baby', color: '#6b7280' }
}

function inferRole(p: PokemonData): string {
  if (p.attack >= 100 && p.speed >= 90) return 'Physical Sweeper'
  if (p.special_attack >= 100 && p.speed >= 90) return 'Special Sweeper'
  if (p.hp >= 90 && (p.defense >= 85 || p.special_defense >= 85)) return 'Tank'
  if (p.defense >= 110 || p.special_defense >= 110) return 'Wall'
  return 'Support/Utility'
}

function useJSONQuery<T>(jsonFile: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/data/${jsonFile}`)
      if (!response.ok) {
        throw new Error(`Failed to load ${jsonFile}: ${response.status}`)
      }
      const json = await response.json()
      setData(json as T[])
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [jsonFile])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

const ALL_TYPES: PokemonType[] = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
]

const TYPE_EFFECTIVENESS: Partial<Record<PokemonType, Partial<Record<PokemonType, number>>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

function getEffectiveness(attacker: PokemonType, defender: PokemonType): number {
  return TYPE_EFFECTIVENESS[attacker]?.[defender] ?? 1
}

function getCoverageTypes(pokemonList: PokemonData[]): PokemonType[] {
  const covered = new Set<PokemonType>()
  for (const p of pokemonList) {
    for (const t of p.types) {
      covered.add(t)
      for (const def of ALL_TYPES) {
        if (getEffectiveness(t, def) >= 2) {
          covered.add(def)
        }
      }
    }
  }
  return Array.from(covered)
}

function getDefensiveWeaknesses(
  pokemonList: PokemonData[]
): { type: PokemonType; count: number }[] {
  const weaknesses: Record<string, number> = {}
  for (const p of pokemonList) {
    for (const atk of ALL_TYPES) {
      let mult = 1
      for (const def of p.types) {
        mult *= getEffectiveness(atk, def)
      }
      if (mult > 1) {
        weaknesses[atk] = (weaknesses[atk] || 0) + 1
      }
    }
  }
  return Object.entries(weaknesses)
    .map(([type, count]) => ({ type: type as PokemonType, count }))
    .filter((w) => w.count >= pokemonList.length)
    .sort((a, b) => b.count - a.count)
}

function CompetitiveInsights({ selected }: { selected: PokemonData[] }) {
  if (selected.length === 0) return null

  return (
    <Card className="space-y-4">
      <h3 className="text-sm font-[family-name:var(--font-pixel)] tracking-wider text-[var(--text-secondary)]">
        Competitive Analysis
      </h3>
      <div className="space-y-3">
        {selected.map((p, i) => {
          const speedTier = getSpeedTier(p.speed)
          const physBulk = getPhysicalBulk(p)
          const specBulk = getSpecialBulk(p)
          const role = getRole(p)
          const bst = getTotalStats(p)
          const bstTier = getBSTTier(bst)
          const atkTier = getStatTier(p.attack)
          const spatkTier = getStatTier(p.special_attack)

          return (
            <div
              key={p.id}
              className="rounded-lg border border-[var(--card-border)] p-3 space-y-2"
              style={{ borderLeft: `3px solid ${COMPARISON_COLORS[i]}` }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <PokemonSprite pokemonId={p.id} size={28} alt={p.name} />
                <span
                  className="text-sm font-semibold capitalize"
                  style={{ color: COMPARISON_COLORS[i] }}
                >
                  {p.name}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono text-white"
                  style={{ backgroundColor: bstTier.color }}
                >
                  {bstTier.label} · BST {bst}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--card-border)]">
                  {role.icon} {role.label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-[var(--surface)] rounded-md px-2 py-1.5 text-center">
                  <div className="text-[var(--text-muted)] mb-0.5">Speed</div>
                  <div className="font-bold tabular-nums" style={{ color: speedTier.color }}>
                    {p.speed}
                  </div>
                  <div className="text-[10px]" style={{ color: speedTier.color }}>
                    {speedTier.label}
                  </div>
                </div>
                <div className="bg-[var(--surface)] rounded-md px-2 py-1.5 text-center">
                  <div className="text-[var(--text-muted)] mb-0.5">Phys Bulk</div>
                  <div className="font-bold tabular-nums text-[var(--text-primary)]">
                    {physBulk.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">HP×Def</div>
                </div>
                <div className="bg-[var(--surface)] rounded-md px-2 py-1.5 text-center">
                  <div className="text-[var(--text-muted)] mb-0.5">Spec Bulk</div>
                  <div className="font-bold tabular-nums text-[var(--text-primary)]">
                    {specBulk.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">HP×SpDef</div>
                </div>
                <div className="bg-[var(--surface)] rounded-md px-2 py-1.5 text-center">
                  <div className="text-[var(--text-muted)] mb-0.5">Offense</div>
                  <div className="font-bold tabular-nums" style={{ color: atkTier.color }}>
                    {p.attack}
                  </div>
                  <div className="text-[10px]" style={{ color: spatkTier.color }}>
                    SpA {p.special_attack}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[var(--text-muted)]">Weak to:</span>
                {(() => {
                  const weaknesses = ALL_TYPES.map((t) => ({
                    type: t,
                    mult: p.types.reduce((m, pt) => m * getEffectiveness(t, pt), 1),
                  }))
                    .filter((w) => w.mult > 1)
                    .sort((a, b) => b.mult - a.mult)
                  if (weaknesses.length === 0) {
                    return <span className="text-[10px] text-green-500">None</span>
                  }
                  return weaknesses.map((w) => (
                    <span key={w.type} className="inline-flex items-center gap-0.5">
                      <Badge type={w.type} />
                      <span className="text-[9px] text-red-400 font-mono">{w.mult}x</span>
                    </span>
                  ))
                })()}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function CoverageAnalysis({ selected }: { selected: PokemonData[] }) {
  if (selected.length < 2) return null

  const coverage = getCoverageTypes(selected)
  const weaknesses = getDefensiveWeaknesses(selected)
  const uncovered = ALL_TYPES.filter((t) => !coverage.includes(t))

  return (
    <Card className="space-y-4">
      <h3 className="text-sm font-[family-name:var(--font-pixel)] tracking-wider text-[var(--text-secondary)]">
        Team Coverage Analysis
      </h3>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text-secondary)]">Offensive Coverage</span>
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {coverage.length}/18 types covered
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {ALL_TYPES.map((t) => (
              <Badge
                key={t}
                type={t}
                className={!coverage.includes(t) ? 'opacity-30 grayscale' : ''}
              />
            ))}
          </div>
          {uncovered.length > 0 && (
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
              Not covered: {uncovered.map((t) => t).join(', ')}
            </p>
          )}
        </div>

        {weaknesses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-secondary)]">Shared Weaknesses</span>
              <span className="text-[10px] text-[var(--text-muted)]">All team members weak to</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {weaknesses.map((w) => (
                <span
                  key={w.type}
                  className="text-[10px] px-2 py-1 rounded-md font-semibold text-white"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  {w.type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function TypeMatchupSection({ selected }: { selected: PokemonData[] }) {
  if (selected.length === 0) return null

  return (
    <Card className="space-y-4">
      <h3 className="text-sm font-[family-name:var(--font-pixel)] tracking-wider text-[var(--text-secondary)]">
        Type Effectiveness
      </h3>
      <div className="space-y-3">
        {selected.map((p, i) => (
          <PokemonTypeMatchup key={p.id} pokemon={p} color={COMPARISON_COLORS[i]} />
        ))}
      </div>
    </Card>
  )
}

function PokemonTypeMatchup({ pokemon, color }: { pokemon: PokemonData; color: string }) {
  const matchups = ALL_TYPES.map((t) => {
    const multiplier = pokemon.types.reduce((m, pt) => m * getEffectiveness(t, pt), 1)
    return { type: t, multiplier }
  }).filter((m) => m.multiplier !== 1)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <PokemonSprite pokemonId={pokemon.id} size={24} alt={pokemon.name} />
        <span className="text-xs font-semibold capitalize" style={{ color }}>
          {pokemon.name}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {matchups.map((m) => {
          const bg = m.multiplier > 1 ? '#166534' : m.multiplier === 0 ? '#201122' : '#8B1A1A'
          return (
            <span
              key={m.type}
              className="text-[10px] px-1.5 py-0.5 rounded font-mono text-white"
              style={{ backgroundColor: bg }}
            >
              {m.type}: {m.multiplier === 0.5 ? '1/2' : m.multiplier}x
            </span>
          )
        })}
      </div>
    </div>
  )
}

interface PokemonMoveRow {
  pokemon_id: number
  move_name: string
  move_type: string
  power: number | null
  accuracy: number | null
  pp: number | null
  damage_class: string
}

function MovesSection({ selected }: { selected: PokemonData[] }) {
  const { data: pokemonMovesData, loading } = useJSONQuery<PokemonMoveRow>('pokemon_moves.json')

  if (selected.length === 0) return null

  if (loading) {
    return (
      <Card className="py-8 text-center">
        <p className="text-[var(--text-muted)] text-sm">Loading moves...</p>
      </Card>
    )
  }

  return (
    <Card className="space-y-4">
      <h3 className="text-sm font-[family-name:var(--font-pixel)] tracking-wider text-[var(--text-secondary)]">
        Moves
      </h3>
      <div className="space-y-3">
        {selected.map((p, i) => {
          const moves = (pokemonMovesData ?? []).filter((m) => m.pokemon_id === p.id)
          return (
            <div key={p.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <PokemonSprite pokemonId={p.id} size={24} alt={p.name} />
                <span
                  className="text-xs font-semibold capitalize"
                  style={{ color: COMPARISON_COLORS[i] }}
                >
                  {p.name}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">{moves.length} moves</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-32 overflow-y-auto pr-1">
                {moves.slice(0, 8).map((move) => (
                  <div
                    key={`${p.id}-${move.move_name}`}
                    className="flex items-center justify-between px-2 py-1 rounded-md bg-[var(--surface)]/40 border border-[var(--card-border)]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge
                        type={(move.move_type ?? 'normal') as PokemonType}
                        className="shrink-0"
                      />
                      <span className="text-[10px] text-[var(--text-primary)] capitalize font-medium truncate">
                        {move.move_name.replace(/-/g, ' ')}
                      </span>
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)] font-mono shrink-0 ml-1">
                      {move.power ?? '-'}/{move.accuracy ?? '-'}/{move.pp ?? '-'}pp
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function TeamAnalysis({ selected }: { selected: PokemonData[] }) {
  if (selected.length === 0) return null

  const fastest = [...selected].sort((a, b) => b.speed - a.speed)[0]
  let speedTier = 'Slow (< 70)'
  if (fastest.speed >= 100) speedTier = 'Fast (> 100)'
  else if (fastest.speed >= 70) speedTier = 'Average (70-100)'

  const types = new Set(selected.flatMap((p) => p.types))
  const weatherHints = []
  if (types.has('fire')) weatherHints.push('Sun (Boosts Fire)')
  if (types.has('water') || types.has('electric'))
    weatherHints.push('Rain (Boosts Water, Electric never misses)')
  if (types.has('ice')) weatherHints.push('Hail/Snow (Boosts Ice Def/Evade)')
  if (types.has('rock')) weatherHints.push('Sandstorm (Boosts Rock Sp.Def)')

  const utilityHints = []
  if (types.has('flying') || types.has('fire'))
    utilityHints.push('Hazard Removal (Defog/Rapid Spin)')
  if (types.has('rock') || types.has('ground'))
    utilityHints.push('Entry Hazards (Stealth Rock/Spikes)')

  const coverage = getCoverageTypes(selected)
  const uncovered = ALL_TYPES.filter((t) => !coverage.includes(t))
  const offensiveScore = Math.round((coverage.length / ALL_TYPES.length) * 100)

  const def = ALL_TYPES.map((t) => {
    const vals = selected.map((p) => {
      let m = 1
      for (const tt of p.types) m *= getEffectiveness(t, tt)
      return m
    })
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 1
    return { type: t, averageDef: avg }
  })

  const resistCount = def.filter((d) => d.averageDef < 1).length
  const weakCount = def.filter((d) => d.averageDef > 1).length
  const neutralCount = def.filter((d) => d.averageDef === 1).length

  const significantWeaknesses = def
    .filter((d) => d.averageDef >= 1.25)
    .sort((a, b) => b.averageDef - a.averageDef)

  let synergyScore = 0
  if (selected.length > 0) {
    const totalDef = def.reduce((acc, curr) => acc + curr.averageDef, 0)
    synergyScore = Math.round(
      Math.max(0, Math.min(100, 100 - (totalDef / ALL_TYPES.length - 1) * 100))
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="flex flex-col gap-3 p-4 bg-[var(--surface-light)] border border-[var(--card-border)]">
        <div className="text-xs font-[family-name:var(--font-pixel)] text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--card-border)] pb-2 flex justify-between">
          <span>Offensive & Speed</span>
          <span
            className={
              offensiveScore > 75
                ? 'text-green-500'
                : offensiveScore > 40
                  ? 'text-yellow-500'
                  : 'text-red-500'
            }
          >
            Score: {offensiveScore}/100
          </span>
        </div>
        <div className="text-sm">
          <span className="text-[var(--text-muted)]">Fastest: </span>
          <span className="text-[var(--text-primary)] font-medium">
            {fastest.name} (Speed: {fastest.speed}) - {speedTier}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-[var(--text-muted)]">Coverage Gaps: </span>
          {uncovered.length === 0 ? (
            <span className="text-green-500 font-medium">
              Full coverage! All 18 types hit super effectively.
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 flex-wrap">
              <span className="text-red-400 font-medium">Cannot hit</span>
              {uncovered.map((t) => (
                <Badge key={t} type={t} />
              ))}
            </span>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4 bg-[var(--surface-light)] border border-[var(--card-border)]">
        <div className="text-xs font-[family-name:var(--font-pixel)] text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--card-border)] pb-2 flex justify-between">
          <span>Defensive & Synergy</span>
          <span
            className={
              synergyScore > 75
                ? 'text-green-500'
                : synergyScore > 40
                  ? 'text-yellow-500'
                  : 'text-red-500'
            }
          >
            Score: {synergyScore}/100
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-green-500 font-medium">Resists {resistCount}</span>
          <span className="text-[var(--text-muted)]">|</span>
          <span className="text-[var(--text-secondary)]">Neutral {neutralCount}</span>
          <span className="text-[var(--text-muted)]">|</span>
          <span className="text-red-400 font-medium">Weak to {weakCount}</span>
        </div>
        {significantWeaknesses.length > 0 && (
          <div className="text-sm">
            <span className="text-[var(--text-muted)]">Major weaknesses: </span>
            <span className="inline-flex items-center gap-1 flex-wrap">
              {significantWeaknesses.slice(0, 6).map((d) => (
                <span key={d.type} className="inline-flex items-center gap-1">
                  <Badge type={d.type} />
                  <span className="text-[10px] text-red-400 font-mono">
                    {d.averageDef.toFixed(2)}x
                  </span>
                </span>
              ))}
              {significantWeaknesses.length > 6 && (
                <span className="text-[10px] text-[var(--text-muted)]">
                  +{significantWeaknesses.length - 6} more
                </span>
              )}
            </span>
          </div>
        )}
        {(weatherHints.length > 0 || utilityHints.length > 0) && (
          <div className="text-sm border-t border-[var(--card-border)] pt-2 mt-1">
            <span className="text-[var(--text-muted)] block mb-1">Suggested Utility:</span>
            <ul className="list-disc list-inside pl-4 space-y-1 text-[var(--text-secondary)] text-xs">
              {weatherHints.map((h) => (
                <li key={h}>{h}</li>
              ))}
              {utilityHints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  )
}

function CoverageGrid({ selected }: { selected: PokemonData[] }) {
  if (selected.length === 0) return null

  const def = ALL_TYPES.map((t) => {
    const vals = selected.map((p) => {
      let m = 1
      for (const tt of p.types) m *= getEffectiveness(t, tt)
      return m
    })
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 1
    return { type: t, avg }
  })

  const byType = ALL_TYPES.map((t) => {
    let superEff = false
    for (const p of selected) {
      for (const at of p.types) {
        if (getEffectiveness(at, t) >= 2) {
          superEff = true
          break
        }
      }
      if (superEff) break
    }
    return { type: t, superEffective: superEff }
  })

  const gaps = ALL_TYPES.filter((t) => {
    const mins = selected.map((p) => {
      let m = 1
      for (const tt of p.types) m *= getEffectiveness(t, tt)
      return m
    })
    if (mins.length === 0) return true
    return Math.min(...mins) >= 1
  })

  return (
    <section>
      <h2 className={styles.sectionTitle}>Coverage Grid</h2>
      <div className={styles.coverageGrid}>
        {ALL_TYPES.map((t) => {
          const defFor = def.find((d) => d.type === t)
          const avg = defFor?.avg ?? 1
          const color = avg < 1 ? '#34d399' : avg > 1.25 ? '#f87171' : 'var(--surface)'
          const bySuper = byType.find((b) => b.type === t)?.superEffective ?? false
          const gap = gaps.includes(t)
          return (
            <div key={t} className={styles.coverageCard}>
              <div className={styles.coverageHeader}>
                <span className={styles.typeName}>{t}</span>
                <span className={styles.badge} style={{ background: color }}>
                  {' '}
                </span>
              </div>
              <div className={styles.coverageBody}>
                <div className={styles.coverageLine}>
                  <span>Super effective: {bySuper ? 'Yes' : 'No'}</span>
                </div>
                <div className={styles.coverageLineSmall}>
                  <span>Defensive multiplier: {avg.toFixed(2)}x</span>
                </div>
                {gap && <div className={styles.gapLabel}>Coverage gap: weak to {t}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function multiplierLabel(multiplier: number): string {
  if (multiplier === 0) return '0'
  if (multiplier === 0.5) return '1/2'
  if (multiplier === 1) return '1'
  if (multiplier === 2) return '2'
  return `${multiplier}`
}

function cellStyles(multiplier: number): { backgroundColor: string; color: string } {
  if (multiplier === 0) return { backgroundColor: '#201122', color: '#FFFFFF' }
  if (multiplier === 0.5) return { backgroundColor: '#8B1A1A', color: '#FFFFFF' }
  if (multiplier === 1) return { backgroundColor: 'var(--surface)', color: '#7f7f7fff' }
  return { backgroundColor: '#166534', color: '#FFFFFF' }
}

function TypeMatrixTab() {
  const guideItems = [
    { multiplier: 2, description: 'Super effective. Strong damage.' },
    { multiplier: 1, description: 'Normal damage. No modifier.' },
    { multiplier: 0.5, description: 'Not very effective. Reduced damage.' },
    { multiplier: 0, description: 'Immune. No damage lands.' },
  ] as const

  const matrix = useMemo(
    () =>
      ALL_TYPES.map((attacker) =>
        ALL_TYPES.map((defender) => ({
          attacker,
          defender,
          multiplier: getEffectiveness(attacker, defender),
        }))
      ),
    []
  )

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      <div className="text-center space-y-3 mb-6">
        <h2 className="text-xl font-[family-name:var(--font-pixel)] tracking-wider text-[var(--text-primary)]">
          Type Matchup Matrix
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
          Read across the row to see how one attacking type performs against each defending type.
        </p>
      </div>

      <HowToGuide title="Type Matchup Guide">
        Green cells mean super effective (2x). Red cells mean not very effective (0.5x) or no effect
        (0x). White cells are neutral (1x). Use this to plan your team coverage.
      </HowToGuide>

      <Card className="space-y-4">
        <h2 className="text-sm font-[family-name:var(--font-pixel)] tracking-wider text-[var(--text-secondary)]">
          Notes
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          {guideItems.map((item) => {
            const styles = cellStyles(item.multiplier)
            return (
              <div
                key={item.multiplier}
                className="rounded-lg border border-[var(--card-border)] p-3 font-[family-name:var(--font-pixel)] tracking-wider"
                style={{ backgroundColor: styles.backgroundColor, color: styles.color }}
              >
                <div className="font-semibold mb-1">{multiplierLabel(item.multiplier)}</div>
                <div>{item.description}</div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-max w-full border-collapse text-xs font-[family-name:var(--font-pixel)] tracking-wider">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-[var(--surface)] border border-[var(--card-border)] px-2 py-2 text-[var(--text-secondary)] font-[family-name:var(--font-pixel)] tracking-wider">
                  ATK\DEF
                </th>
                {ALL_TYPES.map((type) => (
                  <th
                    key={type}
                    className="sticky top-0 z-10 bg-[var(--surface)] border border-[var(--card-border)] px-2 py-2"
                  >
                    <Badge type={type} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, rowIndex) => (
                <tr key={ALL_TYPES[rowIndex]}>
                  <th className="sticky left-0 z-10 bg-[var(--surface)] border border-[var(--card-border)] px-2 py-2 text-left">
                    <Badge type={ALL_TYPES[rowIndex]} />
                  </th>
                  {row.map((cell) => {
                    const styles = cellStyles(cell.multiplier)
                    return (
                      <td
                        key={`${cell.attacker}-${cell.defender}`}
                        className="border border-[var(--card-border)] px-2 py-2 text-center font-semibold text-white"
                        style={styles}
                        title={`${cell.attacker} vs ${cell.defender}: ${multiplierLabel(cell.multiplier)}`}
                      >
                        {multiplierLabel(cell.multiplier)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default function MatchupsPage() {
  const [activeTab, setActiveTab] = useState<'builder' | 'matrix'>('builder')

  const {
    data: rawPokemon,
    loading: dataLoading,
    error: dataError,
  } = useJSONQuery<PokemonData>('pokemon.json')

  const allPokemon = useMemo(() => {
    if (!rawPokemon) return []
    const seen = new Set<number>()
    return rawPokemon
      .map((p) => ({
        ...p,
        types: parseTypes(p.type_names),
        name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
      }))
      .filter((p) => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
  }, [rawPokemon])

  const [team, setTeam] = useState<(PokemonData | null)[]>(Array(6).fill(null))
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const filledTeam = useMemo(() => team.filter((p): p is PokemonData => p !== null), [team])
  const filledCount = filledTeam.length

  const isDuplicate = useCallback(
    (p: PokemonData) => team.some((slot) => slot?.id === p.id),
    [team]
  )

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const addPokemonToFirstEmpty = useCallback((p: PokemonData) => {
    setTeam((prev) => {
      const idx = prev.findIndex((slot) => slot === null)
      if (idx === -1) {
        return prev
      }
      const next = prev.slice()
      next[idx] = p
      return next
    })
  }, [])

  const handleAddPokemon = useCallback(
    (p: PokemonData) => {
      if (filledCount >= 6) {
        showToast('Team is full! Remove a Pokemon first.', 'error')
        return
      }
      if (isDuplicate(p)) {
        showToast(`${p.name} is already on your team!`, 'error')
        return
      }
      addPokemonToFirstEmpty(p)
      showToast(`${p.name} added to team!`, 'success')
    },
    [filledCount, isDuplicate, addPokemonToFirstEmpty, showToast]
  )

  const removePokemonFromSlot = useCallback((idx: number) => {
    setTeam((prev) => {
      const next = prev.slice()
      next[idx] = null
      return next
    })
  }, [])

  const filteredPokemons = useMemo(() => {
    if (!query) return allPokemon
    const q = query.toLowerCase()
    return allPokemon.filter(
      (p) => p.name.toLowerCase().includes(q) || p.types.join(',').toLowerCase().includes(q)
    )
  }, [allPokemon, query])

  const availablePokemons = useMemo(() => {
    return filteredPokemons
      .map((p) => ({ ...p, isDuplicate: isDuplicate(p) }))
      .filter((p) => !p.isDuplicate || !team.some((t) => t !== null))
  }, [filteredPokemons, isDuplicate, team])

  const copyTeamText = async () => {
    const lines = team.map((p, i) => {
      if (!p) return `${i + 1}. [Empty slot]`
      const types = p.types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join('/')
      return `${i + 1}. ${p.name} (${types})`
    })
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      alert('Team copied to clipboard')
    } catch {}
  }

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <LoadingSpinner size={64} />
        <p className="text-[var(--text-secondary)] text-sm font-[family-name:var(--font-pixel)] tracking-wider">
          LOADING POKEMON DATA...
        </p>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-red-400 text-sm">Failed to load Pokemon data</p>
        {dataError && <p className="text-[var(--text-muted)] text-xs">{dataError.message}</p>}
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8 sm:mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Image
            src="/pokeball.png"
            alt="Pokeball"
            width={40}
            height={40}
            className="w-8 sm:w-10"
          />
          <h1 className="text-xl sm:text-2xl font-[family-name:var(--font-pixel)] text-[var(--text-primary)] tracking-wider">
            Matchups & Analysis
          </h1>
        </div>
        <p className="text-[var(--text-muted)] text-sm max-w-lg mx-auto">
          Build your team, compare stats with competitive tiers, analyze bulk & speed, and master
          type effectiveness.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-[var(--surface)] rounded-lg p-1 border border-[var(--card-border)]">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'builder'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'text-[var(--text-secondary)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}
          >
            Team Builder
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === 'matrix'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                : 'text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            Type Matrix
          </button>
        </div>
      </div>

      {activeTab === 'builder' ? (
        <div className="animate-[fade-in_0.3s_ease-out] space-y-6">
          <HowToGuide title="Team Builder Guide">
            Click any Pokemon from the board below to add it to your team (max 6). Filter the board
            by typing a name or type. Analyze competitive roles, speed tiers, and coverage.
          </HowToGuide>

          {toast && (
            <div
              className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg border transition-all duration-300 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                  : 'bg-red-500/90 text-white border-red-400/50'
              }`}
            >
              {toast.message}
            </div>
          )}

          <div className={styles.gridToolbar}>
            <div className={styles.searchBox}>
              <input
                placeholder="Filter Pokemon board by name or type..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className="flex gap-2">
              <button className={styles.copyBtn} onClick={copyTeamText}>
                Copy Team
              </button>
            </div>
          </div>

          <div className={styles.boardContainer}>
            <div className={styles.boardGrid}>
              {availablePokemons.length > 0 ? (
                availablePokemons.map((p) => (
                  <button
                    key={p.id}
                    className={`${styles.boardCard} ${p.isDuplicate ? styles.boardCardDisabled : ''}`}
                    onClick={() => handleAddPokemon(p)}
                    disabled={p.isDuplicate}
                  >
                    <img
                      src={getSpriteUrl(p.id)}
                      alt={p.name}
                      className={styles.boardSprite}
                      style={{
                        filter: isSpriteMissing(p.id) ? 'brightness(0) opacity(0.5)' : 'none',
                      }}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = ''
                      }}
                    />
                    <span className={styles.boardName}>{p.name}</span>
                    <span className={styles.boardTypes}>
                      {p.types.map((t) => (
                        <span
                          key={t}
                          className={styles.smallType}
                          style={{ background: typeColorMap[t] ?? '#999' }}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </span>
                      ))}
                    </span>
                    {p.isDuplicate && <span className={styles.boardDuplicate}>In Team</span>}
                  </button>
                ))
              ) : (
                <div className="col-span-full text-center text-sm text-[var(--text-muted)] py-8">
                  No Pokemon match your filter
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className={styles.sectionTitle}>Your Team</h2>
            <span className="text-xs text-[var(--text-muted)]">{filledCount}/6</span>
          </div>
          <div className={styles.teamGrid}>
            {team.map((p, idx) => (
              <div key={idx} className={styles.slot} aria-label={`Slot ${idx + 1}`}>
                {p ? (
                  <div className={styles.slotContent}>
                    <div className={styles.slotTop}>
                      <img
                        className={styles.sprite}
                        src={getSpriteUrl(p.id)}
                        alt={p.name}
                        style={{
                          filter: isSpriteMissing(p.id) ? 'brightness(0) opacity(0.5)' : 'none',
                        }}
                      />
                      <div className={styles.slotInfo}>
                        <div className={styles.slotName}>{p.name}</div>
                        <div className={styles.slotTypes}>
                          {p.types.map((t) => (
                            <span
                              key={t}
                              className={styles.typeBadge}
                              style={{ background: typeColorMap[t] ?? '#999' }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="text-[9px] mt-1 text-[var(--text-muted)] border border-[var(--card-border)] rounded px-1.5 py-0.5 inline-block bg-[var(--surface)]">
                          {inferRole(p)}
                        </div>
                      </div>
                    </div>
                    <button className={styles.removeBtn} onClick={() => removePokemonFromSlot(idx)}>
                      ×
                    </button>
                  </div>
                ) : (
                  <div className={styles.slotEmpty}>
                    <span className={styles.plus}>+</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-4 border border-[var(--card-border)] bg-[var(--surface)]/40">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-[family-name:var(--font-pixel)] tracking-wider text-[var(--text-secondary)] uppercase">
                  About Defensive Multiplier
                </h4>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  The defensive multiplier shows how much damage your team takes from each attacking
                  type on average. For each attacking type, we multiply the effectiveness against
                  every Pokemon&apos;s types, then average across your team.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-mono">
                    &lt; 1.0 = Resist
                  </span>
                  <span className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--card-border)] text-[var(--text-muted)] font-mono">
                    1.0 = Neutral
                  </span>
                  <span className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono">
                    &gt; 1.0 = Weak
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Example: Water vs Charizard (Fire/Flying) = 2.0x (Water is super effective against
                  Fire)
                </p>
              </div>
            </div>
          </div>

          {filledCount > 0 && (
            <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
              <TeamAnalysis selected={filledTeam} />
              <CoverageAnalysis selected={filledTeam} />
              <CoverageGrid selected={filledTeam} />
              <CompetitiveInsights selected={filledTeam} />
              <TypeMatchupSection selected={filledTeam} />
              <MovesSection selected={filledTeam} />
            </div>
          )}
        </div>
      ) : (
        <TypeMatrixTab />
      )}
    </div>
  )
}
