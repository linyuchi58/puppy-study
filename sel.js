// 《汪汪小精靈 學習小伙伴》網頁版 —— SEL 情緒自我調控（v3.12.0，從桌面版 study_sel.py 搬過來）
//
//   ‧ 😜 小小惡作劇：戳鼻子、搔癢、假裝丟球、吹氣、躲起來嚇牠、拿零食不給牠
//       前幾下覺得好玩，一直玩會委屈、生氣；一直戳走動的狗狗也算進去。捉弄不給星星。
//   ‧ 💛 關懷模式：被捉弄太多次時主動出現（不責備），先問「你還好嗎？」，
//       再帶學生：情緒溫度計 → 冷靜小工具 → 再量一次 → 想想可以找誰幫忙。
//   ‧ 🌈 心情小站：情緒溫度計、8 種冷靜小工具、我想說說話、心情日記。
//   ‧ 💬 我想說說話：引導式對話（不是 AI）。偵測到想傷害自己、被打、被欺負等字詞時，
//       溫和地請學生告訴信任的大人並顯示求助專線。
//
// 隱私（老師 2026-11-25 決定）：
//   ‧ 心情日記只記「哪天、什麼心情、多強、用了什麼工具」，存在這台裝置的另一個位置（不在主要進度裡），
//     所以不會上傳雲端試算表、也不會進搬家碼。
//   ‧ 「我想說說話」打的字一律不保存，關掉就消失。
//   ‧ 雲端登入時日記跟著帳號分開放；共用電腦模式只放在這個分頁，登出就清掉。
// 星星（照顧自己的心情才給，捉弄不給）：
//   ‧ 冷靜小工具做完 +1⭐ +2 經驗值，一天最多 3 次（和桌面版一樣）
//   ‧ 每天第一次量情緒溫度計 +1⭐
//   ‧ 走完一次關懷模式 +1⭐，一天一次
(function () {
  'use strict';
  const TEST = /[?&](selftest|apptest)=1/.test(location.search);
  let FAST = TEST;              // 測試用：計時工具跑快一點

  // ── 求助專線（2026-11 查證，和桌面版相同）──
  const HOTLINES = [
    ['110 / 119', '現在有危險、受傷：報警、叫救護車'],
    ['1925', '安心專線（衛福部，24 小時、免費）：心情很糟、想傷害自己'],
    ['1995', '生命線：想找人說說話'],
    ['1980', '張老師：想找人說說話'],
    ['113', '保護專線（衛福部，24 小時、免費）：被打、被傷害、家裡讓你害怕'],
    ['1953', '反霸凌專線（教育部，24 小時）：在學校被欺負、被排擠']
  ];

  // ── 情緒溫度計 ──
  const EMOTIONS = [
    ['happy', '😄', '開心', 'green', '心裡亮亮的'],
    ['calm', '😌', '平靜', 'green', '舒服、穩穩的'],
    ['tired', '😴', '好累', 'blue', '沒力氣、想休息'],
    ['sad', '😢', '難過', 'blue', '想哭、心裡重重的'],
    ['worry', '😟', '擔心', 'yellow', '一直想、怕怕的'],
    ['annoyed', '😣', '煩躁', 'yellow', '坐不住、什麼都不順'],
    ['angry', '😠', '生氣', 'red', '很想大叫、想打東西'],
    ['scared', '😱', '害怕', 'red', '心跳很快、想逃走'],
    ['unsure', '🤔', '說不上來', 'yellow', '有點怪怪的']
  ];
  const EMO = {}; EMOTIONS.forEach(e => { EMO[e[0]] = e; });
  const ZONE_COL = { green: '#2fa86b', blue: '#3d8fd6', yellow: '#e3a21a', red: '#e5534b' };
  const LEVELS = ['', '一點點', '有一些', '蠻多的', '很多', '超級多'];
  const BODY = ['心跳很快', '肚子怪怪的', '拳頭握緊', '想哭', '頭很重', '臉熱熱的', '全身沒力', '睡不好'];

  // ── 冷靜小工具 ──
  const TOOLS = [
    ['breath', '🎈', '呼吸泡泡', '跟著泡泡吸氣、吐氣', ['red', 'yellow', 'blue', 'green'], '#3d8fd6'],
    ['ground', '🖐', '五感著陸', '看5、摸4、聽3、聞2、喜歡1', ['red', 'yellow'], '#2fa86b'],
    ['muscle', '💪', '肌肉放鬆', '用力握緊，再慢慢放鬆', ['red', 'yellow'], '#f0883e'],
    ['count', '🔢', '倒數冷靜', '從 10 慢慢數到 1', ['red'], '#e5534b'],
    ['draw', '🖍', '畫出來丟掉', '把心情畫下來，揉一揉丟掉', ['red', 'yellow', 'blue'], '#d65d93'],
    ['cards', '💌', '打氣卡', '對自己說一句好話', ['blue', 'yellow', 'green'], '#7a6bd1'],
    ['video', '🎬', '看影片放鬆', '跟著影片呼吸、伸展', ['blue', 'yellow', 'green'], '#3d8fd6'],
    ['talk', '💬', '我想說說話', '跟寵物說說發生什麼事', ['blue', 'yellow', 'red', 'green'], '#7a6bd1']
  ];
  const TOOL = {}; TOOLS.forEach(t => { TOOL[t[0]] = t; });
  const VIDEOS = [
    ['🎵', '芝麻街〈Belly Breathe〉肚子呼吸歌（英文，約 2 分半）', 'https://www.youtube.com/watch?v=_mZbzDOpylA'],
    ['🌌', '練習自我覺察，認識情緒宇宙（中文）', 'https://www.youtube.com/watch?v=WpClVZqO_nc'],
    ['🧭', '衛福部動畫《走出情緒的迷宮》（搜尋）', 'https://www.youtube.com/results?search_query=%E8%B5%B0%E5%87%BA%E6%83%85%E7%B7%92%E7%9A%84%E8%BF%B7%E5%AE%AE+%E8%A1%9B%E7%94%9F%E7%A6%8F%E5%88%A9%E9%83%A8'],
    ['🫧', '兒童深呼吸練習影片（中文搜尋）', 'https://www.youtube.com/results?search_query=%E5%85%92%E7%AB%A5+%E6%B7%B1%E5%91%BC%E5%90%B8+%E7%B7%B4%E7%BF%92'],
    ['🧘', 'GoNoodle：Flow 呼吸、伸展（英文，免費註冊）', 'https://www.gonoodle.com'],
    ['🌈', 'Cosmic Kids：兒童瑜伽、冥想（英文）', 'https://www.cosmickids.com']
  ];
  const PEP_TALK = [
    '我可以慢慢來。', '犯錯是在學習，不代表我不好。', '我已經很努力了。', '這個感覺會過去的。',
    '我可以找人幫忙。', '深呼吸，我做得到。', '今天不好，不代表每天都不好。', '我值得被好好對待。',
    '我可以先做一小步。', '生氣沒關係，打人、罵人才不行。', '我不用跟別人一樣。', '有人在乎我。',
    '我可以說「我需要休息一下」。', '我比我想的還勇敢。', '我可以重新再試一次。', '我喜歡我自己的某些地方。'
  ];

  // ── 小小惡作劇 ──
  const TEASES = [
    ['boop', '👃', '戳鼻子', ['哈—啾！😆 好癢喔！', '鼻子被偷襲了！🐽'], ['鼻子會痛啦…🥺', '可以輕一點嗎？'], ['一直戳鼻子，我好不舒服 😣']],
    ['tickle', '🪶', '搔癢攻擊', ['哈哈哈哈！停～不要！🤣', '癢死我了啦！'], ['笑到肚子痛了…先停一下好嗎？', '我喘不過氣了 😵'], ['我說停了…你沒有停 😢']],
    ['fake', '🎭', '假裝丟球', ['咦？球呢？？🤔', '我被騙了！哈哈'], ['又是假的…😞', '我每次都相信你耶…'], ['你一直騙我，我好難過 😢']],
    ['blow', '🌬', '對牠吹氣', ['呼～耳朵飛起來了！🌀', '涼涼的！'], ['眼睛好乾…不要吹了啦', '有點冷耶 🥶'], ['一直吹我，我好煩喔 😣']],
    ['scare', '🙈', '躲起來嚇牠', ['嚇！😱 原來是你！', '心臟差點跳出來！'], ['被嚇到好幾次，我有點怕怕的…', '可以不要再嚇我了嗎 🥺'], ['我真的很害怕…😨']],
    ['tease', '🍖', '零食不給牠', ['好香！給我嘛～🤤', '我會坐下喔！'], ['為什麼不給我…😞', '肚子咕嚕咕嚕叫…'], ['一直拿零食騙我，好難過 😢']]
  ];
  const TEASE = {}; TEASES.forEach(t => { TEASE[t[0]] = t; });
  const EVENT_WEIGHT = { tease: 1.0, poke: 0.35, poke_angry: 2.0 };
  const WINDOW_SEC = 150;       // 看最近 2.5 分鐘
  const WARN_AT = 4.0;          // 寵物開始委屈
  const CARE_AT = 7.0;          // 進入關懷模式
  const CARE_COOLDOWN = 10 * 60;
  const CALM_MAX = 3;           // 冷靜小工具：一天最多 3 次給星星

  // ── 危機字詞（只在這台裝置比對，不保存、不上傳）──
  const SELF_HARM = ['想死', '去死', '不想活', '活不下去', '自殺', '自殘', '割手', '割腕', '傷害自己', '跳樓', '跳下去',
    '結束生命', '消失算了', '不想存在', '沒有我比較好', '活著沒意思', '上吊', '吞藥', '不想醒來'];
  const ABUSE = ['打我', '揍我', '家暴', '虐待', '被摸', '亂摸', '摸我', '不舒服的碰', '性侵', '把我關', '不給我吃飯',
    '用皮帶', '被打'];
  const BULLY = ['霸凌', '欺負', '被笑', '笑我', '排擠', '孤立', '沒人跟我玩', '罵我', '取綽號', '勒索', '嘲笑',
    '網路上罵', '被罵', '不理我', '故意撞我'];
  const has = (t, words) => { const s = String(t || '').replace(/\s/g, ''); return words.some(w => s.includes(w)); };

  const TOPICS = [['school', '🏫', '學校的事'], ['friend', '🧑‍🤝‍🧑', '朋友、同學'], ['family', '🏠', '家裡的事'],
    ['study', '📚', '功課、考試'], ['self', '💭', '我自己的心情'], ['chat', '🐾', '只是想聊聊']];
  const IDEAS = {
    friend: [['先冷靜，等一下再說', '先離開一下、深呼吸，等心情平靜一點再找他說。'],
      ['用「我訊息」說感受', '試試看這樣說：「我覺得＿＿＿，因為＿＿＿，我希望＿＿＿。」不罵人，只說自己的感受。'],
      ['找老師幫忙協調', '跟導師或輔導老師說發生什麼事，請大人幫你們一起想辦法。'],
      ['找別的朋友一起玩', '一個人不理你，不代表大家都不喜歡你。下課可以試著加入別人的遊戲。']],
    school: [['跟導師說', '寫在聯絡簿上、或下課去找老師說，老師會想知道。'],
      ['找輔導老師聊聊', '輔導室的老師很會聽人說話，你可以直接去找他。'],
      ['把事情寫下來', '寫下發生什麼事、什麼時候、在哪裡，比較好說清楚。']],
    family: [['找信任的大人說', '可以是家裡的另一個大人、親戚、老師或輔導老師。'],
      ['找一個安靜的角落', '先讓自己安全、平靜下來，深呼吸。'],
      ['寫下或畫下心情', '把說不出口的話寫在紙上，之後也比較好跟大人說。']],
    study: [['切成小步驟', '一次只做一小題，做完再休息。可以先計時 10 分鐘就好。'],
      ['先做會的', '先從最簡單的開始，讓自己有一點成功的感覺。'],
      ['問老師或同學', '不會不丟臉，問了才會懂。把不會的地方圈起來，明天問老師。'],
      ['先休息一下', '起來喝水、伸展 3 分鐘，再回來看。']],
    self: [['跟心情相處一下', '心情不用馬上變好。試試「呼吸泡泡」，陪自己一下。'],
      ['做一件喜歡的小事', '聽一首歌、畫畫、抱抱玩偶、出去走走。'],
      ['跟信任的人說', '說出來，心裡的重量會分一點出去。']],
    chat: [['一起做呼吸泡泡', '跟我一起慢慢吸氣、吐氣。'], ['看打氣卡', '抽一張卡片，對自己說一句好話。']]
  };
  const ADULTS = ['爸爸', '媽媽', '導師', '輔導老師', '阿公阿嬤', '哥哥姊姊', '好朋友', '其他大人'];

  // ════════════════════════════════════════════════════════════════════
  //  存檔：心情日記放在主要進度以外（不上雲端、不進搬家碼）
  // ════════════════════════════════════════════════════════════════════
  let H = null;            // app.js 給的 hooks
  const cloudMeta = () => { try { return window.PuppyCloud && window.PuppyCloud.meta && window.PuppyCloud.meta(); } catch (e) { return null; } };
  function storeKey() { const m = cloudMeta(); return 'puppyStudy.sel.v1' + (TEST ? '.selftest' : '') + (m && m.sub ? '.' + m.sub : ''); }
  function storeArea() { const m = cloudMeta(); return m && m.shared ? window.sessionStorage : window.localStorage; }
  function blank() { return { format: 'puppy-sel-web/1', entries: [], care_count: 0, last_care: 0, talks: 0 }; }
  function load() {
    try { const d = JSON.parse(storeArea().getItem(storeKey()) || 'null'); if (d && Array.isArray(d.entries)) return Object.assign(blank(), d); } catch (e) { /* 壞掉就當沒有 */ }
    return blank();
  }
  function save(d) {
    d.entries = d.entries.slice(-400);
    try { storeArea().setItem(storeKey(), JSON.stringify(d)); } catch (e) { /* 存不了：這次就算了 */ }
  }
  function addEntry(e) {
    const d = load();
    const now = new Date(), z = n => String(n).padStart(2, '0');
    e.t = `${now.getFullYear()}-${z(now.getMonth() + 1)}-${z(now.getDate())} ${z(now.getHours())}:${z(now.getMinutes())}`;
    d.entries.push(e);
    save(d);
  }
  // 雲端登出（清掉這台的進度）時：這個帳號的心情日記也清掉
  function forget(sub) {
    const k = 'puppyStudy.sel.v1' + (TEST ? '.selftest' : '') + (sub ? '.' + sub : '');
    try { localStorage.removeItem(k); } catch (e) { /* 忽略 */ }
    try { sessionStorage.removeItem(k); } catch (e) { /* 忽略 */ }
  }

  // ── 星星：計數放在主要進度（只有次數，沒有心情內容），一天上限才不會換裝置就重來 ──
  function dayKey() { const d = new Date(), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }
  function counts() {
    const st = H.getState();
    if (!st.selc || typeof st.selc !== 'object') st.selc = { days: {} };
    if (!st.selc.days || typeof st.selc.days !== 'object') st.selc.days = {};
    const k = dayKey();
    if (!st.selc.days[k]) st.selc.days[k] = { calm: 0, mood: 0, care: 0 };
    Object.keys(st.selc.days).sort().slice(0, -14).forEach(x => { delete st.selc.days[x]; });
    return st.selc.days[k];
  }
  function calmReward(name) {
    const c = counts();
    if (c.calm < CALM_MAX) { c.calm++; H.award(2, 1, 'calm', `💛 你剛剛用「${name}」照顧了自己的心情，好棒！（+1⭐）`); return true; }
    H.say(`💛 你剛剛用「${name}」照顧了自己的心情`, 'happy');
    return false;
  }
  function moodReward() {
    const c = counts();
    if (c.mood >= 1) return false;
    c.mood = 1; H.award(1, 1, 'calm', '🌡 今天量了心情溫度！認識自己的心情很棒（+1⭐）');
    return true;
  }
  function careReward() {
    const c = counts();
    if (c.care >= 1) return false;
    c.care = 1; H.award(2, 1, 'calm', '💛 謝謝你好好照顧夥伴，也照顧自己（+1⭐）');
    return true;
  }

  // ════════════════════════════════════════════════════════════════════
  //  惡作劇偵測
  // ════════════════════════════════════════════════════════════════════
  let events = [];          // [秒, 權重, 種類]
  let careOpen = false;
  let warnedAt = 0;
  const nowSec = () => Date.now() / 1000;
  function annoyance() {
    const n = nowSec();
    events = events.filter(e => n - e[0] < WINDOW_SEC);
    return events.reduce((a, e) => a + e[1], 0);
  }
  function note(kind, weight) {
    if (careOpen || !H) return;
    events.push([nowSec(), weight == null ? (EVENT_WEIGHT[kind] || 0.5) : weight, kind]);
    check();
  }
  function check() {
    const lv = annoyance(), n = nowSec(), d = load();
    if (lv >= CARE_AT && n - (+d.last_care || 0) > CARE_COOLDOWN) {
      setTimeout(() => openCare('tease'), TEST ? 0 : 900);
    } else if (lv >= WARN_AT && n - warnedAt > 40) {
      warnedAt = n;
      setTimeout(() => H.say(`🥺 ${H.petName()} 有點不舒服了…\n可以換個方式陪我玩嗎？摸摸頭我會很開心！`, 'sad'), TEST ? 0 : 1600);
    }
  }
  function petAct(kind) {
    try { if (window.PuppyInteractive && window.PuppyInteractive.react) window.PuppyInteractive.react(kind); } catch (e) { /* 走動的狗狗沒開也沒關係 */ }
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function tease(kind) {
    const t = TEASE[kind];
    if (!t || !H) return '';
    if (careOpen) { H.say('我們先一起照顧一下心情，好嗎？💛', 'normal'); return 'care'; }
    const lv = annoyance();
    const [, icon, , fun, sad, mad] = t;
    let msg, level;
    if (lv < 2.5) { msg = pick(fun); level = 'fun'; }
    else if (lv < WARN_AT + 1) { msg = pick(sad); level = 'sad'; }
    else { msg = pick(mad); level = 'angry'; }
    petAct(level);
    H.say(`${icon} ${msg}`, level === 'fun' ? 'happy' : 'sad');
    note('tease');
    return level;
  }

  // ════════════════════════════════════════════════════════════════════
  //  畫面：一個蓋在最上面的面板
  // ════════════════════════════════════════════════════════════════════
  let ov = null, timers = [], onCloseFn = null;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function later(ms, fn) { const id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(id => { clearTimeout(id); clearInterval(id); }); timers = []; }
  function panel(color, title, opts) {
    clearTimers();
    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'sel-ov';
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-modal', 'true');
      ov.innerHTML = '<div class="sel-panel"><div class="sel-head"></div><div class="sel-body"></div></div>';
      document.body.appendChild(ov);
      ov.addEventListener('keydown', ev => { if (ev.key === 'Escape') close(); });
    }
    const head = ov.querySelector('.sel-head');
    head.style.background = color;
    head.innerHTML = `<span class="sel-ico">${esc(H.petIcon())}</span><b class="sel-title">${esc(title)}</b>
      ${opts && opts.noDiary ? '' : '<button class="sel-hbtn" data-sel="diary">📔 心情日記</button>'}
      <button class="sel-hbtn sel-x" data-sel="close" aria-label="關閉">✕</button>`;
    head.querySelector('[data-sel=close]').onclick = () => close();
    const dbtn = head.querySelector('[data-sel=diary]');
    if (dbtn) dbtn.onclick = () => diary();
    const body = ov.querySelector('.sel-body');
    body.innerHTML = '';
    body.scrollTop = 0;
    return body;
  }
  function close(finished) {
    clearTimers();
    if (ov) { ov.remove(); ov = null; }
    const fn = onCloseFn; onCloseFn = null;
    careOpen = false; events = [];
    if (fn) fn(!!finished);
  }
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function say(parent, text) { const b = el(`<div class="sel-say"></div>`); b.textContent = text; parent.appendChild(b); return b; }
  function btn(parent, label, fn, cls) { const b = el(`<button class="sel-btn ${cls || ''}"></button>`); b.textContent = label; b.onclick = fn; parent.appendChild(b); return b; }
  function row(parent, cls) { const r = el(`<div class="sel-row ${cls || ''}"></div>`); parent.appendChild(r); return r; }
  function hotlineBox(title) {
    return el(`<div class="sel-hotline"><b>${esc(title || '💛 你很重要，請找人幫忙')}</b>
      <p>請現在就告訴身邊信任的大人（爸媽、老師、輔導老師）。<br>如果現在很危險，請打 110 或 119。</p>
      ${HOTLINES.map(([n, d]) => `<div class="sel-hl"><a href="tel:${n.split(' ')[0]}">${esc(n)}</a><span>${esc(d)}</span></div>`).join('')}</div>`);
  }
  function emoGrid(parent, onPick, selected) {
    const g = el('<div class="sel-emo-grid"></div>');
    EMOTIONS.forEach(([id, icon, name, zone, desc]) => {
      const b = el(`<button class="sel-emo ${id === selected ? 'on' : ''}" style="--zc:${ZONE_COL[zone]}" data-emo="${id}">
        <span class="i">${icon}</span><b>${name}</b><small>${desc}</small></button>`);
      b.onclick = () => onPick(id);
      g.appendChild(b);
    });
    parent.appendChild(g);
  }
  function levelRow(parent, value, onPick, col) {
    const r = el(`<div class="sel-levels"></div>`);
    for (let n = 1; n <= 5; n++) {
      const b = el(`<button class="sel-lv" data-lv="${n}" aria-label="${LEVELS[n]}" style="font-size:${18 + n * 5}px;color:${value && n <= value ? col : '#d8cfc4'}">●</button>`);
      b.onclick = () => onPick(n);
      r.appendChild(b);
    }
    r.appendChild(el(`<span class="sel-lvname" style="color:${value ? col : '#8a7a6a'}">${value ? LEVELS[value] : '點圓圈選大小'}</span>`));
    parent.appendChild(r);
  }

  // ════════════════════════════════════════════════════════════════════
  //  🌈 心情小站（首頁）
  // ════════════════════════════════════════════════════════════════════
  function station() {
    careOpen = false;
    const b = panel('#7a6bd1', '🌈 心情小站');
    say(b, `嗨！我是${H.petName()}。心情好或不好，都可以來這裡坐一坐 💛`);
    btn(b, '🌡 量一量我的心情', () => care('self'), 'big purple');
    b.appendChild(el('<h4 class="sel-h">冷靜小工具（做完有 ⭐，一天最多 3 次）</h4>'));
    const g = el('<div class="sel-tools"></div>'); b.appendChild(g);
    TOOLS.forEach(([id, icon, name, desc, , col]) => {
      const t = el(`<button class="sel-tool" data-tool="${id}" style="--tc:${col}"><span class="i">${icon}</span><b>${name}</b><small>${desc}</small></button>`);
      t.onclick = () => (id === 'talk' ? talk() : runTool(id, fin => { if (fin) calmReward(name); station(); }));
      g.appendChild(t);
    });
    const r = row(b, 'sel-row-end');
    btn(r, '📔 心情日記', () => diary(), 'soft');
    btn(r, '💛 求助專線', () => { const bb = panel('#e5534b', '💛 需要幫忙的時候'); bb.appendChild(hotlineBox('💛 需要幫忙的時候，可以找這些人')); btn(bb, '◀ 回心情小站', station, 'soft'); }, 'soft');
    b.appendChild(el('<p class="sel-note">🔒 心情紀錄只存在這台裝置，不會上傳，老師和同學都看不到。說說話打的字不會保存。</p>'));
  }

  // ════════════════════════════════════════════════════════════════════
  //  💛 關懷模式（被捉弄太多次）＋ 情緒溫度計流程
  // ════════════════════════════════════════════════════════════════════
  let C = null;   // 這一次流程的狀態
  function openCare(reason) {
    if (!H || ov) return;
    if (reason === 'tease') {
      const d = load(); d.last_care = nowSec(); d.care_count = (+d.care_count || 0) + 1; save(d);
      events = [];
    }
    care(reason);
  }
  function care(reason) {
    C = { reason, emo: null, lv: 0, body: new Set(), tool: '', after: 0 };
    careOpen = reason === 'tease';
    if (reason === 'tease') stepTease(); else stepCheckin();
  }
  function stepTease() {
    const b = panel('#7a6bd1', `${H.petName()} 想跟你說說話`);
    say(b, '剛剛我被戳、被嚇了好多次，有一點點委屈 🥺\n\n不過我更想知道的是——你現在還好嗎？\n有時候心裡卡卡的、悶悶的，手就會想一直戳東西。這很常見，不是你不好。');
    b.appendChild(el('<h4 class="sel-h">你現在比較像哪一個？</h4>'));
    btn(b, '😄 我還好，只是覺得好玩', stepEmpathy, 'blue');
    btn(b, '😣 其實我心情有點不好', stepCheckin, 'purple');
    btn(b, '🤐 不想說，讓我靜一靜', stepQuiet, 'soft');
  }
  function stepEmpathy() {
    const b = panel('#3d8fd6', '換個角度想想');
    say(b, '原來你只是覺得好玩！😊 我也喜歡跟你玩。\n\n想一想：如果有人一直戳你、嚇你、拿東西騙你，\n就算他覺得好玩，你會是什麼感覺？');
    const r = row(b, 'sel-row-4');
    [['😣', '會覺得煩', '對，一開始好玩，次數多了就會變成「欺負」。'],
      ['😢', '會難過', '嗯，被當成玩笑的那個人，心裡常常不好受。'],
      ['😠', '會生氣', '沒錯，會生氣是正常的。所以我們要注意對方的感受。'],
      ['🤔', '不知道', '沒關係！可以注意看對方的表情：在笑，還是皺眉頭？']]
      .forEach(([i, t, reply]) => btn(r, `${i} ${t}`, () => stepEmpathy2(reply), 'soft'));
  }
  function stepEmpathy2(reply) {
    const b = panel('#3d8fd6', '好玩 vs. 欺負');
    say(b, reply + '\n\n🟢 好玩：兩個人都在笑，對方說停就停。\n🔴 欺負：只有一個人覺得好玩，對方說不要了還一直做。\n\n跟同學玩的時候也一樣喔！我們換一個大家都開心的玩法吧：');
    const r = row(b);
    btn(r, '✋ 摸摸牠的頭', () => { petAct('pat'); close(); careReward(); H.say('💕 摸摸頭好舒服～謝謝你！', 'happy'); }, 'pink');
    btn(r, '⚽ 真的丟一顆球', () => { petAct('ball'); close(); careReward(); H.say('⚽ 真的有球！耶～', 'happy'); }, 'green');
    btn(b, '🌈 我想量一下自己的心情', stepCheckin, 'purple');
  }
  function stepQuiet() {
    const b = panel('#7a6bd1', '靜一靜');
    say(b, '好，我不吵你。🤫\n想要的話，可以跟著泡泡慢慢呼吸。\n準備好了，隨時都可以來找我說話。');
    btn(b, '🎈 陪我呼吸一下', () => { C.tool = 'breath'; runTool('breath', fin => stepAfter(fin)); }, 'blue');
    btn(b, '關閉', () => close(), 'soft');
  }
  // 1. 情緒溫度計
  function stepCheckin() {
    const b = panel('#7a6bd1', '🌡 情緒溫度計');
    b.appendChild(el('<h4 class="sel-h">你現在的心情最像哪一個？（說出心情的名字，心情就會小一點）</h4>'));
    emoGrid(b, k => { C.emo = k; stepCheckin(); }, C.emo);
    if (!C.emo) return;
    const col = ZONE_COL[EMO[C.emo][3]];
    b.appendChild(el('<h4 class="sel-h">這個心情有多大？</h4>'));
    levelRow(b, C.lv, n => { C.lv = n; stepCheckin(); }, col);
    b.appendChild(el('<h4 class="sel-h sel-muted">身體有沒有哪裡怪怪的？（可以不選）</h4>'));
    const br = row(b, 'sel-chips');
    BODY.forEach(x => {
      const on = C.body.has(x);
      const c = btn(br, x, () => { if (C.body.has(x)) C.body.delete(x); else C.body.add(x); stepCheckin(); }, 'chip' + (on ? ' on' : ''));
      if (on) c.style.background = col;
    });
    if (C.lv) { const nb = btn(b, '下一步 ▶', stepTools, 'big'); nb.style.background = col; }
    try { b.querySelector('.sel-levels').scrollIntoView({ block: 'nearest' }); } catch (e) { /* 忽略 */ }
  }
  // 2. 選冷靜小工具
  function stepTools() {
    const e = EMO[C.emo], zone = e[3], col = ZONE_COL[zone];
    const b = panel(col, `${e[1]} ${e[2]}・${LEVELS[C.lv]}`);
    let msg;
    if (zone === 'green') msg = `太好了！${e[2]}的時候，我們可以把好心情存起來，或分享給別人 😊`;
    else if (zone === 'red') msg = `${e[2]}是很大的情緒，會這樣很正常。\n先讓身體慢下來，再來想辦法。選一個試試看：`;
    else if (zone === 'blue') msg = `${e[2]}的時候，身體會慢慢的、重重的。我們溫柔地照顧自己一下：`;
    else msg = `${e[2]}的時候，腦袋會有點亂。我們先停一停，選一個小工具：`;
    say(b, msg);
    const g = el('<div class="sel-tools"></div>'); b.appendChild(g);
    const sorted = TOOLS.slice().sort((a, c) => (a[4].includes(zone) ? 0 : 1) - (c[4].includes(zone) ? 0 : 1));
    sorted.forEach(([id, icon, name, desc, zones], i) => {
      const good = zones.includes(zone);
      const t = el(`<button class="sel-tool ${good ? 'good' : ''}" data-tool="${id}" style="--tc:${good ? col : '#e3d6c3'}"><span class="i">${icon}</span><b>${name}</b><small>${good && i < 3 ? '⭐推薦 ' : ''}${desc}</small></button>`);
      t.onclick = () => {
        C.tool = id;
        if (id === 'talk') { finishEntry(0); talk(); return; }
        runTool(id, fin => stepAfter(fin));
      };
      g.appendChild(t);
    });
    btn(b, '我已經好多了，直接結束', () => { C.tool = ''; stepAfter(false); }, 'soft small');
  }
  // 3. 再量一次
  function stepAfter(finished) {
    if (finished && C.tool && TOOL[C.tool]) calmReward(TOOL[C.tool][2]);
    const e = EMO[C.emo || 'unsure'], col = ZONE_COL[e[3]];
    const b = panel(col, '現在呢？');
    say(b, `剛剛的心情是「${e[2]}」。現在這個心情還有多大？`);
    levelRow(b, 0, n => { C.after = n; stepFinish(); }, col);
    b.appendChild(el('<p class="sel-note">（點一個圓圈）</p>'));
  }
  function finishEntry(after) {
    addEntry({ emo: C.emo || 'unsure', lv: C.lv || 0, body: Array.from(C.body).sort(), tool: C.tool || '', after: after || 0, from: C.reason });
    moodReward();
    if (C.reason === 'tease') careReward();
  }
  function stepFinish() {
    finishEntry(C.after);
    const e = EMO[C.emo || 'unsure'], col = ZONE_COL[e[3]];
    const b = panel(col, '謝謝你照顧自己 💛');
    const diff = (C.lv || 0) - C.after;
    let msg;
    if (diff > 0) msg = `心情從「${LEVELS[C.lv]}」變成「${LEVELS[C.after]}」了！你剛剛做到的事情，下次也可以自己用喔。`;
    else if (C.after >= 4) msg = '心情還是好大，對嗎？這不是你的錯，有些事情需要大人一起幫忙。\n請找一位你信任的大人說說看。';
    else msg = '心情沒有變小也沒關係，心情就像天氣，會慢慢變的。';
    say(b, msg);
    if (C.after >= 4 || (e[3] === 'red' && C.lv >= 5)) b.appendChild(hotlineBox('💛 需要幫忙的時候，可以找這些人'));
    b.appendChild(el('<h4 class="sel-h">你想跟誰說說今天的心情？</h4>'));
    const ar = row(b, 'sel-chips');
    ADULTS.forEach(w => btn(ar, w, () => H.say(`👍 好主意！等一下就去找${w}說說看。\n可以這樣開頭：「我今天有一件事想跟你說…」`, 'happy'), 'chip'));
    const r = row(b, 'sel-row-end');
    btn(r, `💬 跟${H.petName()}說說話`, () => talk(), 'purple');
    btn(r, '完成', () => close(true), 'green');
  }

  // ════════════════════════════════════════════════════════════════════
  //  冷靜小工具（都在同一個面板裡）
  // ════════════════════════════════════════════════════════════════════
  function runTool(id, onDone) {
    const t = TOOL[id];
    const b = panel(t[5], `${t[1]} ${t[2]}`, { noDiary: true });
    let done = false;
    const finish = fin => { if (done) return; done = true; clearTimers(); onDone(fin); };
    // 右上角 ✕：當作沒做完，回到上一步
    ov.querySelector('[data-sel=close]').onclick = () => finish(false);
    ({ breath: toolBreath, ground: toolGround, muscle: toolMuscle, count: toolCount, draw: toolDraw, cards: toolCards, video: toolVideo }[id])(b, finish);
  }
  function doneBtn(b, finish, label) { const d = btn(b, label || '完成 ✔', () => finish(true), 'green big'); d.dataset.done = '1'; return d; }

  function toolBreath(b, finish) {
    const low = H.grade && H.grade() === 'low';
    const [inh, hold, exh] = low ? [3, 1, 4] : [4, 2, 6];
    const cycles = FAST ? 1 : 5, cyc = inh + hold + exh;
    b.insertAdjacentHTML('beforeend', `<div class="sel-breath"><div class="sel-sub"></div><div class="sel-bubble"><span>${esc(H.petIcon())}</span></div><div class="sel-btext">準備好了嗎？<br>手放在肚子上</div></div>`);
    const bub = b.querySelector('.sel-bubble'), txt = b.querySelector('.sel-btext'), sub = b.querySelector('.sel-sub');
    const setR = r => { bub.style.transform = `scale(${0.45 + r * 0.75})`; };
    setR(0.35);
    const start = btn(b, '▶ 開始', () => {
      start.remove();
      const t0 = performance.now();
      const speed = FAST ? 40 : 1;
      const id = setInterval(() => {
        const t = (performance.now() - t0) / 1000 * speed;
        const n = Math.floor(t / cyc);
        if (n >= cycles) {
          clearInterval(id); setR(0.35);
          txt.innerHTML = '做得好！🎉'; sub.textContent = `你完成了 ${cycles} 次深呼吸`;
          doneBtn(b, finish);
          return;
        }
        const p = t - n * cyc;
        let r, s;
        if (p < inh) { r = p / inh; s = `用鼻子吸氣… ${Math.floor(p) + 1}`; }
        else if (p < inh + hold) { r = 1; s = '停一下…'; }
        else { r = 1 - (p - inh - hold) / exh; s = `嘴巴慢慢吐氣… ${Math.floor(p - inh - hold) + 1}`; }
        setR(0.5 - 0.5 * Math.cos(r * Math.PI));
        txt.textContent = s; sub.textContent = `第 ${n + 1} / ${cycles} 次`;
      }, 50);
      timers.push(id);
    }, 'blue big');
  }

  function toolGround(b, finish) {
    const STEPS = [[5, '👀', '找 5 個你「看得到」的東西', '例如：桌子、窗戶、鉛筆…'],
      [4, '✋', '找 4 個你「摸得到」的東西', '摸摸看：衣服、桌面、頭髮…'],
      [3, '👂', '找 3 個你「聽得到」的聲音', '冷氣聲、鳥叫、自己的呼吸…'],
      [2, '👃', '找 2 個你「聞得到」的味道', '聞不到也沒關係，可以想一個喜歡的味道'],
      [1, '💛', '想 1 件讓你開心的事', '一個人、一個地方、一個東西都可以']];
    let i = 0;
    const show = () => {
      b.innerHTML = '';
      if (i >= STEPS.length) {
        b.insertAdjacentHTML('beforeend', '<div class="sel-center"><div class="sel-big">🌱</div><b class="sel-done-t">你回到「現在、這裡」了。<br>感覺身體穩一點了嗎？</b></div>');
        doneBtn(b, finish);
        return;
      }
      const [n, icon, title, hint] = STEPS[i];
      b.insertAdjacentHTML('beforeend', `<div class="sel-center"><div class="sel-big">${icon}</div><b class="sel-done-t">${title}</b><p class="sel-note">${hint}</p><p class="sel-note">每找到一個，就點一顆圓圈（也可以小聲說出來）</p><div class="sel-dots"></div></div>`);
      const dots = b.querySelector('.sel-dots');
      let got = 0;
      for (let k = 0; k < n; k++) {
        const d = el('<button class="sel-dot" aria-label="找到一個">○</button>');
        d.onclick = () => {
          if (d.textContent === '●') return;
          d.textContent = '●'; got++;
          if (got >= n) { i++; later(FAST ? 0 : 500, show); }
        };
        dots.appendChild(d);
      }
    };
    show();
  }

  function toolMuscle(b, finish) {
    const STEPS = [['✊', '兩手握緊拳頭，用力！', 5], ['🖐', '慢慢打開手，感覺手變輕了…', 8],
      ['🤷', '肩膀聳起來，靠近耳朵！', 5], ['😌', '肩膀放下來，好舒服…', 8],
      ['😖', '整張臉皺起來，像吃到檸檬！', 5], ['🙂', '臉放鬆，嘴角輕輕上揚…', 8],
      ['🦶', '腳趾用力抓地板！', 5], ['🌿', '放鬆，全身軟軟的…', 8]];
    b.insertAdjacentHTML('beforeend', '<div class="sel-center"><div class="sel-big" id="selMI"></div><b class="sel-done-t" id="selML">跟著做：用力 5 秒、放鬆 8 秒</b><div class="sel-bar"><i></i></div><p class="sel-note" id="selMS"></p></div>');
    const I = b.querySelector('#selMI'), L = b.querySelector('#selML'), S = b.querySelector('#selMS'), bar = b.querySelector('.sel-bar i');
    let i = 0;
    const step = () => {
      if (i >= STEPS.length) {
        I.textContent = '🌈'; L.textContent = '全身都放鬆了！'; L.style.color = '';
        S.textContent = '緊張的時候，身體也會緊緊的。放鬆身體，心也會跟著放鬆。';
        bar.style.width = '100%'; bar.style.background = '#2fa86b';
        doneBtn(b, finish);
        return;
      }
      const [icon, text, secs] = STEPS[i];
      I.textContent = icon; L.textContent = text; L.style.color = secs === 5 ? '#e5534b' : '#1f7a4c';
      S.textContent = `第 ${Math.floor(i / 2) + 1} / ${STEPS.length / 2} 步`;
      bar.style.background = secs === 5 ? '#e5534b' : '#2fa86b';
      const t0 = performance.now(), dur = (FAST ? 0.05 : secs) * 1000;
      const id = setInterval(() => {
        const p = (performance.now() - t0) / dur;
        bar.style.width = Math.max(0, (1 - p) * 100) + '%';
        if (p >= 1) { clearInterval(id); i++; step(); }
      }, 50);
      timers.push(id);
    };
    const start = btn(b, '▶ 開始', () => { start.remove(); step(); }, 'orange big');
  }

  function toolCount(b, finish) {
    b.insertAdjacentHTML('beforeend', '<div class="sel-center"><div class="sel-count"></div><p class="sel-done-t sel-muted" id="selCL">每數一個數字，就吐一口氣。<br>數字越小，身體越慢、越輕。</p></div>');
    const big = b.querySelector('.sel-count'), lab = b.querySelector('#selCL');
    const cols = ['#e5534b', '#e5534b', '#e9663f', '#ec7a35', '#ef8f2c', '#e3a21a', '#c4b11f', '#8fb22c', '#55ac46', '#2fa86b'];
    let n = 10;
    const tick = () => {
      if (n <= 0) {
        big.textContent = '😌'; big.style.color = '#2fa86b';
        lab.textContent = '好，現在比較能想事情了。'; lab.classList.remove('sel-muted');
        doneBtn(b, finish);
        return;
      }
      big.textContent = String(n); big.style.color = cols[10 - n];
      n--;
      later(FAST ? 5 : 1500, tick);
    };
    const start = btn(b, '▶ 開始', () => { start.remove(); tick(); }, 'red big');
  }

  function toolDraw(b, finish) {
    b.insertAdjacentHTML('beforeend', `<p class="sel-note">把現在的心情畫下來（亂畫也可以），畫完按「揉一揉丟掉」。畫的東西不會保存。</p>
      <div class="sel-row sel-pens">${['#e5534b', '#f0883e', '#f5b301', '#2fa86b', '#3d8fd6', '#7a6bd1', '#4a3b32'].map(c => `<button class="sel-pen" data-c="${c}" style="color:${c}" aria-label="顏色">●</button>`).join('')}
      <button class="sel-btn chip" data-s="3">細</button><button class="sel-btn chip" data-s="8">中</button><button class="sel-btn chip" data-s="16">粗</button></div>
      <canvas class="sel-canvas" width="600" height="380"></canvas>`);
    const cv = b.querySelector('canvas'), ctx = cv.getContext('2d');
    let color = '#e5534b', size = 6, last = null, drawn = 0;
    b.querySelectorAll('.sel-pen').forEach(p => { p.onclick = () => { color = p.dataset.c; }; });
    b.querySelectorAll('[data-s]').forEach(p => { p.onclick = () => { size = +p.dataset.s; }; });
    const pos = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * cv.width / r.width, (ev.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener('pointerdown', ev => { last = pos(ev); try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* 忽略 */ } ev.preventDefault(); });
    cv.addEventListener('pointermove', ev => {
      if (!last) return;
      const p = pos(ev);
      ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
      last = p; drawn++;
      ev.preventDefault();
    });
    const up = () => { last = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    const r = row(b);
    btn(r, '🗑 揉一揉丟掉', () => {
      cv.classList.add('crumple');
      later(FAST ? 0 : 700, () => {
        ctx.clearRect(0, 0, cv.width, cv.height); cv.classList.remove('crumple');
        ctx.font = '54px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🗑', 300, 170);
        ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#d65d93'; ctx.fillText('壞心情丟掉了！可以再畫一張，或按「完成」', 300, 250);
        drawn = 0;
      });
    }, 'pink');
    const d = btn(r, '完成', () => finish(true), 'green'); d.dataset.done = '1';
  }

  function toolCards(b, finish) {
    let deck = [];
    b.insertAdjacentHTML('beforeend', '<button class="sel-card" aria-label="再抽一張"><span>💌</span><b></b></button><p class="sel-note">點卡片抽一張。小聲對自己念一次。</p>');
    const card = b.querySelector('.sel-card'), txt = card.querySelector('b');
    const flip = () => {
      if (!deck.length) deck = PEP_TALK.slice().sort(() => Math.random() - 0.5);
      txt.textContent = deck.pop();
      card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip');
    };
    card.onclick = flip;
    const r = row(b);
    btn(r, '🔄 再抽一張', flip, 'purple');
    const d = btn(r, '完成', () => finish(true), 'green'); d.dataset.done = '1';
    flip();
  }

  function toolVideo(b, finish) {
    b.appendChild(el('<p class="sel-note">點一下會在新分頁打開（學校網路如果擋 YouTube，可以請老師幫忙）</p>'));
    VIDEOS.forEach(([icon, name, url]) => {
      const a = el(`<a class="sel-video" href="${url}" target="_blank" rel="noopener"><span>${icon}</span>${esc(name)}</a>`);
      b.appendChild(a);
    });
    doneBtn(b, finish, '看完了 ✔');
  }

  // ════════════════════════════════════════════════════════════════════
  //  💬 我想說說話（引導式對話，不是 AI；打的字不保存）
  // ════════════════════════════════════════════════════════════════════
  let T = null;
  function talk() {
    const name = H.petName();
    const b = panel('#7a6bd1', `💬 跟${name}說說話`);
    b.classList.add('sel-talkbody');
    b.innerHTML = `<div class="sel-lock">🔒 你打的字不會保存，關掉就消失</div>
      <div class="sel-chat" aria-live="polite"></div>
      <div class="sel-chips sel-tchips"></div>
      <div class="sel-input"><input type="text" maxlength="200" placeholder="想說什麼都可以打在這裡…" aria-label="想說的話"><button class="sel-btn purple">送出</button></div>`;
    T = { topic: null, emo: null, stage: 'topic', flags: new Set(), chat: b.querySelector('.sel-chat'), chips: b.querySelector('.sel-tchips'), ent: b.querySelector('input') };
    b.querySelector('.sel-input button').onclick = send;
    T.ent.addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.isComposing) send(); });
    const d = load(); d.talks = (+d.talks || 0) + 1; save(d);
    pet('嗨，我在這裡陪你 🐾\n想跟我說說什麼嗎？可以打字，也可以點下面的按鈕。');
    pet(`先說一下：我是電腦裡的小${H.isDog() ? '狗' : '夥伴'}，會認真聽，但不是真的輔導老師。很重要的事，我會請你一定要找大人幫忙喔。`, true);
    askTopic();
    try { T.ent.focus(); } catch (e) { /* 忽略 */ }
  }
  function bubble(text, me, small) {
    const r = el(`<div class="sel-msg ${me ? 'me' : 'pet'} ${small ? 'small' : ''}">${me ? '' : `<span class="sel-mi">${esc(H.petIcon())}</span>`}<div class="sel-mb"></div></div>`);
    r.querySelector('.sel-mb').textContent = text;
    T.chat.appendChild(r);
    try { r.scrollIntoView({ block: 'end' }); } catch (e) { /* 忽略 */ }
    return r;
  }
  function pet(text, small) { bubble(text, false, small); }
  function me(text) { bubble(text, true); }
  function chips(items) {
    T.chips.innerHTML = '';
    items.forEach(([label, fn]) => btn(T.chips, label, fn, 'chip'));
  }
  function askTopic() {
    T.stage = 'topic';
    chips(TOPICS.map(([id, icon, name]) => [`${icon} ${name}`, () => pickTopic(id, name)]));
  }
  function pickTopic(id, name) {
    me(name); T.topic = id;
    if (id === 'chat') {
      pet('好呀！我最喜歡聊天了 😊 今天有沒有一件讓你覺得「還不錯」的小事？');
      T.stage = 'good';
      chips([['有！', () => freePrompt('說說看是什麼事？')], ['想不到耶', noGood]]);
      return;
    }
    pet(`嗯，是「${name}」。那時候你的心情比較像哪一個？`);
    T.stage = 'emo';
    chips(EMOTIONS.map(e => [`${e[1]} ${e[2]}`, () => pickEmo(e[0])]));
  }
  function noGood() { me('想不到耶'); pet('沒關係～有時候就是平平的一天。那我們一起抽一張打氣卡好嗎？'); offerTools(); }
  function pickEmo(id) {
    const e = EMO[id];
    me(`${e[1]} ${e[2]}`); T.emo = id;
    pet({
      happy: '你覺得開心！真好～我也替你開心 🎉', calm: '平靜是很棒的狀態 😌',
      tired: '聽起來你真的很累了。累的時候，什麼事都會變得比較難。', sad: '難過的感覺好重喔…謝謝你願意告訴我。',
      worry: '擔心的時候，腦袋會一直轉個不停，對吧？', annoyed: '煩躁的時候，好像什麼都不順，會很想發脾氣。',
      angry: '你很生氣。生氣是正常的情緒，它在告訴你「有些事讓你覺得不公平或不舒服」。',
      scared: '害怕的感覺很不舒服。你現在安全嗎？', unsure: '說不上來也沒關係，心情本來就常常混在一起。'
    }[id]);
    if (id === 'scared') { T.stage = 'safe'; chips([['我現在安全', () => safeAns(true)], ['我覺得不安全', () => safeAns(false)]]); return; }
    freePrompt('可以多說一點發生了什麼事嗎？打幾個字就好，不想說也可以按「不想說」。', true);
  }
  function safeAns(ok) {
    me(ok ? '我現在安全' : '我覺得不安全');
    if (!ok) { crisis('danger'); return; }
    pet('好，那就好。我們慢慢說。');
    freePrompt('可以多說一點發生了什麼事嗎？', true);
  }
  function freePrompt(q, allowSkip) {
    pet(q);
    T.stage = T.stage === 'good' ? 'good_story' : 'story';
    chips(allowSkip ? [['不想說', skipStory]] : []);
    try { T.ent.focus(); } catch (e) { /* 忽略 */ }
  }
  function skipStory() { me('不想說'); pet('沒關係，不想說也可以。你願意讓我陪你，就已經很好了 💛'); afterStory(); }
  function send() {
    const txt = T.ent.value.trim();
    if (!txt) return;
    T.ent.value = '';
    me(txt);
    if (has(txt, SELF_HARM)) { crisis('self'); return; }
    if (has(txt, ABUSE)) { crisis('abuse'); return; }
    if (has(txt, BULLY) && !T.flags.has('bully')) { T.flags.add('bully'); bullyReply(); return; }
    if (['story', 'topic', 'emo'].includes(T.stage)) respondStory(txt);
    else if (T.stage === 'good_story') { pet(`哇～「${txt.slice(0, 20)}」，聽起來很棒！把這件小事記在心裡，難過的時候可以拿出來想一想 ✨`); offerEnd(); }
    else if (T.stage === 'wish') { pet(`嗯，你希望「${txt.slice(0, 24)}」。知道自己想要什麼，就是解決問題的第一步！`); ideas(); }
    else pet('嗯嗯，我有在聽 🐾');
  }
  function respondStory(txt) {
    const e = EMO[T.emo || 'unsure'];
    if (txt.length < 6) pet(`嗯，「${txt}」。我懂了一點點，謝謝你說 💛`);
    else pet(`我聽到了：發生了這件事，讓你覺得${e[2]}。\n會有這樣的感覺很正常，換作是我，可能也會這樣。`);
    afterStory();
  }
  function afterStory() {
    if (T.emo === 'happy' || T.emo === 'calm') { pet('要不要把今天的好心情記在心情日記裡？'); offerEnd(); return; }
    T.stage = 'wish';
    pet('那你希望事情變成怎樣呢？（打字，或點「不知道」）');
    chips([['不知道', ideas]]);
  }
  function bullyReply() {
    pet('你說的事情聽起來像是被欺負了。我想先跟你說：\n\n💛 這不是你的錯。\n💛 你不用一個人面對。\n\n可以這樣做：\n' +
      '1. 告訴導師、輔導老師或爸媽（可以帶一個朋友陪你去）。\n2. 把發生的時間、地點、誰在場寫下來。\n' +
      '3. 網路上被罵，先截圖保留，不要回罵。\n4. 也可以打教育部反霸凌專線 1953（24 小時）。');
    T.stage = 'wish';
    chips([['我會去跟大人說', pickAdultIntro], ['我不敢說', scaredToTell], ['繼續聊', () => pet('好，我在聽。')]]);
  }
  function scaredToTell() {
    me('我不敢說');
    pet('會害怕很正常。可以試試這些方法：\n・寫一張紙條交給老師\n・在聯絡簿上寫「老師，我有事想跟你說」\n・請一個信任的朋友陪你一起去\n大人知道了，才能保護你 💛');
    pickAdultIntro();
  }
  function ideas() {
    T.stage = 'ideas';
    pet('我們用「停一停、想一想、選一個、試試看」來想辦法。\n有這些方法，你想先試哪一個？');
    chips((IDEAS[T.topic || 'self'] || IDEAS.self).map(([t, d]) => [t, () => { me(t); pet(`好選擇！👍 ${d}`); pickAdultIntro(); }]).concat([['都不想', offerTools]]));
  }
  function pickAdultIntro() {
    T.stage = 'adult';
    pet('有誰可以幫你一起呢？');
    chips(ADULTS.map(w => [w, () => { me(w); pet(`好，找${w}說說看！可以這樣開頭：\n「我今天有一件事，心裡卡卡的，想跟你說…」`); offerTools(); }]));
  }
  function offerTools() {
    T.stage = 'tools';
    pet('要不要做一個冷靜小工具，讓身體放鬆一下？');
    const items = ['breath', 'ground', 'muscle', 'cards', 'draw', 'video'].map(k => [`${TOOL[k][1]} ${TOOL[k][2]}`, () => {
      runTool(k, fin => { if (fin) calmReward(TOOL[k][2]); station(); });
    }]);
    items.push(['結束聊天', offerEnd]);
    chips(items);
  }
  function offerEnd() {
    T.stage = 'end';
    pet('謝謝你願意跟我說，這很勇敢 💛\n要把今天的心情記在心情日記嗎？（只記心情，不會記你打的字）');
    chips([['📔 記下來', () => talkSave(true)], ['不用了', () => talkSave(false)]]);
  }
  function talkSave(keep) {
    if (keep) {
      addEntry({ emo: T.emo || 'unsure', lv: 0, tool: 'talk', topic: T.topic || '', from: 'talk' });
      me('記下來'); pet('記好了！隨時都可以再來找我說話 🐾');
    } else { me('不用了'); pet('好～隨時都可以再來找我說話 🐾'); }
    chips([['再聊一件事', askTopic], ['關閉', () => close()]]);
    H.say('🐾 謝謝你跟我說話', 'happy');
  }
  function crisis(kind) {
    T.stage = 'crisis';
    if (kind === 'self') pet(`你說的話讓我很擔心你 💛\n你很重要，你的感受也很重要。\n這件事太重要了，我一隻小${H.isDog() ? '狗' : '夥伴'}沒辦法一個人幫你——請你現在就告訴身邊信任的大人。`);
    else if (kind === 'abuse') pet('謝謝你告訴我，這需要很大的勇氣 💛\n被打、被傷害、被不舒服地碰觸，都不是你的錯。\n請告訴一位你信任的大人（老師、輔導老師、家人），他們可以保護你。');
    else pet('你的安全最重要 💛 如果現在有危險，請馬上找身邊的大人，或打 110。');
    const box = hotlineBox();
    box.classList.add('in-chat');
    T.chat.appendChild(box);
    try { box.scrollIntoView({ block: 'end' }); } catch (e) { /* 忽略 */ }
    chips([['我會去找大人', pickAdultIntro], ['先陪我呼吸', () => runTool('breath', fin => { if (fin) calmReward('呼吸泡泡'); station(); })], ['繼續聊', () => pet('好，我在這裡陪你。')]]);
  }

  // ════════════════════════════════════════════════════════════════════
  //  📔 心情日記
  // ════════════════════════════════════════════════════════════════════
  function diary() {
    const b = panel('#7a6bd1', '📔 心情日記', { noDiary: true });
    const ents = load().entries;
    b.appendChild(el('<p class="sel-note">🔒 只存在這台裝置，只有你看得到。</p>'));
    const byDate = {};
    ents.forEach(e => { const k = String(e.t || '').slice(0, 10); (byDate[k] = byDate[k] || []).push(e); });
    const strip = el('<div class="sel-strip"></div>');
    const z = n => String(n).padStart(2, '0');
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      const k = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
      const es = byDate[k] || [];
      const em = es.length ? (EMO[es[es.length - 1].emo] || EMO.unsure) : null;
      strip.appendChild(el(`<div class="sel-day"><span style="background:${em ? ZONE_COL[em[3]] : 'transparent'}">${em ? em[1] : '·'}</span><small>${z(d.getDate())}</small></div>`));
    }
    b.appendChild(strip);
    if (!ents.length) b.appendChild(el('<p class="sel-note sel-center">還沒有紀錄。<br>在「🌈 心情小站」量一次情緒溫度，就會記在這裡。</p>'));
    const list = el('<div class="sel-list"></div>');
    ents.slice().reverse().slice(0, 60).forEach(e => {
      const em = EMO[e.emo] || EMO.unsure;
      let t = `${em[2]}　${e.lv ? LEVELS[e.lv] : ''}`;
      if (e.tool) t += `　→ ${TOOL[e.tool] ? TOOL[e.tool][2] : e.tool}`;
      if (e.after) t += `　→ 剩下${LEVELS[e.after]}`;
      const r = el(`<div class="sel-entry"><span class="i">${em[1]}</span><span class="t"></span><small>${esc(e.t || '')}</small></div>`);
      r.querySelector('.t').textContent = t;
      list.appendChild(r);
    });
    b.appendChild(list);
    const r = row(b, 'sel-row-end');
    btn(r, '🌈 回心情小站', station, 'purple');
    btn(r, '🗑 全部刪除', () => {
      if (!confirm('確定要刪除全部的心情紀錄嗎？')) return;
      const d = load(); d.entries = []; save(d); diary();
    }, 'danger');
  }

  // ════════════════════════════════════════════════════════════════════
  //  對外
  // ════════════════════════════════════════════════════════════════════
  // 走動的狗狗被戳（pet_engine.js 發出）也算進捉弄
  window.addEventListener('puppy-poke', ev => note(ev.detail && ev.detail.angry ? 'poke_angry' : 'poke'));

  window.PuppySEL = {
    mount(hooks) { H = hooks; },
    station, tease, openCare, talk, diary, note, forget,
    TEASES: TEASES.map(t => [t[0], t[1], t[2]]),
    isOpen: () => !!ov,
    _t: {
      annoyance, load, save, addEntry, counts, calmReward, moodReward, careReward, runTool, care, close,
      get C() { return C; }, reset() { events = []; careOpen = false; warnedAt = 0; save(blank()); },
      setFast(v) { FAST = !!v; },
      storeKey, has, SELF_HARM, ABUSE, BULLY, EMOTIONS, TOOLS, CARE_AT, WARN_AT
    }
  };
})();
