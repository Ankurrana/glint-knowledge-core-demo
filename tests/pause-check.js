async page => {
  const errors = [];
  const recordError = error => errors.push(error.message);
  const recordConsole = message => { if (message.type() === 'error') errors.push(message.text()); };
  page.on('pageerror', recordError);
  page.on('console', recordConsole);
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const time = () => page.locator('main').getAttribute('data-time').then(Number);
  const snapshot = () => page.evaluate(() => ({
    time: document.querySelector('main').getAttribute('data-time'),
    recall: document.querySelector('main').getAttribute('data-recall'),
    camera: document.querySelector('.network').getAttribute('viewBox'),
    ingestion: document.querySelector('.ingestion-status')?.getAttribute('data-phase'),
    progress: document.querySelector('.ingestion-progress')?.getAttribute('style'),
    call: document.querySelector('.search-call')?.textContent,
    hop: document.querySelector('.search-call')?.getAttribute('data-hop'),
    visuals: [...document.querySelectorAll('svg g, svg circle, svg path, svg text, h1, .search-call, .phase-steps li')].map(element => {
      const style = getComputedStyle(element);
      return [style.opacity, style.fill, style.stroke, style.strokeWidth, style.strokeDasharray,
        style.strokeDashoffset, style.transform, style.color, style.getPropertyValue('r')];
    }),
  }));
  const pauseAndCheck = async label => {
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('main').getAttribute('data-paused') === 'true');
    await page.waitForTimeout(100);
    const before = await snapshot();
    await page.waitForTimeout(900);
    const after = await snapshot();
    check(JSON.stringify(before) === JSON.stringify(after), `${label}: visual state or timeline continued while paused`);
    check((await page.getByTestId('playback-hint').innerText()).includes('Paused'), 'Pause state must be visible');
    return Number(before.time);
  };
  const resumeAndCheck = async previous => {
    await page.keyboard.press('Space');
    await page.waitForFunction(oldTime => Number(document.querySelector('main').getAttribute('data-time')) > oldTime + .05, previous);
    check(await page.locator('main').getAttribute('data-paused') === 'false', 'Space must resume without restarting');
  };
  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://localhost:5173/');
    await page.locator('main').waitFor();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => {
      const width = document.querySelector('.network').viewBox.baseVal.width;
      return width < 960 && width > 450;
    });
    const zoomTime = await pauseAndCheck('Mid-zoom');
    const cameraWidth = await page.locator('.network').evaluate(element => element.viewBox.baseVal.width);
    check(cameraWidth > 315 && cameraWidth < 1000, 'Pause must hold an intermediate camera position');
    await resumeAndCheck(zoomTime);
    await page.waitForFunction(() => Number(document.querySelector('main').getAttribute('data-time')) > 3.15);
    const relationTime = await pauseAndCheck('Relationship drawing');
    check(relationTime < 5.8, 'Relationship pause must occur during the close-up');
    await resumeAndCheck(relationTime);
    await page.waitForFunction(() => document.querySelector('.ingestion-status')?.getAttribute('data-phase') === '2', undefined, { timeout: 12000 });
    check(await page.locator('.network').evaluate(element => Math.abs(element.viewBox.baseVal.width - 1000)) < .01, 'Ingestion must return to the overview after resume');

    const completed = await time();
    await pauseAndCheck('Completed ingestion');
    await page.keyboard.press('Space');
    await page.waitForTimeout(350);
    check(Math.abs(await time() - completed) < .01, 'Resuming a finished animation must not restart it');
    await page.keyboard.press('r');
    await page.waitForFunction(() => Number(document.querySelector('main').getAttribute('data-time')) > .2);
    await pauseAndCheck('Replay');
    await page.keyboard.press('r');
    await page.waitForFunction(() => document.querySelector('main').getAttribute('data-paused') === 'false');
    check(await time() < .8, 'R must restart and unpause ingestion');

    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('.search-call')?.getAttribute('data-hop') === '1');
    const traversalTime = await pauseAndCheck('Graph traversal');
    await resumeAndCheck(traversalTime);
    await page.waitForFunction(() => document.querySelector('main').getAttribute('data-recall') === '95', undefined, { timeout: 20000 });
    await pauseAndCheck('Traversal result');
    await page.keyboard.press('Home');
    check(await page.locator('main').getAttribute('data-paused') === 'false', 'Manual navigation must unpause the next scene');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => Number(document.querySelector('main').getAttribute('data-time')) > 1.1);
    const accessibleTime = await pauseAndCheck('Reduced-motion ingestion');
    await resumeAndCheck(accessibleTime);
    await page.keyboard.press('Home');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    check(errors.length === 0, `Browser errors: ${errors.join('\n')}`);
    return { passed: true, pauseFreezesClockAndVisuals: true,
      midZoom: true, relationshipDrawing: true, traversal: true, resumeWithoutRestart: true, reducedMotion: true };
  } finally {
    page.off('pageerror', recordError);
    page.off('console', recordConsole);
  }
}
