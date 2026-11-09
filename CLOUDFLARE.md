# Deploy Noir Auto Haus to Cloudflare Workers

The project is configured to build a Cloudflare Worker at `dist/server/index.mjs` and static assets in `dist/client`. The root `wrangler.jsonc` connects these outputs.

## 1. Install dependencies

```bash
bun install --frozen-lockfile
```

## 2. Configure environment variables

Create a local `.env` from `.env.example` for local builds. Do not commit `.env`.

For production, configure the required values in Cloudflare Workers **Settings → Variables and Secrets**:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

The browser build also needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at build time. These are public/publishable values and are embedded in the client bundle by design.

Only configure `SUPABASE_SERVICE_ROLE_KEY` as a Worker secret if trusted server-only code actually needs the service-role client. Never use a `VITE_` prefix for it.

## 3. Build and deploy

```bash
bun run build
bunx wrangler login
bun run deploy
```

The deployed Worker name is `noir-auto-haus`, as configured in `wrangler.jsonc`.

## 4. Custom domain

In Cloudflare, open **Workers & Pages → noir-auto-haus → Settings → Domains & Routes** and add the domain.

## Operational notes

- Apply database migrations to Supabase separately; deploying the Worker does not apply SQL migrations.
- Create and configure the `vehicle-images` Supabase Storage bucket before enabling admin image uploads.
- Customer deposits are confirmed manually in the admin area. The application does not verify InstaPay transfers automatically.
