'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { getSpriteUrl } from '@/lib/sprites'
import { type PokemonType } from '@/lib/design-tokens'

interface PokemonCardProps {
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
  height?: number
  weight?: number
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    normal: '#A8A77A',
    fire: '#EE8130',
    water: '#6390F0',
    grass: '#7AC74C',
    electric: '#F7D02C',
    ice: '#96D9D6',
    fighting: '#C22E28',
    poison: '#A33EA1',
    ground: '#E2BF65',
    flying: '#A98FF3',
    psychic: '#F95587',
    bug: '#A6B91A',
    rock: '#B6A136',
    ghost: '#735797',
    dragon: '#6F35FC',
    dark: '#705746',
    steel: '#B7B7CE',
    fairy: '#D685AD',
  }
  return colors[type.toLowerCase()] || '#888888'
}

export function PokemonCard({ id, name, types, stats, height, weight }: PokemonCardProps) {
  const primaryType = types[0]?.toLowerCase() as PokemonType | undefined
  const accentColor = getTypeColor(types[0] || 'normal')

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 my-2 bg-white/80 dark:bg-transparent">
      <div className="flex items-start gap-3 p-3">
        {/* Sprite */}
        <div className="shrink-0 relative">
          <div
            className="w-20 h-20 rounded-lg flex items-center justify-center relative overflow-hidden"
            style={{ background: `${accentColor}20` }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(circle at center, ${accentColor}60 0%, transparent 70%)`,
              }}
            />
            <Image
              src={getSpriteUrl(id)}
              alt={name}
              width={72}
              height={72}
              className="relative z-10 object-contain drop-shadow-lg"
              unoptimized
            />
          </div>
          <a
            href={`https://pokedexgen.vercel.app/?id=${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center mt-1 text-[10px] font-semibold truncate max-w-[80px] hover:underline"
            style={{ color: accentColor }}
          >
            #{id} {name}
          </a>
        </div>

        {/* Stats + Types */}
        <div className="flex-1 min-w-0">
          {/* Type badges */}
          <div className="flex flex-wrap gap-1 mb-2">
            {types.map((t) => (
              <Badge key={t} type={t.toLowerCase() as PokemonType} />
            ))}
          </div>

          {/* Stat bars */}
          <div className="space-y-1">
            {[
              { label: 'HP', value: stats.hp, max: 255 },
              { label: 'ATK', value: stats.attack, max: 190 },
              { label: 'DEF', value: stats.defense, max: 230 },
              { label: 'SPD', value: stats.speed, max: 180 },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold w-6 text-right text-black/60 dark:text-white/60">
                  {s.label}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((s.value / s.max) * 100, 100)}%`,
                      backgroundColor: accentColor,
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono w-5 text-right text-black/70 dark:text-white/80">
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Total + physical */}
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/10 dark:border-white/10">
            <span className="text-[10px] text-black/60 dark:text-white/50">
              Total:{' '}
              <span className="font-bold text-black/80 dark:text-white/80">{stats.total}</span>
            </span>
            {(height || weight) && (
              <span className="text-[10px] text-black/50 dark:text-white/40">
                {height && `${(height / 10).toFixed(1)}m`}
                {height && weight && ' · '}
                {weight && `${(weight / 10).toFixed(1)}kg`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
