import { decodeHTML } from "entities";

const text = value => decodeHTML(String(value || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

function duration(value) {
  const match = String(value || "").match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!match) return text(value);
  return [match[1] && `${match[1]} days`, match[2] && `${match[2]} hr`, match[3] && `${match[3]} min`, match[4] && `${match[4]} sec`].filter(Boolean).join(" ");
}

function steps(value) {
  if (Array.isArray(value)) return value.flatMap(steps);
  if (typeof value === "string") return [text(value)].filter(Boolean);
  if (!value || typeof value !== "object") return [];
  // Sections can contain multiple steps; keep their order and full text.
  if (value.itemListElement) return steps(value.itemListElement);
  if (value.item) return steps(value.item);
  return steps(value.text || value.name || "");
}

function* objects(value) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) { for (const item of value) yield* objects(item); return; }
  yield value;
  for (const child of Object.values(value)) yield* objects(child);
}

export function structuredRecipe(html, url) {
  const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi);
  for (const [, attrs, content] of scripts) {
    if (!/\btype\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue;
    let document;
    try { document = JSON.parse(content.trim()); } catch { continue; }
    for (const item of objects(document)) {
      if (![item["@type"]].flat().some(type => /(?:^|[/#])Recipe$/.test(String(type)))) continue;
      const ingredients = Array.isArray(item.recipeIngredient) ? item.recipeIngredient.map(text).filter(Boolean) : [];
      const instructions = steps(item.recipeInstructions);
      if (!text(item.name) || !ingredients.length || !instructions.length) continue;
      const publisher = [...objects(document)].find(node => node.publisher?.name)?.publisher;
      return {
        title: text(item.name),
        servings: text([item.recipeYield].flat().filter(Boolean).at(-1)),
        prep_time: duration(item.prepTime), cook_time: duration(item.cookTime), total_time: duration(item.totalTime),
        ingredients, steps: instructions, notes: "",
        source: text(publisher?.name) || new URL(url).hostname.replace(/^www\./, ""),
      };
    }
  }
  return null;
}

// Only public HTTP(S) pages are eligible for server-side fetching, including redirects.
export function recipeUrl(value) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (!/^https?:$/.test(url.protocol) || url.username || url.password ||
      (url.port && !["80", "443"].includes(url.port)) || !host.includes(".") ||
      /[\[\]:]/.test(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)) {
    throw new Error("Enter a public recipe website URL starting with https://.");
  }
  return url.href;
}

export async function fetchStructuredRecipe(url) {
  const signal = AbortSignal.timeout(10000);
  for (let redirects = 0; redirects < 4; redirects++) {
    const response = await fetch(recipeUrl(url), { redirect: "manual", signal, headers: { Accept: "text/html" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      url = new URL(response.headers.get("location"), url).href;
      continue;
    }
    if (!response.ok) { await response.body?.cancel(); return null; }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let html = "", bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 3_000_000) return null;
        html += decoder.decode(value, { stream: true });
      }
      html += decoder.decode();
      return structuredRecipe(html, url);
    } finally { await reader.cancel(); }
  }
  return null;
}
