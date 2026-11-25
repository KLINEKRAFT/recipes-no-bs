import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { structuredRecipe, fetchStructuredRecipe, recipeUrl } from '../lib/structured-recipe.js';
import { onRequestPost } from '../functions/api/recipes.js';

const recipe = {
  '@type': 'Recipe', name: 'Cake &amp; Frosting', recipeYield: ['8', '8 servings'],
  prepTime: 'PT15M', cookTime: 'PT1H20M',
  recipeIngredient: ['2 cups flour', '½ tsp salt', '1 cup cream'],
  recipeInstructions: [{ '@type': 'HowToSection', name: 'Cake', itemListElement: [
    { '@type': 'HowToStep', text: 'Bake at <b>350°F</b> for 40 minutes.' },
    { '@type': 'HowToStep', text: 'Cool &amp; frost.' },
  ] }, { '@type': 'HowToSection', itemListElement: [{ text: 'Whip cream for 3 minutes.' }] }],
};
const page = data => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
const call = (body, env = {}) => onRequestPost({ request: new Request('https://recipes.example/api/recipes', {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
}), env });
const aiRecipe = { title: 'Soup', ingredients: ['1 cup water'], steps: ['Boil for 2 minutes.'] };
const aiResponse = (result = aiRecipe) => Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(result) }] });

test('preserves ingredients, nested sections, temperatures, entities, and duration', () => {
  const result = structuredRecipe(page({ '@graph': [{ publisher: { name: 'Test Kitchen' } }, recipe] }), 'https://example.com/cake');
  assert.equal(result.title, 'Cake & Frosting');
  assert.deepEqual(result.ingredients, recipe.recipeIngredient);
  assert.deepEqual(result.steps, ['Bake at 350°F for 40 minutes.', 'Cool & frost.', 'Whip cream for 3 minutes.']);
  assert.equal(result.cook_time, '1 hr 20 min');
  assert.equal(result.servings, '8 servings');
  assert.equal(result.source, 'Test Kitchen');
});

test('skips malformed and incomplete schemas to find a complete recipe', () => {
  const html = '<script type="application/ld+json">bad json</script>' + page([{ '@type': 'Recipe', name: 'Incomplete' }, recipe]);
  assert.equal(structuredRecipe(html, 'https://example.com').title, 'Cake & Frosting');
  assert.equal(structuredRecipe('<html>No recipe</html>', 'https://example.com'), null);
});

test('rejects non-public URL forms', () => {
  for (const url of ['file:///etc/passwd', 'http://127.0.0.1', 'http://2130706433', 'http://[::1]', 'http://metadata.google.internal', 'http://localhost', 'https://user:pass@example.com', 'https://example.com:8080']) {
    assert.throws(() => recipeUrl(url));
  }
  assert.equal(recipeUrl('https://www.budgetbytes.com/pasta'), 'https://www.budgetbytes.com/pasta');
});

test('structured recipe succeeds with no AI key and no AI call', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, 'https://example.com/cake');
    return new Response(page(recipe));
  });
  const response = await call({ action: 'extract', url: 'https://example.com/cake' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result.ingredients.length, 3);
});

test('redirects cannot fetch a local address', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } });
  });
  await assert.rejects(fetchStructuredRecipe('https://example.com/cake'));
  assert.equal(calls, 1);
});

test('pasted text uses no web tools and returns a recipe', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.anthropic.com/v1/messages');
    const body = JSON.parse(options.body);
    assert.deepEqual(body.tools, []);
    assert.match(body.messages[0].content, /1 cup water/);
    return aiResponse();
  });
  const response = await call({ action: 'extract', text: 'Soup\n1 cup water\nBoil for 2 minutes.' }, { ANTHROPIC_API_KEY: 'test' });
  assert.deepEqual((await response.json()).result, aiRecipe);
});

test('blocked pages get an actionable error instead of an invalid recipe', async t => {
  t.mock.method(globalThis, 'fetch', async url => url.includes('anthropic.com') ? aiResponse({ error: 'recipe_unavailable' }) : new Response('Forbidden', { status: 403 }));
  const response = await call({ action: 'extract', url: 'https://example.com/blocked' }, { ANTHROPIC_API_KEY: 'test' });
  assert.equal(response.status, 422);
  assert.match((await response.json()).error, /Paste the recipe text/);
});

test('resumes paused server-tool turns', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    if (calls === 1) return Response.json({ stop_reason: 'pause_turn', content: [{ type: 'text', text: 'Reading' }] });
    assert.equal(JSON.parse(options.body).messages[1].role, 'assistant');
    return aiResponse();
  });
  const response = await call({ action: 'extract', text: 'Soup, 1 cup water, boil.' }, { ANTHROPIC_API_KEY: 'test' });
  assert.equal(response.status, 200);
  assert.equal(calls, 2);
});

test('rejects incomplete AI recipes and truncation', async t => {
  for (const data of [
    { stop_reason: 'end_turn', content: [{ type: 'text', text: '{"title":"Soup","ingredients":[],"steps":[]}' }] },
    { stop_reason: 'max_tokens', content: [{ type: 'text', text: JSON.stringify(aiRecipe) }] },
  ]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json(data));
    const response = await call({ action: 'extract', text: 'Soup' }, { ANTHROPIC_API_KEY: 'test' });
    assert.equal(response.status, 422);
    assert.ok((await response.json()).error);
  }
});

test('invalid URL fails before fetching; upstream credentials stay private', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('SECRET API DETAIL', { status: 401 }));
  assert.equal((await call({ action: 'extract', url: 'nonsense' })).status, 400);
  const response = await call({ action: 'extract', text: 'Soup' }, { ANTHROPIC_API_KEY: 'test' });
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /SECRET/);
});

// Source: https://www.delish.com/cooking/recipe-ideas/a51851/deviled-eggs-recipe/
test('extracts the reported Delish recipe without changing measurements or instructions', () => {
  const original = JSON.parse(readFileSync(new URL('./fixtures/delish.json', import.meta.url)));
  const result = structuredRecipe(page(original), 'https://www.delish.com/cooking/recipe-ideas/a51851/deviled-eggs-recipe/');
  assert.equal(result.title, 'Classic Deviled Eggs');
  assert.deepEqual(result.ingredients, original.recipeIngredient);
  assert.equal(result.steps.length, 3);
  assert.match(result.steps[0], /cook 12 minutes/);
  assert.equal(result.source, 'delish.com');
});
