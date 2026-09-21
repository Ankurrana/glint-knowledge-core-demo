async page => {
  const errors = [];
  const recordError = error => errors.push(error.message);
  const recordConsole = message => { if (message.type() === 'error') errors.push(message.text()); };
  page.on('pageerror', recordError);
  page.on('console', recordConsole);
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const labels = ['Search space', 'Code search', 'Web search', 'Ingestion', 'Graph retrieval', 'Results'];
  const stage = async value => {
    await page.waitForFunction(expected => document.querySelector('main')?.getAttribute('data-stage') === String(expected), value);
    check(await page.getByRole('heading', { level: 1, name: value < 3 ? 'Standard search' : 'Graph RAG', exact: true }).isVisible(), 'The larger title must identify the retrieval method');
    check(await page.locator('.step-number').innerText() === `STEP ${String(value % 3 + 1).padStart(2, '0')} / 03`, 'Step numbering must be local to the three-step phase');
    check(await page.locator('.phase-steps li').count() === 3, 'Each retrieval method must show three steps');
    check((await page.locator('.phase-steps [aria-current="step"]').innerText()).includes(labels[value]), 'The active flow label must match the current step');
  };
  const recall = async value => {
    await page.waitForFunction(expected => document.querySelector('main')?.getAttribute('data-recall') === String(expected), value);
  };
  const count = async (selector, value) => check(await page.locator(selector).count() === value, `Expected ${value} ${selector}`);
  const recordIngestion = async () => page.evaluate(() => {
    const recording = { started: performance.now(), samples: [] };
    window.__ingestionRecording = recording;
    let started = false;
    const timer = window.setInterval(() => {
      const status = document.querySelector('.ingestion-status');
      if (!status) return;
      const edges = [...document.querySelectorAll('.edge')];
      const phase = Number(status.getAttribute('data-phase'));
      if (!started) {
        if (phase !== 0) return;
        started = true;
      }
      const nodes = [...document.querySelectorAll('[data-node]')];
      const labels = [...document.querySelectorAll('.relationship-annotation')].filter(label => Number(getComputedStyle(label).opacity) > .8 && Number(getComputedStyle(label.parentElement).opacity) > .8);
      recording.samples.push({ phase, elapsed: performance.now() - recording.started,
        cameraWidth: document.querySelector('.network').viewBox.baseVal.width,
        relationshipLabels: labels.map(label => label.getAttribute('data-label')),
        labelsDoNotOverlapNames: labels.every(label => {
          const rect = label.getBoundingClientRect();
          return [...document.querySelectorAll('.focus-node-label')].every(name => {
            const box = name.getBoundingClientRect();
            return rect.right <= box.left || rect.left >= box.right || rect.bottom <= box.top || rect.top >= box.bottom;
          });
        }),
        labelsInsideViewport: labels.every(label => {
          const rect = label.getBoundingClientRect();
          return rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
        }),
        visibleNodes: nodes.filter(node => Number(getComputedStyle(node).opacity) > .05).length,
        growingNodes: nodes.filter(node => {
          const radius = parseFloat(getComputedStyle(node.querySelector('.node-core')).getPropertyValue('r'));
          return radius > 0 && radius < (node.getAttribute('data-relevant') === 'true' ? 9.5 : 6);
        }).length,
        visibleEdges: edges.filter(edge => Number(getComputedStyle(edge).opacity) > .05).length, totalEdges: edges.length });
      if (phase === 2) window.clearInterval(timer);
    }, 20);
    window.setTimeout(() => window.clearInterval(timer), 13000);
  });
  const ingestionRecording = async () => {
    await page.waitForFunction(() => window.__ingestionRecording.samples.some(sample => sample.phase === 2), undefined, { timeout: 12000 });
    return page.evaluate(() => {
      const result = window.__ingestionRecording;
      delete window.__ingestionRecording;
      return result;
    });
  };
  const viewportOnly = async () => {
    const dimensions = await page.evaluate(() => {
      const graph = document.querySelector('.graph-canvas').getBoundingClientRect();
      const svg = document.querySelector('.network').getBoundingClientRect();
      return { x: graph.x, y: graph.y, width: graph.width, height: graph.height,
        svgWidth: svg.width, svgHeight: svg.height, vw: window.innerWidth, vh: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight };
    });
    check(dimensions.x === 0 && dimensions.y === 0, 'Graph must start at the top-left of the viewport');
    check(dimensions.width === dimensions.vw && dimensions.height === dimensions.vh, 'Graph must fill the viewport');
    check(dimensions.svgWidth === dimensions.vw && dimensions.svgHeight === dimensions.vh, 'SVG must fill the viewport');
    check(dimensions.scrollWidth === dimensions.vw && dimensions.scrollHeight === dimensions.vh, 'Presentation must have no scrolling');
    check(await page.locator('.graph-canvas').evaluate(element => getComputedStyle(element).cursor) === 'default', 'The normal mouse pointer must remain visible');
    await count('button, a, input, select, header, footer, nav, dialog, svg title, [role="tooltip"]', 0);
    check(await page.locator('main > :not(.sr-only):not(.graph-canvas):not(.step-label):not(.missed-context-label):not(.ingestion-status):not(.search-call):not(.playback-hint):not(.tour-status)').count() === 0, 'Only graph-related labels may be displayed');
    await count('.cluster-title', 6);
    const titles = await page.locator('.cluster-title').allTextContents();
    check(['Code', 'Microsoft Learn', 'Tech specs', 'PM specs', 'Code wikis', 'Tech articles'].every(title => titles.includes(title)), 'Every collection needs an identifying label');
    const clusterBounds = await page.locator('.cluster-title').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    }));
    check(clusterBounds.every(rect => rect.left >= 0 && rect.top >= 0 && rect.right <= dimensions.vw && rect.bottom <= dimensions.vh), 'Cluster labels must not clip outside the viewport');
    const label = await page.getByTestId('step-label').boundingBox();
    check(label && label.x >= 0 && label.y >= 0 && label.x + label.width <= dimensions.vw && label.y + label.height <= dimensions.vh, 'Step label must fit inside the viewport');
    check(clusterBounds.every(rect => rect.left >= label.x + label.width || rect.right <= label.x || rect.top >= label.y + label.height || rect.bottom <= label.y), 'Phase heading must not overlap any cluster label');
    check(await page.getByTestId('step-label').evaluate(element => getComputedStyle(element).pointerEvents) === 'none', 'Label must not intercept graph interaction');
  };
  const searchCall = async kind => {
    const caption = page.getByTestId('search-call');
    check(await caption.getAttribute('data-kind') === kind, 'The tool call must match the search step');
    const text = await caption.locator('code').innerText();
    check(kind === 'code'
      ? text.includes('grep "managers\\|pulse\\|survey\\|results\\|employee\\|privacy" ./src/*.ts')
      : text.includes('web.search("managers pulse survey results employee privacy site:learn.microsoft.com")'), 'The extracted keyword query must be visible');
    check(JSON.stringify(await caption.locator('mark').allTextContents()) === JSON.stringify(['managers', 'pulse survey', 'results', 'employee privacy']), 'Extracted entities must be highlighted in the user query');
    check((await caption.innerText()).includes('Example syntax; graph results are scripted.'), 'Illustrative queries must not be presented as real execution');
    check((await caption.locator('.user-query').innerText()).includes('How can managers view pulse survey results while protecting employee privacy?'), 'Search must show the sample user question');
    const overlaps = await caption.evaluate(element => {
      const box = element.getBoundingClientRect();
      const intersects = rect => rect.left < box.right && rect.right > box.left && rect.top < box.bottom && rect.bottom > box.top;
      return {
        outsideViewport: box.left < 0 || box.top < 0 || box.right > innerWidth || box.bottom > innerHeight,
        nodes: [...document.querySelectorAll('.node-core')].some(node => intersects(node.getBoundingClientRect())),
        missedLabel: [...document.querySelectorAll('.missed-context-label')].some(label => intersects(label.getBoundingClientRect())),
      };
    });
    check(!overlaps.outsideViewport && !overlaps.nodes && !overlaps.missedLabel, 'Query caption must fit without covering nodes or missed-context labels');
  };
  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://localhost:5173/');
    await page.locator('main').waitFor();
    await page.keyboard.press('ArrowRight');
    await page.locator('[data-node]').first().waitFor();
    await page.keyboard.press('Space');
    await viewportOnly();
    await count('[data-node]', 100);
    await count('[data-relevant="true"]', 20);
    const originalPositions = await page.locator('[data-node]').evaluateAll(nodes => nodes.map(node => node.getAttribute('transform')));
    await stage(0);
    await recall(0);
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => document.querySelector('main')?.dataset.stage === '-1');
    await page.keyboard.press('ArrowRight');
    await stage(0);
    await page.keyboard.press('ArrowRight');
    await stage(1);
    await recall(50);
    await count('[data-retrieved="true"]', 10);
    await searchCall('code');
    const beforeMissedColor = await page.locator('[data-node="pm-0"] .node-core').evaluate(element => getComputedStyle(element).fill);
    await page.evaluate(() => {
      const samples = [];
      window.__colorSamples = samples;
      const timer = setInterval(() => {
        const color = getComputedStyle(document.querySelector('[data-node="pm-0"] .node-core')).fill;
        samples.push(color);
        if (color === 'rgb(199, 71, 57)') clearInterval(timer);
      }, 16);
      setTimeout(() => clearInterval(timer), 1800);
    });
    await page.keyboard.press('ArrowRight');
    await stage(2);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-node="pm-0"] .node-core')).fill === 'rgb(199, 71, 57)');
    const colors = await page.evaluate(() => { const samples = window.__colorSamples; delete window.__colorSamples; return samples; });
    check(colors.some(color => color !== beforeMissedColor && color !== 'rgb(199, 71, 57)'), 'Missed nodes must interpolate smoothly rather than jump color');
    await recall(70);
    await count('[data-retrieved="true"]', 14);
    await count('[data-missed="true"]', 6);
    await searchCall('web');
    check(await page.getByRole('heading', { name: 'Missed context', exact: true }).isVisible(), 'Missed context needs an explicit label');
    check((await page.getByTestId('missed-context-label').innerText()).includes('6 relevant sources not retrieved'), 'Standard-search missed count must be labeled');
    check(await page.locator('[data-cluster="code"]').getAttribute('data-missed-count') === '2', 'Indirect code must be labeled as missed');
    check(await page.locator('[data-cluster="pm"]').getAttribute('data-missed-count') === '2', 'Both missed PM specs must be labeled');
    await recordIngestion();
    await page.keyboard.press('ArrowRight');
    await stage(3);
    await recall(0);
    await count('.search-call', 0);
    await count('.ingestion-scan', 6);
    check(await page.locator('.edge').count() > 18, 'Ingestion must draw the relationship graph');
    const creation = await ingestionRecording();
    check([0, 1, 2].every(phase => creation.samples.some(sample => sample.phase === phase)), 'Ingestion must show reading, extraction, and ready in sequence');
    check(creation.samples.some(sample => sample.visibleNodes > 0 && sample.visibleNodes < 100), 'Ingestion must visibly introduce the nodes, not start with the finished node graph');
    check(creation.samples.some(sample => sample.growingNodes > 0), 'Normal-motion ingestion must visibly grow source nodes');
    check(creation.samples.at(-1).visibleNodes === 100, 'Every source must be visible once the graph is ready');
    check(creation.samples.some(sample => sample.visibleEdges > 0 && sample.visibleEdges < sample.totalEdges), 'Relationships must appear progressively, not all at once');
    check(creation.samples.at(-1).elapsed >= 8000 && creation.samples.at(-1).elapsed < 11000, 'Slower creation should leave time to explain the relationships');
    check(creation.samples.some(sample => sample.cameraWidth < 400), 'Ingestion must visibly zoom into the relationship examples');
    check(creation.samples.some(sample => sample.cameraWidth > 400 && sample.cameraWidth < 990), 'The camera must animate rather than instantly switch views');
    check(creation.samples.some(sample => ['uses', 'requires', 'provided_by'].every(label => sample.relationshipLabels.includes(label))), 'All three relationship types must be readable during the close-up');
    check(JSON.stringify(await page.locator('.focus-node-label').allTextContents()) === JSON.stringify(['Survey API', 'Pulse access', 'Survey role', 'Survey results']), 'The close-up must use survey sources');
    check(creation.samples.every(sample => sample.labelsInsideViewport), 'Relationship labels must stay inside the viewport');
    check(creation.samples.every(sample => sample.labelsDoNotOverlapNames), 'Relationship labels must not cover source names');
    check(Math.abs(creation.samples.at(-1).cameraWidth - 1000) < .01, 'The camera must return to the full graph before completion');
    check((await page.getByTestId('ingestion-status').innerText()).includes('Graph ready'), 'Completed ingestion needs a ready signal');
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.edge')).opacity) > .3);
    await recordIngestion();
    await page.keyboard.press('r');
    const keyboardReplay = await ingestionRecording();
    check([0, 1, 2].every(phase => keyboardReplay.samples.some(sample => sample.phase === phase)), 'R must replay ingestion without leaving the step');
    check(keyboardReplay.samples.some(sample => sample.visibleNodes < 100), 'R must visibly rebuild the nodes');
    check(keyboardReplay.samples.some(sample => sample.cameraWidth < 400), 'R must replay the close-up');
    check(Math.abs(keyboardReplay.samples.at(-1).cameraWidth - 1000) < .01, 'R must restore the overview after the close-up');
    await stage(3);
    await page.evaluate(() => {
      const samples = [];
      window.__retrievalCalls = samples;
      const timer = setInterval(() => {
        const caption = document.querySelector('.search-call[data-kind="graph"]');
        if (!caption) return;
        const hop = Number(caption.getAttribute('data-hop'));
        if (!samples.some(sample => sample.hop === hop)) {
          samples.push({ hop, text: caption.textContent, found: document.querySelectorAll('[data-retrieved="true"]').length });
        }
        if (hop === 6) clearInterval(timer);
      }, 20);
      setTimeout(() => clearInterval(timer), 22000);
    });
    await page.keyboard.press('ArrowRight');
    await stage(4);
    await recall(95);
    const calls = await page.evaluate(() => window.__retrievalCalls);
    check(JSON.stringify(calls.map(call => call.hop)) === JSON.stringify([0, 1, 2, 3, 4, 5, 6]), 'All seven calls must be shown, beginning with text search');
    check(calls[0].text.includes('text.search("pulse survey results"') && calls[0].text.includes('SurveyResultsController.ts'), 'The seed query and matched code file must be visible');
    check(calls.slice(1).every(call => call.text.includes(`GRAPH HOP ${call.hop} / 6`) && call.text.includes('graph.neighbors(frontier')), 'Every subsequent call must traverse the frontier and label its hop');
    check(JSON.stringify(calls.map(call => call.found)) === JSON.stringify([1, 10, 12, 15, 17, 18, 19]), 'Call labels must stay synchronized with the graph wave');
    await count('[data-retrieved="true"]', 19);
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.edge.traversed')).opacity) > .5);
    await page.keyboard.press('ArrowRight');
    await stage(5);
    await recall(95);
    await count('[data-missed="true"]', 1);
    check((await page.getByTestId('missed-context-label').innerText()).includes('1 relevant source not retrieved'), 'Graph result must label the one remaining miss');
    check(await page.locator('[data-cluster="pm"]').getAttribute('data-missed-count') === '0', 'Recovered PM specs must lose the missed-context label');
    check(await page.locator('[data-node="tech-0"]').getAttribute('data-missed') === 'true', 'The unlinked spec must remain missed');
    await page.keyboard.press('ArrowRight');
    await page.getByRole('heading', { name: 'Connected context. Better-informed agents.' }).waitFor();
    await page.keyboard.press('ArrowLeft');
    await stage(5);
    await page.keyboard.press('ArrowLeft');
    await stage(4);
    await recordIngestion();
    await page.keyboard.press('ArrowLeft');
    await stage(3);
    const replay = await ingestionRecording();
    check([0, 1, 2].every(phase => replay.samples.some(sample => sample.phase === phase)), 'Returning to ingestion must replay all creation phases');
    check(replay.samples.some(sample => sample.visibleEdges > 0 && sample.visibleEdges < sample.totalEdges), 'Returning to ingestion must redraw the edges progressively');
    check(replay.samples.some(sample => sample.cameraWidth < 400), 'Returning to ingestion must replay the temporary zoom');
    await recall(0);
    await count('[data-retrieved="true"]', 0);
    await page.keyboard.press('ArrowRight');
    await stage(4);
    await count('.ingestion-status', 0);
    await count('[data-retrieved="true"]', 1);
    await recall(95);
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await stage(0);
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.relationships')).opacity) === 0);
    await page.keyboard.down('ArrowRight');
    await stage(1);
    await page.keyboard.down('ArrowRight');
    await stage(1);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await stage(2);
    await page.keyboard.press('End');
    await stage(5);
    await viewportOnly();
    const finalPositions = await page.locator('[data-node]').evaluateAll(nodes => nodes.map(node => node.getAttribute('transform')));
    check(JSON.stringify(originalPositions) === JSON.stringify(finalPositions), 'Nodes must not move between retrieval methods');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await viewportOnly();
    await count('[data-node]', 100);
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await recall(70);
    await searchCall('web');
    await recordIngestion();
    await page.keyboard.press('ArrowRight');
    await stage(3);
    await count('.ingestion-scan', 0);
    const accessibleCreation = await ingestionRecording();
    check([0, 1, 2].every(phase => accessibleCreation.samples.some(sample => sample.phase === phase)), 'Reduced motion must not skip the graph-creation sequence');
    check(accessibleCreation.samples.some(sample => sample.visibleNodes > 0 && sample.visibleNodes < 100), 'Reduced motion must still reveal source nodes progressively');
    check(accessibleCreation.samples.some(sample => sample.visibleEdges > 0 && sample.visibleEdges < sample.totalEdges), 'Reduced motion must still show relationship creation');
    check(accessibleCreation.samples.every(sample => sample.growingNodes === 0), 'Reduced motion should fade nodes without spatial growth');
    check(accessibleCreation.samples.some(sample => sample.relationshipLabels.length === 3), 'Reduced-motion mode must still explain the relationships');
    check(accessibleCreation.samples.every(sample => sample.cameraWidth < 400 || sample.cameraWidth === 1000), 'Reduced motion must use instant camera changes without animated zoom');
    await page.keyboard.press('ArrowRight');
    await recall(95);
    await count('.wave-ring', 0);
    await page.keyboard.press('End');
    await viewportOnly();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const size of [{ width: 1280, height: 720 }, { width: 1024, height: 600 }]) {
      await page.setViewportSize(size);
      await page.keyboard.press('Home');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await searchCall('code');
      await viewportOnly();
      await page.keyboard.press('ArrowRight');
      await searchCall('web');
      await viewportOnly();
    }
    await page.setViewportSize({ width: 1920, height: 1080 });
    await viewportOnly();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await stage(0);
    await recall(0);
    check(errors.length === 0, `Browser errors: ${errors.join('\n')}`);
    return { passed: true, fullscreenGraph: true, visiblePointer: true, clusterLabels: 6, threeStepPhases: true, missedContextLabels: true, searchToolCaptions: true, smoothColorTransitions: true, visibleNodeCreation: true, relationshipCloseup: true, slowIngestionReplay: true, keyboardReplay: true, reducedMotionSequence: true, keyboardOnly: true, nodes: 100, standardRecall: '70%', graphRecall: '95%', browserErrors: errors };
  } finally {
    page.off('pageerror', recordError);
    page.off('console', recordConsole);
  }
}
