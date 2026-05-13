'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

interface StatPoint {
  stat: string
  value: number
  fullMark: number
}

interface StatRadarProps {
  hp: number
  attack: number
  defense: number
  special_attack: number
  special_defense: number
  speed: number
  size?: number
  color?: string
}

export function StatRadar({
  hp,
  attack,
  defense,
  special_attack,
  special_defense,
  speed,
  size = 140,
  color = '#ef4444',
}: StatRadarProps) {
  const data: StatPoint[] = [
    { stat: 'HP', value: hp, fullMark: 255 },
    { stat: 'ATK', value: attack, fullMark: 190 },
    { stat: 'DEF', value: defense, fullMark: 230 },
    { stat: 'SPD', value: speed, fullMark: 180 },
    { stat: 'SP.D', value: special_defense, fullMark: 230 },
    { stat: 'SP.A', value: special_attack, fullMark: 194 },
  ]

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="65%">
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="stat"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 600 }}
          />
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 255]} />
          <Radar
            name="Stats"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
