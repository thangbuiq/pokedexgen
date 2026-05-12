# AGENTS.md - Dashboard

Next.js 16 static export with client-side JSON data.

## Structure

```
pokemon-dashboard-app/
├── src/app/              # App Router pages (all "use client")
├── src/components/       # layout/, ui/ (Card, Badge, Button, etc.)
├── src/lib/              # design-tokens.ts, data/ (json-hooks), sprites.ts
└── public/data/          # JSON exports from pipeline (data source)
```

## Where to Look

| Task          | Location                     | Notes                       |
| ------------- | ---------------------------- | --------------------------- |
| Add page      | `src/app/[route]/page.tsx`   | Must include `"use client"` |
| Query data    | `src/lib/data/json-hooks.ts` | `useJSONQuery<T>(jsonFile)` |
| UI components | `src/components/ui/`         | Tested with Vitest          |
| Type colors   | `src/lib/design-tokens.ts`   | 18 Pokemon type hex colors  |
| Sprite URLs   | `src/lib/sprites.ts`         | `getSpriteUrl(id)`          |

## Conventions

- **ALL pages use `"use client"`** - Client-side data rendering
- **Package manager**: `bun` (not npm/pnpm)
- **Prettier**: `semi: false`, `singleQuote: true`, `trailingComma: es5`, `printWidth: 100`
- **Path alias**: `@/*` → `./src/*`
- **Tailwind**: Custom `type.*` colors + `Press Start 2P` pixel font
- **Images**: `unoptimized: true` in `next.config.ts` (required for static export)

## Anti-Patterns

- **Don't forget `public/data/` JSON files** - Build fails at runtime if data export wasn't run
- **Never commit `.next/` or `dist/`** - Build artifacts

## Commands

```bash
bun dev              # Local dev server
bun run build        # Static export to dist/
```
