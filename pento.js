// 《汪汪小精靈 學習小伙伴》🟩 五格骨牌（v3.29.0，益智挑戰）
// 每塊骨牌都是 5 個正方形。把下面的骨牌全部放進框框，剛好拼滿就過關（3 塊 → 12 塊大師級）。
//   ・拖曳骨牌到框框裡：自動對齊格子（吸附）
//   ・點一下骨牌：轉 90 度；連點兩下：左右翻面（也可以按下面的「⟳ 轉」「⇋ 翻」按鈕，轉最後碰過的那塊）
//   ・把框框裡的骨牌拖出框外：放回下面；↶ 復原：退回上一步
(function () {
  'use strict';
  const SHAPES = { F: [[1,0],[2,0],[0,1],[1,1],[1,2]], I: [[0,0],[0,1],[0,2],[0,3],[0,4]], L: [[0,0],[0,1],[0,2],[0,3],[1,3]], N: [[1,0],[1,1],[0,2],[1,2],[0,3]], P: [[0,0],[1,0],[0,1],[1,1],[0,2]], T: [[0,0],[1,0],[2,0],[1,1],[1,2]], U: [[0,0],[2,0],[0,1],[1,1],[2,1]], V: [[0,0],[0,1],[0,2],[1,2],[2,2]], W: [[0,0],[0,1],[1,1],[1,2],[2,2]], X: [[1,0],[0,1],[1,1],[2,1],[1,2]], Y: [[1,0],[0,1],[1,1],[1,2],[1,3]], Z: [[0,0],[1,0],[1,1],[1,2],[2,2]] };
  const COLORS = { F: '#ef5350', I: '#42a5f5', L: '#ffb300', N: '#66bb6a', P: '#ab47bc', T: '#ff7043', U: '#26c6da', V: '#ec407a', W: '#8d6e63', X: '#ffca28', Y: '#5c6bc0', Z: '#9ccc65' };
  // 每一關：框框寬 w、高 h、用哪幾塊（set）；sol＝一種拼法（自動測試用）
  const RAW = [{"w":3,"h":5,"set":"LTY","sol":[["L",[[0,0],[0,1],[0,2],[0,3],[1,0]]],["Y",[[1,1],[2,0],[2,1],[2,2],[2,3]]],["T",[[0,4],[1,2],[1,3],[1,4],[2,4]]]]},{"w":4,"h":5,"set":"LPVZ","sol":[["L",[[0,0],[0,1],[1,0],[2,0],[3,0]]],["P",[[1,1],[2,1],[2,2],[3,1],[3,2]]],["V",[[0,2],[0,3],[0,4],[1,4],[2,4]]],["Z",[[1,2],[1,3],[2,3],[3,3],[3,4]]]]},{"w":5,"h":5,"set":"LNUWY","sol":[["Y",[[0,0],[0,1],[0,2],[0,3],[1,1]]],["L",[[1,0],[2,0],[3,0],[4,0],[4,1]]],["W",[[1,2],[1,3],[2,1],[2,2],[3,1]]],["U",[[3,2],[3,4],[4,2],[4,3],[4,4]]],["N",[[0,4],[1,4],[2,3],[2,4],[3,3]]]]},{"w":6,"h":5,"set":"FIPTVZ","sol":[["P",[[0,0],[0,1],[1,0],[1,1],[2,0]]],["V",[[3,0],[4,0],[5,0],[5,1],[5,2]]],["F",[[1,2],[2,1],[2,2],[3,2],[3,3]]],["Z",[[3,1],[4,1],[4,2],[4,3],[5,3]]],["T",[[0,2],[0,3],[0,4],[1,3],[2,3]]],["I",[[1,4],[2,4],[3,4],[4,4],[5,4]]]]},{"w":7,"h":5,"set":"FLPTUXY","sol":[["U",[[0,0],[0,1],[1,0],[2,0],[2,1]]],["F",[[2,2],[3,0],[3,1],[3,2],[4,1]]],["T",[[4,0],[5,0],[5,1],[5,2],[6,0]]],["P",[[0,2],[0,3],[1,1],[1,2],[1,3]]],["L",[[5,4],[6,1],[6,2],[6,3],[6,4]]],["X",[[3,3],[4,2],[4,3],[4,4],[5,3]]],["Y",[[0,4],[1,4],[2,3],[2,4],[3,4]]]]},{"w":8,"h":5,"set":"FILNPUXY","sol":[["N",[[0,0],[0,1],[0,2],[1,2],[1,3]]],["I",[[1,0],[2,0],[3,0],[4,0],[5,0]]],["U",[[6,0],[6,2],[7,0],[7,1],[7,2]]],["F",[[1,1],[2,1],[2,2],[2,3],[3,2]]],["Y",[[3,1],[4,1],[5,1],[5,2],[6,1]]],["X",[[3,3],[4,2],[4,3],[4,4],[5,3]]],["L",[[0,3],[0,4],[1,4],[2,4],[3,4]]],["P",[[5,4],[6,3],[6,4],[7,3],[7,4]]]]},{"w":10,"h":5,"set":"ILNPTVWXYZ","sol":[["Y",[[0,0],[0,1],[0,2],[0,3],[1,2]]],["Z",[[1,0],[1,1],[2,1],[3,1],[3,2]]],["V",[[2,0],[3,0],[4,0],[4,1],[4,2]]],["P",[[5,0],[5,1],[6,0],[6,1],[7,1]]],["T",[[7,0],[8,0],[8,1],[8,2],[9,0]]],["L",[[8,4],[9,1],[9,2],[9,3],[9,4]]],["W",[[0,4],[1,3],[1,4],[2,2],[2,3]]],["N",[[3,3],[4,3],[5,2],[5,3],[6,2]]],["X",[[6,3],[7,2],[7,3],[7,4],[8,3]]],["I",[[2,4],[3,4],[4,4],[5,4],[6,4]]]]},{"w":12,"h":5,"set":"FILNPTUVWXYZ","sol":[["F",[[0,0],[0,1],[1,1],[1,2],[2,1]]],["I",[[1,0],[2,0],[3,0],[4,0],[5,0]]],["N",[[4,1],[5,1],[6,0],[6,1],[7,0]]],["W",[[7,1],[7,2],[8,0],[8,1],[9,0]]],["P",[[9,1],[10,0],[10,1],[11,0],[11,1]]],["X",[[2,2],[3,1],[3,2],[3,3],[4,2]]],["T",[[0,2],[0,3],[0,4],[1,3],[2,3]]],["V",[[5,2],[5,3],[5,4],[6,4],[7,4]]],["Z",[[6,2],[6,3],[7,3],[8,3],[8,4]]],["Y",[[8,2],[9,2],[10,2],[10,3],[11,2]]],["L",[[1,4],[2,4],[3,4],[4,3],[4,4]]],["U",[[9,3],[9,4],[10,4],[11,3],[11,4]]]]}];
  const LEVELS = RAW.map((pz, k) => {
    const n = pz.set.length, tier = n <= 4 ? 0 : n <= 7 ? 1 : 2;
    return { id: 'pe' + String(k + 1).padStart(2, '0'), no: k + 1, name: `五格骨牌第 ${k + 1} 關`, short: `${n} 塊（${pz.w}×${pz.h}）`, desc: n >= 12 ? '大師級' : ['入門', '進階', '高手'][tier], stars: n >= 12 ? 8 : [1, 2, 4][tier], xp: n >= 12 ? 30 : [4, 8, 15][tier], per: 1, pz };
  });
  const BY_ID = {};
  LEVELS.forEach(l => { BY_ID[l.id] = l; });
  const TS = 0.7;                 // 下面盤子裡的骨牌縮小
  let ctx = null, g = null, drag = null, lastTap = { i: -1, t: 0 }, tapT = null;
  const fx = k => { try { window.PuppyFx && window.PuppyFx.tone(k); } catch (e) { /* 忽略 */ } };
  const norm = c => { const mx = Math.min(...c.map(p => p[0])), my = Math.min(...c.map(p => p[1])); return c.map(p => [p[0] - mx, p[1] - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
  const rot = c => norm(c.map(p => [-p[1], p[0]]));
  const flip = c => norm(c.map(p => [-p[0], p[1]]));
  const VW = () => Math.max(g.lv.pz.w, 10) + 1;
  const boardX = () => (VW() - g.lv.pz.w) / 2;
  const trayY = () => g.lv.pz.h + 1;
  const PER_ROW = () => Math.floor(VW() / (3 * TS * 1.0 + 0.4 + 0.3));
  function slotXY(k) {
    const per = Math.max(4, Math.floor((VW() - 0.4) / 3.0)), row = Math.floor(k / per), col = k % per;
    return [0.4 + col * 3.0, trayY() + 0.3 + row * 3.2];
  }
  function trayRows() { const per = Math.max(4, Math.floor((VW() - 0.4) / 3.0)); return Math.ceil(g.pieces.length / per); }
  function occ(skip) {
    const s = new Set();
    g.pieces.forEach((p, i) => { if (i === skip || !p.at) return; p.c.forEach(q => s.add((p.at[0] + q[0]) + ',' + (p.at[1] + q[1]))); });
    return s;
  }
  function fits(i, c, at) {
    const pz = g.lv.pz, o = occ(i);
    return c.every(q => { const x = at[0] + q[0], y = at[1] + q[1]; return x >= 0 && y >= 0 && x < pz.w && y < pz.h && !o.has(x + ',' + y); });
  }
  const full = () => g.pieces.every(p => p.at);

  function start(id) {
    const lv = BY_ID[id];
    if (!lv) return;
    g = { lv, pieces: lv.pz.set.split('').map(n => ({ n, c: norm(SHAPES[n]), at: null })), undo: [], moves: 0, started: 0, done: false, result: null, last: 0 };
    ctx.enter(api);
    render();
  }
  function homeHtml() {
    const card = lv => {
      const wins = ctx.wins(lv.id), left = ctx.dayLeft(lv);
      return `<button class="pz-level${wins ? ' done' : ''}" data-pel="${lv.id}">
        <span class="pz-lv-top"><span class="pz-lv-name">${wins ? '✅ ' : ''}${ctx.esc(lv.short)}</span><span class="pz-lv-desc">${ctx.esc(lv.desc)}</span></span>
        <span class="pz-lv-prize">⭐ ${lv.stars}　✨ ${lv.xp} XP</span>
        <span class="pz-lv-sub">${left ? '今天可以領獎勵' : '今天的獎勵領完了'}</span></button>`;
    };
    return `<h3 class="pz-h3">🟩 五格骨牌（空間拼圖）</h3>
      <p class="section-sub" style="margin-top:0;">每塊骨牌都由 <b>5 個正方形</b>組成。把下面的骨牌<b>全部</b>放進框框，剛好拼滿就過關！<b>拖曳</b>放進去、<b>點一下</b>轉向、<b>連點兩下</b>翻面。</p>
      <div class="pz-levels">${LEVELS.map(card).join('')}</div>`;
  }
  function playHtml() {
    return `<div class="card-box pz-play">
      <div class="pz-top"><b class="pz-title">🟩 ${ctx.esc(g.lv.name)}（${g.lv.pz.set.length} 塊）</b><button class="btn btn-soft pz-quit" id="peQuit">離開</button></div>
      <div class="pz-msg" id="peMsg">把下面的骨牌拖進框框裡，全部拼滿！</div>
      <svg class="ng-board pe-board" id="peBoard"></svg>
      <div class="ng-tools">
        <button class="btn btn-soft" id="peRot">⟳ 轉</button><button class="btn btn-soft" id="peFlip">⇋ 翻</button>
        <button class="btn btn-soft" id="peUndo">↶ 復原</button><button class="btn btn-soft" id="peReset">🗑 全部拿出來</button>
      </div>
      <p class="section-sub pz-tip">👆 拖曳：放進框框（自動對齊）｜ 點一下：轉 ｜ 連點兩下：翻面 ｜ 拖出框外：放回</p>
      <div class="pz-result" id="peResult" hidden></div></div>`;
  }
  function pieceSvg(p, i, x, y, s, cls) {
    return `<g class="pe-piece${cls || ''}" data-i="${i}" transform="translate(${x} ${y}) scale(${s})">${p.c.map(q => `<rect x="${q[0] + 0.03}" y="${q[1] + 0.03}" width=".94" height=".94" rx=".16" fill="${COLORS[p.n]}"/>`).join('')}</g>`;
  }
  function paint() {
    const svg = ctx.pane && ctx.pane.querySelector('#peBoard');
    if (!svg || !g) return;
    const pz = g.lv.pz, bx = boardX(), vh = trayY() + 0.3 + trayRows() * 3.2;
    svg.setAttribute('viewBox', `0 -0.3 ${VW()} ${vh + 0.3}`);
    let h = `<rect class="pe-frame" x="${bx - 0.12}" y="-0.12" width="${pz.w + 0.24}" height="${pz.h + 0.24}" rx=".25"/>`;
    for (let y = 0; y < pz.h; y++) for (let x = 0; x < pz.w; x++) h += `<rect class="pe-cell" x="${bx + x + 0.04}" y="${y + 0.04}" width=".92" height=".92" rx=".12"/>`;
    h += `<rect class="pe-tray" x="0.1" y="${trayY() - 0.1}" width="${VW() - 0.2}" height="${vh - trayY() + 0.1}" rx=".3"/>`;
    let k = 0;
    g.pieces.forEach((p, i) => {
      if (drag && drag.i === i && drag.moved) { if (!p.at) k++; return; }
      if (p.at) h += pieceSvg(p, i, bx + p.at[0], p.at[1], 1, g.done ? ' won' : '');
      else { const [sx, sy] = slotXY(k++); h += pieceSvg(p, i, sx, sy, TS, i === g.last ? ' last' : ''); }
    });
    if (drag && drag.moved) {
      const p = g.pieces[drag.i], ax = Math.round(drag.x - drag.ox - bx), ay = Math.round(drag.y - drag.oy);
      if (fits(drag.i, p.c, [ax, ay])) h += pieceSvg(p, drag.i, bx + ax, ay, 1, ' shadow');
      h += pieceSvg(p, drag.i, drag.x - drag.ox, drag.y - drag.oy, 1, ' drag');
    }
    svg.innerHTML = h;
    const u = ctx.pane.querySelector('#peUndo'); if (u) u.disabled = !g.undo.length || g.done;
  }
  function say(m) { const el = ctx.pane.querySelector('#peMsg'); if (el) el.textContent = m; }
  function push() { g.undo.push(JSON.stringify(g.pieces)); if (g.undo.length > 100) g.undo.shift(); }
  function undo() { if (!g || g.done || !g.undo.length) return; g.pieces = JSON.parse(g.undo.pop()); fx('undo'); paint(); }
  function render() {
    const pane = ctx.pane;
    if (!pane || !g) return;
    pane.innerHTML = playHtml();
    paint();
    const svg = pane.querySelector('#peBoard');
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    pane.querySelector('#peQuit').addEventListener('click', () => { g = null; ctx.back(); });
    pane.querySelector('#peUndo').addEventListener('click', undo);
    pane.querySelector('#peRot').addEventListener('click', () => turn(g.last, false));
    pane.querySelector('#peFlip').addEventListener('click', () => turn(g.last, true));
    pane.querySelector('#peReset').addEventListener('click', () => { if (g.done || !g.pieces.some(p => p.at)) return; push(); g.pieces.forEach(p => { p.at = null; }); fx('remove'); paint(); });
    if (g.done && g.result) showResult();
    ctx.focus();
  }
  function svgPt(ev) {
    const svg = ctx.pane.querySelector('#peBoard'), m = svg.getScreenCTM();
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  }
  function onDown(ev) {
    if (!g || g.done || drag) return;
    const t = ev.target.closest && ev.target.closest('.pe-piece');
    if (!t) return;
    const i = +t.dataset.i, p = g.pieces[i], [x, y] = svgPt(ev);
    let ox, oy;
    if (p.at) { ox = x - (boardX() + p.at[0]); oy = y - p.at[1]; }
    else { const k = g.pieces.slice(0, i).filter(q => !q.at).length, [sx, sy] = slotXY(k); ox = (x - sx) / TS; oy = (y - sy) / TS; }
    drag = { i, id: ev.pointerId, x0: x, y0: y, x, y, ox, oy, moved: false };
    g.last = i;
    try { ctx.pane.querySelector('#peBoard').setPointerCapture(ev.pointerId); } catch (e) { /* 忽略 */ }
    ev.preventDefault();
  }
  function onMove(ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    const [x, y] = svgPt(ev);
    if (!drag.moved && Math.hypot(x - drag.x0, y - drag.y0) < 0.25) return;
    drag.moved = true; drag.x = x; drag.y = y;
    paint();
  }
  function onUp(ev) {
    if (!drag || (ev.pointerId !== undefined && ev.pointerId !== drag.id)) return;
    const d = drag; drag = null;
    if (!d.moved) { tap(d.i); paint(); return; }
    drop(d.i, Math.round(d.x - d.ox - boardX()), Math.round(d.y - d.oy));
  }
  // 放到框框的 (ax, ay)；放不下就回盤子
  function drop(i, ax, ay) {
    const p = g.pieces[i];
    push();
    if (fits(i, p.c, [ax, ay])) { p.at = [ax, ay]; fx('place'); }
    else { const was = !!p.at; p.at = null; if (was) fx('remove'); else { g.undo.pop(); fx('bad'); say('那裡放不下喔！換個位置或轉一轉。'); } }
    after();
  }
  function tap(i) {
    const now = Date.now();
    if (lastTap.i === i && now - lastTap.t < 330) { clearTimeout(tapT); lastTap = { i: -1, t: 0 }; turn(i, true); return; }
    lastTap = { i, t: now };
    clearTimeout(tapT);
    tapT = setTimeout(() => turn(i, false), 260);
  }
  function turn(i, isFlip) {
    if (!g || g.done || i == null || !g.pieces[i]) return;
    const p = g.pieces[i], nc = isFlip ? flip(p.c) : rot(p.c);
    push();
    p.c = nc;
    if (p.at && !fits(i, nc, p.at)) { p.at = null; say('轉了之後放不下，先放回下面了。'); }
    fx('rotate');
    g.last = i;
    after();
  }
  function after() {
    if (!g.started) g.started = Date.now();
    g.moves++;
    if (full()) { finish(); return; }
    paint();
    const left = g.pieces.filter(p => !p.at).length;
    if (left) say(`還有 ${left} 塊要放進去。`);
  }
  function finish() {
    g.done = true;
    paint();
    const sec = Math.max(1, Math.round((Date.now() - g.started) / 1000));
    g.result = Object.assign({ sec }, ctx.grant(g.lv, sec, g.moves));
    fx('win');
    try { window.PuppyFx && window.PuppyFx.confetti(ctx.pane.querySelector('.pz-play')); } catch (e) { /* 忽略 */ }
    showResult();
  }
  function showResult() {
    const box = ctx.pane.querySelector('#peResult'), r = g.result;
    if (!box || !r) return;
    const idx = LEVELS.indexOf(g.lv), next = LEVELS[idx + 1];
    box.hidden = false;
    box.innerHTML = `<div class="pz-win">🟩 拼滿了！用了 ${ctx.fmtTime(r.sec)}</div>
      <div class="ty-result-grid"><div><b>${r.stars ? '+' + r.stars + '⭐' : '—'}</b><span>星星</span></div><div><b>${r.xp ? '+' + r.xp : '—'}</b><span>經驗值</span></div></div>
      ${r.note ? `<p class="ty-note">${ctx.esc(r.note)}</p>` : ''}
      <div class="pz-result-btns"><button class="btn btn-soft" id="peHome">回到益智挑戰</button>${next ? '<button class="btn btn-orange" id="peNext">下一關 ▶</button>' : ''}</div>`;
    box.querySelector('#peHome').addEventListener('click', () => { g = null; ctx.back(); });
    const nb = box.querySelector('#peNext'); if (nb) nb.addEventListener('click', () => start(next.id));
    say('');
  }
  const api = {
    attach(c) { ctx = c; },
    home(el) { el.innerHTML = homeHtml(); el.querySelectorAll('[data-pel]').forEach(b => b.addEventListener('click', () => start(b.dataset.pel))); },
    render() { if (g) render(); else ctx.back(); },
    isPlaying() { return !!g && !g.done; },
    hide() { drag = null; },
    LEVELS,
    _t: { start, game: () => g, drop, turn, undo, RAW, rot, flip, norm, SHAPES,
      // 自動測試：每一關的答案都是 5 格的骨牌、剛好拼滿、不重疊，形狀跟骨牌一樣（可轉可翻）
      checkAll() {
        const key = c => JSON.stringify(norm(c));
        const forms = n => { const out = new Set(); let c = SHAPES[n]; for (let f = 0; f < 2; f++) { for (let r = 0; r < 4; r++) { out.add(key(c)); c = rot(c); } c = flip(c); } return out; };
        return RAW.every(pz => { const seen = new Set(); let ok = pz.sol.length === pz.set.length; pz.sol.forEach(([n, cells]) => { if (!forms(n).has(key(cells))) ok = false; cells.forEach(q => { const k = q.join(); if (seen.has(k) || q[0] < 0 || q[1] < 0 || q[0] >= pz.w || q[1] >= pz.h) ok = false; seen.add(k); }); }); return ok && seen.size === pz.w * pz.h; });
      },
      solvePlace() { g.lv.pz.sol.forEach(([n, cells]) => { const i = g.pieces.findIndex(p => p.n === n); const c = norm(cells); const mx = Math.min(...cells.map(q => q[0])), my = Math.min(...cells.map(q => q[1])); g.pieces[i].c = c; g.pieces[i].at = null; drop(i, mx, my); }); } }
  };
  window.PuppyPento = api;
})();
