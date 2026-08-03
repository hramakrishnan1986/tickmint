# TickMint Supabase Authentication

Included:
- Email/password signup
- Email confirmation callback
- Login/logout
- Forgot/reset password
- Cookie sessions
- Protected `/dashboard`
- Profiles table with RLS

## Install

1. Back up `C:\TickMint`.
2. Copy this patch into the project root.
3. Run:

```powershell
pnpm.cmd add @supabase/ssr @supabase/supabase-js
```

4. Confirm `.env.local` contains your Supabase URL and publishable key.
5. In Supabase SQL Editor, run `supabase/auth-schema.sql`.
6. Test:

```powershell
pnpm.cmd run dev
```

Open `/signup`, verify the email, sign in, sign out, and test password reset.

## Important

If `app/dashboard/page.tsx` already contains your real dashboard, back it up before copying. After auth works, merge the `getUser()` guard into your existing dashboard.

Deploy:

```powershell
git add .
git commit -m "Add Supabase authentication"
git push
```
