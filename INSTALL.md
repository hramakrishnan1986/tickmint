# Installation

## 1. Back up the current project

Back up:

- `C:\TickMint\app\page.tsx`
- `C:\TickMint\app\dashboard\page.tsx`
- `C:\TickMint\app\layout.tsx`

## 2. Copy the package folders

Copy the contents of this package into:

`C:\TickMint\`

Allow Windows to merge folders and replace the three route files listed above.

The new component and library folders will be added automatically.

## 3. Keep the existing assets

These must already exist:

- `public\tickmint-logo-premium.svg`
- `public\tickmint-icon-premium.svg`
- `app\phase-2a-2-premium.css`
- `app\styles.css`

## 4. Build

```powershell
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
pnpm.cmd run build
```

## 5. Test

```powershell
pnpm.cmd run dev
```

Test:

1. Landing page
2. Login and signup
3. Cloud dashboard
4. Trading accounts
5. Trade add/edit/delete
6. Capital add/delete
7. Daily review
8. Analytics
9. Settings and backup
10. `/dashboard` protection

## 6. Deploy

```powershell
git add .
git commit -m "Refactor TickMint Phase 2A.3 architecture"
git push origin main
```
