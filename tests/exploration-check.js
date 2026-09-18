async page => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const snapshot = () => page.evaluate(() => ({
    time: document.querySelector('main').dataset.time,
    camera: document.querySelector('.network').getAttribute('viewBox'),
    title: document.querySelector('.tour-status')?.textContent,
    styles: [...document.querySelectorAll('[data-node], .tour-entities, .cluster')].map(node => getComputedStyle(node).opacity),
  }));
  const overviewVisible = async () => {
    const state = await page.evaluate(() => ({
      nodes: [...document.querySelectorAll('[data-node]')].map(node => ({
        opacity: Number(getComputedStyle(node).opacity),
        radius: parseFloat(getComputedStyle(node.querySelector('.node-core')).r),
        target: node.dataset.relevant === 'true' ? 9.5 : 6,
        name: node.getAttribute('aria-label'),
      })),
      labels: [...document.querySelectorAll('.cluster-entity')].filter(node => Number(getComputedStyle(node.parentElement).opacity) > .95).length,
    }));
    check(state.nodes.length === 100 && state.nodes.every(node => node.opacity >= .99 && Math.abs(node.radius - node.target) < .01 && node.name), 'An overview must restore all 100 named entities at full size and opacity');
    check(state.labels === 6, 'Every overview collection must retain its entity label');
  };
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://localhost:5173');
  await page.locator('main').waitFor();
  await page.evaluate(() => {
    const visits = {};
    window.__tourVisits = visits;
    const timer = setInterval(() => {
      for (const group of document.querySelectorAll('.tour-entities')) {
        if (Number(getComputedStyle(group).opacity) < .99) continue;
        const labels = [...group.querySelectorAll('.tour-entity-label')];
        visits[group.dataset.tour] = {
          names: labels.map(label => label.textContent),
          inside: labels.every(label => {
            const rect = label.getBoundingClientRect();
            return rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
          }),
          width: document.querySelector('.network').viewBox.baseVal.width,
        };
      }
      if (document.querySelector('.tour-status')?.dataset.complete === 'true') clearInterval(timer);
    }, 40);
    setTimeout(() => clearInterval(timer), 40000);
  });
  await page.waitForFunction(() => {
    const time = Number(document.querySelector('main').dataset.time);
    return time > 2.65 && time < 3.4;
  });
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  const before = await snapshot();
  await page.waitForTimeout(800);
  check(JSON.stringify(before) === JSON.stringify(await snapshot()), 'Space must freeze the tour camera and entity labels');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelector('.tour-status')?.dataset.complete === 'true', undefined, { timeout: 35000 });
  const visits = await page.evaluate(() => window.__tourVisits);
  check(JSON.stringify(Object.keys(visits)) === JSON.stringify(['code', 'learn', 'pm']), 'The camera must visit only Code, Microsoft Learn, and PM specs');
  check(Object.values(visits).every(visit => visit.names.length === 3 && visit.inside && visit.width < 800), 'Each close-up needs three visible, in-bounds source labels');
  check(visits.code.names.includes('SurveyResultsController.ts'), 'The tour must show actual source names');
  await overviewVisible();
  await page.keyboard.press('r');
  await page.waitForFunction(() => Number(document.querySelector('main').dataset.time) > 4);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1000);
  await overviewVisible();
  for (const reducedMotion of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion });
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => Number(document.querySelector('main').dataset.time) > .15);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(1100);
    await overviewVisible();
    await page.keyboard.press('End');
    await page.waitForTimeout(1100);
    await overviewVisible();
    const time = await page.locator('main').getAttribute('data-time');
    await page.keyboard.press('End');
    check(await page.locator('main').getAttribute('data-time') === time, 'Boundary navigation must not desynchronize the playback clock');
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.keyboard.press('Home');
  return { passed: true, threeClusterTour: true, actualEntityNames: true, pauseAndReplay: true, visibleAfterInterruption: true };
}
