import { useEffect, useMemo, useState } from "react";
import "./GoalDemo.css";

const FINAL_PHRASE = "The gray cat sat quietly by the window and watched the rain.";

const DEMO_STEPS = [
  {
    short: "Hear",
    title: "A person speaks a sentence.",
    explanation:
      "To us it sounds continuous. To a computer it begins as changing air pressure: a long stream with no spaces between words.",
  },
  {
    short: "Notice",
    title: "The recording becomes small sound clues.",
    explanation:
      "The computer examines one tiny moment after another. Each clue is uncertain on its own, so nothing is committed yet.",
  },
  {
    short: "Guess",
    title: "Every group of clues suggests possible words.",
    explanation:
      "Speech is ambiguous. “Gray” can initially resemble “great,” “cat” can resemble “cap,” and “rain” sounds exactly like “reign.”",
  },
  {
    short: "Connect",
    title: "The possibilities become complete sentences.",
    explanation:
      "Instead of choosing each word separately, the computer keeps several whole routes alive and asks how well every word fits its neighbors.",
  },
  {
    short: "Choose",
    title: "The best complete route wins.",
    explanation:
      "Pronunciation evidence and sentence context agree on one route. We now have a transcript rather than a pile of isolated guesses.",
  },
  {
    short: "Reveal",
    title: "This organized search is the goal.",
    explanation:
      "A WFST is the machine that stores these possible routes and their costs so the computer can find the strongest complete sentence efficiently.",
  },
] as const;

const SOUND_CLUES = [
  "thuh",
  "gray",
  "kat",
  "sat",
  "quiet-lee",
  "bye",
  "thuh",
  "win-doh",
  "and",
  "watcht",
  "thuh",
  "rayn",
];

const WORD_GROUPS = [
  ["the", "a"],
  ["gray", "great"],
  ["cat", "cap"],
  ["sat", "set"],
  ["quietly"],
  ["by", "buy"],
  ["the"],
  ["window"],
  ["and"],
  ["watched", "washed"],
  ["the"],
  ["rain", "reign"],
];

const SENTENCE_OPTIONS = [
  { text: "A great cap set quietly by the window and washed the reign.", fit: "Weak fit" },
  { text: "The gray cat sat quietly by the window and watched the reign.", fit: "Close" },
  { text: FINAL_PHRASE, fit: "Best fit" },
];

const AUTO_STEP_MS = 3200;

export function GoalDemo() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      setStep((current) => {
        if (current === DEMO_STEPS.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, AUTO_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [step, isPlaying]);

  const progress = ((step + 1) / DEMO_STEPS.length) * 100;
  const current = DEMO_STEPS[step];
  const visibleWordGroups = useMemo(
    () => WORD_GROUPS.slice(0, step >= 2 ? WORD_GROUPS.length : 0),
    [step],
  );

  const goToStep = (nextStep: number) => {
    setStep(Math.max(0, Math.min(DEMO_STEPS.length - 1, nextStep)));
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (step === DEMO_STEPS.length - 1) setStep(0);
    setIsPlaying((playing) => !playing);
  };

  const enterLesson = () => {
    document.getElementById("lesson-start")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="goal-demo" aria-labelledby="goal-demo-title">
      <div className="goal-demo__topline">
        <a className="goal-demo__brand" href="#goal-demo-title">
          <span aria-hidden="true">W</span>
          wfst-lab
        </a>
        <button type="button" className="goal-demo__skip" onClick={enterLesson}>
          Skip to the lab ↓
        </button>
      </div>

      <div className="goal-demo__intro">
        <p className="eyebrow">See the destination first</p>
        <h1 id="goal-demo-title">Watch speech become a sentence.</h1>
        <p>
          Before learning how the machine is built, follow one utterance from a continuous sound
          to a confident transcript—one decision at a time.
        </p>
      </div>

      <div className="goal-player">
        <div className="goal-player__progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <ol className="goal-player__steps" aria-label="Demo steps">
          {DEMO_STEPS.map((item, index) => (
            <li key={item.short}>
              <button
                type="button"
                className={index === step ? "is-current" : index < step ? "is-complete" : ""}
                onClick={() => goToStep(index)}
                aria-current={index === step ? "step" : undefined}
              >
                <span>{index < step ? "✓" : index + 1}</span>
                {item.short}
              </button>
            </li>
          ))}
        </ol>

        <div className="goal-stage" key={step}>
          <div className="goal-stage__copy">
            <p className="goal-stage__counter">
              Step {step + 1} of {DEMO_STEPS.length}
            </p>
            <h2>{current.title}</h2>
            <p>{current.explanation}</p>
          </div>

          <div
            className={`conversion-field conversion-field--step-${step}`}
            aria-live="polite"
            aria-label={`Current conversion: ${current.title}`}
          >
            <div className={`conversion-lane audio-lane ${step === 0 ? "is-active" : "is-done"}`}>
              <div className="conversion-lane__label">
                <span>1</span>
                <div>
                  <strong>Spoken audio</strong>
                  <small>One continuous stream</small>
                </div>
              </div>
              <div className={`waveform ${isPlaying ? "is-playing" : ""}`} aria-hidden="true">
                {Array.from({ length: 64 }, (_, index) => (
                  <i
                    key={index}
                    style={{
                      height: `${18 + ((index * 29) % 58)}%`,
                      animationDelay: `${(index % 12) * -70}ms`,
                    }}
                  />
                ))}
              </div>
              <p className="audio-quote">“{FINAL_PHRASE}”</p>
            </div>

            <div
              className={`conversion-arrow ${step >= 1 ? "is-visible" : ""}`}
              aria-hidden="true"
            >
              ↓
            </div>

            <div
              className={`conversion-lane clue-lane ${
                step === 1 ? "is-active" : step > 1 ? "is-done" : "is-waiting"
              }`}
            >
              <div className="conversion-lane__label">
                <span>2</span>
                <div>
                  <strong>Sound clues</strong>
                  <small>Tiny pieces, still uncertain</small>
                </div>
              </div>
              <div className="sound-clues">
                {SOUND_CLUES.map((clue, index) => (
                  <span style={{ animationDelay: `${index * 45}ms` }} key={`${clue}-${index}`}>
                    {clue}
                  </span>
                ))}
              </div>
            </div>

            <div
              className={`conversion-arrow ${step >= 2 ? "is-visible" : ""}`}
              aria-hidden="true"
            >
              ↓
            </div>

            <div
              className={`conversion-lane words-lane ${
                step === 2 ? "is-active" : step > 2 ? "is-done" : "is-waiting"
              }`}
            >
              <div className="conversion-lane__label">
                <span>3</span>
                <div>
                  <strong>Possible words</strong>
                  <small>Several guesses remain</small>
                </div>
              </div>
              <div className="word-groups">
                {visibleWordGroups.map((group, groupIndex) => (
                  <div className="word-group" key={`${group[0]}-${groupIndex}`}>
                    {group.map((word, optionIndex) => (
                      <span
                        className={
                          step >= 4
                            ? optionIndex === 0
                              ? "is-chosen"
                              : "is-rejected"
                            : optionIndex === 0
                              ? "is-leading"
                              : ""
                        }
                        key={word}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`conversion-arrow ${step >= 3 ? "is-visible" : ""}`}
              aria-hidden="true"
            >
              ↓
            </div>

            <div
              className={`conversion-lane routes-lane ${
                step === 3 ? "is-active" : step > 3 ? "is-done" : "is-waiting"
              }`}
            >
              <div className="conversion-lane__label">
                <span>4</span>
                <div>
                  <strong>Complete routes</strong>
                  <small>Context judges the whole sentence</small>
                </div>
              </div>
              <div className="sentence-options">
                {SENTENCE_OPTIONS.map((option, index) => (
                  <div
                    className={
                      step >= 4
                        ? index === SENTENCE_OPTIONS.length - 1
                          ? "is-winner"
                          : "is-rejected"
                        : ""
                    }
                    key={option.text}
                  >
                    <span>{option.text}</span>
                    <small>{option.fit}</small>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`conversion-arrow ${step >= 4 ? "is-visible" : ""}`}
              aria-hidden="true"
            >
              ↓
            </div>

            <div
              className={`conversion-lane transcript-lane ${
                step >= 4 ? "is-active" : "is-waiting"
              }`}
            >
              <div className="conversion-lane__label">
                <span>5</span>
                <div>
                  <strong>Final transcript</strong>
                  <small>The strongest complete route</small>
                </div>
              </div>
              <blockquote>{FINAL_PHRASE}</blockquote>
              {step === 5 && (
                <p className="wfst-reveal">
                  <strong>WFST</strong>
                  stores the routes
                  <span aria-hidden="true">→</span>
                  combines the evidence
                  <span aria-hidden="true">→</span>
                  finds the best sentence
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="goal-player__controls">
          <button
            type="button"
            onClick={() => goToStep(step - 1)}
            disabled={step === 0}
            aria-label="Previous demo step"
          >
            ← Previous
          </button>
          <button
            type="button"
            className="goal-player__play"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause demo" : step === DEMO_STEPS.length - 1 ? "Replay demo" : "Play demo"}
          >
            <span aria-hidden="true">
              {isPlaying ? "Ⅱ" : step === DEMO_STEPS.length - 1 ? "↻" : "▶"}
            </span>
            {isPlaying ? "Pause" : step === DEMO_STEPS.length - 1 ? "Replay" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => goToStep(step + 1)}
            disabled={step === DEMO_STEPS.length - 1}
            aria-label="Next demo step"
          >
            Next →
          </button>
        </div>

        {step === DEMO_STEPS.length - 1 && (
          <div className="goal-player__handoff">
            <p>You have seen the destination. Now open the machine and build the route finder.</p>
            <button type="button" onClick={enterLesson}>
              See how the machine is built ↓
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
