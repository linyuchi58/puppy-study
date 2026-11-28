// -*- coding: utf-8 -*-
// 《汪汪小精靈 學習小伙伴》網頁版 —— ⚔️ 雙人同機對戰（v3.26.0）
// 一台平板放桌上，兩個同學面對面：畫面分成上下兩半，上半部倒過來給對面的人看。
// 同一題同時出現在兩邊，四選一，先答對的得 1 分；答錯的那一邊停 1.5 秒（避免亂按）。一場 10 題。
// 不用網路、不用帳號。獎勵給「這台裝置的主人」參加獎（贏輸一樣），每天最多 3 場有獎勵。
// 存檔：state.duel = { days: { 'YYYY-MM-DD': { n: 場數, r: 有獎勵的場數 } }, games: 總場數 }
(function () {
  'use strict';

  const ROUND = 10;
  const LOCK_MS = 1500;          // 答錯停多久
  const NEXT_MS = 1300;          // 公布答案後多久換下一題
  const REWARD_PER_DAY = 3;
  const REWARD_XP = 5, REWARD_STARS = 1;
  const MIN_OK = 5;              // 這一場至少要答對 5 題（兩人加起來）才算數，避免亂按刷獎勵

  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function todayStr() { const d = new Date(); const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }

  // ── 出題 ──
  // 心算：三種難度；選項＝正確答案＋3 個接近的錯誤答案（不重複、不是負的）
  const MATH_LV = {
    low: { name: '低年級', desc: '20 以內加減' },
    mid: { name: '中年級', desc: '100 以內加減、九九乘法' },
    high: { name: '高年級', desc: '兩位數乘一位數、除法、四則' }
  };
  function mathQ(lv) {
    let q, a;
    const t = R(0, lv === 'low' ? 1 : 3);
    if (lv === 'low') {
      if (t === 0) { const x = R(1, 10), y = R(1, 10); q = `${x} ＋ ${y}`; a = x + y; } else { const x = R(5, 20), y = R(1, x); q = `${x} － ${y}`; a = x - y; }
    } else if (lv === 'mid') {
      if (t === 0) { const x = R(10, 89), y = R(2, 99 - x); q = `${x} ＋ ${y}`; a = x + y; }
      else if (t === 1) { const x = R(20, 99), y = R(2, x - 1); q = `${x} － ${y}`; a = x - y; }
      else { const x = R(2, 9), y = R(2, 9); q = `${x} × ${y}`; a = x * y; }
    } else {
      if (t === 0) { const x = R(12, 99), y = R(2, 9); q = `${x} × ${y}`; a = x * y; }
      else if (t === 1) { const y = R(2, 9), a0 = R(3, 12); q = `${a0 * y} ÷ ${y}`; a = a0; }
      else if (t === 2) { const x = R(2, 9), y = R(2, 9), z = R(1, 20); q = `${x} × ${y} ＋ ${z}`; a = x * y + z; }
      else { const y = R(2, 9), z = R(2, 5), x = y * z + R(1, 40); q = `${x} － ${y} × ${z}`; a = x - y * z; }
    }
    const opts = new Set([a]);
    const near = [1, 2, 10, 3, 5, 9, 11];
    for (let i = 0; opts.size < 4 && i < 60; i++) {
      const d = near[R(0, near.length - 1)] * (Math.random() < 0.5 ? -1 : 1);
      if (a + d >= 0) opts.add(a + d);
    }
    for (let k = 1; opts.size < 4; k++) opts.add(a + k + 3);
    const choices = shuffle([...opts].map(String));
    return { q: q + ' ＝ ？', choices, ans: choices.indexOf(String(a)) };
  }
  // 英語：給英文單字，選中文意思（字從 app.js 給，已經學過的字優先）
  function engQs(n) {
    const pool = (H && H.vocabPool) ? H.vocabPool() : [];
    if (pool.length < 4) return null;
    const words = shuffle(pool).slice(0, n);
    return words.map(w => {
      const used = new Set([w.z]);
      const wrong = shuffle(pool.filter(x => x.w !== w.w)).filter(x => { if (used.has(x.z)) return false; used.add(x.z); return true; }).slice(0, 3);
      const choices = shuffle([w.z].concat(wrong.map(x => x.z)));
      return { q: w.w, choices, ans: choices.indexOf(w.z), en: true };
    });
  }
  function makeQs(subj, lv) {
    if (subj === 'eng') return engQs(ROUND);
    const out = [], seen = new Set();
    for (let i = 0; out.length < ROUND && i < 300; i++) { const q = mathQ(lv); if (!seen.has(q.q)) { seen.add(q.q); out.push(q); } }
    return out;
  }

  // ── 狀態 ──
  let H = null, box = null, game = null, timer = 0;
  const opt = { subj: 'math', lv: 'mid' };
  try { const o = JSON.parse(localStorage.getItem('puppy_duel_opt') || '{}'); if (o.subj) opt.subj = o.subj; if (MATH_LV[o.lv]) opt.lv = o.lv; } catch (e) { /* 忽略 */ }

  function data() {
    const st = H.getState();
    if (!st.duel || typeof st.duel !== 'object' || Array.isArray(st.duel)) st.duel = {};
    if (!st.duel.days || typeof st.duel.days !== 'object') st.duel.days = {};
    Object.keys(st.duel.days).sort().slice(0, -30).forEach(k => { delete st.duel.days[k]; });
    return st.duel;
  }
  function todayRec() { const d = data(), t = todayStr(); if (!d.days[t]) d.days[t] = { n: 0, r: 0 }; return d.days[t]; }
  function rewardsLeft() { const t = data().days[todayStr()]; return Math.max(0, REWARD_PER_DAY - ((t && t.r) || 0)); }

  function start(subj, lv) {
    const qs = makeQs(subj, lv);
    if (!qs || qs.length < ROUND) { if (H.petSay) H.petSay('英語單字還不夠多，先去「英語闖關」學幾關，或改玩心算對戰吧！', 'normal'); return false; }
    game = { subj, lv, qs, i: 0, score: [0, 0], lock: [0, 0], done: false, winner: -1, picked: [-1, -1], ok: 0, started: Date.now() };
    open();
    paint();
    return true;
  }

  function open() {
    if (!box) {
      box = document.createElement('div');
      box.id = 'duelBox';
      box.className = 'du-box';
      document.body.appendChild(box);
      // 用 pointerdown：兩個人同時按也都收得到（不用等 click）
      box.addEventListener('pointerdown', ev => {
        const b = ev.target.closest('[data-du]');
        if (!b) return;
        ev.preventDefault();
        const [p, k] = b.dataset.du.split(':');
        if (p === 'x') return act(k);
        answer(+p, +k);
      });
    }
    box.hidden = false;
    document.body.classList.add('du-on');
  }
  function close() {
    clearTimeout(timer); timer = 0;
    game = null;
    if (box) { box.hidden = true; box.innerHTML = ''; }
    document.body.classList.remove('du-on');
    if (H && H.refresh) H.refresh();
  }

  function answer(p, k) {
    if (!game || game.done || game.winner >= 0) return 'ignored';
    if (p !== 0 && p !== 1) return 'ignored';
    if (Date.now() < game.lock[p]) return 'locked';
    const q = game.qs[game.i];
    game.picked[p] = k;
    if (k === q.ans) {
      game.winner = p;
      game.score[p] += 1;
      game.ok += 1;
      paint();
      timer = setTimeout(next, NEXT_MS);
      return 'ok';
    }
    game.lock[p] = Date.now() + LOCK_MS;
    // 兩個人都答錯了：公布答案，換下一題
    if (game.picked[0] >= 0 && game.picked[1] >= 0 && game.picked[0] !== q.ans && game.picked[1] !== q.ans) {
      game.winner = 2;
      paint();
      timer = setTimeout(next, NEXT_MS + 400);
      return 'wrong';
    }
    paint();
    setTimeout(() => { if (game && game.winner < 0) paint(); }, LOCK_MS + 30);
    return 'wrong';
  }
  function next() {
    timer = 0;
    if (!game) return;
    game.i += 1;
    game.winner = -1; game.picked = [-1, -1]; game.lock = [0, 0];
    if (game.i >= game.qs.length) return finish();
    paint();
  }
  function finish() {
    game.done = true;
    const rec = todayRec();
    rec.n += 1;
    const d = data();
    d.games = (d.games || 0) + 1;
    let got = false;
    if (game.ok >= MIN_OK && rec.r < REWARD_PER_DAY) { rec.r += 1; got = true; }
    game.reward = got;
    H.save();
    if (got) H.award(REWARD_XP, REWARD_STARS, 'duel', '⚔️ 雙人對戰完成（參加獎）');
    paint();
  }
  function act(k) {
    if (k === 'quit') { if (!game || game.done || confirm('要結束這一場對戰嗎？這一場不會記錄。')) close(); return; }
    if (k === 'again' && game) { const s = game.subj, l = game.lv; start(s, l); }
  }

  // ── 畫面 ──
  function half(p) {
    const q = game.qs[game.i];
    const locked = Date.now() < game.lock[p] && game.winner < 0;
    const show = game.winner >= 0;
    const btns = q.choices.map((c, k) => {
      let cls = 'du-ch';
      if (show && k === q.ans) cls += ' right';
      else if (game.picked[p] === k && k !== q.ans) cls += ' bad';
      return `<button type="button" class="${cls}" data-du="${p}:${k}" ${locked || show ? 'aria-disabled="true"' : ''}>${esc(c)}</button>`;
    }).join('');
    let msg = '';
    if (game.winner === p) msg = '🎉 你先答對了！+1';
    else if (game.winner === 1 - p) msg = '對方先答對了，下一題加油！';
    else if (game.winner === 2) msg = '兩個人都沒答對，答案是綠色那個';
    else if (locked) msg = '❌ 答錯了，等一下下…';
    return `<div class="du-half p${p}${locked ? ' locked' : ''}">
      <div class="du-score"><span>${p === 0 ? '🔵 藍隊' : '🟠 橘隊'}</span><b>${game.score[p]}</b><span class="du-qn">第 ${game.i + 1}／${game.qs.length} 題</span></div>
      <div class="du-q${q.en ? ' en' : ''}">${esc(q.q)}</div>
      <div class="du-chs">${btns}</div>
      <div class="du-msg">${msg}</div>
    </div>`;
  }
  function track() {
    // 中間的跑道：兩隻狗狗依分數往前跑
    const pos = p => Math.round(game.score[p] / game.qs.length * 100);
    return `<div class="du-mid">
      <div class="du-lane"><span class="du-dog d1" style="left:calc(${pos(1)}% - ${pos(1) * 0.3}px)">🐕</span></div>
      <button type="button" class="du-quit" data-du="x:quit">✕ 結束</button>
      <div class="du-lane"><span class="du-dog d0" style="left:calc(${pos(0)}% - ${pos(0) * 0.3}px)">🐕</span></div>
    </div>`;
  }
  function resultHtml() {
    const [a, b] = game.score;
    const win = a === b ? '平手！兩個人一樣厲害 🤝' : (a > b ? '🔵 藍隊贏了！' : '🟠 橘隊贏了！');
    const left = rewardsLeft();
    let rw;
    if (game.reward) rw = `🎁 參加獎：+${REWARD_XP} 經驗值、+${REWARD_STARS}⭐（今天還有 ${left} 場有參加獎）`;
    else if (game.ok < MIN_OK) rw = `這一場答對的題目太少（兩人加起來要 ${MIN_OK} 題以上）才有參加獎，要認真想喔！`;
    else rw = `今天的 ${REWARD_PER_DAY} 場參加獎已經拿完了，還是可以繼續玩！`;
    const card = flip => `<div class="du-res${flip ? ' flip' : ''}"><div class="du-res-big">${win}</div>
      <div class="du-res-score"><span>🔵 ${a}</span><span>：</span><span>🟠 ${b}</span></div>
      <p>${rw}</p>
      <div class="du-res-btns"><button type="button" class="btn btn-orange" data-du="x:again">🔁 再玩一場</button><button type="button" class="btn btn-soft" data-du="x:quit">回到「今天」</button></div></div>`;
    return `<div class="du-half p1 res">${card(true)}</div><div class="du-mid res"></div><div class="du-half p0 res">${card(false)}</div>`;
  }
  function paint() {
    if (!box || !game) return;
    box.innerHTML = game.done ? resultHtml() : half(1) + track() + half(0);
  }

  // 「今天」分頁上的卡片
  function cardHtml() {
    const left = rewardsLeft();
    const t = data().days[todayStr()];
    return `
      <div class="card-box td-card du-card">
        <div class="section-title"><span>⚔️ 雙人對戰（同一台平板）</span><span class="td-pill">今天玩了 ${(t && t.n) || 0} 場</span></div>
        <p class="section-sub">平板平放在桌上，兩個人面對面坐：上半部是對面同學的（字會倒過來），下半部是你的。同一題先答對得 1 分，答錯要停一下。一場 ${ROUND} 題。<br>
          參加就有獎勵（輸贏一樣）：+${REWARD_XP} 經驗值、+${REWARD_STARS}⭐，每天 ${REWARD_PER_DAY} 場（今天還有 ${left} 場）。</p>
        <div class="du-opts">
          <span class="du-opt-l">科目</span>
          <button type="button" class="chip-btn${opt.subj === 'math' ? ' pp-on' : ''}" data-duo="subj:math">🧮 心算</button>
          <button type="button" class="chip-btn${opt.subj === 'eng' ? ' pp-on' : ''}" data-duo="subj:eng">🦉 英語單字</button>
        </div>
        ${opt.subj === 'math' ? `<div class="du-opts"><span class="du-opt-l">難度</span>${Object.keys(MATH_LV).map(k => `<button type="button" class="chip-btn${opt.lv === k ? ' pp-on' : ''}" data-duo="lv:${k}">${MATH_LV[k].name}<small>${MATH_LV[k].desc}</small></button>`).join('')}</div>`
          : '<p class="section-sub" style="margin:4px 0;">英語：看英文單字，選中文意思（先用你學過的字）。</p>'}
        <button type="button" class="btn btn-orange du-go" id="duGo">⚔️ 開始對戰</button>
      </div>`;
  }
  function bindCard(root, rerender) {
    root.querySelectorAll('[data-duo]').forEach(b => b.addEventListener('click', () => {
      const [k, v] = b.dataset.duo.split(':');
      opt[k] = v;
      try { localStorage.setItem('puppy_duel_opt', JSON.stringify(opt)); } catch (e) { /* 忽略 */ }
      rerender();
    }));
    const go = root.querySelector('#duGo');
    if (go) go.addEventListener('click', () => start(opt.subj, opt.lv));
  }

  window.PuppyDuel = {
    mount(hooks) { H = hooks; },
    cardHtml, bindCard,
    isOpen() { return !!game; },
    start, close,
    _t: { mathQ, engQs, makeQs, answer, next, finish, game: () => game, data, rewardsLeft, ROUND, MIN_OK, REWARD_PER_DAY, LOCK_MS, setLockMs: () => {} }
  };
})();
