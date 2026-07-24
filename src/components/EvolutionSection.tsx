import "./EvolutionSection.css";

const OPTIMIZATIONS = [
  {
    name: "Determinize",
    before: "Several same-label choices",
    after: "One unambiguous next move",
    benefit: "Less repeated search",
  },
  {
    name: "Minimize",
    before: "Equivalent states repeated",
    after: "Equivalent futures shared",
    benefit: "Less memory",
  },
  {
    name: "Push weights",
    before: "Important costs arrive late",
    after: "Costs move earlier when valid",
    benefit: "Bad routes die sooner",
  },
  {
    name: "Beam prune",
    before: "Every live route expands",
    after: "Only near-best routes survive",
    benefit: "Much less work",
  },
  {
    name: "Compose lazily",
    before: "Build the entire product graph",
    after: "Create states only when visited",
    benefit: "Avoid unused regions",
  },
  {
    name: "Lattice + rescore",
    before: "Keep one answer immediately",
    after: "Keep a compact set of contenders",
    benefit: "Use a stronger model later",
  },
] as const;

export function EvolutionSection() {
  return (
    <section className="evolution" id="evolution" aria-labelledby="evolution-title">
      <div className="section-heading evolution__heading">
        <div>
          <p className="eyebrow">From the base idea to modern speech recognition</p>
          <h2 id="evolution-title">The goal stayed. Where the knowledge lives changed.</h2>
        </div>
        <p>
          Every generation still balances what the audio supports with what a plausible transcript
          looks like.
        </p>
      </div>

      <div className="optimization-section">
        <div className="optimization-section__intro">
          <p className="eyebrow">First: make the explicit graph practical</p>
          <h3>Exact transformations shrink the map; search tricks avoid reading all of it.</h3>
          <p>
            Some operations preserve every possible answer exactly. Others deliberately ignore
            routes that are already too far behind to matter.
          </p>
        </div>
        <div className="optimization-table-wrap">
          <table className="optimization-table">
            <thead>
              <tr>
                <th>Improvement</th>
                <th>Before</th>
                <th>After</th>
                <th>Why it helps</th>
              </tr>
            </thead>
            <tbody>
              {OPTIMIZATIONS.map((item) => (
                <tr key={item.name}>
                  <th scope="row">{item.name}</th>
                  <td>{item.before}</td>
                  <td>{item.after}</td>
                  <td>{item.benefit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="history-track" aria-label="Speech recognition architecture timeline">
        <article>
          <div className="history-track__time">1990s–2000s</div>
          <div className="history-track__marker" aria-hidden="true">
            1
          </div>
          <div className="history-track__content">
            <p className="eyebrow">Classical WFST decoder</p>
            <h3>Knowledge is split into inspectable machines.</h3>
            <p>
              HMM/GMM acoustics, context rules, a pronunciation lexicon, and an n-gram language
              model become H∘C∘L∘G. Training estimates many of the weights; graph algorithms compile
              the pieces into one efficient search space.
            </p>
            <div className="architecture-strip" aria-label="Classical architecture">
              <span>audio</span>
              <b>→</b>
              <span>acoustic scores</span>
              <b>→</b>
              <strong>explicit HCLG graph</strong>
              <b>→</b>
              <span>words</span>
            </div>
          </div>
        </article>

        <article>
          <div className="history-track__time">2010s</div>
          <div className="history-track__marker" aria-hidden="true">
            2
          </div>
          <div className="history-track__content">
            <p className="eyebrow">Hybrid neural systems</p>
            <h3>A neural network improves the ears; the graph keeps the language.</h3>
            <p>
              Deep neural acoustic models replace older GMM scoring, but the decoder can still use
              the same lexicon, language model, and WFST search machinery. The learned component
              gets stronger without discarding the explicit structure.
            </p>
          </div>
        </article>

        <article>
          <div className="history-track__time">2010s → now</div>
          <div className="history-track__marker" aria-hidden="true">
            3
          </div>
          <div className="history-track__content">
            <p className="eyebrow">CTC and RNN-T</p>
            <h3>The model learns audio-to-token alignment more directly.</h3>
            <p>
              CTC predicts frame-level labels with a blank-and-collapse rule. RNN-T jointly learns
              acoustic and previous-token context and works well for streaming. A lexicon or WFST
              language model can still be attached, but it is no longer required by the core
              architecture.
            </p>
          </div>
        </article>

        <article className="history-track__whisper">
          <div className="history-track__time">2022</div>
          <div className="history-track__marker" aria-hidden="true">
            4
          </div>
          <div className="history-track__content">
            <p className="eyebrow">Whisper: a different endpoint</p>
            <h3>The route map is learned implicitly inside a Transformer.</h3>
            <p>
              Whisper converts 30-second audio chunks into log-Mel spectrograms. An encoder reads
              the audio; an autoregressive decoder predicts text and special tokens one token at a
              time. It was trained on 680,000 hours of multilingual, multitask supervised data.
            </p>
            <div className="architecture-strip architecture-strip--whisper" aria-label="Whisper architecture">
              <span>audio</span>
              <b>→</b>
              <span>log-Mel</span>
              <b>→</b>
              <strong>Transformer encoder + decoder</strong>
              <b>→</b>
              <span>tokens</span>
            </div>
            <p className="whisper-correction">
              <strong>Important:</strong> Whisper does not compile an explicit HCLG WFST. Its
              acoustic, language, and multilingual knowledge is distributed through learned model
              parameters, while decoding searches possible next-token sequences.
            </p>
          </div>
        </article>

        <article>
          <div className="history-track__time">Current OpenAI models</div>
          <div className="history-track__marker" aria-hidden="true">
            5
          </div>
          <div className="history-track__content">
            <p className="eyebrow">The frontier keeps moving</p>
            <h3>Whisper is the clearest bridge, not the final stop.</h3>
            <p>
              OpenAI’s newer GPT-4o Transcribe model reports better word error rate, language
              recognition, and transcription accuracy than the original Whisper models. The lesson
              remains useful because explicit graph search makes the universal problem—represent
              alternatives, score them, and search efficiently—visible.
            </p>
          </div>
        </article>
      </div>

      <div className="explicit-implicit">
        <article>
          <small>Classical WFST</small>
          <h3>Explicit possibilities</h3>
          <p>
            You can inspect states, arcs, labels, and separately sourced weights. Constraints are
            easy to add and the winning route can be traced.
          </p>
        </article>
        <div className="explicit-implicit__same">
          <span aria-hidden="true">≈</span>
          <strong>same decoding problem</strong>
          <small>different representation</small>
        </div>
        <article>
          <small>Whisper-style model</small>
          <h3>Implicit possibilities</h3>
          <p>
            Knowledge is learned jointly in neural parameters. Token search remains visible, but
            there is no hand-inspectable pronunciation-and-grammar graph inside it.
          </p>
        </article>
      </div>

      <div className="evolution-sources">
        <span>Read the primary sources:</span>
        <a
          href="https://research.google/pubs/weighted-finite-state-transducers-in-speech-recognition-3/"
          target="_blank"
          rel="noreferrer"
        >
          WFSTs in speech recognition (2002)
        </a>
        <a href="https://arxiv.org/abs/1211.3711" target="_blank" rel="noreferrer">
          RNN Transducer (2012)
        </a>
        <a href="https://openai.com/index/whisper/" target="_blank" rel="noreferrer">
          Introducing Whisper
        </a>
        <a
          href="https://developers.openai.com/api/docs/models/gpt-4o-transcribe"
          target="_blank"
          rel="noreferrer"
        >
          GPT-4o Transcribe
        </a>
      </div>
    </section>
  );
}
