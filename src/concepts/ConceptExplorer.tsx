import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CONCEPTS } from "./data";
import { SemiringWidget } from "../widgets/SemiringWidget";
import { WeightWidget } from "../widgets/WeightWidget";
import "./concepts.css";

interface ConceptContextValue {
  activeId: string | null;
  understood: Set<string>;
  openConcept: (id: string) => void;
  closeConcept: () => void;
  toggleUnderstood: (id: string) => void;
}

const ConceptContext = createContext<ConceptContextValue | null>(null);
const STORAGE_KEY = "wfst-lab-understood-concepts";

function readUnderstood(): Set<string> {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return new Set(
      Array.isArray(stored)
        ? stored.filter((id): id is string => typeof id === "string" && id in CONCEPTS)
        : [],
    );
  } catch {
    return new Set();
  }
}

export function ConceptProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [understood, setUnderstood] = useState<Set<string>>(readUnderstood);

  const openConcept = useCallback((id: string) => {
    if (id in CONCEPTS) setActiveId(id);
  }, []);

  const closeConcept = useCallback(() => setActiveId(null), []);

  const toggleUnderstood = useCallback((id: string) => {
    setUnderstood((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Progress still works for this session if browser storage is unavailable.
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ activeId, understood, openConcept, closeConcept, toggleUnderstood }),
    [activeId, understood, openConcept, closeConcept, toggleUnderstood],
  );

  return (
    <ConceptContext.Provider value={value}>
      {children}
      <ConceptDrawer />
    </ConceptContext.Provider>
  );
}

function useConcepts(): ConceptContextValue {
  const context = useContext(ConceptContext);
  if (!context) throw new Error("Concept components must be rendered inside ConceptProvider");
  return context;
}

export function ConceptLink({
  id,
  children,
  className,
}: {
  id: string;
  children?: ReactNode;
  className?: string;
}) {
  const { openConcept } = useConcepts();
  const concept = CONCEPTS[id];
  if (!concept) return <>{children ?? id}</>;

  return (
    <button
      type="button"
      className={["concept-link", className].filter(Boolean).join(" ")}
      onClick={() => openConcept(id)}
    >
      {children ?? concept.term}
    </button>
  );
}

function renderInline(text: string): ReactNode[] {
  const tokenPattern = /(\[\[[^\]]+\]\]|`[^`]+`|\*[^*]+\*)/g;
  return text
    .split(tokenPattern)
    .filter(Boolean)
    .map((token, index) => {
      if (token.startsWith("[[")) {
        const [id, label] = token.slice(2, -2).split("|");
        return (
          <ConceptLink id={id} key={`${token}-${index}`}>
            {label ?? CONCEPTS[id]?.term ?? id}
          </ConceptLink>
        );
      }
      if (token.startsWith("`")) return <code key={`${token}-${index}`}>{token.slice(1, -1)}</code>;
      if (token.startsWith("*")) return <em key={`${token}-${index}`}>{token.slice(1, -1)}</em>;
      return token;
    });
}

export function ConceptText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 24)}-${index}`}>{renderInline(paragraph)}</p>
      ))}
    </>
  );
}

export function ConceptProgress() {
  const { understood } = useConcepts();
  const total = Object.keys(CONCEPTS).length;
  const percentage = Math.round((understood.size / total) * 100);

  return (
    <div className="concept-progress" aria-label={`${understood.size} of ${total} concepts understood`}>
      <div>
        <span>Concept progress</span>
        <strong>
          {understood.size}/{total}
        </strong>
      </div>
      <div className="concept-progress__track" aria-hidden="true">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function ConceptWidget({ widget }: { widget: string }) {
  if (widget === "semiring") return <SemiringWidget />;
  if (widget === "weight") return <WeightWidget />;

  return (
    <div className="concept-widget-bridge">
      <span className="concept-widget-bridge__icon" aria-hidden="true">
        ↗
      </span>
      <div>
        <strong>Try it in the lab</strong>
        <p>
          This concept changes the machines or search shown in the main workspace. Close this
          panel and use the highlighted controls to experiment.
        </p>
      </div>
    </div>
  );
}

function ConceptDrawer() {
  const { activeId, understood, openConcept, closeConcept, toggleUnderstood } = useConcepts();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const concept = activeId ? CONCEPTS[activeId] : null;

  useEffect(() => {
    if (!concept) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeConcept();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [concept, closeConcept]);

  if (!concept) return null;
  const isUnderstood = understood.has(concept.id);

  return (
    <>
      <button
        type="button"
        className="concept-drawer-backdrop"
        aria-label="Close concept"
        onClick={closeConcept}
      />
      <aside className="concept-drawer" role="dialog" aria-modal="true" aria-labelledby="concept-title">
        <header className="concept-drawer__header">
          <span className="concept-drawer__eyebrow">Concept explainer</span>
          <button
            ref={closeButtonRef}
            type="button"
            className="concept-drawer__icon-btn"
            onClick={closeConcept}
            aria-label="Close concept explainer"
          >
            ×
          </button>
        </header>
        <div className="concept-drawer__body">
          <h2 id="concept-title" className="concept-drawer__term">
            {concept.term}
          </h2>
          <p className="concept-drawer__one-liner">{concept.oneLiner}</p>

          {concept.widget && (
            <div className="concept-drawer__widget">
              <p className="concept-drawer__widget-label">Make it concrete</p>
              <ConceptWidget widget={concept.widget} />
            </div>
          )}

          <div className="concept-drawer__body-text">
            <ConceptText text={concept.body} />
          </div>

          <h3 className="concept-drawer__section-title">Why it matters for ASR</h3>
          <p className="concept-drawer__why">{concept.whyASR}</p>

          {concept.prereqs.length > 0 && (
            <>
              <h3 className="concept-drawer__section-title">Understand first</h3>
              <div className="concept-chip-row">
                {concept.prereqs.map((id) => (
                  <button
                    type="button"
                    className="concept-chip"
                    onClick={() => openConcept(id)}
                    key={id}
                  >
                    {CONCEPTS[id].term}
                  </button>
                ))}
              </div>
            </>
          )}

          {concept.related.length > 0 && (
            <>
              <h3 className="concept-drawer__section-title">Explore next</h3>
              <div className="concept-chip-row">
                {concept.related.map((id) => (
                  <button
                    type="button"
                    className="concept-chip"
                    onClick={() => openConcept(id)}
                    key={id}
                  >
                    {CONCEPTS[id].term}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            type="button"
            className={`understood-button ${isUnderstood ? "is-understood" : ""}`}
            onClick={() => toggleUnderstood(concept.id)}
          >
            <span aria-hidden="true">{isUnderstood ? "✓" : "○"}</span>
            {isUnderstood ? "Marked as understood" : "Mark as understood"}
          </button>
        </div>
      </aside>
    </>
  );
}
