import assert from 'node:assert/strict';
import test from 'node:test';
import { sources, groups, ingestionDuration, ingestionEdgeTimings, ingestionExamples, ingestionOverviewAt, ingestionTiming, ingestionZoomOutAt, relationships, relevantCount, standardResults, codeResults, graphResults, recall, pathTo, traversal, traverse, maxDepth, retrievalCalls, searchCode, seedId, seedQuery, sourceName, codeSearchCommand, extractQueryEntities, queryEntities, queryTerms, tourDuration, tourStops, tourTiming, userQuery, webSearchCommand } from './data.ts';

test('search terms and seed phrases are extracted from the displayed question', () => {
  assert.deepEqual(queryEntities.map(entity => entity.text), ['managers', 'pulse survey', 'results', 'employee privacy']);
  assert.deepEqual(queryTerms, ['managers', 'pulse', 'survey', 'results', 'employee', 'privacy']);
  assert.ok(queryEntities.every(entity => userQuery.slice(entity.start, entity.end) === entity.text));
  assert.equal(codeSearchCommand, `grep "${queryTerms.join('\\|')}" ./src/*.ts`);
  assert.equal(webSearchCommand, `web.search("${queryTerms.join(' ')} site:learn.microsoft.com")`);
  assert.equal(seedQuery, 'pulse survey results');
  assert.ok(!codeSearchCommand.includes('program'));
  assert.deepEqual(extractQueryEntities('Can a manager read survey results?').map(entity => entity.text), ['manager', 'survey', 'results']);
  assert.deepEqual(extractQueryEntities('deploy a container'), []);
});

test('the search-space tour visits three representative collections without removing other sources', () => {
  assert.deepEqual(tourStops.map(stop => stop.type), ['code', 'learn', 'pm']);
  assert.deepEqual(tourStops.map(stop => stop.label), ['Code', 'Microsoft Learn', 'PM specs']);
  assert.equal(groups.length, 6);
  assert.equal(sources.length, 100);
  assert.ok(tourDuration >= 15 && tourDuration < 16);
  assert.ok(tourStops.every(stop => stop.ids.length === 3 && stop.ids.every(id => sources.some(source => source.id === id && source.type === stop.type))));
  assert.ok(tourStops.every(stop => stop.end - stop.start >= tourTiming.move + tourTiming.hold - .001));
  assert.ok(tourDuration > tourStops.at(-1)!.end);
});

test('a local text search selects the survey seed without relevance annotations', () => {
  assert.equal(searchCode(seedQuery)[0].id, seedId);
  assert.equal(seedId, 'code-0');
  assert.equal(sourceName(seedId), 'Survey API');
  assert.ok(searchCode('billingadapter').every(source => !source.relevant));
  assert.ok(searchCode('billingadapter').length > 0);
  assert.deepEqual(searchCode('no-such-source-xyz'), []);
  assert.throws(() => searchCode('  '), /keyword/);
  assert.deepEqual(ingestionExamples.map(edge => [sourceName(edge.source), sourceName(edge.target)]), [
    ['Survey API', 'Pulse access'], ['Survey API', 'Survey role'], ['Survey results', 'Survey API'],
  ]);
});

test('one text call is followed by six actual graph-frontier expansions', () => {
  assert.equal(retrievalCalls.length, 7);
  assert.deepEqual(retrievalCalls[0].toIds, [seedId]);
  assert.ok(retrievalCalls[0].command.includes(seedQuery));
  const visited = new Set([seedId]);
  for (const call of retrievalCalls.slice(1)) {
    assert.deepEqual(call.fromIds, retrievalCalls[call.hop - 1].toIds);
    const neighbors = relationships.flatMap(edge => call.fromIds.includes(edge.source) ? [edge.target] :
      call.fromIds.includes(edge.target) ? [edge.source] : []);
    assert.deepEqual(new Set(call.toIds), new Set(neighbors.filter(id => !visited.has(id))));
    assert.ok(call.command.startsWith('graph.neighbors('));
    call.toIds.forEach(id => visited.add(id));
  }
  assert.equal(visited.size, 19);
  assert.ok(!visited.has('tech-0'));
});

test('slower ingestion finishes after the close-up and the final overview edge', () => {
  const finalNodeFinishes = Math.max(...groups.map((group, index) =>
    index * ingestionTiming.nodeClusterStagger + (group.count - 1) * ingestionTiming.nodeStagger + ingestionTiming.nodeDuration));
  assert.ok(finalNodeFinishes <= ingestionTiming.read);
  const finalEdgeFinishes = Math.max(...ingestionEdgeTimings.map(timing => timing.delay + timing.duration));
  assert.ok(ingestionDuration > finalEdgeFinishes);
  assert.ok(ingestionDuration >= 8000 && ingestionDuration <= 10000);
  for (const [index, edge] of relationships.entries()) {
    const timing = ingestionEdgeTimings[index];
    if (ingestionExamples.includes(edge)) {
      assert.ok(timing.delay >= ingestionTiming.read + ingestionTiming.focusIn);
      assert.ok(timing.delay + timing.duration < ingestionZoomOutAt);
    } else {
      assert.ok(timing.delay >= ingestionOverviewAt);
    }
  }
});

test('the close-up uses real, directed relationships from the graph', () => {
  assert.deepEqual(ingestionExamples, [
    { source: 'code-0', target: 'code-1', label: 'uses' },
    { source: 'code-0', target: 'code-3', label: 'requires' },
    { source: 'code-7', target: 'code-0', label: 'provided_by' },
  ]);
  assert.ok(ingestionExamples.every(edge => relationships.includes(edge)));
});

test('the same universe has exactly 100 unique sources and 20 relevant sources', () => {
  assert.equal(sources.length, 100);
  assert.equal(new Set(sources.map(source => source.id)).size, 100);
  assert.equal(relevantCount, 20);
  for (const group of groups) assert.equal(sources.filter(source => source.type === group.type).length, group.count);
});
test('two keyword passes retrieve 14 relevant sources, missing six', () => {
  assert.equal(codeResults.length, 10);
  assert.equal(standardResults.length, 14);
  assert.equal(recall(codeResults), 50);
  assert.equal(recall(standardResults), 70);
  assert.equal(sources.filter(s => s.relevant && !standardResults.includes(s.id)).length, 6);
  assert.ok(!standardResults.includes('pm-0'));
  assert.ok(!standardResults.includes('code-10'));
});
test('graph traversal follows real edges to 19 sources with 95% recall', () => {
  assert.equal(graphResults.length, 19);
  assert.equal(recall(graphResults), 95);
  assert.equal(graphResults.filter(id => !standardResults.includes(id)).length, 5);
  assert.ok(!graphResults.includes('tech-0'));
  assert.equal(traversal.depths.get('code-11'), maxDepth);
  assert.deepEqual(pathTo('code-11'), ['code-0', 'code-1', 'code-10', 'wiki-0', 'pm-0', 'pm-1', 'code-11']);
});
test('relationships have valid endpoints and every returned path follows them', () => {
  const ids = new Set(sources.map(source => source.id));
  for (const edge of relationships) {
    assert.ok(ids.has(edge.source));
    assert.ok(ids.has(edge.target));
  }
  for (const id of graphResults) {
    const path = pathTo(id);
    for (let i = 1; i < path.length; i++) {
      assert.ok(relationships.some(edge => (edge.source === path[i - 1] && edge.target === path[i]) || (edge.target === path[i - 1] && edge.source === path[i])));
    }
  }
  assert.deepEqual(pathTo('tech-0'), []);
});
test('traversal is cycle-safe and does not rely on relevance annotations', () => {
  const edges = [{ source: 'a', target: 'b', label: 'calls' }, { source: 'b', target: 'c', label: 'calls' }, { source: 'c', target: 'a', label: 'calls' }];
  assert.equal(traverse('a', edges).depths.size, 3);
  assert.equal(traverse('a', edges).depths.get('c'), 1);
  assert.equal(recall([...standardResults, ...standardResults]), 70);
});
