async page => {
  const errors = [];
  const onError = error => errors.push(error.message);
  const check = (value, message) => { if (!value) throw new Error(message); };
  page.on('pageerror', onError);
  const snapshot = () => page.evaluate(() => ({
    time: document.querySelector('main').dataset.time,
    svg: document.querySelector('.story-canvas').outerHTML,
  }));
  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://localhost:5173');
    await page.getByTestId('problem-story').waitFor();
    await page.evaluate(() => {
      const recording = { phases: [], flights: [], completedAt: 0, firstConsequence: 0 };
      window.__storyRecording = recording;
      const timer = setInterval(() => {
        const story = document.querySelector('.problem-story');
        if (!story) return;
        const time = Number(document.querySelector('main').dataset.time);
        const phase = Number(story.dataset.phase);
        if (!recording.phases.includes(phase)) recording.phases.push(phase);
        for (const fragment of document.querySelectorAll('[data-testid="context-fragment"]')) {
          recording.flights.push(fragment.getAttribute('transform'));
        }
        if (!recording.firstConsequence && document.querySelector('[data-testid="story-consequence"]').getAttribute('opacity') === '1') {
          recording.firstConsequence = time;
        }
        if (story.dataset.complete === 'true') {
          recording.completedAt = time;
          clearInterval(timer);
        }
      }, 16);
      setTimeout(() => clearInterval(timer), 7000);
    });
    await page.waitForFunction(() => window.__storyRecording.completedAt > 0, undefined, { timeout: 6000 });
    const recording = await page.evaluate(() => window.__storyRecording);
    check(recording.completedAt === 4.8 && recording.completedAt <= 5, 'The whole opening animation must finish in no more than five seconds');
    check(recording.firstConsequence > 0 && recording.firstConsequence <= 4.5, 'The missing-rule consequence must be fully visible before the story ends');
    check(recording.phases.includes(1) && recording.phases.includes(2) && recording.phases.includes(3) && recording.phases.includes(4), 'Fast playback must retain search, answer, and missing-context beats');
    check(new Set(recording.flights).size > 3, 'Context must still visibly move into the agent session');
    check(await page.getByTestId('session-piece').evaluateAll(pieces =>
      pieces.length === 2 && pieces.every(piece => Number(piece.getAttribute('opacity')) === 1)), 'Both retrieved context fragments must arrive');
    check(Number(await page.getByTestId('story-answer').getAttribute('opacity')) === 1, 'The answer must remain visible at the end');
    check(await page.locator('[data-story-source][data-found=false]').count() === 2, 'Two sources must remain undiscovered');
    check((await page.locator('.story-canvas').textContent()).includes('Minimum cohort: 5'), 'The missing requirement must remain concrete');
    check(await page.locator('html').evaluate(element => getComputedStyle(element).colorScheme) === 'light', 'The presentation must use a light theme');
    for (const size of [{ width: 1440, height: 1000 }, { width: 1024, height: 600 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      check(await page.locator('.problem-story').evaluate(element =>
        element.scrollHeight <= element.clientHeight && element.scrollWidth <= element.clientWidth), 'The story must fit the viewport');
    }
    await page.keyboard.press('r');
    await page.waitForFunction(() => Number(document.querySelector('main').dataset.time) > 1);
    await page.keyboard.press('Space');
    const before = await snapshot();
    await page.waitForTimeout(700);
    check(JSON.stringify(before) === JSON.stringify(await snapshot()), 'Pause must freeze story visuals and time');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('.problem-story').dataset.complete === 'true');
    check(Number(await page.locator('main').getAttribute('data-time')) === 4.8, 'Resume must finish without replaying');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('main').dataset.stage === '0');
    check(await page.locator('[data-node]').count() === 100, 'The graph must follow the story');
    check(await page.locator('.graph-canvas').evaluate(element => getComputedStyle(element).backgroundColor) === 'rgb(255, 249, 240)', 'The graph must use the same cream palette');
    await page.keyboard.press('Home');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => Number(document.querySelector('main').dataset.time) > .8);
    await page.keyboard.press('Space');
    const reduced = await snapshot();
    await page.waitForTimeout(300);
    check(JSON.stringify(reduced) === JSON.stringify(await snapshot()), 'Reduced-motion story must also pause');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('.problem-story').dataset.complete === 'true');
    check(Number(await page.locator('main').getAttribute('data-time')) === 4.8, 'Reduced-motion story must honor the duration limit');
    await page.keyboard.press('End');
    check(await page.locator('main').getAttribute('data-stage') === '5', 'End must retain the result shortcut');
    await page.keyboard.press('Home');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    check(errors.length === 0, errors.join('; '));
    return { passed: true, durationSeconds: recording.completedAt, consequenceVisibleAt: recording.firstConsequence,
      contextMovement: true, brightTheme: true, pauseReplay: true, reducedMotion: true };
  } finally {
    page.off('pageerror', onError);
  }
}
