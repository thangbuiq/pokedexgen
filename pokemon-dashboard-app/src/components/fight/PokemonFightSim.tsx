'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import {
  ALL_TYPES,
  getEffectiveness,
  getEffectivenessColor,
  multiplierLabel,
} from '@/lib/type-effectiveness'
import { getSpriteUrl, isSpriteMissing } from '@/lib/sprites'

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
  total_stats: number
}

interface PokemonFightSimProps {
  player: PokemonData
  allPokemon: PokemonData[]
}

const COMPARISON_COLORS = ['#ff6b35', '#3b82f6']
const STAT_MAX = 255

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

function getTypeEffectivenessAgainstPokemon(
  attackerTypes: PokemonType[],
  defenderTypes: PokemonType[]
): number {
  let effectiveness = 1
  for (const atkType of attackerTypes) {
    for (const defType of defenderTypes) {
      effectiveness *= getEffectiveness(atkType, defType)
    }
  }
  return effectiveness
}

function getRecommendations(
  player: PokemonData,
  opponent: PokemonData
): Array<{ type: 'good' | 'bad' | 'neutral'; text: string }> {
  const pt = parseTypes(player.type_names)
  const ot = parseTypes(opponent.type_names)
  const offMult = getTypeEffectivenessAgainstPokemon(pt, ot)
  const defMult = getTypeEffectivenessAgainstPokemon(ot, pt)
  const recs: Array<{ type: 'good' | 'bad' | 'neutral'; text: string }> = []

  if (offMult >= 4) {
    recs.push({
      type: 'good',
      text: `Your attacks are devastatingly effective (${multiplierLabel(offMult)}x). Prioritize attacking moves.`,
    })
  } else if (offMult >= 2) {
    recs.push({
      type: 'good',
      text: `Your attacks are super effective (${multiplierLabel(offMult)}x). Press the offensive advantage.`,
    })
  } else if (offMult <= 0.25) {
    recs.push({
      type: 'bad',
      text: `Your attacks are extremely weak (${multiplierLabel(offMult)}x). Consider switching to a different Pokemon.`,
    })
  } else if (offMult < 1) {
    recs.push({
      type: 'bad',
      text: `Your attacks are not very effective (${multiplierLabel(offMult)}x). Use status moves or switch out.`,
    })
  }

  if (defMult >= 4) {
    recs.push({
      type: 'bad',
      text: `You are extremely vulnerable to their attacks (${multiplierLabel(defMult)}x damage). Switch out immediately!`,
    })
  } else if (defMult >= 2) {
    recs.push({
      type: 'bad',
      text: `You are weak to their attacks (${multiplierLabel(defMult)}x damage). Be cautious.`,
    })
  } else if (defMult === 0) {
    recs.push({
      type: 'good',
      text: `You are completely immune to their attacks. You can stall or setup freely.`,
    })
  } else if (defMult <= 0.25) {
    recs.push({
      type: 'good',
      text: `You resist their attacks heavily (${multiplierLabel(defMult)}x). You can tank hits easily.`,
    })
  } else if (defMult < 1) {
    recs.push({
      type: 'good',
      text: `You resist their attacks (${multiplierLabel(defMult)}x). Good defensive matchup.`,
    })
  }

  const spdDiff = player.speed - opponent.speed
  if (spdDiff >= 30) {
    recs.push({
      type: 'good',
      text: `You outspeed them by a wide margin (${spdDiff} points). You will likely move first.`,
    })
  } else if (spdDiff >= 10) {
    recs.push({
      type: 'neutral',
      text: `You are slightly faster. Speed advantage may let you strike first.`,
    })
  } else if (spdDiff <= -30) {
    recs.push({
      type: 'bad',
      text: `They outspeed you significantly (${Math.abs(spdDiff)} points). Expect to take hits first.`,
    })
  } else if (spdDiff <= -10) {
    recs.push({
      type: 'neutral',
      text: `They are slightly faster. Be prepared to take a hit before attacking.`,
    })
  }

  const atkDiff = player.attack - opponent.defense
  const spatkDiff = player.special_attack - opponent.special_defense
  if (atkDiff >= 40) {
    recs.push({
      type: 'good',
      text: `Your physical attack heavily outclasses their defense. Physical moves are recommended.`,
    })
  }
  if (spatkDiff >= 40) {
    recs.push({
      type: 'good',
      text: `Your special attack heavily outclasses their special defense. Special moves are recommended.`,
    })
  }
  if (atkDiff < 0 && spatkDiff < 0) {
    recs.push({
      type: 'bad',
      text: `Your offensive stats are lower than their defenses. Consider boosting moves or switching.`,
    })
  }

  const hpDiff = player.hp - opponent.hp
  const bulkDiff =
    player.hp +
    player.defense +
    player.special_defense -
    (opponent.hp + opponent.defense + opponent.special_defense)
  if (bulkDiff >= 60) {
    recs.push({
      type: 'good',
      text: `You are significantly bulkier. You can outlast them in a war of attrition.`,
    })
  } else if (bulkDiff <= -60) {
    recs.push({
      type: 'bad',
      text: `They are much bulkier. You need to hit hard and fast or switch.`,
    })
  }

  const bstDiff = getTotalStats(player) - getTotalStats(opponent)
  if (bstDiff >= 100) {
    recs.push({
      type: 'good',
      text: `Your total stats are much higher. You have a clear stat advantage.`,
    })
  } else if (bstDiff <= -100) {
    recs.push({
      type: 'bad',
      text: `Their total stats are much higher. You are at a stat disadvantage.`,
    })
  }

  return recs
}

export function PokemonFightSim({ player, allPokemon }: PokemonFightSimProps) {
  const [opponent, setOpponent] = useState<PokemonData | null>(null)
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const playerTypes = parseTypes(player.type_names)
  const playerColor = typeColorMap[playerTypes[0]]

  const filtered = useMemo(() => {
    if (!search) return allPokemon.filter((p) => p.id !== player.id).slice(0, 20)
    const q = search.toLowerCase()
    return allPokemon.filter(
      (p) =>
        p.id !== player.id &&
        (p.name.toLowerCase().includes(q) || p.type_names.toLowerCase().includes(q))
    )
  }, [allPokemon, search, player.id])

  const recommendations = useMemo(() => {
    if (!opponent) return []
    return getRecommendations(player, opponent)
  }, [player, opponent])

  return (
    <div className="space-y-4">
      <h3 className="text-[var(--text-primary)] text-xs font-[family-name:var(--font-pixel)] uppercase tracking-wider mb-2">
        Fight Simulation
      </h3>

      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-sm hover:border-[var(--text-secondary)] transition-colors"
        >
          {opponent ? (
            <div className="flex items-center gap-2">
              <img
                src={getSpriteUrl(opponent.id)}
                alt={opponent.name}
                className="w-6 h-6 object-contain"
                style={{
                  filter: isSpriteMissing(opponent.id) ? 'brightness(0) opacity(0.5)' : 'none',
                }}
              />
              <span className="capitalize text-[var(--text-primary)]">{opponent.name}</span>
              <div className="flex gap-1">
                {parseTypes(opponent.type_names).map((t) => (
                  <Badge key={t} type={t} />
                ))}
              </div>
            </div>
          ) : (
            <span className="text-[var(--text-muted)]">Choose an opponent...</span>
          )}
          <svg
            className="w-4 h-4 text-[var(--text-muted)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            {showDropdown ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--card-border)] rounded-lg overflow-hidden shadow-lg">
            <div className="p-2 border-b border-[var(--card-border)]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Pokemon..."
                className="w-full px-2 py-1 rounded bg-[var(--surface-hover)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                autoFocus
              />
            </div>
            <div className="max-h-40 overflow-y-auto p-1">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setOpponent(p)
                    setShowDropdown(false)
                    setSearch('')
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors text-left"
                >
                  <img
                    src={getSpriteUrl(p.id)}
                    alt={p.name}
                    className="w-6 h-6 object-contain"
                    style={{
                      filter: isSpriteMissing(p.id) ? 'brightness(0) opacity(0.5)' : 'none',
                    }}
                  />
                  <span className="text-xs capitalize text-[var(--text-primary)]">{p.name}</span>
                  <div className="flex gap-0.5 ml-auto">
                    {parseTypes(p.type_names).map((t) => (
                      <span
                        key={t}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: typeColorMap[t] }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {opponent && (
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <img
                src={getSpriteUrl(player.id)}
                alt={player.name}
                className="w-10 h-10 object-contain"
              />
              <span className="text-xs font-semibold capitalize" style={{ color: playerColor }}>
                {player.name}
              </span>
            </div>
            <span className="text-[10px] font-[family-name:var(--font-pixel)] text-[var(--text-muted)]">
              VS
            </span>
            <div className="flex-1 flex items-center gap-2 justify-end">
              <span
                className="text-xs font-semibold capitalize"
                style={{ color: COMPARISON_COLORS[1] }}
              >
                {opponent.name}
              </span>
              <img
                src={getSpriteUrl(opponent.id)}
                alt={opponent.name}
                className="w-10 h-10 object-contain"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            {[
              { label: 'HP', p: player.hp, o: opponent.hp },
              { label: 'ATK', p: player.attack, o: opponent.attack },
              { label: 'DEF', p: player.defense, o: opponent.defense },
              { label: 'SPD', p: player.speed, o: opponent.speed },
            ].map(({ label, p, o }) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`text-[10px] w-6 text-right font-mono ${p > o ? 'text-emerald-400 font-bold' : 'text-[var(--text-secondary)]'}`}
                >
                  {p}
                </span>
                <div className="flex-1 h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden flex justify-end">
                  <div
                    className="h-full rounded-l-full"
                    style={{
                      width: `${(p / STAT_MAX) * 100}%`,
                      background:
                        p > o
                          ? `linear-gradient(90deg, ${playerColor}80, ${playerColor})`
                          : `linear-gradient(90deg, ${playerColor}40, ${playerColor}60)`,
                    }}
                  />
                </div>
                <span className="text-[9px] font-[family-name:var(--font-pixel)] text-[var(--text-muted)] w-6 text-center">
                  {label}
                </span>
                <div className="flex-1 h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-r-full"
                    style={{
                      width: `${(o / STAT_MAX) * 100}%`,
                      background:
                        o > p
                          ? `linear-gradient(90deg, ${COMPARISON_COLORS[1]}, ${COMPARISON_COLORS[1]}80)`
                          : `linear-gradient(90deg, ${COMPARISON_COLORS[1]}60, ${COMPARISON_COLORS[1]}40)`,
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] w-6 font-mono ${o > p ? 'text-blue-400 font-bold' : 'text-[var(--text-secondary)]'}`}
                >
                  {o}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {(() => {
              const pt = parseTypes(player.type_names)
              const ot = parseTypes(opponent.type_names)
              const offMult = getTypeEffectivenessAgainstPokemon(pt, ot)
              const defMult = getTypeEffectivenessAgainstPokemon(ot, pt)
              return (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--text-muted)]">Your attack:</span>
                    <span
                      className="font-bold font-mono px-1 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          offMult > 1
                            ? '#166534'
                            : offMult < 1
                              ? '#8B1A1A'
                              : 'var(--surface-hover)',
                        color: offMult === 1 ? 'var(--text-muted)' : '#fff',
                      }}
                    >
                      {multiplierLabel(offMult)}x
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--text-muted)]">Their attack:</span>
                    <span
                      className="font-bold font-mono px-1 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          defMult > 1
                            ? '#8B1A1A'
                            : defMult < 1
                              ? '#166534'
                              : 'var(--surface-hover)',
                        color: defMult === 1 ? 'var(--text-muted)' : '#fff',
                      }}
                    >
                      {multiplierLabel(defMult)}x
                    </span>
                  </div>
                </>
              )
            })()}
          </div>

          {recommendations.length > 0 && (
            <div className="pt-2 border-t border-[var(--card-border)]">
              <p className="text-[10px] font-[family-name:var(--font-pixel)] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Battle Recommendations
              </p>
              <div className="space-y-1.5">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] px-2 py-1">
                    <span className="mt-0.5 shrink-0">
                      {rec.type === 'good' && <span className="text-emerald-400 font-bold">▲</span>}
                      {rec.type === 'bad' && <span className="text-red-400 font-bold">▼</span>}
                      {rec.type === 'neutral' && (
                        <span className="text-[var(--text-muted)]">●</span>
                      )}
                    </span>
                    <span className="leading-relaxed text-[var(--text-primary)]">{rec.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
