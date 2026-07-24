/**
 * Core data types for the WFST representation.
 *
 * A WFST is a directed, labeled, weighted graph: states connected by arcs.
 * Each arc translates an input symbol into an output symbol (a transducer),
 * accumulating weight along the way. An acceptor is just a transducer where
 * ilabel === olabel on every arc.
 */

/** Reserved label meaning "no symbol consumed/emitted" (epsilon). */
export const EPSILON = "<eps>";

/**
 * A single labeled, weighted transition out of a state.
 *
 * `next` is the destination state's index within the owning WFST's `states` array.
 * Use `EPSILON` ("<eps>") for `ilabel`/`olabel` to represent an epsilon transition
 * (one that consumes/emits no symbol).
 */
export interface Arc {
  /** Input symbol consumed by this arc (or EPSILON). */
  ilabel: string;
  /** Output symbol emitted by this arc (or EPSILON). */
  olabel: string;
  /** Weight of taking this arc, in the owning WFST's semiring. */
  weight: number;
  /** Destination state index. */
  next: number;
}

/**
 * A state (node) in the WFST: a bundle of outgoing arcs plus a final weight.
 *
 * `final` is the weight of stopping/accepting at this state. A value of
 * `Infinity` (the tropical/log semiring's `zero`) means the state is NOT
 * an accepting/final state - there is no way to stop here successfully.
 */
export interface State {
  /** Outgoing arcs from this state. */
  arcs: Arc[];
  /** Final weight; Infinity means this state is not final. */
  final: number;
}
