// 《汪汪小精靈 學習小伙伴》🔲 數字華容道（v3.19.0，益智挑戰）
// 把數字方塊滑回 1、2、3…的順序，空格在右下角就過關。
//   ・點空格旁邊（同一排或同一欄）的方塊，就會滑過去；也可以用鍵盤方向鍵
//   ・打亂的方法是從排好的樣子隨機滑很多步，所以一定解得開
(function () {
  'use strict';

  const LEVELS = [
    { id: 'sl3', n: 3, mix: 80, name: '數字華容道 3×3', short: '3×3', desc: '1～8，入門', stars: 1, xp: 4, per: 2 },
    { id: 'sl4', n: 4, mix: 200, name: '數字華容道 4×4', short: '4×4', desc: '1～15，經典', stars: 3, xp: 12, per: 2 },
    { id: 'sl5', n: 5, mix: 400, name: '數字華容道 5×5', short: '5×5', desc: '1～24，高手', stars: 5, xp: 20, per: 1 }
  ];
  const BY_ID = {};
  LEVELS.forEach(l => { BY_ID[l.id] = l; });

  let ctx = null;
  let g = null;   // { lv, b:[]（0＝空格）, moves, started, done, result }

  const isSolved = b => b.every((v, i) => v === (i === b.length - 1 ? 0 : i + 1));
  function neighbors(n, e) {
    const r = Math.floor(e / n), c = e % n, out = [];
    if (r > 0) out.push(e - n);
    if (r < n - 1) out.push(e + n);
    if (c > 0) out.push(e - 1);
    if (c < n - 1) out.push(e + 1);
    return out;
  }
  function mixed(n, steps) {
    let b;
    do {
      b = Array.from({ length: n * n }, (_, i) => (i === n * n - 1 ? 0 : i + 1));
      let e = n * n - 1, prev = -1;
      for (let k = 0; k < steps; k++) {
        const opts = neighbors(n, e).filter(i => i !== prev);
        const t = opts[Math.floor(Math.random() * opts.length)];
        b[e] = b[t]; b[t] = 0; prev = e; e = t;
      }
    } while (isSolved(b));
    return b;
  }
  // 點第 i 格：如果跟空格同一排或同一欄，這一格到空格之間的方塊一起滑過去
  function slide(b, n, i) {
    const e = b.indexOf(0);
    if (i === e) return 0;
    const ri = Math.floor(i / n), ci = i % n, re = Math.floor(e / n), ce = e % n;
    let step;
    if (ri === re) step = ci < ce ? -1 : 1;
    else if (ci === ce) step = ri < re ? -n : n;
    else return 0;
    let cur = e, cnt = 0;
    while (cur !== i) { const nx = cur + step; b[cur] = b[nx]; b[nx] = 0; cur = nx; cnt++; }
    return cnt;
  }

  function start(id) {
    const lv = BY_ID[id];
    if (!lv) return;
    g = { lv, b: mixed(lv.n, lv.mix), moves: 0, started: 0, done: false, result: null };
    ctx.enter(api);
    render();
  }

  function homeHtml() {
    const card = lv => {
      const wins = ctx.wins(lv.id), left = ctx.dayLeft(lv), best = ctx.best(lv.id);
      return `<button class="pz-level${wins ? ' done' : ''}" data-sl="${lv.id}">
        <span class="pz-lv-top"><span class="pz-lv-name">${ctx.esc(lv.short)}</span><span class="pz-lv-desc">${ctx.esc(lv.desc)}</span></span>
        <span class="pz-lv-prize">⭐ ${lv.stars}　✨ ${lv.xp} XP</span>
        <span class="pz-lv-sub">${left ? `今天還可以領 ${left} 次` : '今天的獎勵領完了'}${best ? `｜最快 ${ctx.fmtTime(best)}` : ''}</span>
      </button>`;
    };
    return `
      <h3 class="pz-h3">🔲 數字華容道</h3>
      <p class="section-sub" style="margin-top:0;">點空格旁邊的方塊，把數字滑回 <b>1、2、3…</b> 的順序，空格在右下角就過關。小撇步：<b>先排好最上面一排</b>，再排左邊一欄，越排越小。</p>
      <div class="pz-levels">${LEVELS.map(card).join('')}</div>`;
  }
  function playHtml() {
    return `
      <div class="card-box pz-play sl-play">
        <div class="pz-top">
          <b class="pz-title">🔲 ${ctx.esc(g.lv.name)}</b>
          <span class="pz-stat">⏱ <span id="slTime">0 秒</span></span>
          <span class="pz-stat">👆 <span id="slMoves">0</span> 步</span>
          <button class="btn btn-soft pz-quit" id="slQuit">離開</button>
        </div>
        <div class="pz-msg" id="slMsg">點空格旁邊的方塊，讓它滑過去。</div>
        <div class="sl-grid" id="slGrid" style="--n:${g.lv.n}"></div>
        <div class="pz-tools"><button class="btn btn-soft" id="slNew">🔀 重新打亂</button></div>
        <div class="pz-result" id="slResult" hidden></div>
      </div>`;
  }
  function paint() {
    const el = ctx.pane && ctx.pane.querySelector('#slGrid');
    if (!el || !g) return;
    const n = g.lv.n;
    el.innerHTML = g.b.map((v, i) => v
      ? `<button class="sl-tile${v === i + 1 ? ' ok' : ''}" data-i="${i}" style="--hue:${Math.round((Math.floor((v - 1) / n)) * 360 / n)}">${v}</button>`
      : `<div class="sl-empty"></div>`).join('');
    const m = ctx.pane.querySelector('#slMoves'); if (m) m.textContent = g.moves;
  }
  function paintTime() {
    const t = ctx.pane && ctx.pane.querySelector('#slTime');
    if (t && g) t.textContent = g.started ? ctx.fmtTime(((g.endAt || Date.now()) - g.started) / 1000) : '0 秒';
  }
  function render() {
    const pane = ctx.pane;
    if (!pane || !g) return;
    pane.innerHTML = playHtml();
    paint(); paintTime();
    pane.querySelector('#slGrid').addEventListener('click', ev => { const b = ev.target.closest('.sl-tile'); if (b) tap(+b.dataset.i); });
    pane.querySelector('#slQuit').addEventListener('click', () => { if (g.moves && !g.done && !confirm('要離開這一盤嗎？')) return; g = null; ctx.back(); });
    pane.querySelector('#slNew').addEventListener('click', () => { if (g.moves && !g.done && !confirm('要重新打亂嗎？')) return; start(g.lv.id); });
    if (g.done && g.result) showResult();
    ctx.focus();
  }
  function tap(i) {
    if (!g || g.done) return false;
    const cnt = slide(g.b, g.lv.n, i);
    if (!cnt) return false;
    if (!g.started) g.started = Date.now();
    g.moves += cnt;
    paint();
    if (isSolved(g.b)) finish();
    return true;
  }
  function finish() {
    g.done = true; g.endAt = Date.now(); paintTime();
    const sec = Math.max(1, Math.round((g.endAt - g.started) / 1000));
    g.result = Object.assign({ sec }, ctx.grant(g.lv, sec, g.moves));
    showResult();
  }
  function showResult() {
    const box = ctx.pane.querySelector('#slResult'), r = g.result;
    if (!box || !r) return;
    box.hidden = false;
    box.innerHTML = `
      <div class="pz-win">🎉 排好了！</div>
      <div class="ty-result-grid">
        <div><b>${ctx.fmtTime(r.sec)}</b><span>用時${r.newBest ? '（新紀錄！）' : ''}</span></div>
        <div><b>${g.moves}</b><span>步數</span></div>
        <div><b>${r.stars ? '+' + r.stars + '⭐' : '—'}</b><span>星星</span></div>
        <div><b>${r.xp ? '+' + r.xp : '—'}</b><span>經驗值</span></div>
      </div>
      ${r.note ? `<p class="ty-note">${ctx.esc(r.note)}</p>` : ''}
      <div class="pz-result-btns"><button class="btn btn-soft" id="slHome">回到益智挑戰</button><button class="btn btn-orange" id="slAgain">🔁 再玩一次</button></div>`;
    box.querySelector('#slHome').addEventListener('click', () => { g = null; ctx.back(); });
    box.querySelector('#slAgain').addEventListener('click', () => start(g.lv.id));
    const m = ctx.pane.querySelector('#slMsg'); if (m) m.textContent = '';
  }
  function onKey(ev) {
    if (!g || g.done || !ctx.pane || !ctx.pane.querySelector('#slGrid') || !ctx.pane.getClientRects().length) return;
    const n = g.lv.n, e = g.b.indexOf(0), r = Math.floor(e / n), c = e % n;
    // 方向鍵＝方塊往那個方向滑（所以要點的是空格的另一邊）
    const t = { ArrowLeft: c < n - 1 ? e + 1 : -1, ArrowRight: c > 0 ? e - 1 : -1, ArrowUp: r < n - 1 ? e + n : -1, ArrowDown: r > 0 ? e - n : -1 }[ev.key];
    if (t === undefined) return;
    ev.preventDefault();
    if (t >= 0) tap(t);
  }

  let ticker = 0;
  const api = {
    attach(c) {
      ctx = c;
      window.addEventListener('keydown', onKey);
      if (!ticker) ticker = setInterval(() => { if (g && g.started && !g.done && ctx.pane && ctx.pane.getClientRects().length) paintTime(); }, 500);
    },
    home(el) {
      el.innerHTML = homeHtml();
      el.querySelectorAll('[data-sl]').forEach(b => b.addEventListener('click', () => start(b.dataset.sl)));
    },
    render() { if (g) render(); else ctx.back(); },
    isPlaying() { return !!g && !g.done; },
    hide() { },
    LEVELS,
    _t: { mixed, slide, isSolved, start, tap, game: () => g, BY_ID }
  };
  window.PuppySlide = api;
})();
