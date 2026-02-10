# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

No test framework is configured.

## Architecture

REXOR is a watch e-commerce catalog built with **Next.js 15 (App Router)**, **React 19**, **Zustand 5**, and **better-sqlite3**. The UI is Russian-language, mobile-first, targeting Kazakh market (₸ currency, ru-KZ locale).

### Data Flow

- **Server-side persistence:** Products, orders, customers, brands, banners, settings → SQLite (`data/rexor.db`, WAL mode)
- **Client-side persistence:** Cart and favorites → localStorage via Zustand `persist` middleware
- **Pattern:** Stores fetch from API on first load, then use optimistic updates with 500ms debounced API calls for edits

### Key Directories

- `src/app/api/` — REST API routes (products, orders, brands, banners, settings, migrate)
- `src/app/admin/` — Admin panel pages (products, brands, orders, banners, settings)
- `src/app/catalog/`, `src/app/cart/`, `src/app/product/[id]/`, `src/app/search/` — Customer-facing pages
- `src/store/` — Zustand stores (one per domain: products, cart, orders, brands, banners, settings, favorites)
- `src/lib/db.ts` — SQLite schema, initialization, serialize/deserialize helpers
- `src/lib/types.ts` — All TypeScript interfaces
- `src/lib/parseExcel.ts` — Excel import with Russian column headers mapped to Product fields
- `src/components/` — Shared UI components (ProductCard, ProductDetail, WatchImage, BottomNav, Icons, Logo)

### Database

SQLite at `data/rexor.db`. Schema auto-creates on first `getDb()` call. Key details:
- Products matched by unique SKU (`INSERT OR REPLACE ON CONFLICT(sku)`)
- Images stored as base64 strings in a JSON array column
- Booleans stored as integers (0/1), serialized/deserialized in `db.ts`
- Orders created atomically (order insert + customer upsert + stock decrement in one transaction)

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

### Next.js Config

- Images: unoptimized (to allow base64 data URIs)
- `better-sqlite3` listed as server external package

### Styling

Tailwind CSS 4 with custom design tokens in `src/app/globals.css`:
- Fonts: Libre Baskerville (headings), Source Serif 4 (body)
- Color scale: `--color-brand-50` through `--color-brand-900` (neutral grays)
- Mobile-first layout capped at `max-w-lg` (32rem)
