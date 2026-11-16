// 《汪汪小精靈 學習小伙伴》打字練習（v3.6.0：英打＋注音鍵位＋全班測驗／自己挑戰）
//
// 設計重點（給接手的人）：
//   ‧ 對象：國小四年級起。重點是正確的手指（英打）、正確的鍵位（注音）和正確率，速度只當參考。
//   ‧ 練習畫面：要打的字 → 虛擬鍵盤（下一個鍵發亮）→ 虛擬雙手（英打才有；注音不教指法）。
//   ‧ 打錯不會往前跳，要打對才繼續（TypingClub 的做法）；一次加一兩個新鍵（Keybr 的做法）。
//   ‧ 顏色帶（偏寬鬆）：🟢 穩定、🟡 錯誤比較多或休息中、🔴 只有亂按或一直按住。亂按那一段不算分。
//   ‧ 全班測驗：老師在 teacher.html 產生 6 位數測驗碼，全班輸入同一組碼就拿到同一份題目。
//     測驗碼＝第 1 碼（1～3 英打 1/2/3 分鐘、4～6 注音 1/2/3 分鐘）＋第 2～3 碼（範圍）＋第 4～6 碼（亂數種子）。
//     題目沒有空白鍵；每 5 個字之間的間隔只是好讀，不用按。得分＝打對的字數 × 正確率。
//     結束後顯示 QR Code（年級、班級、座號、第幾次、得分…），老師在 teacher.html 用手機掃描收成績。
//   ‧ 自己挑戰：規則和全班測驗一樣，程式隨機出一組碼。
//   ‧ 紀錄只存在這台裝置：英打在 state.typing、注音在 state.zhuyin；測驗次數和座號在 state.typing。
//   ‧ 和 app.js 唯一的接點：window.PuppyTyping.mount(pane, api)。teacher.html 用同一份 QR 驗證算法（PuppyStamp.code）。
(function () {
  'use strict';

  // ── 鍵盤與手指 ──────────────────────────────────────────────
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

  // ── 注音（標準大千式，微軟注音預設的排列）────────────────────
  const ZH_OF_KEY = {
    '1': 'ㄅ', q: 'ㄆ', a: 'ㄇ', z: 'ㄈ', '2': 'ㄉ', w: 'ㄊ', s: 'ㄋ', x: 'ㄌ',
    '3': 'ˇ', e: 'ㄍ', d: 'ㄎ', c: 'ㄏ', '4': 'ˋ', r: 'ㄐ', f: 'ㄑ', v: 'ㄒ',
    '5': 'ㄓ', t: 'ㄔ', g: 'ㄕ', b: 'ㄖ', '6': 'ˊ', y: 'ㄗ', h: 'ㄘ', n: 'ㄙ',
    '7': '˙', u: 'ㄧ', j: 'ㄨ', m: 'ㄩ', '8': 'ㄚ', i: 'ㄛ', k: 'ㄜ', ',': 'ㄝ',
    '9': 'ㄞ', o: 'ㄟ', l: 'ㄠ', '.': 'ㄡ', '0': 'ㄢ', p: 'ㄣ', ';': 'ㄤ', '/': 'ㄥ', '-': 'ㄦ'
  };
  const KEY_OF_ZH = {};
  Object.keys(ZH_OF_KEY).forEach(k => { KEY_OF_ZH[ZH_OF_KEY[k]] = k; });
  // 實體按鍵代碼 → 鍵盤上的字（注音用這個判斷，開著中文輸入法也能練）
  const CODE_KEY = { Comma: ',', Period: '.', Semicolon: ';', Slash: '/', Minus: '-', Space: ' ' };
  for (let i = 0; i < 10; i++) CODE_KEY['Digit' + i] = String(i);
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(c => { CODE_KEY['Key' + c.toUpperCase()] = c; });
  // 注音分組的顏色（注音不教指法，用顏色幫忙記區域）
  const ZH_GROUP = {};
  'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ'.split('').forEach(c => { ZH_GROUP[c] = '#a9d6f2'; });
  'ㄧㄨㄩ'.split('').forEach(c => { ZH_GROUP[c] = '#b9e4a8'; });
  'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ'.split('').forEach(c => { ZH_GROUP[c] = '#fbcf9c'; });
  'ˊˇˋ˙'.split('').forEach(c => { ZH_GROUP[c] = '#d4ccf5'; });

  // ── 關卡 ──────────────────────────────────────────────────
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
  const ZH_LESSONS = [
    { id: 'Z01', add: 'ㄅㄆㄇㄈ', title: 'ㄅ ㄆ ㄇ ㄈ', tip: '在最左邊：數字 1、Q、A、Z 這一直排。' },
    { id: 'Z02', add: 'ㄉㄊㄋㄌ', title: 'ㄉ ㄊ ㄋ ㄌ', tip: '數字 2、W、S、X 這一直排。' },
    { id: 'Z03', add: 'ㄍㄎㄏ', title: 'ㄍ ㄎ ㄏ', tip: 'E、D、C 這一直排。' },
    { id: 'Z04', add: 'ㄐㄑㄒ', title: 'ㄐ ㄑ ㄒ', tip: 'R、F、V 這一直排。' },
    { id: 'Z05', add: 'ㄓㄔㄕㄖ', title: 'ㄓ ㄔ ㄕ ㄖ', tip: '數字 5、T、G、B 這一直排。' },
    { id: 'Z06', add: 'ㄗㄘㄙ', title: 'ㄗ ㄘ ㄙ', tip: 'Y、H、N 這一直排。聲母全部學完了！' },
    { id: 'Z07', add: 'ㄧㄨㄩ', title: '介音 ㄧ ㄨ ㄩ', tip: 'U、J、M 這一直排。' },
    { id: 'Z08', add: 'ㄚㄛㄜㄝ', title: 'ㄚ ㄛ ㄜ ㄝ', tip: '數字 8、I、K、逗號。' },
    { id: 'Z09', add: 'ㄞㄟㄠㄡ', title: 'ㄞ ㄟ ㄠ ㄡ', tip: '數字 9、O、L、句號。' },
    { id: 'Z10', add: 'ㄢㄣㄤㄥㄦ', title: 'ㄢ ㄣ ㄤ ㄥ ㄦ', tip: '數字 0、P、分號、斜線，ㄦ 在減號。' },
    { id: 'Z11', add: 'ˊˇˋ˙', title: '聲調 ˊ ˇ ˋ ˙', tip: '二聲 6、三聲 3、四聲 4、輕聲 7（一聲是空白鍵）。' },
    { id: 'Z12', add: '', title: '注音符號總複習', tip: '全部的注音符號和聲調。', review: true }
  ];
  function before(lessons) {
    const out = {};
    let acc = '';
    lessons.forEach(l => { acc += l.add; out[l.id] = acc; });
    return out;
  }
  const MODES = {
    en: { id: 'en', store: 'typing', lessons: LETTER_LESSONS, before: before(LETTER_LESSONS), label: '🔤 英文打字' },
    zh: { id: 'zh', store: 'zhuyin', lessons: ZH_LESSONS, before: before(ZH_LESSONS), label: 'ㄅ 注音鍵位' }
  };
  const LETTERS_BEFORE = MODES.en.before;
  const ZH_SCOPES = [
    { n: 1, title: '聲母（ㄅ～ㄙ）', upTo: 'Z06' },
    { n: 2, title: '聲母＋介音＋韻母', upTo: 'Z10' },
    { n: 3, title: '全部（含聲調）', upTo: 'Z11' }
  ];

  // ── 規則數字 ──────────────────────────────────────────────
  const STAR3 = 95;
  const STAR2 = 85;
  const MASH_WRONG_N = 8;        // 2 秒內打錯 8 次＝亂按（偏寬鬆）
  const MASH_WINDOW_MS = 2000;
  const MASH_STREAK = 10;
  const HOLD_REPEAT_N = 15;
  const RED_MS = 4000;
  const IDLE_MS = 30000;
  const YELLOW_ACC = 60;
  const GAP_CAP_MS = 3000;
  const XP_NEW = 8;
  const XP_REPLAY = 3;
  const XP_WEAK = 5;
  const XP_CLASS_TEST = 4;       // 全班測驗：每組測驗碼第一次有經驗值，不給星星
  const XP_SELF_TEST = 3;        // 自己挑戰：每天前 3 次有經驗值，不給星星
  const SELF_XP_TIMES = 3;
  const TEST_WINDOW = 40;        // 測驗時一次顯示幾個字
  const QR_KEY = '5075707079537475647954657374514b';   // QR 防偽檢查碼的鑰匙（teacher.html 也有同一把）

  // ── 工具 ──────────────────────────────────────────────────
  function todayStr() {
    const d = new Date();
    const p = n => (n < 10 ? '0' : '') + n;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function stampNow() {
    const d = new Date();
    const p = n => (n < 10 ? '0' : '') + n;
    return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes());
  }
  function pick(arr, rnd) { return arr[Math.floor((rnd || Math.random)() * arr.length)]; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  // 有種子的亂數：同一組測驗碼，全班拿到一模一樣的題目
  function seeded(seed) {
    let a = (seed * 2654435761) >>> 0 || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 英打練習文字：前面的關卡用假字（f j fj jf…），字母夠多之後混入真的英文單字
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
        for (let i = 0; i < n; i++) w += (foc.length && Math.random() < 0.5) ? pick(foc) : pick(all);
      }
      if (words.length && words[words.length - 1] === w) continue;
      words.push(w);
      len += w.length + 1;
    }
    return words.join(' ');
  }

  // 沒有空白的文字（注音練習、全班測驗）：隨機排列，避免同一個字連續出現三次
  function makeRun(symbols, focus, len, rnd) {
    const all = Array.from(symbols);
    const foc = Array.from(focus || '').filter(c => all.includes(c));
    const out = [];
    while (out.length < len) {
      const c = (foc.length && (rnd || Math.random)() < 0.45) ? pick(foc, rnd) : pick(all, rnd);
      if (out.length >= 2 && out[out.length - 1] === c && out[out.length - 2] === c) continue;
      out.push(c);
    }
    return out.join('');
  }

  // ── 測驗碼 ────────────────────────────────────────────────
  // 回傳 { code, mode, minutes, scope, seed, symbols, scopeText } 或 null（碼不對）
  function parseCode(code) {
    const s = String(code || '').replace(/\D/g, '');
    if (!/^[1-6]\d{5}$/.test(s)) return null;
    const d1 = +s[0];
    const mode = d1 <= 3 ? 'en' : 'zh';
    const minutes = mode === 'en' ? d1 : d1 - 3;
    const scope = +s.slice(1, 3);
    const seed = +s.slice(3);
    let symbols;
    let scopeText;
    if (mode === 'en') {
      if (scope < 1 || scope > 14) return null;
      symbols = MODES.en.before[LETTER_LESSONS[scope - 1].id];
      scopeText = scope >= 14 ? '全部 26 個字母' : `第 1～${scope} 關的字母（${symbols.toUpperCase().split('').join(' ')}）`;
    } else {
      const sc = ZH_SCOPES.find(x => x.n === scope);
      if (!sc) return null;
      symbols = MODES.zh.before[sc.upTo];
      scopeText = sc.title;
    }
    return { code: s, mode, minutes, scope, seed, symbols, scopeText };
  }

  function makeCode(m, minutes, scope, seed) {
    const d1 = m === 'en' ? minutes : minutes + 3;
    const sd = seed == null ? Math.floor(Math.random() * 1000) : seed;
    return String(d1) + String(scope).padStart(2, '0') + String(sd).padStart(3, '0');
  }

  function testText(info) {
    // 同一組碼一定得到同一份題目（種子包含整組碼）
    return makeRun(info.symbols, '', info.minutes * 220, seeded(parseInt(info.code, 10)));
  }

  function scoreOf(ok, miss) {
    const tot = ok + miss;
    if (!tot) return 0;
    return Math.round(ok * (ok / tot));
  }

  // 給老師掃描的成績資料：PZT1|測驗碼|年|班|座|第幾次|得分|對|錯|正確率×10|每分鐘|亂按|自己挑戰|時間|檢查碼
  function qrPayload(r) {
    const body = ['PZT1', r.code, r.g, r.c, r.s, r.attempt, r.score, r.ok, r.miss, Math.round(r.acc * 10), r.rate, r.mash,
      r.self ? 1 : 0, r.when].join('|');
    const chk = window.PuppyStamp ? window.PuppyStamp.code(QR_KEY, body) : '000000';
    return body + '|' + chk;
  }

  // ── 狀態 ──────────────────────────────────────────────────
  let api = null;
  let pane = null;
  let mode = 'en';
  let view = 'home';          // home／play／result／testsetup／ready／testresult
  let run = null;
  let lastResult = null;
  let banner = '';
  let ticker = null;
  let pendingTest = null;     // 準備開始的測驗 { info, self }
  let setupMsg = '';

  function M() { return MODES[mode]; }
  function storeOf(m) {
    const st = api.getState();
    const key = MODES[m].store;
    if (!st[key] || typeof st[key] !== 'object' || Array.isArray(st[key])) st[key] = {};
    const t = st[key];
    ['prog', 'keys', 'days', 'best'].forEach(k => { if (!t[k] || typeof t[k] !== 'object') t[k] = {}; });
    return t;
  }
  function data() { return storeOf(mode); }
  function common() {
    const t = storeOf('en');
    if (!t.tests || typeof t.tests !== 'object') t.tests = {};
    if (!t.who || typeof t.who !== 'object') t.who = { g: 0, c: 0, s: 0 };
    return t;
  }
  function today(m) {
    const t = storeOf(m || mode);
    const d = todayStr();
    if (!t.days[d]) t.days[d] = { ms: 0, ok: 0, miss: 0, mash: 0, lessons: 0 };
    Object.keys(t.days).sort().slice(0, -30).forEach(k => { delete t.days[k]; });
    return t.days[d];
  }

  function weakKeys(symbols, n) {
    const keys = data().keys;
    return Array.from(symbols)
      .map(k => {
        const r = keys[k] || [0, 0];
        const tot = r[0] + r[1];
        return { k, rate: tot >= 5 ? r[1] / tot : 0, tot };
      })
      .filter(x => x.rate > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, n);
  }

  function unlockedIndex(m) {
    const lessons = MODES[m || mode].lessons;
    const prog = storeOf(m || mode).prog;
    let i = 0;
    while (i < lessons.length && prog[lessons[i].id]) i++;
    return i;
  }

  function upToSymbols() {
    const lessons = M().lessons;
    const idx = Math.max(1, unlockedIndex());
    return M().before[lessons[Math.min(idx, lessons.length) - 1].id];
  }

  // ── 開始練習／測驗 ─────────────────────────────────────────
  function newRun(extra) {
    return Object.assign({
      pos: 0, ok: 0, miss: 0, errAt: {}, keyOk: {}, keyMiss: {},
      recent: [], wrongTimes: [], wrongStreak: 0, repeatN: 0,
      mash: 0, redUntil: 0, redWhy: '', last: 0, activeMs: 0, started: 0, test: null, winFrom: 0
    }, extra);
  }

  function scrollTop() {
    try { pane.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); } catch (e) { /* 忽略 */ }
  }

  function startLesson(lessonId) {
    if (/^Z/.test(lessonId)) mode = 'zh';
    else if (/^L/.test(lessonId)) mode = 'en';
    let text;
    let title;
    let tip;
    if (lessonId === 'weak') {
      const symbols = upToSymbols();
      const weak = weakKeys(symbols, 3).map(x => x.k).join('');
      text = mode === 'en' ? makeText(symbols, weak || symbols.slice(-2), 48) : makeRun(symbols, weak || Array.from(symbols).slice(-3).join(''), 36);
      title = '🎯 加強練習';
      tip = weak ? `這次會多練你最常打錯的：${Array.from(weak).map(k => k.toUpperCase()).join('、')}` : '你目前沒有特別常錯的鍵，繼續保持！';
    } else {
      const lesson = M().lessons.find(l => l.id === lessonId);
      if (!lesson) return;
      const symbols = M().before[lesson.id];
      if (mode === 'en') {
        const len = symbols.length <= 4 ? 30 : symbols.length <= 10 ? 40 : 52;
        text = makeText(symbols, lesson.review ? '' : lesson.add, len);
      } else {
        text = makeRun(symbols, lesson.review ? '' : lesson.add, Array.from(symbols).length <= 8 ? 28 : 36);
      }
      title = lesson.title;
      tip = lesson.tip;
    }
    run = newRun({ id: lessonId, title, tip, text: Array.from(text) });
    view = 'play';
    banner = '';
    if (api.focus) api.focus(true);
    render();
    scrollTop();
  }

  // 測驗：先到「準備」畫面，按 Enter 才倒數
  function prepareTest(code, self) {
    const info = parseCode(code);
    if (!info) return false;
    const who = common().who;
    if (!self && !(who.g && who.c && who.s)) {
      setupMsg = '請先選好年級、班級和座號。';
      view = 'testsetup';
      render();
      return false;
    }
    mode = info.mode;
    pendingTest = { info, self: !!self };
    view = 'ready';
    render();
    scrollTop();
    return true;
  }

  function startTest() {
    if (!pendingTest) return;
    const { info, self } = pendingTest;
    const c = common();
    const rec = c.tests[info.code] || { n: 0, best: 0 };
    rec.n += 1;                         // 開始就算一次（中途離開也算，避免一直重測挑最好的）
    c.tests[info.code] = rec;
    const keys = Object.keys(c.tests);
    if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(k => { delete c.tests[k]; });
    api.save();
    const now = Date.now();
    run = newRun({
      id: 'test', title: self ? '🏁 自己挑戰' : '🏁 全班測驗', tip: info.scopeText,
      text: Array.from(testText(info)),
      test: { info, self, attempt: rec.n, startAt: now + 3000, endAt: now + 3000 + info.minutes * 60000 }
    });
    pendingTest = null;
    view = 'play';
    banner = '';
    if (api.focus) api.focus(true);
    render();
  }

  function status() {
    if (!run) return ['idle', '⚪ 準備開始'];
    const now = Date.now();
    if (run.test && now < run.test.startAt) return ['idle', '⚪ 準備…'];
    if (now < run.redUntil) return ['red', '🔴 ' + run.redWhy];
    if (!run.started) return ['idle', run.test ? '⚪ 開始！' : '⚪ 按下第一個鍵就開始'];
    if (now - run.last > IDLE_MS) return ['yellow', '🟡 休息中？準備好就繼續打'];
    if (run.recent.length >= 20) {
      const acc = run.recent.filter(Boolean).length / run.recent.length * 100;
      if (acc < YELLOW_ACC) return ['yellow', '🟡 錯誤比較多，放慢一點沒關係'];
    }
    return ['green', '🟢 穩定練習中'];
  }

  // 把按鍵換成「要比對的字」：英打看 ev.key；注音看實體按鍵代碼 ev.code
  function keyChar(ev) {
    if (mode === 'zh') {
      const k = CODE_KEY[ev.code] || (typeof ev.key === 'string' && ev.key.length === 1 ? ev.key.toLowerCase() : '');
      return { phys: k, ch: ZH_OF_KEY[k] || '' };
    }
    return { phys: typeof ev.key === 'string' ? ev.key.toLowerCase() : '', ch: ev.key };
  }

  // 回傳 'ok'／'miss'／'ignored'／'mash'／'ime'／'start'（給自動測試用）
  function handleKey(ev) {
    if (view === 'ready' && ev.key === 'Enter') {
      if (ev.preventDefault) ev.preventDefault();
      startTest();
      return 'start';
    }
    if (view !== 'play' || !run) return 'ignored';
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return 'ignored';
    const now = Date.now();
    if (run.test && now < run.test.startAt) return 'ignored';
    if (mode === 'en' && (ev.isComposing || ev.key === 'Process' || ev.keyCode === 229)) {
      banner = '⚠ 現在是中文輸入法，請按一下 Shift（或 Ctrl＋空白鍵）切換到英文，再繼續打。';
      renderBanner();
      return 'ime';
    }
    const { phys, ch } = keyChar(ev);
    if (!ch || (mode === 'en' && ch.length !== 1)) return 'ignored';
    if (ev.preventDefault) ev.preventDefault();
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
    const caps = mode === 'en' && ev.getModifierState && ev.getModifierState('CapsLock');
    const nb = caps ? '⚠ 大寫鎖定（Caps Lock）開著，請按一下 Caps Lock 關掉。' : '';
    if (nb !== banner) { banner = nb; renderBanner(); }
    if (!run.started) { run.started = now; run.last = now; }
    run.activeMs += Math.min(GAP_CAP_MS, now - run.last);
    run.last = now;

    const want = run.text[run.pos];
    const inMash = now < run.redUntil;
    if (ch === want || (caps && ch.toLowerCase() === want)) {
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
      flashKey(phys);
      return 'mash';
    }
    if (!inMash) {
      run.miss += 1;
      run.errAt[run.pos] = true;
      run.keyMiss[want] = (run.keyMiss[want] || 0) + 1;
      run.recent.push(false);
      if (run.recent.length > 20) run.recent.shift();
    }
    flashKey(phys);
    renderProgress(false);
    return inMash ? 'mash' : 'miss';
  }

  function starsFor(acc, mash) {
    if (mash >= 2) return 0;
    return acc >= STAR3 ? 3 : acc >= STAR2 ? 2 : 1;
  }

  function saveKeyStats() {
    const t = data();
    const d = today();
    Object.keys(run.keyOk).forEach(k => { t.keys[k] = t.keys[k] || [0, 0]; t.keys[k][0] += run.keyOk[k]; });
    Object.keys(run.keyMiss).forEach(k => { t.keys[k] = t.keys[k] || [0, 0]; t.keys[k][1] += run.keyMiss[k]; });
    d.ok += run.ok;
    d.miss += run.miss;
    return d;
  }

  function finish() {
    if (run.test) { finishTest(); return; }
    const t = data();
    const d = saveKeyStats();
    const total = run.ok + run.miss;
    const acc = total ? Math.round(run.ok / total * 1000) / 10 : 100;
    const minutes = Math.max(run.activeMs, 1000) / 60000;
    const rate = Math.round(mode === 'en' ? run.text.length / 5 / minutes : run.text.length / minutes);
    const stars = starsFor(acc, run.mash);
    d.ms += run.activeMs;
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
    lastResult = { id: run.id, mode, title: run.title, acc, rate, stars, xp, gotStars, note, weakHere, mash: run.mash, ms: run.activeMs };
    run = null;
    view = 'result';
    if (api.focus) api.focus(false);
    api.save();
    if (xp > 0) api.award(xp, gotStars, 'typing', `${mode === 'en' ? '英打' : '注音'}練習：${lastResult.title}`);
    render();
  }

  function finishTest() {
    if (!run || !run.test) return;
    const test = run.test;
    const info = test.info;
    const d = saveKeyStats();
    d.ms += info.minutes * 60000;
    const total = run.ok + run.miss;
    const acc = total ? Math.round(run.ok / total * 1000) / 10 : 0;
    const score = scoreOf(run.ok, run.miss);
    const rate = Math.round(mode === 'en' ? run.ok / 5 / info.minutes : run.ok / info.minutes);
    const c = common();
    const rec = c.tests[info.code] || { n: test.attempt, best: 0 };
    const firstScore = !rec.done;
    rec.best = Math.max(rec.best || 0, score);
    rec.done = true;
    c.tests[info.code] = rec;
    const bkey = `${info.mode}-${info.minutes}-${info.scope}`;
    const t = data();
    const prevBest = t.best[bkey] || 0;
    if (score > prevBest) t.best[bkey] = score;
    let xp = 0;
    if (run.mash < 2 && run.ok > 0) {
      if (!test.self && firstScore) xp = XP_CLASS_TEST;
      if (test.self) {
        d.selfXp = d.selfXp || 0;
        if (d.selfXp < SELF_XP_TIMES) { xp = XP_SELF_TEST; d.selfXp += 1; }
      }
    }
    const who = c.who;
    const res = {
      code: info.code, g: who.g || 0, c: who.c || 0, s: who.s || 0, attempt: test.attempt, score, ok: run.ok, miss: run.miss,
      acc, rate, mash: run.mash, self: test.self, when: stampNow()
    };
    lastResult = Object.assign({ test: true, mode, info, xp, prevBest, newBest: score > prevBest && prevBest > 0, qr: qrPayload(res) }, res);
    run = null;
    view = 'testresult';
    if (api.focus) api.focus(false);
    api.save();
    if (xp > 0) api.award(xp, 0, 'typing', `${test.self ? '自己挑戰' : '全班測驗'}完成（${score} 分）`);
    render();
  }

  function quit() {
    run = null;
    view = 'home';
    banner = '';
    pendingTest = null;
    if (api.focus) api.focus(false);
    render();
  }

  // ── 畫面 ──────────────────────────────────────────────────
  function keyboardHtml(opt) {
    const heat = opt && opt.heat;
    const zh = mode === 'zh';
    return '<div class="ty-kb' + (zh ? ' zh' : '') + '" aria-hidden="true">' + ROWS.map(row => '<div class="ty-row">' + row.map(k => {
      const w = WIDE[k] || 1;
      const sym = zh ? ZH_OF_KEY[k] : '';
      const f = FINGER_OF[k];
      let bg = zh ? (sym ? ZH_GROUP[sym] : '#eee6dc') : (f ? FINGER_COLOR[f] : '#eee6dc');
      let extra = '';
      const statKey = zh ? sym : k;
      if (heat && statKey && (zh || /^[a-z]$/.test(k))) {
        const r = heat[statKey];
        if (r && r[0] + r[1] >= 5) {
          const rate = r[1] / (r[0] + r[1]);
          if (rate >= 0.25) { bg = '#f28b82'; extra = ' ty-hot'; } else if (rate >= 0.1) { bg = '#f9c7b8'; extra = ' ty-warm'; } else { bg = '#c8ecd3'; }
        } else {
          bg = '#f4efe8';
        }
      }
      const label = LABEL[k] || (k.length === 1 ? k.toUpperCase() : k);
      const inner = zh && sym ? `<b class="ty-zh">${sym}</b><small>${esc(label)}</small>` : esc(zh && k === ' ' ? '空白鍵（一聲）' : label);
      const bump = (k === 'f' || k === 'j') ? '<i class="ty-bump"></i>' : '';
      return `<div class="ty-key${extra}" data-k="${esc(k)}" style="flex:${w};background:${bg}">${inner}${bump}</div>`;
    }).join('') + '</div>').join('') + '</div>';
  }

  function handsHtml() {
    const finger = (id, x, y, w, h) =>
      `<rect class="ty-finger" data-f="${id}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" style="--fc:${FINGER_COLOR[id]}"/>`;
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
    const lessons = M().lessons;
    const nextI = unlockedIndex();
    const weak = nextI >= 2 ? weakKeys(upToSymbols(), 3) : [];
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;
    const intro = mode === 'en'
      ? '手指放在基準鍵（左手 A S D F、右手 J K L ;），看著螢幕、不要看鍵盤。打錯不會往前跳，要打對才繼續。<strong>正確率比速度重要</strong>：95% 以上三顆星。'
      : '看到注音符號，就按鍵盤上對應的那個鍵。鍵盤上大大的字是注音，小小的字是英文字母。<strong>開著微軟注音或英文模式都可以練</strong>。正確率 95% 以上三顆星。';
    return `
      <div class="card-box">
        <div class="ty-modes" role="tablist">
          ${Object.values(MODES).map(m => `<button class="ty-mode ${m.id === mode ? 'on' : ''}" data-mode="${m.id}" role="tab" aria-selected="${m.id === mode}">${m.label}</button>`).join('')}
        </div>
        <button class="ty-test-btn" id="tyTestBtn">🏁 全班測驗／自己挑戰</button>
        <div class="section-title" style="margin-top:12px;"><span>${mode === 'en' ? '⌨️ 英打練習' : 'ㄅ 注音鍵位練習'}</span><span class="ty-today-pill">今天有效練習 ${min} 分 ${sec} 秒</span></div>
        ${coarse ? '<p class="ty-warn">這台裝置看起來沒有接實體鍵盤。打字練習要用真的鍵盤，請接上鍵盤或改用電腦。</p>' : ''}
        <p class="section-sub">${intro}</p>
        ${mode === 'en' ? `<div class="ty-tracks">
          <div class="ty-track on">🔤 26 個字母</div>
          <div class="ty-track">🔢 數字<small>之後開放</small></div>
          <div class="ty-track">⬆️ Shift 大小寫<small>之後開放</small></div>
          <div class="ty-track">❗ 鍵盤符號<small>之後開放</small></div>
        </div>` : ''}
        <div class="ty-grid">
          ${lessons.map((l, i) => {
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
        <div class="section-title"><span>📋 今天的練習紀錄（${mode === 'en' ? '英打' : '注音'}）</span></div>
        <div class="ty-stats">
          <div><b>${min} 分 ${sec} 秒</b><span>有效練習時間</span></div>
          <div><b>${total ? acc + '%' : '—'}</b><span>正確率</span></div>
          <div><b>${d.lessons}</b><span>完成關卡</span></div>
          <div class="${d.mash ? 'bad' : ''}"><b>${d.mash}</b><span>亂按次數</span></div>
        </div>
        <p class="section-sub" style="margin-top:12px;">哪些鍵最常打錯（紅色＝常錯，淺紅＝偶爾錯，綠色＝穩定）：</p>
        ${keyboardHtml({ heat: t.keys })}
        <p class="ty-teacher-link">老師請用 <a href="./teacher.html" target="_blank" rel="noopener">教師頁</a> 產生測驗碼、收成績。</p>
      </div>`;
  }

  function sel(id, label, max, val, fmt) {
    let opts = `<option value="0">${label}</option>`;
    for (let i = 1; i <= max; i++) opts += `<option value="${i}" ${+val === i ? 'selected' : ''}>${fmt(i)}</option>`;
    return `<select id="${id}" class="ty-select" aria-label="${label}">${opts}</select>`;
  }

  function setupHtml() {
    const who = common().who;
    const enMax = Math.max(1, Math.min(14, unlockedIndex('en')));
    const zhDone = unlockedIndex('zh');
    const zhDefault = ZH_SCOPES.filter(sc => zhDone >= ZH_LESSONS.findIndex(l => l.id === sc.upTo) + 1).pop();
    return `
      <div class="card-box ty-setup">
        <div class="section-title"><span>🏁 全班測驗／自己挑戰</span>
          <button class="btn btn-soft" id="tyBack" style="min-height:36px;padding:4px 12px;">← 回到練習</button></div>
        <div class="ty-who">
          <span>我是</span>
          ${sel('tyG', '年級', 12, who.g, i => i + ' 年級')}
          ${sel('tyC', '班', 20, who.c, i => i + ' 班')}
          ${sel('tyS', '座號', 45, who.s, i => i + ' 號')}
        </div>
        ${setupMsg ? `<p class="ty-warn">${esc(setupMsg)}</p>` : ''}
        <div class="ty-setup-grid">
          <div class="ty-setup-box">
            <h3>👩‍🏫 全班測驗</h3>
            <p class="section-sub">輸入老師給的 6 位數測驗碼。同一組碼，全班的題目一模一樣。</p>
            <input id="tyCode" class="ty-code" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="______" aria-label="測驗碼">
            <button class="btn btn-green" id="tyCodeGo" style="width:100%;margin-top:8px;">輸入好了</button>
          </div>
          <div class="ty-setup-box">
            <h3>🙋 自己挑戰</h3>
            <p class="section-sub">規則和全班測驗一樣，程式隨機出題，可以挑戰自己的最高分。</p>
            <div class="ty-self-row">
              <select id="tySelfMode" class="ty-select" aria-label="科目">
                <option value="en">英打</option>
                <option value="zh" ${mode === 'zh' ? 'selected' : ''}>注音</option>
              </select>
              <select id="tySelfMin" class="ty-select" aria-label="時間">
                <option value="1">1 分鐘</option><option value="2">2 分鐘</option><option value="3">3 分鐘</option>
              </select>
            </div>
            <select id="tySelfScopeEn" class="ty-select ty-wide" aria-label="英打範圍" ${mode === 'zh' ? 'hidden' : ''}>
              ${LETTER_LESSONS.slice(0, 14).map((l, i) => `<option value="${i + 1}" ${i + 1 === enMax ? 'selected' : ''}>${i + 1 >= 14 ? '全部 26 個字母' : '考到第 ' + (i + 1) + ' 關（' + MODES.en.before[l.id].toUpperCase() + '）'}</option>`).join('')}
            </select>
            <select id="tySelfScopeZh" class="ty-select ty-wide" aria-label="注音範圍" ${mode === 'zh' ? '' : 'hidden'}>
              ${ZH_SCOPES.map(sc => `<option value="${sc.n}" ${zhDefault && sc.n === zhDefault.n ? 'selected' : ''}>${sc.title}</option>`).join('')}
            </select>
            <button class="btn btn-orange" id="tySelfGo" style="width:100%;margin-top:8px;">開始挑戰</button>
          </div>
        </div>
      </div>`;
  }

  function readyHtml() {
    const { info, self } = pendingTest;
    const who = common().who;
    const rec = common().tests[info.code];
    const best = storeOf(info.mode).best[`${info.mode}-${info.minutes}-${info.scope}`] || 0;
    return `
      <div class="card-box ty-ready">
        <h2>${self ? '🙋 自己挑戰' : '👩‍🏫 全班測驗'}</h2>
        <div class="ty-ready-code">測驗碼 <b>${info.code}</b></div>
        <ul class="ty-ready-list">
          <li>科目：<b>${info.mode === 'en' ? '英打' : '注音鍵位'}</b></li>
          <li>範圍：<b>${esc(info.scopeText)}</b></li>
          <li>時間：<b>${info.minutes} 分鐘</b>（時間到自動結束）</li>
          ${self ? '' : `<li>我是：<b>${who.g} 年級 ${who.c} 班 ${who.s} 號</b></li>`}
          ${rec ? `<li>這組測驗碼你已經測過 <b>${rec.n}</b> 次</li>` : ''}
          ${best ? `<li>個人最佳（同樣的時間和範圍）：<b>${best} 分</b></li>` : ''}
        </ul>
        <p class="section-sub">題目不需要按空白鍵；每 5 個字之間的間隔只是方便看。打錯不會往前跳。<br>得分＝打對的字數 × 正確率。</p>
        <button class="btn btn-green ty-start" id="tyStart">準備好了！按 Enter 開始</button>
        <button class="btn btn-soft" id="tyBack" style="margin-top:8px;">← 取消</button>
      </div>`;
  }

  function textHtml() {
    const n = run.text.length;
    let from = 0;
    let to = n;
    if (n > 60) {
      from = Math.floor(run.pos / TEST_WINDOW) * TEST_WINDOW;
      to = Math.min(n, from + TEST_WINDOW + 20);
    }
    const grouped = !!run.test || mode === 'zh';
    let html = '';
    for (let i = from; i < to; i++) {
      const c = run.text[i];
      const gap = grouped && (i + 1) % 5 === 0 ? ' gap' : '';
      html += `<span class="ty-c${i < run.pos ? ' done' : ''}${i === run.pos ? ' cur' : ''}${run.errAt[i] ? ' err' : ''}${gap}" data-i="${i}">${c === ' ' ? '·' : esc(c)}</span>`;
    }
    run.winFrom = from;
    return html;
  }

  function playHtml() {
    const zh = mode === 'zh';
    return `
      <div class="card-box ty-play${zh ? ' zh' : ''}${run.test ? ' testing' : ''}">
        <div id="tyStatus" class="ty-status"></div>
        <div class="ty-head">
          <span class="ty-title">${esc(run.title)}</span>
          ${run.test ? '<span class="ty-timer" id="tyTimer">--:--</span><span class="ty-live" id="tyLive">打對 0</span>' : `<span class="ty-tip">💡 ${esc(run.tip)}</span>`}
          <button class="btn btn-soft" id="tyQuit">✕ 離開</button>
        </div>
        <div id="tyBanner" class="ty-banner" hidden></div>
        <div class="ty-text${zh ? ' zh' : ''}" id="tyText">${textHtml()}</div>
        <div class="ty-progress"><div id="tyBar" style="width:0%"></div></div>
        <div id="tyFingerName" class="ty-fname"></div>
        <div id="tyCountdown" class="ty-countdown" hidden></div>
        ${keyboardHtml()}
        ${zh ? '' : handsHtml()}
      </div>`;
  }

  function resultHtml() {
    const r = lastResult;
    const lessons = MODES[r.mode].lessons;
    const lesson = lessons.find(l => l.id === r.id);
    const idx = lesson ? lessons.indexOf(lesson) : -1;
    const next = idx >= 0 && idx + 1 < lessons.length && r.stars > 0 ? lessons[idx + 1] : null;
    const sec = Math.round(r.ms / 1000);
    return `
      <div class="card-box ty-result">
        <div class="ty-big-stars">${r.stars ? '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) : '☆☆☆'}</div>
        <h2>${esc(r.title)}</h2>
        <p class="ty-note">${esc(r.note)}</p>
        <div class="ty-stats">
          <div><b>${r.acc}%</b><span>正確率</span></div>
          <div><b>${r.rate}</b><span>${r.mode === 'en' ? '每分鐘字數' : '每分鐘符號數'}</span></div>
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

  function qrSvg(text) {
    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({ cellSize: 5, margin: 8, scalable: true });
    } catch (e) {
      return '';
    }
  }

  function testResultHtml() {
    const r = lastResult;
    const who = r.self ? '' : `${r.g} 年級 ${r.c} 班 ${r.s} 號`;
    return `
      <div class="card-box ty-result ty-test-result">
        <h2>${r.self ? '🙋 自己挑戰' : '👩‍🏫 全班測驗'}結束！</h2>
        ${who ? `<div class="ty-who-big">${who}</div>` : ''}
        <div class="ty-score"><b>${r.score}</b><span>分</span></div>
        ${r.newBest ? '<p class="ty-note">🎉 打破你的個人最佳了！</p>' : ''}
        <div class="ty-test-meta">測驗碼 <b>${r.code}</b>　｜　第 <b class="${r.attempt > 1 ? 'bad' : ''}">${r.attempt}</b> 次　｜　${esc(r.info.scopeText)}　${r.info.minutes} 分鐘</div>
        ${r.self ? '' : `<div class="ty-qr">${qrSvg(r.qr)}</div><p class="section-sub">請把這個畫面留著，等老師用手機掃描 QR Code 收成績。</p>`}
        <div class="ty-stats">
          <div><b>${r.acc}%</b><span>正確率</span></div>
          <div><b>${r.ok}</b><span>打對的${r.mode === 'en' ? '字' : '符號'}</span></div>
          <div><b>${r.rate}</b><span>${r.mode === 'en' ? '每分鐘字數' : '每分鐘符號數'}</span></div>
          <div class="${r.mash ? 'bad' : ''}"><b>${r.mash}</b><span>亂按次數</span></div>
        </div>
        ${r.xp ? `<p class="section-sub">獲得 +${r.xp} 經驗值</p>` : ''}
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px;">
          <button class="btn btn-soft" id="tyHome">完成</button>
          ${r.self ? '<button class="btn btn-orange" id="tyAgainSelf">🔁 再挑戰一次</button>' : ''}
        </div>
      </div>`;
  }

  function render() {
    if (!pane) return;
    document.body.classList.toggle('ty-playing', view === 'play' && pane.offsetParent !== null);
    const html = { play: playHtml, result: resultHtml, testsetup: setupHtml, ready: readyHtml, testresult: testResultHtml }[view];
    pane.innerHTML = html ? html() : homeHtml();
    pane.querySelectorAll('[data-lesson]').forEach(b => b.addEventListener('click', () => startLesson(b.dataset.lesson)));
    pane.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; render(); }));
    const on = (id, fn) => { const el = pane.querySelector('#' + id); if (el) el.addEventListener('click', fn); };
    on('tyQuit', quit);
    on('tyHome', () => { view = 'home'; render(); });
    on('tyBack', () => { view = 'home'; pendingTest = null; setupMsg = ''; render(); });
    on('tyTestBtn', () => { view = 'testsetup'; setupMsg = ''; render(); });
    on('tyStart', startTest);
    on('tyAgainSelf', () => {
      const i = lastResult.info;
      prepareTest(makeCode(i.mode, i.minutes, i.scope), true);
    });
    if (view === 'testsetup') bindSetup();
    if (view === 'play') {
      renderProgress(true);
      renderStatus();
      renderBanner();
      renderTimer();
    }
  }

  function bindSetup() {
    const c = common();
    ['tyG', 'tyC', 'tyS'].forEach((id, i) => {
      const el = pane.querySelector('#' + id);
      el.addEventListener('change', () => { c.who[['g', 'c', 's'][i]] = +el.value; api.save(); });
    });
    const codeEl = pane.querySelector('#tyCode');
    const go = () => {
      const info = parseCode(codeEl.value);
      if (!info) { setupMsg = '測驗碼不對，請再看一次黑板上的 6 位數。'; render(); return; }
      setupMsg = '';
      prepareTest(info.code, false);
    };
    pane.querySelector('#tyCodeGo').addEventListener('click', go);
    codeEl.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.stopPropagation(); go(); } });
    const modeSel = pane.querySelector('#tySelfMode');
    const en = pane.querySelector('#tySelfScopeEn');
    const zh = pane.querySelector('#tySelfScopeZh');
    modeSel.addEventListener('change', () => { en.hidden = modeSel.value !== 'en'; zh.hidden = modeSel.value !== 'zh'; });
    pane.querySelector('#tySelfGo').addEventListener('click', () => {
      const m = modeSel.value;
      const scope = +(m === 'en' ? en.value : zh.value);
      prepareTest(makeCode(m, +pane.querySelector('#tySelfMin').value, scope), true);
    });
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

  function renderTimer() {
    if (!run || !run.test || !pane) return;
    const now = Date.now();
    const cd = pane.querySelector('#tyCountdown');
    if (now < run.test.startAt) {
      if (cd) { cd.hidden = false; cd.textContent = Math.ceil((run.test.startAt - now) / 1000); }
    } else if (cd && !cd.hidden) {
      cd.hidden = true;
    }
    const left = Math.max(0, run.test.endAt - Math.max(now, run.test.startAt));
    const tm = pane.querySelector('#tyTimer');
    if (tm) {
      const s = Math.ceil(left / 1000);
      tm.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      tm.classList.toggle('low', s <= 10);
    }
    const live = pane.querySelector('#tyLive');
    if (live) live.textContent = '打對 ' + run.ok;
    if (now >= run.test.endAt) finishTest();
  }

  function renderProgress(ok) {
    if (!pane || !run) return;
    const box = pane.querySelector('#tyText');
    const n = run.text.length;
    if (box && n > 60 && Math.floor(run.pos / TEST_WINDOW) * TEST_WINDOW !== run.winFrom) box.innerHTML = textHtml();
    const spans = pane.querySelectorAll('#tyText .ty-c');
    spans.forEach(s => {
      const i = +s.dataset.i;
      s.classList.toggle('done', i < run.pos);
      s.classList.toggle('cur', i === run.pos);
      s.classList.toggle('err', !!run.errAt[i]);
      if (i === run.pos && !ok) { s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
    });
    const bar = pane.querySelector('#tyBar');
    if (bar) {
      if (run.test) {
        const tot = run.test.endAt - run.test.startAt;
        bar.style.width = Math.min(100, Math.max(0, (Date.now() - run.test.startAt) / tot * 100)) + '%';
      } else {
        bar.style.width = (run.pos / n * 100) + '%';
      }
    }
    const want = run.text[run.pos];
    const phys = mode === 'zh' ? KEY_OF_ZH[want] : want;
    pane.querySelectorAll('.ty-key.next').forEach(k => k.classList.remove('next'));
    const keyEl = phys != null ? pane.querySelector(`.ty-key[data-k="${CSS.escape(phys)}"]`) : null;
    if (keyEl) keyEl.classList.add('next');
    const fn = pane.querySelector('#tyFingerName');
    if (mode === 'zh') {
      if (fn) fn.textContent = phys ? `下一個：${want}　按鍵盤上的「${phys.toUpperCase()}」` : '';
    } else {
      const f = FINGER_OF[want];
      pane.querySelectorAll('.ty-finger').forEach(el => el.classList.toggle('on', el.dataset.f === f));
      if (fn) fn.textContent = f ? `下一個：${want === ' ' ? '空白鍵' : want.toUpperCase()}　用${FINGER_NAME[f]}` : '';
    }
    renderStatus();
  }

  function flashKey(k) {
    if (!pane || !k) return;
    const el = pane.querySelector(`.ty-key[data-k="${CSS.escape(String(k).toLowerCase())}"]`);
    if (!el) return;
    el.classList.remove('bad');
    void el.offsetWidth;
    el.classList.add('bad');
  }

  function onKeyDown(ev) {
    if (!pane || pane.offsetParent === null) return;
    const tag = ev.target && ev.target.tagName;
    if ((tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') && view !== 'play') return;
    handleKey(ev);
  }

  // ── 對外 ──────────────────────────────────────────────────
  window.PuppyTyping = {
    mount(el, hooks) {
      pane = el;
      api = hooks;
      window.addEventListener('keydown', onKeyDown);
      if (!ticker) {
        ticker = setInterval(() => {
          if (view !== 'play') return;
          renderStatus();
          if (run && run.test) { renderTimer(); if (run) renderProgress(true); }
        }, 250);
      }
    },
    show() { if (view === 'play' && api.focus) api.focus(true); render(); },
    hide() { document.body.classList.remove('ty-playing'); if (view === 'play' && api.focus) api.focus(false); },
    isPlaying() { return view === 'play'; },
    // 給 teacher.html 用（同一套測驗碼）
    parseCode, makeCode, ZH_SCOPES, LETTER_LESSONS, QR_KEY,
    // 自動測試用
    _t: {
      LETTER_LESSONS, ZH_LESSONS, FINGER_OF, LETTERS_BEFORE, ZH_OF_KEY, KEY_OF_ZH, CODE_KEY, MODES,
      makeText, makeRun, startLesson, handleKey, starsFor, unlockedIndex, parseCode, makeCode, testText, scoreOf, qrPayload,
      prepareTest, startTest, finishTest, common,
      run: () => run, result: () => lastResult, view: () => view, status, quit, data,
      setRun: patch => Object.assign(run, patch), setMode: m => { mode = m; }
    }
  };
})();
