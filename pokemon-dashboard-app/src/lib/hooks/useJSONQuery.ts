'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseJSONQueryResult<T> {
  data: T[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Module-level cache: each JSON file is fetched only once per session.
 * Stores the fetch promise so concurrent callers share the same request.
 */
const jsonCache = new Map<string, Promise<unknown>>()

/**
 * Shared hook for fetching JSON data from /data/ directory.
 * Supports conditional fetching, abort cleanup, and simple caching.
 */
export function useJSONQuery<T>(jsonFile: string, enabled: boolean = true): UseJSONQueryResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    // Return cached data if already resolved
    const cachedPromise = jsonCache.get(jsonFile)
    if (cachedPromise) {
      try {
        const cachedData = (await cachedPromise) as T[]
        setData(cachedData)
        setLoading(false)
        return
      } catch {
        // Cache failed — remove it so we retry
        jsonCache.delete(jsonFile)
      }
    }

    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setLoading(true)
      setError(null)

      const fetchPromise = fetch(`/data/${jsonFile}`, {
        signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${jsonFile}: ${response.status}`)
        }
        return response.json() as Promise<T[]>
      })

      // Store promise in cache for concurrent callers
      jsonCache.set(jsonFile, fetchPromise)

      const json = await fetchPromise
      setData(json)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [jsonFile, enabled])

  useEffect(() => {
    fetchData()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchData])

  return { data, loading: enabled ? loading : false, error, refetch: fetchData }
}
