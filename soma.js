// 《汪汪小精靈 學習小伙伴》🧊 索瑪立方塊（v3.32.0，益智挑戰的 3D 空間拼圖）
// 7 塊不規則的立體積木（3D 版七巧板），拼出指定造型，最後拼成 3×3×3 大立方體。
//   ・在空白處拖曳：360 度轉動視角；旁邊有「三視圖」（上、前、右）幫你看造型
//   ・先選一塊積木、用 ⟲ 按鈕轉方向，再點「發亮的空格」放上去（一層一層往上放）
//   ・點已經放好的積木：拿回來；↶ 復原
//   ・CSS 3D 畫的，不用外部函式庫
(function () {
  'use strict';
  const SH = { V: [[0,0,0],[1,0,0],[0,1,0]], L: [[0,0,0],[1,0,0],[2,0,0],[0,1,0]], T: [[0,0,0],[1,0,0],[2,0,0],[1,1,0]], Z: [[0,0,0],[1,0,0],[1,1,0],[2,1,0]], A: [[0,0,0],[1,0,0],[0,1,0],[1,0,1]], B: [[0,0,0],[1,0,0],[0,1,0],[0,1,1]], P: [[0,0,0],[1,0,0],[0,1,0],[0,0,1]] };
  const COL = { V: '#ef5350', L: '#ffa726', T: '#ffee58', Z: '#66bb6a', A: '#42a5f5', B: '#7e57c2', P: '#ec407a' };
  const NAME = { V: '小 L', L: '長 L', T: 'T 字', Z: 'Z 字', A: '左螺旋', B: '右螺旋', P: '三腳架' };
  const RAW = [{"set":"VL","cells":[[0,0,0],[0,0,1],[0,1,1],[1,0,0],[2,0,0],[2,0,1],[2,0,2]],"sol":[["V",[[0,0,0],[0,0,1],[0,1,1]]],["L",[[1,0,0],[2,0,0],[2,0,1],[2,0,2]]]]},{"set":"VLA","cells":[[0,0,0],[0,0,1],[0,1,1],[1,0,0],[2,0,0],[2,0,1],[2,0,2],[0,1,0],[0,2,0],[0,2,1],[1,2,1]],"sol":[["V",[[0,0,0],[0,0,1],[0,1,1]]],["L",[[1,0,0],[2,0,0],[2,0,1],[2,0,2]]],["A",[[0,1,0],[0,2,0],[0,2,1],[1,2,1]]]]},{"set":"VLAZ","cells":[[0,0,0],[0,0,1],[0,1,1],[1,0,0],[2,0,0],[2,0,1],[2,0,2],[0,1,0],[0,2,0],[0,2,1],[1,2,1],[1,0,1],[1,0,2],[1,1,0],[1,1,1]],"sol":[["V",[[0,0,0],[0,0,1],[0,1,1]]],["L",[[1,0,0],[2,0,0],[2,0,1],[2,0,2]]],["A",[[0,1,0],[0,2,0],[0,2,1],[1,2,1]]],["Z",[[1,0,1],[1,0,2],[1,1,0],[1,1,1]]]]},{"set":"VLAZB","cells":[[0,0,0],[0,0,1],[0,1,1],[1,0,0],[2,0,0],[2,0,1],[2,0,2],[0,1,0],[0,2,0],[0,2,1],[1,2,1],[1,0,1],[1,0,2],[1,1,0],[1,1,1],[1,2,0],[2,1,0],[2,1,1],[2,2,0]],"sol":[["V",[[0,0,0],[0,0,1],[0,1,1]]],["L",[[1,0,0],[2,0,0],[2,0,1],[2,0,2]]],["A",[[0,1,0],[0,2,0],[0,2,1],[1,2,1]]],["Z",[[1,0,1],[1,0,2],[1,1,0],[1,1,1]]],["B",[[1,2,0],[2,1,0],[2,1,1],[2,2,0]]]]},{"set":"VLTZABP","cells":[[0,0,0],[0,0,1],[0,0,2],[0,1,0],[0,1,1],[0,1,2],[0,2,0],[0,2,1],[0,2,2],[1,0,0],[1,0,1],[1,0,2],[1,1,0],[1,1,1],[1,1,2],[1,2,0],[1,2,1],[1,2,2],[2,0,0],[2,0,1],[2,0,2],[2,1,0],[2,1,1],[2,1,2],[2,2,0],[2,2,1],[2,2,2]],"sol":[["V",[[0,0,0],[0,0,1],[0,1,1]]],["L",[[1,0,0],[2,0,0],[2,0,1],[2,0,2]]],["A",[[0,1,0],[0,2,0],[0,2,1],[1,2,1]]],["Z",[[1,0,1],[1,0,2],[1,1,0],[1,1,1]]],["B",[[1,2,0],[2,1,0],[2,1,1],[2,2,0]]],["P",[[1,2,2],[2,1,2],[2,2,1],[2,2,2]]],["T",[[0,0,2],[0,1,2],[0,2,2],[1,1,2]]]]}];
  const LEVELS = RAW.map((pz, k) => {
    const n = pz.set.length, last = n === 7;
    return { id: 'sm' + String(k + 1).padStart(2, '0'), no: k + 1, name: last ? '索瑪立方塊：3×3×3 大立方體' : `索瑪立方塊第 ${k + 1} 關`, short: last ? '大立方體' : `第 ${k + 1} 關`, desc: `${n} 塊積木`, stars: last ? 8 : [1, 2, 3, 4][k] || 4, xp: last ? 30 : [3, 6, 10, 14][k] || 14, per: 1, pz };
  });
  const BY_ID = {};
  LEVELS.forEach(l => { BY_ID[l.id] = l; });
  const fx = k => { try { window.PuppyFx && window.PuppyFx.tone(k); } catch (e) { /* 忽略 */ } };
  const K = c => c.join(',');
  const norm = c => { const m = [0, 1, 2].map(i => Math.min(...c.map(p => p[i]))); return c.map(p => p.map((v, i) => v - m[i])).sort((a, b) => a[2] - b[2] || a[1] - b[1] || a[0] - b[0]); };
  const ROT = [p => [p[0], -p[2], p[1]], p => [p[2], p[1], -p[0]], p => [-p[1], p[0], p[2]]];
  const S = 46;   // 一格幾 px

  let ctx = null, g = null, view = { rx: -28, ry: -35 }, drag = null;
  function start(id) {
    const lv = BY_ID[id];
    if (!lv) return;
    g = { lv, placed: {}, orient: {}, sel: lv.pz.set[0], undo: [], moves: 0, started: 0, done: false, result: null };
    lv.pz.set.split('').forEach(n => { g.orient[n] = norm(SH[n]); });
    ctx.enter(api);
    render();
  }
  const target = () => new Set(g.lv.pz.cells.map(K));
  function occ() { const m = {}; Object.keys(g.placed).forEach(n => g.placed[n].forEach(c => { m[K(c)] = n; })); return m; }
  function lowestEmpty() { const o = occ(), e = g.lv.pz.cells.filter(c => !o[K(c)]); return e.length ? Math.min(...e.map(c => c[2])) : -1; }
  function homeHtml() {
    const card = lv => {
      const wins = ctx.wins(lv.id), left = ctx.dayLeft(lv);
      return `<button class="pz-level${wins ? ' done' : ''}" data-sml="${lv.id}">
        <span class="pz-lv-top"><span class="pz-lv-name">${wins ? '✅ ' : ''}${ctx.esc(lv.short)}</span><span class="pz-lv-desc">${ctx.esc(lv.desc)}</span></span>
        <span class="pz-lv-prize">⭐ ${lv.stars}　✨ ${lv.xp} XP</span>
        <span class="pz-lv-sub">${left ? '今天可以領獎勵' : '今天的獎勵領完了'}</span></button>`;
    };
    return `<h3 class="pz-h3">🧊 索瑪立方塊（3D 空間拼圖）</h3>
      <p class="section-sub" style="margin-top:0;">可以想成「<b>3D 版的七巧板</b>」：用不規則的立體積木拼出造型，最後一關把 <b>7 塊</b>拼成 <b>3×3×3 大立方體</b>！手指一滑就能 360 度轉動看，旁邊還有<b>三視圖</b>。</p>
      <div class="pz-levels">${LEVELS.map(card).join('')}</div>`;
  }
  function playHtml() {
    return `<div class="card-box pz-play">
      <div class="pz-top"><b class="pz-title">🧊 ${ctx.esc(g.lv.name)}</b><button class="btn btn-soft pz-quit" id="smQuit">離開</button></div>
      <div class="pz-msg" id="smMsg">選一塊積木，轉好方向，再點<b>發亮的空格</b>放上去。</div>
      <div class="sm-wrap">
        <div class="sm-stage" id="smStage"><div class="sm-scene" id="smScene"></div></div>
        <div class="sm-side"><div class="sm-views" id="smViews"></div></div>
      </div>
      <div class="sm-tray" id="smTray"></div>
      <div class="ng-tools">
        <button class="btn btn-soft" data-rot="0">⟲ 前後翻</button><button class="btn btn-soft" data-rot="1">⟲ 左右翻</button><button class="btn btn-soft" data-rot="2">⟲ 平轉</button>
        <button class="btn btn-soft" id="smUndo">↶ 復原</button><button class="btn btn-soft" id="smView">🎥 轉正視角</button>
      </div>
      <p class="section-sub pz-tip">👆 空白處拖曳：轉視角 ｜ 點發亮的格子：放積木 ｜ 點放好的積木：拿回來</p>
      <div class="pz-result" id="smResult" hidden></div></div>`;
  }
  function cubeHtml(c, color, cls, data) {
    const [x, y, z] = c, h = S / 2;
    const tf = ['rotateY(90deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)', '', 'rotateY(180deg)'];
    return `<div class="sm-cube ${cls}" ${data} style="transform:translate3d(${(x - 1) * S}px,${(-z + 1) * S}px,${(y - 1) * S}px)">${tf.map((t, i) => `<div class="sm-f" style="transform:${t} translateZ(${h}px);${color ? `background:${color};filter:brightness(${[0.85, 0.85, 1.12, 0.7, 1, 0.95][i]})` : ''}"></div>`).join('')}</div>`;
  }
  function paint() {
    const sc = ctx.pane && ctx.pane.querySelector('#smScene');
    if (!sc || !g) return;
    const o = occ(), low = lowestEmpty();
    let h = '';
    g.lv.pz.cells.forEach(c => {
      const n = o[K(c)];
      if (n) h += cubeHtml(c, COL[n], 'solid' + (g.done ? ' won' : ''), `data-n="${n}"`);
      else if (c[2] === low) h += cubeHtml(c, '', 'slot', `data-c="${K(c)}"`);
      else h += cubeHtml(c, '', 'ghost', '');
    });
    sc.innerHTML = h;
    sc.style.transform = `rotateX(${view.rx}deg) rotateY(${view.ry}deg)`;
    // 盤子：每塊積木＋選中那塊的小預覽
    const tray = ctx.pane.querySelector('#smTray');
    tray.innerHTML = g.lv.pz.set.split('').map(n => {
      const used = !!g.placed[n];
      return `<button class="sm-pc${g.sel === n ? ' on' : ''}${used ? ' used' : ''}" data-pc="${n}" style="--c:${COL[n]}"><span class="sm-mini">${mini(n)}</span><small>${NAME[n]}${used ? ' ✓' : ''}</small></button>`;
    }).join('');
    const u = ctx.pane.querySelector('#smUndo'); if (u) u.disabled = !g.undo.length || g.done;
  }
  // 小預覽：用等角投影畫 SVG
  function mini(n) {
    const c = g.orient[n], pts = [];
    const iso = (x, y, z) => [(x - y) * 8.7, (x + y) * 5 - z * 10];
    const sorted = c.slice().sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
    sorted.forEach(([x, y, z]) => {
      const top = [iso(x, y, z + 1), iso(x + 1, y, z + 1), iso(x + 1, y + 1, z + 1), iso(x, y + 1, z + 1)];
      const left = [iso(x, y + 1, z + 1), iso(x + 1, y + 1, z + 1), iso(x + 1, y + 1, z), iso(x, y + 1, z)];
      const right = [iso(x + 1, y, z + 1), iso(x + 1, y + 1, z + 1), iso(x + 1, y + 1, z), iso(x + 1, y, z)];
      [[top, 1.15], [left, 0.8], [right, 0.95]].forEach(([q, b]) => pts.push(`<polygon points="${q.map(p => p.join(',')).join(' ')}" fill="${COL[n]}" style="filter:brightness(${b})" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>`));
    });
    return `<svg viewBox="-30 -30 60 55" width="58" height="52">${pts.join('')}</svg>`;
  }
  function views() {
    const cells = g.lv.pz.cells, box = (title, proj, flipY) => {
      const s = new Set(cells.map(c => proj(c).join(',')));
      let r = '';
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const yy = flipY ? 2 - b : b; r += `<rect x="${a * 10}" y="${yy * 10}" width="9.4" height="9.4" rx="1.5" class="${s.has(a + ',' + b) ? 'on' : ''}"/>`; }
      return `<div class="sm-v"><svg viewBox="-1 -1 32 32">${r}</svg><small>${title}</small></div>`;
    };
    return box('上視圖', c => [c[0], c[1]], false) + box('前視圖', c => [c[0], c[2]], true) + box('右視圖', c => [c[1], c[2]], true);
  }
  function say(m) { const el = ctx.pane.querySelector('#smMsg'); if (el) el.innerHTML = m; }
  function render() {
    const pane = ctx.pane;
    if (!pane || !g) return;
    pane.innerHTML = playHtml();
    pane.querySelector('#smViews').innerHTML = views();
    paint();
    const st = pane.querySelector('#smStage');
    st.addEventListener('pointerdown', ev => { drag = { x: ev.clientX, y: ev.clientY, rx: view.rx, ry: view.ry, id: ev.pointerId, moved: false, t: ev.target }; });
    st.addEventListener('pointermove', ev => {
      if (!drag || ev.pointerId !== drag.id) return;
      const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 8) return;
      if (!drag.moved) { drag.moved = true; try { st.setPointerCapture(ev.pointerId); } catch (e) { /* 忽略 */ } }
      view.ry = drag.ry + dx * 0.5; view.rx = Math.max(-89, Math.min(89, drag.rx - dy * 0.5));
      pane.querySelector('#smScene').style.transform = `rotateX(${view.rx}deg) rotateY(${view.ry}deg)`;
    });
    const up = ev => {
      if (!drag) return;
      const d = drag; drag = null;
      if (d.moved) return;
      const t = d.t.closest && d.t.closest('.sm-cube');
      if (!t) return;
      if (t.dataset.c) placeAt(t.dataset.c.split(',').map(Number));
      else if (t.dataset.n) removePiece(t.dataset.n);
    };
    st.addEventListener('pointerup', up);
    st.addEventListener('pointercancel', () => { drag = null; });
    pane.querySelector('#smTray').addEventListener('click', ev => { const b = ev.target.closest('[data-pc]'); if (!b) return; g.sel = b.dataset.pc; fx('tap'); paint(); });
    pane.querySelectorAll('[data-rot]').forEach(b => b.addEventListener('click', () => { if (!g.sel || g.done) return; g.orient[g.sel] = norm(g.orient[g.sel].map(ROT[+b.dataset.rot])); fx('rotate'); paint(); }));
    pane.querySelector('#smUndo').addEventListener('click', undo);
    pane.querySelector('#smView').addEventListener('click', () => { view = { rx: -28, ry: -35 }; paint(); });
    pane.querySelector('#smQuit').addEventListener('click', () => { g = null; ctx.back(); });
    if (g.done && g.result) showResult();
    ctx.focus();
  }
  function push() { g.undo.push(JSON.stringify(g.placed)); if (g.undo.length > 80) g.undo.shift(); }
  function undo() { if (!g || g.done || !g.undo.length) return; g.placed = JSON.parse(g.undo.pop()); fx('undo'); paint(); }
  // 把選中的積木放到 at（積木的某一格對準 at；照目前方向）
  function placeAt(at) {
    if (!g || g.done) return false;
    const n = g.sel;
    if (!n) { say('先在下面選一塊積木。'); return false; }
    if (g.placed[n]) { fx('bad'); say(`「${NAME[n]}」已經放上去了。點它可以拿回來，或選別塊。`); return false; }
    const T = target(), o = occ(), c = g.orient[n];
    for (const a of c) {
      const cells = c.map(p => [at[0] + p[0] - a[0], at[1] + p[1] - a[1], at[2] + p[2] - a[2]]);
      if (cells.every(q => T.has(K(q)) && !o[K(q)])) {
        push();
        g.placed[n] = cells;
        if (!g.started) g.started = Date.now();
        g.moves++;
        fx('place');
        const next = g.lv.pz.set.split('').find(m => !g.placed[m]);
        g.sel = next || null;
        if (!next) { finish(); return true; }
        paint();
        say(`放好了！還有 ${g.lv.pz.set.split('').filter(m => !g.placed[m]).length} 塊。`);
        return true;
      }
    }
    fx('bad');
    say('這個方向放不進去（會超出造型或撞到別塊）。用 ⟲ 按鈕轉一轉，或換個格子試試！');
    return false;
  }
  function removePiece(n) {
    if (!g || g.done || !g.placed[n]) return;
    push(); delete g.placed[n]; g.sel = n; fx('remove'); paint(); say(`把「${NAME[n]}」拿回來了。`);
  }
  function finish() {
    g.done = true;
    paint();
    const sec = Math.max(1, Math.round((Date.now() - g.started) / 1000));
    g.result = Object.assign({ sec }, ctx.grant(g.lv, sec, g.moves));
    fx('win');
    try { window.PuppyFx && window.PuppyFx.confetti(ctx.pane.querySelector('.pz-play')); } catch (e) { /* 忽略 */ }
    const sc = ctx.pane.querySelector('#smScene'), r0 = view.ry, t0 = performance.now();
    const spin = now => { const k = Math.min(1, (now - t0) / 1200); view.ry = r0 + 360 * k; if (sc) sc.style.transform = `rotateX(${view.rx}deg) rotateY(${view.ry}deg)`; if (k < 1) requestAnimationFrame(spin); };
    requestAnimationFrame(spin);
    showResult();
  }
  function showResult() {
    const box = ctx.pane.querySelector('#smResult'), r = g.result;
    if (!box || !r) return;
    const idx = LEVELS.indexOf(g.lv), next = LEVELS[idx + 1];
    box.hidden = false;
    box.innerHTML = `<div class="pz-win">🧊 拼好了！用了 ${ctx.fmtTime(r.sec)}</div>
      <div class="ty-result-grid"><div><b>${r.stars ? '+' + r.stars + '⭐' : '—'}</b><span>星星</span></div><div><b>${r.xp ? '+' + r.xp : '—'}</b><span>經驗值</span></div></div>
      ${r.note ? `<p class="ty-note">${ctx.esc(r.note)}</p>` : ''}
      <div class="pz-result-btns"><button class="btn btn-soft" id="smHome">回到益智挑戰</button>${next ? '<button class="btn btn-orange" id="smNext">下一關 ▶</button>' : ''}</div>`;
    box.querySelector('#smHome').addEventListener('click', () => { g = null; ctx.back(); });
    const nb = box.querySelector('#smNext'); if (nb) nb.addEventListener('click', () => start(next.id));
    say('');
  }
  const api = {
    attach(c) { ctx = c; },
    home(el) { el.innerHTML = homeHtml(); el.querySelectorAll('[data-sml]').forEach(b => b.addEventListener('click', () => start(b.dataset.sml))); },
    render() { if (g) render(); else ctx.back(); },
    isPlaying() { return !!g && !g.done; },
    hide() { drag = null; },
    LEVELS,
    _t: { start, placeAt, removePiece, game: () => g, RAW, norm, SH, ROT,
      // 每一關的答案：每塊形狀對（可旋轉、不可鏡射）、剛好填滿造型、不重疊
      checkAll() {
        const forms = n => { const out = new Set(), q = [norm(SH[n])]; while (q.length) { const c = q.pop(), k = JSON.stringify(c); if (out.has(k)) continue; out.add(k); ROT.forEach(f => q.push(norm(c.map(f)))); } return out; };
        return RAW.every(pz => { const T = new Set(pz.cells.map(K)), seen = new Set(); let ok = pz.sol.length === pz.set.length; pz.sol.forEach(([n, cells]) => { if (!forms(n).has(JSON.stringify(norm(cells)))) ok = false; cells.forEach(c => { if (!T.has(K(c)) || seen.has(K(c))) ok = false; seen.add(K(c)); }); }); return ok && seen.size === T.size; }) && forms('A').size === 12 && forms('P').size === 8;
      },
      // 自動測試：照答案一塊一塊放（由下往上）
      solvePlace() { g.lv.pz.sol.slice().sort((a, b) => Math.min(...a[1].map(c => c[2])) - Math.min(...b[1].map(c => c[2]))).forEach(([n, cells]) => { g.sel = n; g.orient[n] = norm(cells); const nc = norm(cells), m = [0, 1, 2].map(i => Math.min(...cells.map(c => c[i]))); placeAt([nc[0][0] + m[0], nc[0][1] + m[1], nc[0][2] + m[2]]); }); return g.done; } }
  };
  window.PuppySoma = api;
})();
