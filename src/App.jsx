import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Link2,
  NotebookText,
  LoaderCircle,
  Utensils,
} from "lucide-react";
import Cookbook from "./Cookbook";
import Recipe from "./Recipe";
import { cookbookEntry } from "../lib/cookbook";
import "./app.css";

const featuredURL =
  "https://www.delish.com/cooking/recipe-ideas/a51851/deviled-eggs-recipe/";

function isRecipeLink(value) {
  try {
    const parsed = new URL(value);
    return (
      ["https:", "http:"].includes(parsed.protocol) && Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function Stripper({ onExtract, busy, error, clearError }) {
  const [mode, setMode] = useState("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const input = useRef(null);
  function pasteLink(event) {
    const value = event.clipboardData.getData("text/plain").trim();
    if (!/^https?:\/\/[^\s]+$/i.test(value) || !isRecipeLink(value)) return;
    event.preventDefault();
    setUrl(value);
    onExtract({ url: value }, event.currentTarget);
  }
  function change(next, focus = false) {
    setMode(next);
    clearError();
    if (focus) requestAnimationFrame(() => input.current?.focus());
  }
  return (
    <form
      className="stripper"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onExtract(
          mode === "url" ? { url: url.trim() } : { text: text.trim() },
          event.nativeEvent.submitter || input.current,
        );
      }}
    >
      <div className="mode-tabs" role="group" aria-label="Recipe input">
        {[
          ["url", "Recipe link", Link2],
          ["text", "Paste text", NotebookText],
        ].map(([value, label, Icon]) => (
          <button
            type="button"
            key={value}
            aria-pressed={mode === value}
            disabled={busy}
            onClick={() => change(value)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      {mode === "url" ? (
        <input
          ref={input}
          aria-label="Recipe URL"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPaste={pasteLink}
          enterKeyHint="go"
          disabled={busy}
          placeholder="Paste a recipe link here…"
        />
      ) : (
        <textarea
          ref={input}
          aria-label="Recipe text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          maxLength={50000}
          placeholder="Paste the title, ingredients, and instructions…"
        />
      )}
      <button
        className="primary strip-action"
        disabled={busy || !(mode === "url" ? url : text).trim()}
      >
        {busy && (
          <LoaderCircle size={18} className="busy-icon" aria-hidden="true" />
        )}
        {busy ? "Stripping the bullshit…" : "Strip the bullshit"}
        {!busy && <ArrowRight size={17} aria-hidden="true" />}
      </button>
      <span className="sr-only" role="status">
        {busy ? "Stripping the bullshit…" : ""}
      </span>
      <p className="form-note">
        {mode === "url"
          ? "Paste a link to strip it and add it to the public cookbook."
          : "Stripped recipes join the public cookbook."}
      </p>
      {error && (
        <div className="form-error" role="alert">
          {error}
          {mode === "url" && (
            <button type="button" onClick={() => change("text", true)}>
              Paste the recipe text instead <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
    </form>
  );
}

export default function App() {
  const [entry, setEntry] = useState(() => history.state?.recipeEntry || null);
  const [recipes, setRecipes] = useState([]);
  const [status, setStatus] = useState("loading");
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const origin = useRef(null);

  const operation = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    (async () => {
      const res = await fetch("/api/collection", { signal: controller.signal });
      const body = await res.json();
      if (!res.ok || body.error || !Array.isArray(body.recipes)) throw Error();
      if (!controller.signal.aborted) {
        // A strip may finish while the initial cookbook request is in flight.
        setRecipes((previous) => [
          ...previous,
          ...body.recipes.filter((r) => !previous.some((p) => p.url === r.url)),
        ]);
        setStatus("ready");
      }
    })().catch(() => {
      if (!controller.signal.aborted) setStatus("error");
    });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    function navigate() {
      operation.current?.abort();
      setBusy(false);
      const selected = history.state?.recipeEntry || null;
      setEntry(selected);
      if (!selected)
        requestAnimationFrame(() => {
          if (typeof history.state?.bookScroll === "number")
            window.scrollTo(0, history.state.bookScroll);
          else if (location.hash === "#cookbook")
            document.getElementById("cookbook")?.scrollIntoView();
          else window.scrollTo(0, 0);
          origin.current?.focus({ preventScroll: true });
        });
    }
    window.addEventListener("popstate", navigate);
    return () => {
      window.removeEventListener("popstate", navigate);
      operation.current?.abort();
    };
  }, []);
  function openRecipe(item, trigger) {
    operation.current?.abort();
    setBusy(false);
    history.replaceState({ ...history.state, bookScroll: window.scrollY }, "");
    origin.current = trigger;
    history.pushState({ recipeEntry: item }, "", "#recipe");
    setEntry(item);
  }
  function jumpToBook(event) {
    if (!entry) return;
    event.preventDefault();
    history.replaceState(null, "", "#cookbook");
    setEntry(null);
    requestAnimationFrame(() =>
      document.getElementById("cookbook")?.scrollIntoView(),
    );
  }
  async function strip(payload, trigger) {
    if (operation.current) return;
    setError("");
    if ("url" in payload) {
      if (!isRecipeLink(payload.url)) {
        setError("Paste a full recipe link starting with https://.");
        return;
      }
      payload.url = new URL(payload.url).href;
    }
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract", ...payload }),
        signal: controller.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.result)
        throw Error(body.error || "We couldn’t read that recipe. Try again.");
      const url = payload.url || "";
      const previous = recipes.find((r) =>
        url ? r.url === url : r.title === body.result.title,
      );
      const item = cookbookEntry({ ...previous?.data, ...body.result }, url);
      setRecipes((list) => [
        item,
        ...list.filter((r) => (url ? r.url !== url : r.title !== item.title)),
      ]);
      fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: item.data, url }),
      }).catch(() => {});
      openRecipe(item, trigger);
    } catch (err) {
      if (!controller.signal.aborted)
        setError(err.message || "The recipe service is unavailable.");
    } finally {
      if (operation.current === controller) {
        operation.current = null;
        setBusy(false);
      }
    }
  }
  const featured = recipes.find((r) => r.url === featuredURL);
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="mast">
        <div className="mast-inner">
          <a
            className="brand"
            href="/"
            aria-label="Recipes with No Bullshit home"
          >
            <span className="brand-icon">
              <Utensils size={21} />
            </span>
            Recipes with No Bullshit
          </a>
          <a className="book-nav" href="#cookbook" onClick={jumpToBook}>
            <BookOpen size={17} />
            Cookbook
          </a>
        </div>
      </header>
      <main id="content" className="wrap">
        <div hidden={Boolean(entry)}>
          <section className="hero">
            <div className="hero-body">
              <h1>Just the recipe.</h1>
              <p className="intro">
                Ingredients and steps. Grandma’s summer in Tuscany can wait.
              </p>
              <Stripper
                busy={busy}
                onExtract={strip}
                error={error}
                clearError={() => setError("")}
              />
            </div>
            {featured && (
              <div className="feature">
                <button onClick={(e) => openRecipe(featured, e.currentTarget)}>
                  <img
                    src="/images/deviled-eggs.webp"
                    alt=""
                    width="1000"
                    height="667"
                  />
                  <span className="feature-caption">
                    <span>
                      <small>From the cookbook</small>
                      <strong>Classic deviled eggs</strong>
                    </span>
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </span>
                </button>
              </div>
            )}
          </section>
          <Cookbook
            recipes={recipes}
            status={status}
            retry={() => setReload((n) => n + 1)}
            openRecipe={openRecipe}
          />
        </div>
        {entry && (
          <Recipe
            key={entry.url || entry.title}
            entry={entry}
            back={() => history.back()}
          />
        )}
      </main>
      <footer className={"footer wrap" + (entry ? " reading-footer" : "")}>
        <span>Recipes with No Bullshit.</span>
        <a href="https://colinkline.com">
          Colin Kline <ArrowUpRight size={14} />
        </a>
      </footer>
    </>
  );
}
