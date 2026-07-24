/**
 * Public API of the WFST core library.
 *
 * This is the single import surface other code (UI components, other
 * algorithms, tests) should use: `import { WFST, Tropical, compose, ... } from "../fst"`.
 */

// Semirings.
export type { Semiring } from "./semiring";
export { Tropical, Log } from "./semiring";

// Core data types.
export type { Arc, State } from "./types";
export { EPSILON } from "./types";

// The WFST class itself.
export { WFST } from "./wfst";

// Algorithms.
export { compose, composeSteps } from "./algorithms/compose";
export { shortestPath } from "./algorithms/shortestPath";

// Rendering / IO.
export { toDot } from "./io/dot";
export type { ToDotOptions } from "./io/dot";
