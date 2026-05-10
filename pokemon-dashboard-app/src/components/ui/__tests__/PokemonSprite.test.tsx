import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PokemonSprite } from '../PokemonSprite'
import { getSpriteUrl } from '@/lib/sprites'

describe('PokemonSprite', () => {
  it('renders image with correct src', () => {
    render(<PokemonSprite pokemonId={25} />)

    const image = screen.getByRole('img')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', expect.stringContaining('25.png'))
  })

  it('renders image with string pokemonId', () => {
    render(<PokemonSprite pokemonId="151" />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', expect.stringContaining('151.png'))
  })

  it('renders with custom alt text', () => {
    render(<PokemonSprite pokemonId={6} alt="Charizard" />)

    const image = screen.getByAltText('Charizard')
    expect(image).toBeInTheDocument()
  })

  it('renders with default alt text', () => {
    render(<PokemonSprite pokemonId={1} />)

    const image = screen.getByAltText('Pokemon sprite')
    expect(image).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    render(<PokemonSprite pokemonId={1} size={128} />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('width', '128')
    expect(image).toHaveAttribute('height', '128')
  })

  it('renders with default size', () => {
    render(<PokemonSprite pokemonId={1} />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('width', '96')
    expect(image).toHaveAttribute('height', '96')
  })

  it('applies custom className', () => {
    render(<PokemonSprite pokemonId={1} className="sprite-class" />)

    const image = screen.getByRole('img')
    expect(image).toHaveClass('sprite-class')
  })

  it('uses getSpriteUrl utility to generate src', () => {
    const expectedUrl = getSpriteUrl(150)
    render(<PokemonSprite pokemonId={150} />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', expect.stringContaining(expectedUrl))
  })

  it('handles zero-padded pokemon IDs', () => {
    render(<PokemonSprite pokemonId={7} />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', expect.stringContaining('/7.png'))
  })

  it('handles large pokemon IDs', () => {
    render(<PokemonSprite pokemonId={1008} />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', expect.stringContaining('1008.png'))
  })
})
