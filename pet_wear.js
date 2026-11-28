// -*- coding: utf-8 -*-
// 《汪汪小精靈 學習小伙伴》網頁版 —— v3.22.0「🎀 寵物裝飾（衣櫃）」
// 頭上、臉上、脖子三個位置可以同時各戴一樣。圖鑑、左邊狗狗區、寵物卡、畫面上走動的狗狗都用這裡畫，
// 所以換夥伴、換裝飾，各處一起變。裝飾全部畫在原本的 canvas 上，不加任何網頁元素，不會擋到拖曳狗狗。
//
// 存檔（都在 state.pets 裡，所以會進簽章、搬家碼、備份檔、雲端同步）：
//   pets.wear   = { head: 'crown', face: 'none', neck: 'none' }   目前戴著的
//   pets.closet = { 'bow': '2026-11-28', ... }                     用星星買的、節日領的（永久擁有）
//   pets.acc    = 跟著 wear 的其中一樣（舊版網頁只認得這一格，留著相容）
//
// 解鎖：原本的 4 樣看狗狗親密度（不變）；新裝飾用星星「買一次永久擁有」；
//       聖誕、新年裝飾是節日限定禮物：節日期間「當天有學習」就能免費領，領了永久擁有。
(function () {
  'use strict';

  const SLOTS = [['head', '頭上'], ['face', '臉上'], ['neck', '脖子']];

  // [代號, 圖示, 名稱, 位置, 解鎖方式, 數值]
  //   lv：狗狗最高親密度  star：星星價格（買一次永久）  xmas／ny：節日限定（免費領）
  const CATALOG = [
    ['grad_cap', '🎓', '博士帽', 'head', 'lv', 2],
    ['sunglasses', '🕶️', '酷墨鏡', 'face', 'lv', 3],
    ['scarf', '🧣', '紅領巾', 'neck', 'lv', 4],
    ['crown', '👑', '小皇冠', 'head', 'lv', 6],

    ['bow', '🎀', '粉紅蝴蝶結', 'head', 'star', 10],
    ['round_glasses', '👓', '圓框眼鏡', 'face', 'star', 10],
    ['bowtie', '👔', '紳士領結', 'neck', 'star', 12],
    ['party_hat', '🥳', '派對帽', 'head', 'star', 15],
    ['cap', '🧢', '棒球帽', 'head', 'star', 15],
    ['heart_glasses', '💖', '愛心眼鏡', 'face', 'star', 18],
    ['flower_crown', '🌸', '小花圈', 'head', 'star', 20],
    ['bunny_ears', '🐰', '兔耳朵', 'head', 'star', 22],
    ['medal', '🏅', '金牌', 'neck', 'star', 25],
    ['magic_hat', '🎩', '魔術師帽', 'head', 'star', 28],
    ['unicorn', '🦄', '獨角獸角', 'head', 'star', 35],

    ['santa_hat', '🎅', '聖誕帽', 'head', 'xmas', 0],
    ['antlers', '🦌', '麋鹿角', 'head', 'xmas', 0],
    ['star_glasses', '⭐', '聖誕星星眼鏡', 'face', 'xmas', 0],
    ['xmas_scarf', '🎄', '聖誕條紋圍巾', 'neck', 'xmas', 0],

    ['fu', '🧧', '「福」字髮飾', 'head', 'ny', 0],
    ['lantern', '🏮', '小燈籠', 'head', 'ny', 0],
    ['gold_party', '🎊', '新年金色派對帽', 'head', 'ny', 0],
    ['red_envelope', '🧧', '紅包項鍊', 'neck', 'ny', 0]
  ];
  const BY_ID = {};
  CATALOG.forEach(r => { BY_ID[r[0]] = r; });

  // 節日期間（月日，含頭尾）。聖誕：11/25～12/31；新年（元旦＋農曆春節）：12/31～2/28
  const SEASONS = {
    xmas: { name: '聖誕節', icon: '🎄', from: '11-25', to: '12-31', when: '每年 11/25～12/31' },
    ny: { name: '新年', icon: '🧧', from: '12-31', to: '02-28', when: '每年 12/31～隔年 2/28' }
  };
  function inSeason(key, day) {
    const s = SEASONS[key];
    if (!s || !day) return false;
    const md = String(day).slice(5, 10);
    return s.from <= s.to ? (md >= s.from && md <= s.to) : (md >= s.from || md <= s.to);
  }

  // ── 存檔 ───────────────────────────────────────────────
  function normalize(pets) {
    if (!pets || typeof pets !== 'object') return;
    if (!pets.closet || typeof pets.closet !== 'object' || Array.isArray(pets.closet)) pets.closet = {};
    let w = pets.wear;
    if (!w || typeof w !== 'object' || Array.isArray(w)) {
      // 舊存檔：只有 pets.acc 一格，放進它所屬的位置
      w = {};
      const old = BY_ID[pets.acc];
      if (old) w[old[3]] = old[0];
    }
    const out = {};
    SLOTS.forEach(([slot]) => {
      const id = w[slot];
      out[slot] = BY_ID[id] && BY_ID[id][3] === slot ? id : 'none';
    });
    pets.wear = out;
    syncAcc(pets);
  }
  function syncAcc(pets) {
    const w = pets.wear || {};
    pets.acc = w.head !== 'none' ? w.head : w.face !== 'none' ? w.face : w.neck !== 'none' ? w.neck : 'none';
  }
  function worn(pets) {
    if (!pets) return {};
    if (!pets.wear) normalize(pets);
    return pets.wear || {};
  }

  // 這一樣現在能不能戴：回傳 ['ok'] 或 ['lv', 需要等級] ['star', 價格] ['season', 節日鍵] ['claim', 節日鍵]
  function status(id, info) {
    const r = BY_ID[id];
    if (!r) return ['none'];
    const [, , , , how, val] = r;
    const owned = info.vip || !!(info.closet && info.closet[id]);
    if (how === 'lv') return info.lv >= val || info.vip ? ['ok'] : ['lv', val];
    if (owned) return ['ok'];
    if (how === 'star') return ['star', val];
    if (!inSeason(how, info.today)) return ['season', how];
    return info.learnedToday ? ['claim', how] : ['claim_wait', how];
  }

  // ── 繪圖 ───────────────────────────────────────────────
  // A：hx, top（頭頂中間）、u（頭的半徑）、ex, ey（眼睛；正面是兩眼中間）、gap（兩眼距離，側面 0）、
  //    nx, ny（脖子）、dir（側面朝向 ±1；正面 0）、back（側面時頭頂往後一點的位置用）
  const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  function emoji(ctx, ch, x, y, size) {
    ctx.font = `${Math.max(6, Math.round(size))}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, y);
  }
  function outline(ctx, w) { ctx.lineWidth = w; ctx.strokeStyle = '#4a3b32'; ctx.stroke(); }

  function cone(ctx, x, y, u, tilt, cols, pom) {
    // 派對帽：底寬 0.95u、高 1.15u，斜條紋，頂端小球
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    const w = 0.48 * u, h = 1.15 * u;
    ctx.beginPath();
    ctx.moveTo(-w, 0); ctx.lineTo(0, -h); ctx.lineTo(w, 0);
    ctx.quadraticCurveTo(0, 0.18 * u, -w, 0);
    ctx.closePath();
    ctx.fillStyle = cols[0];
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = cols[1];
    ctx.lineWidth = 0.16 * u;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(-w * 1.4, -h * (0.15 + 0.28 * (k + 2)) + 0.25 * u);
      ctx.lineTo(w * 1.4, -h * (0.15 + 0.28 * (k + 2)) - 0.25 * u);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-w, 0); ctx.lineTo(0, -h); ctx.lineTo(w, 0);
    ctx.quadraticCurveTo(0, 0.18 * u, -w, 0);
    outline(ctx, Math.max(1, 0.07 * u));
    ctx.beginPath();
    ctx.arc(0, -h, 0.17 * u, 0, Math.PI * 2);
    ctx.fillStyle = pom;
    ctx.fill();
    outline(ctx, Math.max(1, 0.05 * u));
    ctx.restore();
  }

  function santa(ctx, x, y, u, side) {
    // 聖誕帽：紅色彎彎的帽子，尖端往後垂，白色毛邊和白球
    ctx.save();
    ctx.translate(x, y);
    const s = side || 1;
    ctx.beginPath();
    ctx.moveTo(-0.62 * u, 0);
    ctx.bezierCurveTo(-0.55 * u, -0.9 * u, 0.2 * u * s, -1.25 * u, 0.85 * u * s, -0.55 * u);
    ctx.bezierCurveTo(0.45 * u * s, -0.75 * u, 0.5 * u, -0.4 * u, 0.62 * u, 0);
    ctx.closePath();
    ctx.fillStyle = '#e53935';
    ctx.fill();
    outline(ctx, Math.max(1, 0.07 * u));
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.72 * u, 0.2 * u, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    outline(ctx, Math.max(1, 0.05 * u));
    ctx.beginPath();
    ctx.arc(0.88 * u * s, -0.52 * u, 0.19 * u, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    outline(ctx, Math.max(1, 0.05 * u));
    ctx.restore();
  }

  function antlers(ctx, x, y, u, dir) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#8d5a2b';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, 0.16 * u);
    const one = (sx, k) => {
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.quadraticCurveTo(sx + 0.15 * u * k, -0.7 * u, sx + 0.45 * u * k, -1.1 * u);
      ctx.moveTo(sx + 0.08 * u * k, -0.45 * u);
      ctx.lineTo(sx + 0.45 * u * k, -0.62 * u);
      ctx.moveTo(sx + 0.2 * u * k, -0.82 * u);
      ctx.lineTo(sx - 0.05 * u * k, -1.12 * u);
      ctx.stroke();
    };
    if (dir) { one(-0.28 * u * dir, -dir); one(0.12 * u * dir, -dir * 0.6); }
    else { one(-0.32 * u, -1); one(0.32 * u, 1); }
    ctx.restore();
  }

  function bunny(ctx, x, y, u, dir) {
    ctx.save();
    ctx.translate(x, y);
    const ear = (ox, rot) => {
      ctx.save();
      ctx.translate(ox, -0.55 * u);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.22 * u, 0.62 * u, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      outline(ctx, Math.max(1, 0.06 * u));
      ctx.beginPath();
      ctx.ellipse(0, 0.04 * u, 0.11 * u, 0.45 * u, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f8a5c2';
      ctx.fill();
      ctx.restore();
    };
    if (dir) { ear(-0.3 * u * dir, -0.35 * dir); ear(0.05 * u * dir, -0.12 * dir); }
    else { ear(-0.3 * u, -0.2); ear(0.3 * u, 0.2); }
    // 髮箍
    ctx.beginPath();
    ctx.ellipse(0, 0.02 * u, 0.6 * u, 0.16 * u, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = '#f06292';
    ctx.lineWidth = Math.max(1.5, 0.11 * u);
    ctx.stroke();
    ctx.restore();
  }

  function flower(ctx, x, y, r, col) {
    for (let k = 0; k < 5; k++) {
      const a = k * Math.PI * 2 / 5;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.62, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd54f';
    ctx.fill();
  }
  function flowerCrown(ctx, x, y, u, dir) {
    const cols = ['#f48fb1', '#ce93d8', '#81d4fa', '#fff59d', '#f48fb1'];
    ctx.beginPath();
    ctx.ellipse(x, y + 0.08 * u, 0.7 * u, 0.2 * u, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = '#66bb6a';
    ctx.lineWidth = Math.max(1.5, 0.1 * u);
    ctx.stroke();
    for (let k = 0; k < 5; k++) {
      const a = Math.PI + (k + 0.5) * Math.PI / 5;
      flower(ctx, x + Math.cos(a) * 0.7 * u, y + 0.08 * u + Math.sin(a) * 0.22 * u, 0.15 * u, cols[k]);
    }
  }

  function unicorn(ctx, x, y, u, dir) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((dir || 0) * 0.35);
    ctx.beginPath();
    ctx.moveTo(-0.18 * u, 0);
    ctx.lineTo(0, -1.05 * u);
    ctx.lineTo(0.18 * u, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, -1.05 * u);
    g.addColorStop(0, '#ffd54f');
    g.addColorStop(1, '#fff8e1');
    ctx.fillStyle = g;
    ctx.fill();
    outline(ctx, Math.max(1, 0.06 * u));
    ctx.strokeStyle = '#e0a800';
    ctx.lineWidth = Math.max(1, 0.05 * u);
    [0.25, 0.5, 0.72].forEach(f => {
      const w = 0.18 * u * (1 - f);
      ctx.beginPath();
      ctx.moveTo(-w, -1.05 * u * f + 0.06 * u);
      ctx.lineTo(w, -1.05 * u * f - 0.06 * u);
      ctx.stroke();
    });
    ctx.restore();
    flower(ctx, x - 0.32 * u, y + 0.02 * u, 0.12 * u, '#f48fb1');
    flower(ctx, x + 0.32 * u, y + 0.02 * u, 0.12 * u, '#ce93d8');
  }

  function fuCharm(ctx, x, y, u) {
    // 紅色斗方「福」
    ctx.save();
    ctx.translate(x, y - 0.42 * u);
    ctx.rotate(Math.PI / 4);
    const s = 0.42 * u;
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.strokeStyle = '#ffca28';
    ctx.lineWidth = Math.max(1, 0.08 * u);
    ctx.strokeRect(-s, -s, s * 2, s * 2);
    ctx.restore();
    ctx.fillStyle = '#ffd54f';
    ctx.font = `bold ${Math.max(7, Math.round(0.55 * u))}px "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('福', x, y - 0.4 * u);
  }

  // 眼鏡：kind = round 圓框、heart 愛心、star 星星
  function lensPath(ctx, kind, x, y, r) {
    ctx.beginPath();
    if (kind === 'heart') {
      ctx.moveTo(x, y + r * 0.9);
      ctx.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.7, y - r * 1.2, x, y - r * 0.4);
      ctx.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.5, y - r * 0.1, x, y + r * 0.9);
    } else if (kind === 'star') {
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 5;
        const rr = k % 2 ? r * 0.5 : r * 1.15;
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
        if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath();
    } else {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
  }
  function glasses(ctx, kind, A) {
    const fills = { round: 'rgba(200,230,255,0.35)', heart: 'rgba(255,64,129,0.75)', star: 'rgba(255,202,40,0.8)' };
    const frames = { round: '#5d4037', heart: '#c2185b', star: '#e65100' };
    const u = A.u;
    const r = A.dir ? 0.3 * u : 0.24 * u;
    const lw = Math.max(1.2, 0.08 * u);
    const pts = A.dir ? [[A.ex, A.ey]] : [[A.ex - A.gap / 2, A.ey], [A.ex + A.gap / 2, A.ey]];
    ctx.save();
    pts.forEach(([x, y]) => {
      lensPath(ctx, kind, x, y, r);
      ctx.fillStyle = fills[kind];
      ctx.fill();
      ctx.lineWidth = lw;
      ctx.strokeStyle = frames[kind];
      ctx.stroke();
    });
    ctx.beginPath();
    if (A.dir) {   // 側面：一片鏡片，加一根鏡腳往耳朵
      ctx.moveTo(A.ex - A.dir * r, A.ey - r * 0.2);
      ctx.lineTo(A.ex - A.dir * 0.95 * u, A.ey - 0.25 * u);
    } else {
      ctx.moveTo(A.ex - A.gap / 2 + r * 0.95, A.ey - r * 0.15);
      ctx.quadraticCurveTo(A.ex, A.ey - r * 0.6, A.ex + A.gap / 2 - r * 0.95, A.ey - r * 0.15);
    }
    ctx.lineWidth = lw;
    ctx.strokeStyle = frames[kind];
    ctx.stroke();
    ctx.restore();
  }

  function scarf(ctx, A, stripes) {
    const u = A.u;
    const x = A.nx, y = A.ny;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, (A.dir ? 0.45 : 0.62) * u, 0.2 * u, A.dir ? -A.dir * 0.9 : 0, 0, Math.PI * 2);
    ctx.fillStyle = stripes[0];
    ctx.fill();
    outline(ctx, Math.max(1, 0.05 * u));
    // 垂下來的一截
    const tx = x + (A.dir ? A.dir * 0.15 * u : 0.3 * u), ty = y + 0.1 * u;
    ctx.beginPath();
    ctx.rect(tx - 0.12 * u, ty, 0.24 * u, 0.62 * u);
    ctx.fillStyle = stripes[0];
    ctx.fill();
    outline(ctx, Math.max(1, 0.05 * u));
    if (stripes.length > 1) {
      ctx.fillStyle = stripes[1];
      [0.12, 0.36].forEach(f => ctx.fillRect(tx - 0.12 * u, ty + f * u, 0.24 * u, 0.1 * u));
      ctx.fillStyle = stripes[2] || stripes[1];
      ctx.fillRect(tx - 0.12 * u, ty + 0.24 * u, 0.24 * u, 0.06 * u);
    }
    ctx.restore();
  }

  function bowtie(ctx, x, y, u, col) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 0.45 * u, y - 0.22 * u);
    ctx.lineTo(x - 0.45 * u, y + 0.22 * u);
    ctx.closePath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.45 * u, y - 0.22 * u);
    ctx.lineTo(x + 0.45 * u, y + 0.22 * u);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    outline(ctx, Math.max(1, 0.05 * u));
    ctx.beginPath();
    ctx.arc(x, y, 0.1 * u, 0, Math.PI * 2);
    ctx.fillStyle = '#4527a0';
    ctx.fill();
    ctx.restore();
  }

  function pendant(ctx, A, ch, cord) {
    const u = A.u;
    const px = A.nx + (A.dir ? A.dir * 0.12 * u : 0), py = A.ny + 0.45 * u;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(A.nx - (A.dir ? 0.1 : 0.42) * u, A.ny - 0.05 * u);
    ctx.quadraticCurveTo(px, py + 0.05 * u, A.nx + (A.dir ? 0.3 : 0.42) * u, A.ny - 0.05 * u);
    ctx.strokeStyle = cord;
    ctx.lineWidth = Math.max(1.2, 0.08 * u);
    ctx.stroke();
    emoji(ctx, ch, px, py + 0.12 * u, 0.62 * u);
    ctx.restore();
  }

  function drawHead(ctx, id, A) {
    const u = A.hu || A.u, d = A.dir || 0;   // hu：帽子另外的大小（走動的狗狗側面頭比較小，帽子放大一點）
    const x = A.hx, y = A.top;
    switch (id) {
      case 'grad_cap': emoji(ctx, '🎓', x, y - 0.3 * u, 1.25 * u); break;
      case 'crown': emoji(ctx, '👑', x, y - 0.3 * u, 1.25 * u); break;
      case 'bow': emoji(ctx, '🎀', x + (d ? -d * 0.35 : 0.42) * u, y - 0.05 * u, 0.95 * u); break;
      case 'cap': emoji(ctx, '🧢', x, y - 0.2 * u, 1.2 * u); break;
      case 'magic_hat': emoji(ctx, '🎩', x, y - 0.42 * u, 1.3 * u); break;
      case 'lantern': emoji(ctx, '🏮', x + (d ? -d * 0.3 : 0.45) * u, y - 0.25 * u, 0.85 * u); break;
      case 'party_hat': cone(ctx, x, y + 0.05 * u, u, d * -0.25 || 0.18, ['#4fc3f7', '#ffffff'], '#ff7043'); break;
      case 'gold_party': cone(ctx, x, y + 0.05 * u, u, d * -0.25 || -0.15, ['#ffca28', '#e53935'], '#e53935'); emoji(ctx, '✨', x + 0.6 * u, y - 0.75 * u, 0.5 * u); break;
      case 'santa_hat': santa(ctx, x, y + 0.08 * u, u, d ? -d : 1); break;
      case 'antlers': antlers(ctx, x, y + 0.12 * u, u, d); break;
      case 'bunny_ears': bunny(ctx, x, y + 0.08 * u, u, d); break;
      case 'flower_crown': flowerCrown(ctx, x, y, u, d); break;
      case 'unicorn': unicorn(ctx, x + d * 0.05 * u, y + 0.05 * u, u, d); break;
      case 'fu': fuCharm(ctx, x, y, u); break;
      default: break;
    }
  }
  function drawFace(ctx, id, A) {
    if (id === 'sunglasses') {
      emoji(ctx, '🕶️', A.dir ? A.ex + A.dir * 0.2 * A.u : A.ex, A.ey + 0.05 * A.u, (A.dir ? 1.3 : 1.1) * A.u * (A.dir ? 1 : A.gap / (0.6 * A.u)));
    } else if (id === 'round_glasses') glasses(ctx, 'round', A);
    else if (id === 'heart_glasses') glasses(ctx, 'heart', A);
    else if (id === 'star_glasses') glasses(ctx, 'star', A);
  }
  function drawNeck(ctx, id, A) {
    const u = A.u;
    if (id === 'scarf') emoji(ctx, '🧣', A.nx + (A.dir || 0) * 0.2 * u, A.ny + 0.25 * u, 1.1 * u);
    else if (id === 'xmas_scarf') scarf(ctx, A, ['#2e7d32', '#ffffff', '#e53935']);
    else if (id === 'bowtie') bowtie(ctx, A.nx + (A.dir || 0) * 0.1 * u, A.ny + 0.1 * u, u, '#e53935');
    else if (id === 'medal') pendant(ctx, A, '🏅', '#1e88e5');
    else if (id === 'red_envelope') pendant(ctx, A, '🧧', '#e53935');
  }

  // 一次畫完三個位置。順序：脖子 → 臉 → 頭（帽子蓋在最上面）
  function draw(ctx, wear, A) {
    if (!ctx || !wear || !A) return;
    ctx.save();
    try {
      if (wear.neck && wear.neck !== 'none') drawNeck(ctx, wear.neck, A);
      if (wear.face && wear.face !== 'none') drawFace(ctx, wear.face, A);
      if (wear.head && wear.head !== 'none') drawHead(ctx, wear.head, A);
    } catch (e) { /* 畫壞一樣不要影響狗狗 */ }
    ctx.restore();
  }

  window.PuppyWear = {
    SLOTS, CATALOG, SEASONS, BY_ID,
    inSeason, normalize, syncAcc, worn, status, draw
  };
})();
