# Deploy TickMint to Cloudflare using GitHub Connect

TickMint is configured for **Cloudflare Workers Builds** using the official OpenNext adapter for Next.js.

## 1. Test locally

```bash
npm install
npm run dev
```

For a production-like Cloudflare preview:

```bash
npm run preview
```

## 2. Create a GitHub repository

Create an empty repository named `tickmint`, then push this project:

```bash
git init
git add .
git commit -m "Prepare TickMint for Cloudflare Workers"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tickmint.git
git push -u origin main
```

## 3. Connect GitHub to Cloudflare

1. Sign in to Cloudflare.
2. Open **Workers & Pages**.
3. Select **Create application**.
4. Choose **Workers** and **Import a repository** / **Connect to Git**.
5. Authorize the **Cloudflare Workers & Pages** GitHub App.
6. Select the TickMint repository.

## 4. Build settings

Use these settings:

- **Production branch:** `main`
- **Root directory:** `/` (leave blank if the repository contains this project at its root)
- **Build command:** `npm run cf:build`
- **Deploy command:** `npx wrangler deploy`
- **Non-production branch deploy command:** `npx wrangler versions upload`
- **Node version:** `24`

The repository contains `wrangler.jsonc`, so Cloudflare should detect the Worker name and OpenNext output automatically.

## 5. Add build variables and secrets

Under **Settings → Builds → Variables and secrets**, add:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

These are public browser configuration values. Do not add a Supabase service-role key to any `NEXT_PUBLIC_` variable.

If you want demo mode only, the app can be deployed without Supabase values, but real sign-up and cloud trade storage will not work.

## 6. Deploy

Save the configuration and trigger the first deployment. Future pushes to `main` will deploy automatically. Pull requests can receive build status and preview information through the GitHub integration.

## 7. Custom domain

After the Worker deploys:

1. Open the TickMint Worker.
2. Go to **Settings → Domains & Routes**.
3. Add your custom domain.
4. Update Supabase Authentication URL settings to include the production domain and callback URLs.

## Important commands

```bash
npm run dev       # Standard Next.js local development
npm run preview   # Preview in Cloudflare workerd runtime
npm run cf:build  # Produce the OpenNext Worker bundle
npm run deploy    # Build and deploy manually to Cloudflare Workers
npm run check     # TypeScript validation
npm run build     # Standard Next.js production build
```
