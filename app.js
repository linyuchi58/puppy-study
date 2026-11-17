// -*- coding: utf-8 -*-
// 《汪汪小精靈 學習小伙伴》平板／網頁版核心 (v3.3.0：學習換陪玩——道具花星星、才藝依親密度解鎖)
(function () {
  'use strict';

  const APP_VERSION = 'v3.8.4';
  const APP_BUILD = '20261117-11';
  window.PUPPY_VERSION = APP_VERSION + '（' + APP_BUILD + '）';   // v3.8.1：測驗準備畫面顯示版本，方便老師確認全班同一版
  // 網址加 ?selftest=1 或 ?apptest=1 是自動測試：用另一個存檔位置，不會動到學生真正的紀錄
  const SELFTEST = /[?&](selftest|apptest)=1/.test(location.search);
  const STORAGE_KEY = 'puppy_study_save_v2' + (SELFTEST ? '_selftest' : '');
  const BOND_LV = [0, 30, 80, 150, 250, 400, 600, 850, 1150, 1500];
  const SPECIALTY_BONUS = 0.25;
  const HEART_MAX = 5;
  const HEART_REGEN_SEC = 30 * 60;
  const BOX_DAYS = [0, 1, 2, 4, 7, 15];

  const SUBJECTS = {
    english: ['🦉', '英語'],
    math: ['🔢', '算術'],
    focus: ['⏱', '專注讀書'],
    homework: ['✅', '自我打卡'],
    cards: ['🃏', '閃卡'],
    games: ['🎮', '挑戰包'],
    calm: ['🌈', '照顧心情']
  };

  const DOG_COAT = {
    '威爾斯柯基': ['#e3893b', '#fffaf2'],
    '黑頭三色柯基': ['#383532', '#fffaf2'],
    '奶油柯基': ['#ecc27e', '#ffffff'],
    '柴犬': ['#d4793a', '#f7ead6'],
    '米格魯': ['#d99a52', '#f6efe2'],
    '哈士奇': ['#8a8f99', '#f2f2f2'],
    '大麥町': ['#f4f1ea', '#ffffff'],
    '巧克力拉布拉多': ['#7b4a2a', '#a8714a']
  };

  const DOG_ACC = [
    ['none', '✨', '無配件', 1],
    ['grad_cap', '🎓', '博士帽', 2],
    ['sunglasses', '🕶', '酷墨鏡', 3],
    ['scarf', '🧣', '紅領巾', 4],
    ['crown', '👑', '小皇冠', 6]
  ];

  const PETS = [
    ['dog:威爾斯柯基', '🐕', '威爾斯柯基', 'focus', 'free', '一開始就是你的好夥伴', 0],
    ['dog:奶油柯基', '🐕', '奶油柯基', 'homework', 'focus1', '完成 1 次專注讀書或打卡', 1],
    ['dog:黑頭三色柯基', '🐕', '三色柯基', 'homework', 'days10', '累積學習 10 天（不用連續）', 10],   // v3.7.2：原本「挑戰包過 3 關」
    ['dog:柴犬', '🐕', '柴犬', 'english', 'eng5', '英語闖關完成 5 關', 5],
    ['dog:米格魯', '🐕', '米格魯', 'english', 'streak3', '連續學習 3 天', 3],
    ['dog:哈士奇', '🐕', '哈士奇', 'math', 'math150', '算術答對 150 題', 150],
    ['dog:大麥町', '🐕', '大麥町', 'calm', 'hw15', '自我打卡累積 15 項', 15],
    ['dog:巧克力拉布拉多', '🐕', '拉布拉多', 'focus', 'focus300', '專注讀書累積 300 分鐘', 300],
    ['c3d:小熊可可.json', '🧸', '小熊可可', 'homework', 'streak7', '連續學習 7 天', 7],
    ['c3d:小藍龍.json', '🐲', '小藍龍', 'english', 'eng30', '英語闖關完成 30 關', 30],
    ['standee', '🖼', '我的立牌', 'english', 'stars150', '累積賺到 150 顆星星', 150]
  ];

  const SHOP = [
    ['can', '🥫', '特級罐頭', 6, '肚子最飽、最開心（飽足 +45，親密度 +2）'],
    ['bowl', '🥣', '一碗飼料', 4, '填飽肚子（飽足 +30，親密度 +2）'],
    ['bone', '🦴', '潔牙骨', 3, '啃得好開心（飽足 +20，親密度 +2）'],
    ['ball', '⚽', '皮球', 2, '陪牠玩接球（親密度 +2）'],
    ['yarn', '🧶', '毛線球', 2, '滾來滾去（親密度 +2）'],
    ['frisbee', '🥏', '飛盤', 3, '跑跳運動（親密度 +2）'],
    ['bath', '🛁', '洗香香', 3, '乾乾淨淨（親密度 +2）'],
    ['cake', '🍰', '親密度蛋糕', 8, '目前的夥伴親密度直接 +15！'],
    ['hearts', '❤', '補滿愛心', 10, '英語闖關的愛心補滿 5 顆'],
    ['freeze', '🧊', '連續天數保護卡', 20, '有一天忘記學習，連續天數也不會歸零（最多 2 張）']
  ];

  // ── v3.3.0「學習換陪玩」────────────────────────────────────────────
  // 價錢和桌面版 study_buddy.SHOP／GATE_EXTRA 一樣；才藝等級和 study_pets.TRICK_LV 一樣（兩邊要一起改）
  const ITEMS = {
    // 代號: [圖示, 名稱, 星星, 飽足度變化, 分類]
    can: ['🥫', '特級罐頭', 6, 45, 'food'],
    bowl: ['🥣', '一碗飼料', 4, 30, 'food'],
    bone: ['🦴', '潔牙骨', 3, 20, 'food'],
    bury: ['🕳️', '藏骨頭尋寶', 2, 10, 'toy'],
    ball: ['⚽', '皮球', 2, -3, 'toy'],
    yarn: ['🧶', '毛線球', 2, -3, 'toy'],
    frisbee: ['🥏', '飛盤', 3, -3, 'toy'],
    fly: ['🪰', '放蒼蠅', 1, -3, 'toy'],
    bath: ['🛁', '洗香香', 3, 0, 'toy']
  };
  const TRICKS = [
    // 代號, 圖示, 名稱, 需要的親密度等級（看所有夥伴裡最高的那一隻）, 表演時說的話
    ['sit', '💺', '坐下', 1, '💺 坐好了！我很乖吧？'],
    ['lie', '🛏', '趴下', 1, '🛏 趴下來休息一下～'],
    ['sleep', '💤', '睡覺', 1, '💤 呼嚕嚕…小睡一下～'],
    ['paw', '🐾', '握手', 1, '🐾 來，跟你握握手！'],
    ['belly_rub', '💕', '翻肚肚', 1, '💕 翻肚肚給你摸～好舒服喔！'],
    ['play_paws', '🙌', '拜託拜託', 2, '🙌 拜託拜託～再陪我學一課嘛！'],
    ['downdog', '🧘', '伸懶腰', 2, '🧘 伸個大懶腰，精神百倍！'],
    ['roll', '🤸', '翻滾', 3, '🤸 咕嚕咕嚕翻滾一圈！'],
    ['dig', '⛏', '挖洞', 3, '⛏ 挖呀挖～看我挖到什麼！'],
    ['chase_tail', '🌀', '追尾巴', 4, '🌀 咦？我的尾巴怎麼一直跑！'],
    ['dance', '💃', '跳舞', 5, '💃 啦啦啦～開心地跳支舞！'],
    ['split', '🦵', '劈腿', 6, '🦵 看我的軟 Q 劈腿特技！'],
    ['copter', '🚁', '螺旋槳飛天', 7, '🚁 尾巴螺旋槳啟動！飛起來啦～']
  ];
  const TRICK_LV = {};
  TRICKS.forEach(t => { TRICK_LV[t[0]] = t[3]; });
  const TIRED_BELOW = 15;          // 飽足度低於這個數字：沒力氣玩玩具、表演才藝（摸摸、坐下、睡覺不受影響）
  const TRICK_COST = 2;            // Lv2 以上的才藝每表演一次消耗的飽足度
  const TRICK_COOLDOWN_MS = 2500;  // 才藝按鈕的冷卻時間
  const FULL_DECAY_PER_HOUR = 4;   // 飽足度每小時自然下降（約一天從飽到餓）
  const TOY_THROWS = 6;            // 買一次玩具，可以用手丟幾次
  const CHECKIN_XP = 3;            // 自我打卡每項的經驗值（重點放在連續天數，不讓「只打卡不學習」也能衝親密度）
  const CHECKIN_STAR_CAP = 4;
  const CUSTOM_HABIT_MAX = 2;      // 家長自己加的好習慣最多 2 項
  const REVIEW_STAR_TIMES = 3;     // 每天前 3 次複習有星星，之後只有經驗值
  // v3.4.0 家長蓋章（規則和桌面版 study_checkin.py 一樣，驗證碼算法在 stamp.js）
  const STAMP_STARS = 3;
  const STAMP_XP = 5;
  const STAMP_TRIES = 5;           // 一天最多可以輸入幾次蓋章碼
  const REPAIR_WAIT_DAYS = 3;      // 換一支手機重新配對後，要等幾天才能蓋章
  // 家長頁的網址。空字串＝自動用「這個網頁版旁邊的 parent.html」（網頁版要放在網路上才有效）
  let PARENT_PAGE_URL = '';

  const DEFAULT_HABITS = [
    { id: 'hw_today', icon: '📚', title: '今日學校功課全部完成' },
    { id: 'review_today', icon: '📖', title: '複習今天上課的重點 10 分鐘' },
    { id: 'pack_bag', icon: '🎒', title: '自己整理好明天的書包與學用品' },
    { id: 'chores', icon: '🧹', title: '主動幫忙做一件家事' },
    { id: 'parent_ask', icon: '💛', title: '開心地完成爸媽或老師交代的事' },
    { id: 'early_prep', icon: '🌙', title: '睡前收好平板、準備準時休息' }
  ];

  const TRACKS = [
    ['kid', '🐣', '國小入門', 'Level 1 最常用的 300 字', 'kid'],
    ['jh1', '📗', '國中基礎', 'Level 1・約英檢初級・會考', 1],
    ['jh2', '📘', '國中進階', 'Level 2・約英檢初級・會考', 2],
    ['sh3', '📙', '高中 Level 3', '約英檢中級・學測', 3],
    ['sh4', '📕', '高中 Level 4', '約英檢中級・學測', 4],
    ['sh5', '📓', '高中 Level 5', '約英檢中高級・學測', 5],
    ['sh6', '📔', '高中 Level 6', '約英檢中高級・分科', 6]
  ];

  const KID_STOP = new Set(('be do have get go make can will may must shall should would could might there here then than very ' +
    'just so not also too only even still such much many more most some any all each every other another own same both ' +
    'either neither none no yes ok okay well really quite rather almost already yet ever never often always sometimes ' +
    'usually maybe perhaps however though although because since while until unless whether if when where why how what ' +
    'which who whom whose that this these those it its they them their he him his she her we us our you your me my mine ' +
    'god business national public service case power order point mean set let lot sure').split(/\s+/));

  const FUNC_POS = new Set(['art', 'prep', 'conj', 'pron', 'aux', 'det']);

  function todayStr(offsetDays = 0) {
    const d = new Date(Date.now() + offsetDays * 86400000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function daysBetween(a, b) {
    if (!a || !b) return 0;
    const ta = new Date(a + 'T00:00:00').getTime();
    const tb = new Date(b + 'T00:00:00').getTime();
    return Math.round((tb - ta) / 86400000);
  }

  function defaultData() {
    return {
      format: 'puppy-study/2',
      grade: 'mid',
      stars: 0,
      xp_total: 0,
      streak: { n: 0, last: '', best: 0, freeze: 0 },
      daily: {},
      goal_xp: 0,
      history: {},
      totals: { welcomed: 1 },
      badges: {},
      settings: { feed_cost: true, tts: true, sound: true, nudge: true, tts_rate: 0 },
      focus: { min: 25, brk: 5, auto_break: true, subject: '' },
      homework: [],
      custom_habits: [],
      checkins: {}, // { 'YYYY-MM-DD': { hw_today: true, ... } }
      decks: [],
      math: { best: {}, weak: {}, last: {} },
      eng: { track: 'kid', prog: {}, words: {}, hearts: HEART_MAX, hearts_ts: 0, mistakes: [], best_rush: 0 },
      shop_log: [],
      packs: {},
      pets: {
        current: 'dog:威爾斯柯基',
        acc: 'none',
        fullness: 85,
        full_ts: 0,
        unlocked: { 'dog:威爾斯柯基': todayStr() },
        bond: { 'dog:威爾斯柯基': 0 },
        acc_seen: {}
      },
      parent: { key: '', dev: '', paired: '', stamps: {}, tries: {} }
    };
  }

  // ── 存檔簽章：和桌面版 study_buddy._sig() 完全一樣（SHA-256），所以兩邊的 study_save.json 可以互相匯入 ──
  const SIG_KEYS = ['stars', 'xp_total', 'totals', 'streak', 'pets', 'badges'];
  const SIG_SALT = 'puppy-study-buddy-2026/wangwang';
  const BAK_KEY = STORAGE_KEY + '.bak';
  const SIG_ON_KEY = STORAGE_KEY + '.sig_on';

  function sha256Hex(str) {
    const bytes = new TextEncoder().encode(str);
    const K = [];
    let n = 2, i = 0;
    const frac = x => ((x - Math.floor(x)) * 4294967296) | 0;
    const H = [];
    while (i < 64) {
      let prime = true;
      for (let f = 2; f * f <= n; f++) if (n % f === 0) { prime = false; break; }
      if (prime) {
        if (i < 8) H[i] = frac(Math.pow(n, 1 / 2));
        K[i++] = frac(Math.pow(n, 1 / 3));
      }
      n++;
    }
    const len = bytes.length;
    const total = ((len + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(total);
    buf.set(bytes);
    buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 8, Math.floor(len / 536870912));
    dv.setUint32(total - 4, (len * 8) >>> 0);
    const w = new Int32Array(64);
    const rotr = (x, r) => (x >>> r) | (x << (32 - r));
    for (let off = 0; off < total; off += 64) {
      for (let t = 0; t < 16; t++) w[t] = dv.getInt32(off + t * 4);
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      let [A, B, C, D, E, F, G, HH] = H;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
        const ch = (E & F) ^ (~E & G);
        const t1 = (HH + S1 + ch + K[t] + w[t]) | 0;
        const S0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
        const mj = (A & B) ^ (A & C) ^ (B & C);
        const t2 = (S0 + mj) | 0;
        HH = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0;
      }
      H[0] = (H[0] + A) | 0; H[1] = (H[1] + B) | 0; H[2] = (H[2] + C) | 0; H[3] = (H[3] + D) | 0;
      H[4] = (H[4] + E) | 0; H[5] = (H[5] + F) | 0; H[6] = (H[6] + G) | 0; H[7] = (H[7] + HH) | 0;
    }
    return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }

  // 照 Python json.dumps(sort_keys=True, ensure_ascii=False) 的寫法輸出（逗號和冒號後面各有一個空白）
  function pyDumps(v) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return isFinite(v) ? String(v) : 'null';
    if (typeof v === 'string') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(pyDumps).join(', ') + ']';
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ': ' + pyDumps(v[k])).join(', ') + '}';
  }

  function sigOf(d) {
    const o = {};
    SIG_KEYS.forEach(k => { o[k] = d[k] === undefined ? null : d[k]; });
    return sha256Hex(SIG_SALT + pyDumps(o)).slice(0, 20);
  }

  // 桌面版的單字紀錄用 b／d／n／x／u；舊的網頁版存檔用 box／due，這裡轉成和桌面版一樣
  function normalizeData(base) {
    if (!base.pets || typeof base.pets !== 'object') base.pets = defaultData().pets;
    if (!base.pets.current) base.pets.current = 'dog:威爾斯柯基';
    if (!base.pets.acc) base.pets.acc = 'none';
    if (typeof base.pets.fullness !== 'number' || !isFinite(base.pets.fullness)) base.pets.fullness = 85;
    if (!base.pets.unlocked || typeof base.pets.unlocked !== 'object') base.pets.unlocked = {};
    if (!base.pets.unlocked['dog:威爾斯柯基']) base.pets.unlocked['dog:威爾斯柯基'] = todayStr();
    if (!base.pets.bond || typeof base.pets.bond !== 'object') base.pets.bond = {};
    if (!base.eng || typeof base.eng !== 'object') base.eng = defaultData().eng;
    if (!base.eng.words || typeof base.eng.words !== 'object') base.eng.words = {};
    if (!Array.isArray(base.eng.mistakes)) base.eng.mistakes = [];
    if (!base.eng.prog || typeof base.eng.prog !== 'object') base.eng.prog = {};
    Object.keys(base.eng.words).forEach(k => {
      const r = base.eng.words[k] || {};
      if ('box' in r || 'due' in r) {
        base.eng.words[k] = { b: r.box || 0, d: r.due || '', n: r.n || 0, x: r.x || 0, u: r.u || '' };
      }
    });
    if (!base.parent || typeof base.parent !== 'object' || Array.isArray(base.parent)) base.parent = {};
    ['key', 'dev', 'paired'].forEach(k => { if (typeof base.parent[k] !== 'string') base.parent[k] = ''; });
    ['stamps', 'tries'].forEach(k => { if (!base.parent[k] || typeof base.parent[k] !== 'object') base.parent[k] = {}; });
    if (!Array.isArray(base.custom_habits)) base.custom_habits = [];
    if (!base.checkins || typeof base.checkins !== 'object') base.checkins = {};
    if (!base.totals || typeof base.totals !== 'object') base.totals = {};
    if (!base.streak || typeof base.streak !== 'object') base.streak = { n: 0, last: '', best: 0, freeze: 0 };
    if (!base.history || typeof base.history !== 'object') base.history = {};
    base.stars = Math.max(0, parseInt(base.stars, 10) || 0);
    base.xp_total = Math.max(0, parseInt(base.xp_total, 10) || 0);
    return base;
  }

  function mergeData(parsed) {
    const base = defaultData();
    Object.keys(parsed).forEach(k => {
      if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && parsed[k] && typeof parsed[k] === 'object' && !Array.isArray(parsed[k])) {
        Object.assign(base[k], parsed[k]);
      } else {
        base[k] = parsed[k];
      }
    });
    return normalizeData(base);
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  // 回傳 'ok'（簽章正確）、'unsigned'（沒有簽章的舊存檔）、'bad'（被改過或壞掉）
  function checkSig(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 'bad';
    if (!obj.sig) return 'unsigned';
    return obj.sig === sigOf(obj) ? 'ok' : 'bad';
  }

  let saveWarning = '';     // 開啟時要跟學生說的話（例如：紀錄被改過，已經還原）
  let state = loadState();
  let vocabDB = null;
  let activeTab = 'english';
  let currentQuiz = null;
  let petAnim = { bounce: 0, mood: 'normal', hearts: [] };
  window.PUPPY_GET_STATE = () => state;

  function readSlot(key) {
    const raw = lsGet(key);
    if (!raw) return [null, 'none'];
    try {
      const obj = JSON.parse(raw);
      let st = checkSig(obj);
      // 沒有簽章的存檔，只有「這台裝置還沒開始簽章」時才接受（v3.3.0 以前的舊存檔）
      if (st === 'unsigned' && lsGet(SIG_ON_KEY)) st = 'bad';
      return [obj, st];
    } catch (e) {
      return [null, 'bad'];
    }
  }

  // ── v3.3.2 每日自動備份：每天留一份，保留 7 天（存在這台裝置的瀏覽器裡，不上傳）──
  const DAILY_PREFIX = STORAGE_KEY + '.day.';
  const BACKUP_KEEP = 7;
  const DAILY_MIN_GAP_MS = 5 * 60 * 1000;   // 同一天裡最多每 5 分鐘更新一次當天的備份
  let lastDailyAt = 0;

  function dailyKeys() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(DAILY_PREFIX) && /^\d{4}-\d{2}-\d{2}$/.test(k.slice(DAILY_PREFIX.length))) out.push(k);
      }
    } catch (e) { /* 忽略 */ }
    return out.sort();
  }

  function dailySnapshot(txt, force) {
    const now = Date.now();
    const key = DAILY_PREFIX + todayStr();
    if (!force && lsGet(key) && now - lastDailyAt < DAILY_MIN_GAP_MS) return;
    lastDailyAt = now;
    if (!lsSet(key, txt)) {
      // 空間不夠：先刪掉最舊的一份再試一次
      const ks = dailyKeys().filter(k => k !== key);
      if (ks.length) {
        try { localStorage.removeItem(ks[0]); } catch (e) { /* 忽略 */ }
        lsSet(key, txt);
      }
    }
    const all = dailyKeys();
    all.slice(0, Math.max(0, all.length - BACKUP_KEEP)).forEach(k => {
      try { localStorage.removeItem(k); } catch (e) { /* 忽略 */ }
    });
  }

  // 可以還原的備份（簽章正確的才列出來），新的在前面
  function listDailyBackups() {
    const out = [];
    dailyKeys().forEach(k => {
      try {
        const obj = JSON.parse(lsGet(k));
        if (checkSig(obj) === 'ok') {
          out.push({ day: k.slice(DAILY_PREFIX.length), key: k, stars: obj.stars || 0, xp: obj.xp_total || 0,
            streak: (obj.streak && obj.streak.n) || 0 });
        }
      } catch (e) { /* 壞掉的備份不列 */ }
    });
    return out.reverse();
  }

  function restoreDaily(day) {
    let obj = null;
    try { obj = JSON.parse(lsGet(DAILY_PREFIX + day)); } catch (e) { obj = null; }
    if (checkSig(obj) !== 'ok') return false;
    const cur = lsGet(STORAGE_KEY);
    if (cur) lsSet(STORAGE_KEY + '.before_restore', cur);    // 還原前的紀錄另外留一份
    state = mergeData(obj);
    saveState();
    return true;
  }

  function loadState() {
    const [main, mst] = readSlot(STORAGE_KEY);
    if (main && mst !== 'bad') return mergeData(main);
    if (mst === 'bad') {
      const [bak, bst] = readSlot(BAK_KEY);
      if (bak && bst !== 'bad') {
        saveWarning = '🐾 學習紀錄好像被別的程式改過了，我已經幫你恢復成上一次的紀錄。';
        return mergeData(bak);
      }
      saveWarning = '🐾 學習紀錄讀不出來，所以先重新開始。如果有備份檔或搬家碼，可以到「搬家碼／備份」還原。';
    }
    return normalizeData(defaultData());
  }

  function saveState() {
    state.format = 'puppy-study/2';
    state.pets.fullness = Math.round(Math.max(0, Math.min(100, state.pets.fullness)) * 10) / 10;
    state.sig = sigOf(state);
    const txt = JSON.stringify(state);
    const prev = lsGet(STORAGE_KEY);
    if (lsSet(STORAGE_KEY, txt)) {
      lsSet(SIG_ON_KEY, '1');
      // 備份只留「簽章正確」的上一份，主存檔壞掉或被改時用它還原
      if (prev) {
        try { if (checkSig(JSON.parse(prev)) === 'ok') lsSet(BAK_KEY, prev); } catch (e) { /* 忽略 */ }
      } else {
        lsSet(BAK_KEY, txt);
      }
      dailySnapshot(txt, false);
    }
    updateTopBar();
    updatePetSidebar();
    renderPlayground();
  }

  // ── 飽足度：隨時間慢慢下降；餓了只會沒力氣玩，不會有任何處罰 ──
  function tickFullness() {
    const p = state.pets;
    const now = Date.now();
    if (!p.full_ts || p.full_ts > now) { p.full_ts = now; return p.fullness; }
    const hrs = (now - p.full_ts) / 3600000;
    if (hrs >= 0.02) {
      p.fullness = Math.max(0, p.fullness - hrs * FULL_DECAY_PER_HOUR);
      p.full_ts = now;
    }
    return p.fullness;
  }

  function addFullness(n) {
    tickFullness();
    state.pets.fullness = Math.max(0, Math.min(100, state.pets.fullness + n));
  }

  function isTired() {
    return tickFullness() < TIRED_BELOW;
  }

  // ── 詞庫整理（與 study_english.py 邏輯完全一致） ──
  function initVocab() {
    const rawWords = (window.VOCAB_CEEC && window.VOCAB_CEEC.words) ? window.VOCAB_CEEC.words : [];
    const byid = {};
    rawWords.forEach(w => { byid[w.id] = w; });
    const tracks = {};

    function posMain(w) {
      return (w.p || '').split('/')[0].replace(/[. ()]/g, '').trim();
    }
    function isFunc(w) {
      return FUNC_POS.has(posMain(w));
    }

    TRACKS.forEach(([tid, , , , flt]) => {
      if (flt === 'kid') {
        const pool = rawWords.filter(w =>
          w.l === 1 &&
          ['n', 'adj', 'v'].includes(posMain(w)) &&
          !KID_STOP.has((w.s || '').toLowerCase()) &&
          (w.s || '').length >= 3 &&
          /^[a-zA-Z]+$/.test(w.s || '')
        );
        pool.sort((a, b) => (b.f || 0) - (a.f || 0));
        tracks[tid] = pool.slice(0, 300).map(w => w.id);
      } else {
        const lv = rawWords.filter(w => w.l === flt);
        lv.sort((a, b) => {
          const fa = isFunc(a) ? 1 : 0;
          const fb = isFunc(b) ? 1 : 0;
          if (fa !== fb) return fa - fb;
          return (b.f || 0) - (a.f || 0);
        });
        tracks[tid] = lv.map(w => w.id);
      }
    });

    vocabDB = { words: rawWords, byid, tracks };
  }

  // ── 發音（iPad Safari / Chrome 皆由點擊觸發） ──
  function speakWord(text) {
    if (!state.settings.tts || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).split('/')[0].replace(/\(.*?\)/g, '').trim());
      u.lang = 'en-US';
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ── 親密度與解鎖條件計算 ──
  function bondLevel(pts) {
    let lv = 1;
    BOND_LV.forEach((need, i) => {
      if (pts >= need) lv = i + 1;
    });
    return lv;
  }

  function bondProgress(pts) {
    const lv = bondLevel(pts);
    if (lv >= BOND_LV.length) return { lv, frac: 1, cur: pts, need: pts };
    const a = BOND_LV[lv - 1];
    const b = BOND_LV[lv];
    return { lv, frac: (pts - a) / (b - a), cur: pts, need: b };
  }

  function maxDogLevel() {
    let best = 1;
    Object.entries(state.pets.bond || {}).forEach(([pid, pts]) => {
      if (pid.startsWith('dog:')) best = Math.max(best, bondLevel(pts));
    });
    return best;
  }

  // 才藝看「所有夥伴裡最高的親密度」：換夥伴不會忘記已經學會的才藝
  function maxBondPts() {
    let best = 0;
    Object.values(state.pets.bond || {}).forEach(pts => { best = Math.max(best, parseInt(pts, 10) || 0); });
    return best;
  }

  function maxBondLevel() {
    return bondLevel(maxBondPts());
  }

  function trickOk(cmd) {
    return maxBondLevel() >= (TRICK_LV[cmd] || 1);
  }

  // 加親密度；回傳 { oldLv, newLv, newTricks }（newTricks＝這次升級學會的才藝）
  function addBond(n, pid) {
    pid = pid || state.pets.current || 'dog:威爾斯柯基';
    const before = maxBondLevel();
    const oldPts = parseInt(state.pets.bond[pid], 10) || 0;
    const oldLv = bondLevel(oldPts);
    state.pets.bond[pid] = oldPts + Math.max(0, Math.round(n));
    const newLv = bondLevel(state.pets.bond[pid]);
    const after = maxBondLevel();
    const newTricks = TRICKS.filter(t => t[3] > before && t[3] <= after);
    return { oldLv, newLv, newTricks };
  }

  function announceBond(res, petName) {
    if (res.newLv <= res.oldLv) return false;
    let msg = `💕 太棒了！${petName} 的親密度升到 Lv${res.newLv} 了！`;
    if (res.newTricks.length) {
      msg += ` 🎓 學會新才藝：${res.newTricks.map(t => t[1] + t[2]).join('、')}！`;
      const first = res.newTricks[0][0];
      setTimeout(() => { if (window.PuppyInteractive) window.PuppyInteractive.command(first); }, 900);
    }
    petSay(msg, 'normal');
    return true;
  }

  function condProgress(cond) {
    const t = state.totals || {};
    switch (cond) {
      case 'free': return [1, 1];
      case 'focus1': return [Math.min(1, (t.focus_sessions || 0) + (t.hw_done || 0)), 1];
      case 'stage3': return [Math.min(3, t.stage_pass || 0), 3];
      case 'days10': {
        const days = Object.keys(state.history || {}).filter(k => state.history[k] && state.history[k].xp > 0).length;
        return [Math.min(10, Math.max(days, (state.streak && state.streak.best) || 0)), 10];
      }
      case 'eng5': return [Math.min(5, t.eng_lessons || 0), 5];
      case 'streak3': return [Math.min(3, (state.streak && state.streak.best) || 0), 3];
      case 'math150': return [Math.min(150, t.math_correct || 0), 150];
      case 'hw15': return [Math.min(15, t.hw_done || 0), 15];
      case 'focus300': return [Math.min(300, t.focus_min || 0), 300];
      case 'streak7': return [Math.min(7, (state.streak && state.streak.best) || 0), 7];
      case 'eng30': return [Math.min(30, t.eng_lessons || 0), 30];
      case 'stars150': return [Math.min(150, t.stars_earned || 0), 150];
      default: return [0, 1];
    }
  }

  function isPetUnlocked(pid) {
    if (state.pets.unlocked && state.pets.unlocked[pid]) return true;
    const row = PETS.find(p => p[0] === pid);
    if (!row) return false;
    const [got, need] = condProgress(row[4]);
    return got >= need;
  }

  function checkNewUnlocks() {
    const newly = [];
    PETS.forEach(p => {
      const pid = p[0];
      if (!state.pets.unlocked[pid] && isPetUnlocked(pid)) {
        state.pets.unlocked[pid] = todayStr();
        newly.push(p);
      }
    });
    if (newly.length > 0) {
      const last = newly[newly.length - 1];
      petSay(`🎉 新夥伴解鎖：${last[1]} ${last[2]}！可以到「寵物圖鑑」換上牠喔！`, 'happy');
    }
  }

  // ── 經驗值、星星、連續天數與拿手科目加成 ──
  function touchStreak() {
    const td = todayStr();
    const st = state.streak;
    if (st.last === td) return;
    const diff = st.last ? daysBetween(st.last, td) : 0;
    if (!st.last) {
      st.n = 1;
    } else if (diff === 1) {
      st.n += 1;
    } else if (diff === 2 && st.freeze > 0) {
      st.freeze -= 1;
      st.n += 1;
      petSay('🧊 連續天數保護卡發動！保住了你的連續學習紀錄！', 'happy');
    } else if (diff > 1) {
      st.n = 1;
    }
    st.last = td;
    st.best = Math.max(st.best || 0, st.n);
  }

  function award(xp, stars, subjectKey, reasonText) {
    const pid = state.pets.current || 'dog:威爾斯柯基';
    const petRow = PETS.find(p => p[0] === pid) || PETS[0];
    const favSubj = petRow[3];
    let bonusXp = 0;
    let bonusNote = '';

    if (xp > 0 && subjectKey && subjectKey === favSubj) {
      bonusXp = Math.max(1, Math.round(xp * SPECIALTY_BONUS));
      bonusNote = `（${petRow[2]}拿手科目 +${bonusXp} XP、親密度 ×2！）`;
    }

    const totalXp = xp + bonusXp;
    const bondAdd = totalXp * (bonusXp > 0 ? 2 : 1);

    state.xp_total = (state.xp_total || 0) + totalXp;
    state.stars = (state.stars || 0) + stars;
    state.totals.stars_earned = (state.totals.stars_earned || 0) + Math.max(0, stars);

    const bondRes = addBond(bondAdd, pid);

    const td = todayStr();
    if (!state.history[td]) state.history[td] = {};
    state.history[td].xp = (state.history[td].xp || 0) + totalXp;
    if (subjectKey) state.history[td][subjectKey] = (state.history[td][subjectKey] || 0) + 1;

    touchStreak();
    checkNewUnlocks();
    saveState();

    if (!announceBond(bondRes, petRow[2])) {
      petSay(`✨ ${reasonText}：獲得 +${totalXp} XP${stars > 0 ? `、+${stars}⭐` : ''} ${bonusNote}`, 'happy');
    }
  }

  // ════════════════════════════════════════════════════════════════════
  //  v3.3.0 學習換陪玩：道具要用星星、才藝依親密度解鎖
  // ════════════════════════════════════════════════════════════════════
  let lastTrickAt = 0;
  let playTab = 'food';

  // 用掉一個道具（餵食或玩具）。回傳 true＝成功
  function useItem(kind) {
    const it = ITEMS[kind];
    if (!it) return false;
    const [icon, name, cost, fullDelta, cat] = it;
    const full = tickFullness();
    if (cat === 'food' && full >= 95) {
      petSay('😋 我現在好飽，吃不下了～晚一點再餵我吧！（星星幫你留著）', 'normal');
      return false;
    }
    if (cat === 'toy' && kind !== 'bath' && kind !== 'bury' && full < TIRED_BELOW) {
      petSay('🥺 肚子好餓，沒有力氣玩了…先餵我吃點東西好嗎？', 'normal');
      return false;
    }
    if ((state.stars || 0) < cost) {
      petSay(`⭐ ${name}要 ${cost} 顆星星，你現在有 ${state.stars || 0} 顆。完成一關英語闖關或自我打卡就能賺到喔！`, 'normal');
      return false;
    }
    state.stars -= cost;
    state.shop_log = (state.shop_log || []).slice(-40).concat([[todayStr(), kind]]);
    state.totals.shop = (state.totals.shop || 0) + 1;
    addFullness(fullDelta);
    const pid = state.pets.current || 'dog:威爾斯柯基';
    const petRow = PETS.find(p => p[0] === pid) || PETS[0];
    const res = addBond(2, pid);
    const lines = {
      can: '🥫 哇！是特級罐頭！謝謝你用努力換來的大餐！',
      bowl: '🥣 開飯囉！謝謝你用努力換來的飼料！',
      bone: '🦴 潔牙骨！我要慢慢啃～',
      bury: '🕳️ 嗅嗅…地上有寶藏的味道！看我把骨頭挖出來！',
      ball: '⚽ 汪！我去接皮球！也可以用手指抓球再丟出去喔！',
      yarn: '🧶 毛線球滾來滾去～好好玩！',
      frisbee: '🥏 飛盤來了！看我接住它！',
      fly: '🪰 咦？有隻嗡嗡叫的小蒼蠅！看我跳起來抓牠！',
      bath: '🛁 洗香香泡泡浴～洗完還會甩水喔！'
    };
    saveState();
    if (!announceBond(res, petRow[2])) petSay(`${lines[kind] || icon + ' 謝謝你！'}（−${cost}⭐、親密度 +2）`, 'normal');
    const pi = window.PuppyInteractive;
    if (pi) {
      if (kind === 'can' || kind === 'bowl') pi.feedBowl(kind);
      else if (kind === 'bone') pi.throwToy('dental_bone');
      else if (kind === 'ball' || kind === 'yarn' || kind === 'frisbee') pi.throwToy(kind);
      else if (kind === 'bury') pi.buryBone();
      else if (kind === 'fly') pi.spawnFly();
      else if (kind === 'bath') pi.command('bath');
    }
    return true;
  }

  // 表演才藝。回傳 true＝有表演
  function doTrick(cmd) {
    const row = TRICKS.find(t => t[0] === cmd);
    if (!row) return false;
    const need = row[3];
    const lv = maxBondLevel();
    if (lv < need) {
      const lack = Math.max(1, BOND_LV[need - 1] - maxBondPts());
      petSay(`🔒 「${row[2]}」要親密度 Lv${need} 才學得會（現在 Lv${lv}，還差 ${lack} 點）。一起學習，我就會越來越厲害！`, 'normal');
      return false;
    }
    const now = Date.now();
    if (now - lastTrickAt < TRICK_COOLDOWN_MS) return false;
    if (need >= 2 && isTired()) {
      petSay('🥺 肚子好餓，沒有力氣表演了…先餵我吃點東西好嗎？', 'normal');
      return false;
    }
    lastTrickAt = now;
    if (need >= 2) addFullness(-TRICK_COST);
    petSay(row[4], 'normal');
    if (window.PuppyInteractive) window.PuppyInteractive.command(cmd);
    saveState();
    return true;
  }

  // 給 pet_engine.js 用：狗狗自己閒晃時只會做「已經學會」的才藝；餓了就懶洋洋
  window.PUPPY_TRICK_OK = cmd => trickOk(cmd);
  window.PUPPY_IS_TIRED = () => isTired();
  // 用手把地上的玩具丟出去：每丟一次消耗一點飽足度，丟滿 TOY_THROWS 次或餓了就收起來
  window.PUPPY_ON_TOY_THROW = toy => {
    if (isTired()) {
      petSay('🥺 我餓得跑不動了…玩具先收起來，餵我吃點東西再玩好嗎？', 'normal');
      return false;
    }
    toy.throws = (toy.throws || 0) + 1;
    if (toy.throws > TOY_THROWS) {
      petSay('🧺 這個玩具玩夠了，先收起來！想再玩可以到百寶箱再拿一個。', 'normal');
      return false;
    }
    addFullness(-1);
    return true;
  };

  function renderPlayground() {
    const box = document.getElementById('playgroundBody');
    if (!box) return;
    const lv = maxBondLevel();
    const stars = state.stars || 0;
    const learned = TRICKS.filter(t => t[3] <= lv).length;
    const open = state.settings.play_open !== false;
    const tabs = [['food', '🍖 餵食'], ['toy', '🎾 玩具'], ['trick', `🎓 才藝 ${learned}/${TRICKS.length}`]];
    let grid = '';
    if (playTab === 'trick') {
      grid = TRICKS.map(([cmd, icon, name, need]) => need <= lv
        ? `<button class="chip-btn" data-trick="${cmd}">${icon} ${name}</button>`
        : `<button class="chip-btn chip-locked" data-trick="${cmd}" aria-label="${name}，親密度 Lv${need} 解鎖">🔒 ${name}<small>Lv${need}</small></button>`
      ).join('');
    } else {
      grid = Object.keys(ITEMS).filter(k => ITEMS[k][4] === playTab).map(k => {
        const [icon, name, cost] = ITEMS[k];
        return `<button class="chip-btn ${stars < cost ? 'chip-poor' : ''}" data-item="${k}">${icon} ${name}<small>⭐ ${cost}</small></button>`;
      }).join('');
    }
    const nextTrick = TRICKS.find(t => t[3] > lv);
    const tip = playTab === 'trick'
      ? (nextTrick ? `下一個才藝：Lv${nextTrick[3]} ${nextTrick[1]}${nextTrick[2]}（還差 ${Math.max(1, BOND_LV[nextTrick[3] - 1] - maxBondPts())} 點親密度）` : '全部才藝都學會了，太厲害了！')
      : (playTab === 'food' ? '用學習賺到的星星請夥伴吃東西。吃飽了才有力氣玩和表演。' : '買一次玩具可以用手指丟好幾次。直接摸頭、抓起來放開都免費。');
    box.innerHTML = `
      <button class="playground-toggle" id="btnPlayToggle" aria-expanded="${open}">
        <span>🎒 百寶箱 <small>⭐ ${stars}　💕 Lv${lv}</small></span><span>${open ? '▲ 收起' : '▼ 打開'}</span>
      </button>
      <div class="playground-inner" ${open ? '' : 'hidden'}>
        <div class="play-tabs">
          ${tabs.map(([k, t]) => `<button class="play-tab ${k === playTab ? 'active' : ''}" data-playtab="${k}">${t}</button>`).join('')}
        </div>
        <div class="chip-grid">${grid}</div>
        <div class="playground-tip">${tip}</div>
      </div>`;
  }

  function initPlayground() {
    const box = document.getElementById('playgroundBody');
    if (!box) return;
    if (state.settings.play_open === undefined && window.innerWidth <= 820) state.settings.play_open = false;
    box.addEventListener('click', ev => {
      const btn = ev.target.closest('button');
      if (!btn) return;
      if (btn.id === 'btnPlayToggle') {
        state.settings.play_open = state.settings.play_open === false;
        saveState();
      } else if (btn.dataset.playtab) {
        playTab = btn.dataset.playtab;
        renderPlayground();
      } else if (btn.dataset.item) {
        useItem(btn.dataset.item);
      } else if (btn.dataset.trick) {
        doTrick(btn.dataset.trick);
      }
    });
    renderPlayground();
  }

  // ── 寵物互動與記憶招呼 ──
  function petSay(msg, mood = 'normal') {
    const el = document.getElementById('petBubble');
    if (el) el.textContent = msg;
    petAnim.mood = mood;
    petAnim.bounce = 14;
    if (mood === 'happy') {
      for (let i = 0; i < 4; i++) {
        petAnim.hearts.push({
          x: 75 + Math.random() * 70,
          y: 70 + Math.random() * 20,
          vy: 1.2 + Math.random(),
          alpha: 1
        });
      }
    }
    drawPetStage();
    if (window.PuppyInteractive) {
      window.PuppyInteractive.say(msg, mood, mood === 'sad' ? '#e5534b' : '#2fa86b');
    }
  }

  function greetWithMemory() {
    const pid = state.pets.current || 'dog:威爾斯柯基';
    const petRow = PETS.find(p => p[0] === pid) || PETS[0];
    const yd = todayStr(-1);
    const td = todayStr();
    const yHist = state.history[yd];
    const tHist = state.history[td];

    if (yHist && (yHist.xp || 0) > 0) {
      const did = [];
      if (yHist.english) did.push('英語闖關');
      if (yHist.homework) did.push('自我打卡');
      const didStr = did.length ? did.join('和') : `獲得了 ${yHist.xp} 經驗值`;
      petSay(`${petRow[1]} 嗨！我是${petRow[2]}，我記得你昨天完成了${didStr}，今天也一起加油吧！`, 'happy');
    } else if (tHist && (tHist.xp || 0) > 0) {
      petSay(`${petRow[1]} 今天已經累積了 ${tHist.xp} XP 囉！${petRow[2]}在旁邊陪你繼續闖關！`, 'normal');
    } else {
      petSay(`${petRow[1]} 歡迎回來！我是${petRow[2]}，今天想先挑戰英語單字，還是完成自我打卡呢？`, 'normal');
    }
  }

  // ── 繪製寵物 Canvas（含 8 種毛色、3D 角色與配件） ──
  function drawDogOnCanvas(ctx, cx, cy, r, pid, acc, mood, bounceY) {
    cy -= bounceY;
    if (pid.startsWith('dog:')) {
      const breed = pid.slice(4);
      const [coat, belly] = DOG_COAT[breed] || ['#e3893b', '#fffaf2'];

      // 耳朵
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.moveTo(cx + s * r * 0.75, cy - r * 0.25);
        ctx.lineTo(cx + s * r * 0.55, cy - r * 1.05);
        ctx.lineTo(cx + s * r * 0.15, cy - r * 0.55);
        ctx.closePath();
        ctx.fillStyle = coat;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#4a3b32';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + s * r * 0.62, cy - r * 0.38);
        ctx.lineTo(cx + s * r * 0.52, cy - r * 0.85);
        ctx.lineTo(cx + s * r * 0.28, cy - r * 0.55);
        ctx.closePath();
        ctx.fillStyle = '#f6c7b0';
        ctx.fill();
      });

      // 頭與臉頰
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.04, r * 0.82, r * 0.68, 0, 0, Math.PI * 2);
      ctx.fillStyle = coat;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#4a3b32';
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.28, r * 0.46, r * 0.38, 0, 0, Math.PI * 2);
      ctx.fillStyle = belly;
      ctx.fill();

      // 大麥町斑點
      if (breed === '大麥町') {
        [[-0.48, -0.25, 0.1], [0.45, -0.3, 0.08], [0.56, 0.15, 0.07], [-0.58, 0.2, 0.07]].forEach(([dx, dy, rr]) => {
          ctx.beginPath();
          ctx.arc(cx + dx * r, cy + dy * r, rr * r, 0, Math.PI * 2);
          ctx.fillStyle = '#2b2b2b';
          ctx.fill();
        });
      }

      // 眼睛
      [-1, 1].forEach(s => {
        if (mood === 'happy') {
          ctx.beginPath();
          ctx.arc(cx + s * r * 0.3, cy - r * 0.04, r * 0.1, Math.PI, 0);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#231610';
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.ellipse(cx + s * r * 0.3, cy - r * 0.04, r * 0.085, r * 0.1, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#231610';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx + s * r * 0.28, cy - r * 0.07, r * 0.03, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      });

      // 鼻子與嘴巴
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.18, r * 0.12, r * 0.085, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#231610';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.26);
      ctx.lineTo(cx - r * 0.12, cy + r * 0.38);
      ctx.moveTo(cx, cy + r * 0.26);
      ctx.lineTo(cx + r * 0.12, cy + r * 0.38);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#231610';
      ctx.stroke();

      // 腮紅
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.ellipse(cx + s * r * 0.52, cy + r * 0.22, r * 0.11, r * 0.06, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffb3b3';
        ctx.fill();
      });

      // 配件繪製
      ctx.font = `${Math.round(r * 0.52)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      if (acc === 'grad_cap') ctx.fillText('🎓', cx, cy - r * 0.62);
      if (acc === 'crown') ctx.fillText('👑', cx, cy - r * 0.64);
      if (acc === 'sunglasses') ctx.fillText('🕶️', cx, cy + r * 0.06);
      if (acc === 'scarf') ctx.fillText('🧣', cx, cy + r * 0.78);
    } else {
      const petRow = PETS.find(p => p[0] === pid) || PETS[0];
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = '#fdf3e7';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f0d9c4';
      ctx.stroke();
      ctx.font = `${Math.round(r * 1.05)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(petRow[1], cx, cy + 4);
    }
  }

  function drawPetStage() {
    const cv = document.getElementById('petCanvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);

    // 柔和底圈
    ctx.beginPath();
    ctx.arc(110, 105, 74, 0, Math.PI * 2);
    ctx.fillStyle = '#fff5e8';
    ctx.fill();

    const pid = state.pets.current || 'dog:威爾斯柯基';
    const acc = state.pets.acc || 'none';
    drawDogOnCanvas(ctx, 110, 108, 60, pid, acc, petAnim.mood, petAnim.bounce);

    // 飄動愛心
    petAnim.hearts.forEach(h => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, h.alpha);
      ctx.font = '20px sans-serif';
      ctx.fillText('❤️', h.x, h.y);
      ctx.restore();
    });
  }

  setInterval(() => {
    let dirty = false;
    if (petAnim.bounce > 0) {
      petAnim.bounce = Math.max(0, petAnim.bounce - 2);
      dirty = true;
    }
    if (petAnim.hearts.length > 0) {
      petAnim.hearts.forEach(h => {
        h.y -= h.vy;
        h.alpha -= 0.06;
      });
      petAnim.hearts = petAnim.hearts.filter(h => h.alpha > 0);
      dirty = true;
    }
    if (dirty) drawPetStage();
  }, 50);

  // ── 更新頂部與側欄 ──
  function regenHearts() {
    const eng = state.eng;
    if (eng.hearts >= HEART_MAX) {
      eng.hearts_ts = 0;
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    if (!eng.hearts_ts) {
      eng.hearts_ts = now;
      return;
    }
    const elapsed = now - eng.hearts_ts;
    if (elapsed >= HEART_REGEN_SEC) {
      const add = Math.floor(elapsed / HEART_REGEN_SEC);
      eng.hearts = Math.min(HEART_MAX, eng.hearts + add);
      eng.hearts_ts = eng.hearts >= HEART_MAX ? 0 : eng.hearts_ts + add * HEART_REGEN_SEC;
    }
  }

  function updateTopBar() {
    regenHearts();
    document.getElementById('topStreak').textContent = (state.streak && state.streak.n) || 0;
    document.getElementById('topStars').textContent = state.stars || 0;
    document.getElementById('topXp').textContent = state.xp_total || 0;
    document.getElementById('topHearts').textContent = state.eng.hearts;
    const gs = document.getElementById('gradeSelect');
    if (gs && gs.value !== state.grade) gs.value = state.grade;
  }

  function updatePetSidebar() {
    const pid = state.pets.current || 'dog:威爾斯柯基';
    const petRow = PETS.find(p => p[0] === pid) || PETS[0];
    const pts = (state.pets.bond && state.pets.bond[pid]) || 0;
    const bp = bondProgress(pts);
    const subj = SUBJECTS[petRow[3]] || ['⏱', '專注讀書'];

    document.getElementById('petNameLabel').textContent = `${petRow[1]} ${petRow[2]}`;
    document.getElementById('petSubLabel').textContent = `💕 親密度 Lv${bp.lv} ｜ 拿手：${subj[0]} ${subj[1]}（+25% XP）`;
    document.getElementById('bondMeterText').textContent = bp.lv >= 10 ? `Lv10 滿級 (${pts})` : `${pts} / ${bp.need}`;
    document.getElementById('bondBarFill').style.width = `${Math.max(6, Math.round(bp.frac * 100))}%`;

    const full = Math.round(tickFullness());
    document.getElementById('hungerMeterText').textContent = full < TIRED_BELOW ? `${full}%　肚子餓了` : `${full}%`;
    document.getElementById('hungerBarFill').style.width = `${full}%`;
    drawPetStage();
  }

  // ════════════════════════════════════════════════════════════════════
  //  分頁 1：🦉 英語單字闖關
  // ════════════════════════════════════════════════════════════════════
  // 答題時夥伴自動坐到右下角，答完再回來走動（學生自己按過「角落守候」就照學生的選擇）
  let userPeek = false;
  let autoPeek = false;
  function syncFocusMode() {
    const pi = window.PuppyInteractive;
    if (!pi || !pi.setPeek) return;
    const want = (!!currentQuiz && activeTab === 'english') ||
      (activeTab === 'typing' && !!window.PuppyTyping && window.PuppyTyping.isPlaying());
    if (want && !userPeek && !autoPeek) {
      pi.setPeek(true);
      autoPeek = true;
    } else if (!want && autoPeek) {
      pi.setPeek(false);
      autoPeek = false;
    }
    const peekBtn = document.getElementById('btnTogglePeek');
    if (peekBtn) peekBtn.textContent = (userPeek || autoPeek) ? '👁 角落守候中' : '👁 自由走動中';
  }

  function renderEnglishTab() {
    const wrap = document.getElementById('tab-english');
    syncFocusMode();
    if (currentQuiz) {
      renderQuizView(wrap);
      return;
    }

    const curTrack = state.eng.track || 'kid';
    const wordIds = (vocabDB && vocabDB.tracks[curTrack]) || [];
    const totalUnits = Math.max(1, Math.ceil(wordIds.length / 10));
    const doneLessons = (state.eng.prog && state.eng.prog[curTrack]) || 0;
    const curUnitIdx = Math.floor(doneLessons / 3);
    const showStart = Math.max(0, curUnitIdx - 1);
    const showEnd = Math.min(totalUnits, showStart + 8);

    let html = `
      <div class="card-box">
        <div class="section-title">
          <span>🦉 英語單字闖關</span>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-soft" id="btnReviewMistakes" style="min-height:38px;padding:6px 12px;font-size:0.9rem;">
              💪 錯題／加愛心 (${(state.eng.mistakes || []).length})
            </button>
          </div>
        </div>
        <p class="section-sub">選一條路線，每單元 10 個單字分 3 關（新字 5 個 → 新字 5 個 → 單元總複習）。點擊喇叭可聽發音！</p>
        <div class="track-pills">
          ${TRACKS.map(([tid, icon, name]) => `
            <button class="track-pill ${tid === curTrack ? 'active' : ''}" data-track="${tid}">
              ${icon} ${name}
            </button>
          `).join('')}
        </div>

        <div class="unit-grid">
    `;

    for (let u = showStart; u < showEnd; u++) {
      const uids = wordIds.slice(u * 10, u * 10 + 10);
      const sampleWords = uids.slice(0, 4).map(id => vocabDB.byid[id] ? vocabDB.byid[id].w.split('/')[0] : '').join(', ');
      html += `
        <div class="unit-card">
          <div style="font-weight:800;font-size:1.05rem;">第 ${u + 1} 單元</div>
          <div style="font-size:0.86rem;color:var(--muted);margin-top:2px;">${sampleWords}...</div>
          <div class="lesson-btns">
            ${[0, 1, 2].map(l => {
              const gIdx = u * 3 + l;
              const isDone = gIdx < doneLessons;
              const isCur = gIdx === doneLessons;
              const locked = gIdx > doneLessons;
              const label = l < 2 ? `第 ${l + 1} 課` : '總複習';
              return `
                <button class="lesson-btn ${isDone ? 'done' : ''} ${isCur ? 'current' : ''}"
                        data-unit="${u}" data-lesson="${l}" ${locked ? 'disabled' : ''}>
                  ${isDone ? '✓ ' : ''}${label}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    wrap.innerHTML = html;

    wrap.querySelectorAll('.track-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.eng.track = btn.dataset.track;
        saveState();
        renderEnglishTab();
      });
    });

    wrap.querySelectorAll('.lesson-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        startLesson(curTrack, parseInt(btn.dataset.unit, 10), parseInt(btn.dataset.lesson, 10));
      });
    });

    const revBtn = document.getElementById('btnReviewMistakes');
    if (revBtn) {
      revBtn.addEventListener('click', () => startReviewSession());
    }
  }

  function startLesson(track, unitIdx, lessonIdx) {
    regenHearts();
    if (state.eng.hearts <= 0) {
      petSay('❤️ 愛心用完了！可以先按「💪 錯題／加愛心」複習賺回愛心，或到商店補充喔！', 'sad');
      return;
    }
    const allIds = vocabDB.tracks[track] || [];
    const unitIds = allIds.slice(unitIdx * 10, unitIdx * 10 + 10);
    const targetIds = lessonIdx === 0 ? unitIds.slice(0, 5)
                    : lessonIdx === 1 ? unitIds.slice(5, 10)
                    : unitIds;

    const words = targetIds.map(id => vocabDB.byid[id]).filter(Boolean);
    if (!words.length) return;

    const questions = buildQuestions(words, allIds);
    currentQuiz = {
      mode: 'lesson',
      track,
      unitIdx,
      lessonIdx,
      questions,
      idx: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      answered: false
    };
    petSay(`🦉 開始第 ${unitIdx + 1} 單元第 ${lessonIdx + 1} 關！我在旁邊幫你加油！`, 'happy');
    renderEnglishTab();
  }

  function startReviewSession() {
    const allIds = vocabDB.tracks[state.eng.track || 'kid'] || [];
    let poolIds = (state.eng.mistakes || []).slice(0, 6);
    const tdR = todayStr();
    const dueIds = Object.keys(state.eng.words)
      .filter(k => (state.eng.words[k].b || 0) >= 1 && (state.eng.words[k].d || '') <= tdR)
      .sort((x, y) => (state.eng.words[x].b || 0) - (state.eng.words[y].b || 0))
      .map(k => parseInt(k, 10));
    dueIds.forEach(id => { if (poolIds.length < 8 && !poolIds.includes(id)) poolIds.push(id); });
    if (poolIds.length < 5) {
      const extra = allIds.slice(0, 20).filter(id => !poolIds.includes(id));
      while (poolIds.length < 5 && extra.length) {
        const pick = extra.splice(Math.floor(Math.random() * extra.length), 1)[0];
        poolIds.push(pick);
      }
    }
    const words = poolIds.map(id => vocabDB.byid[id]).filter(Boolean);
    const questions = buildQuestions(words, allIds, true);
    currentQuiz = {
      mode: 'review',
      track: state.eng.track || 'kid',
      questions,
      idx: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      answered: false
    };
    petSay('💪 複習時間！完成複習不但能記熟單字，還能免費補回 1 顆 ❤️ 愛心喔！', 'happy');
    renderEnglishTab();
  }

  function shortGloss(w) {
    return (w.z || '').split('；').slice(0, 2).join('；');
  }

  function pickDistractors(targetWord, allIds, count = 3) {
    const out = [];
    const pool = allIds.slice(0, 120).map(id => vocabDB.byid[id]).filter(w => w && w.id !== targetWord.id);
    while (out.length < count && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildQuestions(words, allIds, isReview = false) {
    const qs = [];
    if (!isReview) {
      words.slice(0, 5).forEach(w => {
        qs.push({ type: 'intro', word: w });
      });
    }
    words.forEach((w, i) => {
      const dist = pickDistractors(w, allIds, 3);
      // 1. 看英選中
      qs.push({
        type: 'en2zh',
        word: w,
        options: shuffle([w, ...dist]).map(x => ({ id: x.id, label: shortGloss(x), ok: x.id === w.id }))
      });
      // 2. 看中選英 或 聽音選字
      if (i % 2 === 0) {
        qs.push({
          type: 'zh2en',
          word: w,
          options: shuffle([w, ...dist]).map(x => ({ id: x.id, label: x.w.split('/')[0], ok: x.id === w.id }))
        });
      } else {
        qs.push({
          type: 'listen',
          word: w,
          options: shuffle([w, ...dist]).map(x => ({ id: x.id, label: `${x.w.split('/')[0]}（${shortGloss(x)}）`, ok: x.id === w.id }))
        });
      }
      // 3. 拼字積木（適合平板手指點選）
      const clean = (w.s || w.w.split('/')[0]).replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (clean.length >= 3 && clean.length <= 9) {
        qs.push({
          type: 'tiles',
          word: w,
          target: clean,
          tiles: shuffle(clean.split('').map((ch, idx) => ({ idx, ch, used: false }))),
          picked: []
        });
      }
    });
    return qs;
  }

  function renderQuizView(wrap) {
    const q = currentQuiz.questions[currentQuiz.idx];
    const pct = Math.round(((currentQuiz.idx) / currentQuiz.questions.length) * 100);
    const w = q.word;
    const headWord = w.w.split('/')[0];

    let bodyHtml = '';
    if (q.type === 'intro') {
      bodyHtml = `
        <div style="text-align:center;padding:12px 0;">
          <div style="color:var(--green-d);font-weight:800;">✨ 認識新單字</div>
          <div style="font-size:2.2rem;font-weight:900;margin:8px 0;">${headWord}</div>
          <div style="color:var(--muted);margin-bottom:8px;">[${w.p || ''}] ${w.ph ? `/${w.ph}/` : ''}</div>
          <button class="btn btn-blue" id="btnSpeakWord" style="margin-bottom:14px;">🔊 點聽發音</button>
          <div style="font-size:1.35rem;font-weight:800;color:var(--text);background:var(--gold-l);padding:12px;border-radius:16px;">
            ${shortGloss(w)}
          </div>
          ${w.e ? `<div style="margin-top:12px;color:var(--muted);font-size:0.95rem;">例：${w.e}<br>${w.ez || ''}</div>` : ''}
          <div style="margin-top:18px;">
            <button class="btn btn-green" id="btnIntroNext" style="width:100%;">記住了，下一題 ➜</button>
          </div>
        </div>
      `;
    } else if (q.type === 'en2zh' || q.type === 'zh2en' || q.type === 'listen') {
      const promptTitle = q.type === 'en2zh' ? `「${headWord}」的意思是？`
                        : q.type === 'zh2en' ? `「${shortGloss(w)}」的英文是？`
                        : `🔊 聽發音選出正確的單字`;
      bodyHtml = `
        <div class="quiz-prompt">
          <div>${promptTitle}</div>
          ${q.type !== 'zh2en' ? `<button class="btn btn-soft" id="btnSpeakWord" style="margin-top:8px;">🔊 再聽一次發音</button>` : ''}
        </div>
        <div class="choice-grid">
          ${q.options.map((opt, idx) => `
            <button class="choice-btn ${q.chosen === idx ? (opt.ok ? 'correct' : 'wrong') : (currentQuiz.answered && opt.ok ? 'correct' : '')}"
                    data-idx="${idx}" ${currentQuiz.answered ? 'disabled' : ''}>
              <span style="background:#f2eae1;border-radius:8px;padding:2px 8px;font-size:0.88rem;">${idx + 1}</span>
              <span>${opt.label}</span>
            </button>
          `).join('')}
        </div>
      `;
    } else if (q.type === 'tiles') {
      const built = q.picked.map(t => t.ch).join('');
      bodyHtml = `
        <div class="quiz-prompt">
          <div>拼出「${shortGloss(w)}」的英文</div>
          <button class="btn btn-soft" id="btnSpeakWord" style="margin-top:8px;">🔊 聽發音提示</button>
        </div>
        <div class="tile-answer" id="tileAnswerBox">
          ${q.picked.length ? q.picked.map((t, pIdx) => `
            <button class="letter-tile" data-unpick="${pIdx}" ${currentQuiz.answered ? 'disabled' : ''}>${t.ch}</button>
          `).join('') : '<span style="color:var(--muted);line-height:44px;">點下方字母拼出單字</span>'}
        </div>
        <div class="tile-pool">
          ${q.tiles.map((t, tIdx) => `
            <button class="letter-tile" data-pick="${tIdx}" ${t.used || currentQuiz.answered ? 'disabled style="opacity:0.25;"' : ''}>
              ${t.ch}
            </button>
          `).join('')}
        </div>
        ${!currentQuiz.answered ? `
          <button class="btn btn-green" id="btnCheckTiles" style="width:100%;margin-top:10px;" ${built.length !== q.target.length ? 'disabled' : ''}>
            檢查答案
          </button>
        ` : ''}
      `;
    }

    wrap.innerHTML = `
      <div class="card-box">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <button class="btn btn-soft" id="btnQuitQuiz" style="min-height:38px;padding:6px 12px;">✕ 離開</button>
          <div class="bar-track" style="flex:1;margin:0;">
            <div class="bar-fill" style="width:${pct}%;background:var(--green);"></div>
          </div>
          <span style="font-weight:800;">${currentQuiz.idx + 1} / ${currentQuiz.questions.length}</span>
        </div>
        ${bodyHtml}
        ${currentQuiz.answered ? `
          <div style="margin-top:16px;padding:14px;border-radius:16px;background:${currentQuiz.lastOk ? 'var(--green-l)' : 'var(--red-l)'};display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
            <div style="font-weight:800;">
              ${currentQuiz.lastOk ? '🎉 答對了！' : `💡 正確答案：${headWord}（${shortGloss(w)}）`}
            </div>
            <button class="btn ${currentQuiz.lastOk ? 'btn-green' : 'btn-orange'}" id="btnNextQuestion">
              繼續 ➜
            </button>
          </div>
        ` : ''}
      </div>
    `;

    if (q.type === 'intro' || q.type === 'en2zh' || q.type === 'listen') {
      if (!currentQuiz.answered) speakWord(headWord);
    }

    const spk = document.getElementById('btnSpeakWord');
    if (spk) spk.addEventListener('click', () => speakWord(headWord));

    const quit = document.getElementById('btnQuitQuiz');
    if (quit) quit.addEventListener('click', () => {
      currentQuiz = null;
      renderEnglishTab();
    });

    const introNext = document.getElementById('btnIntroNext');
    if (introNext) introNext.addEventListener('click', () => advanceQuestion());

    wrap.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        q.chosen = idx;
        handleAnswer(q.options[idx].ok, w);
      });
    });

    wrap.querySelectorAll('[data-pick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tIdx = parseInt(btn.dataset.pick, 10);
        const tile = q.tiles[tIdx];
        if (!tile || tile.used) return;
        tile.used = true;
        q.picked.push(tile);
        renderQuizView(wrap);
      });
    });

    wrap.querySelectorAll('[data-unpick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pIdx = parseInt(btn.dataset.unpick, 10);
        const tile = q.picked.splice(pIdx, 1)[0];
        if (tile) tile.used = false;
        renderQuizView(wrap);
      });
    });

    const chkTiles = document.getElementById('btnCheckTiles');
    if (chkTiles) {
      chkTiles.addEventListener('click', () => {
        const built = q.picked.map(t => t.ch).join('').toLowerCase();
        handleAnswer(built === q.target, w);
      });
    }

    const nxt = document.getElementById('btnNextQuestion');
    if (nxt) nxt.addEventListener('click', () => advanceQuestion());
  }

  function handleAnswer(isOk, word) {
    currentQuiz.answered = true;
    currentQuiz.lastOk = isOk;
    speakWord(word.w.split('/')[0]);

    // 間隔複習（和桌面版 study_english.update_word 一樣）：答對往上一盒（一天最多升一次），答錯回第 1 盒並進錯字本
    const wid = String(word.id);
    const td0 = todayStr();
    const r = state.eng.words[wid] || { b: 0, d: '', n: 0, x: 0, u: '' };
    r.n = (r.n || 0) + 1;

    if (isOk) {
      currentQuiz.correct += 1;
      currentQuiz.streak += 1;
      if (r.u !== td0 || (r.b || 0) === 0) r.b = Math.min(5, (r.b || 0) + 1);
      r.d = todayStr(BOX_DAYS[r.b]);
      r.u = td0;
      state.eng.words[wid] = r;
      if (currentQuiz.mode === 'review') state.eng.mistakes = (state.eng.mistakes || []).filter(id => id !== word.id);
      state.totals.eng_correct = (state.totals.eng_correct || 0) + 1;
      state.totals.words_known = Object.values(state.eng.words).filter(x => (x.b || 0) >= 3).length;
      petSay(currentQuiz.streak >= 3 ? `🔥 連對 ${currentQuiz.streak} 題！太強了！` : '🎉 答對了！繼續保持！', 'happy');
    } else {
      currentQuiz.wrong += 1;
      currentQuiz.streak = 0;
      r.b = 1;
      r.d = td0;
      r.x = (r.x || 0) + 1;
      r.u = td0;
      state.eng.words[wid] = r;
      state.eng.mistakes = [word.id].concat((state.eng.mistakes || []).filter(id => id !== word.id)).slice(0, 300);
      if (currentQuiz.mode === 'lesson') {
        state.eng.hearts = Math.max(0, state.eng.hearts - 1);
        if (!state.eng.hearts_ts) state.eng.hearts_ts = Math.floor(Date.now() / 1000);
      }
      petSay('💡 沒關係，把這個字記起來，下次一定會！', 'normal');
    }
    saveState();
    renderEnglishTab();
  }

  function advanceQuestion() {
    if (!currentQuiz) return;
    if (currentQuiz.mode === 'lesson' && state.eng.hearts <= 0) {
      currentQuiz = null;
      petSay('❤️ 愛心用完了，先按「💪 錯題／加愛心」複習一下再繼續闖關吧！', 'normal');
      renderEnglishTab();
      return;
    }
    currentQuiz.idx += 1;
    currentQuiz.answered = false;
    if (currentQuiz.idx >= currentQuiz.questions.length) {
      finishQuiz();
    } else {
      renderEnglishTab();
    }
  }

  function finishQuiz() {
    const qz = currentQuiz;
    currentQuiz = null;
    // 獎勵數字照桌面版 study_english.Lesson.finish()
    const perfect = qz.wrong === 0;
    const td = todayStr();
    if (!state.history[td]) state.history[td] = {};
    if (qz.mode === 'review') {
      state.eng.hearts = Math.min(HEART_MAX, state.eng.hearts + 1);
      if (state.eng.hearts >= HEART_MAX) state.eng.hearts_ts = 0;
      const times = state.history[td].review || 0;
      state.history[td].review = times + 1;
      state.totals.eng_reviews = (state.totals.eng_reviews || 0) + 1;
      const stars = times < REVIEW_STAR_TIMES ? 1 + (perfect ? 1 : 0) : 0;
      award(8 + (perfect ? 3 : 0), stars, 'english',
        stars ? '完成單字複習（愛心 +1❤️）' : '完成單字複習（愛心 +1❤️；今天複習的星星已經拿滿，經驗值照樣算）');
    } else {
      const gIdx = qz.unitIdx * 3 + qz.lessonIdx;
      const curDone = state.eng.prog[qz.track] || 0;
      if (gIdx >= curDone) {
        // 第一次過這一關：算進「英語闖關完成幾關」（解鎖柴犬、小藍龍看這個數字）
        state.eng.prog[qz.track] = gIdx + 1;
        state.totals.eng_lessons = (state.totals.eng_lessons || 0) + 1;
        const isUnit = qz.lessonIdx === 2;
        const stars = 2 + (perfect ? 1 : 0) + (isUnit ? 2 : 0);
        award(10 + (perfect ? 5 : 0), stars, 'english',
          `${isUnit ? '單元總複習過關 👑' : '英語闖關過關'}${perfect ? '（全對加分！）' : ''}`);
      } else {
        // 已經過關的關卡再練一次：獎勵比較少，也不算進解鎖進度（不能靠一直重玩第 1 關刷星星）
        if (perfect) state.eng.hearts = Math.min(HEART_MAX, state.eng.hearts + 1);
        award(5 + (perfect ? 2 : 0), 1, 'english', '舊關卡練習完成');
      }
    }
    renderEnglishTab();
  }

  // ════════════════════════════════════════════════════════════════════
  //  分頁 2：✅ 自我打卡（結合 SEL 誠實確認）
  // ════════════════════════════════════════════════════════════════════
  function allHabits() {
    return [...DEFAULT_HABITS, ...(state.custom_habits || [])];
  }

  // ── v3.4.0 家長蓋章 ──
  function parentPageUrl() {
    if (PARENT_PAGE_URL) return PARENT_PAGE_URL;
    if (/^https?:$/.test(location.protocol)) {
      const u = new URL('parent.html', location.href);
      u.search = '';
      u.hash = '';
      return u.href;
    }
    return '';
  }

  function isPaired() {
    const p = state.parent;
    return !!(p.key && p.dev && p.paired);
  }

  // 回傳 [狀態, 說明]。狀態：off／unpaired／wait／empty／done／ready（和桌面版 stamp_state 一樣）
  function stampState() {
    const p = state.parent;
    const td = todayStr();
    if (!parentPageUrl() || !window.PuppyStamp) return ['off', '家長蓋章要先把網頁版放到網路上才能用（請老師設定）。'];
    if (!isPaired()) return ['unpaired', '還沒有配對家長的手機。'];
    if (p.stamps[td]) return ['done', '今天已經蓋章了！'];
    if (p.wait_until && td < p.wait_until) return ['wait', `換了新的手機配對，${p.wait_until} 開始才能蓋章。`];
    if (!Object.keys((state.checkins && state.checkins[td]) || {}).length) return ['empty', '今天先完成至少一項打卡，再請家長蓋章。'];
    return ['ready', '可以請家長蓋章了。'];
  }

  function startPairing() {
    const p = state.parent;
    p.key = window.PuppyStamp.randomHex(16);
    p.dev = window.PuppyStamp.randomHex(3);
    p.paired = '';
    saveState();
    return parentPageUrl() + '#' + window.PuppyStamp.pairHash(p.key, p.dev);
  }

  function confirmPairing(code) {
    const p = state.parent;
    if (!p.key || String(code).trim() !== window.PuppyStamp.pairCode(p.key, p.dev)) return false;
    p.paired = todayStr();
    p.wait_until = p.ever ? todayStr(REPAIR_WAIT_DAYS) : '';
    p.ever = true;
    delete p.pending;
    saveState();
    return true;
  }

  function summaryPayload() {
    const td = todayStr();
    const done = (state.checkins && state.checkins[td]) || {};
    const hist = state.history[td] || {};
    const pid = state.pets.current || 'dog:威爾斯柯基';
    const petRow = PETS.find(x => x[0] === pid) || PETS[0];
    return window.PuppyStamp.b64uEncode(JSON.stringify({
      h: allHabits().filter(h => done[h.id]).map(h => h.title),
      x: hist.xp || 0,
      l: hist.english || 0,
      s: (state.streak && state.streak.n) || 0,
      n: petRow[2]
    }));
  }

  function stampRequest() {
    const p = state.parent;
    const td = todayStr();
    const payload = summaryPayload();
    if (!p.pending || p.pending.day !== td || p.pending.payload !== payload) {
      p.pending = { day: td, nonce: window.PuppyStamp.randomHex(2), payload };
      saveState();
    }
    return parentPageUrl() + '#' + window.PuppyStamp.stampHash(p.dev, p.pending.day, p.pending.nonce, p.pending.payload);
  }

  // 回傳 [成功, 說明]
  function tryStamp(code) {
    const p = state.parent;
    const td = todayStr();
    const [st, why] = stampState();
    if (st !== 'ready') return [false, why];
    if (!p.pending || p.pending.day !== td) return [false, '請先按「請家長蓋章」顯示今天的 QR Code。'];
    const tries = p.tries[td] || 0;
    if (tries >= STAMP_TRIES) return [false, '今天輸入太多次了，明天再請家長蓋章吧。'];
    const want = window.PuppyStamp.stampCode(p.key, p.dev, p.pending.day, p.pending.nonce, p.pending.payload);
    if (String(code).trim() !== want) {
      p.tries = { [td]: tries + 1 };
      saveState();
      return [false, `數字不對喔，請再看一次家長手機上的 6 位數（今天還可以試 ${STAMP_TRIES - tries - 1} 次）。`];
    }
    p.stamps[td] = true;
    Object.keys(p.stamps).sort().slice(0, -60).forEach(k => { delete p.stamps[k]; });
    delete p.pending;
    state.totals.parent_stamps = (state.totals.parent_stamps || 0) + 1;
    award(STAMP_XP, STAMP_STARS, 'homework', '家長蓋章成功！加碼');
    return [true, `家長蓋章成功！加碼 +${STAMP_STARS}⭐、+${STAMP_XP} 經驗值`];
  }

  function qrSvg(text) {
    try {
      const qr = window.qrcode(0, 'L');
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({ cellSize: 5, margin: 10, scalable: true });
    } catch (e) {
      return '';
    }
  }

  function openStampModal(kind) {
    const pairing = kind === 'pair';
    const url = pairing ? startPairing() : stampRequest();
    const svg = qrSvg(url);
    openModal(`
      <div class="section-title">
        <span>${pairing ? '📱 配對家長的手機' : '🔖 請家長蓋章'}</span>
        <button class="btn btn-soft" id="btnCloseModal" style="min-height:36px;padding:4px 12px;" aria-label="關閉">✕</button>
      </div>
      <ol class="stamp-steps">
        ${pairing
          ? '<li>請家長用手機的相機掃這個 QR Code。</li><li>手機上會顯示「配對完成」和 6 位數配對碼。</li><li>把配對碼打在下面。只有這支手機可以幫你蓋章。</li>'
          : '<li>請家長用配對過的手機掃這個 QR Code。</li><li>家長會看到你今天完成的項目，按「蓋章」。</li><li>把手機上的 6 位數打在下面。</li>'}
      </ol>
      <div class="stamp-qr">${svg || '<p>這台裝置畫不出 QR Code，請重新整理頁面再試一次。</p>'}</div>
      <label class="stamp-label" for="stampCodeInput">家長手機上的 6 位數</label>
      <input id="stampCodeInput" class="stamp-input" inputmode="numeric" autocomplete="off" maxlength="6" pattern="[0-9]*">
      <div id="stampMsg" class="stamp-msg" role="alert"></div>
      <button class="btn btn-green" id="btnStampSubmit" style="width:100%;">${pairing ? '完成配對' : '送出'}</button>
    `);
    const input = document.getElementById('stampCodeInput');
    const submit = () => {
      let ok = false;
      let why = '';
      if (pairing) {
        ok = confirmPairing(input.value);
        why = ok ? '' : '數字不對喔，請再看一次家長手機上的 6 位數配對碼。';
      } else {
        [ok, why] = tryStamp(input.value);
      }
      if (ok) {
        closeModal();
        if (pairing) petSay('📱 家長的手機配對好了！以後打卡完就可以請家長蓋章。', 'happy');
        renderCheckinTab();
      } else {
        document.getElementById('stampMsg').textContent = why;
        input.value = '';
      }
    };
    document.getElementById('btnCloseModal').addEventListener('click', () => { closeModal(); renderCheckinTab(); });
    document.getElementById('btnStampSubmit').addEventListener('click', submit);
    input.addEventListener('keydown', ev => { if (ev.key === 'Enter') submit(); });
  }

  function parentCardHtml() {
    const [st, why] = stampState();
    return `
      <div class="card-box stamp-card">
        <div class="section-title"><span>👨‍👩‍👧 家長蓋章（加碼 +${STAMP_STARS}⭐、+${STAMP_XP} 經驗值）</span></div>
        <p class="section-sub">請家長用手機掃 QR Code，看看你今天完成了什麼，再幫你蓋章。沒有蓋章也沒關係，只是沒有加碼。</p>
        <p class="stamp-status ${st === 'done' || st === 'ready' ? 'good' : ''}">${st === 'done' ? '✅ ' : ''}${why}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${st === 'unpaired' ? '<button class="btn btn-orange" id="btnPairParent">📱 配對家長的手機</button>' : ''}
          ${st === 'ready' ? '<button class="btn btn-orange" id="btnAskStamp">🔖 請家長蓋章</button>' : ''}
          ${['ready', 'done', 'wait', 'empty'].includes(st) ? '<button class="btn btn-soft" id="btnRepair">換一支手機配對</button>' : ''}
        </div>
      </div>`;
  }

  function bindParentCard() {
    const pair = document.getElementById('btnPairParent');
    if (pair) pair.addEventListener('click', () => openStampModal('pair'));
    const ask = document.getElementById('btnAskStamp');
    if (ask) ask.addEventListener('click', () => openStampModal('stamp'));
    const re = document.getElementById('btnRepair');
    if (re) re.addEventListener('click', () => {
      if (confirm(`確定要換一支手機配對嗎？\n\n換了之後，原本那支手機就不能蓋章了，而且要等 ${REPAIR_WAIT_DAYS} 天之後才能再蓋章。`)) openStampModal('pair');
    });
  }

  function renderCheckinTab() {
    const wrap = document.getElementById('tab-checkin');
    const td = todayStr();
    const todayChecks = (state.checkins && state.checkins[td]) || {};
    const habits = allHabits();
    const doneCount = habits.filter(h => todayChecks[h.id]).length;
    const starsToday = Math.min(CHECKIN_STAR_CAP, doneCount);
    const customN = (state.custom_habits || []).length;

    wrap.innerHTML = `
      <div class="card-box">
        <div class="section-title">
          <span>✅ 今日好習慣自我打卡</span>
          <span class="stat-badge" style="background:var(--gold-l);">今日打卡星星：${starsToday} / 4 ⭐</span>
        </div>
        <p class="section-sub">
          真正做到了再點一下打勾喔！每完成一項可獲得 <strong>+1⭐（每日最多 4⭐）與一點經驗值</strong>，累積 15 項還能解鎖「🐕 大麥町」！
        </p>

        <div class="checkin-list">
          ${habits.map(h => {
            const isDone = !!todayChecks[h.id];
            return `
              <div class="checkin-item ${isDone ? 'done' : ''}" data-habit="${h.id}">
                <div class="checkin-left">
                  <div class="check-circle">${isDone ? '✓' : ''}</div>
                  <span>${h.icon} ${h.title}</span>
                </div>
                <span style="font-weight:800;color:${isDone ? 'var(--green-d)' : 'var(--muted)'};">
                  ${isDone ? '今日已完成 ✨' : '點我打卡'}
                </span>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
          ${customN < CUSTOM_HABIT_MAX
            ? `<button class="btn btn-soft" id="btnAddHabit">➕ 請爸媽幫你加一項好習慣（還可以加 ${CUSTOM_HABIT_MAX - customN} 項）</button>`
            : `<span class="section-sub" style="margin:0;">自己加的好習慣已經有 ${CUSTOM_HABIT_MAX} 項（上限）。</span>`}
          ${customN ? '<button class="btn btn-soft" id="btnDelHabit">🗑 刪掉自己加的項目</button>' : ''}
        </div>
      </div>
      ${parentCardHtml()}
    `;
    bindParentCard();

    wrap.querySelectorAll('.checkin-item').forEach(el => {
      el.addEventListener('click', () => {
        const hid = el.dataset.habit;
        if (todayChecks[hid]) {
          petSay('🐾 這一項今天已經打勾完成囉！明天繼續保持！', 'happy');
          return;
        }
        const habit = habits.find(x => x.id === hid);
        if (habit) openHonestyModal(habit);
      });
    });

    const addBtn = document.getElementById('btnAddHabit');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if ((state.custom_habits || []).length >= CUSTOM_HABIT_MAX) return;
        const title = prompt('請爸媽輸入要新增的好習慣（例如：練琴 15 分鐘、幫忙擺碗筷）：');
        if (title && title.trim()) {
          state.custom_habits = state.custom_habits || [];
          state.custom_habits.push({
            id: 'custom_' + Date.now(),
            icon: '🌟',
            title: title.trim().slice(0, 28)
          });
          saveState();
          renderCheckinTab();
        }
      });
    }
    bindDelHabit();
  }

  function bindDelHabit() {
    const del = document.getElementById('btnDelHabit');
    if (!del) return;
    del.addEventListener('click', () => {
      if (!confirm('要刪掉自己加的好習慣項目嗎？（已經拿到的星星不會被收回）')) return;
      state.custom_habits = [];
      saveState();
      renderCheckinTab();
    });
  }

  function openHonestyModal(habit) {
    const pid = state.pets.current || 'dog:威爾斯柯基';
    const petRow = PETS.find(p => p[0] === pid) || PETS[0];

    openModal(`
      <div style="text-align:center;">
        <div style="font-size:3rem;">${petRow[1]}</div>
        <h3 style="margin:8px 0;">${petRow[2]}溫柔地問你：</h3>
        <div style="background:var(--gold-l);border:2px solid var(--line);border-radius:16px;padding:14px;font-size:1.15rem;font-weight:800;margin:12px 0;">
          「${habit.icon} ${habit.title}」<br>真的已經做到了嗎？
        </div>
        <p style="color:var(--muted);font-size:0.92rem;">
          誠實對自己負責是最棒的超能力！如果還沒做完，可以先去做完再回來打勾喔💛
        </p>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button class="btn btn-soft" id="btnHonestCancel" style="flex:1;">還沒，我先去做</button>
          <button class="btn btn-green" id="btnHonestConfirm" style="flex:1;">✨ 真的做到了！</button>
        </div>
      </div>
    `);

    document.getElementById('btnHonestCancel').addEventListener('click', () => {
      closeModal();
      petSay('🐾 沒問題！等你做完再回來找我打勾，我等你喔！', 'normal');
    });

    document.getElementById('btnHonestConfirm').addEventListener('click', () => {
      closeModal();
      const td = todayStr();
      if (!state.checkins) state.checkins = {};
      if (!state.checkins[td]) state.checkins[td] = {};
      const beforeCount = Object.keys(state.checkins[td]).length;
      state.checkins[td][habit.id] = true;
      state.totals.hw_done = (state.totals.hw_done || 0) + 1;
      addFullness(2);
      // 只留最近 60 天的打卡紀錄
      Object.keys(state.checkins).sort().slice(0, -60).forEach(k => { delete state.checkins[k]; });

      const starAward = beforeCount < CHECKIN_STAR_CAP ? 1 : 0;
      award(CHECKIN_XP, starAward, 'homework', `完成好習慣「${habit.title}」`);
      renderCheckinTab();
    });
  }

  // ════════════════════════════════════════════════════════════════════
  //  分頁 3：📖 寵物圖鑑與配件
  // ════════════════════════════════════════════════════════════════════
  function renderDexTab() {
    const wrap = document.getElementById('tab-dex');
    const curPet = state.pets.current || 'dog:威爾斯柯基';
    const curAcc = state.pets.acc || 'none';
    const dogLv = maxDogLevel();

    wrap.innerHTML = `
      <div class="card-box">
        <div class="section-title">
          <span>📖 寵物圖鑑（不抽卡，努力就能解鎖！）</span>
          <button class="btn btn-purple" id="btnDexCard" style="min-height:38px;padding:6px 14px;">🪪 我的寵物卡</button>
        </div>
        <p class="section-sub">帶著夥伴學習牠的「拿手科目」，經驗值 +25%、親密度 2 倍！換夥伴時親密度都會保留不會歸零。</p>

        <div class="dex-grid">
          ${PETS.map(p => {
            const [pid, icon, name, subjKey, condKey, condDesc] = p;
            const unlocked = isPetUnlocked(pid);
            const [got, need] = condProgress(condKey);
            const pts = (state.pets.bond && state.pets.bond[pid]) || 0;
            const lv = bondLevel(pts);
            const subj = SUBJECTS[subjKey] || ['⏱', '專注'];
            const isCurrent = pid === curPet;
            return `
              <div class="dex-card ${unlocked ? '' : 'locked'}">
                <div style="font-size:2.3rem;">${unlocked ? icon : '🔒'}</div>
                <div style="font-weight:800;font-size:1.08rem;margin-top:4px;">${unlocked ? name : `？？？ (${name})`}</div>
                <div style="font-size:0.86rem;color:var(--muted);margin:4px 0;">
                  拿手：${subj[0]} ${subj[1]}
                </div>
                ${unlocked ? `
                  <div style="font-weight:800;color:var(--pink);font-size:0.92rem;margin:6px 0;">💕 親密度 Lv${lv} (${pts} pt)</div>
                  <button class="btn ${isCurrent ? 'btn-green' : 'btn-soft'}" data-use-pet="${pid}" style="width:100%;min-height:40px;" ${isCurrent ? 'disabled' : ''}>
                    ${isCurrent ? '✓ 目前陪伴中' : '換上牠'}
                  </button>
                ` : `
                  <div style="font-size:0.84rem;margin:6px 0;">條件：${condDesc}（${got} / ${need}）</div>
                  <div class="bar-track"><div class="bar-fill" style="width:${Math.round((got / Math.max(1, need)) * 100)}%;background:var(--purple);"></div></div>
                `}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card-box">
        <div class="section-title">
          <span>🎀 狗狗變裝配件（目前最高狗狗親密度：Lv${dogLv}）</span>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
          ${DOG_ACC.map(([aid, icon, name, needLv]) => {
            const ok = dogLv >= needLv;
            const active = curAcc === aid;
            return `
              <button class="btn ${active ? 'btn-purple' : 'btn-soft'}" data-use-acc="${aid}" ${!ok ? 'disabled style="opacity:0.5;"' : ''}>
                ${ok ? icon : '🔒'} ${name} ${ok ? '' : `(需 Lv${needLv})`}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    wrap.querySelectorAll('[data-use-pet]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.usePet;
        state.pets.current = pid;
        const row = PETS.find(x => x[0] === pid) || PETS[0];
        saveState();
        petSay(`${row[1]} 我是${row[2]}！一起開心地學習吧！`, 'happy');
        renderDexTab();
      });
    });

    wrap.querySelectorAll('[data-use-acc]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.pets.acc = btn.dataset.useAcc;
        saveState();
        petSay('✨ 換上新造型了！好看嗎？', 'happy');
        renderDexTab();
      });
    });

    const cardBtn = document.getElementById('btnDexCard');
    if (cardBtn) cardBtn.addEventListener('click', () => openPetCardModal());
  }

  // ════════════════════════════════════════════════════════════════════
  //  分頁 4：📦 搬家碼與備份（支援跨平板／電腦 study_save.json）
  // ════════════════════════════════════════════════════════════════════
  function encodeTransferCode() {
    state.sig = sigOf(state);
    const json = JSON.stringify(state);
    return 'PUPPY3:' + btoa(unescape(encodeURIComponent(json)));
  }

  function decodeTransferCode(code) {
    const clean = String(code || '').replace(/\s+/g, '');
    const body = /^PUPPY[23]:/.test(clean) ? clean.slice(7) : clean;
    const json = decodeURIComponent(escape(atob(body)));
    return JSON.parse(json);
  }

  function renderTransferTab() {
    const wrap = document.getElementById('tab-transfer');
    const code = encodeTransferCode();
    const backups = listDailyBackups();
    const lastExport = state.settings.last_export || '';

    wrap.innerHTML = `
      <div class="card-box">
        <div class="section-title"><span>📦 跨裝置搬家碼與備份</span></div>
        <p class="section-sub">
          學習紀錄只存在你自己的平板或電腦裡，不會上傳到任何伺服器。換平板或想備份時，可以複製下方的「搬家碼」或下載存檔！
          （iPad 久未開啟可能會被系統清除快取，建議點瀏覽器分享按鈕「加到主畫面」並定期備份喔！）
        </p>

        <div style="margin-bottom:14px;">
          <div style="font-weight:800;margin-bottom:6px;">1️⃣ 我的搬家碼（複製到另一台裝置貼上）</div>
          <textarea id="transferOutBox" readonly style="width:100%;height:88px;border-radius:14px;border:2px solid var(--line);padding:10px;font-family:monospace;font-size:0.85rem;">${code}</textarea>
          <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;">
            <button class="btn btn-green" id="btnCopyCode">📋 複製搬家碼</button>
            <button class="btn btn-blue" id="btnDownloadJson">💾 下載備份檔 (study_save.json)</button>
          </div>
        </div>

        <hr style="border:none;border-top:2px dashed var(--line);margin:18px 0;">

        <div>
          <div style="font-weight:800;margin-bottom:6px;">2️⃣ 匯入搬家碼或電腦版 study_save.json</div>
          <textarea id="transferInBox" placeholder="在此貼上 PUPPY3:... 搬家碼" style="width:100%;height:76px;border-radius:14px;border:2px solid var(--line);padding:10px;font-family:monospace;font-size:0.85rem;"></textarea>
          <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;">
            <button class="btn btn-orange" id="btnImportCode">📥 讀取搬家碼還原</button>
            <label class="btn btn-soft" style="cursor:pointer;">
              📂 選擇 study_save.json 檔案匯入
              <input type="file" id="fileImportJson" accept=".json" style="display:none;">
            </label>
          </div>
        </div>
      </div>
      <div class="card-box">
        <div class="section-title"><span>🗂 自動備份（每天一份，保留 7 天）</span></div>
        <p class="section-sub">
          紀錄不見或出問題時，可以還原成某一天的樣子。自動備份也存在這台裝置的瀏覽器裡，
          <strong>清除瀏覽器資料時會一起消失</strong>，所以重要的紀錄請另外按上面的「下載備份檔」保存。
          ${lastExport ? `上次下載備份檔：${lastExport}。` : '你還沒有下載過備份檔。'}
        </p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${backups.length ? backups.map(b => `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 12px;border:2px solid var(--line);border-radius:14px;background:#fff;">
              <div><strong>${b.day}${b.day === todayStr() ? '（今天）' : ''}</strong>
                <span style="color:var(--muted);font-size:0.9rem;">　⭐ ${b.stars}　經驗值 ${b.xp}　🔥 ${b.streak} 天</span></div>
              <button class="btn btn-soft" data-restore-day="${b.day}" style="min-height:38px;padding:4px 14px;">還原</button>
            </div>`).join('') : '<div class="section-sub" style="margin:0;">目前還沒有備份（學習一次之後就會有）。</div>'}
        </div>
        <p class="section-sub" style="margin-top:12px;">
          學習紀錄只存在你自己的裝置，沒有上傳到任何地方，所以紀錄遺失時，作者也沒有辦法幫忙找回。
        </p>
      </div>
      <p class="section-sub" style="text-align:center;">《汪汪小精靈 學習小伙伴》網頁版 ${APP_VERSION}（建置 ${APP_BUILD}）</p>
    `;

    wrap.querySelectorAll('[data-restore-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = btn.dataset.restoreDay;
        if (!confirm(`要把學習紀錄換成 ${day} 的備份嗎？\n\n現在的紀錄會被換掉。`)) return;
        if (restoreDaily(day)) {
          petSay(`🗂 已經還原成 ${day} 的紀錄了！`, 'normal');
          renderTransferTab();
        } else {
          alert('這份備份讀不出來，沒有還原。');
        }
      });
    });

    document.getElementById('btnCopyCode').addEventListener('click', () => {
      const box = document.getElementById('transferOutBox');
      box.select();
      navigator.clipboard && navigator.clipboard.writeText(box.value);
      petSay('📋 搬家碼已經複製好囉！可以貼到另一台平板或記事本保存！', 'happy');
    });

    document.getElementById('btnDownloadJson').addEventListener('click', () => {
      state.sig = sigOf(state);
      const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `study_save_${todayStr()}.json`;
      a.click();
      state.settings.last_export = todayStr();
      saveState();
      petSay('💾 備份檔已經下載好囉！這個檔案也可以直接放進電腦版使用！', 'happy');
    });

    document.getElementById('btnImportCode').addEventListener('click', () => {
      const val = document.getElementById('transferInBox').value.trim();
      if (!val) return;
      try {
        const imported = decodeTransferCode(val);
        applyImportedData(imported);
      } catch (e) {
        alert('搬家碼格式不正確，請確認是否完整複製喔！');
      }
    });

    document.getElementById('fileImportJson').addEventListener('change', ev => {
      const f = ev.target.files && ev.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          applyImportedData(imported);
        } catch (e) {
          alert('檔案格式不正確，請選擇有效的 study_save.json！');
        }
      };
      reader.readAsText(f, 'utf-8');
    });
  }

  function applyImportedData(imported) {
    if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
      alert('這不是學習小伙伴的紀錄，沒有匯入。');
      return;
    }
    // 只接受簽章正確的紀錄（桌面版 v3.2.0 以後的 study_save.json、網頁版 v3.3.0 以後的搬家碼和備份檔）
    if (checkSig(imported) !== 'ok') {
      alert('這份紀錄沒有通過檢查（可能是舊版產生的、沒有複製完整，或內容被改過），所以沒有匯入。\n\n請在原本的裝置上更新到最新版，重新產生搬家碼或備份檔再試一次。');
      return;
    }
    const mine = (state.xp_total || 0) > 0
      ? `這台裝置現在的紀錄（⭐ ${state.stars}、經驗值 ${state.xp_total}）會被換掉。\n` : '';
    if (!confirm(`${mine}要匯入的紀錄：⭐ ${imported.stars || 0}、經驗值 ${imported.xp_total || 0}。\n\n確定要匯入嗎？`)) return;
    state = mergeData(imported);
    saveState();
    petSay('🎉 學習紀錄已經成功搬過來囉！', 'happy');
    renderTransferTab();
  }

  // ════════════════════════════════════════════════════════════════════
  //  商店與寵物卡彈窗
  // ════════════════════════════════════════════════════════════════════
  function openModal(html) {
    const bd = document.getElementById('modalBackdrop');
    const card = document.getElementById('modalCard');
    card.innerHTML = html;
    bd.classList.add('open');
  }

  function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('open');
  }

  function openShopModal() {
    openModal(`
      <div class="section-title">
        <span>🥣 星星獎勵商店（擁有 ⭐ ${state.stars}）</span>
        <button class="btn btn-soft" id="btnCloseModal" style="min-height:36px;padding:4px 12px;">✕</button>
      </div>
      <p class="section-sub">認真學習賺到的星星，可以買好吃的飼料、玩具或親密度蛋糕犒賞夥伴喔！</p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${SHOP.map(([id, icon, name, cost, desc]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:2px solid var(--line);border-radius:16px;background:#fff;">
            <div>
              <div style="font-weight:800;font-size:1.05rem;">${icon} ${name}</div>
              <div style="font-size:0.86rem;color:var(--muted);">${desc}</div>
            </div>
            <button class="btn btn-orange" data-buy="${id}" ${state.stars < cost ? 'disabled style="opacity:0.45;"' : ''}>
              ⭐ ${cost}
            </button>
          </div>
        `).join('')}
      </div>
    `);

    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.querySelectorAll('[data-buy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.buy;
        const item = SHOP.find(s => s[0] === id);
        if (!item || state.stars < item[3]) return;
        const [, icon, name, cost] = item;
        const pid = state.pets.current || 'dog:威爾斯柯基';
        if (ITEMS[id]) {
          // 餵食和玩具：和百寶箱同一套規則（扣星星、飽足度、親密度 +2）
          if (useItem(id)) closeModal(); else openShopModal();
          return;
        }

        if (id === 'hearts' && state.eng.hearts >= HEART_MAX) {
          alert('愛心已經是滿的囉！');
          return;
        }
        if (id === 'freeze' && (state.streak.freeze || 0) >= 2) {
          alert('連續天數保護卡最多可以存 2 張喔！');
          return;
        }

        state.stars -= cost;
        if (id === 'cake') {
          const cakeRes = addBond(15, pid);
          addFullness(10);
          const cakeRow = PETS.find(p => p[0] === pid) || PETS[0];
          if (!announceBond(cakeRes, cakeRow[2])) petSay('🍰 哇！是親密度蛋糕！太好吃了，親密度 +15！', 'happy');
        } else if (id === 'hearts') {
          state.eng.hearts = HEART_MAX;
          petSay('❤️ 英語闖關的愛心補滿 5 顆了！', 'happy');
        } else if (id === 'freeze') {
          state.streak.freeze = (state.streak.freeze || 0) + 1;
          petSay('🧊 獲得 1 張連續天數保護卡！', 'happy');
        }
        state.shop_log = (state.shop_log || []).slice(-40).concat([[todayStr(), id]]);
        saveState();
        openShopModal();
      });
    });
  }

  function openPetCardModal() {
    openModal(`
      <div class="section-title">
        <span>🪪 我的學習夥伴卡</span>
        <button class="btn btn-soft" id="btnCloseModal" style="min-height:36px;padding:4px 12px;">✕</button>
      </div>
      <div style="text-align:center;">
        <canvas id="petCardCanvas" width="560" height="340" style="max-width:100%;height:auto;border-radius:20px;"></canvas>
        <p style="font-size:0.86rem;color:var(--muted);margin:8px 0;">
          圖片只存在你的裝置裡，不會上傳。可以存成圖片拿給老師或家人看喔！
        </p>
        <button class="btn btn-purple" id="btnSaveCardPng" style="width:100%;">💾 下載寵物卡圖片 (PNG)</button>
      </div>
    `);

    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    const cv = document.getElementById('petCardCanvas');
    drawPetCardCanvas(cv);

    document.getElementById('btnSaveCardPng').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = cv.toDataURL('image/png');
      a.download = `我的寵物卡_${todayStr()}.png`;
      a.click();
      petSay('🪪 寵物卡圖片已經存好囉！', 'happy');
    });
  }

  function drawPetCardCanvas(cv) {
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const pid = state.pets.current || 'dog:威爾斯柯基';
    const petRow = PETS.find(p => p[0] === pid) || PETS[0];
    const pts = (state.pets.bond && state.pets.bond[pid]) || 0;
    const bp = bondProgress(pts);
    const subj = SUBJECTS[petRow[3]] || ['⏱', '專注讀書'];
    const unlockedCount = PETS.filter(p => isPetUnlocked(p[0])).length;

    ctx.fillStyle = '#fffdf8';
    ctx.fillRect(0, 0, W, H);

    // 紫色頂欄
    ctx.fillStyle = '#7a6bd1';
    ctx.fillRect(0, 0, W, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Microsoft JhengHei UI", sans-serif';
    ctx.fillText('🪪 學習夥伴卡', 24, 38);
    ctx.font = '14px "Microsoft JhengHei UI", sans-serif';
    ctx.fillStyle = '#e5e0fb';
    ctx.fillText(todayStr(), W - 110, 38);

    // 左側夥伴圖
    ctx.beginPath();
    ctx.arc(114, 166, 76, 0, Math.PI * 2);
    ctx.fillStyle = '#f6efff';
    ctx.fill();
    drawDogOnCanvas(ctx, 114, 170, 56, pid, state.pets.acc || 'none', 'happy', 0);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#4a3b32';
    ctx.font = 'bold 20px "Microsoft JhengHei UI", sans-serif';
    ctx.fillText(`${petRow[1]} ${petRow[2]}`, 114, 272);
    ctx.fillStyle = '#9b8b7e';
    ctx.font = '13px "Microsoft JhengHei UI", sans-serif';
    ctx.fillText(`拿手：${subj[0]} ${subj[1]}`, 114, 298);

    // 右側學習數據
    ctx.textAlign = 'left';
    const x0 = 230;
    ctx.fillStyle = '#7a6bd1';
    ctx.font = 'bold 16px "Microsoft JhengHei UI", sans-serif';
    ctx.fillText('我的學習成果與夥伴', x0, 96);

    ctx.fillStyle = '#e5679a';
    ctx.font = 'bold 22px "Microsoft JhengHei UI", sans-serif';
    ctx.fillText(`💕 親密度 Lv${bp.lv} (${pts} pt)`, x0, 130);

    const stats = [
      ['🔥 連續學習', `${(state.streak && state.streak.n) || 0} 天（最長 ${(state.streak && state.streak.best) || 0} 天）`],
      ['✅ 自我打卡', `累計 ${(state.totals && state.totals.hw_done) || 0} 項好習慣`],
      ['📗 熟練單字', `${(state.totals && state.totals.words_known) || 0} 個單字`],
      ['🐾 圖鑑收集', `${unlockedCount} / ${PETS.length} 隻夥伴`]
    ];
    stats.forEach(([k, v], i) => {
      const y = 178 + i * 32;
      ctx.fillStyle = '#9b8b7e';
      ctx.font = '14px "Microsoft JhengHei UI", sans-serif';
      ctx.fillText(k, x0, y);
      ctx.fillStyle = '#4a3b32';
      ctx.font = 'bold 15px "Microsoft JhengHei UI", sans-serif';
      ctx.fillText(v, x0 + 110, y);
    });

    ctx.strokeStyle = '#7a6bd1';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);
  }

  // ── 切換分頁與事件綁定 ──
  function switchTab(tab) {
    // v3.7.6：打字測驗模式中（含測驗結束等老師解除），不能切到別的分頁
    if (tab !== 'typing' && window.PuppyTyping && window.PuppyTyping.isExam && window.PuppyTyping.isExam()) tab = 'typing';
    activeTab = tab;
    if (window.PuppyTyping && activeTab === 'typing' && tab !== 'typing') window.PuppyTyping.hide();
    ['english', 'checkin', 'typing', 'dex', 'transfer'].forEach(t => {
      const pane = document.getElementById('tab-' + t);
      if (pane) pane.style.display = t === tab ? 'block' : 'none';
    });
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    if (tab === 'english') renderEnglishTab();
    if (tab === 'checkin') renderCheckinTab();
    if (tab === 'dex') renderDexTab();
    if (tab === 'transfer') renderTransferTab();
    if (tab === 'typing' && window.PuppyTyping) window.PuppyTyping.show();
    if (tab !== 'english') syncFocusMode();
  }

  function initEvents() {
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('gradeSelect').addEventListener('change', ev => {
      state.grade = ev.target.value;
      if (state.grade === 'low' || state.grade === 'mid') state.eng.track = 'kid';
      if (state.grade === 'jh') state.eng.track = 'jh1';
      if (state.grade === 'sh') state.eng.track = 'sh3';
      saveState();
      if (activeTab === 'english') renderEnglishTab();
    });

    const touchPet = () => {
      const pid = state.pets.current || 'dog:威爾斯柯基';
      const row = PETS.find(p => p[0] === pid) || PETS[0];
      const lines = [
        `${row[1]} 嘿嘿，被摸頭好舒服喔！繼續加油！`,
        `${row[1]} 我最喜歡陪你一起讀書了！`,
        `${row[1]} 累了的話，深呼吸一下再繼續喔！`
      ];
      petSay(lines[Math.floor(Math.random() * lines.length)], 'happy');
      if (window.PuppyInteractive) {
        const acts = ['belly_rub', 'paw', 'play_paws', 'dance', 'roll'].filter(trickOk);
        window.PuppyInteractive.command(acts[Math.floor(Math.random() * acts.length)]);
      }
    };

    document.getElementById('petCanvasWrap').addEventListener('click', touchPet);
    document.getElementById('btnPetTouch').addEventListener('click', touchPet);
    document.getElementById('btnOpenShop').addEventListener('click', openShopModal);
    document.getElementById('btnOpenCard').addEventListener('click', openPetCardModal);
    document.getElementById('modalBackdrop').addEventListener('click', ev => {
      if (ev.target.id === 'modalBackdrop') closeModal();
    });

    const peekBtn = document.getElementById('btnTogglePeek');
    if (peekBtn) {
      peekBtn.addEventListener('click', () => {
        if (!window.PuppyInteractive) return;
        const isPeek = window.PuppyInteractive.togglePeek();
        userPeek = isPeek;
        autoPeek = false;
        peekBtn.textContent = isPeek ? '👁 角落守候中' : '👁 自由走動中';
        petSay(isPeek ? '🐾 我乖乖坐在右下角陪你讀書，不擋住題目喔！' : '🐾 太棒了！我可以在畫面上自由散步跑跳囉！', 'happy');
      });
    }

    // 支援 Chromebook / 電腦鍵盤快速答題
    window.addEventListener('keydown', ev => {
      if (!currentQuiz || activeTab !== 'english') return;
      if (['1', '2', '3', '4'].includes(ev.key) && !currentQuiz.answered) {
        const idx = parseInt(ev.key, 10) - 1;
        const btn = document.querySelector(`.choice-btn[data-idx="${idx}"]`);
        if (btn) btn.click();
      } else if (ev.key === 'Enter') {
        const nxt = document.getElementById('btnNextQuestion') || document.getElementById('btnIntroNext');
        if (nxt) nxt.click();
      }
    });

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  // 啟動
  initVocab();
  if (window.PuppyInteractive) window.PuppyInteractive.init();
  initEvents();
  initPlayground();
  // v3.5.0 英打練習：紀錄放在 state.typing，獎勵走同一個 award()
  if (window.PuppyTyping) {
    window.PuppyTyping.mount(document.getElementById('tab-typing'), {
      getState: () => state,
      save: () => saveState(),
      award: (xp, stars, subj, text) => award(xp, stars, subj, text),
      petSay: msg => petSay(msg, 'normal'),
      focus: () => syncFocusMode()
    });
  }
  updateTopBar();
  updatePetSidebar();
  greetWithMemory();
  if (saveWarning) petSay(saveWarning, 'normal');
  switchTab(location.hash === '#typing' || (window.PuppyTyping && window.PuppyTyping.isExam && window.PuppyTyping.isExam()) ? 'typing' : 'english');
  setInterval(() => { tickFullness(); updatePetSidebar(); }, 60000);
  // v3.3.2：離開頁面時把今天的自動備份更新成最新；並請瀏覽器不要自動清掉這個網站的資料
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const txt = lsGet(STORAGE_KEY);
      if (txt) dailySnapshot(txt, true);
    }
  });
  if (!SELFTEST && navigator.storage && navigator.storage.persist) {
    try { navigator.storage.persist().catch(() => {}); } catch (e) { /* 忽略 */ }
  }
  // 自動測試用（網址加 ?selftest=1 才會出現）
  if (SELFTEST) {
    window.PUPPY_TEST = {
      useItem, doTrick, addBond, award, sigOf, saveState, maxBondLevel, tickFullness, encodeTransferCode,
      decodeTransferCode, checkSig, startLesson, startReviewSession, handleAnswer, advanceQuestion,
      stampState, startPairing, confirmPairing, stampRequest, tryStamp,
      quiz: () => currentQuiz, applyImportedData, loadState
    };
  }

  // 網址加 ?apptest=1：在頁面裡自己跑一遍規則檢查，結果寫在 <body data-app-selftest="PASS:數量"> 或 "FAIL:原因"
  // （Windows 上用 Edge 無頭模式就能讀到；AI交接/自動測試.bat 會用它）
  function runAppSelfTest() {
    const fails = [];
    let n = 0;
    const ok = (c, m) => { n += 1; if (!c) fails.push(m); };
    const keys = [STORAGE_KEY, BAK_KEY, SIG_ON_KEY];
    try {
      window.alert = () => {};
      window.confirm = () => true;
      keys.forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* 忽略 */ } });
      state = loadState();
      const play = (u, l) => {
        startLesson('kid', u, l);
        let guard = 0;
        while (currentQuiz && guard++ < 300) {
          const q = currentQuiz.questions[currentQuiz.idx];
          if (q.type !== 'intro') handleAnswer(true, q.word);
          advanceQuestion();
        }
      };
      ok(state.stars === 0 && maxBondLevel() === 1, '新存檔應該是 0 星、Lv1');
      ok(useItem('bowl') === false && state.stars === 0, '0 星不能買飼料');
      ok(!trickOk('copter') && !trickOk('roll') && trickOk('paw'), 'Lv1：螺旋槳、翻滾上鎖，握手可以');
      ok(doTrick('copter') === false, 'Lv1 不能表演螺旋槳');
      lastTrickAt = 0;
      ok(doTrick('paw') === true, 'Lv1 可以握手');
      ok(doTrick('sit') === false, '冷卻時間內不能連續表演');
      play(0, 0);
      ok(state.stars === 3 && state.xp_total === 15 && state.totals.eng_lessons === 1, '第 1 關全對應該 +3⭐、+15 經驗值，實際 ' + state.stars + '⭐ ' + state.xp_total);
      ok(Object.values(state.eng.words).every(r => 'b' in r && !('box' in r)), '單字紀錄要用桌面版格式');
      play(0, 0);
      ok(state.stars === 4 && state.totals.eng_lessons === 1, '重玩舊關卡只 +1⭐、不算進度，實際 ' + state.stars);
      ok(useItem('ball') === true && state.stars === 2, '買皮球 −2⭐');
      state.pets.fullness = 5;
      state.stars = 20;
      ok(useItem('frisbee') === false && state.stars === 20, '餓的時候不能玩飛盤，星星不扣');
      addBond(100);
      lastTrickAt = 0;
      ok(doTrick('roll') === false, '餓的時候不能翻滾');
      ok(useItem('can') === true && state.stars === 14 && state.pets.fullness >= 49, '餵罐頭 −6⭐、飽足度 +45');
      lastTrickAt = 0;
      ok(doTrick('roll') === true, 'Lv3 可以翻滾');
      lastTrickAt = 0;
      ok(doTrick('dance') === false, 'Lv3 還不能跳舞');
      ok(sha256Hex('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'SHA-256 計算正確');
      saveState();
      ok(checkSig(JSON.parse(localStorage.getItem(STORAGE_KEY))) === 'ok', '存檔有正確的簽章');
      const code = encodeTransferCode();
      const before = state.stars;
      const fake = decodeTransferCode(code);
      fake.stars = 5000;
      applyImportedData(fake);
      ok(state.stars === before, '被改過的搬家碼不能匯入');
      applyImportedData(decodeTransferCode(code));
      ok(state.stars === before && code.startsWith('PUPPY3:'), '正常的搬家碼可以匯入');
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      raw.stars = 9999;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
      ok(loadState().stars !== 9999, '直接改星星數字，重新讀取時會還原');
      // 家長蓋章（固定的測試數字和桌面版 study_checkin.stamp_code 相同）
      const TK = '00112233445566778899aabbccddeeff';
      ok(!!window.PuppyStamp && window.PuppyStamp.pairCode(TK, 'ab12cd') === '799228' &&
        window.PuppyStamp.stampCode(TK, 'ab12cd', '2026-11-15', '9f3a', '測試payload') === '100238', '蓋章碼算法和桌面版相同');
      ok(typeof window.qrcode === 'function' && qrSvg('https://example.com/parent.html#p=abc').includes('<svg'), '畫得出 QR Code');
      PARENT_PAGE_URL = '';
      ok(location.protocol === 'file:' ? stampState()[0] === 'off' : true, '沒有網址時家長蓋章不開放');
      PARENT_PAGE_URL = 'https://example.com/parent.html';
      state.parent = { key: '', dev: '', paired: '', stamps: {}, tries: {} };
      state.checkins = {};
      ok(stampState()[0] === 'unpaired', '設定網址後顯示還沒配對');
      const purl = startPairing();
      const pc = window.PuppyStamp.pairCode(state.parent.key, state.parent.dev);
      const wrongOf = c => String((parseInt(c, 10) + 1) % 1000000).padStart(6, '0');
      ok(purl.endsWith('#p=' + state.parent.key + '.' + state.parent.dev) && confirmPairing(wrongOf(pc)) === false, '配對碼打錯不會配對');
      ok(confirmPairing(pc) === true && stampState()[0] === 'empty', '配對成功；今天還沒打卡不能蓋章');
      state.checkins[todayStr()] = { hw_today: true };
      ok(stampState()[0] === 'ready', '打卡後可以請家長蓋章');
      const surl = stampRequest();
      const pd = state.parent.pending;
      const sc = window.PuppyStamp.stampCode(state.parent.key, state.parent.dev, pd.day, pd.nonce, pd.payload);
      ok(surl.split('#s=')[1] === [state.parent.dev, pd.day, pd.nonce, pd.payload].join('.'), '蓋章網址格式正確');
      const sBefore = state.stars;
      ok(tryStamp(wrongOf(sc))[0] === false && state.stars === sBefore, '蓋章碼打錯沒有獎勵');
      ok(tryStamp(sc)[0] === true && state.stars === sBefore + STAMP_STARS && state.totals.parent_stamps === 1, '蓋章碼正確：加碼 +3⭐');
      ok(stampState()[0] === 'done' && tryStamp(sc)[0] === false, '一天只能蓋一次章');
      PARENT_PAGE_URL = '';
      // 英打練習（v3.5.0）
      const T = window.PuppyTyping && window.PuppyTyping._t;
      ok(!!T, '英打練習有載入');
      if (T) {
        const F = T.FINGER_OF;
        ok(F.f === 'L2' && F.j === 'R2' && F[' '] === 'T' && F.b === 'L2' && F.y === 'R2' && F.a === 'L5' && F.p === 'R5', '手指對應正確（F、B 左食指，J、Y 右食指）');
        const all = T.LETTERS_BEFORE.L15;
        ok(all.length === 26 && new Set(all.split('')).size === 26, '15 關剛好教完 26 個字母');
        ok(/^[fj ]+$/.test(T.makeText('fj', 'fj', 30)), '第 1 關只會出現 F、J 和空白');
        ok(T.starsFor(99, 0) === 3 && T.starsFor(90, 0) === 2 && T.starsFor(70, 0) === 1 && T.starsFor(99, 2) === 0, '星星：95%↑三顆、85%↑兩顆、亂按兩次沒有星星');
        state.typing = {};
        state.stars = 0;
        const key = (k, extra) => T.handleKey(Object.assign({ key: k, preventDefault() {}, getModifierState() { return false; } }, extra || {}));
        T.startLesson('L01');
        const r = T.run();
        const want = r.text[0];
        const wrong = want === 'f' ? 'k' : 'f';
        ok(key(wrong) === 'miss' && T.run().pos === 0 && T.run().miss === 1, '打錯不會往前，記一次錯');
        ok(key('Process', { keyCode: 229, code: wrong === 'k' ? 'KeyK' : 'KeyF' }) === 'miss' && T.run().miss === 2, '開著中文輸入法也照實際按的鍵判斷（按錯算錯）');
        ok(key('F', { code: 'KeyD', shiftKey: true }) !== 'ok' || want === 'd', '只看實際按的鍵，不看螢幕上打出來的字');
        T.setRun({ wrongTimes: [], wrongStreak: 0 });
        ok(key('w', { ctrlKey: true, code: 'KeyW' }) === 'ignored' && key('Meta', { code: 'MetaLeft' }) === 'ignored', 'Ctrl、Win 組合鍵不算對錯，也會被擋下');
        ok(key('Process', { keyCode: 229, code: 'Key' + want.toUpperCase() }) === 'ok' && T.run().pos === 1, '開著中文輸入法、按對的鍵也算對，往前一格');
        T.setRun({ wrongTimes: [], wrongStreak: 0 });
        let res = '';
        for (let i = 0; i < 8; i++) res = key(T.run().text[T.run().pos] === 'f' ? 'k' : 'f');
        ok(res === 'mash' && T.status()[0] === 'red' && T.run().mash === 1, '2 秒內打錯 8 次：顯示紅色「亂按」');
        T.quit();
        const playAll = id => { T.startLesson(id); let g = 0; while (T.run() && g++ < 500) key(T.run().text[T.run().pos]); };
        const s0 = state.stars;
        playAll('L01');
        ok(T.result().stars === 3 && T.result().xp === 8 && state.stars === s0 + 3 && state.typing.prog.L01 === 3, '第 1 關全對：三顆星、+8 經驗值、+3⭐');
        ok(T.unlockedIndex() === 1, '過了第 1 關，第 2 關打開');
        playAll('L01');
        ok(T.result().xp === 3 && state.stars === s0 + 3, '重玩已經三顆星的關卡：+3 經驗值、沒有星星');
        ok(state.typing.days[todayStr()].lessons === 2 && state.typing.keys.f[0] > 0, '今天的練習紀錄和按鍵統計有記下來');
        // 注音鍵位（v3.6.0）
        const Z = T.ZH_OF_KEY;
        ok(Z['1'] === 'ㄅ' && Z.q === 'ㄆ' && Z.u === 'ㄧ' && Z['-'] === 'ㄦ' && Z['6'] === 'ˊ' && Z['3'] === 'ˇ' && Z['/'] === 'ㄥ' && Object.keys(Z).length === 41, '注音鍵位是標準大千式（41 個鍵）');
        ok(Array.from(T.MODES.zh.before.Z11).length === 41, '注音 11 關剛好教完 37 個符號和 4 個聲調');
        state.zhuyin = {};
        const zkey = (code) => T.handleKey({ key: 'Process', code, keyCode: 229, preventDefault() {}, getModifierState() { return false; } });
        const codeOf = ch => { const k = T.KEY_OF_ZH[ch]; return Object.keys(T.CODE_KEY).find(c => T.CODE_KEY[c] === k); };
        T.startLesson('Z01');
        ok(/^[ㄅㄆㄇㄈ]+$/.test(T.run().text.join('')), '注音第 1 關只出現 ㄅㄆㄇㄈ、沒有空白');
        const zw = T.run().text[0];
        ok(zkey(codeOf(zw === 'ㄅ' ? 'ㄆ' : 'ㄅ')) === 'miss' && zkey(codeOf(zw)) === 'ok', '開著微軟注音（按鍵代碼）也能判斷對錯');
        let zg = 0;
        while (T.run() && zg++ < 500) zkey(codeOf(T.run().text[T.run().pos]));
        ok(T.result().mode === 'zh' && state.zhuyin.prog.Z01 >= 2 && T.unlockedIndex('zh') === 1 && state.typing.prog.L01 === 3, '注音過關紀錄另外存，不會蓋到英打');
        // 全班測驗與自己挑戰（v3.6.0）
        const pc = T.parseCode('130317');
        ok(pc && pc.mode === 'en' && pc.minutes === 2 && pc.scope === 3 && pc.symbols === 'fjdksl', '測驗碼 130317：英打 2 分鐘、考到第 3 關');
        const p20 = T.parseCode('110110');
        ok(p20 && p20.secs === 20 && p20.timeText === '20 秒' && T.parseCode('180110').timeText === '10 分鐘' && T.TIMES.join() === '20,60,120,180,240,300,480,600', '測驗時間：20 秒、1、2、3、4、5、8、10 分鐘（三種科目都一樣）');
        ok(T.makeCode('cn', 600, 2, 7) === '380207' && T.makeCode('en', 20, 14, 99) === '111499', '測驗碼產生：科目＋時間＋範圍＋題目編號');
        const pz = T.parseCode('260323');
        ok(pz && pz.mode === 'zh' && pz.minutes === 5 && pz.scope === 3 && T.parseCode('400000') === null && T.parseCode('121500') === null && T.parseCode('190101') === null && T.parseCode('100101') === null && T.parseCode('12345') === null, '注音鍵位測驗碼可以解析，錯的碼會被擋下');
        ok(T.testText(pc) === T.testText(T.parseCode('130317')) && T.testText(pc) !== T.testText(T.parseCode('130318')) && !/\s/.test(T.testText(pc)) && /^[fjdksl]+$/.test(T.testText(pc)), '同一組碼題目一模一樣、沒有空白、只考範圍內的字母');
        ok(T.scoreOf(100, 0) === 100 && T.scoreOf(90, 10) === 81 && T.scoreOf(0, 0) === 0, '得分＝打對字數×正確率');
        T.common().who = { g: 0, c: 0, s: 0 };
        ok(T.prepareTest('120101', false) === false && T.view() === 'testsetup', '全班測驗沒選年級班級座號不能開始');
        T.common().who = { g: 4, c: 3, s: 12 };
        T.setMode('en');
        ok(T.prepareTest('120101', false) === true && T.view() === 'ready', '選好座號、輸入測驗碼後進入準備畫面');
        ok(/等候老師說開始之後，才能按鈕開始挑戰/.test((document.querySelector('#tab-typing .ty-wait-teacher') || {}).textContent || '') && window.PuppyTyping.isPlaying(), '準備畫面有超明顯的「等候老師說開始」，狗狗躲到角落');
        ok(T.handleKey({ key: 'Enter', preventDefault() {} }) === 'start' && T.view() === 'play' && T.run().test.attempt === 1, '按 Enter 開始，記第 1 次');
        ok(key(T.run().text[0]) === 'ignored', '倒數 3 秒內按鍵不算');
        T.setRun({ test: Object.assign(T.run().test, { startAt: Date.now() - 1 }) });
        for (let i = 0; i < 18; i++) key(T.run().text[T.run().pos]);
        key(T.run().text[T.run().pos] === 'f' ? 'j' : 'f');
        key(T.run().text[T.run().pos]);
        const s1 = state.stars;
        T.finishTest();
        const tr = T.result();
        ok(tr.test && tr.ok === 19 && tr.miss === 1 && tr.score === 18 && tr.xp === 4 && state.stars === s1, '測驗結束：19 對 1 錯得 18 分、+4 經驗值、不給星星');
        // v3.7.6：全班測驗結束鎖在 QR 畫面，要解除密碼
        const tyP = document.getElementById('tab-typing');
        ok(T.isExam() && document.body.classList.contains('ty-exam') && !!T.common().lock && tyP.querySelector('#tyUnlock') && !tyP.querySelector('#tyDone'), '全班測驗結束：停在 QR 畫面、要輸入解除密碼');
        ok(/^\d{4}$/.test(T.unlockCode('120101')) && T.unlockCode('120101') !== T.unlockCode('120102'), '解除密碼 4 位數，每組測驗碼都不一樣');
        tyP.querySelector('#tyUnlock').value = '0000' === T.unlockCode('120101') ? '1111' : '0000';
        tyP.querySelector('#tyUnlockGo').click();
        ok(T.view() === 'testresult' && /不對/.test(tyP.querySelector('#tyUnlockMsg').textContent), '密碼錯誤不能離開');
        switchTab('english');
        ok(activeTab === 'typing', '測驗模式中不能切到別的分頁');
        tyP.querySelector('#tyUnlock').value = T.unlockCode('120101');
        tyP.querySelector('#tyUnlockGo').click();
        ok(T.view() === 'home' && !T.isExam() && !T.common().lock && !document.body.classList.contains('ty-exam'), '輸入正確的解除密碼才回到一般練習');
        const parts = tr.qr.split('.');
        ok(parts.length === 12 && parts[0] === 'Z2' && parts[1] === '120101' && parts[2] === '4' && parts[3] === '3' && parts[4] === '12' && parts[5] === '1' && parts[6] === '19' && parts[7] === '1', 'QR 內容有測驗碼、年班座號、次數、打對打錯（v3.8.1 短格式）');
        ok(window.PuppyStamp.code(window.PuppyTyping.QR_KEY, parts.slice(0, 11).join('.')) === parts[11], 'QR 檢查碼正確（老師端可以驗證）');
        ok(/^[0-9A-Z.]+$/.test(tr.qr) && tr.qr.length < 60, 'QR 只用數字、大寫和點（英數模式，格子少、好掃）');
        T.prepareTest('120101', false);
        T.startTest();
        T.setRun({ test: Object.assign(T.run().test, { startAt: Date.now() - 1 }) });
        key(T.run().text[0]);
        T.finishTest();
        ok(T.result().attempt === 2 && T.result().xp === 0, '同一組碼第 2 次：次數變 2、沒有經驗值');
        let selfXp = 0;
        for (let i = 0; i < 4; i++) {
          T.prepareTest(T.makeCode('zh', 120, 1), true);
          T.startTest();
          T.setRun({ test: Object.assign(T.run().test, { startAt: Date.now() - 1 }) });
          zkey(codeOf(T.run().text[0]));
          T.finishTest();
          selfXp += T.result().xp;
        }
        ok(T.result().self && T.result().mode === 'zh' && selfXp === 9, '自己挑戰（注音）：每天前 3 次各 +3 經驗值，實際 ' + selfXp);
        // 瀏覽人次（v3.7.1）：自動測試時不連線、不顯示
        const vc = document.getElementById('visitCount');
        ok(window.PuppyCounter && vc && vc.hidden === true, '自動測試時不連線計數、不顯示瀏覽人次');
        window.PuppyCounter.show(1234);
        ok(vc.textContent === '瀏覽人次 1,234' && !vc.hidden, '瀏覽人次顯示成「瀏覽人次 1,234」');
        vc.hidden = true;
        // 中文打字（v3.7.0）
        const ZT = window.PUPPY_ZH_TEXTS;
        ok(ZT && ZT.sentences.length >= 30 && ZT.passages.length >= 15 && ZT.punct.length >= 10 && !/[A-Za-z0-9,.;:?!()]/.test([].concat(ZT.words, ZT.sentences, ZT.passages, ZT.punct).join('')), '中文題目載入了，而且沒有半形字元');
        const cc = T.parseCode('370342');
        ok(cc && cc.mode === 'cn' && cc.minutes === 8 && cc.scope === 3 && T.parseCode('320400') === null && T.parseCode('340100').minutes === 3 && T.parseCode('360100').minutes === 5, '中文打字測驗碼：第 1 碼 3＝中文、第 2 碼是時間，難度 1～3');
        ok(T.testText(cc) === T.testText(T.parseCode('370342')) && T.testText(cc).length >= 560 && /[「」：；（）]/.test(T.testText(cc)), '同一組碼中文題目一樣、夠長、標點題有特殊標點');
        let cmp = T.cnCompare('今天天氣很好，我們去公園。', '今天天氣很好，我們去公園。');
        ok(cmp.ok === 13 && cmp.miss === 0 && cmp.covered === 13, '中文比對：全對');
        cmp = T.cnCompare('今天天氣很好，我們去公園。', '今天天器很好，我們');
        ok(cmp.ok === 8 && cmp.miss === 1 && cmp.covered === 9 && !cmp.hit[3], '中文比對：同音錯字算錯一個，後面繼續算對');
        cmp = T.cnCompare('今天天氣很好，我們去公園。', '今天天氣很好我們');
        ok(cmp.ok === 8 && cmp.miss === 1 && !cmp.hit[6], '中文比對：漏打標點算錯一個');
        cmp = T.cnCompare('今天天氣很好，我們去公園。', '今天天氣很好,我們');
        ok(cmp.ok === 8 && cmp.miss === 1, '中文比對：半形逗號算錯');
        state.chinese = {};
        T.startLesson('C02');
        ok(T.view() === 'play' && T.run() && document.querySelector('#tyInput') !== null, '中文打字練習有輸入框');
        const tgt = T.run().text.join('');
        T.cnEvaluate(tgt.slice(0, 5) + ',');
        ok(/半形/.test(document.querySelector('#tyBanner').textContent), '打半形標點會跳出提醒');
        T.cnEvaluate(tgt.slice(0, 5) + 'abc');
        ok(/英文字母/.test(document.querySelector('#tyBanner').textContent), '打出英文字母會提醒切回中文');
        T.cnEvaluate(tgt);
        ok(T.view() === 'result' && T.result().mode === 'cn' && state.chinese.prog.C02 >= 1 && T.unlockedIndex('cn') === 1 || (T.result() && T.result().mode === 'cn' && state.chinese.prog.C02 >= 1), '中文練習打完自動過關，紀錄存在 state.chinese');
        T.common().who = { g: 4, c: 3, s: 12 };
        T.prepareTest('340123', false);
        T.startTest();
        ok(document.querySelector('#tyInput').disabled === true && T.cnEvaluate('今天') === null, '倒數時輸入框鎖住、不計分');
        T.setRun({ test: Object.assign(T.run().test, { startAt: Date.now() - 30000 }) });
        const tt = T.run().text.join('');
        T.cnEvaluate(tt.slice(0, 20) + '錯' + tt.slice(21, 30));
        T.finishTest();
        const cr = T.result();
        ok(cr.mode === 'cn' && cr.ok === 29 && cr.miss === 1 && cr.score === 28 && cr.qr.split('.')[1] === '340123', '中文測驗：29 對 1 錯得 28 分，QR 有測驗碼');
        T.prepareTest('340123', false);
        T.startTest();
        T.setRun({ test: Object.assign(T.run().test, { startAt: Date.now() - 30000 }) });
        T.cnEvaluate(T.run().text.join('').slice(0, 80));
        ok(T.run().mash === 1 && /速度/.test(T.status()[1]), '30 秒打 80 字（一分鐘 160 字）視為可疑');
        T.quit();
        // v3.7.3：每一關都能自己挑、預設停在總複習、完成的關卡換樣式
        T.setMode('en'); T.quit();
        const tyPane = document.getElementById('tab-typing');
        ok(tyPane.querySelectorAll('.ty-lesson[disabled]').length === 0 && tyPane.querySelector('.ty-lesson.pick').dataset.lesson === 'L15', '打字關卡全部可以點，英打預設停在總複習');
        ok(tyPane.querySelector('[data-lesson="L01"]').classList.contains('done'), '完成的關卡顯示成「已完成」樣式');
        // v3.7.5：輸入測驗碼時顯示老師設定（鎖定），並收起自己挑戰
        const whoBak = JSON.stringify(T.common().who);
        T.common().who = { g: 0, c: 0, s: 0 };
        T.prepareTest('130523', false);
        const codeIn = tyPane.querySelector('#tyCode');
        codeIn.value = '13052'; codeIn.dispatchEvent(new Event('input'));
        ok(/還差 1 碼/.test(tyPane.querySelector('#tyCodeInfo').textContent) && tyPane.querySelector('#tySelfBox').hidden, '輸入測驗碼時收起「自己挑戰」，提示還差幾碼');
        codeIn.value = '130523'; codeIn.dispatchEvent(new Event('input'));
        const ci = tyPane.querySelector('#tyCodeInfo').textContent;
        ok(/不能改/.test(ci) && /英打/.test(ci) && /2 分鐘/.test(ci) && /第 1～5 關/.test(ci), '輸入完 6 碼馬上顯示老師的設定：' + ci.replace(/\s+/g, ' ').trim());
        codeIn.value = ''; codeIn.dispatchEvent(new Event('input'));
        ok(!tyPane.querySelector('#tySelfBox').hidden, '清掉測驗碼，「自己挑戰」又出現');
        T.common().who = JSON.parse(whoBak);
        T.quit();
        T.quit();
      }
      // 每日自動備份
      keys.forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* 忽略 */ } });
      dailyKeys().forEach(k => localStorage.removeItem(k));
      state = loadState();
      state.stars = 7;
      saveState();
      ok(listDailyBackups().length === 1 && listDailyBackups()[0].day === todayStr() && listDailyBackups()[0].stars === 7, '存檔後有今天的自動備份');
      for (let i = 1; i <= 9; i++) localStorage.setItem(DAILY_PREFIX + todayStr(-i), localStorage.getItem(STORAGE_KEY));
      dailySnapshot(localStorage.getItem(STORAGE_KEY), true);
      ok(dailyKeys().length === BACKUP_KEEP && listDailyBackups()[0].day === todayStr(), '自動備份只保留最近 7 天，實際 ' + dailyKeys().length);
      state.stars = 99;
      lastDailyAt = Date.now();
      saveState();
      ok(restoreDaily(todayStr(-1)) === true && state.stars === 7, '可以還原成昨天的備份，實際 ' + state.stars);
      localStorage.setItem(DAILY_PREFIX + todayStr(-2), '{"stars":5000,"sig":"x"}');
      ok(restoreDaily(todayStr(-2)) === false && listDailyBackups().every(b => b.day !== todayStr(-2)), '壞掉或被改過的備份不能還原');
      dailyKeys().forEach(k => localStorage.removeItem(k));
      try { localStorage.removeItem(STORAGE_KEY + '.before_restore'); } catch (e) { /* 忽略 */ }
      ok(/^v\d+\.\d+\.\d+$/.test(APP_VERSION) && /^\d{8}-\d+$/.test(APP_BUILD), '版本與建置編號格式正確：' + APP_VERSION + ' ' + APP_BUILD);
    } catch (e) {
      fails.push('發生例外：' + (e && e.message ? e.message : String(e)));
    }
    keys.forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* 忽略 */ } });
    document.body.dataset.appSelftest = fails.length ? 'FAIL:' + fails.join('｜') : 'PASS:' + n;
    document.body.dataset.appVersion = APP_VERSION + ' ' + APP_BUILD;
  }
  if (/[?&]apptest=1/.test(location.search)) runAppSelfTest();
})();
