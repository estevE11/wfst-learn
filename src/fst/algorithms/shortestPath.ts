import type { Arc } from "../types";
import { WFST } from "../wfst";
import { Tropical } from "../semiring";

/**
 * Find the single best path through `f` (lowest total weight = highest
 * probability, since weights are -log-probabilities), using the TROPICAL
 * semiring (⊕ = min, ⊗ = +). This is exactly the Viterbi algorithm.
 *
 * Why tropical specifically, regardless of `f.semiring`? Shortest-path via
 * relaxation (below) only makes sense for a semiring where `plus` picks a
 * single winner among alternatives - that's the tropical semiring's job.
 * (The log semiring's `plus` sums probability mass across ALL paths, which
 * answers a different question - "what's the total probability?" - not
 * "which single path is best?".)
 *
 * Algorithm: Bellman-Ford-style relaxation.
 *   - `dist[s]` = weight of the best known path from the start to state `s`.
 *   - Repeatedly relax every arc: if going through arc (s -> next) improves
 *     `dist[next]`, update it and record a backpointer.
 *   - Because our weights are never negative (they're -log of a probability,
 *     which is in [0, 1]), there are no negative-weight cycles, so this is
 *     guaranteed to converge within `numStates - 1` full passes - the same
 *     guarantee that makes Bellman-Ford correct on general graphs (including
 *     ones with cycles, unlike a plain DAG topological-order relaxation).
 *   - Finally we pick the final state with the best `dist[s] + final[s]` and
 *     walk the backpointers to recover the path.
 */
export function shortestPath(f: WFST): { arcs: Arc[]; states: number[]; weight: number } {
  const n = f.numStates();
  const empty = { arcs: [] as Arc[], states: [] as number[], weight: Tropical.zero };
  if (f.start < 0 || n === 0) return empty;

  const dist = new Array<number>(n).fill(Tropical.zero);
  // Backpointers: to reach state `s` on the current best path, we came from
  // `prevState[s]` via arc `prevArc[s]`.
  const prevState = new Array<number>(n).fill(-1);
  const prevArc = new Array<Arc | null>(n).fill(null);

  dist[f.start] = Tropical.one; // weight 0: free to "be" at the start with no arcs taken.

  // A tiny tolerance avoids relaxing forever on floating-point noise for
  // ties (which would still converge, just wastefully).
  const TOL = 1e-12;

  for (let pass = 0; pass < n - 1; pass++) {
    let improved = false;
    for (let s = 0; s < n; s++) {
      if (dist[s] === Tropical.zero) continue; // state not reachable (yet) - nothing to relax from
      for (const arc of f.states[s].arcs) {
        const candidate = Tropical.times(dist[s], arc.weight);
        if (candidate < dist[arc.next] - TOL) {
          dist[arc.next] = candidate;
          prevState[arc.next] = s;
          prevArc[arc.next] = arc;
          improved = true;
        }
      }
    }
    if (!improved) break; // converged early - no more relaxations found anything better
  }

  // Pick the best final state: minimize dist[s] (times) final[s].
  let bestFinal = -1;
  let bestWeight = Tropical.zero;
  for (let s = 0; s < n; s++) {
    if (f.states[s].final === Tropical.zero) continue; // not a final state
    if (dist[s] === Tropical.zero) continue; // not reachable
    const total = Tropical.times(dist[s], f.states[s].final);
    if (total < bestWeight) {
      bestWeight = total;
      bestFinal = s;
    }
  }

  if (bestFinal === -1) return empty; // no final state reachable from start

  // Walk backpointers from bestFinal back to start, then reverse.
  const statesPath: number[] = [bestFinal];
  const arcsPath: Arc[] = [];
  let cur = bestFinal;
  while (cur !== f.start) {
    const arc = prevArc[cur];
    const prev = prevState[cur];
    if (arc === null || prev === -1) break; // defensive: shouldn't happen if bestFinal is reachable
    arcsPath.push(arc);
    statesPath.push(prev);
    cur = prev;
  }
  statesPath.reverse();
  arcsPath.reverse();

  return { arcs: arcsPath, states: statesPath, weight: bestWeight };
}
