# Deploy TickMint to Vercel

## 1. Prepare the project

- Replace `TickMint` if you finalise another brand.
- Replace `https://example.com` in `app/robots.ts` and `app/sitemap.ts`.
- Replace `support@example.com` and `privacy@example.com`.
- Review Privacy Policy and Terms with a qualified professional.
- Create a production Supabase project and run `supabase/schema.sql`.

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "TickMint public beta"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Do not commit `.env.local`.

## 3. Import into Vercel

1. Sign in to Vercel.
2. Choose **Add New → Project**.
3. Import the GitHub repository.
4. Framework should be detected as Next.js.
5. Add these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Deploy.

## 4. Configure Supabase URLs

In Supabase Authentication URL configuration:

- Set **Site URL** to the Vercel production URL.
- Add the production URL and local URL to **Redirect URLs**.
- Keep `http://localhost:3000` for local testing.

## 5. Add your domain

Add the domain in Vercel, then update:

- Supabase Site URL and redirects
- `robots.ts`
- `sitemap.ts`
- email links
- legal documents

## 6. Smoke test after deployment

- Create and verify a new account.
- Log in and log out.
- Reset password.
- Add two different user accounts and confirm they cannot see each other's records.
- Add, edit and delete a trade.
- Upload a permitted screenshot under 5 MB.
- Reject a file over 5 MB and an unsupported format.
- Add an account and capital entry.
- Complete a daily review.
- Submit feedback.
- Test mobile navigation.
- Open `/privacy`, `/terms` and an invalid URL.
