// 《汪汪小精靈 學習小伙伴》⚖️ 槓桿天平（v3.19.0，益智挑戰的科學模擬）
// 國小自然「槓桿原理」：左邊「重量 × 距離」的合計 ＝ 右邊的合計，蹺蹺板就會平衡。
//   ・灰色的砝碼是題目放好的，不能動；下面盤子裡的砝碼要「全部」放上去，而且要平衡
//   ・拖砝碼到某一格的位置（離支點 1～5 格）；點一下放上去的砝碼，就拿回盤子
//   ・畫面上隨時算給你看：左邊合計、右邊合計
(function () {
  'use strict';

  // fixed：題目放好的 [重量, 位置]（負數在左邊）；tray：要放上去的重量；sol：其中一種答案（自動測試用）
  const PUZZLES = [
    { fixed: [[2, -3]], tray: [2], sol: [3] },
    { fixed: [[2, -4]], tray: [4], sol: [2] },
    { fixed: [[3, -4]], tray: [4], sol: [3] },
    { fixed: [[1, -5], [2, -2]], tray: [3], sol: [3] },
    { fixed: [[4, -3]], tray: [2, 3], sol: [3, 2] },
    { fixed: [[5, -4]], tray: [2, 4], sol: [2, 4] },
    { fixed: [[3, -5]], tray: [1, 2, 4], sol: [1, 1, 3] },
    { fixed: [[2, -5], [2, 3]], tray: [1, 3], sol: [1, 1] },
    { fixed: [[6, -2], [1, 4]], tray: [3, 5], sol: [1, 1] },
    { fixed: [[4, -5], [3, 2]], tray: [2, 2, 5], sol: [1, 1, 2] }
  ];
  const LEVELS = PUZZLES.map((pz, k) => {
    const tier = k < 4 ? 0 : k < 7 ? 1 : 2;
    return { id: 'lv' + String(k + 1).padStart(2, '0'), no: k + 1, name: `槓桿天平第 ${k + 1} 關`, short: `第 ${k + 1} 關`, desc: ['入門', '兩三個砝碼', '兩邊都有'][tier], stars: [1, 2, 3][tier], xp: [3, 6, 10][tier], per: 1, pz };
  });
  const BY_ID = {};
  LEVELS.forEach(l => { BY_ID[l.id] = l; });

  const PX = 60, PY = 36, STEP = 10;   // 支點位置、每一格的距離（SVG 單位）
  let ctx = null;
  let g = null;   // { lv, items:[{w, p, fixed}], moves, started, done, result }
  let drag = null;

  const torque = items => items.filter(it => it.p !== null).reduce((s, it) => s + it.w * it.p, 0);
  const sides = items => {
    let L = 0, Rr = 0;
    items.forEach(it => { if (it.p === null) return; if (it.p < 0) L += it.w * -it.p; else Rr += it.w * it.p; });
    return [L, Rr];
  };
  const balanced = () => g && g.items.every(it => it.p !== null) && torque(g.items) === 0;

  function start(id) {
    const lv = BY_ID[id];
    if (!lv) return;
    g = { lv, items: lv.pz.fixed.map(([w, p]) => ({ w, p, fixed: true })).concat(lv.pz.tray.map(w => ({ w, p: null, fixed: false }))), moves: 0, started: 0, done: false, result: null };
    ctx.enter(api);
    render();
  }

  function homeHtml() {
    const card = lv => {
      const wins = ctx.wins(lv.id), left = ctx.dayLeft(lv);
      return `<button class="pz-level lv-level${wins ? ' done' : ''}" data-lvl="${lv.id}">
        <span class="pz-lv-top"><span class="pz-lv-name">${wins ? '✅ ' : ''}${ctx.esc(lv.short)}</span><span class="pz-lv-desc">${ctx.esc(lv.desc)}</span></span>
        <span class="pz-lv-prize">⭐ ${lv.stars}　✨ ${lv.xp} XP</span>
        <span class="pz-lv-sub">${left ? '今天可以領獎勵' : '今天的獎勵領完了'}</span>
      </button>`;
    };
    return `
      <h3 class="pz-h3">⚖️ 槓桿天平（科學）</h3>
      <p class="section-sub" style="margin-top:0;">把盤子裡的砝碼<b>全部</b>放到蹺蹺板上，讓它<b>平衡</b>。秘訣：<b>重量 × 離支點的距離</b>，左邊加起來要等於右邊加起來。<br>例如：左邊 2 公斤放在第 3 格（2×3＝6），右邊 3 公斤放在第 2 格（3×2＝6），就平衡了！</p>
      <div class="pz-levels lv-levels">${LEVELS.map(card).join('')}</div>`;
  }
  function playHtml() {
    return `
      <div class="card-box pz-play lv-play">
        <div class="pz-top">
          <b class="pz-title">⚖️ ${ctx.esc(g.lv.name)}</b>
          <button class="btn btn-soft pz-quit" id="lvQuit">離開</button>
        </div>
        <div class="pz-msg" id="lvMsg">把下面盤子裡的砝碼拖到蹺蹺板上（全部都要放），讓它平衡！</div>
        <svg class="lv-board" id="lvBoard" viewBox="0 0 120 82"></svg>
        <div class="lv-sum" id="lvSum"></div>
        <div class="pz-tools"><button class="btn btn-soft" id="lvReset">↺ 全部拿下來</button></div>
        <p class="section-sub pz-tip">👆 拖砝碼到數字上面　｜　👆 點一下蹺蹺板上的砝碼：拿回盤子</p>
        <div class="pz-result" id="lvResult" hidden></div>
      </div>`;
  }
  // 每個砝碼的大小：越重越大
  const boxW = w => 6.5 + w * 0.6, boxH = w => 4.6 + w * 0.9;
  function weightSvg(it, i, x, y) {
    const w = boxW(it.w), h = boxH(it.w);
    return `<g class="lv-wt${it.fixed ? ' fixed' : ''}" data-i="${i}" transform="translate(${x - w / 2},${y - h})">
      <rect width="${w}" height="${h}" rx="1"/><text x="${w / 2}" y="${h / 2 + 1.3}">${it.w}</text></g>`;
  }
  function trayPos(i) {
    const list = g.items.map((it, k) => k).filter(k => !g.items[k].fixed && g.items[k].p === null);
    const k = list.indexOf(i), n = list.length;
    return [PX + (k - (n - 1) / 2) * 14, 78];
  }
  function paint() {
    const svg = ctx.pane && ctx.pane.querySelector('#lvBoard');
    if (!svg || !g) return;
    const t = torque(g.items);
    const ang = g.done ? 0 : Math.max(-14, Math.min(14, t * 0.9));
    const pegs = [];
    for (let p = -5; p <= 5; p++) {
      if (!p) continue;
      pegs.push(`<line class="lv-peg" x1="${PX + p * STEP}" y1="${PY - 1}" x2="${PX + p * STEP}" y2="${PY + 1.6}"/><text class="lv-num" x="${PX + p * STEP}" y="${PY + 5}">${Math.abs(p)}</text>`);
    }
    // 疊在同一格的砝碼往上疊
    const stack = {};
    const onBeam = g.items.map((it, i) => {
      if (it.p === null || (drag && drag.i === i && drag.moved)) return '';
      const base = stack[it.p] || 0;
      stack[it.p] = base + boxH(it.w);
      return weightSvg(it, i, PX + it.p * STEP, PY - 1 - base);
    }).join('');
    const tray = g.items.map((it, i) => (it.fixed || it.p !== null || (drag && drag.i === i && drag.moved)) ? '' : weightSvg(it, i, ...trayPos(i))).join('');
    const ghost = drag && drag.moved ? weightSvg(g.items[drag.i], drag.i, drag.x, drag.y).replace('lv-wt', 'lv-wt ghost') : '';
    svg.innerHTML = `
      <rect class="lv-tray" x="10" y="64" width="100" height="16" rx="3"/><text class="lv-tray-t" x="14" y="68.5">盤子</text>
      <polygon class="lv-stand" points="${PX - 7},62 ${PX + 7},62 ${PX},${PY + 1}"/>
      <g class="lv-beam" style="transform: rotate(${ang}deg); transform-origin: ${PX}px ${PY}px">
        <rect class="lv-bar" x="${PX - 56}" y="${PY}" width="112" height="2.2" rx="1"/>${pegs.join('')}${onBeam}
      </g>
      <circle class="lv-pivot" cx="${PX}" cy="${PY + 1.1}" r="1.6"/>
      ${tray}${ghost}`;
    const [L, Rr] = sides(g.items);
    const fmt = side => g.items.filter(it => it.p !== null && (side < 0 ? it.p < 0 : it.p > 0)).map(it => `${it.w}×${Math.abs(it.p)}`).join(' ＋ ') || '0';
    const sum = ctx.pane.querySelector('#lvSum');
    if (sum) sum.innerHTML = `<span>左邊：${fmt(-1)} ＝ <b>${L}</b></span><span class="lv-cmp">${L === Rr ? '＝' : L > Rr ? '＞' : '＜'}</span><span>右邊：${fmt(1)} ＝ <b>${Rr}</b></span>`;
  }
  function say(m) { const el = ctx.pane.querySelector('#lvMsg'); if (el) el.textContent = m; }
  function render() {
    const pane = ctx.pane;
    if (!pane || !g) return;
    pane.innerHTML = playHtml();
    paint();
    const svg = pane.querySelector('#lvBoard');
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    pane.querySelector('#lvQuit').addEventListener('click', () => { g = null; drag = null; ctx.back(); });
    pane.querySelector('#lvReset').addEventListener('click', () => { if (g.done) return; g.items.forEach(it => { if (!it.fixed) it.p = null; }); paint(); });
    if (g.done && g.result) showResult();
    ctx.focus();
  }
  function svgPt(ev) {
    const svg = ctx.pane.querySelector('#lvBoard'), m = svg.getScreenCTM();
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  }
  function onDown(ev) {
    if (!g || g.done || drag) return;
    const t = ev.target.closest && ev.target.closest('.lv-wt');
    if (!t) return;
    const i = +t.dataset.i;
    if (g.items[i].fixed) { say('灰色的砝碼是題目放好的，不能動喔。'); return; }
    const [x, y] = svgPt(ev);
    drag = { i, id: ev.pointerId, x0: x, y0: y, x, y, moved: false };
    try { ctx.pane.querySelector('#lvBoard').setPointerCapture(ev.pointerId); } catch (e) { /* 忽略 */ }
    ev.preventDefault();
  }
  function onMove(ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    const [x, y] = svgPt(ev);
    if (!drag.moved && Math.hypot(x - drag.x0, y - drag.y0) < 1.5) return;
    drag.moved = true; drag.x = x; drag.y = y + boxH(g.items[drag.i].w) / 2;
    paint();
  }
  function onUp(ev) {
    if (!drag || (ev.pointerId !== undefined && ev.pointerId !== drag.id)) return;
    const d = drag;
    drag = null;
    const it = g.items[d.i];
    if (!d.moved) {
      if (it.p !== null) { it.p = null; changed(); } else say('用拖的：把砝碼拖到蹺蹺板的數字上面。');
      paint();
      return;
    }
    let p = Math.round((d.x - PX) / STEP);
    if (d.y > 62 || Math.abs(d.x - PX - p * STEP) > STEP * 0.6) p = null;       // 放在盤子裡或太遠：拿回盤子
    else { p = Math.max(-5, Math.min(5, p)); if (!p) { say('支點正上方（0）放了也沒有用，放旁邊的數字上。'); p = null; } }
    it.p = p;
    changed();
  }
  function changed() {
    if (!g.started) g.started = Date.now();
    g.moves++;
    const t = torque(g.items), left = g.items.filter(it => it.p === null).length;
    if (balanced()) { finish(); return; }
    paint();
    if (!left) say(t > 0 ? '右邊比較重，往右邊斜了。換個位置試試！' : t < 0 ? '左邊比較重，往左邊斜了。換個位置試試！' : '');
    else say(`盤子裡還有 ${left} 個砝碼要放上去。`);
  }
  function finish() {
    g.done = true;
    paint();
    const sec = Math.max(1, Math.round((Date.now() - g.started) / 1000));
    g.result = Object.assign({ sec }, ctx.grant(g.lv, sec, g.moves));
    showResult();
  }
  function showResult() {
    const box = ctx.pane.querySelector('#lvResult'), r = g.result;
    if (!box || !r) return;
    const [L, Rr] = sides(g.items);
    const idx = LEVELS.indexOf(g.lv), next = LEVELS[idx + 1];
    box.hidden = false;
    box.innerHTML = `
      <div class="pz-win">⚖️ 平衡了！左邊 ${L} ＝ 右邊 ${Rr}</div>
      <div class="ty-result-grid">
        <div><b>${r.stars ? '+' + r.stars + '⭐' : '—'}</b><span>星星</span></div>
        <div><b>${r.xp ? '+' + r.xp : '—'}</b><span>經驗值</span></div>
      </div>
      ${r.note ? `<p class="ty-note">${ctx.esc(r.note)}</p>` : ''}
      <div class="pz-result-btns"><button class="btn btn-soft" id="lvHome">回到益智挑戰</button>${next ? `<button class="btn btn-orange" id="lvNext">下一關 ▶</button>` : ''}</div>`;
    box.querySelector('#lvHome').addEventListener('click', () => { g = null; ctx.back(); });
    const nb = box.querySelector('#lvNext'); if (nb) nb.addEventListener('click', () => start(next.id));
    say('');
  }

  const api = {
    attach(c) { ctx = c; },
    home(el) {
      el.innerHTML = homeHtml();
      el.querySelectorAll('[data-lvl]').forEach(b => b.addEventListener('click', () => start(b.dataset.lvl)));
    },
    render() { if (g) render(); else ctx.back(); },
    isPlaying() { return !!g && !g.done; },
    hide() { drag = null; },
    LEVELS,
    _t: { start, torque, balanced, game: () => g, changed, PUZZLES,
      // 自動測試：照答案放
      solveAll() { const t = g.items.filter(it => !it.fixed); t.forEach((it, k) => { it.p = g.lv.pz.sol[k]; }); } }
  };
  window.PuppyLever = api;
})();
