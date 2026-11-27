// 《汪汪小精靈 學習小伙伴》🔢 數獨（v3.19.0，益智挑戰）
// 每一橫排、每一直排、每一個粗框小方塊裡，1～N 每個數字剛好出現一次。
//   ・4×4（中年級入門）、6×6、9×9 簡單、9×9 挑戰；題目每次由程式產生，而且一定只有一個答案
//   ・點格子 → 點下面的數字；同一排／同一欄／同一框有重複會變紅
//   ・💡 提示：填好一格（用了提示少一顆星，最少 1 顆）
(function () {
  'use strict';

  const LEVELS = [
    { id: 'sd4', n: 4, br: 2, bc: 2, holes: 9, name: '數獨 4×4', short: '4×4', desc: '入門，2×2 的框', stars: 1, xp: 4, per: 2 },
    { id: 'sd6', n: 6, br: 2, bc: 3, holes: 18, name: '數獨 6×6', short: '6×6', desc: '2×3 的框', stars: 2, xp: 8, per: 2 },
    { id: 'sd9e', n: 9, br: 3, bc: 3, holes: 38, name: '數獨 9×9 簡單', short: '9×9 簡單', desc: '正式數獨，空格比較少', stars: 3, xp: 12, per: 1 },
    { id: 'sd9h', n: 9, br: 3, bc: 3, holes: 50, name: '數獨 9×9 挑戰', short: '9×9 挑戰', desc: '空格多，要仔細推理', stars: 5, xp: 20, per: 1 }
  ];
  const BY_ID = {};
  LEVELS.forEach(l => { BY_ID[l.id] = l; });

  let ctx = null;
  let g = null;   // { lv, sol:[], given:[bool], cur:[], sel, hints, started, done, result }

  // ── 出題 ──
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function canPut(b, n, br, bc, i, v) {
    const r = Math.floor(i / n), c = i % n;
    for (let k = 0; k < n; k++) { if (b[r * n + k] === v || b[k * n + c] === v) return false; }
    const r0 = r - r % br, c0 = c - c % bc;
    for (let y = r0; y < r0 + br; y++) for (let x = c0; x < c0 + bc; x++) if (b[y * n + x] === v) return false;
    return true;
  }
  function fill(b, n, br, bc) {
    const i = b.indexOf(0);
    if (i < 0) return true;
    for (const v of shuffle(Array.from({ length: n }, (_, k) => k + 1))) {
      if (canPut(b, n, br, bc, i, v)) { b[i] = v; if (fill(b, n, br, bc)) return true; b[i] = 0; }
    }
    return false;
  }
  // 數有幾個解（最多數到 limit 就停）
  function countSol(b, n, br, bc, limit) {
    let best = -1, bestOpts = null;
    for (let i = 0; i < n * n; i++) {
      if (b[i]) continue;
      const opts = [];
      for (let v = 1; v <= n; v++) if (canPut(b, n, br, bc, i, v)) opts.push(v);
      if (!opts.length) return 0;
      if (!bestOpts || opts.length < bestOpts.length) { best = i; bestOpts = opts; if (opts.length === 1) break; }
    }
    if (best < 0) return 1;
    let cnt = 0;
    for (const v of bestOpts) {
      b[best] = v;
      cnt += countSol(b, n, br, bc, limit - cnt);
      b[best] = 0;
      if (cnt >= limit) break;
    }
    return cnt;
  }
  function makePuzzle(lv) {
    const { n, br, bc } = lv;
    const sol = new Array(n * n).fill(0);
    fill(sol, n, br, bc);
    const puz = sol.slice();
    let removed = 0;
    for (const i of shuffle(Array.from({ length: n * n }, (_, k) => k))) {
      if (removed >= lv.holes) break;
      const keep = puz[i];
      puz[i] = 0;
      if (countSol(puz.slice(), n, br, bc, 2) !== 1) puz[i] = keep;
      else removed++;
    }
    return { sol, puz };
  }

  // 哪些格子跟別的格子重複
  function conflicts(b, lv) {
    const { n, br, bc } = lv, bad = new Set();
    const groups = [];
    for (let r = 0; r < n; r++) groups.push(Array.from({ length: n }, (_, c) => r * n + c));
    for (let c = 0; c < n; c++) groups.push(Array.from({ length: n }, (_, r) => r * n + c));
    for (let r0 = 0; r0 < n; r0 += br) for (let c0 = 0; c0 < n; c0 += bc) {
      const gp = [];
      for (let y = r0; y < r0 + br; y++) for (let x = c0; x < c0 + bc; x++) gp.push(y * n + x);
      groups.push(gp);
    }
    groups.forEach(gp => {
      const seen = {};
      gp.forEach(i => { const v = b[i]; if (!v) return; (seen[v] = seen[v] || []).push(i); });
      Object.values(seen).forEach(list => { if (list.length > 1) list.forEach(i => bad.add(i)); });
    });
    return bad;
  }
  const solved = () => g && g.cur.every(v => v) && conflicts(g.cur, g.lv).size === 0;

  // ── 開始 ──
  function start(id) {
    const lv = BY_ID[id];
    if (!lv) return;
    const { sol, puz } = makePuzzle(lv);
    g = { lv, sol, given: puz.map(v => !!v), cur: puz.slice(), sel: puz.indexOf(0), hints: 0, started: 0, done: false, result: null, moves: 0 };
    ctx.enter(api);
    render();
  }

  // ── 畫面 ──
  function homeHtml() {
    const card = lv => {
      const wins = ctx.wins(lv.id), left = ctx.dayLeft(lv), best = ctx.best(lv.id);
      return `<button class="pz-level${wins ? ' done' : ''}" data-sd="${lv.id}">
        <span class="pz-lv-top"><span class="pz-lv-name">${ctx.esc(lv.short)}</span><span class="pz-lv-desc">${ctx.esc(lv.desc)}</span></span>
        <span class="pz-lv-prize">⭐ ${lv.stars}　✨ ${lv.xp} XP</span>
        <span class="pz-lv-sub">${left ? `今天還可以領 ${left} 次` : '今天的獎勵領完了'}${best ? `｜最快 ${ctx.fmtTime(best)}` : ''}</span>
      </button>`;
    };
    return `
      <h3 class="pz-h3">🔢 數獨</h3>
      <p class="section-sub" style="margin-top:0;">每一<b>橫排</b>、每一<b>直排</b>、每一個<b>粗框</b>裡，數字都不能重複。先從 4×4 開始！小撇步：找「只剩一個數字能填」的格子。每一次的題目都不一樣。</p>
      <div class="pz-levels">${LEVELS.map(card).join('')}</div>`;
  }
  function playHtml() {
    const lv = g.lv;
    return `
      <div class="card-box pz-play sd-play">
        <div class="pz-top">
          <b class="pz-title">🔢 ${ctx.esc(lv.name)}</b>
          <span class="pz-stat">⏱ <span id="sdTime">0 秒</span></span>
          <button class="btn btn-soft pz-quit" id="sdQuit">離開</button>
        </div>
        <div class="pz-msg" id="sdMsg">點一個空格，再點下面的數字。</div>
        <div class="sd-grid n${lv.n}" id="sdGrid" style="--n:${lv.n}"></div>
        <div class="sd-pad n${lv.n}" id="sdPad">${Array.from({ length: lv.n }, (_, k) => `<button class="sd-key" data-v="${k + 1}">${k + 1}</button>`).join('')}<button class="sd-key erase" data-v="0">⌫</button></div>
        <div class="pz-tools"><button class="btn btn-soft" id="sdHint">💡 提示</button><button class="btn btn-soft" id="sdNew">🔁 換一題</button></div>
        <div class="pz-result" id="sdResult" hidden></div>
      </div>`;
  }
  function paint() {
    const el = ctx.pane && ctx.pane.querySelector('#sdGrid');
    if (!el || !g) return;
    const { n, br, bc } = g.lv, bad = conflicts(g.cur, g.lv);
    const selV = g.sel >= 0 ? g.cur[g.sel] : 0;
    el.innerHTML = g.cur.map((v, i) => {
      const r = Math.floor(i / n), c = i % n;
      const cls = ['sd-cell'];
      if (g.given[i]) cls.push('given');
      if (i === g.sel) cls.push('sel');
      else if (g.sel >= 0 && (r === Math.floor(g.sel / n) || c === g.sel % n)) cls.push('line');
      if (selV && v === selV && i !== g.sel) cls.push('same');
      if (bad.has(i)) cls.push('bad');
      if ((c + 1) % bc === 0 && c < n - 1) cls.push('br');
      if ((r + 1) % br === 0 && r < n - 1) cls.push('bb');
      return `<button class="${cls.join(' ')}" data-i="${i}">${v || ''}</button>`;
    }).join('');
  }
  function paintTime() {
    const t = ctx.pane && ctx.pane.querySelector('#sdTime');
    if (t && g) t.textContent = g.started ? ctx.fmtTime(((g.endAt || Date.now()) - g.started) / 1000) : '0 秒';
  }
  function say(m) { const el = ctx.pane.querySelector('#sdMsg'); if (el) el.textContent = m; }
  function render() {
    const pane = ctx.pane;
    if (!pane || !g) return;
    pane.innerHTML = playHtml();
    paint(); paintTime();
    pane.querySelector('#sdGrid').addEventListener('click', ev => {
      const b = ev.target.closest('.sd-cell');
      if (!b || g.done) return;
      g.sel = +b.dataset.i; paint();
    });
    pane.querySelectorAll('.sd-key').forEach(b => b.addEventListener('click', () => put(+b.dataset.v)));
    const on = (sel, fn) => { const el = pane.querySelector(sel); if (el) el.addEventListener('click', fn); };
    on('#sdQuit', () => { if (g.moves && !g.done && !confirm('要離開這一題嗎？')) return; g = null; ctx.back(); });
    on('#sdNew', () => { if (g.moves && !g.done && !confirm('要換一題嗎？')) return; start(g.lv.id); });
    on('#sdHint', hint);
    if (g.done && g.result) showResult();
    ctx.focus();
  }
  function put(v) {
    if (!g || g.done) return;
    const i = g.sel;
    if (i < 0 || g.given[i]) { say(i >= 0 ? '這一格是題目給的，不能改喔。' : '先點一個空格。'); return; }
    g.cur[i] = v;
    if (!g.started) g.started = Date.now();
    g.moves++;
    paint();
    const bad = conflicts(g.cur, g.lv);
    say(bad.has(i) ? '紅色的格子重複了，再想想看！' : '');
    if (solved()) finish();
  }
  function hint() {
    if (!g || g.done) return;
    const empties = g.cur.map((v, i) => (!v || v !== g.sol[i]) && !g.given[i] ? i : -1).filter(i => i >= 0);
    if (!empties.length) return;
    const i = g.sel >= 0 && empties.includes(g.sel) ? g.sel : empties[0];
    g.cur[i] = g.sol[i]; g.given[i] = true; g.hints++; g.sel = i;
    if (!g.started) g.started = Date.now();
    paint();
    say(`💡 幫你填好一格（用了提示，這一題少一顆星）。`);
    if (solved()) finish();
  }
  function finish() {
    g.done = true; g.endAt = Date.now(); paintTime();
    const sec = Math.max(1, Math.round((g.endAt - g.started) / 1000));
    const lv = g.hints ? Object.assign({}, g.lv, { stars: Math.max(1, g.lv.stars - 1) }) : g.lv;
    g.result = Object.assign({ sec }, ctx.grant(lv, sec, g.moves));
    showResult();
  }
  function showResult() {
    const box = ctx.pane.querySelector('#sdResult'), r = g.result;
    if (!box || !r) return;
    box.hidden = false;
    box.innerHTML = `
      <div class="pz-win">🎉 完成了！每一排、每一欄、每一框都沒有重複</div>
      <div class="ty-result-grid">
        <div><b>${ctx.fmtTime(r.sec)}</b><span>用時${r.newBest ? '（新紀錄！）' : ''}</span></div>
        <div><b>${r.stars ? '+' + r.stars + '⭐' : '—'}</b><span>星星${g.hints ? '（用了提示）' : ''}</span></div>
        <div><b>${r.xp ? '+' + r.xp : '—'}</b><span>經驗值</span></div>
      </div>
      ${r.note ? `<p class="ty-note">${ctx.esc(r.note)}</p>` : ''}
      <div class="pz-result-btns"><button class="btn btn-soft" id="sdHome">回到益智挑戰</button><button class="btn btn-orange" id="sdAgain">🔁 再來一題</button></div>`;
    box.querySelector('#sdHome').addEventListener('click', () => { g = null; ctx.back(); });
    box.querySelector('#sdAgain').addEventListener('click', () => start(g.lv.id));
    say('');
  }
  function onKey(ev) {
    if (!g || g.done || !ctx.pane || !ctx.pane.querySelector('#sdGrid') || !ctx.pane.getClientRects().length) return;
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    const n = g.lv.n;
    if (/^[1-9]$/.test(ev.key) && +ev.key <= n) { put(+ev.key); ev.preventDefault(); return; }
    if (ev.key === 'Backspace' || ev.key === 'Delete' || ev.key === '0') { put(0); ev.preventDefault(); return; }
    const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -n, ArrowDown: n }[ev.key];
    if (mv) { g.sel = Math.max(0, Math.min(n * n - 1, (g.sel < 0 ? 0 : g.sel) + mv)); paint(); ev.preventDefault(); }
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
      el.querySelectorAll('[data-sd]').forEach(b => b.addEventListener('click', () => start(b.dataset.sd)));
    },
    render() { if (g) render(); else ctx.back(); },
    isPlaying() { return !!g && !g.done; },
    hide() { },
    LEVELS,
    _t: { makePuzzle, countSol, conflicts, start, put, game: () => g, BY_ID, solveAll() { g.sol.forEach((v, i) => { if (!g.given[i]) { g.sel = i; put(v); } }); } }
  };
  window.PuppySudoku = api;
})();
