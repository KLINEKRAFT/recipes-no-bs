import { useState } from "react";

const ACC = "#B5432A";

const ICONS = {
  chicken: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4c-3 0-5.5 2.5-5.5 5.5 0 2.2 1.3 4 3.2 4.9L9 18c0 .6.4 1 1 1h4c.6 0 1-.4 1-1l-.7-3.6c1.9-.9 3.2-2.7 3.2-4.9C17.5 6.5 15 4 12 4z"/><line x1="10" y1="19" x2="14" y2="19"/></svg>,
  beef: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12c0-4 3.5-7 8-7s8 3 8 7-3.5 7-8 7-8-3-8-7z"/><path d="M8 10c1-1.5 3-2 4-2s3 .5 4 2"/><circle cx="10" cy="12" r=".8" fill={c} stroke="none"/><circle cx="15" cy="11.5" r=".6" fill={c} stroke="none"/></svg>,
  pasta: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round"><path d="M3 9c3-3 6 3 9 0s6 3 9 0"/><path d="M3 14c3-3 6 3 9 0s6 3 9 0"/></svg>,
  seafood: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12c3-5 6-7 9-7s6 2 9 7c-3 5-6 7-9 7s-6-2-9-7z"/><circle cx="8.5" cy="11.5" r="1" fill={c} stroke="none"/><path d="M19 12l3-2.5M19 12l3 2.5"/></svg>,
  vegetarian: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V10"/><path d="M7 3c0 5 5 7 5 7s5-2 5-7c-2.5 0-5 2-5 4.5C12 5 9.5 3 7 3z"/></svg>,
  soup: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13h16v1.5c0 3.5-3.5 6.5-8 6.5s-8-3-8-6.5V13z"/><path d="M8 10V7"/><path d="M12 10V7"/><path d="M16 10V7"/></svg>,
  dessert: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="12" width="14" height="7" rx="1"/><path d="M8 12V9c0-2 2-4 4-4s4 2 4 4v3"/><line x1="5" y1="15" x2="19" y2="15"/><path d="M12 5V3"/></svg>,
  breakfast: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15h11v1c0 2.2-2.5 4-5.5 4S4 18.2 4 16v-1z"/><path d="M15 15h2.5c1.4 0 2.5-1.1 2.5-2.5S18.9 10 17.5 10H15"/><path d="M7 12c.3-1.5 1-2.5 1-3.5"/><path d="M10.5 12c.3-1.5 1-2.5 1-3.5"/></svg>,
  slowcooker: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10h12v8c0 1.7-2.7 3-6 3s-6-1.3-6-3v-8z"/><path d="M9 10c0-1 .5-2 .5-3.5"/><path d="M12 10c0-1 .5-2 .5-3.5"/><path d="M15 10c0-1 .5-2 .5-3.5"/><ellipse cx="12" cy="7" rx="2.5" ry=".8"/></svg>,
  asian: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round"><line x1="9" y1="3" x2="10.5" y2="14"/><line x1="15" y1="3" x2="13.5" y2="14"/><path d="M5 17c2 2.5 4.5 4 7 4s5-1.5 7-4"/><line x1="5" y1="17" x2="19" y2="17"/></svg>,
  mexican: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-2 0-3.5 3-3.5 7s1 6 2.5 8c.5.7.7 2 1 3"/><path d="M12 3c2 0 3.5 3 3.5 7s-1 6-2.5 8c-.5.7-.7 2-1 3"/><line x1="9.5" y1="9" x2="14.5" y2="9"/></svg>,
  grilling: (c="#999",s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h16"/><path d="M6 14v6"/><path d="M18 14v6"/><path d="M4 14c0-3 3.5-5.5 8-5.5S20 11 20 14"/><path d="M9 8.5c0-1.5.8-3 .8-4.5"/><path d="M12 8.5c0-1.5.8-3 .8-4.5"/><path d="M15 8.5c0-1.5.8-3 .8-4.5"/></svg>,
};

const CATEGORIES = [
  { id: "chicken", label: "Chicken", query: "best chicken dinner recipes" },
  { id: "beef", label: "Beef", query: "best beef steak recipes" },
  { id: "pasta", label: "Pasta", query: "best pasta recipes homemade" },
  { id: "seafood", label: "Seafood", query: "best seafood fish recipes" },
  { id: "vegetarian", label: "Vegetarian", query: "best vegetarian meatless recipes" },
  { id: "soup", label: "Soups", query: "best homemade soup recipes" },
  { id: "dessert", label: "Desserts", query: "best dessert baking recipes" },
  { id: "breakfast", label: "Breakfast", query: "best breakfast brunch recipes" },
  { id: "slowcooker", label: "Slow Cooker", query: "best slow cooker crockpot recipes" },
  { id: "asian", label: "Asian", query: "best asian recipes wok" },
  { id: "mexican", label: "Mexican", query: "best mexican recipes authentic" },
  { id: "grilling", label: "Grilling", query: "best grilling barbecue recipes" },
];

const PH = ["#f0ebe4","#e4eaf0","#eaf0e4","#f0e4e4","#e4f0ec","#ece4f0"];

async function apiCall(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, tools: [{ type: "web_search_20250305", name: "web_search" }], messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error("API error: " + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").replace(/```json|```/g, "").trim();
}

async function discoverRecipes(query) {
  const raw = await apiCall(`Search the web for: "${query}"\nFind 8 specific recipes from real recipe websites. Return ONLY a valid JSON array:\n[{"title":"Name","description":"One sentence","source":"Site","url":"https://url","image_url":"https://og-image","cook_time":"30 min"}]\nReturn ONLY the JSON array.`);
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("No recipes found");
  return JSON.parse(m[0]);
}

async function extractRecipe(url) {
  const raw = await apiCall(`Go to this URL and extract ONLY the recipe. Remove ALL filler. Return ONLY JSON:\n{"title":"...","servings":"...","prep_time":"...","cook_time":"...","ingredients":["..."],"steps":["..."],"tips":"...or empty","source":"site"}\nURL: ${url}`);
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Could not extract recipe");
  return JSON.parse(m[0]);
}

async function fetchRotd() {
  const raw = await apiCall(`Find ONE outstanding seasonal recipe for spring 2026 from a real cooking website. Return ONLY JSON:\n{"title":"...","description":"2 sentences max","source":"Site","url":"https://url","image_url":"https://og-image","cook_time":"...","tagline":"A short poetic 4-6 word tagline for this dish"}`);
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No recipe found");
  return JSON.parse(m[0]);
}

function hash(s) { return (s || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0); }

function Img({ src, title, h, style }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) {
    const bg = PH[hash(title) % PH.length];
    const iconKey = Object.keys(ICONS)[hash(title) % Object.keys(ICONS).length];
    return <div style={{ width: "100%", height: h, background: bg, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{ICONS[iconKey]("#ccc", 32)}</div>;
  }
  return <img src={src} alt="" onError={() => setBad(true)} style={{ width: "100%", height: h, objectFit: "cover", display: "block", ...style }} />;
}

function Loader({ text }) {
  return (
    <div style={{ padding: "40px 0" }}>
      <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: ACC, marginBottom: 16 }}>{text || "Searching..."}</p>
      <div style={{ width: 120, height: 1.5, background: "#eee", overflow: "hidden" }}>
        <div style={{ width: "50%", height: "100%", background: ACC, animation: "slide 1.4s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

function BrowseCard({ recipe, index, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ cursor: "pointer", animation: `fadeUp 0.4s ease ${index * 0.05}s both` }}>
      <div style={{ overflow: "hidden", marginBottom: 12 }}>
        <Img src={recipe.image_url} title={recipe.title} h={200}
          style={{ transition: "transform 0.5s ease", transform: hov ? "scale(1.03)" : "scale(1)" }} />
      </div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 19, color: "#111", lineHeight: 1.25, marginBottom: 4, letterSpacing: "-0.01em" }}>
        {recipe.title}
      </div>
      {recipe.description && (
        <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "#888", lineHeight: 1.45, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {recipe.description}
        </div>
      )}
      <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ccc" }}>
        {recipe.source}{recipe.cook_time ? ` \u00B7 ${recipe.cook_time}` : ""}
      </div>
    </div>
  );
}

function Detail({ recipe, onClose, loading, error, data }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", overflowY: "auto" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "40px 28px 60px", position: "relative" }}>
        <button onClick={onClose} style={{
          position: "fixed", top: 20, right: 20, background: "#fff", border: "1px solid #e0e0e0",
          width: 40, height: 40, borderRadius: 99, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
        }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>

        <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: ACC, marginBottom: 16 }}>
          {recipe.source || "Recipe"}
        </p>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 38, fontWeight: 400, color: "#111", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 24 }}>
          {(data && data.title) || recipe.title}
        </h1>

        {loading && <Loader text="Extracting recipe..." />}
        {error && <p style={{ padding: 20, background: "#fef5f3", border: "1px solid #f0d0c8", fontFamily: "var(--mono)", fontSize: 12, color: ACC }}>{error}</p>}

        {data && !loading && (
          <>
            <div style={{ display: "flex", gap: 32, paddingBottom: 24, marginBottom: 32, borderBottom: "1px solid #eee", flexWrap: "wrap" }}>
              {[["Prep", data.prep_time], ["Cook", data.cook_time], ["Serves", data.servings]].filter(m => m[1]).map(m => (
                <div key={m[0]}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "#bbb", marginBottom: 4 }}>{m[0]}</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 20, color: "#111" }}>{m[1]}</div>
                </div>
              ))}
            </div>

            <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: ACC, marginBottom: 16 }}>Ingredients</p>
            <div style={{ marginBottom: 40 }}>
              {(data.ingredients || []).map((ing, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #f5f5f5", fontFamily: "var(--sans)", fontSize: 15, color: "#333", lineHeight: 1.4 }}>{ing}</div>
              ))}
            </div>

            <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: ACC, marginBottom: 20 }}>Preparation</p>
            {(data.steps || []).map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 20, marginBottom: 24, alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--serif)", fontSize: 36, color: "#e8e4e0", lineHeight: 1, minWidth: 30 }}>{i + 1}</span>
                <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "#444", lineHeight: 1.75, margin: 0 }}>{step}</p>
              </div>
            ))}

            {data.tips && (
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #eee" }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: ACC, marginBottom: 10 }}>Cook's Notes</p>
                <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "#888", lineHeight: 1.7, fontStyle: "italic" }}>{data.tips}</p>
              </div>
            )}

            <p style={{ marginTop: 32, fontFamily: "var(--mono)", fontSize: 9, color: "#ddd", letterSpacing: "0.04em", wordBreak: "break-all" }}>{recipe.url}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [activeCat, setActiveCat] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [url, setUrl] = useState("");
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extErr, setExtErr] = useState("");
  const [rotd, setRotd] = useState(null);
  const [rotdLoad, setRotdLoad] = useState(false);

  const load = async (query, catId) => {
    setView("browse"); setActiveCat(catId);
    setLoading(true); setErr(""); setRecipes([]);
    try { setRecipes(await discoverRecipes(query)); }
    catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const open = async (recipe) => {
    setSel(recipe); setDetail(null);
    setExtracting(true); setExtErr("");
    try { setDetail(await extractRecipe(recipe.url)); }
    catch (e) { setExtErr(e.message); }
    setExtracting(false);
  };

  const doSearch = () => { if (search.trim()) { load(search.trim() + " recipes", null); setSearch(""); } };
  const doUrl = () => {
    if (!url.trim()) return;
    let h = "Recipe"; try { h = new URL(url).hostname.replace("www.",""); } catch {}
    open({ title: "Loading...", source: h, url: url.trim() }); setUrl("");
  };
  const doRotd = async () => {
    setRotdLoad(true);
    try { setRotd(await fetchRotd()); } catch {}
    setRotdLoad(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Outfit:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        :root { --serif: 'Cormorant Garamond', Georgia, serif; --sans: 'Outfit', sans-serif; --mono: 'IBM Plex Mono', monospace; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }
        @keyframes slide { 0% { transform: translateX(-150px); } 100% { transform: translateX(200px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: #ccc; }
        ::selection { background: ${ACC}18; }
      `}</style>

      {/* HEADER */}
      <header style={{ padding: "20px 32px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 16, position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)" }}>
        <div onClick={() => setView("home")} style={{ cursor: "pointer" }}>
          <span style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 300, color: "#111", letterSpacing: "-0.03em" }}>Strip & Stir</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="Search" style={{ border: "none", borderBottom: "1px solid #e5e5e5", padding: "6px 0", fontSize: 14, fontFamily: "var(--sans)", width: 130, color: "#111", outline: "none", background: "transparent" }} />
          <div style={{ width: 1, height: 16, background: "#eee", margin: "0 6px" }} />
          <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && doUrl()} placeholder="Paste URL to strip" style={{ border: "none", borderBottom: "1px solid #e5e5e5", padding: "6px 0", fontSize: 14, fontFamily: "var(--sans)", width: 160, color: "#111", outline: "none", background: "transparent" }} />
          <button onClick={doUrl} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 10, color: ACC, textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 8px" }}>Strip</button>
        </div>
      </header>

      {/* HOME */}
      {view === "home" && (
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "56px 32px 80px" }}>
          {/* Masthead */}
          <section style={{ marginBottom: 64 }}>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: 52, fontWeight: 300, color: "#111", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 12 }}>
              Recipes,<br />nothing else.
            </h1>
            <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "#999", lineHeight: 1.6, maxWidth: 400 }}>
              We find recipes across the web, strip out the life stories and ads, and give you just the ingredients and steps.
            </p>
          </section>

          {/* Recipe of the Day */}
          <section style={{ marginBottom: 64 }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: ACC, marginBottom: 20 }}>Today's Pick</p>

            {!rotd && !rotdLoad && (
              <div onClick={doRotd} style={{ cursor: "pointer", paddingBottom: 32, borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ width: "100%", height: 320, background: "#f8f6f3", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 300, color: "#ccc", marginBottom: 8 }}>Tap to reveal</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#ddd", textTransform: "uppercase", letterSpacing: "0.1em" }}>A seasonal spring recipe, stripped clean</div>
                  </div>
                </div>
              </div>
            )}
            {rotdLoad && <Loader text="Finding today's recipe..." />}
            {rotd && !rotdLoad && (
              <div onClick={() => open(rotd)} style={{ cursor: "pointer", animation: "fadeUp 0.5s ease", paddingBottom: 32, borderBottom: "1px solid #f0f0f0" }}>
                <Img src={rotd.image_url} title={rotd.title} h={360} style={{ marginBottom: 24 }} />
                {rotd.tagline && (
                  <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#bbb", marginBottom: 8 }}>{rotd.tagline}</p>
                )}
                <h2 style={{ fontFamily: "var(--serif)", fontSize: 38, fontWeight: 400, color: "#111", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 10 }}>{rotd.title}</h2>
                <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "#888", lineHeight: 1.55, marginBottom: 12, maxWidth: 500 }}>{rotd.description}</p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ccc" }}>{rotd.source} / {rotd.cook_time}</p>
              </div>
            )}
          </section>

          {/* Categories */}
          <section>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "#bbb", marginBottom: 24 }}>Browse</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              {CATEGORIES.map((cat, i) => (
                <div key={cat.id} onClick={() => load(cat.query, cat.id)}
                  style={{
                    padding: "18px 4px", cursor: "pointer",
                    borderBottom: "1px solid #f5f5f5",
                    display: "flex", alignItems: "center", gap: 14,
                    transition: "padding-left 0.2s",
                    animation: `fadeUp 0.3s ease ${i * 0.03}s both`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.paddingLeft = "8px"; }}
                  onMouseLeave={e => { e.currentTarget.style.paddingLeft = "4px"; }}>
                  {ICONS[cat.id] && ICONS[cat.id]("#bbb", 18)}
                  <span style={{ fontFamily: "var(--sans)", fontSize: 15, fontWeight: 400, color: "#333" }}>{cat.label}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* BROWSE */}
      {view === "browse" && (
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 32px 80px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid #f0f0f0", alignItems: "center" }}>
            <span onClick={() => setView("home")} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#bbb", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 8 }}>
              Home /
            </span>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => load(cat.query, cat.id)} style={{
                background: activeCat === cat.id ? "#111" : "transparent",
                color: activeCat === cat.id ? "#fff" : "#bbb",
                border: "none", padding: "4px 12px",
                fontFamily: "var(--mono)", fontSize: 10,
                textTransform: "uppercase", letterSpacing: "0.06em",
                cursor: "pointer", transition: "all 0.15s",
              }}>{cat.label}</button>
            ))}
          </div>

          {loading && <Loader />}
          {err && <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: ACC }}>{err}</p>}

          {!loading && recipes.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "32px 24px" }}>
              {recipes.map((r, i) => <BrowseCard key={i} recipe={r} index={i} onClick={() => open(r)} />)}
            </div>
          )}

          {!loading && !err && recipes.length === 0 && (
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#ddd", padding: "40px 0" }}>No recipes found.</p>
          )}
        </main>
      )}

      {/* DETAIL */}
      {sel && <Detail recipe={sel} onClose={() => { setSel(null); setDetail(null); }} loading={extracting} error={extErr} data={detail} />}
    </div>
  );
}
