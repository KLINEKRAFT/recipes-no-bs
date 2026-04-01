import { useState } from “react”;

const ACC = “#C4522A”;

const ICONS = {
chicken: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M15 3c2.5 0 5 2 5 5s-2 5-4 6l-1 1v3c0 1-1 2-2 2h-2c-1 0-2-1-2-2v-3l-1-1c-2-1-4-3-4-6s2.5-5 5-5"/><line x1="12" y1="18" x2="12" y2="21"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
beef: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><ellipse cx="12" cy="12" rx="9" ry="6"/><path d="M7 12c0-2 2-3.5 5-3.5s5 1.5 5 3.5"/><circle cx="9" cy="11" r="1" fill={c}/><circle cx="14" cy="10" r="0.7" fill={c}/></svg>,
pasta: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M4 16c2-2 4 2 6 0s4 2 6 0s4 2 6 0"/><path d="M4 12c2-2 4 2 6 0s4 2 6 0"/><path d="M4 8c2-2 4 2 6 0s4 2 6 0"/></svg>,
seafood: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M2 12c3-4 7-6 10-6s7 2 10 6c-3 4-7 6-10 6s-7-2-10-6z"/><circle cx="8" cy="11" r="1" fill={c}/><path d="M20 12l3-2M20 12l3 2"/></svg>,
vegetarian: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M12 22V8"/><path d="M6 3c0 6 6 8 6 8s6-2 6-8c-3 0-6 2-6 5-1-3-3-5-6-5z"/></svg>,
soup: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M3 13h18v2c0 3-4 6-9 6s-9-3-9-6v-2z"/><line x1="3" y1="13" x2="21" y2="13"/><path d="M8 9c0-1 1-2 1-3"/><path d="M12 9c0-1 1-2 1-3"/><path d="M16 9c0-1 1-2 1-3"/></svg>,
dessert: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M5 18h14"/><path d="M7 18l1-8h8l1 8"/><path d="M9 10c0-3 3-5 3-7 0 2 3 4 3 7"/></svg>,
breakfast: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M3 14h12v2c0 2-3 4-6 4s-6-2-6-4v-2z"/><path d="M15 14h2c2 0 3 1 3 2.5S19 19 17 19h-2"/><path d="M6 11c0-1 .5-2 .5-3"/><path d="M9 11c0-1 .5-2 .5-3"/></svg>,
slowcooker: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><ellipse cx="12" cy="6" rx="3" ry="1"/><path d="M5 10h14v7c0 2-3 4-7 4s-7-2-7-4v-7z"/><line x1="5" y1="10" x2="19" y2="10"/><path d="M9 7c0-1 .5-1.5.5-2.5"/><path d="M12 7c0-1 .5-1.5.5-2.5"/></svg>,
asian: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><line x1="8" y1="3" x2="10" y2="14"/><line x1="16" y1="3" x2="14" y2="14"/><path d="M4 16c2 3 5 5 8 5s6-2 8-5"/><line x1="4" y1="16" x2="20" y2="16"/></svg>,
mexican: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M12 3c-1 0-3 2-3 6s1 5 2 7c1 1 1 3 1 5"/><path d="M12 3c1 0 3 2 3 6s-1 5-2 7c-1 1-1 3-1 5"/><path d="M10 8h4"/></svg>,
grilling: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M12 21c-4 0-8-2-8-5v-2h16v2c0 3-4 5-8 5z"/><line x1="8" y1="14" x2="8" y2="21"/><line x1="16" y1="14" x2="16" y2="21"/><path d="M8 11c0-2 1-3 1-5"/><path d="M12 11c0-2 1-3 1-5"/><path d="M16 11c0-2 1-3 1-5"/></svg>,
search: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>,
arrow: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
back: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
close: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
strip: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
};

const CATEGORIES = [
{ id: “chicken”, label: “Chicken”, query: “best chicken dinner recipes” },
{ id: “beef”, label: “Beef”, query: “best beef steak recipes” },
{ id: “pasta”, label: “Pasta”, query: “best pasta recipes homemade” },
{ id: “seafood”, label: “Seafood”, query: “best seafood fish recipes” },
{ id: “vegetarian”, label: “Vegetarian”, query: “best vegetarian recipes” },
{ id: “soup”, label: “Soups”, query: “best soup recipes homemade” },
{ id: “dessert”, label: “Desserts”, query: “best dessert recipes easy” },
{ id: “breakfast”, label: “Breakfast”, query: “best breakfast brunch recipes” },
{ id: “slowcooker”, label: “Slow Cooker”, query: “best slow cooker crockpot recipes” },
{ id: “asian”, label: “Asian”, query: “best asian recipes easy” },
{ id: “mexican”, label: “Mexican”, query: “best mexican recipes authentic” },
{ id: “grilling”, label: “Grilling”, query: “best grilling barbecue recipes” },
];

const PLACEHOLDERS = [”#e8e0d8”, “#d8dde8”, “#e0e8d8”, “#e8d8d8”, “#d8e8e4”, “#e4d8e8”];

async function apiCall(prompt) {
const res = await fetch(“https://api.anthropic.com/v1/messages”, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: 1000,
tools: [{ type: “web_search_20250305”, name: “web_search” }],
messages: [{ role: “user”, content: prompt }],
}),
});
if (!res.ok) throw new Error(“API error: “ + res.status);
const data = await res.json();
if (data.error) throw new Error(data.error.message);
return (data.content || []).filter(b => b.type === “text”).map(b => b.text).join(”\n”).replace(/`json|`/g, “”).trim();
}

async function discoverRecipes(query) {
const raw = await apiCall(`Search the web for: "${query}" Find 8 specific recipes from real recipe websites (allrecipes, bonappetit, seriouseats, foodnetwork, budgetbytes, etc). Return ONLY a valid JSON array, no markdown, no explanation. Each object: {"title":"Recipe Name","description":"One short sentence","source":"Site Name","url":"https://full-url","image_url":"https://og-image-url","cook_time":"30 min"} Use og:image or main recipe photo for image_url. If unavailable use "". Return ONLY the JSON array.`);
const m = raw.match(/[[\s\S]*]/);
if (!m) throw new Error(“No recipes found”);
return JSON.parse(m[0]);
}

async function extractRecipe(url) {
const raw = await apiCall(`Go to this URL and extract ONLY the recipe. Remove ALL filler: personal stories, blog text, ads, SEO content, "jump to recipe" junk, sponsor mentions. Return ONLY valid JSON, no markdown: {"title":"...","servings":"...","prep_time":"...","cook_time":"...","ingredients":["1 cup flour","2 eggs"],"steps":["Preheat oven to 350F.","Mix dry ingredients together."],"tips":"Any useful cooking tips, or empty string","source":"website name"} URL: ${url}`);
const m = raw.match(/{[\s\S]*}/);
if (!m) throw new Error(“Could not extract recipe”);
return JSON.parse(m[0]);
}

async function fetchRecipeOfDay() {
const raw = await apiCall(`Search the web for a great seasonal recipe for today (March 2026 — spring). Find ONE standout recipe from a real cooking website. Return ONLY valid JSON: {"title":"Recipe Name","description":"A compelling 1-2 sentence description","source":"Site Name","url":"https://full-url","image_url":"https://og-image-url","cook_time":"30 min","why":"One sentence on why this is perfect right now"}`);
const m = raw.match(/{[\s\S]*}/);
if (!m) throw new Error(“Could not find recipe of the day”);
return JSON.parse(m[0]);
}

function hash(s) { return (s || “x”).split(””).reduce((a, c) => a + c.charCodeAt(0), 0); }

function Placeholder({ title, height }) {
const h = hash(title);
const bg = PLACEHOLDERS[h % PLACEHOLDERS.length];
const iconKeys = Object.keys(ICONS).filter(k => ![“search”,“arrow”,“back”,“close”,“strip”].includes(k));
const icon = iconKeys[h % iconKeys.length];
return (
<div style={{ width: “100%”, height, background: bg, display: “flex”, alignItems: “center”, justifyContent: “center” }}>
{ICONS[icon] && ICONS[icon]("#b0a898")}
</div>
);
}

function CardImage({ src, title, height }) {
const [failed, setFailed] = useState(false);
if (!src || failed) return <Placeholder title={title} height={height} />;
return <img src={src} alt=”” onError={() => setFailed(true)} style={{ width: “100%”, height, objectFit: “cover”, display: “block” }} />;
}

function LoadingBar() {
return (
<div style={{ padding: “48px 0”, textAlign: “left” }}>
<div style={{ fontFamily: “‘IBM Plex Mono’, monospace”, fontSize: 11, color: ACC, letterSpacing: “0.06em”, textTransform: “uppercase”, marginBottom: 14 }}>
Searching…
</div>
<div style={{ width: 180, height: 2, background: “#eee”, borderRadius: 1, overflow: “hidden” }}>
<div style={{ width: “40%”, height: “100%”, background: ACC, borderRadius: 1, animation: “slide 1.2s ease-in-out infinite” }} />
</div>
</div>
);
}

function RecipeDetail({ recipe, onClose, loading, error, data }) {
return (
<div onClick={e => e.target === e.currentTarget && onClose()} style={{
position: “fixed”, inset: 0, zIndex: 1000,
background: “rgba(255,255,255,0.92)”, backdropFilter: “blur(12px)”,
overflowY: “auto”, padding: “20px”,
}}>
<div style={{ maxWidth: 640, margin: “0 auto”, background: “#fff”, border: “1px solid #e5e5e5”, minHeight: 300, position: “relative” }}>
<button onClick={onClose} style={{
position: “absolute”, top: 16, right: 16, zIndex: 10,
background: “#fff”, border: “1px solid #ddd”,
width: 36, height: 36, borderRadius: 99, cursor: “pointer”,
display: “flex”, alignItems: “center”, justifyContent: “center”,
}}>{ICONS.close(”#333”)}</button>

```
    <div style={{ padding: "32px 32px 40px" }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: ACC, marginBottom: 10 }}>
        {recipe.source || "Recipe"} / Stripped
      </div>

      <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 30, fontWeight: 400, color: "#111", margin: "0 0 20px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
        {(data && data.title) || recipe.title}
      </h2>

      {loading && <LoadingBar />}

      {error && (
        <div style={{ padding: 16, background: "#fef5f3", border: "1px solid #f0d0c8", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: ACC }}>{error}</div>
      )}

      {data && !loading && (
        <>
          <div style={{ display: "flex", gap: 28, padding: "16px 0", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", marginBottom: 28, flexWrap: "wrap" }}>
            {[["Prep", data.prep_time], ["Cook", data.cook_time], ["Serves", data.servings]].filter(m => m[1]).map(m => (
              <div key={m[0]}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "#999", marginBottom: 3 }}>{m[0]}</div>
                <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, color: "#111" }}>{m[1]}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px", minWidth: 170 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: ACC, fontWeight: 600, marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #eee" }}>
                Ingredients
              </div>
              {(data.ingredients || []).map((ing, i) => (
                <div key={i} style={{ padding: "7px 0", borderBottom: "1px solid #f5f5f5", fontFamily: "'Outfit', sans-serif", fontSize: 14, color: "#333", lineHeight: 1.4 }}>{ing}</div>
              ))}
            </div>
            <div style={{ flex: "2 1 280px", minWidth: 240 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: ACC, fontWeight: 600, marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #eee" }}>
                Method
              </div>
              {(data.steps || []).map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 26, color: "#ddd", lineHeight: 1, minWidth: 24 }}>{i + 1}</span>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: "#333", lineHeight: 1.7, margin: 0, paddingTop: 5 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>

          {data.tips && (
            <div style={{ marginTop: 28, padding: "16px 20px", background: "#faf8f6", border: "1px solid #eee" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: ACC, marginBottom: 6 }}>Notes</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#666", lineHeight: 1.6, fontStyle: "italic" }}>{data.tips}</div>
            </div>
          )}

          <div style={{ marginTop: 20, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#ccc", letterSpacing: "0.04em", wordBreak: "break-all" }}>
            {recipe.url}
          </div>
        </>
      )}
    </div>
  </div>
</div>
```

);
}

function BrowseCard({ recipe, index, onClick }) {
const [hov, setHov] = useState(false);
return (
<div
onClick={onClick}
onMouseEnter={() => setHov(true)}
onMouseLeave={() => setHov(false)}
style={{
cursor: “pointer”, border: `1px solid ${hov ? ACC : "#eee"}`,
overflow: “hidden”, transition: “all 0.2s”,
transform: hov ? “translateY(-2px)” : “none”,
boxShadow: hov ? `0 4px 16px ${ACC}15` : “none”,
animation: `fadeUp 0.3s ease ${index * 0.04}s both`,
}}>
<CardImage src={recipe.image_url} title={recipe.title} height={170} />
<div style={{ padding: “12px 14px 14px” }}>
<div style={{ fontFamily: “‘Newsreader’, Georgia, serif”, fontSize: 16, color: “#111”, lineHeight: 1.25, marginBottom: 6, display: “-webkit-box”, WebkitLineClamp: 2, WebkitBoxOrient: “vertical”, overflow: “hidden” }}>{recipe.title}</div>
<div style={{ fontFamily: “‘IBM Plex Mono’, monospace”, fontSize: 9, textTransform: “uppercase”, letterSpacing: “0.08em”, color: “#bbb”, display: “flex”, justifyContent: “space-between” }}>
<span>{recipe.source}</span>
{recipe.cook_time && <span style={{ color: ACC }}>{recipe.cook_time}</span>}
</div>
</div>
</div>
);
}

export default function StripAndStir() {
const [view, setView] = useState(“home”);
const [activeCat, setActiveCat] = useState(null);
const [recipes, setRecipes] = useState([]);
const [loading, setLoading] = useState(false);
const [loadError, setLoadError] = useState(””);
const [searchInput, setSearchInput] = useState(””);
const [customUrl, setCustomUrl] = useState(””);
const [selected, setSelected] = useState(null);
const [recipeData, setRecipeData] = useState(null);
const [extracting, setExtracting] = useState(false);
const [extractError, setExtractError] = useState(””);
const [rotd, setRotd] = useState(null);
const [rotdLoading, setRotdLoading] = useState(false);

const loadCategory = async (catId) => {
const cat = CATEGORIES.find(c => c.id === catId);
setView(“browse”);
setActiveCat(catId);
setLoading(true);
setLoadError(””);
setRecipes([]);
try {
setRecipes(await discoverRecipes(cat.query));
} catch (e) { setLoadError(e.message); }
setLoading(false);
};

const doSearch = () => {
if (!searchInput.trim()) return;
setView(“browse”);
setActiveCat(null);
setLoading(true);
setLoadError(””);
setRecipes([]);
discoverRecipes(searchInput.trim() + “ recipes”)
.then(r => setRecipes(r))
.catch(e => setLoadError(e.message))
.finally(() => setLoading(false));
setSearchInput(””);
};

const openRecipe = async (recipe) => {
setSelected(recipe);
setRecipeData(null);
setExtracting(true);
setExtractError(””);
try {
const d = await extractRecipe(recipe.url);
setRecipeData(d);
} catch (e) { setExtractError(e.message); }
setExtracting(false);
};

const doStripUrl = async () => {
if (!customUrl.trim()) return;
let host = “Recipe”;
try { host = new URL(customUrl).hostname.replace(“www.”, “”); } catch {}
const r = { title: “Extracting…”, source: host, url: customUrl.trim() };
setCustomUrl(””);
openRecipe(r);
};

const loadRotd = async () => {
setRotdLoading(true);
try {
setRotd(await fetchRecipeOfDay());
} catch {}
setRotdLoading(false);
};

return (
<div style={{ minHeight: “100vh”, background: “#fff”, color: “#111”, fontFamily: “‘Outfit’, ‘Helvetica Neue’, sans-serif” }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&family=Outfit:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } @keyframes slide { 0% { transform: translateX(-200px); } 100% { transform: translateX(300px); } } @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } input::placeholder { color: #bbb; } ::selection { background: ${ACC}22; }`}</style>

```
  {/* ── HEADER ── */}
  <header style={{ padding: "18px 28px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)" }}>
    <div onClick={() => setView("home")} style={{ cursor: "pointer" }}>
      <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 22, fontWeight: 400, color: "#111", letterSpacing: "-0.02em" }}>Strip & Stir</span>
    </div>
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e5e5", overflow: "hidden" }}>
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="Search recipes" style={{ border: "none", outline: "none", padding: "8px 14px", fontSize: 13, fontFamily: "'Outfit', sans-serif", width: 150, color: "#111", background: "transparent" }} />
        <button onClick={doSearch} style={{ background: "transparent", border: "none", borderLeft: "1px solid #e5e5e5", padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center" }}>{ICONS.search("#999")}</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e5e5", overflow: "hidden" }}>
        <input value={customUrl} onChange={e => setCustomUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && doStripUrl()} placeholder="Paste any URL" style={{ border: "none", outline: "none", padding: "8px 14px", fontSize: 13, fontFamily: "'Outfit', sans-serif", width: 140, color: "#111", background: "transparent" }} />
        <button onClick={doStripUrl} style={{ background: "transparent", border: "none", borderLeft: "1px solid #e5e5e5", padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center" }}>{ICONS.strip(ACC)}</button>
      </div>
    </div>
  </header>

  {/* ── HOME ── */}
  {view === "home" && (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 28px 60px" }}>
      {/* Hero / Recipe of the Day */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: ACC, marginBottom: 12 }}>
          Recipe of the Day
        </div>
        {!rotd && !rotdLoading && (
          <div style={{ border: "1px solid #eee", padding: "48px 32px", background: "#faf9f7", cursor: "pointer" }} onClick={loadRotd}>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 28, fontWeight: 300, color: "#111", marginBottom: 8, letterSpacing: "-0.01em" }}>
              Discover today's pick
            </div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: "#999", marginBottom: 20 }}>
              We'll search for a great seasonal recipe and strip it clean for you.
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACC, textTransform: "uppercase", letterSpacing: "0.08em", display: "inline-flex", alignItems: "center", gap: 6 }}>
              Reveal {ICONS.arrow(ACC)}
            </span>
          </div>
        )}
        {rotdLoading && (
          <div style={{ border: "1px solid #eee", padding: "48px 32px", background: "#faf9f7" }}>
            <LoadingBar />
          </div>
        )}
        {rotd && !rotdLoading && (
          <div style={{ border: "1px solid #eee", overflow: "hidden", cursor: "pointer", animation: "fadeUp 0.4s ease" }} onClick={() => openRecipe(rotd)}>
            <CardImage src={rotd.image_url} title={rotd.title} height={280} />
            <div style={{ padding: "24px 28px" }}>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 26, fontWeight: 400, color: "#111", marginBottom: 6, lineHeight: 1.2 }}>{rotd.title}</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: "#666", marginBottom: 10, lineHeight: 1.5 }}>{rotd.description}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.08em" }}>{rotd.source} / {rotd.cook_time}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: ACC, textTransform: "uppercase", letterSpacing: "0.08em", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Read clean {ICONS.arrow(ACC)}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Categories */}
      <section>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "#999", marginBottom: 16 }}>
          Browse by Category
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 1, border: "1px solid #eee" }}>
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.id}
              onClick={() => loadCategory(cat.id)}
              style={{
                padding: "20px 20px",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 14,
                background: "#fff",
                borderBottom: "1px solid #f5f5f5",
                borderRight: "1px solid #f5f5f5",
                transition: "background 0.15s",
                animation: `fadeUp 0.3s ease ${i * 0.03}s both`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#faf9f7"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              {ICONS[cat.id] && ICONS[cat.id]("#999")}
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500, color: "#333" }}>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )}

  {/* ── BROWSE ── */}
  {view === "browse" && (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #eee", alignItems: "center" }}>
        <button onClick={() => setView("home")} style={{ background: "transparent", border: "1px solid #e5e5e5", padding: "5px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {ICONS.back("#999")} Home
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => loadCategory(cat.id)} style={{
            background: activeCat === cat.id ? ACC : "transparent",
            color: activeCat === cat.id ? "#fff" : "#999",
            border: `1px solid ${activeCat === cat.id ? ACC : "#e5e5e5"}`,
            padding: "5px 12px",
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
            textTransform: "uppercase", letterSpacing: "0.06em",
            cursor: "pointer", transition: "all 0.15s",
          }}>{cat.label}</button>
        ))}
      </div>

      {loading && <LoadingBar />}

      {loadError && (
        <div style={{ padding: 20, background: "#fef5f3", border: "1px solid #f0d0c8", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: ACC }}>{loadError}</div>
      )}

      {!loading && recipes.length > 0 && (
        <>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#ccc", marginBottom: 16 }}>
            {recipes.length} recipes / tap to strip and read
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {recipes.map((r, i) => (
              <BrowseCard key={i} recipe={r} index={i} onClick={() => openRecipe(r)} />
            ))}
          </div>
        </>
      )}

      {!loading && !loadError && recipes.length === 0 && (
        <div style={{ padding: "48px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#ccc" }}>No recipes found.</div>
      )}
    </main>
  )}

  {/* ── MODAL ── */}
  {selected && (
    <RecipeDetail
      recipe={selected}
      onClose={() => { setSelected(null); setRecipeData(null); }}
      loading={extracting}
      error={extractError}
      data={recipeData}
    />
  )}
</div>
```

);
}
