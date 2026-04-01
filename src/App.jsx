import { useState } from "react";

const ACC = "#6ea4c4";
const F = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const M = "'IBM Plex Mono', 'Courier New', monospace";

async function apiPost(body) {
  const res = await fetch("/api/recipes", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error("Something went wrong. Try again."); }
  if (data.error) throw new Error(data.error);
  if (!data.result) throw new Error("Couldn't extract that one. Try a different URL.");
  return data.result;
}

function printRecipe(data, url) {
  const w = window.open("", "_blank");
  const meta = [data.prep_time && "PREP: " + data.prep_time, data.cook_time && "COOK: " + data.cook_time, data.total_time && "TOTAL: " + data.total_time, data.servings && "SERVES: " + data.servings].filter(Boolean).join("  /  ");
  const isSection = (s) => s.startsWith("**") && s.endsWith("**");
  const ingHtml = (data.ingredients || []).map(i => {
    if (isSection(i)) return '<div style="font-weight:600;text-transform:uppercase;letter-spacing:0.08em;font-size:10px;color:#6ea4c4;margin-top:16px;margin-bottom:6px;font-family:\'Courier New\',monospace">' + i.replace(/\*\*/g, "") + '</div>';
    return '<div style="padding:5px 0;border-bottom:1px solid #f0f0f0;font-size:13px">' + i + '</div>';
  }).join("");
  const stepsHtml = (data.steps || []).map((s, i) => '<div style="display:flex;gap:12px;margin-bottom:14px"><span style="font-family:\'Courier New\',monospace;font-size:10px;color:#bbb;min-width:20px;padding-top:2px">' + String(i + 1).padStart(2, "0") + '</span><span style="font-size:13px;line-height:1.6">' + s + '</span></div>').join("");
  w.document.write(`<!DOCTYPE html><html><head><title>${data.title}</title><style>@page{margin:0.6in}body{font-family:'Helvetica Neue',Helvetica,sans-serif;color:#111;margin:0;padding:0}.t{font-size:24px;font-weight:700;text-transform:uppercase;letter-spacing:-0.02em;margin-bottom:8px}.m{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;font-family:'Courier New',monospace;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #eee}.cols{display:flex;gap:32px}.cl{flex:0 0 38%}.cr{flex:1}.sl{font-family:'Courier New',monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:#6ea4c4;font-weight:600;margin-bottom:12px}.notes{margin-top:24px;padding:12px;background:#f8f7f5;font-size:12px;color:#888;line-height:1.5}</style></head><body><div class="t">${data.title}</div><div class="m">${meta}</div><div class="cols"><div class="cl"><div class="sl">Ingredients</div>${ingHtml}</div><div class="cr"><div class="sl">Method</div>${stepsHtml}</div></div>${(data.notes || data.tips) ? '<div class="notes">' + (data.notes || data.tips) + '</div>' : ""}</body></html>`);
  w.document.close(); w.focus(); w.print();
}

function Detail({ data, url, onClear }) {
  const isSection = (s) => s && s.startsWith("**") && s.endsWith("**");
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 28px 80px", animation: "fadeUp 0.4s ease" }}>
      {/* Back + Print */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, paddingBottom: 18, borderBottom: "1px solid #f0f0f0" }}>
        <button onClick={onClear} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: M, fontSize: 9, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", padding: 0, display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = "#111"} onMouseLeave={e => e.currentTarget.style.color = "#bbb"}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Strip another
        </button>
        <button onClick={() => printRecipe(data, url)} style={{ background: "none", border: "1px solid #e5e5e5", padding: "6px 14px", fontFamily: M, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", color: "#999" }}
          onMouseEnter={e => { e.target.style.color = ACC; e.target.style.borderColor = ACC }}
          onMouseLeave={e => { e.target.style.color = "#999"; e.target.style.borderColor = "#e5e5e5" }}>
          Print / PDF
        </button>
      </div>

      {/* Source */}
      <p style={{ fontFamily: M, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: ACC, marginBottom: 12, fontWeight: 500 }}>{data.source || "Recipe"}</p>

      {/* Title */}
      <h1 style={{ fontFamily: F, fontSize: 32, fontWeight: 700, color: "#111", lineHeight: 1.1, letterSpacing: "-0.03em", textTransform: "uppercase", marginBottom: 20 }}>{data.title}</h1>

      {/* Meta */}
      <div style={{ display: "flex", gap: 24, paddingBottom: 20, marginBottom: 28, borderBottom: "2px solid #111", flexWrap: "wrap" }}>
        {[["Prep", data.prep_time], ["Cook", data.cook_time], ["Total", data.total_time], ["Serves", data.servings]].filter(m => m[1]).map(m => (
          <div key={m[0]} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: M, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.12em", color: "#999" }}>{m[0]}</span>
            <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: "#111" }}>{m[1]}</span>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
        {/* Ingredients */}
        <div style={{ flex: "0 0 260px", minWidth: 220 }}>
          <p style={{ fontFamily: M, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: ACC, marginBottom: 16, fontWeight: 600, paddingBottom: 10, borderBottom: "1px solid #f0f0f0" }}>Ingredients</p>
          {(data.ingredients || []).map((ing, i) => {
            if (isSection(ing)) return (
              <div key={i} style={{ fontFamily: M, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: ACC, marginTop: 20, marginBottom: 8, fontWeight: 600 }}>{ing.replace(/\*\*/g, "")}</div>
            );
            return (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #f8f7f5", fontFamily: F, fontSize: 14, fontWeight: 300, color: "#333", lineHeight: 1.4 }}>{ing}</div>
            );
          })}
        </div>

        {/* Method */}
        <div style={{ flex: "1 1 300px", minWidth: 260 }}>
          <p style={{ fontFamily: M, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: ACC, marginBottom: 16, fontWeight: 600, paddingBottom: 10, borderBottom: "1px solid #f0f0f0" }}>Method</p>
          {(data.steps || []).map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 14, marginBottom: 20, alignItems: "baseline" }}>
              <span style={{ fontFamily: M, fontSize: 10, color: "#ddd", minWidth: 22, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
              <p style={{ fontFamily: F, fontSize: 14, fontWeight: 300, color: "#333", lineHeight: 1.7, margin: 0 }}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {(data.notes || data.tips) && (
        <div style={{ marginTop: 32, padding: "18px 22px", background: "#f9f8f6", borderLeft: "3px solid " + ACC }}>
          <p style={{ fontFamily: M, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: ACC, marginBottom: 8, fontWeight: 600 }}>Notes</p>
          <p style={{ fontFamily: F, fontSize: 13, fontWeight: 300, color: "#666", lineHeight: 1.6 }}>{data.notes || data.tips}</p>
        </div>
      )}

      <p style={{ marginTop: 28, fontFamily: M, fontSize: 8, color: "#ddd", letterSpacing: "0.04em", wordBreak: "break-all" }}>{url}</p>
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [sourceUrl, setSourceUrl] = useState("");

  const strip = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(""); setData(null);
    const u = url.trim();
    setSourceUrl(u);
    try {
      const result = await apiPost({ action: "extract", url: u });
      setData(result);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const clear = () => { setData(null); setError(""); setUrl(""); setSourceUrl(""); };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#fff; }
        @keyframes slide { 0%{transform:translateX(-120px)} 100%{transform:translateX(180px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder { color:#ccc; }
        ::selection { background:rgba(110,164,196,0.2); }
      `}</style>

      {/* Minimal header */}
      <header style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="https://colinkline.com" style={{ textDecoration: "none", fontFamily: F, fontSize: 11, fontWeight: 600, color: "#ccc", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4, transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = ACC} onMouseLeave={e => e.currentTarget.style.color = "#ccc"}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          Home
        </a>
      </header>

      {/* HERO / INPUT - only show when no recipe loaded */}
      {!data && (
        <main style={{ maxWidth: 600, margin: "0 auto", padding: "0 28px", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "calc(100vh - 200px)" }}>
          <h1 style={{ fontFamily: F, fontSize: "clamp(36px, 8vw, 56px)", fontWeight: 700, color: "#111", lineHeight: 1, letterSpacing: "-0.04em", textTransform: "uppercase", marginBottom: 8 }}>
            Recipes with<br />No Bullshit<span style={{ color: ACC }}>.</span>
          </h1>
          <div style={{ width: 48, height: 1, background: ACC, margin: "20px 0" }} />
          <p style={{ fontFamily: F, fontSize: 15, fontWeight: 300, color: "#999", lineHeight: 1.6, marginBottom: 40, maxWidth: 380 }}>
            Paste any recipe URL. We strip out the life story, the ads, and the 47 paragraphs about someone's grandmother. You get ingredients and steps. That's it.
          </p>

          {/* Input */}
          <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && strip()}
              placeholder="https://allrecipes.com/recipe/..."
              disabled={loading}
              style={{
                flex: 1, border: "2px solid #111", borderRight: "none",
                padding: "14px 16px", fontFamily: F, fontSize: 15, fontWeight: 300,
                color: "#111", outline: "none", background: "transparent",
              }}
            />
            <button
              onClick={strip}
              disabled={loading || !url.trim()}
              style={{
                background: "#111", color: "#fff", border: "2px solid #111",
                padding: "14px 24px", fontFamily: F, fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
                cursor: loading || !url.trim() ? "default" : "pointer",
                opacity: loading || !url.trim() ? 0.4 : 1,
                transition: "opacity 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Stripping..." : "Strip it"}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontFamily: M, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: ACC, marginBottom: 12 }}>
                Removing the bullshit...
              </p>
              <div style={{ width: 100, height: 2, background: "#eee", overflow: "hidden", borderRadius: 1 }}>
                <div style={{ width: "50%", height: "100%", background: ACC, animation: "slide 1.4s ease-in-out infinite" }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{ fontFamily: M, fontSize: 11, color: "#c44", marginTop: 12 }}>{error}</p>
          )}

          {/* Footer hint */}
          <p style={{ fontFamily: M, fontSize: 8, color: "#ddd", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 48 }}>
            Works with allrecipes, bonappetit, nytcooking, foodnetwork, seriouseats, and basically any recipe page
          </p>
        </main>
      )}

      {/* RECIPE DISPLAY */}
      {data && (
        <Detail data={data} url={sourceUrl} onClear={clear} />
      )}

      {/* Footer */}
      <footer style={{ padding: "20px 28px", fontFamily: M, fontSize: 8, color: "rgba(0,0,0,0.08)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>
        Colin Kline
      </footer>
    </div>
  );
}
