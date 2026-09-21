import { useEffect, useRef, useState } from 'react';

const duration = 23;
const progress = (time: number, start: number, length = 1) => Math.max(0, Math.min(1, (time - start) / length));
const smooth = (value: number) => value * value * (3 - 2 * value);
const sources = [
  { x: 405, y: 100, label: 'Code', entity: 'Survey API', found: true, start: 3.5 },
  { x: 630, y: 100, label: 'Documentation', entity: 'Access roles', found: true, start: 6 },
  { x: 405, y: 460, label: 'Wiki', entity: 'AudienceResolver', found: false, start: 0 },
  { x: 630, y: 460, label: 'PM spec', entity: 'Minimum cohort: 5', found: false, start: 0 },
];

export default function ProblemStory({ paused, reducedMotion, onTime }: {
  paused: boolean; reducedMotion: boolean; onTime: (seconds: number) => void;
}) {
  const [time, setTime] = useState(0);
  const clock = useRef({ time: 0, last: 0, paused });
  useEffect(() => {
    clock.current.paused = paused;
    clock.current.last = performance.now();
  }, [paused]);
  useEffect(() => {
    let frame = 0;
    clock.current.last = performance.now();
    onTime(0);
    const tick = () => {
      const now = performance.now();
      const state = clock.current;
      if (!state.paused) {
        state.time = Math.min(duration, state.time + (now - state.last) / 1000);
        setTime(state.time);
        onTime(state.time);
      }
      state.last = now;
      if (state.time < duration) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onTime]);
  const phase = time < 3 ? 0 : time < 10 ? 1 : time < 15 ? 2 : time < 20 ? 3 : 4;
  const labels = ['A developer asks', 'The agent searches', 'An answer takes shape', 'A requirement was never found', 'A plausible answer. Missing context.'];
  const reveal = (at: number) => progress(time, at, reducedMotion ? .15 : .7);
  const answer = reveal(11);
  const missing = reveal(15);
  const consequence = reveal(18);
  const send = smooth(progress(time, 1, 1.5));
  return <section className="problem-story" data-testid="problem-story" data-phase={phase} data-complete={time >= duration}>
    <div className="story-heading">
      <span className="step-number">THE CONTEXT PROBLEM</span>
      <h1>{labels[phase]}</h1>
    </div>
    <svg className="story-canvas" viewBox="0 0 1120 630" role="img"
      aria-label="Illustrative story: an agent retrieves code and documentation but misses an audience resolver and a minimum-cohort policy. Its incomplete answer displays results for three respondents despite a requirement for at least five.">
      <defs>
        <marker id="story-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 10 5 0 10Z" fill="#bddb9b" />
        </marker>
      </defs>
      <g className="story-task">
        <rect x="35" y="175" width="255" height="60" rx="12" />
        <text x="162" y="200" textAnchor="middle">Pulse survey results</text>
        <text x="162" y="222" textAnchor="middle" className="story-small">Manager access · Protect privacy</text>
      </g>
      <g transform="translate(80 300)">
        <circle cy="-15" r="17" fill="none" stroke="#d8e7c4" strokeWidth="2" />
        <path d="M-26 33v-14q0-16 26-16t26 16v14M-32 35h64" fill="none" stroke="#d8e7c4" strokeWidth="2" />
        <text y="64" textAnchor="middle">Developer</text>
      </g>
      <path d="M115 310H245" stroke="#789c89" strokeWidth="1.5" strokeDasharray="5 6" />
      <g opacity={time < 3 ? reveal(.5) : 0} transform={`translate(${reducedMotion ? 185 : 125 + send * 108} 310)`}>
        <rect x="-10" y="-8" width="20" height="16" rx="3" fill="#d8e7c4" />
      </g>
      <g className="story-agent" transform="translate(280 310)">
        <circle r="45" fill="#214f40" stroke="#c6dfa2" strokeWidth="2" />
        <rect x="-23" y="-17" width="46" height="34" rx="9" fill="none" stroke="#d8e7c4" strokeWidth="2" />
        <circle cx="-9" cy="-3" r="3" fill="#d8e7c4" /><circle cx="9" cy="-3" r="3" fill="#d8e7c4" />
        <path d="M-8 9H8M0-17v-8" stroke="#d8e7c4" strokeWidth="2" />
        <text y="72" textAnchor="middle">Agent</text>
      </g>
      {sources.map((source, index) => {
        const scan = smooth(progress(time, source.start, 1.2));
        const returned = smooth(progress(time, source.start + 1.4, 1.5));
        const opacity = source.found ? reveal(source.start) : missing;
        const endX = source.x + 85;
        const endY = source.y + (source.found ? 64 : 0);
        const targetX = 409 + index * 59;
        const tokenX = endX + (targetX - endX) * returned;
        const tokenY = endY + (321 - endY) * returned;
        return <g key={source.entity} data-story-source={source.entity} data-found={source.found}>
          {source.found && <g opacity={opacity * (1 - reveal(10))}>
            <path d={`M280 265L${endX} ${endY}`} pathLength="1" stroke="#bad79c" strokeWidth="2" fill="none"
              strokeDasharray="1" strokeDashoffset={reducedMotion ? 0 : 1 - scan} markerEnd="url(#story-arrow)" />
            <text x={source.x - 30} y={source.y + 125} className="story-small">{source.label === 'Code' ? 'Lexical search' : 'Semantic search'}</text>
            <path d={`M${endX} ${endY}L${targetX} 303`} stroke="#bddb9b" strokeWidth="1" strokeDasharray="3 6"
              opacity={reveal(source.start + 1.4)} />
            {returned > 0 && returned < 1 && <g data-testid="context-fragment"
              transform={`translate(${reducedMotion ? targetX : tokenX} ${reducedMotion ? 321 : tokenY})`}>
              <rect x="-35" y="-15" width="70" height="30" rx="5" fill="#d9efb8" stroke="#f4ffe3" />
              <text y="5" textAnchor="middle" fill="#244b3a" fontSize="13">{source.label === 'Code' ? 'API code' : 'Roles'}</text>
            </g>}
          </g>}
          <g opacity={source.found ? 1 : .4 + missing * .6}>
            <rect x={source.x} y={source.y} width="190" height="70" rx="9" fill="#1b4538"
              stroke={source.found ? '#8daa86' : time >= 15 ? '#ef978a' : '#638270'} strokeWidth="1.5"
              strokeDasharray={source.found ? undefined : '5 5'} />
            <text x={source.x + 12} y={source.y + 23} className="story-small">{source.label}</text>
            <text x={source.x + 12} y={source.y + 49} fontSize="15">{source.entity}</text>
            {!source.found && <text x={source.x + 95} y={source.y + 94} textAnchor="middle" fill="#ef978a" opacity={missing} className="story-small">Not retrieved</text>}
          </g>
        </g>;
      })}
      <g opacity={reveal(3)} data-testid="story-context">
        <rect x="369" y="264" width="200" height="94" rx="12" fill="#183d32" stroke="#789b75" />
        <text x="385" y="286" className="story-small">AGENT SESSION</text>
        {[6.4, 8.9].map((at, index) => <g key={at} opacity={reveal(at)} data-testid="session-piece">
          <rect x={385 + index * 59} y="304" width="49" height="34" rx="4" fill="#b9d89b" />
          <text x={409 + index * 59} y="326" textAnchor="middle" fill="#244b3a" fontSize="12">{index === 0 ? 'Code' : 'Roles'}</text>
        </g>)}
        <rect x="503" y="304" width="49" height="34" rx="4" fill="none" stroke={time >= 15 ? '#ef978a' : '#577a64'} strokeDasharray="4 4" />
        <text x="527" y="328" textAnchor="middle" fill="#ef978a" opacity={missing}>?</text>
      </g>
      <path d="M588 310H852" stroke="#bddb9b" strokeWidth="2" pathLength="1" strokeDasharray="1"
        strokeDashoffset={reducedMotion ? 0 : 1 - smooth(progress(time, 10, 1))} opacity={reveal(10)} markerEnd="url(#story-arrow)" />
      <text x="717" y="292" textAnchor="middle" className="story-small" opacity={reveal(10)}>Generate</text>
      {[10, 11].map((start, index) => {
        const transfer = smooth(progress(time, start, 1.4));
        return transfer > 0 && transfer < 1 && !reducedMotion ? <rect key={start}
          x={580 + transfer * 300} y={300 - transfer * (index === 0 ? 15 : -6)}
          width="25" height="15" rx="3" fill="#d9efb8" /> : null;
      })}
      <g opacity={answer} data-testid="story-answer">
        <rect x="867" y="236" width="213" height="185" rx="12" fill="#204c3b" stroke={time >= 18 ? '#ef978a' : '#b9d89b'} strokeWidth="2" />
        <text x="885" y="263" className="story-small">PROPOSED ANSWER</text>
        <rect x="885" y="281" width="119" height="9" rx="3" fill="#b9d89b" />
        <rect x="885" y="302" width="158" height="9" rx="3" fill="#b9d89b" opacity={reveal(12)} />
        <rect x="885" y="323" width="95" height="9" rx="3" fill="#b9d89b" opacity={reveal(13)} />
        <rect x="885" y="350" width="175" height="49" rx="4" fill="none" stroke="#ef978a" strokeDasharray="5 5" opacity={missing} />
        <text x="972" y="380" textAnchor="middle" fill="#ef978a" fontSize="16" opacity={missing}>Privacy rule missing</text>
      </g>
      <g opacity={missing}>
        <path d="M725 460Q785 408 880 375" fill="none" stroke="#ef978a" strokeDasharray="4 6" />
        <path d="m795 412 14-14m-14 0 14 14" stroke="#ef978a" strokeWidth="3" />
      </g>
      <g opacity={consequence} data-testid="story-consequence">
        <text x="974" y="470" textAnchor="middle" fill="#ef978a" fontSize="18">3 respondents</text>
        <text x="974" y="498" textAnchor="middle" className="story-small">Results shown</text>
        <path d="M906 551h126M923 546v-20m27 20v-33m27 33v-25m27 25v-41" stroke="#ef978a" strokeWidth="10" />
      </g>
      <text x="560" y="604" textAnchor="middle" fill="#e3e7bf" opacity={reveal(20)} fontSize="21">What the agent didn’t find, the answer couldn’t account for.</text>
    </svg>
    <div className="story-footer">
      <span>Illustrative scenario · not a claim about every search</span>
      <span>{paused ? 'Paused · ' : ''}Space {paused ? 'resume' : 'pause'} · R replay · → Explore the graph</span>
    </div>
    <p className="sr-only" role="status" aria-live="polite">{labels[phase]}</p>
  </section>;
}
