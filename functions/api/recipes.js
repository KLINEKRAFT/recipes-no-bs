export async function onRequestPost(context) {
  const { request, env } = context;
  const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { action, query, url } = body;
    let prompt = "";

    if (action === "discover") {
      prompt = `Search the web for: "${query}"
Find 8 specific recipes from real recipe websites. Return ONLY a valid JSON array, no markdown, no explanation. Each object:
{"title":"Recipe Name","description":"One short sentence","source":"Site Name","url":"https://full-url","image_url":"https://og-image-url","cook_time":"30 min"}
Return ONLY the JSON array.`;

    } else if (action === "extract") {
      prompt = `Visit this URL and extract the COMPLETE recipe: ${url}

IMPORTANT: Extract EVERY ingredient and EVERY step. Do not summarize, shorten, or skip any part of the recipe. Include ALL ingredients with their exact measurements. Include ALL steps with full detail and specific temperatures, times, and techniques.

If the recipe has multiple sections (like a cake AND frosting, or a main dish AND sauce), include ALL sections.

Remove ONLY non-recipe content: personal stories, blog text, ads, SEO filler, newsletter signups, "jump to recipe" buttons, and comments.

Return ONLY valid JSON, no markdown fences, no extra text:
{
  "title": "Full Recipe Title",
  "servings": "number or description",
  "prep_time": "time or empty string",
  "cook_time": "time or empty string",
  "total_time": "time or empty string",
  "ingredients": [
    "Section headers as **SECTION NAME** if multiple sections exist",
    "1 cup all-purpose flour",
    "2 large eggs, room temperature"
  ],
  "steps": [
    "Full detailed step with temperatures and times included.",
    "Another complete step, not shortened or summarized."
  ],
  "notes": "Any useful tips, storage instructions, or chef notes from the recipe. Empty string if none.",
  "source": "website name"
}

Return ONLY the JSON.`;

    } else if (action === "rotd") {
      prompt = `Search the web for a great seasonal recipe that's popular right now. Find ONE outstanding recipe from a real cooking website. Return ONLY valid JSON, no markdown:
{"title":"Recipe Name","description":"2 sentences max","source":"Site Name","url":"https://full-url","image_url":"https://og-image-url","cook_time":"30 min","tagline":"A short 4-6 word tagline"}`;

    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { "Content-Type": "application/json" },
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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8192,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return new Response(JSON.stringify({ error: "API error: " + apiRes.status, detail: errText }), {
        status: 502, headers: { "Content-Type": "application/json" },
      });
    }

    const data = await apiRes.json();
    if (!data.content || data.content.length === 0) {
      return new Response(JSON.stringify({ error: "Empty API response" }), {
        status: 502, headers: { "Content-Type": "application/json" },
      });
    }

    const textBlocks = data.content.filter(b => b.type === "text");
    if (textBlocks.length === 0) {
      return new Response(JSON.stringify({ error: "No text in response" }), {
        status: 502, headers: { "Content-Type": "application/json" },
      });
    }

    const raw = textBlocks.map(b => b.text).join("\n").replace(/```json|```/g, "").trim();
    let parsed;

    if (action === "discover") {
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return new Response(JSON.stringify({ error: "No recipes found" }), { status: 500, headers: { "Content-Type": "application/json" } });
      parsed = JSON.parse(match[0]);
    } else {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return new Response(JSON.stringify({ error: "Could not extract recipe" }), { status: 500, headers: { "Content-Type": "application/json" } });
      parsed = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { "Content-Type": "application/json", "Cache-Control": action === "rotd" ? "public, max-age=3600" : "no-store" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
