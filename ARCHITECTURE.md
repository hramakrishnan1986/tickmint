# TickMint Phase 2A.3 — Architecture Refactor

This is a conservative production refactor designed to preserve the working Phase 2A.2 behaviour while removing application logic from the route file.

## New structure

```text
app/
├── layout.tsx
├── page.tsx
└── dashboard/
    └── page.tsx

components/
└── tickmint/
    ├── TickMintApp.tsx
    └── brand/
        └── TickMintLogo.tsx

lib/
└── tickmint/
    ├── format.ts
    ├── mappers.ts
    └── types.ts
```

## Improvements

- `app/page.tsx` is now a minimal route component.
- The working application moves into `components/tickmint/TickMintApp.tsx`.
- Supabase row conversion is isolated in `lib/tickmint/mappers.ts`.
- Route/view/theme types are isolated in `lib/tickmint/types.ts`.
- Currency formatting is isolated in `lib/tickmint/format.ts`.
- The logo is isolated in its own reusable component.
- The protected `/dashboard` route remains a small server component.
- Null-session checks and CRUD error handling are stabilized.
- The existing UI and cloud behaviour are preserved.

This is the safe first architectural boundary. Future screens can now be extracted from `TickMintApp.tsx` one module at a time without touching the route layer.
