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
    check(await page.locator('.network').count() === 0, 'The graph must not run behind the opening story');
    await page.keyboard.press('ArrowLeft');
    check(await page.locator('main').getAttribute('data-stage') === '-1', 'First scene must not wrap');
    await page.waitForFunction(() => Number(document.querySelector('main').dataset.time) > 5);
    const flight = await page.getByTestId('context-fragment').getAttribute('transform');
    await page.waitForTimeout(180);
    check(await page.getByTestId('context-fragment').getAttribute('transform') !== flight, 'Retrieved context must visibly travel into the agent session');
    await page.keyboard.press('Space');
    const before = await snapshot();
    await page.waitForTimeout(700);
    check(JSON.stringify(before) === JSON.stringify(await snapshot()), 'Pause must freeze story particles and time');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('.problem-story').dataset.phase === '2');
    check(await page.getByTestId('session-piece').evaluateAll(pieces =>
      pieces.length === 2 && pieces.every(piece => Number(piece.getAttribute('opacity')) === 1)), 'Both retrieved context fragments must arrive in the session before generation');
    check(Number(await page.getByTestId('story-consequence').getAttribute('opacity')) === 0, 'The missing-rule consequence must be revealed after the draft answer');
    await page.waitForFunction(() => document.querySelector('.problem-story').dataset.complete === 'true', undefined, { timeout: 20000 });
    check(Number(await page.getByTestId('story-answer').getAttribute('opacity')) === 1, 'The final answer must remain visible');
    check(Number(await page.getByTestId('story-consequence').getAttribute('opacity')) === 1, 'The consequence must be visible');
    check(await page.locator('[data-story-source][data-found=false]').count() === 2, 'The story must leave two undiscovered sources');
    check((await page.locator('.story-canvas').textContent()).includes('Minimum cohort: 5'), 'The missed requirement must be concrete');
    for (const size of [{ width: 1440, height: 1000 }, { width: 1024, height: 600 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      check(await page.locator('.problem-story').evaluate(element =>
        element.scrollHeight <= element.clientHeight && element.scrollWidth <= element.clientWidth), 'The story must fit the viewport');
    }
    await page.keyboard.press('r');
    check(Number(await page.locator('main').getAttribute('data-time')) < 1, 'R must replay the story');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('main').dataset.stage === '0');
    check(await page.locator('[data-node]').count() === 100, 'The graph tour must follow the story');
    await page.keyboard.press('Home');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => Number(document.querySelector('main').dataset.time) > 1.3);
    await page.keyboard.press('Space');
    const reduced = await snapshot();
    await page.waitForTimeout(500);
    check(JSON.stringify(reduced) === JSON.stringify(await snapshot()), 'Reduced-motion story must also pause');
    await page.keyboard.press('End');
    check(await page.locator('main').getAttribute('data-stage') === '5', 'End must retain the result shortcut');
    await page.keyboard.press('Home');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    check(errors.length === 0, errors.join('; '));
    return { passed: true, animatedStory: true, missingPrivacyRule: true, pauseReplay: true, keyboardNavigation: true, reducedMotion: true };
  } finally {
    page.off('pageerror', onError);
  }
}
