import { type PokemonType } from '../design-tokens'

/**
 * Shared Pokemon data interface used across all pages and components.
 */
export interface PokemonRow {
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
  // Pre-computed fields for performance
  parsedTypes?: PokemonType[]
  primaryType?: PokemonType
  lowerName?: string
  lowerJpName?: string
}

export interface EvolutionTreeRow {
  chain_id: number
  stage: number
  evolves_from: string | null
  species_name?: string
  name?: string
  evolution_trigger?: string | null
  min_level?: number | null
  item_required?: string | null
}

export interface EvolutionPathRow {
  from_pokemon: string
  to_pokemon: string
  evolution_trigger: string | null
  chain_id: number
  min_level?: number | null
  item_required?: string | null
}

export interface PokemonMoveRow {
  pokemon_id: number
  move_name: string
  move_type: string
  power: number | null
  accuracy: number | null
  pp: number | null
  damage_class: string
}
