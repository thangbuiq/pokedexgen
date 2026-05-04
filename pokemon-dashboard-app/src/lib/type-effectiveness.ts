import { type PokemonType } from './design-tokens'

export const ALL_TYPES: PokemonType[] = [
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

export const TYPE_EFFECTIVENESS: Partial<
  Record<PokemonType, Partial<Record<PokemonType, number>>>
> = {
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

export function getEffectiveness(attacker: PokemonType, defender: PokemonType): number {
  return TYPE_EFFECTIVENESS[attacker]?.[defender] ?? 1
}

export function getTypeEffectivenessAgainstPokemon(
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

export function getDefensiveEffectiveness(
  defendingTypes: PokemonType[],
  attackingType: PokemonType
): number {
  return defendingTypes.reduce((mult, type) => mult * getEffectiveness(attackingType, type), 1)
}

export function getAllDefensiveEffectiveness(
  defendingTypes: PokemonType[]
): Record<PokemonType, number> {
  const result = {} as Record<PokemonType, number>
  for (const attackingType of ALL_TYPES) {
    result[attackingType] = getDefensiveEffectiveness(defendingTypes, attackingType)
  }
  return result
}

export function multiplierLabel(multiplier: number): string {
  if (multiplier === 0) return '0'
  if (multiplier === 0.25) return '1/4'
  if (multiplier === 0.5) return '1/2'
  if (multiplier === 1) return '1'
  if (multiplier === 2) return '2'
  if (multiplier === 4) return '4'
  return `${multiplier}`
}

export function getEffectivenessColor(multiplier: number): { bg: string; text: string } {
  if (multiplier === 0) return { bg: '#201122', text: '#FFFFFF' }
  if (multiplier <= 0.25) return { bg: '#5a1a1a', text: '#FFFFFF' }
  if (multiplier <= 0.5) return { bg: '#8B1A1A', text: '#FFFFFF' }
  if (multiplier === 1) return { bg: 'var(--surface)', text: '#7f7f7f' }
  if (multiplier >= 4) return { bg: '#2d6a1e', text: '#FFFFFF' }
  return { bg: '#166534', text: '#FFFFFF' }
}

export function getEffectivenessDescription(multiplier: number): string {
  if (multiplier === 0) return 'Immune'
  if (multiplier <= 0.25) return 'Very Resistant'
  if (multiplier <= 0.5) return 'Resistant'
  if (multiplier === 1) return 'Neutral'
  if (multiplier >= 4) return 'Super Weak'
  return 'Weak'
}
