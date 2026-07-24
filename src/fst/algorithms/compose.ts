import type { Arc } from "../types";
import { EPSILON } from "../types";
import { WFST } from "../wfst";

/**
 * Weighted composition: A ∘ B.
 *
 * Composition is the workhorse of WFST-based decoding: it "plugs" the output
 * tape of A into the input tape of B, producing a new transducer that maps
 * A's input symbols directly to B's output symbols, through every path where
 * A's output matches B's input. For example L ∘ G plugs the lexicon's word
 * output into the grammar's word input, giving you phones -> weighted words.
 *
 * The product construction: each state in the result corresponds to a PAIR
 * of states (aState, bState) - one from A, one from B - meaning "A is at
 * aState and B is at bState, having consumed/emitted matching symbols so
 * far". We build this product lazily via BFS starting from (A.start, B.start).
 *
 * --- THE EPSILON PROBLEM ---
 * Epsilon (ε) arcs consume/emit no symbol, so they don't need to "match"
 * anything on the other side: A can advance alone on an ε-output arc (B
 * stays put), or B can advance alone on an ε-input arc (A stays put). The
 * trouble: if BOTH moves are available at the same product state (p, q),
 * naive composition would explore "A moves, then B moves" AND "B moves,
 * then A moves" as two *separate* paths through the product graph - even
 * though they land on the exact same later state and represent the exact
 * same underlying alignment of the two tapes. That's redundant, and it
 * actively breaks the log semiring (where `plus` sums probability mass:
 * counting one alignment twice inflates the total).
 *
 * THE FIX (an epsilon filter): carry a tiny filter state in every product
 * state. 0 means no epsilon ordering is in progress, 1 means A has advanced
 * alone, and 2 means B has advanced alone. We allow the canonical A-then-B
 * ordering but reject B-then-A until a real symbol match resets the filter.
 * This removes duplicate interleavings without losing a valid path when one
 * side has both epsilon and real-symbol alternatives.
 */
export function compose(a: WFST, b: WFST): WFST {
  const semiring = a.semiring;
  const result = new WFST(semiring);

  type FilterState = 0 | 1 | 2;

  // Product states are keyed by "aState,bState,filter" -> result index.
  const stateMap = new Map<string, number>();
  const queue: Array<[number, number, FilterState]> = [];

  const key = (ai: number, bi: number, filter: FilterState) => `${ai},${bi},${filter}`;

  function getOrCreate(ai: number, bi: number, filter: FilterState): number {
    const k = key(ai, bi, filter);
    let idx = stateMap.get(k);
    if (idx === undefined) {
      idx = result.addState();
      stateMap.set(k, idx);
      queue.push([ai, bi, filter]);
    }
    return idx;
  }

  if (a.start < 0 || b.start < 0) {
    // Nothing to compose; return an empty WFST with no start state.
    return result;
  }

  result.setStart(getOrCreate(a.start, b.start, 0));

  while (queue.length > 0) {
    const [ai, bi, filter] = queue.shift()!;
    const srcIdx = stateMap.get(key(ai, bi, filter))!;
    const aState = a.states[ai];
    const bState = b.states[bi];

    // A product state is final only if BOTH sides are final; the combined
    // final weight accumulates both final costs via `times`.
    if (aState.final !== semiring.zero && bState.final !== semiring.zero) {
      result.setFinal(srcIdx, semiring.times(aState.final, bState.final));
    }

    // --- 1. Real symbol matches: A's olabel == B's ilabel, neither epsilon.
    // Always allowed, regardless of what epsilon arcs are also present.
    for (const aArc of aState.arcs) {
      if (aArc.olabel === EPSILON) continue;
      for (const bArc of bState.arcs) {
        if (bArc.ilabel !== aArc.olabel) continue;
        const dst = getOrCreate(aArc.next, bArc.next, 0);
        const arc: Arc = {
          ilabel: aArc.ilabel,
          olabel: bArc.olabel,
          weight: semiring.times(aArc.weight, bArc.weight),
          next: dst,
        };
        result.addArc(srcIdx, arc);
      }
    }

    // --- 2. A-alone epsilon step: A emits ε (nothing for B to match), B
    // stays put. Disallowed after B has already moved alone, which rejects
    // the duplicate B-then-A ordering while keeping A-then-B.
    if (filter !== 2) {
      for (const aArc of aState.arcs) {
        if (aArc.olabel !== EPSILON) continue;
        const dst = getOrCreate(aArc.next, bi, 1);
        const arc: Arc = {
          ilabel: aArc.ilabel,
          olabel: EPSILON,
          weight: aArc.weight,
          next: dst,
        };
        result.addArc(srcIdx, arc);
      }
    }

    // --- 3. B-alone epsilon step: B consumes ε (nothing from A to match), A
    // stays put. This is allowed in every filter state; after it happens,
    // A-alone moves remain blocked until a real match resets the filter.
    for (const bArc of bState.arcs) {
      if (bArc.ilabel !== EPSILON) continue;
      const dst = getOrCreate(ai, bArc.next, 2);
      const arc: Arc = {
        ilabel: EPSILON,
        olabel: bArc.olabel,
        weight: bArc.weight,
        next: dst,
      };
      result.addArc(srcIdx, arc);
    }
  }

  return result;
}

/**
 * A simplified, step-by-step walk of the same product-state BFS that
 * `compose` performs, for visualization purposes. It yields each NEW
 * product state-pair the moment it's first discovered, along with a short
 * human-readable note about how it was reached.
 *
 * This intentionally ignores the epsilon-priority bookkeeping (which exists
 * to avoid double-counting weights/paths - see `compose`'s doc comment) and
 * just tracks (aState, bState) pairs, since for a step-through visualization
 * what matters is "which states get explored, and why", not exact weight
 * semantics.
 */
export function* composeSteps(a: WFST, b: WFST): Generator<{ pair: [number, number]; note: string }> {
  if (a.start < 0 || b.start < 0) return;

  const visited = new Set<string>();
  const startKey = `${a.start},${b.start}`;
  visited.add(startKey);
  const queue: Array<[number, number]> = [[a.start, b.start]];

  yield {
    pair: [a.start, b.start],
    note: `Start: product state (A=${a.start}, B=${b.start})`,
  };

  while (queue.length > 0) {
    const [ai, bi] = queue.shift()!;
    const aState = a.states[ai];
    const bState = b.states[bi];

    // Real symbol matches.
    for (const aArc of aState.arcs) {
      if (aArc.olabel === EPSILON) continue;
      for (const bArc of bState.arcs) {
        if (bArc.ilabel !== aArc.olabel) continue;
        const k = `${aArc.next},${bArc.next}`;
        if (!visited.has(k)) {
          visited.add(k);
          queue.push([aArc.next, bArc.next]);
          yield {
            pair: [aArc.next, bArc.next],
            note: `Matched "${aArc.olabel}": A ${ai}->${aArc.next}, B ${bi}->${bArc.next}`,
          };
        }
      }
    }

    // A-epsilon steps.
    for (const aArc of aState.arcs) {
      if (aArc.olabel !== EPSILON) continue;
      const k = `${aArc.next},${bi}`;
      if (!visited.has(k)) {
        visited.add(k);
        queue.push([aArc.next, bi]);
        yield {
          pair: [aArc.next, bi],
          note: `A takes ε-output arc (${ai}->${aArc.next}); B stays at ${bi}`,
        };
      }
    }

    // B-epsilon steps.
    for (const bArc of bState.arcs) {
      if (bArc.ilabel !== EPSILON) continue;
      const k = `${ai},${bArc.next}`;
      if (!visited.has(k)) {
        visited.add(k);
        queue.push([ai, bArc.next]);
        yield {
          pair: [ai, bArc.next],
          note: `B takes ε-input arc (${bi}->${bArc.next}); A stays at ${ai}`,
        };
      }
    }
  }
}
