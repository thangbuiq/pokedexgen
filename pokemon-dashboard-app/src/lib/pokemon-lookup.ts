import { useMemo } from 'react'

interface PokemonInfo {
  id: number
  name: string
  types: string[]
  stats: {
    hp: number
    attack: number
    defense: number
    special_attack: number
    special_defense: number
    speed: number
    total: number
  }
}

let _nameToId: Map<string, number> | null = null
let _idToInfo: Map<number, PokemonInfo> | null = null

function buildMaps(): { nameToId: Map<string, number>; idToInfo: Map<number, PokemonInfo> } {
  if (_nameToId && _idToInfo) {
    return { nameToId: _nameToId, idToInfo: _idToInfo }
  }

  _nameToId = new Map()
  _idToInfo = new Map()

  try {
    const raw = localStorage.getItem('pokemon-ai-cache')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.nameToId && parsed.idToInfo) {
        _nameToId = new Map(parsed.nameToId)
        _idToInfo = new Map(parsed.idToInfo)
        return { nameToId: _nameToId, idToInfo: _idToInfo }
      }
    }
  } catch {
    // ignore
  }

  return { nameToId: _nameToId, idToInfo: _idToInfo }
}

export async function loadPokemonLookup(): Promise<void> {
  if (_nameToId && _nameToId.size > 0) return

  try {
    const res = await fetch('/data/pokemon.json')
    if (!res.ok) return
    const data = await res.json()

    const nameToId = new Map<string, number>()
    const idToInfo = new Map<number, PokemonInfo>()

    for (const p of data) {
      const types = [
        ...new Set(
          (p.type_names || '')
            .split(',')
            .map((t: string) => t.trim().toLowerCase())
            .filter(Boolean)
        ),
      ] as string[]
      nameToId.set(p.name.toLowerCase(), p.id)
      idToInfo.set(p.id, {
        id: p.id,
        name: p.name,
        types,
        stats: {
          hp: p.hp,
          attack: p.attack,
          defense: p.defense,
          special_attack: p.special_attack,
          special_defense: p.special_defense,
          speed: p.speed,
          total: p.total_stats,
        },
      })
    }

    _nameToId = nameToId
    _idToInfo = idToInfo

    try {
      localStorage.setItem(
        'pokemon-ai-cache',
        JSON.stringify({
          nameToId: [...nameToId],
          idToInfo: [...idToInfo],
        })
      )
    } catch {
      // ignore storage errors
    }
  } catch {
    // ignore
  }
}

export function getPokemonId(name: string): number | undefined {
  buildMaps()
  return _nameToId?.get(name.toLowerCase())
}

export function getPokemonInfo(id: number): PokemonInfo | undefined {
  buildMaps()
  return _idToInfo?.get(id)
}

export function findPokemonNamesInText(text: string): Array<{ name: string; id: number }> {
  buildMaps()
  if (!_nameToId) return []

  const found = new Map<string, number>()
  const lowerText = text.toLowerCase()

  for (const [lowerName, id] of _nameToId) {
    if (lowerName.length < 3) continue
    const regex = new RegExp(`\\b${lowerName.replace(/[-]/g, '[- ]')}\\b`, 'gi')
    if (regex.test(text)) {
      found.set(lowerName, id)
    }
  }

  return [...found.entries()].map(([name, id]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    id,
  }))
}

export function usePokemonLookup() {
  return useMemo(() => buildMaps(), [])
}
