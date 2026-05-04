import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const dynamic = 'force-static'

export const alt = 'pokeXgen · Pokedex for Next-gen'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  const pokeballData = await readFile(join(process.cwd(), 'public/pokeball.png'), 'base64')
  const pokeballSrc = `data:image/png;base64,${pokeballData}`

  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 48,
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginBottom: 16,
        }}
      >
        <img
          src={pokeballSrc}
          alt="pokeball"
          width={80}
          height={80}
          style={{ objectFit: 'contain' }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            pokeXgen
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#a0a0b0',
              fontWeight: 500,
            }}
          >
            Pokedex for Next-gen
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 8,
        }}
      >
        {['Pokedex', 'Team Builder', 'Type Matchups', 'Quiz'].map((tag) => (
          <div
            key={tag}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 18,
              color: '#c0c0d0',
              fontWeight: 500,
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
    }
  )
}
