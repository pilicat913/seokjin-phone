/* 通用工具：元素创建、时间、图标、素材、声音、存储、横幅 */
(function () {
  const S = window.STORY, A = window.ASSETS;

  /* ---------- DOM ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const svg = (inner, vb = '0 0 24 24', cls = '') =>
    h('span', { class: 'svgwrap ' + cls, html: `<svg viewBox="${vb}" aria-hidden="true">${inner}</svg>` }).firstChild;

  /* ---------- 时间 ---------- */
  const WD = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const NOW = S.now;
  function parse(t) { // 'MM-DD HH:MM' 或 'YYYY-MM-DD HH:MM'
    const [md, hm] = t.split(' ');
    const parts = md.split('-').map(Number);
    const [y, m, d] = parts.length === 3 ? parts : [NOW.y, ...parts];
    const [hh, mm] = hm.split(':').map(Number);
    return { y, m, d, hh, mm, key: t, t: new Date(y, m - 1, d, hh, mm).getTime() };
  }
  const dateObj = (p) => new Date(p.y, p.m - 1, p.d);
  const dayDiff = (p) => Math.round((new Date(NOW.y, NOW.m - 1, NOW.d) - dateObj(p)) / 864e5);
  const pad = (n) => String(n).padStart(2, '0');
  function ampm(p) {
    const h12 = p.hh % 12 === 0 ? 12 : p.hh % 12;
    const tag = p.hh < 12 ? '上午' : '下午';
    return `${tag} ${h12}:${pad(p.mm)}`;
  }
  function listDate(p) {
    const dd = dayDiff(p);
    if (dd === 0) return ampm(p).replace(' ', '');
    if (dd === 1) return '昨天';
    if (p.y !== NOW.y) return `${p.y}. ${p.m}. ${p.d}.`;
    return `${p.m}月${p.d}日`;
  }
  const fullDate = (p) => `${p.y}年${p.m}月${p.d}日 ${WD[dateObj(p).getDay()]}`;
  const clock = () => `${pad(NOW.hh)}:${pad(NOW.mm)}`;
  const lockDate = () => `${NOW.m}月${NOW.d}日 ${WD[new Date(NOW.y, NOW.m - 1, NOW.d).getDay()]}`;
  function notifTime(p) {
    const mins = (NOW.hh * 60 + NOW.mm) - (p.hh * 60 + p.mm) + dayDiff(p) * 1440;
    if (mins <= 0) return '现在';
    if (mins < 60) return `${mins}分钟前`;
    if (dayDiff(p) === 0) return `${pad(p.hh)}:${pad(p.mm)}`;
    if (dayDiff(p) === 1) return '昨天';
    return `${p.m}/${p.d}`;
  }

  /* ---------- 存储（会话内保留进度） ---------- */
  const KEY = 'sj-phone-v9';
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
  const store = {
    get: (k, d) => (k in saved ? saved[k] : d),
    set: (k, v) => { saved[k] = v; try { sessionStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} },
  };

  /* ---------- 图标（商标位置全部是可替换槽位） ---------- */
  const G = {
    phone: '<path d="M21 16.4v2.8a1.9 1.9 0 0 1-2 1.9 18.5 18.5 0 0 1-8.1-2.9 18.2 18.2 0 0 1-5.6-5.6A18.5 18.5 0 0 1 2.4 4.5 1.9 1.9 0 0 1 4.3 2.5h2.8a1.9 1.9 0 0 1 1.9 1.6c.1.9.3 1.7.6 2.5a1.9 1.9 0 0 1-.4 2L8 9.8a15 15 0 0 0 5.6 5.6l1.2-1.2a1.9 1.9 0 0 1 2-.4c.8.3 1.6.5 2.5.6a1.9 1.9 0 0 1 1.7 2z"/>',
    messages: '<path d="M20.5 11.3c0 4.3-3.9 7.7-8.6 7.7-1 0-2-.2-2.9-.5L4 20l1.3-3.5c-1.1-1.4-1.8-3.1-1.8-5.2 0-4.3 3.9-7.8 8.5-7.8s8.5 3.5 8.5 7.8z"/>',
    safari: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3z"/>',
    camera: '<path d="M4 8.2c0-1 .8-1.7 1.7-1.7h2l1.5-2h5.6l1.5 2h2c1 0 1.7.8 1.7 1.7v9.1c0 1-.8 1.7-1.7 1.7H5.7C4.8 19 4 18.2 4 17.3z"/><circle cx="12" cy="12.6" r="3.4"/>',
    photos: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="9.8" r="1.6"/><path d="M20.5 15.5l-4.6-4.6-8.4 8.6"/>',
    notes: '<path d="M6.5 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5z"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    maps: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
    weather: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    chat: '',
  };
  function iconEl(id) {
    const slot = (A.icons && A.icons[id]) || {};
    if (slot.src) return h('img', { class: 'icon-img', src: slot.src, alt: '' });
    if (id === 'calendar') {
      const wd = WD[new Date(NOW.y, NOW.m - 1, NOW.d).getDay()];
      return h('div', { class: 'icon-fallback', style: 'background:#fff;color:#111;display:flex;flex-direction:column;gap:0' },
        h('div', { style: 'font-size:10px;font-weight:600;color:#ff6b61;margin-top:2px' }, wd),
        h('div', { style: 'font-size:30px;font-weight:300;line-height:1' }, NOW.d));
    }
    if (id === 'clock') {
      return h('div', { class: 'icon-fallback', style: 'background:#2c2c2e', html:
        '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 12l3.2-5.6M12 12V5.2"/></svg>' });
    }
    if (id === 'chat') return h('div', { class: 'icon-fallback', style: 'background:#f2d600' });
    return h('div', { class: 'icon-fallback', style: 'background:#2c2c2e', html:
      `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${G[id] || ''}</svg>` });
  }
  const iconLabel = (id) => ((A.icons && A.icons[id]) || {}).label || id;

  /* ---------- 头像 ---------- */
  const SIL = '<svg viewBox="0 0 40 40"><circle cx="20" cy="15.5" r="7" fill="#fff"/><path d="M6.5 37c1.4-7.6 7-11.6 13.5-11.6S32.1 29.4 33.5 37" fill="#fff"/></svg>';
  function avatar(id, size = 48) {
    const src = A.avatars && A.avatars[id];
    const wrap = h('div', { class: 'av', style: `width:${size}px;height:${size}px` });
    if (src) wrap.append(h('img', { src, alt: '' }));
    else wrap.append(h('div', { class: 'av-empty', html: SIL }));
    return wrap;
  }
  const personName = (id) => (id === 'me' ? S.me.name : (S.people[id] || {}).name || '');

  /* ---------- 声音：用户手势解锁、实录消息音、可即时停止 ---------- */
  let ac = null, ready = false, muted = store.get('muted', false), volume = store.get('volume', .65);
  const active = new Map(), buffers = new Map();
  const paths = { msg: 'assets/sounds/katalk.mp3', alarm: 'assets/sounds/departure-alarm.wav' };
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {} }
    return ac;
  }
  async function loadSound(kind) {
    if (buffers.has(kind)) return buffers.get(kind);
    const task = fetch(paths[kind]).then(r => { if (!r.ok) throw Error('Missing audio'); return r.arrayBuffer(); })
      .then(b => audio().decodeAudioData(b)).catch(() => { buffers.delete(kind); return null; });
    buffers.set(kind, task); return task;
  }
  function unlockAudio() {
    const c = audio(); if (!c) return;
    c.resume().then(() => { ready = c.state === 'running'; }).catch(() => {});
    loadSound('msg'); loadSound('alarm');
  }
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
  function track(kind, source, gain) {
    if (!active.has(kind)) active.set(kind, new Set());
    const rec = { source, gain }; active.get(kind).add(rec);
    source.onended = () => { active.get(kind)?.delete(rec); source.disconnect(); gain.disconnect(); };
  }
  const generations = {};
  function stop(kind) {
    generations[kind] = (generations[kind] || 0) + 1;
    for (const rec of active.get(kind) || []) { try { rec.source.stop(); } catch (_) {} }
    active.delete(kind);
  }
  function stopAll() { for (const k of [...active.keys(), ...Object.keys(paths)]) stop(k); }
  async function sample(kind, loop = false) {
    if (muted || !ready) return;
    stop(kind); const generation = generations[kind];
    const buffer = await loadSound(kind);
    if (!buffer || muted || !ready || generation !== generations[kind]) return;
    const c = audio(), src = c.createBufferSource(), g = c.createGain();
    src.buffer = buffer; src.loop = loop; g.gain.value = volume * (kind === 'alarm' ? .55 : .8);
    src.connect(g).connect(c.destination); track(kind, src, g); src.start();
  }
  function tone(freqs, dur = .12, gain = .06, type = 'sine', kind = 'tap') {
    const c = audio(); if (!c || !ready || muted) return;
    let t = c.currentTime;
    for (const f of freqs) {
      if (!f) { t += dur * .8; continue; }
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain*volume,t+.01);
      g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g).connect(c.destination); track(kind,o,g); o.start(t);o.stop(t+dur+.02);t+=dur*.8;
    }
  }
  let lastMsg = -Infinity;
  const sound = {
    unlockAudio,
    tap: () => {},
    msg: () => { if (performance.now()-lastMsg < 1200) return; lastMsg=performance.now(); sample('msg'); },
    wrong: () => tone([200,160],.1,.035,'triangle','wrong'),
    unlock: () => {},
    ring: () => tone([659,784,988,784,659,784,988,1175],.16,.05,'sine','ring'),
    alarm: () => sample('alarm', true),
    stop, stopAll,
    get muted() { return muted; },
    get volume() { return volume; },
    setMuted(v) { muted=!!v;store.set('muted',muted);if(muted)stopAll(); },
    setVolume(v) { volume=Math.max(0,Math.min(1,Number(v)));store.set('volume',volume);
      for(const [k,set] of active) for(const rec of set) rec.gain.gain.value=volume*(k==='alarm'?.55:k==='msg'?.8:.05); },
  };
  document.addEventListener('visibilitychange', () => { if(document.hidden) { stopAll(); document.dispatchEvent(new Event('phone:audio-pause')); } });
  window.addEventListener('pagehide', stopAll);

  function haptic(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

  /* ---------- 横幅 ---------- */
  const bannerLayer = () => document.getElementById('banner-layer');
  let bannerTimer = null;
  function banner({ appId, title, text, onOpen }) {
    const layer = bannerLayer();
    layer.innerHTML = '';
    const card = h('button', { class: 'ncard banner-in', type: 'button' },
      h('div', { class: 'napp' }, iconEl(appId)),
      h('div', { class: 'nbody' },
        h('div', { class: 'nhead' }, h('span', null, title), h('span', { class: 'ntime' }, '现在')),
        h('div', { class: 'ntext' }, text)));
    const close = () => {
      clearTimeout(bannerTimer);
      if (!card.isConnected) return;
      card.classList.remove('banner-in'); card.classList.add('banner-out');
      setTimeout(() => card.remove(), 320);
    };
    card.addEventListener('click', () => { close(); onOpen && onOpen(); });
    // 上滑收起
    let sy = null;
    card.addEventListener('pointerdown', (e) => { sy = e.clientY; });
    card.addEventListener('pointerup', (e) => { if (sy != null && sy - e.clientY > 25) { e.stopPropagation(); close(); } sy = null; });
    layer.append(card);
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(close, 5200);
    if(appId === 'chat')sound.msg(); haptic(40);
  }

  window.UI = { h, svg, parse, listDate, fullDate, ampm, clock, lockDate, notifTime, dayDiff, pad, store, iconEl, iconLabel, avatar, personName, sound, haptic, banner, WD };
})();
