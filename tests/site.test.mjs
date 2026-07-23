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
});

test('Vercel設定が有効なJSONである', () => {
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')));
});

test('トップページのタイトルがVisual Study Notesである', () => {
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /<title>小児科 Visual Study Notes<\/title>/);
});
