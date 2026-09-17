async page => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const checkLayouts = async () => {
    for (const size of [{ width: 1440, height: 1000 }, { width: 1024, height: 600 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      const result = await page.locator('.search-call').evaluate(element => {
        const box = element.getBoundingClientRect();
        const overlaps = node => {
          const rect = node.getBoundingClientRect();
          return rect.left < box.right && rect.right > box.left && rect.top < box.bottom && rect.bottom > box.top;
        };
        return {
          inside: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight,
          nodesCovered: [...document.querySelectorAll('.node-core')].some(overlaps),
          textFits: [...element.querySelectorAll('code, .user-query, .retrieval-example, .retrieval-count')].every(node => node.scrollWidth <= node.clientWidth || getComputedStyle(node).display === 'inline'),
          labelSize: parseFloat(getComputedStyle(element.querySelector('.search-tool-label')).fontSize),
        };
      });
      check(result.inside && !result.nodesCovered && result.textFits, `Call caption overlaps or clips at ${size.width}x${size.height}`);
      check(result.labelSize >= 12, 'The call/hop label must be clearly readable');
    }
  };
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://localhost:5173');
  await page.locator('main').waitFor();
  await page.keyboard.press('End');
  await page.waitForFunction(() => document.querySelector('main').dataset.stage === '5');
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => document.querySelector('.search-call')?.dataset.hop === '0');
  await page.keyboard.press('Space');
  await checkLayouts();
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelector('.search-call')?.dataset.hop === '4');
  await page.keyboard.press('Space');
  check((await page.locator('.retrieval-example').innerText()).includes('implements policy from'), 'Check the long cross-source relationship example');
  await checkLayouts();
  await page.keyboard.press('Home');
  await page.setViewportSize({ width: 1440, height: 1000 });
  return { passed: true, seedCaption: true, graphHopCaption: true, noCoveredNodes: true, desktopLaptopMobile: true };
}
