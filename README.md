# TickMint — Milestone 3D Public Beta Build

Combined build containing Milestones 1, 2A, 2B, 3A, 3B, 3C and 3D.

## New in Milestone 3D

- Public-beta feedback and support centre
- Supabase feedback table with Row Level Security
- Opt-in, privacy-conscious product-event tracking stored locally for the prototype
- Privacy Policy and Terms of Use routes
- Global error recovery page and custom 404 page
- Screenshot file-size and MIME-type validation
- User-facing notifications and clearer sync/error states
- Security headers through `next.config.ts`
- Robots and sitemap foundations
- Responsive consent banner and mobile launch polish
- Vercel deployment, QA, security and launch checklists
- Idempotent Supabase policy setup for easier schema reruns

## Run locally

```bat
npm install
npm run dev
```

Open `http://localhost:3000`.

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Copy `.env.example` to `.env.local`.
4. Add your project URL and anon key.
5. Restart the development server.

## Deploy

Follow `DEPLOYMENT.md`. Before a public release, replace all `example.com` URLs and placeholder support/privacy email addresses.

## Important beta limitations

- The product is a journal and analytics tool, not investment advice.
- Broker imports and direct broker sync are not included yet.
- Expiry information should not be hardcoded without an exchange-maintained source.
- The sample Terms and Privacy Policy need professional legal review before commercial launch.
- Screenshot storage remains configured as a public bucket for compatibility with the current prototype. Make it private and serve signed URLs before storing sensitive screenshots in production.
