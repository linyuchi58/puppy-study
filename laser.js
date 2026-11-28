// 《汪汪小精靈 學習小伙伴》🔦 雷射迷宮（v3.28.0，益智挑戰）
// 在方格裡擺鏡子、分光鏡，讓雷射光反射後打中所有靶心。
//   ・先在下面選「🪞 鏡子」或「💎 分光鏡」，再點空格子放上去
//   ・點一下已經放好的鏡子：轉 90 度（／ ↔ ＼）；選「🧽 拿掉」再點鏡子：收回來
//   ・↶ 復原：退回上一步；光線會即時畫出來
// 方向：0 右、1 下、2 左、3 上。／ 鏡：右→上、上→右、左→下、下→左；＼ 鏡：右→下、下→右、左→上、上→左
// 分光鏡：光一半直直穿過、一半照鏡子方向轉彎
(function () {
  'use strict';
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  const SL = [3, 2, 1, 0];   // ／
  const BS = [1, 0, 3, 2];   // ＼
  // n：格子數；src：[x, y, 方向]；walls：牆；inv：可以用的鏡子數 {m, s}；targets：靶心；sol：一種答案（自動測試用）
  const RAW = [
    { n: 5, src: [0, 2, 0], walls: [], inv: { m: 1, s: 0 }, targets: [[3, 0]], sol: [[3, 2, 'm', 0]] },
    { n: 5, src: [0, 0, 0], walls: [[3, 0]], inv: { m: 2, s: 0 }, targets: [[4, 4]], sol: [[2, 0, 'm', 1], [2, 4, 'm', 1]] },
    { n: 6, src: [0, 5, 0], walls: [[2, 5], [2, 4]], inv: { m: 3, s: 0 }, targets: [[5, 0]], sol: [[1, 5, 'm', 0], [1, 2, 'm', 0], [5, 2, 'm', 0]] },
    { n: 6, src: [0, 1, 0], walls: [[3, 1], [3, 2], [1, 4]], inv: { m: 3, s: 0 }, targets: [[4, 0]], sol: [[2, 1, 'm', 1], [2, 3, 'm', 1], [4, 3, 'm', 0]] },
    { n: 6, src: [0, 3, 0], walls: [], inv: { m: 1, s: 1 }, targets: [[0, 1], [2, 0]], sol: [[2, 3, 'm', 0], [2, 1, 's', 1]] },
    { n: 6, src: [0, 0, 0], walls: [[4, 0]], inv: { m: 2, s: 1 }, targets: [[0, 2], [0, 5]], sol: [[2, 0, 'm', 1], [2, 2, 's', 0], [2, 5, 'm', 0]] },
    { n: 7, src: [3, 6, 3], walls: [[3, 1], [0, 0], [6, 2]], inv: { m: 2, s: 1 }, targets: [[5, 0], [0, 3]], sol: [[3, 5, 's', 0], [5, 5, 'm', 0], [3, 3, 'm', 1]] },
    { n: 7, src: [0, 3, 0], walls: [[3, 3], [3, 2], [3, 4]], inv: { m: 4, s: 1 }, targets: [[6, 3], [6, 0]], sol: [[1, 3, 'm', 0], [1, 0, 'm', 0], [5, 0, 's', 1], [5, 3, 'm', 1]] }
  ];
  const LEVELS = RAW.map((pz, k) => {
    const tier = k < 3 ? 0 : k < 6 ? 1 : 2;
    return { id: 'lz' + String(k + 1).padStart(2, '0'), no: k + 1, name: `雷射迷宮第 ${k + 1} 關`, short: `第 ${k + 1} 關`, desc: ['鏡子入門', '分光鏡登場', '大師挑戰'][tier], stars: [1, 2, 3][tier], xp: [3, 6, 10][tier], per: 1, pz };
  });
  const BY_ID = {};
  LEVELS.forEach(l => { BY_ID[l.id] = l; });

  let ctx = null, g = null, tool = 'm';
  const key = (x, y) => x + ',' + y;
  const fx = k => { try { window.PuppyFx && window.PuppyFx.tone(k); } catch (e) { /* 忽略 */ } };

  // 追光：回傳 { segs:[[x1,y1,x2,y2]], hits:Set(靶心) }
  function trace(pz, pieces) {
    const walls = new Set(pz.walls.map(w => key(w[0], w[1])));
    const tg = new Set(pz.targets.map(t => key(t[0], t[1])));
    const hits = new Set(), segs = [], seen = new Set();
    const beams = [[pz.src[0], pz.src[1], pz.src[2], pz.src[0], pz.src[1]]];
    let guard = 0;
    while (beams.length && guard++ < 400) {
      let [x, y, d, sx, sy] = beams.pop();
      for (;;) {
        const nx = x + DX[d], ny = y + DY[d];
        if (nx < 0 || ny < 0 || nx >= pz.n || ny >= pz.n || walls.has(key(nx, ny))) { segs.push([sx, sy, x + DX[d] * 0.45, y + DY[d] * 0.45]); break; }
        x = nx; y = ny;
        const k = key(x, y);
        if (tg.has(k)) { hits.add(k); segs.push([sx, sy, x, y]); break; }
        if (k === key(pz.src[0], pz.src[1])) { segs.push([sx, sy, x, y]); break; }
        const p = pieces[k];
        if (p) {
          const sk = k + ':' + d;
          segs.push([sx, sy, x, y]);
          if (seen.has(sk)) break;
          seen.add(sk);
          const nd = (p.o ? BS : SL)[d];
          if (p.k === 's') beams.push([x, y, d, x, y]);
          d = nd; sx = x; sy = y;
        }
      }
    }
    return { segs, hits };
  }
  const solved = () => g && trace(g.lv.pz, g.pieces).hits.size === g.lv.pz.targets.length;
  const used = k => Object.values(g.pieces).filter(p => p.k === k).length;

  function start(id) {
    const lv = BY_ID[id];
    if (!lv) return;
    g = { lv, pieces: {}, undo: [], moves: 0, started: 0, done: false, result: null };
    tool = lv.pz.inv.m ? 'm' : 's';
    ctx.enter(api);
    render();
  }
  function homeHtml() {
    const card = lv => {
      const wins = ctx.wins(lv.id), left = ctx.dayLeft(lv);
      return `<button class="pz-level${wins ? ' done' : ''}" data-lzl="${lv.id}">
        <span class="pz-lv-top"><span class="pz-lv-name">${wins ? '✅ ' : ''}${ctx.esc(lv.short)}</span><span class="pz-lv-desc">${ctx.esc(lv.desc)}</span></span>
        <span class="pz-lv-prize">⭐ ${lv.stars}　✨ ${lv.xp} XP</span>
        <span class="pz-lv-sub">${left ? '今天可以領獎勵' : '今天的獎勵領完了'}</span></button>`;
    };
    return `<h3 class="pz-h3">🔦 雷射迷宮（光的反射）</h3>
      <p class="section-sub" style="margin-top:0;">在格子裡放<b>鏡子</b>讓雷射光轉彎，打中所有<b>靶心 🎯</b>！<b>分光鏡</b>會把光分成兩道：一道直直穿過、一道轉彎。光碰到鏡子，就像球打到牆壁一樣反彈。</p>
      <div class="pz-levels">${LEVELS.map(card).join('')}</div>`;
  }
  function playHtml() {
    const inv = g.lv.pz.inv;
    return `<div class="card-box pz-play">
      <div class="pz-top"><b class="pz-title">🔦 ${ctx.esc(g.lv.name)}</b><button class="btn btn-soft pz-quit" id="lzQuit">離開</button></div>
      <div class="pz-msg" id="lzMsg">選好鏡子，點空格子放上去；再點一下鏡子可以轉方向。</div>
      <svg class="ng-board lz-board" id="lzBoard" viewBox="-0.2 -0.2 ${g.lv.pz.n + 0.4} ${g.lv.pz.n + 0.4}"></svg>
      <div class="ng-tools" id="lzTools">
        ${inv.m ? `<button class="btn btn-soft ng-tool" data-tool="m">🪞 鏡子 <b id="lzLeftm"></b></button>` : ''}
        ${inv.s ? `<button class="btn btn-soft ng-tool" data-tool="s">💎 分光鏡 <b id="lzLefts"></b></button>` : ''}
        <button class="btn btn-soft ng-tool" data-tool="x">🧽 拿掉</button>
        <button class="btn btn-soft" id="lzUndo">↶ 復原</button>
        <button class="btn btn-soft" id="lzReset">🗑 全部清掉</button>
      </div>
      <p class="section-sub pz-tip">👆 點空格：放鏡子　｜　👆 點鏡子：轉方向　｜　🎯 每個靶心都要亮起來</p>
      <div class="pz-result" id="lzResult" hidden></div></div>`;
  }
  function paint() {
    const svg = ctx.pane && ctx.pane.querySelector('#lzBoard');
    if (!svg || !g) return;
    const pz = g.lv.pz, n = pz.n, tr = trace(pz, g.pieces);
    const walls = new Set(pz.walls.map(w => key(w[0], w[1])));
    let h = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (walls.has(key(x, y))) h += `<rect class="lz-wall" x="${x + 0.04}" y="${y + 0.04}" width=".92" height=".92" rx=".12"/>`;
      else h += `<rect class="lz-cell free" data-x="${x}" data-y="${y}" x="${x + 0.04}" y="${y + 0.04}" width=".92" height=".92" rx=".12"/>`;
    }
    pz.targets.forEach(t => {
      const hit = tr.hits.has(key(t[0], t[1]));
      h += `<circle class="lz-target${hit ? ' hit' : ''}" cx="${t[0] + 0.5}" cy="${t[1] + 0.5}" r=".34" pointer-events="none"/><circle cx="${t[0] + 0.5}" cy="${t[1] + 0.5}" r=".14" fill="${hit ? '#ff7043' : '#ff8a65'}" pointer-events="none"/>`;
    });
    const pts = tr.segs.map(s => `M${s[0] + 0.5} ${s[1] + 0.5}L${s[2] + 0.5} ${s[3] + 0.5}`).join('');
    h += `<path class="lz-beam" d="${pts}" pointer-events="none"/><path class="lz-beam-core" d="${pts}" pointer-events="none"/>`;
    Object.keys(g.pieces).forEach(k => {
      const p = g.pieces[k], [x, y] = k.split(',').map(Number);
      const a = p.o ? [x + 0.18, y + 0.18, x + 0.82, y + 0.82] : [x + 0.18, y + 0.82, x + 0.82, y + 0.18];
      h += `<rect class="lz-piece-bg" x="${x + 0.08}" y="${y + 0.08}" width=".84" height=".84" rx=".15" pointer-events="none"/><line class="${p.k === 's' ? 'lz-split' : 'lz-mirror'}" x1="${a[0]}" y1="${a[1]}" x2="${a[2]}" y2="${a[3]}" pointer-events="none"/>`;
    });
    const [sx, sy, sd] = pz.src, rot = sd * 90;
    h += `<g transform="translate(${sx + 0.5} ${sy + 0.5}) rotate(${rot})" pointer-events="none"><rect class="lz-src" x="-.38" y="-.26" width=".66" height=".52" rx=".1"/><circle cx=".3" cy="0" r=".1" fill="#fff"/></g>`;
    svg.innerHTML = h;
    ['m', 's'].forEach(k => { const el = ctx.pane.querySelector('#lzLeft' + k); if (el) el.textContent = `×${pz.inv[k] - used(k)}`; });
    ctx.pane.querySelectorAll('.ng-tool').forEach(b => b.classList.toggle('on', b.dataset.tool === tool));
    const u = ctx.pane.querySelector('#lzUndo'); if (u) u.disabled = !g.undo.length || g.done;
    return tr;
  }
  function say(m) { const el = ctx.pane.querySelector('#lzMsg'); if (el) el.textContent = m; }
  function render() {
    const pane = ctx.pane;
    if (!pane || !g) return;
    pane.innerHTML = playHtml();
    paint();
    pane.querySelector('#lzBoard').addEventListener('click', onTap);
    pane.querySelectorAll('.ng-tool').forEach(b => b.addEventListener('click', () => { tool = b.dataset.tool; fx('tap'); paint(); }));
    pane.querySelector('#lzQuit').addEventListener('click', () => { g = null; ctx.back(); });
    pane.querySelector('#lzUndo').addEventListener('click', undo);
    pane.querySelector('#lzReset').addEventListener('click', () => { if (g.done || !Object.keys(g.pieces).length) return; push(); g.pieces = {}; fx('remove'); paint(); });
    if (g.done && g.result) showResult();
    ctx.focus();
  }
  function push() { g.undo.push(JSON.stringify(g.pieces)); if (g.undo.length > 80) g.undo.shift(); }
  function undo() { if (!g || g.done || !g.undo.length) return; g.pieces = JSON.parse(g.undo.pop()); fx('undo'); paint(); say('退回上一步了。'); }
  function act(x, y) {
    if (!g || g.done) return false;
    const pz = g.lv.pz, k = key(x, y);
    if (pz.walls.some(w => w[0] === x && w[1] === y) || pz.targets.some(t => t[0] === x && t[1] === y) || (pz.src[0] === x && pz.src[1] === y)) return false;
    const p = g.pieces[k];
    if (p) {
      push();
      if (tool === 'x') { delete g.pieces[k]; fx('remove'); }
      else { p.o = p.o ? 0 : 1; fx('rotate'); }
    } else {
      if (tool === 'x') { say('選「🪞 鏡子」或「💎 分光鏡」再點空格子。'); return false; }
      if (used(tool) >= pz.inv[tool]) { fx('bad'); say(tool === 'm' ? '鏡子用完了！點「🧽 拿掉」收回一面，或轉一轉已經放的鏡子。' : '分光鏡用完了！'); return false; }
      push();
      g.pieces[k] = { k: tool, o: 0 };
      fx('place');
    }
    if (!g.started) g.started = Date.now();
    g.moves++;
    const before = g.lastHits || 0;
    const tr = paint();
    g.lastHits = tr.hits.size;
    if (tr.hits.size > before && tr.hits.size < pz.targets.length) { fx('hit'); say(`打中 ${tr.hits.size} 個靶心了，還差 ${pz.targets.length - tr.hits.size} 個！`); }
    else if (tr.hits.size < pz.targets.length) say('');
    if (tr.hits.size === pz.targets.length) finish();
    return true;
  }
  function onTap(ev) {
    const t = ev.target.closest && ev.target.closest('[data-x]');
    if (!t) return;
    act(+t.dataset.x, +t.dataset.y);
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
    const box = ctx.pane.querySelector('#lzResult'), r = g.result;
    if (!box || !r) return;
    const idx = LEVELS.indexOf(g.lv), next = LEVELS[idx + 1];
    box.hidden = false;
    box.innerHTML = `<div class="pz-win">🎯 全部打中了！</div>
      <div class="ty-result-grid"><div><b>${r.stars ? '+' + r.stars + '⭐' : '—'}</b><span>星星</span></div><div><b>${r.xp ? '+' + r.xp : '—'}</b><span>經驗值</span></div></div>
      ${r.note ? `<p class="ty-note">${ctx.esc(r.note)}</p>` : ''}
      <div class="pz-result-btns"><button class="btn btn-soft" id="lzHome">回到益智挑戰</button>${next ? '<button class="btn btn-orange" id="lzNext">下一關 ▶</button>' : ''}</div>`;
    box.querySelector('#lzHome').addEventListener('click', () => { g = null; ctx.back(); });
    const nb = box.querySelector('#lzNext'); if (nb) nb.addEventListener('click', () => start(next.id));
    say('');
  }
  const api = {
    attach(c) { ctx = c; },
    home(el) { el.innerHTML = homeHtml(); el.querySelectorAll('[data-lzl]').forEach(b => b.addEventListener('click', () => start(b.dataset.lzl))); },
    render() { if (g) render(); else ctx.back(); },
    isPlaying() { return !!g && !g.done; },
    hide() { },
    LEVELS,
    _t: { start, trace, solved, game: () => g, act, undo, RAW, setTool: t => { tool = t; },
      checkAll() { return RAW.every(pz => { const pc = {}; pz.sol.forEach(s => { pc[key(s[0], s[1])] = { k: s[2], o: s[3] }; }); const nm = pz.sol.filter(s => s[2] === 'm').length, ns = pz.sol.filter(s => s[2] === 's').length; return nm <= pz.inv.m && ns <= pz.inv.s && trace(pz, pc).hits.size === pz.targets.length && trace(pz, {}).hits.size === 0; }); } }
  };
  window.PuppyLaser = api;
})();
