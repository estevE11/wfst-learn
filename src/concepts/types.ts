/**
 * A single concept-explainer entry.
 *
 * `body` is free text that may reference other concept ids inline using
 * `[[id]]` or `[[id|display text]]` — see ConceptText for how these (and
 * plain-English mentions of a concept's `term`) get turned into clickable
 * links. This is what makes the "no dead ends" recursion work: every
 * explainer can point at every other explainer.
 */
export interface Concept {
  /** Stable identifier, kebab-case. Used for routing/lookup and as the
   *  default `[[id]]` link target. */
  id: string;
  /** Human-readable display term, e.g. "tropical semiring". */
  term: string;
  /** One plain-language sentence. No jargon, no forward references. */
  oneLiner: string;
  /** 2-5 short paragraphs. May contain `[[id]]` / `[[id|text]]` links to
   *  other concepts. */
  body: string;
  /** One sentence tying the concept back to the ASR decoder. */
  whyASR: string;
  /** Concept ids a reader should understand *before* this one. */
  prereqs: string[];
  /** Concept ids that are related but not strictly required first. */
  related: string[];
  /** Stable id for an interactive widget, resolved by the host app via
   *  ConceptDrawer's `renderWidget` prop. Optional — not every concept
   *  has a demo. */
  widget?: string;
}
