// Run after the Pages deployment has the DB binding. Safe to rerun: URL is unique.
// Usage: node scripts/seed-thanksgiving.mjs https://recipes.colinkline.com
import { readFile } from 'node:fs/promises';
import { recipeMetadata } from '../lib/cookbook.js';

const origin = new URL(process.argv[2] || 'http://localhost:8788');
if (!['http:', 'https:'].includes(origin.protocol)) throw new Error('Use an HTTP(S) site URL.');
const entries = JSON.parse(await readFile(new URL('../data/thanksgiving-2026.json', import.meta.url), 'utf8'));
for (const entry of entries) {
  const recipe = { ...entry.recipe, ...recipeMetadata(entry.recipe) };
  const response = await fetch(new URL('/api/collection', origin), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: entry.url, recipe }), signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(`Could not save ${recipe.title}: ${result.error || response.status}`);
  console.log(`Saved ${recipe.category}: ${recipe.title}`);
}
const response = await fetch(new URL('/api/collection', origin), { headers: { 'Cache-Control': 'no-cache' } });
const { recipes } = await response.json();
const missing = entries.filter(entry => !recipes.some(r => r.url === entry.url));
if (missing.length) throw new Error(`Missing ${missing.length} seeded recipes in the cookbook response.`);
console.log(`Verified ${entries.length} Thanksgiving recipes from ${new Set(entries.map(r => new URL(r.url).hostname)).size} sites.`);
