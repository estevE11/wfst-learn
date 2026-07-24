import { describe, it, expect } from "vitest";
import { Tropical, Log } from "./semiring";

describe("Tropical semiring", () => {
  it("has the expected zero/one values", () => {
    expect(Tropical.zero).toBe(Infinity);
    expect(Tropical.one).toBe(0);
  });

  it("plus is min, and zero is its identity", () => {
    expect(Tropical.plus(3, 5)).toBe(3);
    expect(Tropical.plus(5, 3)).toBe(3);
    expect(Tropical.plus(3, Tropical.zero)).toBe(3);
    expect(Tropical.plus(Tropical.zero, 3)).toBe(3);
  });

  it("times is +, and one is its identity", () => {
    expect(Tropical.times(3, 5)).toBe(8);
    expect(Tropical.times(3, Tropical.one)).toBe(3);
    expect(Tropical.times(Tropical.one, 3)).toBe(3);
  });

  it("times with zero gives zero (annihilator), matching semiring axioms", () => {
    expect(Tropical.times(3, Tropical.zero)).toBe(Infinity);
  });

  it("toDisplay renders infinity distinctly from finite weights", () => {
    expect(Tropical.toDisplay(Tropical.zero)).toBe("∞");
    expect(Tropical.toDisplay(1.5)).toBe("1.5");
  });

  it("recognizes equal infinite weights", () => {
    expect(Tropical.equals(Infinity, Infinity)).toBe(true);
  });
});

describe("Log semiring", () => {
  it("has the expected zero/one values", () => {
    expect(Log.zero).toBe(Infinity);
    expect(Log.one).toBe(0);
  });

  it("zero is the identity for plus", () => {
    expect(Log.plus(3, Log.zero)).toBeCloseTo(3, 9);
    expect(Log.plus(Log.zero, 3)).toBeCloseTo(3, 9);
  });

  it("one is the identity for times (times is still +)", () => {
    expect(Log.times(3, Log.one)).toBe(3);
    expect(Log.times(Log.one, 3)).toBe(3);
  });

  it("plus is symmetric", () => {
    expect(Log.plus(2, 5)).toBeCloseTo(Log.plus(5, 2), 9);
  });

  it("combining two equally-weighted paths halves the probability mass, i.e. adds log(2)", () => {
    // e^-x + e^-x = 2e^-x  =>  -log(2e^-x) = x - log(2)
    const x = 1.234;
    expect(Log.plus(x, x)).toBeCloseTo(x - Math.log(2), 9);
  });

  it("plus is always <= tropical's min (log-sum-exp is a smooth lower bound on min in weight space)", () => {
    // Summing probability mass can only make the weight (i.e. -log prob)
    // smaller than or equal to just taking the single best path's weight.
    const a = 1.0;
    const b = 2.0;
    expect(Log.plus(a, b)).toBeLessThanOrEqual(Math.min(a, b) + 1e-9);
  });
});
