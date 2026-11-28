// -*- coding: utf-8 -*-
// 《汪汪小精靈 學習小伙伴》網頁版 —— 🌟「今天」分頁（v3.23.0 起）
// 把「每天回來要做的事」放在同一頁：錯題複習本（v3.23.0）、20 天成長地圖（v3.24.0）……之後的版本會再加成長地圖、每週報告、雙人對戰、每日任務。
// 這個檔案只負責畫面；存檔、獎勵都透過 app.js 給的 hooks（getState、save、award…），規則和其他分頁一樣。
(function () {
  'use strict';

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let pane = null, H = null;

  // ── 🗺️ 20 天成長地圖（v3.24.0）──
  // 累積學習天數（不用連續；有拿到經驗值的日子）走到第 N 天，就能在這裡領禮物。大約每 2 天一個。
  // [第幾天, 種類 star／wear, 數值（星星數／裝飾代號）]
  const MAP_STOPS = [
    [1, 'star', 3], [3, 'wear', 'map_clover'], [5, 'star', 5], [7, 'wear', 'map_compass'], [9, 'star', 5],
    [11, 'wear', 'map_rainbow'], [13, 'star', 8], [15, 'wear', 'map_star'], [17, 'star', 8], [20, 'wear', 'map_trophy']
  ];
  const MAP_LEN = 20;
  const MAP_PET = { 10: ['🐕', '三色柯基（累積學習 10 天）'] };   // 原本就有的夥伴解鎖，標在地圖上提醒
  function gmap() {
    const st = H.getState();
    if (!st.gmap || typeof st.gmap !== 'object' || Array.isArray(st.gmap)) st.gmap = {};
    if (!st.gmap.got || typeof st.gmap.got !== 'object' || Array.isArray(st.gmap.got)) st.gmap.got = {};
    return st.gmap;
  }
  function stopGift(stop) {
    if (stop[1] === 'star') return { icon: '⭐', name: `${stop[2]} 顆星星` };
    const r = H.wearOf(stop[2]) || [];
    return { icon: r[1] || '🎁', name: r[2] || '神秘禮物' };
  }
  function mapReady() {
    const days = H.learnDays(), got = gmap().got;
    return MAP_STOPS.filter(s => s[0] <= days && !got[s[0]]);
  }
  function claimStop(day) {
    const stop = MAP_STOPS.find(s => s[0] === day);
    const got = gmap().got;
    if (!stop || got[day] || H.learnDays() < day) return false;
    got[day] = todayStr();
    const g = stopGift(stop);
    if (stop[1] === 'star') {
      H.award(0, stop[2], null, `🗺️ 成長地圖第 ${day} 天的禮物`);
    } else {
      H.giveWear(stop[2]);
      H.petSay(`🗺️ 走到成長地圖第 ${day} 天！得到「${g.icon} ${g.name}」，已經幫狗狗戴上了（衣櫃裡可以換）！`, 'happy');
    }
    H.save();
    return true;
  }
  function todayStr() { const d = new Date(); const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }
  function mapHtml() {
    const days = H.learnDays(), got = gmap().got;
    const ready = mapReady();
    const next = MAP_STOPS.find(s => s[0] > days);
    const pos = Math.min(days, MAP_LEN);
    let tip;
    if (ready.length) tip = `🎁 有 ${ready.length} 份禮物可以領！按下面發亮的禮物。`;
    else if (next) { const g = stopGift(next); tip = `再學習 <b>${next[0] - days}</b> 天，就能拿到「${g.icon} ${esc(g.name)}」！`; }
    else tip = '🏆 你走完 20 天成長地圖了，是真正的小小探險家！繼續每天學習，狗狗會更愛你。';
    if (!H.learnedToday() && days < MAP_LEN) tip += ' <span class="td-map-today">今天還沒學習：完成一項學習就能往前走一格。</span>';
    const cells = [];
    for (let d = 1; d <= MAP_LEN; d++) {
      const stop = MAP_STOPS.find(s => s[0] === d);
      const reached = d <= days;
      let inner = `<span class="td-day">${d}</span>`, cls = 'td-cell';
      if (reached) cls += ' reached';
      if (d === pos) cls += ' here';
      if (stop) {
        const g = stopGift(stop);
        cls += ' stop';
        if (got[d]) { cls += ' got'; inner += `<span class="td-gift">${g.icon}</span><small>✓ 領過</small>`; }
        else if (reached) { cls += ' ready'; inner += `<span class="td-gift">${g.icon}</span><small>領取！</small>`; }
        else inner += `<span class="td-gift">🎁</span><small>${g.icon}</small>`;
      } else if (MAP_PET[d]) {
        inner += `<span class="td-gift">${MAP_PET[d][0]}</span><small>新夥伴</small>`;
        cls += ' pet';
      }
      if (d === pos) inner += '<span class="td-me" aria-label="你在這裡">🐾</span>';
      const tag = stop && reached && !got[d] ? 'button' : 'div';
      cells.push(`<${tag} class="${cls}" ${tag === 'button' ? `data-stop="${d}" type="button"` : ''} title="${stop ? '第 ' + d + ' 天：' + esc(stopGift(stop).name) : MAP_PET[d] ? esc(MAP_PET[d][1]) : '第 ' + d + ' 天'}">${inner}</${tag}>`);
    }
    // 蛇形：第 2、4 排倒過來，看起來像一條路
    const rows = [];
    for (let r = 0; r < 4; r++) { const row = cells.slice(r * 5, r * 5 + 5); rows.push(`<div class="td-map-row${r % 2 ? ' rev' : ''}">${(r % 2 ? row.reverse() : row).join('')}</div>`); }
    return `
      <div class="card-box td-card">
        <div class="section-title"><span>🗺️ 20 天成長地圖</span><span class="td-pill">已經學習 ${days} 天</span></div>
        <p class="section-sub">每天完成一項學習（英語、打字、心算、益智、打卡都算），就往前走一格，<b>不用連續</b>。大約每 2 天有一份禮物：星星，或只有地圖才拿得到的狗狗裝飾。</p>
        <div class="td-map-tip">${tip}</div>
        <div class="td-map">${rows.join('')}</div>
      </div>`;
  }

  function mmdd(day) { return day ? day.slice(5).replace('-', '/') : ''; }

  // ── 🔁 錯題複習本（v3.23.0）──
  function reviewHtml() {
    const e = H.engReview ? H.engReview() : { due: 0, mistakes: 0 };
    const m = window.PuppyMath && window.PuppyMath.reviewStats ? window.PuppyMath.reviewStats() : { due: 0, total: 0, grad: 0, next: '' };
    const eDue = e.due + e.mistakes;
    const row = (icon, name, due, sub, id) => `
      <div class="td-rv-row${due ? ' due' : ''}">
        <span class="td-rv-ico">${icon}</span>
        <span class="td-rv-txt"><b>${name}</b><small>${sub}</small></span>
        ${due ? `<button class="btn btn-orange" id="${id}">複習 ${due} 題</button>` : '<span class="td-rv-ok">✔ 今天沒有</span>'}
      </div>`;
    const mSub = m.total
      ? `還有 ${m.total} 題在本子裡${m.grad ? `，已經畢業 ${m.grad} 題` : ''}${!m.due && m.next ? `，下一次 ${mmdd(m.next)}` : ''}`
      : '心算答錯的題目會自動收進來';
    const eSub = e.mistakes ? `剛答錯的 ${e.mistakes} 個字＋該複習的字` : '英語闖關答錯的字、快忘記的字';
    return `
      <div class="card-box td-card">
        <div class="section-title"><span>🔁 錯題複習本</span><span class="td-pill">${eDue + m.due ? `今天 ${eDue + m.due} 題` : '今天都複習完了'}</span></div>
        <p class="section-sub">答錯的題目隔 <b>1 天、3 天、7 天</b>再出一次，三次都一次答對就「畢業」，不會再出現。錯了沒關係，記起來最重要！</p>
        ${row('🧮', '心算', m.due, mSub, 'tdRvMath')}
        ${row('🦉', '英語單字', eDue, eSub, 'tdRvEng')}
      </div>`;
  }

  function render() {
    if (!pane || !H) return;
    pane.innerHTML = `
      <div class="td-head card-box">
        <div class="section-title"><span>🌟 今天</span><span class="td-pill">🔥 連續 ${(H.getState().streak || {}).n || 0} 天</span></div>
        <p class="section-sub">每天回來先看這一頁：今天該複習什麼，一眼就知道。</p>
      </div>
      ${reviewHtml()}
      ${mapHtml()}`;
    const on = (sel, fn) => { const el = pane.querySelector(sel); if (el) el.addEventListener('click', fn); };
    on('#tdRvMath', () => H.goMathReview());
    on('#tdRvEng', () => H.goEnglishReview());
    pane.querySelectorAll('[data-stop]').forEach(b => b.addEventListener('click', () => { if (claimStop(+b.dataset.stop)) render(); }));
  }

  // 底部導覽列「今天」上的小紅點：今天要複習的題數
  function badgeCount() {
    try {
      const e = H.engReview ? H.engReview() : { due: 0, mistakes: 0 };
      const m = window.PuppyMath && window.PuppyMath.reviewStats ? window.PuppyMath.reviewStats() : { due: 0 };
      return e.due + e.mistakes + m.due + mapReady().length;
    } catch (err) { return 0; }
  }

  window.PuppyToday = {
    mount(el, hooks) { pane = el; H = hooks; },
    show() { render(); },
    badgeCount,
    _t: { render, MAP_STOPS, mapReady, claimStop, gmap }
  };
})();
