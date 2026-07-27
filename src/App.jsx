import { useState, useEffect } from "react";

const ACC = "#6ea4c4";
const F = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const M = "'IBM Plex Mono', 'Courier New', monospace";

// ── Editorial recipe-card palette (shared by print + phone export) ──────────
// Olive-green + ink on white, tomato-red temperature badges — the printable
// card look. Kept separate from the app's on-screen accent (ACC) on purpose.
const GRN = "#4a5d23", INK = "#1a1a1a", MUT = "#9a988c", RED = "#c1442e";
const CARDFONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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

// Fetch the shared cookbook (newest first). Returns [] on any failure so the
// UI simply hides the section rather than erroring.
async function fetchCollection() {
  try {
    const res = await fetch("/api/collection");
    const data = await res.json();
    return Array.isArray(data.recipes) ? data.recipes : [];
  } catch { return []; }
}

// Add a freshly stripped recipe to the shared cookbook. Fire-and-forget:
// failures (e.g. D1 not yet bound) are swallowed so stripping still works.
function saveToCollection(recipe, url) {
  try {
    fetch("/api/collection", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe, url }),
    }).catch(() => {});
  } catch { /* ignore */ }
}

const SECT = (s) => typeof s === "string" && s.startsWith("**") && s.endsWith("**");

// Leading quantity (number/fraction + optional unit) to render bold.
const FRAC = "0-9\\u00BC-\\u00BE\\u2150-\\u215E";
const QTY_RE = new RegExp(
  "^([" + FRAC + "./+\\-\\u2013\\s]*[" + FRAC + "][" + FRAC + "./+\\-\\u2013]*\\s*" +
  "(?:(?:tbsp|tablespoons?|tsp|teaspoons?|cups?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|l|" +
  "cloves?|cans?|sticks?|pinch(?:es)?|slices?|sprigs?|bunch(?:es)?|handfuls?)\\b)?\\.?)",
  "i"
);
// Cooking temperatures to highlight as a red badge.
const TEMP_RE = /(\d{2,3}\s?°\s?[FC]?|\d{2,3}\s?degrees(?:\s?[FC])?)/gi;

// Break an ingredient into styled segments: b = bold quantity, n = normal,
// m = muted qualifier (parentheticals + anything after the first comma).
function parseIng(str) {
  const out = [];
  let main = String(str), tail = "";
  const c = main.indexOf(",");
  if (c !== -1) { tail = main.slice(c); main = main.slice(0, c); }
  const m = main.match(QTY_RE);
  let rest = main;
  if (m && m[0].trim()) { out.push({ t: m[0].trim(), k: "b" }); rest = main.slice(m[0].length); }
  if (out.length && rest && !/^\s/.test(rest)) rest = " " + rest;
  let idx = 0, pm; const P = /\(([^)]*)\)/g;
  while ((pm = P.exec(rest))) {
    if (pm.index > idx) out.push({ t: rest.slice(idx, pm.index), k: "n" });
    out.push({ t: pm[0], k: "m" });
    idx = pm.index + pm[0].length;
  }
  if (idx < rest.length) out.push({ t: rest.slice(idx), k: "n" });
  if (tail) out.push({ t: tail, k: "m" });
  return out.filter(r => r.t !== "");
}

// Break a step into normal text + red temperature badges.
function parseStep(str) {
  const out = []; let idx = 0, m; TEMP_RE.lastIndex = 0;
  const s = String(str);
  while ((m = TEMP_RE.exec(s))) {
    if (m.index > idx) out.push({ t: s.slice(idx, m.index), k: "n" });
    out.push({ t: m[0].replace(/\s+/g, ""), k: "badge" });
    idx = m.index + m[0].length;
  }
  if (idx < s.length) out.push({ t: s.slice(idx), k: "n" });
  return out;
}

// Split "15 minutes" → ["15", "minutes"] for the stat row.
function splitStat(v) {
  const s = String(v).trim();
  const m = s.match(new RegExp("^([" + FRAC + "][" + FRAC + ".:/\\-\\u2013]*[" + FRAC + "]|[" + FRAC + "])\\s*(.*)$"));
  return m ? [m[1].trim(), m[2].trim()] : [s, ""];
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Split a title's words in half so the back half renders green (the two-tone
// display look). Single-word titles stay all-ink.
function titleParts(t) {
  const words = String(t || "Recipe").trim().split(/\s+/);
  const cut = Math.ceil(words.length / 2);
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

// ── Print: an editorial recipe sheet on white, PDF-ready ────────────────────
function printRecipe(data, url) {
  const w = window.open("", "_blank");
  if (!w) return;

  const seg = (arr) => arr.map(r =>
    r.k === "b" ? "<strong>" + escapeHtml(r.t) + "</strong>"
      : r.k === "m" ? '<span class="m">' + escapeHtml(r.t) + "</span>"
        : r.k === "badge" ? '<span class="badge">' + escapeHtml(r.t) + "</span>"
          : escapeHtml(r.t)
  ).join("");

  const [tA, tB] = titleParts(data.title);
  const titleHtml = escapeHtml(tA) + (tB ? ' <span class="g">' + escapeHtml(tB) + "</span>" : "");

  const eyebrow = [data.source, data.servings && ("Serves " + data.servings)]
    .filter(Boolean).map(x => escapeHtml(String(x))).join(" &middot; ");

  const stats = [["Prep", data.prep_time], ["Cook", data.cook_time], ["Total", data.total_time], ["Serves", data.servings]]
    .filter(s => s[1]).map(([l, v]) => {
      const [val, unit] = splitStat(v);
      return '<div class="stat"><div class="l">' + l + '</div><div class="v">' + escapeHtml(val) + '</div><div class="u">' + escapeHtml(unit) + "</div></div>";
    }).join("");

  const ings = (data.ingredients || []).map(i => {
    if (SECT(i)) return '<div class="ing sec"><span class="h">' + escapeHtml(i.replace(/\*\*/g, "")) + "</span></div>";
    return '<div class="ing"><span class="box"></span><span class="tx">' + seg(parseIng(i)) + "</span></div>";
  }).join("");

  const steps = (data.steps || []).map((s, i) =>
    '<div class="step"><div class="num">' + String(i + 1).padStart(2, "0") + '</div><div class="body">' + seg(parseStep(s)) + "</div></div>"
  ).join("");

  const notes = (data.notes || data.tips)
    ? '<div class="notes"><div class="h">Notes</div><p>' + escapeHtml(data.notes || data.tips) + "</p></div>" : "";

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(data.title || "Recipe")}</title><style>
@page{margin:.5in}
*{box-sizing:border-box}
html,body{background:#fff}
body{font-family:${CARDFONT};color:${INK};margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.wrap{max-width:7.3in;margin:0 auto;padding:.1in 0}
.eyebrow{color:${GRN};font-weight:700;font-size:11px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:10px}
.title{font-weight:800;text-transform:uppercase;font-size:58px;line-height:.9;letter-spacing:-.02em;margin:0 0 22px}
.title .g{color:${GRN}}
.stats{display:flex;border-top:3px solid ${INK};border-bottom:1px solid #ddd;margin-bottom:34px}
.stat{flex:1;padding:13px 0 13px 16px;border-left:1px solid #e7e7e7}
.stat:first-child{border-left:none;padding-left:0}
.stat .l{color:${GRN};font-weight:700;font-size:10px;letter-spacing:.1em;text-transform:uppercase}
.stat .v{font-weight:800;font-size:22px;margin:4px 0 2px}
.stat .u{color:#a3a196;font-size:11px}
.sechead{display:flex;align-items:baseline;justify-content:space-between;border-bottom:3px solid ${INK};padding-bottom:7px;margin:0 0 18px}
.sechead h2{font-weight:800;text-transform:uppercase;font-size:32px;letter-spacing:-.01em;margin:0}
.sechead .r{color:#a3a196;font-weight:700;font-size:11px;letter-spacing:.14em;text-transform:uppercase}
.ings{display:grid;grid-template-columns:1fr 1fr;gap:0 44px;margin-bottom:38px}
.ing{display:flex;gap:12px;padding:13px 0;border-bottom:1px solid #eee;font-size:14.5px;line-height:1.35;break-inside:avoid;align-items:flex-start}
.box{flex:none;width:17px;height:17px;border:2px solid ${GRN};border-radius:3px;margin-top:2px}
.ing strong{font-weight:800}
.ing .m{color:#a3a196}
.ing.sec{grid-column:1/-1;border:none;padding:16px 0 2px}
.ing.sec .h{color:${GRN};font-weight:800;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
.step{display:flex;gap:18px;margin-bottom:24px;break-inside:avoid}
.num{color:${GRN};font-weight:800;font-size:44px;line-height:.8;flex:none;width:74px}
.body{font-size:14.5px;line-height:1.5;padding-top:6px}
.badge{background:${RED};color:#fff;font-weight:700;font-size:.82em;padding:1px 7px;border-radius:3px;white-space:nowrap}
.notes{border-left:4px solid ${GRN};background:#f6f6f0;padding:15px 20px;margin-top:16px;break-inside:avoid}
.notes .h{color:${GRN};font-weight:800;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:7px}
.notes p{color:#6c6a60;font-size:13.5px;line-height:1.55;margin:0}
.foot{margin-top:32px;border-top:1px solid #e7e7e7;padding-top:12px;display:flex;justify-content:space-between;gap:16px;color:#b7b5aa;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:700}
.foot .u{text-transform:none;letter-spacing:0;font-weight:400;word-break:break-all}
</style></head><body><div class="wrap">
${eyebrow ? '<div class="eyebrow">' + eyebrow + "</div>" : ""}
<h1 class="title">${titleHtml}</h1>
${stats ? '<div class="stats">' + stats + "</div>" : ""}
<div class="sechead"><h2>Ingredients</h2><span class="r">Gather first</span></div>
<div class="ings">${ings}</div>
<div class="sechead"><h2>Method</h2><span class="r">Step by step</span></div>
<div class="steps">${steps}</div>
${notes}
<div class="foot"><span>Recipes with no bullshit</span><span class="u">${escapeHtml(url || "")}</span></div>
</div></body></html>`);
  w.document.close(); w.focus();
  setTimeout(() => { try { w.print(); } catch (e) { /* user can print manually */ } }, 250);
}

// ── Canvas primitives for the phone card ────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Lay styled runs into a column with word-wrap; returns the y after the block.
// Each run: {t, font, color, track?, badge?, size?}. Paints only when draw is
// true; the returned geometry is identical whether or not it paints, so the
// same routine measures (pass 1) and draws (pass 2).
function drawRuns(ctx, runs, x, y, maxW, lineH, draw) {
  ctx.textBaseline = "top";
  let cx = x, started = false;
  const nl = () => { y += lineH; cx = x; started = false; };
  for (const run of runs) {
    const track = run.track || 0;
    ctx.font = run.font;
    if ("letterSpacing" in ctx) ctx.letterSpacing = track + "px";
    if (run.badge) {
      const padX = 11, tw = ctx.measureText(run.t).width, bw = tw + padX * 2, sz = run.size || 26;
      if (started && cx + bw > x + maxW) nl();
      if (draw) {
        roundRect(ctx, cx, y - 3, bw, sz + 8, 4);
        ctx.fillStyle = RED; ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = run.font;
        if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
        ctx.fillText(run.t, cx + padX, y + 1);
      }
      cx += bw + 6; started = true;
      continue;
    }
    for (const tok of run.t.split(/(\s+)/)) {
      if (!tok) continue;
      if (/^\s+$/.test(tok)) { if (started) cx += ctx.measureText(" ").width; continue; }
      const w = ctx.measureText(tok).width;
      if (w > maxW) { // hard-break a token wider than the column (e.g. a URL)
        if (started) nl();
        let chunk = "";
        for (const ch of tok) {
          if (chunk && ctx.measureText(chunk + ch).width > maxW) {
            if (draw) { ctx.fillStyle = run.color; ctx.fillText(chunk, cx, y); }
            nl(); chunk = ch;
          } else chunk += ch;
        }
        if (chunk) { if (draw) { ctx.fillStyle = run.color; ctx.fillText(chunk, cx, y); } cx += ctx.measureText(chunk).width; started = true; }
        continue;
      }
      if (started && cx + w > x + maxW) nl();
      if (draw) { ctx.fillStyle = run.color; ctx.fillText(tok, cx, y); }
      cx += w; started = true;
    }
  }
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  return y + lineH;
}

// ── Phone card: a tall PNG that matches the print sheet, saved to the camera
// roll. 1080px wide so it fills any iPhone/Android screen and stays legible at
// the stove. Dependency-free: everything is drawn on a <canvas>. ─────────────
function exportRecipeCard(data, url) {
  const W = 1080, PAD = 64, contentW = W - PAD * 2, GAP = 44;
  const colW = (contentW - GAP) / 2;
  const S = CARDFONT;

  const ingRuns = (segs, size) => segs.map(r => ({
    t: r.t,
    font: (r.k === "b" ? "800 " : "400 ") + size + "px " + S,
    color: r.k === "m" ? MUT : INK,
  }));
  const stepRuns = (segs, size) => segs.map(r => r.k === "badge"
    ? { t: r.t, badge: true, size, font: "800 " + Math.round(size * 0.82) + "px " + S }
    : { t: r.t, font: "400 " + size + "px " + S, color: INK });

  // One routine, run twice: measure the full height, then paint.
  function layout(ctx, draw) {
    let y = PAD;
    ctx.textBaseline = "top";

    // Eyebrow
    const eyebrow = [data.source, data.servings && ("SERVES " + data.servings)]
      .filter(Boolean).join("   ·   ").toUpperCase();
    if (eyebrow) {
      y = drawRuns(ctx, [{ t: eyebrow, font: "700 22px " + S, color: GRN, track: 2.5 }], PAD, y, contentW, 32, draw);
      y += 10;
    }

    // Title (two-tone: front half ink, back half green)
    const [tA, tB] = titleParts(data.title);
    const tRuns = [];
    if (tA) tRuns.push({ t: tA.toUpperCase() + (tB ? " " : ""), font: "800 76px " + S, color: INK, track: -1 });
    if (tB) tRuns.push({ t: tB.toUpperCase(), font: "800 76px " + S, color: GRN, track: -1 });
    y = drawRuns(ctx, tRuns, PAD, y, contentW, 78, draw);
    y += 26;

    // Stat row
    const stats = [["PREP", data.prep_time], ["COOK", data.cook_time], ["TOTAL", data.total_time], ["SERVES", data.servings]]
      .filter(s => s[1]);
    if (stats.length) {
      if (draw) { ctx.fillStyle = INK; ctx.fillRect(PAD, y, contentW, 4); }
      const rowTop = y + 20, cellW = contentW / stats.length;
      const anyUnit = stats.some(s => splitStat(s[1])[1]);
      if (draw) {
        stats.forEach(([l, v], i) => {
          const [val, unit] = splitStat(v), cx = PAD + i * cellW, inset = i > 0 ? 18 : 0;
          if (i > 0) { ctx.fillStyle = "#e7e7e7"; ctx.fillRect(cx, rowTop, 1, 78); }
          ctx.textBaseline = "top";
          ctx.fillStyle = GRN; ctx.font = "700 19px " + S;
          if ("letterSpacing" in ctx) ctx.letterSpacing = "1.5px";
          ctx.fillText(l, cx + inset, rowTop);
          if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
          ctx.fillStyle = INK; ctx.font = "800 40px " + S;
          ctx.fillText(val, cx + inset, rowTop + 26);
          if (unit) { ctx.fillStyle = MUT; ctx.font = "400 20px " + S; ctx.fillText(unit, cx + inset, rowTop + 74); }
        });
      }
      y = rowTop + (anyUnit ? 104 : 78) + 6;
      if (draw) { ctx.fillStyle = "#ddd"; ctx.fillRect(PAD, y, contentW, 1); }
      y += 34;
    }

    // Section header helper (big ink title + small muted kicker + heavy rule)
    const sectionHead = (title, kicker) => {
      if (draw) {
        ctx.textBaseline = "top"; ctx.fillStyle = INK; ctx.font = "800 46px " + S;
        if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
        ctx.fillText(title, PAD, y);
        ctx.fillStyle = MUT; ctx.font = "700 18px " + S;
        if ("letterSpacing" in ctx) ctx.letterSpacing = "1.5px";
        const kw = ctx.measureText(kicker).width;
        ctx.fillText(kicker, PAD + contentW - kw, y + 22);
        if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
      }
      y += 52;
      if (draw) { ctx.fillStyle = INK; ctx.fillRect(PAD, y, contentW, 4); }
      y += 4;
    };

    // Ingredients — two-column, row-major, checkbox squares
    sectionHead("INGREDIENTS", "GATHER FIRST");
    y += 22;
    const items = data.ingredients || [];
    const ingSize = 29, ingLH = 40, boxTop = 3, rowGap = 26;
    const cell = (segs, cx, yy, doDraw) => {
      if (doDraw) { ctx.strokeStyle = GRN; ctx.lineWidth = 2.5; roundRect(ctx, cx, yy + boxTop, 22, 22, 4); ctx.stroke(); }
      return drawRuns(ctx, ingRuns(segs, ingSize), cx + 36, yy, colW - 36, ingLH, doDraw);
    };
    let i = 0;
    while (i < items.length) {
      if (SECT(items[i])) {
        y += 10;
        y = drawRuns(ctx, [{ t: items[i].replace(/\*\*/g, "").toUpperCase(), font: "800 22px " + S, color: GRN, track: 1.5 }], PAD, y, contentW, 32, draw);
        y += 8; i += 1; continue;
      }
      const right = (i + 1 < items.length && !SECT(items[i + 1])) ? items[i + 1] : null;
      const hL = cell(parseIng(items[i]), PAD, y, false);
      const hR = right ? cell(parseIng(right), PAD + colW + GAP, y, false) : y;
      const rowBottom = Math.max(hL, hR);
      if (draw) {
        cell(parseIng(items[i]), PAD, y, true);
        if (right) cell(parseIng(right), PAD + colW + GAP, y, true);
        ctx.fillStyle = "#ededed";
        ctx.fillRect(PAD, rowBottom + rowGap - 13, colW, 1);
        if (right) ctx.fillRect(PAD + colW + GAP, rowBottom + rowGap - 13, colW, 1);
      }
      y = rowBottom + rowGap;
      i += right ? 2 : 1;
    }
    y += 26;

    // Method — big green step numbers + wrapped body, temp badges inline
    sectionHead("METHOD", "STEP BY STEP");
    y += 30;
    const numW = 96, stepSize = 30, stepLH = 44;
    (data.steps || []).forEach((step, idx) => {
      const top = y;
      const endY = drawRuns(ctx, stepRuns(parseStep(step), stepSize), PAD + numW, y, contentW - numW, stepLH, draw);
      if (draw) {
        ctx.textBaseline = "top"; ctx.fillStyle = GRN; ctx.font = "800 52px " + S;
        if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
        ctx.fillText(String(idx + 1).padStart(2, "0"), PAD, top - 2);
      }
      y = Math.max(endY, top + 56) + 22;
    });

    // Notes callout
    const notes = data.notes || data.tips;
    if (notes) {
      y += 8;
      const nTop = y + 4;
      let ny = drawRuns(ctx, [{ t: "NOTES", font: "800 22px " + S, color: GRN, track: 1.5 }], PAD + 30, nTop, contentW - 60, 32, draw);
      ny += 4;
      ny = drawRuns(ctx, [{ t: notes, font: "400 27px " + S, color: "#6c6a60" }], PAD + 30, ny, contentW - 60, 40, draw);
      if (draw) { ctx.fillStyle = GRN; ctx.fillRect(PAD, nTop - 6, 5, ny - (nTop - 6) - 6); }
      y = ny + 12;
    }

    // Footer
    y += 30;
    if (draw) { ctx.fillStyle = "#e7e7e7"; ctx.fillRect(PAD, y, contentW, 1); }
    y += 22;
    if (draw) {
      ctx.textBaseline = "top"; ctx.fillStyle = MUT; ctx.font = "700 18px " + S;
      if ("letterSpacing" in ctx) ctx.letterSpacing = "1.5px";
      ctx.fillText("RECIPES WITH NO BULLSHIT", PAD, y);
      if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
      if (url) {
        ctx.fillStyle = "#c2c0b6"; ctx.font = "400 18px " + S;
        const uw = ctx.measureText(url).width;
        if (uw <= contentW * 0.55) ctx.fillText(url, PAD + contentW - uw, y);
      }
    }
    y += 28;
    return y;
  }

  const totalH = Math.ceil(layout(document.createElement("canvas").getContext("2d"), false));
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = totalH;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, totalH);
  layout(ctx, true);

  const slug = String(data.title || "recipe").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "recipe";
  canvas.toBlob((blob) => {
    if (!blob) return;
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href; a.download = slug + "-card.png";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }, "image/png");
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
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => exportRecipeCard(data, url)} style={{ background: ACC, border: "1px solid " + ACC, padding: "6px 14px", fontFamily: M, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", color: "#fff" }}
            onMouseEnter={e => { e.target.style.opacity = "0.85" }}
            onMouseLeave={e => { e.target.style.opacity = "1" }}
            title="Save a phone-sized recipe card to your photos">
            Save card
          </button>
          <button onClick={() => printRecipe(data, url)} style={{ background: "none", border: "1px solid #e5e5e5", padding: "6px 14px", fontFamily: M, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", color: "#999" }}
            onMouseEnter={e => { e.target.style.color = ACC; e.target.style.borderColor = ACC }}
            onMouseLeave={e => { e.target.style.color = "#999"; e.target.style.borderColor = "#e5e5e5" }}>
            Print / PDF
          </button>
        </div>
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

// The shared public cookbook — a grid of recipes that got their bullshit
// stripped. Renders nothing until there's at least one.
function CookbookGrid({ recipes, onOpen }) {
  if (!recipes || recipes.length === 0) return null;
  return (
    <section style={{ maxWidth: 900, margin: "0 auto", padding: "40px 28px 90px", animation: "fadeUp 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 6, paddingBottom: 14, borderBottom: "2px solid #111", flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          The Cookbook<span style={{ color: ACC }}>.</span>
        </h2>
        <span style={{ fontFamily: M, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.12em", color: "#bbb" }}>
          {recipes.length} recipe{recipes.length === 1 ? "" : "s"}, bullshit removed
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 1, background: "#f0f0f0", border: "1px solid #f0f0f0" }}>
        {recipes.map((r, i) => (
          <button key={(r.url || r.slug || "") + i} onClick={() => onOpen(r)}
            style={{ textAlign: "left", background: "#fff", border: "none", cursor: "pointer", padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 10, minHeight: 108, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <span style={{ fontFamily: M, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em", color: ACC, fontWeight: 500 }}>
              {r.source || "Recipe"}
            </span>
            <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: "#111", lineHeight: 1.25, flex: 1 }}>
              {r.title}
            </span>
            <span style={{ fontFamily: M, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ccc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{r.cook_time || ""}</span>
              <span style={{ color: "#ddd" }}>View →</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [collection, setCollection] = useState([]);

  // Load the shared cookbook on first render.
  useEffect(() => { fetchCollection().then(setCollection); }, []);

  const strip = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(""); setData(null);
    const u = url.trim();
    setSourceUrl(u);
    try {
      const result = await apiPost({ action: "extract", url: u });
      setData(result);
      saveToCollection(result, u);
      // Optimistically surface it at the top of the cookbook, deduped by URL.
      setCollection(prev => [{ slug: "", title: result.title, source: result.source, url: u, cook_time: result.cook_time || result.total_time || "", data: result }, ...prev.filter(r => r.url !== u)]);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const openSaved = (item) => {
    setData(item.data);
    setSourceUrl(item.url || "");
    setError("");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
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

      {/* HERO / INPUT + COOKBOOK - only show when no recipe loaded */}
      {!data && (
      <>
        <main style={{ maxWidth: 600, margin: "0 auto", padding: "0 28px", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: collection.length ? "auto" : "calc(100vh - 200px)", paddingTop: collection.length ? 40 : 0, paddingBottom: collection.length ? 20 : 0 }}>
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

        {/* Shared public cookbook */}
        <CookbookGrid recipes={collection} onOpen={openSaved} />
      </>
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
