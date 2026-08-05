import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'visuals.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const data = context.window.PEDS_VISUALS;

test('20点以上の図表を、各暗記ノートに3点以上で収録する', () => {
  assert.ok(data);
  const entries = Object.values(data.pages);
  assert.ok(entries.length >= 6);
  assert.ok(entries.every((page) => page.visuals.length >= 3));
  assert.ok(entries.reduce((sum, page) => sum + page.visuals.length, 0) >= 20);
  // 図解は暗記ノート（毎日確認シート）にのみ紐づく
  assert.ok(Object.keys(data.pages).every((key) => key.endsWith('_毎日確認シート')));
});

test('各図表に試験対策の必須要素と一次資料リンクがある', () => {
  for (const page of Object.values(data.pages)) {
    for (const visual of page.visuals) {
      for (const key of ['title', 'importance', 'type', 'nodes', 'takeaway', 'oneShot', 'trap', 'review', 'source']) {
        assert.ok(visual[key], `${page.title}/${visual.title}: ${key}`);
      }
      assert.match(visual.source.url, /^https:\/\//);
    }
  }
});

test('各暗記項目に紐づく日本語の一枚図解が6点以上ある', () => {
  const illustrated = Object.values(data.pages)
    .flatMap((page) => page.visuals)
    .filter((visual) => visual.image);
  assert.ok(illustrated.length >= 6);
  for (const visual of illustrated) {
    assert.ok(visual.image.src, `${visual.title}: image.src`);
    assert.ok(visual.image.alt, `${visual.title}: image.alt`);
    assert.ok(visual.image.caption, `${visual.title}: image.caption`);
    const imagePath = path.join(root, visual.image.src);
    assert.ok(fs.existsSync(imagePath), `${visual.title}: ${visual.image.src}`);
    assert.ok(fs.statSync(imagePath).size < 800_000, `${visual.title}: image must be under 800 KB`);
  }
});

test('遺伝は項目別に6枚以上の図解を収録する', () => {
  const genetics = data.pages['遺伝_毎日確認シート'].visuals;
  assert.ok(genetics.length >= 6);
  assert.ok(genetics.filter((visual) => visual.image).length >= 6);
  for (const title of ['インプリンティング', 'トリプレットリピート', '染色体異常']) {
    assert.ok(genetics.some((visual) => visual.title.includes(title)), title);
  }
});

test('暗記ノートの公開ページが存在し、Visual Study Notes は撤去されている', () => {
  for (const file of [
    '制度・倫理_毎日確認シート.html',
    '感染症・予防接種_毎日確認シート.html',
    '成長・発達・栄養_毎日確認シート.html',
    '救急・中毒_毎日確認シート.html',
    '神経・筋_毎日確認シート.html',
    '遺伝_毎日確認シート.html',
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
  }
  assert.equal(fs.readdirSync(root).filter((f) => f.includes('_Visual_Study_Notes')).length, 0);
});

test('既存の学習状態・メモ保存機能を維持する', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /pboard:v1/);
  assert.match(app, /あやしい/);
  assert.match(app, /覚えた/);
  assert.match(app, /memoKey/);
  assert.match(app, /closest\('\.textbook-figure'\)/);
  assert.match(app, /topic-infographic/);
});

test('学習ノートは未分類を既定表示し、分類した項目をその場で隠す', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const buildSheet = app.slice(app.indexOf('function buildSheet()'), app.indexOf('function buildIndex()'));
  assert.match(buildSheet, /activeFilter\s*=\s*'todo'/);
  assert.match(buildSheet, /data-sheet-filter="todo"[^>]*class="is-active"/);
  assert.match(buildSheet, /data-sheet-filter="shaky"/);
  assert.match(buildSheet, /data-sheet-filter="known"/);
  assert.match(buildSheet, /filterHidden\s*=\s*status\s*!==\s*activeFilter/);
  assert.match(buildSheet, /it\.h2\.hidden\s*=\s*filterHidden/);
  assert.match(buildSheet, /member\.hidden\s*=\s*filterHidden/);
  assert.match(buildSheet, /function focusNextReviewAction\(current\)/);
  assert.match(buildSheet, /items\.indexOf\(current\)/);
  assert.match(buildSheet, /focusNextReviewAction\(it\)/);
});

test('Vercel設定が有効なJSONである', () => {
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')));
});

test('トップページのタイトルがVisual Study Notesである', () => {
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /<title>小児科 Visual Study Notes<\/title>/);
});

test('各シートの上部ナビと目次はスクロールに追従しない', () => {
  const styles = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.match(styles, /\.topnav\{position:static/);
  assert.match(styles, /nav#TOC\{position:static/);
  assert.doesNotMatch(styles, /\.topnav\{position:sticky/);
  assert.doesNotMatch(styles, /nav#TOC\{position:sticky/);
});
