// Cloudflare Pages Function backing the public "Cookbook" — the shared
// collection of recipes that have had their bullshit stripped.
//
// Storage is a Cloudflare D1 (SQLite) database bound as `DB`. Until that
// binding exists the endpoint degrades gracefully: GET returns an empty list
// and POST reports it's not configured, so the site keeps working unchanged.
//
// One-time setup (see schema.sql):
//   npx wrangler d1 create recipes-cookbook
//   npx wrangler d1 execute recipes-cookbook --remote --file=schema.sql
//   then bind it in the Pages project: Settings → Functions → D1 bindings,
//   variable name  DB  → the recipes-cookbook database.

const json = (obj, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": cache },
  });

function slugify(s) {
  return String(s || "recipe").toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 60) || "recipe";
}

// GET /api/collection — newest stripped recipes for the cookbook grid.
export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return json({ recipes: [] }, 200, "public, max-age=30");
  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, title, source, url, cook_time, data, created_at " +
      "FROM recipes ORDER BY created_at DESC LIMIT 60"
    ).all();
    const recipes = (results || []).map(r => {
      let data = null;
      try { data = JSON.parse(r.data); } catch { /* skip malformed */ }
      return { slug: r.slug, title: r.title, source: r.source, url: r.url, cook_time: r.cook_time, created_at: r.created_at, data };
    }).filter(r => r.data);
    return json({ recipes }, 200, "public, max-age=30");
  } catch (err) {
    return json({ recipes: [], error: err.message }, 200);
  }
}

// POST /api/collection — add (or refresh) one stripped recipe. Deduped by URL
// so re-stripping the same page updates its entry instead of piling up.
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return json({ ok: false, error: "collection not configured" }, 200);
  try {
    const body = await request.json();
    const recipe = body.recipe;
    const url = (body.url || "").trim();
    if (!recipe || !recipe.title || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
      return json({ ok: false, error: "invalid recipe" }, 400);
    }
    const slug = slugify(recipe.title);
    const cook = recipe.cook_time || recipe.total_time || "";
    const now = Date.now();
    // Unique key: the source URL when present, else a slug-based fallback.
    const key = url || ("nourl:" + slug);
    await env.DB.prepare(
      "INSERT INTO recipes (slug, title, source, url, cook_time, data, created_at) " +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) " +
      "ON CONFLICT(url) DO UPDATE SET slug=?1, title=?2, source=?3, cook_time=?5, data=?6"
    ).bind(slug, recipe.title, recipe.source || "", key, cook, JSON.stringify(recipe), now).run();
    return json({ ok: true, slug });
  } catch (err) {
    return json({ ok: false, error: err.message }, 200);
  }
}
