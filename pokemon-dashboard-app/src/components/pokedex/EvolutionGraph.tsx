'use client'

import { useMemo } from 'react'
import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import { isSpriteMissing, getSpriteUrl as OFFICIAL_ARTWORK } from '@/lib/sprites'

interface EvolutionChainNode {
  name: string
  stage: number
  evolvesFrom: string | null
  trigger: string | null
  minLevel: number | null
  itemRequired: string | null
  pokemon: { id: number; name: string; types?: string; type_names?: string } | null
}

interface EvolutionGraphProps {
  nodes: EvolutionChainNode[]
  selectedName: string
  onSelect: (pokemon: EvolutionChainNode['pokemon']) => void
}

function primaryTypeOf(pokemon: { types?: string; type_names?: string } | null): PokemonType {
  if (!pokemon) return 'normal'
  const raw =
    (pokemon as Record<string, string>).types ||
    (pokemon as Record<string, string>).type_names ||
    ''
  const first = raw
    .split(',')
    .map((t: string) => t.trim().toLowerCase())
    .find((t: string): t is PokemonType => t in typeColorMap)
  return first ?? 'normal'
}

/** Humanize trigger string: "level-up" -> "Level Up", "use-item" -> "Use Item" */
function humanizeTrigger(trigger: string): string {
  return trigger
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Get color for trigger type */
function triggerColor(trigger: string | null): string {
  if (!trigger) return 'var(--text-muted)'
  const t = trigger.toLowerCase()
  if (t === 'level-up') return '#6390F0' // water blue
  if (t === 'use-item') return '#EE8130' // fire orange
  if (t === 'trade') return '#A98FF3' // psychic purple
  if (t === 'shed') return '#A8A77A' // normal-ish
  return '#F85888' // pink for special triggers
}

/** Format trigger info into a display label */
function formatTriggerInfo(node: EvolutionChainNode): { label: string; color: string } | null {
  const { trigger, minLevel, itemRequired } = node
  if (!trigger) return null

  const color = triggerColor(trigger)
  const t = trigger.toLowerCase()

  // Level-up with level requirement
  if (t === 'level-up' && minLevel) {
    return { label: `Lv. ${minLevel}`, color }
  }

  // Use-item with item name
  if (t === 'use-item' && itemRequired) {
    return { label: humanizeTrigger(itemRequired), color }
  }

  // Trade with item
  if (t === 'trade' && itemRequired) {
    return { label: `Trade + ${humanizeTrigger(itemRequired)}`, color }
  }

  // Trade without item
  if (t === 'trade') {
    return { label: 'Trade', color }
  }

  // Special triggers (spin, recoil-damage, three-critical-hits, etc.)
  return { label: humanizeTrigger(trigger), color }
}

export type { EvolutionChainNode }

export function EvolutionGraph({ nodes, selectedName, onSelect }: EvolutionGraphProps) {
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
                const primary = primaryTypeOf(node.pokemon)
                const triggerInfo = formatTriggerInfo(node)
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
                    aria-label={`Select ${node.name}`}
                  >
                    {sprite ? (
                      <img
                        src={sprite}
                        alt={`${node.name} sprite`}
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
                      {triggerInfo && (
                        <span
                          className="text-[9px] font-semibold truncate px-1.5 py-0.5 rounded-md mt-0.5"
                          style={{
                            color: triggerInfo.color,
                            backgroundColor: `${triggerInfo.color}18`,
                            border: `1px solid ${triggerInfo.color}30`,
                          }}
                        >
                          {triggerInfo.label}
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
