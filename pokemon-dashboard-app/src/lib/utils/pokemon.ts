import { type PokemonType, typeColorMap } from '../design-tokens'

/**
 * Parse a comma-separated type string into an array of validated PokemonType values.
 * Deduplicates and filters invalid types.
 */
export function parseTypes(raw: string): PokemonType[] {
  return [
    ...new Set(
      raw
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t): t is PokemonType => t in typeColorMap)
    ),
  ]
}

/**
 * Get the primary type of a Pokemon from its type_names or types string.
 */
export function primaryTypeOf(typeNames: string): PokemonType {
  return parseTypes(typeNames)[0] ?? 'normal'
}

/**
 * Format a kebab-case or lowercase Pokemon name into display format.
 * e.g., "mr-mime" → "Mr Mime", "pikachu" → "Pikachu"
 */
export function formatName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
