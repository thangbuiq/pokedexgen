import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'
import { Layout } from '@/components/layout/Layout'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://pokedexgen.vercel.app'),
  title: 'pokedeXgen - Next-Gen Pokédex',
  description:
    'Explore every Pokémon with deep stats, evolution chains, type matchups, and team building tools. Your all-in-one battle HQ powered by modern data engineering.',
  keywords: [
    'pokemon',
    'pokedex',
    'team builder',
    'type matchup',
    'pokemon stats',
    'next-gen pokedex',
  ],
  openGraph: {
    title: 'pokedeXgen - Next-Gen Pokédex for Pokémon Data, Matchups & Team Strategy',
    description:
      'Explore every Pokémon with deep stats, evolution chains, type matchups, and team building tools. Your all-in-one battle HQ powered by modern data engineering.',
    type: 'website',
    siteName: 'pokedeXgen',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'pokedeXgen - The Next-Gen Pokédex',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  )
}
