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
    var h1 = document.querySelector('h1#神経筋-毎日確認シート, h1[id]:not(.title)') || document.querySelector('h1:not(.title)');
    var title = h1 ? h1.textContent.trim() : sl;

    var items = [];
    Array.prototype.forEach.call(document.querySelectorAll('h2'), function(h,i){
      if(/^\s*運用/.test(h.textContent)) return;           // メタ節は対象外
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
      +'<div class="rev-progress__track"><span class="rev-progress__fill" data-fill></span></div>';
    var nav = document.querySelector('.topnav');
    if(nav && nav.parentNode) nav.parentNode.insertBefore(bar, nav.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);

    function render(){
      var known=0, shaky=0, todo=0;
      items.forEach(function(it){
        var s = get(it.stateKey) || '';
        if(s==='known') known++; else if(s==='shaky') shaky++; else todo++;
        it.h2.setAttribute('data-mastery', s || 'todo');
        // 覚えた節は本文＋見出しをグレーアウト（hoverで読める）
        var dim = (s==='known');
        it.h2.classList.toggle('rev-dim-h', dim);
        (it.members||[]).forEach(function(el){ el.classList.toggle('rev-dim', dim); });
      });
      var n = items.length || 1;
      bar.querySelector('[data-nums]').innerHTML =
        '<b class="is-known">覚えた '+known+'</b> ・ <b class="is-shaky">あやしい '+shaky+'</b>'
        +' ・ <b class="is-todo">未 '+todo+'</b> ／ 全'+items.length;
      bar.querySelector('[data-fill]').style.width = Math.round(known/n*100)+'%';
      set(pfx+'count', String(items.length));
      set(pfx+'known', String(known));
      set(pfx+'shaky', String(shaky));
      set(pfx+'title', title);
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
        b.addEventListener('click', function(){
          set(it.stateKey, st.v);
          seg.querySelectorAll('.rev-seg__btn').forEach(function(x){ x.classList.remove('is-active'); });
          b.classList.add('is-active');
          render();
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
      var ta=document.createElement('textarea');
      ta.placeholder='自分用メモ（語呂・間違えた点・引っかけ）…';
      ta.value=memoVal;
      ta.addEventListener('input', function(){
        set(it.memoKey, ta.value);
        memoBtn.textContent = ta.value ? '📝 メモ' : '＋ メモ';
      });
      memoWrap.appendChild(ta);
      memoBtn.addEventListener('click', function(){
        memoWrap.hidden=!memoWrap.hidden;
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
  }

  document.addEventListener('DOMContentLoaded', function(){
    if(!store) warnNoStore();
    if(document.querySelector('.cards')) buildIndex();
    else if(document.querySelector('.topnav')) buildSheet();
  });
})();
