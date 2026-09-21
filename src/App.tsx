import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Graph from './Graph';
import ProblemStory from './ProblemStory';
import SolutionStory from './SolutionStory';
import ClosingSlides, { closingSlides } from './ClosingSlides';
import { graphResults, ingestionDuration, ingestionTiming, ingestionZoomOutAt, maxDepth, queryEntities, recall, relationships, retrievalCalls, retrievalHopSeconds, scenes, sources, traversal, userQuery } from './data';

const phaseSteps = ['Ingestion', 'Graph retrieval', 'Results'];
// Stable graph stage IDs preserve the existing animation timelines.
const presentationStages = [-1, -2, 3, 4, 5, ...closingSlides.map((_, index) => scenes.length + index)];
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const getMotionPreference = () => motionPreference.matches;
// Motion's preference hook snapshots on mount; this also handles live changes.
function subscribeToMotionPreference(onChange: () => void) {
  motionPreference.addEventListener('change', onChange);
  return () => motionPreference.removeEventListener('change', onChange);
}

export default function App() {
  const [stage, setStage] = useState(-1);
  const [ingestionRun, setIngestionRun] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const onTime = useCallback((seconds: number) => setElapsed(seconds), []);
  const milliseconds = elapsed * 1000;
  const wave = Math.max(0, Math.min(maxDepth, Math.floor(elapsed / retrievalHopSeconds)));
  const retrievalCall = retrievalCalls[wave];
  const ingestionPhase = milliseconds >= ingestionDuration ? 2 : milliseconds >= ingestionTiming.read ? 1 : 0;
  const ingestionFocused = milliseconds >= ingestionTiming.read && milliseconds < ingestionZoomOutAt;
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, getMotionPreference);
  const phaseStep = stage - 3;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat) setPaused(current => !current);
        return;
      }
      if (event.key.toLowerCase() === 'r' && (stage === -1 || stage === -2 || stage === 3)) {
        event.preventDefault();
        if (!event.repeat) {
          setElapsed(0);
          setPaused(false);
          setIngestionRun(current => current + 1);
        }
        return;
      }
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat) return;
      const nextStage = event.key === 'Home' ? -1 : event.key === 'End' ? scenes.length - 1 :
        presentationStages[Math.max(0, Math.min(presentationStages.length - 1,
          presentationStages.indexOf(stage) + (event.key === 'ArrowRight' ? 1 : -1)))];
      if (nextStage === stage && event.key !== 'Home') return;
      setStage(nextStage);
      if (event.key === 'Home' && stage === -1) setIngestionRun(current => current + 1);
      setElapsed(0);
      setPaused(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stage]);

  useLayoutEffect(() => {
    if (!paused) return;
    const animations = (mainRef.current?.getAnimations({ subtree: true }) ?? [])
      .filter(animation => animation instanceof CSSAnimation || animation instanceof CSSTransition);
    animations.forEach(animation => animation.pause());
    return () => animations.forEach(animation => {
      if (animation.playState === 'paused') animation.play();
    });
  }, [paused]);

  const found = useMemo(() => new Set(
    stage === 4 ? [...traversal.depths].filter(([, depth]) => depth <= wave).map(([id]) => id) :
    stage === 5 ? graphResults : [],
  ), [stage, wave]);

  return (
    <main ref={mainRef} className="presentation" data-stage={stage} data-recall={recall(found)} data-paused={paused} data-time={elapsed}
      aria-label="Glint Knowledge Core graph presentation">
      <p className="sr-only" id="presentation-instructions">
        Use the Right arrow for the next step and the Left arrow for the previous step.
        Home restarts the opening story; End shows the graph result. Continue with Right arrow for benefits, tradeoffs, and graph images.
        Press R on the opening story, Solution, or Ingestion to replay that animation.
        Press Space at any time to pause or resume all animation.
        This is a synthetic illustration, not a benchmark.
      </p>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Step {presentationStages.indexOf(stage) + 1} of {presentationStages.length}: {stage === -1 ? 'The context problem' : stage === -2 ? 'Solution definition' : stage < scenes.length ? scenes[stage].label : closingSlides[stage - scenes.length].label}.
        {stage >= 0 && stage < scenes.length && <> {found.size} of 20 relevant sources retrieved; {recall(found)} percent recall.</>}
        {paused ? ' Animation paused.' : ''}
      </p>
      {stage === -1 ? <ProblemStory key={ingestionRun} paused={paused} reducedMotion={reducedMotion} onTime={onTime} /> :
        stage === -2 ? <SolutionStory key={ingestionRun} paused={paused} reducedMotion={reducedMotion} onTime={onTime} /> :
        stage >= scenes.length ? <ClosingSlides index={stage - scenes.length} /> : <>
      <Graph stage={stage} found={found} reducedMotion={reducedMotion} ingestionRun={ingestionRun}
        ingestionFocused={ingestionFocused} paused={paused} onTime={onTime} />
      <div className="step-label" data-testid="step-label">
        <span className="step-number">STEP {String(phaseStep + 1).padStart(2, '0')} / 03</span>
        <h1>Graph RAG</h1>
        <ol className="phase-steps" aria-label="Graph RAG steps">
          {phaseSteps.map((label, index) => (
            <li key={label} className={index === phaseStep ? 'current' : index < phaseStep ? 'complete' : ''}
              aria-current={index === phaseStep ? 'step' : undefined}>
              <span className="phase-step-index">{index + 1}</span><span>{label}</span>
            </li>
          ))}
        </ol>
      </div>
      {stage === 4 && <div className="search-call"
        data-testid="search-call" data-kind="graph"
        data-hop={wave} role="note" aria-label="Illustrative retrieval calls">
        <p className="user-query"><span>USER QUERY · HIGHLIGHTED ENTITIES BECOME SEARCH TERMS</span>
          {queryEntities.map((entity, index) => <span className="query-fragment" key={entity.start}>
            {userQuery.slice(index ? queryEntities[index - 1].end : 0, entity.start)}
            <mark data-entity={entity.kind}>{entity.text}</mark>
          </span>)}{userQuery.slice(queryEntities[queryEntities.length - 1]?.end ?? 0)}
        </p>
        <span className="search-tool-label">
          {`CALL ${String(wave + 1).padStart(2, '0')} / ${String(retrievalCalls.length).padStart(2, '0')} · ${wave === 0 ? 'TEXT SEARCH · FIND THE SEED' : `GRAPH HOP ${wave} / ${maxDepth}`}`}
        </span>
        <code><span className="search-prompt" aria-hidden="true">{'> '}</span>
          {retrievalCall.command}
        </code>
        <div className="retrieval-detail" role="status" aria-live="polite" aria-atomic="true">
          <span className="retrieval-example">{retrievalCall.example}</span>
          <span className="retrieval-count">{wave === 0 ? '1 text match · 0 graph hops' :
            `Frontier: ${retrievalCall.fromIds.length} source${retrievalCall.fromIds.length === 1 ? '' : 's'} · ${retrievalCall.toIds.length} new · ${found.size} retrieved`}</span>
        </div>
        <span className="search-call-note">Illustrative calls over synthetic data; each hop expands the previous frontier, not another text search.</span>
      </div>}
      {stage === 3 && <div className="ingestion-status" data-testid="ingestion-status" data-phase={ingestionPhase}
        role="status" aria-live="polite" aria-atomic="true">
        <span className="ingestion-indicator" aria-hidden="true" />
        <span>{ingestionPhase === 0 ? `Reading ${sources.length} sources` :
          ingestionPhase === 1 ? ingestionFocused ? 'Extracting typed relationships' : `Connecting all ${relationships.length} relationships` :
          `Graph ready · ${relationships.length} connections`}</span>
        <span className="replay-hint"><kbd>R</kbd> replay</span>
        <span className="ingestion-progress" aria-hidden="true" style={{ width: `${Math.min(100, milliseconds / ingestionDuration * 100)}%` }} />
      </div>}
        {stage === 5 && <div className="missed-context-label" data-testid="missed-context-label">
          <span className="missed-context-symbol" aria-hidden="true">×</span>
          <div><h2>Missed context</h2><p>1 relevant source not retrieved</p></div>
        </div>}
      <div className="playback-hint" data-testid="playback-hint">
        {paused && <strong>Paused</strong>}<kbd>Space</kbd><span>{paused ? 'resume' : 'pause'}</span>
      </div>
      </>}
    </main>
  );
}
