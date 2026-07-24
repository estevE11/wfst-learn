/**
 * Semirings for weighted finite-state transducers.
 *
 * Every weight in this codebase is stored as a **negative log** value:
 *   weight = -log(probability)
 * So a probability of 1 (certain) has weight 0, and a probability
 * approaching 0 (impossible) has weight approaching +Infinity.
 *
 * A semiring gives us two operations over these weights:
 *   - `plus`  (⊕) : how to COMBINE weights of alternative paths (choose between them)
 *   - `times` (⊗) : how to COMBINE weights along a single path (accumulate along it)
 *
 * Two semirings matter for ASR decoding:
 *   - Tropical: ⊕ = min, ⊗ = +.  "Best path" semiring — used for Viterbi / shortest path,
 *     because taking the min of -log-probs picks the highest-probability path.
 *   - Log:      ⊕ = -log(e^-a + e^-b), ⊗ = +.  "Sum over all paths" semiring — used when you
 *     want the *total* probability mass over all paths (e.g. forward score, lattice marginals),
 *     because it correctly sums probabilities instead of just picking the best one.
 */
export interface Semiring {
  /** Identity element for `plus` (the "no path" / impossible weight). */
  readonly zero: number;
  /** Identity element for `times` (the "free" / certain weight). */
  readonly one: number;
  /** Combine weights of two alternative paths ("OR" - pick/aggregate). */
  plus(a: number, b: number): number;
  /** Combine weights along one path ("AND" - accumulate). */
  times(a: number, b: number): number;
  /** Approximate equality check (weights are floats). */
  equals(a: number, b: number): boolean;
  /** Human-readable rendering of a weight, for graph/UI display. */
  toDisplay(w: number): string;
  /** Semiring name, for UI labels. */
  name: string;
}

/** Small tolerance used for float comparisons of weights. */
const EPSILON = 1e-6;

function displayWeight(w: number): string {
  if (w === Infinity) return "∞";
  if (w === -Infinity) return "-∞";
  // Round to 3 decimal places for readability; drop trailing zeros.
  return (Math.round(w * 1000) / 1000).toString();
}

/**
 * Tropical semiring: (min, +).
 * This is the "best path" semiring used for Viterbi / shortest-path decoding:
 * `plus` keeps only the lower (better) of two -log-prob weights, `times` adds
 * weights along a path (since -log(p1*p2) = -log(p1) + -log(p2)).
 */
export const Tropical: Semiring = {
  zero: Infinity,
  one: 0,
  plus: (a, b) => Math.min(a, b),
  times: (a, b) => a + b,
  equals: (a, b) => a === b || Math.abs(a - b) < EPSILON,
  toDisplay: displayWeight,
  name: "tropical",
};

/**
 * Log semiring: (logAdd, +).
 * This is the "sum over all paths" semiring: `plus` combines two -log-prob
 * weights the way you'd combine probabilities if you summed them:
 *   -log(e^-a + e^-b)
 * computed in a numerically stable way (factor out the smaller exponent).
 * Used for forward scores / lattice marginals where you want total probability
 * mass rather than just the single best path.
 */
export const Log: Semiring = {
  zero: Infinity,
  one: 0,
  plus: (a, b) => {
    if (a === Infinity) return b;
    if (b === Infinity) return a;
    // Stable log-add: -log(e^-a + e^-b)
    // = min(a,b) - log(1 + e^-(|a-b|))
    const m = Math.min(a, b);
    const diff = Math.abs(a - b);
    return m - Math.log1p(Math.exp(-diff));
  },
  times: (a, b) => a + b,
  equals: (a, b) => a === b || Math.abs(a - b) < EPSILON,
  toDisplay: displayWeight,
  name: "log",
};
