'use client'

import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import { ALL_TYPES, getEffectiveness } from '@/lib/type-effectiveness'

interface TypeMatchupPillsProps {
  defenderTypes: PokemonType[]
  pokemonName: string
}

/**
 * Shows type weaknesses/resistances/immunities as colored pill groups,
 * split into YOUR DEFENSE (what hits you) and YOUR ATTACK (what you hit).
 */
export function TypeMatchupPills({ defenderTypes, pokemonName }: TypeMatchupPillsProps) {
  // === DEFENSE: how each attacking type hits THIS pokemon ===
  const defense = {
    quadWeakness: [] as PokemonType[],
    weakness: [] as PokemonType[],
    resistance: [] as PokemonType[],
    quadResistance: [] as PokemonType[],
    immune: [] as PokemonType[],
  }

  for (const atkType of ALL_TYPES) {
    const mult = defenderTypes.reduce((m, defType) => m * getEffectiveness(atkType, defType), 1)
    if (mult === 0) defense.immune.push(atkType)
    else if (mult <= 0.25) defense.quadResistance.push(atkType)
    else if (mult < 1) defense.resistance.push(atkType)
    else if (mult >= 4) defense.quadWeakness.push(atkType)
    else if (mult > 1) defense.weakness.push(atkType)
  }

  // === OFFENSE: how THIS pokemon's types hit each defending type ===
  const offense = {
    superEffective: [] as PokemonType[],
    notEffective: [] as PokemonType[],
    noEffect: [] as PokemonType[],
  }

  for (const defType of ALL_TYPES) {
    let bestMult = 0
    for (const atkType of defenderTypes) {
      bestMult = Math.max(bestMult, getEffectiveness(atkType, defType))
    }
    if (bestMult === 0) offense.noEffect.push(defType)
    else if (bestMult >= 2) offense.superEffective.push(defType)
    else if (bestMult < 1) offense.notEffective.push(defType)
  }

  return (
    <div className="space-y-4">
      {/* YOUR DEFENSE */}
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Your Defense
        </h4>
        <div className="space-y-1.5">
          {defense.quadWeakness.length > 0 && (
            <MatchupRow label="4× Weak" types={defense.quadWeakness} variant="danger-strong" />
          )}
          {defense.weakness.length > 0 && (
            <MatchupRow label="2× Weak" types={defense.weakness} variant="danger" />
          )}
          {defense.resistance.length > 0 && (
            <MatchupRow label="1/2 Resist" types={defense.resistance} variant="success" />
          )}
          {defense.quadResistance.length > 0 && (
            <MatchupRow
              label="1/4 Resist"
              types={defense.quadResistance}
              variant="success-strong"
            />
          )}
          {defense.immune.length > 0 && (
            <MatchupRow label="Immune" types={defense.immune} variant="immune" />
          )}
          {defense.quadWeakness.length === 0 &&
            defense.weakness.length === 0 &&
            defense.resistance.length === 0 &&
            defense.quadResistance.length === 0 &&
            defense.immune.length === 0 && (
              <p className="text-[var(--text-muted)] text-[10px]">No special defensive matchups</p>
            )}
        </div>
      </div>

      {/* YOUR ATTACK */}
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Your Attack
        </h4>
        <div className="space-y-1.5">
          {offense.superEffective.length > 0 && (
            <MatchupRow label="2× Strong" types={offense.superEffective} variant="success" />
          )}
          {offense.notEffective.length > 0 && (
            <MatchupRow label="1/2 Weak" types={offense.notEffective} variant="danger" />
          )}
          {offense.noEffect.length > 0 && (
            <MatchupRow label="No Effect" types={offense.noEffect} variant="immune" />
          )}
          {offense.superEffective.length === 0 &&
            offense.notEffective.length === 0 &&
            offense.noEffect.length === 0 && (
              <p className="text-[var(--text-muted)] text-[10px]">Neutral offensive coverage</p>
            )}
        </div>
      </div>
    </div>
  )
}

type MatchupVariant = 'danger-strong' | 'danger' | 'success' | 'success-strong' | 'immune'

const VARIANT_STYLES: Record<MatchupVariant, { labelColor: string; bg: string; border: string }> = {
  'danger-strong': { labelColor: '#dc2626', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  danger: { labelColor: '#ef4444', bg: 'bg-red-500/5', border: 'border-red-500/20' },
  success: { labelColor: '#22c55e', bg: 'bg-green-500/5', border: 'border-green-500/20' },
  'success-strong': { labelColor: '#16a34a', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  immune: { labelColor: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
}

function MatchupRow({
  label,
  types,
  variant,
}: {
  label: string
  types: PokemonType[]
  variant: MatchupVariant
}) {
  const s = VARIANT_STYLES[variant]
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${s.bg} border ${s.border}`}>
      <span
        className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[8px] font-[family-name:var(--font-pixel)] font-bold tracking-wider shrink-0 text-white min-w-[52px] text-center"
        style={{ backgroundColor: s.labelColor, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {types.map((type) => (
          <span
            key={type}
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-[family-name:var(--font-pixel)] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: typeColorMap[type], textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {type}
          </span>
        ))}
      </div>
    </div>
  )
}
