// 《汪汪小精靈 學習小伙伴》🧩 益智挑戰（v3.14.0）
// 第一個遊戲：魔術方塊（2×2、3×3、4×4），用 CSS 3D 畫，不用外部函式庫，平板手指和滑鼠都能轉。
//   ・拖方塊上的貼紙：轉那一層（手指拖到哪，那一層就跟著轉到哪，放開自動對齊）
//   ・拖方塊旁邊的空白處：轉整顆方塊看其他面；也可以按「⟲ ⟳ ⇅」按鈕
//   ・挑戰：依難度打亂，轉回六面同色就過關，依難度給星星和經驗值（每關每天有次數上限，經驗值每天最多 DAY_XP_CAP）
//   ・練習：自由轉、隨時打亂或還原，不給獎勵
// 紀錄在 state.puzzle：best（最快秒數，越小越好）、bestm（最少步數）、wins（總過關次數）、days（每天經驗值、各關次數，只留 30 天）
(function () {
  'use strict';

  const DAY_XP_CAP = 80;
  // 挑戰關卡：steps＝打亂幾步（0＝完全打亂）；per＝每天最多拿幾次獎勵
  const LEVELS = [
    { id: 'c3a', n: 3, steps: 2, name: '3×3 暖身', desc: '打亂 2 步', stars: 1, xp: 4, per: 1 },
    { id: 'c3b', n: 3, steps: 4, name: '3×3 小挑戰', desc: '打亂 4 步', stars: 2, xp: 8, per: 1 },
    { id: 'c3c', n: 3, steps: 7, name: '3×3 大挑戰', desc: '打亂 7 步', stars: 3, xp: 15, per: 2 },
    { id: 'c3', n: 3, steps: 0, name: '3×3 魔術方塊', desc: '完全打亂', stars: 6, xp: 30, per: 2 },
    { id: 'c2', n: 2, steps: 0, name: '2×2 小方塊', desc: '完全打亂', stars: 3, xp: 12, per: 2 },
    { id: 'c4a', n: 4, steps: 3, name: '4×4 暖身', desc: '打亂 3 步', stars: 2, xp: 8, per: 1 },
    { id: 'c4', n: 4, steps: 0, name: '4×4 魔術方塊', desc: '完全打亂', stars: 10, xp: 50, per: 1 }
  ];
  const BY_ID = {};
  LEVELS.forEach(l => { BY_ID[l.id] = l; });
  const FULL_STEPS = { 2: 15, 3: 25, 4: 40 };
  const SHOW_STEPS_MAX = 7;          // 打亂 7 步以內：慢慢轉給學生看（可以倒著轉回去）

  // 六個面：右、左、上、下、前、後（座標跟 CSS 一樣：x 往右、y 往下、z 朝向螢幕外）
  const FACES = [[1, 0, 0], [-1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1]];
  const COLORS = ['#e53935', '#ff8f00', '#ffffff', '#fdd835', '#2fa84f', '#1e6fd9'];
  const COLOR_NAME = ['紅', '橘', '白', '黃', '綠', '藍'];
  const FACE_TF = ['rotateY(90deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)', '', 'rotateY(180deg)'];
  const AX = ['X', 'Y', 'Z'];

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  // ════════════════════════════════════════════════════════════════════
  //  方塊模型（座標用兩倍整數：3×3 是 -2、0、2；4×4 是 -3、-1、1、3）
  // ════════════════════════════════════════════════════════════════════
  const I3 = () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  function mulMV(M, v) { return [0, 1, 2].map(i => M[i][0] * v[0] + M[i][1] * v[1] + M[i][2] * v[2]); }
  function mulMM(A, B) { return [0, 1, 2].map(i => [0, 1, 2].map(j => A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j])); }
  // 繞 axis 軸轉 q 個 90 度（方向跟 CSS rotateX／Y／Z 的正角度一樣）
  function rotM(axis, q) {
    const t = q * Math.PI / 2, c = Math.round(Math.cos(t)), s = Math.round(Math.sin(t));
    if (axis === 0) return [[1, 0, 0], [0, c, -s], [0, s, c]];
    if (axis === 1) return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
  }
  function faceIndex(v) { return FACES.findIndex(f => f[0] === v[0] && f[1] === v[1] && f[2] === v[2]); }

  function makeCube(n) {
    const m = n - 1, cubies = [];
    for (let x = -m; x <= m; x += 2) for (let y = -m; y <= m; y += 2) for (let z = -m; z <= m; z += 2) {
      if (Math.abs(x) !== m && Math.abs(y) !== m && Math.abs(z) !== m) continue;   // 裡面看不到的不畫
      const p = [x, y, z];
      const col = FACES.map((f, i) => {
        const k = f[0] ? 0 : f[1] ? 1 : 2;
        return p[k] * f[k] === m ? i : -1;
      });
      cubies.push({ p, M: I3(), col });
    }
    return { n, cubies };
  }
  function turn(cube, axis, layer, q) {
    q = ((q % 4) + 4) % 4;
    if (!q) return;
    const Rm = rotM(axis, q);
    cube.cubies.forEach(c => {
      if (c.p[axis] !== layer) return;
      c.p = mulMV(Rm, c.p);
      c.M = mulMM(Rm, c.M);
    });
  }
  function isSolved(cube) {
    const seen = [-1, -1, -1, -1, -1, -1];
    for (const c of cube.cubies) {
      for (let i = 0; i < 6; i++) {
        if (c.col[i] < 0) continue;
        const w = faceIndex(mulMV(c.M, FACES[i]));
        if (seen[w] === -1) seen[w] = c.col[i];
        else if (seen[w] !== c.col[i]) return false;
      }
    }
    return true;
  }
  function layersOf(n) { const out = []; for (let v = -(n - 1); v <= n - 1; v += 2) out.push(v); return out; }
  // 打亂：不連續轉同一個軸；少步數的關卡只轉外層（比較像真的方塊、學生看得懂）
  function scrambleMoves(n, steps) {
    const full = !steps, k = full ? FULL_STEPS[n] : steps;
    const all = layersOf(n), outer = [-(n - 1), n - 1];
    const out = [];
    let lastAxis = -1;
    for (let i = 0; i < k; i++) {
      let axis;
      do { axis = R(0, 2); } while (axis === lastAxis);
      lastAxis = axis;
      const pool = full ? all : outer;
      const layer = pool[R(0, pool.length - 1)];
      const q = full ? [1, -1, 2][R(0, 2)] : (Math.random() < 0.5 ? 1 : -1);
      out.push([axis, layer, q]);
    }
    return out;
  }

  // ════════════════════════════════════════════════════════════════════
  //  紀錄與獎勵
  // ════════════════════════════════════════════════════════════════════
  let api = null, pane = null;
  function todayStr() { const d = new Date(); const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }
  function data() {
    const st = api.getState();
    if (!st.puzzle || typeof st.puzzle !== 'object' || Array.isArray(st.puzzle)) st.puzzle = {};
    const p = st.puzzle;
    ['best', 'bestm', 'wins', 'days'].forEach(k => { if (!p[k] || typeof p[k] !== 'object' || Array.isArray(p[k])) p[k] = {}; });
    return p;
  }
  function today() {
    const p = data(), d = todayStr();
    if (!p.days[d] || typeof p.days[d] !== 'object') p.days[d] = { xp: 0, wins: {} };
    if (!p.days[d].wins || typeof p.days[d].wins !== 'object') p.days[d].wins = {};
    Object.keys(p.days).sort().slice(0, -30).forEach(k => { delete p.days[k]; });
    return p.days[d];
  }
  // 過關：回傳這次的結果（獎勵已經算好）
  function reward(lv, sec, moves) {
    const p = data(), d = today();
    const before = d.wins[lv.id] || 0;
    d.wins[lv.id] = before + 1;
    p.wins[lv.id] = (p.wins[lv.id] || 0) + 1;
    let stars = 0, xp = 0, note = '';
    if (before < lv.per) {
      stars = lv.stars;
      const left = Math.max(0, DAY_XP_CAP - (d.xp || 0));
      xp = Math.min(lv.xp, left);
      if (!left) note = `今天益智挑戰的經驗值已經滿了（${DAY_XP_CAP}），星星照樣給你！`;
    } else {
      note = `「${lv.name}」今天的獎勵已經拿過 ${lv.per} 次了，明天再來拿！（還是可以繼續挑戰、刷新紀錄）`;
    }
    d.xp = (d.xp || 0) + xp;
    const newBest = !p.best[lv.id] || sec < p.best[lv.id];
    if (newBest) p.best[lv.id] = sec;
    if (!p.bestm[lv.id] || moves < p.bestm[lv.id]) p.bestm[lv.id] = moves;
    return { stars, xp, note, newBest };
  }

  // ════════════════════════════════════════════════════════════════════
  //  畫面狀態
  // ════════════════════════════════════════════════════════════════════
  let view = 'home';           // home｜play（魔術方塊）｜sub（七巧板、五子棋自己畫畫面）
  let sub = null;              // view === 'sub' 時正在玩的遊戲模組
  let hub = 'cube';            // 首頁選了哪一個遊戲：cube｜tangram｜gomoku
  try { hub = localStorage.getItem('puppy_puzzle_hub') || 'cube'; } catch (e) { /* 忽略 */ }
  let game = null;             // { lv（挑戰關卡，練習時 null）, n, cube, moves, undo:[], started, scrambling, solved, result }
  let rx = -28, ry = -38;      // 看方塊的角度
  let busy = false;            // 正在播放轉動動畫
  let els = null;              // { stage, cube, cubieEls[], s }
  let drag = null;
  let ticker = 0;
  let resizeT = 0;

  function cubeSizePx() {
    const w = (pane && pane.clientWidth) || 360;
    return Math.round(Math.max(140, Math.min(w * (w < 600 ? 0.5 : 0.58), 330)));   // 手機留多一點空白，方便拖空白處轉整顆
  }

  function homeHtml() {
    const p = data(), d = today();
    const card = lv => {
      const best = p.best[lv.id], wins = p.wins[lv.id] || 0, got = d.wins[lv.id] || 0;
      const left = Math.max(0, lv.per - got);
      return `<button class="pz-level${wins ? ' done' : ''}" data-lv="${lv.id}">
        <span class="pz-lv-top"><span class="pz-lv-name">${esc(lv.name)}</span><span class="pz-lv-desc">${esc(lv.desc)}</span></span>
        <span class="pz-lv-prize">⭐ ${lv.stars}　✨ ${lv.xp} XP</span>
        <span class="pz-lv-sub">${left ? `今天還可以領 ${left} 次` : '今天的獎勵領完了'}${best ? `｜最快 ${fmtTime(best)}` : ''}</span>
      </button>`;
    };
    return `
      <div class="card-box pz-home">
        <div class="section-title"><span>🧩 益智挑戰</span><span class="ty-today-pill">今天益智經驗值 ${d.xp || 0}／${DAY_XP_CAP}</span></div>
        <p class="section-sub">動動腦、練空間感！過關就有星星和經驗值。每一關每天可以領的次數有限，領完還是可以玩、刷新自己的紀錄。</p>
        ${hubHtml()}
        ${hub !== 'cube' && subMod(hub) ? '<div id="pzSubHome"></div></div>' : ''}
        ${hub !== 'cube' && subMod(hub) ? '' : `
        <h3 class="pz-h3">🟥 魔術方塊</h3>
        <p class="section-sub" style="margin-top:0;">把打亂的方塊轉回<b>六面同色</b>。新手先從「暖身」開始：看清楚怎麼打亂的，<b>倒著轉回去</b>就過關了！</p>
        <div class="pz-levels">${LEVELS.map(card).join('')}</div>
        <div class="pz-practice">
          <b>🎮 自由練習（沒有獎勵）：</b>
          <button class="btn btn-soft" data-practice="2">2×2</button>
          <button class="btn btn-soft" data-practice="3">3×3</button>
          <button class="btn btn-soft" data-practice="4">4×4</button>
        </div>
        <details class="pz-help"><summary>📘 3×3 怎麼轉回來？（新手七步驟）</summary>
          <ol>
            <li><b>白色十字</b>：把四個白色邊塊轉到白色中心旁邊，側面顏色也要對上側面中心。</li>
            <li><b>白色角塊</b>：把四個白色角塊放回去，第一層就完成了。</li>
            <li><b>第二層邊塊</b>：把沒有黃色的邊塊從頂層放到第二層的左邊或右邊。</li>
            <li><b>黃色十字</b>：把白色那面朝下，在頂層做出黃色十字。</li>
            <li><b>黃色面</b>：把頂層四個角都轉成黃色朝上。</li>
            <li><b>頂層角塊歸位</b>：讓四個角的側面顏色對上。</li>
            <li><b>頂層邊塊歸位</b>：最後把邊塊換到正確位置，完成！</li>
          </ol>
          <p class="section-sub">每一步都有固定的「轉法口訣」，可以請老師或家人一起查「魔術方塊 新手解法」。中心塊不會動，<b>中心是什麼顏色，那一面就是什麼顏色</b>。</p>
        </details>
      </div>`}`;
  }
  const HUBS = [
    { id: 'cube', ico: '🟥', name: '魔術方塊', sub: '轉回六面同色' },
    { id: 'tangram', ico: '🔺', name: '七巧板', sub: '7 片拼出圖形' },
    { id: 'gomoku', ico: '⚫', name: '五子棋', sub: '先連成 5 顆就贏' },
    { id: 'sudoku', ico: '🔢', name: '數獨', sub: '數字不重複' },
    { id: 'slide', ico: '🔲', name: '數字華容道', sub: '滑回 1、2、3' },
    { id: 'lever', ico: '⚖️', name: '槓桿天平', sub: '科學：讓它平衡' },
    { id: 'laser', ico: '🔦', name: '雷射迷宮', sub: '光的反射打中靶心' },
    { id: 'pento', ico: '🟩', name: '五格骨牌', sub: '5 格骨牌拼滿框框' },
    { id: 'geo', ico: '📌', name: '數學釘板', sub: '橡皮筋圍圖形' },
    { id: 'marble', ico: '🎱', name: '滾珠軌道', sub: '物理：彈珠滾進杯子' }
  ];
  const SUBS = { tangram: 'PuppyTangram', gomoku: 'PuppyGomoku', sudoku: 'PuppySudoku', slide: 'PuppySlide', lever: 'PuppyLever', laser: 'PuppyLaser', pento: 'PuppyPento', geo: 'PuppyGeo', marble: 'PuppyMarble' };
  function subMod(id) { return SUBS[id] ? window[SUBS[id]] || null : null; }
  function hubHtml() {
    const list = HUBS.filter(h => h.id === 'cube' || subMod(h.id));
    if (list.length < 2) return '';
    return `<div class="pz-hub">${list.map(h => `<button class="pz-hub-btn${hub === h.id ? ' on' : ''}" data-hub="${h.id}"><span class="pz-hub-ico">${h.ico}</span><b>${h.name}</b><small>${h.sub}</small></button>`).join('')}</div>`;
  }

  function playHtml() {
    const g = game, lv = g.lv;
    const title = lv ? `${esc(lv.name)}（${esc(lv.desc)}）` : `${g.n}×${g.n} 自由練習`;
    return `
      <div class="card-box pz-play">
        <div class="pz-top">
          <b class="pz-title">${title}</b>
          <span class="pz-stat">⏱ <span id="pzTime">0 秒</span></span>
          <span class="pz-stat">🔄 <span id="pzMoves">0</span> 步</span>
          <button class="btn btn-soft pz-quit" id="pzQuit">${lv ? '放棄' : '離開'}</button>
        </div>
        <div class="pz-msg" id="pzMsg"></div>
        <div class="pz-stage" id="pzStage"><div class="pz-cube" id="pzCube"></div></div>
        <div class="pz-tools">
          <button class="btn btn-soft" id="pzLeft" title="整顆往左轉">⟲ 左轉</button>
          <button class="btn btn-soft" id="pzFlip" title="翻過來看底面">⇅ 翻面</button>
          <button class="btn btn-soft" id="pzRight" title="整顆往右轉">右轉 ⟳</button>
          <button class="btn btn-soft" id="pzUndo" title="退回上一步">↶ 退一步</button>
          ${lv ? '' : '<button class="btn btn-orange" id="pzMix">🔀 打亂</button><button class="btn btn-soft" id="pzReset">✨ 還原</button>'}
        </div>
        <p class="section-sub pz-tip">👆 <b>拖方塊上的色塊</b>：轉那一層　｜　👆 <b>拖方塊旁邊的空白處</b>：轉整顆方塊看其他面</p>
        <div class="pz-result" id="pzResult" hidden></div>
      </div>`;
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    return sec >= 60 ? `${Math.floor(sec / 60)} 分 ${sec % 60} 秒` : `${sec} 秒`;
  }

  function render() {
    if (!pane) return;
    stopDrag();
    document.body.classList.toggle('pz-playing', (view === 'play' && !!game) || (view === 'sub' && !!sub));   // 手機上玩的時候先收起狗狗那一欄
    if (view === 'sub' && sub) {
      sub.render();
    } else if (view === 'play' && game) {
      pane.innerHTML = playHtml();
      buildScene();
      bindPlay();
      paintStats();
      if (game.solved && game.result) showResult();
    } else {
      view = 'home';
      els = null;
      pane.innerHTML = homeHtml();
      pane.querySelectorAll('[data-lv]').forEach(b => b.addEventListener('click', () => startLevel(b.dataset.lv)));
      pane.querySelectorAll('[data-practice]').forEach(b => b.addEventListener('click', () => startPractice(+b.dataset.practice)));
      pane.querySelectorAll('[data-hub]').forEach(b => b.addEventListener('click', () => {
        hub = b.dataset.hub;
        try { localStorage.setItem('puppy_puzzle_hub', hub); } catch (e) { /* 忽略 */ }
        render();
      }));
      const sh = pane.querySelector('#pzSubHome'), m = subMod(hub);
      if (sh && m) m.home(sh);
    }
    try { if (api && api.focus) api.focus(); } catch (e) { /* 忽略 */ }
  }

  // ── 3D 場景 ──
  function buildScene() {
    const stage = pane.querySelector('#pzStage'), cubeEl = pane.querySelector('#pzCube');
    if (!stage || !cubeEl) return;
    const size = cubeSizePx(), n = game.n, s = size / n, h = s / 2;
    stage.style.height = Math.round(size * 1.75) + 'px';
    stage.style.perspective = Math.round(size * 4.2) + 'px';
    const cubieEls = game.cube.cubies.map((c, ci) => {
      const el = document.createElement('div');
      el.className = 'pz-cubie';
      el.style.width = el.style.height = s + 'px';
      el.style.left = el.style.top = (-h) + 'px';
      el.innerHTML = FACES.map((f, i) => {
        const tf = `${FACE_TF[i]} translateZ(${h}px)`;
        return c.col[i] >= 0
          ? `<div class="pz-face" style="transform:${tf}"><div class="pz-st" data-c="${ci}" data-f="${i}" style="background:${COLORS[c.col[i]]}"></div></div>`
          : `<div class="pz-face" style="transform:${tf}"></div>`;
      }).join('');
      cubeEl.appendChild(el);
      return el;
    });
    els = { stage, cube: cubeEl, cubieEls, s };
    paintView();
    paintAll();
  }
  function cubieTf(c, s) {
    const M = c.M, k = s / 2;
    return `matrix3d(${M[0][0]},${M[1][0]},${M[2][0]},0,${M[0][1]},${M[1][1]},${M[2][1]},0,${M[0][2]},${M[1][2]},${M[2][2]},0,${c.p[0] * k},${c.p[1] * k},${c.p[2] * k},1)`;
  }
  function paintAll() {
    if (!els) return;
    game.cube.cubies.forEach((c, i) => { els.cubieEls[i].style.transform = cubieTf(c, els.s); });
  }
  function paintLayer(axis, layer, deg) {
    if (!els) return;
    game.cube.cubies.forEach((c, i) => {
      if (c.p[axis] !== layer) return;
      els.cubieEls[i].style.transform = `rotate${AX[axis]}(${deg}deg) ${cubieTf(c, els.s)}`;
    });
  }
  function paintView() { if (els) els.cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; }
  function paintStats() {
    if (!pane || !game) return;
    const m = pane.querySelector('#pzMoves'); if (m) m.textContent = game.moves;
    const t = pane.querySelector('#pzTime');
    if (t) t.textContent = game.started ? fmtTime(((game.endAt || Date.now()) - game.started) / 1000) : '0 秒';
    const u = pane.querySelector('#pzUndo'); if (u) u.disabled = !game.undo.length || game.solved || game.scrambling;
  }
  function say(msg, kind) {
    const el = pane && pane.querySelector('#pzMsg');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'pz-msg' + (kind ? ' ' + kind : '');
  }

  // ── 動畫 ──
  function animate(from, to, ms, step, done) {
    if (ms <= 0 || from === to) { step(to); done(); return; }
    const t0 = performance.now();
    busy = true;
    const tick = now => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      step(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(tick);
      else { busy = false; done(); }
    };
    requestAnimationFrame(tick);
  }
  // 轉一層（含動畫），轉完更新模型
  function doTurn(axis, layer, q, fromDeg, ms, done) {
    animate(fromDeg || 0, q * 90, ms, deg => paintLayer(axis, layer, deg), () => {
      turn(game.cube, axis, layer, q);
      paintAll();
      if (done) done();
    });
  }

  // ── 開始遊戲 ──
  function newGame(lv, n) {
    game = { lv, n, cube: makeCube(n), moves: 0, undo: [], started: 0, endAt: 0, scrambling: false, solved: false, result: null };
    rx = -28; ry = -38;
    view = 'play';
    render();
    try { if (pane.getBoundingClientRect().top < 0) pane.scrollIntoView({ block: 'start' }); } catch (e) { /* 忽略 */ }
  }
  function startLevel(id) {
    const lv = BY_ID[id];
    if (!lv) return;
    newGame(lv, lv.n);
    scramble(lv.steps);
  }
  function startPractice(n) {
    newGame(null, [2, 3, 4].includes(n) ? n : 3);
    say('自由練習：隨便轉轉看，按「🔀 打亂」來挑戰自己。這裡沒有獎勵。', '');
  }
  function scramble(steps) {
    const g = game;
    const list = scrambleMoves(g.n, steps);
    g.mix = list;                                     // 記下打亂的步驟（自動測試用）
    g.moves = 0; g.undo = []; g.started = 0; g.endAt = 0; g.solved = false; g.result = null;
    const res = pane && pane.querySelector('#pzResult'); if (res) res.hidden = true;
    if (steps && steps <= SHOW_STEPS_MAX && els) {
      g.scrambling = true;
      say(`👀 看清楚！方塊要被打亂 ${steps} 步……`, 'warn');
      let i = 0;
      const next = () => {
        if (game !== g || !els) return;
        if (i >= list.length) {
          g.scrambling = false;
          if (isSolved(g.cube)) { scramble(steps); return; }      // 剛好轉回原狀：重來
          say(`換你了！把方塊轉回六面同色。小撇步：倒著轉回去！`, '');
          paintStats();
          return;
        }
        const [a, l, q] = list[i++];
        setTimeout(() => doTurn(a, l, q, 0, 420, next), 180);
      };
      paintStats();
      next();
    } else {
      list.forEach(([a, l, q]) => turn(g.cube, a, l, q));
      if (isSolved(g.cube)) { scramble(steps); return; }
      paintAll();
      say(g.lv ? '方塊打亂好了！轉回六面同色就過關。第一次轉動時開始計時。' : '打亂好了，加油！', '');
      paintStats();
    }
  }

  // 學生轉了一步之後
  function afterMove(axis, layer, q, isUndo) {
    const g = game;
    if (!g.started) g.started = Date.now();
    g.moves += 1;
    if (!isUndo) { g.undo.push([axis, layer, q]); if (g.undo.length > 200) g.undo.shift(); }
    paintStats();
    if (!isSolved(g.cube)) return;
    g.solved = true;
    g.endAt = Date.now();
    paintStats();
    const sec = Math.max(1, Math.round((g.endAt - g.started) / 1000));
    if (g.lv) {
      const r = reward(g.lv, sec, g.moves);
      g.result = Object.assign({ sec, moves: g.moves }, r);
      api.save();
      if (r.stars > 0 || r.xp > 0) api.award(r.xp, r.stars, 'puzzle', `益智挑戰：${g.lv.name}過關`);
      else if (api.petSay) api.petSay(`🎉 ${g.lv.name}過關！用了 ${fmtTime(sec)}、${g.moves} 步。`);
    } else {
      g.result = { sec, moves: g.moves, practice: true };
    }
    celebrate();
    showResult();
  }
  function celebrate() {
    if (!els) return;
    const r0 = ry;
    animate(0, 360, 900, d => { ry = r0 + d; paintView(); }, () => { ry = r0; paintView(); });
  }
  function showResult() {
    const box = pane && pane.querySelector('#pzResult');
    const g = game, r = g && g.result;
    if (!box || !r) return;
    box.hidden = false;
    box.innerHTML = `
      <div class="pz-win">🎉 六面同色，過關了！</div>
      <div class="ty-result-grid">
        <div><b>${fmtTime(r.sec)}</b><span>用時${r.newBest ? '（新紀錄！）' : ''}</span></div>
        <div><b>${r.moves}</b><span>步數</span></div>
        ${r.practice ? '' : `<div><b>${r.stars ? '+' + r.stars + '⭐' : '—'}</b><span>星星</span></div><div><b>${r.xp ? '+' + r.xp : '—'}</b><span>經驗值</span></div>`}
      </div>
      ${r.note ? `<p class="ty-note">${esc(r.note)}</p>` : ''}
      ${r.practice ? '<p class="section-sub">練習模式沒有獎勵。到「益智挑戰」選一關正式挑戰吧！</p>' : ''}
      <div class="pz-result-btns">
        <button class="btn btn-soft" id="pzHome">回到益智挑戰</button>
        ${g.lv ? '<button class="btn btn-orange" id="pzAgain">🔁 再挑戰一次</button>' : '<button class="btn btn-orange" id="pzMix2">🔀 再打亂一次</button>'}
      </div>`;
    const on = (sel, fn) => { const el = box.querySelector(sel); if (el) el.addEventListener('click', fn); };
    on('#pzHome', () => { game = null; view = 'home'; render(); });
    on('#pzAgain', () => startLevel(g.lv.id));
    on('#pzMix2', () => scramble(0));
    say('', '');
  }

  // ── 操作：按鈕 ──
  function spinView(dx, dy) {
    if (busy || !els) return;
    const r0 = rx, y0 = ry;
    animate(0, 1, 320, k => { ry = y0 + dx * k; rx = r0 + dy * k; paintView(); }, () => { ry = y0 + dx; rx = r0 + dy; paintView(); });
  }
  function bindPlay() {
    const on = (sel, fn) => { const el = pane.querySelector(sel); if (el) el.addEventListener('click', fn); };
    on('#pzQuit', () => {
      if (game && game.lv && game.moves && !game.solved && !confirm('要放棄這一關嗎？這次不會記錄。')) return;
      game = null; view = 'home'; render();
    });
    on('#pzLeft', () => spinView(-90, 0));
    on('#pzRight', () => spinView(90, 0));
    on('#pzFlip', () => spinView(0, (rx < 0 ? 28 : -28) - rx));   // 從上面看 ↔ 從下面看
    on('#pzUndo', () => {
      const g = game;
      if (busy || !g || g.solved || g.scrambling || !g.undo.length) return;
      const [a, l, q] = g.undo.pop();
      doTurn(a, l, -q, 0, 220, () => afterMove(a, l, -q, true));
    });
    on('#pzMix', () => { if (!busy && game && !game.scrambling) scramble(0); });
    on('#pzReset', () => {
      if (busy || !game || game.scrambling) return;
      game.cube = makeCube(game.n); game.moves = 0; game.undo = []; game.started = 0; game.endAt = 0; game.solved = false; game.result = null;
      render();
      say('還原好了。', '');
    });
    const stage = els && els.stage;
    if (!stage) return;
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('lostpointercapture', onUp);
  }

  // ── 操作：拖曳 ──
  // 視角矩陣（跟 .pz-cube 的 rotateX(rx) rotateY(ry) 一樣）
  function viewMatrix() {
    const a = rx * Math.PI / 180, b = ry * Math.PI / 180;
    const X = [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
    const Y = [[Math.cos(b), 0, Math.sin(b)], [0, 1, 0], [-Math.sin(b), 0, Math.cos(b)]];
    return mulMM(X, Y);
  }
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // 拖貼紙時，決定轉哪一個軸、哪一層、哪個方向
  function pickTurn(ci, fi, dx, dy) {
    const c = game.cube.cubies[ci];
    const nw = mulMV(c.M, FACES[fi]);
    const center = [0, 1, 2].map(k => c.p[k] / 2 + nw[k] * 0.5);   // 貼紙中心（單位：一個小方塊）
    const V = viewMatrix();
    const len = Math.hypot(dx, dy) || 1;
    let best = null;
    [0, 1, 2].forEach(axis => {
      if (nw[axis] !== 0) return;                       // 不能繞著貼紙朝外的方向轉
      const e = [0, 0, 0]; e[axis] = 1;
      const v = mulMV(V, cross(e, center));            // 轉動時貼紙在螢幕上的移動方向
      const vl = Math.hypot(v[0], v[1]);
      if (vl < 1e-6) return;
      const dot = (dx * v[0] + dy * v[1]) / (vl * len);
      if (!best || Math.abs(dot) > Math.abs(best.dot)) best = { axis, layer: c.p[axis], dot, vx: v[0] / vl, vy: v[1] / vl, vl };
    });
    return best;
  }
  function onDown(ev) {
    if (drag || busy || !game || game.scrambling) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    const st = ev.target.closest && ev.target.closest('.pz-st');
    drag = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, mode: st && !game.solved ? 'sticker' : 'view', ci: st ? +st.dataset.c : -1, fi: st ? +st.dataset.f : -1, rx0: rx, ry0: ry, turn: null, deg: 0 };
    try { els.stage.setPointerCapture(ev.pointerId); } catch (e) { /* 忽略 */ }
    ev.preventDefault();
  }
  function onMove(ev) {
    if (!drag || ev.pointerId !== drag.id || !els) return;
    const dx = ev.clientX - drag.x0, dy = ev.clientY - drag.y0;
    if (drag.mode === 'view') {
      ry = drag.ry0 + dx * 0.5;
      rx = Math.max(-90, Math.min(90, drag.rx0 - dy * 0.5));
      paintView();
      return;
    }
    if (!drag.turn) {
      if (Math.hypot(dx, dy) < 8) return;
      drag.turn = pickTurn(drag.ci, drag.fi, dx, dy);
      if (!drag.turn) { drag.mode = 'view'; return; }
    }
    const t = drag.turn;
    const px = Math.max(t.vl, 0.7) * els.s;            // 轉 1 弧度大約要拖多少像素
    // 斜斜拖（例如在斜看的頂面上直直往下拖）時，拖的方向跟轉動方向不太一致，放大一點才不會「拖了沒反應」
    const boost = 1 / Math.max(Math.abs(t.dot), 0.5);
    drag.deg = Math.max(-200, Math.min(200, (dx * t.vx + dy * t.vy) * boost / px * 180 / Math.PI));
    paintLayer(t.axis, t.layer, drag.deg);
  }
  function onUp(ev) {
    if (!drag || (ev && ev.pointerId !== undefined && ev.pointerId !== drag.id)) return;
    const d = drag;
    drag = null;
    try { els && els.stage.releasePointerCapture(d.id); } catch (e) { /* 忽略 */ }
    if (d.mode !== 'sticker' || !d.turn || !game) return;
    const a = Math.abs(d.deg);
    const q = (a < 28 ? 0 : a < 135 ? 1 : 2) * (d.deg < 0 ? -1 : 1);   // 轉超過 28 度就算一步，放開自動對齊
    const t = d.turn;
    if (!q) { animate(d.deg, 0, 120, deg => paintLayer(t.axis, t.layer, deg), () => paintAll()); return; }
    const from = d.deg;
    animate(from, q * 90, 140, deg => paintLayer(t.axis, t.layer, deg), () => {
      turn(game.cube, t.axis, t.layer, q);
      paintAll();
      afterMove(t.axis, t.layer, q, false);
    });
  }
  function stopDrag() { drag = null; }

  const ctx = {
    get pane() { return pane; },
    esc, fmtTime,
    // 過關：照關卡（id、name、stars、xp、per）算獎勵、存檔、給星星，回傳結果
    grant(lv, sec, moves) {
      const r = reward(lv, sec, moves);
      api.save();
      if (r.stars > 0 || r.xp > 0) api.award(r.xp, r.stars, 'puzzle', `益智挑戰：${lv.name}`);
      else if (api.petSay) api.petSay(`🎉 ${lv.name}過關！`);
      return r;
    },
    dayLeft(lv) { const d = today(); return Math.max(0, lv.per - ((d.wins && d.wins[lv.id]) || 0)); },
    wins(id) { return data().wins[id] || 0; },
    best(id) { return data().best[id] || 0; },
    enter(mod) {
      sub = mod; view = 'sub';
      document.body.classList.add('pz-playing');
      try { if (pane.getBoundingClientRect().top < 0) pane.scrollIntoView({ block: 'start' }); } catch (e) { /* 忽略 */ }
    },
    back() { sub = null; view = 'home'; render(); },
    focus() { try { if (api && api.focus) api.focus(); } catch (e) { /* 忽略 */ } },
    petSay(msg) { try { if (api && api.petSay) api.petSay(msg); } catch (e) { /* 忽略 */ } }
  };

  window.PuppyPuzzle = {
    isPlaying() { return (view === 'play' && !!game && !game.solved) || (view === 'sub' && !!sub && !!sub.isPlaying()); },
    mount(el, hooks) {
      pane = el; api = hooks;
      Object.keys(SUBS).forEach(k => { const m = subMod(k); if (m && m.attach) m.attach(ctx); });
      if (!ticker) ticker = setInterval(() => { if (view === 'play' && game && game.started && !game.solved && pane && pane.getClientRects().length) paintStats(); }, 500);
      window.addEventListener('resize', () => {
        clearTimeout(resizeT);
        resizeT = setTimeout(() => { if (view === 'play' && game && pane && pane.getClientRects().length && !busy && !drag) { const res = game.result; render(); if (res) showResult(); } }, 200);
      });
    },
    show() { render(); },
    hide() { stopDrag(); if (sub && sub.hide) sub.hide(); document.body.classList.remove('pz-playing'); },
    LEVELS,
    ctx,
    _t: { setHub: h => { hub = h; }, sub: () => sub, makeCube, turn, isSolved, scrambleMoves, reward, data, today, BY_ID, DAY_XP_CAP, pickTurn, startLevel, startPractice, game: () => game, view: () => view, afterMove, rotM, faceIndex, mulMV, setView: (x, y) => { rx = x; ry = y; paintView(); } }
  };
})();
