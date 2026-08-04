# TickMint Phase 2A Release Checklist

1. Note the last stable Git commit.
2. Back up Supabase.
3. Run `supabase/phase-2a-final-release.sql`.
4. Run `scripts/validate-release.ps1`.
5. Complete all critical QA items.
6. Push to `main`.
7. Verify Vercel uses the same commit.
8. Test production signup, login and a disposable trade.
9. Remove disposable data.
10. Record release date, commit and known limitations.

Rollback:
```powershell
git revert <release-commit-hash>
git push origin main
```
