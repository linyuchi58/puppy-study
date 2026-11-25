// 《汪汪小精靈 學習小伙伴》網頁版 —— 🎡 連續學習轉盤（v3.13.0）
//
// 老師 2026-11-25 決定（方式 A，不違反「不做抽獎、隨機獎勵」的原則）：
//   ‧ 昨天有學習，今天第一次完成學習活動時，轉盤從上面掉下來（一天一次）。
//   ‧ 獎勵固定、看得到：連續 N 天 → +N⭐（最多 +7⭐），每個人都一樣，只靠努力。
//   ‧ 轉盤只決定「狗狗的驚喜表演」，每一格價值都一樣，只是好玩。
(function () {
  'use strict';
  const PRIZES = [
    ['flip', '🤸', '翻跟斗', '#f7a6b8'],
    ['sing', '🎵', '唱一首歌', '#fbcf9c'],
    ['joke', '😂', '冷笑話', '#fbe78f'],
    ['party', '🎈', '彩帶派對', '#b9e4a8'],
    ['card', '💌', '寫小卡片', '#a9d6f2'],
    ['bone', '🦴', '啃骨頭', '#d4ccf5'],
    ['bubble', '🫧', '泡泡派對', '#f6c6e7'],
    ['firework', '✨', '煙火秀', '#c6e9e3']
  ];
  const JOKES = [
    ['什麼東西越洗越髒？', '水！💧'],
    ['什麼門永遠關不上？', '足球門！⚽'],
    ['小明的爸爸有三個兒子：大毛、二毛，第三個叫什麼？', '小明！😆'],
    ['什麼布剪不斷？', '瀑布！🌊'],
    ['什麼蛋不能吃？', '笨蛋！🥚（壞蛋也不行）'],
    ['一年中哪一個月有 28 天？', '每一個月都有 28 天！📅'],
    ['什麼東西明明是你的，別人卻用得比你多？', '你的名字！📛'],
    ['小狗為什麼不會用電腦？', '因為牠一直在追滑鼠！🐭'],
    ['鉛筆和橡皮擦吵架，誰贏了？', '橡皮擦，因為它會把錯誤擦掉！✏️'],
    ['什麼東西有頭沒有腳？', '枕頭和磚頭！🧱']
  ];
  const STAR_MAX = 7;
  const TEST = /[?&](selftest|apptest)=1/.test(location.search);
  let H = null, ov = null, fx = null, spinning = false;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const starsFor = n => Math.max(1, Math.min(STAR_MAX, n | 0));

  function wheelSvg() {
    const N = PRIZES.length, R = 140, C = 150;
    let s = `<svg class="wh-wheel" viewBox="0 0 300 300" aria-hidden="true"><g class="wh-rot">`;
    PRIZES.forEach(([, icon, name, col], i) => {
      const a0 = (i / N) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / N) * Math.PI * 2 - Math.PI / 2;
      const x0 = C + R * Math.cos(a0), y0 = C + R * Math.sin(a0), x1 = C + R * Math.cos(a1), y1 = C + R * Math.sin(a1);
      s += `<path d="M${C},${C} L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${col}" stroke="#fff" stroke-width="3"/>`;
      const am = (a0 + a1) / 2, deg = am * 180 / Math.PI + 90;
      const tx = C + R * 0.66 * Math.cos(am), ty = C + R * 0.66 * Math.sin(am);
      s += `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) rotate(${deg.toFixed(1)})"><text y="-6" text-anchor="middle" font-size="26">${icon}</text><text y="18" text-anchor="middle" font-size="13" font-weight="900" fill="#4a3b32">${esc(name)}</text></g>`;
    });
    s += `</g><circle cx="${C}" cy="${C}" r="26" fill="#fff" stroke="#e3d6c3" stroke-width="4"/><text x="${C}" y="${C + 9}" text-anchor="middle" font-size="26">${esc(H.petIcon())}</text></svg>`;
    return s;
  }

  // 轉盤掉下來
  function show(n, onDone) {
    if (!H || ov) return false;
    const stars = starsFor(n);
    ov = document.createElement('div');
    ov.className = 'wh-ov';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = `<div class="wh-panel">
      <div class="wh-title">🔥 連續學習 <b>${n}</b> 天！</div>
      <div class="wh-sub">轉轉看，${esc(H.petName())}要給你什麼驚喜表演？</div>
      <div class="wh-box"><div class="wh-pin">▼</div>${wheelSvg()}</div>
      <button class="wh-go" type="button">🎡 轉！</button>
      <div class="wh-note">每一格都一樣棒！連續學習的獎勵是固定的：連續 ${n} 天 → <b>+${stars}⭐</b>（最多 +${STAR_MAX}⭐）</div>
      <div class="wh-result" hidden></div>
    </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    const go = ov.querySelector('.wh-go');
    go.onclick = () => spin(n, stars, onDone);
    try { go.focus(); } catch (e) { /* 忽略 */ }
    return true;
  }

  function spin(n, stars, onDone) {
    if (spinning) return;
    spinning = true;
    const go = ov.querySelector('.wh-go');
    go.disabled = true; go.textContent = '轉呀轉…';
    const N = PRIZES.length;
    const idx = Math.floor(Math.random() * N);        // 只決定表演，價值都一樣
    const seg = 360 / N;
    const target = 360 * 5 + (360 - (idx * seg + seg / 2)) + (Math.random() - 0.5) * seg * 0.6;
    const rot = ov.querySelector('.wh-rot');
    rot.style.transition = `transform ${TEST ? 0.05 : 4.2}s cubic-bezier(.15,.85,.2,1)`;
    rot.style.transform = `rotate(${target}deg)`;
    tick(TEST ? 0 : 4200);
    setTimeout(() => reveal(idx, n, stars, onDone), TEST ? 80 : 4400);
  }
  // 轉的時候「喀喀喀」越來越慢
  function tick(total) {
    if (!total) return;
    let t = 0, gap = 60;
    const step = () => { if (t > total - 300 || !ov) return; click(); t += gap; gap *= 1.09; setTimeout(step, gap); };
    step();
  }
  let ac = null;
  function audio() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); return ac; } catch (e) { return null; } }
  function beep(freq, dur, when, type, vol) {
    const a = audio(); if (!a) return;
    try {
      const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + (when || 0);
      o.type = type || 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.08, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (e) { /* 忽略 */ }
  }
  function click() { beep(900, 0.03, 0, 'square', 0.03); }
  function song() {   // 小星星前兩句
    const N = { C: 523, D: 587, E: 659, F: 698, G: 784, A: 880 };
    'C C G G A A G - F F E E D D C'.split(' ').forEach((k, i) => { if (N[k]) beep(N[k], 0.32, i * 0.36, 'triangle', 0.09); });
  }

  function reveal(idx, n, stars, onDone) {
    spinning = false;
    if (!ov) return;
    const [id, icon, name] = PRIZES[idx];
    const box = ov.querySelector('.wh-result');
    ov.querySelector('.wh-go').hidden = true;
    let body = '';
    const pn = H.petName();
    if (id === 'flip') { body = `${pn}表演翻跟斗！咚～咕嚕咕嚕～🤸`; H.dog('flip'); }
    else if (id === 'sing') { body = `${pn}唱〈小星星〉給你聽 🎵 一閃一閃亮晶晶～`; song(); H.dog('sing'); }
    else if (id === 'joke') { const j = JOKES[Math.floor(Math.random() * JOKES.length)]; body = `<b>${esc(j[0])}</b><br><span class="wh-ans">${esc(j[1])}</span>`; H.dog('fun'); }
    else if (id === 'party') { body = '彩帶派對！謝謝你每天都來學習 🎉'; effect('confetti'); H.dog('fun'); }
    else if (id === 'card') { body = `<div class="wh-card">親愛的小主人：<br>你已經連續學習 <b>${n}</b> 天了！<br>每天一點點，就會變得很厲害。<br>我最喜歡跟你一起學習了 💛<br><span>—— ${esc(pn)}</span></div>`; H.dog('pat'); }
    else if (id === 'bone') { body = `${pn}開心地啃骨頭！（飽足感 +15）🦴`; H.feed(); H.dog('pat'); }
    else if (id === 'bubble') { body = '泡泡派對！啵～啵～啵～ 🫧'; effect('bubbles'); H.dog('fun'); }
    else { body = '煙火秀！為連續學習的你放煙火 ✨'; effect('fireworks'); H.dog('fun'); }
    box.innerHTML = `<div class="wh-prize">${icon} ${esc(name)}</div><div class="wh-say">${body}</div>
      <div class="wh-get">🔥 連續學習 ${n} 天獎勵：<b>+${stars}⭐</b></div>
      <button class="wh-ok" type="button">收下 ⭐</button>`;
    box.hidden = false;
    const ok = box.querySelector('.wh-ok');
    ok.onclick = () => { close(); if (onDone) onDone(id); };
    try { ok.focus(); } catch (e) { /* 忽略 */ }
  }

  function close() {
    if (ov) { ov.remove(); ov = null; }
    spinning = false;
  }

  // ── 特效：彩帶、泡泡、煙火（畫在最上層，幾秒後自己消失）──
  function effect(kind) {
    if (fx) fx.remove();
    const cv = document.createElement('canvas');
    cv.className = 'wh-fx';
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    document.body.appendChild(cv);
    fx = cv;
    const ctx = cv.getContext('2d'), W = cv.width, Hh = cv.height;
    const cols = ['#f7a6b8', '#fbcf9c', '#fbe78f', '#b9e4a8', '#a9d6f2', '#d4ccf5', '#e5534b', '#2fa86b'];
    const ps = [];
    const add = (x, y, vx, vy, extra) => ps.push(Object.assign({ x, y, vx, vy, c: cols[ps.length % cols.length], life: 1 }, extra || {}));
    if (kind === 'confetti') for (let i = 0; i < 160; i++) add(Math.random() * W, -20 - Math.random() * Hh * 0.5, (Math.random() - 0.5) * 2, 2 + Math.random() * 3, { r: Math.random() * 6, w: 6 + Math.random() * 6 });
    if (kind === 'bubbles') for (let i = 0; i < 40; i++) add(Math.random() * W, Hh + Math.random() * 200, (Math.random() - 0.5) * 0.6, -1 - Math.random() * 1.6, { rad: 10 + Math.random() * 26 });
    let bursts = kind === 'fireworks' ? 6 : 0, nextBurst = 0;
    const t0 = performance.now(), DUR = TEST ? 200 : 4200;
    const frame = now => {
      if (fx !== cv) return;
      const t = now - t0;
      ctx.clearRect(0, 0, W, Hh);
      if (bursts > 0 && t > nextBurst) {
        bursts--; nextBurst = t + 450;
        const bx = W * (0.2 + Math.random() * 0.6), by = Hh * (0.15 + Math.random() * 0.35);
        for (let i = 0; i < 50; i++) { const a = i / 50 * Math.PI * 2, sp = 2 + Math.random() * 3; add(bx, by, Math.cos(a) * sp, Math.sin(a) * sp, { spark: 1 }); }
        beep(300 + Math.random() * 200, 0.25, 0, 'sine', 0.05);
      }
      ps.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.spark) { p.vy += 0.05; p.life -= 0.012; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill(); }
        else if (p.rad) { ctx.globalAlpha = 0.7; ctx.strokeStyle = p.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.rad, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(p.x - p.rad * 0.35, p.y - p.rad * 0.35, p.rad * 0.25, 0, 7); ctx.fill(); }
        else { p.r += 0.1; ctx.globalAlpha = 1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -3, p.w, 6); ctx.restore(); }
      });
      ctx.globalAlpha = 1;
      if (t < DUR) requestAnimationFrame(frame); else { cv.remove(); if (fx === cv) fx = null; }
    };
    requestAnimationFrame(frame);
  }

  window.PuppyWheel = {
    mount(hooks) { H = hooks; },
    show, close, isOpen: () => !!ov,
    PRIZES, starsFor, STAR_MAX, _effect: effect
  };
})();
