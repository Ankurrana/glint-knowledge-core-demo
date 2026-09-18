export const closingSlides = [
  { label: 'Benefits', title: 'Connected context. Better-informed agents.' },
  { label: 'Tradeoffs', title: 'Better context takes deliberate engineering.' },
  { label: 'The big picture', title: 'Knowledge Core: the big picture' },
  { label: 'Inside the graph', title: 'From the big picture to connected context' },
];

const benefits = [
  ['Connected understanding', 'Capture how domain entities relate and interact, even when they live in completely different sources.'],
  ['One access point for agents', 'A unified knowledge layer through one MCP interface reduces separate searches across ADO, code, wikis, ICMs, tech specs, and Word documents.'],
  ['Context beyond keyword matches', 'Follow relationships to uncover indirect dependencies, product requirements, and constraints that isolated searches might miss.'],
];
const tradeoffs = [
  ['Graph quality', 'Entity extraction, entity resolution, and meaningful relationships are hard engineering problems. Missing or incorrect connections can mislead retrieval.'],
  ['Context size', 'More context is not always better. Rank, deduplicate, limit traversal, and truncate responses to stay within the agent’s context budget.'],
  ['Information freshness', 'Graphs can lag behind their sources. Incremental updates, deletion handling, and freshness tracking are essential; direct source queries may be fresher, but are not guaranteed to be.'],
];

export default function ClosingSlides({ index }: { index: number }) {
  const slide = closingSlides[index];
  const image = index >= 2;
  return <section className={`closing-slide ${image ? 'image-slide' : 'text-slide'}`} data-testid="closing-slide"
    aria-labelledby="closing-title">
    <div className="closing-heading">
      <span className="step-number">KNOWLEDGE CORE · {String(index + 1).padStart(2, '0')} / 04 · {slide.label.toUpperCase()}</span>
      <h1 id="closing-title">{slide.title}</h1>
    </div>
    {image ? <figure className={`graph-image ${index === 2 ? 'overview-image' : ''}`}>
      <img src={`./images/knowledge-graph-${index === 2 ? 'overview' : 'detail'}.png`}
        alt={index === 2
          ? 'Zoomed-out supplied graph screenshot showing many pink and orange entities arranged in clusters.'
          : 'Zoomed-in supplied graph screenshot showing directed relationships labeled SUBJECT_OF and TARGETS between pink and orange nodes.'} />
      <figcaption>{index === 2
        ? 'A zoomed-out view of the ingested graph: its overall structure and clusters of connected entities.'
        : <>Directed, typed relationships such as <code>SUBJECT_OF</code> and <code>TARGETS</code> provide paths for exploring related context beyond an initial search match.</>}</figcaption>
    </figure> : <>
      <div className="closing-points">
        {(index === 0 ? benefits : tradeoffs).map(([title, body], item) => <article key={title}>
          <span className="point-number">0{item + 1}</span>
          <h2>{title}</h2><p>{body}</p>
        </article>)}
      </div>
      <p className="closing-takeaway">{index === 0
        ? 'Find connected context—not just matching content. Coverage and graph accuracy still matter.'
        : 'The goal: the right context, within a useful size limit, and up to date.'}</p>
    </>}
    <p className="closing-navigation">← Previous · Next → <span>Home: restart · End: graph result</span></p>
  </section>;
}
