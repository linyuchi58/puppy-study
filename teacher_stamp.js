// 《汪汪小精靈 學習小伙伴》老師蓋章：收成績頁（teacher.html）的老師端（v3.11.0）
// 老師用信箱驗證（要在試算表「老師名單」上）→ 拿到老師代碼（投影給學生加入）和蓋章金鑰（只存在這支手機）。
// 掃學生「請老師蓋章」的 QR → 算出 6 位數給學生打（裡面藏著 +1～+10 星星，學生改不了）。
// 學生 QR：PTS1.<老師指紋>.<裝置>.<日期 yyMMdd>.<亂數>.<年-班-座號，可以空白>
(function () {
  'use strict';
  const TEST = /[?&]apptest=1/.test(location.search);
  const CFG = window.PUPPY_CLOUD || {};
  const STORE = 'puppyStudy.teacherStamp.v1' + (TEST ? '.selftest' : '');
  const S = window.PuppyStamp;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function load() { try { const x = JSON.parse(localStorage.getItem(STORE) || 'null'); return x && typeof x === 'object' ? x : {}; } catch (e) { return {}; } }
  let st = load();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(st)); } catch (e) { /* 忽略 */ } }
  if (!(st.stars >= 1 && st.stars <= 10)) st.stars = 3;
  if (!Array.isArray(st.log)) st.log = [];

  // 和學生端（app.js）同一套算法，兩邊要一起改
  const fpOf = key => S.code(key, 'tfp');
  const codeOf = (key, dev, day, nonce, n) => S.code(key, ['tstamp', dev, day, nonce, n].join('|'));
  const tagOf = nonce => '🐶 ' + 'ABCDEFGHJKMNPQRSTUVWXYZ'[parseInt(nonce.slice(0, 2), 16) % 23] + (parseInt(nonce.slice(2, 4), 16) % 9 + 1);
  const pinHash = pin => S.code('70696e2d73616c742d7075707079', 'pin|' + (st.email || '') + '|' + pin);
  function dayStr(d) { d = d || new Date(); const z = n => String(n).padStart(2, '0'); return String(d.getFullYear()).slice(2) + z(d.getMonth() + 1) + z(d.getDate()); }
  const ready = () => !!(st.key && st.tcode);
  const online = () => !!CFG.scriptUrl;

  let api = async function (body) {
    const opt = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' };
    const r = await fetch(CFG.scriptUrl, opt);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  };
  const ERR = {
    not_teacher: '⚠️ 這個信箱不在試算表的「老師名單」上。請管理者在 taiwan77 的試算表「老師名單」A 欄加上這個信箱。',
    bad_email: '⚠️ 信箱格式不對', bad_code: '⚠️ 驗證碼不對', expired: '⚠️ 驗證碼過期或試太多次了，請重新寄一封',
    wait: '⚠️ 剛剛才寄過，請等一分鐘', too_many: '⚠️ 這一小時寄太多封了，請晚一點再試', quota: '⚠️ 今天的信已經寄完了，請明天再試',
    auth: '⚠️ 這支手機的老師資料已經過期（可能在別支手機換過代碼）。請用信箱重新驗證。'
  };
  let msg = '';
  function setMsg(s) { msg = s; const el = $('tsMsg'); if (el) el.textContent = s; }

  function askPin(why) {
    if (!st.pin) return true;
    const p = prompt(why + '\n\n請輸入老師密碼（4 位數）：');
    if (p === null) return false;
    if (pinHash(String(p).trim()) === st.pin) return true;
    alert('老師密碼不對。忘記的話，可以按「忘記密碼：重新用信箱驗證」。');
    return false;
  }
  function setPin() {
    for (;;) {
      const p = prompt('請設定 4 位數的「老師密碼」\n（看老師代碼、換代碼時要輸入，避免學生拿你的手機亂改）');
      if (p === null) return false;
      if (/^\d{4}$/.test(String(p).trim())) { st.pin = pinHash(String(p).trim()); save(); return true; }
      alert('請輸入 4 個數字');
    }
  }
  function adopt(r) {
    st.email = r.email; st.name = r.name; st.tcode = r.tcode; st.key = r.key; st.fp = fpOf(r.key);
    save();
  }

  // ── 畫面：③ 老師蓋章 分頁 ──
  function render() {
    const el = $('paneStamp');
    if (!el) return;
    if (!online()) { el.innerHTML = '<div class="card"><h2>👍 老師蓋章</h2><p class="note">老師蓋章要先設定雲端同步（試算表）才能用。</p></div>'; renderBar(); return; }
    if (!ready() || st.verifying) {
      el.innerHTML = `
        <div class="card">
          <h2>👍 老師蓋章：第一次設定</h2>
          <p class="note">只有試算表「老師名單」上的信箱可以當老師。驗證一次就好，之後這支手機就能幫學生蓋章（不用網路）。</p>
          <div class="row"><input id="tsMail" type="email" placeholder="老師的信箱" value="${esc(st.email || '')}" style="flex:1;min-width:200px;"><button id="tsSend">寄驗證碼</button></div>
          <div class="row" id="tsCodeRow" ${st.verifying ? '' : 'hidden'}><input id="tsCode" inputmode="numeric" maxlength="6" placeholder="信裡的 6 個數字" style="flex:1;"><button class="main" id="tsVerify">確認</button></div>
          <p class="warn" id="tsMsg" style="color:#7a5200;">${esc(msg)}</p>
          ${ready() ? '<div class="row"><button id="tsCancel">取消</button></div>' : ''}
        </div>`;
      $('tsSend').onclick = sendCode;
      if ($('tsVerify')) $('tsVerify').onclick = verify;
      if ($('tsCancel')) $('tsCancel').onclick = () => { st.verifying = false; save(); setMsg(''); render(); };
      renderBar();
      return;
    }
    const today = dayStr();
    const todays = st.log.filter(x => x.day === today);
    el.innerHTML = `
      <div class="card">
        <h2>👍 老師蓋章（${esc(st.name || '老師')}）</h2>
        <ol class="note" style="margin:4px 0 8px 1.2em;padding:0;line-height:1.8;">
          <li>學生在「自我打卡」頁按「👍 請老師蓋章」，螢幕出現 QR 和號碼牌。</li>
          <li>這裡選好要給幾顆星，按「📷 開始掃描」，一次可以掃好幾台。</li>
          <li>下面會列出每位學生的 <b>6 位數</b>，請學生打進去。每位學生一天一次。</li>
        </ol>
        <div class="row" style="align-items:center;">
          <b>這次給：</b>
          <div class="ts-stars" id="tsStars">${Array.from({ length: 10 }, (_, i) => `<button data-n="${i + 1}" class="${st.stars === i + 1 ? 'on' : ''}">+${i + 1}</button>`).join('')}</div>
          <span>⭐（會記住，下次一樣）</span>
        </div>
        <div class="row"><button class="main" id="tsScan">📷 開始掃描</button></div>
        <h2 style="margin-top:14px;">今天蓋的章（${todays.length}）</h2>
        <div class="ts-list" id="tsList">${listHtml(todays)}</div>
      </div>
      <div class="card noprint">
        <h2>🔑 老師代碼</h2>
        <p class="note">學生第一次要在「自我打卡」頁輸入老師代碼加入。看代碼、換代碼都要老師密碼。</p>
        <div class="row">
          <button id="tsShow">👁 顯示老師代碼（可以投影）</button>
          <button id="tsRotate">🔄 換新的老師代碼</button>
        </div>
        <div class="bigcode" id="tsBig" hidden></div>
        <p class="note">換新代碼後，舊代碼立刻不能用，全班要重新輸入新代碼。</p>
        <div class="row"><button id="tsRe">忘記密碼：重新用信箱驗證</button></div>
        <p class="warn" id="tsMsg" style="color:#7a5200;">${esc(msg)}</p>
      </div>`;
    el.querySelectorAll('#tsStars button').forEach(b => b.onclick = () => { st.stars = +b.dataset.n; save(); render(); });
    $('tsScan').onclick = () => { if (window.PuppyTeacherHooks && window.PuppyTeacherHooks.scan) window.PuppyTeacherHooks.scan(); };
    $('tsShow').onclick = () => {
      const big = $('tsBig');
      if (!big.hidden) { big.hidden = true; return; }
      if (!askPin('要顯示老師代碼')) return;
      big.textContent = st.tcode.slice(0, 3) + ' ' + st.tcode.slice(3);
      big.hidden = false;
    };
    $('tsRotate').onclick = rotate;
    $('tsRe').onclick = () => { st.verifying = true; save(); setMsg(''); render(); };
    renderBar();
  }
  function listHtml(items) {
    if (!items.length) return '<p class="note">還沒有。</p>';
    return items.slice().reverse().map(x => `
      <div class="ts-row ${x.bad ? 'bad' : ''}">
        <span class="ts-tag">${esc(x.tag || '')}</span>
        <span class="ts-who">${esc(x.who || '')}</span>
        ${x.bad ? `<span class="ts-bad">${esc(x.bad)}</span>` : `<span class="ts-code">${esc(x.code.slice(0, 3) + ' ' + x.code.slice(3))}</span><span class="ts-n">+${x.n}⭐</span>`}
      </div>`).join('');
  }
  // 收成績分頁（相機那一頁）上方的小條：掃到的蓋章碼也顯示在這裡
  function renderBar() {
    const bar = $('stampBar');
    if (!bar) return;
    if (!online() || !ready()) { bar.hidden = true; return; }
    bar.hidden = false;
    const todays = st.log.filter(x => x.day === dayStr());
    bar.innerHTML = `<div class="row" style="align-items:center;margin:0;"><b>👍 老師蓋章：這次給</b>
      <select id="tsBarN">${Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}" ${st.stars === i + 1 ? 'selected' : ''}>+${i + 1} ⭐</option>`).join('')}</select>
      <span class="note">掃到學生的蓋章 QR，6 位數會列在下面</span></div>
      <div class="ts-list">${listHtml(todays.slice(-8))}</div>`;
    $('tsBarN').onchange = ev => { st.stars = +ev.target.value; save(); };
  }

  async function sendCode() {
    const email = $('tsMail').value.trim();
    if (!email) { setMsg('請先輸入信箱'); return; }
    st.email = email.toLowerCase(); save();
    setMsg('⏳ 寄信中…');
    let r;
    try { r = await api({ a: 'tSend', email }); } catch (e) { setMsg('📶 連不上雲端，請確認網路'); return; }
    if (!r.ok) { setMsg(ERR[r.err] || '⚠️ 雲端暫時不能用'); return; }
    st.verifying = true; save();
    setMsg('📧 驗證碼寄出了！收件匣沒有就看「垃圾郵件」。');
    render();
    try { $('tsCode').focus(); } catch (e) { /* 忽略 */ }
  }
  async function verify() {
    const code = $('tsCode').value.replace(/\D/g, '');
    if (code.length !== 6) { setMsg('驗證碼是 6 個數字'); return; }
    setMsg('⏳ 確認中…');
    let r;
    try { r = await api({ a: 'tVerify', email: st.email, code }); } catch (e) { setMsg('📶 連不上雲端，請確認網路'); return; }
    if (!r.ok) { setMsg(ERR[r.err] || '⚠️ 雲端暫時不能用'); return; }
    adopt(r); st.verifying = false; st.pin = ''; save();
    setPin();
    setMsg('✅ 設定好了！請按「顯示老師代碼」投影給學生加入。');
    render();
  }
  async function rotate() {
    if (!askPin('要換新的老師代碼')) return;
    if (!confirm('確定要換新的老師代碼嗎？\n\n換了以後，舊代碼立刻不能用，全班學生都要重新輸入新代碼才能蓋章。')) return;
    setMsg('⏳ 換代碼中…');
    let r;
    try { r = await api({ a: 'tRotate', email: st.email, key: st.key }); } catch (e) { setMsg('📶 連不上雲端，請確認網路'); return; }
    if (!r.ok) { setMsg(ERR[r.err] || '⚠️ 雲端暫時不能用'); return; }
    adopt(r);
    setMsg('✅ 換好了！新的老師代碼已經顯示，請投影給學生重新加入。');
    render();
    const big = $('tsBig'); big.textContent = st.tcode.slice(0, 3) + ' ' + st.tcode.slice(3); big.hidden = false;
  }

  // ── 掃到 QR：是不是學生的蓋章 QR？是的話算出 6 位數 ──
  // 回傳 null（不是蓋章 QR）或 [成功?, 訊息, 一列資料]
  function scan(text) {
    const p = String(text || '').split('.');
    if (p[0] !== 'PTS1') return null;
    if (p.length !== 6 || !/^\d{6}$/.test(p[1]) || !/^[0-9a-f]{6}$/.test(p[2]) || !/^\d{6}$/.test(p[3]) || !/^[0-9a-f]{4}$/.test(p[4])) return [false, '這個蓋章 QR 讀不懂'];
    if (!ready()) return [false, '這支手機還沒設定老師蓋章（到「③ 老師蓋章」設定）'];
    const today = dayStr();
    const tag = tagOf(p[4]);
    const who = /^\d{1,2}-\d{1,2}-\d{1,2}$/.test(p[5]) ? p[5].replace(/^(\d+)-(\d+)-(\d+)$/, '$1 年 $2 班 $3 號') : '';
    let row = st.log.find(x => x.day === today && x.dev === p[2] && x.nonce === p[4]);
    if (row) return [true, `${tag} 已經掃過了：${row.bad || row.code}`, row, 'dup'];
    row = { day: today, dev: p[2], nonce: p[4], tag, who, at: Date.now() };
    if (p[1] !== st.fp) row.bad = '⚠ 加入的不是你現在的老師代碼，請他重新加入';
    else if (p[3] !== today) row.bad = '⚠ 學生裝置的日期不是今天';
    else { row.n = st.stars; row.code = codeOf(st.key, p[2], p[3], p[4], st.stars); }
    st.log.push(row);
    st.log = st.log.filter(x => x.day >= dayStr(new Date(Date.now() - 7 * 864e5))).slice(-300);
    save();
    render();
    return row.bad ? [false, `${tag} ${row.bad}`, row, 'bad'] : [true, `${tag}${who ? '（' + who + '）' : ''}：${row.code.slice(0, 3)} ${row.code.slice(3)}（+${row.n}⭐）`, row, 'new'];
  }

  window.PuppyTeacherStamp = {
    mount() { render(); },
    render, scan,
    _t: { get st() { return st; }, set api(f) { api = f; }, fpOf, codeOf, tagOf, dayStr, adopt, save, reset() { st = { stars: 3, log: [] }; save(); } }
  };
})();
