// 《汪汪小精靈 學習小伙伴》益智挑戰共用聲光效果（v3.28.0）
// PuppyFx.tone(種類)：用瀏覽器內建的 WebAudio 合成短音效，不用下載音檔；狗狗靜音（PUPPY_SOUND_OFF）時不出聲
// PuppyFx.confetti(元素)：在元素上面撒彩色紙花（純 CSS 動畫，2 秒後自動清掉）
(function () {
  'use strict';
  let ac = null;
  function ctx() {
    if (window.PUPPY_SOUND_OFF) return null;
    try {
      if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    } catch (e) { return null; }
  }
  function note(f, t0, dur, type, vol) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    const t = a.currentTime + t0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const SOUNDS = {
    tap: () => note(660, 0, 0.08, 'triangle', 0.12),
    place: () => { note(520, 0, 0.07, 'square', 0.06); note(780, 0.05, 0.09, 'triangle', 0.1); },
    rotate: () => note(880, 0, 0.06, 'triangle', 0.1),
    remove: () => note(300, 0, 0.1, 'sawtooth', 0.05),
    undo: () => { note(600, 0, 0.06, 'triangle', 0.1); note(450, 0.06, 0.08, 'triangle', 0.1); },
    hit: () => note(1200, 0, 0.12, 'sine', 0.12),
    bad: () => { note(220, 0, 0.15, 'sawtooth', 0.06); note(180, 0.12, 0.18, 'sawtooth', 0.05); },
    roll: () => note(200 + Math.random() * 80, 0, 0.05, 'triangle', 0.05),
    bounce: () => note(900, 0, 0.1, 'sine', 0.12),
    win: () => [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.11, 0.3, 'triangle', 0.16))
  };
  function tone(k) { try { (SOUNDS[k] || SOUNDS.tap)(); } catch (e) { /* 忽略 */ } }
  function confetti(host) {
    if (!host) return;
    const box = document.createElement('div');
    box.className = 'fx-confetti';
    const cols = ['#ff5252', '#ffb300', '#4caf50', '#29b6f6', '#ab47bc', '#ff80ab'];
    for (let i = 0; i < 46; i++) {
      const s = document.createElement('i');
      s.style.left = (Math.random() * 100) + '%';
      s.style.background = cols[i % cols.length];
      s.style.animationDelay = (Math.random() * 0.5) + 's';
      s.style.animationDuration = (1.2 + Math.random() * 0.9) + 's';
      s.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(s);
    }
    const cs = getComputedStyle(host);
    if (cs.position === 'static') host.style.position = 'relative';
    host.appendChild(box);
    setTimeout(() => box.remove(), 2600);
  }
  window.PuppyFx = { tone, confetti };
})();
