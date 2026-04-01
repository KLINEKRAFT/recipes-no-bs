import { useState, useEffect, useRef } from "react";

const ACC = "#6ea4c4";
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', 'Courier New', monospace";

const CATEGORIES = [
  { id: "popular", label: "Popular", query: "most popular recipes right now" },
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
  { id: "healthy", label: "Healthy", query: "best healthy clean eating recipes" },
  { id: "quick", label: "Under 30 Min", query: "best quick easy recipes under 30 minutes" },
];

const PH = ["#f0ebe4","#e4eaf0","#eaf0e4","#f0e4e4","#e4f0ec","#ece4f0"];

async function apiPost(body) {
  const res = await fetch("/api/recipes", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

function hash(s) { return (s||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0); }

function Img({ src, title, h, style }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) {
    const bg = PH[hash(title) % PH.length];
    return <div style={{ width:"100%", height:h, background:bg, ...style }} />;
  }
  return <img src={src} alt="" onError={()=>setBad(true)} style={{ width:"100%", height:h, objectFit:"cover", display:"block", ...style }} />;
}

function Skeleton({ h }) {
  return <div style={{ width:"100%", height:h, background:"#f5f3f0", animation:"shimmer 1.5s infinite" }} />;
}

function Loader({ text }) {
  return (
    <div style={{ padding:"32px 0" }}>
      <p style={{ fontFamily:MONO, fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em", color:ACC, marginBottom:14 }}>{text||"Loading..."}</p>
      <div style={{ width:100, height:2, background:"#eee", overflow:"hidden", borderRadius:1 }}>
        <div style={{ width:"50%", height:"100%", background:ACC, animation:"slide 1.4s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

function printRecipe(data, recipe) {
  const w = window.open("","_blank");
  const meta = [data.prep_time&&"Prep: "+data.prep_time, data.cook_time&&"Cook: "+data.cook_time, data.servings&&"Serves: "+data.servings].filter(Boolean).join(" / ");
  w.document.write(`<!DOCTYPE html><html><head><title>${data.title}</title><style>body{font-family:'Helvetica Neue',Helvetica,sans-serif;max-width:580px;margin:40px auto;padding:0 20px;color:#111}h1{font-size:26px;font-weight:600;text-transform:uppercase;letter-spacing:-0.02em;margin-bottom:6px}.meta{font-size:11px;color:#999;margin-bottom:28px;text-transform:uppercase;letter-spacing:0.08em;font-family:'Courier New',monospace}h2{font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#6ea4c4;margin:28px 0 14px;font-family:'Courier New',monospace;font-weight:600}.ing{padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:14px}.step{display:flex;gap:14px;margin-bottom:16px}.sn{font-size:11px;color:#bbb;min-width:20px;font-family:'Courier New',monospace;padding-top:2px}.st{font-size:14px;line-height:1.65}.notes{margin-top:28px;padding:14px;background:#f8f7f5;font-size:13px;color:#888;line-height:1.5}.src{margin-top:24px;font-size:8px;color:#ddd;font-family:'Courier New',monospace;word-break:break-all}</style></head><body><h1>${data.title}</h1><div class="meta">${meta}</div><h2>Ingredients</h2>${(data.ingredients||[]).map(i=>'<div class="ing">'+i+'</div>').join("")}<h2>Preparation</h2>${(data.steps||[]).map((s,i)=>'<div class="step"><span class="sn">'+(i+1).toString().padStart(2,"0")+'</span><span class="st">'+s+'</span></div>').join("")}${data.tips?'<div class="notes">'+data.tips+'</div>':""}<div class="src">${recipe.url||""}</div></body></html>`);
  w.document.close(); w.focus(); w.print();
}

function BrowseCard({ recipe, index, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ cursor:"pointer", animation:`fadeUp 0.35s ease ${index*0.04}s both` }}>
      <div style={{ overflow:"hidden", marginBottom:10 }}>
        <Img src={recipe.image_url} title={recipe.title} h={190} style={{ transition:"transform 0.5s ease", transform:hov?"scale(1.04)":"scale(1)" }} />
      </div>
      <div style={{ fontFamily:FONT, fontSize:15, fontWeight:600, color:"#111", lineHeight:1.25, marginBottom:3, textTransform:"uppercase", letterSpacing:"-0.01em",
        display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{recipe.title}</div>
      {recipe.description && <div style={{ fontFamily:FONT, fontSize:12, fontWeight:300, color:"#999", lineHeight:1.4, marginBottom:4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{recipe.description}</div>}
      <div style={{ fontFamily:MONO, fontSize:8, textTransform:"uppercase", letterSpacing:"0.08em", color:"#ccc" }}>
        {recipe.source}{recipe.cook_time?` \u00B7 ${recipe.cook_time}`:""}
      </div>
    </div>
  );
}

function Detail({ recipe, onClose, loading, error, data }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(255,255,255,0.96)", backdropFilter:"blur(16px)", overflowY:"auto" }}>
      <div style={{ maxWidth:600, margin:"0 auto", padding:"36px 28px 60px", position:"relative" }}>
        <button onClick={onClose} style={{ position:"fixed", top:16, right:16, background:"#fff", border:"1px solid #eee", width:36, height:36, borderRadius:99, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <p style={{ fontFamily:MONO, fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:ACC, marginBottom:14 }}>{recipe.source||"Recipe"}</p>
        <h1 style={{ fontFamily:FONT, fontSize:30, fontWeight:700, color:"#111", lineHeight:1.1, letterSpacing:"-0.02em", textTransform:"uppercase", marginBottom:20 }}>{(data&&data.title)||recipe.title}</h1>
        {loading&&<Loader text="Stripping the bullshit..." />}
        {error&&<p style={{ padding:16, background:"#fef5f3", border:"1px solid #e8d8d4", fontFamily:MONO, fontSize:11, color:"#c44" }}>{error}</p>}
        {data&&!loading&&(<>
          <div style={{ display:"flex", gap:28, paddingBottom:20, marginBottom:20, borderBottom:"1px solid #f0f0f0", flexWrap:"wrap" }}>
            {[["Prep",data.prep_time],["Cook",data.cook_time],["Serves",data.servings]].filter(m=>m[1]).map(m=>(
              <div key={m[0]}>
                <div style={{ fontFamily:MONO, fontSize:8, textTransform:"uppercase", letterSpacing:"0.14em", color:"#bbb", marginBottom:3 }}>{m[0]}</div>
                <div style={{ fontFamily:FONT, fontSize:18, fontWeight:600, color:"#111" }}>{m[1]}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:24, paddingBottom:18, borderBottom:"1px solid #f0f0f0" }}>
            <button onClick={()=>printRecipe(data,recipe)} style={{ background:"none", border:"1px solid #e5e5e5", padding:"7px 14px", fontFamily:MONO, fontSize:8, textTransform:"uppercase", letterSpacing:"0.08em", cursor:"pointer", color:"#999", transition:"all 0.15s" }}
              onMouseEnter={e=>{e.target.style.color=ACC;e.target.style.borderColor=ACC}}
              onMouseLeave={e=>{e.target.style.color="#999";e.target.style.borderColor="#e5e5e5"}}>Print / Save PDF</button>
          </div>
          <p style={{ fontFamily:MONO, fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:ACC, marginBottom:14, fontWeight:500 }}>Ingredients</p>
          <div style={{ marginBottom:36 }}>
            {(data.ingredients||[]).map((ing,i)=>(
              <div key={i} style={{ padding:"9px 0", borderBottom:"1px solid #f8f8f6", fontFamily:FONT, fontSize:14, fontWeight:300, color:"#333", lineHeight:1.4 }}>{ing}</div>
            ))}
          </div>
          <p style={{ fontFamily:MONO, fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:ACC, marginBottom:16, fontWeight:500 }}>Preparation</p>
          {(data.steps||[]).map((step,i)=>(
            <div key={i} style={{ display:"flex", gap:16, marginBottom:20, alignItems:"baseline" }}>
              <span style={{ fontFamily:MONO, fontSize:10, color:"#ddd", minWidth:22 }}>{String(i+1).padStart(2,"0")}</span>
              <p style={{ fontFamily:FONT, fontSize:14, fontWeight:300, color:"#444", lineHeight:1.7, margin:0 }}>{step}</p>
            </div>
          ))}
          {data.tips&&(
            <div style={{ marginTop:28, paddingTop:20, borderTop:"1px solid #f0f0f0" }}>
              <p style={{ fontFamily:MONO, fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em", color:ACC, marginBottom:8, fontWeight:500 }}>Notes</p>
              <p style={{ fontFamily:FONT, fontSize:13, fontWeight:300, color:"#888", lineHeight:1.65 }}>{data.tips}</p>
            </div>
          )}
          <p style={{ marginTop:28, fontFamily:MONO, fontSize:8, color:"#ddd", letterSpacing:"0.04em", wordBreak:"break-all" }}>{recipe.url}</p>
        </>)}
      </div>
    </div>
  );
}

export default function App() {
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
  const [rotdLoad, setRotdLoad] = useState(true);
  const [initialRecipes, setInitialRecipes] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const catRef = useRef(null);

  // Auto-load featured recipe + random recipes in parallel
  useEffect(() => {
    const loadRotd = apiPost({ action: "rotd" }).then(setRotd).catch(()=>{}).finally(()=>setRotdLoad(false));
    const loadInitial = apiPost({ action: "discover", query: "best easy popular dinner recipes 2026" }).then(setInitialRecipes).catch(()=>{}).finally(()=>setInitialLoad(false));
    loadRotd; loadInitial;
  }, []);

  const load = async (query, catId) => {
    setActiveCat(catId);
    setLoading(true); setErr(""); setRecipes([]);
    try { setRecipes(await apiPost({ action: "discover", query })); }
    catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const open = async (recipe) => {
    setSel(recipe); setDetail(null);
    setExtracting(true); setExtErr("");
    try { setDetail(await apiPost({ action: "extract", url: recipe.url })); }
    catch (e) { setExtErr(e.message); }
    setExtracting(false);
  };

  const doSearch = () => { if (search.trim()) { load(search.trim() + " recipes", null); setSearch(""); } };
  const doUrl = () => {
    if (!url.trim()) return;
    let h = "Recipe"; try { h = new URL(url).hostname.replace("www.",""); } catch {}
    open({ title: "Loading...", source: h, url: url.trim() }); setUrl("");
  };

  const displayRecipes = activeCat ? recipes : initialRecipes;
  const showGrid = activeCat ? !loading && recipes.length > 0 : !initialLoad && initialRecipes.length > 0;

  return (
    <div style={{ minHeight:"100vh", background:"#fff", color:"#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#fff; }
        @keyframes slide { 0%{transform:translateX(-120px)} 100%{transform:translateX(180px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{opacity:0.6} 50%{opacity:0.3} 100%{opacity:0.6} }
        input::placeholder { color:#ccc; }
        ::selection { background:rgba(110,164,196,0.2); }
        .cat-scroll::-webkit-scrollbar { display:none; }
      `}</style>

      {/* HEADER */}
      <header style={{ padding:"14px 24px", borderBottom:"1px solid #f0f0f0", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, position:"sticky", top:0, zIndex:100, background:"rgba(255,255,255,0.97)", backdropFilter:"blur(10px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <a href="https://colinkline.com" style={{ textDecoration:"none", fontFamily:FONT, fontSize:11, fontWeight:600, color:"#ccc", textTransform:"uppercase", letterSpacing:"0.06em", transition:"color 0.2s" }}
            onMouseEnter={e=>e.target.style.color=ACC} onMouseLeave={e=>e.target.style.color="#ccc"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:4}}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
          </a>
          <div style={{ width:1, height:14, background:"#eee" }} />
          <span style={{ fontFamily:FONT, fontSize:16, fontWeight:700, color:"#111", textTransform:"uppercase", letterSpacing:"-0.01em" }}>Recipes with No Bullshit</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="Search"
            style={{ border:"none", borderBottom:"1px solid #eee", padding:"5px 0", fontSize:13, fontFamily:FONT, width:120, color:"#111", outline:"none", background:"transparent" }} />
          <input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doUrl()} placeholder="Paste URL"
            style={{ border:"none", borderBottom:"1px solid #eee", padding:"5px 0", fontSize:13, fontFamily:FONT, width:120, color:"#111", outline:"none", background:"transparent" }} />
          <button onClick={doUrl} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:MONO, fontSize:9, color:ACC, textTransform:"uppercase", letterSpacing:"0.06em", padding:"5px 6px", fontWeight:600 }}>Strip</button>
        </div>
      </header>

      {/* CATEGORY BAR */}
      <div ref={catRef} className="cat-scroll" style={{ padding:"10px 24px", borderBottom:"1px solid #f8f8f8", display:"flex", gap:6, overflowX:"auto", scrollBehavior:"smooth", msOverflowStyle:"none", scrollbarWidth:"none" }}>
        <button onClick={()=>{setActiveCat(null);setRecipes([])}} style={{
          background:!activeCat?"#111":"transparent", color:!activeCat?"#fff":"#bbb",
          border:"none", padding:"5px 14px", fontFamily:MONO, fontSize:8,
          textTransform:"uppercase", letterSpacing:"0.06em", cursor:"pointer",
          whiteSpace:"nowrap", flexShrink:0, transition:"all 0.15s",
        }}>Home</button>
        {CATEGORIES.map(cat=>(
          <button key={cat.id} onClick={()=>load(cat.query,cat.id)} style={{
            background:activeCat===cat.id?"#111":"transparent",
            color:activeCat===cat.id?"#fff":"#bbb",
            border:"none", padding:"5px 14px", fontFamily:MONO, fontSize:8,
            textTransform:"uppercase", letterSpacing:"0.06em", cursor:"pointer",
            whiteSpace:"nowrap", flexShrink:0, transition:"all 0.15s",
          }}>{cat.label}</button>
        ))}
      </div>

      <main style={{ maxWidth:960, margin:"0 auto", padding:"28px 24px 80px" }}>
        {/* FEATURED - only on home tab */}
        {!activeCat && (
          <section style={{ marginBottom:40 }}>
            <p style={{ fontFamily:MONO, fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:ACC, marginBottom:16, fontWeight:500 }}>Featured</p>
            {rotdLoad && <Loader text="Finding today's recipe..." />}
            {rotd && !rotdLoad && (
              <div onClick={()=>open(rotd)} style={{ cursor:"pointer", display:"flex", gap:24, flexWrap:"wrap", animation:"fadeUp 0.4s ease", paddingBottom:28, borderBottom:"1px solid #f0f0f0" }}>
                <div style={{ flex:"1 1 300px", minWidth:260 }}>
                  <Img src={rotd.image_url} title={rotd.title} h={280} />
                </div>
                <div style={{ flex:"1 1 260px", minWidth:220, display:"flex", flexDirection:"column", justifyContent:"center" }}>
                  {rotd.tagline && <p style={{ fontFamily:MONO, fontSize:8, textTransform:"uppercase", letterSpacing:"0.1em", color:"#bbb", marginBottom:8 }}>{rotd.tagline}</p>}
                  <h2 style={{ fontFamily:FONT, fontSize:26, fontWeight:700, color:"#111", lineHeight:1.1, letterSpacing:"-0.02em", textTransform:"uppercase", marginBottom:8 }}>{rotd.title}</h2>
                  <p style={{ fontFamily:FONT, fontSize:13, fontWeight:300, color:"#888", lineHeight:1.5, marginBottom:10 }}>{rotd.description}</p>
                  <p style={{ fontFamily:MONO, fontSize:8, textTransform:"uppercase", letterSpacing:"0.06em", color:"#ccc" }}>{rotd.source} / {rotd.cook_time}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* RECIPE GRID */}
        <section>
          {!activeCat && <p style={{ fontFamily:MONO, fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:"#bbb", marginBottom:16 }}>Recipes</p>}
          {activeCat && loading && <Loader />}
          {activeCat && err && <p style={{ fontFamily:MONO, fontSize:11, color:"#c44" }}>{err}</p>}
          {!activeCat && initialLoad && <Loader text="Loading recipes..." />}

          {showGrid && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(210px, 1fr))", gap:"28px 20px" }}>
              {displayRecipes.map((r,i) => <BrowseCard key={i} recipe={r} index={i} onClick={()=>open(r)} />)}
            </div>
          )}

          {activeCat && !loading && !err && recipes.length === 0 && (
            <p style={{ fontFamily:MONO, fontSize:10, color:"#ddd", padding:"32px 0" }}>No recipes found.</p>
          )}
        </section>
      </main>

      {sel && <Detail recipe={sel} onClose={()=>{setSel(null);setDetail(null)}} loading={extracting} error={extErr} data={detail} />}
    </div>
  );
}
