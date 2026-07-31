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

test('30点以上の図表を、各領域3点以上で収録する', () => {
  assert.ok(data);
  const entries = Object.values(data.pages);
  assert.ok(entries.length >= 10);
  assert.ok(entries.every((page) => page.visuals.length >= 3));
  assert.ok(entries.reduce((sum, page) => sum + page.visuals.length, 0) >= 30);
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

test('各暗記項目に紐づく日本語の一枚図解が9点以上ある', () => {
  const illustrated = Object.values(data.pages)
    .flatMap((page) => page.visuals)
    .filter((visual) => visual.image);
  assert.ok(illustrated.length >= 9);
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

test('優先4領域の公開ページが存在する', () => {
  for (const file of [
    '循環器_Visual_Study_Notes.html',
    '新生児_Visual_Study_Notes.html',
    '内分泌・代謝_Visual_Study_Notes.html',
    '腎・泌尿器_Visual_Study_Notes.html',
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
  }
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

test('学習ノートは覚えた項目を既定で隠し、必要な時だけ再表示できる', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /show-known/);
  assert.match(app, /覚えた項目を表示/);
  assert.match(app, /it\.h2\.hidden\s*=/);
  assert.match(app, /member\.hidden\s*=/);
  assert.match(app, /statusRank/);
  assert.match(app, /aria-pressed/);
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
