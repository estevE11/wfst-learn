# IDEA: `wfst-lab` — Learn WFST for ASR by Building the Decoder Yourself

## The problem with how WFST is usually taught
A 10-minute video shows you the pictures (circles, arrows, weights) but not the *mechanism*. For ASR the real "aha" is understanding **why** speech recognition is factored into `H ∘ C ∘ L ∘ G`, what each transducer actually does to a token, and how composition + shortest-path turns acoustic scores into words. You don't get that from watching — you get it from implementing the operations and stepping through them on a concrete example.

So: build a tiny, readable, from-scratch WFST library plus an interactive visualizer, and use it to decode a toy ASR example end to end. No Kaldi/OpenFST black box. ~1500 lines of Python you fully understand beats 100k lines you don't.

## Core mental model this tool teaches
An ASR decoder is a search over a graph. That graph is *built by composing* several transducers, each translating one representation into the next:

| FST | Input symbols | Output symbols | Job |
|-----|---------------|----------------|-----|
| **H** | HMM transition-ids / states | context-dependent phones | acoustic model states → phones |
| **C** | context-dependent phones | phones | triphone → monophone context |
| **L** | phones | words | pronunciation lexicon |
| **G** | words | words | language model (n-gram weights) |

`HCLG = min(det(H ∘ C ∘ L ∘ G))`. Decoding = compose acoustic scores against HCLG, then find best path (Viterbi / shortest path in the tropical semiring). The tool makes every one of those words concrete.

## The concept-explainer layer (core feature, not an add-on)
The big picture is only understandable if the *individual concepts* underneath it are solid. Almost every sentence above contains a term (semiring, composition, epsilon, determinize, transducer, triphone, tropical, shortest path…) that can silently break comprehension. So the tool treats **every jargon term as a clickable link into a self-contained mini-explainer**.

### How it works
- **Every technical term is a hyperlink.** Anywhere a concept word appears — in the UI, in tooltips, in the stage descriptions — it's clickable. Click `semiring` → a mini-explainer panel opens (side drawer or modal, so you don't lose your place in the main view).
- **Each explainer is self-contained and interactive**, not a wall of text. Structure per concept:
  1. **One-sentence plain-language answer** ("A semiring is just two operations — a way to *combine* scores along a path and a way to *choose* between paths.").
  2. **A tiny interactive widget** that lets you *do* the thing (see below).
  3. **Why it matters for ASR** — one line connecting it back to the decoder.
  4. **Links to prerequisite and related concepts** — so clicking `determinization` surfaces `epsilon`, `equivalence`, `semiring`. This forms a navigable concept graph, not a flat glossary.
- **No dead ends.** If an explainer uses another jargon term, that term is *also* clickable. The user can recurse down as deep as they need and pop back up.
- **Progress tracking**: mark concepts as "understood" so the user sees what's left. Optional 1-question self-check at the bottom of each explainer.

### Per-concept interactive widgets (the "mini interactive explanation")
Each explainer earns its keep with a small hands-on demo:

| Concept | Mini-interaction |
|---------|------------------|
| **Semiring** | Toggle tropical ↔ log on a 2-path toy; watch which path "wins" and the combined score change. |
| **Weight / -log prob** | Slider from probability → weight; see `p=1 → 0`, `p→0 → ∞`, and why we add instead of multiply. |
| **Transducer vs. acceptor** | Type an input string, watch it get *translated* to an output string arc by arc. |
| **Composition** | Two 3-state machines side by side; step the product construction one state pair at a time. |
| **Epsilon (ε) arcs** | Show a path with/without ε; toggle the epsilon-filter to see why naive composition double-counts. |
| **Determinization** | Feed a non-deterministic machine; watch subset-construction build the deterministic one. |
| **Minimization** | Highlight equivalent states, click "merge" to collapse them. |
| **Weight pushing** | Drag a slider; watch weights slide toward the start and pruning improve. |
| **Shortest path / Viterbi** | Step the search with backpointers lighting up the winning path. |
| **Phone / phoneme / triphone** | Hover a word → see its pronunciation → expand a phone into its left/right context. |
| **HMM topology** | Play the 3-state left-to-right HMM with self-loops emitting frames. |
| **Lattice** | Show 1-best vs. the full lattice of alternatives for one utterance. |

### Concept inventory to cover (the checklist)
FST basics: *state, arc, label (input/output), weight, final weight, acceptor, transducer, path, ε (epsilon)*.
Algebra: *semiring, tropical semiring, log semiring, ⊕ and ⊗, why -log probabilities*.
Operations: *composition, determinization, minimization, epsilon removal, weight pushing, connection/trimming, shortest path, Viterbi, forward score*.
ASR-specific: *phoneme, phone, triphone / context-dependency, lexicon, pronunciation, grammar / n-gram LM, HMM, transition-id, HCLG, on-the-fly composition, lattice, rescoring, CTC blank, beam / pruning*.

Implementation note: keep all explainer content in a single structured file (e.g. `concepts.yaml` — id, one-liner, body, widget-type, prereqs, related). The UI auto-links any occurrence of a known concept id in rendered text. That way the glossary and the cross-links stay in sync and adding a concept is one entry.

## What to build (in stages — each stage is a working milestone)

### Stage 0 — The WFST data structure & semirings
- `class WFST`: states, arcs `(src, ilabel, olabel, weight, dst)`, start/final weights.
- **Semiring** as a pluggable object: `tropical` (⊕=min, ⊗=+) for Viterbi, `log` (⊕=log-add, ⊗=+) for forward/marginal. Implementing both and seeing decoding change is the fastest way to *feel* what a semiring is.
- Text format loader (AT&T/OpenFST style: one arc per line) so you can hand-author tiny machines.
- Graphviz export → render every machine as a PNG/SVG.

### Stage 1 — Core algorithms, each visualized
Implement and animate:
1. **Composition** `A ∘ B` — the heart of everything. Show the product-state construction, including epsilon handling (the tricky part — epsilon filter). Let the user click a state in `A∘B` and highlight the `(a-state, b-state)` pair it came from.
2. **Shortest path / Viterbi** — tropical-semiring best path, with backpointers, animated frame by frame.
3. **Determinization** — see why it can blow up, and why it matters for decoding speed.
4. **Minimization** — watch equivalent states merge.
5. **Epsilon removal** and **weight pushing** — pushing makes scores comparable earlier (better pruning); visualize weights sliding toward the start.

Each algorithm: input machine on the left, output on the right, step-through controls (next state / next arc), with the invariant being maintained shown in text.

### Stage 2 — Build the toy ASR pipeline
Small enough to draw on one screen, real enough to be honest:
- **Vocabulary**: ~6 words (e.g. `cat`, `cats`, `dog`, `the`, `a`, `sat`).
- **L (lexicon)**: hand-written pronunciations → phones. Show homophones and multi-pron words so the transducer's power is obvious.
- **G (grammar)**: a tiny bigram LM over those words (weights = -log prob). Optionally build it from a 20-sentence toy corpus so the user sees counts → probabilities → weights.
- **C / H**: start with monophones (skip C, trivial H) so the pipeline runs, then add a triphone C and a 3-state HMM H as an "advanced" toggle. Seeing it work *without* H/C first, then adding them, demystifies why they exist.
- Compose step by step: `L∘G`, then `C∘L∘G`, then `H∘C∘L∘G`. Render each intermediate. Watch state count explode, then `det`/`min` shrink it.

### Stage 3 — Decode something
- Fake the acoustic model: instead of a real neural net, provide a **frame × phone score matrix** (log-probs) you can hand-edit with sliders, OR feed real logits from a small pretrained CTC/HMM model if you want the bridge to actual ASR.
- Build the per-utterance acoustic FST `U` from those frame scores.
- Decode = `U ∘ HCLG` → shortest path → word sequence.
- **The payoff view**: animate the token passing through frames, show the search beam, show pruning killing paths, show the final backtrace producing words. Change a frame score with a slider → watch the winning path flip. *This* is the moment WFST clicks for ASR.

### Stage 4 — Bridge to the real world (optional, high value for your job)
- Show the mapping from this toy to **Kaldi's HCLG** and to **OpenFST** APIs — same operations, same names (`fstcompose`, `fstdeterminize`, `fstminimize`, `fstpush`).
- Show how **CTC / RNN-T** relate: CTC decoding is also expressible as WFST composition (the CTC topology is just another `H`-like transducer with blank). A side note comparing WFST decoding vs. beam search in end-to-end models directly targets your ASR research work.
- Load a small real LM (ARPA n-gram → G FST) to see scale effects.

## Suggested tech
- **Python** for the FST core (clarity > speed; this is a learning tool).
- **Graphviz** (`graphviz` pip pkg) for static machine rendering.
- **Interactive layer**: a Streamlit or a small React+FastAPI app with sliders (frame scores, LM weight, beam width) and step controls. Streamlit is fastest to build; React gives nicer animation if you want it.
- **Validation harness**: cross-check your composition/shortest-path outputs against `pynini`/`OpenFST` on the same tiny inputs, so you *know* your from-scratch impl is correct. This doubles as your test suite.

## Concrete "I understand it now" checkpoints
You'll know the tool worked when you can, without looking anything up, answer:
1. Why is decoding factored into H, C, L, G instead of one big model? (modularity + each is independently buildable/swappable)
2. What does composition physically do to the symbol streams?
3. Why tropical semiring for decoding but log semiring for lattice/forward scores?
4. Why determinize and minimize HCLG before decoding? (speed, memory, comparable weights)
5. What weight pushing buys you for pruning.
6. How a frame-level acoustic score becomes a word.
7. How this maps onto Kaldi's HCLG and onto CTC/RNN-T decoding.

## Build order (fastest path to insight)
1. `WFST` class + tropical semiring + Graphviz render. (day 1)
2. Composition + shortest path, tested vs. pynini. (day 2–3)
3. Hand-build L and G, compose, decode a hand-authored acoustic matrix. **← core aha here.** (day 4)
4. Add det/min/push + visualization. (day 5)
5. Add C/H triphone+HMM toggle. (day 6)
6. Streamlit UI with sliders + animation. (day 7)
7. Optional: real logits + ARPA LM + Kaldi/CTC bridge notes.

Stop after step 3 if you just need the concept; go to 6+ if you want the intuition to stick and to have a demo you can reuse.

## Stretch goals
- **Lattice generation** (not just 1-best) — the log-semiring payoff, and directly relevant to ASR rescoring.
- **On-the-fly composition** — why big-vocab decoders don't materialize HCLG fully.
- **Rescoring**: decode with a small G, then rescore the lattice with a bigger LM — a real ASR technique you'll use.
