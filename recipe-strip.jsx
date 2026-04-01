import { useState, useEffect, useRef, useCallback } from “react”;

const CATEGORIES = [
{ id: “trending”, label: “Trending”, query: “best popular recipes 2026” },
{ id: “chicken”, label: “Chicken”, query: “best chicken dinner recipes” },
{ id: “beef”, label: “Beef”, query: “best beef recipes easy” },
{ id: “pasta”, label: “Pasta”, query: “best pasta recipes homemade” },
{ id: “seafood”, label: “Seafood”, query: “best seafood fish recipes” },
{ id: “vegetarian”, label: “Vegetarian”, query: “best vegetarian recipes” },
{ id: “soup”, label: “Soups”, query: “best soup recipes homemade” },
{ id: “dessert”, label: “Desserts”, query: “best dessert recipes easy” },
{ id: “breakfast”, label: “Breakfast”, query: “best breakfast brunch recipes” },
{ id: “slowcooker”, label: “Slow Cooker”, query: “best slow cooker crockpot recipes” },
{ id: “asian”, label: “Asian”, query: “best asian recipes easy” },
{ id: “mexican”, label: “Mexican”, query: “best mexican recipes authentic” },
];

async function discoverRecipes(searchQuery) {
const res = await fetch(“https://api.anthropic.com/v1/messages”, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: 1000,
tools: [{ type: “web_search_20250305”, name: “web_search” }],
messages: [
{
role: “user”,
content: `Search the web for: “${searchQuery}”

Find 8 specific recipes from real recipe websites. Return ONLY valid JSON array, no markdown, no explanation, no preamble. Each object must have:
{“title”:“Recipe Name”,“description”:“One sentence max”,“source”:“Website Name”,“url”:“https://full-url”,“image_url”:“https://direct-image-url-from-the-page”,“cook_time”:“30 min”,“category”:“main ingredient”}

CRITICAL: For image_url, find the actual recipe photo URL from the page (og:image or main recipe image). If you can’t find a real image URL, use “”.
Return ONLY the JSON array.`,
},
],
}),
});
const data = await res.json();
const textBlocks = data.content?.filter((b) => b.type === “text”) || [];
const raw = textBlocks.map((b) => b.text).join(”\n”);
const cleaned = raw.replace(/`json|`/g, “”).trim();
const match = cleaned.match(/[[\s\S]*]/);
if (!match) return [];
try {
return JSON.parse(match[0]).map((r, i) => ({ …r, _id: Date.now() + i }));
} catch {
return [];
}
}

async function extractFullRecipe(url) {
const res = await fetch(“https://api.anthropic.com/v1/messages”, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: 1000,
tools: [{ type: “web_search_20250305”, name: “web_search” }],
messages: [
{
role: “user”,
content: `Go to this exact URL and extract ONLY the recipe. Remove ALL filler: personal stories, blog text, ads, SEO paragraphs, “jump to recipe” nonsense. Return ONLY pure JSON, no markdown fences, no preamble:
{“title”:”…”,“servings”:”…”,“prep_time”:”…”,“cook_time”:”…”,“ingredients”:[“1 cup flour”,“2 eggs”],“steps”:[“Preheat oven to 350°F.”,“Mix dry ingredients.”],“tips”:“Any useful chef tips, or empty string”,“source”:“website name”,“image_url”:“main recipe photo url or empty string”}

URL: ${url}`,
},
],
}),
});
const data = await res.json();
const textBlocks = data.content?.filter((b) => b.type === “text”) || [];
const raw = textBlocks.map((b) => b.text).join(”\n”);
const cleaned = raw.replace(/`json|`/g, “”).trim();
const match = cleaned.match(/{[\s\S]*}/);
if (!match) throw new Error(“Could not extract recipe”);
return JSON.parse(match[0]);
}

/* ─── Image with fallback ─── */
function RecipeImage({ src, title, style }) {
const [failed, setFailed] = useState(false);
const colors = [”#2a2320”, “#1e2a2a”, “#2a1e28”, “#222a1e”, “#1e222a”];
const hash = (title || “”).split(””).reduce((a, c) => a + c.charCodeAt(0), 0);
const bg = colors[hash % colors.length];
const emoji = [“🍳”, “🥘”, “🍲”, “🥗”, “🍝”, “🍖”, “🥩”, “🍰”][hash % 8];

if (!src || failed) {
return (
<div
style={{
…style,
background: bg,
display: “flex”,
alignItems: “center”,
justifyContent: “center”,
fontSize: style?.height ? Math.min(Number.parseInt(style.height) || 60, 80) : 48,
}}
>
{emoji}
</div>
);
}
return (
<img
src={src}
alt={title}
style={{ …style, objectFit: “cover” }}
onError={() => setFailed(true)}
/>
);
}

/* ─── Recipe Card ─── */
function RecipeCard({ recipe, onClick }) {
const [hovered, setHovered] = useState(false);
return (
<div
onClick={onClick}
onMouseEnter={() => setHovered(true)}
onMouseLeave={() => setHovered(false)}
style={{
cursor: “pointer”,
background: “#161413”,
border: `1px solid ${hovered ? "#c45a3c" : "#2a2725"}`,
borderRadius: 3,
overflow: “hidden”,
transition: “all 0.25s ease”,
transform: hovered ? “translateY(-3px)” : “none”,
boxShadow: hovered ? “0 8px 30px rgba(196,90,60,0.15)” : “none”,
}}
>
<RecipeImage
src={recipe.image_url}
title={recipe.title}
style={{ width: “100%”, height: 180, display: “block” }}
/>
<div style={{ padding: “14px 16px 16px” }}>
<div
style={{
fontFamily: “‘Instrument Serif’, Georgia, serif”,
fontSize: 17,
fontWeight: 400,
color: “#f0ebe4”,
lineHeight: 1.25,
marginBottom: 6,
display: “-webkit-box”,
WebkitLineClamp: 2,
WebkitBoxOrient: “vertical”,
overflow: “hidden”,
}}
>
{recipe.title}
</div>
<div
style={{
fontFamily: “‘Space Mono’, ‘Courier New’, monospace”,
fontSize: 9,
textTransform: “uppercase”,
letterSpacing: “0.1em”,
color: “#6b6360”,
display: “flex”,
justifyContent: “space-between”,
alignItems: “center”,
}}
>
<span>{recipe.source}</span>
{recipe.cook_time && (
<span style={{ color: “#c45a3c” }}>{recipe.cook_time}</span>
)}
</div>
</div>
</div>
);
}

/* ─── Recipe Detail Modal ─── */
function RecipeDetail({ recipe, onClose, loading, error, recipeData }) {
return (
<div
style={{
position: “fixed”,
inset: 0,
zIndex: 1000,
background: “rgba(0,0,0,0.85)”,
backdropFilter: “blur(8px)”,
overflowY: “auto”,
animation: “fadeIn 0.25s ease”,
}}
onClick={(e) => e.target === e.currentTarget && onClose()}
>
<div
style={{
maxWidth: 720,
margin: “20px auto”,
background: “#0f0e0d”,
border: “1px solid #2a2725”,
borderRadius: 4,
minHeight: “60vh”,
position: “relative”,
}}
>
{/* Close */}
<button
onClick={onClose}
style={{
position: “sticky”,
top: 12,
float: “right”,
marginRight: 12,
marginTop: 12,
zIndex: 10,
background: “rgba(15,14,13,0.8)”,
border: “1px solid #2a2725”,
color: “#f0ebe4”,
width: 36,
height: 36,
borderRadius: 99,
cursor: “pointer”,
fontSize: 18,
display: “flex”,
alignItems: “center”,
justifyContent: “center”,
backdropFilter: “blur(4px)”,
}}
>
✕
</button>

```
    {/* Hero image */}
    {(recipe.image_url || recipeData?.image_url) && (
      <RecipeImage
        src={recipeData?.image_url || recipe.image_url}
        title={recipe.title}
        style={{
          width: "100%",
          height: 280,
          display: "block",
          borderRadius: "4px 4px 0 0",
        }}
      />
    )}

    <div style={{ padding: "28px 32px 40px" }}>
      {/* Source tag */}
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#c45a3c",
          marginBottom: 8,
        }}
      >
        {recipe.source} — stripped clean
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 34,
          fontWeight: 400,
          color: "#f0ebe4",
          margin: "0 0 8px",
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
        }}
      >
        {recipeData?.title || recipe.title}
      </h1>

      {loading && (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              color: "#c45a3c",
              animation: "pulse 1.5s infinite",
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}
          >
            EXTRACTING RECIPE...
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              color: "#4a4543",
              letterSpacing: "0.04em",
            }}
          >
            Fetching page → killing the filler → extracting the good stuff
          </div>
          <div style={{
            margin: "24px auto 0",
            width: 200,
            height: 2,
            background: "#1a1918",
            borderRadius: 1,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              background: "#c45a3c",
              borderRadius: 1,
              animation: "loading 2s ease-in-out infinite",
            }} />
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "20px",
            background: "#1a1210",
            border: "1px solid #5a2a1a",
            borderRadius: 2,
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            color: "#c45a3c",
            marginTop: 16,
          }}
        >
          {error}
        </div>
      )}

      {recipeData && !loading && (
        <>
          {/* Meta strip */}
          <div
            style={{
              display: "flex",
              gap: 24,
              padding: "16px 0",
              borderTop: "1px solid #1e1d1c",
              borderBottom: "1px solid #1e1d1c",
              marginBottom: 28,
              marginTop: 12,
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Prep", value: recipeData.prep_time },
              { label: "Cook", value: recipeData.cook_time },
              { label: "Serves", value: recipeData.servings },
            ].filter(m => m.value).map((m) => (
              <div key={m.label}>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    color: "#5a5654",
                    marginBottom: 3,
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    fontSize: 18,
                    color: "#f0ebe4",
                  }}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Two column layout */}
          <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
            {/* Ingredients */}
            <div style={{ flex: "1 1 200px", minWidth: 200 }}>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#c45a3c",
                  fontWeight: 700,
                  marginBottom: 16,
                  paddingBottom: 8,
                  borderBottom: "1px solid #1e1d1c",
                }}
              >
                Ingredients
              </div>
              {recipeData.ingredients?.map((ing, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #141312",
                    fontFamily: "'DM Sans', Helvetica, sans-serif",
                    fontSize: 14,
                    color: "#c8c0b8",
                    lineHeight: 1.4,
                  }}
                >
                  {ing}
                </div>
              ))}
            </div>

            {/* Steps */}
            <div style={{ flex: "2 1 300px", minWidth: 280 }}>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#c45a3c",
                  fontWeight: 700,
                  marginBottom: 16,
                  paddingBottom: 8,
                  borderBottom: "1px solid #1e1d1c",
                }}
              >
                Method
              </div>
              {recipeData.steps?.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: 20,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Instrument Serif', Georgia, serif",
                      fontSize: 32,
                      color: "#2a2725",
                      lineHeight: 1,
                      minWidth: 28,
                      userSelect: "none",
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    style={{
                      fontFamily: "'DM Sans', Helvetica, sans-serif",
                      fontSize: 14,
                      color: "#c8c0b8",
                      lineHeight: 1.7,
                      margin: 0,
                      paddingTop: 6,
                    }}
                  >
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {recipeData.tips && (
            <div
              style={{
                marginTop: 28,
                padding: "16px 20px",
                background: "#141312",
                border: "1px solid #1e1d1c",
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "#c45a3c",
                  marginBottom: 8,
                }}
              >
                Chef's Notes
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', Helvetica, sans-serif",
                  fontSize: 13,
                  color: "#8a8480",
                  lineHeight: 1.6,
                  fontStyle: "italic",
                }}
              >
                {recipeData.tips}
              </div>
            </div>
          )}

          {/* Source link */}
          <div
            style={{
              marginTop: 24,
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: "#3a3735",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Original: {recipe.url}
          </div>
        </>
      )}
    </div>
  </div>
</div>
```

);
}

/* ─── Main App ─── */
export default function StripAndStir() {
const [activeCategory, setActiveCategory] = useState(“trending”);
const [recipes, setRecipes] = useState([]);
const [loading, setLoading] = useState(false);
const [searchQuery, setSearchQuery] = useState(””);
const [selectedRecipe, setSelectedRecipe] = useState(null);
const [recipeData, setRecipeData] = useState(null);
const [extracting, setExtracting] = useState(false);
const [extractError, setExtractError] = useState(””);
const [customUrl, setCustomUrl] = useState(””);
const [customLoading, setCustomLoading] = useState(false);

const loadCategory = useCallback(async (catId) => {
setLoading(true);
setRecipes([]);
const cat = CATEGORIES.find((c) => c.id === catId);
const q = cat ? cat.query : `best ${catId} recipes`;
try {
const results = await discoverRecipes(q);
setRecipes(results);
} catch {
setRecipes([]);
}
setLoading(false);
}, []);

useEffect(() => {
loadCategory(“trending”);
}, [loadCategory]);

const handleCategoryClick = (catId) => {
setActiveCategory(catId);
loadCategory(catId);
};

const handleSearch = async () => {
if (!searchQuery.trim()) return;
setActiveCategory(””);
setLoading(true);
setRecipes([]);
try {
const results = await discoverRecipes(searchQuery.trim() + “ recipes”);
setRecipes(results);
} catch {
setRecipes([]);
}
setLoading(false);
};

const handleCardClick = async (recipe) => {
setSelectedRecipe(recipe);
setRecipeData(null);
setExtracting(true);
setExtractError(””);
try {
const data = await extractFullRecipe(recipe.url);
setRecipeData(data);
} catch (e) {
setExtractError(e.message || “Failed to extract recipe”);
}
setExtracting(false);
};

const handleCustomUrl = async () => {
if (!customUrl.trim()) return;
const fakeRecipe = {
title: “Loading…”,
source: new URL(customUrl).hostname.replace(“www.”, “”),
url: customUrl,
image_url: “”,
_id: Date.now(),
};
setSelectedRecipe(fakeRecipe);
setRecipeData(null);
setExtracting(true);
setExtractError(””);
try {
const data = await extractFullRecipe(customUrl.trim());
setRecipeData(data);
setSelectedRecipe((prev) => ({ …prev, title: data.title }));
} catch (e) {
setExtractError(e.message || “Failed to extract recipe”);
}
setExtracting(false);
setCustomUrl(””);
};

return (
<div
style={{
minHeight: “100vh”,
background: “#0b0a09”,
color: “#f0ebe4”,
fontFamily: “‘DM Sans’, Helvetica, sans-serif”,
}}
>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } } @keyframes loading { 0% { width: 0%; margin-left: 0; } 50% { width: 60%; margin-left: 20%; } 100% { width: 0%; margin-left: 100%; } } @keyframes stagger { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0b0a09; } ::-webkit-scrollbar-thumb { background: #2a2725; border-radius: 3px; } input::placeholder { color: #4a4543; }`}</style>

```
  {/* ─── HEADER ─── */}
  <header
    style={{
      padding: "24px 28px 20px",
      borderBottom: "1px solid #1a1918",
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(11,10,9,0.92)",
      backdropFilter: "blur(12px)",
    }}
  >
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 28,
              fontWeight: 400,
              color: "#f0ebe4",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            Strip & Stir
          </h1>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#c45a3c",
              marginTop: 3,
            }}
          >
            Recipes. No filler. No life stories. No ads.
          </div>
        </div>

        {/* Search + Custom URL */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              background: "#141312",
              border: "1px solid #2a2725",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search recipes..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                padding: "8px 14px",
                color: "#f0ebe4",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                width: 180,
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                background: "#c45a3c",
                border: "none",
                color: "#fff",
                padding: "8px 14px",
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Search
            </button>
          </div>

          <div
            style={{
              display: "flex",
              background: "#141312",
              border: "1px solid #2a2725",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomUrl()}
              placeholder="Paste any recipe URL..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                padding: "8px 14px",
                color: "#f0ebe4",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                width: 200,
              }}
            />
            <button
              onClick={handleCustomUrl}
              style={{
                background: "#2a2725",
                border: "none",
                color: "#c45a3c",
                padding: "8px 14px",
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              Extract
            </button>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div
        style={{
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            style={{
              background:
                activeCategory === cat.id ? "#c45a3c" : "transparent",
              color:
                activeCategory === cat.id ? "#fff" : "#6b6360",
              border: `1px solid ${activeCategory === cat.id ? "#c45a3c" : "#1e1d1c"}`,
              borderRadius: 2,
              padding: "5px 12px",
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "all 0.15s",
              fontWeight: activeCategory === cat.id ? 700 : 400,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  </header>

  {/* ─── CONTENT ─── */}
  <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 28px 60px" }}>
    {loading && (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            color: "#c45a3c",
            animation: "pulse 1.5s infinite",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Discovering recipes...
        </div>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            color: "#3a3735",
          }}
        >
          Searching the web → curating results → building your feed
        </div>
        <div style={{
          margin: "24px auto 0",
          width: 240,
          height: 2,
          background: "#1a1918",
          borderRadius: 1,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            background: "#c45a3c",
            borderRadius: 1,
            animation: "loading 2s ease-in-out infinite",
          }} />
        </div>
      </div>
    )}

    {!loading && recipes.length === 0 && (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔪</div>
        <div
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 24,
            color: "#f0ebe4",
            marginBottom: 8,
          }}
        >
          No recipes found
        </div>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            color: "#4a4543",
          }}
        >
          Try a different search or category
        </div>
      </div>
    )}

    {!loading && recipes.length > 0 && (
      <>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "#3a3735",
            marginBottom: 20,
          }}
        >
          {recipes.length} recipes found — click any to extract the clean
          version
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {recipes.map((r, i) => (
            <div
              key={r._id}
              style={{
                animation: `stagger 0.4s ease ${i * 0.06}s both`,
              }}
            >
              <RecipeCard recipe={r} onClick={() => handleCardClick(r)} />
            </div>
          ))}
        </div>
      </>
    )}
  </main>

  {/* ─── DETAIL MODAL ─── */}
  {selectedRecipe && (
    <RecipeDetail
      recipe={selectedRecipe}
      onClose={() => {
        setSelectedRecipe(null);
        setRecipeData(null);
      }}
      loading={extracting}
      error={extractError}
      recipeData={recipeData}
    />
  )}
</div>
```

);
}
