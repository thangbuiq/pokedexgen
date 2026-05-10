import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'public', 'data')

interface PokemonRecord {
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

interface EvolutionPath {
  from_pokemon: string
  to_pokemon: string
  evolution_trigger: string | null
  chain_id: number
}

const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
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

const ALL_TYPES = Object.keys(TYPE_EFFECTIVENESS)

let _pokemonCache: PokemonRecord[] | null = null
let _pokemonByName: Map<string, PokemonRecord> | null = null
let _pokemonByNormalizedName: Map<string, PokemonRecord> | null = null
let _evolutionPaths: EvolutionPath[] | null = null

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function loadPokemonData(): PokemonRecord[] {
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

function getPokemonByName(): Map<string, PokemonRecord> {
  if (!_pokemonByName) loadPokemonData()
  return _pokemonByName!
}

function loadEvolutionPaths(): EvolutionPath[] {
  if (_evolutionPaths) return _evolutionPaths
  const filePath = join(DATA_DIR, 'evolution_paths.json')
  if (!existsSync(filePath)) {
    _evolutionPaths = []
    return _evolutionPaths as EvolutionPath[]
  }
  _evolutionPaths = JSON.parse(readFileSync(filePath, 'utf-8')) as EvolutionPath[]
  return _evolutionPaths as EvolutionPath[]
}

function dedupeTypeNames(typeNames: string): string {
  const types = typeNames
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  const unique = [...new Set(types)]
  return unique.join(',')
}

function detectPokemonNames(query: string): string[] {
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

function getPokemonByNormalizedName(): Map<string, PokemonRecord> {
  if (!_pokemonByNormalizedName) loadPokemonData()
  return _pokemonByNormalizedName!
}

function detectTypesInQuery(query: string): string[] {
  const lower = query.toLowerCase()
  return ALL_TYPES.filter((type) => {
    const pattern = new RegExp(`\\b${type}\\b`, 'i')
    return pattern.test(lower)
  })
}

function formatPokemonContext(pokemon: PokemonRecord): string {
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

function getEvolutionContext(pokemonName: string): string | null {
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

function formatTypeEffectivenessMatrix(): string {
  const compact: string[] = []
  for (const atkType of ALL_TYPES) {
    const entries = Object.entries(TYPE_EFFECTIVENESS[atkType] || {})
      .filter(([, v]) => v !== 1)
      .map(([def, mult]) => `${atkType}>${def}=${mult}`)
    if (entries.length > 0) compact.push(...entries)
  }
  return compact.join(' ')
}

function buildRelevantContext(query: string): string {
  const nameMap = getPokemonByName()
  const detectedNames = detectPokemonNames(query)
  const detectedTypes = detectTypesInQuery(query)

  const relevantPokemon = new Map<string, PokemonRecord>()

  for (const name of detectedNames) {
    const pokemon = nameMap.get(name)
    if (pokemon) relevantPokemon.set(pokemon.name.toLowerCase(), pokemon)
  }

  if (detectedTypes.length > 0 && relevantPokemon.size < 5) {
    for (const pokemon of loadPokemonData()) {
      const types = dedupeTypeNames(pokemon.type_names).split(',')
      if (detectedTypes.some((t) => types.includes(t))) {
        relevantPokemon.set(pokemon.name.toLowerCase(), pokemon)
        if (relevantPokemon.size >= 8) break
      }
    }
  }

  if (relevantPokemon.size === 0 && detectedNames.length === 0 && detectedTypes.length === 0) {
    return `No specific Pokemon or types detected in the query. If the user mentioned a Pokemon name, it was not found in the database (check spelling, try both English and Japanese names). Politely tell the user the Pokemon was not found and suggest rechecking the name.`
  }

  const parts: string[] = []
  const MAX_POKEMON = 8

  const sorted = [...relevantPokemon.values()]
    .sort((a, b) => b.total_stats - a.total_stats)
    .slice(0, MAX_POKEMON)

  parts.push(`Relevant Pokemon (${sorted.length} of ${loadPokemonData().length} total):`)
  for (const pokemon of sorted) {
    parts.push(formatPokemonContext(pokemon))
    if (detectedNames.length > 0) {
      const evoContext = getEvolutionContext(pokemon.name)
      if (evoContext) parts.push(evoContext)
    }
  }

  if (detectedTypes.length > 0 || detectedNames.length > 0) {
    parts.push(formatTypeEffectivenessMatrix())
  }

  return parts.join('\n')
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

const SYSTEM_PROMPT_BASE = `You are an expert Pokemon data analyst and team-building strategist. You have access to detailed Pokemon stats, types, evolution chains, and full type-effectiveness data.

RESPONSE RULES:
1. Be CONCISE - 2-4 sentences for simple questions, up to 6 for complex analysis.
2. Always cite specific STATS (HP, ATK, DEF, SP.ATK, SP.DEF, SPD, total) from the database when analyzing Pokemon.
3. For type matchups, use the exact multiplier values (0x, 0.5x, 1x, 2x, 4x) from the type chart.
4. When recommending teams, prioritize type coverage and synergy explained in 1-2 lines per Pokemon.
5. If a Pokemon is NOT in the provided context, say so honestly and decline to fabricate data.
6. Format responses with **bold** for Pokemon names, stats, and key terms. Use bullet lists for comparisons.
7. NEVER hallucinate Pokemon names, stats, or type relationships not present in the context.
8. If asked about lore/trivia, keep it brief and note if it's general knowledge vs dataset-backed.
9. Use 1-2 emoji sparingly to add personality (e.g., 🔥 😈 🛡️).
10. For team suggestions, list 6 Pokemon with 1-line role explanations each.
11. Users may type non-English or misspelled Pokemon names. Use your knowledge to map them to the correct English names in the database (e.g., "Kamex" = Blastoise, "Glumanda" = Charmander, "Bisasam" = Bulbasaur).`

const MAX_CONTEXT_TOKENS = 1200
const MAX_COMPLETION_TOKENS = 800
const TOTAL_BUDGET = 3000

export function buildSystemPrompt(userQuery: string): string {
  const context = buildRelevantContext(userQuery)
  const fullPrompt = `${SYSTEM_PROMPT_BASE}\n\n--- DATABASE CONTEXT ---\n${context}`
  const promptTokens = estimateTokens(fullPrompt)

  if (promptTokens > MAX_CONTEXT_TOKENS) {
    const lines = context.split('\n')
    let truncated = ''
    for (const line of lines) {
      if (
        estimateTokens(`${SYSTEM_PROMPT_BASE}\n\n--- DATABASE CONTEXT ---\n${truncated}${line}`) >
        MAX_CONTEXT_TOKENS
      ) {
        break
      }
      truncated += line + '\n'
    }
    return `${SYSTEM_PROMPT_BASE}\n\n--- DATABASE CONTEXT (truncated for brevity) ---\n${truncated}`
  }

  return fullPrompt
}

export function buildMessages(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  const systemPrompt = buildSystemPrompt(userMessage)

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ]

  const relevantHistory = conversationHistory.slice(-10)

  let historyTokens = 0
  for (const msg of relevantHistory) {
    const tokens = estimateTokens(msg.content)
    if (historyTokens + tokens > 4000) break
    messages.push({ role: msg.role, content: msg.content })
    historyTokens += tokens
  }

  messages.push({ role: 'user', content: userMessage })

  const totalTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
  if (totalTokens > TOTAL_BUDGET) {
    const systemOnly = [messages[0]]
    systemOnly.push(messages[messages.length - 1])
    return systemOnly
  }

  return messages
}

export { MAX_COMPLETION_TOKENS, TOTAL_BUDGET, MAX_CONTEXT_TOKENS }
