// 《汪汪小精靈 學習小伙伴》兩份進度自動合併（v3.9.0）
// 原則：對學生最有利，東西只會變多、不會變少。
//   ・過關、分數、次數、熟練度、徽章、解鎖的寵物：兩邊取最好的，有的都留
//   ・設定（年級、目前帶的寵物、配件、各種開關）：用比較晚改的那一份
//   ・星星、經驗值：兩台裝置各自「賺到的」都算進去；花掉的不會讓另一台的星星變少
//   ・測驗鎖定、年班座號：不上傳、不合併，一律用這台的（cloud.js／app.js 另外處理）
(function (root) {
  'use strict';
  const DATE_RE = /^\d{4}-\d{2}-\d{2}/;
  // 這些是「設定」：整份用比較晚存的那一邊
  const NEWER_WINS = new Set(['grade', 'goal_xp', 'settings', 'focus', 'parent', 'format', 'eng.track', 'pets.current', 'pets.acc']);
  const SKIP = new Set(['sig', 'stars', 'xp_total', 'cloud_ledger', 'saved_at', 'typing.lock', 'typing.who']);

  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

  function mergeArray(a, b, newerIsA) {
    if (a.length === b.length && a.length && a.every(x => typeof x === 'number') && b.every(x => typeof x === 'number')) {
      return a.map((x, i) => Math.max(x, b[i]));            // 數字陣列（例如按鍵統計）：每一格取大的
    }
    const first = newerIsA ? a : b, second = newerIsA ? b : a;
    const seen = new Set(first.map(x => JSON.stringify(x)));
    const out = clone(first);
    second.forEach(x => { const k = JSON.stringify(x); if (!seen.has(k)) { seen.add(k); out.push(clone(x)); } });
    return out;                                               // 其他陣列：兩邊有的都留
  }

  function mergeWordRec(a, b) {
    // 英文單字：熟練程度（b）高的那一份；一樣高就用比較晚練習（u）的；次數取大的
    if (!isObj(a)) return clone(b);
    if (!isObj(b)) return clone(a);
    const pick = (+a.b || 0) !== (+b.b || 0) ? ((+a.b || 0) > (+b.b || 0) ? a : b) : (String(a.u || '') >= String(b.u || '') ? a : b);
    const out = clone(pick);
    ['n', 'x'].forEach(k => { if (typeof a[k] === 'number' || typeof b[k] === 'number') out[k] = Math.max(+a[k] || 0, +b[k] || 0); });
    return out;
  }

  function mergeValue(a, b, path, newerIsA) {
    if (a === undefined || a === null) return clone(b);
    if (b === undefined || b === null) return clone(a);
    if (NEWER_WINS.has(path)) return clone(newerIsA ? a : b);
    if (/^eng\.words\.[^.]+$/.test(path)) return mergeWordRec(a, b);
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
    if (typeof a === 'string' && typeof b === 'string') {
      if (DATE_RE.test(a) && DATE_RE.test(b)) return a > b ? a : b;
      return newerIsA ? a : b;
    }
    if (Array.isArray(a) && Array.isArray(b)) return mergeArray(a, b, newerIsA);
    if (isObj(a) && isObj(b)) {
      const out = {};
      new Set(Object.keys(a).concat(Object.keys(b))).forEach(k => {
        const p = path ? path + '.' + k : k;
        if (SKIP.has(p)) return;
        const v = mergeValue(a[k], b[k], p, newerIsA);
        if (v !== undefined) out[k] = v;
      });
      return out;
    }
    return clone(newerIsA ? a : b);                           // 型別不一樣：用比較晚存的
  }

  function ledgerSum(l) { let s = 0, x = 0; Object.values(isObj(l) ? l : {}).forEach(v => { s += +(v && v.s) || 0; x += +(v && v.x) || 0; }); return { s, x }; }

  // local：這台；remote：雲端。回傳合併後的新物件（不含 sig，呼叫的人要重新簽章）
  function merge(local, remote) {
    const L = isObj(local) ? local : {}, R = isObj(remote) ? remote : {};
    const newerIsA = (+L.saved_at || 0) >= (+R.saved_at || 0);
    const out = mergeValue(L, R, '', newerIsA);
    // 星星和經驗值：每台裝置賺到的取大的再加起來
    const led = {};
    [L.cloud_ledger, R.cloud_ledger].forEach(l => {
      Object.entries(isObj(l) ? l : {}).forEach(([dev, v]) => {
        const o = led[dev] || (led[dev] = { s: 0, x: 0 });
        o.s = Math.max(o.s, +(v && v.s) || 0); o.x = Math.max(o.x, +(v && v.x) || 0);
      });
    });
    const E = ledgerSum(led), El = ledgerSum(L.cloud_ledger), Er = ledgerSum(R.cloud_ledger);
    const ls = Math.max(0, +L.stars || 0), rs = Math.max(0, +R.stars || 0);
    const lx = Math.max(0, +L.xp_total || 0), rx = Math.max(0, +R.xp_total || 0);
    out.stars = Math.max(ls + (E.s - El.s), rs + (E.s - Er.s), ls, rs);
    out.xp_total = Math.max(lx + (E.x - El.x), rx + (E.x - Er.x), lx, rx);
    out.cloud_ledger = led;
    out.saved_at = Math.max(+L.saved_at || 0, +R.saved_at || 0);
    // 這台的測驗鎖定和年班座號留著
    if (isObj(L.typing)) {
      if (!isObj(out.typing)) out.typing = {};
      ['lock', 'who'].forEach(k => { if (L.typing[k] !== undefined) out.typing[k] = clone(L.typing[k]); });
    }
    if (out.typing) { if (!L.typing || L.typing.lock === undefined) delete out.typing.lock; }
    delete out.sig;
    return out;
  }

  const api = { merge, _ledgerSum: ledgerSum };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PuppyMerge = api;
})(typeof window !== 'undefined' ? window : this);
