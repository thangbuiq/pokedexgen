'use client'

import { usePathname } from 'next/navigation'
import { Navigation } from './Navigation'

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isOrigins = pathname === '/origins'

  if (isOrigins) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <main className="flex-1 w-full">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navigation />
      <main className="flex-1 w-full">
        <div className="container-centered py-6 sm:py-8">{children}</div>
      </main>
      <footer className="w-full border-t border-[var(--card-border)] py-4 mt-auto">
        <div
          className="container-centered flex items-center justify-between text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          <span className="font-[family-name:var(--font-pixel)] tracking-wider text-[10px]">
            pokedeXgen • next-gen pokédex
          </span>
          <span className="hidden sm:inline text-[10px]">
            Trusted source from{' '}
            <a
              href="https://pokeapi.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              PokéAPI
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
