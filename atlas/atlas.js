(function () {
  'use strict';

  var STORE = 'pboard:v1:atlas';
  var state = {
    cases: [], coverage: null, query: '', category: '', modality: '', domain: '',
    study: '', availability: '', sort: 'frequency', quiz: false, showKnown: false, limit: 24,
  };

  function readState(key) {
    try { return localStorage.getItem(STORE + ':' + key); } catch (_) { return null; }
  }
  function writeState(key, value) {
    try {
      if (value === '' || value == null) localStorage.removeItem(STORE + ':' + key);
      else localStorage.setItem(STORE + ':' + key, value);
      return true;
    } catch (_) {
      return false;
    }
  }
  function getMastery(slug) {
    var value = readState('mastery:' + slug);
    if (value === 'known' || value === 'shaky') return value;
    return readState('learned:' + slug) === '1' ? 'known' : '';
  }
  function setMastery(slug, value) {
    var saved = writeState('mastery:' + slug, value);
    if (!saved) return false;
    writeState('learned:' + slug, value === 'known' ? '1' : '0');
    return true;
  }
  function showStorageWarning() {
    var warning = document.getElementById('atlas-storage-warning');
    if (!warning) {
      warning = document.createElement('div');
      warning.id = 'atlas-storage-warning';
      warning.className = 'storage-warning';
      warning.setAttribute('role', 'alert');
      warning.textContent = 'この環境では学習状態を端末に保存できません。ブラウザのストレージ設定を確認してください。';
      document.body.prepend(warning);
    }
  }
  function safeExternal(link) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }
  function escapeText(value) {
    var node = document.createElement('span');
    node.textContent = value == null ? '' : String(value);
    return node.innerHTML;
  }
  function schematicVisual(image, compact) {
    var modality = String(image.modality || '画像');
    var motif = '';
    if (/心電図|脳波|ECG|EEG/.test(modality)) {
      motif = '<polyline points="36,164 90,164 108,140 124,205 146,82 168,164 210,164 230,132 247,181 267,164 444,164"/>';
    } else if (/超音波|心エコー/.test(modality)) {
      motif = '<path d="M240 42 L86 248 H394 Z"/><path d="M154 196 Q240 128 326 196"/><path d="M184 221 Q240 176 296 221"/>';
    } else if (/病理|塗抹|骨髄|顕微鏡|細胞/.test(modality)) {
      motif = '<circle cx="142" cy="112" r="42"/><circle cx="238" cy="170" r="56"/><circle cx="350" cy="105" r="35"/><circle cx="121" cy="218" r="24"/><circle cx="360" cy="218" r="44"/><circle class="schematic-fill" cx="238" cy="170" r="18"/>';
    } else if (/皮膚|写真|眼底|耳鏡|口腔|身体所見|ダーモ/.test(modality)) {
      motif = '<circle cx="240" cy="150" r="104"/><path d="M150 168 Q198 106 240 154 T332 145"/><circle class="schematic-fill" cx="196" cy="122" r="13"/><circle class="schematic-fill" cx="285" cy="194" r="18"/>';
    } else if (/曲線|フロー|表|評価|書式|スケジュール|ノモグラム|検査/.test(modality)) {
      motif = '<path d="M76 52 V244 H424"/><polyline points="84,218 146,196 205,201 270,142 332,154 412,78"/><rect x="116" y="76" width="88" height="44"/><rect x="286" y="192" width="96" height="38"/>';
    } else {
      motif = '<ellipse cx="240" cy="150" rx="132" ry="104"/><ellipse cx="240" cy="150" rx="74" ry="58"/><path d="M82 150 H398 M240 42 V258"/><path d="M139 92 Q240 150 341 92 M139 208 Q240 150 341 208"/>';
    }
    return '<div class="schematic-visual' + (compact ? ' schematic-visual--compact' : '')
      + '" role="img" aria-label="' + escapeText(modality)
      + 'の学習用模式図。原典画像ではありません">'
      + '<svg viewBox="0 0 480 300" aria-hidden="true"><rect width="480" height="300"/>'
      + '<g>' + motif + '</g></svg><span>学習用模式図 · ' + escapeText(modality) + '</span></div>';
  }
  function caseHref(slug) {
    var encoded = encodeURIComponent(slug);
    var localPreview = location.protocol === 'file:'
      || location.hostname === 'localhost'
      || location.hostname === '127.0.0.1';
    return localPreview ? '/atlas/case.html?slug=' + encoded : '/atlas/' + encoded;
  }

  async function loadAtlasData() {
    var responses = await Promise.all([
      fetch('/data/atlas/cases.json?v=20260731k'),
      fetch('/data/atlas/coverage-plan.json?v=20260731k'),
    ]);
    if (!responses[0].ok || !responses[1].ok) throw new Error('症例データを取得できませんでした。');
    return Promise.all(responses.map(function (response) { return response.json(); }));
  }

  function setupTheme() {
    var siteTheme = 'light';
    try {
      siteTheme = localStorage.getItem('pboard:theme')
        || (window.matchMedia && matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
    } catch (_) {}
    document.documentElement.setAttribute('data-theme', siteTheme);
    var siteButton = document.getElementById('site-theme-toggle');
    function renderSiteTheme() {
      if (siteButton) siteButton.textContent = siteTheme === 'dark' ? '☀️' : '🌙';
    }
    if (siteButton) {
      renderSiteTheme();
      siteButton.addEventListener('click', function () {
        siteTheme = siteTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', siteTheme);
        try { localStorage.setItem('pboard:theme', siteTheme); } catch (_) {}
        renderSiteTheme();
      });
    }
    var light = readState('image-theme') === 'light';
    document.body.classList.toggle('image-light', light);
    var button = document.getElementById('theme-toggle');
    if (!button) return;
    button.setAttribute('aria-pressed', String(light));
    button.textContent = light ? '画像背景：白' : '画像背景：黒';
    button.addEventListener('click', function () {
      var nextLight = !light;
      if (!writeState('image-theme', nextLight ? 'light' : 'dark')) {
        showStorageWarning();
        return;
      }
      light = nextLight;
      document.body.classList.toggle('image-light', light);
      button.setAttribute('aria-pressed', String(light));
      button.textContent = light ? '画像背景：白' : '画像背景：黒';
    });
  }

  function renderIndex() {
    var grid = document.getElementById('atlas-grid');
    var values = state.cases.filter(function (item) {
      var haystack = [
        item.title, item.category, item.clinicalSummary,
        item.images[0].modality, item.keyFindings.join(' '),
      ].join(' ').toLowerCase();
      return (!state.query || haystack.indexOf(state.query) >= 0)
        && (!state.category || item.category === state.category)
        && (!state.modality || item.images.some(function (image) { return image.modality === state.modality; }))
        && (!state.availability
          || (state.availability === 'local' && item.images.some(function (image) { return Boolean(image.src); }))
          || (state.availability === 'link' && item.images.every(function (image) { return !image.src; })))
        && (!state.domain || item.curriculumDomain === state.domain)
        && (state.showKnown || state.study || getMastery(item.slug) !== 'known')
        && (!state.study
          || (state.study === 'learned' && getMastery(item.slug) === 'known')
          || (state.study === 'shaky' && getMastery(item.slug) === 'shaky')
          || (state.study === 'unlearned' && getMastery(item.slug) === '')
          || (state.study === 'favorite' && readState('favorite:' + item.slug) === '1'));
    });
    function masteryRank(item) {
      var mastery = getMastery(item.slug);
      return mastery === 'shaky' ? 0 : mastery === 'known' ? 2 : 1;
    }
    values.sort(function (a, b) {
      var focusOrder = masteryRank(a) - masteryRank(b);
      if (focusOrder) return focusOrder;
      if (state.sort === 'newest') return b.id - a.id;
      if (state.sort === 'difficulty') return b.difficulty - a.difficulty || b.frequency - a.frequency;
      if (state.sort === 'number') return a.id - b.id;
      return b.frequency - a.frequency || b.typicality - a.typicality || a.id - b.id;
    });
    grid.innerHTML = '';
    values.slice(0, state.limit).forEach(function (item) {
      var image = item.images[0];
      var source = image.source;
      var article = document.createElement('article');
      article.className = 'atlas-card';
      var visual = image.src
        ? '<img src="' + escapeText(image.src) + '" alt="' + escapeText(image.alt) + '" loading="lazy" decoding="async">'
        : schematicVisual(image, true);
      article.innerHTML =
        '<a class="atlas-card__main" href="' + caseHref(item.slug) + '">'
        + '<div class="atlas-card__image">' + visual
        + '<span class="atlas-card__domain">' + escapeText(item.curriculumDomain) + '</span>'
        + (source.pediatricImage === false
          ? '<span class="atlas-card__age-note">成人参考画像</span>'
          : source.pediatricImage !== true ? '<span class="atlas-card__age-note">小児画像未確認</span>' : '')
        + '</div>'
        + '<div class="atlas-card__body"><div class="atlas-card__title-row"><p class="case-no">'
        + String(item.id).padStart(2, '0') + '</p><span>' + escapeText(image.modality) + ' / ' + escapeText(item.category) + '</span></div>'
        + '<h2>' + escapeText(item.title) + '</h2>'
        + '<p class="atlas-card__finding">' + escapeText(item.keyFindings[0]) + '</p>'
        + '<dl class="atlas-card__meta"><div><dt>年齢</dt><dd>' + escapeText(item.ageGroup) + '</dd></div>'
        + '<div><dt>難易度</dt><dd>' + item.difficulty + '/3</dd></div><div><dt>頻出度</dt><dd>' + item.frequency + '/5</dd></div>'
        + '<div><dt>典型度</dt><dd>' + item.typicality + '/5</dd></div></dl>'
        + '<p class="atlas-card__source"><span>' + escapeText(source.organization || source.copyrightHolder || '原典') + '</span>'
        + '<span>' + escapeText(source.licenseName) + '</span></p></div></a>'
        + '<div class="card-actions"><div class="mastery-seg" aria-label="習得状況">'
        + '<button class="card-action" type="button" data-mastery="" aria-label="未学習にする">未</button>'
        + '<button class="card-action" type="button" data-mastery="shaky" aria-label="あやしいにする">あやしい</button>'
        + '<button class="card-action" type="button" data-mastery="known" aria-label="覚えたにする">覚えた</button></div>'
        + '<button class="card-action card-action--save" type="button" data-action="favorite" aria-label="お気に入りにする">保存</button></div>';
      article.querySelectorAll('[data-mastery]').forEach(function (button) {
        var activeMastery = getMastery(item.slug) === button.dataset.mastery;
        button.classList.toggle('is-active', activeMastery);
        button.setAttribute('aria-pressed', String(activeMastery));
        button.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          if (!setMastery(item.slug, button.dataset.mastery)) {
            showStorageWarning();
            return;
          }
          article.querySelectorAll('[data-mastery]').forEach(function (entry) {
            entry.classList.toggle('is-active', entry === button);
            entry.setAttribute('aria-pressed', String(entry === button));
          });
          updateLearningProgress();
          if (button.dataset.mastery === 'known' && !state.showKnown && !state.study) {
            article.classList.add('is-mastered-away');
            window.setTimeout(renderIndex, 220);
          } else {
            renderIndex();
          }
        });
      });
      var favorite = article.querySelector('[data-action="favorite"]');
      favorite.classList.toggle('is-active', readState('favorite:' + item.slug) === '1');
      favorite.setAttribute('aria-pressed', String(favorite.classList.contains('is-active')));
      favorite.textContent = favorite.classList.contains('is-active') ? '保存済み' : '保存';
      favorite.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var active = !favorite.classList.contains('is-active');
        if (!writeState('favorite:' + item.slug, active ? '1' : '0')) {
          showStorageWarning();
          return;
        }
        favorite.classList.toggle('is-active', active);
        favorite.setAttribute('aria-pressed', String(active));
        favorite.textContent = active ? '保存済み' : '保存';
        if (state.study === 'favorite') renderIndex();
      });
      grid.appendChild(article);
    });
    document.getElementById('result-count').textContent = values.length + '件';
    document.getElementById('visible-count').textContent = Math.min(values.length, state.limit);
    document.getElementById('filtered-total').textContent = values.length;
    document.getElementById('load-more-row').hidden = values.length <= state.limit;
    var contexts = [];
    if (state.domain) contexts.push(state.domain);
    if (state.category) contexts.push(state.category);
    if (state.modality) contexts.push(state.modality);
    if (state.availability) contexts.push(state.availability === 'local' ? '実画像' : '原典参照');
    if (state.study) contexts.push({ learned: '覚えた', shaky: 'あやしい', unlearned: '未学習', favorite: '保存済み' }[state.study]);
    if (state.query) contexts.push('「' + state.query + '」');
    document.getElementById('result-context').textContent = contexts.length
      ? contexts.join('・') + 'で絞り込み中'
      : state.showKnown ? 'あやしい → 未学習 → 覚えた の順で表示'
        : '集中対象だけを表示 · 覚えた症例は一旦非表示';
    document.getElementById('empty-state').hidden = values.length !== 0;
    var focusButton = document.getElementById('focus-toggle');
    if (focusButton) {
      var knownCount = state.cases.filter(function (item) {
        return getMastery(item.slug) === 'known';
      }).length;
      focusButton.textContent = state.showKnown ? '覚えた症例を隠す' : '覚えた' + knownCount + '件を表示';
      focusButton.setAttribute('aria-pressed', String(state.showKnown));
    }
  }

  function updateLearningProgress() {
    var learned = state.cases.filter(function (item) {
      return getMastery(item.slug) === 'known';
    }).length;
    var shaky = state.cases.filter(function (item) {
      return getMastery(item.slug) === 'shaky';
    }).length;
    document.getElementById('learned-count').textContent = learned;
    document.getElementById('shaky-count').textContent = shaky;
    document.getElementById('learning-total').textContent = state.cases.length;
    document.getElementById('learning-progress-bar').style.width =
      (state.cases.length ? learned / state.cases.length * 100 : 0) + '%';
  }

  function renderDomainRail() {
    var rail = document.getElementById('domain-rail');
    rail.innerHTML = '<button type="button" class="domain-chip is-active" data-domain="">'
      + '<span>00</span><strong>すべて</strong><small>' + state.cases.length + '</small></button>';
    state.coverage.domains.forEach(function (domain) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'domain-chip domain-chip--' + domain.status;
      button.dataset.domain = domain.name;
      button.disabled = domain.currentCaseCount === 0;
      button.title = domain.coveredTargetCount + '/' + domain.targetCount + '項目 · ' + domain.currentCaseCount + '症例';
      button.innerHTML = '<span>' + String(domain.id).padStart(2, '0') + '</span><strong>'
        + escapeText(domain.name) + '</strong><small>' + domain.coveredTargetCount + '/' + domain.targetCount + '</small>';
      rail.appendChild(button);
    });
    rail.addEventListener('click', function (event) {
      var button = event.target.closest('[data-domain]');
      if (!button || button.disabled) return;
      state.domain = button.dataset.domain;
      state.limit = 24;
      rail.querySelectorAll('[data-domain]').forEach(function (entry) {
        entry.classList.toggle('is-active', entry === button);
      });
      renderIndex();
      document.getElementById('atlas-grid').scrollIntoView({ block: 'start' });
    });
  }

  function setupIndex() {
    var categories = Array.from(new Set(state.cases.map(function (item) { return item.category; }))).sort();
    var modalities = Array.from(new Set(state.cases.flatMap(function (item) {
      return item.images.map(function (image) { return image.modality; });
    }))).sort();
    var category = document.getElementById('category-filter');
    var modality = document.getElementById('modality-filter');
    var availability = document.getElementById('availability-filter');
    var study = document.getElementById('study-filter');
    var sort = document.getElementById('sort-order');
    var focus = document.getElementById('focus-toggle');
    state.showKnown = readState('show-known') === '1';
    categories.forEach(function (value) { category.add(new Option(value, value)); });
    modalities.forEach(function (value) { modality.add(new Option(value, value)); });
    var allImages = state.cases.flatMap(function (item) { return item.images; });
    document.getElementById('domain-count').textContent = state.coverage.domains.filter(function (domain) {
      return domain.coveredTargetCount > 0;
    }).length;
    var coveredTargets = state.coverage.domains.reduce(function (sum, domain) {
      return sum + domain.coveredTargetCount;
    }, 0);
    var totalTargets = state.coverage.domains.reduce(function (sum, domain) {
      return sum + domain.targetCount;
    }, 0);
    document.getElementById('target-progress').textContent = coveredTargets + '/' + totalTargets + '項目';
    document.getElementById('case-count').textContent = state.cases.length;
    document.getElementById('image-count').textContent = allImages.filter(function (image) { return image.src; }).length;
    document.getElementById('link-count').textContent = allImages.filter(function (image) { return !image.src; }).length;
    renderDomainRail();
    updateLearningProgress();
    function refilter() {
      state.limit = 24;
      renderIndex();
    }
    document.getElementById('atlas-search').addEventListener('input', function (event) {
      state.query = event.target.value.trim().toLowerCase(); refilter();
    });
    category.addEventListener('change', function (event) { state.category = event.target.value; refilter(); });
    modality.addEventListener('change', function (event) { state.modality = event.target.value; refilter(); });
    availability.addEventListener('change', function (event) { state.availability = event.target.value; refilter(); });
    study.addEventListener('change', function (event) { state.study = event.target.value; refilter(); });
    sort.addEventListener('change', function (event) { state.sort = event.target.value; refilter(); });
    function renderFocusButton() {
      var known = state.cases.filter(function (item) { return getMastery(item.slug) === 'known'; }).length;
      focus.textContent = state.showKnown ? '覚えた症例を隠す' : '覚えた' + known + '件を表示';
      focus.setAttribute('aria-pressed', String(state.showKnown));
    }
    focus.addEventListener('click', function () {
      var next = !state.showKnown;
      if (!writeState('show-known', next ? '1' : '0')) {
        showStorageWarning();
        return;
      }
      state.showKnown = next;
      state.limit = 24;
      renderFocusButton();
      renderIndex();
    });
    document.getElementById('load-more').addEventListener('click', function () {
      state.limit += 24;
      renderIndex();
    });
    document.getElementById('reset-filters').addEventListener('click', function () {
      state.query = ''; state.category = ''; state.modality = ''; state.domain = ''; state.study = '';
      state.availability = ''; state.limit = 24;
      document.getElementById('atlas-search').value = '';
      category.value = ''; modality.value = ''; availability.value = ''; study.value = '';
      document.querySelectorAll('.domain-chip').forEach(function (button, index) {
        button.classList.toggle('is-active', index === 0);
      });
      renderIndex();
    });
    renderFocusButton();
    var quiz = document.getElementById('quiz-toggle');
    state.quiz = readState('quiz') === '1';
    document.body.classList.toggle('quiz-mode', state.quiz);
    quiz.setAttribute('aria-pressed', String(state.quiz));
    quiz.textContent = state.quiz ? '診断を表示' : '診断を隠す';
    quiz.addEventListener('click', function () {
      var nextQuiz = !state.quiz;
      if (!writeState('quiz', nextQuiz ? '1' : '0')) {
        showStorageWarning();
        return;
      }
      state.quiz = nextQuiz;
      document.body.classList.toggle('quiz-mode', state.quiz);
      quiz.setAttribute('aria-pressed', String(state.quiz));
      quiz.textContent = state.quiz ? '診断を表示' : '診断を隠す';
      renderIndex();
    });
    renderIndex();
  }

  function list(items) {
    return '<ul>' + items.map(function (item) { return '<li>' + escapeText(item) + '</li>'; }).join('') + '</ul>';
  }
  function studySection(number, title, body, size) {
    return '<section class="study-section study-section--' + (size || 'half') + '"><header><span>'
      + String(number).padStart(2, '0') + '</span><h2>' + escapeText(title) + '</h2></header><div class="study-section__body">'
      + body + '</div></section>';
  }
  function sourceTable(source) {
    var entries = [
      ['画像タイトル', source.title], ['著者・著作権者', source.copyrightHolder || source.organization],
      ['掲載元', source.organization], ['原典URL', source.sourcePageUrl], ['DOI', source.doi],
      ['PubMed', source.pubmedId], ['ライセンス', source.licenseName],
      ['ライセンスURL', source.licenseUrl], ['再配布', source.redistributionAllowed ? '可' : '不可・未確認'],
      ['改変', source.modificationAllowed ? '可' : '不可・未確認'],
      ['改変内容', source.modified ? source.modificationDescription : 'なし'],
      ['小児画像', source.pediatricImage === true ? 'はい（原典の年齢根拠あり）'
        : source.pediatricImage === false ? 'いいえ（成人参考画像）' : '未確認'],
      ['症例年齢', source.patientAge], ['取得日', source.accessedAt],
    ].filter(function (entry) { return entry[1] !== undefined && entry[1] !== ''; });
    return '<dl class="source-table">' + entries.map(function (entry) {
      var value = /^https:\/\//.test(String(entry[1]))
        ? '<a href="' + escapeText(entry[1]) + '" target="_blank" rel="noopener noreferrer">' + escapeText(entry[1]) + '</a>'
        : escapeText(entry[1]);
      return '<dt>' + escapeText(entry[0]) + '</dt><dd>' + value + '</dd>';
    }).join('') + '</dl>';
  }
  function clinicalReferenceList(references) {
    return '<ol class="clinical-references">' + references.map(function (reference, index) {
      return '<li><span>[' + (index + 1) + ']</span><div><a href="' + escapeText(reference.url)
        + '" target="_blank" rel="noopener noreferrer">' + escapeText(reference.title) + '</a>'
        + '<p>' + escapeText(reference.organization) + ' · 確認日 ' + escapeText(reference.accessedAt)
        + ' · ' + escapeText(reference.scope || '症例解説') + '</p></div></li>';
    }).join('') + '</ol>';
  }
  function observationWorkbench(item) {
    var steps = [
      ['anatomy', '解剖・部位', 'まず正常構造と左右差を確認する'],
      ['finding', '所見を言語化', item.firstLook.join('／')],
      ['differential', '鑑別を3つ挙げる', '年齢と臨床経過を画像に統合する'],
    ];
    return '<section class="observation-workbench" aria-labelledby="observation-heading">'
      + '<div class="observation-workbench__guide"><p class="observation-label">BEFORE THE ANSWER</p>'
      + '<h2 id="observation-heading">画像を読む</h2><ol>'
      + steps.map(function (step, index) {
        var key = 'observe:' + item.slug + ':' + step[0];
        var checked = readState(key) === '1';
        return '<li><label><input type="checkbox" data-observation-key="' + escapeText(key) + '"'
          + (checked ? ' checked' : '') + '><span><b>' + String(index + 1).padStart(2, '0') + '</b><strong>'
          + escapeText(step[1]) + '</strong><small>' + escapeText(step[2]) + '</small></span></label></li>';
      }).join('') + '</ol></div>'
      + '<div class="observation-notes"><label for="case-note">自分の所見メモ</label>'
      + '<textarea id="case-note" data-note-key="note:' + escapeText(item.slug)
      + '" placeholder="例：左右差、分布、濃度、形、鑑別…">' + escapeText(readState('note:' + item.slug) || '') + '</textarea>'
      + '<div><span data-note-status>この端末に保存</span><button type="button" data-jump-answer>解答へ進む ↓</button></div>'
      + '</div></section>';
  }

  function setupViewer(image) {
    var stage = document.querySelector('.viewer-stage');
    var canvas = document.querySelector('.viewer-canvas');
    if (!stage || !canvas || !image.src) return;
    var transform = { scale: 1, x: 0, y: 0 };
    var pointers = new Map();
    var previousDistance = 0;
    function apply() {
      transform.scale = Math.max(1, Math.min(6, transform.scale));
      canvas.style.transform = 'translate(' + transform.x + 'px,' + transform.y + 'px) scale(' + transform.scale + ')';
    }
    function zoom(delta) {
      transform.scale += delta;
      if (transform.scale <= 1) { transform.scale = 1; transform.x = 0; transform.y = 0; }
      apply();
    }
    stage.addEventListener('wheel', function (event) {
      event.preventDefault(); zoom(event.deltaY < 0 ? .25 : -.25);
    }, { passive: false });
    stage.addEventListener('pointerdown', function (event) {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      stage.setPointerCapture(event.pointerId); stage.classList.add('is-dragging');
    });
    stage.addEventListener('pointermove', function (event) {
      if (!pointers.has(event.pointerId)) return;
      var old = pointers.get(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      var points = Array.from(pointers.values());
      if (points.length === 1 && transform.scale > 1) {
        transform.x += event.clientX - old.x; transform.y += event.clientY - old.y; apply();
      } else if (points.length === 2) {
        var distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        if (previousDistance) zoom((distance - previousDistance) / 180);
        previousDistance = distance;
      }
    });
    function release(event) {
      pointers.delete(event.pointerId); previousDistance = 0;
      if (!pointers.size) stage.classList.remove('is-dragging');
    }
    stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release);
    document.querySelector('[data-zoom-in]').addEventListener('click', function () { zoom(.3); });
    document.querySelector('[data-zoom-out]').addEventListener('click', function () { zoom(-.3); });
    document.querySelector('[data-reset]').addEventListener('click', function () {
      transform = { scale: 1, x: 0, y: 0 }; apply();
    });
    document.querySelector('[data-fullscreen]').addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else stage.requestFullscreen();
    });
    var annotationButton = document.querySelector('[data-annotations]');
    var layer = document.querySelector('.annotation-layer');
    annotationButton.disabled = !image.annotations || !image.annotations.length;
    annotationButton.addEventListener('click', function () {
      layer.hidden = !layer.hidden;
      annotationButton.setAttribute('aria-pressed', String(!layer.hidden));
    });
  }

  function renderCase(item, selectedImageIndex) {
    var imageIndex = Number.isInteger(selectedImageIndex) ? selectedImageIndex : 0;
    var image = item.images[imageIndex] || item.images[0];
    var source = image.source;
    var references = item.clinicalReferences || [];
    var currentPosition = state.cases.findIndex(function (entry) { return entry.slug === item.slug; });
    var previousCase = state.cases[currentPosition - 1];
    var nextCase = state.cases[currentPosition + 1];
    var answerHidden = readState('quiz') === '1';
    document.body.classList.toggle('case-answer-hidden', answerHidden);
    document.title = (answerHidden ? 'CASE ' + String(item.id).padStart(2, '0') : item.title)
      + ' | 小児科画像アトラス';
    var annotations = (image.annotations || []).map(function (annotation) {
      return '<div class="annotation annotation--' + escapeText(annotation.type) + '" style="left:'
        + annotation.x * 100 + '%;top:' + annotation.y * 100 + '%;width:' + (annotation.width || .08) * 100
        + '%;height:' + (annotation.height || .08) * 100 + '%"><span>' + escapeText(annotation.label || '') + '</span></div>';
    }).join('');
    var concreteFigure = Boolean(source.figureUrl || source.figureReference);
    var viewer = image.src
      ? '<div class="viewer-canvas"><img class="viewer-image" src="' + escapeText(image.src) + '" alt="' + escapeText(image.alt) + '">'
        + '<div class="annotation-layer" hidden>' + annotations + '</div></div>'
      : '<div class="external-viewer"><div>' + schematicVisual(image, false)
        + '<p class="external-viewer__label">'
        + (concreteFigure ? '原典参照画像' : '図版候補を調査中') + '</p><h2>'
        + (concreteFigure ? 'この画像は転載していません' : '具体的な図版はまだ特定できていません') + '</h2><p>'
        + (concreteFigure
          ? '再利用条件を確定できないため、原典サイトで閲覧してください。所見解説と出典情報はこのページで確認できます。'
          : '参考資料へのリンクです。該当する図版・症例年齢・権利情報は未確認のため、収載達成数には含めていません。')
        + '</p><a href="' + escapeText(source.figureUrl || source.sourcePageUrl)
        + '" target="_blank" rel="noopener noreferrer">'
        + (concreteFigure ? '原典で画像を見る ↗' : '参考資料を開く ↗') + '</a></div></div>';
    var thumbnails = '<div class="image-thumbnails" aria-label="症例画像">'
      + item.images.map(function (entry, index) {
        var thumb = entry.src
          ? '<img src="' + escapeText(entry.src) + '" alt="">'
          : schematicVisual(entry, true);
        return '<button type="button" data-image-index="' + index + '" aria-pressed="'
          + String(index === imageIndex) + '" aria-label="画像' + (index + 1) + 'を表示">'
          + thumb + '<small>' + escapeText(entry.modality) + '</small></button>';
      }).join('') + '</div>';
    var comparePanel = item.images.length > 1
      ? '<div class="image-compare" data-compare-panel hidden><div>'
        + item.images.slice(0, 2).map(function (entry, index) {
          return '<figure>' + (entry.src
            ? '<img src="' + escapeText(entry.src) + '" alt="' + escapeText(entry.alt) + '">'
            : '<div class="image-compare__external">' + schematicVisual(entry, false)
              + '<a href="' + escapeText(entry.source.sourcePageUrl)
              + '" target="_blank" rel="noopener noreferrer">参考資料を開く ↗</a></div>')
            + '<figcaption>画像' + (index + 1) + ' · ' + escapeText(entry.modality)
            + '<span>' + escapeText(entry.description) + '</span></figcaption></figure>';
        }).join('') + '</div></div>'
      : '';
    var referenceHtml = clinicalReferenceList(references);
    var answerPanel = '<section class="answer-panel" data-answer-panel>'
      + '<div class="answer-panel__heading"><div><p class="answer-label">診断</p><h2>解答と解説</h2></div>'
      + '<button type="button" data-reveal-answer aria-expanded="'
      + String(!answerHidden) + '">' + (answerHidden ? '解答と解説を表示' : '解答を隠して解き直す') + '</button></div>'
      + '<div class="answer-panel__prompt"' + (answerHidden ? '' : ' hidden') + '>'
      + '<p>画像の「まず見る場所」と主要所見を言語化してから、解答を開いてください。</p></div>'
      + '<div class="answer-panel__content"' + (answerHidden ? ' hidden' : '') + '>'
      + '<p class="answer-kicker">解答</p><h3>' + escapeText(item.diagnosis) + '<sup>[1]</sup></h3>'
      + '<p class="answer-explanation">' + escapeText(item.explanation) + '</p>'
      + '<div class="reasoning-path"><div><span>01</span><strong>まず見る</strong>'
      + '<p>' + escapeText(item.firstLook.join('／')) + '</p></div>'
      + '<div><span>02</span><strong>拾う所見</strong><p>' + escapeText(item.keyFindings.join('／')) + '</p></div>'
      + '<div><span>03</span><strong>診断の決め手</strong><p>' + escapeText(item.diagnosticClues.join('／')) + '</p></div></div>'
      + '<div class="answer-sources"><h4>解説の引用元</h4>' + referenceHtml + '</div></div></section>';
    var root = document.getElementById('case-root');
    root.innerHTML = '<article class="case-shell">'
      + '<nav class="case-breadcrumb" aria-label="現在位置"><a href="/atlas/">症例一覧</a><span>/</span><span>'
      + escapeText(item.curriculumDomain) + '</span><span>/</span><span>' + (currentPosition + 1) + ' of ' + state.cases.length + '</span></nav>'
      + '<header class="case-intro"><div><p class="case-index">症例 ' + String(item.id).padStart(2, '0') + ' / ' + escapeText(item.category) + '</p><h1 data-answer-title>'
      + (answerHidden ? 'この画像の診断は？' : escapeText(item.title)) + '</h1></div>'
      + '<dl class="case-stats"><div><dt>画像</dt><dd>' + escapeText(image.modality) + '</dd></div><div><dt>年齢</dt><dd>'
      + escapeText(item.ageGroup) + '</dd></div><div><dt>典型度</dt><dd>' + item.typicality + '/5</dd></div></dl></header>'
      + '<section class="viewer-shell"><div class="viewer-stage">' + viewer + '</div>'
      + '<div class="viewer-toolbar"><div class="viewer-tools">'
      + (item.images.length > 1 ? '<button type="button" data-image-step="-1" aria-label="前の画像">←</button>'
        + '<button type="button" data-image-step="1" aria-label="次の画像">→</button>' : '')
      + (image.src ? '<button type="button" data-zoom-out aria-label="縮小">−</button><button type="button" data-zoom-in aria-label="拡大">＋</button>'
      + '<button type="button" data-reset>等倍</button><button type="button" data-fullscreen>全画面</button>'
      + '<button type="button" data-annotations aria-pressed="false">注釈</button>' : '')
      + (item.images.length > 1 ? '<button type="button" data-compare aria-pressed="false">比較</button>' : '')
      + (source.originalImageUrl ? '<a href="' + escapeText(source.originalImageUrl) + '" target="_blank" rel="noopener noreferrer">元画像</a>' : '')
      + '</div><p class="viewer-caption">' + escapeText(image.description) + '</p></div>'
      + '<div class="source-strip"><p><strong>画像出典：</strong>' + escapeText(source.copyrightHolder || source.organization || '') + ' / ' + escapeText(source.title) + '</p>'
      + '<p>ライセンス：' + escapeText(source.licenseName) + ' · 改変：' + (source.modified ? escapeText(source.modificationDescription) : 'なし')
      + ' · <a href="' + escapeText(source.sourcePageUrl) + '" target="_blank" rel="noopener noreferrer">原典を確認 ↗</a></p></div></section>'
      + thumbnails + comparePanel
      + observationWorkbench(item)
      + '<section class="case-summary"><p>' + escapeText(item.clinicalSummary) + '</p><div class="case-state">'
      + '<div class="mastery-seg" aria-label="習得状況"><button type="button" data-case-mastery="">未</button>'
      + '<button type="button" data-case-mastery="shaky">あやしい</button><button type="button" data-case-mastery="known">覚えた</button></div>'
      + '<button type="button" data-case-state="favorite">お気に入り</button></div></section>'
      + answerPanel
      + '<div class="case-dossier">'
      + studySection(1, 'まず見る場所', list(item.firstLook), 'third')
      + studySection(2, '画像所見', list(item.keyFindings), 'third')
      + studySection(3, '診断の決め手', list(item.diagnosticClues), 'third')
      + studySection(4, '鑑別診断', '<div class="differential-list">' + item.differentialDiagnoses.map(function (entry) {
        return '<div class="differential-item"><strong>' + escapeText(entry.name) + '</strong><span>' + escapeText(entry.distinction) + '</span></div>';
      }).join('') + '</div>', 'wide')
      + studySection(5, '病態', '<p>' + escapeText(item.pathology) + '</p>', 'third')
      + studySection(6, '次に行う検査', list(item.nextTests), 'third')
      + studySection(7, '初期対応', list(item.initialManagement), 'third')
      + studySection(8, '専門医試験のポイント', list(item.examPearls), 'half')
      + studySection(9, 'ピットフォール', list(item.pitfalls), 'half')
      + studySection(10, '画像の完全な出典情報', '<details class="source-details"><summary>画像の権利・原典情報を開く</summary>' + sourceTable(source) + '</details>', 'wide')
      + '</div><nav class="case-nav">'
      + (previousCase ? '<a href="' + caseHref(previousCase.slug) + '">← <span>前の症例</span><strong>' + escapeText(previousCase.title) + '</strong></a>' : '<span></span>')
      + (nextCase ? '<a href="' + caseHref(nextCase.slug) + '"><span>次の症例</span><strong>' + escapeText(nextCase.title) + '</strong> →</a>' : '<a href="/atlas/"><span>完了</span><strong>症例一覧へ</strong> →</a>')
      + '</nav></article>';
    root.querySelectorAll('[data-case-mastery]').forEach(function (button) {
      var activeMastery = getMastery(item.slug) === button.dataset.caseMastery;
      button.classList.toggle('is-active', activeMastery);
      button.setAttribute('aria-pressed', String(activeMastery));
      button.addEventListener('click', function () {
        if (!setMastery(item.slug, button.dataset.caseMastery)) {
          showStorageWarning();
          return;
        }
        root.querySelectorAll('[data-case-mastery]').forEach(function (entry) {
          entry.classList.toggle('is-active', entry === button);
          entry.setAttribute('aria-pressed', String(entry === button));
        });
      });
    });
    var favoriteButton = root.querySelector('[data-case-state="favorite"]');
    favoriteButton.classList.toggle('is-active', readState('favorite:' + item.slug) === '1');
    favoriteButton.setAttribute('aria-pressed', String(favoriteButton.classList.contains('is-active')));
    favoriteButton.addEventListener('click', function () {
      var active = !favoriteButton.classList.contains('is-active');
      if (!writeState('favorite:' + item.slug, active ? '1' : '0')) {
        showStorageWarning();
        return;
      }
      favoriteButton.classList.toggle('is-active', active);
      favoriteButton.setAttribute('aria-pressed', String(active));
    });
    root.querySelectorAll('[data-image-index]').forEach(function (button) {
      button.addEventListener('click', function () {
        var nextIndex = Number(button.getAttribute('data-image-index'));
        if (nextIndex === imageIndex) return;
        renderCase(item, nextIndex);
        document.querySelector('.viewer-shell').scrollIntoView({ block: 'start' });
      });
    });
    root.querySelectorAll('[data-image-step]').forEach(function (button) {
      button.addEventListener('click', function () {
        var step = Number(button.getAttribute('data-image-step'));
        var nextIndex = (imageIndex + step + item.images.length) % item.images.length;
        renderCase(item, nextIndex);
        document.querySelector('.viewer-shell').scrollIntoView({ block: 'start' });
      });
    });
    var compareButton = root.querySelector('[data-compare]');
    var compare = root.querySelector('[data-compare-panel]');
    if (compareButton && compare) {
      compareButton.addEventListener('click', function () {
        compare.hidden = !compare.hidden;
        compareButton.setAttribute('aria-pressed', String(!compare.hidden));
        compareButton.textContent = compare.hidden ? '比較' : '比較を閉じる';
      });
    }
    root.querySelectorAll('[data-observation-key]').forEach(function (checkbox) {
      checkbox.addEventListener('change', function () {
        if (!writeState(checkbox.dataset.observationKey, checkbox.checked ? '1' : '0')) {
          checkbox.checked = !checkbox.checked;
          showStorageWarning();
        }
      });
    });
    var note = root.querySelector('[data-note-key]');
    var noteStatus = root.querySelector('[data-note-status]');
    note.addEventListener('input', function () {
      var saved = writeState(note.dataset.noteKey, note.value);
      noteStatus.textContent = saved ? '保存しました' : '保存できませんでした';
      noteStatus.classList.toggle('is-error', !saved);
      window.clearTimeout(note._statusTimer);
      note._statusTimer = window.setTimeout(function () {
        noteStatus.textContent = saved ? 'この端末に保存' : 'ローカル保存を利用できません';
      }, 1200);
    });
    var revealButton = root.querySelector('[data-reveal-answer]');
    var answerContent = root.querySelector('.answer-panel__content');
    var answerPrompt = root.querySelector('.answer-panel__prompt');
    var answerTitle = root.querySelector('[data-answer-title]');
    revealButton.addEventListener('click', function () {
      answerHidden = !answerHidden;
      document.body.classList.toggle('case-answer-hidden', answerHidden);
      answerContent.hidden = answerHidden;
      answerPrompt.hidden = !answerHidden;
      revealButton.setAttribute('aria-expanded', String(!answerHidden));
      revealButton.textContent = answerHidden ? '解答と解説を表示' : '解答を隠して解き直す';
      answerTitle.textContent = answerHidden ? 'この画像の診断は？' : item.title;
      document.title = (answerHidden ? 'CASE ' + String(item.id).padStart(2, '0') : item.title)
        + ' | 小児科画像アトラス';
    });
    root.querySelector('[data-jump-answer]').addEventListener('click', function () {
      root.querySelector('[data-answer-panel]').scrollIntoView({ block: 'start' });
      if (answerHidden) revealButton.click();
    });
    setupViewer(image);
  }

  function findSlug() {
    var params = new URLSearchParams(location.search);
    if (params.get('slug')) return params.get('slug');
    var parts = location.pathname.split('/').filter(Boolean);
    var last = parts[parts.length - 1] || '';
    return last === 'atlas' || last === 'case.html' ? '' : decodeURIComponent(last);
  }

  async function init() {
    setupTheme();
    try {
      var data = await loadAtlasData();
      state.cases = data[0];
      state.coverage = data[1];
      if (document.body.dataset.page === 'index') setupIndex();
      else {
        var slug = findSlug();
        var item = state.cases.find(function (entry) { return entry.slug === slug; });
        if (!item) throw new Error('指定された症例が見つかりません。');
        renderCase(item);
      }
    } catch (error) {
      var root = document.getElementById('case-root') || document.querySelector('main');
      root.innerHTML = '<div class="error-box"><h1>読み込みエラー</h1><p>' + escapeText(error.message) + '</p><a href="/atlas/">一覧へ戻る</a></div>';
    }
  }
  init();
})();
