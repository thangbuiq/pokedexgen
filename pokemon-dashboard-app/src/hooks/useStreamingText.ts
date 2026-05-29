'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseStreamingTextOptions {
  speed?: number
  pauseOnPunctuation?: number
}

interface UseStreamingTextReturn {
  displayedText: string
  isComplete: boolean
  isStreaming: boolean
  stop: () => void
}

const DEFAULT_SPEED = 45
const PAUSE_CHARS = new Set(['.', '!', '?', ':', ';', '…'])
const COMMA_PAUSE = 220
const SENTENCE_PAUSE = 500

function getDelayForChar(char: string, baseSpeed: number): number {
  if (PAUSE_CHARS.has(char)) return SENTENCE_PAUSE
  if (char === ',') return COMMA_PAUSE
  if (char === ' ') return baseSpeed * 0.5
  return baseSpeed + Math.random() * 20 - 10
}

export function useStreamingText(
  fullText: string,
  options: UseStreamingTextOptions = {}
): UseStreamingTextReturn {
  const { speed = DEFAULT_SPEED } = options
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const indexRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stoppedRef = useRef(false)

  const stop = useCallback(() => {
    stoppedRef.current = true
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setDisplayedText(fullText)
    setIsComplete(true)
  }, [fullText])

  useEffect(() => {
    // Reset when fullText changes
    stoppedRef.current = false
    indexRef.current = 0
    setDisplayedText('')
    setIsComplete(false)

    if (!fullText) {
      setIsComplete(true)
      return
    }

    const streamNext = () => {
      if (stoppedRef.current) return

      const idx = indexRef.current
      if (idx >= fullText.length) {
        setIsComplete(true)
        return
      }

      const char = fullText[idx]
      indexRef.current = idx + 1
      setDisplayedText(fullText.slice(0, idx + 1))

      const delay = getDelayForChar(char, speed)
      timeoutRef.current = setTimeout(streamNext, delay)
    }

    // Small initial delay for natural feel
    timeoutRef.current = setTimeout(streamNext, 120)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [fullText, speed])

  return {
    displayedText,
    isComplete,
    isStreaming: !isComplete && displayedText.length > 0,
    stop,
  }
}
