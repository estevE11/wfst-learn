import type { Arc, State } from "./types";
import type { Semiring } from "./semiring";
import { Tropical } from "./semiring";

/**
 * A Weighted Finite State Transducer.
 *
 * This is the central data structure of the library: a list of `states`,
 * each holding a list of outgoing `arcs`, plus a designated `start` state
 * and a `semiring` that defines how weights combine (see semiring.ts).
 *
 * States are referred to by their index into `states`. There is no notion
 * of "removing" a state (to keep indices stable); algorithms that prune
 * states build a fresh WFST instead.
 */
export class WFST {
  states: State[] = [];
  start: number = -1;
  semiring: Semiring;

  constructor(semiring: Semiring = Tropical) {
    this.semiring = semiring;
  }

  /** Add a new, non-final state with no arcs. Returns its index. */
  addState(): number {
    this.states.push({ arcs: [], final: this.semiring.zero });
    return this.states.length - 1;
  }

  /** Add an outgoing arc from state `from`. */
  addArc(from: number, arc: Arc): void {
    this.assertState(from);
    this.assertState(arc.next);
    this.states[from].arcs.push(arc);
  }

  /** Mark `s` as the (unique) start state. */
  setStart(s: number): void {
    this.assertState(s);
    this.start = s;
  }

  /**
   * Mark `s` as a final (accepting) state with the given final weight.
   * Defaults to `semiring.one` (weight 0 under tropical/log), the usual
   * "free to stop here" weight. Pass `semiring.zero` to un-mark a state
   * as final.
   */
  setFinal(s: number, w: number = this.semiring.one): void {
    this.assertState(s);
    this.states[s].final = w;
  }

  /** Total number of states. */
  numStates(): number {
    return this.states.length;
  }

  /** Total number of arcs across all states. */
  numArcs(): number {
    let n = 0;
    for (const s of this.states) n += s.arcs.length;
    return n;
  }

  /** Deep copy of this WFST (states/arcs are copied, semiring reference is shared). */
  clone(): WFST {
    const copy = new WFST(this.semiring);
    copy.start = this.start;
    copy.states = this.states.map((s) => ({
      final: s.final,
      arcs: s.arcs.map((a) => ({ ...a })),
    }));
    return copy;
  }

  private assertState(s: number): void {
    if (s < 0 || s >= this.states.length) {
      throw new RangeError(`WFST: state index ${s} out of range (have ${this.states.length} states)`);
    }
  }
}
