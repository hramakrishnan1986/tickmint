# Public Beta QA Checklist

## Authentication
- [ ] Signup succeeds
- [ ] Verification email arrives
- [ ] Login succeeds
- [ ] Invalid credentials show a useful error
- [ ] Password reset works
- [ ] Logout clears the session

## Data security
- [ ] User A cannot read or modify User B data
- [ ] Supabase RLS is enabled on every user table
- [ ] No service-role key is exposed to the browser
- [ ] `.env.local` is excluded from Git
- [ ] Uploaded-file validation works

## Journal
- [ ] Bull and Bear calculations are correct
- [ ] Charges reduce net P&L
- [ ] Options fields appear only when required
- [ ] Edit and delete work
- [ ] Empty journal state is readable
- [ ] CSV export opens correctly

## Analytics
- [ ] Equity curve updates after a trade
- [ ] Drawdown and performance metrics have sensible zero states
- [ ] Instrument and strategy filters are accurate
- [ ] Daily review completion appears in calendar

## Responsive UX
- [ ] 360 px mobile width
- [ ] Tablet landscape
- [ ] Desktop at 1366 × 768
- [ ] Forms usable with keyboard only
- [ ] Visible focus states
- [ ] No horizontal overflow

## Legal and support
- [ ] Privacy and Terms use final company details
- [ ] Trading-risk disclaimer is visible
- [ ] Feedback submission works
- [ ] Support address is monitored

## Operations
- [ ] Vercel production deployment succeeds
- [ ] Supabase redirects are correct
- [ ] Error page recovers
- [ ] Custom 404 works
- [ ] Database backups and usage alerts are configured
