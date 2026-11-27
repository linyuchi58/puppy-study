// 《汪汪小精靈 學習小伙伴》🧮 心算挑戰（v3.10.0；v3.17.0 分數題改上下排、可填帶分數；v3.18.0 分數四則）
// 參考老師的《星際防禦：心算雷射戰 v2.0》的出題規則和「💡 思考提示」，改成自己挑課程的自我挑戰：
//   ・課程地圖：依台灣國小數學（108 課綱）整理，可以自由挑課程
//   ・一回 10 題、計時；答錯會出現 💡 提示，再答一次
//   ・星星：每門課最多 3 顆，只有進步才拿；重複練習的經驗值每門課每天最多 3 次、
//     比自己程度簡單太多的課不給重複練習經驗值、每天心算經驗值最多 100
(function () {
  'use strict';

  const ROUND_N = 10;
  const DAY_XP_CAP = 100;
  const REPLAY_PER_DAY = 3;
  const FAST_MS = 500;          // 一題不到 0.5 秒就答完：太快，可能沒在想
  const FAST_LIMIT = 5;

  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const lcm = (a, b) => a / gcd(a, b) * b;
  const fmt = n => String(Math.round(n * 1000) / 1000);           // 小數去掉多餘的 0
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ── v3.17.0：分數題（上下排顯示、帶分數作答）──
  // 題目文字裡帶分數寫成「2又1/3」、分數寫成「1/3」；畫面上自動排成上下兩排
  const fr = (n, d) => { const g = gcd(Math.abs(n), d) || 1; return { n: n / g, d: d / g }; };
  const fAdd = (x, y) => fr(x.n * y.d + y.n * x.d, x.d * y.d);
  const fSub = (x, y) => fr(x.n * y.d - y.n * x.d, x.d * y.d);
  function mixStr(n, d) {           // 約分後的寫法：大於 1 寫帶分數、整數寫整數
    const f = fr(n, d), w = Math.floor(f.n / f.d), r = f.n % f.d;
    if (!r) return String(w);
    return w ? `${w}又${r}/${f.d}` : `${r}/${f.d}`;
  }
  function impStr(n, d) { const f = fr(n, d); return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`; }
  // 題目上的一項：k＝'p' 真分數、'i' 假分數、'm' 帶分數、'w' 整數；n/d 是沒約分的值
  const T = (k, n, d) => ({ k, n, d });
  const Mx = (w, r, d) => (w ? T('m', w * d + r, d) : T('p', r, d));
  function term(t) { if (t.k === 'w') return String(t.n / t.d); if (t.k === 'm') { const w = Math.floor(t.n / t.d); return `${w}又${t.n - w * t.d}/${t.d}`; } return `${t.n}/${t.d}`; }
  function termAt(t, L) {          // 通分成分母 L 的寫法
    const k = L / t.d;
    if (t.k === 'w') return String(t.n / t.d);
    if (t.k === 'm') { const w = Math.floor(t.n / t.d); return `${w}又${(t.n - w * t.d) * k}/${L}`; }
    return `${t.n * k}/${L}`;
  }
  function fracQ(terms, ops, hint, extra) {
    let v = { n: terms[0].n, d: terms[0].d };
    ops.forEach((op, i) => { v = op === '+' ? fAdd(v, terms[i + 1]) : fSub(v, terms[i + 1]); });
    const q = terms.map((t, i) => (i ? (ops[i - 1] === '+' ? ' ＋ ' : ' － ') : '') + term(t)).join('') + ' ＝ ？';
    return Object.assign({ q, a: mixStr(v.n, v.d), fr: true, v: fr(v.n, v.d), hint }, extra || {});
  }
  const fv = t => t.n / t.d;
  // 異分母：通分提示
  function tfHint(A, B, op, more) {
    const L = lcm(A.d, B.d);
    return `通分：${A.d} 和 ${B.d} 的最小公倍數是 ${L}，${term(A)} ＝ ${termAt(A, L)}，${term(B)} ＝ ${termAt(B, L)}，再把分子${op === '+' ? '相加' : '相減'}` + (more || '');
  }
  function mixHint(op) { return op === '+' ? '（分數部分超過 1，就進位到整數）' : '（分數部分不夠減，就從整數借 1）'; }
  // 異分母兩個分母：rel＝'mul' 倍數關係、'gen' 要找最小公倍數
  function twoDen(rel, maxL) {
    if (rel === 'mul') { const a = pick([2, 3, 4, 5, 6]), k = until(() => pick([2, 3]), k => a * k <= 12); const b = a * k; return R(0, 1) ? [a, b] : [b, a]; }
    return until(() => [R(2, 9), R(2, 9)], ([a, b]) => a !== b && a % b && b % a && lcm(a, b) <= maxL);
  }
  // 兩項加減（減法時大的在前），回傳題目
  function twoTermQ(A, B, hintFn) {
    let op = R(0, 1) ? '+' : '-';
    if (op === '-' && Math.abs(fv(A) - fv(B)) < 1e-9) op = '+';
    if (op === '-' && fv(A) < fv(B)) { const t = A; A = B; B = t; }
    return fracQ([A, B], [op], hintFn(A, B, op));
  }
  // ── v3.18.0：分數四則（乘除、括號、先乘除後加減）──
  const fMul = (x, y) => fr(x.n * y.n, x.d * y.d);
  const fDiv = (x, y) => fr(x.n * y.d, x.d * y.n);
  const OPS = { '+': [fAdd, ' ＋ '], '-': [fSub, ' － '], '*': [fMul, ' × '], '/': [fDiv, ' ÷ '] };
  const E = (op, l, r, p) => ({ op, l, r, p: !!p });          // p＝加括號
  function evalE(e) {               // 每一步都要是正的，不然回傳 null
    if (!e.op) return fr(e.n, e.d);
    const a = evalE(e.l), b = evalE(e.r);
    if (!a || !b) return null;
    const v = OPS[e.op][0](a, b);
    return v.n > 0 ? v : null;
  }
  function textE(e) { if (!e.op) return term(e); const t = textE(e.l) + OPS[e.op][1] + textE(e.r); return e.p ? '（' + t + '）' : t; }
  function exprQ(e, hint, maxN, maxD) {
    const v = evalE(e);
    if (!v || v.n > (maxN || 150) || v.d > (maxD || 60)) return null;
    return { q: textE(e) + ' ＝ ？', a: mixStr(v.n, v.d), fr: true, v, hint: typeof hint === 'function' ? hint(e) : hint };
  }
  function retryQ(gen) { for (let i = 0; i < 500; i++) { const q = gen(); if (q) return q; } return exprQ(E('*', T('p', 1, 2), T('w', 4, 1)), '分子乘整數，分母不變'); }
  // 隨機的一項
  const rP = (dmax, ds) => { const d = ds ? pick(ds) : R(2, dmax); return T('p', R(1, d - 1), d); };
  const rM = (dmax, ds) => { const d = ds ? pick(ds) : R(2, dmax); return Mx(R(1, 3), R(1, d - 1), d); };
  const rI = (lo, hi) => T('w', R(lo || 2, hi || 9), 1);
  const rImp = (dmax, ds) => { const d = ds ? pick(ds) : R(2, dmax); return T('i', until(() => R(d + 1, 3 * d - 1), n => n % d !== 0), d); };
  const rAny = (ds, kinds) => { const k = pick(kinds); return k === 'p' ? rP(0, ds) : k === 'm' ? rM(0, ds) : k === 'i' ? rImp(0, ds) : rI(2, 6); };
  const FAM = [[2, 4, 8], [2, 3, 6], [3, 6, 9], [2, 5, 10], [2, 3, 4, 6], [3, 4, 6, 12]];
  const rec = t => (t.k === 'w' ? `1/${t.n}` : `${t.d}/${t.n}`);  // 倒數（帶分數先化成假分數）
  const HINT_MUL = '分子乘分子、分母乘分母；可以先交叉約分，比較好算';
  const HINT_ORDER = '先算括號裡面，再算乘除，最後算加減（同一級從左到右）';
  function fracHtml(s) {           // 文字裡的分數 → 上下排
    const st = (n, d) => `<span class="mc-fr"><span>${n}</span><span>${d}</span></span>`;
    return esc(s).replace(/(\d+)又(\d+)\/(\d+)/g, (_, w, n, d) => `<span class="mc-mix">${w}${st(n, d)}</span>`).replace(/(\d+)\/(\d+)/g, (_, n, d) => st(n, d));
  }
  // 判斷分數答案：f＝{w,n,d}（字串）。skip＝格式問題（不算答錯）
  function judgeFrac(f, q) {
    const hasW = f.w !== '', hasN = f.n !== '', hasD = f.d !== '';
    if (!hasW && !hasN && !hasD) return { skip: '' };
    if (hasN !== hasD) return { skip: hasN ? '分母還沒填喔' : '分子還沒填喔' };
    const w = hasW ? +f.w : 0;
    let n = 0, d = 1;
    if (hasN) { n = +f.n; d = +f.d; if (!d) return { skip: '分母不能是 0 喔' }; }
    if (hasW && w && hasN && n >= d) return { skip: '帶分數後面的分數要比 1 小（分子要比分母小）' };
    const same = (w * d + n) * q.v.d === q.v.n * d;
    if (!same) return { ok: false };
    const whole = q.v.n % q.v.d === 0;
    if (q.form === 'mixed' && !whole && (!w || !n)) return { skip: '數字對了！這題要寫成「帶分數」（整數格也要填）' };
    if (q.form === 'improper' && hasW && w) return { skip: '數字對了！這題要寫成「假分數」（整數格空白，只填分子和分母）' };
    let note = '';
    if (hasN && n && gcd(n, d) > 1) {     // 沒約分：同時給約分後的假分數和帶分數（v3.17.1）
      const V = q.v, alts = [];
      if (V.d === 1) alts.push(String(V.n));
      else {
        if (q.form !== 'mixed') alts.push(`${V.n}/${V.d}`);
        if (V.n > V.d && q.form !== 'improper') alts.push(mixStr(V.n, V.d));
      }
      note = '答案還可以是 ' + alts.join('，或是 ');
    }
    return { ok: true, note };
  }

  // ── 💡 思考提示（改寫自《心算雷射戰》）──
  function hintAdd(a, b) {
    if (a % 10 >= 8 && a >= 90) { const up = Math.ceil(a / 10) * 10; return `湊整巧算：先算 ${up} ＋ ${b} ＝ ${up + b}，再減 ${up - a}`; }
    if (b >= 10) { const bt = Math.floor(b / 10) * 10, bo = b % 10; return bo ? `拆開來加：先算 ${a} ＋ ${bt} ＝ ${a + bt}，再加 ${bo}` : `整十相加：${a} ＋ ${bt}，先加十位`; }
    if ((a % 10) + b >= 10) { const need = 10 - (a % 10); return `湊十法：${a} 先加 ${need} 湊成 ${a + need}，再加剩下的 ${b - need}`; }
    return '個位加個位，十位加十位';
  }
  function hintSub(a, b) {
    if (b === 98 || b === 99) return `湊百巧算：先減 100 得 ${a - 100}，再加回 ${100 - b}`;
    if (b >= 10) { const bt = Math.floor(b / 10) * 10, bo = b % 10; return bo ? `拆開來減：先算 ${a} － ${bt} ＝ ${a - bt}，再減 ${bo}` : `整十相減：${a} － ${bt}`; }
    if ((a % 10) < b) return `退位：個位 ${a % 10} 不夠減 ${b}，跟十位借 10，變成 ${a % 10 + 10} － ${b}`;
    return '個位減個位，十位減十位';
  }
  function hintMul(a, b) {
    const big = Math.max(a, b), small = Math.min(a, b);
    if (big <= 9) return small <= 3 ? `連加：${small} 個 ${big} 加起來` : `想：${big} × ${small - 1} ＝ ${big * (small - 1)}，再加一個 ${big}`;
    if (small <= 9 && big % 10 !== 0) { const t = Math.floor(big / 10) * 10, o = big % 10; return `分配律：先算 ${t} × ${small} ＝ ${t * small}，再加 ${o} × ${small} ＝ ${o * small}`; }
    return '先把 0 拿掉算，最後再把 0 補回去';
  }
  function hintDiv(a, b) {
    const q = Math.floor(a / b);
    if (q <= 9) return `乘法反過來想：${b} × ？ ＝ ${a}`;
    const t = Math.floor(q / 10) * 10;
    return `先拆整十：${b} × ${t} ＝ ${b * t}，剩下 ${a - b * t} 再除以 ${b}`;
  }

  // ── 題目產生器 ──
  // 每題：{ q: 題目（畫面）, a: 答案（字串）, say: 唸出來的字（可省略）, hint: 💡 提示 }
  function addQ(a, b) { return { q: `${a} ＋ ${b} ＝ ？`, a: String(a + b), hint: hintAdd(a, b) }; }
  function subQ(a, b) { return { q: `${a} － ${b} ＝ ？`, a: String(a - b), hint: hintSub(a, b) }; }
  function mulQ(a, b) { return { q: `${a} × ${b} ＝ ？`, a: String(a * b), hint: hintMul(a, b) }; }
  function divQ(a, b) { return { q: `${a} ÷ ${b} ＝ ？`, a: String(a / b), hint: hintDiv(a, b) }; }
  const carryAdd = (a, b) => (a % 10) + (b % 10) >= 10 || (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) >= 10;
  const borrowSub = (a, b) => (a % 10) < (b % 10) || (Math.floor(a / 10) % 10) < (Math.floor(b / 10) % 10);
  function until(gen, ok) { for (let i = 0; i < 200; i++) { const v = gen(); if (ok(v)) return v; } return gen(); }

  // 單位換算的小工具：「大單位 小單位 ＝ □ 小單位」或「小單位 ＝ □ 大單位 □」
  function unitQ(big, small, rate, maxBig, opt) {
    const o = opt || {};
    const t = R(0, o.decimal ? 2 : 1);
    if (t === 0) {                                     // 複名數 → 小單位
      const x = R(1, maxBig), y = R(1, rate - 1);
      return { q: `${x} ${big} ${y} ${small} ＝ □ ${small}`, a: String(x * rate + y), hint: `1 ${big} ＝ ${rate} ${small}，${x} ${big} ＝ ${x * rate} ${small}，再加 ${y}` };
    }
    if (t === 1) {                                     // 小單位 → 大單位（整數）
      const x = R(2, maxBig);
      return { q: `${x * rate} ${small} ＝ □ ${big}`, a: String(x), hint: `${rate} ${small} ＝ 1 ${big}，想：${x * rate} 裡有幾個 ${rate}？` };
    }
    const x = R(1, maxBig), part = pick(rate === 1000 ? [100, 200, 250, 500, 750] : rate === 100 ? [10, 20, 25, 50, 75] : [1, 2, 5]);
    return { q: `${x * rate + part} ${small} ＝ □ ${big}（用小數）`, a: fmt(x + part / rate), hint: `${part} ${small} 是 ${part}／${rate} ${big} ＝ ${fmt(part / rate)} ${big}` };
  }

  // ── 課程地圖（依台灣國小數學 108 課綱整理；年級是大約的位置）──
  // id 不要改（進度用 id 存）；t＝三顆星每題平均秒數
  const GROUPS = [
    ['add', '➕ 加法'], ['sub', '➖ 減法'], ['mul', '✖️ 乘法'], ['div', '➗ 除法'],
    ['mix', '🧩 綜合與巧算'], ['num', '🔢 大數與概數'], ['frac', '🍰 分數、小數、百分率'], ['frac2', '✖️ 分數乘除、四則運算'],
    ['unit', '📏 量與實測（單位換算）'], ['adv', '🎓 高年級挑戰']
  ];
  const COURSES = [
    // 加法
    { id: 'a1', g: 'add', name: '10 以內的加法', gr: 1, t: 3, gen: () => { const a = R(1, 8); return addQ(a, R(1, 9 - a)); } },
    { id: 'a2', g: 'add', name: '20 以內的進位加法（湊十）', gr: 1, t: 4, gen: () => until(() => [R(2, 9), R(2, 9)], ([a, b]) => a + b > 10).reduce((a, b) => addQ(a, b)) },
    { id: 'a3', g: 'add', name: '二位數＋一位數', gr: 1, t: 4, gen: () => addQ(R(11, 89), R(1, 9)) },
    { id: 'a4', g: 'add', name: '二位數＋二位數（不進位）', gr: 2, t: 5, gen: () => { const [a, b] = until(() => [R(11, 80), R(11, 80)], ([a, b]) => !carryAdd(a, b) && a + b < 100); return addQ(a, b); } },
    { id: 'a5', g: 'add', name: '二位數＋二位數（要進位）', gr: 2, t: 6, gen: () => { const [a, b] = until(() => [R(15, 89), R(15, 89)], ([a, b]) => carryAdd(a, b)); return addQ(a, b); } },
    { id: 'a6', g: 'add', name: '整十、整百的加法', gr: 2, t: 4, gen: () => pick([10, 100]) === 10 ? addQ(R(1, 9) * 10, R(1, 9) * 10) : addQ(R(1, 8) * 100, R(1, 9) * 100) },
    { id: 'a7', g: 'add', name: '三位數＋二位數', gr: 2, t: 7, gen: () => addQ(R(101, 899), R(11, 99)) },
    { id: 'a8', g: 'add', name: '三位數＋三位數', gr: 3, t: 9, gen: () => addQ(R(101, 499), R(101, 499)) },
    // 減法
    { id: 's1', g: 'sub', name: '10 以內的減法', gr: 1, t: 3, gen: () => { const a = R(2, 10); return subQ(a, R(1, a - 1)); } },
    { id: 's2', g: 'sub', name: '20 以內的退位減法', gr: 1, t: 4, gen: () => { const a = R(11, 18); return subQ(a, R(a - 9, 9)); } },
    { id: 's3', g: 'sub', name: '二位數－一位數', gr: 1, t: 4, gen: () => subQ(R(20, 99), R(1, 9)) },
    { id: 's4', g: 'sub', name: '二位數－二位數（不退位）', gr: 2, t: 5, gen: () => { const [a, b] = until(() => [R(30, 99), R(11, 60)], ([a, b]) => a > b && !borrowSub(a, b)); return subQ(a, b); } },
    { id: 's5', g: 'sub', name: '二位數－二位數（要退位）', gr: 2, t: 6, gen: () => { const [a, b] = until(() => [R(30, 99), R(12, 79)], ([a, b]) => a > b && borrowSub(a, b)); return subQ(a, b); } },
    { id: 's6', g: 'sub', name: '整十、整百的減法', gr: 2, t: 4, gen: () => { if (R(0, 1)) { const a = R(3, 9) * 10; return subQ(a, R(1, a / 10 - 1) * 10); } const a = R(3, 9) * 100; return subQ(a, R(1, a / 100 - 1) * 100); } },
    { id: 's7', g: 'sub', name: '三位數－二位數', gr: 3, t: 7, gen: () => subQ(R(120, 999), R(11, 99)) },
    { id: 's8', g: 'sub', name: '三位數－三位數', gr: 3, t: 9, gen: () => { const a = R(300, 999); return subQ(a, R(101, a - 50)); } },
    // 乘法
    { id: 'm1', g: 'mul', name: '2、5、10 的乘法', gr: 2, t: 3, gen: () => { const a = pick([2, 5, 10]), b = R(1, 9); return R(0, 1) ? mulQ(a, b) : mulQ(b, a); } },
    { id: 'm2', g: 'mul', name: '3、4 的乘法', gr: 2, t: 3, gen: () => { const a = pick([3, 4]), b = R(1, 9); return R(0, 1) ? mulQ(a, b) : mulQ(b, a); } },
    { id: 'm3', g: 'mul', name: '6、7 的乘法', gr: 2, t: 3, gen: () => { const a = pick([6, 7]), b = R(2, 9); return R(0, 1) ? mulQ(a, b) : mulQ(b, a); } },
    { id: 'm4', g: 'mul', name: '8、9 的乘法', gr: 2, t: 3, gen: () => { const a = pick([8, 9]), b = R(2, 9); return R(0, 1) ? mulQ(a, b) : mulQ(b, a); } },
    { id: 'm5', g: 'mul', name: '九九乘法總複習', gr: 2, t: 3, gen: () => mulQ(R(2, 9), R(2, 9)) },
    { id: 'm6', g: 'mul', name: '整十、整百的乘法', gr: 3, t: 4, gen: () => R(0, 1) ? mulQ(R(2, 9) * 10, R(2, 9)) : mulQ(R(2, 9) * 100, R(2, 9)) },
    { id: 'm7', g: 'mul', name: '二位數×一位數', gr: 3, t: 7, gen: () => mulQ(R(12, 49), R(2, 9)) },
    { id: 'm8', g: 'mul', name: '整十×整十', gr: 4, t: 5, gen: () => mulQ(R(2, 9) * 10, R(2, 9) * 10) },
    // 除法
    { id: 'd1', g: 'div', name: '九九除法', gr: 3, t: 4, gen: () => { const b = R(2, 9), q = R(2, 9); return divQ(b * q, b); } },
    { id: 'd2', g: 'div', name: '有餘數的除法（求餘數）', gr: 3, t: 6, gen: () => { const b = R(3, 9), q = R(2, 9), r = R(1, b - 1), a = b * q + r; return { q: `${a} ÷ ${b} ＝ ${q} 餘 □`, a: String(r), hint: `${b} × ${q} ＝ ${b * q}，${a} 還差多少到 ${b * q}？想：${a} － ${b * q}` }; } },
    { id: 'd3', g: 'div', name: '二位數÷一位數（整除）', gr: 3, t: 7, gen: () => { const b = R(2, 8), q = R(11, Math.floor(98 / b)); return divQ(b * q, b); } },
    { id: 'd4', g: 'div', name: '整十、整百的除法', gr: 4, t: 5, gen: () => { const b = R(2, 9), q = R(2, 9) * pick([10, 100]); return { ...divQ(b * q, b), hint: `先不看 0：${b * q / (q >= 100 ? 100 : 10)} ÷ ${b} ＝ ${q / (q >= 100 ? 100 : 10)}，再把 0 補回去` }; } },
    // 綜合與巧算
    { id: 'x1', g: 'mix', name: '□ 填空（加減）', gr: 2, t: 6, gen: () => { if (R(0, 1)) { const ans = R(5, 50), b = R(5, 45); return { q: `□ ＋ ${b} ＝ ${ans + b}`, a: String(ans), hint: `逆思考：${ans + b} － ${b} ＝ □` }; } const ans = R(5, 40), c = R(5, 50); return { q: `${ans + c} － □ ＝ ${c}`, a: String(ans), hint: `逆思考：${ans + c} － ${c} ＝ □` }; } },
    { id: 'x2', g: 'mix', name: '□ 填空（乘除）', gr: 3, t: 5, gen: () => { const a = R(2, 9), ans = R(2, 9); if (R(0, 1)) return { q: `${a} × □ ＝ ${a * ans}`, a: String(ans), hint: `想：${a} 的幾倍是 ${a * ans}？` }; return { q: `□ ÷ ${a} ＝ ${ans}`, a: String(a * ans), hint: `逆思考：${a} × ${ans} ＝ □` }; } },
    { id: 'x3', g: 'mix', name: '先乘除，後加減', gr: 4, t: 8, gen: () => { const b = R(2, 9), c = R(2, 9), p = b * c; if (R(0, 1)) { const a = R(10, 50); return { q: `${a} ＋ ${b} × ${c} ＝ ？`, a: String(a + p), hint: `先乘除後加減：先算 ${b} × ${c} ＝ ${p}` }; } const a = R(p + 5, p + 45); return { q: `${a} － ${b} × ${c} ＝ ？`, a: String(a - p), hint: `先乘除後加減：先算 ${b} × ${c} ＝ ${p}` }; } },
    { id: 'x4', g: 'mix', name: '括號先算', gr: 4, t: 8, gen: () => { const a = R(2, 9), b = R(1, 9), c = R(2, 9); if (R(0, 1)) return { q: `（${a} ＋ ${b}）× ${c} ＝ ？`, a: String((a + b) * c), hint: `括號先算：${a} ＋ ${b} ＝ ${a + b}，再乘 ${c}` }; const x = R(20, 60); const y = R(2, Math.min(9, x - 11)); return { q: `${x} －（${y} ＋ ${b}）＝ ？`, a: String(x - y - b), hint: `括號先算：${y} ＋ ${b} ＝ ${y + b}` }; } },
    { id: 'x5', g: 'mix', name: '湊十、湊百巧算', gr: 4, t: 7, gen: () => { const k = R(1, 3); if (k === 1) { const a = R(11, 89), b = R(15, 75); return { q: `${a} ＋ ${b} ＋ ${100 - a} ＝ ？`, a: String(100 + b), hint: `找朋友：${a} ＋ ${100 - a} ＝ 100，再加 ${b}` }; } if (k === 2) { const n = pick([98, 99, 198, 199]), b = R(25, 85); return addQ(n, b); } const a = R(120, 260), n = pick([98, 99]); return subQ(a, n); } },
    { id: 'x6', g: 'mix', name: '黃金組合（25×4、125×8）', gr: 4, t: 6, gen: () => pick([['25 × 4', 100], ['25 × 8', 200], ['25 × 12', 300], ['25 × 16', 400], ['125 × 8', 1000], ['25 × 40', 1000], ['50 × 18', 900], ['99 × 5', 495], ['99 × 6', 594], ['101 × 8', 808], ['102 × 4', 408], ['15 × 6', 90], ['4 × 7 × 25', 700], ['2 × 9 × 50', 900]]).reduce((q, a) => ({ q: `${q} ＝ ？`, a: String(a), hint: /25|125/.test(q) ? '記住好朋友：25 × 4 ＝ 100、125 × 8 ＝ 1000' : /99|101|102/.test(q) ? '接近 100 的數：先當 100 算，再補上或扣掉' : '先找能湊成整十、整百的兩個數' })) },
    // 大數與概數
    { id: 'n1', g: 'num', name: '萬、千、百的換算', gr: 4, t: 6, gen: () => { const k = R(1, 3); if (k === 1) { const x = R(2, 9); return { q: `${x} 萬 ＝ □ 千`, a: String(x * 10), hint: '1 萬 ＝ 10 千' }; } if (k === 2) { const x = R(2, 9) * 10; return { q: `${x} 千 ＝ □ 萬`, a: String(x / 10), hint: '10 千 ＝ 1 萬' }; } const x = R(2, 9), y = R(1, 9); return { q: `${x} 萬 ${y} 千 ＝ □`, a: String(x * 10000 + y * 1000), hint: `${x} 萬是 ${x}0000，${y} 千是 ${y}000` }; } },
    { id: 'n2', g: 'num', name: '四捨五入（概數）', gr: 4, t: 6, gen: () => { const place = pick([['十', 10], ['百', 100], ['千', 1000]]); const n = until(() => R(place[1] * 2 + 1, place[1] * 99 - 1), v => v % place[1] !== 0); const ans = Math.round(n / place[1]) * place[1]; return { q: `${n} 四捨五入到${place[0]}位 ＝ ？`, a: String(ans), hint: `看${place[0]}位的下一位：${Math.floor(n % place[1] / (place[1] / 10))}，4 以下捨去、5 以上進位` }; } },
    // 分數、小數、百分率
    { id: 'f1', g: 'frac', name: '同分母分數加減', gr: 3, t: 8, gen: () => { const d = R(5, 12); if (R(0, 1)) { const a = R(1, d - 2), b = R(1, d - 1 - a); return fracQ([T('p', a, d), T('p', b, d)], ['+'], `分母一樣，分子相加：${a} ＋ ${b}，分母還是 ${d}`); } const a = R(3, d - 1), b = R(1, a - 1); return fracQ([T('p', a, d), T('p', b, d)], ['-'], `分母一樣，分子相減：${a} － ${b}，分母還是 ${d}`); } },
    { id: 'f7', g: 'frac', name: '同分母加減（超過 1：假分數、帶分數）', gr: 4, t: 10, gen: () => { const d = R(3, 9); if (R(0, 2)) { const [a, b] = until(() => [R(1, d - 1), R(1, d - 1)], ([a, b]) => a + b > d); return fracQ([T('p', a, d), T('p', b, d)], ['+'], `分母一樣，分子相加：${a} ＋ ${b}，分母還是 ${d}；分子比分母大，可以寫成假分數，也可以化成帶分數`); } const n = until(() => R(d + 1, 3 * d - 1), n => n % d !== 0), b = R(1, d - 1); return fracQ([T('i', n, d), T('p', b, d)], ['-'], `分母一樣，分子相減：${n} － ${b}，分母還是 ${d}`); } },
    { id: 'f8', g: 'frac', name: '假分數和帶分數互換', gr: 4, t: 8, gen: () => { const d = R(2, 9), w = R(1, 5), r = until(() => R(1, d - 1), r => gcd(r, d) === 1), n = w * d + r; if (R(0, 1)) return { q: `${n}/${d} ＝ ？（寫成帶分數）`, a: `${w}又${r}/${d}`, fr: true, v: fr(n, d), form: 'mixed', hint: `算 ${n} ÷ ${d}：商是整數，餘數是分子，分母還是 ${d}` }; return { q: `${w}又${r}/${d} ＝ ？（寫成假分數）`, a: `${n}/${d}`, fr: true, v: fr(n, d), form: 'improper', hint: `分子 ＝ 整數 × 分母 ＋ 分子 ＝ ${w} × ${d} ＋ ${r}，分母還是 ${d}` }; } },
    { id: 'f9', g: 'frac', name: '帶分數加減（同分母，不用進位退位）', gr: 4, t: 12, gen: () => { const d = R(3, 9); if (R(0, 1)) { const w1 = R(1, 5), w2 = R(1, 4), n1 = R(1, d - 2), n2 = R(1, d - 1 - n1); return fracQ([Mx(w1, n1, d), Mx(w2, n2, d)], ['+'], `整數加整數：${w1} ＋ ${w2}；分數加分數：分子 ${n1} ＋ ${n2}，分母還是 ${d}`); } const w1 = R(2, 6), w2 = R(1, w1 - 1), n1 = R(2, d - 1), n2 = R(1, n1 - 1); return fracQ([Mx(w1, n1, d), Mx(w2, n2, d)], ['-'], `整數減整數：${w1} － ${w2}；分數減分數：分子 ${n1} － ${n2}，分母還是 ${d}`); } },
    { id: 'f10', g: 'frac', name: '帶分數加減（同分母，要進位退位）', gr: 4, t: 15, gen: () => { const d = R(3, 9); if (R(0, 1)) { const w1 = R(1, 4), w2 = R(1, 4), [n1, n2] = until(() => [R(1, d - 1), R(1, d - 1)], ([a, b]) => a + b > d); return fracQ([Mx(w1, n1, d), Mx(w2, n2, d)], ['+'], `整數：${w1} ＋ ${w2}；分數：分子 ${n1} ＋ ${n2} 超過 ${d} 了，${d}/${d} ＝ 1，要進位到整數`); } const w1 = R(2, 6), w2 = R(0, w1 - 1), [n1, n2] = until(() => [R(1, d - 1), R(1, d - 1)], ([a, b]) => a < b); return fracQ([Mx(w1, n1, d), Mx(w2, n2, d)], ['-'], `${n1}/${d} 不夠減 ${n2}/${d}，從整數借 1：${w1}又${n1}/${d} ＝ ${w1 - 1}又${n1 + d}/${d}，再減`); } },
    { id: 'f11', g: 'frac', name: '整數減分數、帶分數', gr: 4, t: 12, gen: () => { const d = R(2, 9), W = R(1, 5), n = R(1, d - 1); const B = W > 1 && R(0, 1) ? Mx(R(1, W - 1), n, d) : T('p', n, d); return fracQ([T('w', W * d, d), B], ['-'], `把 1 看成 ${d}/${d}：${W} ＝ ${W > 1 ? (W - 1) + '又' : ''}${d}/${d}，再減`); } },
    { id: 'f12', g: 'frac', name: '異分母加減（分母是倍數關係）', gr: 5, t: 15, gen: () => { const [d1, d2] = twoDen('mul'); return twoTermQ(T('p', R(1, d1 - 1), d1), T('p', R(1, d2 - 1), d2), (A, B, op) => tfHint(A, B, op)); } },
    { id: 'f13', g: 'frac', name: '異分母加減（要找公倍數通分）', gr: 5, t: 18, gen: () => { const [d1, d2] = twoDen('gen', 40); return twoTermQ(T('p', R(1, d1 - 1), d1), T('p', R(1, d2 - 1), d2), (A, B, op) => tfHint(A, B, op)); } },
    { id: 'f14', g: 'frac', name: '異分母帶分數加減', gr: 5, t: 25, gen: () => { const [d1, d2] = until(() => twoDen(R(0, 1) ? 'mul' : 'gen', 24), ([a, b]) => lcm(a, b) <= 24); return twoTermQ(Mx(R(1, 5), R(1, d1 - 1), d1), Mx(R(0, 4), R(1, d2 - 1), d2), (A, B, op) => tfHint(A, B, op, mixHint(op))); } },
    { id: 'f15', g: 'frac', name: '分數加減綜合（帶分數、假分數、三個數）', gr: 6, t: 30, gen: () => until(() => { const ds = pick([[2, 4, 8], [2, 3, 6, 12], [2, 5, 10], [3, 6, 9], [2, 3, 4, 6]]); const mk = () => { const d = pick(ds), k = pick(['p', 'i', 'm']); if (k === 'p') return T('p', R(1, d - 1), d); if (k === 'i') return T('i', until(() => R(d + 1, 3 * d - 1), n => n % d !== 0), d); return Mx(R(1, 3), R(1, d - 1), d); }; const ts = [mk(), mk(), mk()], ops = [pick(['+', '-']), pick(['+', '-'])]; const L = ts.reduce((l, t) => lcm(l, t.d), 1); const v1 = ops[0] === '+' ? fv(ts[0]) + fv(ts[1]) : fv(ts[0]) - fv(ts[1]); const v2 = ops[1] === '+' ? v1 + fv(ts[2]) : v1 - fv(ts[2]); const q = fracQ(ts, ops, `從左到右算。先通分成分母 ${L}：${ts.map(t => termAt(t, L)).join('、')}；帶分數可以先化成假分數再算`); q._ok = v1 > 1e-9 && v2 > 1e-9 && new Set(ts.map(t => t.d)).size > 1; return q; }, q => q._ok) },
    { id: 'f16', g: 'frac2', name: '分數×整數', gr: 5, t: 10, gen: () => retryQ(() => { const A = R(0, 3) ? rP(12) : rM(6), B = rI(2, 9); return exprQ(R(0, 1) ? E('*', A, B) : E('*', B, A), A.k === 'm' ? '帶分數先化成假分數，分子乘整數，分母不變（可以先約分）' : '分子乘整數，分母不變（可以先和分母約分）', 80, 12); }) },
    { id: 'f17', g: 'frac2', name: '分數×分數', gr: 5, t: 12, gen: () => retryQ(() => exprQ(E('*', rP(9), rP(9)), HINT_MUL, 80, 60)) },
    { id: 'f18', g: 'frac2', name: '帶分數、假分數的乘法', gr: 5, t: 18, gen: () => retryQ(() => { const A = R(0, 1) ? rM(6) : rImp(6), B = pick([rP(9), rM(5), rImp(5)]); return exprQ(E('*', A, B), '先把帶分數化成假分數，再' + HINT_MUL, 120, 40); }) },
    { id: 'f19', g: 'frac2', name: '分數÷整數、整數÷分數', gr: 6, t: 12, gen: () => retryQ(() => { if (R(0, 1)) { const A = R(0, 2) ? rP(9) : rM(5), B = rI(2, 9); return exprQ(E('/', A, B), `除以 ${B.n} 就是乘以 1/${B.n}：分母乘 ${B.n}，再看能不能約分`, 80, 60); } const A = rI(2, 9), B = rP(9); return exprQ(E('/', A, B), `除以一個分數，等於乘以它的倒數：${A.n} × ${rec(B)}`, 80, 12); }) },
    { id: 'f20', g: 'frac2', name: '分數÷分數', gr: 6, t: 15, gen: () => retryQ(() => { const A = rP(9), B = rP(9); return exprQ(E('/', A, B), `除以一個分數，等於乘以它的倒數：${term(A)} × ${rec(B)}`, 80, 60); }) },
    { id: 'f21', g: 'frac2', name: '帶分數、假分數的除法', gr: 6, t: 20, gen: () => retryQ(() => { const A = pick([rM(6), rImp(6), rP(9)]), B = A.k === 'p' ? rM(4) : pick([rP(9), rM(4), rImp(5)]); return exprQ(E('/', A, B), `先把帶分數化成假分數，再乘以除數的倒數 ${rec(B)}`, 120, 40); }) },
    { id: 'f22', g: 'frac2', name: '分數乘除混合（三個數）', gr: 6, t: 25, gen: () => retryQ(() => { const k = ['p', 'p', 'm', 'w'], D = [2, 3, 4, 5, 6, 8, 9]; const a = rAny(D, ['p', 'p', 'm']), b = rAny(D, k), c = rAny(D, k); const ops = [pick(['*', '/']), pick(['*', '/'])]; if (ops[0] === '*' && ops[1] === '*') ops[R(0, 1)] = '/'; return exprQ(E(ops[1], E(ops[0], a, b), c), '帶分數先化成假分數；除以一個數就是乘以它的倒數，全部變成乘法再一起約分', 120, 40); }) },
    { id: 'f23', g: 'frac2', name: '分數加減混合（有括號）', gr: 5, t: 25, gen: () => retryQ(() => { const ds = pick(FAM), k = ['p', 'p', 'm', 'i'], a = rAny(ds, k), b = rAny(ds, k), c = rAny(ds, k); const t = R(0, 3); const e = t === 0 ? E('-', a, E('+', b, c, 1)) : t === 1 ? E('+', a, E('-', b, c, 1)) : t === 2 ? E('-', a, E('-', b, c, 1)) : E('-', E('+', a, b, 1), c); return exprQ(e, '先算括號裡面；減掉一個括號，也可以把括號裡的數一個一個減（括號裡的＋、－要變號）', 150, 24); }) },
    { id: 'f24', g: 'frac2', name: '分數四則（先乘除、後加減）', gr: 6, t: 28, gen: () => retryQ(() => { const ds = pick(FAM), a = rAny(ds, ['p', 'm']), b = rAny(ds, ['p', 'p', 'w']), c = rAny(ds, ['p', 'w', 'm']); const t = R(0, 4); const e = t === 0 ? E('+', a, E('*', b, c)) : t === 1 ? E('-', a, E('*', b, c)) : t === 2 ? E('+', E('*', b, c), a) : t === 3 ? E('-', a, E('/', b, c)) : E('+', E('/', b, c), a); return exprQ(e, HINT_ORDER, 150, 36); }) },
    { id: 'f25', g: 'frac2', name: '分數四則（有括號）', gr: 6, t: 32, gen: () => retryQ(() => { const ds = pick(FAM), a = rAny(ds, ['p', 'm']), b = rAny(ds, ['p', 'm', 'i']), c = rAny(ds, ['p', 'w', 'p']); const t = R(0, 4); const e = t === 0 ? E('*', E('+', a, b, 1), c) : t === 1 ? E('*', c, E('-', a, b, 1)) : t === 2 ? E('/', E('-', a, b, 1), c) : t === 3 ? E('/', a, E('+', b, c, 1)) : E('-', E('*', E('+', a, b, 1), c), rP(0, ds)); return exprQ(e, HINT_ORDER, 150, 36); }) },
    { id: 'f2', g: 'frac', name: '分數化小數（分母 2、4、5、10、100）', gr: 4, t: 5, gen: () => pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [7, 100], [25, 100], [43, 100]]).reduce((n, d) => ({ q: `${n}/${d} ＝ □（用小數）`, a: fmt(n / d), hint: d === 10 || d === 100 ? `分母 ${d}：${n} 個 ${d === 10 ? '0.1' : '0.01'}` : `把分母變成 10 或 100：${n}/${d} ＝ ${n * (100 / d) % 10 === 0 ? n * (10 / d) + '/10' : n * (100 / d) + '/100'}` })) },
    { id: 'f3', g: 'frac', name: '一位小數加減', gr: 4, t: 6, gen: () => { const a = R(11, 69), b = R(11, 59); if (R(0, 1)) return { q: `${fmt(a / 10)} ＋ ${fmt(b / 10)} ＝ ？`, a: fmt((a + b) / 10), hint: `當成 ${a} ＋ ${b} ＝ ${a + b}，再點上小數點` }; const big = Math.max(a, b) + 12, small = Math.min(a, b); return { q: `${fmt(big / 10)} － ${fmt(small / 10)} ＝ ？`, a: fmt((big - small) / 10), hint: `當成 ${big} － ${small} ＝ ${big - small}，再點上小數點` }; } },
    { id: 'f4', g: 'frac', name: '小數×整數', gr: 5, t: 6, gen: () => { const a = pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.2, 1.5, 2.5, 0.25]), b = R(2, 9); return { q: `${a} × ${b} ＝ ？`, a: fmt(a * b), hint: `先當整數算：${String(a).replace('0.', '').replace('.', '')} × ${b}，再點上小數點（${String(a).split('.')[1].length} 位小數）` }; } },
    { id: 'f5', g: 'frac', name: '百分率', gr: 5, t: 7, gen: () => { const p = pick([10, 20, 25, 50, 75]), n = pick([40, 80, 100, 120, 200, 300, 400, 500, 600, 800]); return { q: `${n} 的 ${p}% ＝ ？`, a: fmt(n * p / 100), hint: p === 50 ? '50% 就是一半' : p === 25 ? '25% 就是 1/4' : p === 75 ? '75% 就是 3/4' : `${p}% 就是 ${p}/100：先算 1%（${fmt(n / 100)}），再乘 ${p}` }; } },
    { id: 'f6', g: 'frac', name: '打折（幾折是多少元）', gr: 5, t: 7, gen: () => { const z = pick([5, 6, 7, 8, 9]), n = pick([100, 200, 300, 400, 500, 600, 800, 1000]); return { q: `${n} 元的東西打 ${z} 折，要付 □ 元`, a: String(n * z / 10), hint: `打 ${z} 折就是付原價的 ${z}/10：${n} ÷ 10 × ${z}` }; } },
    // 量與實測
    { id: 'u1', g: 'unit', name: '錢幣：找錢', gr: 2, t: 6, gen: () => { const pay = pick([50, 100, 100, 500, 1000]), cost = R(Math.ceil(pay * 0.2), pay - 1); return { q: `付 ${pay} 元，買 ${cost} 元的東西，找回 □ 元`, a: String(pay - cost), hint: hintSub(pay, cost) }; } },
    { id: 'u2', g: 'unit', name: '長度：公尺和公分', gr: 2, t: 6, gen: () => unitQ('公尺', '公分', 100, 9) },
    { id: 'u3', g: 'unit', name: '時間：時和分', gr: 2, t: 7, gen: () => { if (R(0, 1)) { const h = R(1, 5), m = R(5, 55); return { q: `${h} 時 ${m} 分 ＝ □ 分`, a: String(h * 60 + m), hint: `1 時 ＝ 60 分，${h} 時 ＝ ${h * 60} 分，再加 ${m}` }; } const h = R(1, 4), m = R(1, 59); return { q: `${h * 60 + m} 分 ＝ ${h} 時 □ 分`, a: String(m), hint: `${h} 時 ＝ ${h * 60} 分，${h * 60 + m} － ${h * 60}` }; } },
    { id: 'u4', g: 'unit', name: '時間：分和秒', gr: 3, t: 7, gen: () => { if (R(0, 1)) { const m = R(1, 5), s = R(5, 55); return { q: `${m} 分 ${s} 秒 ＝ □ 秒`, a: String(m * 60 + s), hint: `1 分 ＝ 60 秒，${m} 分 ＝ ${m * 60} 秒，再加 ${s}` }; } const m = R(1, 4), s = R(1, 59); return { q: `${m * 60 + s} 秒 ＝ ${m} 分 □ 秒`, a: String(s), hint: `${m} 分 ＝ ${m * 60} 秒，${m * 60 + s} － ${m * 60}` }; } },
    { id: 'u5', g: 'unit', name: '時間：日、時、週、年', gr: 3, t: 6, gen: () => pick([
      () => { const d = R(2, 5); return { q: `${d} 日 ＝ □ 時`, a: String(d * 24), hint: `1 日 ＝ 24 時，${d} × 24` }; },
      () => { const w = R(2, 9); return { q: `${w} 週 ＝ □ 日`, a: String(w * 7), hint: `1 週 ＝ 7 日，${w} × 7` }; },
      () => { const y = R(2, 5); return { q: `${y} 年 ＝ □ 個月`, a: String(y * 12), hint: `1 年 ＝ 12 個月，${y} × 12` }; },
      () => { const d = R(1, 3), h = R(1, 23); return { q: `${d} 日 ${h} 時 ＝ □ 時`, a: String(d * 24 + h), hint: `${d} 日 ＝ ${d * 24} 時，再加 ${h}` }; }
    ])() },
    { id: 'u6', g: 'unit', name: '長度：公分和毫米', gr: 3, t: 6, gen: () => unitQ('公分', '毫米', 10, 30) },
    { id: 'u7', g: 'unit', name: '重量：公斤和公克', gr: 3, t: 7, gen: () => unitQ('公斤', '公克', 1000, 9) },
    { id: 'u8', g: 'unit', name: '容量：公升和毫升', gr: 3, t: 7, gen: () => unitQ('公升', '毫升', 1000, 9) },
    { id: 'u9', g: 'unit', name: '長度：公里和公尺', gr: 4, t: 7, gen: () => unitQ('公里', '公尺', 1000, 9, { decimal: true }) },
    { id: 'u10', g: 'unit', name: '長方形、正方形的周長與面積', gr: 4, t: 7, gen: () => { const L = R(3, 12), W = R(2, L - 1), sq = R(0, 2) === 0; if (sq) { const s = R(3, 12); return R(0, 1) ? { q: `邊長 ${s} 公分的正方形，周長 □ 公分`, a: String(s * 4), hint: `正方形周長 ＝ 邊長 × 4` } : { q: `邊長 ${s} 公分的正方形，面積 □ 平方公分`, a: String(s * s), hint: `正方形面積 ＝ 邊長 × 邊長` }; } return R(0, 1) ? { q: `長 ${L} 公分、寬 ${W} 公分的長方形，周長 □ 公分`, a: String((L + W) * 2), hint: `長方形周長 ＝（長 ＋ 寬）× 2 ＝ ${L + W} × 2` } : { q: `長 ${L} 公分、寬 ${W} 公分的長方形，面積 □ 平方公分`, a: String(L * W), hint: `長方形面積 ＝ 長 × 寬` }; } },
    { id: 'u11', g: 'unit', name: '角度：三角形的內角', gr: 4, t: 7, gen: () => { const a = R(3, 9) * 10, b = R(3, 9) * 10; if (a + b >= 170) return { q: `直角三角形的一個銳角是 ${a > 80 ? 40 : a} 度，另一個銳角 □ 度`, a: String(90 - (a > 80 ? 40 : a)), hint: '直角是 90 度，兩個銳角加起來也是 90 度' }; return { q: `三角形的兩個角是 ${a} 度和 ${b} 度，第三個角 □ 度`, a: String(180 - a - b), hint: `三角形三個角加起來是 180 度：180 －（${a} ＋ ${b}）` }; } },
    { id: 'u12', g: 'unit', name: '重量：公噸和公斤', gr: 5, t: 7, gen: () => unitQ('公噸', '公斤', 1000, 9, { decimal: true }) },
    { id: 'u13', g: 'unit', name: '面積：平方公尺、公畝、公頃', gr: 5, t: 7, gen: () => pick([
      () => { const x = R(2, 9); return { q: `${x} 公頃 ＝ □ 公畝`, a: String(x * 100), hint: '1 公頃 ＝ 100 公畝' }; },
      () => { const x = R(2, 9); return { q: `${x} 公畝 ＝ □ 平方公尺`, a: String(x * 100), hint: '1 公畝 ＝ 100 平方公尺' }; },
      () => { const x = R(2, 9); return { q: `${x * 100} 平方公尺 ＝ □ 公畝`, a: String(x), hint: '100 平方公尺 ＝ 1 公畝' }; },
      () => { const x = R(1, 9); return { q: `${x} 公頃 ＝ □ 平方公尺`, a: String(x * 10000), hint: '1 公頃 ＝ 100 公畝 ＝ 10000 平方公尺' }; },
      () => { const x = R(2, 5); return { q: `${x} 平方公里 ＝ □ 公頃`, a: String(x * 100), hint: '1 平方公里 ＝ 100 公頃' }; }
    ])() },
    { id: 'u14', g: 'unit', name: '體積與容量：立方公分、公升、立方公尺', gr: 5, t: 7, gen: () => pick([
      () => { const x = R(2, 9); return { q: `${x} 公升 ＝ □ 立方公分`, a: String(x * 1000), hint: '1 公升 ＝ 1000 立方公分' }; },
      () => { const x = R(2, 9); return { q: `${x * 1000} 立方公分 ＝ □ 公升`, a: String(x), hint: '1000 立方公分 ＝ 1 公升' }; },
      () => { const x = R(2, 9); return { q: `${x} 毫升 ＝ □ 立方公分`, a: String(x), hint: '1 毫升 ＝ 1 立方公分' }; },
      () => { const x = R(2, 5); return { q: `${x} 立方公尺 ＝ □ 公升`, a: String(x * 1000), hint: '1 立方公尺 ＝ 1000 公升' }; },
      () => { const a = R(2, 6), b = R(2, 6), c = R(2, 6); return { q: `長 ${a}、寬 ${b}、高 ${c} 公分的長方體，體積 □ 立方公分`, a: String(a * b * c), hint: `長方體體積 ＝ 長 × 寬 × 高 ＝ ${a} × ${b} × ${c}` }; }
    ])() },
    { id: 'u15', g: 'unit', name: '速率：時速、距離、時間', gr: 6, t: 8, gen: () => { const v = pick([40, 50, 60, 80, 90, 100, 120]), h = R(2, 5); const k = R(1, 3); if (k === 1) return { q: `時速 ${v} 公里，走 ${h} 小時，共 □ 公里`, a: String(v * h), hint: '距離 ＝ 速率 × 時間' }; if (k === 2) return { q: `${h} 小時走了 ${v * h} 公里，時速 □ 公里`, a: String(v), hint: '速率 ＝ 距離 ÷ 時間' }; return { q: `時速 ${v} 公里，走 ${v * h} 公里要 □ 小時`, a: String(h), hint: '時間 ＝ 距離 ÷ 速率' }; } },
    // 高年級挑戰
    { id: 'v1', g: 'adv', name: '自己乘自己（11～20）', gr: 5, t: 6, gen: () => { const n = R(11, 20); return { q: `${n} × ${n} ＝ ？`, a: String(n * n), hint: `${n} × ${n} ＝ ${n} × 10 ＋ ${n} × ${n - 10} ＝ ${n * 10} ＋ ${n * (n - 10)}` }; } },
    { id: 'v2', g: 'adv', name: '最大公因數', gr: 6, t: 8, gen: () => { const g = pick([2, 3, 4, 5, 6, 7, 8, 9, 12]); let a, b; do { a = R(1, 6); b = R(1, 6); } while (a === b || gcd(a, b) !== 1); return { q: `${g * a} 和 ${g * b} 的最大公因數 ＝ ？`, a: String(g), hint: `兩個數都能被誰整除？從小的數 ${Math.min(g * a, g * b)} 的因數裡，由大往小找` }; } },
    { id: 'v3', g: 'adv', name: '最小公倍數', gr: 6, t: 8, gen: () => { const [a, b] = until(() => [R(2, 12), R(2, 12)], ([a, b]) => a !== b && lcm(a, b) <= 72); return { q: `${a} 和 ${b} 的最小公倍數 ＝ ？`, a: String(lcm(a, b)), hint: `把大的數 ${Math.max(a, b)} 的倍數一個一個寫出來，看哪一個也是 ${Math.min(a, b)} 的倍數` }; } },
    { id: 'v4', g: 'adv', name: '圓周率 3.14 的倍數', gr: 6, t: 7, gen: () => { const m = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 25, 100]); return { q: `3.14 × ${m} ＝ ？`, a: fmt(3.14 * m), hint: `拆開來：3 × ${m} ＝ ${3 * m}，再加 0.14 × ${m} ＝ ${fmt(0.14 * m)}` }; } },
    { id: 'v5', g: 'adv', name: '比值', gr: 6, t: 7, gen: () => { const b = pick([2, 4, 5, 8, 10]), a = R(1, b * 3); if (a % b === 0) return { q: `${a * 2} ： ${b * 2} 的比值 ＝ ？`, a: fmt(a / b), hint: '比值 ＝ 前項 ÷ 後項' }; return { q: `${a} ： ${b} 的比值 ＝ □（用小數）`, a: fmt(a / b), hint: `比值 ＝ 前項 ÷ 後項 ＝ ${a} ÷ ${b}` }; } }
  ];
  const BY_ID = {};
  COURSES.forEach((c, i) => { c.i = i; BY_ID[c.id] = c; });

  function normAns(s) {
    let t = String(s == null ? '' : s).trim().replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/[．。]/g, '.').replace(/[／]/g, '/').replace(/\s+/g, '');
    if (/^-?\d*\.\d+$/.test(t)) t = String(Number(t));
    return t;
  }

  // 數值一樣就算對（例如 6/12 打成 1/2、2.50 打成 2.5）
  function valueOf(s) {
    const t = normAns(s);
    let m = t.match(/^(\d+)\/(\d+)$/);
    if (m) return +m[2] ? +m[1] / +m[2] : NaN;
    return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
  }
  function sameAns(input, ans) {
    const a = normAns(input), b = normAns(ans);
    if (a === b) return true;
    // 分數題要打分數；小數題要打小數（避免用另一種寫法亂猜）
    if (/\//.test(b) !== /\//.test(a)) return false;
    const x = valueOf(a), y = valueOf(b);
    return isFinite(x) && isFinite(y) && Math.abs(x - y) < 1e-9;
  }

  // ── 狀態 ──
  let pane = null, api = null, view = 'home', run = null, last = null, openGroup = null, speak = false;
  function todayStr() { const d = new Date(); const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }
  function data() {
    const st = api.getState();
    if (!st.mathc || typeof st.mathc !== 'object' || Array.isArray(st.mathc)) st.mathc = {};
    const m = st.mathc;
    ['prog', 'best', 'days', 'weak'].forEach(k => { if (!m[k] || typeof m[k] !== 'object' || Array.isArray(m[k])) m[k] = {}; });
    return m;
  }
  function today() {
    const m = data(), d = todayStr();
    if (!m.days[d] || typeof m.days[d] !== 'object') m.days[d] = { xp: 0, plays: {}, ok: 0, wrong: 0, ms: 0 };
    if (!m.days[d].plays || typeof m.days[d].plays !== 'object') m.days[d].plays = {};
    Object.keys(m.days).sort().slice(0, -30).forEach(k => { delete m.days[k]; });
    return m.days[d];
  }
  function stars(id) { return Math.max(0, Math.min(3, +data().prog[id] || 0)); }
  function maxMasteredGrade() { let g = 0; COURSES.forEach(c => { if (stars(c.id) >= 3) g = Math.max(g, c.gr); }); return g; }
  function tooEasy(c) { return c.gr <= maxMasteredGrade() - 2; }

  // ── 一回 ──
  function startCourse(id) {
    const c = BY_ID[id];
    if (!c) return false;
    const qs = [], seen = new Set();
    for (let t = 0; qs.length < ROUND_N && t < 400; t++) {
      const q = c.gen();
      if (!q || !q.a || seen.has(q.q)) continue;
      seen.add(q.q); qs.push(q);
    }
    while (qs.length < ROUND_N) qs.push(c.gen());
    pad.acts = []; pad.cur = null;
    run = { c, qs, i: 0, input: '', fin: { w: '', n: '', d: '' }, box: 'd', tries: 0, firstOk: 0, fixed: 0, wrong: 0, fast: 0, started: Date.now(), qAt: Date.now(), activeMs: 0, msg: '', hint: '', reveal: '', lock: false, wrongList: [] };
    view = 'play';
    render();
    // 手機上題目在狗狗卡片下面：開始時捲到題目
    try { if (pane && window.innerWidth < 900) { const sc = document.body; const y = Math.max(0, pane.getBoundingClientRect().top + (sc.scrollTop || window.scrollY) - 110); sc.scrollTo({ top: y, behavior: 'smooth' }); window.scrollTo({ top: y, behavior: 'smooth' }); } } catch (e) { /* 忽略 */ }
    sayQ();
    return true;
  }
  function cur() { return run && run.qs[run.i]; }
  function sayQ() {
    if (!speak || !run || !window.speechSynthesis) return;
    try {
      const q = cur();
      const t = (q.say || q.q).replace(/＝ ？$/, '等於多少').replace(/□/g, '多少').replace(/×/g, '乘').replace(/÷/g, '除以').replace(/＋/g, '加').replace(/－/g, '減').replace(/＝/g, '等於').replace(/(\d+)又(\d+)\/(\d+)/g, '$1又$3分之$2').replace(/(\d+)\/(\d+)/g, '$2分之$1').replace(/？/g, '多少');
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'zh-TW'; u.rate = 1;
      window.speechSynthesis.speak(u);
    } catch (e) { /* 忽略 */ }
  }
  const BOXES = ['w', 'n', 'd'];
  function typeFrac(k) {
    const f = run.fin;
    if (k === 'enter') return submit(true);
    if (/^box:[wnd]$/.test(k)) { run.box = k.slice(4); paintInput(); return 'box'; }
    if (k === 'next') { run.box = BOXES[(BOXES.indexOf(run.box) + 1) % 3]; paintInput(); return 'box'; }
    if (k === 'prev') { run.box = BOXES[(BOXES.indexOf(run.box) + 2) % 3]; paintInput(); return 'box'; }
    if (k === '/') { run.box = 'd'; paintInput(); return 'box'; }
    if (k === 'back') {
      if (!f[run.box] && run.box !== 'w') run.box = BOXES[BOXES.indexOf(run.box) - 1];
      f[run.box] = f[run.box].slice(0, -1); paintInput(); return 'back';
    }
    if (!/^[0-9]$/.test(k) || f[run.box].length >= 3) return 'ignored';
    f[run.box] += k;
    paintInput();
    return 'typed';
  }
  function typeKey(k) {
    if (view !== 'play' || !run || run.lock) return 'ignored';
    if (cur().fr) return typeFrac(k);
    if (k === 'back') { run.input = run.input.slice(0, -1); paintInput(); return 'back'; }
    if (k === 'enter') return submit(true);
    if (!/^[0-9./]$/.test(k)) return 'ignored';
    if (run.input.length >= 12) return 'ignored';
    run.input += k;
    paintInput();
    // 打到跟答案一樣長，就自動檢查（打對直接過；打錯算一次）
    if (normAns(run.input).length >= cur().a.length && !/[./]$/.test(run.input)) return submit(false);
    return 'typed';
  }
  function submit(byEnter) {
    const q = cur();
    let jf = null;
    if (q.fr) {
      jf = judgeFrac(run.fin, q);
      if (jf.skip !== undefined) { if (jf.skip) { run.msg = jf.skip; paintAll(); } return 'ignored'; }
    } else if (!run.input) return 'ignored';
    const now = Date.now();
    if (jf ? jf.ok : sameAns(run.input, q.a)) {
      const spent = now - run.qAt;
      run.activeMs += Math.min(60000, spent);
      if (run.tries === 0) { run.firstOk += 1; if (spent < FAST_MS) run.fast += 1; } else run.fixed += 1;
      run.lock = true; run.msg = run.tries === 0 ? pick(['✔ 答對了！', '✔ 好厲害！', '✔ 正確！']) : '✔ 訂正成功！';
      if (jf && jf.note) run.msg += jf.note;
      paintAll();
      setTimeout(next, jf && jf.note ? 2400 : run.tries === 0 ? 350 : 700);
      return 'ok';
    }
    if (!jf && !byEnter && normAns(run.input).length < q.a.length) return 'typed';
    run.tries += 1;
    if (run.tries === 1) {
      run.hint = q.hint || '再看一次題目，一步一步算';
      run.msg = '再想一想，看下面的 💡 提示';
      run.input = ''; run.fin = { w: '', n: '', d: '' }; run.box = 'd';
      paintAll();
      return 'miss';
    }
    // 第二次也錯：公布答案，換下一題
    run.wrong += 1;
    run.activeMs += Math.min(60000, now - run.qAt);
    run.wrongList.push(`${q.q.replace(/ ？(（[^）]*）)?$/, '')} ${q.a}`);
    run.reveal = `答案是 ${q.a}` + (q.fr && q.v.d > 1 && q.v.n > q.v.d && !q.form ? `（也可以寫成 ${q.v.n}/${q.v.d}）` : '');
    run.msg = '沒關係，記起來就好';
    run.lock = true;
    paintAll();
    setTimeout(next, q.fr ? 2600 : 1800);
    return 'wrong';
  }
  function next() {
    if (!run) return;
    run.i += 1; run.input = ''; run.fin = { w: '', n: '', d: '' }; run.box = 'd'; run.tries = 0; run.msg = ''; run.hint = ''; run.reveal = ''; run.lock = false; run.qAt = Date.now();
    if (run.i >= ROUND_N) { finish(); return; }
    render();
    sayQ();
  }
  function finish() {
    const c = run.c, m = data(), d = today();
    const sec = Math.round((Date.now() - run.started) / 1000);
    const target = c.t * ROUND_N;
    const fast = run.fast >= FAST_LIMIT;
    const done = run.firstOk + run.fixed;
    let s = 0;
    if (run.firstOk === ROUND_N && sec <= target && !fast) s = 3;
    else if (done === ROUND_N) s = 2;
    else if (done >= 8) s = 1;
    const best = stars(c.id);
    const plays = (d.plays[c.id] || 0) + 1;
    d.plays[c.id] = plays;
    d.ok += run.firstOk; d.wrong += run.wrong; d.ms += run.activeMs;
    let xp = 0, gotStars = 0, note = '';
    const left = Math.max(0, DAY_XP_CAP - (d.xp || 0));
    if (s > best) {
      gotStars = s - best;
      m.prog[c.id] = s;
      xp = 8 + c.gr * 2;
      note = best ? `進步了！從 ${best} 顆星變成 ${s} 顆星` : '過關了！';
    } else if (s > 0) {
      if (tooEasy(c)) note = '這門課對你來說太簡單了，挑戰難一點的課程才會有經驗值喔！';
      else if (plays > REPLAY_PER_DAY) note = `這門課今天已經練 ${REPLAY_PER_DAY} 次了，再練不會加經驗值（還是可以練習）`;
      else { xp = 2 + c.gr; note = '再練一次，算得更熟了！'; }
    } else note = '再試一次！答錯的題目看看 💡 提示的方法。';
    if (xp > left) { xp = left; if (!left) note = `今天心算的經驗值已經滿了（${DAY_XP_CAP}），明天再來！還是可以練習。`; }
    d.xp = (d.xp || 0) + xp;
    if (!m.best[c.id] || (s >= 2 && sec < m.best[c.id])) { if (s >= 2) m.best[c.id] = sec; }
    if (fast) note = '有好幾題答得太快了，要真的算過喔！這一回最多 2 顆星。' + (note ? ' ' + note : '');
    const acc = Math.round(done / ROUND_N * 100);
    let treat = 0;
    try { if (window.PuppyTyping && window.PuppyTyping._t && window.PuppyTyping._t.creditSerious) treat = window.PuppyTyping._t.creditSerious(run.activeMs, acc, fast ? 3 : 0); } catch (e) { /* 忽略 */ }
    last = { c, s, best, sec, target, firstOk: run.firstOk, fixed: run.fixed, wrong: run.wrong, xp, gotStars, note, wrongList: run.wrongList.slice(0, 6), treat };
    run = null;
    view = 'result';
    if (api.mathCorrect) api.mathCorrect(last.firstOk);
    api.save();
    if (xp > 0 || gotStars > 0) api.award(xp, gotStars, 'math', `心算：${c.name}`);
    render();
  }


  // ── v3.20.0：計算紙（作答畫面右邊的手寫區）──
  // 筆跡記在 pad.acts（換題目重畫，不會不見）；寬度比例記在 localStorage
  const PAD_COLORS = { black: '#222222', red: '#d62828', blue: '#1d5fd1' };
  const pad = { acts: [], tool: 'black', frac: 0.38, cur: null, ro: null };
  try { const f = parseFloat(localStorage.getItem('puppy_math_pad_w')); if (f >= 0.2 && f <= 0.7) pad.frac = f; } catch (e) { /* 忽略 */ }
  function padHtml() {
    const tb = (k, label, cls) => `<button type="button" class="mc-sc-btn${cls ? ' ' + cls : ''}${pad.tool === k ? ' on' : ''}" data-pad="${k}">${label}</button>`;
    return `<div class="mc-divider" id="mcDiv" title="左右拖曳，調整計算紙大小"><span></span></div>
      <div class="mc-scratch" id="mcScratch">
        <div class="mc-sc-label">計算紙</div>
        <div class="mc-sc-tools">${tb('black', '<i style="background:#222"></i>黑筆')}${tb('red', '<i style="background:#d62828"></i>紅筆')}${tb('blue', '<i style="background:#1d5fd1"></i>藍筆')}${tb('eraser', '🧽 橡皮擦')}${tb('undo', '↶ 復原', 'act')}${tb('clear', '🗑 整個清除', 'act')}</div>
        <div class="mc-sc-wrap"><canvas class="mc-sc-canvas" id="mcCanvas"></canvas></div>
      </div>`;
  }
  function padDraw(ctx, a) {
    if (!a.pts.length) return;
    ctx.save();
    ctx.globalCompositeOperation = a.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = ctx.fillStyle = a.tool === 'eraser' ? '#000' : PAD_COLORS[a.tool];
    ctx.lineWidth = a.tool === 'eraser' ? 26 : 3;
    ctx.lineCap = ctx.lineJoin = 'round';
    const p = a.pts;
    if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0][0], p[0][1], ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.stroke(); }
    ctx.restore();
  }
  function padRedraw() {
    const cv = pane && pane.querySelector('#mcCanvas');
    if (!cv) return;
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let start = 0;
    pad.acts.forEach((a, i) => { if (a.clear) start = i + 1; });
    pad.acts.slice(start).forEach(a => padDraw(ctx, a));
  }
  function padApplyWidth() {
    const sc = pane && pane.querySelector('#mcScratch');
    if (sc) sc.style.flexBasis = (pad.frac * 100).toFixed(1) + '%';
  }
  function padTool(k) {
    if (k === 'undo') { pad.acts.pop(); padRedraw(); return; }
    if (k === 'clear') { if (pad.acts.length && !pad.acts[pad.acts.length - 1].clear) pad.acts.push({ clear: true }); padRedraw(); return; }
    pad.tool = k;
    pane.querySelectorAll('.mc-sc-btn[data-pad]').forEach(b => b.classList.toggle('on', b.dataset.pad === k));
  }
  function initPad() {
    const cv = pane && pane.querySelector('#mcCanvas');
    if (!cv) return;
    padApplyWidth();
    pane.querySelectorAll('.mc-sc-btn').forEach(b => {
      b.addEventListener('pointerdown', ev => ev.preventDefault());   // 不搶走焦點，Enter 還是送出答案
      b.addEventListener('click', ev => { ev.preventDefault(); padTool(b.dataset.pad); });
    });
    const pos = ev => { const r = cv.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
    cv.addEventListener('pointerdown', ev => {
      if (pad.cur) return;                                            // 一次一筆（手掌碰到不會亂畫）
      ev.preventDefault();
      try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* 忽略 */ }
      pad.cur = { tool: pad.tool, pts: [pos(ev)], id: ev.pointerId };
      pad.acts.push(pad.cur);
      padDraw(cv.getContext('2d'), pad.cur);
    });
    cv.addEventListener('pointermove', ev => {
      if (!pad.cur || ev.pointerId !== pad.cur.id) return;
      ev.preventDefault();
      const evs = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [ev];
      const ctx = cv.getContext('2d');
      (evs.length ? evs : [ev]).forEach(e => {
        const p = pos(e), last = pad.cur.pts[pad.cur.pts.length - 1];
        pad.cur.pts.push(p);
        padDraw(ctx, { tool: pad.cur.tool, pts: [last, p] });
      });
    });
    const end = ev => { if (pad.cur && ev.pointerId === pad.cur.id) { delete pad.cur.id; pad.cur = null; } };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('touchmove', ev => ev.preventDefault(), { passive: false });   // 畫圖時頁面不捲動
    // 分隔線：左右拖曳調整寬度
    const dv = pane.querySelector('#mcDiv'), sp = pane.querySelector('.mc-split');
    if (dv && sp) {
      let drag = null;
      dv.addEventListener('pointerdown', ev => { ev.preventDefault(); drag = ev.pointerId; try { dv.setPointerCapture(ev.pointerId); } catch (e) { /* 忽略 */ } dv.classList.add('on'); });
      dv.addEventListener('pointermove', ev => {
        if (drag !== ev.pointerId) return;
        ev.preventDefault();
        const r = sp.getBoundingClientRect();
        pad.frac = Math.max(0.2, Math.min(0.7, (r.width - 270) / r.width, (r.right - ev.clientX) / r.width));   // 題目區至少留 270px
        padApplyWidth(); padRedraw();
      });
      const stop = ev => { if (drag !== ev.pointerId) return; drag = null; dv.classList.remove('on'); try { localStorage.setItem('puppy_math_pad_w', pad.frac.toFixed(3)); } catch (e) { /* 忽略 */ } };
      dv.addEventListener('pointerup', stop);
      dv.addEventListener('pointercancel', stop);
      dv.addEventListener('touchmove', ev => ev.preventDefault(), { passive: false });
    }
    if (window.ResizeObserver) { if (pad.ro) pad.ro.disconnect(); pad.ro = new ResizeObserver(() => padRedraw()); pad.ro.observe(cv); }
    padRedraw();
  }

  // ── 畫面 ──
  const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  function homeHtml() {
    const d = today();
    const mg = maxMasteredGrade();
    const doneN = COURSES.filter(c => stars(c.id) > 0).length;
    return `
      <div class="card-box">
        <div class="section-title"><span>🧮 心算挑戰</span><span class="ty-today-pill">今天心算經驗值 ${d.xp || 0}／${DAY_XP_CAP}</span></div>
        <p class="section-sub">自己挑一門課，一回 10 題。答錯會出現 <b>💡 提示</b>，再答一次。<b>一次就全對、又在時間內</b>可以拿 3 顆星。<br>
          每門課的星星最多 3 顆；同一門課每天重複練習最多 ${REPLAY_PER_DAY} 次有經驗值${mg >= 3 ? `；比你已經精熟的程度（${mg} 年級）簡單兩級以上的課，重複練習不加經驗值` : ''}。</p>
        <div class="mc-tools"><label class="mc-speak"><input type="checkbox" id="mcSpeak" ${speak ? 'checked' : ''}> 🔊 唸出題目</label><span class="section-sub" style="margin:0;">已經過關 ${doneN}／${COURSES.length} 門課</span></div>
        ${GROUPS.map(([g, label]) => {
          const list = COURSES.filter(c => c.g === g);
          const got = list.reduce((s, c) => s + stars(c.id), 0);
          const open = openGroup === g || (openGroup === null && g === 'add');
          return `<details class="mc-group" data-g="${g}" ${open ? 'open' : ''}><summary><span>${label}</span><span class="mc-gstar">⭐ ${got}／${list.length * 3}</span></summary>
            <div class="mc-list">${list.map(c => {
              const s = stars(c.id), easy = s > 0 && tooEasy(c);
              return `<button class="mc-course${s >= 3 ? ' done' : s ? ' some' : ''}" data-course="${c.id}">
                <span class="mc-gr">約 ${c.gr} 年級</span><span class="mc-name">${esc(c.name)}</span>
                <span class="mc-stars">${starStr(s)}</span>${easy ? '<span class="mc-easy">太簡單了</span>' : ''}</button>`;
            }).join('')}</div></details>`;
        }).join('')}
      </div>`;
  }
  function playHtml() {
    const q = cur();
    const dots = run.qs.map((_, i) => `<span class="mc-dot${i < run.i ? ' done' : i === run.i ? ' cur' : ''}"></span>`).join('');
    return `
      <div class="card-box mc-play">
        <div class="mc-top"><b>${esc(run.c.name)}</b><span class="mc-dots">${dots}</span><span class="mc-time" id="mcTime">0 秒</span><button class="btn btn-soft mc-quit" id="mcQuit">結束</button></div>
<div class="mc-split"><div class="mc-main">
        <div class="mc-q${q.fr ? ' frq' : ''}" id="mcQ">${fracHtml(q.q)}</div>
        ${q.fr ? `<div class="mc-fin" id="mcFin"><button class="mc-box w" data-k="box:w" data-ph="整數"></button>
          <span class="mc-fstack"><button class="mc-box n" data-k="box:n" data-ph="分子"></button><span class="mc-fbar"></span><button class="mc-box d" data-k="box:d" data-ph="分母"></button></span></div>` : '<div class="mc-in" id="mcIn"></div>'}
        <div class="mc-msg" id="mcMsg"></div>
        <div class="mc-hint" id="mcHint" hidden></div>
        <div class="mc-pad">${(q.fr ? ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'] : ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '/']).map(k => `<button class="mc-key" data-k="${k}">${k}</button>`).join('')}
          ${q.fr ? '<button class="mc-key nextk" data-k="next">➜ 下一格</button>' : ''}<button class="mc-key back" data-k="back">⌫</button><button class="mc-key ok${q.fr ? ' wide' : ''}" data-k="enter">✔ 確定</button></div>
        <p class="section-sub mc-tip">${q.fr ? '點一下格子就能換格（或按「➜ 下一格」）。<b>帶分數</b>：三格都填；<b>假分數、真分數</b>：整數格空白；答案是整數就只填整數格。<br>電腦：Tab 或空白鍵換格、/ 跳到分母、Enter 確定。' : '可以用鍵盤打數字，按 Enter 確定。分數打成 3/7，小數打成 2.5。'}</p>
        </div>${padHtml()}</div>
      </div>`;
  }
  function resultHtml() {
    const r = last;
    return `
      <div class="card-box ty-result">
        <h2>🧮 ${esc(r.c.name)}</h2>
        <div class="ty-stars-big">${starStr(r.s)}</div>
        <div class="ty-result-grid">
          <div><b>${r.firstOk}</b><span>一次就答對</span></div>
          <div><b>${r.fixed}</b><span>看提示後訂正</span></div>
          <div><b>${r.wrong}</b><span>沒答對</span></div>
          <div><b>${r.sec} 秒</b><span>用時（3 星要 ${r.target} 秒內）</span></div>
        </div>
        <p class="ty-note">${esc(r.note)}</p>
        ${r.xp ? `<p class="section-sub">獲得 +${r.xp} 經驗值${r.gotStars ? `、+${r.gotStars}⭐` : ''}</p>` : ''}
        ${r.treat ? `<p class="ty-treat">🦴 認真學習滿 5 分鐘！狗狗吃到骨頭餅乾（飽足 +15、親密度 +2）</p>` : ''}
        ${r.wrongList.length ? `<div class="mc-wrong"><b>📝 記起來：</b>${r.wrongList.map(w => `<div>${fracHtml(w)}</div>`).join('')}</div>` : ''}
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px;">
          <button class="btn btn-soft" id="mcHome">回到課程</button>
          <button class="btn btn-orange" id="mcAgain">🔁 再挑戰一次</button>
        </div>
      </div>`;
  }
  function paintInput() {
    const el = pane && pane.querySelector('#mcIn'); if (el) el.textContent = run && run.input ? run.input : ' ';
    const fe = pane && pane.querySelector('#mcFin');
    if (fe && run) BOXES.forEach(b => { const x = fe.querySelector('.mc-box.' + b); if (x) { x.textContent = run.fin[b]; x.classList.toggle('on', run.box === b && !run.lock); } });
  }
  function paintAll() {
    if (!pane || !run) return;
    paintInput();
    const m = pane.querySelector('#mcMsg'); if (m) { m.innerHTML = fracHtml(run.reveal ? `${run.msg}　${run.reveal}` : run.msg); m.className = 'mc-msg' + (run.lock && !run.reveal ? ' ok' : run.reveal ? ' bad' : run.msg ? ' warn' : ''); }
    const h = pane.querySelector('#mcHint'); if (h) { h.hidden = !run.hint; h.innerHTML = run.hint ? fracHtml('💡 ' + run.hint) : ''; }
  }
  function render() {
    if (!pane) return;
    pane.innerHTML = view === 'play' && run ? playHtml() : view === 'result' && last ? resultHtml() : homeHtml();
    const on = (sel, fn) => { const el = pane.querySelector(sel); if (el) el.addEventListener('click', fn); };
    pane.querySelectorAll('[data-course]').forEach(b => b.addEventListener('click', () => startCourse(b.dataset.course)));
    pane.querySelectorAll('details.mc-group').forEach(dt => dt.addEventListener('toggle', () => { if (dt.open) openGroup = dt.dataset.g; }));
    const sp = pane.querySelector('#mcSpeak'); if (sp) sp.addEventListener('change', () => { speak = sp.checked; try { localStorage.setItem('puppy_math_speak', speak ? '1' : '0'); } catch (e) { /* 忽略 */ } });
    pane.querySelectorAll('.mc-key, .mc-box').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); typeKey(b.dataset.k); }));
    on('#mcQuit', () => { if (confirm('要結束這一回嗎？這一回不會記錄。')) { run = null; view = 'home'; render(); } });
    on('#mcHome', () => { view = 'home'; render(); });
    on('#mcAgain', () => startCourse(last.c.id));
    if (view === 'play') { paintAll(); initPad(); }
    try { if (api && api.focus) api.focus(); } catch (e) { /* 忽略 */ }   // 作答時狗狗到角落，不擋按鍵
  }
  function onKey(ev) {
    if (!pane || !pane.getClientRects().length || view !== 'play' || !run) return;
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    let k = null;
    if (/^[0-9]$/.test(ev.key)) k = ev.key;
    else if (ev.key === '.' || ev.key === '/' ) k = ev.key;
    else if (ev.key === 'Backspace') k = 'back';
    else if (ev.key === 'Enter') k = 'enter';
    else if (cur() && cur().fr && (ev.key === 'Tab' || ev.key === ' ' || ev.key === 'ArrowRight')) k = ev.shiftKey && ev.key === 'Tab' ? 'prev' : 'next';
    else if (cur() && cur().fr && ev.key === 'ArrowLeft') k = 'prev';
    if (!k) return;
    ev.preventDefault();
    typeKey(k);
  }
  let ticker = 0;
  window.PuppyMath = {
    isPlaying() { return view === 'play' && !!run; },
    mount(el, hooks) {
      pane = el; api = hooks;
      try { speak = localStorage.getItem('puppy_math_speak') === '1'; } catch (e) { speak = false; }
      window.addEventListener('keydown', onKey);
      if (!ticker) ticker = setInterval(() => { if (view === 'play' && run && pane) { const t = pane.querySelector('#mcTime'); if (t) t.textContent = Math.round((Date.now() - run.started) / 1000) + ' 秒'; } }, 500);
    },
    show() { render(); },
    hide() { },
    COURSES, GROUPS,
    _t: { pad: () => pad, startCourse, typeKey, normAns, sameAns, judgeFrac, fracHtml, mixStr, fr, data, today, stars, tooEasy, maxMasteredGrade, BY_ID, run: () => run, last: () => last, view: () => view, DAY_XP_CAP, REPLAY_PER_DAY, finishNow: () => finish(), setView: v => { view = v; } }
  };
})();
