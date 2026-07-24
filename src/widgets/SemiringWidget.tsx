import { useMemo, useState } from "react";
import { WFST, Tropical, Log, EPSILON, type Semiring } from "../fst";
import { FstGraph } from "../components/FstGraph";
import "./widgets.css";

/**
 * Builds the fixed 2-path toy machine: a single start state with two
 * parallel arcs (path "A" and path "B") both landing on the same final
 * state. `wA`/`wB` are the two paths' total weights (-log probabilities).
 */
function buildToy(semiring: Semiring, wA: number, wB: number): WFST {
  const f = new WFST(semiring);
  const s0 = f.addState();
  const s1 = f.addState();
  f.setStart(s0);
  f.addArc(s0, { ilabel: "A", olabel: EPSILON, weight: wA, next: s1 });
  f.addArc(s0, { ilabel: "B", olabel: EPSILON, weight: wB, next: s1 });
  f.setFinal(s1, semiring.one);
  return f;
}

/**
 * `semiring` widget: toggle Tropical <-> Log on a fixed 2-path toy machine.
 * Two arcs, "A" and "B", leave the start state and both land on the final
 * state. Sliders control each path's weight; toggling the semiring changes
 * how the two alternatives are COMBINED (`plus`), and highlights the arc
 * that "wins" under the tropical semiring (there is no single winner under
 * log - it sums probability mass over both paths instead).
 */
export function SemiringWidget() {
  const [semiringName, setSemiringName] = useState<"tropical" | "log">("tropical");
  const [wA, setWA] = useState(1.2);
  const [wB, setWB] = useState(0.5);

  const semiring = semiringName === "tropical" ? Tropical : Log;
  const fst = useMemo(() => buildToy(semiring, wA, wB), [semiring, wA, wB]);

  const combined = semiring.plus(wA, wB);
  const aWins = wA <= wB;
  const highlightArcs = semiringName === "tropical" ? [{ from: 0, arcIndex: aWins ? 0 : 1 }] : [];

  return (
    <div className="widget">
      <h3>Semiring: tropical vs. log</h3>
      <p className="widget-desc">
        Two paths, "A" and "B", both go from the start state to the final state. A semiring is just
        two operations: <code>⊗</code> (times) combines weights <em>along</em> a path, and{" "}
        <code>⊕</code> (plus) combines weights <em>across</em> alternative paths. Here each path is
        a single arc, so toggle the semiring below to see how <code>⊕</code> changes.
      </p>

      <div className="widget-controls">
        <label>
          <input
            type="radio"
            name="semiring"
            checked={semiringName === "tropical"}
            onChange={() => setSemiringName("tropical")}
          />
          Tropical (⊕ = min)
        </label>
        <label>
          <input
            type="radio"
            name="semiring"
            checked={semiringName === "log"}
            onChange={() => setSemiringName("log")}
          />
          Log (⊕ = -log(e⁻ᵃ+e⁻ᵇ))
        </label>
      </div>

      <div className="widget-row">
        <label>
          Weight of A: <input
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={wA}
            onChange={(e) => setWA(Number(e.target.value))}
          />
          <span className="mono">{wA.toFixed(2)}</span>
        </label>
        <label>
          Weight of B: <input
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={wB}
            onChange={(e) => setWB(Number(e.target.value))}
          />
          <span className="mono">{wB.toFixed(2)}</span>
        </label>
      </div>

      <FstGraph fst={fst} title={`Toy machine (${semiring.name} semiring)`} highlightArcs={highlightArcs} />

      <div className="widget-row" style={{ marginTop: 10 }}>
        <span className={`widget-stat ${semiringName === "tropical" && aWins ? "winner" : ""}`}>
          <span className="label">A:</span> <span className="value">{Tropical.toDisplay(wA)}</span>
        </span>
        <span className={`widget-stat ${semiringName === "tropical" && !aWins ? "winner" : ""}`}>
          <span className="label">B:</span> <span className="value">{Tropical.toDisplay(wB)}</span>
        </span>
        <span className="widget-stat winner">
          <span className="label">A ⊕ B =</span> <span className="value">{semiring.toDisplay(combined)}</span>
        </span>
      </div>

      <div className="widget-note">
        {semiringName === "tropical" ? (
          <>
            Tropical <code>⊕ = min</code> just <strong>picks the winner</strong>: path{" "}
            <strong>{aWins ? "A" : "B"}</strong> has the lower (better) weight, so it wins outright and
            the other path is discarded. That's exactly Viterbi / shortest-path decoding.
          </>
        ) : (
          <>
            Log <code>⊕</code> doesn't pick a winner - it adds the two paths' <em>probability mass</em>{" "}
            together (in -log space). The combined score {Log.toDisplay(combined)} is always ≤ min(A,
            B), because summing two positive probabilities is more than either alone. This is what you
            want for a forward score / lattice total, where every path should count.
          </>
        )}
      </div>
    </div>
  );
}
