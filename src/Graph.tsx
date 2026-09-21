import { memo, useLayoutEffect, useRef } from 'react';
import { forceCollide, forceSimulation, forceX, forceY } from 'd3-force';
import type { SimulationNodeDatum } from 'd3-force';
import { useAnimate, useMotionValue } from 'motion/react';
import type { AnimationSequence, DOMKeyframesDefinition, MotionValue } from 'motion/react';
import { groups, ingestionDuration, ingestionEdgeTimings, ingestionExamples, ingestionTiming, ingestionZoomOutAt, maxDepth, relationships, retrievalHopSeconds, sourceName, sources, tourDuration, tourReturnAt, tourStops, tourTiming, traversal } from './data';
import type { Source } from './data';

interface PositionedSource extends Source, SimulationNodeDatum {
  x: number;
  y: number;
}
function makeLayout(): PositionedSource[] {
  const nodes = sources.map((source, i) => {
    const group = groups.find(g => g.type === source.type)!;
    const angle = i * 2.399963;
    return { ...source, x: group.x + Math.cos(angle) * 70, y: group.y + Math.sin(angle) * 65 };
  });
  const simulation = forceSimulation(nodes)
    .force('x', forceX<PositionedSource>(node => groups.find(g => g.type === node.type)!.x).strength(0.065))
    .force('y', forceY<PositionedSource>(node => groups.find(g => g.type === node.type)!.y).strength(0.065))
    .force('collide', forceCollide<PositionedSource>(node => node.relevant ? 23 : 17).iterations(3))
    .stop();
  simulation.tick(240);
  return nodes;
}

const layout = makeLayout();
const positions = new Map(layout.map(node => [node.id, node]));
const clusters = groups.map(group => ({
  ...group,
  labelY: Math.min(...layout.filter(node => node.type === group.type).map(node => node.y)) - 70,
}));
const ease = [.22, 1, .36, 1] as const;
const palette = { retrieved: '#21a88d', missed: '#c74739', relevant: '#eca83c', other: '#93b7b3' };
const nodeDelays = new Map(groups.flatMap((group, groupIndex) =>
  layout.filter(node => node.type === group.type).map((node, index) => [
    node.id, (groupIndex * ingestionTiming.nodeClusterStagger + index * ingestionTiming.nodeStagger) / 1000,
  ] as const),
));
const overviewBox = '-25 -175 1000 1000';
const tourViews = tourStops.map(stop => {
  const nodes = layout.filter(node => node.type === stop.type);
  const left = Math.min(...nodes.map(node => node.x)) - 40;
  const top = Math.min(...nodes.map(node => node.y)) - 210;
  const labelX = Math.max(...nodes.map(node => node.x)) + 32;
  const bottom = Math.max(...nodes.map(node => node.y)) + 125;
  return { ...stop, labelX, labelY: top + 235, viewBox: `${left} ${top} ${labelX + 210 - left} ${bottom - top}` };
});
const exampleNodeIds = new Set(ingestionExamples.flatMap(edge => [edge.source, edge.target]));
const exampleNodes = layout.filter(node => exampleNodeIds.has(node.id));
const focusLeft = Math.min(...exampleNodes.map(node => node.x)) - 80;
const focusTop = Math.min(...exampleNodes.map(node => node.y)) - 80;
const focusWidth = Math.max(...exampleNodes.map(node => node.x)) - focusLeft + 80;
const focusHeight = Math.max(...exampleNodes.map(node => node.y)) - focusTop + 100;
const focusBox = `${focusLeft} ${focusTop} ${focusWidth} ${focusHeight}`;

function isRetrieved(node: Source, stage: number) {
  return stage === 1 ? node.search === 'code' : stage === 2 ? Boolean(node.search)
    : stage >= 4 ? traversal.depths.has(node.id) : false;
}

// All visual motion and delayed reveals share one pausable playback clock.
function createSequence(stage: number, reducedMotion: boolean, camera: MotionValue<string>): AnimationSequence {
  const building = stage === 3;
  const duration = stage === 0 ? tourDuration : building ? ingestionDuration / 1000 : stage === 4 ? maxDepth * retrievalHopSeconds + 1.4 : .8;
  // Keep a changing clock first, including scenes with no camera movement.
  const sequence: AnimationSequence = [
    [{ progress: 0 }, { progress: 1 }, { at: 0, duration, ease: 'linear' }],
  ];
  const normalDuration = reducedMotion ? 0 : .8;
  const zoomIn = ingestionTiming.read / 1000;
  const zoomOut = ingestionZoomOutAt / 1000;
  const add = (selector: string, values: DOMKeyframesDefinition, at = 0, duration = normalDuration) => {
    sequence.push([selector, values, { at, duration, ease }]);
  };
  const moveCamera = (viewBox: string | string[], at: number, duration: number) => {
    sequence.push([camera, viewBox, { at, duration, ease }]);
  };
  moveCamera(overviewBox, 0, building || reducedMotion ? 0 : .5);
  add('.cluster', { opacity: 1 });
  add('.relationship-detail', { opacity: 0 }, 0, 0);
  add('.relationship-annotation', { opacity: 0 }, 0, 0);
  add('.tour-entities', { opacity: 0 }, 0, 0);
  add('.relationships', { opacity: stage >= 3 ? 1 : 0 }, 0, reducedMotion ? 0 : .4);
  if (!reducedMotion) {
    add('.ingestion-scan, .wave-ring', { opacity: 0 }, 0, 0);
  }
  if (building) {
    moveCamera([overviewBox, focusBox], zoomIn, reducedMotion ? 0 : ingestionTiming.focusIn / 1000);
    moveCamera([focusBox, overviewBox], zoomOut, reducedMotion ? 0 : ingestionTiming.focusOut / 1000);
    add('.cluster', { opacity: [1, 0] }, zoomIn, reducedMotion ? 0 : .4);
    add('.cluster', { opacity: [0, 1] }, zoomOut, reducedMotion ? 0 : .4);
    add('.relationship-detail', { opacity: [0, 1] }, zoomIn, reducedMotion ? 0 : .3);
    add('.relationship-detail', { opacity: [1, 0] }, zoomOut, reducedMotion ? 0 : .3);
  }
  if (stage === 0) {
    tourViews.forEach((view, index) => {
      moveCamera([index ? tourViews[index - 1].viewBox : overviewBox, view.viewBox], view.start, reducedMotion ? 0 : tourTiming.move);
      add(`[data-tour="${view.type}"]`, { opacity: [0, 1] }, view.start + tourTiming.move, .25);
      add(`[data-tour="${view.type}"]`, { opacity: [1, 0] }, view.end - .25, .25);
    });
    moveCamera([tourViews[tourViews.length - 1].viewBox, overviewBox], tourReturnAt, reducedMotion ? 0 : tourTiming.return);
  }
  clusters.forEach((group, index) => {
    const selector = `[data-cluster="${group.type}"]`;
    const active = stage === 1 && group.type === 'code' || stage === 2 && group.type === 'learn';
    const missed = (stage === 2 || stage === 5) && sources.some(node =>
      node.type === group.type && node.relevant && !isRetrieved(node, stage));
    add(`${selector} .cluster-title`, { fill: active ? '#096e62' : '#365f54' });
    add(`${selector} .cluster-missed`, { opacity: missed ? 1 : 0 });
    if (stage === 0) {
      const stop = tourStops.find(stop => stop.type === group.type);
      add(selector, { opacity: [1, 0] }, tourTiming.overview, .2);
      if (stop) {
        add(selector, { opacity: [0, 1] }, stop.start + tourTiming.move, .25);
        add(selector, { opacity: [1, 0] }, stop.end - .25, .25);
      }
      add(selector, { opacity: [0, 1] }, tourReturnAt, .4);
    }
    if (building && !reducedMotion) {
      add(`${selector} .ingestion-scan`, { r: [110, 75, 20], opacity: [0, .75, 0] }, index * .1, .5);
    }
  });
  relationships.forEach((edge, index) => {
    const selector = `[data-edge="${index}"]`;
    const relevant = positions.get(edge.source)!.relevant && positions.get(edge.target)!.relevant;
    const reachable = traversal.depths.has(edge.source) && traversal.depths.has(edge.target);
    const timing = ingestionEdgeTimings[index];
    if (building) {
      add(selector, { opacity: 0, pathLength: reducedMotion ? 1 : 0 }, 0, 0);
      add(selector, {
        pathLength: reducedMotion ? [1, 1] : [0, 1], opacity: [0, relevant ? .85 : .5],
        stroke: relevant ? '#128674' : '#60968a', strokeWidth: 1.8,
      }, timing.delay / 1000, timing.duration / 1000);
      if (ingestionExamples.includes(edge)) {
        add(`[data-label="${edge.label}"]`, { opacity: [0, 1] }, (timing.delay + 300) / 1000, reducedMotion ? .15 : .4);
      }
    } else {
      add(selector, {
        pathLength: 1, opacity: stage < 3 ? 0 : relevant ? .4 : .18,
        stroke: relevant ? '#378f80' : '#718f89', strokeWidth: 1,
      }, 0, stage === 4 ? 0 : normalDuration);
      if (stage >= 4 && reachable) {
        const at = stage === 4 ? Math.max(traversal.depths.get(edge.source)!, traversal.depths.get(edge.target)!) * retrievalHopSeconds : 0;
        add(selector, { opacity: [relevant ? .4 : .18, .75], stroke: [relevant ? '#378f80' : '#718f89', '#07816c'], strokeWidth: [1, 1.8] }, at);
      }
    }
  });
  layout.forEach(node => {
    const selector = `[data-node="${node.id}"]`;
    const retrieved = isRetrieved(node, stage);
    const missed = node.relevant && !retrieved && (stage === 2 || stage === 5);
    const baseColor = node.relevant ? palette.relevant : palette.other;
    const color = retrieved && stage !== 4 ? palette.retrieved : missed ? palette.missed : baseColor;
    const resetDuration = building || stage === 4 ? 0 : normalDuration;
    const radius = node.relevant ? 9.5 : 6;
    add(selector, { opacity: 1 }, 0, resetDuration);
    add(`${selector} .node-core`, { r: radius, fill: color }, 0, resetDuration);
    add(`${selector} .node-glow`, { opacity: missed ? .15 : 0, fill: color }, 0, resetDuration);
    add(`${selector} .node-check`, { opacity: 0, pathLength: 0 }, 0, resetDuration);
    add(`${selector} .node-miss`, { opacity: missed ? 1 : 0 }, 0, resetDuration);
    if (node.relevant) {
      add(`${selector} .node-ring`, { stroke: color, opacity: missed ? .7 : .5 }, 0, resetDuration);
    }
    if (building) {
      const at = nodeDelays.get(node.id)!;
      add(selector, { opacity: 0 }, 0, 0);
      add(selector, { opacity: [0, 1] }, at, ingestionTiming.nodeDuration / 1000);
      if (!reducedMotion) {
        add(`${selector} .node-core`, { r: 0 }, 0, 0);
        add(`${selector} .node-core`, { r: [0, radius] }, at, ingestionTiming.nodeDuration / 1000);
      }
      if (!exampleNodeIds.has(node.id)) {
        add(selector, { opacity: [1, .24] }, zoomIn, reducedMotion ? 0 : .4);
        add(selector, { opacity: [.24, 1] }, zoomOut, reducedMotion ? 0 : .4);
      }
    }
    if (stage === 0) {
      const stop = tourStops.find(stop => stop.type === node.type);
      add(selector, { opacity: [1, .3] }, tourTiming.overview, .3);
      if (stop) {
        add(selector, { opacity: [.3, 1] }, stop.start + .3, .3);
        add(selector, { opacity: [1, .3] }, stop.end, .3);
      }
      add(selector, { opacity: [.3, 1] }, tourReturnAt + .3, .4);
    }
    if (retrieved) {
      const at = stage === 4 ? traversal.depths.get(node.id)! * retrievalHopSeconds : 0;
      add(`${selector} .node-core`, { fill: stage === 4 ? [baseColor, palette.retrieved] : palette.retrieved }, at);
      add(`${selector} .node-glow`, { opacity: [0, .28], fill: palette.retrieved }, at);
      add(`${selector} .node-ring`, { stroke: stage === 4 ? [baseColor, palette.retrieved] : palette.retrieved, opacity: [.5, .7] }, at);
      add(`${selector} .node-check`, { opacity: [0, 1], pathLength: [0, 1] }, at);
      if (stage === 4 && !reducedMotion) {
        add(`${selector} .wave-ring`, { r: [12, 28], opacity: [.65, 0] }, at, 1.4);
      }
    }
  });
  return sequence;
}

interface Props {
  stage: number;
  found: Set<string>;
  reducedMotion: boolean;
  ingestionRun: number;
  ingestionFocused: boolean;
  paused: boolean;
  onTime: (seconds: number) => void;
}

function Graph({ stage, found, reducedMotion, ingestionRun, ingestionFocused, paused, onTime }: Props) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const camera = useMotionValue(overviewBox);
  const playback = useRef({ paused, time: 0, lastFrame: 0 });
  const focused = stage === 3 && ingestionFocused;

  useLayoutEffect(() => {
    playback.current.paused = paused;
    playback.current.lastFrame = performance.now();
    if (paused) onTime(playback.current.time);
  }, [paused, onTime]);

  useLayoutEffect(() => {
    const svg = scope.current.querySelector<SVGSVGElement>('.network')!;
    const unsubscribeCamera = camera.on('change', value => svg.setAttribute('viewBox', value));
    const controls = animate(createSequence(stage, reducedMotion, camera));
    controls.pause();
    controls.time = 0;
    playback.current.time = 0;
    playback.current.lastFrame = performance.now();
    onTime(0);
    let frame = 0;
    let lastReported = -1;
    const tick = () => {
      // RAF's timestamp can predate scene setup; sample the same clock as lastFrame.
      const now = performance.now();
      const state = playback.current;
      if (!state.paused) {
        state.time = Math.min(controls.duration, state.time + (now - state.lastFrame) / 1000);
        // Seek every track together: native SVG and JS camera clocks can drift.
        controls.time = state.time;
      }
      state.lastFrame = now;
      const time = state.time;
      if (Math.abs(time - lastReported) >= .025 || time >= controls.duration) {
        onTime(time);
        lastReported = time;
      }
      if (time < controls.duration) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      controls.stop();
      unsubscribeCamera();
    };
  }, [animate, camera, scope, stage, ingestionRun, reducedMotion, onTime]);

  return (
    <div ref={scope} className={`graph-canvas stage-${stage}`} data-testid="graph-canvas">
      <svg viewBox={overviewBox} className="network" role="img" data-focused={focused}
        aria-label={focused
          ? 'Relationship close-up: Survey API uses Pulse access and requires Survey role. Survey results are provided_by Survey API.'
          : '100 knowledge sources grouped into six labeled collections. Relevant sources are ringed, retrieved sources are checked, and missed context has a dashed red ring.'}
        aria-describedby="presentation-instructions">
        <defs>
          <radialGradient id="cluster-glow"><stop offset="0" stopColor="#29aa91" stopOpacity=".065" /><stop offset="1" stopColor="#29aa91" stopOpacity="0" /></radialGradient>
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" /></filter>
          <marker id="relationship-arrow" viewBox="0 0 10 10" refX="30" refY="5" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="#087466" />
          </marker>
        </defs>
        {clusters.map(group => {
          const missedCount = stage === 2 || stage === 5
            ? layout.filter(node => node.type === group.type && node.relevant && !found.has(node.id)).length : 0;
          return (
            <g key={group.type} className="cluster" data-cluster={group.type} data-missed-count={missedCount}>
              <ellipse cx={group.x} cy={group.y} rx={group.type === 'code' ? 175 : 140} ry="130" fill="url(#cluster-glow)" />
              {!reducedMotion && <circle className="ingestion-scan" cx={group.x} cy={group.y} r="110" opacity="0" fill="none" stroke="#128674" strokeWidth="2" />}
              <text x={group.x} y={group.labelY} textAnchor="middle" className="cluster-title" fill="#365f54">{group.label}</text>
              <text x={group.x} y={group.labelY + 16} textAnchor="middle" className="cluster-count">
                {group.count} {group.type === 'code' ? 'files' : group.type === 'learn' || group.type === 'article' ? 'articles' : 'sources'}
              </text>
              <text x={group.x} y={group.labelY + 32} textAnchor="middle" className="cluster-entity">
                {sources.find(source => source.type === group.type)!.title}
              </text>
              <text x={group.x} y={group.labelY + 47} textAnchor="middle" className="cluster-missed" opacity="0" aria-hidden={missedCount === 0}>
                {missedCount} missed context {missedCount === 1 ? 'source' : 'sources'}
              </text>
            </g>
          );
        })}
        <g className="relationships" opacity="0">
          {relationships.map((edge, index) => {
            const from = positions.get(edge.source)!;
            const to = positions.get(edge.target)!;
            const traversed = stage >= 4 && found.has(from.id) && found.has(to.id);
            return <path key={`${edge.source}-${edge.target}`} className={`edge ${traversed ? 'traversed' : ''}`}
              data-edge={index} data-relationship={edge.label} data-source={edge.source} data-target={edge.target}
              d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2 + (to.y - from.y) * .12} ${(from.y + to.y) / 2 - (to.x - from.x) * .12} ${to.x} ${to.y}`}
              fill="none" stroke="#718f89" strokeWidth="1" opacity="0"
              markerEnd={focused && ingestionExamples.includes(edge) ? 'url(#relationship-arrow)' : undefined} />;
          })}
        </g>
        {layout.map(node => {
          const retrieved = found.has(node.id);
          const missed = node.relevant && !retrieved && (stage === 2 || stage === 5);
          return (
            <g key={node.id} data-node={node.id} data-relevant={node.relevant} data-retrieved={retrieved}
              data-missed={missed} aria-label={node.title} className="source-node" transform={`translate(${node.x},${node.y})`}>
              <circle className="node-glow" r="19" fill={palette.retrieved} opacity="0" filter="url(#node-glow)" />
              {node.relevant && <circle className="node-ring" r="15" fill="none" stroke={palette.relevant} strokeWidth="1" opacity=".5" strokeDasharray={missed ? '3 3' : undefined} />}
              {!reducedMotion && <circle className="wave-ring" fill="none" stroke={palette.retrieved} r="12" opacity="0" />}
              <circle className="node-core" r={node.relevant ? 9.5 : 6} fill={node.relevant ? palette.relevant : palette.other} />
              <path className="node-check" opacity="0" d="m-3 0 2 2 4-4" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path className="node-miss" opacity="0" d="m-2-2 4 4m0-4-4 4" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          );
        })}
        {tourViews.map(view => <g className="tour-entities" data-tour={view.type} key={view.type} opacity="0">
          {view.ids.map((id, index) => {
            const node = positions.get(id)!;
            const y = view.labelY + index * 54;
            return <g key={id} data-entity-id={id}>
              <path d={`M ${node.x + 13} ${node.y} L ${view.labelX - 10} ${y - 4}`} fill="none" stroke="#408a7b" strokeWidth=".7" />
              <circle cx={node.x} cy={node.y} r="17" fill="none" stroke="#086e62" strokeWidth="1" />
              <rect x={view.labelX - 5} y={y - 18} width="205" height="33" rx="4" fill="#fff9f0" />
              <text className="tour-entity-label" x={view.labelX} y={y}>{node.title}</text>
            </g>;
          })}
        </g>)}
        <g className="relationship-detail" opacity="0" aria-hidden={!focused}>
          {exampleNodes.map(node => (
            <text key={node.id} x={node.x} y={node.y + (node.id === 'code-0' || node.id === 'code-7' ? -22 : 25)}
              textAnchor="middle" className="focus-node-label" data-focus-node={node.id}>{sourceName(node.id)}</text>
          ))}
          {ingestionExamples.map(edge => {
            const from = positions.get(edge.source)!;
            const to = positions.get(edge.target)!;
            const t = edge.label === 'uses' ? .72 : .5;
            const controlX = (from.x + to.x) / 2 + (to.y - from.y) * .12;
            const controlY = (from.y + to.y) / 2 - (to.x - from.x) * .12;
            const anchorX = (1 - t) ** 2 * from.x + 2 * (1 - t) * t * controlX + t ** 2 * to.x;
            const anchorY = (1 - t) ** 2 * from.y + 2 * (1 - t) * t * controlY + t ** 2 * to.y;
            const x = anchorX + (edge.label === 'requires' ? 36 : 0);
            const y = anchorY + (edge.label === 'requires' ? 8 : -8);
            const labelWidth = edge.label.length * 5.5 + 14;
            return (
              <g key={edge.label} className="relationship-annotation" data-label={edge.label} opacity="0">
                {edge.label === 'requires' && <path d={`M ${anchorX} ${anchorY} L ${x} ${y}`} stroke="#408a7b" strokeWidth=".6" fill="none" />}
                <rect x={x - labelWidth / 2} y={y - 10} width={labelWidth} height="19" rx="4" fill="#ffffff" stroke="#549788" strokeWidth=".6" />
                <text x={x} y={y + 3} textAnchor="middle" className="relationship-type">{edge.label}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export default memo(Graph);
