import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { ALL_TYPES } from './type-effectiveness'

const DATA_DIR = join(process.cwd(), 'public', 'data')

export interface PokemonRecord {
  id: number
  name: string
  japanese_name: string | null
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
}

export interface EvolutionPath {
  from_pokemon: string
  to_pokemon: string
  evolution_trigger: string | null
  chain_id: number
}

let _pokemonCache: PokemonRecord[] | null = null
let _pokemonByName: Map<string, PokemonRecord> | null = null
let _pokemonByNormalizedName: Map<string, PokemonRecord> | null = null
let _evolutionPaths: EvolutionPath[] | null = null

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function loadPokemonData(): PokemonRecord[] {
  if (_pokemonCache) return _pokemonCache
  const filePath = join(DATA_DIR, 'pokemon.json')
  if (!existsSync(filePath)) {
    _pokemonCache = []
    return _pokemonCache
  }
  const raw = readFileSync(filePath, 'utf-8')
  const allRecords: PokemonRecord[] = JSON.parse(raw)
  const seen = new Set<number>()
  _pokemonCache = allRecords.filter((p) => {
    if (seen.has(p.id)) return false
    if (!p.sprite_url) return false
    seen.add(p.id)
    return true
  })
  _pokemonByName = new Map()
  _pokemonByNormalizedName = new Map()
  for (const p of _pokemonCache) {
    const enName = p.name.toLowerCase()
    if (!_pokemonByName.has(enName)) {
      _pokemonByName.set(enName, p)
    }
    const normEn = normalizeName(p.name)
    if (!_pokemonByNormalizedName.has(normEn)) {
      _pokemonByNormalizedName.set(normEn, p)
    }
    if (p.japanese_name) {
      const normJp = normalizeName(p.japanese_name)
      if (!_pokemonByNormalizedName.has(normJp)) {
        _pokemonByNormalizedName.set(normJp, p)
      }
    }
  }
  return _pokemonCache
}

export function getPokemonByName(): Map<string, PokemonRecord> {
  if (!_pokemonByName) loadPokemonData()
  return _pokemonByName!
}

export function loadEvolutionPaths(): EvolutionPath[] {
  if (_evolutionPaths) return _evolutionPaths
  const filePath = join(DATA_DIR, 'evolution_paths.json')
  if (!existsSync(filePath)) {
    _evolutionPaths = []
    return _evolutionPaths as EvolutionPath[]
  }
  _evolutionPaths = JSON.parse(readFileSync(filePath, 'utf-8')) as EvolutionPath[]
  return _evolutionPaths as EvolutionPath[]
}

export function dedupeTypeNames(typeNames: string): string {
  const types = typeNames
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  const unique = [...new Set(types)]
  return unique.join(',')
}

export function detectPokemonNames(query: string): string[] {
  const normalizedQuery = normalizeName(query)
  const found = new Set<string>()
  const normMap = getPokemonByNormalizedName()

  for (const [normName, pokemon] of normMap) {
    if (normName.length < 3) continue
    if (normalizedQuery.includes(normName)) {
      found.add(pokemon.name.toLowerCase())
    }
  }

  const sorted = [...found].sort((a, b) => b.length - a.length)
  const filtered: string[] = []
  for (const name of sorted) {
    const isSubstring = filtered.some((kept) => kept.includes(name))
    if (!isSubstring) filtered.push(name)
  }

  return filtered
}

export function getPokemonByNormalizedName(): Map<string, PokemonRecord> {
  if (!_pokemonByNormalizedName) loadPokemonData()
  return _pokemonByNormalizedName!
}

export function detectTypesInQuery(query: string): string[] {
  const lower = query.toLowerCase()
  return ALL_TYPES.filter((type) => {
    const pattern = new RegExp(`\\b${type}\\b`, 'i')
    return pattern.test(lower)
  })
}

export function formatPokemonContext(pokemon: PokemonRecord): string {
  const types = dedupeTypeNames(pokemon.type_names)
  return [
    `- ${pokemon.name} (#${pokemon.id})`,
    `  Types: ${types}`,
    `  Stats: HP ${pokemon.hp}, ATK ${pokemon.attack}, DEF ${pokemon.defense}, SP.ATK ${pokemon.special_attack}, SP.DEF ${pokemon.special_defense}, SPD ${pokemon.speed}`,
    `  Total: ${pokemon.total_stats}`,
    `  Height: ${(pokemon.height / 10).toFixed(1)}m, Weight: ${(pokemon.weight / 10).toFixed(1)}kg`,
    pokemon.japanese_name ? `  Japanese: ${pokemon.japanese_name}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

export function getEvolutionContext(pokemonName: string): string | null {
  const paths = loadEvolutionPaths()
  const evolutions = paths.filter(
    (p) =>
      p.from_pokemon.toLowerCase() === pokemonName.toLowerCase() ||
      p.to_pokemon.toLowerCase() === pokemonName.toLowerCase()
  )
  if (evolutions.length === 0) return null

  const lines: string[] = []
  const seen = new Set<string>()
  for (const ev of evolutions) {
    const key = `${ev.from_pokemon}->${ev.to_pokemon}`
    if (seen.has(key)) continue
    seen.add(key)
    const trigger = ev.evolution_trigger ? ` (${ev.evolution_trigger})` : ''
    lines.push(`  ${ev.from_pokemon} -> ${ev.to_pokemon}${trigger}`)
  }

  return ['Evolution:', ...lines].join('\n')
}
