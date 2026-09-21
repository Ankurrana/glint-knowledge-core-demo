async page => {
  const errors = [];
  const recordError = error => errors.push(error.message);
  const recordConsole = message => { if (message.type() === 'error') errors.push(message.text()); };
  page.on('pageerror', recordError);
  page.on('console', recordConsole);
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const stage = async expected => {
    await page.waitForFunction(value => document.querySelector('main')?.dataset.stage === String(value), expected);
    check(await page.getByRole('heading', { name: 'Standard search', exact: true }).count() === 0, 'Standard search must not be a slide');
    check(await page.locator('[data-kind="code"], [data-kind="web"], .tour-status').count() === 0, 'Removed search and tour screens must stay absent');
    if (expected >= 3 && expected <= 5) {
      check(await page.getByRole('heading', { name: 'Graph RAG', exact: true }).isVisible(), 'Graph slides need the method heading');
      check(await page.locator('.phase-steps li').count() === 3, 'Graph RAG must have three steps');
      check(await page.locator('.step-number').innerText() === `STEP 0${expected - 2} / 03`, 'Graph step numbering must be correct');
    }
  };
  const overview = async () => {
    const result = await page.evaluate(() => {
      const graph = document.querySelector('.graph-canvas');
      const box = graph.getBoundingClientRect();
      return {
        fullscreen: box.x === 0 && box.y === 0 && box.width === innerWidth && box.height === innerHeight,
        scroll: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
        cursor: getComputedStyle(graph).cursor,
        visible: [...document.querySelectorAll('[data-node]')].filter(node => Number(getComputedStyle(node).opacity) >= .99).length,
        labelsInside: [...document.querySelectorAll('.cluster-title')].every(node => {
          const r = node.getBoundingClientRect();
          return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
        }),
      };
    });
    check(result.fullscreen && !result.scroll && result.cursor === 'default', 'Graph must fill viewport with a visible pointer');
    check(result.visible === 100 && result.labelsInside, 'Every node and cluster label must be visible in the overview');
    check(await page.locator('.cluster-title').count() === 6, 'Keep all six source collections');
  };
  const recordIngestion = async () => page.evaluate(() => {
    const samples = [];
    window.__ingestionSamples = samples;
    const timer = setInterval(() => {
      const status = document.querySelector('.ingestion-status');
      if (!status) return;
      const phase = Number(status.dataset.phase);
      samples.push({
        phase, width: document.querySelector('.network').viewBox.baseVal.width,
        visibleNodes: [...document.querySelectorAll('[data-node]')].filter(node => Number(getComputedStyle(node).opacity) > .05).length,
        visibleEdges: [...document.querySelectorAll('.edge')].filter(node => Number(getComputedStyle(node).opacity) > .05).length,
        labels: [...document.querySelectorAll('.relationship-annotation')].filter(node =>
          Number(getComputedStyle(node).opacity) > .8 && Number(getComputedStyle(node.parentElement).opacity) > .8).map(node => node.dataset.label),
      });
      if (phase === 2) clearInterval(timer);
    }, 20);
    setTimeout(() => clearInterval(timer), 12000);
  });
  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://localhost:5173/');
    await page.locator('main').waitFor();
    await stage(-1);
    await page.keyboard.press('ArrowLeft');
    await stage(-1);
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true }));
    });
    await stage(-1);
    await page.keyboard.press('ArrowRight');
    await stage(-2);
    await recordIngestion();
    await page.keyboard.press('ArrowRight');
    await stage(3);
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', repeat: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', repeat: true }));
    });
    check(await page.locator('main').getAttribute('data-paused') === 'false', 'Held Space must not toggle playback');
    check((await page.locator('.sr-only[role="status"]').innerText()).includes('Step 3 of 9'), 'Announcement must count the nine-slide presentation');
    await page.waitForFunction(() => window.__ingestionSamples.some(sample => sample.phase === 2), undefined, { timeout: 12000 });
    const samples = await page.evaluate(() => window.__ingestionSamples);
    check(samples.some(sample => sample.visibleNodes > 0 && sample.visibleNodes < 100), 'Ingestion must progressively reveal sources');
    check(samples.some(sample => sample.visibleEdges > 0 && sample.visibleEdges < 92), 'Ingestion must progressively draw edges');
    check(samples.some(sample => sample.width < 400), 'Keep the relationship close-up');
    check(samples.some(sample => ['uses', 'requires', 'provided_by'].every(label => sample.labels.includes(label))), 'All relationship examples must be readable');
    check(Math.abs(samples.at(-1).width - 1000) < .01, 'Ingestion must restore the overview');
    await overview();
    const positions = await page.locator('[data-node]').evaluateAll(nodes => nodes.map(node => node.getAttribute('transform')));
    await page.keyboard.press('r');
    await page.waitForFunction(() => Number(document.querySelector('main').dataset.time) > .3);
    check(Number(await page.locator('main').getAttribute('data-time')) < 2, 'R must replay ingestion');
    await page.evaluate(() => {
      const calls = [];
      window.__calls = calls;
      const timer = setInterval(() => {
        const caption = document.querySelector('.search-call');
        if (!caption) return;
        const hop = Number(caption.dataset.hop);
        if (!calls.some(call => call.hop === hop)) calls.push({
          hop, text: caption.textContent, found: document.querySelectorAll('[data-retrieved="true"]').length,
        });
        if (hop === 6) clearInterval(timer);
      }, 20);
      setTimeout(() => clearInterval(timer), 20000);
    });
    await page.keyboard.press('ArrowRight');
    await stage(4);
    await page.waitForFunction(() => window.__calls.length === 7, undefined, { timeout: 20000 });
    const calls = await page.evaluate(() => window.__calls);
    check(calls[0].text.includes('text.search("pulse survey results"'), 'Keep the initial text seed query within graph retrieval');
    check(calls.slice(1).every(call => call.text.includes(`GRAPH HOP ${call.hop} / 6`) && call.text.includes('graph.neighbors(')), 'Keep the six numbered adjacency calls');
    check(JSON.stringify(calls.map(call => call.found)) === JSON.stringify([1, 10, 12, 15, 17, 18, 19]), 'Graph recall must remain unchanged');
    await page.keyboard.press('ArrowRight');
    await stage(5);
    await page.waitForTimeout(900);
    check(await page.locator('[data-missed="true"]').count() === 1, 'Keep the unlinked source as missed');
    check(await page.locator('main').getAttribute('data-recall') === '95', 'Final recall must stay at 95%');
    check(JSON.stringify(positions) === JSON.stringify(await page.locator('[data-node]').evaluateAll(nodes => nodes.map(node => node.getAttribute('transform')))), 'Node layout must remain fixed');
    for (const size of [{ width: 390, height: 844 }, { width: 1024, height: 600 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(size);
      await overview();
    }
    for (const id of [6, 7, 8, 9]) { await page.keyboard.press('ArrowRight'); await stage(id); }
    await page.keyboard.press('ArrowRight');
    await stage(9);
    for (const id of [8, 7, 6, 5, 4, 3, -2, -1]) { await page.keyboard.press('ArrowLeft'); await stage(id); }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('ArrowRight');
    await stage(-2);
    await page.keyboard.press('ArrowRight');
    await stage(3);
    await page.waitForFunction(() => document.querySelector('.ingestion-status')?.dataset.phase === '2', undefined, { timeout: 12000 });
    check(await page.locator('.ingestion-scan').count() === 0, 'Reduced motion must disable scanning');
    await overview();
    await page.keyboard.press('ArrowLeft');
    await stage(-2);
    await page.keyboard.press('ArrowLeft');
    await stage(-1);
    await page.keyboard.press('End');
    await stage(5);
    await page.keyboard.press('Home');
    await stage(-1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    check(errors.length === 0, errors.join('; '));
    return { passed: true, noStandardSearchSlides: true, nineSlideNavigation: true, ingestion: true,
      sevenRetrievalCalls: true, graphRecall: 95, responsive: true, reducedMotion: true };
  } finally {
    page.off('pageerror', recordError);
    page.off('console', recordConsole);
  }
}
