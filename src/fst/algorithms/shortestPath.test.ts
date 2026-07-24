import { describe, it, expect } from "vitest";
import { WFST } from "../wfst";
import { Tropical } from "../semiring";
import { shortestPath } from "./shortestPath";

describe("shortestPath", () => {
  it("picks the lower-weight path when two alternatives exist", () => {
    //        /--- b/2.0 ---\
    // 0 --a/1.0--> 1         3 (final)
    //        \--- c/0.5 ---/
    // (two parallel routes from 1 to 3; the "c" route is cheaper)
    const f = new WFST(Tropical);
    const s0 = f.addState();
    const s1 = f.addState();
    const s2 = f.addState();
    const s3 = f.addState();
    f.setStart(s0);
    f.addArc(s0, { ilabel: "a", olabel: "a", weight: 1.0, next: s1 });
    f.addArc(s1, { ilabel: "b", olabel: "b", weight: 2.0, next: s3 });
    f.addArc(s1, { ilabel: "c", olabel: "c", weight: 0.5, next: s2 });
    f.addArc(s2, { ilabel: "d", olabel: "d", weight: 0.1, next: s3 });
    f.setFinal(s3, 0);

    const result = shortestPath(f);

    // Best path: a (1.0) + c (0.5) + d (0.1) = 1.6, beating a+b = 3.0.
    expect(result.weight).toBeCloseTo(1.6, 9);
    expect(result.states).toEqual([s0, s1, s2, s3]);
    expect(result.arcs.map((arc) => arc.ilabel)).toEqual(["a", "c", "d"]);
  });

  it("handles cycles safely without hanging or breaking the result", () => {
    // 0 --a/1--> 1 --b/1--> 1 (self loop, never beneficial) --c/1--> 2 (final)
    const f = new WFST(Tropical);
    const s0 = f.addState();
    const s1 = f.addState();
    const s2 = f.addState();
    f.setStart(s0);
    f.addArc(s0, { ilabel: "a", olabel: "a", weight: 1, next: s1 });
    f.addArc(s1, { ilabel: "loop", olabel: "loop", weight: 1, next: s1 }); // self-loop
    f.addArc(s1, { ilabel: "c", olabel: "c", weight: 1, next: s2 });
    f.setFinal(s2, 0);

    const result = shortestPath(f);

    // The self-loop only adds cost, so the best path never takes it.
    expect(result.weight).toBeCloseTo(2, 9);
    expect(result.arcs.map((arc) => arc.ilabel)).toEqual(["a", "c"]);
  });

  it("returns zero weight and an empty path when the start state is itself final", () => {
    const f = new WFST(Tropical);
    const s0 = f.addState();
    f.setStart(s0);
    f.setFinal(s0, 0);

    const result = shortestPath(f);

    expect(result.weight).toBe(0);
    expect(result.arcs).toHaveLength(0);
    expect(result.states).toEqual([s0]);
  });

  it("returns the semiring zero weight when no final state is reachable", () => {
    const f = new WFST(Tropical);
    const s0 = f.addState();
    const s1 = f.addState(); // unreachable-to-final dead end
    f.setStart(s0);
    f.addArc(s0, { ilabel: "a", olabel: "a", weight: 1, next: s1 });
    // s1 is never marked final.

    const result = shortestPath(f);

    expect(result.weight).toBe(Tropical.zero);
    expect(result.arcs).toHaveLength(0);
    expect(result.states).toHaveLength(0);
  });
});
