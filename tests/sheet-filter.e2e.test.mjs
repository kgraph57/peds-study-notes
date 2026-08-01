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
