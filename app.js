(function(){
  'use strict';
  var NS = 'pboard:v1';
  var store = (function(){
    try { var t='__pb'; localStorage.setItem(t,'1'); localStorage.removeItem(t); return localStorage; }
    catch(e){ return null; }
  })();
  function get(k){ return store ? store.getItem(k) : null; }
  function set(k,v){ if(!store) return; if(v==='' || v==null) store.removeItem(k); else store.setItem(k,v); }

  function slug(href){ return decodeURIComponent(href).split('/').pop().replace(/\.html?$/,''); }

  var STATES = [
    {v:'',      label:'未',       cls:'is-todo'},
    {v:'shaky', label:'あやしい', cls:'is-shaky'},
    {v:'known', label:'覚えた',   cls:'is-known'}
  ];

  function warnNoStore(){
    var b=document.createElement('div');
    b.className='rev-warn';
    b.textContent='⚠️ この開き方では覚えた状態を保存できません（file:// のローカル保存が無効）。'
      +'Safari で開くか、Chrome は「--allow-file-access-from-files」で起動してください。';
    document.body.insertBefore(b, document.body.firstChild);
  }

  function buildSheet(){
    var sl = slug(location.pathname);
    var pfx = NS+':sheet:'+sl+':';
    var activeFilter = 'todo';
    var h1 = document.querySelector('h1#神経筋-毎日確認シート, h1[id]:not(.title)') || document.querySelector('h1:not(.title)');
    var title = h1 ? h1.textContent.trim() : sl;

    var items = [];
    Array.prototype.forEach.call(document.querySelectorAll('h2'), function(h,i){
      if(/^\s*運用/.test(h.textContent)) return;           // メタ節は対象外
      if(h.closest('.atlas-heading')) return;
      if(h.closest('.textbook-figure')) return;             // まとめ図は学習項目数に含めない
      if(h.id==='references') return;
      var key = h.id || ('sec'+i);
      items.push({ h2:h, stateKey:pfx+'item:'+key+':state', memoKey:pfx+'item:'+key+':memo' });
    });

    // ---- 進捗パネル（topnav直下）----
    var bar = document.createElement('div');
    bar.className='rev-progress';
    bar.innerHTML =
      '<div class="rev-progress__row">'
        +'<span class="rev-progress__label">習得状況</span>'
        +'<span class="rev-progress__nums" data-nums></span>'
        +'<button class="rev-progress__reset" type="button" data-reset>リセット</button>'
      +'</div>'
      +'<div class="rev-progress__filters filter-chips" role="group" aria-label="表示する習得状況">'
        +'<button type="button" data-sheet-filter="todo" class="is-active" aria-pressed="true">未分類 <span data-filter-count="todo">0</span></button>'
        +'<button type="button" data-sheet-filter="shaky" aria-pressed="false">あやしい <span data-filter-count="shaky">0</span></button>'
        +'<button type="button" data-sheet-filter="known" aria-pressed="false">覚えた <span data-filter-count="known">0</span></button>'
      +'</div>'
      +'<div class="rev-progress__track"><span class="rev-progress__fill" data-fill></span></div>'
      +'<p class="rev-progress__focus-message" data-focus-message></p>';
    var nav = document.querySelector('.topnav');
    if(nav && nav.parentNode) nav.parentNode.insertBefore(bar, nav.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);

    function render(){
      var known=0, shaky=0, todo=0;
      items.forEach(function(it){
        var s = get(it.stateKey) || '';
        if(s==='known') known++; else if(s==='shaky') shaky++; else todo++;
        var status = s || 'todo';
        it.h2.setAttribute('data-mastery', status);
        var filterHidden = status !== activeFilter;
        it.h2.hidden = filterHidden;
        (it.members||[]).forEach(function(member){ member.hidden = filterHidden; });
        if(it.memoWrap) it.memoWrap.hidden = filterHidden || !it.memoVisible;
      });
      var n = items.length || 1;
      bar.querySelector('[data-nums]').innerHTML =
        '<b class="is-known">覚えた '+known+'</b> ・ <b class="is-shaky">あやしい '+shaky+'</b>'
        +' ・ <b class="is-todo">未 '+todo+'</b> ／ 全'+items.length;
      bar.querySelector('[data-fill]').style.width = Math.round(known/n*100)+'%';
      bar.querySelector('[data-filter-count="todo"]').textContent=String(todo);
      bar.querySelector('[data-filter-count="shaky"]').textContent=String(shaky);
      bar.querySelector('[data-filter-count="known"]').textContent=String(known);
      bar.classList.toggle('is-complete', known===items.length && items.length>0);
      var visibleCount=activeFilter==='known'?known:activeFilter==='shaky'?shaky:todo;
      var filterLabel=activeFilter==='known'?'覚えた':activeFilter==='shaky'?'あやしい':'未分類';
      bar.querySelector('[data-focus-message]').textContent=visibleCount>0
        ? filterLabel+'の項目 '+visibleCount+'件'
        : 'この分類には項目がありません。';
      set(pfx+'count', String(items.length));
      set(pfx+'known', String(known));
      set(pfx+'shaky', String(shaky));
      set(pfx+'title', title);
    }

    function focusNextReviewAction(current){
      var currentIndex=items.indexOf(current);
      var next=items.slice(currentIndex+1).find(function(it){ return !it.h2.hidden; });
      if(!next){
        for(var i=currentIndex-1;i>=0;i--){
          if(!items[i].h2.hidden){ next=items[i]; break; }
        }
      }
      var nextAction=next&&next.h2.querySelector('.rev-seg__btn.is-known');
      if(nextAction) nextAction.focus();
      else bar.querySelector('[data-sheet-filter="'+activeFilter+'"]').focus();
    }

    items.forEach(function(it){
      // 見出し内に3状態セグメント＋メモボタン（兄弟を挟まず既存CSSを壊さない）
      var ctl = document.createElement('span');
      ctl.className='rev-ctl';
      var seg = document.createElement('span');
      seg.className='rev-seg';
      var cur = get(it.stateKey) || '';
      STATES.forEach(function(st){
        var b=document.createElement('button');
        b.type='button';
        b.className='rev-seg__btn '+st.cls+(cur===st.v?' is-active':'');
        b.textContent=st.label;
        b.setAttribute('aria-pressed',String(cur===st.v));
        b.addEventListener('click', function(){
          set(it.stateKey, st.v);
          seg.querySelectorAll('.rev-seg__btn').forEach(function(x){
            x.classList.remove('is-active');
            x.setAttribute('aria-pressed','false');
          });
          b.classList.add('is-active');
          b.setAttribute('aria-pressed','true');
          render();
          if((st.v||'todo')!==activeFilter) focusNextReviewAction(it);
        });
        seg.appendChild(b);
      });

      var memoVal = get(it.memoKey) || '';
      var memoBtn=document.createElement('button');
      memoBtn.type='button';
      memoBtn.className='rev-memo-toggle';
      memoBtn.textContent = memoVal ? '📝 メモ' : '＋ メモ';

      var memoWrap=document.createElement('div');
      memoWrap.className='rev-memo';
      memoWrap.hidden = !memoVal;
      it.memoWrap = memoWrap;
      it.memoVisible = !memoWrap.hidden;
      var ta=document.createElement('textarea');
      ta.placeholder='自分用メモ（語呂・間違えた点・引っかけ）…';
      ta.value=memoVal;
      ta.addEventListener('input', function(){
        set(it.memoKey, ta.value);
        memoBtn.textContent = ta.value ? '📝 メモ' : '＋ メモ';
      });
      memoWrap.appendChild(ta);
      memoBtn.addEventListener('click', function(){
        it.memoVisible=!it.memoVisible;
        memoWrap.hidden=!it.memoVisible;
        if(!memoWrap.hidden) ta.focus();
      });

      ctl.appendChild(seg);
      ctl.appendChild(memoBtn);
      it.h2.appendChild(ctl);

      // この節の本文要素（次のh2まで）を先に集める → 覚えたらグレーアウト対象
      var members=[], node=it.h2.nextElementSibling;
      while(node && node.tagName !== 'H2'){ members.push(node); node=node.nextElementSibling; }
      it.members = members;

      // メモ欄は「その節の末尾（次のh2の直前）」に置く＝h2直下の隣接CSSを保つ
      var boundary = it.h2.nextElementSibling;
      while(boundary && boundary.tagName !== 'H2') boundary = boundary.nextElementSibling;
      if(boundary) it.h2.parentNode.insertBefore(memoWrap, boundary);
      else it.h2.parentNode.appendChild(memoWrap);
    });

    bar.querySelector('[data-reset]').addEventListener('click', function(){
      if(!confirm('このシートの「覚えた／あやしい」とメモをすべて消しますか？')) return;
      items.forEach(function(it){ set(it.stateKey,''); set(it.memoKey,''); });
      location.reload();
    });
    bar.querySelectorAll('[data-sheet-filter]').forEach(function(button){
      button.addEventListener('click', function(){
        activeFilter=button.getAttribute('data-sheet-filter');
        bar.querySelectorAll('[data-sheet-filter]').forEach(function(x){
          var active=x===button;
          x.classList.toggle('is-active',active);
          x.setAttribute('aria-pressed',String(active));
        });
        render();
      });
    });

    render();
  }

  function buildIndex(){
    Array.prototype.forEach.call(document.querySelectorAll('.card'), function(card){
      var sl = slug(card.getAttribute('href')||'');
      var pfx = NS+':sheet:'+sl+':';
      var count = parseInt(get(pfx+'count')||'0',10);
      var known = parseInt(get(pfx+'known')||'0',10);
      var shaky = parseInt(get(pfx+'shaky')||'0',10);
      var prog=document.createElement('div');
      prog.className='card-prog';
      if(count>0){
        prog.innerHTML =
          '<div class="card-prog__track"><span style="width:'+Math.round(known/count*100)+'%"></span></div>'
          +'<div class="card-prog__nums">覚えた '+known+'/'+count+(shaky?'・あやしい '+shaky:'')+'</div>';
      } else {
        prog.innerHTML = '<div class="card-prog__nums card-prog__nums--empty">未開始</div>';
      }
      card.appendChild(prog);
    });

    var cards=document.querySelector('.cards');
    if(!cards) return;
    var tools=document.createElement('div');
    tools.className='study-tools';
    tools.innerHTML='<label class="study-search"><span>領域検索</span><input type="search" placeholder="例：心臓、けいれん、遺伝" autocomplete="off"></label>'
      +'<div class="filter-chips" role="group" aria-label="習得状況で絞り込み">'
      +'<button type="button" data-filter="all" class="is-active">すべて</button>'
      +'<button type="button" data-filter="todo">未学習</button>'
      +'<button type="button" data-filter="shaky">あやしい</button>'
      +'<button type="button" data-show-known aria-pressed="false">完了した領域を表示</button></div>';
    cards.parentNode.insertBefore(tools,cards);
    var query=tools.querySelector('input'), filter='all';
    var showKnown=get(NS+':index:show-known')==='1';
    function statusOf(card){
      var sl=slug(card.getAttribute('href')||''), pfx=NS+':sheet:'+sl+':';
      var count=parseInt(get(pfx+'count')||'0',10), known=parseInt(get(pfx+'known')||'0',10);
      var shaky=parseInt(get(pfx+'shaky')||'0',10);
      return count>0&&known===count?'known':shaky>0?'shaky':'todo';
    }
    function statusRank(status){ return status==='shaky'?0:status==='todo'?1:2; }
    function apply(){
      var allCards=Array.prototype.slice.call(cards.querySelectorAll('.card'));
      allCards.sort(function(a,b){ return statusRank(statusOf(a))-statusRank(statusOf(b)); });
      allCards.forEach(function(card){
        var status=statusOf(card), text=card.textContent.toLowerCase();
        var matches=text.indexOf(query.value.trim().toLowerCase())>=0 && (filter==='all'||status===filter);
        card.hidden=!matches||(status==='known'&&!showKnown);
        cards.appendChild(card);
      });
      var knownCount=allCards.filter(function(card){return statusOf(card)==='known';}).length;
      var toggle=tools.querySelector('[data-show-known]');
      toggle.textContent=showKnown?'完了した領域を隠す':'完了した領域を表示（'+knownCount+'）';
      toggle.setAttribute('aria-pressed',String(showKnown));
    }
    query.addEventListener('input',apply);
    tools.querySelectorAll('[data-filter]').forEach(function(button){
      button.setAttribute('aria-pressed',String(button.classList.contains('is-active')));
      button.addEventListener('click',function(){
        filter=button.getAttribute('data-filter');
        tools.querySelectorAll('[data-filter]').forEach(function(x){
          x.classList.toggle('is-active',x===button);
          x.setAttribute('aria-pressed',String(x===button));
        });
        apply();
      });
    });
    tools.querySelector('[data-show-known]').addEventListener('click',function(){
      showKnown=!showKnown;
      set(NS+':index:show-known',showKnown?'1':'');
      apply();
    });
    apply();
  }

  function pageKey(){
    return slug(location.pathname||'index.html');
  }

  function nodeTone(text){
    if(/混合|ASD|VSD|PDA/.test(text)) return 'mixed';
    if(/体静脈|右室/.test(text)) return 'venous';
    if(/肺静脈|左室|大動脈/.test(text)) return 'oxygenated';
    return '';
  }

  function renderVisuals(){
    var registry=window.PEDS_VISUALS, page=registry&&registry.pages[pageKey()];
    if(!page||document.querySelector('.visual-atlas')) return;
    var atlas=document.createElement('section');
    atlas.className='visual-atlas';
    atlas.setAttribute('aria-labelledby','visual-atlas-title');
    atlas.innerHTML='<div class="exam-focus"><span>試験頻出ポイント</span><strong></strong></div>'
      +'<div class="atlas-heading"><p>VISUAL STUDY NOTES</p><h2 id="visual-atlas-title">図で理解 → 表で比較 → 本文で固定</h2></div>';
    atlas.querySelector('.exam-focus strong').textContent=page.exam;
    if(page.usePageSummary&&page.image&&page.summary){
      var figure=document.createElement('figure');
      figure.className='textbook-figure';

      var intro=document.createElement('div');
      intro.className='textbook-figure__intro';
      var copy=document.createElement('figcaption');
      copy.className='textbook-figure__copy';
      copy.innerHTML='<span class="textbook-figure__eyebrow">専門医試験・まとめ図</span><h2></h2><p></p>';
      copy.querySelector('h2').textContent=page.summary.title;
      copy.querySelector('p').textContent=page.summary.thesis;

      var art=document.createElement('div');
      art.className='textbook-figure__art';
      var image=document.createElement('img');
      image.src=page.image.src;
      image.alt=page.image.alt;
      image.width=1280;
      image.height=720;
      image.loading='eager';
      image.decoding='async';
      var artNote=document.createElement('span');
      artNote.className='textbook-figure__art-note';
      artNote.textContent='概念イメージ';
      art.appendChild(image);
      art.appendChild(artNote);
      intro.appendChild(copy);
      intro.appendChild(art);
      figure.appendChild(intro);

      var process=document.createElement('section');
      process.className='textbook-process';
      process.innerHTML='<div class="textbook-section-title"><span>01</span><h3>病態の流れ</h3></div><ol></ol>';
      page.summary.steps.forEach(function(step){
        var item=document.createElement('li');
        item.className='textbook-step textbook-step--'+(step.tone||'quiet');
        item.innerHTML='<span class="textbook-step__label"></span><strong></strong><small></small>';
        item.querySelector('.textbook-step__label').textContent=step.label;
        item.querySelector('strong').textContent=step.detail;
        item.querySelector('small').textContent=step.note;
        process.querySelector('ol').appendChild(item);
      });
      figure.appendChild(process);

      var clues=document.createElement('section');
      clues.className='textbook-clues';
      clues.innerHTML='<div class="textbook-section-title"><span>02</span><h3>問題文で拾う所見</h3></div><div class="textbook-clues__grid"></div>';
      page.summary.clues.forEach(function(clue){
        var item=document.createElement('div');
        item.className='textbook-clue';
        item.innerHTML='<span></span><strong></strong>';
        item.firstChild.textContent=clue.cue;
        item.lastChild.textContent='→ '+clue.answer;
        clues.querySelector('.textbook-clues__grid').appendChild(item);
      });
      figure.appendChild(clues);

      var close=document.createElement('div');
      close.className='textbook-close';
      close.innerHTML='<div class="textbook-trap"><span>試験の引っかけ</span><p></p></div>'
        +'<div class="textbook-recall"><span>30秒で再生</span><p></p></div>';
      close.querySelector('.textbook-trap p').textContent=page.summary.trap;
      close.querySelector('.textbook-recall p').textContent=page.summary.recall;
      figure.appendChild(close);

      var sources=document.createElement('div');
      sources.className='textbook-sources';
      sources.innerHTML='<span>確認資料</span>';
      (page.summary.sources||[]).forEach(function(item){
        var link=document.createElement('a');
        link.href=item.url;
        link.target='_blank';
        link.rel='noopener noreferrer';
        link.textContent=item.label+' ↗';
        sources.appendChild(link);
      });
      figure.appendChild(sources);
      atlas.insertBefore(figure,atlas.querySelector('.atlas-heading'));
    }
    page.visuals.forEach(function(v,i){
      var article=document.createElement('article');
      article.className='visual-card visual-card--'+v.type;
      article.id='visual-'+(i+1);
      var heading=document.createElement('h2');
      heading.innerHTML='<span class="importance importance--'+(v.importance==='最頻出'?'top':v.importance==='頻出'?'high':'note')+'"></span>';
      heading.querySelector('.importance').textContent=v.importance;
      heading.appendChild(document.createTextNode(v.title));
      article.appendChild(heading);
      if(v.image){
        var infographic=document.createElement('figure');
        infographic.className='topic-infographic';
        var imageLink=document.createElement('a');
        imageLink.className='topic-infographic__link';
        imageLink.href=v.image.src;
        imageLink.target='_blank';
        imageLink.rel='noopener noreferrer';
        imageLink.setAttribute('aria-label',v.title+'の一枚図解を原寸で開く');
        var topicImage=document.createElement('img');
        topicImage.src=v.image.src;
        topicImage.alt=v.image.alt;
        topicImage.width=1672;
        topicImage.height=941;
        topicImage.loading=i<2?'eager':'lazy';
        topicImage.decoding='async';
        var zoomLabel=document.createElement('span');
        zoomLabel.className='topic-infographic__zoom';
        zoomLabel.textContent='原寸で拡大して読む ↗';
        imageLink.appendChild(topicImage);
        imageLink.appendChild(zoomLabel);
        var imageCaption=document.createElement('figcaption');
        imageCaption.innerHTML='<strong>一枚図解</strong><span></span>';
        imageCaption.lastChild.textContent=v.image.caption;
        infographic.appendChild(imageLink);
        infographic.appendChild(imageCaption);
        article.appendChild(infographic);
      }
      var diagram=document.createElement('div');
      diagram.className='diagram';
      diagram.setAttribute('role','img');
      diagram.setAttribute('aria-label',v.title+'の図解');
      v.nodes.forEach(function(text,n){
        var node=document.createElement('div');
        node.className='diagram-node '+nodeTone(text);
        node.innerHTML='<span class="step">'+(n+1)+'</span><span></span>';
        node.lastChild.textContent=text;
        diagram.appendChild(node);
        if(n<v.nodes.length-1){
          var arrow=document.createElement('span'); arrow.className='diagram-arrow'; arrow.setAttribute('aria-hidden','true'); arrow.textContent='→'; diagram.appendChild(arrow);
        }
      });
      article.appendChild(diagram);
      var learn=document.createElement('p'); learn.className='takeaway'; learn.innerHTML='<strong>この図で覚えること</strong><span></span>'; learn.lastChild.textContent=v.takeaway; article.appendChild(learn);
      var grid=document.createElement('div'); grid.className='exam-grid';
      [['一撃所見',v.oneShot,'hit'],['引っかけ',v.trap,'trap'],['30秒復習',v.review,'review']].forEach(function(item){
        var box=document.createElement('div'); box.className='exam-box exam-box--'+item[2]; box.innerHTML='<span></span><p></p>';
        box.firstChild.textContent=item[0]; box.lastChild.textContent=item[1]; grid.appendChild(box);
      });
      article.appendChild(grid);
      var source=document.createElement('a'); source.className='source-link'; source.href=v.source.url; source.target='_blank'; source.rel='noopener noreferrer'; source.textContent='一次資料・ガイドライン：'+v.source.label+' ↗'; article.appendChild(source);
      atlas.appendChild(article);
    });
    var anchor=document.querySelector('nav#TOC')||document.querySelector('.rev-progress')||document.querySelector('h1');
    if(anchor&&anchor.parentNode) anchor.parentNode.insertBefore(atlas,anchor.nextSibling);

    var mode=document.createElement('button'); mode.type='button'; mode.className='visual-mode-toggle'; mode.textContent='図表だけ見る';
    mode.addEventListener('click',function(){var on=document.body.classList.toggle('is-visual-review');mode.textContent=on?'本文に戻る':'図表だけ見る';});
    var nav=document.querySelector('.topnav'); if(nav) nav.appendChild(mode);
  }

  function enhanceReading(){
    var toc=document.querySelector('nav#TOC');
    if(toc){
      var marker=document.createElement('div'); marker.className='reading-position'; marker.innerHTML='<span></span>'; document.body.appendChild(marker);
      addEventListener('scroll',function(){var h=document.documentElement.scrollHeight-innerHeight;marker.firstChild.style.width=(h?scrollY/h*100:0)+'%';},{passive:true});
    }
  }

  function ensureVisuals(done){
    if(window.PEDS_VISUALS){done();return;}
    var s=document.createElement('script'); s.src='visuals.js'; s.onload=done; s.onerror=done; document.head.appendChild(s);
  }

  document.addEventListener('DOMContentLoaded', function(){
    if(!store) warnNoStore();
    ensureVisuals(function(){
      renderVisuals();
      if(document.querySelector('.cards')) buildIndex();
      else if(document.querySelector('.topnav')) buildSheet();
      enhanceReading();
    });
  });
})();
