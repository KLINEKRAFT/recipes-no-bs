// Cloudflare Pages Function: /api/recipes
// Proxies requests to the Anthropic API so the key stays server-side.

export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body = await request.json();
    const { action, query, url } = body;

    let prompt = "";

    if (action === "discover") {
      prompt = `Search the web for: "${query}"
Find 8 specific recipes from real recipe websites (allrecipes, bonappetit, seriouseats, foodnetwork, budgetbytes, etc). Return ONLY a valid JSON array, no markdown, no explanation, no preamble. Each object must have exactly these fields:
{"title":"Recipe Name","description":"One short sentence","source":"Site Name","url":"https://full-url","image_url":"https://og-image-url","cook_time":"30 min"}
Use og:image or main recipe photo for image_url. If unavailable use "". Return ONLY the JSON array.`;

    } else if (action === "extract") {
      prompt = `Go to this exact URL: ${url}

Extract ONLY the recipe from that page. Remove ALL filler: personal stories, blog text, ads, SEO content, sponsor mentions, "jump to recipe" text, newsletter signup text, and any other non-recipe content.

Return ONLY valid JSON with no markdown fences, no preamble, no explanation before or after. The JSON must have exactly this structure:
{"title":"Recipe Title","servings":"4","prep_time":"15 min","cook_time":"30 min","ingredients":["1 cup flour","2 large eggs","1/2 tsp salt"],"steps":["Preheat oven to 350F.","Mix the dry ingredients together in a large bowl.","Add wet ingredients and stir until combined."],"tips":"Any useful cooking tips from the recipe, or empty string if none","source":"website name"}

Return ONLY the JSON object, nothing else.`;

    } else if (action === "rotd") {
      prompt = `Search the web for a great seasonal recipe that's popular right now. Find ONE outstanding recipe from a real cooking website. Return ONLY valid JSON, no markdown, no preamble:
{"title":"Recipe Name","description":"2 sentences max describing the dish","source":"Site Name","url":"https://full-url","image_url":"https://og-image-url","cook_time":"30 min","tagline":"A short 4-6 word tagline"}`;

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
        max_tokens: 4096,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return new Response(JSON.stringify({ error: "API error: " + apiRes.status, detail: errText }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await apiRes.json();

    // Handle case where stop_reason is "end_turn" but no text blocks
    if (!data.content || data.content.length === 0) {
      return new Response(JSON.stringify({ error: "No response from API" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const textBlocks = data.content.filter((b) => b.type === "text");

    if (textBlocks.length === 0) {
      return new Response(JSON.stringify({ error: "No text in API response. The model may still be processing." }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const raw = textBlocks.map((b) => b.text).join("\n").replace(/```json|```/g, "").trim();

    let parsed;
    if (action === "discover") {
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) {
        return new Response(JSON.stringify({ error: "Could not find recipes in response" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      parsed = JSON.parse(match[0]);
    } else {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(JSON.stringify({ error: "Could not extract recipe data" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      parsed = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": action === "rotd" ? "public, max-age=3600" : "no-store",
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
