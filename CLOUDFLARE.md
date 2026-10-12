# Deploy to Cloudflare Workers

The build already outputs a Cloudflare Worker (`dist/server/index.mjs`) plus the
static files (`dist/client`). `wrangler.jsonc` at the project root wires the two
together. Nothing else to configure.

## One-time setup

```bash
npm install
npx wrangler login   # opens Cloudflare in your browser, click "Allow"
```

## Publish

```bash
npm run deploy       # = vite build && wrangler deploy
```

The last line prints the live address, e.g. `https://noir-auto-haus.<account>.workers.dev`.

Re-run `npm run deploy` after every change.

## Point a domain at it

Cloudflare dashboard → **Workers & Pages** → `noir-auto-haus` → **Settings** →
**Domains & Routes** → **Add custom domain**.

## Notes

- `.env` holds the backend address and public key. Keep it in the project — the
  build reads it and bakes the values into the output.
- No private keys are needed: every database rule is enforced by the backend
  itself, so nothing sensitive has to be pasted into Cloudflare.
- To test the exact production output locally: `npm run build && npx wrangler dev`.
