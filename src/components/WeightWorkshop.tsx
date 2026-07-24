import { useState } from "react";
import "./WeightWorkshop.css";

const STEPS = [
  {
    short: "Define",
    title: "Decide what one arc means.",
    explanation:
      "We will build one language-model arc: after seeing “the”, take the word “cat”. The graph structure says this transition is possible; the weight will say how surprising it is.",
  },
  {
    short: "Observe",
    title: "Collect examples from the right kind of data.",
    explanation:
      "For a language arc, use text. Count what followed “the” in a tiny training corpus. Acoustic arcs use recordings instead; pronunciation arcs use observed pronunciation variants.",
  },
  {
    short: "Estimate",
    title: "Turn counts into a probability.",
    explanation:
      "Raw frequency is a start, but production models smooth the counts so unseen events are not automatically impossible. Here add-one smoothing gives “cat” 43 adjusted counts out of 104.",
  },
  {
    short: "Convert",
    title: "Convert probability into an additive cost.",
    explanation:
      "WFST shortest-path search prefers smaller totals. Negative log turns a likely event into a small cost and lets multiplied probabilities become costs that simply add along a route.",
  },
  {
    short: "Attach",
    title: "Write the cost onto the matching arc.",
    explanation:
      "The “cat” transition receives cost 0.88. Repeating the same recipe for every retained transition builds the weighted language graph G.",
  },
  {
    short: "Combine",
    title: "Add input-dependent evidence during decoding.",
    explanation:
      "The compiled language cost stays 0.88. For this recording, the acoustic model supplies a fresh 0.31 cost when the decoder traverses the matching sound transition.",
  },
  {
    short: "Validate",
    title: "Tune the system, then test on data it never trained on.",
    explanation:
      "Developers adjust acoustic/language scales and penalties on held-out examples, compile or optimize the graph, then report accuracy on a separate test set. Test data must not choose the weights.",
  },
] as const;

const COUNTS = [
  { word: "cat", raw: 42, adjusted: 43 },
  { word: "dog", raw: 18, adjusted: 19 },
  { word: "rain", raw: 10, adjusted: 11 },
  { word: "other", raw: 30, adjusted: 31 },
] as const;

const ARC_SOURCES = [
  {
    machine: "G",
    name: "Word-sequence arc",
    data: "A text corpus",
    estimate: "P(next word | history)",
    placement: "Fixed in the compiled graph",
  },
  {
    machine: "L",
    name: "Pronunciation branch",
    data: "Pronunciation observations or expert rules",
    estimate: "P(pronunciation | word)",
    placement: "Usually fixed in the lexicon",
  },
  {
    machine: "H",
    name: "HMM transition",
    data: "Aligned speech examples",
    estimate: "P(next state | current state)",
    placement: "Usually fixed in the graph",
  },
  {
    machine: "A",
    name: "Acoustic emission",
    data: "Training speech builds the model; current audio supplies the frame",
    estimate: "acoustic cost(state, frame)",
    placement: "Computed again at decoding time",
  },
] as const;

function StepVisual({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="workshop-definition">
        <div className="workshop-state">history: “the”</div>
        <span aria-hidden="true">→</span>
        <div className="workshop-arc">
          <small>candidate arc</small>
          <strong>cat / ?</strong>
          <span>possible, not scored yet</span>
        </div>
        <span aria-hidden="true">→</span>
        <div className="workshop-state">history: “the cat”</div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="training-samples">
        {[
          "the cat slept",
          "the dog barked",
          "the cat sat",
          "the rain stopped",
          "the cat watched",
        ].map((sample) => (
          <p key={sample}>
            {sample.split(" ").map((word, index) => (
              <span className={index === 1 ? "is-observation" : ""} key={`${word}-${index}`}>
                {word}
              </span>
            ))}
          </p>
        ))}
        <small>…plus 95 more occurrences of “the ___”</small>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="count-estimate">
        {COUNTS.map((item) => (
          <div className={item.word === "cat" ? "is-target" : ""} key={item.word}>
            <span>{item.word}</span>
            <i style={{ width: `${item.adjusted * 2}%` }} />
            <strong>{item.raw} + 1</strong>
          </div>
        ))}
        <p>
          <span>adjusted count for cat</span>
          <strong>43</strong>
          <b>÷</b>
          <span>adjusted total</span>
          <strong>104</strong>
          <b>=</b>
          <output>0.413</output>
        </p>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="cost-conversion">
        <div>
          <small>estimated probability</small>
          <strong>0.413</strong>
        </div>
        <span aria-hidden="true">→</span>
        <div className="cost-conversion__formula">
          <small>negative log</small>
          <code>−ln(0.413)</code>
        </div>
        <span aria-hidden="true">→</span>
        <div className="cost-conversion__result">
          <small>arc cost</small>
          <strong>0.88</strong>
        </div>
        <p>More likely → smaller cost → more likely to survive shortest-path search.</p>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="weighted-arc-diagram">
        <div className="weighted-node">
          <span>0</span>
          <small>“the”</small>
        </div>
        <div className="weighted-edge">
          <strong>cat : cat / 0.88</strong>
          <span aria-hidden="true">→</span>
          <small>input : output / cost</small>
        </div>
        <div className="weighted-node">
          <span>1</span>
          <small>“the cat”</small>
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="runtime-sum">
        <div>
          <small>compiled language cost</small>
          <strong>0.88</strong>
          <span>same for every recording</span>
        </div>
        <b aria-hidden="true">+</b>
        <div>
          <small>acoustic cost now</small>
          <strong>0.31</strong>
          <span>changes with this audio</span>
        </div>
        <b aria-hidden="true">=</b>
        <div className="runtime-sum__total">
          <small>partial route cost</small>
          <strong>1.19</strong>
          <span>added to previous arcs</span>
        </div>
      </div>
    );
  }

  return (
    <div className="data-split">
      <div>
        <span>1</span>
        <strong>Train</strong>
        <small>estimate model parameters</small>
      </div>
      <i aria-hidden="true">→</i>
      <div>
        <span>2</span>
        <strong>Development</strong>
        <small>choose scales and penalties</small>
      </div>
      <i aria-hidden="true">→</i>
      <div>
        <span>3</span>
        <strong>Test</strong>
        <small>measure final accuracy once</small>
      </div>
      <i aria-hidden="true">→</i>
      <div>
        <span>4</span>
        <strong>Deploy</strong>
        <small>decode new recordings</small>
      </div>
    </div>
  );
}

export function WeightWorkshop() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const moveTo = (next: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  };

  return (
    <section className="weight-workshop" id="weight-training" aria-labelledby="weight-workshop-title">
      <div className="weight-workshop__heading">
        <p className="eyebrow">Build one real weight, start to finish</p>
        <h2 id="weight-workshop-title">How does a blank arc become a weighted arc?</h2>
        <p>
          There is no single “train the WFST” button. Each type of knowledge uses the data that
          matches it, turns an estimated probability into a cost, and places that cost where the
          decoder can add it.
        </p>
      </div>

      <div className="workshop-player">
        <ol className="workshop-steps" aria-label="Arc-weight construction steps">
          {STEPS.map((item, index) => (
            <li key={item.short}>
              <button
                type="button"
                className={index === step ? "is-current" : index < step ? "is-complete" : ""}
                onClick={() => moveTo(index)}
                aria-current={index === step ? "step" : undefined}
              >
                <span>{index < step ? "✓" : index + 1}</span>
                {item.short}
              </button>
            </li>
          ))}
        </ol>

        <div className="workshop-current" key={step}>
          <div className="workshop-current__copy">
            <p>
              Step {step + 1} of {STEPS.length}
            </p>
            <h3>{current.title}</h3>
            <span>{current.explanation}</span>
          </div>
          <div className="workshop-visual" aria-live="polite">
            <StepVisual step={step} />
          </div>
        </div>

        <div className="workshop-controls">
          <button
            type="button"
            onClick={() => moveTo(step - 1)}
            disabled={step === 0}
            aria-label="Previous weight-building step"
          >
            ← Previous
          </button>
          <span>
            <strong>{step + 1}</strong> / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={() => moveTo(step + 1)}
            disabled={step === STEPS.length - 1}
            aria-label="Next weight-building step"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="arc-source-section">
        <div>
          <p className="eyebrow">Repeat the recipe for each source</p>
          <h3>Not every cost comes from the same dataset—or at the same time.</h3>
        </div>
        <div className="arc-source-table-wrap">
          <table className="arc-source-table">
            <thead>
              <tr>
                <th>Arc or score</th>
                <th>Evidence or source</th>
                <th>Estimate</th>
                <th>When attached</th>
              </tr>
            </thead>
            <tbody>
              {ARC_SOURCES.map((source) => (
                <tr key={source.machine}>
                  <th scope="row">
                    <span>{source.machine}</span>
                    {source.name}
                  </th>
                  <td>{source.data}</td>
                  <td>
                    <code>{source.estimate}</code>
                  </td>
                  <td>{source.placement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="workshop-summary">
        <strong>For every complete path:</strong>
        <code>
          total cost = acoustic evidence + HMM transitions + pronunciation costs + language costs
          + tuned penalties
        </code>
        <span>The decoder adds them arc by arc and keeps the lowest-cost complete route.</span>
      </div>

      <a className="weight-workshop__continue" href="#technical-lab">
        See these costs in the live graph <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}
