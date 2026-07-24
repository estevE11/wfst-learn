import { useMemo, useState } from "react";
import "./FoundationsBridge.css";

const ROUTES = [
  {
    text: "The gray cat sat quietly by the window and watched the rain.",
    sound: 1.1,
    language: 0.7,
  },
  {
    text: "The gray cat sat quietly by the window and watched the reign.",
    sound: 1.1,
    language: 1.6,
  },
  {
    text: "A great cap set quietly by the window and washed the reign.",
    sound: 1.3,
    language: 4,
  },
] as const;

const VOCABULARY_SIZES = [100, 1_000, 10_000, 50_000] as const;

const formatCount = (value: number) =>
  new Intl.NumberFormat("en", { notation: value >= 1_000_000 ? "compact" : "standard" }).format(
    value,
  );

export function FoundationsBridge() {
  const [weighted, setWeighted] = useState(true);
  const [vocabulary, setVocabulary] = useState<number>(10_000);
  const denseBigramArcs = vocabulary * vocabulary;
  const illustrativeSparseArcs = vocabulary * 40;

  const routes = useMemo(
    () =>
      ROUTES.map((route) => ({
        ...route,
        total: weighted ? route.sound + route.language : 0,
      })),
    [weighted],
  );

  return (
    <section className="foundations" id="lesson-start" aria-labelledby="foundations-title">
      <div className="foundations__heading">
        <p className="eyebrow">Four answers before the machinery</p>
        <h2 id="foundations-title">The graph stores choices. The weights choose among them.</h2>
        <p>
          That single distinction answers most of the questions that make WFSTs feel larger or
          more mysterious than they are.
        </p>
      </div>

      <div className="training-answer">
        <div className="training-answer__question">
          <span>01</span>
          <p>Does a WFST have to be trained?</p>
        </div>
        <div className="training-answer__split">
          <article>
            <small>The structure</small>
            <h3>Usually built or compiled</h3>
            <p>
              Engineers provide the allowed sound patterns, pronunciations, words, and ways the
              machines connect.
            </p>
          </article>
          <span className="training-answer__plus" aria-hidden="true">
            +
          </span>
          <article>
            <small>The scores</small>
            <h3>Usually learned or estimated</h3>
            <p>
              Audio examples teach acoustic scores; text teaches language probabilities; a small
              amount of tuning balances the evidence.
            </p>
          </article>
        </div>
        <p className="training-answer__result">
          So the useful answer is: <strong>the graph is compiled from knowledge whose numbers often
          come from training.</strong>
        </p>
      </div>

      <div className="weight-lab" aria-labelledby="weight-lab-title">
        <div className="weight-lab__header">
          <div>
            <p className="eyebrow">02 · Try the difference</p>
            <h3 id="weight-lab-title">What changes when the same graph gets weights?</h3>
          </div>
          <div className="weight-toggle" aria-label="Path scoring mode">
            <button
              type="button"
              className={!weighted ? "is-selected" : ""}
              aria-pressed={!weighted}
              onClick={() => setWeighted(false)}
            >
              No weights
            </button>
            <button
              type="button"
              className={weighted ? "is-selected" : ""}
              aria-pressed={weighted}
              onClick={() => setWeighted(true)}
            >
              With weights
            </button>
          </div>
        </div>

        <div className="route-list" aria-live="polite">
          {routes.map((route, index) => {
            const isWinner = weighted && index === 0;
            return (
              <article className={isWinner ? "is-winner" : ""} key={route.text}>
                <span className="route-list__number">{index + 1}</span>
                <p>{route.text}</p>
                <div className="route-list__score">
                  {weighted ? (
                    <>
                      <span>sound {route.sound.toFixed(1)}</span>
                      <span>context {route.language.toFixed(1)}</span>
                      <strong>{route.total.toFixed(1)}</strong>
                    </>
                  ) : (
                    <strong>allowed</strong>
                  )}
                </div>
                {isWinner && <span className="route-list__winner">lowest cost</span>}
              </article>
            );
          })}
        </div>

        <div className={`weight-conclusion ${weighted ? "is-weighted" : ""}`}>
          <strong>{weighted ? "One route wins." : "All three routes tie."}</strong>
          <p>
            {weighted
              ? "The graph still permits the same sentences, but accumulated costs rank them. Lower cost means stronger combined evidence."
              : "An unweighted graph can say “legal” or “illegal,” but it cannot say which legal sentence better matches this recording."}
          </p>
        </div>
      </div>

      <div className="weight-sources">
        <div className="weight-sources__intro">
          <p className="eyebrow">03 · Where the numbers come from</p>
          <h3>Weights are evidence translated into one comparable cost.</h3>
        </div>
        <div className="weight-source-list">
          <article>
            <span>A</span>
            <div>
              <h4>Sound fit</h4>
              <p>
                A trained acoustic model scores how well this particular recording matches each
                sound route. These scores change with the input.
              </p>
            </div>
          </article>
          <article>
            <span>L</span>
            <div>
              <h4>Language fit</h4>
              <p>
                Counts or a trained language model estimate which word sequences are plausible.
                These can be compiled into the graph.
              </p>
            </div>
          </article>
          <article>
            <span>P</span>
            <div>
              <h4>Pronunciation</h4>
              <p>
                If a word has several pronunciations, data or expert rules can make common variants
                cheaper than rare ones.
              </p>
            </div>
          </article>
          <article>
            <span>λ</span>
            <div>
              <h4>System tuning</h4>
              <p>
                Scale factors and penalties keep acoustic and language scores in balance. They are
                tuned on held-out examples.
              </p>
            </div>
          </article>
        </div>
      </div>

      <div className="scale-lab" aria-labelledby="scale-lab-title">
        <div className="scale-lab__copy">
          <p className="eyebrow">04 · Does the graph explode?</p>
          <h3 id="scale-lab-title">
            <code>V²</code> is a dense bigram ceiling, not the size of every WFST.
          </h3>
          <p>
            If every one of <code>V</code> words could follow every other word, a bigram language
            graph could contain <code>V × V</code> transitions. Real language is sparse: most pairs
            never occur or are too weak to keep.
          </p>
          <div className="vocabulary-picker" aria-label="Vocabulary size">
            {VOCABULARY_SIZES.map((size) => (
              <button
                type="button"
                className={vocabulary === size ? "is-selected" : ""}
                aria-pressed={vocabulary === size}
                onClick={() => setVocabulary(size)}
                key={size}
              >
                {formatCount(size)} words
              </button>
            ))}
          </div>
        </div>

        <div className="scale-comparison" aria-live="polite">
          <div className="scale-row scale-row--dense">
            <div>
              <strong>Every word follows every word</strong>
              <small>dense bigram ceiling</small>
            </div>
            <output>{formatCount(denseBigramArcs)} arcs</output>
            <span style={{ width: "100%" }} />
          </div>
          <div className="scale-row scale-row--sparse">
            <div>
              <strong>Keep 40 useful followers per word</strong>
              <small>illustrative sparse graph</small>
            </div>
            <output>{formatCount(illustrativeSparseArcs)} arcs</output>
            <span
              style={{
                width: `${Math.max(2, (illustrativeSparseArcs / denseBigramArcs) * 100)}%`,
              }}
            />
          </div>
          <p>
            The second row is an illustration, not a universal model size. Sharing prefixes,
            backoff arcs, pruning, and exploring only a narrow beam make large systems practical.
          </p>
        </div>
      </div>

      <div className="scale-footnote">
        <strong>The exact rule of thumb:</strong>
        <span>
          unigram choices scale around <code>V</code>; a fully dense bigram can reach{" "}
          <code>V²</code>; a fully dense trigram has a <code>V³</code> transition ceiling. Real
          n-gram graphs are sparse, and a full H∘C∘L∘G decoder has no single vocabulary-only size
          formula.
        </span>
      </div>

      <a className="foundations__continue" href="#weight-training">
        Follow one weight from data to arc <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}
