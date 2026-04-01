// Cloudflare Pages Function: /api/recipes
// Proxies requests to the Anthropic API so the key stays server-side.
//
// Store your API key as an environment variable in Cloudflare Pages:
//   Settings → Environment Variables → ANTHROPIC_API_KEY

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { action, query, url } = body;

    let prompt = "";

    if (action === "discover") {
      prompt = `Search the web for: "${query}"
Find 8 specific recipes from real recipe websites (allrecipes, bonappetit, seriouseats, foodnetwork, budgetbytes, etc). Return ONLY a valid JSON array, no markdown, no explanation. Each object:
{"title":"Recipe Name","description":"One short sentence","source":"Site Name","url":"https://full-url","image_url":"https://og-image-url","cook_time":"30 min"}
Use og:image or main recipe photo for image_url. If unavailable use "". Return ONLY the JSON array.`;

    } else if (action === "extract") {
      prompt = `Go to this URL and extract ONLY the recipe. Remove ALL filler: personal stories, blog text, ads, SEO content, sponsor mentions. Return ONLY valid JSON, no markdown:
{"title":"...","servings":"...","prep_time":"...","cook_time":"...","ingredients":["1 cup flour","2 eggs"],"steps":["Preheat oven to 350F.","Mix dry ingredients together."],"tips":"Any useful cooking tips, or empty string","source":"website name"}
URL: ${url}`;

    } else if (action === "rotd") {
      prompt = `Find ONE outstanding seasonal recipe for today from a real cooking website. Return ONLY valid JSON:
{"title":"...","description":"2 sentences max","source":"Site","url":"https://full-url","image_url":"https://og-image-url","cook_time":"...","tagline":"A short poetic 4-6 word tagline for this dish"}`;

    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return new Response(JSON.stringify({ error: `Anthropic API error: ${apiRes.status}`, detail: errText }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await apiRes.json();
    const textBlocks = (data.content || []).filter((b) => b.type === "text");
    const raw = textBlocks.map((b) => b.text).join("\n").replace(/```json|```/g, "").trim();

    let parsed;
    if (action === "discover") {
      const match = raw.match(/\[[\s\S]*\]/);
      parsed = match ? JSON.parse(match[0]) : [];
    } else {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": action === "rotd" ? "public, max-age=3600" : "no-store",
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
