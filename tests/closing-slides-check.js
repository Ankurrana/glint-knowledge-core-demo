async page => {
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const check = (value, message) => { if (!value) throw new Error(message); };
  try {
    await page.goto('http://localhost:5173');
    await page.locator('main').waitFor();
    await page.keyboard.press('End');
    const titles = ['Connected context. Better-informed agents.', 'Better context takes deliberate engineering.',
      'Knowledge Core: the big picture', 'From the big picture to connected context'];
    for (let index = 0; index < titles.length; index++) {
      await page.keyboard.press('ArrowRight');
      await page.getByRole('heading', { name: titles[index], exact: true }).waitFor();
      check(await page.locator('.network').count() === 0, 'Closing slides must not run a hidden graph animation');
      if (index < 2) check(await page.locator('.closing-points article').count() === 3, 'Each text slide needs three points');
      else {
        await page.waitForFunction(() => {
          const image = document.querySelector('.graph-image img');
          return image?.complete && image.naturalWidth > 0;
        });
        check(await page.locator('.graph-image img').getAttribute('src') === `./images/knowledge-graph-${index === 2 ? 'overview' : 'detail'}.png`, 'Image order must be overview then detail');
      }
      for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 600 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport);
        const fits = await page.locator('.closing-slide').evaluate(element => {
          const image = element.querySelector('img')?.getBoundingClientRect();
          return element.scrollWidth <= innerWidth && (!image || image.width > 0 && image.height > 0 && image.left >= 0 && image.right <= innerWidth);
        });
        check(fits, `Slide ${index} overflows at ${viewport.width}`);
      }
    }
    await page.keyboard.press('ArrowRight');
    check(await page.locator('main').getAttribute('data-stage') === '9', 'Last slide must not wrap');
    await page.keyboard.press('End');
    check(await page.locator('[data-node]').count() === 100, 'End must restore the graph result');
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => document.querySelector('main')?.dataset.recall === '95', undefined, { timeout: 20000 });
    check(errors.length === 0, errors.join('; '));
    await page.setViewportSize({ width: 1440, height: 1000 });
    return { passed: true, fourClosingSlides: true, imagesLoaded: true, responsive: true, graphReturn: true };
  } finally {
    page.off('pageerror', onError);
  }
}
