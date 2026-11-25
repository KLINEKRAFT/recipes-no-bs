import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CATEGORIES, recipeMetadata } from "../lib/cookbook.js";

export function timeLabel(value) {
  const minutes = /^(\d+) min$/.exec(value);
  if (!minutes || +minutes[1] < 60) return value;
  const remainder = +minutes[1] % 60;
  return (
    Math.floor(+minutes[1] / 60) +
    " hr" +
    (remainder ? " " + remainder + " min" : "")
  );
}
export default function Cookbook({ recipes, status, retry, openRecipe }) {
  const [category, setCategory] = useState("All");
  const [tag, setTag] = useState("");
  const entries = recipes.map((entry) => ({
    ...entry,
    ...recipeMetadata(entry.data),
  }));
  const courses = CATEGORIES.filter((course) =>
    entries.some((r) => r.category === course),
  );
  const tags = [...new Set(entries.flatMap((r) => r.tags))].sort();
  const filtered = entries.filter(
    (r) =>
      (category === "All" || category === r.category) &&
      (!tag || r.tags.includes(tag)),
  );
  return (
    <section id="cookbook" className="cookbook" aria-labelledby="book-title">
      <div className="book-heading">
        <h2 id="book-title">Cookbook</h2>
        {tags.length > 0 && (
          <label className="tag-select">
            <select
              value={tag}
              aria-label="Filter by tag"
              onChange={(e) => setTag(e.target.value)}
            >
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </label>
        )}
      </div>
      {entries.length > 0 && (
        <div className="filters" role="group" aria-label="Course">
          {["All", ...courses].map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c === "All" ? "All recipes" : c}
            </button>
          ))}
        </div>
      )}
      <p className="count" role="status">
        {status === "loading"
          ? "Opening the cookbook…"
          : status === "error"
            ? "The cookbook couldn’t load."
            : filtered.length +
              (filtered.length === 1 ? " recipe" : " recipes")}
      </p>
      {status === "error" && (
        <button className="outline-btn" onClick={retry}>
          Try again
        </button>
      )}
      {status === "ready" && !filtered.length && (
        <p>
          {entries.length
            ? "No recipes match this combination. Try another course or tag."
            : "Strip a recipe to start the cookbook."}
        </p>
      )}
      <div className="book-grid">
        {filtered.map((r) => (
          <button
            className="index-card"
            key={r.url || r.slug || r.title}
            onClick={(e) => openRecipe(r, e.currentTarget)}
          >
            <span className="entry-kicker">
              {[r.category, ...r.tags].join(" · ")}
            </span>
            <strong>{r.title}</strong>
            <span className="entry-meta">
              {[r.source, timeLabel(r.data.total_time || r.cook_time || "")]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <ChevronRight
              className="entry-arrow"
              size={16}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
