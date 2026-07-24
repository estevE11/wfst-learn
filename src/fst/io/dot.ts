import { EPSILON } from "../types";
import type { WFST } from "../wfst";

/** Options for customizing DOT output, mainly for highlighting during visualization. */
export interface ToDotOptions {
  /** State indices to visually highlight (e.g. states on the best path, or the current step in an algorithm animation). */
  highlightStates?: number[];
  /** Arcs to visually highlight, identified by their source state and index within that state's arc list. */
  highlightArcs?: { from: number; arcIndex: number }[];
  /** Optional title rendered above the graph. */
  title?: string;
}

/**
 * Render a WFST as a Graphviz DOT string.
 *
 * Conventions:
 *  - States are drawn as circles, labeled with their index (plus final
 *    weight, if not `semiring.one`).
 *  - Final states are drawn as double circles.
 *  - The start state gets an incoming arrow from an invisible anchor node.
 *  - Arcs are labeled `ilabel:olabel/weight`, with `ε` standing in for the
 *    epsilon label so the graph reads the way FST literature draws it.
 *  - `opts.highlightStates` / `opts.highlightArcs` color specific states/arcs
 *    (e.g. to show the best path, or the current step of an algorithm).
 */
export function toDot(f: WFST, opts: ToDotOptions = {}): string {
  const highlightStates = new Set(opts.highlightStates ?? []);
  const highlightArcs = new Set((opts.highlightArcs ?? []).map((h) => `${h.from}:${h.arcIndex}`));

  const lines: string[] = [];
  lines.push("digraph FST {");
  lines.push("  rankdir=LR;");
  if (opts.title) {
    lines.push(`  labelloc="t";`);
    lines.push(`  label="${escapeDot(opts.title)}";`);
    lines.push(`  fontsize=14;`);
  }
  lines.push('  node [fontname="Helvetica,Arial,sans-serif", fontsize=12, shape=circle];');
  lines.push('  edge [fontname="Helvetica,Arial,sans-serif", fontsize=11];');

  // Invisible anchor node used to draw the "start state" arrow, since DOT
  // has no built-in concept of a designated start state.
  lines.push("  __start [shape=point, style=invis, width=0.01];");
  if (f.start >= 0) {
    lines.push(`  __start -> ${f.start};`);
  }

  // States.
  for (let i = 0; i < f.states.length; i++) {
    const state = f.states[i];
    const isFinal = state.final !== f.semiring.zero;
    const shape = isFinal ? "doublecircle" : "circle";
    let label = `${i}`;
    if (isFinal && !f.semiring.equals(state.final, f.semiring.one)) {
      label += `/${f.semiring.toDisplay(state.final)}`;
    }

    const attrs = [`shape=${shape}`, `label="${escapeDot(label)}"`];
    if (highlightStates.has(i)) {
      attrs.push('style=filled', 'fillcolor="#ffe082"', 'color="#f57f17"', "penwidth=2");
    }
    lines.push(`  ${i} [${attrs.join(", ")}];`);
  }

  // Arcs.
  for (let i = 0; i < f.states.length; i++) {
    const state = f.states[i];
    state.arcs.forEach((arc, arcIndex) => {
      const ilabel = arc.ilabel === EPSILON ? "ε" : arc.ilabel;
      const olabel = arc.olabel === EPSILON ? "ε" : arc.olabel;
      const label = `${ilabel}:${olabel}/${f.semiring.toDisplay(arc.weight)}`;

      const attrs = [`label="${escapeDot(label)}"`];
      if (highlightArcs.has(`${i}:${arcIndex}`)) {
        attrs.push('color="#f57f17"', "penwidth=2.5", 'fontcolor="#e65100"');
      }
      lines.push(`  ${i} -> ${arc.next} [${attrs.join(", ")}];`);
    });
  }

  lines.push("}");
  return lines.join("\n");
}

/** Escape a string for safe inclusion inside a DOT `"..."` quoted attribute. */
function escapeDot(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
