'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { type PokemonType } from '@/lib/design-tokens'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  pokemonType: PokemonType
  description: string
}

const navItems: NavItem[] = [
  {
    label: 'Pokédex',
    href: '/',
    pokemonType: 'fire',
    description: 'Next-gen Pokémon index',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    label: 'Matchups',
    href: '/matchups',
    pokemonType: 'dragon',
    description: 'Team builder, stats & type matrix',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.354-1.853M17 20H7m10 0v-2c0-.656-.126-1.283-.354-1.853M7 20H2v-2a3 3 0 015.354-1.853M7 20v-2c0-.656.126-1.283.354-1.853m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    label: "Who's That Pokémon?",
    href: '/quiz',
    pokemonType: 'ghost',
    description: "Who's That Pokemon?",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.271 2.28-2.534 2.782-.715.271-1.466.529-1.466 1.178M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    label: 'Origins',
    href: '/origins',
    pokemonType: 'psychic',
    description: 'The story of Pokémon',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>
    ),
  },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl">
      <div className="container-centered">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <Image
              src="/pokeball.png"
              alt="pokedeXgen"
              width={40}
              height={40}
              className="w-9 h-9 sm:w-11 sm:h-11 group-hover:rotate-16 transition-transform duration-300"
            />
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 leading-none">
              <span className="font-[family-name:var(--font-pixel)] text-[10px] sm:text-xs tracking-wider text-[var(--text-primary)]">
                pokedeXgen
              </span>
              <span className="hidden sm:inline text-[9px] sm:text-[10px] tracking-wide text-[var(--text-muted)]">
                Pokédex Next Gen
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wide transition-all duration-200 relative',
                    isActive
                      ? 'text-[var(--text-primary)] bg-[var(--surface-light)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]',
                  ].join(' ')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-1 rounded-full"
                      style={{ backgroundColor: `var(--type-${item.pokemonType})` }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-xl animate-[slide-in_0.2s_ease-out]">
          <div className="container-centered py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    'flex items-center gap-4 px-4 py-4 rounded-lg text-base transition-all duration-200 min-h-[48px]',
                    isActive
                      ? 'bg-[var(--surface-light)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      className="ml-auto w-2 h-2 rounded-full"
                      style={{ backgroundColor: `var(--type-${item.pokemonType})` }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
