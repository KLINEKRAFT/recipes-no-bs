import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recipeMetadata, CATEGORIES } from '../lib/cookbook.js';
import { onRequestGet, onRequestPost } from '../functions/api/collection.js';
const seeds = JSON.parse(readFileSync(new URL('../data/thanksgiving-2026.json', import.meta.url)));

test('preload contains 20 complete, attributed Thanksgiving recipes across courses and sites', () => {
  assert.equal(seeds.length, 20);
  assert.equal(new Set(seeds.map(r => r.url)).size, 20);
  assert.ok(new Set(seeds.map(r => new URL(r.url).hostname)).size >= 6);
  assert.equal(new Set(seeds.map(r => r.recipe.category)).size, 6);
  for (const {url,recipe} of seeds) {
    assert.ok(url.startsWith('https://'));
    assert.ok(recipe.title && recipe.source);
    assert.ok(recipe.ingredients.length && recipe.ingredients.every(x => typeof x === 'string'));
    assert.ok(recipe.steps.length && recipe.steps.every(x => typeof x === 'string'));
    assert.ok(CATEGORIES.includes(recipe.category));
    assert.deepEqual(recipe.tags, ['Thanksgiving']);
  }
});

test('old entries receive a category; custom tags are normalized and deduplicated', () => {
  assert.equal(recipeMetadata({title:'Classic Deviled Eggs'}).category,'Appetizers');
  assert.equal(recipeMetadata({title:'Pumpkin Pie'}).category,'Desserts');
  assert.equal(recipeMetadata({title:'Turkey Gravy'}).category,'Sauces');
  assert.deepEqual(recipeMetadata({title:'Roasted carrots',category:'Sides',tags:[' Thanksgiving ',null,'Thanksgiving','']}),{category:'Sides',tags:['Thanksgiving']});
});

test('category and tags survive a cookbook save and reload without schema changes', async () => {
  let values;
  const DB={prepare:()=>({bind:(...args)=>{values=args;return {run:async()=>({success:true})}},all:async()=>({results:[{slug:values[0],title:values[1],source:values[2],url:values[3],cook_time:values[4],data:values[5],created_at:values[6]}]})})};
  const entry=seeds[0];
  const request=new Request('https://example.com/api/collection',{method:'POST',body:JSON.stringify(entry)});
  assert.equal((await (await onRequestPost({request,env:{DB}})).json()).ok,true);
  const {recipes}=await (await onRequestGet({env:{DB}})).json();
  assert.equal(recipes[0].category,entry.recipe.category);
  assert.deepEqual(recipes[0].tags,['Thanksgiving']);
  assert.deepEqual(recipes[0].data.ingredients,entry.recipe.ingredients);
});
