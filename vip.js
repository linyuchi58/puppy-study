// -*- coding: utf-8 -*-
// 《汪汪小精靈 學習小伙伴》網頁版 —— v3.15.0 VIP 驗證碼（老師專用）
// 輸入正確代碼：解鎖全部夥伴、親密度到最高、星星補到 9999、愛心補滿、保護卡 2 張。
// 這個檔案是公開的，所以只存「雜湊」，看不出代碼本身。代碼記在老師電腦的 AI交接/VIP驗證碼_只在本機.md。
// 算法：先把輸入轉大寫、只留英文和數字 → h = sha256(SALT + '|' + 代碼) → 再做 ROUNDS 次 h = sha256(SALT + h)，和 HASH 比對。
(function () {
  'use strict';

  const SALT = 'b857574d3adbc73e';
  const ROUNDS = 20000;
  const HASH = 'bdd9a3754c8bf87034bbd5801d06f8a36f5b60898cf175440debb1f709f7decc';
  const STARS_TOP = 9999;
  const TRIES_PER_DAY = 10;

  let api = null;
  let lastMsg = '';   // 解鎖後畫面會重畫，訊息留到新畫面再顯示

  function norm(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

  function hashOf(code) {
    let h = api.sha256(SALT + '|' + norm(code));
    for (let i = 0; i < ROUNDS; i++) h = api.sha256(SALT + h);
    return h;
  }

  // 把這份紀錄升到頂（只會變多，不會變少）
  function grant(st) {
    const today = api.today();
    const top = api.BOND_LV[api.BOND_LV.length - 1];
    st.pets.unlocked = st.pets.unlocked || {};
    st.pets.bond = st.pets.bond || {};
    api.PETS.forEach(p => {
      const pid = p[0];
      if (!st.pets.unlocked[pid]) st.pets.unlocked[pid] = today;
      st.pets.bond[pid] = Math.max(parseInt(st.pets.bond[pid], 10) || 0, top);
    });
    st.stars = Math.max(st.stars || 0, STARS_TOP);
    if (st.eng) st.eng.hearts = api.HEART_MAX;
    if (st.streak) st.streak.freeze = Math.max(st.streak.freeze || 0, 2);
    st.pets.fullness = 100;
    st.vip = { on: true, since: (st.vip && st.vip.since) || today, last: today };
  }

  function tryCode(code) {
    const st = api.getState();
    const today = api.today();
    st.settings = st.settings || {};
    const t = st.settings.vip_tries || {};
    if (t.d !== today) { t.d = today; t.n = 0; }
    if (t.n >= TRIES_PER_DAY) return 'limit';
    if (!norm(code)) return 'empty';
    if (hashOf(code) !== HASH) {
      t.n += 1;
      st.settings.vip_tries = t;
      api.save();
      return 'wrong';
    }
    grant(st);
    st.settings.vip_tries = { d: today, n: 0 };
    api.save();
    return 'ok';
  }

  // 放在「搬家碼／備份」最下面的淡色小字，點了才展開
  function render(wrap) {
    if (!api || !wrap) return;
    const st = api.getState();
    const box = document.createElement('div');
    box.className = 'vip-mini';
    box.innerHTML = `
      <button type="button" class="vip-key" aria-expanded="false" title="序號">🔑${st.vip && st.vip.on ? ' 👑' : ''}</button>
      <div class="vip-form" ${lastMsg ? '' : 'hidden'}>
        <input type="text" class="vip-in" maxlength="20" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="輸入代碼">
        <button type="button" class="vip-go">確定</button>
        <span class="vip-msg" role="status">${lastMsg}</span>
      </div>`;
    wrap.appendChild(box);
    lastMsg = '';
    const key = box.querySelector('.vip-key');
    const form = box.querySelector('.vip-form');
    const inp = box.querySelector('.vip-in');
    const msg = box.querySelector('.vip-msg');
    key.addEventListener('click', () => {
      form.hidden = !form.hidden;
      key.setAttribute('aria-expanded', String(!form.hidden));
      if (!form.hidden) inp.focus();
    });
    const go = () => {
      msg.textContent = '檢查中…';
      setTimeout(() => {
        const r = tryCode(inp.value);
        if (r === 'ok') {
          inp.value = '';
          msg.textContent = lastMsg = '👑 已解鎖全部！';
          api.petSay('👑 VIP 解鎖！所有夥伴、才藝、配件都可以用了，星星也補滿囉！');
          api.refresh();
        } else if (r === 'limit') msg.textContent = '今天試太多次了，明天再試。';
        else if (r === 'empty') msg.textContent = '';
        else msg.textContent = '代碼不對。';
      }, 30);
    };
    box.querySelector('.vip-go').addEventListener('click', go);
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') go(); });
  }

  // 只加一次樣式（不動共用的 style.css）
  function addStyle() {
    if (document.getElementById('vipStyle')) return;
    const s = document.createElement('style');
    s.id = 'vipStyle';
    s.textContent = `
      .vip-mini { text-align: center; margin: -6px 0 10px; opacity: .45; font-size: .82rem; }
      .vip-mini:focus-within, .vip-mini:hover { opacity: 1; }
      .vip-key { background: none; border: none; cursor: pointer; font-size: .85rem; padding: 2px 6px; color: inherit; }
      .vip-form { display: inline-flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center; }
      .vip-in { width: 9.5em; padding: 4px 8px; border-radius: 8px; border: 1px solid #ccc; font-family: monospace; letter-spacing: .08em; }
      .vip-go { padding: 4px 10px; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; }
      .vip-msg { min-width: 6em; }`;
    document.head.appendChild(s);
  }

  window.PuppyVIP = {
    mount(a) { api = a; addStyle(); },
    render,
    tryCode,
    _test: { norm, hashOf, grant, HASH }
  };
})();
