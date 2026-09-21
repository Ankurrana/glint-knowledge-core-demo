async page => {
  const errors = [];
  const onError = error => errors.push(error.message);
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const snapshot = () => page.evaluate(() => ({
    time: document.querySelector('main').dataset.time,
    svg: document.querySelector('.solution-canvas').outerHTML,
  }));
  const pause = async () => {
    await page.keyboard.press('Space');
    const before = await snapshot();
    await page.waitForTimeout(400);
    check(JSON.stringify(before) === JSON.stringify(await snapshot()), 'Pause must freeze the solution clock and all SVG motion');
    await page.keyboard.press('Space');
  };
  page.on('pageerror', onError);
  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://localhost:5173/');
    await page.getByTestId('problem-story').waitFor();
    await page.keyboard.press('ArrowRight');
    await page.getByTestId('solution-story').waitFor();
    await page.evaluate(() => {
      window.__solution = { flights: [], phases: [], drawn: [] };
      const timer = setInterval(() => {
        const story = document.querySelector('.solution-story');
        if (!story) { clearInterval(timer); return; }
        window.__solution.phases.push(story.dataset.phase);
        window.__solution.flights.push(...[...document.querySelectorAll('[data-testid="capture-fragment"]')].map(node => node.getAttribute('transform')));
        window.__solution.drawn.push(...[...document.querySelectorAll('[data-solution-link] > path')].map(node => Number(node.getAttribute('stroke-dashoffset'))));
        if (story.dataset.complete === 'true') clearInterval(timer);
      }, 16);
      setTimeout(() => clearInterval(timer), 12000);
    });
    await page.waitForFunction(() => Number(document.querySelector('main').dataset.time) > .5);
    await pause();
    await page.waitForFunction(() => Number(document.querySelector('main').dataset.time) > 2.5);
    await pause();
    await page.waitForFunction(() => document.querySelector('.solution-story').dataset.complete === 'true');
    const recording = await page.evaluate(() => window.__solution);
    check(new Set(recording.flights).size > 10, 'Knowledge fragments must visibly travel from sources into the core');
    check(['capture', 'connect', 'retrieve'].every(phase => recording.phases.includes(phase)), 'Show capture then relationships then a single MCP');
    check(recording.drawn.some(value => value > 0 && value < 1), 'Relationships must progressively draw');
    check(await page.locator('[data-solution-source]').count() === 4, 'Preserve four original sources and their provenance');
    check(await page.locator('[data-solution-entity]').evaluateAll(nodes => nodes.length === 4 && nodes.every(node => node.getAttribute('opacity') === '1')), 'All four entities must arrive');
    check(await page.locator('[data-solution-link]').evaluateAll(nodes => nodes.length === 3 && nodes.every(node => node.getAttribute('opacity') === '1')), 'All three named relationships must remain visible');
    check(await page.getByTestId('solution-mcp').getAttribute('opacity') === '1', 'One MCP must reach the agent');
    check(await page.getByTestId('solution-answer').getAttribute('opacity') === '1', 'The agent must receive connected context');
    check(Number(await page.locator('main').getAttribute('data-time')) === 4.8, 'The solution must finish within five seconds and hold');
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 600 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      check(await page.locator('.solution-story').evaluate(element =>
        element.scrollHeight <= element.clientHeight && element.scrollWidth <= element.clientWidth), 'Solution must fit without overflow');
      check(await page.locator('.solution-canvas text').evaluateAll(nodes => nodes.every(node => {
        const box = node.getBoundingClientRect();
        return box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight;
      })), 'All solution labels must be within the viewport');
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.keyboard.press('r');
    await page.waitForFunction(() => Number(document.querySelector('main').dataset.time) > .3);
    await page.keyboard.press('Space');
    await page.keyboard.press('r');
    check(await page.locator('main').getAttribute('data-paused') === 'false', 'Replay must unpause');
    check(Number(await page.locator('main').getAttribute('data-time')) < 1, 'Replay must restart');
    await page.keyboard.press('ArrowRight');
    check(await page.locator('main').getAttribute('data-stage') === '3', 'Solution must lead directly to ingestion');
    await page.keyboard.press('ArrowLeft');
    await page.getByTestId('solution-story').waitFor();
    check(Number(await page.locator('main').getAttribute('data-time')) < 1, 'Returning to solution must restart cleanly');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('r');
    await page.waitForFunction(() => Number(document.querySelector('main').dataset.time) > .5);
    check(await page.getByTestId('capture-fragment').count() === 0, 'Reduced motion must omit traveling capture fragments');
    await pause();
    await page.waitForFunction(() => document.querySelector('.solution-story').dataset.phase === 'retrieve');
    check(await page.getByTestId('delivery-fragment').count() === 0, 'Reduced motion must omit delivery travel');
    check(await page.locator('[data-solution-link] > path').evaluateAll(nodes =>
      nodes.every(node => node.getAttribute('stroke-dashoffset') === '0')), 'Reduced motion must not draw relationship paths');
    await page.waitForFunction(() => document.querySelector('.solution-story').dataset.complete === 'true');
    await page.keyboard.press('Home');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    check(errors.length === 0, errors.join('; '));
    return { passed: true, centralizedCapture: true, crossSourceRelationships: true, singleMcp: true,
      duration: 4.8, pauseReplay: true, responsive: true, reducedMotion: true };
  } finally {
    page.off('pageerror', onError);
  }
}
