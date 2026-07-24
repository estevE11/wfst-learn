# wfst-lab

An interactive, from-scratch introduction to weighted finite-state transducers for speech
recognition. The app turns the usual H ∘ C ∘ L ∘ G diagram into machines you can inspect,
compose step by step, and decode.

**[Open the live learning lab](https://esteve11.github.io/wfst-learn/)**

## What works

- A typed WFST data structure with tropical and log semirings
- Weighted composition with epsilon handling
- Tropical shortest path / Viterbi decoding
- Graphviz rendering in the browser through WebAssembly
- A six-step, reversible introduction showing speech become a sentence before any jargon
- A live L ∘ G construction lab with product-state stepping
- Editable language-model costs that flip the decoded best path
- 37 linked concept explainers, interactive semiring/weight demos, and saved progress

The longer learning and implementation direction lives in [IDEA.md](./IDEA.md).

## Run locally

```sh
npm install
npm run dev
```

Then open the URL Vite prints, normally `http://localhost:5173`.

## Verify

```sh
npm run build
npm test
npm run lint
```

The next planned milestone is visualized determinization and minimization, followed by the
toy acoustic-score matrix and frame-by-frame token-passing decoder described in `IDEA.md`.
