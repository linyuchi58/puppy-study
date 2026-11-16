// -*- coding: utf-8 -*-
// 《汪汪小精靈 學習小伙伴》網頁版 —— 全畫面 Ballz 物理引擎與全動作互動系統
// 完整移植自 puppy.py：36 顆彈簧球體骨架、8 種毛色、撐傘緩降、丟球／接飛盤、藏骨頭尋寶、追蒼蠅、洗澡泡泡、10 種把戲
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ── 1. Ballz 36 顆球體骨架定義（與 puppy.py 完全一致） ──
  const BALL_DEFS = [
    ['ff_u', 8, 'coat', 0.0, 0], ['ff_l', 6.8, 'coat', 0.1, 0], ['ff_p', 7.5, 'paw', 0.2, 0],
    ['rf_u', 9.5, 'coat', 0.3, 0], ['rf_l', 7, 'coat', 0.4, 0], ['rf_p', 7.8, 'paw', 0.5, 0],
    ['ear_f1', 8.5, 'coat2', 1.0, 0], ['ear_f2', 6.8, 'coat2', 1.1, 0], ['ear_f3', 4.8, 'coat2', 1.2, 0],
    ['rump', 14, 'belly', 1.8, 0],
    ['tail1', 6.8, 'coat', 2.0, 1], ['tail2', 6.2, 'belly', 2.1, 1], ['tail3', 5.2, 'belly', 2.2, 1],
    ['hip', 18.5, 'coat', 3.0, 0], ['mid', 18, 'coat', 3.2, 0], ['chest', 19.5, 'coat', 3.5, 0],
    ['bib', 14.5, 'belly', 3.6, 0],
    ['rn_u', 10, 'coat', 4.0, 0], ['rn_l', 7.5, 'coat', 4.1, 0], ['rn_p', 8.2, 'paw', 4.2, 0],
    ['fn_u', 8.8, 'coat', 4.5, 0], ['fn_l', 7.2, 'coat', 4.6, 0], ['fn_p', 8, 'paw', 4.7, 0],
    ['neck', 13, 'coat', 5.0, 0],
    ['head', 17.5, 'coat', 6.0, 0],
    ['forehead', 14, 'coat', 6.1, 0],
    ['cheek', 13.5, 'belly', 6.2, 0],
    ['blaze', 6, 'belly', 6.3, 0],
    ['eye_f', 5.5, 'eye', 6.5, 0],
    ['tongue', 5, 'tongue', 6.6, 0],
    ['jaw', 8.2, 'belly', 6.7, 0],
    ['snout', 10.5, 'belly', 6.8, 0],
    ['nose', 4.8, 'nose', 7.0, 0],
    ['eye_n', 6.8, 'eye', 7.2, 0],
    ['ear_n1', 9.2, 'coat2', 8.0, 0], ['ear_n2', 7.4, 'coat2', 8.1, 0], ['ear_n3', 5.2, 'coat2', 8.2, 0]
  ];
  const DRAW_ORDER = BALL_DEFS.slice().sort((a, b) => a[3] - b[3]);
  const FAR_SIDE = new Set(['ff_u', 'ff_l', 'ff_p', 'rf_u', 'rf_l', 'rf_p', 'ear_f1', 'ear_f2', 'ear_f3']);
  const BALL_R = {};
  BALL_DEFS.forEach(d => { BALL_R[d[0]] = d[1]; });

  const PALETTES = {
    '威爾斯柯基': { coat: '#e3893b', coat2: '#c86d22', belly: '#fffaf2', paw: '#fffaf2', nose: '#231610' },
    '黑頭三色柯基': { coat: '#383532', coat2: '#c87228', belly: '#fffaf2', paw: '#fffaf2', nose: '#181412' },
    '奶油柯基': { coat: '#ecc27e', coat2: '#d49f4e', belly: '#ffffff', paw: '#ffffff', nose: '#2a1a12' },
    '柴犬': { coat: '#d4793a', coat2: '#b25e25', belly: '#f7ead6', paw: '#f7ead6', nose: '#1f1410' },
    '米格魯': { coat: '#d99a52', coat2: '#6b3f1d', belly: '#f6efe2', paw: '#f6efe2', nose: '#2a1a12' },
    '哈士奇': { coat: '#8a8f99', coat2: '#3c4049', belly: '#f2f2f2', paw: '#f2f2f2', nose: '#151515' },
    '大麥町': { coat: '#f4f1ea', coat2: '#2b2b2b', belly: '#ffffff', paw: '#f4f1ea', nose: '#1a1a1a' },
    '巧克力拉布拉多': { coat: '#7b4a2a', coat2: '#4f2c16', belly: '#a8714a', paw: '#7b4a2a', nose: '#1e120c' }
  };

  function shade(hex, factor) {
    const c = hex.replace('#', '');
    const r = clamp(Math.round(parseInt(c.substring(0, 2), 16) * factor), 0, 255);
    const g = clamp(Math.round(parseInt(c.substring(2, 4), 16) * factor), 0, 255);
    const b = clamp(Math.round(parseInt(c.substring(4, 6), 16) * factor), 0, 255);
    return `rgb(${r},${g},${b})`;
  }

  // ── 2. Web Audio 可愛合成音效（不需外部音檔） ──
  let audioCtx = null;
  function playTone(kind) {
    if (window.PUPPY_SOUND_OFF) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (kind === 'yip' || kind === 'bark') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.07);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.16);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.17);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (kind === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(820, now + 0.08);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (kind === 'boing') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.22);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (kind === 'chew') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.setValueAtTime(290, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (kind === 'copter') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(460, now + 0.35);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.38);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (kind === 'growl') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {}
  }

  // ── 3. 全畫面互動舞台狀態 ──
  const world = {
    W: window.innerWidth,
    H: window.innerHeight,
    floor: window.innerHeight - 66,
    S: 1.05,
    t: 0,
    mouse: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, down: false },
    particles: [],
    toys: [],
    bowl: null,
    buriedBone: null,
    fly: null,
    peekMode: false,
    speech: { text: '', timer: 0, col: '#2fa86b' },
    dog: null
  };

  function addParticle(kind, x, y, vx, vy, life = 1.2, size = 10) {
    world.particles.push({ kind, x, y, vx, vy, life, maxLife: life, size });
  }

  // ── 4. 玩具、飯碗、蒼蠅類別 ──
  class Toy {
    constructor(kind, x, y, vx = 0, vy = 0) {
      this.kind = kind; // 'ball' | 'frisbee' | 'yarn' | 'dental_bone'
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.r = kind === 'frisbee' ? 18 : 14;
      this.held = false;
      this.carried = false;
      this.remain = 1.0;
      this.rot = 0;
    }
    onGround() {
      return this.y >= world.floor - this.r - 2;
    }
    step(dt, f) {
      if (this.held) return;
      if (this.carried && world.dog) {
        const jaw = world.dog.rendered.jaw || [world.dog.x + world.dog.dir * 24, world.dog.y - 25];
        this.x = jaw[0] + world.dog.dir * 8 * world.S;
        this.y = jaw[1] + 4 * world.S;
        return;
      }
      const g = (this.kind === 'frisbee' && Math.abs(this.vx) > 2) ? 0.22 : 0.65;
      this.vy += g * world.S * f;
      this.x += this.vx * f;
      this.y += this.vy * f;
      this.rot += this.vx * 0.05 * f;

      const margin = 36 * world.S;
      if (this.x < margin) { this.x = margin; this.vx = Math.abs(this.vx) * 0.75; }
      if (this.x > world.W - margin) { this.x = world.W - margin; this.vx = -Math.abs(this.vx) * 0.75; }

      const fy = world.floor - this.r * 0.5;
      if (this.y >= fy) {
        this.y = fy;
        if (Math.abs(this.vy) > 2.2) {
          this.vy = -this.vy * (this.kind === 'ball' ? 0.62 : 0.35);
          this.vx *= 0.82;
          playTone('pop');
        } else {
          this.vy = 0;
          this.vx *= 0.85;
          if (Math.abs(this.vx) < 0.08) this.vx = 0;
        }
      }
    }
  }

  // ── 5. 狗狗主體（完整移植 puppy.py Dog 類別） ──
  class Dog {
    constructor() {
      this.x = clamp(world.W * 0.28, 100, world.W - 100);
      this.y = world.floor;
      this.dir = 1;
      this.state = 'fall';
      this.state_t = 0;
      this.dur = 3.0;
      this.target = null;
      this.speed = 0;
      this.running = false;
      this.phase = 0;
      this.wag_amp = 0.35;
      this.wag_spd = 10;
      this.blink = 0;
      this.next_blink = 2.0;
      this.look = [0, 0];
      this.look_timer = 0;
      this.th = 0;
      this.om = 0;
      this.hx = this.x;
      this.hy = -80;
      this.hvx = 0;
      this.fx = this.x;
      this.fy = -80;
      this.fvx = 0;
      this.fvy = 0;
      this.vx = 0;
      this.vy = 0;
      this.carry = null;
      this.fetch_toy = null;
      this.pulse_t = 0;
      this.mouth_t = 0;
      this.fx_t = 0;
      this.rub_t = 0;
      this.head_pet_time = 0;
      this.poke_times = [];
      this.fly_hop_y = 0;
      this.fly_hop_vy = 0;
      this.fly_hop_cd = 0.6;
      this.roll_ang = 0;
      this.ear_back_s = 0;
      this.panting = false;
      this.eyes = 'open';
      this.mouth = 0;
      this.tongue = false;
      this.balls = {};
      this.rendered = {};
      this.animate(0, true);
    }

    setState(name, dur = 4.0) {
      if (this.state === 'copter' && name !== 'copter' && !['held', 'fall', 'jump'].includes(name)) {
        this.y = world.floor;
      }
      this.state = name;
      this.state_t = 0;
      this.dur = dur;
      this.pulse_t = 0;
      this.mouth_t = 0;
      this.fx_t = 0;
      this.speed = 0;
      this.fly_hop_y = 0;
      this.fly_hop_vy = 0;
      if (!['held', 'fall', 'jump', 'copter'].includes(name)) {
        this.y = world.floor;
      }
    }

    busy() {
      return ['held', 'fall', 'jump', 'land'].includes(this.state);
    }

    pickTarget(minD = 110, maxD = 420) {
      const S = world.S;
      const d = rand(minD, maxD) * S * (Math.random() < 0.5 ? -1 : 1);
      return clamp(this.x + d, 85 * S, world.W - 85 * S);
    }

    chooseNext() {
      if (world.peekMode) {
        this.x = clamp(world.W - 90 * world.S, 80, world.W - 80);
        this.dir = -1;
        this.setState('sit', 10);
        return;
      }
      if (world.bowl && world.bowl.food > 0) {
        this.setState('goto_bowl', 25);
        return;
      }
      const ungrabbedToy = world.toys.find(t => !t.held && !t.carried);
      if (ungrabbedToy && Math.random() < 0.65) {
        this.fetch_toy = ungrabbedToy;
        this.setState('fetch', 20);
        return;
      }

      const pool = [
        ['walk', 28], ['idle', 16], ['sit', 14], ['lie', 9],
        ['scratch', 5], ['yawn', 5], ['bark', 3], ['run', 7],
        ['downdog', 5], ['dig', 4], ['paw', 4], ['roll', 3],
        ['split', 3], ['copter', 2], ['chase_tail', 3], ['dance', 3], ['play_paws', 4]
      ];
      // v3.3.0：還沒學會的才藝不會自己表演（學會的那一刻才看得到）；肚子餓的時候懶洋洋
      const BASIC = ['walk', 'idle', 'sit', 'lie', 'scratch', 'yawn', 'bark', 'run'];
      if (window.PUPPY_IS_TIRED && window.PUPPY_IS_TIRED()) {
        pool.length = 0;
        pool.push(['lie', 5], ['sit', 4], ['idle', 3], ['yawn', 3], ['walk', 2]);
      } else if (window.PUPPY_TRICK_OK) {
        for (let i = pool.length - 1; i >= 0; i--) {
          if (!BASIC.includes(pool[i][0]) && !window.PUPPY_TRICK_OK(pool[i][0])) pool.splice(i, 1);
        }
      }
      let sum = pool.reduce((acc, x) => acc + x[1], 0);
      let r = Math.random() * sum;
      let picked = 'idle';
      for (const [k, w] of pool) {
        r -= w;
        if (r <= 0) { picked = k; break; }
      }

      if (picked === 'walk' || picked === 'run') {
        this.target = this.pickTarget(120, 460);
        this.setState(picked, 12);
      } else if (picked === 'idle') {
        this.panting = Math.random() < 0.35;
        this.setState('idle', rand(2.0, 4.5));
      } else if (picked === 'sit') {
        this.panting = Math.random() < 0.3;
        this.setState('sit', rand(3.5, 7.5));
      } else if (picked === 'lie') {
        this.setState('lie', rand(5.0, 10.0));
      } else {
        this.command(picked, false);
      }
    }

    command(name, isUser = true) {
      if (this.state === 'held') return;
      if (this.carry) {
        this.carry.carried = false;
        this.carry = null;
      }
      this.fetch_toy = null;
      if (world.peekMode && isUser) world.peekMode = false;

      switch (name) {
        case 'sit':
          this.setState('sit', 7);
          break;
        case 'lie':
          this.setState('lie', 10);
          break;
        case 'sleep':
          this.setState('sleep', 25);
          break;
        case 'bark':
          this.setState('bark', 1.6);
          this.mouth_t = 0.45;
          if (isUser) playTone('bark');
          break;
        case 'paw':
          this.setState('paw', 4.2);
          if (isUser) playTone('yip');
          this.emitHeart();
          break;
        case 'play_paws':
          this.setState('play_paws', 4.0);
          if (isUser) playTone('yip');
          break;
        case 'downdog':
          this.setState('downdog', 3.6);
          break;
        case 'dig':
          this.setState('dig', 3.2);
          break;
        case 'roll':
          this.setState('roll', 1.5);
          if (isUser) playTone('boing');
          break;
        case 'split':
          this.setState('split', 3.6);
          if (isUser) playTone('boing');
          this.emitNote();
          break;
        case 'copter':
          this.setState('copter', 4.2);
          if (isUser) playTone('copter');
          break;
        case 'chase_tail':
          this.chase_tail_cx = clamp(this.x, 100 * world.S, world.W - 100 * world.S);
          this.setState('chase_tail', 4.8);
          if (isUser) playTone('yip');
          break;
        case 'bath':
          this.setState('bath', 6.5);
          if (isUser) playTone('pop');
          break;
        case 'dance':
          this.setState('dance', 4.8);
          this.emitNote();
          break;
        case 'belly_rub':
          this.rub_t = 3.5;
          this.setState('belly_rub', 4.5);
          this.emitHeart();
          break;
        case 'happy':
          this.setState('happy', 3.2);
          if (isUser) playTone('yip');
          this.emitHeart();
          break;
        case 'come':
          this.target = clamp(world.W * 0.5, 100, world.W - 100);
          this.setState('run', 8);
          if (isUser) playTone('yip');
          break;
        default:
          this.setState(name, 3.0);
      }
    }

    emitHeart() {
      const [hx, hy] = this.rendered.head || [this.x, this.y - 70 * world.S];
      addParticle('heart', hx + rand(-16, 16), hy - 22, rand(-0.8, 0.8), -1.5, 1.3);
    }

    emitNote() {
      const [hx, hy] = this.rendered.head || [this.x, this.y - 70 * world.S];
      addParticle(pick(['note', 'star', 'heart']), hx + rand(-18, 18), hy - 20, rand(-1.0, 1.0), -1.3, 1.25);
    }

    moveToward(tx, run, f) {
      const S = world.S;
      const dx = tx - this.x;
      if (Math.abs(dx) < 5 * S) return true;
      this.dir = dx > 0 ? 1 : -1;
      const spd = (run ? 5.2 : 1.9) * S;
      this.x = clamp(this.x + this.dir * Math.min(Math.abs(dx), spd * f), 65 * S, world.W - 65 * S);
      this.speed = spd;
      this.running = run;
      const stride = (run ? 16 : 9) * S;
      this.phase += (TAU * spd * f) / (4 * stride);
      return false;
    }

    step(dt, f) {
      const S = world.S;
      this.state_t += dt;
      this.rub_t = Math.max(0, this.rub_t - dt);

      // 眨眼
      this.next_blink -= dt;
      if (this.next_blink <= 0) {
        this.blink = 0.14;
        this.next_blink = rand(2.2, 5.2);
      }
      if (this.blink > 0) this.blink = Math.max(0, this.blink - dt);

      // 視線跟隨滑鼠
      const [hx, hy] = this.rendered.head || [this.x, this.y - 60 * S];
      const mdx = world.mouse.x - hx;
      const mdy = world.mouse.y - hy;
      const md = Math.hypot(mdx, mdy) || 1;
      this.look = [
        clamp((mdx / md) * this.dir, -0.5, 1.0),
        clamp(mdy / md, -0.8, 0.5)
      ];

      const st = this.state;
      if (st === 'held') {
        const vxm = world.mouse.x - this.hx;
        const acc = vxm - this.hvx;
        this.hvx = vxm;
        this.hx = world.mouse.x;
        this.hy = world.mouse.y;
        this.om += (-0.05 * Math.sin(this.th) + (acc * 0.004) / S) * f;
        this.om *= Math.pow(0.94, f);
        this.th = clamp(this.th + this.om * f, -1.25, 1.25);
      } else if (st === 'fall') {
        const targetVy = 4.0 * S;
        this.fvy = lerp(this.fvy, targetVy, Math.min(1, 0.25 * f));
        const swayVx = Math.sin(this.state_t * 4.8) * 1.65 * S;
        this.fvx *= Math.pow(0.92, f);
        this.fx = clamp(this.fx + (this.fvx + swayVx) * f, 65 * S, world.W - 65 * S);
        this.fy += this.fvy * f;
        this.th = lerp(this.th, Math.sin(this.state_t * 4.2) * 0.14, Math.min(1, 0.2 * f));
        if (this.fy + 80 * S >= world.floor) {
          this.x = clamp(this.fx, 65 * S, world.W - 65 * S);
          this.y = world.floor;
          this.th = 0;
          playTone('yip');
          this.setState('land', 0.35);
        }
      } else if (st === 'land') {
        if (this.state_t > this.dur) this.setState('idle', 2.0);
      } else if (st === 'jump') {
        this.vy += 0.88 * S * f;
        this.y += this.vy * f;
        this.x = clamp(this.x + this.vx * f, 65 * S, world.W - 65 * S);
        if (this.fetch_toy && !this.carry) {
          const [sx, sy] = this.rendered.snout || [this.x, this.y - 40 * S];
          if (Math.hypot(this.fetch_toy.x - sx, this.fetch_toy.y - sy) < 58 * S) {
            this.carry = this.fetch_toy;
            this.fetch_toy.carried = true;
            this.fetch_toy = null;
            playTone('pop');
          }
        }
        if (this.y >= world.floor) {
          this.y = world.floor;
          this.setState(this.carry ? 'return' : 'land', this.carry ? 12 : 0.35);
        }
      } else if (st === 'walk' || st === 'run') {
        if (this.target === null || this.moveToward(this.target, st === 'run', f) || this.state_t > this.dur) {
          this.chooseNext();
        }
      } else if (st === 'copter') {
        const u = this.state_t;
        const maxAlt = Math.min(280 * S, Math.max(140 * S, world.floor - 130 * S));
        if (u < 0.7) {
          this.y = world.floor;
        } else if (u < 2.2) {
          const p = clamp((u - 0.7) / 1.5, 0, 1);
          const ease = 1 - Math.pow(1 - p, 2.2);
          this.y = world.floor - maxAlt * ease;
          this.x = clamp(this.x + Math.sin(u * 3.5) * 1.6 * S * f, 70 * S, world.W - 70 * S);
        } else if (u < this.dur) {
          const p = clamp((u - 2.2) / Math.max(0.1, this.dur - 2.2), 0, 1);
          const ease = p * p * (3 - 2 * p);
          this.y = world.floor - maxAlt * (1 - ease);
          this.x = clamp(this.x + Math.cos(u * 4.2) * 2.0 * S * f, 70 * S, world.W - 70 * S);
        } else {
          this.y = world.floor;
          this.emitHeart();
          this.setState('happy', 2.4);
        }
      } else if (st === 'chase_tail') {
        this.phase += dt * 34;
        const cxOrb = clamp(this.chase_tail_cx || this.x, 95 * S, world.W - 95 * S);
        const ang = this.state_t * 7.2;
        this.x = clamp(cxOrb + Math.cos(ang) * 42 * S, 65 * S, world.W - 65 * S);
        this.dir = -Math.sin(ang) >= 0 ? 1 : -1;
        this.y = world.floor - Math.abs(Math.sin(ang * 2)) * 5 * S;
        this.speed = 4.6 * S;
        this.running = true;
        this.mouth_t = (Math.floor(this.state_t * 14) % 2 === 0) ? 0.25 : 0;
        this.fx_t -= dt;
        if (this.fx_t <= 0) {
          this.fx_t = 0.45;
          this.emitNote();
        }
        if (this.state_t > this.dur) {
          this.y = world.floor;
          this.speed = 0;
          this.running = false;
          this.emitHeart();
          this.setState('happy', 2.2);
        }
      } else if (st === 'bath') {
        this.fx_t -= dt;
        if (this.fx_t <= 0) {
          this.fx_t = 0.16;
          const [mx, my] = this.rendered.mid || [this.x, this.y - 35 * S];
          const [hx2, hy2] = this.rendered.head || [this.x, this.y - 65 * S];
          const base = Math.random() < 0.5 ? [mx, my] : [hx2, hy2];
          addParticle('bubble', base[0] + rand(-34, 34) * S, base[1] + rand(-22, 12) * S,
                      rand(-1.1, 1.1) * S, -rand(1.0, 2.4) * S, rand(1.2, 2.0), rand(6, 13) * S);
        }
        if (this.state_t > this.dur) {
          for (let i = 0; i < 6; i++) this.emitNote();
          this.setState('shake', 1.4);
        }
      } else if (st === 'shake') {
        if (Math.random() < 0.75 * f) {
          const [cx, cy] = this.rendered.chest || [this.x, this.y - 40 * S];
          addParticle('drip', cx + rand(-30, 30) * S, cy + rand(-20, 10) * S,
                      rand(-5, 5) * S, rand(-5, -1) * S, 0.9, 5);
        }
        if (this.state_t > this.dur) this.setState('happy', 2.0);
      } else if (st === 'fetch') {
        const toy = this.fetch_toy;
        if (!toy || !world.toys.includes(toy) || toy.held || toy.carried || this.state_t > this.dur) {
          this.fetch_toy = null;
          this.setState('idle', 2.0);
        } else {
          const reach = 52 * S;
          const fd = toy.x >= this.x ? 1 : -1;
          const h = world.floor - toy.y;
          const mouthX = this.x + this.dir * reach;
          if (!toy.onGround() && toy.kind === 'frisbee' && Math.abs(toy.x - mouthX) < 68 * S && h > 40 * S && h < 240 * S) {
            this.vy = -Math.sqrt(2 * 0.88 * S * Math.max(18 * S, h - 35 * S));
            this.vx = fd * 3.8 * S;
            this.dir = fd;
            this.setState('jump', 2.5);
          } else if (this.moveToward(toy.x - fd * reach, true, f * 1.18)) {
            this.dir = fd;
            this.carry = toy;
            toy.carried = true;
            this.fetch_toy = null;
            playTone('pop');
            if (toy.kind === 'dental_bone') {
              this.setState('chew_bone', 14.0);
            } else {
              this.return_tx = clamp(world.W * 0.5 + rand(-140, 140), 90 * S, world.W - 90 * S);
              this.setState('return', 12.0);
            }
          }
        }
      } else if (st === 'return') {
        if (!this.carry) {
          this.setState('idle', 2.0);
        } else {
          const tx = this.return_tx || world.W * 0.5;
          if (this.moveToward(tx, true, f) || this.state_t > this.dur) {
            this.carry.carried = false;
            this.carry.vx = this.dir * 1.6 * S;
            this.carry.vy = -2.2 * S;
            this.carry = null;
            this.emitHeart();
            playTone('yip');
            this.setState('happy', 2.4);
          }
        }
      } else if (st === 'chew_bone') {
        const toy = this.carry;
        if (!toy || toy.kind !== 'dental_bone') {
          this.carry = null;
          this.setState('idle', 2.0);
        } else {
          this.pulse_t -= dt;
          if (this.pulse_t <= 0) {
            this.pulse_t = 0.7;
            playTone('chew');
            if (Math.random() < 0.45) this.emitHeart();
          }
          toy.remain = Math.max(0, toy.remain - dt * 0.09);
          if (toy.remain <= 0.05) {
            const idx = world.toys.indexOf(toy);
            if (idx >= 0) world.toys.splice(idx, 1);
            this.carry = null;
            this.emitHeart();
            playTone('yip');
            this.setState('happy', 2.8);
          }
        }
      } else if (st === 'goto_bowl') {
        const b = world.bowl;
        if (!b || b.food <= 0) {
          this.setState('idle', 2.0);
        } else {
          const fd = b.x >= this.x ? 1 : -1;
          const tx = b.x - fd * 54 * S;
          if (this.moveToward(tx, true, f * 1.25)) {
            this.dir = fd;
            this.setState('eat', 20.0);
          }
        }
      } else if (st === 'eat') {
        const b = world.bowl;
        if (!b || b.food <= 0) {
          this.setState('idle', 2.0);
        } else {
          b.food = Math.max(0, b.food - dt * 0.28);
          this.pulse_t -= dt;
          if (this.pulse_t <= 0) {
            this.pulse_t = 0.75;
            playTone('chew');
            if (Math.random() < 0.4) this.emitHeart();
          }
          if (b.food <= 0) {
            const isCan = b.kind === 'can';
            setTimeout(() => { if (world.bowl === b && b.food <= 0) world.bowl = null; }, 4000);
            this.emitHeart();
            this.emitHeart();
            playTone('yip');
            this.setState(isCan ? 'roll' : 'happy', isCan ? 1.6 : 2.6);
          }
        }
      } else if (st === 'sniff_bone') {
        const bb = world.buriedBone;
        if (!bb) {
          this.setState('idle', 2.0);
        } else if (bb.stage === 'buried') {
          const dx = bb.x - this.x;
          const stopX = bb.x - (dx >= 0 ? 1 : -1) * 28 * S;
          if (Math.abs(dx) <= 34 * S || this.moveToward(stopX, false, f * 1.15)) {
            this.dir = bb.x >= this.x ? 1 : -1;
            this.speed = 0;
            bb.stage = 'digging';
            bb.dig_t = 0;
          }
        } else if (bb.stage === 'digging') {
          bb.dig_t += dt;
          if (Math.random() < 0.75 * f) {
            addParticle('dirt', bb.x + rand(-12, 12) * S, world.floor - 4 * S,
                        -this.dir * rand(2, 5.5) * S, -rand(2.5, 6) * S, 0.7, 5);
          }
          if (bb.dig_t >= 2.2) {
            bb.stage = 'pop_up';
            bb.pop_t = 0;
            playTone('boing');
            for (let i = 0; i < 4; i++) this.emitNote();
          }
        } else {
          bb.pop_t += dt;
          if (bb.pop_t >= 0.55) {
            const jk = clamp((bb.pop_t - 0.55) / 0.65, 0, 1);
            this.y = world.floor - Math.sin(jk * Math.PI) * 28 * S;
          }
          if (bb.pop_t >= 1.2) {
            this.y = world.floor;
            const bx = bb.x;
            world.buriedBone = null;
            const bone = new Toy('dental_bone', bx, world.floor - 12 * S);
            bone.carried = true;
            world.toys.push(bone);
            this.carry = bone;
            this.emitHeart();
            playTone('yip');
            this.setState('chew_bone', 14.0);
          }
        }
      } else if (st === 'chase_fly') {
        const fly = world.fly;
        if (!fly || this.state_t > this.dur) {
          this.y = world.floor;
          this.setState('happy', 2.0);
        } else {
          this.mouth_t = Math.max(0, this.mouth_t - dt);
          this.fly_hop_cd -= dt;
          if (this.fly_hop_y < 0 || this.fly_hop_vy < 0) {
            this.fly_hop_vy += 0.92 * S * f;
            this.fly_hop_y += this.fly_hop_vy * f;
            if (this.fly_hop_y >= 0) { this.fly_hop_y = 0; this.fly_hop_vy = 0; }
          }
          this.y = world.floor + this.fly_hop_y;
          const dx = fly.x - this.x;
          if (Math.abs(dx) > 12 * S) {
            this.moveToward(fly.x - (dx > 0 ? 1 : -1) * 10 * S, true, f * 1.45);
          }
          if (this.fly_hop_y >= 0 && this.fly_hop_cd <= 0 && Math.abs(dx) < 82 * S) {
            this.fly_hop_cd = rand(0.35, 0.7);
            this.fly_hop_vy = -rand(9.5, 13.0) * S;
            this.mouth_t = 0.35;
            playTone('pop');
            if (this.state_t > 4.5 && Math.random() < 0.6) {
              world.fly = null;
              this.emitHeart();
              this.setState('happy', 2.2);
            } else {
              fly.vy = -4.5 * S;
            }
          }
        }
      } else if (st === 'belly_rub') {
        this.fx_t -= dt;
        if (this.fx_t <= 0) {
          this.fx_t = 0.85;
          this.emitHeart();
        }
        if (this.rub_t <= 0 && this.state_t > this.dur) {
          this.roll_ang = 0;
          this.setState('happy', 2.0);
        }
      } else if (st === 'sleep') {
        this.fx_t -= dt;
        if (this.fx_t <= 0) {
          this.fx_t = 1.6;
          const [hx2, hy2] = this.rendered.head || [this.x, this.y - 40 * S];
          addParticle('zzz', hx2 + this.dir * 12 * S, hy2 - 18 * S, this.dir * 0.4 * S, -0.9 * S, 1.5, 14);
        }
        if (this.state_t > this.dur) this.chooseNext();
      } else {
        if (this.state_t > this.dur) this.chooseNext();
      }

      this.animate(world.t, false);
    }

    pose(t) {
      const st = this.state;
      const u = this.state_t;
      let eyes = 'open';
      let mouth = 0.0;
      let tongue = this.panting;
      let chest = [17, -33], hip = [-19, -32], ho = [17, -26], pitch = 0.0;
      let paws = { fn: [20, -6], ff: [25, -7], rn: [-22, -6], rf: [-17, -7] };
      let tail_a = 62, curl = 12;
      let wag_amp = this.wag_amp, wag_spd = this.wag_spd;
      let ear_back = 0.0;
      let bib_off = [12, 4], rump_off = [-10, 1], tail_off = [-15, -9];
      const breathe = Math.sin(t * 2.6);
      let look_ok = true;
      this.roll_ang = 0.0;

      if (['sit', 'happy', 'yawn', 'scratch', 'paw', 'play_paws', 'angry'].includes(st)) {
        chest = [13, -39 + breathe * 0.5];
        hip = [-13, -19];
        ho = [15, -28];
        paws = { fn: [18, -6], ff: [23, -7], rn: [0, -5], rf: [5, -6] };
        tail_a = 25; curl = 8;

        if (st === 'happy') {
          const wig = Math.sin(t * 16);
          const tap1 = Math.max(0, Math.sin(t * 20));
          const tap2 = Math.max(0, Math.sin(t * 20 + Math.PI));
          chest = [15 + Math.sin(t * 8) * 1.5, -34 + Math.sin(t * 16) * 2.4];
          hip = [-16 - wig * 1.8, -23 - Math.sin(t * 16) * 2.2];
          ho = [17 + Math.sin(t * 7) * 2.2, -25 + Math.cos(t * 14) * 2.0];
          paws = {
            fn: [22 + tap1 * 3, -6 - tap1 * 8],
            ff: [27 + tap2 * 3, -7 - tap2 * 6],
            rn: [-6 + wig * 2, -5 - tap2 * 2.5],
            rf: [-1 - wig * 2, -6 - tap1 * 2.5]
          };
          eyes = 'happy'; tongue = true; mouth = 0.42;
          wag_amp = 1.25; wag_spd = 22;
          ear_back = 0.18 + 0.12 * Math.sin(t * 14);
          pitch = -0.14 + Math.sin(t * 7) * 0.16;
        } else if (st === 'yawn') {
          const k = Math.sin(Math.PI * clamp(u / this.dur, 0, 1));
          mouth = 1.45 * k; pitch = -0.4 * k;
          eyes = k > 0.3 ? 'closed' : 'open';
          tongue = k > 0.4;
          ear_back = 0.3 * k;
          look_ok = false;
        } else if (st === 'scratch') {
          paws.rn = [12 + Math.sin(t * 32) * 4, -36 + Math.cos(t * 32) * 3];
          ho = [15, -24]; pitch = 0.28; eyes = 'happy'; tongue = true;
          look_ok = false;
        } else if (st === 'paw') {
          paws.fn = [36, -26 + Math.sin(t * 7) * 3.5];
          paws.ff = [20, -6]; paws.rn = [-3, -5]; paws.rf = [2, -6];
          eyes = 'happy'; mouth = 0.25; wag_amp = 1.35; wag_spd = 22;
          pitch = -0.10 + Math.sin(t * 5) * 0.08;
        } else if (st === 'play_paws') {
          const w1 = Math.sin(t * 14) * 6.5;
          const w2 = Math.cos(t * 14) * 6.5;
          chest = [12 + Math.sin(t * 10) * 1.2, -43 + Math.abs(Math.sin(t * 14)) * 2.0];
          hip = [-14, -18]; ho = [15 + Math.sin(t * 7) * 1.5, -31];
          paws = {
            fn: [35 + Math.cos(t * 14) * 3.5, -27 + w1],
            ff: [39 - Math.cos(t * 14) * 3.5, -31 + w2],
            rn: [-2, -5], rf: [3, -6]
          };
          eyes = 'happy'; tongue = true; mouth = 0.38;
          wag_amp = 1.45; wag_spd = 24;
        } else if (st === 'angry') {
          const tr = Math.sin(t * 48) * 1.8;
          const stomp = Math.max(0, Math.sin(t * 22)) * 5.0;
          chest = [14 + tr, -38 - Math.abs(tr)];
          hip = [-14 - tr, -20];
          paws.fn = [19, -6 - stomp];
          ear_back = 0.95; pitch = -0.16;
          eyes = 'angry'; mouth = 0.5; wag_amp = 0.22; wag_spd = 40;
          look_ok = false;
        }
      } else if (st === 'chase_tail') {
        const hop = Math.abs(Math.sin(t * 22)) * 4.2;
        const sway = Math.cos(t * 22) * 3.0;
        chest = [19 + sway, -28 - hop];
        hip = [-14 - sway, -33 - hop * 0.8];
        ho = [26 + Math.sin(t * 24) * 3.2, -14 + Math.cos(t * 24) * 2.4];
        pitch = 0.36 + Math.sin(t * 24) * 0.16;
        paws = {
          fn: [22 + Math.sin(t * 28) * 10, -6 - Math.max(0, Math.cos(t * 28)) * 8],
          ff: [26 + Math.cos(t * 28) * 10, -7 - Math.max(0, Math.sin(t * 28)) * 8],
          rn: [-16 - Math.sin(t * 28) * 10, -6 - Math.max(0, -Math.cos(t * 28)) * 8],
          rf: [-12 - Math.cos(t * 28) * 10, -7 - Math.max(0, -Math.sin(t * 28)) * 8]
        };
        tail_a = 68; curl = 22; wag_amp = 1.65; wag_spd = 34;
        eyes = 'happy'; tongue = true; mouth = this.mouth_t > 0 ? 0.85 : 0.24;
        look_ok = false;
      } else if (st === 'bath') {
        const sway = Math.sin(t * 8.5) * 2.5;
        chest = [15 + sway, -28 + Math.sin(t * 17) * 1.4];
        hip = [-16 - sway * 0.8, -26];
        ho = [16 + sway * 0.6, -24 + Math.cos(t * 8.5) * 1.8];
        pitch = -0.12;
        paws = { fn: [19, -5], ff: [24, -6], rn: [-18, -5], rf: [-13, -6] };
        eyes = 'happy'; tongue = true; mouth = 0.28; ear_back = 0.35;
        look_ok = false;
      } else if (st === 'dance') {
        const beat = t * 14.0;
        const bop = Math.abs(Math.sin(beat)) * 5.2;
        const sway = Math.sin(beat * 0.5) * 3.5;
        chest = [14 + sway, -38 - bop];
        hip = [-15 - sway, -24 - bop * 0.5];
        ho = [16 + sway * 0.8, -28 - bop * 0.6];
        pitch = -0.18 + Math.sin(beat) * 0.14;
        paws = {
          fn: [28 + Math.sin(beat) * 6, -16 - Math.max(0, Math.sin(beat)) * 12],
          ff: [32 - Math.sin(beat) * 6, -16 - Math.max(0, -Math.sin(beat)) * 12],
          rn: [-10 + sway * 0.5, -5 - bop * 0.3],
          rf: [-5 - sway * 0.5, -6 - bop * 0.3]
        };
        wag_amp = 1.45; wag_spd = 25;
        eyes = 'happy'; tongue = true; mouth = 0.45;
        look_ok = false;
      } else if (st === 'downdog') {
        chest = [18, -20 + breathe * 0.4];
        hip = [-19, -39]; ho = [19, -15]; pitch = -0.15;
        paws = { fn: [44, -5], ff: [48, -6], rn: [-22, -6], rf: [-17, -7] };
        tail_a = 72; wag_amp = 0.95; wag_spd = 16;
        eyes = 'happy'; tongue = true; mouth = 0.3;
      } else if (st === 'split') {
        let slide = Math.min(1, u / 0.32);
        slide = slide * slide * (3 - 2 * slide);
        const bounce = Math.sin(t * 9) * 0.9 * slide;
        chest = [17, lerp(-33, -12, slide) + bounce];
        hip = [-19, lerp(-32, -12, slide) + bounce];
        ho = [18, -24 + bounce * 0.5];
        paws = {
          fn: [lerp(20, 50, slide), -4],
          ff: [lerp(25, 54, slide), -5],
          rn: [lerp(-22, -50, slide), -4],
          rf: [lerp(-17, -46, slide), -5]
        };
        eyes = 'happy'; tongue = true; mouth = 0.35;
      } else if (st === 'belly_rub') {
        this.roll_ang = Math.PI + Math.sin(t * 9.5) * 0.22;
        const br = Math.sin(t * 6.0) * 2.2;
        const sw = Math.cos(t * 9.5) * 3.2;
        chest = [17 + sw, -18 + br];
        hip = [-17 - sw, -17 - br * 0.8];
        ho = [18 + Math.sin(t * 7.5) * 2.5, -20];
        const pw = Math.sin(t * 13) * 6.5;
        const pw2 = Math.cos(t * 13) * 4.5;
        paws = {
          fn: [24 + pw, -38 + pw2],
          ff: [28 - pw, -36 - pw2],
          rn: [-20 - pw * 0.85, -35 - pw2 * 0.8],
          rf: [-15 + pw * 0.85, -33 + pw2 * 0.8]
        };
        eyes = 'happy'; mouth = 0.52; tongue = true;
        look_ok = false;
      } else if (st === 'chew_bone') {
        const gnaw = Math.sin(t * 15);
        const ga = Math.abs(gnaw);
        chest = [17, -21 + ga * 1.6];
        hip = [-18, -22];
        ho = [19 + gnaw * 1.4, -7 + ga * 3.8];
        pitch = 0.46 + ga * 0.18;
        paws = { fn: [26 + ga * 1.5, -5], ff: [31 - ga * 1.5, -6], rn: [-24, -5], rf: [-19, -6] };
        eyes = 'happy'; mouth = 0.15 + 0.65 * ga; tongue = gnaw > 0.2;
        look_ok = false;
      } else if (st === 'copter') {
        if (u < 0.7) {
          const k = u / 0.7;
          chest = [17, -26 - 4 * k]; hip = [-19, -31]; ho = [18, -24]; pitch = -0.12;
        } else {
          const sway = Math.sin(u * 4.2);
          this.roll_ang = sway * 0.09;
          chest = [16, -34]; hip = [-18, -32]; ho = [18, -27];
          const pad = t * 14;
          paws = {
            fn: [24 + Math.sin(pad) * 5, -14 + Math.cos(pad) * 4],
            ff: [29 + Math.sin(pad + Math.PI) * 5, -15 + Math.cos(pad + Math.PI) * 4],
            rn: [-24 + Math.sin(pad + 1.5) * 5, -12 + Math.cos(pad + 1.5) * 4],
            rf: [-19 + Math.sin(pad + 4.6) * 5, -13 + Math.cos(pad + 4.6) * 4]
          };
        }
        tail_a = 85; wag_amp = 1.6; wag_spd = 38;
        eyes = 'happy'; tongue = true; mouth = 0.42;
      } else if (st === 'dig' || (st === 'sniff_bone' && world.buriedBone && world.buriedBone.stage === 'digging')) {
        chest = [17, -26]; hip = [-18, -37]; ho = [17, -17]; pitch = 0.32;
        const cyc = t * 26;
        paws = {
          fn: [28 + Math.sin(cyc) * 8.5, -6 - Math.max(0, Math.cos(cyc)) * 9.5],
          ff: [32 + Math.sin(cyc + Math.PI) * 8.5, -7 - Math.max(0, Math.cos(cyc + Math.PI)) * 9.5],
          rn: [-21, -6], rf: [-16, -7]
        };
        eyes = 'happy'; tongue = true; mouth = 0.25;
        look_ok = false;
      } else if (st === 'roll') {
        const prog = clamp(u / Math.max(0.01, this.dur), 0, 1);
        this.roll_ang = prog * prog * (3 - 2 * prog) * TAU;
        chest = [15, -20]; hip = [-15, -19]; ho = [16, -20];
        eyes = 'happy'; tongue = true; mouth = 0.3;
        look_ok = false;
      } else if (st === 'lie' || st === 'sleep') {
        chest = [17, -19 + breathe * 0.6]; hip = [-17, -18]; ho = [18, -21];
        // 柯基招牌雞腿後腳往後伸 (sploot)
        paws = { fn: [40, -5], ff: [44, -6], rn: [-32, -5], rf: [-28, -6] };
        tail_a = 20; curl = 5;
        if (st === 'sleep') {
          ho = [22, -9]; pitch = 0.20; eyes = 'closed'; tongue = false;
          ear_back = 0.25; look_ok = false;
        }
      } else if (st === 'held' || st === 'fall') {
        chest = [-2, 18]; hip = [-6, 48]; ho = [9, -32]; pitch = -0.08;
        bib_off = [10, 4]; rump_off = [-9, 4]; tail_off = [-6, 10];
        const k = t * (st === 'fall' ? 8 : 9);
        const sp = st === 'fall' ? 4 : 0;
        paws = {
          fn: [6 + sp + Math.sin(k) * 4, 44 + Math.cos(k) * 3],
          ff: [11 + sp + Math.sin(k + 2) * 4, 42 + Math.cos(k + 2) * 3],
          rn: [-2 + sp * 0.5 + Math.sin(k + 1) * 3, 74],
          rf: [3 + sp * 0.5 + Math.sin(k + 3) * 3, 72]
        };
        tail_a = -45; curl = 8; ear_back = st === 'fall' ? 0.12 : 0.35;
        if (st === 'fall') { eyes = 'happy'; tongue = true; mouth = 0.25; }
        else { mouth = 0.15; }
      } else if (st === 'eat') {
        chest = [16, -31]; ho = [21, -3]; pitch = 0.68;
        mouth = Math.sin(t * 14) > 0 ? 0.55 : 0.0;
        eyes = 'happy'; wag_amp = 0.75; wag_spd = 16;
        look_ok = false;
      } else if (st === 'shake') {
        const k = 1 - clamp(u / this.dur, 0, 1);
        const o = Math.sin(t * 40) * 6 * k;
        chest[0] += o; hip[0] -= o * 0.9; ho = [17 + o * 0.6, -26];
        eyes = 'closed'; ear_back = 0.5; look_ok = false;
      } else if (st === 'bark') {
        const op = this.mouth_t > 0;
        mouth = op ? 1.0 : 0.15;
        pitch = op ? -0.18 : -0.04;
        ho = [19, -26]; wag_amp = 0.65;
      }

      // 步態（走路／奔跑）
      if (this.speed > 0 && !['held', 'fall', 'jump', 'eat', 'sit', 'happy', 'copter', 'chase_tail'].includes(st)) {
        const ph = this.phase;
        if (this.running) {
          const stride = 13, lift = 8.5;
          const offs = { fn: 0, ff: 0.5, rn: Math.PI, rf: Math.PI + 0.5 };
          chest[1] += Math.sin(ph) * 2.2;
          hip[1] += Math.sin(ph + Math.PI) * 2.2;
          ho = [20, -23];
          tongue = true; mouth = Math.max(mouth, 0.3); tail_a = 45;
          Object.entries(offs).forEach(([L, o]) => {
            paws[L][0] += Math.sin(ph + o) * stride;
            paws[L][1] -= Math.max(0, Math.cos(ph + o)) * lift;
          });
        } else {
          const stride = 7.5, lift = 4.5;
          const offs = { fn: 0, rf: 0, ff: Math.PI, rn: Math.PI };
          const bob = Math.abs(Math.sin(ph)) * 1.3;
          chest[1] -= bob; hip[1] -= bob;
          Object.entries(offs).forEach(([L, o]) => {
            paws[L][0] += Math.sin(ph + o) * stride;
            paws[L][1] -= Math.max(0, Math.cos(ph + o)) * lift;
          });
        }
      }

      if (this.carry && st !== 'chew_bone') {
        mouth = Math.max(mouth, 0.45);
        tongue = false;
      }
      if (look_ok) {
        ho[0] += this.look[0] * 2.5;
        ho[1] += this.look[1] * 2.5;
        pitch += this.look[1] * 0.16;
      }
      if (eyes === 'open' && this.blink > 0 && !['held', 'fall'].includes(st)) {
        eyes = 'closed';
      }

      // 組裝骨架座標
      const P = { chest: [...chest], hip: [...hip] };
      P.mid = [(chest[0] + hip[0]) * 0.5, (chest[1] + hip[1]) * 0.5 + 1.0];
      P.bib = [chest[0] + bib_off[0], chest[1] + bib_off[1]];
      P.rump = [hip[0] + rump_off[0], hip[1] + rump_off[1]];
      const head = [chest[0] + ho[0], chest[1] + ho[1]];
      P.head = head;
      P.neck = [chest[0] * 0.5 + head[0] * 0.5, chest[1] * 0.5 + head[1] * 0.5];

      const ca = Math.cos(pitch), sa = Math.sin(pitch);
      const feats = {
        forehead: [10, -2], cheek: [4, 6], blaze: [12, -7],
        eye_n: [10, -4], eye_f: [19, -5], snout: [22, 3],
        nose: [31, 0], jaw: [18, 9 + mouth * 5.5], tongue: [22, 12 + mouth * 5],
        ear_n1: [-5, -13], ear_f1: [6, -14]
      };
      Object.entries(feats).forEach(([k, [dx, dy]]) => {
        P[k] = [head[0] + dx * ca - dy * sa, head[1] + dx * sa + dy * ca];
      });

      const earFlutter = Math.sin(t * 5) * 0.6;
      P.ear_n2 = [P.ear_n1[0] - 3 - ear_back * 9, P.ear_n1[1] - 10 + ear_back * 8 + earFlutter];
      P.ear_n3 = [P.ear_n1[0] - 5 - ear_back * 16, P.ear_n1[1] - 19 + ear_back * 15 + earFlutter * 1.5];
      P.ear_f2 = [P.ear_f1[0] + 2 - ear_back * 8, P.ear_f1[1] - 10 + ear_back * 8 - earFlutter];
      P.ear_f3 = [P.ear_f1[0] + 4 - ear_back * 14, P.ear_f1[1] - 18 + ear_back * 14 - earFlutter * 1.5];

      const sh = {
        fn: [chest[0] + 3, chest[1] + 9], ff: [chest[0] + 8, chest[1] + 7],
        rn: [hip[0] - 2, hip[1] + 9], rf: [hip[0] + 3, hip[1] + 7]
      };
      ['fn', 'ff', 'rn', 'rf'].forEach(L => {
        const [sx, sy] = sh[L];
        const [px, py] = paws[L];
        const dx = px - sx, dy = py - sy;
        const d = Math.hypot(dx, dy) || 1;
        const bend = Math.max(0, 18 - d) * 0.6 + 1.2;
        const nx = -dy / d, ny = dx / d;
        const sgn = L[0] === 'f' ? 1 : -1;
        P[L + '_u'] = [sx, sy];
        P[L + '_l'] = [(sx + px) / 2 + nx * bend * sgn, (sy + py) / 2 + ny * bend * sgn];
        P[L + '_p'] = [px, py];
      });

      let bx = hip[0] + tail_off[0], by = hip[1] + tail_off[1];
      if (st === 'copter') {
        const spinA = t * 42;
        for (let i = 0; i < 3; i++) {
          const rOrb = (i + 1) * 4.5;
          P['tail' + (i + 1)] = [bx + Math.cos(spinA) * rOrb, by - (i + 1) * 4.2 + Math.sin(spinA) * (rOrb * 0.35)];
        }
      } else {
        const wag = Math.sin(t * wag_spd * 1.2) * wag_amp;
        const a0 = (tail_a * Math.PI) / 180;
        for (let i = 0; i < 3; i++) {
          const ang = a0 + ((curl * i) * Math.PI) / 180 + wag * (0.5 + 0.3 * i);
          const seg = st === 'chase_tail' ? (i === 0 ? 5.6 : 8.8) : (i === 0 ? 2.5 : 4.2);
          bx -= Math.cos(ang) * seg;
          by -= Math.sin(ang) * seg;
          P['tail' + (i + 1)] = [bx, by];
        }
      }

      this.ear_back_s += (ear_back - this.ear_back_s) * 0.25;

      if (this.roll_ang !== 0) {
        const rcx = 0, rcy = -21;
        const cr = Math.cos(this.roll_ang), sr = Math.sin(this.roll_ang);
        Object.keys(P).forEach(k => {
          const rx = P[k][0] - rcx, ry = P[k][1] - rcy;
          P[k] = [rcx + rx * cr - ry * sr, rcy + rx * sr + ry * cr];
        });
      }

      return { P, eyes, mouth, tongue };
    }

    animate(t, init = false) {
      const S = world.S;
      const { P, eyes, mouth, tongue } = this.pose(t);
      this.eyes = eyes;
      this.mouth = mouth;
      this.tongue = tongue;

      const st = this.state;
      const ox = st === 'held' ? this.hx : st === 'fall' ? this.fx : this.x;
      const oy = st === 'held' ? this.hy : st === 'fall' ? this.fy : this.y;
      const rot = (st === 'held' || st === 'fall') ? this.th : 0;
      const c = Math.cos(rot), s = Math.sin(rot), d = this.dir;
      const floppy = st === 'held' || st === 'fall';
      const lim = 70 * S;

      BALL_DEFS.forEach(([name, , , , soft]) => {
        const lx = P[name][0] * d * S;
        const ly = P[name][1] * S;
        const tx = ox + lx * c - ly * s;
        const ty = oy + lx * s + ly * c;
        let b = this.balls[name];
        if (!b || init) {
          this.balls[name] = [tx, ty, 0, 0];
          this.rendered[name] = [tx, ty];
          return;
        }
        let k = soft ? 0.17 : 0.45;
        let dm = soft ? 0.80 : 0.55;
        if (floppy) { k *= 0.7; dm = Math.min(0.88, dm + 0.1); }
        b[2] = (b[2] + (tx - b[0]) * k) * dm;
        b[3] = (b[3] + (ty - b[1]) * k) * dm;
        b[0] += b[2];
        b[1] += b[3];
        const ex = b[0] - tx, ey = b[1] - ty;
        const e = Math.hypot(ex, ey);
        if (e > lim) {
          b[0] = tx + (ex / e) * lim;
          b[1] = ty + (ey / e) * lim;
        }
        this.rendered[name] = [b[0], b[1]];
      });
    }

    hit(x, y) {
      const S = world.S;
      for (const [name, [bx, by]] of Object.entries(this.rendered)) {
        const r = (BALL_R[name] || 12) * S * 1.25;
        if ((x - bx) * (x - bx) + (y - by) * (y - by) <= r * r) return true;
      }
      return false;
    }

    hitHead(x, y) {
      const S = world.S;
      const [hx, hy] = this.rendered.head || [this.x, this.y - 60 * S];
      return Math.hypot(x - hx, y - hy) <= 42 * S;
    }
  }

  // ── 6. 繪製全畫面 Canvas（球體立體高光、大麥町斑點、雨傘、玩具、飯碗、泡泡） ──
  function drawSphere(ctx, x, y, r, col) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = col;
    ctx.fill();

    if (r > 5) {
      ctx.beginPath();
      ctx.arc(x - r * 0.28, y - r * 0.32, r * 0.34, 0, TAU);
      ctx.fillStyle = shade(col, 1.18);
      ctx.fill();
    }
  }

  function drawUmbrella(ctx, dog) {
    const S = world.S;
    const [hx, hy] = dog.rendered.head || [dog.fx, dog.fy - 32 * S];
    const openK = clamp(dog.state_t / 0.16, 0.35, 1.0);
    const ux = hx + Math.sin(dog.state_t * 4.2) * 3.5 * S;
    const uy = hy - 48 * S;
    const uw = 44 * S * openK;
    const uh = 24 * S * (0.65 + 0.35 * openK);

    // 傘柄
    ctx.beginPath();
    ctx.moveTo(ux, uy - uh - 5 * S);
    ctx.lineTo(ux, hy + 10 * S);
    ctx.strokeStyle = '#57606f';
    ctx.lineWidth = 2.6 * S;
    ctx.stroke();

    // 四瓣彩色傘面
    const cols = ['#ff6b81', '#feca57', '#48dbfb', '#ff9ff3'];
    const splits = [ux - uw, ux - uw * 0.45, ux, ux + uw * 0.45, ux + uw];
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(ux, uy - uh);
      ctx.quadraticCurveTo((ux + splits[i]) * 0.5, uy - uh * 0.75, splits[i], uy);
      ctx.lineTo(splits[i + 1], uy);
      ctx.quadraticCurveTo((ux + splits[i + 1]) * 0.5, uy - uh * 0.75, ux, uy - uh);
      ctx.fillStyle = cols[i];
      ctx.fill();
      ctx.strokeStyle = '#2f3640';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawEye(ctx, x, y, r, lx, ly, mode, coat, isNear) {
    const S = world.S;
    if (mode === 'open') {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = '#23140d';
      ctx.fill();
      const px = x + lx * r * 0.22, py = y + ly * r * 0.22;
      ctx.beginPath();
      ctx.arc(px - r * 0.28, py - r * 0.3, r * 0.38, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + r * 0.26, py + r * 0.24, r * 0.18, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (mode === 'happy') {
      ctx.beginPath();
      ctx.arc(x, y + r * 0.2, r * 0.75, Math.PI * 1.15, Math.PI * 1.85);
      ctx.strokeStyle = '#2b1911';
      ctx.lineWidth = 2.5 * S;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else if (mode === 'angry') {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = '#23140d';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.45, 0, TAU);
      ctx.fillStyle = '#e74c3c';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y - r * 0.15, r * 0.7, Math.PI * 0.15, Math.PI * 0.85);
      ctx.strokeStyle = '#2b1911';
      ctx.lineWidth = 2.2 * S;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  function drawDogFull(ctx, dog, pid, acc) {
    const S = world.S;
    const d = dog.dir;
    const fl = world.floor;

    // 地面陰影
    const sx = dog.state === 'held' ? dog.hx : dog.state === 'fall' ? dog.fx : dog.x;
    const sy = dog.state === 'held' ? dog.hy : dog.state === 'fall' ? dog.fy : dog.y;
    const alt = Math.max(0, fl - sy);
    const sw = 42 * S * Math.max(0.3, 1 - alt / (500 * S));
    ctx.beginPath();
    ctx.ellipse(sx, fl + 2 * S, sw, 5 * S, 0, 0, TAU);
    ctx.fillStyle = 'rgba(40,30,20,0.18)';
    ctx.fill();

    // 若選擇 3D 小熊可可、小藍龍或立牌，用全身 Q 版彈跳角色繪製
    if (!pid.startsWith('dog:')) {
      const [hx, hy] = dog.rendered.head || [dog.x, dog.y - 48 * S];
      const [cx, cy] = dog.rendered.chest || [dog.x, dog.y - 26 * S];
      const isDragon = pid.includes('小藍龍');
      const bodyCol = isDragon ? '#54a0ff' : '#d69e66';
      const bellyCol = isDragon ? '#c8d6e5' : '#fae6d1';
      ['fn_p', 'ff_p', 'rn_p', 'rf_p'].forEach(pk => {
        const [px, py] = dog.rendered[pk] || [cx, fl];
        drawSphere(ctx, px, py, 8 * S, bodyCol);
      });
      drawSphere(ctx, cx, cy, 22 * S, bodyCol);
      drawSphere(ctx, cx + d * 4 * S, cy + 3 * S, 14 * S, bellyCol);
      drawSphere(ctx, hx, hy, 20 * S, bodyCol);
      ctx.font = `${Math.round(30 * S)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isDragon ? '🐲' : pid === 'standee' ? '🖼️' : '🧸', hx, hy - 2 * S);
      return;
    }

    const breed = pid.slice(4);
    let pal = PALETTES[breed] || PALETTES['威爾斯柯基'];
    if (dog.state === 'angry') {
      pal = { coat: '#ff3b30', coat2: '#c0392b', belly: '#ffd6d6', paw: '#ffb8b8', nose: '#231710' };
    }

    const [hx, hy] = dog.rendered.head;
    const eb = dog.ear_back_s || 0;

    // 0. 遠側立耳
    const feTip = [hx - d * (9 + 17 * eb) * S, hy - (36 - 17 * eb) * S];
    ctx.beginPath();
    ctx.moveTo(hx - d * 2 * S, hy - 14 * S);
    ctx.lineTo(feTip[0], feTip[1]);
    ctx.lineTo(hx - d * 10 * S, hy - 13 * S);
    ctx.closePath();
    ctx.fillStyle = shade(pal.coat2, 0.85);
    ctx.fill();

    // 1. 外輪廓底層
    DRAW_ORDER.forEach(([name, r, ck]) => {
      if (name === 'tongue' || ck === 'eye' || name === 'nose' || name.startsWith('ear_')) return;
      const [x, y] = dog.rendered[name];
      const rr = r * S + 1.6;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, TAU);
      ctx.fillStyle = shade(pal[ck], 0.45);
      ctx.fill();
    });

    // 2. 立體柔光球體與五官
    DRAW_ORDER.forEach(([name, r, ck]) => {
      if (name.startsWith('ear_')) return;
      const [x, y] = dog.rendered[name];
      const rr = r * S;
      if (name === 'tongue') {
        if (dog.tongue) {
          ctx.beginPath();
          ctx.ellipse(x, y + rr * 0.35, rr * 0.82, rr * 1.1, 0, 0, TAU);
          ctx.fillStyle = '#ff7b93';
          ctx.fill();
          ctx.strokeStyle = '#b83b52';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        return;
      }
      if (ck === 'eye') {
        drawEye(ctx, x, y, rr, dog.look[0] * d, dog.look[1], dog.eyes, pal.coat, name === 'eye_n');
        return;
      }
      if (name === 'nose') {
        ctx.beginPath();
        ctx.ellipse(x, y, rr * 1.05, rr * 0.85, 0, 0, TAU);
        ctx.fillStyle = pal.nose;
        ctx.fill();
        return;
      }
      let col = pal[ck];
      if (FAR_SIDE.has(name)) col = shade(col, 0.84);
      drawSphere(ctx, x, y, rr, col);

      // 大麥町黑斑點
      if (breed === '大麥町' && ['hip', 'mid', 'chest', 'head'].includes(name)) {
        ctx.beginPath();
        ctx.arc(x - d * rr * 0.25, y - rr * 0.2, rr * 0.24, 0, TAU);
        ctx.arc(x + d * rr * 0.3, y + rr * 0.15, rr * 0.18, 0, TAU);
        ctx.fillStyle = '#2b2b2b';
        ctx.fill();
      }

      // 脖子紅項圈與金鈴鐺
      if (name === 'neck' && dog.roll_ang === 0) {
        const [cx, cy] = dog.rendered.chest;
        const mx = cx * 0.42 + hx * 0.58;
        const my = cy * 0.42 + hy * 0.58;
        ctx.beginPath();
        ctx.moveTo(mx - d * 10 * S, my - 6 * S);
        ctx.lineTo(mx + d * 12 * S, my + 8 * S);
        ctx.strokeStyle = '#e03c31';
        ctx.lineWidth = 4.5 * S;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mx + d * 12 * S, my + 10 * S, 4.6 * S, 0, TAU);
        ctx.fillStyle = '#ffd54f';
        ctx.fill();
        ctx.strokeStyle = '#b28900';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // 臉頰腮紅
      if (name === 'blaze') {
        const [ex, ey] = dog.rendered.eye_n;
        ctx.beginPath();
        ctx.ellipse(ex - d * 1 * S, ey + 8.5 * S, 6 * S, 3.5 * S, 0, 0, TAU);
        ctx.fillStyle = '#f48fb1';
        ctx.fill();
      }
    });

    // 3. 近側柯基大立耳
    const neTip = [hx - d * (5 + 20 * eb) * S, hy - (38 - 19 * eb) * S];
    ctx.beginPath();
    ctx.moveTo(hx + d * 2 * S, hy - 14 * S);
    ctx.lineTo(neTip[0], neTip[1]);
    ctx.lineTo(hx - d * 8 * S, hy - 14 * S);
    ctx.closePath();
    ctx.fillStyle = pal.coat2;
    ctx.fill();
    ctx.strokeStyle = shade(pal.coat, 0.45);
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hx + d * 0.5 * S, hy - 15 * S);
    ctx.lineTo(neTip[0] + d * 1 * S, neTip[1] + 5 * S);
    ctx.lineTo(hx - d * 6.2 * S, hy - 15 * S);
    ctx.closePath();
    ctx.fillStyle = '#f8bbd0';
    ctx.fill();

    // 4. 變裝配件（博士帽、墨鏡、紅領巾、小皇冠）
    if (acc && acc !== 'none') {
      ctx.save();
      ctx.font = `${Math.round(24 * S)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (acc === 'grad_cap') ctx.fillText('🎓', hx, hy - 26 * S);
      if (acc === 'crown') ctx.fillText('👑', hx, hy - 26 * S);
      if (acc === 'sunglasses') {
        const [ex, ey] = dog.rendered.eye_n;
        ctx.fillText('🕶️', ex + d * 4 * S, ey + 1 * S);
      }
      if (acc === 'scarf') {
        const [nx, ny] = dog.rendered.neck;
        ctx.fillText('🧣', nx + d * 4 * S, ny + 8 * S);
      }
      ctx.restore();
    }
  }

  function renderWorld(ctx) {
    ctx.clearRect(0, 0, world.W, world.H);
    const S = world.S;
    const fl = world.floor;

    // 1. 藏骨頭土堆
    if (world.buriedBone) {
      const bb = world.buriedBone;
      ctx.beginPath();
      ctx.ellipse(bb.x, fl, 24 * S, 10 * S, 0, Math.PI, TAU);
      ctx.fillStyle = '#8b5a2b';
      ctx.fill();
      ctx.font = `bold ${Math.round(13 * S)}px "Microsoft JhengHei UI", sans-serif`;
      ctx.fillStyle = '#e67e22';
      ctx.textAlign = 'center';
      ctx.fillText(bb.stage === 'digging' ? '🐾 挖掘中！🦴' : '🦴❓ 寶藏土堆', bb.x, fl - 18 * S);
    }

    // 2. 飯碗／特級罐頭
    if (world.bowl) {
      const b = world.bowl;
      const bw = 26 * S, bh = 14 * S;
      ctx.fillStyle = b.kind === 'can' ? '#feca57' : '#ff6b6b';
      ctx.beginPath();
      ctx.roundRect(b.x - bw, fl - bh, bw * 2, bh, 6);
      ctx.fill();
      ctx.strokeStyle = '#4a3b32';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (b.food > 0) {
        ctx.beginPath();
        ctx.ellipse(b.x, fl - bh, bw * 0.85 * Math.min(1, b.food), 6 * S, 0, 0, TAU);
        ctx.fillStyle = '#8b4513';
        ctx.fill();
      }
    }

    // 3. 繪製狗狗與雨傘
    const appState = window.PUPPY_GET_STATE ? window.PUPPY_GET_STATE() : null;
    const pid = (appState && appState.pets && appState.pets.current) || 'dog:威爾斯柯基';
    const acc = (appState && appState.pets && appState.pets.acc) || 'none';
    drawDogFull(ctx, world.dog, pid, acc);
    if (world.dog.state === 'fall' && pid.startsWith('dog:')) {
      drawUmbrella(ctx, world.dog);
    }

    // 4. 繪製玩具（皮球、飛盤、毛線球、潔牙骨）
    world.toys.forEach(t => {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rot);
      if (t.kind === 'ball') {
        drawSphere(ctx, 0, 0, t.r * S, '#ff5252');
        ctx.beginPath();
        ctx.arc(0, 0, t.r * S * 0.65, -0.5, 1.2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (t.kind === 'frisbee') {
        ctx.beginPath();
        ctx.ellipse(0, 0, 20 * S, 7 * S, 0, 0, TAU);
        ctx.fillStyle = '#00d2d3';
        ctx.fill();
        ctx.strokeStyle = '#01a3a4';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (t.kind === 'yarn') {
        drawSphere(ctx, 0, 0, t.r * S, '#ff9ff3');
      } else if (t.kind === 'dental_bone') {
        const sc = Math.max(0.45, t.remain) * S;
        ctx.fillStyle = '#ffda79';
        ctx.strokeStyle = '#b28900';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-14 * sc, -4.5 * sc, 28 * sc, 9 * sc, 4);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });

    // 5. 繪製蒼蠅
    if (world.fly) {
      const f = world.fly;
      ctx.font = `${Math.round(18 * S)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🪰', f.x, f.y);
    }

    // 6. 繪製粒子（愛心、音符、星星、洗澡泡泡、水滴、Zzz）
    world.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      if (p.kind === 'bubble') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fillStyle = 'rgba(178, 235, 242, 0.45)';
        ctx.fill();
        ctx.strokeStyle = '#4dd0e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (p.kind === 'drip') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, TAU);
        ctx.fillStyle = '#48dbfb';
        ctx.fill();
      } else if (p.kind === 'dirt') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, TAU);
        ctx.fillStyle = '#8b5a2b';
        ctx.fill();
      } else {
        ctx.font = 'bold 18px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        const txt = p.kind === 'heart' ? '❤️' : p.kind === 'note' ? '🎵' : p.kind === 'zzz' ? '💤' : '✨';
        ctx.fillText(txt, p.x, p.y);
      }
      ctx.restore();
    });

    // 7. 狗狗頭頂對話小氣泡（v3.5.0：坐在角落時不畫，避免蓋住題目和鍵盤；側欄的對話框會顯示同一句話）
    if (!world.peekMode && world.speech.timer > 0 && world.speech.text) {
      const [hx, hy] = world.dog.rendered.head || [world.dog.x, world.dog.y - 65 * S];
      const bx = clamp(hx, 150, world.W - 150);
      const by = Math.max(48, hy - 54 * S);
      ctx.save();
      ctx.font = 'bold 14px "Microsoft JhengHei UI", sans-serif';
      const msg = world.speech.text.length > 26 ? world.speech.text.slice(0, 26) + '…' : world.speech.text;
      const tw = Math.min(300, ctx.measureText(msg).width + 26);
      ctx.fillStyle = 'rgba(255, 253, 248, 0.96)';
      ctx.strokeStyle = world.speech.col || '#2fa86b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(bx - tw / 2, by - 18, tw, 34, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#4a3b32';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(msg, bx, by - 1);
      ctx.restore();
    }
  }

  // ── 7. 初始化全畫面舞台與觸控／滑鼠事件 ──
  function initPetEngine() {
    const cv = document.getElementById('worldCanvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');

    function resize() {
      world.W = window.innerWidth;
      world.H = window.innerHeight;
      world.floor = window.innerHeight - 64;
      cv.width = world.W;
      cv.height = world.H;
      if (world.dog && !world.dog.busy()) {
        world.dog.y = world.floor;
        world.dog.x = clamp(world.dog.x, 70, world.W - 70);
      }
    }
    window.addEventListener('resize', resize);
    resize();

    world.dog = new Dog();

    let dragMode = null; // 'dog' | 'rub' | 'toy'
    let draggedToy = null;
    let downPt = { x: 0, y: 0, t: 0 };
    let lastPt = { x: 0, y: 0 };
    let vxTrack = 0, vyTrack = 0;

    function getPt(ev) {
      if (ev.changedTouches && ev.changedTouches.length) {
        return { x: ev.changedTouches[0].clientX, y: ev.changedTouches[0].clientY };
      }
      return { x: ev.clientX, y: ev.clientY };
    }

    function onDown(ev) {
      const tg = ev.target;
      if (tg && tg.closest && tg.closest('button, a, input, select, textarea, label, .checkin-item, .modal-backdrop.open')) return;
      const pt = getPt(ev);
      world.mouse.x = pt.x;
      world.mouse.y = pt.y;
      world.mouse.down = true;

      // 先檢查是否點到玩具
      for (const t of world.toys) {
        if (Math.hypot(pt.x - t.x, pt.y - t.y) <= 26 * world.S) {
          dragMode = 'toy';
          draggedToy = t;
          t.held = true;
          t.carried = false;
          if (world.dog.carry === t) world.dog.carry = null;
          lastPt = pt;
          ev.preventDefault();
          return;
        }
      }

      // 檢查是否點到狗狗
      if (world.dog.hit(pt.x, pt.y)) {
        downPt = { x: pt.x, y: pt.y, t: performance.now() };
        lastPt = pt;
        vxTrack = 0;
        vyTrack = 0;
        dragMode = world.dog.hitHead(pt.x, pt.y) ? 'rub_or_drag' : 'drag_wait';
        ev.preventDefault();
      }
    }

    function onMove(ev) {
      const pt = getPt(ev);
      const dx = pt.x - lastPt.x;
      const dy = pt.y - lastPt.y;
      vxTrack = dx;
      vyTrack = dy;
      lastPt = pt;
      world.mouse.x = pt.x;
      world.mouse.y = pt.y;

      if (!dragMode) {
        // 滑鼠經過狗頭輕輕摸摸
        if (world.dog && world.dog.hitHead(pt.x, pt.y) && Math.hypot(dx, dy) > 3) {
          world.dog.head_pet_time += 0.04;
          if (Math.random() < 0.08) world.dog.emitHeart();
        }
        return;
      }

      const distFromDown = Math.hypot(pt.x - downPt.x, pt.y - downPt.y);
      if (dragMode === 'toy' && draggedToy) {
        draggedToy.x = pt.x;
        draggedToy.y = pt.y;
        ev.preventDefault();
      } else if (dragMode === 'rub_or_drag') {
        // 往上拉超過 28px ＝ 拎起狗狗；左右來回 ＝ 摸摸頭與翻肚肚
        if (downPt.y - pt.y > 32) {
          dragMode = 'dog';
          world.dog.hx = pt.x;
          world.dog.hy = pt.y;
          world.dog.setState('held', 999);
          playTone('yip');
        } else if (distFromDown > 8) {
          world.dog.head_pet_time += 0.08;
          world.dog.rub_t = 2.5;
          if (world.dog.head_pet_time > 1.2 && world.dog.state !== 'belly_rub') {
            world.dog.command('belly_rub', true);
          } else if (world.dog.state !== 'belly_rub' && world.dog.state !== 'happy') {
            world.dog.setState('happy', 3.0);
            world.dog.emitHeart();
          }
        }
        ev.preventDefault();
      } else if (dragMode === 'drag_wait' && distFromDown > 14) {
        dragMode = 'dog';
        world.dog.hx = pt.x;
        world.dog.hy = pt.y;
        world.dog.setState('held', 999);
        playTone('yip');
        ev.preventDefault();
      } else if (dragMode === 'dog') {
        ev.preventDefault();
      }
    }

    function onUp(ev) {
      world.mouse.down = false;
      if (!dragMode) return;
      const pt = getPt(ev);
      const dist = Math.hypot(pt.x - downPt.x, pt.y - downPt.y);

      if (dragMode === 'toy' && draggedToy) {
        draggedToy.held = false;
        if (window.PUPPY_ON_TOY_THROW && !window.PUPPY_ON_TOY_THROW(draggedToy)) {
          // v3.3.0：餓了或這個玩具丟夠多次了 → 收起來
          world.toys = world.toys.filter(t => t !== draggedToy);
          if (world.dog.fetch_toy === draggedToy) world.dog.fetch_toy = null;
          playTone('pop');
        } else {
          draggedToy.vx = clamp(vxTrack * 0.85, -18, 18);
          draggedToy.vy = clamp(vyTrack * 0.85 - 3, -18, 12);
          world.dog.fetch_toy = draggedToy;
          world.dog.setState('fetch', 22);
          playTone('yip');
        }
        draggedToy = null;
      } else if (dragMode === 'dog') {
        world.dog.fx = world.dog.hx;
        world.dog.fy = world.dog.hy;
        world.dog.fvx = clamp(vxTrack * 0.35, -6, 6);
        world.dog.fvy = 2.5;
        world.dog.setState('fall', 15);
        playTone('pop');
      } else if (dist < 14) {
        // 單擊狗狗
        if (world.dog.hitHead(pt.x, pt.y)) {
          world.dog.emitHeart();
          playTone('yip');
          world.dog.setState('happy', 2.8);
        } else {
          // 戳身體：生氣計數或禮貌走開一點
          const now = performance.now() / 1000;
          world.dog.poke_times = world.dog.poke_times.filter(t => now - t < 3.0);
          world.dog.poke_times.push(now);
          if (world.dog.poke_times.length >= 6) {
            world.dog.poke_times = [];
            world.dog.setState('angry', 4.0);
            playTone('growl');
            world.speech = { text: '💢 汪！戳太多次生氣氣了喔！', timer: 3.5, col: '#e5534b' };
          } else {
            playTone('yip');
            world.dog.emitHeart();
            world.dog.target = world.dog.pickTarget(150, 260);
            world.dog.setState('walk', 5.0);
          }
        }
      }
      dragMode = null;
    }

    window.addEventListener('mousedown', onDown, { passive: false });
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp, { passive: false });
    window.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp, { passive: false });

    // 主迴圈 (60 FPS)
    let lastTs = performance.now();
    function loop(ts) {
      const dt = clamp((ts - lastTs) / 1000, 0.005, 0.08);
      lastTs = ts;
      const f = dt * 60;
      world.t += dt;

      if (world.speech.timer > 0) world.speech.timer = Math.max(0, world.speech.timer - dt);

      // 蒼蠅移動
      if (world.fly) {
        const fl = world.fly;
        fl.t += dt;
        fl.x = clamp(fl.x + fl.vx * f + Math.sin(fl.t * 9) * 2.2, 70, world.W - 70);
        fl.y = clamp(fl.y + fl.vy * f + Math.cos(fl.t * 12) * 1.8, world.floor - 165, world.floor - 55);
        fl.vy *= 0.9;
        if (Math.random() < 0.04) fl.vx = rand(-3.5, 3.5);
      }

      world.toys.forEach(t => t.step(dt, f));
      world.dog.step(dt, f);

      world.particles.forEach(p => {
        p.x += p.vx * f;
        p.y += p.vy * f;
        if (p.kind === 'drip' || p.kind === 'dirt') p.vy += 0.35 * f;
        p.life -= dt;
      });
      world.particles = world.particles.filter(p => p.life > 0);

      renderWorld(ctx);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // ── 8. 對外公開給 app.js 與互動按鈕呼叫的 API ──
  window.PuppyInteractive = {
    init: initPetEngine,
    say(text, mood = 'normal', col = '#2fa86b') {
      world.speech = { text, timer: 4.5, col };
      if (!world.dog) return;
      if (mood === 'happy') {
        world.dog.emitHeart();
        if (!world.dog.busy() && !['eat', 'fetch', 'return', 'copter'].includes(world.dog.state)) {
          world.dog.setState('happy', 2.8);
          playTone('yip');
        }
      }
    },
    command(cmd) {
      if (!world.dog) return;
      world.dog.command(cmd, true);
    },
    throwToy(kind = 'ball') {
      if (!world.dog) return;
      world.toys = world.toys.filter(t => t.kind !== kind);
      const startX = clamp(world.dog.x + (Math.random() < 0.5 ? -180 : 180), 80, world.W - 80);
      const startY = world.floor - 150 * world.S;
      const vx = (startX < world.W * 0.5 ? 1 : -1) * rand(5, 9);
      const vy = kind === 'frisbee' ? -2.5 : -6.5;
      const toy = new Toy(kind, startX, startY, vx, vy);
      world.toys.push(toy);
      world.dog.fetch_toy = toy;
      world.dog.setState('fetch', 22);
      playTone('boing');
    },
    feedBowl(kind = 'bowl') {
      if (!world.dog) return;
      const bx = clamp(world.dog.x + (world.dog.x < world.W * 0.5 ? 150 : -150), 90, world.W - 90);
      world.bowl = { kind, x: bx, food: 1.0 };
      world.dog.setState('goto_bowl', 25);
      playTone('pop');
    },
    buryBone() {
      if (!world.dog) return;
      const bx = clamp(world.dog.x + (world.dog.x < world.W * 0.5 ? 210 : -210), 100, world.W - 100);
      world.buriedBone = { x: bx, stage: 'buried', dig_t: 0, pop_t: 0 };
      world.dog.setState('sniff_bone', 30);
      playTone('pop');
    },
    spawnFly() {
      if (!world.dog) return;
      world.fly = { x: clamp(world.dog.x + 120, 90, world.W - 90), y: world.floor - 110, vx: 2.2, vy: 0, t: 0 };
      world.dog.setState('chase_fly', 10);
      playTone('pop');
    },
    isPeek() {
      return world.peekMode;
    },
    setPeek(on) {
      if (!!on !== world.peekMode) this.togglePeek();
      return world.peekMode;
    },
    togglePeek() {
      world.peekMode = !world.peekMode;
      if (world.peekMode && world.dog) {
        world.dog.x = clamp(world.W - 85 * world.S, 80, world.W - 80);
        world.dog.dir = -1;
        world.dog.setState('sit', 30);
      } else if (world.dog) {
        world.dog.chooseNext();
      }
      return world.peekMode;
    },
    selfTest() {
      try {
        const cv = document.getElementById('worldCanvas');
        const ctx = cv.getContext('2d');
        const allStates = [
          'walk', 'sit', 'lie', 'sleep', 'happy', 'yawn', 'scratch', 'paw',
          'play_paws', 'angry', 'chase_tail', 'bath', 'dance', 'downdog',
          'split', 'belly_rub', 'chew_bone', 'copter', 'dig', 'roll',
          'held', 'fall', 'eat', 'shake', 'bark'
        ];
        ['ball', 'frisbee', 'yarn', 'dental_bone'].forEach(k => this.throwToy(k));
        this.feedBowl('can');
        this.buryBone();
        this.spawnFly();
        allStates.forEach(st => {
          world.dog.setState(st, 3.0);
          world.dog.step(0.016, 1.0);
          renderWorld(ctx);
        });
        world.toys = [];
        world.bowl = null;
        world.buriedBone = null;
        world.fly = null;
        world.dog.setState('walk', 5.0);
        document.body.dataset.petSelftest = 'PASS:' + allStates.length;
        return true;
      } catch (e) {
        document.body.dataset.petSelftest = 'FAIL:' + (e && e.message ? e.message : String(e));
        return false;
      }
    }
  };
  if (location.search.includes('selftest=1')) {
    window.addEventListener('load', () => setTimeout(() => window.PuppyInteractive.selfTest(), 100));
  }
})();
