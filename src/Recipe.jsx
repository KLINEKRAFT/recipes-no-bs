import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Download,
  Printer,
  Share,
  X,
} from "lucide-react";
import { timeLabel } from "./Cookbook";
import { formatYield, makeCard, printRecipe } from "./exports";
import { recipeMetadata } from "../lib/cookbook";

function CardSheet({ file, title, close }) {
  const dialog = useRef(null);
  const [href, setHref] = useState("");
  const [notice, setNotice] = useState("");
  const files = [file];
  const canShare = navigator.share && navigator.canShare?.({ files });
  useEffect(() => {
    const modal = dialog.current;
    const url = URL.createObjectURL(file);
    setHref(url);
    modal.showModal();
    return () => {
      modal.close();
      URL.revokeObjectURL(url);
    };
  }, [file]);
  async function share() {
    try {
      await navigator.share({ files, title });
    } catch (err) {
      if (err.name !== "AbortError")
        setNotice("Sharing didn’t open. You can still download the PNG.");
    }
  }
  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby="card-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="sheet-head">
        <h2 id="card-title">Your recipe card</h2>
        <button aria-label="Close card" className="icon-btn" onClick={close}>
          <X />
        </button>
      </div>
      <p>
        {canShare
          ? "On iPhone, tap Share, then choose Save Image to keep it in Photos."
          : "Download the image to keep the recipe handy offline."}
      </p>
      <div className="sheet-actions">
        {canShare && (
          <button className="primary" onClick={share}>
            <Share size={18} />
            Share
          </button>
        )}
        <a
          className={canShare ? "outline-btn" : "primary"}
          href={href || undefined}
          download={file.name}
        >
          <Download size={18} />
          Download PNG
        </a>
      </div>
      {notice && <p role="alert">{notice}</p>}
      <div
        className="card-scroll"
        tabIndex={0}
        aria-label="Recipe image preview"
      >
        {href && <img src={href} alt={title + " – complete recipe card"} />}
      </div>
    </dialog>
  );
}

export default function Recipe({ entry, back }) {
  const data = entry.data;
  const { category, tags } = recipeMetadata(data);
  const [checked, setChecked] = useState(new Set());
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const saveButton = useRef(null);
  const title = useRef(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    title.current.focus({ preventScroll: true });
  }, []);
  const stats = [
    ["Prep", data.prep_time],
    ["Cook", data.cook_time],
    ["Total", data.total_time],
    ["Yield", formatYield(data.servings)],
  ].filter(([, v]) => v && !/^0\s*(sec|min)/i.test(v));
  async function save() {
    setBusy(true);
    setNotice("");
    try {
      setFile(
        await makeCard(data, /^https?:/.test(entry.url) ? entry.url : ""),
      );
    } catch {
      setNotice(
        "The image couldn’t be created. Try Print / PDF to keep a copy.",
      );
    } finally {
      setBusy(false);
    }
  }
  function toggle(index) {
    setChecked((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }
  return (
    <article className="reading">
      <button className="back" onClick={back}>
        <ArrowLeft size={17} />
        Back
      </button>
      <header className="reading-head">
        <div className="category">{[category, ...tags].join(" / ")}</div>
        <h1 ref={title} tabIndex={-1}>
          {data.title}
        </h1>
        {/^https?:\/\//i.test(entry.url) ? (
          <a
            className="credit"
            href={entry.url}
            target="_blank"
            rel="noreferrer"
          >
            Original recipe · {data.source || new URL(entry.url).hostname}
            <ArrowUpRight size={15} />
          </a>
        ) : (
          data.source && <p>{data.source}</p>
        )}
        {stats.length > 0 && (
          <dl className="stats">
            {stats.map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{name === "Yield" ? value : timeLabel(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>
      <div className="instructions">
        <section>
          <h2>Ingredients</h2>
          <ul className="ingredients">
            {data.ingredients.map((item, i) =>
              /^\*\*.*\*\*$/.test(item) ? (
                <li className="ingredient-group" key={i}>
                  {item.slice(2, -2)}
                </li>
              ) : (
                <li key={i}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked.has(i)}
                      onChange={() => toggle(i)}
                    />
                    <span className="check-mark" aria-hidden="true">
                      {checked.has(i) && <Check size={15} />}
                    </span>
                    <span>{item}</span>
                  </label>
                </li>
              ),
            )}
          </ul>
        </section>
        <section>
          <h2>Method</h2>
          <ol className="steps">
            {data.steps.map((step, i) => (
              <li key={i}>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
      {(data.notes || data.tips) && (
        <aside className="notes">
          <h2>Cook’s notes</h2>
          <p>{data.notes || data.tips}</p>
        </aside>
      )}
      <div className="recipe-actions">
        {notice && <p role="alert">{notice}</p>}
        <div>
          <button
            className="outline-btn"
            onClick={() => {
              if (
                !printRecipe(data, /^https?:/.test(entry.url) ? entry.url : "")
              )
                setNotice("Allow pop-ups and try Print / PDF again.");
            }}
          >
            <Printer size={18} />
            Print / PDF
          </button>
          <button
            ref={saveButton}
            className="primary"
            disabled={busy}
            onClick={save}
          >
            <Download size={18} />
            {busy ? "Making card…" : "Save card"}
          </button>
        </div>
      </div>
      {file && (
        <CardSheet
          file={file}
          title={data.title}
          close={() => {
            setFile(null);
            requestAnimationFrame(() =>
              saveButton.current?.focus({ preventScroll: true }),
            );
          }}
        />
      )}
    </article>
  );
}
