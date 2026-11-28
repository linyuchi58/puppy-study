// -*- coding: utf-8 -*-
// 《汪汪小精靈 學習小伙伴》網頁版 —— 🌟「今天」分頁（v3.23.0 起）
// 把「每天回來要做的事」放在同一頁：錯題複習本（v3.23.0）……之後的版本會再加成長地圖、每週報告、雙人對戰、每日任務。
// 這個檔案只負責畫面；存檔、獎勵都透過 app.js 給的 hooks（getState、save、award…），規則和其他分頁一樣。
(function () {
  'use strict';

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let pane = null, H = null;

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
      ${reviewHtml()}`;
    const on = (sel, fn) => { const el = pane.querySelector(sel); if (el) el.addEventListener('click', fn); };
    on('#tdRvMath', () => H.goMathReview());
    on('#tdRvEng', () => H.goEnglishReview());
  }

  // 底部導覽列「今天」上的小紅點：今天要複習的題數
  function badgeCount() {
    try {
      const e = H.engReview ? H.engReview() : { due: 0, mistakes: 0 };
      const m = window.PuppyMath && window.PuppyMath.reviewStats ? window.PuppyMath.reviewStats() : { due: 0 };
      return e.due + e.mistakes + m.due;
    } catch (err) { return 0; }
  }

  window.PuppyToday = {
    mount(el, hooks) { pane = el; H = hooks; },
    show() { render(); },
    badgeCount,
    _t: { render }
  };
})();
