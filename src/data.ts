export type SourceType = 'code' | 'learn' | 'tech' | 'pm' | 'wiki' | 'article';
export type SearchType = 'code' | 'web';
export interface Source {
  id: string;
  type: SourceType;
  title: string;
  displayName?: string;
  location: string;
  excerpt: string;
  relevant: boolean;
  search?: SearchType;
}
export interface Relationship {
  source: string;
  target: string;
  label: string;
}

export const groups: { type: SourceType; label: string; count: number; x: number; y: number }[] = [
  { type: 'code', label: 'Code', count: 32, x: 210, y: 180 },
  { type: 'learn', label: 'Microsoft Learn', count: 20, x: 580, y: 135 },
  { type: 'tech', label: 'Tech specs', count: 14, x: 785, y: 260 },
  { type: 'pm', label: 'PM specs', count: 12, x: 655, y: 440 },
  { type: 'wiki', label: 'Code wikis', count: 12, x: 375, y: 445 },
  { type: 'article', label: 'Tech articles', count: 10, x: 135, y: 395 },
];

const relevantSources: Source[] = [
  { id: 'code-0', type: 'code', title: 'SurveyResultsController.ts', displayName: 'Survey API', location: 'src/api/SurveyResultsController.ts', excerpt: 'The pulse survey results endpoint. Delegates authorization to the access service before returning aggregate results.', relevant: true, search: 'code' },
  { id: 'code-1', type: 'code', title: 'PulseAccessService.ts', displayName: 'Pulse access', location: 'src/access/PulseAccessService.ts', excerpt: 'Resolves manager access for a pulse program. Calls the audience resolver to determine visible employees.', relevant: true, search: 'code' },
  { id: 'code-2', type: 'code', title: 'SurveyResultsQuery.ts', location: 'src/queries/SurveyResultsQuery.ts', excerpt: 'Builds the survey results query from the authorized audience, not the whole organization.', relevant: true, search: 'code' },
  { id: 'code-3', type: 'code', title: 'SurveyReaderRole.ts', displayName: 'Survey role', location: 'src/roles/SurveyReaderRole.ts', excerpt: 'Defines the manager role and its survey-reading permission.', relevant: true, search: 'code' },
  { id: 'code-4', type: 'code', title: 'SurveyResultsPanel.tsx', location: 'src/components/SurveyResultsPanel.tsx', excerpt: 'Renders aggregate pulse results and handles the restricted-access state.', relevant: true, search: 'code' },
  { id: 'code-5', type: 'code', title: 'SurveyResultsController.test.ts', location: 'tests/SurveyResultsController.test.ts', excerpt: 'Tests authorized survey requests and rejects unauthorized callers.', relevant: true, search: 'code' },
  { id: 'code-6', type: 'code', title: 'ProgramPermissions.ts', location: 'src/access/ProgramPermissions.ts', excerpt: 'Maps manager role assignments to survey program permissions.', relevant: true, search: 'code' },
  { id: 'code-7', type: 'code', title: 'SurveyResultsResponse.ts', displayName: 'Survey results', location: 'src/contracts/SurveyResultsResponse.ts', excerpt: 'The aggregate report contract consumed by the survey UI.', relevant: true, search: 'code' },
  { id: 'code-8', type: 'code', title: 'PulseAccess.test.ts', location: 'tests/PulseAccess.test.ts', excerpt: 'Covers direct and delegated manager access to pulse programs.', relevant: true, search: 'code' },
  { id: 'code-9', type: 'code', title: 'SurveyResultsRoute.ts', location: 'src/routes/SurveyResultsRoute.ts', excerpt: 'Registers the survey results API route and access middleware.', relevant: true, search: 'code' },
  { id: 'code-10', type: 'code', title: 'AudienceResolver.ts', location: 'src/shared/AudienceResolver.ts', excerpt: 'Resolves the reporting hierarchy, including dotted-line relationships. Its name never mentions surveys, programs, or pulse.', relevant: true },
  { id: 'code-11', type: 'code', title: 'CohortGuard.ts', location: 'src/shared/CohortGuard.ts', excerpt: 'Suppresses results for groups smaller than five respondents. A critical privacy dependency with no direct query keyword.', relevant: true },
  { id: 'learn-0', type: 'learn', title: 'Role-based access control', location: 'Microsoft Learn / Access concepts (fictional excerpt)', excerpt: 'Use explicit role assignments to authorize access to a resource.', relevant: true, search: 'web' },
  { id: 'learn-1', type: 'learn', title: 'App roles and permissions', location: 'Microsoft Learn / Identity concepts (fictional excerpt)', excerpt: 'Separate the role a caller has from the operation a resource permits.', relevant: true, search: 'web' },
  { id: 'learn-2', type: 'learn', title: 'Secure API authorization', location: 'Microsoft Learn / API concepts (fictional excerpt)', excerpt: 'Validate authorization at the service boundary, not just in the UI.', relevant: true, search: 'web' },
  { id: 'learn-3', type: 'learn', title: 'Access token validation', location: 'Microsoft Learn / Token concepts (fictional excerpt)', excerpt: 'Validate the token and resolve the caller before evaluating access.', relevant: true, search: 'web' },
  { id: 'pm-0', type: 'pm', title: 'Dotted-line manager policy', location: 'Product / Reporting relationships / PM-024', excerpt: 'Dotted-line managers may see aggregate insights, but must never see individual employee responses.', relevant: true },
  { id: 'pm-1', type: 'pm', title: 'Minimum cohort requirement', location: 'Product / Privacy requirements / PM-031', excerpt: 'Do not display an insight when fewer than five employees have responded, regardless of the manager role.', relevant: true },
  { id: 'wiki-0', type: 'wiki', title: 'Audience resolution guide', location: 'Engineering wiki / Reporting / Audience resolution', excerpt: 'The audience resolver uses hierarchy edges, not role names, to construct the reporting cohort.', relevant: true },
  { id: 'tech-0', type: 'tech', title: 'Regional privacy exception', location: 'Architecture / Unlinked legacy note / TS-019', excerpt: 'A legacy regional exception requires a stricter cohort threshold. No relationship was extracted for this source, so graph retrieval still misses it.', relevant: true },
];

const fillerTitles: Record<SourceType, string[]> = {
  code: ['BillingAdapter', 'ExportScheduler', 'NotificationQueue', 'LocaleRegistry', 'ThemeProvider', 'AssetCache', 'RetryPolicy', 'HealthCheck'],
  learn: ['Storage lifecycle', 'Deploy a container', 'Configure DNS', 'Monitor a queue', 'Service health', 'Network routing', 'Manage certificates', 'Cloud backup'],
  tech: ['Export architecture', 'Event transport', 'Cache invalidation', 'Storage migration', 'Search indexing', 'Telemetry schema'],
  pm: ['Dashboard refresh', 'Email preferences', 'Export experience', 'Billing redesign', 'Mobile navigation', 'Onboarding flow'],
  wiki: ['Local development', 'Release checklist', 'Incident playbook', 'Build pipeline', 'Logging conventions', 'Feature flags'],
  article: ['Scaling queues', 'Designing APIs', 'Caching patterns', 'Async processing', 'Database indexes', 'Frontend performance'],
};

export const sources: Source[] = groups.flatMap(group =>
  Array.from({ length: group.count }, (_, i) => {
    const id = `${group.type}-${i}`;
    const relevant = relevantSources.find(source => source.id === id);
    if (relevant) return relevant;
    const name = fillerTitles[group.type][i % fillerTitles[group.type].length];
    return {
      id, type: group.type, title: `${name}${group.type === 'code' ? `V${i + 1}.ts` : ` / ${i + 1}`}`,
      location: `${group.label} / Sample source ${i + 1}`,
      excerpt: 'A source in the wider knowledge space. It is not relevant to the pulse survey task in this curated scenario.',
      relevant: false,
    };
  }),
);

export const relationships: Relationship[] = [
  ...Array.from({ length: 9 }, (_, i) => {
    if (i === 6) return { source: 'code-7', target: 'code-0', label: 'provided_by' };
    return { source: 'code-0', target: `code-${i + 1}`, label: i === 0 ? 'uses' : i === 2 ? 'requires' : 'related implementation' };
  }),
  { source: 'code-1', target: 'learn-0', label: 'applies role model from' },
  { source: 'learn-0', target: 'learn-1', label: 'explained by' },
  { source: 'learn-0', target: 'learn-2', label: 'secured by' },
  { source: 'learn-2', target: 'learn-3', label: 'requires' },
  { source: 'code-1', target: 'code-10', label: 'calls' },
  { source: 'code-10', target: 'wiki-0', label: 'documented by' },
  { source: 'wiki-0', target: 'pm-0', label: 'implements policy from' },
  { source: 'pm-0', target: 'pm-1', label: 'constrained by' },
  { source: 'pm-1', target: 'code-11', label: 'enforced by' },
  ...groups.flatMap(group =>
    Array.from({ length: group.count - 1 }, (_, i) => ({
      source: `${group.type}-${i}`, target: `${group.type}-${i + 1}`, label: 'related topic',
    })).filter(edge => !sources.find(s => s.id === edge.source)?.relevant && !sources.find(s => s.id === edge.target)?.relevant),
  ),
];

export const ingestionTiming = {
  read: 900, nodeClusterStagger: 100, nodeStagger: 4, nodeDuration: 280,
  focusIn: 900, exampleStagger: 1200, exampleDuration: 900, focusHold: 700, focusOut: 900,
  edgeStagger: 10, edgeDuration: 600, settle: 300,
};
export const ingestionExamples = relationships.filter(edge =>
  edge.label === 'uses' || edge.label === 'provided_by' || edge.source === 'code-0' && edge.label === 'requires');
const remainingRelationships = relationships.filter(edge => !ingestionExamples.includes(edge));
export const ingestionZoomOutAt = ingestionTiming.read + ingestionTiming.focusIn
  + (ingestionExamples.length - 1) * ingestionTiming.exampleStagger + ingestionTiming.exampleDuration + ingestionTiming.focusHold;
export const ingestionOverviewAt = ingestionZoomOutAt + ingestionTiming.focusOut;
export const ingestionEdgeTimings = relationships.map(edge => {
  const exampleIndex = ingestionExamples.indexOf(edge);
  return exampleIndex >= 0
    ? { delay: ingestionTiming.read + ingestionTiming.focusIn + exampleIndex * ingestionTiming.exampleStagger, duration: ingestionTiming.exampleDuration }
    : { delay: ingestionOverviewAt + remainingRelationships.indexOf(edge) * ingestionTiming.edgeStagger, duration: ingestionTiming.edgeDuration };
});
export const ingestionDuration = Math.max(...ingestionEdgeTimings.map(timing => timing.delay + timing.duration)) + ingestionTiming.settle;

export const sourceById = new Map(sources.map(source => [source.id, source]));
export const relevantCount = sources.filter(source => source.relevant).length;
export const codeResults = sources.filter(source => source.search === 'code').map(source => source.id);
export const standardResults = sources.filter(source => source.search).map(source => source.id);
export const userQuery = 'How can managers view pulse survey results while protecting employee privacy?';
export function extractQueryEntities(query: string) {
  const vocabulary = [
    { kind: 'actor', pattern: /\bmanagers?\b/gi },
    { kind: 'topic', pattern: /\b(?:pulse\s+)?surveys?\b/gi },
    { kind: 'resource', pattern: /\bresults?\b/gi },
    { kind: 'constraint', pattern: /\b(?:employee\s+)?privacy\b/gi },
  ];
  return vocabulary.flatMap(({ kind, pattern }) => [...query.matchAll(pattern)].map(match => ({
    kind, text: match[0], start: match.index!, end: match.index! + match[0].length,
  }))).sort((a, b) => a.start - b.start);
}
export const queryEntities = extractQueryEntities(userQuery);
export const queryTerms = [...new Set(queryEntities.flatMap(entity => entity.text.toLowerCase().split(/\s+/)))];
export const codeSearchCommand = `grep "${queryTerms.join('\\|')}" ./src/*.ts`;
export const webSearchCommand = `web.search("${queryTerms.join(' ')} site:learn.microsoft.com")`;
export const seedQuery = queryEntities.filter(entity => entity.kind === 'topic' || entity.kind === 'resource').map(entity => entity.text.toLowerCase()).join(' ');
export const retrievalHopSeconds = 2.4;
export const tourTiming = { overview: 2.4, move: 1.1, hold: 2.8, return: 1.1 };
export const tourStops = groups.filter(group => ['code', 'learn', 'pm'].includes(group.type)).map((group, index) => ({
  type: group.type, label: group.label,
  start: tourTiming.overview + index * (tourTiming.move + tourTiming.hold),
  end: tourTiming.overview + (index + 1) * (tourTiming.move + tourTiming.hold),
  ids: sources.filter(source => source.type === group.type).slice(0, 3).map(source => source.id),
}));
export const tourReturnAt = tourStops[tourStops.length - 1].end;
export const tourDuration = tourReturnAt + tourTiming.return;

// This local keyword match selects the seed; only subsequent calls use edges.
export function searchCode(query: string): Source[] {
  const terms = query.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  if (!terms.length) throw new Error('A code search needs at least one keyword.');
  return sources.filter(source => source.type === 'code' && terms.every(term =>
    `${source.title} ${source.excerpt}`.toLowerCase().includes(term)));
}
const seed = searchCode(seedQuery)[0];
if (!seed) throw new Error(`No code source matched the seed query: ${seedQuery}`);
export const seedId = seed.id;

// Traverse actual adjacency, without using the ground-truth relevance labels.
export function traverse(seed: string, edges: Relationship[]) {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
    adjacency.set(edge.target, [...(adjacency.get(edge.target) ?? []), edge.source]);
  }
  const depths = new Map<string, number>([[seed, 0]]);
  const parents = new Map<string, string>();
  const queue = [seed];
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    for (const next of adjacency.get(current) ?? []) {
      if (depths.has(next)) continue;
      depths.set(next, depths.get(current)! + 1);
      parents.set(next, current);
      queue.push(next);
    }
  }
  return { depths, parents };
}

export const traversal = traverse(seedId, relationships);
export const maxDepth = Math.max(...traversal.depths.values());
export const graphResults = [...traversal.depths.keys()];
export function pathTo(id: string): string[] {
  if (!traversal.depths.has(id)) return [];
  const path = [id];
  while (traversal.parents.has(path[0])) path.unshift(traversal.parents.get(path[0])!);
  return path;
}

export function sourceName(id: string): string {
  const source = sourceById.get(id);
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source.displayName ?? source.title;
}

const examplePath = pathTo([...traversal.depths].find(([, depth]) => depth === maxDepth)![0]);
export const retrievalCalls = Array.from({ length: maxDepth + 1 }, (_, hop) => {
  const fromIds = [...traversal.depths].filter(([, depth]) => depth === hop - 1).map(([id]) => id);
  const toIds = [...traversal.depths].filter(([, depth]) => depth === hop).map(([id]) => id);
  const from = examplePath[hop - 1];
  const to = examplePath[hop];
  const edge = hop ? relationships.find(edge =>
    edge.source === from && edge.target === to || edge.target === from && edge.source === to) : undefined;
  if (hop && !edge) throw new Error(`Missing example edge at hop ${hop}`);
  return {
    hop, fromIds, toIds,
    command: hop === 0
      ? `text.search("${seedQuery}", scope: "code", limit: 1)`
      : 'graph.neighbors(frontier, direction: "both", unvisited: true)',
    example: edge
      ? `${sourceName(from)} ${edge.source === from ? `\u2014 ${edge.label} \u2192` : `\u2190 ${edge.label} \u2014`} ${sourceName(to)}`
      : `Seed: ${seed.title}`,
  };
});
export function recall(ids: Iterable<string>): number {
  return Math.round([...new Set(ids)].filter(id => sourceById.get(id)?.relevant).length / relevantCount * 100);
}

export const scenes = [
  { label: 'The search space', short: 'Explore', eyebrow: '01 / THE CONTEXT PROBLEM', title: 'One task. A hundred places to look.', body: userQuery + ' The answer is scattered across code, documentation, and product decisions.', insight: '20 of these 100 sources matter. Can your agent find them all?', action: 'Run code search' },
  { label: 'Search the code', short: 'Code search', eyebrow: '02 / STANDARD RETRIEVAL', title: 'Start with the obvious matches.', body: 'A keyword search finds files that mention surveys, programs, and pulse results. A useful start, but naming is not the same as relevance.', insight: '10 relevant code files found. Shared utilities have different names.', action: 'Run web search' },
  { label: 'Search the web', short: 'Web search', eyebrow: '03 / THE BLIND SPOTS', title: 'Good results. Incomplete context.', body: 'A second search finds four useful documentation pages. But internal PM specs and indirectly related code remain outside these results.', insight: '6 relevant sources missed. That is 30% of the context your agent needs.', action: 'Connect the knowledge' },
  { label: 'Connect the sources', short: 'Connect', eyebrow: '04 / INGESTION & EXTRACTION', title: 'Connect first. Search smarter.', body: 'Before a query arrives, ingest the sources and extract relationships: calls, implements, documents, and constrains. Meaning connects the silos.', insight: 'This is an offline preparation step, not an extra search at query time.', action: 'Traverse the graph' },
  { label: 'Follow the relationships', short: 'Graph retrieval', eyebrow: '05 / GRAPH RETRIEVAL', title: 'Follow meaning beyond the match.', body: 'Start at the matching API endpoint, then follow its relationships. Each hop reveals context that never needed to share the original keywords.', insight: 'The graph reaches PM requirements, the audience resolver, and the privacy guard.', action: 'See the difference' },
  { label: 'See the difference', short: 'The result', eyebrow: '06 / MORE COMPLETE CONTEXT', title: 'Same question. A fuller picture.', body: 'Connected retrieval finds five more relevant sources in this scenario. The agent now has the product intent and hidden dependencies, not just the obvious files.', insight: 'Not magic: one unlinked legacy spec is still missed. Graph quality matters.', action: 'Replay the demo' },
];
