// 《汪汪小精靈 學習小伙伴》雲端同步（v3.9.0，學生自由選擇）
// 學生按「用 Google 登入」後，進度會自動存到老師的試算表；換一台裝置登入就拿回同一份進度。
// 沒登入的學生完全照舊：紀錄只存在自己的裝置。
// 設定在 cloud_config.js；沒設定就什麼都不出現、也不會連到 Google。
(function () {
  'use strict';
  const CFG = window.PUPPY_CLOUD || {};
  const TEST = /[?&](selftest|apptest)=1/.test(location.search);
  const ON = !!CFG.scriptUrl && !TEST;          // 有 scriptUrl 就開；clientId 有填才多一顆 Google 登入    // 自動測試時不連真的 Google 和老師的試算表
  const META_KEY = 'puppy_study_cloud_v1' + (TEST ? '_selftest' : '');
  const SESS_KEY = META_KEY + '.sess';
  const PUSH_DELAY = 15000;       // 有新進度後 15 秒自動上傳（期間一直有新進度，最多 60 秒也會傳）
  const PUSH_MAX_WAIT = 60000;
  const PULL_GAP = 120000;        // 離開超過 2 分鐘再回來，就檢查雲端有沒有比較新的
  const GIS_SRC = 'https://accounts.google.com/gsi/client';

  let meta = readMeta();          // { sub, email, key, rev, dirty, shared, sess, last }
  let status = '';                // 畫面上那一行狀態
  let busy = false;
  let timer = 0, firstDirtyAt = 0, retryMs = 30000, hiddenAt = 0;
  let suppress = 0;               // 套用雲端進度時，不要把它當成「新進度」再傳回去
  let changeN = 0;                // 上傳途中又有新進度時，傳完還是要再傳一次
  let box = null;                 // 「搬家碼／備份」頁裡的雲端區塊
  let gisReady = null;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 忽略 */ } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* 忽略 */ } }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* 忽略 */ } }
  function readMeta() { try { const m = JSON.parse(lsGet(META_KEY) || 'null'); return m && m.sub && m.key ? m : null; } catch (e) { return null; } }
  function saveMeta() { if (meta) lsSet(META_KEY, JSON.stringify(meta)); else lsDel(META_KEY); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function app() { return window.PuppyApp; }
  function inExam() { return !!(window.PuppyTyping && window.PuppyTyping.isExam && window.PuppyTyping.isExam()); }
  // 畫面上只顯示信箱的第一個字（同步碼給別人時，別人看不到完整信箱）
  function maskEmail(e) { const m = String(e || '').match(/^(.)[^@]*(@.+)$/); return m ? m[1] + '***' + m[2] : String(e || ''); }
  function hhmm(d) { const z = n => String(n).padStart(2, '0'); return `${d.getMonth() + 1}/${d.getDate()} ${z(d.getHours())}:${z(d.getMinutes())}`; }

  async function api(body, keepalive) {
    const opt = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' };
    if (keepalive && opt.body.length < 60000) opt.keepalive = true;
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    if (ctl) { opt.signal = ctl.signal; setTimeout(() => ctl.abort(), 30000); }
    const r = await fetch(CFG.scriptUrl, opt);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  function setStatus(s) { status = s; paintStatus(); }
  function paintStatus() { const el = box && box.querySelector('#cloudStatus'); if (el) el.textContent = status; }

  // ── 有新進度（app.js 的 saveState 每次存檔都會呼叫）──
  function changed() {
    if (!ON || !meta || suppress) return;
    changeN++;
    if (!meta.dirty) { meta.dirty = true; saveMeta(); }
    if (!firstDirtyAt) firstDirtyAt = Date.now();
    clearTimeout(timer);
    const wait = Math.max(0, Math.min(PUSH_DELAY, firstDirtyAt + PUSH_MAX_WAIT - Date.now()));
    timer = setTimeout(() => push(false), wait);
    if (!status || /已同步/.test(status)) setStatus('☁️ 有新進度，等一下會自動存到雲端');
  }

  function summaryOf(obj) { return { stars: (obj && obj.stars) || 0, xp: (obj && obj.xp_total) || 0 }; }

  async function push(keepalive, force) {
    if (!meta || busy) return;
    if (!meta.dirty && !force) return;
    clearTimeout(timer);
    busy = true;
    const n0 = changeN;
    try {
      const r = await api({ a: 'push', sub: meta.sub, key: meta.key, baseRev: meta.rev, data: app().cloudCopy(), force: !!force }, keepalive);
      if (r.ok) {
        meta.rev = r.cloud.rev; meta.last = Date.now();
        if (changeN === n0) { meta.dirty = false; firstDirtyAt = 0; }
        saveMeta(); retryMs = 30000;
        setStatus(`✅ 已同步（${hhmm(new Date())}）`);
        if (meta.dirty) timer = setTimeout(() => push(false), PUSH_DELAY);
      } else if (r.err === 'conflict') {
        busy = false;
        autoMerge(r.cloud, r.data);
      } else if (r.err === 'auth') {
        lostLogin();
      } else {
        setStatus('⚠️ 雲端暫時存不進去，等一下會再試');
        retryLater();
      }
    } catch (e) {
      setStatus('📶 連不上網路，進度先存在這台裝置，等一下會再試');
      retryLater();
    } finally { busy = false; }
  }
  function retryLater() { clearTimeout(timer); timer = setTimeout(() => push(false), retryMs); retryMs = Math.min(retryMs * 2, 10 * 60000); }

  // 打開網頁、或離開一陣子回來：看雲端有沒有比較新的（例如在家裡玩過）
  async function pull() {
    if (!meta || busy) return;
    busy = true;
    try {
      const r = await api({ a: 'pull', sub: meta.sub, key: meta.key, ifRev: meta.rev });
      busy = false;
      if (!r.ok) { if (r.err === 'auth') lostLogin(); else setStatus('⚠️ 雲端暫時讀不到，等一下會再試'); return; }
      if (r.same) { setStatus(meta.dirty ? '☁️ 有新進度，等一下會自動存到雲端' : `✅ 已同步（${hhmm(new Date())}）`); if (meta.dirty) push(false); return; }
      if (!meta.dirty) adopt(r.data, r.cloud, '🔄 已經換成雲端上最新的進度囉！');
      else autoMerge(r.cloud, r.data);
    } catch (e) {
      busy = false;
      setStatus('📶 連不上網路，進度先存在這台裝置');
    }
  }

  function adopt(dataText, cloud, say, stash) {
    if (inExam()) { setStatus('⏸ 全班測驗中，測驗結束後再同步'); return false; }
    let obj = null;
    try { obj = JSON.parse(dataText); } catch (e) { obj = null; }
    suppress++;
    let okk = false;
    try { okk = app().adoptCloud(obj, !!stash); } finally { suppress--; }
    if (!okk) { setStatus('⚠️ 雲端的進度沒有通過檢查，先保留這台裝置的進度'); return false; }
    meta.rev = cloud.rev; meta.dirty = false; meta.last = Date.now(); firstDirtyAt = 0; saveMeta();
    setStatus(`✅ 已同步（${hhmm(new Date())}）`);
    if (say) app().say(say);
    return true;
  }

  // ── 兩邊都有新進度：自動合併（對學生最有利，東西只會變多），再把合併後的存上去 ──
  function autoMerge(cloud, dataText) {
    if (inExam()) { setStatus('⏸ 全班測驗中，測驗結束後再同步'); return false; }
    let obj = null;
    try { obj = JSON.parse(dataText); } catch (e) { obj = null; }
    suppress++;
    let okk = false;
    try { okk = app().mergeCloud(obj); } finally { suppress--; }
    if (!okk) { setStatus('⚠️ 雲端的進度沒有通過檢查，先保留這台裝置的進度'); return false; }
    meta.rev = cloud.rev; meta.dirty = true; firstDirtyAt = Date.now(); saveMeta();
    setStatus('🔄 已經把兩邊的進度合在一起，正在存到雲端…');
    app().say('🔄 已經把你在別的地方玩的進度合在一起囉！');
    setTimeout(() => push(false), 50);
    return true;
  }

  // 登入時這台已經有進度：問是不是自己的（只問這一次；之後兩邊不一樣都自動合併）
  function askOwner(here, mine, notMine) {
    showOverlay(`
      <div style="font-weight:900;font-size:1.2rem;margin-bottom:8px;">☁️ 這台裝置上原本的進度是你的嗎？</div>
      <p style="margin:0 0 12px;color:#5c4b3b;">這台裝置上現在有：⭐ ${here.stars || 0}　經驗值 ${here.xp_total || 0}。<br>
        是你的，就會和你雲端上的進度<b>合在一起</b>（兩邊的都留著）。<br>
        如果是<b>別的同學</b>的（例如電腦教室的共用電腦），選「不是我的」，它會先收起來，你登出後再放回去。</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-green" data-a="mine">是我的，合在一起</button>
        <button class="btn btn-soft" data-a="not">不是我的，先收起來</button>
      </div>`, el => {
      el.querySelector('[data-a=mine]').onclick = () => { hideOverlay(); mine(); };
      el.querySelector('[data-a=not]').onclick = () => { hideOverlay(); notMine(); };
    });
  }

  function showOverlay(html, bind) {
    hideOverlay();
    const d = document.createElement('div');
    d.id = 'cloudOverlay';
    d.style.cssText = 'position:fixed;inset:0;background:rgba(40,30,20,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    d.innerHTML = `<div style="background:#fffaf2;border-radius:22px;max-width:560px;width:100%;padding:20px;box-shadow:0 10px 40px rgba(0,0,0,.25);">${html}</div>`;
    document.body.appendChild(d);
    if (bind) bind(d);
  }
  function hideOverlay() { const d = document.getElementById('cloudOverlay'); if (d) d.remove(); }

  // ── 登入 ──
  function loadGis() {
    if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve();
    if (gisReady) return gisReady;
    gisReady = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = GIS_SRC; s.async = true;
      s.onload = () => res(); s.onerror = () => { gisReady = null; rej(new Error('gis')); };
      document.head.appendChild(s);
    });
    return gisReady;
  }

  // ── 三種登入：Google、同步碼、信箱（v3 起信裡直接寄同步碼）──
  const ERR = {
    bad_token: '⚠️ Google 登入沒有成功，請再試一次',
    bad_sync: '⚠️ 找不到這組同步碼，請再檢查一次（8 個字，像 7KQM-2XPA）',
    busy: '⚠️ 現在太多人打錯同步碼，請過幾分鐘再試',
    bad_email: '⚠️ 信箱格式不對，請再檢查一次',
    wait: '⏳ 剛剛寄過了，請等一分鐘再按',
    too_many: '⚠️ 這個信箱這一小時寄太多次了，請過一陣子再試',
    quota: '⚠️ 今天的信已經寄完了，請明天再試（已經有同步碼的人可以直接用同步碼登入）',
    bad_code: '⚠️ 驗證碼不對，請再看一次信裡的 6 個數字',
    expired: '⚠️ 驗證碼過期或試太多次了，請重新寄一封'
  };
  function sharedChecked() { return !!(box && box.querySelector('#cloudShared') && box.querySelector('#cloudShared').checked); }
  async function tryLogin(body) {
    const shared = sharedChecked();
    setStatus('⏳ 登入中…');
    let r;
    try { r = await api(body); } catch (e) { setStatus('📶 連不上雲端，請確認網路後再試一次'); return false; }
    if (!r.ok) { setStatus(ERR[r.err] || '⚠️ 雲端暫時不能用，請稍後再試'); return false; }
    await afterLogin(r, shared);
    return true;
  }
  function onCredential(resp) { return tryLogin({ a: 'login', idToken: resp && resp.credential }); }
  function codeLogin(code) { return tryLogin({ a: 'codeLogin', syncCode: code }); }
  function verifyEmail(email, code) { return tryLogin({ a: 'verifyCode', email, code }); }
  async function sendCode(email) {
    setStatus('⏳ 寄信中…');
    let r;
    try { r = await api({ a: 'sendCode', email }); } catch (e) { setStatus('📶 連不上雲端，請確認網路後再試一次'); return false; }
    if (!r.ok) { setStatus(ERR[r.err] || '⚠️ 雲端暫時不能用，請稍後再試'); return false; }
    // v3.10.1：新版雲端（v3）把同步碼直接寄到信裡；舊版雲端還是寄 6 位數驗證碼
    if (r.mode === 'sync') { setStatus('📧 同步碼寄出了！打開信，把同步碼填到上面「🔑 我已經有同步碼」'); return 'sync'; }
    setStatus('📧 驗證信寄出了！收件匣沒有就看「垃圾郵件」');
    return 'code';
  }

  async function afterLogin(r, shared) {
    meta = { sub: r.sub, email: r.email, sync: r.syncCode || '', key: r.key, rev: r.cloud.rev, dirty: false, shared, sess: '', last: 0 };
    if (shared) { meta.sess = String(Date.now()) + Math.random().toString(36).slice(2); ssSet(SESS_KEY, meta.sess); }
    saveMeta();
    status = '✅ 登入成功';
    render(box);
    const here = app().getState();
    const hereHas = (here.xp_total || 0) > 0 || (here.stars || 0) > 0;
    if (r.hasData) {
      if (!hereHas) {
        const p = await api({ a: 'pull', sub: meta.sub, key: meta.key });
        if (p.ok) adopt(p.data, p.cloud, '☁️ 登入成功，已經拿回雲端上的進度囉！');
      } else {
        const p = await api({ a: 'pull', sub: meta.sub, key: meta.key });
        if (p.ok) askOwner(here, () => autoMerge(p.cloud, p.data), () => adopt(p.data, p.cloud, '☁️ 登入成功！這台原本的進度先收起來，登出後會放回去。', true));
      }
    } else if (hereHas) {
      // 雲端還沒有進度：問這台上的進度是不是自己的（共用電腦上可能是別的同學的）
      askOwner(here,
        () => { meta.dirty = true; saveMeta(); push(false); app().say('☁️ 登入成功！之後的進度會自動存到雲端。'); },
        () => { suppress++; try { app().resetLocal(true); } finally { suppress--; } meta.dirty = true; saveMeta(); push(false); app().say('☁️ 登入成功！這台原本的進度先收起來，登出後會放回去。'); });
    } else {
      meta.dirty = true; saveMeta(); push(false);
      app().say('☁️ 登入成功！之後的進度會自動存到雲端。');
    }
    render(box);
  }

  function lostLogin() {
    meta = null; saveMeta();
    setStatus('');
    app().say('☁️ 雲端登入已經失效（可能在別的地方刪除了資料，或登入太多台裝置），需要的話請重新登入。');
    render(box);
  }

  async function logout(clearLocal) {
    if (!meta) return;
    if (meta.dirty) {
      setStatus('⏳ 先把最新進度存到雲端…');
      await push(false);
      // 沒存上去時不清掉，避免進度不見（對學生最有利）
      if (meta && meta.dirty && !confirm('最新的進度還沒存到雲端（可能沒有網路）。\n\n建議先不要登出，等有網路再按一次「登出」。\n\n一定要現在登出嗎？還沒存上去的進度會留在這台裝置。')) return;
      if (meta && meta.dirty) clearLocal = false;
    }
    const m = meta;
    try { await api({ a: 'logout', sub: m.sub, key: m.key }); } catch (e) { /* 沒網路也照樣登出 */ }
    meta = null; saveMeta(); clearTimeout(timer); firstDirtyAt = 0;
    if (clearLocal) { suppress++; try { app().resetLocal(false); } finally { suppress--; } }
    setStatus('');
    app().say(clearLocal ? '👋 已經登出，這台裝置上的進度也清掉了（雲端上還在）。' : '👋 已經登出。');
    render(box);
  }

  async function deleteCloud() {
    if (!meta) return;
    if (!confirm('確定要刪除你在雲端上的進度嗎？\n\n刪除後沒辦法復原。這台裝置上的進度會保留。')) return;
    try {
      const r = await api({ a: 'delete', sub: meta.sub, key: meta.key });
      if (!r.ok && r.err !== 'auth') { alert('現在刪不了，請稍後再試。'); return; }
    } catch (e) { alert('連不上網路，現在刪不了，請稍後再試。'); return; }
    meta = null; saveMeta(); clearTimeout(timer);
    setStatus('');
    app().say('🗑 雲端上的進度已經刪除了。');
    render(box);
  }

  // ── 「搬家碼／備份」頁裡的區塊 ──
  function render(el) {
    box = el || box;
    if (!box) return;
    if (!ON) { box.innerHTML = ''; box.hidden = true; return; }
    box.hidden = false;
    if (meta) {
      box.innerHTML = `
        <div class="card-box">
          <div class="section-title"><span>☁️ 雲端同步（已登入）</span></div>
          <p class="section-sub" style="margin-bottom:6px;">帳號：<b>${esc(maskEmail(meta.email))}</b>${meta.shared ? '（共用電腦：關掉網頁後會自動登出）' : ''}</p>
          ${meta.sync ? `<div style="background:#fff4c2;border-radius:14px;padding:10px 14px;margin:6px 0 10px;">
            <div style="font-weight:800;">🔑 你的同步碼</div>
            <div id="cloudSyncCode" style="font-size:1.8rem;font-weight:900;letter-spacing:.12em;font-family:monospace;">${esc(meta.sync)}</div>
            <div class="section-sub" style="margin:0;">在別的電腦、平板輸入這組就能接著玩。請抄下來或拍照留著；忘記了可以用信箱找回。</div>
          </div>` : ''}
          <p class="section-sub" id="cloudStatus" style="font-weight:800;margin-bottom:10px;">${esc(status || (meta.dirty ? '☁️ 有新進度，等一下會自動存到雲端' : '✅ 已同步'))}</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-green" id="cloudSyncNow">🔄 立刻同步</button>
            <button class="btn btn-soft" id="cloudLogout">👋 登出</button>
          </div>
          <p class="section-sub" style="margin-top:8px;font-size:.85rem;">登出後，這台裝置會回到你登入前的樣子；你的進度留在雲端，下次輸入同步碼就拿回來。</p>
          <p class="section-sub" style="margin-top:12px;font-size:.85rem;">
            進度存在老師的 Google 試算表，只有帳號編號、信箱和學習進度，不存姓名、班級、座號。
            <a href="#" id="cloudDelete" style="color:#c0392b;">刪除我的雲端資料</a>
          </p>
        </div>`;
      box.querySelector('#cloudSyncNow').onclick = async () => { setStatus('⏳ 同步中…'); if (meta.dirty) await push(false); else await pull(); };
      // v3.10.2：只有一個登出鈕，一律清掉這台裝置上這個帳號的進度（老師 11-24 決定），進度在雲端
      box.querySelector('#cloudLogout').onclick = () => {
        if (meta && meta.sync && !confirm('確定要登出嗎？\n\n你的同步碼是：' + meta.sync + '\n（信箱裡的信也有）下次輸入同步碼，就能拿回進度。')) return;
        logout(true);
      };
      box.querySelector('#cloudDelete').onclick = ev => { ev.preventDefault(); deleteCloud(); };
    } else {
      box.innerHTML = `
        <div class="card-box">
          <div class="section-title"><span>☁️ 在學校、家裡都玩同一份進度（自由選擇）</span></div>
          <p class="section-sub">
            登入後進度會自動存到雲端，換一台電腦或平板登入就能接著玩。<b>不登入也完全沒關係</b>，進度會照常存在這台裝置。
            會存的只有：信箱、學習進度（星星、經驗值、練習紀錄、狗狗），不存姓名、班級、座號，隨時可以刪除。
            <a href="./privacy.html" target="_blank" rel="noopener">隱私權政策</a>
          </p>
          <label style="display:flex;align-items:center;gap:8px;font-weight:800;margin:8px 0 12px;cursor:pointer;">
            <input type="checkbox" id="cloudShared" style="width:22px;height:22px;"> 這是共用電腦（電腦教室），關掉網頁就自動登出
          </label>
          <div style="display:grid;gap:12px;">
            <div id="cloudSyncBox" style="background:#fffaf2;border:2px solid #e6d9c8;border-radius:16px;padding:12px 14px;">
              <div style="font-weight:900;margin-bottom:6px;">🔑 我已經有同步碼</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <input id="cloudSyncIn" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="例如 7KQM-2XPA"
                  style="flex:1;min-width:160px;font-size:1.3rem;letter-spacing:.1em;padding:8px 12px;border-radius:12px;border:2px solid #d8c8b4;font-family:monospace;text-transform:uppercase;">
                <button class="btn btn-green" id="cloudSyncGo">登入</button>
              </div>
            </div>
            <div style="background:#fffaf2;border:2px solid #e6d9c8;border-radius:16px;padding:12px 14px;">
              <div style="font-weight:900;margin-bottom:6px;">📧 第一次使用，或忘記同步碼：把同步碼寄到信箱</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <input id="cloudMailIn" type="email" autocomplete="email" placeholder="你的信箱（學校信箱也可以）"
                  style="flex:1;min-width:200px;font-size:1.05rem;padding:8px 12px;border-radius:12px;border:2px solid #d8c8b4;">
                <button class="btn btn-soft" id="cloudMailGo">寄同步碼</button>
              </div>
              <div class="section-sub" style="margin:6px 0 0;font-size:.85rem;">⚠️ 信常常會被放進「垃圾郵件」，收件匣沒看到請去那裡找。收到的信請留著，忘記同步碼時回來找。</div>
              <div id="cloudSpamTip" style="display:none;margin-top:10px;background:#fff1d6;border:3px solid #f08c00;border-radius:16px;padding:12px 14px;">
                <div style="font-weight:900;font-size:1.15rem;color:#b35900;">📬 信寄出了！收件匣找不到，請一定要看「垃圾郵件」！</div>
                <div style="margin-top:6px;line-height:1.7;">
                  ・寄件人：<b>汪汪小精靈 學習小伙伴</b><br>
                  ・主旨：<b id="cloudMailSubj">【汪汪小精靈 學習小伙伴】你的同步碼：XXXX-XXXX</b><br>
                  ・Gmail：左邊選單按「<b>更多</b>」→「<b>垃圾郵件</b>」。找到後按「<b>回報為非垃圾郵件</b>」，下次就會進收件匣。<br>
                  ・信可能要等 1～2 分鐘才會到。
                </div>
                <div id="cloudSyncHow" style="margin-top:8px;font-weight:900;font-size:1.05rem;color:#1f7a4c;">👆 收到信後，把信裡的同步碼填到上面「🔑 我已經有同步碼」，按「登入」。<br>⭐ 這封信請留著，不要刪掉；也可以把同步碼抄在聯絡簿。</div>
              </div>
              <div id="cloudCodeRow" style="display:none;gap:8px;flex-wrap:wrap;margin-top:8px;">
                <input id="cloudCodeIn" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="信裡的 6 個數字"
                  style="flex:1;min-width:160px;font-size:1.3rem;letter-spacing:.2em;padding:8px 12px;border-radius:12px;border:2px solid #d8c8b4;">
                <button class="btn btn-green" id="cloudCodeGo">確認</button>
              </div>
            </div>
            ${CFG.clientId ? `<div style="padding:0 4px;"><div class="section-sub" style="margin-bottom:6px;">有私人 Gmail 也可以直接：</div><div id="cloudBtn" style="min-height:44px;"></div></div>` : ''}
          </div>
          <p class="section-sub" id="cloudStatus" style="font-weight:800;margin-top:10px;">${esc(status)}</p>
        </div>`;
      const q = id => box.querySelector(id);
      q('#cloudSyncGo').onclick = () => { const v = q('#cloudSyncIn').value.trim(); if (v) codeLogin(v); else setStatus('請先輸入同步碼'); };
      q('#cloudSyncIn').onkeydown = ev => { if (ev.key === 'Enter') q('#cloudSyncGo').click(); };
      q('#cloudMailGo').onclick = async () => {
        const email = q('#cloudMailIn').value.trim();
        if (!email) { setStatus('請先輸入信箱'); return; }
        const b = q('#cloudMailGo'); b.disabled = true;
        const sent = await sendCode(email);
        if (sent) q('#cloudSpamTip').style.display = 'block';
        if (sent === 'sync') {
          const sb = q('#cloudSyncBox'); sb.style.border = '3px solid #2fa86a'; sb.style.background = '#effaf3';
          q('#cloudSyncIn').focus();
        } else if (sent) {   // 舊版雲端：還是輸入 6 位數驗證碼
          q('#cloudMailSubj').textContent = '【汪汪小精靈 學習小伙伴】你的驗證碼：六個數字';
          q('#cloudSyncHow').style.display = 'none';
          q('#cloudCodeRow').style.display = 'flex'; q('#cloudCodeIn').focus();
        }
        let left = sent ? 60 : 0;
        const tick = () => { if (!b.isConnected) return; if (left > 0) { b.textContent = `再寄一次（${left}）`; left--; setTimeout(tick, 1000); } else { b.disabled = false; b.textContent = sent ? '再寄一次' : '寄同步碼'; } };
        tick();
      };
      q('#cloudMailIn').onkeydown = ev => { if (ev.key === 'Enter') q('#cloudMailGo').click(); };
      q('#cloudCodeGo').onclick = () => {
        const code = q('#cloudCodeIn').value.replace(/\D/g, '');
        if (code.length !== 6) { setStatus('驗證碼是 6 個數字'); return; }
        verifyEmail(q('#cloudMailIn').value.trim(), code);
      };
      q('#cloudCodeIn').onkeydown = ev => { if (ev.key === 'Enter') q('#cloudCodeGo').click(); };
      const target = q('#cloudBtn');
      if (target) {
        loadGis().then(() => {
          const g = window.google.accounts.id;
          g.initialize({ client_id: CFG.clientId, callback: onCredential, ux_mode: 'popup', auto_select: false, cancel_on_tap_outside: true });
          g.renderButton(target, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', locale: 'zh-TW' });
        }).catch(() => { target.innerHTML = '<span class="section-sub">連不上 Google 登入（可能沒有網路，或學校網路擋住了）。</span>'; });
      }
    }
    paintStatus();
  }

  // ── 共用電腦：上一位同學關掉網頁後，下一次打開時先把他的進度存上去、再登出、清掉 ──
  function sameSessionAlive() {
    return new Promise(res => {
      if (!meta || !meta.sess) return res(false);
      if (ssGet(SESS_KEY) === meta.sess) return res(true);
      if (typeof BroadcastChannel !== 'function') return res(false);
      const ch = new BroadcastChannel(META_KEY);
      let done = false;
      ch.onmessage = ev => { if (ev.data && ev.data.sess === meta.sess) { done = true; ssSet(SESS_KEY, meta.sess); ch.close(); res(true); } };
      ch.postMessage({ q: 'sess?' });
      setTimeout(() => { if (!done) { ch.close(); res(false); } }, 500);
    });
  }
  function answerSessionPings() {
    if (typeof BroadcastChannel !== 'function') return;
    const ch = new BroadcastChannel(META_KEY);
    ch.onmessage = ev => { if (ev.data && ev.data.q === 'sess?' && meta && meta.shared && ssGet(SESS_KEY) === meta.sess) ch.postMessage({ sess: meta.sess }); };
  }

  async function start() {
    if (!ON) return;
    answerSessionPings();
    if (meta && meta.shared && !(await sameSessionAlive())) {
      // 上一位同學的共用電腦登入：先存上去（他最後玩的就在這台），再登出、清掉
      const m = meta;
      if (m.dirty) { try { await api({ a: 'push', sub: m.sub, key: m.key, baseRev: m.rev, data: app().cloudCopy(), force: true }); } catch (e) { /* 沒網路：保留，下次再試 */ return; } }
      try { await api({ a: 'logout', sub: m.sub, key: m.key }); } catch (e) { /* 忽略 */ }
      meta = null; saveMeta();
      suppress++; try { app().resetLocal(false); } finally { suppress--; }
      return;
    }
    if (meta) pull();
    document.addEventListener('visibilitychange', () => {
      if (!meta) return;
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); if (meta.dirty) push(true); }
      else if (hiddenAt && Date.now() - hiddenAt > PULL_GAP) pull();
    });
    window.addEventListener('pagehide', () => { if (meta && meta.dirty) push(true); });
  }

  window.PuppyCloud = {
    on: ON, changed, render, start,
    signedIn: () => !!meta, meta: () => meta, status: () => status,
    _t: { push, pull, onCredential, codeLogin, sendCode, verifyEmail, logout, deleteCloud, autoMerge, adopt }
  };
})();
