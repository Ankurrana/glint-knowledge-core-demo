import usePlayback from './usePlayback';

const duration = 4.8;
const progress = (time: number, start: number, length: number) => Math.max(0, Math.min(1, (time - start) / length));
const smooth = (value: number) => value * value * (3 - 2 * value);
const entities = [
  { source: 'Code', label: 'Survey API', x: 415, y: 235, sourceY: 125, start: .15 },
  { source: 'Wiki', label: 'AudienceResolver', x: 585, y: 145, sourceY: 235, start: .4 },
  { source: 'PM specs', label: 'Minimum cohort: 5', x: 740, y: 300, sourceY: 345, start: .65 },
  { source: 'Docs', label: 'Access roles', x: 485, y: 400, sourceY: 455, start: .9 },
];
const links = [
  { path: 'M430 212L562 158', x: 487, y: 174, label: 'resolves', start: 1.8 },
  { path: 'M612 145Q770 145 740 271', x: 751, y: 205, label: 'requires', start: 2.4 },
  { path: 'M390 225C315 225 315 377 458 397', x: 367, y: 355, label: 'checks', start: 2.9 },
];

export default function SolutionStory({ paused, reducedMotion, onTime }: {
  paused: boolean; reducedMotion: boolean; onTime: (seconds: number) => void;
}) {
  const time = usePlayback(duration, paused, onTime);
  const reveal = (at: number) => progress(time, at, .25);
  const phase = time < 1.8 ? 'capture' : time < 3.5 ? 'connect' : 'retrieve';
  const delivery = smooth(progress(time, 3.6, .8));
  return <section className="problem-story solution-story" data-testid="solution-story"
    data-phase={phase} data-complete={time >= duration}>
    <div className="story-heading">
      <span className="step-number">THE SOLUTION</span>
      <h1>Many sources. One Knowledge Core.</h1>
    </div>
    <svg className="story-canvas solution-canvas" viewBox="0 0 1120 630" role="img"
      aria-label="Knowledge from code, wiki, PM specs, and documentation flows into one centralized graph. The Survey API resolves an AudienceResolver that requires a minimum cohort of five. Explicit relationships connect different wording across sources, beyond lexical or semantic similarity alone. An agent receives connected context through one MCP.">
      <defs>
        <marker id="solution-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 10 5 0 10Z" fill="#168576" />
        </marker>
      </defs>
      <rect x="310" y="65" width="540" height="430" rx="60" fill="#e2f4ea" stroke="#80bbaa" strokeWidth="1.5" />
      <text x="580" y="38" textAnchor="middle" className="solution-eyebrow">CENTRALIZED KNOWLEDGE</text>
      {entities.map((entity, index) => {
        const flight = smooth(progress(time, entity.start, .65));
        const arrived = reveal(entity.start + .65);
        return <g key={entity.source}>
          <path d={`M205 ${entity.sourceY}Q260 ${entity.sourceY} ${entity.x} ${entity.y}`}
            fill="none" stroke="#80bbaa" strokeDasharray="4 7" opacity={.55 * (1 - reveal(1.8))} />
          <g data-solution-source={entity.source}>
            <rect x="35" y={entity.sourceY - 28} width="170" height="56" rx="14" fill="#fff" stroke="#80bbaa" />
            <rect x="52" y={entity.sourceY - 12} width="19" height="24" rx="3" fill="#fff0bc" stroke="#c99d37" />
            <path d={`M57 ${entity.sourceY - 5}h9m-9 6h9`} stroke="#a37b20" strokeWidth="1.5" />
            <text x="90" y={entity.sourceY + 6} fontSize="19">{entity.source}</text>
          </g>
          {!reducedMotion && flight > 0 && flight < 1 && <g data-testid="capture-fragment"
            transform={`translate(${205 + (entity.x - 205) * flight} ${entity.sourceY + (entity.y - entity.sourceY) * flight})`}>
            <rect x="-10" y="-12" width="20" height="24" rx="5" fill="#21a88d" stroke="#087466" />
          </g>}
          <g data-solution-entity={entity.label} opacity={arrived}>
            <circle cx={entity.x} cy={entity.y} r="27" fill={index === 0 ? '#fff0bc' : '#a6e7db'}
              stroke={index === 0 ? '#c59520' : '#168576'} strokeWidth="2" />
            <circle cx={entity.x} cy={entity.y} r="6" fill={index === 0 ? '#c59520' : '#168576'} />
            <text x={entity.x} y={entity.y + 52} textAnchor="middle" className="solution-entity">{entity.label}</text>
            <text x={entity.x} y={entity.y + 73} textAnchor="middle" className="story-small">{entity.source}</text>
            {index === 0 && <g opacity={reveal(1.7)}>
              <text x={entity.x} y={entity.y - 43} textAnchor="middle" className="solution-match">TEXT MATCH</text>
            </g>}
          </g>
        </g>;
      })}
      {links.map(link => {
        const drawn = progress(time, link.start, .55);
        return <g key={link.label} data-solution-link={link.label} opacity={reveal(link.start)}>
          <path d={link.path} fill="none" stroke="#168576" strokeWidth="2.5" pathLength="1"
            strokeDasharray="1" strokeDashoffset={reducedMotion ? 0 : 1 - drawn} markerEnd="url(#solution-arrow)" />
          <g opacity={reveal(link.start + .25)}>
            <rect x={link.x - 39} y={link.y - 15} width="78" height="26" rx="13" fill="#fff9f0" />
            <text x={link.x} y={link.y + 3} textAnchor="middle" className="solution-relationship">{link.label}</text>
          </g>
        </g>;
      })}
      <g opacity={reveal(3.2)} data-testid="connected-context">
        <rect x="600" y="415" width="215" height="35" rx="17" fill="#168576" />
        <text x="707" y="438" textAnchor="middle" fill="#fff" fontSize="16">Connected context</text>
      </g>
      <g opacity={reveal(3.5)} data-testid="solution-mcp">
        <path d="M850 270H969" fill="none" stroke="#168576" strokeWidth="2.5" pathLength="1"
          strokeDasharray="1" strokeDashoffset={reducedMotion ? 0 : 1 - delivery} markerEnd="url(#solution-arrow)" />
        <text x="908" y="246" textAnchor="middle" className="solution-relationship">ONE MCP</text>
        {!reducedMotion && delivery > 0 && delivery < 1 &&
          <circle data-testid="delivery-fragment" cx={850 + 114 * delivery} cy="270" r="7" fill="#eca83c" />}
      </g>
      <g transform="translate(1020 270)">
        <circle r="44" fill="#fff0bc" stroke="#c59520" strokeWidth="2" />
        <rect x="-23" y="-17" width="46" height="34" rx="12" fill="none" stroke="#205851" strokeWidth="2" />
        <circle cx="-9" cy="-3" r="3" fill="#205851" /><circle cx="9" cy="-3" r="3" fill="#205851" />
        <path d="M-8 7Q0 15 8 7M0-17v-8" fill="none" stroke="#205851" strokeWidth="2" />
        <text y="72" textAnchor="middle" fontSize="20">Agent</text>
        <g opacity={reveal(4.15)} data-testid="solution-answer">
          <circle cx="32" cy="-30" r="14" fill="#168576" />
          <path d="m25-30 5 5 9-10" stroke="#fff" strokeWidth="2.5" fill="none" />
        </g>
      </g>
      <text x="560" y="566" textAnchor="middle" fontSize="25" opacity={reveal(3.1)}>
        Relationships beyond text similarity.
      </text>
      <text x="560" y="599" textAnchor="middle" className="story-small" opacity={reveal(4.3)}>
        One MCP. Connected context.
      </text>
    </svg>
    <div className="story-footer">
      <span>Illustrative capture · curated relationships</span>
      <span>{paused ? 'Paused · ' : ''}Space {paused ? 'resume' : 'pause'} · R replay · → Ingestion</span>
    </div>
    <p className="sr-only" role="status" aria-live="polite">
      {phase === 'capture' ? 'Capture knowledge from multiple sources in one core.' :
        phase === 'connect' ? 'Capture explicit relationships between differently named entities across sources.' :
        'Retrieve connected context through one MCP.'}
    </p>
  </section>;
}
