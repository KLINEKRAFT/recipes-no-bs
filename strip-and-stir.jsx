import { useState } from "react";

const CATEGORIES = [
  { id: "chicken", label: "Chicken", emoji: "🍗", query: "best chicken dinner recipes" },
  { id: "beef", label: "Beef", emoji: "🥩", query: "best beef recipes easy" },
  { id: "pasta", label: "Pasta", emoji: "🍝", query: "best pasta recipes homemade" },
  { id: "seafood", label: "Seafood", emoji: "🐟", query: "best seafood fish recipes" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🥬", query: "best vegetarian recipes" },
  { id: "soup", label: "Soups", emoji: "🍲", query: "best soup recipes homemade" },
  { id: "dessert", label: "Desserts", emoji: "🍰", query: "best dessert recipes easy" },
  { id: "breakfast", label: "Breakfast", emoji: "🍳", query: "best breakfast brunch recipes" },
  { id: "slowcooker", label: "Slow Cooker", emoji: "🫕", query: "best slow cooker crockpot recipes" },
  { id: "asian", label: "Asian", emoji: "🥡", query: "best asian recipes easy" },
  { id: "mexican", label: "Mexican", emoji: "🌮", query: "best mexican recipes authentic" },
  { id: "grilling", label: "Grilling", emoji: "🔥", query: "best grilling barbecue recipes" },
];

async function discoverRecipes(searchQuery) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Search the web for: "${searchQuery}"

Find 8 specific recipes from real recipe websites (allrecipes, bonappetit, seriouseats, foodnetwork, etc). Return ONLY a valid JSON array, no markdown, no explanation. Each object:
{"title":"Recipe Name","description":"One sentence","source":"Site Name","url":"https://full-url","image_url":"https://og-image-or-recipe-photo-url","cook_time":"30 min"}

For image_url use the og:image or main recipe photo. If unavailable use "". Return ONLY the JSON array.`
      }],
    }),
  });
  if (!res.ok) throw new Error("API request failed: " + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  const textBlocks = data.content?.filter((b) => b.type === "text") || [];
  const raw = textBlocks.map((b) => b.text).join("\n");
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No recipes found");
  return JSON.parse(match[0]).map((r, i) => ({ ...r, _id: Date.now() + i }));
}

async function extractFullRecipe(url) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Go to this URL and extract ONLY the recipe. Remove ALL filler: personal stories, blog text, ads, SEO content. Return ONLY valid JSON, no markdown, no preamble:
{"title":"...","servings":"...","prep_time":"...","cook_time":"...","ingredients":["1 cup flour","2 eggs"],"steps":["Preheat oven to 350F.","Mix ingredients."],"tips":"Useful tips or empty string","source":"site name"}

URL: ${url}`
      }],
    }),
  });
  if (!res.ok) throw new Error("API request failed: " + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  const textBlocks = data.content?.filter((b) => b.type === "text") || [];
  const raw = textBlocks.map((b) => b.text).join("\n");
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Could not extract recipe from that page");
  return JSON.parse(match[0]);
}

function RecipeImage({ title, style }) {
  const colors = ["#291f1a", "#1a2422", "#241a28", "#1f2418", "#181f28", "#28211a"];
  const emojis = ["🍳", "🥘", "🍲", "🥗", "🍝", "🍖", "🥩", "🍰", "🌮", "🍗"];
  const h = (title || "x").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <div style={{
      ...style,
      background: colors[h % colors.length],
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 40, userSelect: "none",
    }}>
      {emojis[h % emojis.length]}
    </div>
  );
}

function RecipeCard({ recipe, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = recipe.image_url && !imgFailed;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        background: "#151413",
        border: `1px solid ${hovered ? "#c45a3c" : "#252220"}`,
        borderRadius: 3, overflow: "hidden",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 6px 24px rgba(196,90,60,0.12)" : "none",
      }}
    >
      {showImg ? (
        <img
          src={recipe.image_url} alt={recipe.title}
          onError={() => setImgFailed(true)}
          style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }}
        />
      ) : (
        <RecipeImage title={recipe.title} style={{ width: "100%", height: 170 }} />
      )}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 16, color: "#ede8e0", lineHeight: 1.25,
          marginBottom: 6,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {recipe.title}
        </div>
        <div style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 9, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "#5a5654",
          display: "flex", justifyContent: "space-between",
        }}>
          <span>{recipe.source}</span>
          {recipe.cook_time && <span style={{ color: "#c45a3c" }}>{recipe.cook_time}</span>}
        </div>
      </div>
    </div>
  );
}

function RecipeDetail({ recipe, onClose, loading, error, data }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.88)",
        overflowY: "auto", padding: 16,
      }}
    >
      <div style={{
        maxWidth: 680, margin: "0 auto",
        background: "#0e0d0c", border: "1px solid #252220",
        borderRadius: 4, position: "relative", minHeight: 300,
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 12, zIndex: 10,
          background: "rgba(14,13,12,0.85)", border: "1px solid #252220",
          color: "#ede8e0", width: 34, height: 34, borderRadius: 99,
          cursor: "pointer", fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>

        <div style={{ padding: "28px 28px 36px" }}>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 9, textTransform: "uppercase",
            letterSpacing: "0.14em", color: "#c45a3c", marginBottom: 8,
          }}>
            {recipe.source || "Recipe"} — stripped clean
          </div>

          <h2 style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 28, fontWeight: 400, color: "#ede8e0",
            margin: "0 0 16px", lineHeight: 1.2,
          }}>
            {(data && data.title) || recipe.title}
          </h2>

          {loading && (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 11, color: "#c45a3c",
                letterSpacing: "0.06em", marginBottom: 12,
              }}>
                EXTRACTING RECIPE...
              </div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 10, color: "#3a3735", marginBottom: 16,
              }}>
                Fetching page → stripping filler → extracting the good stuff
              </div>
              <div style={{
                margin: "0 auto", width: 200, height: 3,
                background: "#1a1918", borderRadius: 2, overflow: "hidden",
              }}>
                <div style={{
                  width: "30%", height: "100%", background: "#c45a3c",
                  borderRadius: 2, animation: "slide 1.5s ease-in-out infinite",
                }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: 16, background: "#1a1210",
              border: "1px solid #4a2a1a", borderRadius: 2,
              fontFamily: "'Courier New', monospace",
              fontSize: 12, color: "#c45a3c",
            }}>{error}</div>
          )}

          {data && !loading && (
            <>
              <div style={{
                display: "flex", gap: 20, padding: "14px 0",
                borderTop: "1px solid #1c1b1a",
                borderBottom: "1px solid #1c1b1a",
                marginBottom: 24, flexWrap: "wrap",
              }}>
                {[
                  { l: "Prep", v: data.prep_time },
                  { l: "Cook", v: data.cook_time },
                  { l: "Serves", v: data.servings },
                ].filter(m => m.v).map(m => (
                  <div key={m.l}>
                    <div style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: 8, textTransform: "uppercase",
                      letterSpacing: "0.16em", color: "#504c48", marginBottom: 2,
                    }}>{m.l}</div>
                    <div style={{
                      fontFamily: "Georgia, serif", fontSize: 17, color: "#ede8e0",
                    }}>{m.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 180px", minWidth: 180 }}>
                  <div style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 9, textTransform: "uppercase",
                    letterSpacing: "0.14em", color: "#c45a3c",
                    fontWeight: 700, marginBottom: 14,
                    paddingBottom: 8, borderBottom: "1px solid #1c1b1a",
                  }}>Ingredients</div>
                  {(data.ingredients || []).map((ing, i) => (
                    <div key={i} style={{
                      padding: "7px 0", borderBottom: "1px solid #131211",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      fontSize: 13.5, color: "#b8b0a8", lineHeight: 1.4,
                    }}>{ing}</div>
                  ))}
                </div>

                <div style={{ flex: "2 1 280px", minWidth: 240 }}>
                  <div style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 9, textTransform: "uppercase",
                    letterSpacing: "0.14em", color: "#c45a3c",
                    fontWeight: 700, marginBottom: 14,
                    paddingBottom: 8, borderBottom: "1px solid #1c1b1a",
                  }}>Method</div>
                  {(data.steps || []).map((step, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 14,
                      marginBottom: 18, alignItems: "flex-start",
                    }}>
                      <span style={{
                        fontFamily: "Georgia, serif",
                        fontSize: 28, color: "#252220",
                        lineHeight: 1, minWidth: 26,
                      }}>{i + 1}</span>
                      <p style={{
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontSize: 13.5, color: "#b8b0a8",
                        lineHeight: 1.65, margin: 0, paddingTop: 5,
                      }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {data.tips && (
                <div style={{
                  marginTop: 24, padding: "14px 18px",
                  background: "#131211", border: "1px solid #1c1b1a", borderRadius: 2,
                }}>
                  <div style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 9, textTransform: "uppercase",
                    letterSpacing: "0.12em", color: "#c45a3c", marginBottom: 6,
                  }}>Chef's Notes</div>
                  <div style={{
                    fontFamily: "system-ui, sans-serif",
                    fontSize: 13, color: "#78726c",
                    lineHeight: 1.55, fontStyle: "italic",
                  }}>{data.tips}</div>
                </div>
              )}

              <div style={{
                marginTop: 20,
                fontFamily: "'Courier New', monospace",
                fontSize: 9, color: "#302e2b", letterSpacing: "0.04em",
              }}>
                Source: {recipe.url}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StripAndStir() {
  const [view, setView] = useState("home");
  const [activeCategory, setActiveCategory] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [selected, setSelected] = useState(null);
  const [recipeData, setRecipeData] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");

  const loadRecipes = async (query, catId) => {
    setView("browse");
    setActiveCategory(catId);
    setLoading(true);
    setLoadError("");
    setRecipes([]);
    try {
      const results = await discoverRecipes(query);
      setRecipes(results);
    } catch (e) {
      setLoadError(e.message || "Failed to discover recipes");
    }
    setLoading(false);
  };

  const handleCardClick = async (recipe) => {
    setSelected(recipe);
    setRecipeData(null);
    setExtracting(true);
    setExtractError("");
    try {
      const d = await extractFullRecipe(recipe.url);
      setRecipeData(d);
    } catch (e) {
      setExtractError(e.message || "Failed to extract recipe");
    }
    setExtracting(false);
  };

  const handleCustomUrl = async () => {
    if (!customUrl.trim()) return;
    let hostname = "Recipe";
    try { hostname = new URL(customUrl).hostname.replace("www.", ""); } catch {}
    const fake = { title: "Extracting...", source: hostname, url: customUrl.trim(), _id: Date.now() };
    setSelected(fake);
    setRecipeData(null);
    setExtracting(true);
    setExtractError("");
    try {
      const d = await extractFullRecipe(customUrl.trim());
      setRecipeData(d);
      setSelected(prev => ({ ...prev, title: d.title }));
    } catch (e) {
      setExtractError(e.message || "Failed to extract");
    }
    setExtracting(false);
    setCustomUrl("");
  };

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    loadRecipes(searchInput.trim() + " recipes", null);
    setSearchInput("");
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0908",
      color: "#ede8e0", fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(300%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #3e3b38; }
      `}</style>

      {/* HEADER */}
      <header style={{
        padding: "14px 20px",
        borderBottom: "1px solid #181716",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,9,8,0.95)",
      }}>
        <div onClick={() => setView("home")} style={{ cursor: "pointer" }}>
          <span style={{
            fontFamily: "Georgia, serif", fontSize: 20, color: "#ede8e0",
          }}>Strip & Stir</span>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 8, textTransform: "uppercase",
            letterSpacing: "0.14em", color: "#c45a3c", marginLeft: 8,
          }}>No filler</span>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <div style={{
            display: "flex", background: "#131211",
            border: "1px solid #252220", borderRadius: 2, overflow: "hidden",
          }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search recipes..."
              style={{
                background: "transparent", border: "none", outline: "none",
                padding: "7px 12px", color: "#ede8e0",
                fontFamily: "system-ui, sans-serif", fontSize: 13, width: 140,
              }}
            />
            <button onClick={handleSearch} style={{
              background: "#c45a3c", border: "none", color: "#fff",
              padding: "7px 12px", fontFamily: "'Courier New', monospace",
              fontSize: 9, textTransform: "uppercase",
              letterSpacing: "0.08em", cursor: "pointer", fontWeight: 700,
            }}>Go</button>
          </div>

          <div style={{
            display: "flex", background: "#131211",
            border: "1px solid #252220", borderRadius: 2, overflow: "hidden",
          }}>
            <input
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCustomUrl()}
              placeholder="Paste URL..."
              style={{
                background: "transparent", border: "none", outline: "none",
                padding: "7px 12px", color: "#ede8e0",
                fontFamily: "system-ui, sans-serif", fontSize: 13, width: 120,
              }}
            />
            <button onClick={handleCustomUrl} style={{
              background: "#252220", border: "none", color: "#c45a3c",
              padding: "7px 12px", fontFamily: "'Courier New', monospace",
              fontSize: 9, textTransform: "uppercase",
              letterSpacing: "0.08em", cursor: "pointer", fontWeight: 700,
            }}>Strip</button>
          </div>
        </div>
      </header>

      {/* HOME */}
      {view === "home" && (
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 60px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🔪</div>
            <h2 style={{
              fontFamily: "Georgia, serif",
              fontSize: 26, fontWeight: 400, color: "#ede8e0", marginBottom: 8,
            }}>
              Recipes without the nonsense
            </h2>
            <p style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 11, color: "#504c48",
              letterSpacing: "0.04em", lineHeight: 1.6,
              maxWidth: 420, margin: "0 auto",
            }}>
              Pick a category. We search the web, find real recipes,
              and when you tap one we strip out every life story,
              ad, and filler paragraph. Just ingredients and steps.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 10,
          }}>
            {CATEGORIES.map((cat, i) => (
              <div
                key={cat.id}
                onClick={() => loadRecipes(cat.query, cat.id)}
                style={{
                  background: "#131211",
                  border: "1px solid #1e1d1c",
                  borderRadius: 3, padding: "18px 12px",
                  textAlign: "center", cursor: "pointer",
                  transition: "all 0.15s",
                  animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#c45a3c";
                  e.currentTarget.style.background = "#181614";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#1e1d1c";
                  e.currentTarget.style.background = "#131211";
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 5 }}>{cat.emoji}</div>
                <div style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 9, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "#8a8480", fontWeight: 700,
                }}>{cat.label}</div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* BROWSE */}
      {view === "browse" && (
        <main style={{ maxWidth: 1000, margin: "0 auto", padding: "14px 20px 60px" }}>
          <div style={{
            display: "flex", gap: 4, flexWrap: "wrap",
            marginBottom: 18, paddingBottom: 12,
            borderBottom: "1px solid #141312",
          }}>
            <button onClick={() => setView("home")} style={{
              background: "transparent", border: "1px solid #252220",
              borderRadius: 2, padding: "4px 10px",
              fontFamily: "'Courier New', monospace",
              fontSize: 9, color: "#6b6360", cursor: "pointer",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>← Home</button>
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                onClick={() => loadRecipes(cat.query, cat.id)}
                style={{
                  background: activeCategory === cat.id ? "#c45a3c" : "transparent",
                  color: activeCategory === cat.id ? "#fff" : "#504c48",
                  border: `1px solid ${activeCategory === cat.id ? "#c45a3c" : "#1e1d1c"}`,
                  borderRadius: 2, padding: "4px 10px",
                  fontFamily: "'Courier New', monospace",
                  fontSize: 9, textTransform: "uppercase",
                  letterSpacing: "0.06em", cursor: "pointer",
                }}
              >{cat.label}</button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "50px 0" }}>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 11, color: "#c45a3c",
                letterSpacing: "0.06em", marginBottom: 10,
              }}>DISCOVERING RECIPES...</div>
              <div style={{
                margin: "16px auto 0", width: 200, height: 3,
                background: "#181716", borderRadius: 2, overflow: "hidden",
              }}>
                <div style={{
                  width: "30%", height: "100%", background: "#c45a3c",
                  borderRadius: 2, animation: "slide 1.5s ease-in-out infinite",
                }} />
              </div>
            </div>
          )}

          {loadError && (
            <div style={{
              padding: 20, background: "#1a1210",
              border: "1px solid #4a2a1a", borderRadius: 2,
              fontFamily: "'Courier New', monospace",
              fontSize: 12, color: "#c45a3c", textAlign: "center",
            }}>{loadError}</div>
          )}

          {!loading && recipes.length > 0 && (
            <>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 9, textTransform: "uppercase",
                letterSpacing: "0.1em", color: "#302e2b", marginBottom: 14,
              }}>
                {recipes.length} recipes — tap any to strip and read
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 14,
              }}>
                {recipes.map((r, i) => (
                  <div key={r._id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                    <RecipeCard recipe={r} onClick={() => handleCardClick(r)} />
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !loadError && recipes.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 0", color: "#3a3735",
              fontFamily: "'Courier New', monospace", fontSize: 11,
            }}>No recipes found. Try another category.</div>
          )}
        </main>
      )}

      {/* DETAIL MODAL */}
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
  );
}
