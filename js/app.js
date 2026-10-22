/* 手机外壳：锁屏、密码、主屏幕、应用窗口 */
(function () {
  const S = window.STORY, A = window.ASSETS, U = window.UI, { h } = U;
  const layers = document.getElementById('layers');
  const bar = document.getElementById('statusbar');
  const indicator = document.getElementById('home-indicator');
  const screenEl = document.getElementById('screen');

  /* ---------- 尺寸 ---------- */
  function fit() {
    const full = window.innerWidth <= 600;
    document.body.classList.toggle('fullscreen', full);
    if (full) { window.__scale = 1; document.getElementById('device').style.setProperty('--scale',1); return; }
    const s = Math.min(1, (window.innerHeight - 40) / (844 + 24), (window.innerWidth - 40) / (390 + 24));
    window.__scale = s;
    document.getElementById('device').style.setProperty('--scale', s);
  }
  window.addEventListener('resize', fit); fit();

  function paintClock() {
    document.querySelectorAll('[data-clock="short"]').forEach((el) => (el.textContent = U.clock()));
    const lt = document.querySelector('.lock-time'); if (lt) lt.textContent = U.clock();
    const ld = document.querySelector('.lock-date'); if (ld) ld.textContent = U.lockDate();
  }
  paintClock();

  /* ---------- 状态 ---------- */
  let mode = 'lock'; // lock | passcode | home | app
  let pending = null; // 解锁后要打开的目标
  let appWin = null, appInst = null, appId = null;
  const APPS = { chat: window.Chat, ...window.APPS };
  function setTone(t) { // 'light' = 白字（深色背景）, 'dark' = 黑字
    bar.classList.toggle('sb-dark', t === 'dark');
    indicator.classList.toggle('dark', t === 'dark');
  }

  /* ---------- 通知汇总 ---------- */
  function smsNotifs() {
    const read = new Set(U.store.get('readSms', []));
    const out = [];
    S.sms.forEach((t) => t.messages.forEach((m, i) => {
      const id = `${t.id}-${i}`;
      if (m[3] && m[3].unread && !read.has(id)) out.push({ app: 'messages', target: { thread: t.id }, p: U.parse(m[0]), title: t.name, text: m[2] });
    }));
    return out;
  }
  function callNotifs() {
    return S.calls.filter((c) => c.fresh && !c.seen && c[2] === 'missed').map((c) => {
      const ct = S.contacts.find((x) => x.id === c[1]);
      return { app: 'phone', target: { tab: 'recents' }, p: U.parse(c[0]), title: '未接来电', text: ct ? ct.name : c[1] };
    });
  }
  const allNotifs = () => [...window.Chat.notifications(), ...smsNotifs(), ...callNotifs()];
  const cmp = (a, b) => b.p.t - a.p.t;
  const badgeOf = (id) => (id === 'chat' ? window.Chat.totalUnread() : id === 'messages' ? smsNotifs().length : id === 'phone' ? callNotifs().length : 0);

  /* ---------- 壁纸 ---------- */
  function wallpaper(kind) {
    const src = A.wallpaper && A.wallpaper[kind];
    const el = h('div', { class: 'wallpaper' + (src ? '' : ' is-empty') });
    if (src) el.style.backgroundImage = `url("${src}")`;
    return el;
  }

  /* ============ 锁屏 ============ */
  let lockLayer = null;
  function renderLock() {
    clear();
    mode = 'lock';
    bar.classList.add('on-lock');
    setTone('light');
    indicator.classList.remove('hidden');
    const inner = h('div', { class: 'lock-inner' },
      h('span', { class: 'lock-padlock', html: '<svg viewBox="0 0 15 20" fill="#fff"><path d="M3 8V5.5a4.5 4.5 0 0 1 9 0V8h.5A2.5 2.5 0 0 1 15 10.5v7a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 0 17.5v-7A2.5 2.5 0 0 1 2.5 8zm1.8 0h5.4V5.5a2.7 2.7 0 0 0-5.4 0z"/></svg>' }),
      h('div', { class: 'lock-date' }, U.lockDate()),
      h('div', { class: 'lock-time' }, U.clock()),
      notifArea(),
      h('div', { class: 'lock-actions' },
        h('button', { class: 'lock-btn', 'aria-label': '手电筒', html: '<svg viewBox="0 0 24 24"><path d="M8 2.5h8v4l-2 3V21a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V9.5l-2-3z"/><path d="M12 13v2"/></svg>' }),
        h('button', { class: 'lock-btn', 'aria-label': '相机', html: '<svg viewBox="0 0 24 24"><path d="M4 8.2c0-1 .8-1.7 1.7-1.7h2l1.5-2h5.6l1.5 2h2c1 0 1.7.8 1.7 1.7v9.1c0 1-.8 1.7-1.7 1.7H5.7C4.8 19 4 18.2 4 17.3z"/><circle cx="12" cy="12.6" r="3.4"/></svg>' })),
      h('div', { class: 'lock-hint' }, '向上轻扫以打开'));
    lockLayer = h('div', { class: 'layer lock' }, wallpaper('lock'), inner);
    layers.append(lockLayer);
    swipeUp(lockLayer, inner);
  }

  function notifArea() {
    const box = h('div', { class: 'lock-notifs' });
    const snz = window.Events && window.Events.snoozeCard && window.Events.snoozeCard();
    if (snz) box.append(snz);
    const ns = allNotifs().sort(cmp);
    // 和真机一样：按应用 + 对话分组（每个聊天室一叠）
    const groups = {};
    ns.forEach((n) => { const k = n.app + ':' + JSON.stringify(n.target); (groups[k] = groups[k] || []).push(n); });
    Object.values(groups).sort((a, b) => cmp(a[0], b[0])).forEach((list) => box.append(stack(list[0].app, list)));
    return box;
  }
  function card(n, onTap) {
    return h('button', { class: 'ncard', type: 'button', onclick: (e) => { e.stopPropagation(); if (onTap) return onTap(); pending = { app: n.app, args: n.target }; toPasscode(); } },
      h('div', { class: 'napp' }, U.iconEl(n.app)),
      h('div', { class: 'nbody' },
        h('div', { class: 'nhead' }, h('span', null, n.title), h('span', { class: 'ntime' }, U.notifTime(n.p))),
        h('div', { class: 'ntext' }, n.text)));
  }
  function stack(app, list) {
    const el = h('div', { class: 'nstack' + (list.length > 1 ? ' collapsed' : ''), 'data-count': list.length });
    const collapsed = () => {
      el.className = 'nstack' + (list.length > 1 ? ' collapsed' : '');
      el.innerHTML = '';
      el.append(card(list[0], list.length > 1 ? () => { U.sound.tap(); expanded(); } : null));
    };
    const expanded = () => {
      el.className = 'nstack nstack-enter';
      el.innerHTML = '';
      el.append(h('div', { class: 'nstack-head' }, h('span', null, U.iconLabel(app)),
        h('button', { onclick: (e) => { e.stopPropagation(); U.sound.tap(); collapsed(); } }, '显示更少')));
      list.forEach((n) => el.append(card(n)));
    };
    collapsed();
    return el;
  }

  // 锁屏通知跟着时间和新消息刷新（“34分钟前”会变）
  function refreshLock() {
    if (mode !== 'lock' || !lockLayer) return;
    const old = lockLayer.querySelector('.lock-notifs');
    if (old && !old.querySelector('.nstack-head')) old.replaceWith(notifArea());
  }
  window.Chat.onChange(() => refreshLock());

  function swipeUp(layer, inner) {
    let sy = null, dy = 0, t0 = 0, moved = false;
    layer.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.lock-btn')) return;
      sy = e.clientY; dy = 0; t0 = performance.now(); moved = false;
      inner.style.transition = 'none';
    });
    layer.addEventListener('pointermove', (e) => {
      if (sy == null) return;
      dy = Math.min(0, (e.clientY - sy) / (window.__scale || 1));
      if (dy < -8) moved = true;
      if (moved) { inner.style.transform = `translateY(${dy}px)`; inner.style.opacity = 1 + dy / 500; }
    });
    const end = () => {
      if (sy == null) return;
      sy = null;
      inner.style.transition = '';
      const v = dy / (performance.now() - t0);
      if (dy < -120 || (dy < -40 && v < -.5)) toPasscode();
      else { inner.style.transform = ''; inner.style.opacity = ''; }
    };
    layer.addEventListener('pointerup', end);
    layer.addEventListener('pointercancel', end);
    layer.addEventListener('click', (e) => { if (moved) e.stopPropagation(); }, true);
  }

  /* ============ 密码 ============ */
  let code = '';
  let pcDots = null;
  function toPasscode() {
    if (mode !== 'lock') return;
    mode = 'passcode';
    U.sound.tap();
    indicator.classList.add('hidden');
    const inner = lockLayer.querySelector('.lock-inner');
    inner.style.transform = 'translateY(-110%)'; inner.style.opacity = '0';
    code = '';
    pcDots = h('div', { class: 'pc-dots' }, h('i'), h('i'), h('i'), h('i'));
    const keys = [['1', ''], ['2', 'A B C'], ['3', 'D E F'], ['4', 'G H I'], ['5', 'J K L'], ['6', 'M N O'], ['7', 'P Q R S'], ['8', 'T U V'], ['9', 'W X Y Z'], ['0', '']];
    const pad = h('div', { class: 'pc-pad' }, keys.map(([d, l]) =>
      h('button', { class: 'pc-key' + (d === '0' ? ' zero' : ''), 'data-d': d, 'aria-label': d, onclick: () => press(d) }, h('b', null, d), l ? h('small', null, l) : null)));
    const delBtn = h('button', { onclick: () => (code ? erase() : cancel()) }, '取消');
    const layer = h('div', { class: 'layer passcode' }, wallpaper('lock'),
      h('div', { class: 'pc-inner' }, h('div', { class: 'pc-title' }, '输入密码'), pcDots, pad,
        h('div', { class: 'pc-foot' }, h('button', null, '紧急情况'), delBtn)));
    layer.style.opacity = '0'; layer.style.transition = 'opacity .3s';
    layers.append(layer);
    requestAnimationFrame(() => (layer.style.opacity = '1'));
    bar.classList.remove('on-lock');

    function paint() {
      [...pcDots.children].forEach((d, i) => d.classList.toggle('on', i < code.length));
      delBtn.textContent = code ? '删除' : '取消';
    }
    function press(d) {
      if (code.length >= 4) return;
      U.sound.tap(); U.haptic(8);
      const k = pad.querySelector(`[data-d="${d}"]`); k.classList.add('pressed'); setTimeout(() => k.classList.remove('pressed'), 120);
      code += d; paint();
      if (code.length === 4) setTimeout(check, 140);
    }
    function erase() { code = code.slice(0, -1); paint(); }
    function cancel() {
      layer.remove();
      mode = 'lock';
      const inn = lockLayer.querySelector('.lock-inner'); inn.style.transform = ''; inn.style.opacity = '';
      bar.classList.add('on-lock'); indicator.classList.remove('hidden');
      pending = null;
      document.removeEventListener('keydown', onKey);
    }
    function check() {
      if (code === S.passcode) {
        U.sound.unlock();
        document.removeEventListener('keydown', onKey);
        U.store.set('unlocked', true);
        window.Events && window.Events.onUnlock();
        renderHome(true);
        if (pending) { const p = pending; pending = null; setTimeout(() => openApp(p.app, p.args), 380); }
      } else {
        U.sound.wrong(); U.haptic([60, 40, 60]);
        pcDots.classList.add('shake');
        setTimeout(() => { pcDots.classList.remove('shake'); code = ''; paint(); }, 520);
      }
    }
    function onKey(e) {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') erase();
      else if (e.key === 'Escape') cancel();
    }
    document.addEventListener('keydown', onKey);
  }

  /* ============ 主屏幕 ============ */
  const GRID = ['calendar', 'photos', 'clock', 'maps', 'notes', 'chat', 'settings'];
  const DOCK = ['phone', 'safari', 'messages', 'camera'];
  let homeLayer = null;
  function appIcon(id, inDock) {
    const n = badgeOf(id);
    return h('button', { class: 'app', 'data-app': id, 'aria-label': U.iconLabel(id) + (n ? `，${n}条未读` : ''), onclick: (e) => openApp(id, null, e.currentTarget) },
      h('div', { class: 'app-icon' }, U.iconEl(id), n ? h('span', { class: 'badge' }, n) : null),
      inDock ? null : h('span', { class: 'app-label' }, U.iconLabel(id)));
  }
  function renderHome(animate) {
    clear();
    mode = 'home';
    bar.classList.remove('on-lock');
    setTone('light');
    indicator.classList.add('hidden');
    const weather = h('button', { class: 'widget w-weather', onclick: (e) => openApp('weather', null, e.currentTarget) },
      h('div', { class: 'w-city' }, '松州', h('span', { html: '<svg viewBox="0 0 24 24" width="11" height="11" fill="#fff"><path d="M21 3L3 10.5l7.5 2.5L13 21z"/></svg>' })),
      h('div', { class: 'w-temp' }, '16°'),
      h('div', { class: 'w-cond' }, h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M17 18H8a4.5 4.5 0 1 1 1-8.9 5.5 5.5 0 0 1 10.6 2A3.5 3.5 0 0 1 17 18z"/></svg>' }), '多云'),
      h('div', { class: 'w-range' }, '最高 23° 最低 13°'));
    const cal = h('button', { class: 'widget w-cal', onclick: (e) => openApp('calendar', null, e.currentTarget) },
      h('div', { class: 'w-wd' }, U.WD[new Date(S.now.y, S.now.m - 1, S.now.d).getDay()]),
      h('div', { class: 'w-day' }, S.now.d),
      h('div', { class: 'w-tmr' }, S.now.d === 21 ? '明天' : '今天'),
      h('div', { class: 'w-ev' }, h('div', { class: 'w-ev-t' }, '海'), h('div', { class: 'w-ev-s' }, '03:50')));
    const grid = h('div', { class: 'home-grid' }, weather, cal, GRID.map((id) => appIcon(id)));
    homeLayer = h('div', { class: 'layer home' + (animate ? ' home-enter' : '') }, wallpaper('home'),
      h('div', { class: 'home-pages' }, grid),
      h('div', { class: 'page-dots' }, h('span', null, h('i'))),
      h('div', { class: 'dock' }, DOCK.map((id) => appIcon(id, true))));
    layers.append(homeLayer);
  }
  function refreshBadges() {
    if (!homeLayer) return;
    homeLayer.querySelectorAll('.app').forEach((el) => {
      const id = el.dataset.app, n = badgeOf(id);
      const icon = el.querySelector('.app-icon');
      let b = icon.querySelector('.badge');
      if (n && !b) { b = h('span', { class: 'badge' }); icon.append(b); }
      if (b) { if (n) b.textContent = n; else b.remove(); }
      el.setAttribute('aria-label', U.iconLabel(id) + (n ? `，${n}条未读` : ''));
    });
  }
  window.Chat.onChange(refreshBadges);

  /* ============ 应用窗口 ============ */
  function openApp(id, args, fromEl) {
    const mod = APPS[id];
    if (mode === 'lock' || mode === 'passcode') { pending = { app: id, args }; toPasscode(); return; }
    if (!mod) { // 尚未开放的应用：图标轻弹一下
      const el = fromEl || (homeLayer && homeLayer.querySelector(`[data-app="${id}"]`));
      if (el) { el.classList.remove('bounce'); void el.offsetWidth; el.classList.add('bounce'); }
      return;
    }
    if (appWin && appId === id) { appInst.openRoom && args && args.room && appInst.openRoom(args.room); return; }
    if (appWin) closeApp(true);
    const src = fromEl || (homeLayer && homeLayer.querySelector(`[data-app="${id}"] .app-icon`));
    const sr = screenEl.getBoundingClientRect();
    let ox = 0, oy = 0;
    if (src) {
      const r = src.getBoundingClientRect(), sc = window.__scale || 1;
      ox = ((r.left + r.width / 2) - (sr.left + sr.width / 2)) / sc;
      oy = ((r.top + r.height / 2) - (sr.top + sr.height / 2)) / sc;
    }
    appWin = h('div', { class: 'layer appwin opening', style: `--ox:${ox}px;--oy:${oy}px;z-index:20` });
    appWin.addEventListener('animationend', () => appWin && appWin.classList.remove('opening'), { once: true });
    layers.append(appWin);
    appId = id; mode = 'app';
    indicator.classList.remove('hidden');
    const win = appWin;
    appInst = mod.mount(appWin, { args, setTone, isVisible: () => appWin === win && mode === 'app' }, args || {});
    rootEdgeSwipe(win);
    try { if (!(history.state && history.state.inApp)) history.pushState({ inApp: 1 }, ''); } catch (_) {}
    U.sound.tap();
    window.Events && window.Events.onAppOpened(id);
  }
  let ignorePop = false;
  function closeApp(instant, fromPop) {
    if (!appWin) return;
    if (!fromPop) { try { if (history.state && history.state.inApp) { ignorePop = true; history.back(); } } catch (_) {} }
    const w = appWin;
    appInst && appInst.destroy && appInst.destroy();
    appWin = null; appInst = null; appId = null;
    mode = 'home';
    indicator.classList.add('hidden');
    setTone('light');
    refreshBadges();
    if (instant) { w.remove(); return; }
    w.classList.remove('opening'); w.classList.add('closing');
    setTimeout(() => w.remove(), 320);
  }

  /* 浏览器 / 手机系统的“返回”：先退一页，退到底就回主屏幕 */
  window.addEventListener('popstate', () => {
    if (ignorePop) { ignorePop = false; return; }
    if (mode !== 'app') return;
    if (appInst && appInst.back && appInst.back()) { try { history.pushState({ inApp: 1 }, ''); } catch (_) {} }
    else closeApp(false, true);
  });
  /* 在应用最外层从左边缘往右滑，也能回到主屏幕 */
  function atRoot(win) {
    if (win.querySelector('.pv, .k-profile, .viewer')) return false;
    return [...win.children].filter((el) => el.classList.contains('page') && !el.classList.contains('push-out')).length <= 1;
  }
  function rootEdgeSwipe(win) {
    let sx = null, dx = 0, page = null;
    win.addEventListener('pointerdown', (e) => {
      const r = win.getBoundingClientRect();
      if ((e.clientX - r.left) / (window.__scale || 1) > 24 || !atRoot(win)) return;
      sx = e.clientX; dx = 0; page = win.querySelector('.page');
    }, true);
    win.addEventListener('pointermove', (e) => {
      if (sx == null) return;
      dx = Math.max(0, (e.clientX - sx) / (window.__scale || 1));
      if (page) { page.style.transition = 'none'; page.style.transform = `translateX(${dx * 0.35}px) scale(${1 - Math.min(dx, 300) / 2000})`; }
    }, true);
    const end = () => {
      if (sx == null) return;
      sx = null;
      if (page) { page.style.transition = ''; page.style.transform = ''; }
      if (dx > 90 && appWin === win) closeApp();
    };
    win.addEventListener('pointerup', end, true); win.addEventListener('pointercancel', end, true);
  }

  /* 主屏幕指示条：点按或上滑回到主屏幕 */
  (function () {
    let sy = null;
    indicator.addEventListener('pointerdown', (e) => { sy = e.clientY; try { indicator.setPointerCapture(e.pointerId); } catch (_) {} });
    indicator.addEventListener('pointerup', (e) => {
      if (sy == null) return;
      sy = null;
      if (mode === 'app') closeApp();
      else if (mode === 'lock') toPasscode();
    });
  })();
  document.addEventListener('keydown', (e) => {
    if (mode === 'lock' && (e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toPasscode(); }
    else if (mode === 'app' && e.key === 'Escape') { if (!(appInst && appInst.back && appInst.back())) closeApp(); }
  });

  /* 图片查看器 */
  function viewImage(src, title, sub) {
    const v = h('div', { class: 'viewer' },
      h('div', { class: 'viewer-top' },
        h('button', { onclick: () => { v.remove(); setTone(prevTone); } }, '完成'),
        h('div', { class: 'vt-title' }, title, h('small', null, sub)),
        h('span', { style: 'width:34px' })),
      h('div', { class: 'viewer-img' }, h('img', { src, alt: '' })));
    const prevTone = bar.classList.contains('sb-dark') ? 'dark' : 'light';
    setTone('light');
    screenEl.append(v);
  }

  function clear() {
    if (appWin) closeApp(true);
    layers.innerHTML = '';
    homeLayer = null; lockLayer = null;
  }

  document.getElementById('side-btn').addEventListener('click', () => {
    if (mode === 'lock') return;
    U.sound.tap();
    document.querySelectorAll('.viewer').forEach((v) => v.remove());
    renderLock();
  });

  function setNow(t) { Object.assign(S.now, t); paintClock(); U.store.set('clk', { d: S.now.d, hh: S.now.hh, mm: S.now.mm }); }
  // 时间会走：现实每过一分钟，手机上也过一分钟（上限由剧情决定）
  setInterval(() => {
    const cap = window.Events && window.Events.clockCap ? window.Events.clockCap() : null;
    if (!cap) return;
    const cur = S.now.d * 1440 + S.now.hh * 60 + S.now.mm;
    if (cur >= cap) return;
    const n = cur + 1, prevDay = S.now.d;
    setNow({ d: Math.floor(n / 1440), hh: Math.floor((n % 1440) / 60), mm: n % 60 });
    if (mode === 'home' && S.now.d !== prevDay) renderHome(false); // 过了零点，日历小组件跟着变
    refreshLock();
    window.Events && window.Events.onMinute && window.Events.onMinute();
  }, 60000);
  function lockNow() { document.querySelectorAll('.viewer').forEach((v) => v.remove()); renderLock(); }
  window.Phone = { openApp, closeApp, viewImage, refresh: () => { refreshBadges(); refreshLock(); }, setNow, lock: lockNow, get mode() { return mode; }, screen: screenEl, setTone };
  // 闹钟开关（会话内记住）
  const al = U.store.get('alarms', null); if (al) S.alarms.forEach((a, i) => (a.on = al[i]));
  const savedClk = U.store.get('clk', null);
  window.Events && window.Events.restore();
  (function () { // 刷新后接着刚才的时间走
    const c = savedClk; if (!c) return;
    const cur = S.now.d * 1440 + S.now.hh * 60 + S.now.mm, saved = c.d * 1440 + c.hh * 60 + c.mm;
    const cap = window.Events && window.Events.clockCap ? window.Events.clockCap() : cur;
    if (saved > cur && saved <= Math.max(cap || cur, cur)) setNow(c);
  })();
  renderLock();
})();
