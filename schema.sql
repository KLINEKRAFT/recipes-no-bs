-- Cloudflare D1 schema for the public Cookbook (the shared collection of
-- recipes that got their bullshit stripped). Apply once:
--
--   npx wrangler d1 create recipes-cookbook
--   npx wrangler d1 execute recipes-cookbook --remote --file=schema.sql
--
-- Then bind the database to the Pages project as variable name `DB`
-- (Cloudflare dashboard → Pages → recipes-no-bs → Settings → Functions → D1
-- database bindings).

CREATE TABLE IF NOT EXISTS recipes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT,
  title       TEXT NOT NULL,
  source      TEXT,
  url         TEXT UNIQUE,          -- dedup key; re-stripping a URL updates its row
  cook_time   TEXT,
  data        TEXT NOT NULL,        -- full stripped recipe as JSON
  created_at  INTEGER NOT NULL      -- epoch ms
);

CREATE INDEX IF NOT EXISTS idx_recipes_created ON recipes(created_at DESC);
