// 《汪汪小精靈 學習小伙伴》🔺 七巧板（v3.16.0，益智挑戰的第二個遊戲）
// 玩法：把下面的 7 片拖到上面的灰色剪影裡，剛好蓋滿就過關。
//   ・拖曳：移動（放開會對齊格子）　・點一下：轉 90 度　・「⇋ 翻面」：把選到的那一片翻過來
//   ・💡 提示：在剪影裡畫出一片的位置（這一關少一顆星，最少 1 顆）
// 題目是原創剪影，用 tools/tangram_shapes.py 產生並確認每一題都拼得出來（SHAPES 那一行由它輸出，不要手改）。
// 判斷方法：每一格用兩條對角線切成 4 個小三角，拼好的 7 片蓋到的小三角要和剪影「一模一樣、沒有重疊」。
(function () {
  'use strict';

  const PIECES = [
    { id: 'L1', poly: [[0, 0], [2, 0], [0, 2]], color: '#e53935' },
    { id: 'L2', poly: [[0, 0], [2, 0], [0, 2]], color: '#1e88e5' },
    { id: 'M', poly: [[0, 0], [2, 0], [1, 1]], color: '#43a047' },
    { id: 'S1', poly: [[0, 0], [1, 0], [0, 1]], color: '#fdd835' },
    { id: 'S2', poly: [[0, 0], [1, 0], [0, 1]], color: '#8e24aa' },
    { id: 'SQ', poly: [[0, 0], [1, 0], [1, 1], [0, 1]], color: '#ff8f00' },
    { id: 'PA', poly: [[0, 0], [1, 0], [2, 1], [1, 1]], color: '#00acc1' }
  ];
  // SHAPES（由 tools/tangram_shapes.py 產生）
  const SHAPES = /*SHAPES*/[{"id":"t01","name":"大三角形","lv":1,"shape":[[[0,0],[4,0],[0,4]]],"sol":[[1,0,0,0],[0,0,2,0],[3,0,1,1],[3,0,0,0],[0,0,0,2],[0,0,0,1],[1,0,0,2]]},{"id":"t02","name":"長方形","lv":1,"shape":[[[0,0],[4,0],[4,2],[0,2]]],"sol":[[0,0,0,0],[2,0,0,0],[0,0,2,0],[3,0,2,0],[2,0,3,1],[0,0,2,1],[1,0,3,0]]},{"id":"t03","name":"房子","lv":1,"shape":[[[2,0],[4,2],[3,2],[3,4],[1,4],[1,2],[0,2]]],"sol":[[2,0,0,0],[3,0,2,0],[0,0,1,2],[3,0,1,2],[2,0,2,3],[0,0,1,3],[1,0,2,2]]},{"id":"t04","name":"字母 T","lv":1,"shape":[[[0,0],[4,0],[4,1],[3,1],[3,3],[1,3],[1,1],[0,1]]],"sol":[[1,0,0,0],[3,0,1,1],[1,0,2,0],[3,0,0,0],[0,0,2,0],[0,0,3,0],[1,1,2,1]]},{"id":"t05","name":"大鑽石","lv":2,"shape":[[[2,0],[4,2],[2,4],[0,2]]],"sol":[[2,0,0,0],[1,0,0,2],[3,0,3,1],[3,0,2,0],[0,0,2,2],[0,0,2,1],[1,0,2,2]]},{"id":"t06","name":"小魚","lv":2,"shape":[[[0,1],[1,0],[2,0],[3,1],[5,-1],[5,3],[3,1],[2,2],[1,2]]],"sol":[[2,0,3,-1],[1,0,3,1],[1,0,0,0],[0,0,1,1],[3,0,2,0],[0,0,1,0],[0,1,1,1]]},{"id":"t07","name":"小貓","lv":2,"shape":[[[0,1],[2,1],[2,2],[0,2]],[[0,2],[2,2],[2,4],[0,4]],[[0,0],[1,1],[0,1]],[[2,0],[2,1],[1,1]],[[3,1],[3,2],[2,2]],[[2,2],[3,2],[2,3]]],"sol":[[3,0,0,0],[0,0,0,2],[1,0,1,0],[2,0,0,3],[2,0,1,2],[0,0,1,3],[1,0,2,1]]},{"id":"t08","name":"帆船","lv":2,"shape":[[[2,1],[2,3],[3,3],[3,1],[5,3],[4,4],[1,4],[0,3]]],"sol":[[2,0,0,1],[3,0,3,1],[0,0,0,3],[2,0,1,3],[0,0,3,3],[0,0,2,3],[0,1,3,3]]},{"id":"t09","name":"箭頭","lv":2,"shape":[[[2,0],[4,2],[2,4],[2,3],[0,3],[0,1],[2,1]]],"sol":[[0,0,0,1],[2,0,0,1],[3,0,3,1],[3,0,2,0],[0,0,2,2],[0,0,2,1],[1,0,2,2]]},{"id":"t10","name":"椅子","lv":3,"shape":[[[0,-1],[1,-1],[1,2],[3,2],[3,4],[2,4],[2,3],[1,3],[1,4],[0,4]]],"sol":[[3,0,0,1],[1,0,1,2],[1,0,0,-1],[0,0,0,-1],[3,0,2,3],[0,0,0,3],[1,1,0,0]]},{"id":"t11","name":"火箭","lv":3,"shape":[[[1,0],[2,1],[2,3],[3,4],[-1,4],[0,3],[0,1]]],"sol":[[2,0,-1,2],[0,0,0,1],[2,0,0,0],[2,0,1,1],[3,0,1,3],[0,0,1,2],[0,0,1,3]]},{"id":"t12","name":"小鴨子","lv":3,"shape":[[[0,1],[2,1],[2,2],[0,2]],[[1,2],[3,2],[3,4],[1,4]],[[1,0],[2,1],[1,1]],[[-1,2],[0,1],[0,2]],[[3,2],[3,3],[4,2]],[[0,4],[1,3],[1,4]]],"sol":[[2,0,0,2],[0,0,2,2],[3,0,1,0],[2,0,-1,1],[2,0,2,3],[0,0,0,1],[1,0,1,1]]}]/*END*/;
  const PRIZE = { 1: { stars: 1, xp: 4, label: '簡單' }, 2: { stars: 2, xp: 8, label: '普通' }, 3: { stars: 3, xp: 12, label: '困難' } };
  const LEVELS = SHAPES.map(s => ({ id: 'tg_' + s.id, name: '七巧板「' + s.name + '」', short: s.name, lv: s.lv, stars: PRIZE[s.lv].stars, xp: PRIZE[s.lv].xp, per: 1, shape: s }));
  const BY_ID = {};
  LEVELS.forEach(l => { BY_ID[l.id] = l; });

  let ctx = null;
  let play = null;              // { lv, pieces:[{x,y,rot,flip}], ox, oy, H, trayY, sel, hints:Set, started, done, result }
  let drag = null;

  // ── 幾何 ──
  function orient(poly, rot, flip) {
    let pts = poly.map(([x, y]) => {
      if (flip) x = -x;
      for (let i = 0; i < ((rot % 4) + 4) % 4; i++) { const t = x; x = -y; y = t; }
      return [x, y];
    });
    const mx = Math.min(...pts.map(p => p[0])), my = Math.min(...pts.map(p => p[1]));
    return pts.map(([x, y]) => [x - mx, y - my]);
  }
  function inside(px, py, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[j];
      if ((y1 > py) !== (y2 > py) && px < (x2 - x1) * (py - y1) / (y2 - y1) + x1) c = !c;
    }
    return c;
  }
  const QOFF = [[0.5, 0.25], [0.75, 0.5], [0.5, 0.75], [0.25, 0.5]];
  function quarters(polys) {
    const out = [];
    const xs = [], ys = [];
    polys.forEach(p => p.forEach(([x, y]) => { xs.push(x); ys.push(y); }));
    for (let cx = Math.floor(Math.min(...xs)); cx < Math.ceil(Math.max(...xs)); cx++) {
      for (let cy = Math.floor(Math.min(...ys)); cy < Math.ceil(Math.max(...ys)); cy++) {
        QOFF.forEach(([ox, oy], k) => { if (polys.some(p => inside(cx + ox, cy + oy, p))) out.push(cx + ',' + cy + ',' + k); });
      }
    }
    return out;
  }
  const moved = (poly, dx, dy) => poly.map(([x, y]) => [x + dx, y + dy]);
  function piecePoly(i, st) { return moved(orient(PIECES[i].poly, st.rot, st.flip), st.x, st.y); }
  function size(i, st) { const o = orient(PIECES[i].poly, st.rot, st.flip); return [Math.max(...o.map(p => p[0])), Math.max(...o.map(p => p[1]))]; }
  function targetPolys() { return play.lv.shape.shape.map(p => moved(p, play.ox, play.oy)); }
  function solPoly(i) { const s = play.lv.shape.sol[i]; return moved(orient(PIECES[i].poly, s[0], s[1]), s[2] + play.ox, s[3] + play.oy); }

  // 拼好了嗎：每一片都在格子上，蓋到的小三角跟剪影完全一樣、沒有重疊
  function isSolved() {
    if (!play) return false;
    const want = new Set(quarters(targetPolys()));
    const got = new Set();
    for (let i = 0; i < PIECES.length; i++) {
      const st = play.pieces[i];
      if (st.x !== Math.round(st.x) || st.y !== Math.round(st.y)) return false;
      for (const q of quarters([piecePoly(i, st)])) {
        if (got.has(q) || !want.has(q)) return false;
        got.add(q);
      }
    }
    return got.size === want.size;
  }
  // 某一片已經放在正確答案的位置（兩個大三角、兩個小三角可以互換）
  function pieceRight(i) {
    const mine = quarters([piecePoly(i, play.pieces[i])]).sort().join('|');
    const twins = PIECES[i].id[0] === 'L' ? [0, 1] : PIECES[i].id[0] === 'S' && PIECES[i].id !== 'SQ' ? [3, 4] : [i];
    return twins.some(j => quarters([solPoly(j)]).sort().join('|') === mine);
  }

  // ── 開始一關 ──
  function trayLayout() {
    // 7 片排在剪影下面（兩排），手機上也點得到
    const slots = play.narrow
      ? [[0.4, 0], [3.1, 0], [5.8, 0.2], [0.4, 2.4], [1.9, 2.4], [3.4, 2.4], [4.9, 2.4]]     // 手機：排兩排，每一片比較大
      : [[0.5, 0], [3, 0], [5.5, 0], [8.2, 0], [9.8, 0], [11.4, 0], [12.7, 0]];
    return slots.map(([x, y]) => [x, y + play.trayY]);
  }
  function resetPieces() {
    const t = trayLayout();
    play.pieces = PIECES.map((p, i) => ({ x: t[i][0], y: t[i][1], rot: 0, flip: 0 }));
  }
  function start(id) {
    const lv = BY_ID[id];
    if (!lv) return;
    const sh = lv.shape.shape, xs = [], ys = [];
    sh.forEach(p => p.forEach(([x, y]) => { xs.push(x); ys.push(y); }));
    const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    const narrow = ((ctx.pane && ctx.pane.clientWidth) || 800) < 600;
    const W = narrow ? 9.5 : 15;   // 畫面寬度（格）
    const ox = Math.round((W - bw) / 2) - Math.min(...xs), oy = 1 - Math.min(...ys);
    const trayY = 1 + bh + 1.5;
    play = { lv, W, narrow, ox, oy, trayY, H: trayY + (narrow ? 4.3 : 3), sel: -1, hints: new Set(), started: 0, done: false, result: null, moves: 0 };
    resetPieces();
    ctx.enter(api);
    render();
  }

  // ── 畫面 ──
  function homeHtml() {
    const card = lv => {
      const wins = ctx.wins(lv.id), left = ctx.dayLeft(lv), best = ctx.best(lv.id);
      return `<button class="pz-level tg-level${wins ? ' done' : ''}" data-tg="${lv.id}">
        <span class="pz-lv-top"><span class="pz-lv-name">${wins ? '✅ ' : ''}${ctx.esc(lv.short)}</span><span class="pz-lv-desc">${PRIZE[lv.lv].label}</span></span>
        ${miniSvg(lv)}
        <span class="pz-lv-prize">⭐ ${lv.stars}　✨ ${lv.xp} XP</span>
        <span class="pz-lv-sub">${left ? '今天可以領獎勵' : '今天的獎勵領完了'}${best ? `｜最快 ${ctx.fmtTime(best)}` : ''}</span>
      </button>`;
    };
    return `
      <h3 class="pz-h3">🔺 七巧板</h3>
      <p class="section-sub" style="margin-top:0;">用 7 片拼出灰色的圖形。<b>拖曳</b>移動、<b>點一下</b>轉 90 度、按「⇋ 翻面」把平行四邊形翻過來。「簡單」的題目會畫出分割線。</p>
      <div class="pz-levels tg-levels">${LEVELS.map(card).join('')}</div>`;
  }
  function miniSvg(lv) {
    const sh = lv.shape.shape, xs = [], ys = [];
    sh.forEach(p => p.forEach(([x, y]) => { xs.push(x); ys.push(y); }));
    const x0 = Math.min(...xs) - 0.3, y0 = Math.min(...ys) - 0.3, w = Math.max(...xs) - x0 + 0.3, h = Math.max(...ys) - y0 + 0.3;
    return `<svg class="tg-mini" viewBox="${x0} ${y0} ${w} ${h}" aria-hidden="true">${sh.map(p => `<polygon points="${p.map(q => q.join(',')).join(' ')}" fill="#5b4a3c" stroke="#5b4a3c" stroke-width="0.04"/>`).join('')}</svg>`;
  }
  function playHtml() {
    const lv = play.lv;
    return `
      <div class="card-box pz-play tg-play">
        <div class="pz-top">
          <b class="pz-title">🔺 ${ctx.esc(lv.short)}（${PRIZE[lv.lv].label}）</b>
          <span class="pz-stat">⏱ <span id="tgTime">0 秒</span></span>
          <button class="btn btn-soft pz-quit" id="tgQuit">離開</button>
        </div>
        <div class="pz-msg" id="tgMsg">把下面的 7 片拖到灰色圖形裡。點一下可以轉，蓋滿就過關！</div>
        <svg class="tg-board" id="tgBoard" viewBox="0 0 ${play.W} ${play.H}"></svg>
        <div class="pz-tools">
          <button class="btn btn-soft" id="tgRot">↻ 轉一下</button>
          <button class="btn btn-soft" id="tgFlip">⇋ 翻面</button>
          <button class="btn btn-soft" id="tgHint">💡 提示</button>
          <button class="btn btn-soft" id="tgReset">↺ 全部放回去</button>
        </div>
        <p class="section-sub pz-tip">👆 拖曳：移動　｜　👆 點一下：轉 90 度　｜　先點選一片，再按「⇋ 翻面」</p>
        <div class="pz-result" id="tgResult" hidden></div>
      </div>`;
  }
  function paintBoard() {
    const svg = ctx.pane.querySelector('#tgBoard');
    if (!svg || !play) return;
    const grid = [];
    for (let x = 1; x < play.W; x++) grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${play.trayY - 0.6}"/>`);
    for (let y = 1; y < play.trayY - 0.5; y++) grid.push(`<line x1="0" y1="${y}" x2="${play.W}" y2="${y}"/>`);
    const tgt = targetPolys().map(p => `<polygon points="${p.map(q => q.join(',')).join(' ')}"/>`).join('');
    const showLines = play.lv.lv === 1;
    const guide = PIECES.map((_, i) => (showLines || play.hints.has(i)) ? `<polygon class="${play.hints.has(i) ? 'tg-hint' : 'tg-guide'}" points="${solPoly(i).map(q => q.join(',')).join(' ')}"/>` : '').join('');
    const order = PIECES.map((_, i) => i).filter(i => i !== play.sel);
    if (play.sel >= 0) order.push(play.sel);
    const pcs = order.map(i => {
      const st = play.pieces[i];
      return `<polygon class="tg-piece${i === play.sel ? ' sel' : ''}${play.done ? ' done' : ''}" data-p="${i}" fill="${PIECES[i].color}" points="${piecePoly(i, st).map(q => q.join(',')).join(' ')}"/>`;
    }).join('');
    svg.innerHTML = `<g class="tg-grid">${grid.join('')}</g><rect class="tg-tray" x="0.2" y="${play.trayY - 0.5}" width="${play.W - 0.4}" height="${play.H - play.trayY + 0.3}" rx="0.4"/>
      <g class="tg-target">${tgt}</g><g>${guide}</g><g>${pcs}</g>`;
  }
  function paintTime() {
    const t = ctx.pane && ctx.pane.querySelector('#tgTime');
    if (t && play) t.textContent = play.started ? ctx.fmtTime(((play.endAt || Date.now()) - play.started) / 1000) : '0 秒';
  }
  function say(m) { const el = ctx.pane.querySelector('#tgMsg'); if (el) el.textContent = m; }
  function render() {
    const pane = ctx.pane;
    if (!pane || !play) return;
    pane.innerHTML = playHtml();
    paintBoard(); paintTime();
    const on = (sel, fn) => { const el = pane.querySelector(sel); if (el) el.addEventListener('click', fn); };
    on('#tgQuit', () => { play = null; ctx.back(); });
    on('#tgRot', () => { if (play.sel >= 0) turnPiece(play.sel, 1, 0); else say('先點選一片，再按「轉一下」。'); });
    on('#tgFlip', () => { if (play.sel >= 0) turnPiece(play.sel, 0, 1); else say('先點選一片（例如藍綠色的平行四邊形），再按「翻面」。'); });
    on('#tgHint', hint);
    on('#tgReset', () => { if (play.done) return; resetPieces(); play.sel = -1; paintBoard(); });
    const svg = pane.querySelector('#tgBoard');
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    if (play.done && play.result) showResult();
    ctx.focus();
  }

  // ── 操作 ──
  function svgPt(ev) {
    const svg = ctx.pane.querySelector('#tgBoard');
    const m = svg.getScreenCTM();
    if (!m) return [0, 0];
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  }
  function clampPiece(i) {
    const st = play.pieces[i], [w, h] = size(i, st);
    st.x = Math.max(0, Math.min(play.W - w, st.x));
    st.y = Math.max(0, Math.min(play.H - h, st.y));
  }
  function snap(i) {
    const st = play.pieces[i];
    st.x = Math.round(st.x); st.y = Math.round(st.y);
    clampPiece(i);
    st.x = Math.round(st.x); st.y = Math.round(st.y);
  }
  // 轉或翻：以這一片的中心為準
  function turnPiece(i, dr, df) {
    if (!play || play.done) return;
    const st = play.pieces[i], [w0, h0] = size(i, st);
    const cx = st.x + w0 / 2, cy = st.y + h0 / 2;
    st.rot = (st.rot + dr) % 4;
    if (df) st.flip = st.flip ? 0 : 1;
    const [w1, h1] = size(i, st);
    st.x = cx - w1 / 2; st.y = cy - h1 / 2;
    snap(i);
    afterChange();
  }
  function onDown(ev) {
    if (!play || play.done || drag) return;
    const t = ev.target.closest && ev.target.closest('.tg-piece');
    if (!t) { play.sel = -1; paintBoard(); return; }
    const i = +t.dataset.p, [px, py] = svgPt(ev), st = play.pieces[i];
    drag = { i, id: ev.pointerId, dx: px - st.x, dy: py - st.y, x0: px, y0: py, moved: false };
    play.sel = i;
    try { ctx.pane.querySelector('#tgBoard').setPointerCapture(ev.pointerId); } catch (e) { /* 忽略 */ }
    paintBoard();
    ev.preventDefault();
  }
  function onMove(ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    const [px, py] = svgPt(ev);
    if (!drag.moved && Math.hypot(px - drag.x0, py - drag.y0) < 0.25) return;
    drag.moved = true;
    const st = play.pieces[drag.i];
    st.x = px - drag.dx; st.y = py - drag.dy;
    clampPiece(drag.i);
    const el = ctx.pane.querySelector(`.tg-piece[data-p="${drag.i}"]`);
    if (el) el.setAttribute('points', piecePoly(drag.i, st).map(q => q.join(',')).join(' '));
  }
  function onUp(ev) {
    if (!drag || (ev.pointerId !== undefined && ev.pointerId !== drag.id)) return;
    const d = drag;
    drag = null;
    if (!d.moved) { turnPiece(d.i, 1, 0); return; }   // 點一下：轉 90 度
    snap(d.i);
    afterChange();
  }
  function afterChange() {
    if (!play.started) play.started = Date.now();
    play.moves += 1;
    paintBoard();
    if (!isSolved()) return;
    play.done = true;
    play.endAt = Date.now();
    paintTime();
    const sec = Math.max(1, Math.round((play.endAt - play.started) / 1000));
    const lv = play.lv;
    // 用了提示：這一關少一顆星（最少 1 顆）
    const used = play.hints.size;
    const lvNow = used ? Object.assign({}, lv, { stars: Math.max(1, lv.stars - 1) }) : lv;
    const r = ctx.grant(lvNow, sec, play.moves);
    play.result = Object.assign({ sec, used }, r);
    paintBoard();
    showResult();
  }
  function hint() {
    if (!play || play.done) return;
    const i = PIECES.findIndex((_, k) => !play.hints.has(k) && !pieceRight(k));
    if (i < 0) { say('每一片都放對位置了，再檢查看看有沒有蓋滿！'); return; }
    play.hints.add(i);
    say(`💡 虛線是一片的位置（${play.hints.size === 1 ? '這一關少一顆星' : '已經用了 ' + play.hints.size + ' 次提示'}）。`);
    paintBoard();
  }
  function showResult() {
    const box = ctx.pane.querySelector('#tgResult'), r = play.result;
    if (!box || !r) return;
    box.hidden = false;
    const idx = LEVELS.indexOf(play.lv), next = LEVELS[idx + 1];
    box.innerHTML = `
      <div class="pz-win">🎉 拼好了！「${ctx.esc(play.lv.short)}」</div>
      <div class="ty-result-grid">
        <div><b>${ctx.fmtTime(r.sec)}</b><span>用時${r.newBest ? '（新紀錄！）' : ''}</span></div>
        <div><b>${r.stars ? '+' + r.stars + '⭐' : '—'}</b><span>星星${r.used ? '（用了提示）' : ''}</span></div>
        <div><b>${r.xp ? '+' + r.xp : '—'}</b><span>經驗值</span></div>
      </div>
      ${r.note ? `<p class="ty-note">${ctx.esc(r.note)}</p>` : ''}
      <div class="pz-result-btns">
        <button class="btn btn-soft" id="tgHome">回到題目</button>
        ${next ? `<button class="btn btn-orange" id="tgNext">下一題：${ctx.esc(next.short)} ▶</button>` : ''}
      </div>`;
    const on = (sel, fn) => { const el = box.querySelector(sel); if (el) el.addEventListener('click', fn); };
    on('#tgHome', () => { play = null; ctx.back(); });
    on('#tgNext', () => start(next.id));
    say('');
  }

  let ticker = 0;
  const api = {
    attach(c) {
      ctx = c;
      if (!ticker) ticker = setInterval(() => { if (play && play.started && !play.done && ctx.pane && ctx.pane.getClientRects().length) paintTime(); }, 500);
    },
    home(el) {
      el.innerHTML = homeHtml();
      el.querySelectorAll('[data-tg]').forEach(b => b.addEventListener('click', () => start(b.dataset.tg)));
    },
    render() { if (play) render(); else ctx.back(); },
    isPlaying() { return !!play && !play.done; },
    hide() { drag = null; },
    LEVELS,
    _t: { start, isSolved, pieceRight, quarters, orient, play: () => play, PIECES, SHAPES, solPoly, afterChange, turnPiece, snap,
      // 自動測試：把每一片直接放到答案的位置
      solveAll() { PIECES.forEach((_, i) => { const s = play.lv.shape.sol[i]; Object.assign(play.pieces[i], { rot: s[0], flip: s[1], x: s[2] + play.ox, y: s[3] + play.oy }); }); } }
  };
  window.PuppyTangram = api;
})();
