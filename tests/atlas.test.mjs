import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('アトラスに専門医試験の視覚項目を網羅する140症例以上が登録されている', () => {
  const cases = readJson('data/atlas/cases.json');
  assert.ok(cases.length >= 140, cases.length);
  assert.equal(new Set(cases.map((item) => item.slug)).size, cases.length);
  for (const item of cases) {
    assert.ok(item.images.length >= 1, `${item.slug}: image or source link`);
    assert.ok(item.firstLook.length >= 1, `${item.slug}: firstLook`);
    assert.ok(item.keyFindings.length >= 1, `${item.slug}: keyFindings`);
    assert.ok(item.differentialDiagnoses.length >= 1, `${item.slug}: differential`);
    assert.ok(item.nextTests.length >= 1, `${item.slug}: nextTests`);
    assert.ok(item.initialManagement.length >= 1, `${item.slug}: initialManagement`);
  }
});

test('病理・血液像を16疾患20画像以上収載する', () => {
  const cases = readJson('data/atlas/cases.json');
  const pathologyCases = cases.filter((item) => ['病理・血液', '腫瘍・病理', '消化器・病理'].includes(item.category));
  assert.ok(pathologyCases.length >= 16);
  assert.ok(pathologyCases.flatMap((item) => item.images).length >= 20);
  for (const item of pathologyCases) {
    assert.ok(item.images.every((image) => ['病理', '血液塗抹'].includes(image.modality)), item.slug);
  }
});

test('日本小児科学会の到達目標第8版25分野を、具体的な図表確認の有無と分けて管理する', () => {
  const cases = readJson('data/atlas/cases.json');
  const coverage = readJson('data/atlas/coverage-plan.json');
  assert.equal(coverage.domains.length, 25);
  assert.equal(new Set(coverage.domains.map((domain) => domain.name)).size, 25);
  assert.equal(coverage.source.url, 'https://www.jpeds.or.jp/uploads/files/mokuhyo_8.pdf');
  for (const domain of coverage.domains) {
    assert.equal(domain.coveredTargetCount + domain.missingTargets.length, domain.targetCount, domain.name);
  }
  for (const item of cases) {
    assert.ok(coverage.domains.some((domain) => domain.name === item.curriculumDomain), item.slug);
  }
});

test('画像ごとに完全な出典情報か原典リンク専用指定がある', () => {
  const cases = readJson('data/atlas/cases.json');
  for (const item of cases) {
    for (const image of item.images) {
      assert.ok(image.alt, `${item.slug}: alt`);
      assert.ok(image.description, `${item.slug}: description`);
      const source = image.source;
      for (const key of [
        'sourceType',
        'sourcePageUrl',
        'title',
        'licenseName',
        'redistributionAllowed',
        'modificationAllowed',
        'attributionRequired',
        'modified',
        'pediatricImage',
        'accessedAt',
      ]) {
        assert.notEqual(source[key], undefined, `${item.slug}: source.${key}`);
      }
      if (source.redistributionAllowed) {
        assert.ok(source.localImagePath, `${item.slug}: local image`);
        assert.ok(fs.existsSync(path.join(root, source.localImagePath)), source.localImagePath);
      } else {
        assert.equal(source.sourceType, 'external-link-only', item.slug);
        assert.equal(source.localImagePath, undefined, item.slug);
      }
    }
  }
});

test('ライセンス監査は症例画像と1対1で対応する', () => {
  const cases = readJson('data/atlas/cases.json');
  const audit = readJson('data/atlas/image-license-audit.json');
  const images = cases.flatMap((item) => item.images.map((image) => `${item.slug}:${image.id}`));
  assert.deepEqual(
    audit.map((item) => `${item.caseSlug}:${item.imageId}`).sort(),
    images.sort(),
  );
});

test('検索結果を候補数へ水増しせず、具体的候補の調査状態を明示する', () => {
  const cases = readJson('data/atlas/cases.json');
  const audit = readJson('data/atlas/image-candidate-audit.json');
  const counts = Map.groupBy(audit, (item) => item.caseSlug);
  assert.equal(counts.size, cases.length);
  for (const [slug, candidates] of counts) {
    assert.ok(candidates.some((candidate) => candidate.decision === 'adopted'
      || candidate.decision === 'link-only'), `${slug}: decision`);
    assert.ok(candidates.every((candidate) => candidate.candidateResearchStatus === 'complete'
      || candidate.candidateResearchStatus === 'needs-research'), `${slug}: research status`);
    if (candidates.some((candidate) => candidate.candidateResearchStatus === 'complete')) {
      assert.ok(candidates.length >= 3, `${slug}: ${candidates.length}`);
      assert.ok(candidates.every((candidate) => candidate.figureUrl || candidate.figureReference));
    }
  }
});

test('一覧・詳細・ビューア・安全な外部リンクを実装している', () => {
  for (const file of ['atlas/index.html', 'atlas/case.html', 'atlas/atlas.css', 'atlas/atlas.js']) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
  }
  const script = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
  assert.match(script, /requestFullscreen/);
  assert.match(script, /pointermove/);
  assert.match(script, /wheel/);
  assert.match(script, /annotation/);
  assert.match(script, /data-compare-panel/);
  assert.match(script, /noopener noreferrer/);
  assert.match(script, /pboard:v1:atlas/);
});

test('Vercelで /atlas/:slug を詳細ページへ解決する', () => {
  const config = readJson('vercel.json');
  assert.ok(config.rewrites.some((item) => item.source === '/atlas/:slug'));
});

test('ローカル表示でも症例カードから詳細へ移動できる', () => {
  const script = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
  assert.match(script, /function caseHref/);
  assert.match(script, /case\.html\?slug=/);
  assert.match(script, /localhost|127\.0\.0\.1/);
});

test('一覧カードに試験学習と権利確認に必要な情報を表示する', () => {
  const script = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
  for (const field of ['ageGroup', 'difficulty', 'frequency', 'source.organization', 'source.licenseName']) {
    assert.match(script, new RegExp(field.replace('.', '\\.')), field);
  }
});

test('狭い画面では症例カードを一列にして画像と情報を一体化する', () => {
  const styles = fs.readFileSync(path.join(root, 'atlas/atlas.css'), 'utf8');
  assert.match(styles, /@media\(max-width:760px\)[\s\S]*?\.atlas-grid\{[^}]*grid-template-columns:1fr/);
});

test('詳細ビューアは複数画像の切り替えに対応する', () => {
  const script = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
  assert.match(script, /image-thumbnails/);
  assert.match(script, /data-image-index/);
  assert.match(script, /item\.images/);
});

test('全症例に解説の引用元が登録されている', () => {
  const cases = readJson('data/atlas/cases.json');
  for (const item of cases) {
    assert.ok(item.clinicalReferences?.length >= 1, `${item.slug}: clinicalReferences`);
    for (const reference of item.clinicalReferences) {
      assert.ok(reference.title, `${item.slug}: reference.title`);
      assert.ok(reference.organization, `${item.slug}: reference.organization`);
      assert.match(reference.url, /^https:\/\//, `${item.slug}: reference.url`);
      assert.ok(reference.accessedAt, `${item.slug}: reference.accessedAt`);
    }
  }
});

test('症例詳細に解答・解説と画像出典・解説引用元を分けて表示する', () => {
  const script = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
  assert.match(script, /解答と解説/);
  assert.match(script, /data-reveal-answer/);
  assert.match(script, /画像出典/);
  assert.match(script, /解説の引用元/);
  assert.match(script, /clinicalReferences/);
});

test('クイズモードを詳細ページへ引き継ぐ', () => {
  const script = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
  assert.match(script, /writeState\('quiz'/);
  assert.match(script, /readState\('quiz'/);
  assert.match(script, /case-answer-hidden/);
});

test('画像主役の標本台帳として統一し、AI的なカード装飾を使わない', () => {
  const index = fs.readFileSync(path.join(root, 'atlas/index.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'atlas/atlas.css'), 'utf8');

  assert.match(index, /atlas-ledger/);
  assert.match(script, /case-dossier/);
  assert.doesNotMatch(script, /Answer &amp; rationale|learning-card|atlas-card__badge/);
  assert.doesNotMatch(styles, /gradient\(|box-shadow:/);
});

test('25分野ナビ・学習状態・頻出順で症例を探せる', () => {
  const index = fs.readFileSync(path.join(root, 'atlas/index.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
  for (const id of ['domain-rail', 'study-filter', 'availability-filter', 'sort-order', 'reset-filters', 'focus-toggle', 'learning-progress-bar', 'load-more']) {
    assert.match(index, new RegExp(`id="${id}"`), id);
  }
  assert.match(script, /renderDomainRail/);
  assert.match(script, /sort: 'frequency'/);
  assert.match(script, /b\.frequency - a\.frequency/);
  assert.match(script, /state\.study === 'unlearned'/);
  assert.match(script, /state\.limit \+= 24/);
});

test('アトラスは覚えた症例を既定で隠し、あやしい症例を先に表示する', () => {
  const script = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
  assert.match(script, /showKnown:\s*false/);
  assert.match(script, /state\.showKnown/);
  assert.match(script, /masteryRank/);
  assert.match(script, /覚えた.*件を表示/);
  assert.match(script, /if \(state\.study\) renderIndex\(\);|renderIndex\(\)/);
  assert.match(script, /cases\.json\?v=20260731k/);
  assert.match(script, /coverage-plan\.json\?v=20260731k/);
});

test('転載できない症例も空欄にせず、原典と区別した学習用模式図を表示する', () => {
  const script = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'atlas/atlas.css'), 'utf8');
  assert.match(script, /function schematicVisual/);
  assert.match(script, /学習用模式図/);
  assert.match(script, /原典画像ではありません/);
  assert.match(styles, /\.schematic-visual/);
});

test('症例詳細に観察チェックリストと端末内メモを備える', () => {
  const script = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
  assert.match(script, /observationWorkbench/);
  assert.match(script, /data-observation-key/);
  assert.match(script, /data-note-key/);
  assert.match(script, /BEFORE THE ANSWER/);
});
