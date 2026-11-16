// 《汪汪小精靈 學習小伙伴》英打練習（v3.5.0 試玩版：26 個字母）
//
// 設計重點（給接手的人）：
//   ‧ 對象：國小四年級起。重點是「正確的手指」和「正確率」，速度只當參考。
//   ‧ 畫面：要打的字 → 虛擬鍵盤（下一個鍵發亮，每根手指負責的鍵同一個顏色）→ 虛擬雙手（該用的手指發亮）。
//   ‧ 打錯不會往前跳，要打對才繼續（TypingClub 的做法）。
//   ‧ 一次加一兩個新鍵（Keybr 的做法）；「加強練習」會自動多出最常打錯的鍵。
//   ‧ 顏色帶（偏寬鬆）：🟢 穩定練習、🟡 錯誤比較多或休息中、🔴 偵測到亂按或一直按住。
//     只有亂按會變紅；認真但打得慢的學生不會被誤判。亂按那一段不算分，一關裡亂按兩次就沒有星星。
//   ‧ 練習紀錄只存在這台裝置（state.typing），不上傳。
//   ‧ 和 app.js 的接點只有 window.PuppyTyping.mount(pane, api)，api 由 app.js 提供。
(function () {
  'use strict';

  // ── 鍵盤與手指 ──────────────────────────────────────────────
  // 手指代號：L5 左小指、L4 左無名指、L3 左中指、L2 左食指、T 大拇指、R2 右食指…R5 右小指
  const FINGER_OF = {};
  const FINGER_KEYS = {
    L5: '`1qaz', L4: '2wsx', L3: '3edc', L2: '45rtfgvb',
    R2: '67yuhjnm', R3: '8ik,', R4: '9ol.', R5: "0-=p[]\\;'/", T: ' '
  };
  Object.keys(FINGER_KEYS).forEach(f => { FINGER_KEYS[f].split('').forEach(k => { FINGER_OF[k] = f; }); });
  const FINGER_NAME = {
    L5: '左手小指', L4: '左手無名指', L3: '左手中指', L2: '左手食指', T: '大拇指',
    R2: '右手食指', R3: '右手中指', R4: '右手無名指', R5: '右手小指'
  };
  // 每根手指的顏色（左右對稱，食指左綠右藍，大拇指紫）
  const FINGER_COLOR = {
    L5: '#f7b6c8', L4: '#fbcf9c', L3: '#fbe78f', L2: '#b9e4a8', T: '#d4ccf5',
    R2: '#a9d6f2', R3: '#fbe78f', R4: '#fbcf9c', R5: '#f7b6c8'
  };
  const ROWS = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
    ['ShiftL', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'ShiftR'],
    [' ']
  ];
  const WIDE = { Backspace: 2, Tab: 1.5, '\\': 1.5, Caps: 1.8, Enter: 2.2, ShiftL: 2.4, ShiftR: 2.6, ' ': 7 };
  const LABEL = { Backspace: '⌫', Tab: 'Tab', Caps: 'Caps', Enter: 'Enter', ShiftL: 'Shift', ShiftR: 'Shift', ' ': '空白鍵' };

  // ── 關卡（26 個字母）──────────────────────────────────────
  // 從基準鍵 F、J 開始，每關加一兩個新鍵
  const LETTER_LESSONS = [
    { id: 'L01', add: 'fj', title: '基準鍵 F 和 J', tip: '兩根食指放在 F、J 上，摸得到小小的凸點。' },
    { id: 'L02', add: 'dk', title: 'D 和 K', tip: '中指負責 D 和 K。' },
    { id: 'L03', add: 'sl', title: 'S 和 L', tip: '無名指負責 S 和 L。' },
    { id: 'L04', add: 'a', title: 'A（左手小指）', tip: '小指最沒力，慢慢按就好。' },
    { id: 'L05', add: 'gh', title: 'G 和 H', tip: '食指往旁邊伸一格，按完要回到 F、J。' },
    { id: 'L06', add: 'ei', title: 'E 和 I（往上一排）', tip: '中指往上伸，按完回到基準鍵。' },
    { id: 'L07', add: 'ru', title: 'R 和 U', tip: '食指往上伸。' },
    { id: 'L08', add: 'ty', title: 'T 和 Y', tip: '食指往斜上方伸，比較遠喔。' },
    { id: 'L09', add: 'wo', title: 'W 和 O', tip: '無名指往上伸。' },
    { id: 'L10', add: 'qp', title: 'Q 和 P', tip: '小指往上伸。' },
    { id: 'L11', add: 'cn', title: 'C 和 N（往下一排）', tip: '中指和食指往下按。' },
    { id: 'L12', add: 'vm', title: 'V 和 M', tip: '食指往下按。' },
    { id: 'L13', add: 'xb', title: 'X 和 B', tip: 'B 是左手食指，不是右手喔！' },
    { id: 'L14', add: 'z', title: 'Z（左手小指往下）', tip: '最後一個字母！' },
    { id: 'L15', add: '', title: '26 個字母總複習', tip: '用真正的英文單字練習。', review: true }
  ];
  const LETTERS_BEFORE = {};
  (function () {
    let acc = '';
    LETTER_LESSONS.forEach(l => { acc += l.add; LETTERS_BEFORE[l.id] = acc; });
  })();

  const TRACKS = [
    { id: 'letters', icon: '🔤', title: '26 個字母', ready: true },
    { id: 'numbers', icon: '🔢', title: '數字', ready: false },
    { id: 'shift', icon: '⬆️', title: 'Shift 大小寫', ready: false },
    { id: 'symbols', icon: '❗', title: '鍵盤符號', ready: false }
  ];

  // ── 規則數字 ──────────────────────────────────────────────
  const STAR3 = 95;              // 正確率 95% 以上三顆星
  const STAR2 = 85;
  const MASH_WRONG_N = 8;        // 2 秒內打錯 8 次＝亂按（偏寬鬆）
  const MASH_WINDOW_MS = 2000;
  const MASH_STREAK = 10;        // 或連續打錯 10 次
  const HOLD_REPEAT_N = 15;      // 一直按住同一個鍵（自動重複 15 次）
  const RED_MS = 4000;           // 紅色顯示多久
  const IDLE_MS = 30000;         // 30 秒沒按＝休息中（黃色，不是紅色）
  const YELLOW_ACC = 60;         // 最近 20 次按鍵正確率低於 60% 才變黃
  const GAP_CAP_MS = 3000;       // 兩次按鍵間隔最多算 3 秒的有效練習時間
  const XP_NEW = 8;              // 第一次過關或星星變多
  const XP_REPLAY = 3;           // 重玩
  const XP_WEAK = 5;             // 加強練習

  // ── 工具 ──────────────────────────────────────────────────
  function todayStr() {
    const d = new Date();
    const p = n => (n < 10 ? '0' : '') + n;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // 用目前會的字母組出練習文字：前面的關卡用假字（f j fj jf…），字母夠多之後混入真的英文單字
  let realWords = null;
  function wordsFrom(letters) {
    if (!realWords) {
      realWords = [];
      const src = (window.VOCAB_CEEC && window.VOCAB_CEEC.words) || [];
      src.forEach(w => {
        const s = String(w.s || '').toLowerCase();
        if (/^[a-z]{2,7}$/.test(s) && (w.l || 9) <= 3) realWords.push(s);
      });
    }
    const ok = new Set(letters.split(''));
    return realWords.filter(w => w.split('').every(c => ok.has(c)));
  }

  function makeText(letters, focus, targetLen) {
    const all = letters.split('');
    const foc = (focus || '').split('').filter(c => all.includes(c));
    const real = all.length >= 9 ? wordsFrom(letters) : [];
    const words = [];
    let len = 0;
    let guard = 0;
    while (len < targetLen && guard++ < 200) {
      let w = '';
      if (real.length >= 8 && Math.random() < 0.55) {
        const withFocus = foc.length ? real.filter(x => foc.some(c => x.includes(c))) : [];
        w = pick(withFocus.length >= 3 && Math.random() < 0.7 ? withFocus : real);
      } else {
        const n = 2 + Math.floor(Math.random() * (all.length <= 4 ? 2 : 3));
        for (let i = 0; i < n; i++) {
          w += (foc.length && Math.random() < 0.5) ? pick(foc) : pick(all);
        }
      }
      if (words.length && words[words.length - 1] === w) continue;
      words.push(w);
      len += w.length + 1;
    }
    return words.join(' ');
  }

  // ── 狀態 ──────────────────────────────────────────────────
  let api = null;
  let pane = null;
  let view = 'home';          // home／play／result
  let run = null;             // 正在進行的這一關
  let lastResult = null;
  let banner = '';            // 輸入法、大寫鎖定的提醒
  let ticker = null;

  function data() {
    const st = api.getState();
    if (!st.typing || typeof st.typing !== 'object' || Array.isArray(st.typing)) st.typing = {};
    const t = st.typing;
    if (!t.prog || typeof t.prog !== 'object') t.prog = {};
    if (!t.keys || typeof t.keys !== 'object') t.keys = {};
    if (!t.days || typeof t.days !== 'object') t.days = {};
    return t;
  }
  function today() {
    const t = data();
    const d = todayStr();
    if (!t.days[d]) t.days[d] = { ms: 0, ok: 0, miss: 0, mash: 0, lessons: 0 };
    Object.keys(t.days).sort().slice(0, -30).forEach(k => { delete t.days[k]; });   // 只留 30 天
    return t.days[d];
  }

  function weakKeys(letters, n) {
    const keys = data().keys;
    return letters.split('')
      .map(k => {
        const r = keys[k] || [0, 0];
        const tot = r[0] + r[1];
        return { k, rate: tot >= 5 ? r[1] / tot : 0, tot };
      })
      .filter(x => x.rate > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, n);
  }

  function unlockedIndex() {
    const prog = data().prog;
    let i = 0;
    while (i < LETTER_LESSONS.length && prog[LETTER_LESSONS[i].id]) i++;
    return i;                 // 第 i 關（從 0 算）是下一個要過的；之前的都可以玩
  }

  // ── 練習進行中 ─────────────────────────────────────────────
  function startLesson(lessonId) {
    let text;
    let title;
    let tip;
    let letters;
    if (lessonId === 'weak') {
      const idx = Math.max(1, unlockedIndex());
      letters = LETTERS_BEFORE[LETTER_LESSONS[Math.min(idx, LETTER_LESSONS.length) - 1].id];
      const weak = weakKeys(letters, 3).map(x => x.k).join('');
      text = makeText(letters, weak || letters.slice(-2), 48);
      title = '🎯 加強練習';
      tip = weak ? `這次會多練你最常打錯的：${weak.toUpperCase().split('').join('、')}` : '你目前沒有特別常錯的鍵，繼續保持！';
    } else {
      const lesson = LETTER_LESSONS.find(l => l.id === lessonId);
      if (!lesson) return;
      letters = LETTERS_BEFORE[lesson.id];
      const len = letters.length <= 4 ? 30 : letters.length <= 10 ? 40 : 52;
      text = makeText(letters, lesson.review ? '' : lesson.add, len);
      title = lesson.title;
      tip = lesson.tip;
    }
    run = {
      id: lessonId, title, tip, text, pos: 0,
      ok: 0, miss: 0, errAt: {}, keyOk: {}, keyMiss: {},
      recent: [], wrongTimes: [], wrongStreak: 0, repeatN: 0,
      mash: 0, redUntil: 0, redWhy: '', last: 0, activeMs: 0, started: 0
    };
    view = 'play';
    banner = '';
    if (api.focus) api.focus(true);
    render();
    try { pane.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); } catch (e) { /* 忽略 */ }
  }

  function status() {
    if (!run) return ['idle', '⚪ 準備開始'];
    const now = Date.now();
    if (now < run.redUntil) return ['red', '🔴 ' + run.redWhy];
    if (!run.started) return ['idle', '⚪ 按下第一個鍵就開始'];
    if (now - run.last > IDLE_MS) return ['yellow', '🟡 休息中？準備好就繼續打'];
    if (run.recent.length >= 20) {
      const acc = run.recent.filter(Boolean).length / run.recent.length * 100;
      if (acc < YELLOW_ACC) return ['yellow', '🟡 錯誤比較多，放慢一點沒關係'];
    }
    return ['green', '🟢 穩定練習中'];
  }

  // 回傳 'ok'／'miss'／'ignored'／'mash'／'ime'（給自動測試用）
  function handleKey(ev) {
    if (view !== 'play' || !run) return 'ignored';
    if (ev.isComposing || ev.key === 'Process' || ev.keyCode === 229) {
      banner = '⚠ 現在是中文輸入法，請按一下 Shift（或 Ctrl＋空白鍵）切換到英文，再繼續打。';
      renderBanner();
      return 'ime';
    }
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return 'ignored';
    const key = ev.key;
    if (typeof key !== 'string' || key.length !== 1) return 'ignored';
    if (ev.preventDefault) ev.preventDefault();
    const now = Date.now();
    if (ev.repeat) {
      run.repeatN += 1;
      if (run.repeatN >= HOLD_REPEAT_N && now >= run.redUntil) {
        run.redUntil = now + RED_MS;
        run.redWhy = '一直按住同一個鍵，請放開';
        run.mash += 1;
        today().mash += 1;
        renderStatus();
      }
      return 'ignored';
    }
    run.repeatN = 0;
    const caps = ev.getModifierState && ev.getModifierState('CapsLock');
    const nb = caps ? '⚠ 大寫鎖定（Caps Lock）開著，請按一下 Caps Lock 關掉。' : '';
    if (nb !== banner) { banner = nb; renderBanner(); }
    if (!run.started) { run.started = now; run.last = now; }
    run.activeMs += Math.min(GAP_CAP_MS, now - run.last);
    run.last = now;

    const want = run.text[run.pos];
    const inMash = now < run.redUntil;
    if (key === want || (caps && key.toLowerCase() === want)) {
      run.wrongStreak = 0;
      if (!inMash) {
        run.ok += 1;
        run.keyOk[want] = (run.keyOk[want] || 0) + 1;
        run.recent.push(true);
      }
      run.pos += 1;
      if (run.recent.length > 20) run.recent.shift();
      if (run.pos >= run.text.length) { finish(); return 'ok'; }
      renderProgress(true);
      return 'ok';
    }
    // 打錯：不往前，記在「應該要按的那個鍵」上
    run.wrongStreak += 1;
    run.wrongTimes.push(now);
    run.wrongTimes = run.wrongTimes.filter(t => now - t <= MASH_WINDOW_MS);
    if (!inMash && (run.wrongTimes.length >= MASH_WRONG_N || run.wrongStreak >= MASH_STREAK)) {
      run.redUntil = now + RED_MS;
      run.redWhy = '偵測到亂按，這一段不算分';
      run.mash += 1;
      today().mash += 1;
      run.wrongTimes = [];
      run.wrongStreak = 0;
      renderStatus();
      flashKey(key, false);
      return 'mash';
    }
    if (!inMash) {
      run.miss += 1;
      run.errAt[run.pos] = true;
      run.keyMiss[want] = (run.keyMiss[want] || 0) + 1;
      run.recent.push(false);
      if (run.recent.length > 20) run.recent.shift();
    }
    flashKey(key, false);
    renderProgress(false);
    return inMash ? 'mash' : 'miss';
  }

  function starsFor(acc, mash) {
    if (mash >= 2) return 0;
    return acc >= STAR3 ? 3 : acc >= STAR2 ? 2 : 1;
  }

  function finish() {
    const t = data();
    const d = today();
    const total = run.ok + run.miss;
    const acc = total ? Math.round(run.ok / total * 1000) / 10 : 100;
    const minutes = Math.max(run.activeMs, 1000) / 60000;
    const wpm = Math.round(run.text.length / 5 / minutes);
    const stars = starsFor(acc, run.mash);
    Object.keys(run.keyOk).forEach(k => { t.keys[k] = t.keys[k] || [0, 0]; t.keys[k][0] += run.keyOk[k]; });
    Object.keys(run.keyMiss).forEach(k => { t.keys[k] = t.keys[k] || [0, 0]; t.keys[k][1] += run.keyMiss[k]; });
    d.ms += run.activeMs;
    d.ok += run.ok;
    d.miss += run.miss;
    d.lessons += 1;
    let xp = 0;
    let gotStars = 0;
    let note = '';
    if (run.id === 'weak') {
      const first = !d.weakDone;
      if (stars > 0) {
        xp = XP_WEAK;
        gotStars = first && acc >= 90 ? 1 : 0;
        d.weakDone = true;
      }
      note = gotStars ? '加強練習完成！（每天第一次 90% 以上有 1⭐）' : '加強練習完成！';
    } else {
      const best = t.prog[run.id] || 0;
      if (stars > best) {
        xp = XP_NEW;
        gotStars = stars - best;
        t.prog[run.id] = stars;
        note = best ? `進步了！從 ${best} 顆星變成 ${stars} 顆星` : '過關了！';
      } else if (stars > 0) {
        xp = XP_REPLAY;
        note = '再練一次，手指更熟了！';
      }
    }
    if (stars === 0) note = '這一次有亂按，所以沒有星星。慢慢打、打對比較重要喔！';
    const weakHere = Object.keys(run.keyMiss).sort((a, b) => run.keyMiss[b] - run.keyMiss[a]).slice(0, 3);
    lastResult = { id: run.id, title: run.title, acc, wpm, stars, xp, gotStars, note, weakHere, mash: run.mash, ms: run.activeMs };
    run = null;
    view = 'result';
    if (api.focus) api.focus(false);
    api.save();
    if (xp > 0) api.award(xp, gotStars, 'typing', `英打練習：${lastResult.title}`);
    render();
  }

  function quit() {
    run = null;
    view = 'home';
    banner = '';
    if (api.focus) api.focus(false);
    render();
  }

  // ── 畫面 ──────────────────────────────────────────────────
  function keyboardHtml(opt) {
    const heat = opt && opt.heat;
    return '<div class="ty-kb" aria-hidden="true">' + ROWS.map(row => '<div class="ty-row">' + row.map(k => {
      const f = FINGER_OF[k];
      const w = WIDE[k] || 1;
      let bg = f ? FINGER_COLOR[f] : '#eee6dc';
      let extra = '';
      if (heat && f && /^[a-z]$/.test(k)) {
        const r = heat[k];
        if (r && r[0] + r[1] >= 5) {
          const rate = r[1] / (r[0] + r[1]);
          if (rate >= 0.25) { bg = '#f28b82'; extra = ' ty-hot'; } else if (rate >= 0.1) { bg = '#f9c7b8'; extra = ' ty-warm'; } else { bg = '#c8ecd3'; }
        } else {
          bg = '#f4efe8';
        }
      }
      const label = LABEL[k] || (k.length === 1 ? k.toUpperCase() : k);
      const bump = (k === 'f' || k === 'j') ? '<i class="ty-bump"></i>' : '';
      return `<div class="ty-key${extra}" data-k="${esc(k)}" style="flex:${w};background:${bg}">${esc(label)}${bump}</div>`;
    }).join('') + '</div>').join('') + '</div>';
  }

  // 兩隻手（SVG）：每根手指一個 data-f，該用的那根加上 class="on"
  function handsHtml() {
    const finger = (id, x, y, w, h) =>
      `<rect class="ty-finger" data-f="${id}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" style="--fc:${FINGER_COLOR[id]}"/>`;
    // 大拇指先畫、手掌後畫，大拇指的根部藏在手掌下面，看起來是連在一起的
    const left =
      finger('L5', 14, 46, 20, 52) + finger('L4', 38, 26, 21, 70) + finger('L3', 63, 16, 22, 80) + finger('L2', 89, 26, 22, 70) +
      `<rect class="ty-finger" data-f="T" x="82" y="108" width="62" height="24" rx="12" transform="rotate(-28 82 120)" style="--fc:${FINGER_COLOR.T}"/>` +
      `<rect class="ty-palm" x="12" y="84" width="102" height="66" rx="26"/>`;
    const right =
      `<rect class="ty-finger" data-f="T" x="206" y="108" width="62" height="24" rx="12" transform="rotate(28 268 120)" style="--fc:${FINGER_COLOR.T}"/>` +
      finger('R2', 239, 26, 22, 70) + finger('R3', 265, 16, 22, 80) + finger('R4', 291, 26, 21, 70) + finger('R5', 316, 46, 20, 52) +
      `<rect class="ty-palm" x="236" y="84" width="102" height="66" rx="26"/>`;
    return `<svg class="ty-hands" viewBox="0 0 350 156" aria-hidden="true">${left}${right}</svg>`;
  }

  function homeHtml() {
    const t = data();
    const d = today();
    const total = d.ok + d.miss;
    const acc = total ? Math.round(d.ok / total * 100) : 0;
    const min = Math.floor(d.ms / 60000);
    const sec = Math.round((d.ms % 60000) / 1000);
    const nextI = unlockedIndex();
    const letters = LETTERS_BEFORE[LETTER_LESSONS[Math.max(0, Math.min(nextI, LETTER_LESSONS.length) - 1)].id];
    const weak = nextI >= 2 ? weakKeys(letters, 3) : [];
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;
    return `
      <div class="card-box">
        <div class="section-title"><span>⌨️ 英打練習</span><span class="ty-today-pill">今天有效練習 ${min} 分 ${sec} 秒</span></div>
        ${coarse ? '<p class="ty-warn">這台裝置看起來沒有接實體鍵盤。英打練習要用真的鍵盤，請接上鍵盤或改用電腦。</p>' : ''}
        <p class="section-sub">手指放在基準鍵（左手 A S D F、右手 J K L ;），看著螢幕、不要看鍵盤。打錯不會往前跳，要打對才繼續。<strong>正確率比速度重要</strong>：95% 以上三顆星。</p>
        <div class="ty-tracks">
          ${TRACKS.map(tr => `<div class="ty-track ${tr.ready ? 'on' : ''}">${tr.icon} ${tr.title}${tr.ready ? '' : '<small>之後開放</small>'}</div>`).join('')}
        </div>
        <div class="ty-grid">
          ${LETTER_LESSONS.map((l, i) => {
            const st = t.prog[l.id] || 0;
            const open = i <= nextI;
            return `<button class="ty-lesson ${open ? '' : 'locked'} ${i === nextI ? 'next' : ''}" data-lesson="${l.id}" ${open ? '' : 'disabled'}>
              <span class="ty-ln">${i + 1}</span>
              <span class="ty-lt">${open ? esc(l.title) : '🔒 ' + esc(l.title)}</span>
              <span class="ty-ls">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>
            </button>`;
          }).join('')}
          ${nextI >= 2 ? `<button class="ty-lesson weak" data-lesson="weak"><span class="ty-ln">🎯</span><span class="ty-lt">加強練習${weak.length ? '：' + weak.map(x => x.k.toUpperCase()).join(' ') : ''}</span><span class="ty-ls">常錯的鍵</span></button>` : ''}
        </div>
      </div>
      <div class="card-box">
        <div class="section-title"><span>📋 今天的練習紀錄</span></div>
        <div class="ty-stats">
          <div><b>${min} 分 ${sec} 秒</b><span>有效練習時間</span></div>
          <div><b>${total ? acc + '%' : '—'}</b><span>正確率</span></div>
          <div><b>${d.lessons}</b><span>完成關卡</span></div>
          <div class="${d.mash ? 'bad' : ''}"><b>${d.mash}</b><span>亂按次數</span></div>
        </div>
        <p class="section-sub" style="margin-top:12px;">哪些鍵最常打錯（紅色＝常錯，淺紅＝偶爾錯，綠色＝穩定）：</p>
        ${keyboardHtml({ heat: t.keys })}
      </div>`;
  }

  function playHtml() {
    const chars = run.text.split('').map((c, i) =>
      `<span class="ty-c${i < run.pos ? ' done' : ''}${i === run.pos ? ' cur' : ''}${run.errAt[i] ? ' err' : ''}" data-i="${i}">${c === ' ' ? '·' : esc(c)}</span>`).join('');
    return `
      <div class="card-box ty-play">
        <div id="tyStatus" class="ty-status"></div>
        <div class="ty-head">
          <span class="ty-title">${esc(run.title)}</span>
          <span class="ty-tip">💡 ${esc(run.tip)}</span>
          <button class="btn btn-soft" id="tyQuit">✕ 離開</button>
        </div>
        <div id="tyBanner" class="ty-banner" hidden></div>
        <div class="ty-text" id="tyText">${chars}</div>
        <div class="ty-progress"><div id="tyBar" style="width:0%"></div></div>
        <div id="tyFingerName" class="ty-fname"></div>
        ${keyboardHtml()}
        ${handsHtml()}
      </div>`;
  }

  function resultHtml() {
    const r = lastResult;
    const lesson = LETTER_LESSONS.find(l => l.id === r.id);
    const idx = lesson ? LETTER_LESSONS.indexOf(lesson) : -1;
    const next = idx >= 0 && idx + 1 < LETTER_LESSONS.length && r.stars > 0 ? LETTER_LESSONS[idx + 1] : null;
    const sec = Math.round(r.ms / 1000);
    return `
      <div class="card-box ty-result">
        <div class="ty-big-stars">${r.stars ? '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) : '☆☆☆'}</div>
        <h2>${esc(r.title)}</h2>
        <p class="ty-note">${esc(r.note)}</p>
        <div class="ty-stats">
          <div><b>${r.acc}%</b><span>正確率</span></div>
          <div><b>${r.wpm}</b><span>每分鐘字數</span></div>
          <div><b>${sec} 秒</b><span>有效時間</span></div>
          <div class="${r.mash ? 'bad' : ''}"><b>${r.mash}</b><span>亂按次數</span></div>
        </div>
        ${r.weakHere.length ? `<p class="section-sub">這一關最常打錯：<strong>${r.weakHere.map(k => k === ' ' ? '空白鍵' : k.toUpperCase()).join('、')}</strong></p>` : '<p class="section-sub">這一關一個字都沒打錯，太厲害了！</p>'}
        ${r.xp ? `<p class="section-sub">獲得 +${r.xp} 經驗值${r.gotStars ? `、+${r.gotStars}⭐` : ''}</p>` : ''}
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:14px;">
          <button class="btn btn-soft" data-lesson="${esc(r.id)}">🔁 再練一次</button>
          ${next ? `<button class="btn btn-green" data-lesson="${next.id}">下一關 ▶</button>` : ''}
          <button class="btn btn-soft" id="tyHome">📋 回到關卡列表</button>
        </div>
      </div>`;
  }

  function render() {
    if (!pane) return;
    document.body.classList.toggle('ty-playing', view === 'play' && pane.offsetParent !== null);
    pane.innerHTML = view === 'play' ? playHtml() : view === 'result' ? resultHtml() : homeHtml();
    pane.querySelectorAll('[data-lesson]').forEach(b => b.addEventListener('click', () => startLesson(b.dataset.lesson)));
    const q = pane.querySelector('#tyQuit');
    if (q) q.addEventListener('click', quit);
    const h = pane.querySelector('#tyHome');
    if (h) h.addEventListener('click', () => { view = 'home'; render(); });
    if (view === 'play') {
      renderProgress(true);
      renderStatus();
      renderBanner();
    }
  }

  function renderBanner() {
    const b = pane && pane.querySelector('#tyBanner');
    if (!b) return;
    b.textContent = banner;
    b.hidden = !banner;
  }

  function renderStatus() {
    const el = pane && pane.querySelector('#tyStatus');
    if (!el) return;
    const [cls, txt] = status();
    el.className = 'ty-status ' + cls;
    el.textContent = txt;
  }

  function renderProgress(ok) {
    if (!pane || !run) return;
    const spans = pane.querySelectorAll('#tyText .ty-c');
    spans.forEach((s, i) => {
      s.classList.toggle('done', i < run.pos);
      s.classList.toggle('cur', i === run.pos);
      s.classList.toggle('err', !!run.errAt[i]);
      if (i === run.pos && !ok) { s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
    });
    const bar = pane.querySelector('#tyBar');
    if (bar) bar.style.width = (run.pos / run.text.length * 100) + '%';
    const want = run.text[run.pos];
    pane.querySelectorAll('.ty-key.next').forEach(k => k.classList.remove('next'));
    const keyEl = pane.querySelector(`.ty-key[data-k="${CSS.escape(want)}"]`);
    if (keyEl) keyEl.classList.add('next');
    const f = FINGER_OF[want];
    pane.querySelectorAll('.ty-finger').forEach(el => el.classList.toggle('on', el.dataset.f === f));
    const fn = pane.querySelector('#tyFingerName');
    if (fn) fn.textContent = f ? `下一個：${want === ' ' ? '空白鍵' : want.toUpperCase()}　用${FINGER_NAME[f]}` : '';
    renderStatus();
  }

  function flashKey(k, ok) {
    if (!pane) return;
    const el = pane.querySelector(`.ty-key[data-k="${CSS.escape(String(k).toLowerCase())}"]`);
    if (!el) return;
    el.classList.remove('bad', 'good');
    void el.offsetWidth;
    el.classList.add(ok ? 'good' : 'bad');
  }

  function onKeyDown(ev) {
    if (!pane || pane.offsetParent === null) return;   // 不在英打分頁
    handleKey(ev);
  }

  // ── 對外 ──────────────────────────────────────────────────
  window.PuppyTyping = {
    mount(el, hooks) {
      pane = el;
      api = hooks;
      window.addEventListener('keydown', onKeyDown);
      if (!ticker) ticker = setInterval(() => { if (view === 'play') renderStatus(); }, 1000);
    },
    show() { if (view === 'play' && api.focus) api.focus(true); render(); },
    hide() { document.body.classList.remove('ty-playing'); if (view === 'play' && api.focus) api.focus(false); },
    isPlaying() { return view === 'play'; },
    // 自動測試用
    _t: {
      LETTER_LESSONS, FINGER_OF, LETTERS_BEFORE, makeText, startLesson, handleKey, starsFor, unlockedIndex,
      run: () => run, result: () => lastResult, status, quit, data, setRun: patch => Object.assign(run, patch)
    }
  };
})();
