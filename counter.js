// 《汪汪小精靈 學習小伙伴》網頁下方的瀏覽人次（v3.7.1）
//
// 使用者 11-16 決定要加。GitHub Pages 沒有自己的伺服器，所以借用免費的計數服務 Abacus
// （https://abacus.jasoncameron.dev，免註冊、開放原始碼）。
//
// 隱私：
//   ‧ 只送出「把計數加 1」這個請求，不送任何學生資料、不放 cookie、不帶來源網址（no-referrer）。
//   ‧ 對方伺服器還是會看到連線的網路位址（IP），這是任何網路請求都避免不了的。
//   ‧ 同一台裝置一天只算一次（用瀏覽器的 localStorage 記日期），所以數字是「人次」：同一個人不同天各算一次。
//   ‧ 只有正式網址（linyuchi58.github.io）才會連線；本機預覽、自動測試都不會連線，也不會顯示。
//
// 不想要了：把 index.html 裡載入 counter.js 那一行刪掉即可，其他功能不受影響。
(function () {
  'use strict';
  const HOST = 'linyuchi58.github.io';
  const API = 'https://abacus.jasoncameron.dev';
  const NS = 'linyuchi58-puppy-study';
  const KEY = 'visits';
  const DAY_KEY = 'puppyStudy.counter.day';

  function todayStr() {
    const d = new Date();
    const p = n => (n < 10 ? '0' : '') + n;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function show(n) {
    const el = document.getElementById('visitCount');
    if (!el || !(n >= 0)) return;
    el.textContent = '瀏覽人次 ' + Number(n).toLocaleString('zh-TW');
    el.hidden = false;
  }

  function run() {
    if (location.hostname !== HOST || /[?&](selftest|apptest)=1/.test(location.search)) return;
    let counted = false;
    try { counted = localStorage.getItem(DAY_KEY) === todayStr(); } catch (e) { /* 忽略 */ }
    const url = `${API}/${counted ? 'get' : 'hit'}/${NS}/${KEY}`;
    fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j || typeof j.value !== 'number') return;
        if (!counted) { try { localStorage.setItem(DAY_KEY, todayStr()); } catch (e) { /* 忽略 */ } }
        show(j.value);
      })
      .catch(() => { /* 連不上就不顯示，不影響其他功能 */ });
  }

  window.PuppyCounter = { show, todayStr };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
