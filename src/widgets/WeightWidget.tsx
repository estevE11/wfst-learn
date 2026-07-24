import { useState } from "react";
import { Tropical } from "../fst";
import "./widgets.css";

export function WeightWidget() {
  const [probability, setProbability] = useState(0.7);
  const weight = -Math.log(probability);

  return (
    <div className="widget widget--compact">
      <h3>Probability → decoder cost</h3>
      <p className="widget-desc">
        Move the probability. The decoder stores the same information as a negative-log weight,
        where lower means more likely.
      </p>
      <label className="widget-slider">
        <span>p = {probability.toFixed(2)}</span>
        <input
          type="range"
          min={0.01}
          max={1}
          step={0.01}
          value={probability}
          onChange={(event) => setProbability(Number(event.target.value))}
        />
      </label>
      <div className="weight-equation" aria-live="polite">
        <span>−log({probability.toFixed(2)})</span>
        <span aria-hidden="true">=</span>
        <strong>{Tropical.toDisplay(weight)}</strong>
      </div>
      <div className="probability-track" aria-hidden="true">
        <span style={{ width: `${probability * 100}%` }} />
      </div>
      <p className="widget-note">
        Multiplying probabilities becomes adding costs: −log(p₁ × p₂) = −log(p₁) + −log(p₂).
      </p>
    </div>
  );
}
