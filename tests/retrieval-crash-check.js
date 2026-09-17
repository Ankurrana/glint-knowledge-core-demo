async page => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const isolated = await page.context().newPage();
  const errors = [];
  isolated.on('pageerror', error => errors.push(error.message));
  try {
    // Frame timestamps can predate setup work performed earlier in that frame.
    await isolated.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => request(timestamp => callback(timestamp - 100));
    });
    await isolated.emulateMedia({ reducedMotion: 'no-preference' });
    await isolated.goto('http://localhost:5173');
    await isolated.locator('main').waitFor();
    await isolated.keyboard.press('End');
    await isolated.waitForFunction(() => document.querySelector('main')?.dataset.stage === '5');
    await isolated.keyboard.press('ArrowLeft');
    await isolated.waitForTimeout(350);
    check(errors.length === 0, `Retrieval crashed with a stale frame timestamp: ${errors.join('; ')}`);
    check(await isolated.locator('main').count() === 1, 'Retrieval must not unmount the presentation');
    check(Number(await isolated.locator('main').getAttribute('data-time')) >= 0, 'Playback time must never become negative');
    check(await isolated.locator('.search-call').getAttribute('data-hop') === '0', 'Retrieval must start with the text-search call');
    await isolated.keyboard.press('Space');
    const paused = await isolated.locator('main').getAttribute('data-time');
    await isolated.waitForTimeout(300);
    check(await isolated.locator('main').getAttribute('data-time') === paused, 'The corrected clock must remain pausable');
    await isolated.keyboard.press('Space');
    await isolated.waitForFunction(() => document.querySelector('main')?.dataset.recall === '95', undefined, { timeout: 20000 });
    for (const reducedMotion of ['no-preference', 'reduce']) {
      await isolated.emulateMedia({ reducedMotion });
      for (let run = 0; run < 3; run++) {
        await isolated.keyboard.press('End');
        await isolated.keyboard.press('ArrowLeft');
        await isolated.waitForTimeout(250);
        check(await isolated.locator('.search-call').getAttribute('data-hop') === '0', 'Re-entering retrieval must restart at the seed');
      }
    }
    check(errors.length === 0, `Unexpected browser errors: ${errors.join('; ')}`);
    return { passed: true, staleFrameTimestamp: true, fullRetrieval: true, repeatedEntry: true, reducedMotion: true };
  } finally {
    await isolated.close();
  }
}
