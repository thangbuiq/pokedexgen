'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Pikachu sprite */}
      <div className="relative mb-6">
        <div
          className="absolute inset-0 rounded-full scale-[2]"
          style={{
            background:
              'radial-gradient(circle at center, rgba(250,204,21,0.25) 0%, transparent 70%)',
          }}
        />
        <Image
          src="/sprites/pokemon/other/official-artwork/25.png"
          alt="Pikachu is lost!"
          width={200}
          height={200}
          className="relative z-10 drop-shadow-2xl animate-[float_3s_ease-in-out_infinite]"
          unoptimized
          priority
        />
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-[family-name:var(--font-pixel)] text-[var(--text-primary)] tracking-wider mb-3">
        404
      </h1>

      {/* Message */}
      <p className="text-base sm:text-lg text-[var(--text-secondary)] mb-2 max-w-md">
        Oh no! You&apos;ve wandered into the tall grass without a guide...
      </p>
      <p className="text-sm text-[var(--text-muted)] mb-8 max-w-sm font-[family-name:var(--font-pixel)] tracking-wider leading-relaxed">
        Pikachu can&apos;t find this page either.
        <br />
        Let&apos;s get you back on the right path!
      </p>

      {/* Back to Home */}
      <Link
        href="/"
        className="group inline-flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-[family-name:var(--font-pixel)] uppercase tracking-wider transition-all duration-300 border-2 bg-[var(--type-electric)] text-[#1a1a1a] border-[var(--type-electric)] shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] hover:scale-105 active:scale-95"
        style={{ textShadow: 'none' }}
      >
        <svg
          className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Pokédex
      </Link>

      {/* Decorative pokeball */}
      <div className="mt-12 opacity-20">
        <Image src="/pokeball.png" alt="" width={40} height={40} className="animate-spin-slow" />
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
      `}</style>
    </div>
  )
}
