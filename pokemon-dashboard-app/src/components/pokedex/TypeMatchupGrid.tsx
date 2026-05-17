'use client'

import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import { ALL_TYPES, getEffectiveness } from '@/lib/type-effectiveness'
import { Badge } from '@/components/ui/Badge'

interface TypeMatchupGridProps {
  /** The defending Pokemon's types */
  defenderTypes: PokemonType[]
  /** Title displayed above the grid */
  title: string
  /** Description text */
  description?: string
}

/**
 * Compact type effectiveness grid showing how each type affects a defender.
 * Displays as two rows of 9 types with color-coded multiplier cells.
 */
export function TypeDefenseGrid({ defenderTypes, title, description }: TypeMatchupGridProps) {
  const typeDefenses: Record<PokemonType, number> = {} as Record<PokemonType, number>
  ALL_TYPES.forEach((attackingType) => {
    typeDefenses[attackingType] = defenderTypes.reduce(
      (m, defType) => m * getEffectiveness(attackingType, defType),
      1
    )
  })

  return (
    <div>
      <h3 className="text-[var(--text-primary)] text-[10px] font-[family-name:var(--font-pixel)] uppercase tracking-wider mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-[9px] text-[var(--text-secondary)] font-[family-name:var(--font-pixel)] tracking-wide mb-2">
          {description}
        </p>
      )}

      <div className="space-y-1 overflow-x-auto">
        {[ALL_TYPES.slice(0, 9), ALL_TYPES.slice(9)].map((rowTypes, rowIdx) => (
          <div
            key={rowIdx}
            className="grid grid-cols-9 gap-px rounded-lg overflow-hidden border border-[var(--card-border)]"
          >
            {rowTypes.map((type) => (
              <div
                key={type}
                className="flex items-center justify-center h-7 text-[8px] font-[family-name:var(--font-pixel)] font-bold text-white uppercase tracking-wider"
                style={{ backgroundColor: typeColorMap[type] }}
              >
                {type.slice(0, 3)}
              </div>
            ))}
            {rowTypes.map((type) => {
              const mult = typeDefenses[type] ?? 1
              return <MultiplierCell key={`${type}-val`} multiplier={mult} />
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

interface TypeOffenseGridProps {
  /** The attacking Pokemon's types */
  attackerTypes: PokemonType[]
  /** Pokemon name for display */
  pokemonName: string
}

/**
 * Shows offensive effectiveness for each of the attacker's types against all defending types.
 */
export function TypeOffenseGrid({ attackerTypes, pokemonName }: TypeOffenseGridProps) {
  return (
    <div>
      <h3 className="text-[var(--text-primary)] text-[10px] font-[family-name:var(--font-pixel)] uppercase tracking-wider mb-1">
        Type offenses
      </h3>
      <p className="text-[9px] text-[var(--text-secondary)] font-[family-name:var(--font-pixel)] tracking-wide mb-2">
        Effectiveness of <span className="italic">{pokemonName}</span>&apos;s types against each
        defending type.
      </p>

      {attackerTypes.map((atkType) => (
        <div key={atkType} className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge type={atkType} />
          </div>
          <div className="space-y-1 overflow-x-auto">
            {[ALL_TYPES.slice(0, 9), ALL_TYPES.slice(9)].map((rowTypes, rowIdx) => (
              <div
                key={rowIdx}
                className="grid grid-cols-9 gap-px rounded-lg overflow-hidden border border-[var(--card-border)]"
              >
                {rowTypes.map((type) => (
                  <div
                    key={type}
                    className="flex items-center justify-center h-7 text-[8px] font-[family-name:var(--font-pixel)] font-bold text-white uppercase tracking-wider"
                    style={{ backgroundColor: typeColorMap[type] }}
                  >
                    {type.slice(0, 3)}
                  </div>
                ))}
                {rowTypes.map((type) => {
                  const mult = getEffectiveness(atkType, type)
                  return <MultiplierCell key={`off-${atkType}-${type}-val`} multiplier={mult} />
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MultiplierCell({ multiplier }: { multiplier: number }) {
  const isSuperEffective = multiplier > 1
  const isNotVeryEffective = multiplier < 1 && multiplier > 0
  const isImmune = multiplier === 0
  const isNeutral = multiplier === 1

  let cellBg = 'bg-[var(--surface-primary)]'
  let cellText = 'text-[var(--text-muted)]'
  let label = ''

  if (isImmune) {
    cellBg = 'bg-[#1a1a2e]'
    cellText = 'text-[var(--text-muted)]'
    label = '0'
  } else if (isSuperEffective) {
    cellBg = multiplier >= 4 ? 'bg-[#2d6a1e]' : 'bg-[#4a8c3f]'
    cellText = 'text-white'
    label = multiplier >= 4 ? '4' : '2'
  } else if (isNotVeryEffective) {
    cellBg = multiplier <= 0.25 ? 'bg-[#8b2500]' : 'bg-[#a0522d]'
    cellText = 'text-white'
    label = multiplier <= 0.25 ? '¼' : '½'
  }

  return (
    <div
      className={`flex items-center justify-center h-7 ${cellBg} ${cellText} text-[10px] font-[family-name:var(--font-pixel)] font-bold`}
    >
      {isNeutral ? '' : label}
    </div>
  )
}
