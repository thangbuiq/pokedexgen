'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { HowToGuide } from '@/components/ui/HowToGuide'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { type PokemonType, typeColorMap } from '@/lib/design-tokens'
import { getSpriteUrl, isSpriteMissing } from '@/lib/sprites'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PokemonRow {
  id: number
  name: string
  sprite_url: string
  type_names: string
}

type Difficulty = 'easy' | 'hard'
type GameState = 'guessing' | 'revealed'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function formatName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function parseTypes(typeStr: string): PokemonType[] {
  return typeStr
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t): t is PokemonType => t in typeColorMap)
}

function useJSONQuery<T>(jsonFile: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/data/${jsonFile}`)
      if (!response.ok) {
        throw new Error(`Failed to load ${jsonFile}: ${response.status}`)
      }
      const json = await response.json()
      setData(json as T[])
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [jsonFile])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// ─── Confetti Particle ────────────────────────────────────────────────────────

function ConfettiParticle({ delay, color, left }: { delay: number; color: string; left: number }) {
  return (
    <div
      className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full animate-[confetti-burst_0.8s_ease-out_forwards]"
      style={
        {
          animationDelay: `${delay}ms`,
          backgroundColor: color,
          left: `${left}%`,
          '--confetti-x': `${(left - 50) * 3}px`,
          '--confetti-y': `${-80 - Math.random() * 120}px`,
        } as React.CSSProperties
      }
    />
  )
}

// ─── Streak Fire ──────────────────────────────────────────────────────────────

function StreakFire({ streak }: { streak: number }) {
  if (streak < 2) return null
  const intensity = Math.min(streak, 10)
  const glowColor = streak >= 5 ? '#ef4444' : streak >= 3 ? '#f59e0b' : '#fbbf24'
  return (
    <div className="flex items-center gap-1.5 animate-pulse">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        className="shrink-0"
        style={{ color: glowColor }}
      >
        <path
          d="M12 23c-4 0-7-3-7-7 0-3 2-5 4-7 1-1 2-3 2-5 0 2 2 4 3 5 1-2 2-4 2-6 0 3 3 6 4 8 1 2 1 3 1 5 0 4-3 7-7 7z"
          fill="currentColor"
          opacity={0.9}
        />
      </svg>
      <span
        className="font-[family-name:var(--font-pixel)] text-[10px] tracking-wider uppercase"
        style={{
          color: glowColor,
          textShadow: `0 0 6px ${glowColor}, 0 0 12px ${glowColor}`,
        }}
      >
        {streak >= 10
          ? 'UNSTOPPABLE'
          : streak >= 7
            ? 'ON FIRE'
            : streak >= 5
              ? 'BLAZING'
              : streak >= 3
                ? 'HOT'
                : 'STREAK'}
      </span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const { data: rawData, loading, error } = useJSONQuery<PokemonRow>('pokemon.json')
  const data = useMemo(
    () => (rawData ? rawData.filter((p) => !isSpriteMissing(p.id)) : []),
    [rawData]
  )

  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [totalGuesses, setTotalGuesses] = useState(0)
  const [gameState, setGameState] = useState<GameState>('guessing')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [textInput, setTextInput] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [shakeWrong, setShakeWrong] = useState(false)
  const [revealAnimation, setRevealAnimation] = useState(false)

  // Queue of Pokemon indices - no repeats until all shown
  const [queue, setQueue] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  // Build queue when data loads
  useEffect(() => {
    if (data && data.length > 0 && queue.length === 0) {
      const indices = shuffleArray(data.map((_, i) => i))
      setQueue(indices)
      setCurrentIndex(0)
    }
  }, [data, queue.length])

  // Current Pokemon
  const currentPokemon = useMemo(() => {
    if (!data || data.length === 0 || queue.length === 0) return null
    return data[queue[currentIndex] % data.length]
  }, [data, queue, currentIndex])

  // Generate multiple choice options
  const options = useMemo(() => {
    if (!data || !currentPokemon || difficulty !== 'easy') return []
    const wrongOptions = shuffleArray(data.filter((p) => p.id !== currentPokemon.id)).slice(0, 3)
    const allOptions = shuffleArray([currentPokemon, ...wrongOptions])
    return allOptions
  }, [data, currentPokemon, difficulty])

  // Pick next Pokemon
  const nextPokemon = useCallback(() => {
    if (!data) return
    const nextIdx = currentIndex + 1
    if (nextIdx >= queue.length) {
      // Reshuffle when queue exhausted
      const newQueue = shuffleArray(data.map((_, i) => i))
      setQueue(newQueue)
      setCurrentIndex(0)
    } else {
      setCurrentIndex(nextIdx)
    }
    setGameState('guessing')
    setIsCorrect(null)
    setTextInput('')
    setShowConfetti(false)
    setShakeWrong(false)
    setRevealAnimation(false)
    if (difficulty === 'hard') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [data, currentIndex, queue.length, difficulty])

  // Handle answer
  const handleAnswer = useCallback(
    (answer: string) => {
      if (gameState !== 'guessing' || !currentPokemon) return
      const correct = answer.toLowerCase().trim() === currentPokemon.name.toLowerCase().trim()
      setIsCorrect(correct)
      setGameState('revealed')
      setTotalGuesses((t) => t + 1)
      setRevealAnimation(true)

      if (correct) {
        setScore((s) => s + 1)
        setStreak((s) => {
          const newStreak = s + 1
          setBestStreak((b) => Math.max(b, newStreak))
          return newStreak
        })
        setShowConfetti(true)
      } else {
        setStreak(0)
        setShakeWrong(true)
      }
    },
    [gameState, currentPokemon]
  )

  // Handle skip
  const handleSkip = useCallback(() => {
    if (gameState !== 'guessing') return
    setIsCorrect(false)
    setGameState('revealed')
    setTotalGuesses((t) => t + 1)
    setStreak(0)
    setRevealAnimation(true)
  }, [gameState])

  // Handle keyboard submit for hard mode
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && textInput.trim()) {
        handleAnswer(textInput)
      }
    },
    [textInput, handleAnswer]
  )

  // Handle keyboard shortcut for next
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameState === 'revealed' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        nextPokemon()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gameState, nextPokemon])

  // ─── Loading / Error ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <LoadingSpinner size={64} />
        <p className="text-[var(--text-secondary)] text-sm font-[family-name:var(--font-pixel)] tracking-wider">
          LOADING QUIZ DATA...
        </p>
      </div>
    )
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-red-400 text-sm">Failed to load Pokemon data</p>
        {error && <p className="text-[var(--text-muted)] text-xs">{error.message}</p>}
      </div>
    )
  }

  if (!currentPokemon) return null

  // ─── Derived values ─────────────────────────────────────────────────────

  const pokemonTypes = parseTypes(currentPokemon.type_names)
  const uniqueTypes = [...new Set(pokemonTypes)]
  const primaryType = pokemonTypes[0] ?? 'normal'
  const primaryColor = typeColorMap[primaryType]
  const accuracy = totalGuesses > 0 ? Math.round((score / totalGuesses) * 100) : 0

  // ─── Confetti colors ────────────────────────────────────────────────────

  const confettiColors = [
    'var(--type-fire)',
    'var(--type-electric)',
    'var(--type-water)',
    'var(--type-grass)',
    'var(--type-psychic)',
    'var(--type-dragon)',
    '#ffffff',
    '#facc15',
  ]

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-[family-name:var(--font-pixel)] text-[var(--text-primary)] tracking-wider">
              Who&apos;s That{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--type-ghost)] to-[var(--type-psychic)]">
                Pokemon
              </span>
              ?
            </h1>
            <p className="text-[var(--text-muted)] text-sm">Test your Pokemon knowledge</p>
          </div>
        </div>
      </div>

      <HowToGuide title="Quiz Guide">
        A silhouette of a random Pokemon appears. Guess its name by typing or choosing from multiple
        choice. Hard mode requires typing the exact name. Build streaks for bonus flair!
      </HowToGuide>

      {/* ── Score Bar ─────────────────────────────────────────────────────── */}
      <div
        className={[
          'glass rounded-xl p-4 mb-6 transition-all duration-500 border',
          streak >= 2
            ? 'border-orange-400/60 shadow-[0_0_20px_rgba(251,146,60,0.25),inset_0_0_12px_rgba(251,146,60,0.08)]'
            : 'border-[var(--card-border)]',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <svg
                className="w-4 h-4 text-[var(--type-electric)]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <div>
                <p className="text-[var(--text-primary)] font-bold text-lg leading-none">{score}</p>
                <p className="text-[var(--text-muted)] text-[10px] font-[family-name:var(--font-pixel)] tracking-wider">
                  SCORE
                </p>
              </div>
            </div>
            <div className="w-px h-8 bg-[var(--surface)] shrink-0" />
            <div className="flex items-center gap-2 shrink-0">
              <svg
                className="w-4 h-4 text-[var(--type-fire)]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p
                  className="font-bold text-lg leading-none transition-colors duration-300"
                  style={{
                    color:
                      streak >= 5 ? '#ef4444' : streak >= 2 ? '#f59e0b' : 'var(--text-primary)',
                  }}
                >
                  {streak}
                </p>
                <p className="text-[var(--text-muted)] text-[10px] font-[family-name:var(--font-pixel)] tracking-wider">
                  STREAK
                </p>
              </div>
            </div>
            <div className="w-px h-8 bg-[var(--surface)] shrink-0" />
            <div className="flex items-center gap-2 shrink-0">
              <svg
                className="w-4 h-4 text-[var(--text-secondary)]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <div>
                <p className="text-[var(--text-primary)] font-bold text-lg leading-none">
                  {accuracy}%
                </p>
                <p className="text-[var(--text-muted)] text-[10px] font-[family-name:var(--font-pixel)] tracking-wider">
                  ACCURACY
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            <StreakFire streak={streak} />
          </div>
        </div>
      </div>

      {/* ── Difficulty Toggle ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-[var(--text-muted)] text-xs font-[family-name:var(--font-pixel)] tracking-wider mr-2">
          DIFFICULTY
        </span>
        <button
          onClick={() => {
            setDifficulty('easy')
            if (gameState === 'guessing') {
              setTextInput('')
            }
          }}
          className={[
            'px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 border',
            difficulty === 'easy'
              ? 'bg-[var(--type-ghost)]/20 text-[var(--type-ghost)] border-[var(--type-ghost)]/50 shadow-[0_0_12px_var(--type-ghost)30]'
              : 'text-[var(--text-muted)] border-[var(--card-border)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface)]',
          ].join(' ')}
        >
          Easy
        </button>
        <button
          onClick={() => {
            setDifficulty('hard')
            if (gameState === 'guessing') {
              setTimeout(() => inputRef.current?.focus(), 100)
            }
          }}
          className={[
            'px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 border',
            difficulty === 'hard'
              ? 'bg-[var(--type-fire)]/20 text-[var(--type-fire)] border-[var(--type-fire)]/50 shadow-[0_0_12px_var(--type-fire)30]'
              : 'text-[var(--text-muted)] border-[var(--card-border)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface)]',
          ].join(' ')}
        >
          Hard
        </button>
      </div>

      {/* ── Silhouette Card ───────────────────────────────────────────────── */}
      <div className="relative">
        <Card pokemonType="ghost" className="relative overflow-hidden">
          {/* Background glow */}
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${primaryColor}60 0%, transparent 70%)`,
            }}
          />

          {/* Confetti overlay */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
              {Array.from({ length: 24 }).map((_, i) => (
                <ConfettiParticle
                  key={i}
                  delay={i * 30}
                  color={confettiColors[i % confettiColors.length]}
                  left={10 + (i * 80) / 24}
                />
              ))}
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center py-6 sm:py-10">
            {/* Silhouette */}
            <div
              onContextMenu={(e) => e.preventDefault()}
              className={[
                'relative mb-6 transition-all duration-700 ease-out',
                revealAnimation && isCorrect && 'scale-110',
                shakeWrong && 'animate-[shake_0.5s_ease-in-out]',
              ].join(' ')}
              style={{
                filter:
                  gameState === 'guessing'
                    ? 'brightness(0.08) contrast(1.2) drop-shadow(0 0 20px rgba(255,255,255,0.35))'
                    : 'none',
                transition:
                  gameState === 'revealed'
                    ? 'filter 0.6s ease-out, transform 0.5s ease-out'
                    : 'filter 0.3s ease',
              }}
            >
              <Image
                src={getSpriteUrl(currentPokemon.id)}
                alt={gameState === 'revealed' ? currentPokemon.name : 'Who is this Pokemon?'}
                width={192}
                height={192}
                loading="eager"
                priority
                unoptimized
                className="pointer-events-none select-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>

            {/* Pokemon name (revealed) */}
            {gameState === 'revealed' && (
              <div className="text-center mb-4 animate-[slide-in_0.4s_ease-out]">
                <h2
                  className="text-2xl sm:text-3xl font-bold capitalize mb-1"
                  style={{
                    color: isCorrect ? 'var(--type-electric)' : 'var(--type-fire)',
                    textShadow: isCorrect
                      ? '0 0 20px var(--type-electric), 0 0 40px var(--type-electric)'
                      : '0 0 20px var(--type-fire)',
                  }}
                >
                  {formatName(currentPokemon.name)}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-[var(--text-muted)] text-xs font-[family-name:var(--font-pixel)] tracking-wider">
                    #{String(currentPokemon.id).padStart(3, '0')}
                  </span>
                  {uniqueTypes.map((type) => {
                    const color = typeColorMap[type]
                    return (
                      <span
                        key={type}
                        className="text-[10px] px-2 py-0.5 rounded-full font-[family-name:var(--font-pixel)] uppercase tracking-wider transition-all duration-200 hover:scale-110"
                        style={{
                          backgroundColor: color,
                          color: '#ffffff',
                          border: `1px solid ${color}`,
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        {type}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Result message */}
            {gameState === 'revealed' && (
              <div className="mb-4 animate-[slide-in_0.3s_ease-out]">
                {isCorrect ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-6 h-6 text-[var(--type-electric)]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-[var(--type-electric)] font-bold text-lg">
                      {streak >= 5 ? 'INCREDIBLE!' : streak >= 3 ? 'NICE STREAK!' : 'CORRECT!'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-6 h-6 text-[var(--type-fire)]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-[var(--type-fire)] font-bold text-lg">NOT QUITE</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Easy Mode: Multiple Choice ──────────────────────────────── */}
            {difficulty === 'easy' && gameState === 'guessing' && (
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.name)}
                    className="glass rounded-lg px-4 py-3 text-[var(--text-primary)] font-semibold capitalize text-sm
                      hover:bg-[var(--surface)] hover:border-[var(--card-border)] hover:shadow-[0_0_12px_rgba(168,85,247,0.2)]
                      active:scale-95 transition-all duration-200 border border-[var(--card-border)]"
                  >
                    {formatName(option.name)}
                  </button>
                ))}
              </div>
            )}

            {/* ── Hard Mode: Text Input ────────────────────────────────────── */}
            {difficulty === 'hard' && gameState === 'guessing' && (
              <div className="w-full max-w-sm">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type the Pokemon name..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full glass rounded-lg px-4 py-3 text-[var(--text-primary)] text-center text-sm placeholder-[var(--text-muted)]
                      outline-none focus:ring-2 focus:ring-[var(--type-ghost)]/50 focus:border-[var(--type-ghost)]/50
                      transition-all duration-200 border border-[var(--card-border)]"
                  />
                  {textInput.trim() && (
                    <button
                      onClick={() => handleAnswer(textInput)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md
                        bg-[var(--type-ghost)]/20 text-[var(--type-ghost)] text-xs font-semibold
                        hover:bg-[var(--type-ghost)]/30 transition-colors border border-[var(--type-ghost)]/30"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Action Buttons ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mt-6">
              {gameState === 'guessing' ? (
                <>
                  <button
                    onClick={handleSkip}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--text-secondary)]
                      border border-[var(--card-border)] hover:text-[var(--text-primary)] hover:border-[var(--card-border)] hover:bg-[var(--surface)]
                      transition-all duration-200 active:scale-95"
                  >
                    Skip
                  </button>
                  <div className="text-[var(--text-muted)] text-xs">
                    {currentIndex + 1} / {data.length}
                  </div>
                </>
              ) : (
                <button
                  onClick={nextPokemon}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-[var(--text-primary)]
                    bg-[var(--type-ghost)]/20 border border-[var(--type-ghost)]/50
                    hover:bg-[var(--type-ghost)]/30 hover:shadow-[0_0_15px_var(--type-ghost)30]
                    transition-all duration-300 active:scale-95"
                >
                  Next Pokemon →
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* ── Best Streak Badge ────────────────────────────────────────────── */}
        {bestStreak > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <svg
              className="w-3.5 h-3.5 text-[var(--type-electric)]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[var(--text-muted)] text-xs font-[family-name:var(--font-pixel)] tracking-wider">
              BEST STREAK: {bestStreak}
            </span>
          </div>
        )}
      </div>

      {/* ── How to Play ────────────────────────────────────────────────────── */}
      <div className="mt-8 glass rounded-xl p-5">
        <h3 className="text-xs font-[family-name:var(--font-pixel)] text-[var(--type-ghost)] tracking-wider mb-3">
          HOW TO PLAY
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--type-ghost)]/10 border border-[var(--type-ghost)]/20 flex items-center justify-center shrink-0">
              <span className="text-[var(--type-ghost)] text-sm font-bold">1</span>
            </div>
            <div>
              <p className="text-[var(--text-secondary)] text-sm font-medium">Identify</p>
              <p className="text-[var(--text-muted)] text-xs">
                Look at the silhouette and guess the Pokemon
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--type-ghost)]/10 border border-[var(--type-ghost)]/20 flex items-center justify-center shrink-0">
              <span className="text-[var(--type-ghost)] text-sm font-bold">2</span>
            </div>
            <div>
              <p className="text-[var(--text-secondary)] text-sm font-medium">Answer</p>
              <p className="text-[var(--text-muted)] text-xs">
                {difficulty === 'easy' ? 'Pick from 4 choices' : 'Type the name exactly'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--type-ghost)]/10 border border-[var(--type-ghost)]/20 flex items-center justify-center shrink-0">
              <span className="text-[var(--type-ghost)] text-sm font-bold">3</span>
            </div>
            <div>
              <p className="text-[var(--text-secondary)] text-sm font-medium">Streak</p>
              <p className="text-[var(--text-muted)] text-xs">
                Build consecutive correct answers for glory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
