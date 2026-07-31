import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const cases = readJson('data/atlas/cases.json');
const audits = readJson('data/atlas/image-license-audit.json');
const candidates = readJson('data/atlas/image-candidate-audit.json');
const coverage = readJson('data/atlas/coverage-plan.json');
const errors = [];
const warnings = [];
const hashes = new Map();

function check(condition, message) {
  if (!condition) errors.push(message);
}

check(cases.length >= 140, `専門医試験の視覚項目を網羅するため140症例以上が必要です（現在${cases.length}件）`);
check(new Set(cases.map((item) => item.slug)).size === cases.length, '症例slugが重複しています');
check(coverage.domains?.length === 25, `到達目標の25分野が必要です（現在${coverage.domains?.length || 0}分野）`);
check(new Set(coverage.domains?.map((domain) => domain.name)).size === 25, '到達目標分野名が重複しています');
check(coverage.source?.url === 'https://www.jpeds.or.jp/uploads/files/mokuhyo_8.pdf',
  '到達目標改訂第8版の原典URLがありません');
check(coverage.domains.every((domain) =>
  domain.coveredTargetCount + domain.missingTargets.length === domain.targetCount),
  '到達目標の確認済み項目と未確認項目の集計が一致しません');

for (const item of cases) {
  check(/^[a-z0-9-]+$/.test(item.slug), `${item.slug}: slugが安全な形式ではありません`);
  check(item.images.length >= 1, `${item.slug}: 画像または原典リンクがありません`);
  check(Boolean(item.curriculumDomain), `${item.slug}: 到達目標分野がありません`);
  const domain = coverage.domains.find((entry) => entry.name === item.curriculumDomain);
  check(Boolean(domain),
    `${item.slug}: 到達目標分野が網羅表にありません (${item.curriculumDomain})`);
  for (const target of item.coverageTargets || []) {
    check(domain?.targetVisuals.includes(target),
      `${item.slug}: 網羅項目が領域の目標と一致しません (${target})`);
  }
  check(item.clinicalReferences?.length >= 1, `${item.slug}: 解説の引用元がありません`);
  for (const reference of item.clinicalReferences || []) {
    check(Boolean(reference.title), `${item.slug}: 引用元タイトルがありません`);
    check(Boolean(reference.organization), `${item.slug}: 引用元組織名がありません`);
    check(/^https:\/\//.test(reference.url || ''), `${item.slug}: 引用元URLがHTTPSではありません`);
    check(Boolean(reference.accessedAt), `${item.slug}: 引用元の確認日がありません`);
  }
  for (const image of item.images) {
    const source = image.source || {};
    check(Boolean(image.alt?.trim()), `${item.slug}/${image.id}: altがありません`);
    for (const key of ['sourcePageUrl', 'licenseName', 'attributionRequired', 'redistributionAllowed', 'accessedAt']) {
      check(source[key] !== undefined && source[key] !== '', `${item.slug}/${image.id}: source.${key}がありません`);
    }
    check(/^https:\/\//.test(source.sourcePageUrl), `${item.slug}/${image.id}: 出典URLがHTTPSではありません`);
    if (source.redistributionAllowed) {
      check(Boolean(source.localImagePath), `${item.slug}/${image.id}: ローカル画像パスがありません`);
      if (!source.localImagePath) continue;
      check(/^assets\/atlas\/[a-z0-9-]+\.(?:jpe?g|png)$/i.test(source.localImagePath),
        `${item.slug}/${image.id}: ファイル名が安全な形式ではありません`);
      const fullPath = path.join(root, source.localImagePath);
      check(fs.existsSync(fullPath), `${item.slug}/${image.id}: ${source.localImagePath}が存在しません`);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        check(stat.size > 1_000, `${item.slug}/${image.id}: 画像ファイルが小さすぎます`);
        check(stat.size <= 3_000_000, `${item.slug}/${image.id}: 画像が3MBを超えています`);
        const hash = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
        check(!hashes.has(hash), `${item.slug}/${image.id}: ${hashes.get(hash)}と画像が重複しています`);
        hashes.set(hash, `${item.slug}/${image.id}`);
      }
      check(!/未確認|不明/.test(source.licenseName), `${item.slug}/${image.id}: ライセンス不明画像を収載しています`);
    } else {
      check(source.sourceType === 'external-link-only', `${item.slug}/${image.id}: link-only指定がありません`);
      check(!source.localImagePath && !image.src, `${item.slug}/${image.id}: 利用不可画像がローカル参照されています`);
    }
  }
}

const imageKeys = cases.flatMap((item) => item.images.map((image) => `${item.slug}:${image.id}`)).sort();
const auditKeys = audits.map((item) => `${item.caseSlug}:${item.imageId}`).sort();
check(JSON.stringify(imageKeys) === JSON.stringify(auditKeys), 'ライセンス監査が症例画像と一致しません');
for (const row of audits) {
  check(['verified', 'needs-research'].includes(row.verificationStatus),
    `${row.caseSlug}/${row.imageId}: 画像確認状態がありません`);
  check(Boolean(row.checkedBy) && Boolean(row.checkMethod),
    `${row.caseSlug}/${row.imageId}: 確認者または確認方法がありません`);
  if (row.verificationStatus === 'needs-research') {
    check(row.checkedBy === '未確認',
      `${row.caseSlug}/${row.imageId}: 未確認図版を確認済みとして記録しています`);
  }
}

for (const item of cases) {
  const rows = candidates.filter((candidate) => candidate.caseSlug === item.slug);
  const selected = rows.filter((candidate) => ['adopted', 'link-only'].includes(candidate.decision));
  check(selected.length >= item.images.length, `${item.slug}: 収載画像の候補監査が不足しています`);
  for (const candidate of selected) {
    check(['complete', 'needs-research'].includes(candidate.candidateResearchStatus),
      `${item.slug}/${candidate.imageId}: 候補調査状態がありません`);
    if (candidate.decision === 'adopted') {
      check(candidate.score.total >= 20, `${item.slug}/${candidate.imageId}: 採用画像の評価が20点未満です`);
    }
  }
}

const ui = fs.readFileSync(path.join(root, 'atlas/atlas.js'), 'utf8');
check(/source-strip/.test(ui), '出典カード表示が実装されていません');
check(/target="_blank" rel="noopener noreferrer"/.test(ui), '外部リンクの安全属性がありません');
check(/requestFullscreen/.test(ui) && /pointermove/.test(ui) && /wheel/.test(ui),
  'ズーム・パン・全画面機能が不足しています');

if (process.argv.includes('--online')) {
  const urls = [...new Set(cases.flatMap((item) => [
    ...item.images.flatMap((image) => [
      image.source.sourcePageUrl,
      image.source.imageUrl,
    ].filter(Boolean)),
    ...(item.clinicalReferences || []).map((reference) => reference.url),
  ]))];
  const queue = [...urls];
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      try {
        let response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          headers: { 'User-Agent': 'AMPL-Pediatric-Atlas-Validator/1.0' },
        });
        if ([405, 406].includes(response.status)) {
          response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: { 'User-Agent': 'AMPL-Pediatric-Atlas-Validator/1.0' },
          });
        }
        if (!response.ok && ![401, 403, 405, 406, 429].includes(response.status)) errors.push(`URL ${response.status}: ${url}`);
        if ([401, 403, 405, 406].includes(response.status)) warnings.push(`自動確認を拒否されたため未確認: ${url}`);
        if (response.status === 429) warnings.push(`レート制限のため未確認: ${url}`);
      } catch (error) {
        warnings.push(`接続失敗のため未確認: ${url} (${error.message})`);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
}

warnings.forEach((message) => console.warn(`WARN ${message}`));
if (errors.length) {
  errors.forEach((message) => console.error(`ERROR ${message}`));
  process.exitCode = 1;
} else {
  console.log(`Atlas validation passed: ${cases.length} cases, ${hashes.size} local images, ${audits.length} audits.`);
}
