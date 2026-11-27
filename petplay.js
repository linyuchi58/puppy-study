// -*- coding: utf-8 -*-
// 《汪汪小精靈 學習小伙伴》網頁版 —— v3.15.0「🐾 寵物互動」
// 照電腦版右鍵面板的「寵物互動」區：使用道具、指令把戲、餵飯、丟皮球、收玩具、變裝配件、洗澡、毛色、大小、寵物靜音。
// 放在左邊「百寶箱」的第一個分頁。花星星、親密度解鎖的規則都沿用 app.js（useItem、doTrick、DOG_ACC、PETS）。
(function () {
  'use strict';

  // 大小：和電腦版 SIZES 同比例（中＝網頁原本的 1.05）
  const SIZES = [['小', 0.8], ['中', 1.05], ['大', 1.4], ['特大', 1.75]];

  let api = null;
  let sub = '';   // '' 主畫面；props 道具；acc 配件；coat 毛色；size 大小

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const st = () => api.getState();
  const pi = () => window.PuppyInteractive;

  function sizeName() {
    const s = st().settings.pet_size;
    return SIZES.some(r => r[0] === s) ? s : '中';
  }
  function muted() { return !!st().settings.pet_mute; }

  // 存檔裡的大小、靜音套用到狗狗身上（開網頁時、匯入紀錄後都要叫一次）
  function apply() {
    if (!api) return;
    window.PUPPY_SOUND_OFF = muted();
    const row = SIZES.find(r => r[0] === sizeName());
    if (pi() && pi().setScale) pi().setScale(row[1]);
  }

  function tile(id, icon, name, extra = '', on = false) {
    return `<button class="chip-btn pp-tile ${on ? 'pp-on' : ''}" data-pp="${id}" ${on ? 'aria-pressed="true"' : ''}>${icon} ${esc(name)}${extra ? `<small>${extra}</small>` : ''}</button>`;
  }
  function back() { return '<button class="chip-btn pp-back" data-pp="back">↩ 返回</button>'; }

  function grid() {
    const s = st();
    const stars = s.stars || 0;
    const I = api.ITEMS;
    const price = k => `⭐ ${I[k][2]}`;
    if (sub === 'props') {
      return back() + Object.keys(I).map(k => {
        const [icon, name, cost] = I[k];
        return `<button class="chip-btn ${stars < cost ? 'chip-poor' : ''}" data-pp="item:${k}">${icon} ${esc(name)}<small>⭐ ${cost}</small></button>`;
      }).join('');
    }
    if (sub === 'acc') {
      const lv = api.maxDogLevel();
      const cur = s.pets.acc || 'none';
      return back() + api.DOG_ACC.map(([aid, icon, name, need]) => lv >= need
        ? tile('acc:' + aid, icon, name, cur === aid ? '✓ 戴著' : '', cur === aid)
        : `<button class="chip-btn chip-locked" data-pp="acc:${aid}">🔒 ${esc(name)}<small>Lv${need}</small></button>`).join('');
    }
    if (sub === 'coat') {
      const cur = s.pets.current;
      return back() + api.PETS.filter(p => p[0].startsWith('dog:')).map(p => {
        const name = p[0].slice(4);
        const col = (api.DOG_COAT[name] || ['#ccc'])[0];
        const dot = `<span class="pp-dot" style="background:${col}"></span>`;
        return api.isPetUnlocked(p[0])
          ? `<button class="chip-btn pp-tile ${cur === p[0] ? 'pp-on' : ''}" data-pp="coat:${esc(p[0])}">${dot} ${esc(p[2])}${cur === p[0] ? '<small>✓ 目前</small>' : ''}</button>`
          : `<button class="chip-btn chip-locked" data-pp="coat:${esc(p[0])}">🔒 ${esc(p[2])}<small>還沒解鎖</small></button>`;
      }).join('');
    }
    if (sub === 'size') {
      const cur = sizeName();
      return back() + SIZES.map(([n]) => tile('size:' + n, '🐕', n, cur === n ? '✓ 目前' : '', cur === n)).join('');
    }
    return [
      tile('props', '🎒', '使用道具'),
      tile('tricks', '🎪', '指令把戲'),
      tile('item:bowl', '🥣', '餵飯', price('bowl')),
      tile('item:ball', '⚽', '丟皮球', price('ball')),
      tile('tidy', '🧹', '收玩具'),
      tile('acc', '🕶', '變裝配件'),
      tile('item:bath', '🛁', '洗澡', price('bath')),
      tile('coat', '🎨', '毛色'),
      tile('size', '📏', '大小', sizeName()),
      tile('mute', '🔇', '寵物靜音', muted() ? '開著' : '', muted())
    ].join('');
  }

  function tip() {
    if (sub === 'props') return '用學習賺到的星星換道具。吃飽了才有力氣玩和表演。';
    if (sub === 'acc') return '配件看「狗狗夥伴裡最高的親密度」解鎖，換夥伴也能戴。';
    if (sub === 'coat') return '毛色就是換狗狗夥伴，親密度都會保留。還沒解鎖的可以到「寵物圖鑑」看條件。';
    if (sub === 'size') return '只改變在畫面上走動的狗狗大小，每台裝置各自記住。';
    return '跟電腦版一樣的寵物互動。餵飯、丟皮球、洗澡要用星星；收玩具、毛色、大小、靜音都免費。';
  }

  function say(m, mood) { api.petSay(m, mood || 'normal'); }

  // 回傳 true＝要重畫百寶箱
  function click(id) {
    if (!api || !id) return false;
    const s = st();
    if (id === 'back') { sub = ''; return true; }
    if (id === 'props' || id === 'acc' || id === 'coat' || id === 'size') { sub = id; return true; }
    if (id === 'tricks') { sub = ''; api.setPlayTab('trick'); return false; }
    if (id.startsWith('item:')) { api.useItem(id.slice(5)); return true; }
    if (id === 'tidy') {
      const n = pi() && pi().clearToys ? pi().clearToys() : 0;
      say(n ? '🧹 玩具都收好了，地上乾乾淨淨！' : '🧹 地上沒有玩具，已經很整齊了！');
      return false;
    }
    if (id === 'mute') {
      s.settings.pet_mute = !muted();
      api.save();
      apply();
      say(muted() ? '🔇 我戴上口罩，安安靜靜陪你～' : '🔊 汪！我又可以出聲音了！');
      return true;
    }
    if (id.startsWith('size:')) {
      const n = id.slice(5);
      if (!SIZES.some(r => r[0] === n)) return false;
      s.settings.pet_size = n;
      api.save();
      apply();
      say(`📏 我變成「${n}」號了！`, 'happy');
      return true;
    }
    if (id.startsWith('acc:')) {
      const aid = id.slice(4);
      const row = api.DOG_ACC.find(r => r[0] === aid);
      if (!row) return false;
      if (api.maxDogLevel() < row[3]) {
        say(`🔒 「${row[2]}」要狗狗親密度 Lv${row[3]} 才能戴（現在 Lv${api.maxDogLevel()}）。一起學習就會解鎖！`);
        return false;
      }
      s.pets.acc = aid;
      api.save();
      say(aid === 'none' ? '✨ 拿掉配件，清爽原貌！' : `${row[1]} 換上「${row[2]}」了！好看嗎？`, 'happy');
      return true;
    }
    if (id.startsWith('coat:')) {
      const pid = id.slice(5);
      const row = api.PETS.find(p => p[0] === pid);
      if (!row) return false;
      if (!api.isPetUnlocked(pid)) {
        say(`🔒 ${row[2]}還沒解鎖。條件：${row[5]}`);
        return false;
      }
      s.pets.current = pid;
      api.save();
      say(`${row[1]} 我是${row[2]}！一起開心地學習吧！`, 'happy');
      if (pi() && pi().react) pi().react('pat');
      return true;
    }
    return false;
  }

  function addStyle() {
    if (document.getElementById('petplayStyle')) return;
    const el = document.createElement('style');
    el.id = 'petplayStyle';
    el.textContent = `
      .pp-on { border-color: #e5679a !important; box-shadow: 0 0 0 2px #fdeef4 inset; background: #fff5f9 !important; }
      .pp-back { background: #f1f2f6 !important; }
      .pp-dot { display: inline-block; width: .9em; height: .9em; border-radius: 50%; border: 1px solid rgba(0,0,0,.25); vertical-align: -1px; }`;
    document.head.appendChild(el);
  }

  window.PuppyPetPlay = {
    mount(a) { api = a; addStyle(); apply(); },
    apply,
    grid,
    tip,
    click,
    reset() { sub = ''; },
    SIZES
  };
})();
