const INK = "#171717", MUT = "#555a60", TEMP = "#374151";
const CARDFONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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

export function formatYield(value) {
  return String(value ?? "").trim()
    .replace(/^(\d+) serving\(s\)$/i, (_, count) => count + (count === "1" ? " serving" : " servings"));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// ── Print: an editorial recipe sheet on white, PDF-ready ────────────────────
export function printRecipe(data, url) {
  const w = window.open("", "_blank");
  if (!w) return false;

  const seg = (arr) => arr.map(r =>
    r.k === "b" ? "<strong>" + escapeHtml(r.t) + "</strong>"
      : r.k === "m" ? '<span class="m">' + escapeHtml(r.t) + "</span>"
        : r.k === "badge" ? '<span class="badge">' + escapeHtml(r.t) + "</span>"
          : escapeHtml(r.t)
  ).join("");

  const titleHtml = escapeHtml(data.title || "Recipe");

  const eyebrow = [data.source]
    .filter(Boolean).map(x => escapeHtml(String(x))).join(" &middot; ");

  const stats = [["Prep", data.prep_time], ["Cook", data.cook_time], ["Total", data.total_time], ["Yield", formatYield(data.servings)]]
    .filter(s => s[1] && !/^0\s*(sec|min)/i.test(s[1])).map(([l, v]) => {
      return '<div class="stat"><div class="l">' + l + '</div><div class="v">' + escapeHtml(v) + "</div></div>";
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
.eyebrow{color:${INK};font-weight:700;font-size:11px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:10px}
.title{font-weight:750;font-size:58px;line-height:.9;letter-spacing:-.02em;margin:0 0 22px}
.stats{display:flex;border-top:3px solid ${INK};border-bottom:1px solid #ddd;margin-bottom:34px}
.stat{flex:1;min-width:0;overflow-wrap:anywhere;padding:13px 0 13px 16px;border-left:1px solid #e7e7e7}
.stat:first-child{border-left:none;padding-left:0}
.stat .l{color:${INK};font-weight:700;font-size:10px;letter-spacing:.1em;text-transform:uppercase}
.stat .v{font-weight:800;font-size:22px;margin:4px 0 2px}
.sechead{display:flex;align-items:baseline;justify-content:space-between;border-bottom:3px solid ${INK};padding-bottom:7px;margin:0 0 18px}
.sechead h2{font-weight:800;text-transform:uppercase;font-size:32px;letter-spacing:-.01em;margin:0}
.ings{display:grid;grid-template-columns:1fr 1fr;gap:0 44px;margin-bottom:38px}
.ing{display:flex;gap:12px;padding:13px 0;border-bottom:1px solid #eee;font-size:14.5px;line-height:1.35;break-inside:avoid;align-items:flex-start}
.box{flex:none;width:17px;height:17px;border:2px solid ${INK};border-radius:3px;margin-top:2px}
.ing strong{font-weight:800}
.ing .m{color:#5c6166}
.ing.sec{grid-column:1/-1;border:none;padding:16px 0 2px}
.ing.sec .h{color:${INK};font-weight:800;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
.step{display:flex;gap:18px;margin-bottom:24px;break-inside:avoid}
.num{color:${INK};font-weight:800;font-size:44px;line-height:.8;flex:none;width:74px}
.body{font-size:14.5px;line-height:1.5;padding-top:6px}
.badge{background:${TEMP};color:#fff;font-weight:700;font-size:.82em;padding:1px 7px;border-radius:3px;white-space:nowrap}
.notes{border-left:4px solid ${INK};background:#fff;padding:15px 20px;margin-top:16px;break-inside:avoid}
.notes .h{color:${INK};font-weight:800;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:7px}
.notes p{color:#6c6a60;font-size:13.5px;line-height:1.55;margin:0}
.foot{margin-top:32px;border-top:1px solid #e7e7e7;padding-top:12px;display:flex;justify-content:space-between;gap:16px;color:#5c6166;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:700}
.foot .u{text-transform:none;letter-spacing:0;font-weight:400;word-break:break-all}
</style></head><body><div class="wrap">
${eyebrow ? '<div class="eyebrow">' + eyebrow + "</div>" : ""}
<h1 class="title">${titleHtml}</h1>
${stats ? '<div class="stats">' + stats + "</div>" : ""}
<div class="sechead"><h2>Ingredients</h2></div>
<div class="ings">${ings}</div>
<div class="sechead"><h2>Method</h2></div>
<div class="steps">${steps}</div>
${notes}
<div class="foot"><span>Recipes with no bullshit</span><span class="u">${escapeHtml(url || "")}</span></div>
</div></body></html>`);
  w.document.close(); w.focus();
  setTimeout(() => { try { w.print(); } catch (e) { /* user can print manually */ } }, 250);
  return true;
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
        ctx.fillStyle = TEMP; ctx.fill();
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
export async function makeCard(data, url) {
  const W = 1080, PAD = 64, contentW = W - PAD * 2;
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
    const eyebrow = [data.source]
      .filter(Boolean).join("   ·   ").toUpperCase();
    if (eyebrow) {
      y = drawRuns(ctx, [{ t: eyebrow, font: "700 22px " + S, color: INK, track: 2.5 }], PAD, y, contentW, 32, draw);
      y += 10;
    }

    const title = [{ t: data.title || "Recipe", font: "700 74px " + S, color: INK, track: -1 }];
    y = drawRuns(ctx, title, PAD, y, contentW, 84, draw);
    y += 26;

    // Stat row
    const stats = [["PREP", data.prep_time], ["COOK", data.cook_time], ["TOTAL", data.total_time], ["YIELD", formatYield(data.servings)]]
      .filter(s => s[1] && !/^0\s*(sec|min)/i.test(s[1]));
    if (stats.length) {
      if (draw) { ctx.fillStyle = INK; ctx.fillRect(PAD, y, contentW, 4); }
      const rowTop = y + 20, cellW = contentW / stats.length;
      let rowEnd = rowTop;
      stats.forEach(([label, value], index) => {
        const left = PAD + index * cellW;
        const inset = index ? 18 : 0;
        if (draw) {
          ctx.fillStyle = INK; ctx.font = "700 22px " + S;
          ctx.fillText(label, left + inset, rowTop);
        }
        const bottom = drawRuns(ctx, [{ t: String(value), font: "700 34px " + S, color: INK }],
          left + inset, rowTop + 32, cellW - inset - 10, 43, draw);
        rowEnd = Math.max(rowEnd, bottom);
      });
      y = rowEnd + 16;
      if (draw) { ctx.fillStyle = "#ddd"; ctx.fillRect(PAD, y, contentW, 1); }
      y += 34;
    }

    const sectionHead = (title) => {
      if (draw) {
        ctx.textBaseline = "top"; ctx.fillStyle = INK; ctx.font = "800 46px " + S;
        if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
        ctx.fillText(title, PAD, y);
      }
      y += 52;
      if (draw) { ctx.fillStyle = INK; ctx.fillRect(PAD, y, contentW, 4); }
      y += 4;
    };

    // One column keeps quantities readable when the image fits a phone screen.
    sectionHead("Ingredients");
    y += 22;
    for (const ingredient of data.ingredients || []) {
      if (SECT(ingredient)) {
        y = drawRuns(ctx, [{ t: ingredient.slice(2, -2), font: "700 36px " + S, color: INK }], PAD, y + 10, contentW, 48, draw);
      } else {
        if (draw) { ctx.strokeStyle = INK; ctx.lineWidth = 3; roundRect(ctx, PAD, y + 5, 28, 28, 4); ctx.stroke(); }
        y = drawRuns(ctx, ingRuns(parseIng(ingredient), 42), PAD + 46, y, contentW - 46, 55, draw);
      }
      y += 18;
    }
    y += 26;

    // Method — big green step numbers + wrapped body, temp badges inline
    sectionHead("Method");
    y += 30;
    const numW = 96, stepSize = 43, stepLH = 60;
    (data.steps || []).forEach((step, idx) => {
      const top = y;
      const endY = drawRuns(ctx, stepRuns(parseStep(step), stepSize), PAD + numW, y, contentW - numW, stepLH, draw);
      if (draw) {
        ctx.textBaseline = "top"; ctx.fillStyle = INK; ctx.font = "800 52px " + S;
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
      let ny = drawRuns(ctx, [{ t: "NOTES", font: "800 22px " + S, color: INK, track: 1.5 }], PAD + 30, nTop, contentW - 60, 32, draw);
      ny += 4;
      ny = drawRuns(ctx, [{ t: notes, font: "400 40px " + S, color: "#6c6a60" }], PAD + 30, ny, contentW - 60, 56, draw);
      if (draw) { ctx.fillStyle = INK; ctx.fillRect(PAD, nTop - 6, 5, ny - (nTop - 6) - 6); }
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
        ctx.fillStyle = MUT; ctx.font = "400 18px " + S;
        const uw = ctx.measureText(url).width;
        if (uw <= contentW * 0.55) ctx.fillText(url, PAD + contentW - uw, y);
      }
    }
    y += 28;
    return y;
  }

  const totalH = Math.ceil(layout(document.createElement("canvas").getContext("2d"), false));
  const canvas = document.createElement("canvas");
  // Bound peak pixel allocation for lengthy recipes on mobile Safari.
  const scale = Math.min(1, 16000 / totalH, Math.sqrt(12000000 / (W * totalH)));
  canvas.width = Math.ceil(W * scale); canvas.height = Math.ceil(totalH * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, totalH);
  layout(ctx, true);

  const slug = String(data.title || "recipe").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "recipe";
  const blob = await new Promise((resolve, reject) => canvas.toBlob(
    value => value ? resolve(value) : reject(new Error("Could not create the image.")), "image/png"
  ));
  return new File([blob], slug + "-card.png", { type: "image/png" });
}
