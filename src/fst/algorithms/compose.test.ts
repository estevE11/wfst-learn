import { describe, it, expect } from "vitest";
import { WFST } from "../wfst";
import { Tropical } from "../semiring";
import { EPSILON } from "../types";
import { compose } from "./compose";
import { shortestPath } from "./shortestPath";

describe("compose", () => {
  it("matches labels and sums weights along a simple two-arc chain", () => {
    // A: 0 -a:x/1-> 1 (final)
    const a = new WFST(Tropical);
    const a0 = a.addState();
    const a1 = a.addState();
    a.setStart(a0);
    a.addArc(a0, { ilabel: "a", olabel: "x", weight: 1, next: a1 });
    a.setFinal(a1, 0);

    // B: 0 -x:y/2-> 1 (final)
    const b = new WFST(Tropical);
    const b0 = b.addState();
    const b1 = b.addState();
    b.setStart(b0);
    b.addArc(b0, { ilabel: "x", olabel: "y", weight: 2, next: b1 });
    b.setFinal(b1, 0);

    const composed = compose(a, b);
    const path = shortestPath(composed);

    // A ∘ B should map "a" -> "y" with weight 1 + 2 = 3.
    expect(path.weight).toBeCloseTo(3, 9);
    expect(path.arcs).toHaveLength(1);
    expect(path.arcs[0].ilabel).toBe("a");
    expect(path.arcs[0].olabel).toBe("y");
    expect(path.arcs[0].weight).toBeCloseTo(3, 9);
  });

  it("only accepts when both machines can complete a full path (rejects mismatched labels)", () => {
    const a = new WFST(Tropical);
    const a0 = a.addState();
    const a1 = a.addState();
    a.setStart(a0);
    a.addArc(a0, { ilabel: "a", olabel: "x", weight: 0, next: a1 });
    a.setFinal(a1, 0);

    const b = new WFST(Tropical);
    const b0 = b.addState();
    const b1 = b.addState();
    b.setStart(b0);
    // B expects "z" on input, not "x" - no match possible.
    b.addArc(b0, { ilabel: "z", olabel: "y", weight: 0, next: b1 });
    b.setFinal(b1, 0);

    const composed = compose(a, b);
    const path = shortestPath(composed);

    // No path should be found: weight stays at the semiring's zero (Infinity).
    expect(path.weight).toBe(Tropical.zero);
    expect(path.arcs).toHaveLength(0);
  });

  it("correctly threads multi-step epsilon prefixes on both sides without double counting or deadlocking", () => {
    // This exercises the epsilon filter: A needs two consecutive epsilon
    // steps before its real arc, and so does B. A naive implementation can
    // either double-count this alignment (exploring both "A-eps-then-B-eps"
    // and "B-eps-then-A-eps" as separate paths) or, with an overly strict
    // filter, deadlock entirely (neither side ever gets to advance). This
    // test pins down the correct behavior: exactly one path is found, with
    // the total weight being the sum of every arc along the (only) alignment.
    const a = new WFST(Tropical);
    const s0 = a.addState();
    const s1 = a.addState();
    const s2 = a.addState();
    const s3 = a.addState();
    a.setStart(s0);
    a.addArc(s0, { ilabel: EPSILON, olabel: EPSILON, weight: 0.1, next: s1 });
    a.addArc(s1, { ilabel: EPSILON, olabel: EPSILON, weight: 0.2, next: s2 });
    a.addArc(s2, { ilabel: "a", olabel: "x", weight: 0, next: s3 });
    a.setFinal(s3, 0);

    const b = new WFST(Tropical);
    const t0 = b.addState();
    const t1 = b.addState();
    const t2 = b.addState();
    const t3 = b.addState();
    b.setStart(t0);
    b.addArc(t0, { ilabel: EPSILON, olabel: EPSILON, weight: 0.3, next: t1 });
    b.addArc(t1, { ilabel: EPSILON, olabel: EPSILON, weight: 0.4, next: t2 });
    b.addArc(t2, { ilabel: "x", olabel: "y", weight: 0, next: t3 });
    b.setFinal(t3, 0);

    const composed = compose(a, b);
    const path = shortestPath(composed);

    expect(path.weight).toBeCloseTo(0.1 + 0.2 + 0.3 + 0.4, 9);
    // The path should consume/emit exactly one real symbol ("a" -> "y");
    // the epsilon steps don't show up as separate composed arcs carrying
    // real labels.
    const realArcs = path.arcs.filter((arc) => arc.ilabel !== EPSILON);
    expect(realArcs).toHaveLength(1);
    expect(realArcs[0].ilabel).toBe("a");
    expect(realArcs[0].olabel).toBe("y");
  });

  it("picks up final weights from both machines (combined via times)", () => {
    const a = new WFST(Tropical);
    const a0 = a.addState();
    a.setStart(a0);
    a.setFinal(a0, 0.5);

    const b = new WFST(Tropical);
    const b0 = b.addState();
    b.setStart(b0);
    b.setFinal(b0, 0.25);

    const composed = compose(a, b);
    const path = shortestPath(composed);

    expect(path.weight).toBeCloseTo(0.75, 9);
    expect(path.arcs).toHaveLength(0); // empty path, both start states are immediately final
  });

  it("does not lose a real-symbol path when A also has an epsilon alternative", () => {
    // A may emit x directly, but also has an unrelated epsilon-output branch.
    const a = new WFST(Tropical);
    const a0 = a.addState();
    const aFinal = a.addState();
    const aDead = a.addState();
    a.setStart(a0);
    a.addArc(a0, { ilabel: "a", olabel: "x", weight: 0.2, next: aFinal });
    a.addArc(a0, { ilabel: "dead", olabel: EPSILON, weight: 0, next: aDead });
    a.setFinal(aFinal);

    // B must take an epsilon-input prefix before it can consume x.
    const b = new WFST(Tropical);
    const b0 = b.addState();
    const b1 = b.addState();
    const bFinal = b.addState();
    b.setStart(b0);
    b.addArc(b0, { ilabel: EPSILON, olabel: EPSILON, weight: 0.1, next: b1 });
    b.addArc(b1, { ilabel: "x", olabel: "word", weight: 0.3, next: bFinal });
    b.setFinal(bFinal);

    const path = shortestPath(compose(a, b));

    expect(path.weight).toBeCloseTo(0.6, 9);
    expect(path.arcs.map((arc) => arc.olabel).filter((label) => label !== EPSILON)).toEqual([
      "word",
    ]);
  });
});
