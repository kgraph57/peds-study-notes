import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chromeCandidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));

function serveStudyNotes() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': file.endsWith('.html') ? 'text/html; charset=utf-8'
        : file.endsWith('.js') ? 'text/javascript; charset=utf-8'
          : file.endsWith('.css') ? 'text/css; charset=utf-8'
            : 'application/octet-stream',
    });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('sheet filters hide classified items, restore categories, and persist after reload', {
  skip: chromePath ? false : 'Chrome/Chromium is not installed',
}, async () => {
  const server = await serveStudyNotes();
  const address = server.address();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageUrl = `http://127.0.0.1:${address.port}/${encodeURIComponent('遺伝_毎日確認シート.html')}`;
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-sheet-filter="todo"]');
    const visibleMasteryCount = (status) => page.evaluate((value) => (
      Array.from(document.querySelectorAll(`h2[data-mastery="${value}"]`)).filter((h2) => !h2.hidden).length
    ), status);

    const initial = await page.evaluate(() => ({
      todoPressed: document.querySelector('[data-sheet-filter="todo"]').getAttribute('aria-pressed'),
      shakyPressed: document.querySelector('[data-sheet-filter="shaky"]').getAttribute('aria-pressed'),
      visibleTodo: Array.from(document.querySelectorAll('h2[data-mastery="todo"]')).filter((h2) => !h2.hidden).length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    assert.equal(initial.todoPressed, 'true');
    assert.equal(initial.shakyPressed, 'false');
    assert.ok(initial.visibleTodo > 3);
    assert.equal(initial.overflow, false);

    const classified = await page.evaluate(() => {
      const visible = Array.from(document.querySelectorAll('h2[data-mastery="todo"]')).filter((h2) => !h2.hidden);
      const current = visible[2];
      const expectedNext = visible[3];
      const firstMember = current.nextElementSibling;
      current.querySelector('.rev-seg__btn.is-shaky').click();
      return {
        currentHidden: current.hidden,
        memberHidden: firstMember ? firstMember.hidden : null,
        remainingTodo: Array.from(document.querySelectorAll('h2[data-mastery="todo"]')).filter((h2) => !h2.hidden).length,
        shakyCount: document.querySelector('[data-filter-count="shaky"]').textContent,
        focusMovedToLogicalNext: document.activeElement.closest('h2') === expectedNext,
      };
    });
    assert.equal(classified.currentHidden, true);
    assert.equal(classified.memberHidden, true);
    assert.equal(classified.remainingTodo, initial.visibleTodo - 1);
    assert.equal(classified.shakyCount, '1');
    assert.equal(classified.focusMovedToLogicalNext, true);

    await page.locator('[data-sheet-filter="shaky"]').click();
    assert.equal(await visibleMasteryCount('shaky'), 1);
    await page.evaluate(() => {
      document.querySelector('h2[data-mastery="shaky"]:not([hidden]) .rev-seg__btn.is-known').click();
    });
    assert.equal(await visibleMasteryCount('shaky'), 0);
    assert.equal(await page.locator('[data-filter-count="known"]').textContent(), '1');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-sheet-filter="todo"]');
    assert.equal(await page.locator('[data-sheet-filter="todo"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await visibleMasteryCount('known'), 0);
    assert.equal(await page.locator('[data-filter-count="known"]').textContent(), '1');
    await page.locator('[data-sheet-filter="known"]').click();
    assert.equal(await visibleMasteryCount('known'), 1);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('classified visual cards and source sections leave no visible shell or table-of-contents entry', {
  skip: chromePath ? false : 'Chrome/Chromium is not installed',
}, async () => {
  const server = await serveStudyNotes();
  const address = server.address();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageUrl = `http://127.0.0.1:${address.port}/${encodeURIComponent('遺伝_毎日確認シート.html')}`;
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-sheet-filter="todo"]');

    const result = await page.evaluate(() => {
      const visualHeading = document.querySelector('.visual-card h2[data-mastery="todo"]');
      const visualCard = visualHeading.closest('.visual-card');
      visualHeading.querySelector('.rev-seg__btn.is-known').click();

      const sourceHeading = Array.from(document.querySelectorAll('h2[id][data-mastery="todo"]'))
        .find((heading) => {
          if (heading.closest('.visual-card')) return false;
          let member = heading.nextElementSibling;
          while (member && member.tagName !== 'H2') {
            if (member.tagName === 'TABLE') return true;
            member = member.nextElementSibling;
          }
          return false;
        });
      let sourceMember = sourceHeading.nextElementSibling;
      while (sourceMember && sourceMember.tagName !== 'TABLE') sourceMember = sourceMember.nextElementSibling;
      const tocItem = document.querySelector(`nav#TOC a[href="#${CSS.escape(sourceHeading.id)}"]`)?.closest('li');
      sourceHeading.querySelector('.rev-seg__btn.is-known').click();

      return {
        visualCardHidden: visualCard.hidden,
        visualCardDisplay: getComputedStyle(visualCard).display,
        visualCardHeight: visualCard.getBoundingClientRect().height,
        sourceMemberHidden: sourceMember.hidden,
        sourceMemberDisplay: getComputedStyle(sourceMember).display,
        tocItemHidden: tocItem?.hidden,
        tocItemDisplay: tocItem ? getComputedStyle(tocItem).display : null,
      };
    });

    assert.deepEqual(result, {
      visualCardHidden: true,
      visualCardDisplay: 'none',
      visualCardHeight: 0,
      sourceMemberHidden: true,
      sourceMemberDisplay: 'none',
      tocItemHidden: true,
      tocItemDisplay: 'none',
    });

    await page.locator('[data-sheet-filter="known"]').click();
    const restored = await page.evaluate(() => {
      const visualHeading = document.querySelector('.visual-card h2[data-mastery="known"]');
      const visualCard = visualHeading.closest('.visual-card');
      const sourceHeading = Array.from(document.querySelectorAll('h2[id][data-mastery="known"]'))
        .find((heading) => {
          if (heading.closest('.visual-card')) return false;
          let member = heading.nextElementSibling;
          while (member && member.tagName !== 'H2') {
            if (member.tagName === 'TABLE') return true;
            member = member.nextElementSibling;
          }
          return false;
        });
      let sourceMember = sourceHeading.nextElementSibling;
      while (sourceMember && sourceMember.tagName !== 'TABLE') sourceMember = sourceMember.nextElementSibling;
      const tocItem = document.querySelector(`nav#TOC a[href="#${CSS.escape(sourceHeading.id)}"]`)?.closest('li');
      return {
        visualCardHidden: visualCard.hidden,
        visualCardDisplay: getComputedStyle(visualCard).display,
        sourceMemberHidden: sourceMember.hidden,
        sourceMemberDisplay: getComputedStyle(sourceMember).display,
        tocItemHidden: tocItem?.hidden,
        tocItemDisplay: tocItem ? getComputedStyle(tocItem).display : null,
        filterFocusRetained: document.activeElement === document.querySelector('[data-sheet-filter="known"]'),
      };
    });
    assert.deepEqual(restored, {
      visualCardHidden: false,
      visualCardDisplay: 'block',
      sourceMemberHidden: false,
      sourceMemberDisplay: 'block',
      tocItemHidden: false,
      tocItemDisplay: 'list-item',
      filterFocusRetained: true,
    });
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('empty mastery filter hides structural introductions and restores them with populated content', {
  skip: chromePath ? false : 'Chrome/Chromium is not installed',
}, async () => {
  const server = await serveStudyNotes();
  const address = server.address();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageUrl = `http://127.0.0.1:${address.port}/${encodeURIComponent('遺伝_毎日確認シート.html')}`;
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-sheet-filter="todo"]');

    const empty = await page.evaluate(() => {
      for (let index = 0; index < 100; index += 1) {
        const next = Array.from(document.querySelectorAll('h2[data-mastery="todo"]'))
          .find((heading) => !heading.hidden && getComputedStyle(heading).display !== 'none');
        if (!next) break;
        next.querySelector('.rev-seg__btn.is-known').click();
      }
      const sourceTitle = document.querySelector('h1[id]:not(.title)');
      const sourceIntro = [];
      let node = sourceTitle;
      while (node && node.tagName !== 'H2') {
        sourceIntro.push(node);
        node = node.nextElementSibling;
      }
      return {
        todoCount: document.querySelector('[data-filter-count="todo"]').textContent,
        visualAtlasHidden: document.querySelector('.visual-atlas').hidden,
        tocHidden: document.querySelector('nav#TOC').hidden,
        sourceIntroHidden: sourceIntro.every((element) => element.hidden && getComputedStyle(element).display === 'none'),
        visualModeHidden: document.querySelector('.visual-mode-toggle').hidden,
      };
    });
    assert.deepEqual(empty, {
      todoCount: '0',
      visualAtlasHidden: true,
      tocHidden: true,
      sourceIntroHidden: true,
      visualModeHidden: true,
    });

    await page.locator('[data-sheet-filter="known"]').click();
    const restored = await page.evaluate(() => {
      const sourceTitle = document.querySelector('h1[id]:not(.title)');
      return {
        visualAtlasVisible: !document.querySelector('.visual-atlas').hidden,
        tocVisible: !document.querySelector('nav#TOC').hidden,
        sourceTitleVisible: !sourceTitle.hidden && getComputedStyle(sourceTitle).display !== 'none',
        visualModeVisible: !document.querySelector('.visual-mode-toggle').hidden,
      };
    });
    assert.deepEqual(restored, {
      visualAtlasVisible: true,
      tocVisible: true,
      sourceTitleVisible: true,
      visualModeVisible: true,
    });
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('visual-only sheets keep their header and contents visible until the active filter is empty', {
  skip: chromePath ? false : 'Chrome/Chromium is not installed',
}, async () => {
  const server = await serveStudyNotes();
  const address = server.address();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageUrl = `http://127.0.0.1:${address.port}/${encodeURIComponent('循環器_Visual_Study_Notes.html')}`;
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-sheet-filter="todo"]');

    const initial = await page.evaluate(() => ({
      headerVisible: !document.querySelector('header').hidden,
      tocVisible: !document.querySelector('nav#TOC').hidden,
      atlasVisible: !document.querySelector('.visual-atlas').hidden,
      todoCount: document.querySelector('[data-filter-count="todo"]').textContent,
    }));
    assert.equal(initial.headerVisible, true);
    assert.equal(initial.tocVisible, true);
    assert.equal(initial.atlasVisible, true);
    assert.ok(Number(initial.todoCount) > 0);

    await page.evaluate(() => {
      for (let index = 0; index < 100; index += 1) {
        const next = document.querySelector('.visual-card h2[data-mastery="todo"]:not([hidden])');
        if (!next) break;
        next.querySelector('.rev-seg__btn.is-known').click();
      }
    });
    const empty = await page.evaluate(() => ({
      headerHidden: document.querySelector('header').hidden,
      tocHidden: document.querySelector('nav#TOC').hidden,
      atlasHidden: document.querySelector('.visual-atlas').hidden,
    }));
    assert.deepEqual(empty, { headerHidden: true, tocHidden: true, atlasHidden: true });

    await page.locator('[data-sheet-filter="known"]').click();
    const restored = await page.evaluate(() => ({
      headerVisible: !document.querySelector('header').hidden,
      tocVisible: !document.querySelector('nav#TOC').hidden,
      atlasVisible: !document.querySelector('.visual-atlas').hidden,
    }));
    assert.deepEqual(restored, { headerVisible: true, tocVisible: true, atlasVisible: true });
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('emptying visual items exits visual-only mode and focuses the active filter', {
  skip: chromePath ? false : 'Chrome/Chromium is not installed',
}, async () => {
  const server = await serveStudyNotes();
  const address = server.address();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageUrl = `http://127.0.0.1:${address.port}/${encodeURIComponent('遺伝_毎日確認シート.html')}`;
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-sheet-filter="todo"]');
    await page.locator('.visual-mode-toggle').click();

    await page.evaluate(() => {
      for (let index = 0; index < 100; index += 1) {
        const next = document.querySelector('.visual-card h2[data-mastery="todo"]:not([hidden])');
        if (!next) break;
        next.querySelector('.rev-seg__btn.is-known').click();
      }
    });
    const result = await page.evaluate(() => ({
      visualModeExited: !document.body.classList.contains('is-visual-review'),
      modeLabel: document.querySelector('.visual-mode-toggle').textContent,
      filterFocused: document.activeElement === document.querySelector('[data-sheet-filter="todo"]'),
    }));
    assert.deepEqual(result, {
      visualModeExited: true,
      modeLabel: '図表だけ見る',
      filterFocused: true,
    });
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
