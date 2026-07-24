import { useMemo, useState } from "react";
import "./App.css";
import { WFST, Tropical, compose, composeSteps, shortestPath, EPSILON } from "./fst";
import { FstGraph } from "./components/FstGraph";
import { GoalDemo } from "./components/GoalDemo";
import { ConceptLink, ConceptProgress } from "./concepts/ConceptExplorer";
import { CONCEPTS } from "./concepts/data";

function buildLexicon(): WFST {
  const fst = new WFST(Tropical);
  const start = fst.addState();
  const catK = fst.addState();
  const catAe = fst.addState();
  const final = fst.addState();
  const dogD = fst.addState();
  const dogAo = fst.addState();

  fst.setStart(start);
  fst.addArc(start, { ilabel: "k", olabel: EPSILON, weight: 0, next: catK });
  fst.addArc(catK, { ilabel: "ae", olabel: EPSILON, weight: 0, next: catAe });
  fst.addArc(catAe, { ilabel: "t", olabel: "cat", weight: 0, next: final });
  fst.addArc(start, { ilabel: "d", olabel: EPSILON, weight: 0, next: dogD });
  fst.addArc(dogD, { ilabel: "ao", olabel: EPSILON, weight: 0, next: dogAo });
  fst.addArc(dogAo, { ilabel: "g", olabel: "dog", weight: 0, next: final });
  fst.setFinal(final);
  return fst;
}

function buildGrammar(catCost: number, dogCost: number): WFST {
  const fst = new WFST(Tropical);
  const start = fst.addState();
  const final = fst.addState();
  fst.setStart(start);
  fst.addArc(start, { ilabel: "cat", olabel: "cat", weight: catCost, next: final });
  fst.addArc(start, { ilabel: "dog", olabel: "dog", weight: dogCost, next: final });
  fst.setFinal(final);
  return fst;
}

const LEARNING_STAGES = [
  { label: "Machines", detail: "Read arcs as translations", done: true },
  { label: "Compose", detail: "Build state pairs", active: true },
  { label: "Decode", detail: "Find the cheapest path" },
  { label: "Optimize", detail: "Determinize and minimize" },
];

const FEATURED_CONCEPTS = [
  "transducer",
  "composition",
  "epsilon",
  "semiring",
  "neg-log-prob",
  "shortest-path",
  "hclg",
  "beam-pruning",
];

function App() {
  const [catCost, setCatCost] = useState(0.7);
  const [dogCost, setDogCost] = useState(1.6);
  const [stepIndex, setStepIndex] = useState(0);
  const [view, setView] = useState<"compose" | "decode">("compose");

  const { lexicon, grammar, composed, best, steps, highlightArcs, decodedWord } = useMemo(() => {
    const lexicon = buildLexicon();
    const grammar = buildGrammar(catCost, dogCost);
    const composed = compose(lexicon, grammar);
    const best = shortestPath(composed);
    const steps = [...composeSteps(lexicon, grammar)];
    const highlightArcs = best.arcs.map((arc, index) => ({
      from: best.states[index],
      arcIndex: composed.states[best.states[index]].arcs.indexOf(arc),
    }));
    const decodedWord =
      best.arcs
        .map((arc) => arc.olabel)
        .filter((label) => label !== EPSILON)
        .at(-1) ?? "no path";
    return { lexicon, grammar, composed, best, steps, highlightArcs, decodedWord };
  }, [catCost, dogCost]);

  const safeStep = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const currentStep = steps[safeStep];
  const [lexiconState, grammarState] = currentStep?.pair ?? [-1, -1];
  const catProbability = Math.exp(-catCost);
  const dogProbability = Math.exp(-dogCost);

  return (
    <>
      <GoalDemo />
      <div className="app-shell" id="lesson-start">
      <aside className="lesson-rail">
        <a className="brand" href="#top" aria-label="wfst-lab home">
          <span className="brand-mark" aria-hidden="true">
            W
          </span>
          <span>
            <strong>wfst-lab</strong>
            <small>build the decoder</small>
          </span>
        </a>

        <nav aria-label="Learning stages">
          <p className="rail-label">Learning path</p>
          <ol className="stage-list">
            {LEARNING_STAGES.map((stage, index) => (
              <li className={stage.active ? "is-active" : ""} key={stage.label}>
                <span className="stage-number">{stage.done ? "✓" : index + 1}</span>
                <span>
                  <strong>{stage.label}</strong>
                  <small>{stage.detail}</small>
                </span>
              </li>
            ))}
          </ol>
        </nav>

        <ConceptProgress />
        <p className="rail-tip">
          <span aria-hidden="true">↗</span>
          Dotted terms open a self-contained explainer without losing your place.
        </p>
      </aside>

      <main className="lesson" id="top">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Core algorithms</span>
            <span aria-hidden="true">/</span>
            <strong>Composition</strong>
          </div>
          <a href="#concept-map" className="concept-count">
            {Object.keys(CONCEPTS).length} concept explainers
          </a>
        </header>

        <section className="lesson-hero">
          <p className="eyebrow">Stage 1 · Core mechanism</p>
          <h1>Plug two machines together.</h1>
          <p className="hero-copy">
            <ConceptLink id="composition">Composition</ConceptLink> connects the output tape of one{" "}
            <ConceptLink id="transducer">transducer</ConceptLink> to the input tape of the next. In
            speech recognition, that is how separate acoustic, pronunciation, and language
            knowledge become one searchable graph.
          </p>
          <div className="pipeline" aria-label="H C L G decoding pipeline">
            {[
              ["H", "acoustics"],
              ["C", "context"],
              ["L", "lexicon"],
              ["G", "grammar"],
            ].map(([letter, label], index) => (
              <div className={letter === "L" || letter === "G" ? "is-current" : ""} key={letter}>
                <span>{letter}</span>
                <small>{label}</small>
                {index < 3 && <b aria-hidden="true">∘</b>}
              </div>
            ))}
          </div>
        </section>

        <section className="lab-card" aria-labelledby="lab-title">
          <div className="lab-header">
            <div>
              <p className="eyebrow">Live construction</p>
              <h2 id="lab-title">L ∘ G: phones become weighted words</h2>
            </div>
            <div className="view-switch" aria-label="Lab view">
              <button
                type="button"
                className={view === "compose" ? "is-selected" : ""}
                onClick={() => setView("compose")}
              >
                Build
              </button>
              <button
                type="button"
                className={view === "decode" ? "is-selected" : ""}
                onClick={() => setView("decode")}
              >
                Decode
              </button>
            </div>
          </div>

          {view === "compose" ? (
            <>
              <div className="machine-grid">
                <article className="machine-panel">
                  <div className="machine-title">
                    <span className="machine-badge">L</span>
                    <div>
                      <h3>Pronunciation lexicon</h3>
                      <p>phones → words</p>
                    </div>
                  </div>
                  <FstGraph
                    fst={lexicon}
                    title="L"
                    highlightStates={lexiconState >= 0 ? [lexiconState] : []}
                  />
                </article>
                <article className="machine-panel">
                  <div className="machine-title">
                    <span className="machine-badge machine-badge--warm">G</span>
                    <div>
                      <h3>Language model</h3>
                      <p>words → scored words</p>
                    </div>
                  </div>
                  <FstGraph
                    fst={grammar}
                    title="G"
                    highlightStates={grammarState >= 0 ? [grammarState] : []}
                  />
                </article>
                <article className="machine-panel machine-panel--result">
                  <div className="machine-title">
                    <span className="machine-badge machine-badge--dark">L∘G</span>
                    <div>
                      <h3>Composed machine</h3>
                      <p>phones → weighted words</p>
                    </div>
                  </div>
                  <FstGraph
                    fst={composed}
                    title="L composed with G"
                    highlightStates={safeStep < composed.numStates() ? [safeStep] : []}
                  />
                </article>
              </div>

              <div className="step-console">
                <div className="step-controls">
                  <button
                    type="button"
                    onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
                    disabled={safeStep === 0}
                    aria-label="Previous construction step"
                  >
                    ←
                  </button>
                  <span>
                    Step <strong>{safeStep + 1}</strong> of {steps.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStepIndex((value) => Math.min(steps.length - 1, value + 1))}
                    disabled={safeStep === steps.length - 1}
                    aria-label="Next construction step"
                  >
                    →
                  </button>
                </div>
                <div className="step-explanation" aria-live="polite">
                  <span className="pair-pill">
                    ({lexiconState}, {grammarState})
                  </span>
                  <p>{currentStep?.note}</p>
                </div>
                <p className="invariant">
                  <strong>Invariant:</strong> a product state stores exactly where both machines are
                  after their shared symbol stream has matched.
                </p>
              </div>
            </>
          ) : (
            <div className="decode-workspace">
              <div className="score-controls">
                <p className="eyebrow">Edit G’s word costs</p>
                <h3>Make the winning transcript flip.</h3>
                <p>
                  These are <ConceptLink id="neg-log-prob">−log probabilities</ConceptLink>. Lower
                  cost means a word is more likely.
                </p>
                <label>
                  <span>
                    cat
                    <small>p ≈ {catProbability.toFixed(2)}</small>
                  </span>
                  <input
                    type="range"
                    min={0.05}
                    max={3}
                    step={0.05}
                    value={catCost}
                    onChange={(event) => setCatCost(Number(event.target.value))}
                  />
                  <output>{catCost.toFixed(2)}</output>
                </label>
                <label>
                  <span>
                    dog
                    <small>p ≈ {dogProbability.toFixed(2)}</small>
                  </span>
                  <input
                    type="range"
                    min={0.05}
                    max={3}
                    step={0.05}
                    value={dogCost}
                    onChange={(event) => setDogCost(Number(event.target.value))}
                  />
                  <output>{dogCost.toFixed(2)}</output>
                </label>
              </div>

              <div className="decode-result">
                <div className="winner-banner">
                  <span>Viterbi result</span>
                  <strong>{decodedWord}</strong>
                  <small>total cost {Tropical.toDisplay(best.weight)}</small>
                </div>
                <FstGraph
                  fst={composed}
                  title={`Best path: ${decodedWord}`}
                  highlightStates={best.states}
                  highlightArcs={highlightArcs}
                />
                <p>
                  The <ConceptLink id="shortest-path">shortest path</ConceptLink> adds arc costs and
                  keeps the cheaper complete route. Move either slider until the orange path
                  changes.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="aha-card">
          <span className="aha-icon" aria-hidden="true">
            !
          </span>
          <div>
            <p className="eyebrow">The important bit</p>
            <h2>Composition does not “run” one machine and then the other.</h2>
            <p>
              It builds a new machine whose states are pairs <code>(state in L, state in G)</code>.
              An arc advances both sides only when L’s output label matches G’s input label.{" "}
              <ConceptLink id="epsilon">Epsilon arcs</ConceptLink> let one side advance alone.
            </p>
          </div>
        </section>

        <section className="concept-map" id="concept-map">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Concept graph</p>
              <h2>Open any term when the jargon gets slippery.</h2>
            </div>
            <p>Your progress is saved in this browser.</p>
          </div>
          <div className="concept-card-grid">
            {FEATURED_CONCEPTS.map((id) => {
              const concept = CONCEPTS[id];
              return (
                <ConceptLink id={id} className="concept-card" key={id}>
                  <span className="concept-card__term">{concept.term}</span>
                  <span className="concept-card__one-liner">{concept.oneLiner}</span>
                  {concept.widget && <span className="concept-card__badge">interactive</span>}
                </ConceptLink>
              );
            })}
          </div>
        </section>

        <footer>
          <span>wfst-lab · from-scratch decoding intuition</span>
          <span>Next: determinization and minimization</span>
        </footer>
      </main>
      </div>
    </>
  );
}

export default App;
