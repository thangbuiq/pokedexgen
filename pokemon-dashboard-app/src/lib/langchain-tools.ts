import { tool } from '@langchain/core/tools'
import { loadPokemonData, getPokemonByName, loadEvolutionPaths, dedupeTypeNames } from './prompts'
import { ALL_TYPES, getEffectiveness, getDefensiveEffectiveness } from './type-effectiveness'
import type { PokemonType } from './design-tokens'

const searchPokemonSchema = {
  type: 'object' as const,
  properties: {
    query: {
      type: 'string' as const,
      description: 'The search query for Pokemon names, e.g. "pika" or "char"',
    },
  },
  required: ['query'],
  additionalProperties: false,
}

export const searchPokemonTool = tool(
  async ({ query }: { query: string }) => {
    const allPokemon = loadPokemonData()
    const lowerQuery = query.toLowerCase()
    const results = allPokemon
      .filter((p) => p.name.toLowerCase().includes(lowerQuery))
      .slice(0, 10)
      .map((p) => ({ name: p.name, id: p.id }))
    return JSON.stringify(results)
  },
  {
    name: 'search_pokemon',
    description:
      'Search for Pokemon by name using partial match. Returns a list of Pokemon names and IDs that match the query.',
    schema: searchPokemonSchema,
  }
)

const getPokemonDetailsSchema = {
  type: 'object' as const,
  properties: {
    name: {
      type: 'string' as const,
      description: 'The exact English name of the Pokemon, e.g. "Pikachu"',
    },
  },
  required: ['name'],
  additionalProperties: false,
}

export const getPokemonDetailsTool = tool(
  async ({ name }: { name: string }) => {
    const map = getPokemonByName()
    const pokemon = map.get(name.toLowerCase())

    if (!pokemon) {
      return JSON.stringify({ error: `Pokemon "${name}" not found` })
    }

    const types = dedupeTypeNames(pokemon.type_names).split(',').filter(Boolean)

    return JSON.stringify({
      name: pokemon.name,
      id: pokemon.id,
      types,
      stats: {
        hp: pokemon.hp,
        attack: pokemon.attack,
        defense: pokemon.defense,
        special_attack: pokemon.special_attack,
        special_defense: pokemon.special_defense,
        speed: pokemon.speed,
        total: pokemon.total_stats,
      },
      height: pokemon.height,
      weight: pokemon.weight,
      sprite_url: pokemon.sprite_url,
      japanese_name: pokemon.japanese_name,
    })
  },
  {
    name: 'get_pokemon_details',
    description:
      'Get detailed information about a specific Pokemon including base stats, types, height, weight, and sprite.',
    schema: getPokemonDetailsSchema,
  }
)

const getTypeEffectivenessSchema = {
  type: 'object' as const,
  properties: {
    attacking_type: {
      type: 'string' as const,
      description:
        'The attacking type, e.g. "fire". Omit to get defensive effectiveness against all types.',
    },
    defending_types: {
      type: 'array' as const,
      description: 'The defending Pokemon types, e.g. ["water", "flying"]',
      items: { type: 'string' as const },
    },
  },
  required: ['defending_types'],
  additionalProperties: false,
}

export const getTypeEffectivenessTool = tool(
  async ({
    attacking_type,
    defending_types,
  }: {
    attacking_type?: string
    defending_types: string[]
  }) => {
    if (attacking_type) {
      const atk = attacking_type.toLowerCase() as PokemonType
      const multipliers: Record<string, number> = {}
      for (const defType of ALL_TYPES) {
        multipliers[defType] = getEffectiveness(atk, defType)
      }
      return JSON.stringify({ attacking_type: atk, multipliers })
    }

    const defTypes = defending_types.map((t) => t.toLowerCase()) as PokemonType[]
    const effectiveness: Record<string, number> = {}
    for (const atkType of ALL_TYPES) {
      effectiveness[atkType] = getDefensiveEffectiveness(defTypes, atkType)
    }
    return JSON.stringify({ defending_types: defTypes, effectiveness })
  },
  {
    name: 'get_type_effectiveness',
    description:
      'Calculate type effectiveness damage multipliers. Given an attacking type and defending types, returns the combined multiplier.',
    schema: getTypeEffectivenessSchema,
  }
)

const getEvolutionChainSchema = {
  type: 'object' as const,
  properties: {
    pokemon_name: {
      type: 'string' as const,
      description: 'The name of the Pokemon to look up evolution for, e.g. "Charmander"',
    },
  },
  required: ['pokemon_name'],
  additionalProperties: false,
}

export const getEvolutionChainTool = tool(
  async ({ pokemon_name }: { pokemon_name: string }) => {
    const paths = loadEvolutionPaths()
    const lowerName = pokemon_name.toLowerCase()

    const matches = paths.filter(
      (p) => p.from_pokemon.toLowerCase() === lowerName || p.to_pokemon.toLowerCase() === lowerName
    )

    if (matches.length === 0) {
      return JSON.stringify({
        error: `No evolution chain found for "${pokemon_name}"`,
      })
    }

    const chainIds = new Set(matches.map((p) => p.chain_id))
    const chainEdges = paths.filter((p) => chainIds.has(p.chain_id))

    const fromSet = new Set(chainEdges.map((p) => p.from_pokemon.toLowerCase()))
    const toSet = new Set(chainEdges.map((p) => p.to_pokemon.toLowerCase()))
    const allNodes = new Set([...fromSet, ...toSet])
    const baseNodes = [...allNodes].filter((n) => !toSet.has(n))

    const adj = new Map<string, typeof chainEdges>()
    for (const ev of chainEdges) {
      const from = ev.from_pokemon.toLowerCase()
      const existing = adj.get(from)
      if (existing) {
        existing.push(ev)
      } else {
        adj.set(from, [ev])
      }
    }

    const ordered: Array<{
      from: string
      to: string
      trigger: string | null
    }> = []
    const visited = new Set<string>()

    function traverse(node: string) {
      const edges = adj.get(node) || []
      for (const edge of edges) {
        const key = `${edge.from_pokemon}->${edge.to_pokemon}`
        if (visited.has(key)) continue
        visited.add(key)
        ordered.push({
          from: edge.from_pokemon,
          to: edge.to_pokemon,
          trigger: edge.evolution_trigger,
        })
        traverse(edge.to_pokemon.toLowerCase())
      }
    }

    for (const base of baseNodes) {
      traverse(base)
    }

    return JSON.stringify(ordered)
  },
  {
    name: 'get_evolution_chain',
    description:
      'Get the evolution chain for a Pokemon. Returns evolution stages from base to final with triggers.',
    schema: getEvolutionChainSchema,
  }
)

const comparePokemonSchema = {
  type: 'object' as const,
  properties: {
    pokemon_names: {
      type: 'array' as const,
      description: 'List of Pokemon names to compare, e.g. ["Bulbasaur", "Charmander", "Squirtle"]',
      items: { type: 'string' as const },
    },
  },
  required: ['pokemon_names'],
  additionalProperties: false,
}

export const comparePokemonTool = tool(
  async ({ pokemon_names }: { pokemon_names: string[] }) => {
    const results: Array<Record<string, unknown>> = []
    const map = getPokemonByName()

    for (const name of pokemon_names) {
      const pokemon = map.get(name.toLowerCase())
      if (!pokemon) {
        results.push({
          name: String(name),
          error: `Pokemon "${name}" not found`,
        })
        continue
      }

      const types = dedupeTypeNames(pokemon.type_names).split(',').filter(Boolean)

      results.push({
        name: pokemon.name,
        id: pokemon.id,
        types,
        stats: {
          hp: pokemon.hp,
          attack: pokemon.attack,
          defense: pokemon.defense,
          special_attack: pokemon.special_attack,
          special_defense: pokemon.special_defense,
          speed: pokemon.speed,
          total: pokemon.total_stats,
        },
        height: pokemon.height,
        weight: pokemon.weight,
        sprite_url: pokemon.sprite_url,
        japanese_name: pokemon.japanese_name,
      })
    }

    return JSON.stringify(results)
  },
  {
    name: 'compare_pokemon',
    description:
      'Compare multiple Pokemon side by side. Returns stats and types for each Pokemon for easy comparison.',
    schema: comparePokemonSchema,
  }
)

export const pokemonTools = [
  searchPokemonTool,
  getPokemonDetailsTool,
  getTypeEffectivenessTool,
  getEvolutionChainTool,
  comparePokemonTool,
]

export const toolsByName = new Map(pokemonTools.map((t) => [t.name, t]))
