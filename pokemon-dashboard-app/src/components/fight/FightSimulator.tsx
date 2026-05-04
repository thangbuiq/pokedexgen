'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { HowToGuide } from '@/components/ui/HowToGuide'
import { PokemonSprite } from '@/components/ui/PokemonSprite'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import {
  ALL_TYPES,
  getEffectiveness,
  getEffectivenessColor,
  multiplierLabel,
} from '@/lib/type-effectiveness'
import { getSpriteUrl, isSpriteMissing } from '@/lib/sprites'
import styles from './fight-simulator.module.css'

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

interface FightSimulatorProps {
  pokemon: PokemonData[]
  loading: boolean
}

const COMPARISON_COLORS = ['#ff6b35', '#3b82f6', '#22c55e', '#facc15', '#ec4899', '#67e8f9']
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

function calculateBattleScore(player: PokemonData, opponent: PokemonData): number {
  const playerTypes = parseTypes(player.type_names)
  const opponentTypes = parseTypes(opponent.type_names)

  // Offensive advantage: how well player hits opponent
  const offensiveMult = getTypeEffectivenessAgainstPokemon(playerTypes, opponentTypes)
  const offensiveScore = Math.min(offensiveMult * 25, 50)

  // Defensive advantage: how well player resists opponent
  const defensiveMult = getTypeEffectivenessAgainstPokemon(opponentTypes, playerTypes)
  const defensiveScore = defensiveMult < 1 ? (1 - defensiveMult) * 25 : 0

  // Speed advantage
  const speedScore = player.speed > opponent.speed ? 10 : 0

  // Stats comparison (normalized)
  const playerAvgStat = getTotalStats(player) / 6
  const opponentAvgStat = getTotalStats(opponent) / 6
  const statRatio = playerAvgStat / (opponentAvgStat || 1)
  const statScore = Math.min(Math.max((statRatio - 0.8) * 20, 0), 20)

  return Math.min(100, Math.round(offensiveScore + defensiveScore + speedScore + statScore))
}

function calculateCounterScore(pokemon: PokemonData, opponent: PokemonData): number {
  const pokemonTypes = parseTypes(pokemon.type_names)
  const opponentTypes = parseTypes(opponent.type_names)

  // Offensive: how well pokemon hits opponent
  const offensiveMult = getTypeEffectivenessAgainstPokemon(pokemonTypes, opponentTypes)
  const offensiveScore = offensiveMult > 1 ? (offensiveMult - 1) * 30 : 0

  // Defensive: how well pokemon resists opponent
  const defensiveMult = getTypeEffectivenessAgainstPokemon(opponentTypes, pokemonTypes)
  const defensiveScore = defensiveMult < 1 ? (1 - defensiveMult) * 30 : 0

  // Speed advantage
  const speedScore = pokemon.speed > opponent.speed ? 15 : 0

  // Stats advantage
  const statsDiff = getTotalStats(pokemon) - getTotalStats(opponent)
  const statsScore = Math.min(Math.max(statsDiff / 20, 0), 25)

  return Math.min(100, Math.round(offensiveScore + defensiveScore + speedScore + statsScore + 20))
}

function PokemonSelector({
  pokemon,
  selected,
  onSelect,
  label,
  excludeId,
}: {
  pokemon: PokemonData[]
  selected: PokemonData | null
  onSelect: (p: PokemonData) => void
  label: string
  excludeId?: number
}) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return pokemon.filter((p) => p.id !== excludeId)
    const q = search.toLowerCase()
    return pokemon.filter(
      (p) =>
        p.id !== excludeId &&
        (p.name.toLowerCase().includes(q) || p.type_names.toLowerCase().includes(q))
    )
  }, [pokemon, search, excludeId])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={styles.selectorTrigger}
        aria-label={`Select ${label}`}
      >
        {selected ? (
          <div className={styles.selectorSelected}>
            <img
              src={getSpriteUrl(selected.id)}
              alt={selected.name}
              className={styles.selectorSprite}
              style={{
                filter: isSpriteMissing(selected.id) ? 'brightness(0) opacity(0.5)' : 'none',
              }}
            />
            <div className={styles.selectorInfo}>
              <span className={styles.selectorName}>{selected.name}</span>
              <div className={styles.selectorTypes}>
                {parseTypes(selected.type_names).map((t) => (
                  <Badge key={t} type={t} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <span className={styles.selectorPlaceholder}>Choose {label}...</span>
        )}
        <svg
          className={styles.selectorChevron}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M6 9l6 6 6-6" strokeWidth={2} />
        </svg>
      </button>
    )
  }

  return (
    <div className={styles.selectorDropdown}>
      <div className={styles.selectorHeader}>
        <span className={styles.selectorLabel}>Select {label}</span>
        <button onClick={() => setIsOpen(false)} className={styles.selectorClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
            <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} />
          </svg>
        </button>
      </div>
      <div className={styles.selectorSearch}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
              <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} />
            </svg>
          </button>
        )}
      </div>
      <div className={styles.selectorGrid}>
        {filtered.slice(0, 20).map((p) => (
          <button
            key={p.id}
            onClick={() => {
              onSelect(p)
              setIsOpen(false)
              setSearch('')
            }}
            className={styles.selectorOption}
          >
            <img
              src={getSpriteUrl(p.id)}
              alt={p.name}
              className={styles.optionSprite}
              style={{
                filter: isSpriteMissing(p.id) ? 'brightness(0) opacity(0.5)' : 'none',
              }}
            />
            <span className={styles.optionName}>{p.name}</span>
            <div className={styles.optionTypes}>
              {parseTypes(p.type_names).map((t) => (
                <span
                  key={t}
                  className={styles.optionType}
                  style={{ backgroundColor: typeColorMap[t] }}
                >
                  {t.charAt(0).toUpperCase()}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <div className={styles.selectorEmpty}>No Pokemon found</div>}
    </div>
  )
}

function BattleArena({
  player,
  opponent,
}: {
  player: PokemonData | null
  opponent: PokemonData | null
}) {
  if (!player || !opponent) {
    return (
      <div className={styles.arenaEmpty}>
        <div className={styles.arenaPlaceholder}>
          <span className={styles.arenaIcon}>⚔️</span>
          <span className={styles.arenaText}>Select two Pokemon to start the battle</span>
        </div>
      </div>
    )
  }

  const playerTypes = parseTypes(player.type_names)
  const opponentTypes = parseTypes(opponent.type_names)
  const playerColor = typeColorMap[playerTypes[0]]
  const opponentColor = typeColorMap[opponentTypes[0]]

  const playerScore = calculateBattleScore(player, opponent)
  const opponentScore = calculateBattleScore(opponent, player)

  return (
    <div className={styles.arena}>
      {}
      <div className={styles.arenaSide}>
        <div className={styles.arenaPokemon}>
          <div
            className={styles.arenaGlow}
            style={{
              background: `radial-gradient(circle at center, ${playerColor}60 0%, transparent 70%)`,
            }}
          />
          <img
            src={getSpriteUrl(player.id)}
            alt={player.name}
            className={styles.arenaSprite}
            style={{
              filter: isSpriteMissing(player.id) ? 'brightness(0) opacity(0.5)' : 'none',
            }}
          />
        </div>
        <h4 className={styles.arenaName} style={{ color: COMPARISON_COLORS[0] }}>
          {player.name}
        </h4>
        <div className={styles.arenaTypes}>
          {playerTypes.map((t) => (
            <Badge key={t} type={t} />
          ))}
        </div>
        {}
        <div className={styles.hpBarContainer}>
          <div className={styles.hpBarLabel}>HP</div>
          <div className={styles.hpBar}>
            <div
              className={styles.hpBarFill}
              style={{
                width: `${(player.hp / STAT_MAX) * 100}%`,
                background: `linear-gradient(90deg, ${playerColor}80, ${playerColor})`,
              }}
            />
          </div>
          <div className={styles.hpBarValue}>{player.hp}</div>
        </div>
        {}
        <div className={styles.scoreBadge} style={{ backgroundColor: COMPARISON_COLORS[0] }}>
          Score: {playerScore}%
        </div>
      </div>

      {}
      <div className={styles.arenaDivider}>
        <span className={styles.vsText}>VS</span>
        <div className={styles.vsIcon}>⚡</div>
        <div className={styles.vsResult}>
          {playerScore > opponentScore ? (
            <span className={styles.vsWin}>WIN</span>
          ) : playerScore < opponentScore ? (
            <span className={styles.vsLose}>LOSE</span>
          ) : (
            <span className={styles.vsDraw}>DRAW</span>
          )}
        </div>
      </div>

      {}
      <div className={styles.arenaSide}>
        <div className={styles.arenaPokemon}>
          <div
            className={styles.arenaGlow}
            style={{
              background: `radial-gradient(circle at center, ${opponentColor}60 0%, transparent 70%)`,
            }}
          />
          <img
            src={getSpriteUrl(opponent.id)}
            alt={opponent.name}
            className={styles.arenaSprite}
            style={{
              filter: isSpriteMissing(opponent.id) ? 'brightness(0) opacity(0.5)' : 'none',
            }}
          />
        </div>
        <h4 className={styles.arenaName} style={{ color: COMPARISON_COLORS[1] }}>
          {opponent.name}
        </h4>
        <div className={styles.arenaTypes}>
          {opponentTypes.map((t) => (
            <Badge key={t} type={t} />
          ))}
        </div>
        {}
        <div className={styles.hpBarContainer}>
          <div className={styles.hpBarLabel}>HP</div>
          <div className={styles.hpBar}>
            <div
              className={styles.hpBarFill}
              style={{
                width: `${(opponent.hp / STAT_MAX) * 100}%`,
                background: `linear-gradient(90deg, ${opponentColor}80, ${opponentColor})`,
              }}
            />
          </div>
          <div className={styles.hpBarValue}>{opponent.hp}</div>
        </div>
        {}
        <div className={styles.scoreBadge} style={{ backgroundColor: COMPARISON_COLORS[1] }}>
          Score: {opponentScore}%
        </div>
      </div>
    </div>
  )
}

function TypeEffectivenessComparison({
  player,
  opponent,
}: {
  player: PokemonData
  opponent: PokemonData
}) {
  const playerTypes = parseTypes(player.type_names)
  const opponentTypes = parseTypes(opponent.type_names)

  // Player attacking opponent
  const playerOffense = playerTypes.flatMap((atkType) =>
    opponentTypes.map((defType) => ({
      attacker: atkType,
      defender: defType,
      multiplier: getEffectiveness(atkType, defType),
    }))
  )

  // Opponent attacking player
  const opponentOffense = opponentTypes.flatMap((atkType) =>
    playerTypes.map((defType) => ({
      attacker: atkType,
      defender: defType,
      multiplier: getEffectiveness(atkType, defType),
    }))
  )

  return (
    <div className={styles.typeComparison}>
      {}
      <div className={styles.typeSide}>
        <div className={styles.typeHeader}>
          <img
            src={getSpriteUrl(player.id)}
            alt={player.name}
            className={styles.typeHeaderSprite}
          />
          <span className={styles.typeHeaderText} style={{ color: COMPARISON_COLORS[0] }}>
            {player.name} →
          </span>
          <img
            src={getSpriteUrl(opponent.id)}
            alt={opponent.name}
            className={styles.typeHeaderSprite}
          />
        </div>
        <div className={styles.typePills}>
          {playerOffense.map(({ attacker, defender, multiplier }, idx) => {
            const { bg, text } = getEffectivenessColor(multiplier)
            return (
              <div
                key={`${attacker}-${defender}-${idx}`}
                className={styles.typePill}
                style={{ backgroundColor: bg, color: text }}
              >
                <Badge type={attacker} className={styles.typePillBadge} />
                <span className={styles.typePillArrow}>→</span>
                <Badge type={defender} className={styles.typePillBadge} />
                <span className={styles.typePillMultiplier}>{multiplierLabel(multiplier)}x</span>
              </div>
            )
          })}
        </div>
      </div>

      {}
      <div className={styles.typeSide}>
        <div className={styles.typeHeader}>
          <img
            src={getSpriteUrl(opponent.id)}
            alt={opponent.name}
            className={styles.typeHeaderSprite}
          />
          <span className={styles.typeHeaderText} style={{ color: COMPARISON_COLORS[1] }}>
            {opponent.name} →
          </span>
          <img
            src={getSpriteUrl(player.id)}
            alt={player.name}
            className={styles.typeHeaderSprite}
          />
        </div>
        <div className={styles.typePills}>
          {opponentOffense.map(({ attacker, defender, multiplier }, idx) => {
            const { bg, text } = getEffectivenessColor(multiplier)
            return (
              <div
                key={`opp-${attacker}-${defender}-${idx}`}
                className={styles.typePill}
                style={{ backgroundColor: bg, color: text }}
              >
                <Badge type={attacker} className={styles.typePillBadge} />
                <span className={styles.typePillArrow}>→</span>
                <Badge type={defender} className={styles.typePillBadge} />
                <span className={styles.typePillMultiplier}>{multiplierLabel(multiplier)}x</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatsComparison({ player, opponent }: { player: PokemonData; opponent: PokemonData }) {
  const stats = [
    { key: 'hp', label: 'HP', playerVal: player.hp, opponentVal: opponent.hp },
    { key: 'attack', label: 'ATK', playerVal: player.attack, opponentVal: opponent.attack },
    { key: 'defense', label: 'DEF', playerVal: player.defense, opponentVal: opponent.defense },
    {
      key: 'special_attack',
      label: 'SP.ATK',
      playerVal: player.special_attack,
      opponentVal: opponent.special_attack,
    },
    {
      key: 'special_defense',
      label: 'SP.DEF',
      playerVal: player.special_defense,
      opponentVal: opponent.special_defense,
    },
    { key: 'speed', label: 'SPD', playerVal: player.speed, opponentVal: opponent.speed },
  ]

  return (
    <div className={styles.statsComparison}>
      {stats.map(({ key, label, playerVal, opponentVal }) => {
        const playerPct = (playerVal / STAT_MAX) * 100
        const opponentPct = (opponentVal / STAT_MAX) * 100
        const playerWins = playerVal > opponentVal
        const opponentWins = opponentVal > playerVal

        return (
          <div key={key} className={styles.statRow}>
            {}
            <span
              className={`${styles.statValue} ${
                playerWins ? styles.statValueWin : styles.statValueLose
              }`}
            >
              {playerVal}
            </span>

            {}
            <div className={styles.statBarContainer}>
              <div className={styles.statBarBg}>
                <div
                  className={styles.statBarPlayer}
                  style={{
                    width: `${playerPct}%`,
                    background: playerWins
                      ? `linear-gradient(90deg, ${COMPARISON_COLORS[0]}80, ${COMPARISON_COLORS[0]})`
                      : `linear-gradient(90deg, ${COMPARISON_COLORS[0]}40, ${COMPARISON_COLORS[0]}60)`,
                  }}
                />
              </div>
            </div>

            {}
            <span className={styles.statLabel}>{label}</span>

            {}
            <div className={styles.statBarContainer}>
              <div className={styles.statBarBg}>
                <div
                  className={styles.statBarOpponent}
                  style={{
                    width: `${opponentPct}%`,
                    background: opponentWins
                      ? `linear-gradient(90deg, ${COMPARISON_COLORS[1]}, ${COMPARISON_COLORS[1]}80)`
                      : `linear-gradient(90deg, ${COMPARISON_COLORS[1]}60, ${COMPARISON_COLORS[1]}40)`,
                  }}
                />
              </div>
            </div>

            {}
            <span
              className={`${styles.statValue} ${
                opponentWins ? styles.statValueWin : styles.statValueLose
              }`}
            >
              {opponentVal}
            </span>
          </div>
        )
      })}

      {}
      <div className={styles.bstRow}>
        <span className={styles.bstValue} style={{ color: COMPARISON_COLORS[0] }}>
          BST {getTotalStats(player)}
        </span>
        <span className={styles.bstLabel}>TOTAL</span>
        <span className={styles.bstValue} style={{ color: COMPARISON_COLORS[1] }}>
          BST {getTotalStats(opponent)}
        </span>
      </div>
    </div>
  )
}

function CounterRecommendations({
  opponent,
  allPokemon,
  onSelect,
}: {
  opponent: PokemonData
  allPokemon: PokemonData[]
  onSelect: (p: PokemonData) => void
}) {
  const counters = useMemo(() => {
    return allPokemon
      .filter((p) => p.id !== opponent.id)
      .map((p) => ({
        pokemon: p,
        score: calculateCounterScore(p, opponent),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }, [opponent, allPokemon])

  return (
    <div className={styles.recommendations}>
      <h4 className={styles.recommendationsTitle}>Best Counters vs {opponent.name}</h4>
      <div className={styles.recommendationsList}>
        {counters.map(({ pokemon, score }) => {
          const types = parseTypes(pokemon.type_names)
          return (
            <button
              key={pokemon.id}
              onClick={() => onSelect(pokemon)}
              className={styles.recommendationCard}
            >
              <div className={styles.recommendationSpriteContainer}>
                <div
                  className={styles.recommendationGlow}
                  style={{
                    background: `radial-gradient(circle, ${typeColorMap[types[0]]}50 0%, transparent 70%)`,
                  }}
                />
                <img
                  src={getSpriteUrl(pokemon.id)}
                  alt={pokemon.name}
                  className={styles.recommendationSprite}
                  style={{
                    filter: isSpriteMissing(pokemon.id) ? 'brightness(0) opacity(0.5)' : 'none',
                  }}
                />
              </div>
              <span className={styles.recommendationName}>{pokemon.name}</span>
              <div className={styles.recommendationTypes}>
                {types.map((t) => (
                  <Badge key={t} type={t} />
                ))}
              </div>
              <div className={styles.recommendationScore}>
                <div className={styles.recommendationScoreBar}>
                  <div className={styles.recommendationScoreFill} style={{ width: `${score}%` }} />
                </div>
                <span className={styles.recommendationScoreValue}>{score}%</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function FightSimulator({ pokemon, loading }: FightSimulatorProps) {
  const [player, setPlayer] = useState<PokemonData | null>(null)
  const [opponent, setOpponent] = useState<PokemonData | null>(null)

  const handleSelectCounter = useCallback(
    (counterPokemon: PokemonData) => {
      setPlayer(counterPokemon)
    },
    [setPlayer]
  )

  if (loading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner size={48} />
        <span>Loading Pokemon data...</span>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <HowToGuide title="Fight Simulator Guide">
        Select two Pokemon to compare their battle potential. See type effectiveness, stats
        comparison, and get recommendations for the best counters. The battle score combines type
        matchups, stats, and speed advantages.
      </HowToGuide>

      {}
      <div className={styles.selectors}>
        <PokemonSelector
          pokemon={pokemon}
          selected={player}
          onSelect={setPlayer}
          label="Your Pokemon"
          excludeId={opponent?.id}
        />
        <PokemonSelector
          pokemon={pokemon}
          selected={opponent}
          onSelect={setOpponent}
          label="Opponent"
          excludeId={player?.id}
        />
      </div>

      {}
      <div className={styles.arenaWrapper}>
        <BattleArena player={player} opponent={opponent} />
      </div>

      {}
      {player && opponent && (
        <div className={styles.analysis}>
          <Card className={styles.analysisCard}>
            <h3 className={styles.analysisTitle}>Type Effectiveness</h3>
            <TypeEffectivenessComparison player={player} opponent={opponent} />
          </Card>

          <Card className={styles.analysisCard}>
            <h3 className={styles.analysisTitle}>Stats Comparison</h3>
            <StatsComparison player={player} opponent={opponent} />
          </Card>

          <Card className={styles.analysisCard}>
            <CounterRecommendations
              opponent={opponent}
              allPokemon={pokemon}
              onSelect={handleSelectCounter}
            />
          </Card>
        </div>
      )}
    </div>
  )
}
