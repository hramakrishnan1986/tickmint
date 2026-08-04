# TickMint Phase 2A.4–2A.9 One-Go Release Candidate

## Install
1. Back up `C:\TickMint`.
2. Extract this package outside the project.
3. Copy `app`, `components`, `hooks`, `lib`, `public`, `scripts`, and `supabase` into `C:\TickMint`.
4. Choose **Merge folders** and **Replace files**.
5. Keep your existing `.env.local`, `.git`, and `node_modules`.
6. Run `supabase\phase-2a-final-release.sql` in Supabase SQL Editor.
7. In VS Code PowerShell run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validate-release.ps1
pnpm.cmd run dev
```

8. Complete `MANUAL-QA-CHECKLIST.md`.
9. Deploy:

```powershell
git add .
git commit -m "Complete TickMint Phase 2A release candidate"
git push origin main
```

This is a release candidate. Phase 2A is formally complete only after the manual multi-user, mobile, persistence and production tests pass.
