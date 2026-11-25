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
