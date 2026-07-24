import type { Concept } from "./types";

/**
 * The full concept inventory (see IDEA.md, "Concept inventory to cover").
 * This is the single source of truth for the glossary/concept graph — the
 * UI auto-links any occurrence of a known concept `term` or an explicit
 * `[[id]]` marker in rendered text, so adding a concept here is enough to
 * make it linkable everywhere.
 */
export const CONCEPTS: Record<string, Concept> = {
  // ---------------------------------------------------------------------
  // FST basics
  // ---------------------------------------------------------------------
  state: {
    id: "state",
    term: "state",
    oneLiner:
      "A state is one of the numbered nodes in the machine — a snapshot of 'where you are' as you read symbols.",
    body: `A [[transducer|transducer]] (or [[acceptor|acceptor]]) is drawn as a set of states connected by [[arc|arcs]]. One state is the *start* state, where every [[path|path]] begins. Any state may also be a *final* state, meaning a path is allowed to stop there — final states carry a [[final-weight|final weight]].

States by themselves don't do anything; they're just labelled positions. All the "work" — consuming input, producing output, accumulating [[weight|weight]] — happens on the arcs that connect them.

In an ASR decoder, a state often corresponds to a partial hypothesis: "I've seen these transition-ids so far and I'm this far into this word." The explosion of states as you compose bigger machines is exactly why [[determinization|determinization]] and [[minimization|minimization]] matter.`,
    whyASR:
      "The size of the decoding graph — and therefore decode speed and memory — is measured in states, so keeping state count small is a running theme in ASR decoder design.",
    prereqs: [],
    related: ["arc", "path", "transducer"],
  },

  arc: {
    id: "arc",
    term: "arc",
    oneLiner:
      "An arc is a directed edge between two states that consumes an input symbol, produces an output symbol, and costs a weight.",
    body: `Formally an arc is the tuple \`(src, ilabel, olabel, weight, dst)\`: leave [[state|state]] \`src\`, read the input [[label|label]] \`ilabel\`, emit the output label \`olabel\`, pay \`weight\`, and arrive at \`dst\`. Walking a chain of arcs from the start state to a final state is what defines a [[path|path]] through the machine.

In an [[acceptor|acceptor]] the input and output labels on every arc are always equal (or you only bother writing one), so the machine just recognizes strings. In a [[transducer|transducer]] they can differ, so the machine *translates* one string into another as it walks.

An arc's label can also be [[epsilon|epsilon]] (ε), meaning "consume/produce nothing here" — useful for silently branching between choices or delaying an output.`,
    whyASR:
      "Every phone, transition-id, or word hypothesis the decoder considers corresponds to taking a specific arc, so 'search' in ASR literally means exploring arcs.",
    prereqs: ["state"],
    related: ["label", "weight", "epsilon"],
  },

  label: {
    id: "label",
    term: "label",
    oneLiner:
      "A label is the symbol written on an arc — what you read (input label) or write (output label) when you cross it.",
    body: `Every [[arc|arc]] carries two labels: an input label (\`ilabel\`) and an output label (\`olabel\`). In an [[acceptor|acceptor]] these are always the same symbol (or the output side is omitted), so the machine just accepts/rejects strings. In a [[transducer|transducer]] they can differ, which is how a transducer *translates* — e.g. an L (lexicon) transducer has phones on the input side and words on the output side.

A label can be an ordinary symbol (a phone, a word, a transition-id) or the special [[epsilon|epsilon]] symbol, meaning "no symbol here."`,
    whyASR:
      "HCLG is a chain of transducers precisely because each stage relabels: H's output labels (phones) become C's input labels, C's output becomes L's input, and so on — labels are the glue between stages.",
    prereqs: ["arc"],
    related: ["acceptor", "transducer", "epsilon"],
  },

  weight: {
    id: "weight",
    term: "weight",
    oneLiner:
      "A weight is the cost (or score) attached to an arc, combined along a path using the rules of a semiring.",
    body: `Every [[arc|arc]] carries a weight, and every final [[state|state]] carries a [[final-weight|final weight]]. What "combined" means depends on the [[semiring|semiring]] in play: in the [[tropical-semiring|tropical semiring]] weights along a path are *added*, and you pick the path with the *minimum* total; in the [[log-semiring|log semiring]] they're combined so the total represents a sum over all paths, useful for scoring a [[lattice|lattice]] rather than just its best path.

In ASR the weights are almost always [[neg-log-prob|negative log probabilities]]: \`weight = -log(p)\`. A very likely event (p close to 1) costs almost nothing (weight close to 0); a very unlikely event (p close to 0) costs a huge amount (weight close to +∞). This turns *multiplying* probabilities along a path into *adding* weights — cheaper, more numerically stable, and it plugs directly into a min-plus ([[tropical-semiring|tropical]]) search.`,
    whyASR:
      "The whole decoding problem — find the most likely word sequence — becomes 'find the path with the smallest total weight' once probabilities are turned into weights, which is exactly what shortest-path algorithms are built to solve.",
    prereqs: ["semiring"],
    related: ["final-weight", "tropical-semiring", "neg-log-prob"],
    widget: "weight",
  },

  "final-weight": {
    id: "final-weight",
    term: "final weight",
    oneLiner:
      "A final weight is an extra cost paid for stopping at a particular state, on top of whatever a path already cost to get there.",
    body: `Not every [[state|state]] is a valid place to stop. A state is *final* only if it has a final weight assigned to it (in the [[tropical-semiring|tropical semiring]] a non-final state effectively has final weight +∞ — "you may not stop here"). A complete [[path|path]]'s total weight is the sum of every arc weight it crosses *plus* the final weight of the state it ends on.

Final weights matter because they let a machine encode "this is a valid end, but a slightly worse one than that other end" — e.g. one pronunciation variant might be marginally less likely than another, encoded as a higher final weight rather than a hard cutoff.`,
    whyASR:
      "In HCLG, reaching a final state means a complete, grammatically valid word sequence has been recognized; the final weight can bias between otherwise-equal endings (e.g. sentence-end language model cost).",
    prereqs: ["weight", "state"],
    related: ["path", "shortest-path"],
  },

  acceptor: {
    id: "acceptor",
    term: "acceptor",
    oneLiner:
      "An acceptor (WFSA) recognizes or scores strings — every arc's input and output label are the same symbol.",
    body: `An acceptor is the special case of a [[transducer|transducer]] where you don't care about translation, only recognition and scoring: does this string belong to the language the machine describes, and with what [[weight|weight]]? Because input and output labels always match, acceptors are usually drawn with a single label per [[arc|arc]] instead of two.

A grammar / n-gram language model (the G in HCLG) is typically built as a weighted acceptor over words: it doesn't translate words into anything else, it just assigns a cost to word sequences.`,
    whyASR:
      "G, the grammar/language-model component of HCLG, is an acceptor: it scores word sequences by plausibility without changing the symbols.",
    prereqs: ["state", "arc", "label"],
    related: ["transducer"],
  },

  transducer: {
    id: "transducer",
    term: "transducer",
    oneLiner:
      "A transducer (WFST) reads one symbol stream and writes another, assigning a weight to the translation as it goes.",
    body: `A weighted finite-state transducer generalizes an [[acceptor|acceptor]] by letting the input [[label|label]] and output label on each [[arc|arc]] differ. Walking a [[path|path]] from start to a final [[state|state]] simultaneously reads an input string, writes an output string, and accumulates a total [[weight|weight]] — so a transducer is a *weighted relation* between two languages, not just a recognizer for one.

This is the core trick behind HCLG: H, C, and L are all transducers that relate one level of representation to the next (transition-ids → phones → words), and [[composition|composition]] chains them into one big transducer that goes straight from acoustic-model output to words.`,
    whyASR:
      "H, C, and L are each transducers translating between one representation and the next (acoustic states → phones → words); composing them is literally how HCLG is built.",
    prereqs: ["state", "arc", "label"],
    related: ["acceptor", "composition"],
    widget: "transducer",
  },

  path: {
    id: "path",
    term: "path",
    oneLiner:
      "A path is one complete walk from the start state to a final state, spelling out an input string, an output string, and a total weight.",
    body: `A path is a sequence of [[arc|arcs]] \`s0 -> s1 -> ... -> sN\` where \`s0\` is the start [[state|state]] and \`sN\` is a final state. Concatenating the input labels along the way gives the path's input string; concatenating output labels gives its output string. The path's total weight is every arc weight combined (usually summed), plus \`sN\`'s [[final-weight|final weight]].

A machine can have exponentially many paths for the same input string (that's exactly what makes a machine non-deterministic, or what a [[lattice|lattice]] represents — many plausible paths kept around instead of collapsed to one). [[shortest-path|Shortest path]] search finds the single best one.`,
    whyASR:
      "One decoded path through HCLG is one candidate transcription; decoding means searching the space of paths for the one with the best (lowest tropical-semiring) weight.",
    prereqs: ["state", "arc"],
    related: ["weight", "final-weight", "shortest-path"],
  },

  epsilon: {
    id: "epsilon",
    term: "epsilon",
    oneLiner:
      "Epsilon (ε) is the 'no symbol' label — crossing an epsilon arc moves you along without reading or writing anything.",
    body: `An [[arc|arc]] labelled ε on its input side consumes nothing; labelled ε on its output side produces nothing. This lets a machine branch, merge, or delay without being forced to read/write a real symbol at every step — e.g. a lexicon [[transducer|transducer]] can output a word's spelling only after its *last* phone, with ε output on every phone before that.

Epsilons are also the main source of subtlety in [[composition|composition]]: naively composing two machines with ε arcs can create spurious extra paths (an ε on one side matching an ε on the other in more than one way), so real implementations use an *epsilon filter* to compose correctly. They're also what [[epsilon-removal|epsilon removal]] eliminates, and what [[determinization|determinization]] generally requires being gone first.`,
    whyASR:
      "L's pronunciation arcs and HMM self-loop skips both rely on epsilon to represent 'not ready to emit the word/phone yet,' and getting epsilon handling right in composition is the classic HCLG-building bug.",
    prereqs: ["label"],
    related: ["epsilon-removal", "composition"],
    widget: "epsilon",
  },

  // ---------------------------------------------------------------------
  // Algebra
  // ---------------------------------------------------------------------
  semiring: {
    id: "semiring",
    term: "semiring",
    oneLiner:
      "A semiring is just two operations — one to combine weights along a path (⊗) and one to choose/combine between paths (⊕).",
    body: `Formally a semiring is a set of values plus two operations, ⊕ ("collect", used across parallel paths) and ⊗ ("extend", used along one path), with an identity for each and ⊗ distributing over ⊕. That abstraction is what lets the *same* [[composition|composition]] and [[shortest-path|shortest path]] code work for very different scoring behaviors — you just swap the semiring.

The [[tropical-semiring|tropical semiring]] uses ⊕ = min and ⊗ = +: "add costs along a path, keep the cheapest path." The [[log-semiring|log semiring]] uses ⊕ = log-add and ⊗ = +: "add costs along a path, but sum probability *mass* across all paths" — the right tool for a [[forward-score|forward score]] or scoring a [[lattice|lattice]] instead of just its best path.

Swapping the semiring while reusing the exact same graph algorithms is the "aha" of the whole framework: Viterbi decoding and forward-score marginalization are the *same algorithm* running over different semirings.`,
    whyASR:
      "Choosing tropical vs. log semiring is choosing between 'give me the single best transcription' and 'give me the total probability mass over all transcriptions' — both needed at different points in an ASR pipeline.",
    prereqs: ["weight"],
    related: ["tropical-semiring", "log-semiring", "plus-times"],
    widget: "semiring",
  },

  "tropical-semiring": {
    id: "tropical-semiring",
    term: "tropical semiring",
    oneLiner:
      "The tropical semiring combines weights by addition along a path and keeps the minimum (cheapest) total across paths — the min-cost/Viterbi semiring.",
    body: `In the tropical [[semiring|semiring]], ⊗ = + (weights along one [[path|path]] just add up) and ⊕ = min (when several paths reach the same place, keep the cheapest). With weights set to [[neg-log-prob|negative log probabilities]], "cheapest total weight" is exactly "highest joint probability," so tropical [[shortest-path|shortest path]] search *is* [[viterbi|Viterbi]] decoding.

Its identities: 0 (additive/⊕ identity) is +∞ ("no path found yet"), and 1 (multiplicative/⊗ identity) is 0 ("free, no cost"). Those show up as the default weights on states you haven't reached yet, and on arcs that cost nothing.`,
    whyASR:
      "Standard 1-best ASR decoding — 'find the single most likely word sequence' — runs shortest path in the tropical semiring over HCLG composed with the acoustic scores.",
    prereqs: ["semiring"],
    related: ["log-semiring", "viterbi", "shortest-path"],
  },

  "log-semiring": {
    id: "log-semiring",
    term: "log semiring",
    oneLiner:
      "The log semiring combines weights by addition along a path but sums probability mass (via log-add) across paths — the right semiring for totals, not just the best path.",
    body: `In the log [[semiring|semiring]], ⊗ = + is the same as tropical, but ⊕ is log-add: \`log-add(a, b) = -log(exp(-a) + exp(-b))\`, which in weight-space (negative log probs) correctly sums the *probabilities* that two paths represent, rather than just taking the smaller one. Running the same graph algorithms with this semiring computes total probability mass instead of a single best score — that's a [[forward-score|forward score]].

This matters whenever you need "how likely is this whole set of paths," not just "what's the single best one" — for example scoring a [[lattice|lattice]] of alternative hypotheses, or computing a proper posterior for [[rescoring|rescoring]].`,
    whyASR:
      "Lattice generation and rescoring need the total probability over many paths (not just the arg-min path), so they use the log semiring where decoding itself uses the tropical semiring.",
    prereqs: ["semiring"],
    related: ["tropical-semiring", "forward-score", "lattice"],
  },

  "plus-times": {
    id: "plus-times",
    term: "plus-times",
    oneLiner:
      "⊕ ('plus') combines weights across alternative paths; ⊗ ('times') combines weights along a single path — the two operations every semiring must define.",
    body: `The names come from ordinary arithmetic, where ⊕ really is + and ⊗ really is ×: e.g. in the probability semiring, the chance of "path A or path B" is \`p(A) + p(B)\` (⊕ = +) and the chance of a path made of independent steps is the product of step probabilities (⊗ = ×).

In [[weight|weight]]-space (negative log probs), multiplication turns into addition, so most ASR-relevant [[semiring|semirings]] define ⊗ = + and differ mainly in what ⊕ is: min for [[tropical-semiring|tropical]], log-add for [[log-semiring|log]]. Every graph algorithm ([[composition|composition]], [[shortest-path|shortest path]], [[forward-score|forward score]]) is written purely in terms of ⊕ and ⊗, which is exactly why one algorithm serves many purposes.`,
    whyASR:
      "Every score you see in an ASR decoder — acoustic score, LM score, total path score — is built from just these two operations, however the specific semiring defines them.",
    prereqs: ["semiring"],
    related: ["tropical-semiring", "log-semiring"],
  },

  "neg-log-prob": {
    id: "neg-log-prob",
    term: "negative log probability",
    oneLiner:
      "Negative log probability turns a probability (0 to 1, multiply to combine) into a weight (0 to ∞, add to combine) — same information, friendlier arithmetic.",
    body: `\`weight = -log(p)\`. As \`p\` goes from 1 down to 0, \`weight\` goes from 0 up to +∞: a certain event costs nothing, an impossible one costs infinity. Because \`log(a*b) = log(a) + log(b)\`, multiplying probabilities along a [[path|path]] turns into *adding* weights — cheaper to compute, and it avoids the underflow you'd get multiplying many small probabilities together directly.

This is also what makes the [[tropical-semiring|tropical semiring]] (⊗ = +, ⊕ = min) line up with maximum-likelihood decoding: minimizing summed negative-log-probabilities is the same thing as maximizing the product of probabilities.`,
    whyASR:
      "Every acoustic score and language-model score you see quoted as a WFST weight is a negative log probability — that's why 'lower weight' means 'more likely' throughout the decoder.",
    prereqs: ["weight"],
    related: ["tropical-semiring", "plus-times"],
    widget: "weight",
  },

  // ---------------------------------------------------------------------
  // Operations
  // ---------------------------------------------------------------------
  composition: {
    id: "composition",
    term: "composition",
    oneLiner:
      "Composition chains two transducers into one: A∘B feeds A's output symbols directly in as B's input symbols.",
    body: `Given [[transducer|transducer]] A (X→Y) and transducer B (Y→Z), \`A ∘ B\` is a new transducer (X→Z) built from pairs of states \`(a, b)\`: you can move from \`(a, b)\` to \`(a', b')\` whenever A has an [[arc|arc]] \`a→a'\` with output label \`y\` and B has an arc \`b→b'\` with input label \`y\`, and the new arc's [[weight|weight]] combines both arcs' weights. This is the "product construction," and it's how HCLG gets built: \`HCLG = H ∘ C ∘ L ∘ G\`.

The subtlety is [[epsilon|epsilon]]: naive composition can match ε-output arcs in A against ε-input arcs in B in more than one way, silently duplicating paths and their weight. Correct implementations run an epsilon filter to allow exactly the intended ε/ε matches.

Because it's built state-pair by state-pair, composition can also be done *lazily* — expanding only the state pairs actually visited during search instead of the whole product upfront. That's [[on-the-fly-composition|on-the-fly composition]], essential once the full product would be too big to build.`,
    whyASR:
      "Composition is the mechanism that turns four separately-authored transducers (H, C, L, G) into one searchable decoding graph, and later composes that graph against the per-utterance acoustic scores.",
    prereqs: ["transducer", "epsilon"],
    related: ["determinization", "on-the-fly-composition", "hclg"],
    widget: "composition",
  },

  determinization: {
    id: "determinization",
    term: "determinization",
    oneLiner:
      "Determinization rebuilds a machine so that from any state, at most one arc leaves on each input symbol — no ambiguity about which way to go next.",
    body: `A non-deterministic [[transducer|transducer]] can have several [[arc|arcs]] out of the same [[state|state]] with the same input [[label|label]], forcing a search algorithm to try all of them. Determinization uses a subset-construction (similar to the classic NFA→DFA algorithm, generalized to carry weights and output symbols) to build an equivalent machine where that never happens.

The upside is search speed: a deterministic machine lets a decoder follow exactly one arc per input symbol with no branching. The downside is size — determinizing can blow up the number of states, sometimes exponentially, especially with [[epsilon|epsilon]] arcs or divergent output labels still present (which is why [[epsilon-removal|epsilon removal]] typically happens first). In practice you determinize, then [[minimization|minimize]] to shrink it back down.`,
    whyASR:
      "HCLG is determinized (then minimized) before decoding so the search never has to speculatively explore multiple redundant arcs for the same phone/word hypothesis — a large, direct speed win.",
    prereqs: ["transducer", "epsilon"],
    related: ["minimization", "hclg"],
    widget: "determinization",
  },

  minimization: {
    id: "minimization",
    term: "minimization",
    oneLiner:
      "Minimization merges equivalent states — states that behave identically for every possible future input — into one, without changing what the machine computes.",
    body: `Two [[state|states]] are equivalent if, no matter what input string follows, they produce the same output and the same total [[weight|weight]] to a final state. Minimization finds all such equivalence classes and collapses each class to a single state, giving the smallest possible machine that still computes exactly the same weighted relation.

Minimization only produces a unique smallest result on a machine that's already [[determinization|deterministic]] (and typically already has dead/unreachable states removed via [[connection|trimming]]) — so the usual pipeline is determinize → minimize.`,
    whyASR:
      "Running minimization on HCLG after determinization removes a large fraction of redundant states (e.g. shared word suffixes), shrinking memory footprint and improving cache behavior during decoding without changing the recognized language or scores.",
    prereqs: ["determinization"],
    related: ["connection", "hclg"],
    widget: "minimization",
  },

  "epsilon-removal": {
    id: "epsilon-removal",
    term: "epsilon removal",
    oneLiner:
      "Epsilon removal rewrites a machine so no arc has an epsilon input label, replacing ε-chains with direct arcs that have the same net effect.",
    body: `[[epsilon|Epsilon]] arcs are convenient to author but awkward to search and to [[determinization|determinize]] correctly — an algorithm has to decide how many ε-arcs in a row to "look through" before deciding two states are distinguishable. Epsilon removal precomputes an ε-closure for every [[state|state]] and adds direct, non-ε [[arc|arcs]] that skip straight to where an ε-chain would have led, with the combined [[weight|weight]], then deletes the ε-arcs.

It's usually a prerequisite step before [[determinization|determinizing]] a machine that was authored (or produced by [[composition|composition]]) with lots of ε-arcs.`,
    whyASR:
      "L (the lexicon) is naturally full of epsilons — one per phone before a pronunciation's last phone — so removing them before determinizing HCLG avoids determinization headaches and redundant search branches.",
    prereqs: ["epsilon"],
    related: ["composition", "determinization"],
  },

  "weight-pushing": {
    id: "weight-pushing",
    term: "weight pushing",
    oneLiner:
      "Weight pushing slides weight as early as possible along each path, without changing any path's total — so a good/bad prefix becomes visible sooner.",
    body: `Two machines can compute the exact same total [[weight|weight]] for every [[path|path]] while distributing that weight very differently along the way — e.g. all of it sitting on the very last [[arc|arc]] versus spread out from the start. Weight pushing (via each state's [[shortest-path|shortest-distance]]-to-final) redistributes weight toward the start [[state|state]] so that, as early as possible, an arc's weight already reflects how good the rest of the path from here is likely to be.

This doesn't change the machine's language or any path's total weight — it's an equivalence-preserving transform, purely about *where* along the path the cost is visible.`,
    whyASR:
      "A search that prunes low-probability partial paths (beam pruning) can only compare partial-path costs fairly if the weights are already informative early on — pushing weights toward the start makes early pruning decisions much more accurate.",
    prereqs: ["weight", "semiring"],
    related: ["determinization", "beam-pruning"],
    widget: "weight-pushing",
  },

  connection: {
    id: "connection",
    term: "trimming",
    oneLiner:
      "Trimming (connection) deletes every state that can't be reached from the start, or can't reach a final state — dead weight that no path ever uses.",
    body: `A [[state|state]] is only useful if it's reachable from the start state *and* can still get to some final state. Composing or transforming machines often leaves behind states that fail one of those checks — e.g. a branch of [[composition|composition]] whose [[label|labels]] never actually matched anything. Trimming (also called "connection") finds and removes all such dead states and their [[arc|arcs]].

It's typically run as cleanup after [[composition|composition]] and before [[determinization|determinization]]/[[minimization|minimization]], both to save memory and to avoid wasting time processing states that can never contribute to a real [[path|path]].`,
    whyASR:
      "Composing H∘C∘L∘G can create unreachable or dead-end state pairs (mismatched context or pronunciation combinations); trimming them keeps HCLG from carrying dead weight into determinization and minimization.",
    prereqs: ["state", "path"],
    related: ["minimization", "determinization"],
  },

  "shortest-path": {
    id: "shortest-path",
    term: "shortest path",
    oneLiner:
      "Shortest path finds the single path through the machine with the smallest total weight — 'smallest' as defined by whichever semiring is in use.",
    body: `Using the [[tropical-semiring|tropical semiring]] (⊕ = min), shortest path is the classic single-source shortest-distance problem: for each [[state|state]] keep the best distance found so far and a *backpointer* to the [[arc|arc]] that achieved it, relax arcs until nothing improves, then walk backpointers from the best final state back to the start to recover the winning [[path|path]]. This is exactly [[viterbi|Viterbi]] decoding when the machine represents an HMM/HCLG search space.

The same relaxation idea, run in the [[log-semiring|log semiring]] instead, computes a [[forward-score|forward score]] (total probability mass) rather than a single best path — same algorithmic skeleton, different semiring, different question answered.`,
    whyASR:
      "1-best ASR decoding is literally 'run shortest path, in the tropical semiring, over HCLG composed with the per-utterance acoustic scores' — the backtrace is the recognized word sequence.",
    prereqs: ["tropical-semiring", "weight"],
    related: ["viterbi", "forward-score"],
    widget: "shortest-path",
  },

  viterbi: {
    id: "viterbi",
    term: "Viterbi",
    oneLiner:
      "The Viterbi algorithm is shortest-path search specialized to an HMM-shaped machine — finding the single most likely state sequence given the observations.",
    body: `Historically the Viterbi algorithm was described directly over [[hmm|HMM]] trellises (states × time frames), but it's exactly the tropical-[[semiring|semiring]] [[shortest-path|shortest path]] algorithm: propagate the best score to each (state, frame) cell with a backpointer to how it got there, then backtrace from the best final cell. Framing it as WFST shortest path just means the same code handles arbitrary composed machines, not only a hand-drawn HMM trellis.

Where the HMM view adds detail is time: at each frame the token either stays on a state via a self-loop (emitting another frame in the same phone/state) or advances — that's the "3-state left-to-right with self-loops" [[hmm|HMM]] topology.`,
    whyASR:
      "Viterbi decoding — find the best acoustic-state sequence, read off the words it implies — is the classic algorithm underlying 1-best ASR decoding, whether framed as an HMM trellis or as WFST shortest path.",
    prereqs: ["shortest-path", "hmm"],
    related: ["tropical-semiring", "beam-pruning"],
  },

  "forward-score": {
    id: "forward-score",
    term: "forward score",
    oneLiner:
      "The forward score is the total probability mass over every path to a state, computed with the log semiring instead of just tracking the single best path.",
    body: `Where [[shortest-path|shortest path]]/[[viterbi|Viterbi]] in the [[tropical-semiring|tropical semiring]] answers "what's the best path's score," the forward score runs the same style of computation in the [[log-semiring|log semiring]] to answer "summed over *every* path, how much probability mass reaches this state." It's the standard forward-algorithm quantity from HMM theory, generalized to any WFST.

This is what you need whenever a single best guess isn't enough — e.g. computing a normalized posterior probability for [[rescoring|rescoring]], or getting a calibrated confidence rather than just an arg-max.`,
    whyASR:
      "Computing lattice posteriors, confidence scores, or expected-value training objectives (like in some sequence-discriminative training criteria) all require forward scores, not just the 1-best Viterbi path.",
    prereqs: ["log-semiring", "path"],
    related: ["lattice", "rescoring"],
  },

  // ---------------------------------------------------------------------
  // ASR-specific
  // ---------------------------------------------------------------------
  phoneme: {
    id: "phoneme",
    term: "phoneme",
    oneLiner:
      "A phoneme is an abstract, language-specific unit of sound that distinguishes meaning — like the 't' vs. 'd' that makes 'to' and 'do' different words.",
    body: `Phonemes are abstractions defined by contrast within a language: two sounds are different phonemes if swapping one for the other can change a word's meaning. They're the units a [[pronunciation|pronunciation]] dictionary is written in, and the input alphabet for building a [[lexicon|lexicon]] (L) transducer.

A phoneme is not the same thing as the actual acoustic sound produced — that's a [[phone|phone]]: the same phoneme can be realized as physically different phones depending on context (a 't' sounds different at the start of a word versus after an 's').`,
    whyASR:
      "The lexicon (L) is authored as a mapping from phoneme sequences to words, forming the phone-to-word translation layer of HCLG.",
    prereqs: [],
    related: ["phone", "pronunciation"],
  },

  phone: {
    id: "phone",
    term: "phone",
    oneLiner:
      "A phone is an actual, concrete speech sound — the acoustic realization of a phoneme, which can vary with context.",
    body: `Where a [[phoneme|phoneme]] is an abstract category, a phone is what's physically produced and modelled acoustically. The same phoneme can surface as different phones depending on neighboring sounds (coarticulation) — which is exactly the phenomenon [[triphone|triphone]] modeling is built to capture.

Acoustic models (and the H transducer) are typically built over context-dependent phone units rather than bare phonemes, because modeling the *actual* acoustic variation gives much better recognition accuracy than pretending every occurrence of a phoneme sounds the same.`,
    whyASR:
      "H and the acoustic model operate on phones (often context-dependent ones), not the more abstract phonemes — the gap between phoneme and phone is precisely what triphone modeling closes.",
    prereqs: ["phoneme"],
    related: ["triphone", "hmm"],
  },

  triphone: {
    id: "triphone",
    term: "triphone",
    oneLiner:
      "A triphone is a phone modeled together with its left and right neighbor — 'the p in a-p-t' rather than plain 'p' — because context changes how it sounds.",
    body: `Coarticulation means a [[phone|phone]]'s acoustic realization depends heavily on its neighbors. Modeling context-dependent units (triphones: phone plus left and right context) instead of plain context-independent phones dramatically improves acoustic accuracy, at the cost of far more units to model (every phone × every left context × every right context).

The C transducer in HCLG handles exactly this: its input side is context-dependent phones (triphones), and its output side is plain phones, so composing C in translates the rest of the pipeline from a monophone view into a context-dependent one. State-tying/clustering (not covered by a toy example) is normally used to avoid needing a fully separate model per triphone.`,
    whyASR:
      "C (context-dependency) is the transducer that turns triphones into phones in HCLG; adding it after starting with monophones is what upgrades a toy decoder toward realistic acoustic modeling.",
    prereqs: ["phone"],
    related: ["transition-id", "hclg"],
    widget: "triphone",
  },

  lexicon: {
    id: "lexicon",
    term: "lexicon",
    oneLiner:
      "The lexicon is the dictionary that lists, for every word, how it's pronounced as a sequence of phones.",
    body: `As a [[transducer|transducer]] (the L in HCLG), the lexicon's input side is [[phone|phones]] and its output side is words: walking a [[pronunciation|pronunciation]]'s phone sequence and emitting the word (usually on the last phone, [[epsilon|epsilon]] before that) is how L translates a phone stream into a word stream. Words with multiple valid pronunciations, or two different words that happen to sound alike (homophones), are exactly where a lexicon transducer earns its keep over a simple lookup table.

Composing L with a [[grammar-lm|grammar/LM]] (G) — \`L ∘ G\` — is the first big composition step toward HCLG: it turns "phones in, words out" plus "how likely is this word sequence" into a single searchable graph.`,
    whyASR:
      "L is one of the four transducers composed to build HCLG, converting the phone stream from C into words that G can then score.",
    prereqs: ["pronunciation"],
    related: ["grammar-lm", "hclg"],
  },

  pronunciation: {
    id: "pronunciation",
    term: "pronunciation",
    oneLiner:
      "A pronunciation is one specific phone sequence that spells out how a word is said.",
    body: `A word can have more than one pronunciation (e.g. "the" said as "DH AH" or "DH IY"), and the [[lexicon|lexicon]] transducer typically encodes each as a separate path from the start state to the word's output, so decoding can pick whichever pronunciation best matches the audio.

Pronunciations are written in terms of [[phoneme|phonemes]] in the dictionary, but the acoustic model that actually scores them reasons over [[phone|phones]] (and often context-dependent [[triphone|triphones]]) — the lexicon is the bridge between the two.`,
    whyASR:
      "Multi-pronunciation words are a direct, concrete demonstration of why the lexicon has to be a weighted transducer (with branching paths) rather than a flat dictionary lookup.",
    prereqs: ["phoneme"],
    related: ["lexicon"],
  },

  "grammar-lm": {
    id: "grammar-lm",
    term: "language model",
    oneLiner:
      "The grammar / language model scores word sequences by plausibility — how likely is this sequence of words in the language, independent of the audio.",
    body: `As an [[acceptor|acceptor]] (the G in HCLG), the grammar assigns a [[weight|weight]] to each word sequence it accepts — commonly an n-gram model, where the weight approximates \`-log P(word | previous words)\` summed across the sequence, learned by counting word sequences in a text corpus and turning counts into probabilities (and then into [[neg-log-prob|negative-log weights]]).

G is what keeps a decoder from picking an acoustically-plausible but nonsensical word sequence: even if the audio is ambiguous between two words, the one that fits the grammar's expectations gets a lower total weight once composed with the acoustic evidence.`,
    whyASR:
      "G supplies the 'does this sequence of words make sense' signal that acoustic scores alone can't provide, and it's the piece most often swapped out for a bigger model at rescoring time.",
    prereqs: [],
    related: ["lexicon", "hclg"],
  },

  hmm: {
    id: "hmm",
    term: "HMM",
    oneLiner:
      "An HMM (hidden Markov model) models a sound as a short chain of states you move through over time, with self-loops letting a state last more than one frame.",
    body: `A classic ASR HMM topology for one [[phone|phone]] is 3 states in a row, left-to-right only (no going backward), each with a self-loop: at every audio frame, stay on the current state (the sound continues) or advance to the next one (the sound has moved on). This lets a phone of variable duration (a few frames or many) be modeled by the same small machine.

As a [[transducer|transducer]] (the H in HCLG), the HMM's input labels are transition-ids (one per specific arc/frame-step in the topology) and its output is phones — H is what turns a frame-by-frame sequence of acoustic decisions into a phone stream that C and L can consume.`,
    whyASR:
      "H is the HMM transducer in HCLG, translating transition-id sequences (what the acoustic model scores frame by frame) into phones — the very first translation step in the pipeline.",
    prereqs: ["phone"],
    related: ["transition-id", "viterbi"],
    widget: "hmm",
  },

  "transition-id": {
    id: "transition-id",
    term: "transition-id",
    oneLiner:
      "A transition-id names one specific arc in one specific HMM state's topology — the actual unit the acoustic model produces a score for, every frame.",
    body: `Rather than scoring phones directly, the acoustic model scores transition-ids: identifiers that pin down "this triphone, this HMM state within it, this specific self-loop-or-advance arc." Each frame, the acoustic model effectively hands back a score per transition-id, and the [[hmm|HMM]] transducer H is exactly the machine whose input alphabet is transition-ids and whose output is phones.

This is the lowest-level, most fine-grained symbol in the whole HCLG pipeline — everything else ([[triphone|triphones]], [[phone|phones]], words) is built by progressively translating transition-ids upward through H, C, L, G.`,
    whyASR:
      "Transition-ids are literally what the neural acoustic model's output layer (or GMM state) scores every frame, making them the input alphabet of H and the finest-grained unit in the whole decoding graph.",
    prereqs: ["hmm"],
    related: ["triphone", "hclg"],
  },

  hclg: {
    id: "hclg",
    term: "HCLG",
    oneLiner:
      "HCLG is the single search graph for decoding, built by composing and shrinking the four pipeline transducers: HCLG = min(det(H ∘ C ∘ L ∘ G)).",
    body: `Each of H ([[hmm|HMM]]/[[transition-id|transition-ids]] → phones), C ([[triphone|triphones]] → phones), L ([[lexicon|lexicon]]: phones → words), and G ([[grammar-lm|grammar/LM]]: word scores) does one small, independently-authorable translation or scoring step. [[composition|Composing]] them in order (\`H ∘ C ∘ L ∘ G\`) chains those steps into a single [[transducer|transducer]] that goes straight from transition-ids to words with a combined [[weight|weight]].

The raw composition can be huge, so it's cleaned up with [[determinization|determinization]] (one arc per input symbol per state — no redundant branching) and [[minimization|minimization]] (merge equivalent states) before it's used for search: \`HCLG = min(det(H ∘ C ∘ L ∘ G))\`. The payoff is a single, static (or lazily-expanded, see [[on-the-fly-composition|on-the-fly composition]]) graph that a generic [[shortest-path|shortest path]]/[[viterbi|Viterbi]] search can decode against, with no special-casing for "which stage am I in."`,
    whyASR:
      "HCLG is the actual object a real ASR decoder searches at runtime — everything about H, C, L, and G individually exists to explain how this one graph gets built and why it's shaped the way it is.",
    prereqs: ["hmm", "triphone", "lexicon", "grammar-lm", "composition", "determinization", "minimization"],
    related: ["on-the-fly-composition", "lattice"],
  },

  "on-the-fly-composition": {
    id: "on-the-fly-composition",
    term: "on-the-fly composition",
    oneLiner:
      "On-the-fly composition builds only the parts of A∘B that the search actually visits, instead of materializing the whole product graph upfront.",
    body: `[[composition|Composition]]'s product construction is well-defined for the *entire* state-pair space of two machines, but for big-vocabulary decoding that full product (e.g. all of [[hclg|HCLG]] composed against a huge G, or against the per-utterance acoustic scores) can be far too large to ever build and store. On-the-fly composition instead expands a state-pair only the moment [[shortest-path|search]] actually reaches it, discarding pairs that pruning or the search frontier never visits.

This trades a little runtime overhead (recomputing state-pair expansion instead of a fast array lookup) for enormous memory savings, and it's essential whenever one side of the composition (a big LM, or the per-frame acoustic scores) is effectively too large or is only known at decode time.`,
    whyASR:
      "Real large-vocabulary decoders never materialize the full composition of HCLG with a large LM or with the acoustic scores — they compose lazily during search, which is the only way decoding stays tractable at scale.",
    prereqs: ["composition", "hclg"],
    related: ["beam-pruning"],
  },

  lattice: {
    id: "lattice",
    term: "lattice",
    oneLiner:
      "A lattice is a compact graph of many plausible decoded alternatives, not just the single 1-best transcription.",
    body: `Instead of keeping only the winning [[path|path]] from [[shortest-path|shortest path]] search, a lattice retains a pruned set of competitive paths (and their [[weight|weights]]) as a small graph — much cheaper to store than listing every alternative sentence explicitly, since shared sub-paths (a common prefix or suffix) are shared in the lattice too. Generating one means running the search in a mode that keeps a beam of good hypotheses alive instead of collapsing to one immediately, and computing per-arc/per-path scores with the [[log-semiring|log semiring]] rather than only the tropical semiring's arg-min.

Lattices are what downstream steps like [[rescoring|rescoring]] operate on: instead of re-decoding from scratch with a better (and slower) model, you re-score just the paths already present in the lattice.`,
    whyASR:
      "Lattices are the standard bridge between fast first-pass decoding and expensive second-pass techniques (rescoring, confidence estimation, MBR decoding) — you decode once cheaply, then work with the lattice.",
    prereqs: ["shortest-path", "log-semiring"],
    related: ["rescoring", "forward-score"],
    widget: "lattice",
  },

  rescoring: {
    id: "rescoring",
    term: "rescoring",
    oneLiner:
      "Rescoring re-evaluates the alternatives in a lattice with a better (usually bigger, slower) model, instead of re-decoding the whole utterance from scratch.",
    body: `First-pass decoding typically uses a small, fast [[grammar-lm|language model]] to keep search cheap, producing a [[lattice|lattice]] of the best candidate paths. Rescoring then applies a stronger model — a bigger n-gram, a neural LM, or a second acoustic pass — only to the (much smaller) set of alternatives already in the lattice, replacing or combining scores and picking a new best [[path|path]].

This two-pass pattern is a standard practical compromise: you get most of the accuracy benefit of an expensive model without paying its cost during the full search over HCLG.`,
    whyASR:
      "Rescoring lattices with a bigger LM (or a neural rescorer) is one of the most common ways production ASR systems trade a little extra latency for meaningfully better accuracy.",
    prereqs: ["lattice", "grammar-lm"],
    related: ["forward-score"],
  },

  "ctc-blank": {
    id: "ctc-blank",
    term: "CTC blank",
    oneLiner:
      "The CTC blank is a special 'emit nothing new' symbol that lets a frame-synchronous model output fewer label tokens than there are audio frames.",
    body: `CTC (Connectionist Temporal Classification) models output one symbol per audio frame, but the transcript is almost always much shorter than the number of frames. The blank symbol solves this: it means "no new label here," and repeated labels separated only by blanks collapse into a single occurrence of that label when decoding — so "c c blank a a blank t t" collapses to "c a t."

Framed as a WFST, the CTC output layer defines a small topology (much like an [[hmm|HMM]] with a self-loop and a blank arc) that plays the same *structural* role as H: translating a frame-level symbol stream into the actual label sequence, then composable with a [[lexicon|lexicon]]/[[grammar-lm|LM]] just like HCLG.`,
    whyASR:
      "CTC/RNN-T decoding is expressible as WFST composition too — the blank-handling topology is just another H-like transducer — which is the direct bridge between classic HMM-based HCLG decoding and modern end-to-end ASR.",
    prereqs: ["hmm"],
    related: ["transition-id", "beam-pruning"],
  },

  "beam-pruning": {
    id: "beam-pruning",
    term: "beam pruning",
    oneLiner:
      "Beam pruning keeps search fast by throwing away hypotheses that are already much worse than the current best, instead of exploring every possibility.",
    body: `Exact [[shortest-path|shortest path]] search over the full decoding graph is often too slow for real-time use, especially with [[on-the-fly-composition|on-the-fly composition]] against a large LM. Beam pruning bounds the work: at each step, only hypotheses within some threshold ("beam width") of the current best score are kept alive; everything else is discarded, even though it might rarely have turned out best later.

This is an approximation — it can occasionally prune away what would have been the true best path — but with [[weight-pushing|weight pushing]] making early partial scores more informative, a beam that's dramatically smaller than the full search space still finds the right answer the vast majority of the time.`,
    whyASR:
      "Beam pruning is what makes real-time large-vocabulary decoding computationally feasible at all — without it, exact search over a composed HCLG-and-LM graph would be far too slow.",
    prereqs: ["shortest-path"],
    related: ["weight-pushing", "on-the-fly-composition"],
  },
};
