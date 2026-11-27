// 《汪汪小精靈 學習小伙伴》⚫ 五子棋（v3.16.0，益智挑戰的第三個遊戲）
// 13×13 棋盤，黑子先下，橫、直、斜先連成 5 顆就贏。
//   ・跟狗狗下：簡單／普通／困難，贏了照難度給星星（每天有次數上限）；一盤最多悔棋 3 次
//   ・兩個人下：同一台平板輪流下，沒有獎勵
// 狗狗的下法：看每個空位「自己能連成什麼」和「擋住對方什麼」打分數；困難會多想一步（看對方最好的回應）。
(function () {
  'use strict';

  const N = 13;
  const UNDO_MAX = 3;
  const LEVELS = [
    { id: 'gk1', key: 'easy', name: '五子棋（簡單）', short: '簡單', stars: 1, xp: 4, per: 2, desc: '狗狗剛學會下棋' },
    { id: 'gk2', key: 'normal', name: '五子棋（普通）', short: '普通', stars: 3, xp: 10, per: 2, desc: '會擋你、也會進攻' },
    { id: 'gk3', key: 'hard', name: '五子棋（困難）', short: '困難', stars: 6, xp: 20, per: 1, desc: '會多想一步，很厲害' }
  ];
  const BY_ID = {};
  LEVELS.forEach(l => { BY_ID[l.id] = l; });
  const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

  let ctx = null;
  let g = null;   // { lv（跟狗狗下）或 null（兩人）, b:[N*N] 0 空 1 黑 2 白, turn, hist:[idx], undo, over, winLine, started, result, thinking }

  const at = (b, x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? -1 : b[y * N + x];

  // 有沒有連成 5 顆：回傳那一排的位置
  function fiveAt(b, idx) {
    const c = b[idx], x0 = idx % N, y0 = Math.floor(idx / N);
    for (const [dx, dy] of DIRS) {
      const line = [idx];
      for (let k = 1; at(b, x0 + dx * k, y0 + dy * k) === c; k++) line.push((y0 + dy * k) * N + x0 + dx * k);
      for (let k = 1; at(b, x0 - dx * k, y0 - dy * k) === c; k++) line.unshift((y0 - dy * k) * N + x0 - dx * k);
      if (line.length >= 5) return line;
    }
    return null;
  }

  // 在 idx 放 c 這一色，可以連成什麼：回傳分數
  function lineScore(cnt, open) {
    if (cnt >= 5) return 100000;
    if (open === 0) return 0;
    if (cnt === 4) return open === 2 ? 20000 : 2500;
    if (cnt === 3) return open === 2 ? 2000 : 220;
    if (cnt === 2) return open === 2 ? 180 : 25;
    return open === 2 ? 12 : 2;
  }
  function pointScore(b, idx, c) {
    const x0 = idx % N, y0 = Math.floor(idx / N);
    let s = 0, big = 0;
    for (const [dx, dy] of DIRS) {
      let cnt = 1, open = 0, k;
      for (k = 1; at(b, x0 + dx * k, y0 + dy * k) === c; k++) cnt++;
      if (at(b, x0 + dx * k, y0 + dy * k) === 0) open++;
      for (k = 1; at(b, x0 - dx * k, y0 - dy * k) === c; k++) cnt++;
      if (at(b, x0 - dx * k, y0 - dy * k) === 0) open++;
      const v = lineScore(cnt, open);
      if (v >= 2000) big++;
      s += v;
    }
    if (big >= 2) s += 8000;   // 雙活三、四三：很難擋
    return s;
  }
  function candidates(b) {
    const out = [];
    let any = false;
    for (let i = 0; i < N * N; i++) {
      if (b[i]) { any = true; continue; }
      const x = i % N, y = Math.floor(i / N);
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { if (at(b, x + dx, y + dy) > 0) { near = true; break; } }
      if (near) out.push(i);
    }
    if (!any) out.push(Math.floor(N / 2) * N + Math.floor(N / 2));
    return out;
  }
  function ranked(b, me) {
    const you = me === 1 ? 2 : 1;
    return candidates(b).map(i => {
      const atk = pointScore(b, i, me), def = pointScore(b, i, you);
      const cx = Math.abs(i % N - (N - 1) / 2) + Math.abs(Math.floor(i / N) - (N - 1) / 2);
      return { i, atk, def, s: atk * 1.1 + def - cx * 0.5 };
    }).sort((a, c) => c.s - a.s);
  }
  function aiMove(b, me, key) {
    const list = ranked(b, me);
    if (!list.length) return -1;
    const win = list.find(m => m.atk >= 100000);
    if (win) return win.i;
    const mustBlock = list.filter(m => m.def >= 100000).sort((a, c) => c.s - a.s)[0];
    if (key === 'easy') {
      if (mustBlock && Math.random() < 0.6) return mustBlock.i;
      const top = list.slice(0, 6);
      return top[Math.floor(Math.random() * top.length)].i;
    }
    if (mustBlock) return mustBlock.i;
    if (key === 'normal') {
      const top = list.filter(m => m.s >= list[0].s * 0.92).slice(0, 3);
      return top[Math.floor(Math.random() * top.length)].i;
    }
    // 困難：前 10 個候選，各自看對方最好的回應
    const you = me === 1 ? 2 : 1;
    let best = null;
    list.slice(0, 10).forEach(m => {
      b[m.i] = me;
      const opp = ranked(b, you)[0];
      const mine = pointScore(b, m.i, me);
      b[m.i] = 0;
      const v = m.s + mine * 0.2 - (opp ? opp.atk * 0.9 + opp.def * 0.3 : 0);
      if (!best || v > best.v) best = { i: m.i, v };
    });
    return best.i;
  }

  // ── 開始 ──
  function start(id) {
    const lv = id ? BY_ID[id] : null;
    g = { lv, b: new Array(N * N).fill(0), turn: 1, hist: [], undo: 0, over: false, winLine: null, started: 0, result: null, thinking: false };
    ctx.enter(api);
    render();
  }

  // ── 畫面 ──
  function homeHtml() {
    const card = lv => {
      const wins = ctx.wins(lv.id), left = ctx.dayLeft(lv);
      return `<button class="pz-level${wins ? ' done' : ''}" data-gk="${lv.id}">
        <span class="pz-lv-top"><span class="pz-lv-name">🐶 跟狗狗下：${lv.short}</span></span>
        <span class="pz-lv-sub">${ctx.esc(lv.desc)}</span>
        <span class="pz-lv-prize">贏了 ⭐ ${lv.stars}　✨ ${lv.xp} XP</span>
        <span class="pz-lv-sub">${left ? `今天還可以領 ${left} 次` : '今天的獎勵領完了'}${wins ? `｜贏過 ${wins} 次` : ''}</span>
      </button>`;
    };
    return `
      <h3 class="pz-h3">⚫ 五子棋</h3>
      <p class="section-sub" style="margin-top:0;">你下黑子、先下。<b>橫、直、斜</b>先連成 <b>5 顆</b>就贏！小撇步：對方連成 3 顆、兩頭都空著的時候，一定要先擋。</p>
      <div class="pz-levels">${LEVELS.map(card).join('')}</div>
      <div class="pz-practice"><b>👫 跟同學下（同一台輪流下，沒有獎勵）：</b><button class="btn btn-soft" data-gk2="1">開始</button></div>`;
  }
  function playHtml() {
    const title = g.lv ? `⚫ 跟狗狗下五子棋（${g.lv.short}）` : '⚫ 兩個人下五子棋';
    return `
      <div class="card-box pz-play gk-play">
        <div class="pz-top">
          <b class="pz-title">${title}</b>
          <span class="pz-stat">第 <span id="gkN">0</span> 手</span>
          <button class="btn btn-soft pz-quit" id="gkQuit">離開</button>
        </div>
        <div class="pz-msg" id="gkMsg"></div>
        <svg class="gk-board" id="gkBoard" viewBox="0 0 ${N + 1} ${N + 1}"></svg>
        <div class="pz-tools">
          <button class="btn btn-soft" id="gkUndo">↶ 悔棋${g.lv ? `（剩 <span id="gkUndoN">${UNDO_MAX}</span> 次）` : ''}</button>
          <button class="btn btn-soft" id="gkNew">🔁 重新開始</button>
        </div>
        <div class="pz-result" id="gkResult" hidden></div>
      </div>`;
  }
  function paint() {
    const pane = ctx.pane, svg = pane && pane.querySelector('#gkBoard');
    if (!svg || !g) return;
    const L = [];
    for (let k = 1; k <= N; k++) {
      L.push(`<line x1="1" y1="${k}" x2="${N}" y2="${k}"/>`, `<line x1="${k}" y1="1" x2="${k}" y2="${N}"/>`);
    }
    const stars = [[3, 3], [3, 9], [9, 3], [9, 9], [6, 6]].map(([x, y]) => `<circle class="gk-dot" cx="${x + 1}" cy="${y + 1}" r="0.1"/>`).join('');
    const last = g.hist[g.hist.length - 1];
    const win = new Set(g.winLine || []);
    const st = [];
    g.b.forEach((c, i) => {
      if (!c) return;
      const x = i % N + 1, y = Math.floor(i / N) + 1;
      st.push(`<circle class="gk-stone ${c === 1 ? 'b' : 'w'}${win.has(i) ? ' win' : ''}" cx="${x}" cy="${y}" r="0.43"/>`);
      if (i === last) st.push(`<circle class="gk-last" cx="${x}" cy="${y}" r="0.12"/>`);
    });
    svg.innerHTML = `<rect class="gk-wood" x="0.2" y="0.2" width="${N + 0.6}" height="${N + 0.6}" rx="0.3"/><g class="gk-lines">${L.join('')}</g>${stars}${st.join('')}`;
    const n = pane.querySelector('#gkN'); if (n) n.textContent = g.hist.length;
    const u = pane.querySelector('#gkUndo');
    if (u) u.disabled = g.over || g.thinking || !g.hist.length || (g.lv && (g.undo >= UNDO_MAX || g.hist.length < 2));
    const un = pane.querySelector('#gkUndoN'); if (un) un.textContent = UNDO_MAX - g.undo;
  }
  function say(m, cls) { const el = ctx.pane.querySelector('#gkMsg'); if (el) { el.textContent = m; el.className = 'pz-msg' + (cls ? ' ' + cls : ''); } }
  function turnMsg() {
    if (g.over) return;
    if (g.lv) say(g.thinking ? '🐶 狗狗想一想……' : '輪到你了（⚫ 黑子），點棋盤上的交叉點下棋。');
    else say(g.turn === 1 ? '輪到 ⚫ 黑子' : '輪到 ⚪ 白子');
  }
  function render() {
    const pane = ctx.pane;
    if (!pane || !g) return;
    pane.innerHTML = playHtml();
    paint(); turnMsg();
    const on = (sel, fn) => { const el = pane.querySelector(sel); if (el) el.addEventListener('click', fn); };
    on('#gkQuit', () => {
      if (g && g.lv && g.hist.length && !g.over && !confirm('要離開這一盤嗎？這一盤不會記錄。')) return;
      g = null; ctx.back();
    });
    on('#gkNew', () => { if (g.hist.length && !g.over && !confirm('要重新開始嗎？')) return; start(g.lv ? g.lv.id : null); });
    on('#gkUndo', undo);
    pane.querySelector('#gkBoard').addEventListener('click', onClick);
    if (g.over && g.result) showResult();
    ctx.focus();
  }

  // ── 下棋 ──
  function place(i) {
    g.b[i] = g.turn;
    g.hist.push(i);
    if (!g.started) g.started = Date.now();
    const line = fiveAt(g.b, i);
    if (line) { g.winLine = line; finish(g.turn); return true; }
    if (g.hist.length >= N * N) { finish(0); return true; }
    g.turn = g.turn === 1 ? 2 : 1;
    return false;
  }
  function onClick(ev) {
    if (!g || g.over || g.thinking) return;
    if (g.lv && g.turn !== 1) return;
    const svg = ctx.pane.querySelector('#gkBoard'), m = svg.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
    const x = Math.round(p.x) - 1, y = Math.round(p.y) - 1;
    if (x < 0 || y < 0 || x >= N || y >= N || Math.hypot(p.x - x - 1, p.y - y - 1) > 0.48) return;
    play(y * N + x);
  }
  function play(i) {
    if (!g || g.over || g.b[i]) return false;
    const ended = place(i);
    paint();
    if (ended || !g.lv) { turnMsg(); return true; }
    g.thinking = true; turnMsg(); paint();
    const mine = g;
    setTimeout(() => {
      if (g !== mine || g.over) return;
      const j = aiMove(g.b, 2, g.lv.key);
      g.thinking = false;
      if (j >= 0) place(j);
      paint(); turnMsg();
    }, 350);
    return true;
  }
  function undo() {
    if (!g || g.over || g.thinking || !g.hist.length) return;
    const n = g.lv ? 2 : 1;
    if (g.lv && (g.undo >= UNDO_MAX || g.hist.length < 2)) return;
    for (let k = 0; k < n; k++) { const i = g.hist.pop(); g.b[i] = 0; }
    if (g.lv) g.undo++;
    else g.turn = g.turn === 1 ? 2 : 1;
    paint(); turnMsg();
  }
  function finish(winner) {
    g.over = true;
    const sec = Math.max(1, Math.round((Date.now() - (g.started || Date.now())) / 1000));
    if (!g.lv) {
      g.result = { text: winner === 1 ? '⚫ 黑子贏了！' : winner === 2 ? '⚪ 白子贏了！' : '平手！' };
    } else if (winner === 1) {
      const r = ctx.grant(g.lv, sec, g.hist.length);
      g.result = Object.assign({ text: '🎉 你贏了狗狗！', win: true }, r);
    } else {
      g.result = { text: winner === 2 ? '🐶 這一盤狗狗贏了，再試一次！' : '平手！', lose: true };
      if (winner === 2) ctx.petSay('汪！這一盤我贏了～再來一盤吧！');
    }
    paint();
    showResult();
  }
  function showResult() {
    const box = ctx.pane.querySelector('#gkResult'), r = g.result;
    if (!box || !r) return;
    box.hidden = false;
    box.className = 'pz-result' + (r.lose ? ' lose' : '');
    box.innerHTML = `
      <div class="pz-win">${r.text}</div>
      ${r.win ? `<div class="ty-result-grid"><div><b>${g.hist.length}</b><span>手數</span></div><div><b>${r.stars ? '+' + r.stars + '⭐' : '—'}</b><span>星星</span></div><div><b>${r.xp ? '+' + r.xp : '—'}</b><span>經驗值</span></div></div>` : ''}
      ${r.note ? `<p class="ty-note">${ctx.esc(r.note)}</p>` : ''}
      <div class="pz-result-btns">
        <button class="btn btn-soft" id="gkHome">回到益智挑戰</button>
        <button class="btn btn-orange" id="gkAgain">🔁 再下一盤</button>
      </div>`;
    const on = (sel, fn) => { const el = box.querySelector(sel); if (el) el.addEventListener('click', fn); };
    on('#gkHome', () => { g = null; ctx.back(); });
    on('#gkAgain', () => start(g.lv ? g.lv.id : null));
    say('');
  }

  const api = {
    attach(c) { ctx = c; },
    home(el) {
      el.innerHTML = homeHtml();
      el.querySelectorAll('[data-gk]').forEach(b => b.addEventListener('click', () => start(b.dataset.gk)));
      el.querySelectorAll('[data-gk2]').forEach(b => b.addEventListener('click', () => start(null)));
    },
    render() { if (g) render(); else ctx.back(); },
    isPlaying() { return !!g && !g.over; },
    hide() { },
    LEVELS,
    _t: { start, play, aiMove, fiveAt, pointScore, game: () => g, N, undo }
  };
  window.PuppyGomoku = api;
})();
