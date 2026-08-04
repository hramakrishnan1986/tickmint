# TickMint Phase 2A Final Manual QA

## Authentication
- [ ] Signup, email verification, login, logout and password reset work
- [ ] Session persists after refresh
- [ ] `/dashboard` protects unauthenticated access

## Security
- [ ] User A cannot read/update/delete User B data
- [ ] RLS is enabled on all user-data tables
- [ ] No Supabase secret key is exposed to the browser

## Accounts, trades and capital
- [ ] Account create/edit/default/delete works
- [ ] Linked account deletion is blocked
- [ ] Trade add/edit/delete works
- [ ] Screenshot validation works
- [ ] Capital deposit/withdrawal/adjustment/delete works
- [ ] Data survives refresh and relogin

## Reviews and analytics
- [ ] Daily review saves and updates
- [ ] Win rate, profit factor and equity curve match the journal
- [ ] Expectancy, payoff ratio and maximum drawdown are plausible
- [ ] Bull/Bear, instrument and strategy totals match the journal

## Export and backup
- [ ] CSV opens correctly in Excel
- [ ] JSON backup contains current workspace data
- [ ] Print report opens and can be saved as PDF

## Stability
- [ ] Offline banner appears
- [ ] Cloud save is blocked offline
- [ ] Retry reloads after reconnection
- [ ] Rapid double-click does not create duplicate records
- [ ] Loading and error states render

## Responsive and release
- [ ] Desktop, laptop, tablet, Android and iPhone-sized layouts tested
- [ ] Keyboard focus is visible
- [ ] `pnpm.cmd run build` succeeds
- [ ] Vercel deploys the latest commit
- [ ] Production smoke test passes
