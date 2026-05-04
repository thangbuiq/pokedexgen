'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'
import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import { ALL_TYPES, getEffectiveness, multiplierLabel } from '@/lib/type-effectiveness'
import { getSpriteUrl, isSpriteMissing } from '@/lib/sprites'
import styles from './pokemon-fight-sim.module.css'

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
  const dropdownRef = useRef<HTMLDivElement>(null)

  const playerTypes = parseTypes(player.type_names)
  const playerColor = typeColorMap[playerTypes[0]]

  const filtered = useMemo(() => {
    if (!search) return allPokemon.filter((p) => p.id !== player.id)
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <div className={styles.fightSim} ref={dropdownRef}>
      <h3 className={styles.title}>Fight Recommendation</h3>

      <div className={styles.battleBox}>
        <div className={`${styles.battleScreen} ${opponent ? styles.active : ''}`}>
          {!opponent ? (
            <div className={styles.battleEmpty}>
              <span className={styles.battleEmptyIcon}>⚔️</span>
              <span className={styles.battleEmptyText}>Choose an opponent to begin battle</span>
            </div>
          ) : (
            <div className={styles.battleActive}>
              <div className={styles.opponentArea}>
                <div className={styles.opponentInfo}>
                  <span className={styles.opponentName}>{opponent.name}</span>
                  <div className={styles.opponentTypes}>
                    {parseTypes(opponent.type_names).map((t) => (
                      <Badge key={t} type={t} />
                    ))}
                  </div>
                </div>
                <img
                  src={getSpriteUrl(opponent.id)}
                  alt={opponent.name}
                  className={styles.opponentSprite}
                  style={{
                    filter: isSpriteMissing(opponent.id) ? 'brightness(0) opacity(0.5)' : undefined,
                  }}
                />
              </div>

              <div className={styles.vsBadge}>VS</div>

              <div className={styles.playerArea}>
                <img
                  src={getSpriteUrl(player.id)}
                  alt={player.name}
                  className={styles.playerSprite}
                  style={{
                    filter: isSpriteMissing(player.id) ? 'brightness(0) opacity(0.5)' : undefined,
                  }}
                />
                <div className={styles.playerInfo}>
                  <span className={styles.playerName}>{player.name}</span>
                  <div className={styles.playerTypes}>
                    {playerTypes.map((t) => (
                      <Badge key={t} type={t} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.textBox}>
          <div className={styles.selectorArea}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={styles.selectorTrigger}
            >
              {opponent ? (
                <div className={styles.selectorSelected}>
                  <img
                    src={getSpriteUrl(opponent.id)}
                    alt={opponent.name}
                    className={styles.selectorSprite}
                    style={{
                      filter: isSpriteMissing(opponent.id) ? 'brightness(0) opacity(0.5)' : 'none',
                    }}
                  />
                  <span className={styles.selectorName}>{opponent.name}</span>
                </div>
              ) : (
                <span className={styles.selectorPlaceholder}>Choose an opponent...</span>
              )}
              <svg
                className={styles.selectorChevron}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                {showDropdown ? (
                  <path d="M18 15l-6-6-6 6" strokeWidth={2} />
                ) : (
                  <path d="M6 9l6 6 6-6" strokeWidth={2} />
                )}
              </svg>
            </button>

            {showDropdown && (
              <div className={styles.selectorDropdown}>
                <div className={styles.selectorSearch}>
                  <svg
                    className={styles.searchIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2} />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Pokemon..."
                    className={styles.searchInput}
                    autoFocus
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className={styles.searchClear}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="w-3 h-3"
                      >
                        <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} />
                      </svg>
                    </button>
                  )}
                </div>
                <div className={styles.selectorList}>
                  {filtered.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setOpponent(p)
                        setShowDropdown(false)
                        setSearch('')
                      }}
                      className={styles.selectorListItem}
                    >
                      <img
                        src={getSpriteUrl(p.id)}
                        alt={p.name}
                        className={styles.listSprite}
                        style={{
                          filter: isSpriteMissing(p.id) ? 'brightness(0) opacity(0.5)' : 'none',
                        }}
                      />
                      <span className={styles.listName}>{p.name}</span>
                      <div className={styles.listTypes}>
                        {parseTypes(p.type_names).map((t) => (
                          <Badge key={t} type={t} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div className={styles.selectorEmpty}>No Pokemon found</div>
                )}
              </div>
            )}
          </div>

          {opponent && (
            <>
              <div className={styles.statsSection}>
                {[
                  { label: 'HP', p: player.hp, o: opponent.hp },
                  { label: 'ATK', p: player.attack, o: opponent.attack },
                  { label: 'DEF', p: player.defense, o: opponent.defense },
                  { label: 'SPD', p: player.speed, o: opponent.speed },
                ].map(({ label, p, o }) => {
                  const pWins = p > o
                  return (
                    <div key={label} className={styles.statRow}>
                      <span
                        className={`${styles.statValue} ${pWins ? styles.statValueWin : styles.statValueLose}`}
                      >
                        {p}
                      </span>
                      <div className={styles.statBarOuter}>
                        <div
                          className={styles.statBarInner}
                          style={{
                            width: `${(p / STAT_MAX) * 100}%`,
                            background: pWins
                              ? `linear-gradient(90deg, ${playerColor}80, ${playerColor})`
                              : `linear-gradient(90deg, ${playerColor}40, ${playerColor}60)`,
                          }}
                        />
                      </div>
                      <span className={styles.statLabel}>{label}</span>
                      <div className={styles.statBarOuter}>
                        <div
                          className={styles.statBarInner}
                          style={{
                            width: `${(o / STAT_MAX) * 100}%`,
                            background: !pWins
                              ? `linear-gradient(90deg, #3b82f6, #3b82f680)`
                              : `linear-gradient(90deg, #3b82f660, #3b82f640)`,
                          }}
                        />
                      </div>
                      <span
                        className={`${styles.statValue} ${!pWins ? styles.statValueWin : styles.statValueLose}`}
                      >
                        {o}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className={styles.typeEffSection}>
                {(() => {
                  const pt = parseTypes(player.type_names)
                  const ot = parseTypes(opponent.type_names)
                  const offMult = getTypeEffectivenessAgainstPokemon(pt, ot)
                  const defMult = getTypeEffectivenessAgainstPokemon(ot, pt)
                  const effClass = (m: number) => {
                    if (m > 1) return styles.typeEffValueGood
                    if (m < 1 && m > 0) return styles.typeEffValueBad
                    return styles.typeEffValueNeutral
                  }
                  return (
                    <>
                      <div className={styles.typeEffRow}>
                        <span className={styles.typeEffLabel}>Your attack:</span>
                        <span className={`${styles.typeEffValue} ${effClass(offMult)}`}>
                          {multiplierLabel(offMult)}x
                        </span>
                      </div>
                      <div className={styles.typeEffRow}>
                        <span className={styles.typeEffLabel}>Their attack:</span>
                        <span className={`${styles.typeEffValue} ${effClass(defMult)}`}>
                          {multiplierLabel(defMult)}x
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>

              <button
                onClick={() => {
                  setOpponent(null)
                  setShowDropdown(false)
                }}
                className={styles.changeBtn}
              >
                Change opponent
              </button>
            </>
          )}
        </div>
      </div>

      {opponent && recommendations.length > 0 && (
        <div className={styles.recSection}>
          <p className={styles.recTitle}>Battle Recommendations ({recommendations.length})</p>
          <div className={styles.recList}>
            {recommendations.map((rec, idx) => (
              <div key={idx} className={styles.recItem}>
                <span
                  className={`${styles.recIcon} ${rec.type === 'good' ? styles.recIconGood : rec.type === 'bad' ? styles.recIconBad : styles.recIconNeutral}`}
                >
                  {rec.type === 'good' ? '▲' : rec.type === 'bad' ? '▼' : '●'}
                </span>
                <span className={styles.recText}>{rec.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
