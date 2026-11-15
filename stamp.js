// 《汪汪小精靈 學習小伙伴》家長蓋章：驗證碼的算法（v3.4.0）
// 學生的裝置和家長的手機各自用同一把鑰匙算出 6 位數，數字相同才算蓋章成功。不需要網路伺服器，資料不上傳。
// 桌面版 study_checkin.py 的 stamp_code() 是同一個算法（HMAC-SHA256 取前 4 個位元組），兩邊要一起改。
(function () {
  'use strict';

  function sha256Bytes(bytes) {
    const K = [], H = [];
    const frac = x => ((x - Math.floor(x)) * 4294967296) | 0;
    let n = 2, i = 0;
    while (i < 64) {
      let prime = true;
      for (let f = 2; f * f <= n; f++) if (n % f === 0) { prime = false; break; }
      if (prime) {
        if (i < 8) H[i] = frac(Math.pow(n, 1 / 2));
        K[i++] = frac(Math.pow(n, 1 / 3));
      }
      n++;
    }
    const len = bytes.length;
    const total = ((len + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(total);
    buf.set(bytes);
    buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 8, Math.floor(len / 536870912));
    dv.setUint32(total - 4, (len * 8) >>> 0);
    const w = new Int32Array(64);
    const rotr = (x, r) => (x >>> r) | (x << (32 - r));
    for (let off = 0; off < total; off += 64) {
      for (let t = 0; t < 16; t++) w[t] = dv.getInt32(off + t * 4);
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      let [A, B, C, D, E, F, G, HH] = H;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
        const ch = (E & F) ^ (~E & G);
        const t1 = (HH + S1 + ch + K[t] + w[t]) | 0;
        const S0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
        const mj = (A & B) ^ (A & C) ^ (B & C);
        const t2 = (S0 + mj) | 0;
        HH = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0;
      }
      H[0] = (H[0] + A) | 0; H[1] = (H[1] + B) | 0; H[2] = (H[2] + C) | 0; H[3] = (H[3] + D) | 0;
      H[4] = (H[4] + E) | 0; H[5] = (H[5] + F) | 0; H[6] = (H[6] + G) | 0; H[7] = (H[7] + HH) | 0;
    }
    const out = new Uint8Array(32);
    const odv = new DataView(out.buffer);
    H.forEach((x, k) => odv.setInt32(k * 4, x));
    return out;
  }

  function hexToBytes(hex) {
    const out = new Uint8Array(hex.length >> 1);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  function hmacSha256(keyBytes, msgBytes) {
    let key = keyBytes.length > 64 ? sha256Bytes(keyBytes) : keyBytes;
    const k = new Uint8Array(64);
    k.set(key);
    const inner = new Uint8Array(64 + msgBytes.length);
    const outer = new Uint8Array(64 + 32);
    for (let i = 0; i < 64; i++) { inner[i] = k[i] ^ 0x36; outer[i] = k[i] ^ 0x5c; }
    inner.set(msgBytes, 64);
    outer.set(sha256Bytes(inner), 64);
    return sha256Bytes(outer);
  }

  // 6 位數驗證碼：HMAC-SHA256(鑰匙, 訊息) 的前 4 個位元組，除以一百萬的餘數
  function code(keyHex, msg) {
    const mac = hmacSha256(hexToBytes(keyHex), new TextEncoder().encode(msg));
    const n = ((mac[0] << 24) | (mac[1] << 16) | (mac[2] << 8) | mac[3]) >>> 0;
    return String(n % 1000000).padStart(6, '0');
  }

  function randomHex(nBytes) {
    const b = new Uint8Array(nBytes);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(b);
    else for (let i = 0; i < nBytes; i++) b[i] = Math.floor(Math.random() * 256);
    return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // 網址用的 Base64（中文也可以）
  function b64uEncode(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    bytes.forEach(x => { bin += String.fromCharCode(x); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64uDecode(s) {
    const bin = atob(String(s).replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  window.PuppyStamp = {
    code,
    randomHex,
    b64uEncode,
    b64uDecode,
    pairCode: (key, dev) => code(key, 'pair|' + dev),
    stampCode: (key, dev, day, nonce, payload) => code(key, ['stamp', dev, day, nonce, payload].join('|')),
    pairHash: (key, dev) => 'p=' + key + '.' + dev,
    stampHash: (dev, day, nonce, payload) => 's=' + [dev, day, nonce, payload].join('.')
  };
})();
