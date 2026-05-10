import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('status', { name: /loading/i })
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })

  it('renders with custom size', () => {
    render(<LoadingSpinner size={64} />)

    const svg = document.querySelector('svg')
    expect(svg).toHaveAttribute('width', '64')
    expect(svg).toHaveAttribute('height', '64')
  })

  it('renders different sizes correctly', () => {
    const { rerender } = render(<LoadingSpinner size={32} />)
    let svg = document.querySelector('svg')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')

    rerender(<LoadingSpinner size={128} />)
    svg = document.querySelector('svg')
    expect(svg).toHaveAttribute('width', '128')
    expect(svg).toHaveAttribute('height', '128')
  })

  it('has accessible loading text', () => {
    render(<LoadingSpinner />)

    const srOnlyText = screen.getByText('Loading...')
    expect(srOnlyText).toHaveClass('sr-only')
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />)

    const spinner = screen.getByRole('status', { name: /loading/i })
    expect(spinner).toHaveClass('custom-spinner')
  })

  it('renders pokeball design SVG', () => {
    const { container } = render(<LoadingSpinner />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('animate-[spin-pokeball_1s_linear_infinite]')

    const circles = svg!.querySelectorAll('circle')
    expect(circles.length).toBeGreaterThanOrEqual(3)

    const rect = svg!.querySelector('rect')
    expect(rect).toBeInTheDocument()
  })

  it('renders centered in container', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('status', { name: /loading/i })
    expect(spinner).toHaveClass('flex', 'items-center', 'justify-center')
  })
})
