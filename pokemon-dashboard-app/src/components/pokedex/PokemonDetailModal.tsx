'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
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
import { Badge } from '@/components/ui/Badge'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { EvolutionGraph, type EvolutionChainNode } from './EvolutionGraph'
import { TypeMatchupPills } from './TypeMatchupPills'
import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import {
  type PokemonRow,
  type EvolutionTreeRow,
  type EvolutionPathRow,
  type PokemonMoveRow,
} from '@/lib/types/pokemon'
import { parseTypes, capitalize } from '@/lib/utils/pokemon'
import { isSpriteMissing, getSpriteUrl as OFFICIAL_ARTWORK } from '@/lib/sprites'
import { useJSONQuery } from '@/lib/hooks/useJSONQuery'
import { PokemonFightSim } from '@/components/fight/PokemonFightSim'

// ===== Constants ==============================================================

const STAT_META: {
  key: keyof Pick<
    PokemonRow,
    'hp' | 'attack' | 'defense' | 'special_attack' | 'special_defense' | 'speed'
  >
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

// ===== Helpers ================================================================

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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const check = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => setIsMobile(window.innerWidth < 640), 100)
    }
    check()
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('resize', check)
      clearTimeout(timeout)
    }
  }, [])
  return isMobile
}

// ===== Props ==================================================================

interface PokemonDetailModalProps {
  selected: PokemonRow
  allPokemon: PokemonRow[]
  pokemonByName: Map<string, PokemonRow>
  onClose: () => void
  onSelectPokemon: (pokemon: PokemonRow) => void
}

export function PokemonDetailModal({
  selected,
  allPokemon,
  pokemonByName,
  onClose,
  onSelectPokemon,
}: PokemonDetailModalProps) {
  const [detailReady, setDetailReady] = useState(false)
  const [moveSearch, setMoveSearch] = useState('')
  const [showMovesModal, setShowMovesModal] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])
  useEffect(() => {
    setDetailReady(false)
    const r = requestAnimationFrame(() => setDetailReady(true))
    return () => cancelAnimationFrame(r)
  }, [selected])
  useEffect(() => {
    setMoveSearch('')
    setShowMovesModal(false)
  }, [selected])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showMovesModal) setShowMovesModal(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, showMovesModal])

  const { data: evolutionTree } = useJSONQuery<EvolutionTreeRow>('evolution_tree.json')
  const { data: evolutionPaths } = useJSONQuery<EvolutionPathRow>('evolution_paths.json')
  const { data: pokemonMovesData } = useJSONQuery<PokemonMoveRow>('pokemon_moves.json')

  // Build an index Map for O(1) moves lookup instead of O(n) filtering on every selection
  const movesByPokemon = useMemo(() => {
    if (!pokemonMovesData) return new Map<number, PokemonMoveRow[]>()
    const map = new Map<number, PokemonMoveRow[]>()
    for (const m of pokemonMovesData) {
      if (!map.has(m.pokemon_id)) map.set(m.pokemon_id, [])
      map.get(m.pokemon_id)!.push(m)
    }
    return map
  }, [pokemonMovesData])

  const types = parseTypes(selected.types || selected.type_names || '')
  const primary = (selected.primaryType ?? types[0] ?? 'normal') as PokemonType
  const primaryColor = typeColorMap[primary]

  const radarData = useMemo(
    () =>
      STAT_META.map(({ key, label }) => ({
        stat: label,
        value: selected[key],
        fullMark: STAT_MAX,
      })),
    [selected]
  )
  const selectedMoves = useMemo(
    () => movesByPokemon.get(selected.id) ?? [],
    [selected.id, movesByPokemon]
  )
  const filteredMoves = useMemo(() => {
    const q = moveSearch.trim().toLowerCase()
    if (!q) return selectedMoves
    return selectedMoves.filter((m) => m.move_name.replace(/-/g, ' ').toLowerCase().includes(q))
  }, [selectedMoves, moveSearch])

  const evolutionChain = useMemo<EvolutionChainNode[]>(() => {
    if (!evolutionTree?.length) return []
    const selName = selected.name.toLowerCase()
    const norm = (r: EvolutionTreeRow) => (r.species_name ?? r.name ?? '').toLowerCase()
    const selNode = evolutionTree.find((r) => norm(r) === selName)
    if (!selNode) return []
    const rows = evolutionTree.filter((r) => r.chain_id === selNode.chain_id)
    const triggers = new Map<
      string,
      { trigger: string | null; minLevel: number | null; itemRequired: string | null }
    >()
    for (const e of evolutionPaths ?? []) {
      if (e.chain_id === selNode.chain_id) {
        triggers.set(e.to_pokemon.toLowerCase(), {
          trigger: e.evolution_trigger,
          minLevel: e.min_level ?? null,
          itemRequired: e.item_required ?? null,
        })
      }
    }
    const deduped = new Map<string, EvolutionChainNode>()
    for (const row of rows) {
      const name = norm(row)
      if (!name) continue
      const cur = deduped.get(name)
      const pathInfo = triggers.get(name) ?? { trigger: null, minLevel: null, itemRequired: null }
      const treeTrigger = row.evolution_trigger ?? null
      const treeMinLevel = row.min_level ?? null
      const treeItem = row.item_required ?? null
      const cand: EvolutionChainNode = {
        name,
        stage: row.stage,
        evolvesFrom: row.evolves_from,
        trigger: pathInfo.trigger ?? treeTrigger,
        minLevel: pathInfo.minLevel ?? treeMinLevel,
        itemRequired: pathInfo.itemRequired ?? treeItem,
        pokemon: pokemonByName.get(name) ?? null,
      }
      if (!cur) {
        deduped.set(name, cand)
        continue
      }
      deduped.set(name, {
        ...cur,
        stage: Math.min(cur.stage, cand.stage),
        evolvesFrom: cur.evolvesFrom ?? cand.evolvesFrom,
        trigger: cur.trigger ?? cand.trigger,
        minLevel: cur.minLevel ?? cand.minLevel,
        itemRequired: cur.itemRequired ?? cand.itemRequired,
        pokemon: cur.pokemon ?? cand.pokemon,
      })
    }
    return [...deduped.values()].sort((a, b) => {
      if (a.stage !== b.stage) return a.stage - b.stage
      const aId = (a.pokemon as PokemonRow | null)?.id ?? Infinity
      const bId = (b.pokemon as PokemonRow | null)?.id ?? Infinity
      return aId !== bId ? aId - bId : a.name.localeCompare(b.name)
    })
  }, [selected, evolutionTree, evolutionPaths, pokemonByName])

  // ===== Shared sub-components ====================================================

  const heroSection = (
    <div className="flex flex-col items-center px-4 sm:px-0 pt-2 pb-4 shrink-0">
      <div className="relative mb-3 overflow-visible">
        <motion.div
          className="absolute inset-0 rounded-full scale-110"
          style={{
            background: `radial-gradient(circle at center, ${primaryColor}60 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.15, 0.3, 0.15], scale: [1.1, 1.2, 1.1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="relative z-10"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src={OFFICIAL_ARTWORK(selected.id)}
            alt={`Official artwork of ${selected.name}`}
            width={160}
            height={160}
            className={[
              'transition-transform duration-500 hover:scale-110 drop-shadow-lg',
              isSpriteMissing(selected.id) ? 'brightness-0 opacity-50' : '',
            ].join(' ')}
            unoptimized
          />
        </motion.div>
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] capitalize mb-0.5">
        {selected.name}
      </h2>
      {selected.japanese_name && (
        <p className="text-[var(--text-muted)] text-xs font-[family-name:var(--font-pixel)] tracking-wider mb-0.5">
          {selected.japanese_name}
        </p>
      )}
      <p className="text-[var(--text-muted)] text-xs font-[family-name:var(--font-pixel)] tracking-wider">
        #{String(selected.id).padStart(3, '0')}
      </p>
      <div className="flex gap-2 mt-2">
        {types.map((t) => (
          <Badge key={`${selected.id}-${t}`} type={t} />
        ))}
      </div>
      <div className="flex gap-6 mt-3 text-sm">
        <div className="text-center">
          <p className="text-[var(--text-muted)] text-[10px] mb-0.5">Height</p>
          <p className="text-[var(--text-primary)] font-semibold text-xs">
            {(selected.height / 10).toFixed(1)} m
          </p>
        </div>
        <div className="text-center">
          <p className="text-[var(--text-muted)] text-[10px] mb-0.5">Weight</p>
          <p className="text-[var(--text-primary)] font-semibold text-xs">
            {(selected.weight / 10).toFixed(1)} kg
          </p>
        </div>
      </div>
    </div>
  )

  const matchupsContent = (
    <TypeMatchupPills defenderTypes={types} pokemonName={capitalize(selected.name)} />
  )
  const evolutionContent = (
    <div>
      <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-3">
        Evolution Chain
      </h3>
      {evolutionChain.length > 0 ? (
        <EvolutionGraph
          nodes={evolutionChain}
          selectedName={selected.name}
          onSelect={(p) => {
            if (p) onSelectPokemon(p as PokemonRow)
          }}
        />
      ) : (
        <p className="text-[var(--text-muted)] text-xs">No evolution data</p>
      )}
    </div>
  )

  const movesButton = (
    <button
      onClick={() => setShowMovesModal(true)}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border-2 border-dashed border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all duration-200"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      View All Moves ({selectedMoves.length})
    </button>
  )

  const fightContent = <PokemonFightSim player={selected} allPokemon={allPokemon} />

  // ===== Render ===================================================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-fullscreen-mobile"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${selected.name} details`}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-lg" />

      <div
        className="relative glass bg-white/95 dark:bg-[var(--surface)] !rounded-none sm:!rounded-2xl p-0 sm:p-6 sm:w-[60vw] max-w-[800px] w-full h-full sm:h-auto sm:max-h-[90vh] overflow-hidden animate-[slide-in_0.3s_ease-out] custom-scrollbar flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header (mobile) + Close button */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 sm:px-0 sm:py-0 sm:mb-4 bg-white/90 dark:bg-[var(--surface)]/90 backdrop-blur-md sm:backdrop-blur-none sm:bg-transparent border-b border-[var(--card-border)] sm:border-0 shrink-0">
          <span className="text-sm font-bold text-[var(--text-primary)] capitalize sm:hidden truncate mr-4">
            {selected.name}
            <span className="text-[var(--text-muted)] font-normal ml-2">
              #{String(selected.id).padStart(3, '0')}
            </span>
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 sm:w-8 sm:h-8 rounded-full sm:rounded-lg bg-[var(--surface-hover)] sm:bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shrink-0 sm:absolute sm:top-0 sm:right-0 z-30"
            aria-label="Close detail view"
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

        <ErrorBoundary>
          {isMobile ? (
            /* ===== MOBILE: Simple scrollable list ===== */
            <div className="flex-1 overflow-y-auto overscroll-none custom-scrollbar">
              {/* Sprite + info at top */}
              {heroSection}

              {/* Stat bars */}
              <div className="px-4 pb-4 border-b border-[var(--card-border)]">
                <StatBarsSection
                  selected={selected}
                  primaryColor={primaryColor}
                  detailReady={detailReady}
                />
              </div>

              {/* Type matchups */}
              <div className="px-4 py-4 border-b border-[var(--card-border)]">
                {matchupsContent}
              </div>

              {/* Moves */}
              <div className="px-4 py-4 border-b border-[var(--card-border)]">
                <MovesTab
                  filteredMoves={filteredMoves}
                  selectedMoves={selectedMoves}
                  moveSearch={moveSearch}
                  onMoveSearchChange={setMoveSearch}
                />
              </div>

              {/* Evolution */}
              <div className="px-4 py-4 border-b border-[var(--card-border)]">
                {evolutionContent}
              </div>

              {/* Fight sim */}
              <div className="px-4 py-4">{fightContent}</div>
            </div>
          ) : (
            /* ===== DESKTOP: Radar | Sprite | Stat Bars ===== */
            <div className="flex-1 overflow-y-auto overscroll-none custom-scrollbar px-2">
              {/* Row 1: Radar (left) | Sprite+Info (center) | Stat Bars (right) */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center">
                {/* Left: Radar chart */}
                <div>
                  <RadarSection selected={selected} primary={primary} radarData={radarData} />
                </div>

                {/* Center: Sprite + name + types + height/weight */}
                <div className="flex flex-col items-center">{heroSection}</div>

                {/* Right: Stat bars */}
                <div>
                  <StatBarsSection
                    selected={selected}
                    primaryColor={primaryColor}
                    detailReady={detailReady}
                  />
                </div>
              </div>

              {/* Row 2: Type matchups (left) | Moves button + Evolution (right) */}
              <div className="grid grid-cols-[1fr_260px] gap-6 mt-4 border-t border-[var(--card-border)] pt-4">
                <div>{matchupsContent}</div>
                <div className="space-y-4">
                  {movesButton}
                  {evolutionContent}
                </div>
              </div>

              {/* Row 3: Fight sim (full width) */}
              <div className="mt-6 border-t border-[var(--card-border)] pt-4">{fightContent}</div>
            </div>
          )}
        </ErrorBoundary>
      </div>

      {/* ===== Moves Sub-Modal ===== */}
      {showMovesModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setShowMovesModal(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative glass bg-white/95 dark:bg-[var(--surface)] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col animate-[slide-in_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-sm font-bold text-[var(--text-primary)] capitalize">
                {selected.name}&apos;s Moves
                <span className="text-[var(--text-muted)] font-normal ml-2">
                  ({selectedMoves.length})
                </span>
              </h3>
              <button
                onClick={() => setShowMovesModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                aria-label="Close moves"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {selectedMoves.length > 0 && (
              <div className="mb-3 shrink-0">
                <input
                  type="text"
                  value={moveSearch}
                  onChange={(e) => setMoveSearch(e.target.value)}
                  placeholder="Search moves..."
                  className="w-full pl-3 pr-2 py-2 rounded-lg glass text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            )}
            <div className="flex items-center justify-between mb-2 text-[10px] text-[var(--text-muted)] font-mono shrink-0 px-1">
              <span>Move</span>
              <span>Power / Acc / PP</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredMoves.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {filteredMoves.map((move) => (
                    <div
                      key={`move-${move.move_name}`}
                      className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--card-border)] hover:border-[var(--accent)] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge
                          type={(move.move_type ?? 'normal') as PokemonType}
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs text-[var(--text-primary)] capitalize font-medium truncate block">
                            {move.move_name.replace(/-/g, ' ')}
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)] capitalize">
                            {move.damage_class}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0 ml-2">
                        {move.power ?? '-'} / {move.accuracy ?? '-'} / {move.pp ?? '-'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-muted)] text-xs text-center py-8">
                  {moveSearch ? 'No moves match your search' : 'No moves data available'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Sub-components =========================================================

/** Radar chart only — used in desktop left column */
function RadarSection({
  selected,
  primary,
  radarData,
}: {
  selected: PokemonRow
  primary: PokemonType
  radarData: { stat: string; value: number; fullMark: number }[]
}) {
  return (
    <div>
      <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2 text-center">
        Radar
      </h3>
      <div className="w-full min-w-0 h-[220px] min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
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
              stroke={typeColorMap[primary]}
              fill={typeColorMap[primary]}
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ r: 3, fill: typeColorMap[primary] }}
              activeDot={{ r: 5, fill: typeColorMap[primary], stroke: '#fff', strokeWidth: 1 }}
            />
            <Tooltip content={<MatchupTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** Stat bars only — used in desktop right column */
function StatBarsSection({
  selected,
  primaryColor,
  detailReady,
}: {
  selected: PokemonRow
  primaryColor: string
  detailReady: boolean
}) {
  return (
    <div className="max-w-[220px] ml-auto mr-auto">
      <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-4 text-center">
        Base Stats
      </h3>
      <div className="space-y-2">
        {STAT_META.map(({ key, label }) => {
          const value = selected[key] as number
          const pct = Math.min((value / STAT_MAX) * 100, 100)
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-[var(--text-secondary)] text-[10px] w-10 text-right font-semibold shrink-0">
                {label}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: detailReady ? `${pct}%` : '0%',
                    background: `linear-gradient(90deg, ${primaryColor}80, ${primaryColor})`,
                    boxShadow: detailReady ? `0 0 6px ${primaryColor}40` : 'none',
                    transition: 'width 0.7s ease-out, box-shadow 0.7s ease-out',
                  }}
                />
              </div>
              <span className="text-[var(--text-secondary)] text-[10px] w-6 text-right font-mono shrink-0">
                {value}
              </span>
            </div>
          )
        })}
        <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--card-border)]">
          <span className="text-[var(--text-secondary)] text-[10px] w-10 text-right font-bold shrink-0">
            BST
          </span>
          <div className="flex-1" />
          <span className="text-xs font-bold shrink-0" style={{ color: primaryColor }}>
            {selected.total_stats}
          </span>
        </div>
      </div>
    </div>
  )
}

function MovesTab({
  filteredMoves,
  selectedMoves,
  moveSearch,
  onMoveSearchChange,
}: {
  filteredMoves: PokemonMoveRow[]
  selectedMoves: PokemonMoveRow[]
  moveSearch: string
  onMoveSearchChange: (v: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[var(--text-primary)] text-xs font-[family-name:var(--font-pixel)] uppercase tracking-wider">
          Moves ({selectedMoves.length})
        </h3>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">power / acc / pp</span>
      </div>
      {selectedMoves.length > 0 && (
        <div className="mb-3">
          <input
            type="text"
            value={moveSearch}
            onChange={(e) => onMoveSearchChange(e.target.value)}
            placeholder="Search moves..."
            className="w-full pl-2.5 pr-2 py-1.5 rounded-md glass text-[16px] sm:text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--type-fighting)]"
          />
        </div>
      )}
      {filteredMoves.length > 0 ? (
        <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
          {filteredMoves.map((move) => (
            <div
              key={`move-${move.move_name}`}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[var(--surface-hover)] border border-[var(--card-border)]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Badge type={(move.move_type ?? 'normal') as PokemonType} className="shrink-0" />
                <span className="text-xs text-[var(--text-primary)] capitalize font-medium truncate">
                  {move.move_name.replace(/-/g, ' ')}
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0 ml-2">
                {move.power ?? '-'} / {move.accuracy ?? '-'} / {move.pp ?? '-'}pp
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[var(--text-muted)] text-xs">
          {moveSearch ? 'No moves match' : 'No moves data'}
        </p>
      )}
    </div>
  )
}
