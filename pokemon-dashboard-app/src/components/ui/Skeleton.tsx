interface SkeletonProps {
  className?: string
}

/**
 * Base skeleton shimmer block.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--surface-hover)] ${className}`}
      aria-hidden="true"
    />
  )
}

/**
 * Skeleton that mimics a Pokemon card in the grid.
 */
export function PokemonCardSkeleton() {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <Skeleton className="w-full aspect-square rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/3" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex justify-between pt-2 border-t border-[var(--card-border)]">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  )
}

/**
 * Skeleton grid matching the Pokemon grid layout.
 */
export function PokemonGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PokemonCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for the detail modal content.
 */
export function DetailModalSkeleton() {
  return (
    <div className="flex flex-col items-center py-8 gap-4 animate-pulse">
      <Skeleton className="w-40 h-40 rounded-full" />
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-20" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="w-full max-w-md space-y-3 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-2 flex-1 rounded-full" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for team builder slots.
 */
export function TeamSlotSkeleton() {
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-3 animate-pulse">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}
