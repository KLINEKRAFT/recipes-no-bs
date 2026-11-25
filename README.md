# Recipes with No Bullshit

Recipes stripped clean. No life stories. No ads. Just ingredients and steps.

Recipe URLs are first read from the publisher's Recipe JSON-LD, preserving the
original ingredients and instructions. Pages without usable structured data use
the existing Anthropic fallback (`ANTHROPIC_API_KEY` in Cloudflare Pages).
Publishers that block automated access can be handled with **Paste recipe text**.
Structured recipes do not require an AI key.

Run `npm install`, `npm test`, and `npm run build` to check changes.
`npm run dev` serves the frontend only; test `/api/*` with Cloudflare Pages
Functions (for example, `npx wrangler pages dev dist`). The optional shared
cookbook still requires the `DB` D1 binding and `schema.sql`.

The cookbook stores `category` and `tags` inside each recipe's JSON, so existing
D1 databases need no schema migration. Old and newly stripped recipes receive a
course category automatically; explicit categories are preserved. The grid can
be filtered by course and tag.

`data/thanksgiving-2026.json` contains 20 complete recipe cards fetched from seven
publishers, with source URLs and a Thanksgiving tag. After connecting `DB` and
deploying, run:

```sh
node scripts/seed-thanksgiving.mjs https://recipes.colinkline.com
```

The seed command updates entries by source URL and verifies all 20 are present;
it can be rerun without creating duplicates. In environments with an HTTPS proxy,
use `NODE_USE_ENV_PROXY=1` on a supported Node version.
