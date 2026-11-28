// 《汪汪小精靈 學習小伙伴》📌 數學釘板（v3.30.0，益智挑戰）
// 在釘板上「套橡皮筋」圍出圖形：依序點釘子，最後點回第一根釘子就圍起來了。
//   ・畫面即時顯示圍出來的面積（一格＝1 平方單位）、周長、對稱軸
//   ・可以換橡皮筋顏色；↶ 復原：拿掉最後一個點（或最後一條橡皮筋）
//   ・闖關：照題目要求圍出指定圖形；自由玩：想圍幾條就圍幾條，不給獎勵
(function () {
  'use strict';
  const COLS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa'];
  const fx = k => { try { window.PuppyFx && window.PuppyFx.tone(k); } catch (e) { /* 忽略 */ } };
  // ── 幾何小工具 ──
  const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s); };   // 兩倍面積（整數）
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const perim = P => P.reduce((s, a, i) => s + Math.sqrt(d2(a, P[(i + 1) % P.length])), 0);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  // 拿掉在一直線上的點（橡皮筋經過但沒轉彎的釘子）
  function simplify(P) {
    let Q = P.slice(), ch = true;
    while (ch && Q.length > 2) { ch = false; for (let i = 0; i < Q.length; i++) { const a = Q[(i + Q.length - 1) % Q.length], b = Q[i], c = Q[(i + 1) % Q.length]; if (cross(a, b, c) === 0) { Q.splice(i, 1); ch = true; break; } } }
    return Q;
  }
  function segX(a, b, c, d) { const d1 = cross(c, d, a), d2_ = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d); return ((d1 > 0 && d2_ < 0) || (d1 < 0 && d2_ > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)); }
  function simple(P) {
    const n = P.length;
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) { if (i === 0 && j === n - 1) continue; if (segX(P[i], P[(i + 1) % n], P[j], P[(j + 1) % n])) return false; }
    return true;
  }
  // 對稱軸：檢查直的、橫的、兩條斜的（經過圖形中心）
  function axes(P) {
    const key = p => p[0] + ',' + p[1], S = new Set(P.map(key)), n = P.length;
    const cx2 = Math.min(...P.map(p => p[0])) + Math.max(...P.map(p => p[0])), cy2 = Math.min(...P.map(p => p[1])) + Math.max(...P.map(p => p[1]));
    const out = [];
    const test = (f, name) => { if (P.every(p => S.has(key(f(p))))) out.push(name); };
    test(p => [cx2 - p[0], p[1]], 'v');
    test(p => [p[0], cy2 - p[1]], 'h');
    const sx = (cx2 + cy2) / 2, dx = (cx2 - cy2) / 2;
    if (Number.isInteger(dx)) test(p => [p[1] + dx, p[0] - dx], 'd1');
    if (Number.isInteger(sx)) test(p => [sx - p[1], sx - p[0]], 'd2');
    return n >= 3 ? out : [];
  }
  const sides = P => P.map((a, i) => d2(a, P[(i + 1) % P.length]));
  const isRect = P => P.length === 4 && d2(P[0], P[2]) === d2(P[1], P[3]) && sides(P)[0] === sides(P)[2] && sides(P)[1] === sides(P)[3];
  const isSquare = P => isRect(P) && sides(P)[0] === sides(P)[1];
  const isPara = P => P.length === 4 && P[0][0] - P[1][0] === P[3][0] - P[2][0] && P[0][1] - P[1][1] === P[3][1] - P[2][1];
  const tilted = P => P.some((a, i) => { const b = P[(i + 1) % P.length]; return a[0] !== b[0] && a[1] !== b[1]; });
  // 闖關題目：ok(P 已經簡化、不交叉)
  const GOALS = [
    { t: '圍出一個<b>正方形</b>，面積是 <b>4</b>', ok: P => isSquare(P) && area2(P) === 8 },
    { t: '圍出一個<b>長方形</b>（不是正方形），面積是 <b>6</b>', ok: P => isRect(P) && !isSquare(P) && area2(P) === 12 },
    { t: '圍出一個<b>三角形</b>，面積是 <b>2</b>', ok: P => P.length === 3 && area2(P) === 4 },
    { t: '圍出一個<b>長方形</b>，周長是 <b>10</b>', ok: P => isRect(P) && Math.abs(perim(P) - 10) < 1e-6 },
    { t: '圍出一個<b>三角形</b>，面積是 <b>1.5</b>（提示：斜斜的邊）', ok: P => P.length === 3 && area2(P) === 3 },
    { t: '圍出一個<b>平行四邊形</b>（不是長方形），面積是 <b>6</b>', ok: P => isPara(P) && !isRect(P) && area2(P) === 12 },
    { t: '圍出一個<b>斜斜的正方形</b>，面積是 <b>5</b>', ok: P => isSquare(P) && tilted(P) && area2(P) === 10 },
    { t: '圍出一個<b>有對稱軸的五邊形</b>', ok: P => P.length === 5 && axes(P).length > 0 },
    { t: '圍出一個<b>斜斜的正方形</b>，面積是 <b>2</b>', ok: P => isSquare(P) && tilted(P) && area2(P) === 4 },
    { t: '圍出一個面積是 <b>8</b>、而且<b>有 4 條對稱軸</b>的圖形', ok: P => area2(P) === 16 && axes(P).length === 4 }
  ];
  // 自動測試用答案
  const SOL = [[[0,0],[2,0],[2,2],[0,2]], [[0,0],[3,0],[3,2],[0,2]], [[0,0],[2,0],[0,2]], [[0,0],[3,0],[3,2],[0,2]], [[0,0],[1,0],[0,3]], [[0,0],[3,0],[4,2],[1,2]], [[1,0],[3,1],[2,3],[0,2]], [[0,2],[2,0],[4,2],[4,4],[0,4]], [[1,0],[2,1],[1,2],[0,1]], [[2,0],[4,2],[2,4],[0,2]]];
  const LEVELS = GOALS.map((go, k) => {
    const tier = k < 4 ? 0 : k < 7 ? 1 : 2;
    return { id: 'gb' + String(k + 1).padStart(2, '0'), no: k + 1, name: `數學釘板第 ${k + 1} 關`, short: `第 ${k + 1} 關`, desc: ['認識圖形', '斜線挑戰', '高手'][tier], stars: [1, 2, 3][tier], xp: [3, 6, 10][tier], per: 1, go };
  });
  const BY_ID = {};
  LEVELS.forEach(l => { BY_ID[l.id] = l; });
  const N = 6;   // 6×6 根釘子（5×5 格）

  let ctx = null, g = null;
  function start(id) {
    const lv = id === 'free' ? null : BY_ID[id];
    g = { lv, bands: [], cur: [], col: 0, undo: [], moves: 0, started: 0, done: false, result: null, sel: -1 };
    ctx.enter(api);
    render();
  }
  function homeHtml() {
    const card = lv => {
      const wins = ctx.wins(lv.id), left = ctx.dayLeft(lv);
      return `<button class="pz-level${wins ? ' done' : ''}" data-gbl="${lv.id}">
        <span class="pz-lv-top"><span class="pz-lv-name">${wins ? '✅ ' : ''}${ctx.esc(lv.short)}</span><span class="pz-lv-desc">${ctx.esc(lv.desc)}</span></span>
        <span class="pz-lv-prize">⭐ ${lv.stars}　✨ ${lv.xp} XP</span>
        <span class="pz-lv-sub">${left ? '今天可以領獎勵' : '今天的獎勵領完了'}</span></button>`;
    };
    return `<h3 class="pz-h3">📌 數學釘板（幾何）</h3>
      <p class="section-sub" style="margin-top:0;">依序點釘子套上橡皮筋，<b>點回第一根釘子</b>就圍起來了！畫面會算出<b>面積、周長</b>，還會畫出<b>對稱軸</b>。不用擔心橡皮筋斷掉或彈到手 😄</p>
      <div class="pz-levels">${LEVELS.map(card).join('')}<button class="pz-level" data-gbl="free"><span class="pz-lv-top"><span class="pz-lv-name">🎨 自由玩</span><span class="pz-lv-desc">想圍幾條都可以</span></span><span class="pz-lv-sub">不給獎勵</span></button></div>`;
  }
  function playHtml() {
    return `<div class="card-box pz-play">
      <div class="pz-top"><b class="pz-title">📌 ${g.lv ? ctx.esc(g.lv.name) : '自由玩'}</b><button class="btn btn-soft pz-quit" id="gbQuit">離開</button></div>
      ${g.lv ? `<div class="gb-goal">🎯 ${g.lv.go.t}</div>` : ''}
      <div class="pz-msg" id="gbMsg">點一根釘子開始套橡皮筋。</div>
      <svg class="ng-board gb-board" id="gbBoard" viewBox="-0.6 -0.6 ${N - 1 + 1.2} ${N - 1 + 1.2}"></svg>
      <div class="gb-info" id="gbInfo"></div>
      <div class="ng-tools">${COLS.map((c, i) => `<button class="btn btn-soft gb-col${i === g.col ? ' on' : ''}" data-col="${i}" style="--c:${c}" aria-label="顏色 ${i + 1}"><i></i></button>`).join('')}
        <button class="btn btn-soft" id="gbUndo">↶ 復原</button><button class="btn btn-soft" id="gbClear">🗑 全部拿掉</button></div>
      <p class="section-sub pz-tip">👆 依序點釘子 ｜ 點回第一根：圍起來 ｜ 點圍好的圖形：看它的面積、周長</p>
      <div class="pz-result" id="gbResult" hidden></div></div>`;
  }
  const fmtLen = v => Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : '約 ' + v.toFixed(1);
  const fmtArea = a2 => a2 % 2 ? (a2 / 2).toFixed(1) : String(a2 / 2);
  function paint() {
    const svg = ctx.pane && ctx.pane.querySelector('#gbBoard');
    if (!svg || !g) return;
    let h = `<rect x="-0.5" y="-0.5" width="${N}" height="${N}" rx=".3" class="gb-bg"/>`;
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < N - 1; j++) h += `<rect x="${i}" y="${j}" width="1" height="1" class="gb-sq"/>`;
    g.bands.forEach((b, k) => {
      const c = COLS[b.col];
      h += `<polygon points="${b.P.map(p => p.join(',')).join(' ')}" fill="${c}" fill-opacity="${k === g.sel ? .38 : .2}" stroke="${c}" class="gb-band" data-b="${k}"/>`;
    });
    const show = g.sel >= 0 && g.bands[g.sel] ? g.bands[g.sel] : g.bands[g.bands.length - 1];
    if (show) axes(show.P).forEach(a => {
      const xs = show.P.map(p => p[0]), ys = show.P.map(p => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, L = 3.2;
      const seg = a === 'v' ? [cx, cy - L, cx, cy + L] : a === 'h' ? [cx - L, cy, cx + L, cy] : a === 'd1' ? [cx - L, cy - L, cx + L, cy + L] : [cx - L, cy + L, cx + L, cy - L];
      h += `<line class="gb-axis" x1="${seg[0]}" y1="${seg[1]}" x2="${seg[2]}" y2="${seg[3]}"/>`;
    });
    if (g.cur.length) h += `<polyline points="${g.cur.map(p => p.join(',')).join(' ')}" fill="none" stroke="${COLS[g.col]}" class="gb-band cur"/>`;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const first = g.cur.length && g.cur[0][0] === x && g.cur[0][1] === y;
      h += `<circle class="gb-peg${first ? ' first' : ''}" cx="${x}" cy="${y}" r=".13"/><circle class="gb-hit" data-x="${x}" data-y="${y}" cx="${x}" cy="${y}" r=".45"/>`;
    }
    svg.innerHTML = h;
    const info = ctx.pane.querySelector('#gbInfo');
    if (info) info.innerHTML = show ? `<span>面積 <b>${fmtArea(area2(show.P))}</b></span><span>周長 <b>${fmtLen(perim(show.P))}</b></span><span>${show.P.length} 邊形</span><span>對稱軸 <b>${axes(show.P).length}</b> 條</span>` : '<span>一小格的面積是 1，邊長是 1</span>';
    ctx.pane.querySelectorAll('.gb-col').forEach(b => b.classList.toggle('on', +b.dataset.col === g.col));
    const u = ctx.pane.querySelector('#gbUndo'); if (u) u.disabled = !g.undo.length || g.done;
  }
  function say(m) { const el = ctx.pane.querySelector('#gbMsg'); if (el) el.innerHTML = m; }
  function render() {
    const pane = ctx.pane;
    if (!pane || !g) return;
    pane.innerHTML = playHtml();
    paint();
    pane.querySelector('#gbBoard').addEventListener('click', onTap);
    pane.querySelectorAll('.gb-col').forEach(b => b.addEventListener('click', () => { g.col = +b.dataset.col; fx('tap'); paint(); }));
    pane.querySelector('#gbQuit').addEventListener('click', () => { g = null; ctx.back(); });
    pane.querySelector('#gbUndo').addEventListener('click', undo);
    pane.querySelector('#gbClear').addEventListener('click', () => { if (g.done || (!g.bands.length && !g.cur.length)) return; push(); g.bands = []; g.cur = []; g.sel = -1; fx('remove'); paint(); });
    if (g.done && g.result) showResult();
    ctx.focus();
  }
  function push() { g.undo.push(JSON.stringify([g.bands, g.cur])); if (g.undo.length > 100) g.undo.shift(); }
  function undo() { if (!g || g.done || !g.undo.length) return; [g.bands, g.cur] = JSON.parse(g.undo.pop()); g.sel = -1; fx('undo'); paint(); say('退回上一步了。'); }
  function onTap(ev) {
    const t = ev.target.closest && ev.target.closest('[data-x]');
    if (t) { peg(+t.dataset.x, +t.dataset.y); return; }
    const b = ev.target.closest && ev.target.closest('[data-b]');
    if (b && !g.cur.length) { g.sel = +b.dataset.b; fx('tap'); paint(); }
  }
  function peg(x, y) {
    if (!g || g.done) return;
    const c = g.cur;
    if (c.length && c[c.length - 1][0] === x && c[c.length - 1][1] === y) return;
    push();
    if (!g.started) g.started = Date.now();
    g.moves++;
    if (c.length >= 3 && c[0][0] === x && c[0][1] === y) { close(); return; }
    if (c.some(p => p[0] === x && p[1] === y)) { g.undo.pop(); fx('bad'); say('這根釘子已經套過了，要圍起來請點<b>第一根</b>（會閃的那根）。'); return; }
    c.push([x, y]);
    fx('place');
    paint();
    say(c.length === 1 ? '再點下一根釘子…' : `已經套了 ${c.length} 根，點回第一根就圍起來。`);
  }
  function close() {
    const P = simplify(g.cur);
    if (P.length < 3 || !area2(P)) { g.undo.pop(); fx('bad'); say('這樣圍不出圖形（都在一直線上），再多點幾根。'); return; }
    if (!simple(P)) { g.undo.pop(); fx('bad'); say('橡皮筋交叉打結了！按「↶ 復原」換個順序點。'); return; }
    if (g.lv) g.bands = [];
    g.bands.push({ P, col: g.col });
    g.cur = []; g.sel = g.bands.length - 1;
    fx('bounce');
    paint();
    if (g.lv) {
      if (g.lv.go.ok(P)) { finish(); return; }
      say('圍好了！可是還不符合題目，看看下面的面積、周長，再試一次（直接點釘子重新圍）。');
    } else say('圍好了！換個顏色再圍一條吧。');
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
    const box = ctx.pane.querySelector('#gbResult'), r = g.result;
    if (!box || !r) return;
    const idx = LEVELS.indexOf(g.lv), next = LEVELS[idx + 1];
    box.hidden = false;
    box.innerHTML = `<div class="pz-win">📌 答對了！</div>
      <div class="ty-result-grid"><div><b>${r.stars ? '+' + r.stars + '⭐' : '—'}</b><span>星星</span></div><div><b>${r.xp ? '+' + r.xp : '—'}</b><span>經驗值</span></div></div>
      ${r.note ? `<p class="ty-note">${ctx.esc(r.note)}</p>` : ''}
      <div class="pz-result-btns"><button class="btn btn-soft" id="gbHome">回到益智挑戰</button>${next ? '<button class="btn btn-orange" id="gbNext">下一關 ▶</button>' : ''}</div>`;
    box.querySelector('#gbHome').addEventListener('click', () => { g = null; ctx.back(); });
    const nb = box.querySelector('#gbNext'); if (nb) nb.addEventListener('click', () => start(next.id));
    say('');
  }
  const api = {
    attach(c) { ctx = c; },
    home(el) { el.innerHTML = homeHtml(); el.querySelectorAll('[data-gbl]').forEach(b => b.addEventListener('click', () => start(b.dataset.gbl))); },
    render() { if (g) render(); else ctx.back(); },
    isPlaying() { return !!g && !g.done && !!g.lv; },
    hide() { },
    LEVELS,
    _t: { start, peg, game: () => g, area2, perim, axes, simplify, simple, SOL, GOALS,
      checkAll() { return GOALS.every((go, k) => { const P = simplify(SOL[k]); return simple(P) && go.ok(P) && !GOALS[(k + 1) % GOALS.length].ok(P) === !GOALS[(k + 1) % GOALS.length].ok(P); }) && axes([[0,0],[2,0],[2,2],[0,2]]).length === 4 && area2([[0,0],[1,0],[0,3]]) === 3; } }
  };
  window.PuppyGeo = api;
})();
