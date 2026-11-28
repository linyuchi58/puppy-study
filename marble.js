// 《汪汪小精靈 學習小伙伴》🎱 滾珠軌道（v3.31.0，益智挑戰的物理實驗）
// 在格子裡擺斜坡、彈簧，按「▶ 開始」讓彈珠滾進終點的杯子。失敗了就調整再試（試錯→調整→成功）。
//   ・選零件再點格子放上去；點已放的斜坡：換方向（／ ↔ ＼）；「🧽 拿掉」收回；↶ 復原
//   ・紫色傳送門是題目放好的：彈珠掉進 A 會從 B 出來
//   ・自己寫的小小 2D 物理（重力、碰撞、反彈），不用外部函式庫
(function () {
  'use strict';
  const W = 8, H = 6, R = 0.22, GRAV = 22, DT = 1 / 240;
  // 每一關：start 彈珠起點；goal 終點格；blocks 擋住的格子；portals [[ax,ay,bx,by]]；inv 零件數；sol 一種答案（自動測試用）
  const RAW = [
    { start: [0.5, 0.4], goal: [7, 5], blocks: [], portals: [], inv: { r: 1, s: 0 }, sol: [[0, 3, 'r', 1]] },
    { start: [7.5, 0.4], goal: [0, 5], blocks: [[3, 5]], portals: [], inv: { r: 2, s: 0 }, sol: [[7, 3, 'r', 0], [4, 5, 'r', 1]] },
    { start: [0.5, 0.4], goal: [7, 0], blocks: [[6, 1], [7, 1]], portals: [], inv: { r: 1, s: 1 }, sol: [[0, 1, 'r', 1], [1, 2, 's', 0]] },
    { start: [0.5, 0.4], goal: [7, 5], blocks: [[2, 5], [5, 5], [5, 4]], portals: [[3, 4, 6, 0]], inv: { r: 2, s: 0 }, sol: [[0, 2, 'r', 1], [1, 3, 'r', 1]] },
    { start: [4.5, 0.4], goal: [0, 0], blocks: [[0, 1], [1, 1]], portals: [], inv: { r: 1, s: 1 }, sol: [[4, 2, 'r', 0], [3, 3, 's', 0]] },
    { start: [0.5, 0.4], goal: [7, 2], blocks: [[7, 3], [6, 3], [4, 5], [4, 4]], portals: [[3, 5, 2, 0]], inv: { r: 2, s: 1 }, sol: [[0, 2, 'r', 1]] }
  ];
  const LEVELS = RAW.map((pz, k) => {
    const tier = k < 2 ? 0 : k < 4 ? 1 : 2;
    return { id: 'mb' + String(k + 1).padStart(2, '0'), no: k + 1, name: `滾珠軌道第 ${k + 1} 關`, short: `第 ${k + 1} 關`, desc: ['斜坡', '彈簧和傳送門', '大師'][tier], stars: [1, 2, 3][tier], xp: [3, 6, 10][tier], per: 1, pz };
  });
  const BY_ID = {};
  LEVELS.forEach(l => { BY_ID[l.id] = l; });
  const fx = k => { try { window.PuppyFx && window.PuppyFx.tone(k); } catch (e) { /* 忽略 */ } };
  const key = (x, y) => x + ',' + y;

  // ── 物理：線段＝[x1,y1,x2,y2,種類]；種類 w 牆、r 斜坡、s 彈簧 ──
  function segments(pz, parts) {
    const S = [[0, 0, 0, H, 'w'], [W, 0, W, H, 'w'], [0, H, W, H, 'w']];
    pz.blocks.forEach(([x, y]) => { S.push([x, y, x + 1, y, 'w'], [x, y + 1, x + 1, y + 1, 'w'], [x, y, x, y + 1, 'w'], [x + 1, y, x + 1, y + 1, 'w']); });
    Object.keys(parts).forEach(k => {
      const [x, y] = k.split(',').map(Number), p = parts[k];
      if (p.k === 'r') S.push(p.o ? [x, y, x + 1, y + 1, 'r'] : [x, y + 1, x + 1, y, 'r']);
      else S.push([x + 0.1, y + 0.85, x + 0.9, y + 0.85, 's']);
    });
    return S;
  }
  // 跑一步（dt 秒）；回傳事件：'goal'、'spring'、'portal'、'hit'
  function step(b, S, pz) {
    let ev = null;
    b.vy += GRAV * DT;
    b.x += b.vx * DT; b.y += b.vy * DT;
    for (const s of S) {
      const dx = s[2] - s[0], dy = s[3] - s[1], L2 = dx * dx + dy * dy;
      let t = ((b.x - s[0]) * dx + (b.y - s[1]) * dy) / L2; t = Math.max(0, Math.min(1, t));
      const px = s[0] + t * dx, py = s[1] + t * dy, ex = b.x - px, ey = b.y - py, d = Math.hypot(ex, ey);
      if (d >= R || d === 0) continue;
      const nx = ex / d, ny = ey / d, vn = b.vx * nx + b.vy * ny;
      b.x = px + nx * R; b.y = py + ny * R;
      if (vn < 0) {
        if (s[4] === 's' && ny < -0.5) { b.vy = -12.5; ev = 'spring'; continue; }
        const e = s[4] === 'w' ? 0.35 : 0.15;
        b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
        b.vx *= 0.9995; b.vy *= 0.9995;
        if (vn < -3) ev = ev || 'hit';
      }
    }
    const cx = Math.floor(b.x), cy = Math.floor(b.y);
    if (b.portalCd > 0) b.portalCd -= DT;
    else for (const p of pz.portals) {
      if (cx === p[0] && cy === p[1]) { b.x = p[2] + 0.5; b.y = p[3] + 0.5; b.portalCd = 0.3; ev = 'portal'; }
    }
    if (cx === pz.goal[0] && cy === pz.goal[1]) ev = 'goal';
    return ev;
  }
  // 整段模擬（自動測試用）：回傳 true＝進終點
  function simulate(pz, parts, maxSec) {
    const S = segments(pz, parts), b = { x: pz.start[0], y: pz.start[1], vx: 0, vy: 0, portalCd: 0 };
    for (let i = 0; i < (maxSec || 12) / DT; i++) { if (step(b, S, pz) === 'goal') return true; }
    return false;
  }
  const partsOf = sol => { const o = {}; sol.forEach(s => { o[key(s[0], s[1])] = { k: s[2], o: s[3] }; }); return o; };

  let ctx = null, g = null, tool = 'r', raf = 0;
  function start(id) {
    const lv = BY_ID[id];
    if (!lv) return;
    stopRun();
    g = { lv, parts: {}, undo: [], moves: 0, tries: 0, started: 0, done: false, result: null, run: null };
    tool = lv.pz.inv.r ? 'r' : 's';
    ctx.enter(api);
    render();
  }
  function homeHtml() {
    const card = lv => {
      const wins = ctx.wins(lv.id), left = ctx.dayLeft(lv);
      return `<button class="pz-level${wins ? ' done' : ''}" data-mbl="${lv.id}">
        <span class="pz-lv-top"><span class="pz-lv-name">${wins ? '✅ ' : ''}${ctx.esc(lv.short)}</span><span class="pz-lv-desc">${ctx.esc(lv.desc)}</span></span>
        <span class="pz-lv-prize">⭐ ${lv.stars}　✨ ${lv.xp} XP</span>
        <span class="pz-lv-sub">${left ? '今天可以領獎勵' : '今天的獎勵領完了'}</span></button>`;
    };
    return `<h3 class="pz-h3">🎱 滾珠軌道（物理實驗）</h3>
      <p class="section-sub" style="margin-top:0;">擺好<b>斜坡</b>和<b>彈簧</b>，按「▶ 開始」讓彈珠滾進終點的<b>杯子 🏆</b>！沒成功也沒關係：看看彈珠怎麼跑，調整一下再試。零件無限次重來，不會滿地找彈珠 😄</p>
      <div class="pz-levels">${LEVELS.map(card).join('')}</div>`;
  }
  function playHtml() {
    const inv = g.lv.pz.inv;
    return `<div class="card-box pz-play">
      <div class="pz-top"><b class="pz-title">🎱 ${ctx.esc(g.lv.name)}</b><button class="btn btn-soft pz-quit" id="mbQuit">離開</button></div>
      <div class="pz-msg" id="mbMsg">選零件、點格子放上去，再按「▶ 開始」。</div>
      <canvas class="ng-board mb-board" id="mbCanvas" width="800" height="600"></canvas>
      <div class="ng-tools">
        <button class="btn btn-orange" id="mbGo">▶ 開始</button>
        ${inv.r ? `<button class="btn btn-soft ng-tool" data-tool="r">📐 斜坡 <b id="mbLeftr"></b></button>` : ''}
        ${inv.s ? `<button class="btn btn-soft ng-tool" data-tool="s">🌀 彈簧 <b id="mbLefts"></b></button>` : ''}
        <button class="btn btn-soft ng-tool" data-tool="x">🧽 拿掉</button>
        <button class="btn btn-soft" id="mbUndo">↶ 復原</button>
      </div>
      <p class="section-sub pz-tip">👆 點格子：放零件 ｜ 點斜坡：換方向 ｜ 🟣 傳送門：從 A 進、從 B 出</p>
      <div class="pz-result" id="mbResult" hidden></div></div>`;
  }
  const used = k => Object.values(g.parts).filter(p => p.k === k).length;
  function draw() {
    const cv = ctx.pane && ctx.pane.querySelector('#mbCanvas');
    if (!cv || !g) return;
    const c = cv.getContext('2d'), s = 100, pz = g.lv.pz;
    const grd = c.createLinearGradient(0, 0, 0, 600); grd.addColorStop(0, '#e3f2fd'); grd.addColorStop(1, '#fff8e1');
    c.fillStyle = grd; c.fillRect(0, 0, 800, 600);
    c.strokeStyle = 'rgba(100,130,170,.18)'; c.lineWidth = 2;
    for (let x = 1; x < W; x++) { c.beginPath(); c.moveTo(x * s, 0); c.lineTo(x * s, 600); c.stroke(); }
    for (let y = 1; y < H; y++) { c.beginPath(); c.moveTo(0, y * s); c.lineTo(800, y * s); c.stroke(); }
    // 終點杯子
    const [gx, gy] = pz.goal, glow = g.run && g.run.win ? 1 : 0.5 + 0.3 * Math.sin(Date.now() / 300);
    c.fillStyle = `rgba(255,213,79,${glow})`; c.fillRect(gx * s + 6, gy * s + 6, s - 12, s - 12);
    c.font = '54px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏆', gx * s + 50, gy * s + 54);
    pz.blocks.forEach(([x, y]) => { c.fillStyle = '#8d6e63'; c.fillRect(x * s + 2, y * s + 2, s - 4, s - 4); c.fillStyle = '#a1887f'; c.fillRect(x * s + 8, y * s + 8, s - 16, 14); });
    pz.portals.forEach(p => {
      [[p[0], p[1], 'A'], [p[2], p[3], 'B']].forEach(([x, y, t]) => {
        c.beginPath(); c.ellipse(x * s + 50, y * s + 50, 34, 40, 0, 0, Math.PI * 2);
        c.fillStyle = 'rgba(156,39,176,.25)'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#9c27b0'; c.stroke();
        c.fillStyle = '#6a1b9a'; c.font = 'bold 28px sans-serif'; c.fillText(t, x * s + 50, y * s + 52);
      });
    });
    Object.keys(g.parts).forEach(k => {
      const [x, y] = k.split(',').map(Number), p = g.parts[k];
      if (p.k === 'r') {
        c.lineWidth = 12; c.lineCap = 'round'; c.strokeStyle = '#ff7043';
        c.beginPath(); if (p.o) { c.moveTo(x * s, y * s); c.lineTo(x * s + s, y * s + s); } else { c.moveTo(x * s, y * s + s); c.lineTo(x * s + s, y * s); } c.stroke();
      } else {
        c.strokeStyle = '#43a047'; c.lineWidth = 5; c.beginPath();
        for (let i = 0; i <= 8; i++) c.lineTo(x * s + 20 + i * 7.5, y * s + 85 - (i % 2 ? 0 : 14) + 10);
        c.stroke(); c.fillStyle = '#66bb6a'; c.fillRect(x * s + 10, y * s + 78, 80, 9);
      }
    });
    // 彈珠
    const b = g.run ? g.run.b : { x: pz.start[0], y: pz.start[1] };
    if (g.run) { c.fillStyle = 'rgba(33,150,243,.15)'; g.run.trail.forEach(t => { c.beginPath(); c.arc(t[0] * s, t[1] * s, R * s * 0.7, 0, Math.PI * 2); c.fill(); }); }
    const bg = c.createRadialGradient(b.x * s - 7, b.y * s - 7, 3, b.x * s, b.y * s, R * s);
    bg.addColorStop(0, '#fff'); bg.addColorStop(0.4, '#42a5f5'); bg.addColorStop(1, '#0d47a1');
    c.fillStyle = bg; c.beginPath(); c.arc(b.x * s, b.y * s, R * s, 0, Math.PI * 2); c.fill();
    ['r', 's'].forEach(k => { const el = ctx.pane.querySelector('#mbLeft' + k); if (el) el.textContent = `×${pz.inv[k] - used(k)}`; });
    ctx.pane.querySelectorAll('.ng-tool').forEach(bt => bt.classList.toggle('on', bt.dataset.tool === tool));
    const go = ctx.pane.querySelector('#mbGo'); if (go) go.textContent = g.run && !g.run.win ? '⏹ 停止' : '▶ 開始';
    const u = ctx.pane.querySelector('#mbUndo'); if (u) u.disabled = !g.undo.length || !!g.run || g.done;
  }
  function say(m) { const el = ctx.pane.querySelector('#mbMsg'); if (el) el.textContent = m; }
  function render() {
    const pane = ctx.pane;
    if (!pane || !g) return;
    pane.innerHTML = playHtml();
    draw();
    pane.querySelector('#mbCanvas').addEventListener('click', onTap);
    pane.querySelectorAll('.ng-tool').forEach(b => b.addEventListener('click', () => { tool = b.dataset.tool; fx('tap'); draw(); }));
    pane.querySelector('#mbQuit').addEventListener('click', () => { stopRun(); g = null; ctx.back(); });
    pane.querySelector('#mbUndo').addEventListener('click', undo);
    pane.querySelector('#mbGo').addEventListener('click', () => { if (g.done) return; if (g.run) { stopRun(); draw(); say('停下來了，調整一下再試！'); } else run(); });
    if (g.done && g.result) showResult();
    ctx.focus();
  }
  function push() { g.undo.push(JSON.stringify(g.parts)); if (g.undo.length > 80) g.undo.shift(); }
  function undo() { if (!g || g.run || g.done || !g.undo.length) return; g.parts = JSON.parse(g.undo.pop()); fx('undo'); draw(); }
  function onTap(ev) {
    if (!g || g.done || g.run) return;
    const cv = ev.currentTarget, r = cv.getBoundingClientRect();
    act(Math.floor((ev.clientX - r.left) / r.width * W), Math.floor((ev.clientY - r.top) / r.height * H));
  }
  function act(x, y) {
    const pz = g.lv.pz, k = key(x, y);
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    if (pz.blocks.some(b => b[0] === x && b[1] === y) || pz.portals.some(p => (p[0] === x && p[1] === y) || (p[2] === x && p[3] === y)) || (pz.goal[0] === x && pz.goal[1] === y) || (Math.floor(pz.start[0]) === x && Math.floor(pz.start[1]) === y)) { fx('bad'); say('這一格不能放零件。'); return false; }
    const p = g.parts[k];
    if (p) {
      push();
      if (tool === 'x' || p.k === 's') { delete g.parts[k]; fx('remove'); } else { p.o = p.o ? 0 : 1; fx('rotate'); }
    } else {
      if (tool === 'x') return false;
      if (used(tool) >= pz.inv[tool]) { fx('bad'); say(tool === 'r' ? '斜坡用完了！拿掉一個或換個位置。' : '彈簧用完了！'); return false; }
      push(); g.parts[k] = { k: tool, o: 1 }; fx('place');
    }
    if (!g.started) g.started = Date.now();
    g.moves++;
    draw();
    return true;
  }
  function stopRun() { if (raf) cancelAnimationFrame(raf); raf = 0; if (g) g.run = null; }
  function run() {
    stopRun();
    const pz = g.lv.pz;
    if (!g.started) g.started = Date.now();
    g.tries++;
    g.run = { b: { x: pz.start[0], y: pz.start[1], vx: 0, vy: 0, portalCd: 0 }, S: segments(pz, g.parts), t: 0, trail: [], still: 0, win: false };
    say('彈珠出發！');
    fx('tap');
    let last = performance.now(), acc = 0, rollT = 0;
    const tick = now => {
      if (!g || !g.run) return;
      acc += Math.min(0.05, (now - last) / 1000); last = now;
      const R_ = g.run;
      while (acc >= DT) {
        acc -= DT; R_.t += DT;
        const ev = step(R_.b, R_.S, pz);
        if (ev === 'spring') fx('bounce'); else if (ev === 'portal') fx('hit'); else if (ev === 'hit') fx('roll');
        if (ev === 'goal') { R_.win = true; draw(); raf = 0; finish(); return; }
        const sp = Math.hypot(R_.b.vx, R_.b.vy);
        R_.still = sp < 0.3 ? R_.still + DT : 0;
        if (R_.still > 1.2 || R_.t > 12) { raf = 0; g.run = null; draw(); fx('bad'); say('彈珠停住了，沒進杯子。看看它卡在哪裡，調整一下再按 ▶ 開始！'); return; }
      }
      if ((rollT += 1) % 3 === 0) { R_.trail.push([R_.b.x, R_.b.y]); if (R_.trail.length > 40) R_.trail.shift(); }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    draw();
  }
  function finish() {
    g.done = true;
    const sec = Math.max(1, Math.round((Date.now() - g.started) / 1000));
    g.result = Object.assign({ sec }, ctx.grant(g.lv, sec, g.moves));
    fx('win');
    try { window.PuppyFx && window.PuppyFx.confetti(ctx.pane.querySelector('.pz-play')); } catch (e) { /* 忽略 */ }
    showResult();
  }
  function showResult() {
    const box = ctx.pane.querySelector('#mbResult'), r = g.result;
    if (!box || !r) return;
    const idx = LEVELS.indexOf(g.lv), next = LEVELS[idx + 1];
    box.hidden = false;
    box.innerHTML = `<div class="pz-win">🏆 進杯子了！試了 ${g.tries} 次</div>
      <div class="ty-result-grid"><div><b>${r.stars ? '+' + r.stars + '⭐' : '—'}</b><span>星星</span></div><div><b>${r.xp ? '+' + r.xp : '—'}</b><span>經驗值</span></div></div>
      ${r.note ? `<p class="ty-note">${ctx.esc(r.note)}</p>` : ''}
      <div class="pz-result-btns"><button class="btn btn-soft" id="mbHome">回到益智挑戰</button>${next ? '<button class="btn btn-orange" id="mbNext">下一關 ▶</button>' : ''}</div>`;
    box.querySelector('#mbHome').addEventListener('click', () => { g = null; ctx.back(); });
    const nb = box.querySelector('#mbNext'); if (nb) nb.addEventListener('click', () => start(next.id));
    say('');
  }
  const api = {
    attach(c) { ctx = c; },
    home(el) { el.innerHTML = homeHtml(); el.querySelectorAll('[data-mbl]').forEach(b => b.addEventListener('click', () => start(b.dataset.mbl))); },
    render() { if (g) render(); else ctx.back(); },
    isPlaying() { return !!g && !g.done; },
    hide() { stopRun(); },
    LEVELS,
    _t: { start, act, run, game: () => g, simulate, RAW, partsOf, setTool: t => { tool = t; },
      checkAll() { return RAW.every(pz => simulate(pz, partsOf(pz.sol)) && !simulate(pz, {}) && pz.sol.filter(s => s[2] === 'r').length <= pz.inv.r && pz.sol.filter(s => s[2] === 's').length <= pz.inv.s); } }
  };
  window.PuppyMarble = api;
})();
