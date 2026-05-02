'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'

const SECTIONS = [
  { id: 'creator', title: 'Creator' },
  { id: 'egg', title: 'Egg' },
  { id: 'dimensions', title: 'Dimensions' },
  { id: 'earth', title: 'Earth' },
  { id: 'life', title: 'Life' },
  { id: 'cosmos', title: 'Cosmos' },
  { id: 'humanity', title: 'Humanity' },
]

// Particles Background
const Particles = () => {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>
  >([])

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[var(--text-primary)]/15"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: ['-20px', '20px'],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Mystical Cosmic Void Background
const CosmicVoid = () => {
  const [stars, setStars] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number }>
  >([])

  useEffect(() => {
    const newStars = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 4,
    }))
    setStars(newStars)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep nebula gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(76,29,149,0.12)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(59,130,246,0.08)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(147,51,234,0.1)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_60%,rgba(17,24,39,0.6)_0%,transparent_70%)]" />

      {/* Large nebula orbs */}
      <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[150px]" />
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[130px]" />
      <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full bg-indigo-900/8 blur-[100px]" />

      {/* Twinkling stars */}
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white/80"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
          }}
          animate={{
            opacity: [0.1, 0.9, 0.1],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Cosmic dust */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJnoiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjY1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2cpIiBvcGFjaXR5PSIwLjQiLz48L3N2Zz4=')]" />
    </div>
  )
}

export default function OriginsPage() {
  const [activeSection, setActiveSection] = useState('creator')

  // For section tracking
  const handleScroll = () => {
    const sections = SECTIONS.map((s) => document.getElementById(s.id))
    const scrollPosition = window.scrollY + window.innerHeight / 3

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i]
      if (section && section.offsetTop <= scrollPosition) {
        if (activeSection !== SECTIONS[i].id) {
          setActiveSection(SECTIONS[i].id)
        }
        break
      }
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeSection])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Section 2 Interactive State
  const [activeTrio, setActiveTrio] = useState<'dialga' | 'palkia' | 'giratina' | null>(null)

  // Section 5 Modal State
  const [activePortal, setActivePortal] = useState<'deoxys' | 'hoopa' | null>(null)

  // Section 6 Expand State
  const [activeRegion, setActiveRegion] = useState<'kalos' | 'unova' | 'galar' | 'alola' | null>(
    'unova'
  )

  return (
    <div
      className="dark min-h-screen relative overflow-x-hidden selection:bg-purple-500/30 bg-neutral-950 text-white"
      data-theme="dark"
    >
      <a
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 glass px-3 py-2 rounded-lg border border-white/10 bg-black/60 backdrop-blur-md hover:bg-white/10 transition-all duration-200"
      >
        <img
          src="/pokeball.png"
          alt="pokeXgen"
          className="w-5 h-5 hover:rotate-12 transition-transform"
        />
        <span className="text-[10px] font-[family-name:var(--font-pixel)] text-white tracking-wider hidden sm:inline">
          pokeXgen
        </span>
        <span className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-400/20 text-[9px] font-[family-name:var(--font-pixel)] text-purple-300 whitespace-nowrap">
          <svg
            className="w-3 h-3 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Pokédex
        </span>
      </a>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes pulse-glow-arceus {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(255, 255, 200, 0.4)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 60px rgba(255, 255, 200, 0.8)); transform: scale(1.02); }
        }
        .animate-arceus {
          animation: pulse-glow-arceus 6s ease-in-out infinite;
        }
        @keyframes egg-hatch {
          0% { box-shadow: 0 0 10px rgba(255,255,255,0.2); }
          50% { box-shadow: 0 0 50px rgba(255,255,255,0.8), 0 0 100px rgba(255,255,255,0.4); }
          100% { box-shadow: 0 0 200px rgba(255,255,255,1), 0 0 300px rgba(255,255,255,0.8); opacity: 0; }
        }
        .egg-glow {
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.1) 70%, transparent 100%);
        }

        /* Region Pins */
        .region-pin {
          position: absolute;
          width: 16px; height: 16px;
          background: var(--text-primary);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px var(--text-primary);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .region-pin:hover {
          transform: scale(1.5);
          box-shadow: 0 0 20px var(--accent);
        }
        .region-pin-selected {
          transform: scale(1.5);
          box-shadow: 0 0 20px var(--accent), 0 0 40px var(--accent);
          animation: purple-pulse-border 1.6s ease-in-out infinite;
        }
      `,
        }}
      />

      {/* Navigation */}
      <nav className="fixed bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 left-0 w-full md:w-auto md:left-8 z-50 p-4 md:p-0 bg-black/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t md:border-t-0 border-white/10 flex md:flex-col justify-between md:justify-center gap-2 md:gap-4 overflow-x-auto md:overflow-visible no-scrollbar">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`group flex items-center gap-3 transition-all ${activeSection === section.id ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            <div className="hidden md:block text-[10px] uppercase font-[family-name:var(--font-pixel)] opacity-0 group-hover:opacity-100 transition-opacity absolute left-6 w-max">
              {section.title}
            </div>
            <div
              className={`w-2 h-2 rounded-full transition-all ${activeSection === section.id ? 'bg-white scale-150 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/40'}`}
            />
            <span className="md:hidden text-[10px] font-[family-name:var(--font-pixel)] uppercase tracking-wider text-white/70">
              {section.title}
            </span>
          </button>
        ))}
      </nav>

      <main className="relative z-10 w-full">
        {/* HERO: CREATOR */}
        <section
          id="creator"
          className="relative min-h-[100dvh] flex flex-col items-center justify-center gap-4 md:gap-6 px-4 pt-4 pb-8 overflow-hidden"
        >
          <CosmicVoid />
          <Particles />

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2 }}
            className="relative z-10 text-center flex flex-col items-center"
          >
            <img
              src="/sprites/pokemon/other/official-artwork/493.png"
              alt="Arceus"
              className="max-h-[40vh] md:max-h-[45vh] w-auto max-w-[240px] md:max-w-[380px] object-contain animate-arceus mb-4 md:mb-6 drop-shadow-2xl"
            />
            <h1 className="text-lg md:text-3xl font-[family-name:var(--font-pixel)] text-transparent bg-clip-text bg-gradient-to-b from-[var(--text-primary)] to-[var(--text-muted)] tracking-widest leading-relaxed">
              In the beginning...
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="relative z-10 flex flex-col items-center gap-2 mt-8"
          >
            <span className="text-[11px] sm:text-xs font-[family-name:var(--font-pixel)] text-[var(--accent)] uppercase tracking-[0.2em] drop-shadow-[0_0_8px_var(--accent-glow)]">
              Scroll to begin creation
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="w-5 h-9 rounded-full border-2 border-[var(--accent)] flex justify-center pt-1.5 shadow-[0_0_12px_var(--accent-glow)]"
            >
              <div className="w-1 h-2 bg-[var(--accent)] rounded-full" />
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION 1: EGG */}
        <section
          id="egg"
          className="relative min-h-screen flex flex-col items-center justify-center py-32 px-4 md:px-24 border-t border-[var(--card-border)]"
        >
          <CosmicVoid />
          <div className="max-w-3xl mx-auto text-center z-10 relative">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-lg md:text-2xl font-[family-name:var(--font-pixel)] text-[var(--accent)] uppercase tracking-[0.3em] mb-16 drop-shadow-[0_0_15px_var(--accent-glow)]"
            >
              The Primordial Egg
            </motion.h2>
            <div className="relative mx-auto mb-16 flex items-end justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, margin: '-20%' }}
                transition={{ duration: 1.5 }}
                className="relative flex items-end justify-center gap-1 md:gap-4 z-10"
              >
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center"
                >
                  <img
                    src="/sprites/pokemon/other/official-artwork/483.png"
                    alt="Dialga"
                    className="w-16 h-16 md:w-28 md:h-28 object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                  />
                  <span className="mt-2 text-[10px] md:text-xs font-bold font-[family-name:var(--font-pixel)] text-blue-400 tracking-wider">
                    Dialga
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] tracking-wide">
                    represents time
                  </span>
                </motion.div>

                <div className="relative w-32 h-44 md:w-48 md:h-64">
                  <motion.div
                    className="absolute inset-0 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] egg-glow border border-[var(--card-border)]"
                    whileInView={{
                      boxShadow: [
                        '0 0 10px rgba(255,255,255,0.2)',
                        '0 0 50px rgba(255,255,255,0.6)',
                        '0 0 200px rgba(255,255,255,1), 0 0 400px rgba(255,255,255,0.8)',
                      ],
                      scale: [1, 1.05, 1.2],
                      opacity: [1, 1, 0],
                    }}
                    transition={{ duration: 4, delay: 0.5 }}
                    viewport={{ once: true, margin: '-20%' }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 3.5, duration: 2 }}
                    viewport={{ once: true }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <img
                      src="/sprites/pokemon/other/official-artwork/493.png"
                      alt="Arceus"
                      className="w-full h-full object-contain filter drop-shadow-[0_0_20px_var(--text-primary)]"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, delay: 1.5 }}
                    viewport={{ once: true }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 md:w-80 md:h-80 -z-10 pointer-events-none"
                  >
                    <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/20 animate-spin-slow" />
                    <div className="absolute inset-3 rounded-full border border-[var(--accent)]/15 animate-spin-reverse" />
                    <div className="absolute inset-6 rounded-full border border-dashed border-[var(--accent)]/10 animate-spin-slower" />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 1.0 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center"
                >
                  <img
                    src="/sprites/pokemon/other/official-artwork/484.png"
                    alt="Palkia"
                    className="w-16 h-16 md:w-28 md:h-28 object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                  />
                  <span className="mt-2 text-[10px] md:text-xs font-bold font-[family-name:var(--font-pixel)] text-purple-400 tracking-wider">
                    Palkia
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] tracking-wide">
                    represents space
                  </span>
                </motion.div>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: false }}
              className="text-lg md:text-2xl mb-8 leading-relaxed font-light text-[var(--text-primary)] drop-shadow-md"
            >
              "Before the universe existed, there was only an endless void."
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              viewport={{ once: false }}
              className="text-base md:text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto"
            >
              "From this absolute nothingness, a single egg hatched, bringing forth Arceus, the
              creator of the universe."
            </motion.p>
          </div>
        </section>

        {/* SECTION 2: DIMENSIONS */}
        <section
          id="dimensions"
          className="relative min-h-screen flex flex-col items-center justify-center py-32 px-4 md:px-24 border-t border-[var(--card-border)] overflow-hidden"
        >
          <div className="max-w-6xl w-full mx-auto z-10">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center text-lg md:text-2xl font-[family-name:var(--font-pixel)] text-[var(--accent)] uppercase tracking-[0.3em] mb-12 drop-shadow-[0_0_15px_var(--accent-glow)]"
            >
              Dimensions of Reality
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-xl md:text-2xl text-[var(--text-primary)] mb-4 font-light leading-relaxed">
                "To bring order to the void, Arceus created the Creation Trio."
              </p>
            </motion.div>

            {/* Creation Trio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              {[
                {
                  id: 'dialga',
                  dex: 483,
                  name: 'Dialga',
                  desc: 'Dialga was born to set time into motion...',
                  color: 'hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]',
                  glow: 'bg-blue-500/20',
                },
                {
                  id: 'palkia',
                  dex: 484,
                  name: 'Palkia',
                  desc: '...while Palkia expanded the endless boundaries of space.',
                  color: 'hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]',
                  glow: 'bg-purple-500/20',
                },
                {
                  id: 'giratina',
                  dex: 487,
                  name: 'Giratina',
                  desc: 'Giratina was created to represent antimatter but was banished to the Distortion World due to its chaotic and destructive nature.',
                  color: 'hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]',
                  glow: 'bg-red-500/20',
                },
              ].map((trio, i) => (
                <motion.div
                  key={trio.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  viewport={{ once: true }}
                  className={`relative glass p-6 text-center transition-all duration-500 cursor-pointer border border-[var(--card-border)] ${trio.color} bg-[var(--surface)]/40 overflow-hidden`}
                  onMouseEnter={() => setActiveTrio(trio.id as any)}
                  onMouseLeave={() => setActiveTrio(null)}
                >
                  <div
                    className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${activeTrio === trio.id ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <div
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full ${trio.glow} blur-[80px]`}
                    />
                  </div>
                  <div className="relative z-10">
                    <img
                      src={`/sprites/pokemon/other/official-artwork/${trio.dex}.png`}
                      alt={trio.name}
                      className="w-48 h-48 mx-auto object-contain drop-shadow-xl mb-6 transition-transform duration-500 hover:scale-110"
                    />
                    <h3 className="font-bold font-[family-name:var(--font-pixel)] text-sm mb-4 tracking-widest">
                      {trio.name}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed h-24">
                      {trio.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Lake Guardians */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-12 font-light">
                "Simultaneously, the Lake Guardians were created to bless the universe with
                knowledge, emotion, and willpower."
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                {[
                  { dex: 480, name: 'Uxie', trait: 'Knowledge' },
                  { dex: 481, name: 'Mesprit', trait: 'Emotion' },
                  { dex: 482, name: 'Azelf', trait: 'Willpower' },
                ].map((guardian, i) => (
                  <motion.div
                    key={guardian.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="glass px-6 py-4 flex flex-col items-center gap-3 bg-[var(--surface)]/50 border-[var(--card-border)]"
                  >
                    <img
                      src={`/sprites/pokemon/other/official-artwork/${guardian.dex}.png`}
                      alt={guardian.name}
                      className="w-20 h-20 object-contain"
                    />
                    <div className="text-center">
                      <div className="text-xs font-bold font-[family-name:var(--font-pixel)] mb-1">
                        {guardian.name}
                      </div>
                      <div className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider">
                        {guardian.trait}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 3: EARTH */}
        <section
          id="earth"
          className="relative min-h-screen flex flex-col justify-center border-t border-[var(--card-border)] overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-[15%] w-[400px] h-[400px] rounded-full bg-blue-500/15 blur-[100px]" />
            <div className="absolute top-1/2 right-[15%] w-[400px] h-[400px] rounded-full bg-red-500/15 blur-[100px]" />
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-green-500/10 blur-[80px]" />
          </div>

          <motion.div
            className="absolute inset-0 flex justify-center items-center pointer-events-none z-10"
            whileInView={{ opacity: [0, 1, 0], scale: [0.9, 1, 1.1] }}
            transition={{ duration: 1.5, times: [0, 0.5, 1] }}
            viewport={{ once: false, amount: 0.5 }}
          >
            <div className="w-2 h-full bg-[var(--text-primary)]/40 blur-md absolute shadow-[0_0_50px_20px_var(--text-primary)]" />
          </motion.div>

          <div className="relative z-20 max-w-6xl w-full mx-auto px-4 md:px-24 py-32 flex flex-col">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center text-lg md:text-2xl font-[family-name:var(--font-pixel)] text-[var(--accent)] uppercase tracking-[0.3em] mb-12 drop-shadow-[0_0_15px_var(--accent-glow)]"
            >
              The Titan's Clash
            </motion.h2>
            <div className="text-center mb-16 bg-[var(--surface)]/60 p-8 rounded-2xl backdrop-blur-md border border-[var(--card-border)]">
              <p className="text-xl md:text-2xl text-[var(--text-primary)] mb-4 font-light">
                "As planets began to form, ancient titans forged the Earth."
              </p>
              <p className="text-[var(--text-secondary)] max-w-3xl mx-auto">
                "Kyogre expanded the vast oceans, while Groudon raised the landmasses."
              </p>
            </div>

            <div className="flex justify-between items-center mb-16 relative">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="w-1/3"
              >
                <img
                  src="/sprites/pokemon/other/official-artwork/382.png"
                  alt="Kyogre"
                  className="w-full object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]"
                />
              </motion.div>

              <motion.div
                initial={{ y: -200, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5, duration: 1, type: 'spring' }}
                viewport={{ once: false }}
                className="w-1/3 z-30 absolute left-1/2 -translate-x-1/2 -top-20"
              >
                <img
                  src="/sprites/pokemon/other/official-artwork/384.png"
                  alt="Rayquaza"
                  className="w-full object-contain drop-shadow-[0_0_30px_rgba(34,197,94,0.6)]"
                />
              </motion.div>

              <motion.div
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="w-1/3"
              >
                <img
                  src="/sprites/pokemon/other/official-artwork/383.png"
                  alt="Groudon"
                  className="w-full object-contain drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              viewport={{ once: false }}
              className="text-center bg-[var(--surface)]/60 p-8 rounded-2xl backdrop-blur-md border border-[var(--card-border)] mt-16"
            >
              <p className="text-[var(--text-secondary)] leading-relaxed text-lg max-w-4xl mx-auto">
                "Their relentless battle for territorial dominance threatened the planet until
                Rayquaza, the master of the skies, descended to quell their rage and force them into
                a deep slumber."
              </p>
            </motion.div>
          </div>
        </section>

        {/* SECTION 4: LIFE */}
        <section
          id="life"
          className="relative min-h-screen flex flex-col justify-center py-32 px-4 md:px-24 border-t border-[var(--card-border)] overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[30%] left-[20%] w-[250px] h-[250px] rounded-full bg-green-500/12 blur-[80px]" />
            <div className="absolute bottom-[20%] right-[25%] w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-[90px]" />
            <div className="absolute top-[60%] left-[60%] w-[200px] h-[200px] rounded-full bg-teal-500/10 blur-[70px]" />
          </div>

          <div className="relative z-10 max-w-6xl w-full mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center text-lg md:text-2xl font-[family-name:var(--font-pixel)] text-[var(--accent)] uppercase tracking-[0.3em] mb-12 drop-shadow-[0_0_15px_var(--accent-glow)]"
            >
              Awakening of Life
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-xl md:text-2xl text-[var(--text-primary)] mb-4 font-light">
                "Regigigas towed the continents into their modern positions, crafting the legendary
                golems out of natural elements."
              </p>
            </motion.div>

            <div className="flex flex-col items-center mb-24 relative">
              <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 100 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-grab active:cursor-grabbing z-20 mb-8"
              >
                <img
                  src="/sprites/pokemon/other/official-artwork/486.png"
                  alt="Regigigas"
                  className="w-64 h-64 object-contain drop-shadow-2xl"
                />
                <div className="text-center mt-4 text-[10px] font-[family-name:var(--font-pixel)] text-[var(--text-muted)] uppercase tracking-widest animate-pulse">
                  Drag to move continents
                </div>
              </motion.div>

              <div className="flex justify-center gap-4 md:gap-12 w-full max-w-3xl">
                {[
                  { dex: 377, name: 'Regirock' },
                  { dex: 378, name: 'Regice' },
                  { dex: 379, name: 'Registeel' },
                ].map((regi, i) => (
                  <motion.div
                    key={regi.name}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.2 }}
                    viewport={{ once: true }}
                    className="glass p-4 bg-[var(--surface)]/40 border-[var(--card-border)] flex-1 flex flex-col items-center"
                  >
                    <img
                      src={`/sprites/pokemon/other/official-artwork/${regi.dex}.png`}
                      alt={regi.name}
                      className="w-24 h-24 object-contain mb-3"
                    />
                    <span className="text-xs font-bold font-[family-name:var(--font-pixel)]">
                      {regi.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative mt-24 text-center bg-[var(--surface)]/60 p-8 md:p-12 rounded-3xl backdrop-blur-md border border-[var(--card-border)]">
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute -top-24 left-1/2 -translate-x-1/2 z-30"
              >
                <img
                  src="/sprites/pokemon/other/official-artwork/151.png"
                  alt="Mew"
                  className="w-40 h-40 object-contain drop-shadow-[0_0_20px_rgba(244,114,182,0.5)]"
                />
              </motion.div>

              <div className="flex justify-between items-center absolute -top-12 left-8 right-8 md:left-24 md:right-24 opacity-50 pointer-events-none">
                <img
                  src="/sprites/pokemon/other/official-artwork/142.png"
                  alt="Aerodactyl"
                  className="w-24 h-24 object-contain"
                />
                <img
                  src="/sprites/pokemon/other/official-artwork/138.png"
                  alt="Omanyte"
                  className="w-20 h-20 object-contain"
                />
              </div>

              <p className="text-[var(--text-secondary)] leading-relaxed text-lg max-w-3xl mx-auto pt-8">
                "As the planet stabilized, Mew appeared, holding the DNA of all future Pokemon and
                sparking a massive boom in life and evolution. Prehistoric ancient Pokemon roamed
                the lands until a meteor strike ushered in a new era."
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: COSMOS */}
        <section
          id="cosmos"
          className="relative min-h-screen flex flex-col justify-center py-32 px-4 md:px-24 border-t border-[var(--card-border)] overflow-hidden"
        >
          {/* Starry Background */}
          <div className="absolute inset-0 bg-[var(--background)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)] bg-[size:100px_100px] [background-position:0_0,50px_50px]" />
            <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_30%,rgba(100,50,200,0.2)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(50,150,200,0.2)_0%,transparent_50%)]" />
          </div>

          <div className="relative z-10 max-w-6xl w-full mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-lg md:text-2xl font-[family-name:var(--font-pixel)] text-[var(--accent)] uppercase tracking-[0.3em] mb-16 drop-shadow-[0_0_15px_var(--accent-glow)]"
            >
              Beyond the Stars
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl text-[var(--text-primary)] mb-20 font-light max-w-4xl mx-auto"
            >
              "Life was not limited to Earth. The sun and moon bathed the world in light,
              represented by Solgaleo and Lunala."
            </motion.p>

            <div className="flex justify-around items-center mb-32 relative">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute inset-0 bg-orange-500/20 blur-[100px] rounded-full" />
                <img
                  src="/sprites/pokemon/other/official-artwork/791.png"
                  alt="Solgaleo"
                  className="w-48 md:w-80 object-contain relative z-10"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                <img
                  src="/sprites/pokemon/other/official-artwork/792.png"
                  alt="Lunala"
                  className="w-48 md:w-80 object-contain relative z-10"
                />
              </motion.div>
            </div>

            <div className="bg-[var(--surface)]/70 p-12 rounded-3xl backdrop-blur-xl border border-[var(--card-border)] relative">
              <p className="text-[var(--text-secondary)] leading-relaxed text-lg max-w-4xl mx-auto mb-12">
                "Space-faring beings like Deoxys, reality-bending travelers like Hoopa, and the
                bizarre Ultra Beasts roamed the infinite cosmos and parallel dimensions."
              </p>

              <div className="flex justify-center gap-12 md:gap-24">
                <button
                  onClick={() => setActivePortal('deoxys')}
                  className="group relative flex flex-col items-center"
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-emerald-500/50 flex items-center justify-center animate-[spin_10s_linear_infinite] shadow-[0_0_30px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] transition-all">
                    <div className="w-16 h-16 rounded-full border border-emerald-300/50" />
                  </div>
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-[family-name:var(--font-pixel)] text-emerald-400">
                    SPACE
                  </span>
                </button>

                <button
                  onClick={() => setActivePortal('hoopa')}
                  className="group relative flex flex-col items-center"
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-purple-500/50 flex items-center justify-center animate-[spin_10s_linear_infinite_reverse] shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] transition-all">
                    <div className="w-16 h-16 rounded-full border border-purple-300/50" />
                  </div>
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-[family-name:var(--font-pixel)] text-purple-400">
                    RINGS
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Portal Modal */}
          <AnimatePresence>
            {activePortal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm p-4"
                onClick={() => setActivePortal(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="glass p-8 max-w-md w-full text-center border-[var(--card-border)] relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setActivePortal(null)}
                    className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    ✕
                  </button>
                  <img
                    src={`/sprites/pokemon/other/official-artwork/${activePortal === 'deoxys' ? 386 : 720}.png`}
                    alt={activePortal}
                    className="w-48 h-48 mx-auto object-contain drop-shadow-2xl mb-6"
                  />
                  <h3 className="font-bold font-[family-name:var(--font-pixel)] text-xl mb-4 capitalize">
                    {activePortal}
                  </h3>
                  <p className="text-[var(--text-secondary)]">
                    {activePortal === 'deoxys'
                      ? 'An alien virus that fell to earth on a meteor underwent a DNA mutation to become this Pokémon.'
                      : 'It gathers things it likes and passes them through its loop to teleport them to a secret place.'}
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* SECTION 6: HUMANITY */}
        <section
          id="humanity"
          className="relative min-h-screen flex flex-col justify-center py-32 px-4 md:px-24 border-t border-[var(--card-border)]"
        >
          <div className="relative z-10 max-w-6xl w-full mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center text-lg md:text-2xl font-[family-name:var(--font-pixel)] text-[var(--accent)] uppercase tracking-[0.3em] mb-12 drop-shadow-[0_0_15px_var(--accent-glow)]"
            >
              Age of Legends
            </motion.h2>
            <div className="text-center mb-16">
              <p className="text-xl md:text-2xl text-[var(--text-primary)] mb-4 font-light">
                "Eventually, humans emerged, living alongside these creatures and naming them
                'Pocket Monsters' or Pokemon."
              </p>
              <p className="text-[var(--text-secondary)]">
                "Their intertwined history gave birth to localized myths across different
                regions..."
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start mb-16">
              <div className="w-full lg:w-1/2 aspect-square relative bg-[var(--surface-light)] rounded-3xl border border-[var(--card-border)] overflow-hidden glass">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(var(--text-primary)_1px,transparent_1px)] [background-size:20px_20px]" />
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/20 rounded-tl-3xl rounded-br-3xl border border-blue-500/30" />
                <div className="absolute top-1/3 right-1/4 w-40 h-24 bg-purple-500/20 rounded-tr-3xl rounded-bl-3xl border border-purple-500/30" />
                <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-red-500/20 rounded-full border border-red-500/30" />
                <div className="absolute bottom-1/3 right-1/4 w-24 h-32 bg-yellow-500/20 rounded-lg border border-yellow-500/30 rotate-12" />
                <div
                  className={`region-pin top-[30%] left-[30%] ${activeRegion === 'kalos' ? 'region-pin-selected' : ''}`}
                  onClick={() => setActiveRegion('kalos')}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-[family-name:var(--font-pixel)] whitespace-nowrap text-[var(--text-secondary)]">
                    Kalos
                  </span>
                </div>
                <div
                  className={`region-pin top-[40%] right-[30%] ${activeRegion === 'unova' ? 'region-pin-selected' : ''}`}
                  onClick={() => setActiveRegion('unova')}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-[family-name:var(--font-pixel)] whitespace-nowrap text-[var(--text-secondary)]">
                    Unova
                  </span>
                </div>
                <div
                  className={`region-pin bottom-[35%] left-[40%] ${activeRegion === 'alola' ? 'region-pin-selected' : ''}`}
                  onClick={() => setActiveRegion('alola')}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-[family-name:var(--font-pixel)] whitespace-nowrap text-[var(--text-secondary)]">
                    Alola
                  </span>
                </div>
                <div
                  className={`region-pin bottom-[40%] right-[30%] ${activeRegion === 'galar' ? 'region-pin-selected' : ''}`}
                  onClick={() => setActiveRegion('galar')}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-[family-name:var(--font-pixel)] whitespace-nowrap text-[var(--text-secondary)]">
                    Galar
                  </span>
                </div>
                <div className="absolute bottom-4 left-0 w-full text-center text-[var(--text-muted)] text-xs font-[family-name:var(--font-pixel)] pointer-events-none">
                  Select a region
                </div>
              </div>

              <div className="w-full lg:w-1/2 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {activeRegion === 'kalos' && (
                    <motion.div
                      key="kalos"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="glass p-8 border-blue-500/30 bg-[var(--card-bg)]"
                    >
                      <h3 className="text-xl font-[family-name:var(--font-pixel)] mb-6 text-blue-400">
                        Kalos Mythos
                      </h3>
                      <div className="flex gap-4 justify-center mb-6">
                        <img
                          src="/sprites/pokemon/other/official-artwork/716.png"
                          className="w-20 h-20 object-contain"
                          alt="Xerneas"
                        />
                        <img
                          src="/sprites/pokemon/other/official-artwork/717.png"
                          className="w-20 h-20 object-contain"
                          alt="Yveltal"
                        />
                        <img
                          src="/sprites/pokemon/other/official-artwork/718.png"
                          className="w-20 h-20 object-contain"
                          alt="Zygarde"
                        />
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                        Xerneas shares everlasting life, while Yveltal absorbs the life force of
                        living creatures. Zygarde monitors the ecosystem from the depths of the
                        cave, maintaining the delicate balance of the natural world.
                      </p>
                    </motion.div>
                  )}
                  {activeRegion === 'unova' && (
                    <motion.div
                      key="unova"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="glass p-8 border-purple-500/30 bg-[var(--card-bg)]"
                    >
                      <h3 className="text-xl font-[family-name:var(--font-pixel)] mb-6 text-purple-400">
                        Unova Mythos
                      </h3>
                      <div className="flex gap-4 justify-center mb-6">
                        <img
                          src="/sprites/pokemon/other/official-artwork/643.png"
                          className="w-20 h-20 object-contain"
                          alt="Reshiram"
                        />
                        <img
                          src="/sprites/pokemon/other/official-artwork/644.png"
                          className="w-20 h-20 object-contain"
                          alt="Zekrom"
                        />
                        <img
                          src="/sprites/pokemon/other/official-artwork/646.png"
                          className="w-20 h-20 object-contain"
                          alt="Kyurem"
                        />
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                        Once a single dragon that created the region alongside twin heroes. It split
                        into Reshiram (Truth) and Zekrom (Ideals), leaving behind the empty shell
                        Kyurem. Their conflict shaped the foundation of Unova.
                      </p>
                    </motion.div>
                  )}
                  {activeRegion === 'galar' && (
                    <motion.div
                      key="galar"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="glass p-8 border-red-500/30 bg-[var(--card-bg)]"
                    >
                      <h3 className="text-xl font-[family-name:var(--font-pixel)] mb-6 text-red-400">
                        Galar Mythos
                      </h3>
                      <div className="flex gap-4 justify-center mb-6">
                        <img
                          src="/sprites/pokemon/other/official-artwork/890.png"
                          className="w-32 h-32 object-contain"
                          alt="Eternatus"
                        />
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                        The Darkest Day. Eternatus, an extraterrestrial Pokémon, attempted to absorb
                        Galar's energy, causing Pokémon to Dynamax uncontrollably. It remains the
                        source of the region's Dynamax phenomenon.
                      </p>
                    </motion.div>
                  )}
                  {activeRegion === 'alola' && (
                    <motion.div
                      key="alola"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="glass p-8 border-yellow-500/30 bg-[var(--card-bg)]"
                    >
                      <h3 className="text-xl font-[family-name:var(--font-pixel)] mb-6 text-yellow-400">
                        Alola Mythos
                      </h3>
                      <div className="flex gap-4 justify-center mb-6">
                        <img
                          src="/sprites/pokemon/other/official-artwork/800.png"
                          className="w-32 h-32 object-contain"
                          alt="Necrozma"
                        />
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                        Through the Ultra Wormholes, Ultra Beasts invaded Alola. Necrozma, a
                        creature of light that lost its power, endlessly seeks to consume light to
                        restore its true form, intertwining its fate with Solgaleo and Lunala.
                      </p>
                    </motion.div>
                  )}
                  {!activeRegion && (
                    <div className="h-full flex items-center justify-center text-[var(--text-muted)] font-[family-name:var(--font-pixel)] text-sm border-2 border-dashed border-[var(--card-border)] rounded-3xl">
                      Awaiting Discovery
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="border-t border-[var(--card-border)] pt-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass p-6 md:p-10 border border-[var(--card-border)] bg-[var(--surface)]/40 mb-10"
              >
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                  <div className="shrink-0">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/vi/4/4f/Satoshi-Anime_Pokemon.png"
                      alt="Satoshi (Ash Ketchum)"
                      className="w-40 h-40 md:w-52 md:h-52 object-contain drop-shadow-xl"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-lg md:text-xl font-[family-name:var(--font-pixel)] text-[var(--accent)] mb-3">
                      Satoshi (Ash Ketchum)
                    </h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed text-sm md:text-base mb-4">
                      The most iconic Pokemon Trainer in history. From Pallet Town, he set out on a
                      journey to become a Pokemon Master, traveling across countless regions,
                      forging unbreakable bonds with his Pokemon, and inspiring generations of
                      trainers to follow their dreams.
                    </p>
                    <a
                      href="https://bulbapedia.bulbagarden.net/wiki/Ash_Ketchum"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent)] transition-all duration-300 text-xs font-[family-name:var(--font-pixel)] tracking-wider text-[var(--text-primary)]"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                      Learn more about Ash
                    </a>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    name: 'Red',
                    role: 'The Silent Legend',
                    region: 'Kanto',
                    url: 'https://bulbapedia.bulbagarden.net/wiki/Red_(game)',
                  },
                  {
                    name: 'Blue',
                    role: 'The Rival',
                    region: 'Kanto',
                    url: 'https://bulbapedia.bulbagarden.net/wiki/Blue_(game)',
                  },
                  {
                    name: 'Cynthia',
                    role: 'Sinnoh Champion',
                    region: 'Sinnoh',
                    url: 'https://bulbapedia.bulbagarden.net/wiki/Cynthia',
                  },
                  {
                    name: 'Leon',
                    role: 'The Unbeatable',
                    region: 'Galar',
                    url: 'https://bulbapedia.bulbagarden.net/wiki/Leon',
                  },
                  {
                    name: 'Steven',
                    role: 'Hoenn Champion',
                    region: 'Hoenn',
                    url: 'https://bulbapedia.bulbagarden.net/wiki/Steven_Stone',
                  },
                  {
                    name: 'Lance',
                    role: 'Dragon Master',
                    region: 'Johto',
                    url: 'https://bulbapedia.bulbagarden.net/wiki/Lance',
                  },
                  {
                    name: 'Diantha',
                    role: 'Kalos Champion',
                    region: 'Kalos',
                    url: 'https://bulbapedia.bulbagarden.net/wiki/Diantha',
                  },
                  {
                    name: 'Iris',
                    role: 'Unova Champion',
                    region: 'Unova',
                    url: 'https://bulbapedia.bulbagarden.net/wiki/Iris',
                  },
                ].map((trainer, i) => (
                  <motion.a
                    key={trainer.name}
                    href={trainer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="glass p-4 bg-[var(--surface)]/40 border border-[var(--card-border)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] transition-all duration-300 group"
                  >
                    <div className="text-[10px] text-[var(--accent)] font-[family-name:var(--font-pixel)] tracking-wider mb-1 uppercase">
                      {trainer.region}
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                      {trainer.name}
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)]">{trainer.role}</p>
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                      View profile
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
