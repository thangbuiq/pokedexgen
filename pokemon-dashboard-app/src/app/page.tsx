'use client'

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { motion } from 'framer-motion'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { HowToGuide } from '@/components/ui/HowToGuide'
import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import { isSpriteMissing, getSpriteUrl as OFFICIAL_ARTWORK } from '@/lib/sprites'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PokemonFightSim } from '@/components/fight/PokemonFightSim'
import {
  ALL_TYPES,
  TYPE_EFFECTIVENESS,
  getEffectiveness,
  multiplierLabel,
} from '@/lib/type-effectiveness'

// ─── Constants ───────────────────────────────────────────────────────────────

type SortKey = 'id' | 'name' | 'total_stats'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'id', label: '#' },
  { key: 'name', label: 'Name' },
  { key: 'total_stats', label: 'Stats' },
]

const STAT_META: {
  key: 'hp' | 'attack' | 'defense' | 'special_attack' | 'special_defense' | 'speed'
  label: string
}[] = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'ATK' },
  { key: 'defense', label: 'DEF' },
  { key: 'special_attack', label: 'SP.ATK' },
  { key: 'special_defense', label: 'SP.DEF' },
  { key: 'speed', label: 'SPD' },
]

const STAT_MAX = 255

// ─── Types ──────────────────────────────────────────────────────────────────

interface PokemonRow {
  id: number
  name: string
  japanese_name?: string
  height: number
  weight: number
  sprite_url: string
  color: string
  type_names: string
  hp: number
  attack: number
  defense: number
  special_attack: number
  special_defense: number
  speed: number
  total_stats: number
  types: string
}

interface EvolutionTreeRow {
  chain_id: number
  stage: number
  evolves_from: string | null
  species_name?: string
  name?: string
}

interface EvolutionPathRow {
  from_pokemon: string
  to_pokemon: string
  evolution_trigger: string | null
  chain_id: number
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

interface EvolutionChainNode {
  name: string
  stage: number
  evolvesFrom: string | null
  trigger: string | null
  pokemon: PokemonRow | null
}

interface RadarStatPoint {
  stat: string
  value: number
  fullMark: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTypes(p: PokemonRow): PokemonType[] {
  const raw = p.types || p.type_names || ''
  return [
    ...new Set(
      raw
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t): t is PokemonType => t in typeColorMap)
    ),
  ]
}

function primaryTypeOf(p: PokemonRow): PokemonType {
  return parseTypes(p)[0] ?? 'normal'
}

function MatchupTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs border border-[var(--card-border)]">
      <p className="text-[var(--text-secondary)]">Base stat value</p>
      <p className="text-[var(--text-primary)] font-semibold">{payload[0]?.value}</p>
    </div>
  )
}

function EvolutionGraph({
  nodes,
  selectedName,
  onSelect,
}: {
  nodes: EvolutionChainNode[]
  selectedName: string
  onSelect: (pokemon: PokemonRow | null) => void
}) {
  const stageMap = useMemo(() => {
    const map = new Map<number, EvolutionChainNode[]>()
    for (const node of nodes) {
      const list = map.get(node.stage) ?? []
      list.push(node)
      map.set(node.stage, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return map
  }, [nodes])

  const stages = useMemo(() => {
    return Array.from(stageMap.keys()).sort((a, b) => a - b)
  }, [stageMap])

  const getSprite = (node: EvolutionChainNode) => {
    if (node.pokemon) {
      return OFFICIAL_ARTWORK(node.pokemon.id)
    }
    return null
  }

  return (
    <div className="flex flex-col items-stretch gap-2 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
      {stages.map((stage, stageIdx) => {
        const stageNodes = stageMap.get(stage) ?? []
        const isLast = stageIdx === stages.length - 1
        return (
          <div key={stage} className="flex flex-col items-stretch gap-2 w-full">
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${Math.min(stageNodes.length, 3)}, minmax(0, 1fr))`,
              }}
            >
              {stageNodes.map((node) => {
                const isCurrent = node.name === selectedName.toLowerCase()
                const sprite = getSprite(node)
                const primary = node.pokemon ? primaryTypeOf(node.pokemon) : 'normal'
                return (
                  <button
                    key={node.name}
                    onClick={() => onSelect(node.pokemon)}
                    disabled={!node.pokemon}
                    className={[
                      'flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all duration-300',
                      node.pokemon
                        ? 'hover:border-[var(--text-secondary)] hover:bg-[var(--surface)]'
                        : 'opacity-70 cursor-default',
                    ].join(' ')}
                    style={{
                      borderColor: isCurrent ? typeColorMap[primary] : 'var(--card-border)',
                      boxShadow: isCurrent ? `0 0 10px ${typeColorMap[primary]}40` : 'none',
                    }}
                  >
                    {sprite ? (
                      <img
                        src={sprite}
                        alt={node.name}
                        className={[
                          'w-8 h-8 object-contain shrink-0',
                          node.pokemon && isSpriteMissing(node.pokemon.id)
                            ? 'brightness-0 opacity-50'
                            : '',
                        ].join(' ')}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--card-border)] shrink-0" />
                    )}
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[10px] text-[var(--text-primary)] capitalize font-semibold truncate">
                        {node.name}
                      </span>
                      {node.trigger && (
                        <span className="text-[9px] text-[var(--text-muted)] capitalize truncate">
                          {node.trigger}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            {!isLast && (
              <div className="flex items-center justify-center text-[var(--text-muted)] shrink-0 py-1">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
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

function HomeContent() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [activeTypes, setActiveTypes] = useState<Set<PokemonType>>(new Set())
  const [sortBy, setSortBy] = useState<SortKey>('id')
  const [selected, setSelected] = useState<PokemonRow | null>(null)
  const [detailReady, setDetailReady] = useState(false)
  const [moveSearch, setMoveSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(52)
  const [showMatrix, setShowMatrix] = useState(false)
  const [fightOpponent, setFightOpponent] = useState<PokemonRow | null>(null)
  const [showFightSim, setShowFightSim] = useState(false)

  useEffect(() => {
    setVisibleCount(52)
  }, [search, activeTypes, sortBy])

  const hasSetInitialSelected = useRef(false)

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

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selected])

  const { data, loading, error } = useJSONQuery<PokemonRow>('pokemon.json')
  const { data: evolutionTree } = useJSONQuery<EvolutionTreeRow>('evolution_tree.json')
  const { data: evolutionPaths } = useJSONQuery<EvolutionPathRow>('evolution_paths.json')
  const { data: pokemonMovesData } = useJSONQuery<PokemonMoveRow>('pokemon_moves.json')

  const pokemonByName = useMemo(() => {
    const map = new Map<string, PokemonRow>()
    for (const pokemon of data ?? []) {
      if (!map.has(pokemon.name)) {
        map.set(pokemon.name, pokemon)
      }
    }
    return map
  }, [data])

  const pokemonById = useMemo(() => {
    const map = new Map<number, PokemonRow>()
    for (const pokemon of data ?? []) {
      if (!map.has(pokemon.id)) {
        map.set(pokemon.id, pokemon)
      }
    }
    return map
  }, [data])

  useEffect(() => {
    if (!data.length) return
    const urlParams = new URLSearchParams(window.location.search)
    const idParam = urlParams.get('id')
    if (!idParam) return
    const id = parseInt(idParam, 10)
    if (Number.isNaN(id)) return
    const pokemon = pokemonById.get(id)
    if (pokemon) setSelected(pokemon)
  }, [data, pokemonById])

  const evolutionChain = useMemo<EvolutionChainNode[]>(() => {
    if (!selected || !evolutionTree || evolutionTree.length === 0) return []

    const selectedName = selected.name.toLowerCase()
    const normalizeName = (row: EvolutionTreeRow) =>
      (row.species_name ?? row.name ?? '').toLowerCase()
    const selectedNode = evolutionTree.find((row) => normalizeName(row) === selectedName)

    if (!selectedNode) return []

    const chainRows = evolutionTree.filter((row) => row.chain_id === selectedNode.chain_id)
    const triggerByTarget = new Map<string, string | null>()

    for (const edge of evolutionPaths ?? []) {
      if (edge.chain_id === selectedNode.chain_id) {
        triggerByTarget.set(edge.to_pokemon.toLowerCase(), edge.evolution_trigger)
      }
    }

    const deduped = new Map<string, EvolutionChainNode>()

    for (const row of chainRows) {
      const name = normalizeName(row)
      if (!name) continue

      const current = deduped.get(name)
      const candidate: EvolutionChainNode = {
        name,
        stage: row.stage,
        evolvesFrom: row.evolves_from,
        trigger: triggerByTarget.get(name) ?? null,
        pokemon: pokemonByName.get(name) ?? null,
      }

      if (!current) {
        deduped.set(name, candidate)
        continue
      }

      deduped.set(name, {
        ...current,
        stage: Math.min(current.stage, candidate.stage),
        evolvesFrom: current.evolvesFrom ?? candidate.evolvesFrom,
        trigger: current.trigger ?? candidate.trigger,
        pokemon: current.pokemon ?? candidate.pokemon,
      })
    }

    return [...deduped.values()].sort((a, b) => {
      if (a.stage !== b.stage) return a.stage - b.stage
      const aId = a.pokemon?.id ?? Number.MAX_SAFE_INTEGER
      const bId = b.pokemon?.id ?? Number.MAX_SAFE_INTEGER
      if (aId !== bId) return aId - bId
      return a.name.localeCompare(b.name)
    })
  }, [selected, evolutionTree, evolutionPaths, pokemonByName])

  const radarData = useMemo<RadarStatPoint[]>(() => {
    if (!selected) return []
    return STAT_META.map(({ key, label }) => ({
      stat: label,
      value: selected[key],
      fullMark: STAT_MAX,
    }))
  }, [selected])

  const selectedMoves = useMemo(() => {
    if (!selected || !pokemonMovesData) return []
    return pokemonMovesData.filter((m) => m.pokemon_id === selected.id)
  }, [selected, pokemonMovesData])

  const filteredMoves = useMemo(() => {
    const q = moveSearch.trim().toLowerCase()
    if (!q) return selectedMoves
    return selectedMoves.filter((m) => m.move_name.replace(/-/g, ' ').toLowerCase().includes(q))
  }, [selectedMoves, moveSearch])

  const typeDefenses = useMemo(() => {
    if (!selected) return {} as Record<PokemonType, number>

    const defenderTypes = parseTypes(selected)
    const result = {} as Record<PokemonType, number>
    ALL_TYPES.forEach((attackingType) => {
      result[attackingType] = defenderTypes.reduce(
        (m, defType) => m * getEffectiveness(attackingType, defType),
        1
      )
    })
    return result
  }, [selected])

  // Animate detail stat bars after mount
  useEffect(() => {
    if (selected) {
      setDetailReady(false)
      const raf = requestAnimationFrame(() => setDetailReady(true))
      return () => cancelAnimationFrame(raf)
    }
    setDetailReady(false)
  }, [selected])

  const toggleType = useCallback((type: PokemonType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []

    // Deduplicate by ID (Next.js dev mode may cause double rendering)
    const seen = new Set<number>()
    let result = data.filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.japanese_name?.toLowerCase().includes(q)
      )
    }

    // Type filter
    if (activeTypes.size > 0) {
      result = result.filter((p) => parseTypes(p).some((t) => activeTypes.has(t)))
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'total_stats') return b.total_stats - a.total_stats
      return a.id - b.id
    })
  }, [data, search, activeTypes, sortBy])

  function cellStyles(multiplier: number): { backgroundColor: string; color: string } {
    if (multiplier === 0) return { backgroundColor: '#201122', color: '#FFFFFF' }
    if (multiplier === 0.5) return { backgroundColor: '#8B1A1A', color: '#FFFFFF' }
    if (multiplier === 1) return { backgroundColor: 'var(--surface)', color: '#7f7f7f' }
    return { backgroundColor: '#166534', color: '#FFFFFF' }
  }

  const typeMatchupMatrix = useMemo(
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

  function TypeMatchupTab() {
    const guideItems = [
      { multiplier: 2, description: 'Super effective' },
      { multiplier: 1, description: 'Normal damage' },
      { multiplier: 0.5, description: 'Not very effective' },
      { multiplier: 0, description: 'Immune' },
    ] as const

    return (
      <div className="space-y-4 animate-[fade-in_0.3s_ease-out] mb-8">
        <div className="grid gap-2 grid-cols-4 text-[10px]">
          {guideItems.map((item) => {
            const styles = cellStyles(item.multiplier)
            return (
              <div
                key={item.multiplier}
                className="rounded border border-[var(--card-border)] px-2 py-1.5 font-[family-name:var(--font-pixel)] tracking-wider text-center"
                style={{ backgroundColor: styles.backgroundColor, color: styles.color }}
              >
                <span className="font-semibold">{multiplierLabel(item.multiplier)}x</span>
                <span className="block text-[9px] opacity-80 mt-0.5">{item.description}</span>
              </div>
            )
          })}
        </div>

        <Card className="overflow-hidden p-2">
          <div className="overflow-auto">
            <table className="min-w-max w-full border-collapse text-[9px] font-[family-name:var(--font-pixel)] tracking-wider">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-[var(--surface)] border border-[var(--card-border)] px-1 py-1 text-[var(--text-secondary)]">
                    ATK\DEF
                  </th>
                  {ALL_TYPES.map((type) => (
                    <th
                      key={type}
                      className="sticky top-0 z-10 bg-[var(--surface)] border border-[var(--card-border)] px-0.5 py-1"
                    >
                      <span
                        className="inline-flex items-center justify-center rounded px-1 py-0.5 text-[8px] font-bold text-white uppercase"
                        style={{
                          backgroundColor: typeColorMap[type],
                          textShadow: '0 1px 1px rgba(0,0,0,0.4)',
                        }}
                      >
                        {type.slice(0, 3)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {typeMatchupMatrix.map((row, rowIndex) => (
                  <tr key={ALL_TYPES[rowIndex]}>
                    <th className="sticky left-0 z-10 bg-[var(--surface)] border border-[var(--card-border)] px-1 py-1 text-left">
                      <span
                        className="inline-flex items-center justify-center rounded px-1 py-0.5 text-[8px] font-bold text-white uppercase"
                        style={{
                          backgroundColor: typeColorMap[ALL_TYPES[rowIndex]],
                          textShadow: '0 1px 1px rgba(0,0,0,0.4)',
                        }}
                      >
                        {ALL_TYPES[rowIndex].slice(0, 3)}
                      </span>
                    </th>
                    {row.map((cell) => {
                      const styles = cellStyles(cell.multiplier)
                      return (
                        <td
                          key={`${cell.attacker}-${cell.defender}`}
                          className="border border-[var(--card-border)] px-0.5 py-1 text-center font-semibold text-white"
                          style={styles}
                          title={`${cell.attacker} vs ${cell.defender}: ${multiplierLabel(cell.multiplier)}x`}
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

  // ─── Loading / Error ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <LoadingSpinner size={64} />
        <p className="text-[var(--text-secondary)] text-sm font-[family-name:var(--font-pixel)] tracking-wider">
          LOADING POKEMON...
        </p>
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

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Image
            src="/pokeball.png"
            alt="Pokeball"
            width={40}
            height={40}
            className="w-8 sm:w-10"
          />
          <h1 className="text-xl sm:text-2xl font-[family-name:var(--font-pixel)] text-[var(--text-primary)] tracking-wider">
            pokeXgen
          </h1>
          <Link
            href="/origins"
            className="group relative ml-2"
            title="Explore the origins of the Pokémon universe"
          >
            <img
              src="/sprites/pokemon/other/official-artwork/493.png"
              alt="Arceus"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]"
            />
            <span className="absolute -top-2 -right-[3.5rem] sm:-right-20 bg-[var(--accent)] text-white text-[9px] sm:text-[10px] font-[family-name:var(--font-pixel)] px-2 py-1 rounded-full shadow-lg rotate-12 group-hover:rotate-6 group-hover:scale-105 transition-all duration-300 whitespace-nowrap pointer-events-none">
              Origins
              <span className="absolute -bottom-1 left-2 w-2 h-2 bg-[var(--accent)] rotate-45" />
            </span>
          </Link>
        </div>
        <p className="text-[var(--text-muted)] text-base sm:text-lg">
          A next-gen Pokédex for exploring Pokémon data, evolutions, and matchup strategy.
        </p>
      </div>

      {/* ── Type Matrix Toggle ──────────────────────────────────────────── */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setShowMatrix(!showMatrix)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
            showMatrix
              ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--card-border)] hover:text-blue-600 hover:border-blue-500/50'
          }`}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            {showMatrix ? <path d="M19 9l-7 7-7-7" /> : <path d="M9 5l7 7-7 7" />}
          </svg>
          {showMatrix ? 'Hide Type Matrix' : 'Show Type Matrix'}
        </button>
      </div>

      {showMatrix && <TypeMatchupTab />}

      <HowToGuide title="Pokédex Guide">
        Search or filter by type, then click any Pokémon to view stats, type matchups, evolution
        chain, moves, and fight simulation. Use the sort buttons to reorder by ID, name, or total
        stats.
      </HowToGuide>

      {/* ── Search & Sort ──────────────────────────────────────────────── */}
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
            placeholder="Search Pokemon..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg glass text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-[var(--card-border)] transition-all"
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

        <div className="flex gap-1.5">
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
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Type Filter Pills ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
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

      {/* ── Results Count ──────────────────────────────────────────────── */}
      <p className="text-[var(--text-muted)] text-xs mb-4">{filtered.length} Pokemon found</p>

      {/* ── Pokemon Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {filtered.slice(0, visibleCount).map((pokemon, index) => {
          const types = parseTypes(pokemon)
          const primary = primaryTypeOf(pokemon)
          const primaryColor = typeColorMap[primary]

          return (
            <motion.div
              key={pokemon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
            >
              <Card pokemonType={primary} hover className="cursor-pointer group h-full">
                <button
                  onClick={() => setSelected(pokemon)}
                  className="w-full text-left bg-transparent border-0 p-0 m-0 cursor-pointer"
                >
                  <div className="relative w-full aspect-square mb-3 flex items-center justify-center overflow-hidden rounded-lg">
                    <div
                      className="absolute inset-0 opacity-20 group-hover:opacity-35 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle at center, ${primaryColor}50 0%, transparent 70%)`,
                      }}
                    />
                    <Image
                      src={OFFICIAL_ARTWORK(pokemon.id)}
                      alt={pokemon.name}
                      width={120}
                      height={120}
                      className={[
                        'relative z-10 group-hover:scale-110 transition-transform duration-500',
                        isSpriteMissing(pokemon.id) ? 'brightness-0 opacity-50' : '',
                      ].join(' ')}
                      unoptimized
                    />
                  </div>

                  <h3 className="text-[var(--text-primary)] font-semibold text-sm capitalize mb-0.5 group-hover:text-[var(--text-secondary)] transition-colors duration-300">
                    {pokemon.name}
                  </h3>

                  {pokemon.japanese_name && (
                    <p className="text-[var(--text-muted)] text-[10px] mb-0.5 font-[family-name:var(--font-pixel)] tracking-wider">
                      {pokemon.japanese_name}
                    </p>
                  )}

                  <p className="text-[var(--text-muted)] text-[10px] mb-2 font-[family-name:var(--font-pixel)] tracking-wider">
                    #{String(pokemon.id).padStart(3, '0')}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {types.map((type) => (
                      <Badge key={`${pokemon.id}-${type}`} type={type} />
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
                    <span className="text-[var(--text-muted)] text-xs">Total</span>
                    <span className="text-sm font-bold" style={{ color: primaryColor }}>
                      {pokemon.total_stats}
                    </span>
                  </div>
                </button>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-8 mb-4">
          <button
            onClick={() => setVisibleCount((c) => c + 52)}
            className="px-6 py-3 rounded-xl glass text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Show next...
          </button>
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────────────────── */}
      {filtered.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-[var(--text-muted)] text-lg mb-2">No Pokemon found</p>
          <p className="text-[var(--text-muted)] text-sm">Try adjusting your search or filters</p>
        </div>
      )}

      {/* ── Detail Modal ───────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-lg" />

          <div
            className="relative glass bg-white/95 dark:bg-[var(--surface)] rounded-2xl p-6 sm:p-8 max-w-2xl lg:max-w-6xl xl:max-w-7xl w-full max-h-[90vh] overflow-y-auto animate-[slide-in_0.3s_ease-out] custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10"
              aria-label="Close detail view"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10 mt-2">
              {/* ── Left Column: Moves ── */}
              <div className="lg:col-span-3 flex flex-col order-3 lg:order-1 pt-6 lg:pt-0 border-t lg:border-t-0 border-[var(--card-border)]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[var(--text-primary)] text-xs font-[family-name:var(--font-pixel)] uppercase tracking-wider">
                    Moves
                  </h3>
                  <span
                    className="text-[10px] text-[var(--text-muted)] font-mono cursor-help"
                    title="power / accuracy / pp"
                  >
                    power / acc / pp
                  </span>
                </div>
                {selectedMoves.length > 0 && (
                  <div className="mb-2">
                    <input
                      type="text"
                      value={moveSearch}
                      onChange={(e) => setMoveSearch(e.target.value)}
                      placeholder="Search moves..."
                      className="w-full pl-2.5 pr-2 py-1 rounded-md glass text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--type-fighting)]"
                    />
                  </div>
                )}
                {filteredMoves.length > 0 ? (
                  <div className="flex flex-col gap-1.5 max-h-48 lg:max-h-[60vh] lg:flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredMoves.map((move) => (
                      <div
                        key={`move-${selected.id}-${move.move_name}`}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[var(--surface-hover)] border border-[var(--card-border)]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            type={(move.move_type ?? 'normal') as PokemonType}
                            className="shrink-0"
                          />
                          <span className="text-xs text-[var(--text-primary)] capitalize font-medium truncate">
                            {move.move_name.replace(/-/g, ' ')}
                          </span>
                        </div>
                        <span
                          className="text-[10px] text-[var(--text-muted)] font-mono shrink-0 ml-2 cursor-help"
                          title="power / accuracy / pp"
                        >
                          {move.power ?? '-'} / {move.accuracy ?? '-'} / {move.pp ?? '-'}pp
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)] text-xs">
                    {moveSearch ? 'No moves match your search' : 'No moves data available'}
                  </p>
                )}
              </div>

              {/* ── Center Column: Info & Stats ── */}
              <div className="lg:col-span-6 flex flex-col order-1 lg:order-2">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    <div
                      className="absolute inset-0 rounded-full opacity-30 scale-150"
                      style={{
                        background: `radial-gradient(circle at center, ${typeColorMap[primaryTypeOf(selected)]}60 0%, transparent 70%)`,
                      }}
                    />
                    <Image
                      src={OFFICIAL_ARTWORK(selected.id)}
                      alt={selected.name}
                      width={180}
                      height={180}
                      className={[
                        'relative z-10 transition-transform duration-500 hover:scale-110 drop-shadow-2xl',
                        isSpriteMissing(selected.id) ? 'brightness-0 opacity-50' : '',
                      ].join(' ')}
                      unoptimized
                    />
                  </div>

                  <h2 className="text-2xl font-bold text-[var(--text-primary)] capitalize mb-1">
                    {selected.name}
                  </h2>
                  {selected.japanese_name && (
                    <p className="text-[var(--text-muted)] text-sm font-[family-name:var(--font-pixel)] tracking-wider mb-1">
                      {selected.japanese_name}
                    </p>
                  )}
                  <p className="text-[var(--text-muted)] text-sm font-[family-name:var(--font-pixel)] tracking-wider">
                    #{String(selected.id).padStart(3, '0')}
                  </p>

                  <div className="flex gap-2 mt-3">
                    {parseTypes(selected).map((type) => (
                      <Badge key={`${selected.id}-${type}`} type={type} />
                    ))}
                  </div>

                  <div className="flex gap-8 mt-4 text-sm">
                    <div className="text-center">
                      <p className="text-[var(--text-muted)] text-xs mb-0.5">Height</p>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {(selected.height / 10).toFixed(1)} m
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[var(--text-muted)] text-xs mb-0.5">Weight</p>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {(selected.weight / 10).toFixed(1)} kg
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  <div>
                    <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">
                      Radar
                    </h3>

                    <div className="w-full min-w-0 h-[220px] min-h-[220px]">
                      <ResponsiveContainer
                        key={`radar-${selected.id}`}
                        width="100%"
                        height="100%"
                        minWidth={0}
                        minHeight={220}
                      >
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                          <PolarGrid stroke="var(--card-border)" strokeDasharray="3 3" />
                          <PolarAngleAxis
                            dataKey="stat"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, STAT_MAX]}
                            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                            tickCount={6}
                            axisLine={false}
                          />
                          <Radar
                            name={selected.name}
                            dataKey="value"
                            stroke={typeColorMap[primaryTypeOf(selected)]}
                            fill={typeColorMap[primaryTypeOf(selected)]}
                            fillOpacity={0.2}
                            strokeWidth={2}
                            dot={{ r: 3, fill: typeColorMap[primaryTypeOf(selected)] }}
                            activeDot={{
                              r: 5,
                              fill: typeColorMap[primaryTypeOf(selected)],
                              stroke: '#fff',
                              strokeWidth: 1,
                            }}
                          />
                          <Tooltip content={<MatchupTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-6">
                      Base Stats
                    </h3>

                    <div className="space-y-3">
                      {STAT_META.map(({ key, label }) => {
                        const value = selected[key] as number
                        const pct = Math.min((value / STAT_MAX) * 100, 100)
                        const color = typeColorMap[primaryTypeOf(selected)]

                        return (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-[var(--text-secondary)] text-xs w-14 text-right font-semibold shrink-0">
                              {label}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: detailReady ? `${pct}%` : '0%',
                                  background: `linear-gradient(90deg, ${color}80, ${color})`,
                                  boxShadow: detailReady ? `0 0 8px ${color}40` : 'none',
                                  transition: 'width 0.7s ease-out, box-shadow 0.7s ease-out',
                                }}
                              />
                            </div>
                            <span className="text-[var(--text-secondary)] text-xs w-8 text-right font-mono shrink-0">
                              {value}
                            </span>
                          </div>
                        )
                      })}

                      <div className="flex items-center gap-3 pt-3 border-t border-[var(--card-border)]">
                        <span className="text-[var(--text-secondary)] text-xs w-14 text-right font-bold shrink-0">
                          TOTAL
                        </span>
                        <div className="flex-1" />
                        <span
                          className="text-sm font-bold shrink-0"
                          style={{ color: typeColorMap[primaryTypeOf(selected)] }}
                        >
                          {selected.total_stats}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-0">
                  <h3 className="text-[var(--text-primary)] text-xs font-[family-name:var(--font-pixel)] uppercase tracking-wider mb-2">
                    Type defenses
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-[family-name:var(--font-pixel)] tracking-wide mb-3">
                    The effectiveness of each type on{' '}
                    <span className="italic">
                      {selected?.name.charAt(0).toUpperCase()}
                      {selected?.name.slice(1)}
                    </span>
                    .
                  </p>

                  <div className="space-y-3">
                    {[ALL_TYPES.slice(0, 9), ALL_TYPES.slice(9)].map((rowTypes, rowIdx) => (
                      <div
                        key={rowIdx}
                        className="grid grid-cols-9 gap-px rounded-lg overflow-hidden border border-[var(--card-border)]"
                      >
                        {rowTypes.map((type) => (
                          <div
                            key={type}
                            className="flex items-center justify-center h-9 text-[10px] font-[family-name:var(--font-pixel)] font-bold text-white uppercase tracking-wider"
                            style={{ backgroundColor: typeColorMap[type] }}
                          >
                            {type.slice(0, 3)}
                          </div>
                        ))}
                        {rowTypes.map((type) => {
                          const mult = typeDefenses[type] ?? 1
                          const isSuperEffective = mult > 1
                          const isNotVeryEffective = mult < 1 && mult > 0
                          const isImmune = mult === 0
                          const isNeutral = mult === 1

                          let cellBg = 'bg-[var(--surface-primary)]'
                          let cellText = 'text-[var(--text-muted)]'
                          let label = ''

                          if (isImmune) {
                            cellBg = 'bg-[#1a1a2e]'
                            cellText = 'text-[var(--text-muted)]'
                            label = '0'
                          } else if (isSuperEffective) {
                            cellBg = mult >= 4 ? 'bg-[#2d6a1e]' : 'bg-[#4a8c3f]'
                            cellText = 'text-white'
                            label = mult >= 4 ? '4' : '2'
                          } else if (isNotVeryEffective) {
                            cellBg = mult <= 0.25 ? 'bg-[#8b2500]' : 'bg-[#a0522d]'
                            cellText = 'text-white'
                            label = mult <= 0.25 ? '¼' : '½'
                          }

                          return (
                            <div
                              key={`${type}-val`}
                              className={`flex items-center justify-center h-9 ${cellBg} ${cellText} text-xs font-[family-name:var(--font-pixel)] font-bold`}
                            >
                              {isNeutral ? '' : label}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
                  <PokemonFightSim player={selected} allPokemon={data ?? []} />
                </div>
              </div>

              {/* ── Right Column: Evolution Chain ── */}
              <div className="lg:col-span-3 flex flex-col order-2 lg:order-3 pt-6 lg:pt-0 border-t lg:border-t-0 border-[var(--card-border)]">
                <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-3">
                  Evolution Chain
                </h3>
                {evolutionChain.length > 0 ? (
                  <EvolutionGraph
                    nodes={evolutionChain}
                    selectedName={selected.name}
                    onSelect={(pokemon) => {
                      if (pokemon) setSelected(pokemon)
                    }}
                  />
                ) : (
                  <p className="text-[var(--text-muted)] text-xs">No evolution data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--card-border)] border-t-[var(--accent)] animate-spin" />
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
