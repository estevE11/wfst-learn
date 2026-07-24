import { useEffect, useRef, useState } from "react";
import { instance as loadViz, type Viz } from "@viz-js/viz";
import { toDot } from "../fst/io/dot";
import type { WFST } from "../fst/wfst";

/**
 * `@viz-js/viz` loads a WASM build of Graphviz. Loading it is async and a
 * little expensive, so we load it (at most) once per page and share the
 * same promise across every <FstGraph> instance.
 */
let vizPromise: Promise<Viz> | null = null;
function getViz(): Promise<Viz> {
  if (!vizPromise) vizPromise = loadViz();
  return vizPromise;
}

export interface FstGraphProps {
  /** The WFST to render. */
  fst: WFST;
  /** Optional title drawn above the graph. */
  title?: string;
  /** State indices to highlight (e.g. states on the best path). */
  highlightStates?: number[];
  /** Arcs to highlight, identified by source state + arc index. */
  highlightArcs?: { from: number; arcIndex: number }[];
  /** Optional extra class name for the wrapping <div>. */
  className?: string;
}

/**
 * Renders a `WFST` as an SVG graph via Graphviz (compiled to WASM through
 * `@viz-js/viz`). This is a thin bridge: build the DOT string with `toDot`,
 * hand it to Graphviz, and mount the resulting <svg> element.
 *
 * Graphviz's WASM module loads asynchronously, so this component shows a
 * small loading message until the first render completes.
 */
export function FstGraph({ fst, title, highlightStates, highlightArcs, className }: FstGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Re-render whenever the FST or highlight options change. We stringify the
  // highlight arrays so the effect doesn't re-fire on every parent render
  // just because a new (but equal) array literal was passed in.
  const highlightStatesKey = JSON.stringify(highlightStates ?? []);
  const highlightArcsKey = JSON.stringify(highlightArcs ?? []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    const dot = toDot(fst, { title, highlightStates, highlightArcs });

    getViz()
      .then((viz) => {
        if (cancelled) return;
        const svgElement = viz.renderSVGElement(dot);
        const container = containerRef.current;
        if (container) {
          container.replaceChildren(svgElement);
        }
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : String(err));
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- highlight arrays tracked via their stringified keys
  }, [fst, title, highlightStatesKey, highlightArcsKey]);

  return (
    <div className={className}>
      {status === "loading" && <p className="fst-graph-status">Rendering graph…</p>}
      {status === "error" && <p className="fst-graph-error">Failed to render graph: {errorMessage}</p>}
      <div ref={containerRef} className="fst-graph-svg" />
    </div>
  );
}
