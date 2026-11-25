// 《汪汪小精靈 學習小伙伴》打字練習（v3.7.0：英打＋注音鍵位＋中文打字＋全班測驗／自己挑戰）
//
// 設計重點（給接手的人）：
//   ‧ 對象：國小四年級起。重點是正確的手指（英打）、正確的鍵位（注音）和正確率，速度只當參考。
//   ‧ 練習畫面：要打的字 → 虛擬鍵盤（下一個鍵發亮）→ 虛擬雙手（英打才有；注音不教指法）。
//   ‧ 打錯不會往前跳，要打對才繼續（TypingClub 的做法）；一次加一兩個新鍵（Keybr 的做法）。
//   ‧ 顏色帶（偏寬鬆）：🟢 穩定、🟡 錯誤比較多或休息中、🔴 只有亂按或一直按住。亂按那一段不算分。
//   ‧ 全班測驗：老師在 teacher.html 產生 6 位數測驗碼，全班輸入同一組碼就拿到同一份題目。
//     測驗碼（v3.7.6）＝第 1 碼科目（1 英打、2 注音鍵位、3 中文）＋第 2 碼時間（20 秒、1、2、3、4、5、8、10 分鐘）＋第 3～4 碼範圍＋第 5～6 碼題目編號。
//   ‧ 中文打字（v3.7.0）：學生開著真的微軟注音打進輸入框，程式只比對送出的字（用最長共同子序列對齊），
//     打錯可以繼續往下打、最後一起算；半形標點算錯並提醒；不能貼上。題目在 zh_texts.js（Claude 原創）。
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
  const CODE_KEY = { Comma: ',', Period: '.', Semicolon: ';', Slash: '/', Minus: '-', Space: ' ',
    Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Quote: "'", Backquote: '`' };
  for (let i = 0; i < 10; i++) CODE_KEY['Digit' + i] = String(i);
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(c => { CODE_KEY['Key' + c.toUpperCase()] = c; });
  // 注音分組的顏色（注音不教指法，用顏色幫忙記區域）
  const ZH_GROUP = {};
  'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ'.split('').forEach(c => { ZH_GROUP[c] = '#a9d6f2'; });
  'ㄧㄨㄩ'.split('').forEach(c => { ZH_GROUP[c] = '#b9e4a8'; });
  'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ'.split('').forEach(c => { ZH_GROUP[c] = '#fbcf9c'; });
  'ˊˇˋ˙'.split('').forEach(c => { ZH_GROUP[c] = '#d4ccf5'; });
  // v3.12.2：鍵用手指顏色，鍵上的注音符號用分類顏色（深色字，淺色鍵上才看得清楚）
  const ZH_INK = { '#a9d6f2': '#1d5f9e', '#b9e4a8': '#1f7a3c', '#fbcf9c': '#b44e00', '#d4ccf5': '#6a45c9' };
  const ZH_LEGEND = '<div class="ty-zh-legend" aria-hidden="true">符號的顏色：<b style="color:#1d5f9e">聲母</b>　<b style="color:#1f7a3c">介音</b>　<b style="color:#b44e00">韻母</b>　<b style="color:#6a45c9">聲調</b>　<span class="ty-zh-legend-more">（鍵的底色＝用哪根手指）</span></div>';

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
  const CN_LESSONS = [
    { id: 'C01', title: '常用詞語', tip: '詞語之間用頓號「、」隔開，最後打句號「。」。', kind: 'words' },
    { id: 'C02', title: '短句', tip: '每一句最後都有標點，記得用全形。', kind: 'sentences' },
    { id: 'C03', title: '短文', tip: '打錯可以繼續往下打，最後一起算。', kind: 'passages' },
    { id: 'C04', title: '標點符號挑戰', tip: '有引號「」、冒號：、分號；、括號（），不會打的看右邊的提示卡。', kind: 'punct' }
  ];
  const CN_SCOPES = [
    { n: 1, title: '短句', kind: 'sentences' },
    { n: 2, title: '一般短文', kind: 'passages' },
    { n: 3, title: '標點比較多的短文', kind: 'punct' }
  ];
  // 各科目的測驗時間（分鐘）：測驗碼第 1 碼依序是 1～3、4～6、7～9
  // v3.7.6：三種科目的測驗時間都一樣（秒）。測驗碼第 2 碼＝第幾個時間（1～8）
  const TIMES = [20, 60, 120, 180, 240, 300, 480, 600];
  const SUBJ_DIGIT = { en: 1, zh: 2, cn: 3 };
  const DEFAULT_SECS = { en: 60, zh: 60, cn: 180 };
  function timeLabel(secs) { return secs < 60 ? secs + ' 秒' : (secs / 60) + ' 分鐘'; }
  const HALF_PUNCT = /[,.;:?!()"'<>\[\]]/;
  const CN_FAST = 120;           // 中文一分鐘超過 120 字，視為不合理（可能貼上或語音）
  function before(lessons) {
    const out = {};
    let acc = '';
    lessons.forEach(l => { acc += l.add; out[l.id] = acc; });
    return out;
  }
  const MODES = {
    en: { id: 'en', store: 'typing', lessons: LETTER_LESSONS, before: before(LETTER_LESSONS), label: '🔤 英文打字' },
    zh: { id: 'zh', store: 'zhuyin', lessons: ZH_LESSONS, before: before(ZH_LESSONS), label: 'ㄅ 注音鍵位' },
    cn: { id: 'cn', store: 'chinese', lessons: CN_LESSONS, before: {}, label: '中 中文打字' }
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
  // v3.7.6 測驗碼（6 碼）：第 1 碼＝科目（1 英打、2 注音鍵位、3 中文打字）、第 2 碼＝時間（1～8 對應 TIMES）、
  //   第 3～4 碼＝範圍、第 5～6 碼＝題目編號。v3.7.5 以前的舊測驗碼不能再用。
  // 回傳 { code, mode, secs, minutes, timeText, scope, seed, symbols, scopeText } 或 null（碼不對）
  function parseCode(code) {
    const s = String(code || '').replace(/\D/g, '');
    if (!/^[1-3][1-8]\d{4}$/.test(s)) return null;
    const mode = ['en', 'zh', 'cn'][+s[0] - 1];
    const secs = TIMES[+s[1] - 1];
    const scope = +s.slice(2, 4);
    const seed = +s.slice(4);
    let symbols = '';
    let scopeText;
    if (mode === 'en') {
      if (scope < 1 || scope > 14) return null;
      symbols = MODES.en.before[LETTER_LESSONS[scope - 1].id];
      scopeText = scope >= 14 ? '全部 26 個字母' : `${scope === 1 ? '第 1 關' : `第 1～${scope} 關`}的字母（${symbols.toUpperCase().split('').join(' ')}）`;
    } else if (mode === 'zh') {
      const sc = ZH_SCOPES.find(x => x.n === scope);
      if (!sc) return null;
      symbols = MODES.zh.before[sc.upTo];
      scopeText = sc.title;
    } else {
      const sc = CN_SCOPES.find(x => x.n === scope);
      if (!sc) return null;
      scopeText = sc.title;
    }
    return { code: s, mode, secs, minutes: secs / 60, timeText: timeLabel(secs), scope, seed, symbols, scopeText };
  }

  // secs：測驗秒數（必須是 TIMES 裡的值，不是的話用最接近的）
  function makeCode(m, secs, scope, seed) {
    let idx = TIMES.indexOf(+secs);
    if (idx < 0) idx = TIMES.reduce((b, t, k) => (Math.abs(t - secs) < Math.abs(TIMES[b] - secs) ? k : b), 0);
    const sd = seed == null ? Math.floor(Math.random() * 100) : seed % 100;
    return String(SUBJ_DIGIT[m]) + String(idx + 1) + String(scope).padStart(2, '0') + String(sd).padStart(2, '0');
  }

  function zhTexts() { return window.PUPPY_ZH_TEXTS || { words: [], sentences: [], passages: [], punct: [] }; }

  // 中文題目：把同一類的句子或短文洗牌後接起來，直到夠長
  function cnText(kind, len, rnd) {
    const r = rnd || Math.random;
    const pool = (zhTexts()[kind] || []).slice();
    if (!pool.length) return '';
    if (kind === 'words') {
      const out = [];
      while (out.length < len) {
        const w = pool[Math.floor(r() * pool.length)];
        if (out[out.length - 1] !== w) out.push(w);
      }
      return out.join('、') + '。';
    }
    let out = '';
    let bag = [];
    let last = '';
    while (out.length < len) {
      if (!bag.length) {
        bag = pool.slice();
        for (let i = bag.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [bag[i], bag[k]] = [bag[k], bag[i]]; }
        if (bag[0] === last && bag.length > 1) bag.push(bag.shift());
      }
      last = bag.shift();
      out += last;
    }
    return out;
  }

  function testText(info) {
    // 同一組碼一定得到同一份題目（種子包含整組碼）
    const rnd = seeded(parseInt(info.code, 10));
    const mins = Math.max(info.minutes, 0.5);
    if (info.mode === 'cn') return cnText(CN_SCOPES.find(x => x.n === info.scope).kind, Math.ceil(mins * 70), rnd);
    return makeRun(info.symbols, '', Math.ceil(mins * (info.mode === 'zh' ? 120 : 220)), rnd);
  }

  // 中文比對：打出來的字和題目用「最長共同子序列」對齊
  // 回傳 { ok, miss, covered, hit:[題目第幾個字有打對] }
  function cnCompare(target, typed) {
    const t = Array.from(target);
    const y = Array.from(typed);
    const m = y.length;
    const n = Math.min(t.length, m + 30);
    if (!m) return { ok: 0, miss: 0, covered: 0, hit: [] };
    const W = n + 1;
    const dp = new Uint16Array((m + 1) * W);
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i * W + j] = y[i - 1] === t[j - 1] ? dp[(i - 1) * W + j - 1] + 1 : Math.max(dp[(i - 1) * W + j], dp[i * W + j - 1]);
      }
    }
    // 找出打到題目的哪裡：對齊到最後一個打對的字，後面多打的字當成打錯的字
    let bestJ = 0;
    for (let j = 0; j <= n; j++) if (dp[m * W + j] > dp[m * W + bestJ]) bestJ = j;
    const hit = [];
    let i = m;
    let j = bestJ;
    let lastTyped = 0;
    while (i > 0 && j > 0) {
      if (y[i - 1] === t[j - 1] && dp[i * W + j] === dp[(i - 1) * W + j - 1] + 1) {
        hit[j - 1] = true;
        if (!lastTyped) lastTyped = i;
        i--; j--;
      } else if (dp[(i - 1) * W + j] >= dp[i * W + j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    const ok = dp[m * W + bestJ];
    const covered = Math.min(t.length, bestJ + (m - lastTyped));
    const miss = Math.max(m, covered) - ok;
    return { ok, miss, covered, hit };
  }

  // v3.9.4：中文打字除了「，。」以外的標點，每打對一個多 1 分（bonus）；正確率照原本算
  const BONUS_PUNCT = /[、；：？！「」『』（）《》〈〉…—～]/;
  function scoreOf(ok, miss, bonus) {
    const tot = ok + miss;
    if (!tot) return 0;
    return Math.round((ok + (bonus || 0)) * (ok / tot));
  }

  // 給老師掃描的成績資料：PZT1|測驗碼|年|班|座|第幾次|得分|對|錯|正確率×10|每分鐘|亂按|自己挑戰|時間|檢查碼
  // v3.8.1：QR 內容縮短，而且只用數字、大寫字母和點（QR 的「英數模式」），
  //   QR 的格子少很多、每格變大，老師的手機遠一點、斜一點也掃得到。
  //   Z3.測驗碼.年.班.座.第幾次.打對.打錯.亂按.自己挑戰.標點加分.時間(yyMMddHHmm).檢查碼（v3.9.4；舊版 Z2 沒有標點加分）
  //   得分、正確率、速度都可以從打對／打錯和測驗碼算回來，所以不放進去。
  function qrPayload(r) {
    // v3.9.4：Z3 多一欄「標點加分」；老師頁 Z2、Z3 都讀得懂
    const body = ['Z3', r.code, r.g, r.c, r.s, r.attempt, r.ok, r.miss, r.mash, r.self ? 1 : 0, r.bonus || 0, String(r.when).slice(-10)].join('.');
    const chk = window.PuppyStamp ? window.PuppyStamp.code(QR_KEY, body) : '000000';
    return body + '.' + chk;
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
  // v3.9.4：認真練習 5 分鐘，狗狗吃一塊骨頭餅乾（一天最多 3 次）
  // 「認真」＝有效練習時間（發呆、離開不算）；正確率低於 70% 的那一回不算；被抓到亂按，每次扣 10 秒
  const TREAT_MS = 5 * 60000, TREAT_MAX = 3, TREAT_MIN_ACC = 70;
  function treatBox() {
    const c = common();
    const d = todayStr();
    if (!c.treat || typeof c.treat !== 'object' || c.treat.day !== d) c.treat = { day: d, ms: 0, n: 0 };
    return c.treat;
  }
  function creditSerious(ms, acc, mash) {
    const tb = treatBox();
    if (!(acc >= TREAT_MIN_ACC)) return 0;
    tb.ms += Math.max(0, Math.round(ms) - (mash || 0) * 10000);
    let got = 0;
    while (tb.n < TREAT_MAX && tb.ms >= (tb.n + 1) * TREAT_MS) { tb.n += 1; got += 1; }
    if (got && api.treat) { try { api.treat(got, tb.n); } catch (e) { /* 忽略 */ } }
    return got;
  }
  function treatLine(got) {
    const tb = treatBox();
    if (got) return `<p class="ty-treat">🦴 認真練習滿 ${tb.n * 5} 分鐘！狗狗吃到骨頭餅乾${got > 1 ? ` ×${got}` : ''}（飽足 +15、親密度 +2）・今天 ${tb.n}／${TREAT_MAX}</p>`;
    return '';
  }
  function treatPill() {
    const tb = treatBox();
    if (tb.n >= TREAT_MAX) return `<span class="ty-treat-pill done">🦴 今天的骨頭餅乾都拿到了（${TREAT_MAX}／${TREAT_MAX}）</span>`;
    const left = Math.max(0, Math.ceil(((tb.n + 1) * TREAT_MS - tb.ms) / 60000));
    return `<span class="ty-treat-pill">🦴 再認真練習約 ${left} 分鐘，狗狗可以吃骨頭餅乾（今天 ${tb.n}／${TREAT_MAX}）</span>`;
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

  // ── v3.7.6 測驗模式：全螢幕、狗狗和其他按鈕都藏起來；全班測驗結束後鎖在 QR 畫面，要老師的解除密碼 ──
  let exam = false;
  // v3.9.2：測驗結束超過 20 分鐘自動解除；學生也可以按角落的「離開」（會再確認一次）
  const LOCK_MAX_MS = 20 * 60000;
  function lockExpired(lk) { return !!(lk && lk.at && Date.now() - lk.at > LOCK_MAX_MS); }
  function releaseLock() {
    delete common().lock;
    api.save();
    leaveExam();
    view = 'home';
    render();
  }
  function showLastTest() {
    const lt = common().lastTest;
    const li = lt && lt.res && parseCode(lt.res.code);
    if (!li) return;
    mode = li.mode;
    lastResult = Object.assign({ test: true, mode: li.mode, info: li, xp: lt.xp || 0, qr: lt.qr, review: true }, lt.res);
    view = 'testresult';
    render();
  }

  function unlockCode(code) {
    const c = window.PuppyStamp ? window.PuppyStamp.code(QR_KEY, 'UNLOCK|' + code) : '000000';
    return String(c).slice(-4);
  }
  function enterExam() {
    exam = true;
    document.body.classList.add('ty-exam');
    goFullscreen();
  }
  function goFullscreen() {
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) {
        el.requestFullscreen().then(() => {
          // Chrome／Edge 全螢幕時可以攔下 Win 鍵、Esc 等系統鍵（作業系統允許的才行）
          // v3.9.3：只攔 Win、Esc、Tab、Alt、F1～F12；Ctrl、Shift、空白鍵不攔，學生才能用 Ctrl＋Shift、Shift 換輸入法
          const LOCK_KEYS = ['MetaLeft', 'MetaRight', 'Escape', 'Tab', 'AltLeft', 'AltRight', 'ContextMenu'].concat(Array.from({ length: 12 }, (_, i) => 'F' + (i + 1)));
          try { if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(LOCK_KEYS).catch(() => {}); } catch (e) { /* 忽略 */ }
        }).catch(() => {});
      }
    } catch (e) { /* 忽略 */ }
  }
  function leaveExam() {
    exam = false;
    document.body.classList.remove('ty-exam');
    try { if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock(); } catch (e) { /* 忽略 */ }
    try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) { /* 忽略 */ }
  }
  function fsBarHtml() {
    return exam ? '<button class="ty-fs-bar" id="tyFsBar" hidden>🖥 離開全螢幕了！按這裡回到全螢幕繼續</button>' : '';
  }
  function updateFsBar() {
    const b = pane && pane.querySelector('#tyFsBar');
    if (b) b.hidden = !exam || !!document.fullscreenElement || !document.fullscreenEnabled;
  }
  document.addEventListener('fullscreenchange', () => {
    // 測驗進行中離開全螢幕：記一次可疑操作（老師在成績表的「亂按」欄看得到）
    if (exam && !document.fullscreenElement && view === 'play' && run && run.test && Date.now() >= run.test.startAt) {
      run.mash += 1;
      run.redUntil = Date.now() + RED_MS;
      run.redWhy = '離開全螢幕了，請按上面的按鈕回去';
      renderStatus();
    }
    updateFsBar();
  });

  function scrollTop() {
    try { pane.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); } catch (e) { /* 忽略 */ }
  }

  function startLesson(lessonId) {
    if (/^Z/.test(lessonId)) mode = 'zh';
    else if (/^L/.test(lessonId)) mode = 'en';
    else if (/^C/.test(lessonId)) mode = 'cn';
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
      const symbols = M().before[lesson.id] || '';
      if (mode === 'cn') {
        text = cnText(lesson.kind, { words: 14, sentences: 36, passages: 55, punct: 55 }[lesson.kind]);
      } else if (mode === 'en') {
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
    focusInput();
  }

  function focusInput() {
    const box = pane && pane.querySelector('#tyInput');
    if (box && !box.disabled) { try { box.focus({ preventScroll: true }); } catch (e) { box.focus(); } }
  }

  // ── 中文打字：輸入框 ──────────────────────────────────────
  let composing = false;
  // v3.9.3：網頁讀不到電腦現在用哪個輸入法，只能從學生打出來的字「猜」
  let imeGuess = '';          // '' 還不知道／zh 中文注音／en 英文／full 全形英數／halfp 半形符號
  let compSince = 0, compData = '', bannerKind = '';
  const IME_TEXT = {
    '': ['ime-unknown', '⚪ 輸入法：還不知道，先打一個字看看'],
    zh: ['ime-ok', '🟢 輸入法：中文（注音）'],
    en: ['ime-bad', '🔴 輸入法：英文 → 請按一下 Shift 換回中文'],
    full: ['ime-bad', '🟠 輸入法：全形英數 → 請按一下 Shift 換回中文'],
    halfp: ['ime-warn', '🟠 打出半形符號了 → 標點要用全形（看提示卡）']
  };
  function guessFrom(text) {
    const t = String(text || '');
    if (!t) return '';
    if (/[A-Za-z]/.test(t)) return 'en';
    if (/[Ａ-Ｚａ-ｚ]/.test(t)) return 'full';
    if (/[\u3400-\u9fff\u3105-\u3129]/.test(t)) return 'zh';
    if (HALF_PUNCT.test(t)) return 'halfp';
    return '';
  }
  function setIme(g) {
    if (g === undefined || g === imeGuess) return;
    imeGuess = g;
    if (!pane) return;
    pane.querySelectorAll('.ty-ime-chip').forEach(el => { const [cls, txt] = IME_TEXT[imeGuess] || IME_TEXT['']; el.className = 'ty-ime-chip ' + cls; el.textContent = txt; });
  }
  function imeChipHtml() { const [cls, txt] = IME_TEXT[imeGuess] || IME_TEXT['']; return `<span class="ty-ime-chip ${cls}">${txt}</span>`; }
  const IME_KEYS_HTML = '<div class="ty-ime-keys">換輸入法：<kbd>Shift</kbd> 中／英　<kbd>Shift</kbd>＋<kbd>Space</kbd> 全形／半形　<kbd>Ctrl</kbd>＋<kbd>Shift</kbd> 換別的輸入法（換到「微軟注音」）</div>';
  // 微軟注音打完沒按 Enter：字還在輸入法的框框裡，沒有送進來
  function checkUnsent() {
    if (mode !== 'cn' || !run || view !== 'play') return;
    const now = Date.now();
    const stuck = composing && compSince && (now - compSince > 8000 || compData.length >= 10);
    if (stuck && bannerKind !== 'enter') {
      bannerKind = 'enter';
      banner = '⚠️ 字還沒送出！打完要按 Enter，字才會跑進框框裡、才會算分！';
      renderBanner();
    } else if (!stuck && bannerKind === 'enter') {
      bannerKind = ''; banner = ''; renderBanner();
    }
  }
  function cnEvaluate(value) {
    if (!run || mode !== 'cn') return null;
    const now = Date.now();
    if (run.test && now < run.test.startAt) return null;
    const typed = String(value).replace(/[\r\n]/g, '');
    const fresh = typed.slice(run.typed ? run.typed.length : 0);
    if (!run.started) { run.started = now; run.last = now; }
    run.activeMs += Math.min(GAP_CAP_MS, now - run.last);
    run.last = now;
    setIme(guessFrom(fresh) || imeGuess);
    let nb = '';
    if (/[A-Za-z]/.test(fresh)) nb = '⚠ 打出英文字母了：請按一下 Shift，切換回中文（注音）。';
    else if (HALF_PUNCT.test(fresh)) nb = '⚠ 這是半形符號，算打錯喔！請改用全形符號（例如 ，。？），看右邊的提示卡。';
    if (nb) { banner = nb; renderBanner(); run.bannerAt = now; } else if (banner && now - (run.bannerAt || 0) > 4000) { banner = ''; renderBanner(); }
    run.typed = typed;
    const c = cnCompare(run.text.join(''), typed);
    run.ok = c.ok;
    run.miss = c.miss;
    run.pos = c.covered;
    run.errAt = {};
    run.bonus = 0;
    for (let i = 0; i < c.covered; i++) {
      if (!c.hit[i]) run.errAt[i] = true;
      else if (BONUS_PUNCT.test(run.text[i])) run.bonus++;
    }
    run.recent = [];
    for (let i = Math.max(0, c.covered - 20); i < c.covered; i++) run.recent.push(!!c.hit[i]);
    // 速度不合理（貼上、語音、手寫輸入）：測驗 20 秒以後才判斷
    const startedAt = run.test ? run.test.startAt : run.started;
    const mins = (now - startedAt) / 60000;
    if (mins > 1 / 3 && c.ok / mins > CN_FAST && !run.fastFlag) {
      run.fastFlag = true;
      run.mash += 1;
      run.redUntil = now + RED_MS;
      run.redWhy = '速度不太合理，請自己一個字一個字打';
    }
    if (!run.test && c.covered >= run.text.length) { finish(); return c; }
    renderProgress(true);
    return c;
  }

  function cnBlock(why) {
    if (!run) return;
    run.mash += 1;
    today().mash += 1;
    run.redUntil = Date.now() + RED_MS;
    run.redWhy = why;
    renderStatus();
  }

  function bindCnInput() {
    const box = pane.querySelector('#tyInput');
    if (!box) return;
    box.addEventListener('compositionstart', () => { composing = true; compSince = Date.now(); compData = ''; setIme('zh'); });
    box.addEventListener('compositionupdate', ev => { compData = String(ev.data || ''); });
    box.addEventListener('compositionend', () => { composing = false; compSince = 0; compData = ''; if (bannerKind === 'enter') { bannerKind = ''; banner = ''; renderBanner(); } cnEvaluate(box.value); });
    box.addEventListener('input', ev => {
      if (ev.isComposing || composing) return;
      if (ev.inputType && ev.inputType.indexOf('delete') === 0 && run) run.deletes = (run.deletes || 0) + 1;
      cnEvaluate(box.value);
    });
    box.addEventListener('beforeinput', ev => {
      if (ev.inputType === 'insertFromPaste' || ev.inputType === 'insertFromDrop') { ev.preventDefault(); cnBlock('不能用貼上，請自己打'); }
    });
    ['paste', 'drop'].forEach(t => box.addEventListener(t, ev => { ev.preventDefault(); cnBlock('不能用貼上，請自己打'); }));
    box.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' && !ev.isComposing && ev.keyCode !== 229) ev.preventDefault();
      ev.stopPropagation();
    });
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
    enterExam();
    if (api.focus) api.focus(true);   // v3.7.5：準備畫面也讓狗狗躲到角落，不擋按鈕
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
      test: { info, self, attempt: rec.n, startAt: now + 3000, endAt: now + 3000 + info.secs * 1000 }
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

  // 把按鍵換成「要比對的字」。v3.7.6：英打也只看「實際按下哪一個鍵」（ev.code），
  // 所以開著中文輸入法、大寫鎖定、按著 Shift 都不影響判斷。
  function keyChar(ev) {
    const k = CODE_KEY[ev.code] || (typeof ev.key === 'string' && ev.key.length === 1 ? ev.key.toLowerCase() : '');
    if (mode === 'zh') return { phys: k, ch: ZH_OF_KEY[k] || '' };
    return { phys: k, ch: k };
  }

  // 回傳 'ok'／'miss'／'ignored'／'mash'／'ime'／'start'（給自動測試用）
  function handleKey(ev) {
    if (view === 'ready' && ev.key === 'Enter') {
      if (ev.preventDefault) ev.preventDefault();
      startTest();
      return 'start';
    }
    if (view !== 'play' || !run) return 'ignored';
    if (mode === 'cn') return 'ignored';
    // v3.9.3：Ctrl＋Shift、Ctrl＋空白鍵是換輸入法的鍵，放行（不擋、不算對錯）
    if (ev.ctrlKey && !ev.altKey && !ev.metaKey && (ev.key === 'Shift' || ev.key === 'Control' || ev.code === 'Space' || ev.key === ' ')) return 'ignored';
    // Ctrl／Alt／Win 組合鍵：擋掉瀏覽器的快速鍵（例如 Ctrl＋W 關分頁），不算對錯
    if (ev.ctrlKey || ev.altKey || ev.metaKey || /^(Meta|OS|Alt|Control|ContextMenu)/.test(ev.code || '')) {
      if (ev.preventDefault) ev.preventDefault();
      return 'ignored';
    }
    const now = Date.now();
    if (run.test && now < run.test.startAt) return 'ignored';
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
    if (!run.started) { run.started = now; run.last = now; }
    run.activeMs += Math.min(GAP_CAP_MS, now - run.last);
    run.last = now;

    const want = run.text[run.pos];
    const inMash = now < run.redUntil;
    if (ch === want) {
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
    const rate = Math.round(mode === 'en' ? run.text.length / 5 / minutes : mode === 'cn' ? run.ok / minutes : run.text.length / minutes);
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
    const treat = creditSerious(run.activeMs, acc, run.mash);
    lastResult = { id: run.id, mode, title: run.title, acc, rate, stars, xp, gotStars, note, weakHere, mash: run.mash, ms: run.activeMs, ok: run.ok, miss: run.miss, treat };
    run = null;
    view = 'result';
    if (api.focus) api.focus(false);
    api.save();
    if (xp > 0) api.award(xp, gotStars, 'typing', `${SUBJ[mode]}練習：${lastResult.title}`);
    render();
  }

  function finishTest() {
    if (!run || !run.test) return;
    // v3.9.3：時間到時還沒按 Enter 的字（在輸入法框框裡），對學生有利：一起算
    if (mode === 'cn' && pane) {
      const box = pane.querySelector('#tyInput');
      if (box && box.value && box.value !== run.typed) { try { cnEvaluate(box.value); } catch (e) { /* 忽略 */ } }
      composing = false; compSince = 0; compData = ''; bannerKind = '';
    }
    const test = run.test;
    const info = test.info;
    const d = saveKeyStats();
    d.ms += info.secs * 1000;
    const total = run.ok + run.miss;
    const acc = total ? Math.round(run.ok / total * 1000) / 10 : 0;
    const bonus = mode === 'cn' ? (run.bonus || 0) : 0;
    const score = scoreOf(run.ok, run.miss, bonus);
    const rate = Math.round(mode === 'en' ? run.ok / 5 / info.minutes : run.ok / info.minutes);
    const c = common();
    const rec = c.tests[info.code] || { n: test.attempt, best: 0 };
    const firstScore = !rec.done;
    rec.best = Math.max(rec.best || 0, score);
    rec.done = true;
    c.tests[info.code] = rec;
    const bkey = `${info.mode}-${info.secs}s-${info.scope}`;
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
      acc, rate, mash: run.mash, self: test.self, bonus, when: stampNow()
    };
    lastResult = Object.assign({ test: true, mode, info, xp, prevBest, newBest: score > prevBest && prevBest > 0, qr: qrPayload(res) }, res);
    lastResult.treat = creditSerious(run.activeMs, acc, run.mash);   // 測驗的有效時間也算認真練習
    // 全班測驗：鎖在 QR 畫面（存起來，重新整理也一樣），要老師的解除密碼才能離開
    if (!test.self) {
      c.lock = { res, qr: lastResult.qr, xp, at: Date.now() };
      c.lastTest = { res, qr: lastResult.qr, xp, at: Date.now() };    // v3.9.2：提早離開也能再叫出來給老師掃
    }
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
      let bg = f ? FINGER_COLOR[f] : '#eee6dc';   // v3.12.1：注音也用手指顏色（老師 11-25 決定）
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
      const inner = zh && sym ? `<b class="ty-zh" style="color:${ZH_INK[ZH_GROUP[sym]] || '#3b2d22'}">${sym}</b><small>${esc(label)}</small>` : esc(zh && k === ' ' ? '空白鍵（一聲）' : label);
      const bump = (k === 'f' || k === 'j') ? '<i class="ty-bump"></i>' : '';
      return `<div class="ty-key${extra}" data-k="${esc(k)}" style="flex:${w};background:${bg}">${inner}${bump}</div>`;
    }).join('') + '</div>').join('') + '</div>' + (zh && !heat ? ZH_LEGEND : '');
  }

  // v3.12.1：手跟鍵盤一樣寬，每根手指在自己的基準鍵（A S D F／J K L ;）正下方；
  // 下一個要按的鍵在哪，負責的手指就移到那個鍵的正下方、亮起來（layoutHands 依鍵盤實際位置畫）
  const HOME_KEY = { L5: 'a', L4: 's', L3: 'd', L2: 'f', R2: 'j', R3: 'k', R4: 'l', R5: ';' };
  // v3.12.4：接近真的手：中指最長（只長一點）、食指次之、無名指、小指最短；大拇指短短胖胖
  const FINGER_LEN = { L5: 0.95, L4: 1.25, L3: 1.5, L2: 1.32, R2: 1.32, R3: 1.5, R4: 1.25, R5: 0.95 };
  function handsHtml() { return '<div class="ty-hands-box" aria-hidden="true"><svg class="ty-hands"></svg></div>'; }
  let handGeo = null;
  function layoutHands() {
    handGeo = null;
    if (!pane) return;
    const box = pane.querySelector('.ty-hands-box'), svg = box && box.querySelector('svg'), kb = pane.querySelector('.ty-kb');
    if (!svg || !kb) return;
    const B = box.getBoundingClientRect();
    if (!B.width) return;
    const keyX = {};
    let u = 0;
    pane.querySelectorAll('.ty-kb .ty-key').forEach(el => {
      const r = el.getBoundingClientRect();
      keyX[el.dataset.k] = r.left + r.width / 2 - B.left;
      if (el.dataset.k === 'f') u = r.width;
    });
    if (!u || keyX.a == null) return;
    const W = B.width;
    // 畫面不夠高（例如 1366×768 的注音練習）：手變矮一點（寬度、手指位置不變），才不會被下面的選單蓋住
    const nav = document.querySelector('nav, .bottom-nav');
    const bottom = nav && nav.getBoundingClientRect().top > 0 ? nav.getBoundingClientRect().top : window.innerHeight;
    const full = u * 3.05, avail = bottom - B.top - 6;
    const ky = document.body.classList.contains('ty-playing') && avail < full ? Math.max(0.55, avail / full) : 1;
    const uy = Math.max(u * ky, 24);     // 手機的鍵很窄：高度至少留一點，手指長短才看得出來
    const fw = u * 0.62, palmTop = uy * 1.6, palmH = uy * 0.85, H = palmTop + palmH + uy * 0.1;
    const hx = {};
    Object.keys(HOME_KEY).forEach(f => { hx[f] = keyX[HOME_KEY[f]]; });
    const fingerSvg = f => {
      const len = FINGER_LEN[f] * uy;
      const x = hx[f] - fw / 2, y = palmTop + uy * 0.3 - len;
      return `<g class="ty-finger" data-f="${f}" style="--fc:${FINGER_COLOR[f]}"><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${fw.toFixed(1)}" height="${(len + uy * 0.02).toFixed(1)}" rx="${(fw / 2).toFixed(1)}"/>` +
        `<ellipse class="ty-nail" cx="${hx[f].toFixed(1)}" cy="${(y + fw * 0.55).toFixed(1)}" rx="${(fw * 0.28).toFixed(1)}" ry="${(fw * 0.34).toFixed(1)}"/></g>`;
    };
    const palm = (x1, x2) => `<rect class="ty-palm" x="${x1.toFixed(1)}" y="${palmTop.toFixed(1)}" width="${(x2 - x1).toFixed(1)}" height="${palmH.toFixed(1)}" rx="${(u * 0.6).toFixed(1)}"/>`;
    const lx1 = hx.L5 - u * 0.55, lx2 = hx.L2 + u * 0.5, rx1 = hx.R2 - u * 0.5, rx2 = hx.R5 + u * 0.55;
    const thumb = (side) => {
      const tw = Math.max(uy * 0.95, fw * 1.5), th = fw * 1.3;   // 大拇指：短而寬
      const ax = side === 'L' ? lx2 - u * 0.15 : rx1 + u * 0.15, ay = palmTop + palmH * 0.45;
      const x = side === 'L' ? ax - tw * 0.25 : ax - tw * 0.75;
      return `<g class="ty-finger" data-f="T" style="--fc:${FINGER_COLOR.T}"><rect x="${x.toFixed(1)}" y="${(ay - th / 2).toFixed(1)}" width="${tw.toFixed(1)}" height="${th.toFixed(1)}" rx="${(th / 2).toFixed(1)}" transform="rotate(${side === 'L' ? -32 : 32} ${ax.toFixed(1)} ${ay.toFixed(1)})"/></g>`;
    };
    svg.setAttribute('viewBox', `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`);
    svg.style.height = H.toFixed(0) + 'px';
    svg.innerHTML = thumb('L') + thumb('R') + ['L5', 'L4', 'L3', 'L2', 'R2', 'R3', 'R4', 'R5'].map(fingerSvg).join('') + palm(lx1, lx2) + palm(rx1, rx2);
    handGeo = { keyX, hx, u: uy, fw };
    pointFinger(lastPoint);
  }
  // 負責的手指移到要按的鍵正下方、抬起來、亮起來
  let lastPoint = null;
  function pointFinger(k) {
    lastPoint = k;
    if (!pane) return;
    const f = k != null ? FINGER_OF[k] : null;
    // v3.12.3：手指移過去時，同一隻手旁邊的手指跟著讓位，不會疊在一起（手機的鍵比較窄）
    const shift = {};
    if (f && f !== 'T' && handGeo && handGeo.keyX[k] != null) {
      const order = f[0] === 'L' ? ['L5', 'L4', 'L3', 'L2'] : ['R2', 'R3', 'R4', 'R5'];
      const pos = order.map(x => handGeo.hx[x]);
      const ai = order.indexOf(f);
      pos[ai] = handGeo.keyX[k];
      const gap = handGeo.fw * 1.08;
      for (let i = ai + 1; i < pos.length; i++) pos[i] = Math.max(pos[i], pos[i - 1] + gap);
      for (let i = ai - 1; i >= 0; i--) pos[i] = Math.min(pos[i], pos[i + 1] - gap);
      order.forEach((x, i) => { shift[x] = pos[i] - handGeo.hx[x]; });
    }
    pane.querySelectorAll('.ty-hands .ty-finger').forEach(el => {
      const on = !!f && el.dataset.f === f;
      el.classList.toggle('on', on);
      const dx = shift[el.dataset.f] || 0;
      el.style.transform = dx ? `translate(${dx.toFixed(1)}px, 0px)` : '';   // v3.12.4：要按的手指不抬高、不變長，只移過去、換顏色
    });
    // 要按的手指放在其他手指上面（但還在手掌後面）
    const onEl = pane.querySelector('.ty-hands .ty-finger.on');
    const svg = pane.querySelector('.ty-hands'), palm = svg && svg.querySelector('.ty-palm');
    if (onEl && palm && onEl.dataset.f !== 'T') svg.insertBefore(onEl, palm);
  }

  // 全形標點的按法（微軟注音，中文模式）。v3.7.4：依微軟官方說明改成「Ctrl（＋Shift）＋符號鍵」，
  // 另一種方法是先按反引號 `（數字 1 左邊）再按符號鍵。！、「」、（）是依通則推的，請在 Windows 上確認。
  const PUNCT_KEYS = [
    ['，', 'Ctrl ＋ ,'], ['。', 'Ctrl ＋ .'], ['、', "Ctrl ＋ '"], ['；', 'Ctrl ＋ ;'],
    ['：', 'Ctrl ＋ Shift ＋ ;'], ['？', 'Ctrl ＋ Shift ＋ /'], ['！', 'Ctrl ＋ Shift ＋ 1'],
    ['「', 'Ctrl ＋ ['], ['」', 'Ctrl ＋ ]'], ['（', 'Ctrl ＋ Shift ＋ 9'], ['）', 'Ctrl ＋ Shift ＋ 0']
  ];
  const SUBJ = { en: '英打', zh: '注音鍵位', cn: '中文打字' };
  function punctCardHtml() {
    return `<div class="ty-punct"><b>全形標點怎麼打（微軟注音・中文模式）</b>
      <div class="ty-punct-grid">${PUNCT_KEYS.map(([c, k]) => `<span><i>${c}</i>${esc(k)}</span>`).join('')}</div>
      <small>🔁 另一種方法：先按 <kbd>\`</kbd>（數字 1 左邊），放開後再按符號鍵，例如 <kbd>\`</kbd> 再按 <kbd>,</kbd> 就是「，」。<br>
      🔍 找不到的符號：按 Ctrl ＋ Alt ＋ ,（逗號）打開符號表。</small></div>`;
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
    // v3.7.3：每一關都可以自己挑；英打和注音預設停在「總複習」，中文停在第一個還沒完成的關卡
    const doneN = lessons.filter(l => (t.prog[l.id] || 0) > 0).length;
    const firstTodo = lessons.findIndex(l => !(t.prog[l.id] || 0));
    const pickI = mode === 'cn' ? (firstTodo < 0 ? 0 : firstTodo) : lessons.length - 1;
    const weak = doneN >= 2 ? weakKeys(upToSymbols(), 3) : [];
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;
    const intro = mode === 'cn'
      ? '請把輸入法切到<strong>微軟注音（中文）</strong>，把上面的字打進輸入框。打錯可以繼續往下打，最後一起算；標點符號要用<strong>全形</strong>（，。？），半形算錯。不能貼上。'
      : mode === 'en'
      ? '手指放在基準鍵（左手 A S D F、右手 J K L ;），看著螢幕、不要看鍵盤。打錯不會往前跳，要打對才繼續。<strong>正確率比速度重要</strong>：95% 以上三顆星。'
      : '看到注音符號，就按鍵盤上對應的那個鍵。鍵盤上大大的字是注音，小小的字是英文字母。<strong>開著微軟注音或英文模式都可以練</strong>。正確率 95% 以上三顆星。';
    return `
      <div class="card-box">
        <div class="ty-modes" role="tablist">
          ${Object.values(MODES).map(m => `<button class="ty-mode ${m.id === mode ? 'on' : ''}" data-mode="${m.id}" role="tab" aria-selected="${m.id === mode}">${m.label}</button>`).join('')}
        </div>
        <button class="ty-test-btn" id="tyTestBtn">🏁 全班測驗／自己挑戰</button>
        ${(() => { const lt = common().lastTest; return lt && lt.at && Date.now() - lt.at < 7 * 86400000 && !common().lock ? `<button class="ty-last-test" id="tyLastTest">📋 上一次全班測驗成績 QR（${lt.res.g}年${lt.res.c}班${lt.res.s}號・${lt.res.score} 分）</button>` : ''; })()}
        <div class="section-title" style="margin-top:12px;"><span>${{ en: '⌨️ 英打練習', zh: 'ㄅ 注音鍵位練習', cn: '中 中文打字練習' }[mode]}</span><span class="ty-today-pill">今天有效練習 ${min} 分 ${sec} 秒</span></div>
        <div style="margin:4px 0 8px;">${treatPill()}</div>
        ${coarse ? '<p class="ty-warn">這台裝置看起來沒有接實體鍵盤。打字練習要用真的鍵盤，請接上鍵盤或改用電腦。</p>' : ''}
        <p class="section-sub">${intro}</p>
        ${mode === 'en' ? `<div class="ty-tracks">
          <div class="ty-track on">🔤 26 個字母</div>
          <div class="ty-track">🔢 數字<small>之後開放</small></div>
          <div class="ty-track">⬆️ Shift 大小寫<small>之後開放</small></div>
          <div class="ty-track">❗ 鍵盤符號<small>之後開放</small></div>
        </div>` : ''}
        <div class="ty-grid">
          ${lessons.map((l, i) => [l, i]).sort((x, y) => (y[0].review ? 1 : 0) - (x[0].review ? 1 : 0)).map(([l, i]) => {
            const st = t.prog[l.id] || 0;
            const cls = (st >= 3 ? 'done mastered' : st > 0 ? 'done' : 'todo') + (i === pickI ? ' pick' : '') + (l.review ? ' review' : '');
            const badge = st >= 3 ? '👑 三顆星' : st > 0 ? '✓ 已完成' : (i === pickI ? '👉 從這裡開始' : '');
            return `<button class="ty-lesson ${cls}" data-lesson="${l.id}" ${i === pickI ? 'data-pick="1"' : ''}>
              <span class="ty-ln">${l.review ? '🏆' : i + 1}${badge ? `<em class="ty-badge">${badge}</em>` : ''}</span>
              <span class="ty-lt">${esc(l.title)}</span>
              <span class="ty-ls">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>
            </button>`;
          }).join('')}
          ${doneN >= 2 && mode !== 'cn' ? `<button class="ty-lesson weak" data-lesson="weak"><span class="ty-ln">🎯</span><span class="ty-lt">加強練習${weak.length ? '：' + weak.map(x => x.k.toUpperCase()).join(' ') : ''}</span><span class="ty-ls">常錯的鍵</span></button>` : ''}
        </div>
      </div>
      <div class="card-box">
        <div class="section-title"><span>📋 今天的練習紀錄（${SUBJ[mode]}）</span></div>
        <div class="ty-stats">
          <div><b>${min} 分 ${sec} 秒</b><span>有效練習時間</span></div>
          <div><b>${total ? acc + '%' : '—'}</b><span>正確率</span></div>
          <div><b>${d.lessons}</b><span>完成關卡</span></div>
          <div class="${d.mash ? 'bad' : ''}"><b>${d.mash}</b><span>亂按次數</span></div>
        </div>
        ${mode === 'cn' ? punctCardHtml() : `<p class="section-sub" style="margin-top:12px;">哪些鍵最常打錯（紅色＝常錯，淺紅＝偶爾錯，綠色＝穩定）：</p>
        ${keyboardHtml({ heat: t.keys })}`}
        <p class="ty-teacher-link">老師請用 <a href="./teacher.html" target="_blank" rel="noopener">教師頁</a> 產生測驗碼、收成績。</p>
      </div>`;
  }

  function sel(id, label, max, val, fmt) {
    let opts = `<option value="0">${label}</option>`;
    for (let i = 1; i <= max; i++) opts += `<option value="${i}" ${+val === i ? 'selected' : ''}>${fmt(i)}</option>`;
    return `<select id="${id}" class="ty-select" aria-label="${label}">${opts}</select>`;
  }

  function minuteOptions(m) {
    return TIMES.map(x => `<option value="${x}" ${x === DEFAULT_SECS[m] ? 'selected' : ''}>${timeLabel(x)}</option>`).join('');
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
            <div id="tyCodeInfo" class="ty-code-info" hidden></div>
            <button class="btn btn-green" id="tyCodeGo" style="width:100%;margin-top:8px;">輸入好了</button>
          </div>
          <div class="ty-setup-box" id="tySelfBox">
            <h3>🙋 自己挑戰</h3>
            <p class="section-sub">規則和全班測驗一樣，程式隨機出題，可以挑戰自己的最高分。</p>
            <div class="ty-self-row">
              <select id="tySelfMode" class="ty-select" aria-label="科目">
                <option value="en">英打</option>
                <option value="zh" ${mode === 'zh' ? 'selected' : ''}>注音鍵位</option>
                <option value="cn" ${mode === 'cn' ? 'selected' : ''}>中文打字</option>
              </select>
              <select id="tySelfMin" class="ty-select" aria-label="時間">${minuteOptions(mode)}</select>
            </div>
            <select id="tySelfScopeEn" class="ty-select ty-wide" aria-label="英打範圍" ${mode === 'zh' ? 'hidden' : ''}>
              ${LETTER_LESSONS.slice(0, 14).map((l, i) => `<option value="${i + 1}" ${i + 1 === enMax ? 'selected' : ''}>${i + 1 >= 14 ? '全部 26 個字母' : '考到第 ' + (i + 1) + ' 關（' + MODES.en.before[l.id].toUpperCase() + '）'}</option>`).join('')}
            </select>
            <select id="tySelfScopeZh" class="ty-select ty-wide" aria-label="注音範圍" ${mode === 'zh' ? '' : 'hidden'}>
              ${ZH_SCOPES.map(sc => `<option value="${sc.n}" ${zhDefault && sc.n === zhDefault.n ? 'selected' : ''}>${sc.title}</option>`).join('')}
            </select>
            <select id="tySelfScopeCn" class="ty-select ty-wide" aria-label="中文範圍" ${mode === 'cn' ? '' : 'hidden'}>
              ${CN_SCOPES.map(sc => `<option value="${sc.n}">${sc.title}</option>`).join('')}
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
    const best = storeOf(info.mode).best[`${info.mode}-${info.secs}s-${info.scope}`] || 0;
    return `
      ${fsBarHtml()}
      <div class="card-box ty-ready">
        <h2>${self ? '🙋 自己挑戰' : '👩‍🏫 全班測驗'}</h2>
        <div class="ty-ready-code">測驗碼 <b>${info.code}</b></div>
        <ul class="ty-ready-list">
          <li>科目：<b>${SUBJ[info.mode]}</b></li>
          <li>範圍：<b>${esc(info.scopeText)}</b></li>
          <li>時間：<b>${info.timeText}</b>（時間到自動結束）</li>
          ${self ? '' : `<li>我是：<b>${who.g} 年級 ${who.c} 班 ${who.s} 號</b></li>`}
          ${rec ? `<li>這組測驗碼你已經測過 <b>${rec.n}</b> 次</li>` : ''}
          ${best ? `<li>個人最佳（同樣的時間和範圍）：<b>${best} 分</b></li>` : ''}
        </ul>
        <p class="section-sub">${info.mode === 'cn'
          ? '請先把輸入法切到<b>微軟注音（中文）</b>。打錯可以繼續往下打，最後一起算；標點要用全形，不能貼上。'
          : '題目不需要按空白鍵；每 5 個字之間的間隔只是方便看。打錯不會往前跳。'}<br>${info.mode === 'cn' ? '得分＝（打對的字數＋<b>標點加分</b>）× 正確率。<b>「，。」以外的標點，每打對一個多 1 分！</b>' : '得分＝打對的字數 × 正確率。'}</p>
        ${info.mode === 'cn' ? `<div class="ty-ime-try">
          <b>✍️ 開始前，先在這裡試打一個字，確認輸入法是「微軟注音」</b>
          <div class="ty-ime-try-row"><input id="tyTry" autocomplete="off" spellcheck="false" placeholder="試打：例如「我」">${imeChipHtml()}</div>
          ${IME_KEYS_HTML}
        </div>` : ''}
        ${self ? '' : `<div class="ty-wait-teacher" role="alert">✋ 準備好了！等候老師說開始之後，才能按鈕開始挑戰！</div>`}
        <button class="ty-start-big${self ? ' self' : ''}" id="tyStart">${self ? '▶ 準備好了！開始挑戰' : '🏁 老師說開始了！開始挑戰'}<small>（也可以按 Enter）</small></button>
        <button class="btn btn-soft" id="tyBack" style="margin-top:10px;">← 取消</button>
        <div class="ty-ver">版本 ${esc(window.PUPPY_VERSION || '')}</div>
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
    const grouped = mode !== 'cn' && (!!run.test || mode === 'zh');
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
      ${fsBarHtml()}
      <div class="card-box ty-play${zh ? ' zh' : ''}${run.test ? ' testing' : ''}">
        <div id="tyStatus" class="ty-status"></div>
        <div class="ty-head">
          <span class="ty-title">${esc(run.title)}</span>
          ${run.test ? '<span class="ty-timer" id="tyTimer">--:--</span><span class="ty-live" id="tyLive">打對 0</span>' : `<span class="ty-tip">💡 ${esc(run.tip)}</span>`}
          ${run.test && !run.test.self ? '' : '<button class="btn btn-soft" id="tyQuit">✕ 離開</button>'}
        </div>
        <div id="tyBanner" class="ty-banner" hidden></div>
        <div class="ty-text${zh ? ' zh' : ''}${mode === 'cn' ? ' cn' : ''}" id="tyText">${textHtml()}</div>
        <div class="ty-progress"><div id="tyBar" style="width:0%"></div></div>
        <div id="tyFingerName" class="ty-fname"></div>
        <div id="tyCountdown" class="ty-countdown" hidden></div>
        ${mode === 'cn' ? `<div class="ty-ime-row">${imeChipHtml()}${IME_KEYS_HTML}</div>` : ''}
        ${mode === 'cn' ? `<div class="ty-cn-row">
          <textarea id="tyInput" class="ty-input" rows="3" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="在這裡打字（微軟注音）" ${run.test ? 'disabled' : ''}></textarea>
          ${punctCardHtml()}</div>` : keyboardHtml() + handsHtml()}
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
        ${treatLine(r.treat)}
        <div class="ty-stats">
          <div><b>${r.acc}%</b><span>正確率</span></div>
          <div><b>${r.rate}</b><span>${r.mode === 'zh' ? '每分鐘符號數' : '每分鐘字數'}</span></div>
          <div><b>${sec} 秒</b><span>有效時間</span></div>
          <div class="${r.mash ? 'bad' : ''}"><b>${r.mash}</b><span>${r.mode === 'cn' ? '可疑操作' : '亂按次數'}</span></div>
        </div>
        ${r.mode === 'cn' ? `<p class="section-sub">${r.miss ? `打對 ${r.ok} 字，打錯或漏打 ${r.miss} 字（紅色的字）。` : '一個字都沒打錯，太厲害了！'}</p>` : r.weakHere.length ? `<p class="section-sub">這一關最常打錯：<strong>${r.weakHere.map(k => k === ' ' ? '空白鍵' : k.toUpperCase()).join('、')}</strong></p>` : '<p class="section-sub">這一關一個字都沒打錯，太厲害了！</p>'}
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
      const qr = window.qrcode(0, 'L');
      qr.addData(text, /^[0-9A-Z .:$%*+\/-]+$/.test(text) ? 'Alphanumeric' : 'Byte');
      qr.make();
      return qr.createSvgTag({ cellSize: 8, margin: 4, scalable: true });
    } catch (e) {
      return '';
    }
  }

  function testResultHtml() {
    const r = lastResult;
    const who = r.self ? '' : `${r.g} 年級 ${r.c} 班 ${r.s} 號`;
    return `
      ${fsBarHtml()}
      <div class="card-box ty-result ty-test-result">
        <h2>${r.self ? '🙋 自己挑戰' : '👩‍🏫 全班測驗'}結束！</h2>
        ${who ? `<div class="ty-who-big">${who}</div>` : ''}
        <div class="ty-score"><b>${r.score}</b><span>分</span></div>
        ${r.newBest ? '<p class="ty-note">🎉 打破你的個人最佳了！</p>' : ''}
        <div class="ty-test-meta">測驗碼 <b>${r.code}</b>　｜　第 <b class="${r.attempt > 1 ? 'bad' : ''}">${r.attempt}</b> 次　｜　${esc(r.info.scopeText)}　${r.info.timeText}</div>
        ${r.self ? '' : `<div class="ty-qr">${qrSvg(r.qr)}</div><p class="section-sub">請把這個畫面留著，等老師用手機掃描 QR Code 收成績。</p>`}
        <div class="ty-stats">
          <div><b>${r.acc}%</b><span>正確率</span></div>
          <div><b>${r.ok}</b><span>打對的${r.mode === 'zh' ? '符號' : '字'}</span></div>
          <div><b>${r.rate}</b><span>${r.mode === 'zh' ? '每分鐘符號數' : '每分鐘字數'}</span></div>
          <div class="${r.mash ? 'bad' : ''}"><b>${r.mash}</b><span>${r.mode === 'cn' ? '可疑操作' : '亂按次數'}</span></div>
        </div>
        ${r.bonus ? `<p class="ty-note">✨ 標點加分 +${r.bonus}（「，。」以外的標點，每打對一個多 1 分）</p>` : ''}
        ${treatLine(r.treat)}
        ${r.xp ? `<p class="section-sub">獲得 +${r.xp} 經驗值</p>` : ''}
        ${r.review ? `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px;">
          <button class="btn btn-soft" id="tyDone">回到打字練習</button>
        </div>` : r.self ? `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px;">
          <button class="btn btn-soft" id="tyDone">完成</button>
          <button class="btn btn-orange" id="tyAgainSelf">🔁 再挑戰一次</button>
        </div>` : `<div class="ty-unlock">
          <b>🔒 等老師收完成績，輸入老師說的「解除密碼」才能離開</b>
          <div class="ty-unlock-row"><input id="tyUnlock" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="____" aria-label="解除密碼">
          <button class="btn btn-green" id="tyUnlockGo">解除</button></div>
          <div id="tyUnlockMsg" class="ty-unlock-msg"></div>
          <div class="ty-unlock-note">測驗結束 20 分鐘後會自動解除</div>
          <button class="ty-exit-early" id="tyExitEarly" type="button">離開</button>
        </div>`}
      </div>`;
  }

  let handsResize = false;
  function render() {
    if (!pane) return;
    if (!handsResize) { handsResize = true; window.addEventListener('resize', () => { if (pane && pane.querySelector('.ty-hands-box')) layoutHands(); }); }
    requestAnimationFrame(() => layoutHands());
    document.body.classList.toggle('ty-playing', view === 'play' && pane.getClientRects().length > 0);
    const html = { play: playHtml, result: resultHtml, testsetup: setupHtml, ready: readyHtml, testresult: testResultHtml }[view];
    pane.innerHTML = html ? html() : homeHtml();
    pane.querySelectorAll('[data-lesson]').forEach(b => b.addEventListener('click', () => startLesson(b.dataset.lesson)));
    pane.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; render(); }));
    const on = (id, fn) => { const el = pane.querySelector('#' + id); if (el) el.addEventListener('click', fn); };
    on('tyQuit', quit);
    on('tyHome', () => { view = 'home'; render(); });
    on('tyBack', () => { view = 'home'; pendingTest = null; setupMsg = ''; leaveExam(); if (api.focus) api.focus(false); render(); });
    on('tyTestBtn', () => { view = 'testsetup'; setupMsg = ''; render(); });
    on('tyStart', startTest);
    on('tyFsBar', goFullscreen);
    on('tyDone', () => { leaveExam(); view = 'home'; render(); });
    on('tyExitEarly', () => {
      if (window.confirm('⚠️ 老師已經收完你的成績，而且同意你離開了嗎？\n\n還沒等老師同意就離開，老師可能收不到你的成績。\n（離開後，在打字練習頁可以按「上一次測驗成績 QR」再叫出來）\n\n確定要離開嗎？')) releaseLock();
    });
    on('tyLastTest', showLastTest);
    const tryBox = pane.querySelector('#tyTry');
    if (tryBox) {
      let tc = false;
      tryBox.addEventListener('compositionstart', () => { tc = true; setIme('zh'); });
      tryBox.addEventListener('compositionend', () => { tc = false; setIme(guessFrom(tryBox.value.slice(-1)) || 'zh'); });
      tryBox.addEventListener('input', ev => { if (!ev.isComposing && !tc) setIme(guessFrom(tryBox.value.slice(-1)) || imeGuess); });
      tryBox.addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.isComposing && ev.keyCode !== 229) ev.preventDefault(); ev.stopPropagation(); });
    }
    const unl = pane.querySelector('#tyUnlock');
    if (unl) {
      const tryUnlock = () => {
        if (unl.value.trim() === unlockCode(lastResult.code)) {
          releaseLock();
        } else {
          const m = pane.querySelector('#tyUnlockMsg');
          if (m) m.textContent = '密碼不對，請等老師說。';
          unl.value = '';
        }
      };
      pane.querySelector('#tyUnlockGo').addEventListener('click', tryUnlock);
      unl.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.stopPropagation(); tryUnlock(); } });
    }
    updateFsBar();
    on('tyAgainSelf', () => {
      const i = lastResult.info;
      prepareTest(makeCode(i.mode, i.secs, i.scope), true);
    });
    if (view === 'testsetup') bindSetup();
    if (!html) {
      const pick = pane.querySelector('[data-pick="1"]');
      if (pick) { try { pick.focus({ preventScroll: true }); } catch (e) { pick.focus(); } }
    }
    if (view === 'play') {
      if (mode === 'cn') { bindCnInput(); focusInput(); }
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
    // v3.7.5：輸入測驗碼時，馬上顯示老師設定好的內容（鎖定、不能改），並先收起「自己挑戰」
    const info = pane.querySelector('#tyCodeInfo');
    const selfBox = pane.querySelector('#tySelfBox');
    const grid = pane.querySelector('.ty-setup-grid');
    const preview = () => {
      const v = codeEl.value.replace(/\D/g, '');
      if (v !== codeEl.value) codeEl.value = v;
      selfBox.hidden = v.length > 0;
      grid.classList.toggle('one', v.length > 0);
      if (v.length < 6) {
        info.hidden = v.length === 0;
        info.className = 'ty-code-info wait';
        info.textContent = v.length ? `還差 ${6 - v.length} 碼` : '';
        return;
      }
      const c = parseCode(v);
      info.hidden = false;
      if (!c) { info.className = 'ty-code-info bad'; info.textContent = '⚠ 這組測驗碼不對，請再看一次黑板。'; return; }
      info.className = 'ty-code-info ok';
      info.innerHTML = `<b>🔒 老師已經設定好了（不能改）</b>
        <span>科目：<b>${SUBJ[c.mode]}</b></span><span>時間：<b>${c.timeText}</b></span><span>範圍：<b>${esc(c.scopeText)}</b></span>`;
    };
    codeEl.addEventListener('input', preview);
    codeEl.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.stopPropagation(); go(); } });
    const modeSel = pane.querySelector('#tySelfMode');
    const en = pane.querySelector('#tySelfScopeEn');
    const zh = pane.querySelector('#tySelfScopeZh');
    const cn = pane.querySelector('#tySelfScopeCn');
    modeSel.addEventListener('change', () => {
      en.hidden = modeSel.value !== 'en'; zh.hidden = modeSel.value !== 'zh'; cn.hidden = modeSel.value !== 'cn';
      pane.querySelector('#tySelfMin').innerHTML = minuteOptions(modeSel.value);
    });
    pane.querySelector('#tySelfGo').addEventListener('click', () => {
      const m = modeSel.value;
      const scope = +({ en, zh, cn }[m].value);
      prepareTest(makeCode(m, +pane.querySelector('#tySelfMin').value, scope), true);
    });
  }

  function renderBanner() {
    const b = pane && pane.querySelector('#tyBanner');
    if (!b) return;
    b.textContent = banner;
    b.hidden = !banner;
    b.classList.toggle('alert', bannerKind === 'enter');
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
      const box = pane.querySelector('#tyInput');
      if (box && box.disabled) { box.disabled = false; focusInput(); }
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
    if (mode === 'cn') {
      const fn = pane.querySelector('#tyFingerName');
      if (fn) fn.textContent = want ? `打到這裡：「${want}」　已打對 ${run.ok} 字${run.miss ? `、錯 ${run.miss} 字` : ''}` : '';
      renderStatus();
      return;
    }
    const phys = mode === 'zh' ? KEY_OF_ZH[want] : want;
    pane.querySelectorAll('.ty-key.next').forEach(k => k.classList.remove('next'));
    const keyEl = phys != null ? pane.querySelector(`.ty-key[data-k="${CSS.escape(phys)}"]`) : null;
    if (keyEl) keyEl.classList.add('next');
    const fn = pane.querySelector('#tyFingerName');
    pointFinger(phys);
    const f = phys != null ? FINGER_OF[phys] : null;
    if (mode === 'zh') {
      if (fn) fn.textContent = phys ? `下一個：${want === ' ' ? '一聲（空白鍵）' : want}　按鍵盤上的「${phys === ' ' ? '空白鍵' : phys.toUpperCase()}」${f ? '，用' + FINGER_NAME[f] : ''}` : '';
    } else {
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
    if (!pane || !pane.getClientRects().length) return;
    const tag = ev.target && ev.target.tagName;
    if ((tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') && view !== 'play') return;
    handleKey(ev);
  }

  // ── 對外 ──────────────────────────────────────────────────
  window.PuppyTyping = {
    mount(el, hooks) {
      pane = el;
      api = hooks;
      // 全班測驗結束還沒解除（例如學生按了重新整理）：直接回到 QR 畫面
      let lk = common().lock;
      if (lk && lockExpired(lk)) { delete common().lock; hooks.save(); lk = null; }   // 超過 20 分鐘：自動解除
      const li = lk && lk.res && parseCode(lk.res.code);
      if (li) {
        mode = li.mode;
        lastResult = Object.assign({ test: true, mode: li.mode, info: li, xp: lk.xp || 0, qr: lk.qr }, lk.res);
        view = 'testresult';
        exam = true;
        document.body.classList.add('ty-exam');
      }
      window.addEventListener('keydown', onKeyDown);
      // 鎖在 QR 畫面時，每 15 秒看一次是不是已經超過 20 分鐘
      setInterval(() => {
        const l = common().lock;
        if (l && view === 'testresult' && lockExpired(l)) releaseLock();
      }, 15000);
      if (!ticker) {
        ticker = setInterval(() => {
          if (view !== 'play') return;
          renderStatus();
          checkUnsent();
          if (run && run.test) { renderTimer(); if (run) renderProgress(true); }
        }, 250);
      }
    },
    show() { if (view === 'play' && api.focus) api.focus(true); render(); },
    hide() { document.body.classList.remove('ty-playing'); if (view === 'play' && api.focus) api.focus(false); },
    isPlaying() { return view === 'play' || view === 'ready'; },   // v3.7.5：準備畫面也算，狗狗會躲到角落
    isExam() { return exam; },
    unlockCode,
    // 給 teacher.html 用（同一套測驗碼）
    parseCode, makeCode, ZH_SCOPES, CN_SCOPES, TIMES, timeLabel, DEFAULT_SECS, LETTER_LESSONS, QR_KEY,
    // 自動測試用
    _t: {
      LETTER_LESSONS, ZH_LESSONS, FINGER_OF, LETTERS_BEFORE, ZH_OF_KEY, KEY_OF_ZH, CODE_KEY, MODES,
      CN_LESSONS, cnText, cnCompare, cnEvaluate, TIMES,
      layoutHands, pointFinger, get handGeo() { return handGeo; },
      makeText, makeRun, startLesson, handleKey, starsFor, unlockedIndex, parseCode, makeCode, testText, scoreOf, qrPayload,
      prepareTest, startTest, finishTest, common, unlockCode, creditSerious, treatBox, TREAT_MS, isExam: () => exam, releaseLock, showLastTest, lockExpired, LOCK_MAX_MS, guessFrom, setIme, imeGuess: () => imeGuess, checkUnsent, cnEvaluate,
      _comp: (on, data, since) => { composing = on; compData = data || ''; compSince = since || 0; },
      run: () => run, result: () => lastResult, view: () => view, status, quit, data,
      setRun: patch => Object.assign(run, patch), setMode: m => { mode = m; }
    }
  };
})();
