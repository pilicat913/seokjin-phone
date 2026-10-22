/* 聊天应用 */
(function () {
  const S = window.STORY, A = window.ASSETS, U = window.UI, { h } = U;

  /* ---------- 数据整理 ---------- */
  const rooms = S.rooms.map((r) => ({
    ...r,
    msgs: r.messages.map((m, i) => toMsg(r.id, m, i)),
  }));
  function toMsg(roomId, m, i, prefix = '') {
    const [t, from, content, opt = {}] = m;
    return { id: `${roomId}-${prefix}${i}`, roomId, p: U.parse(t), from, content, u: opt.u, unread: !!opt.unread };
  }
  const roomById = (id) => rooms.find((r) => r.id === id);

  // 已读状态（会话内保留）
  const readIds = new Set(U.store.get('readIds', []));
  const isUnread = (m) => m.unread && !readIds.has(m.id);
  function markRead(room) {
    let changed = false;
    room.msgs.forEach((m) => { if (isUnread(m)) { readIds.add(m.id); changed = true; } });
    if (changed) { U.store.set('readIds', [...readIds]); emit(); }
  }
  const unreadCount = (room) => room.msgs.filter(isUnread).length;
  const totalUnread = () => rooms.reduce((n, r) => n + unreadCount(r), 0);

  // 实时消息（只发生一次）
  const liveDone = () => U.store.get('liveDone', 0);
  // 恢复已到达的实时消息
  (function restoreLive() {
    const g = roomById('group'); const n = liveDone();
    const times = U.store.get('liveTimes', []);
    for (let i = 0; i < Math.min(n, g.live.length); i++) {
      const raw = times[i] ? [times[i], ...g.live[i].slice(1)] : g.live[i];
      g.msgs.push({ ...toMsg('group', raw, i, 'live'), unread: true });
    }
  })();

  let liveScheduled = false;
  let current = null; // 当前挂载的实例（实时消息投递用）
  const listeners = new Set();
  const emit = () => listeners.forEach((f) => f());
  const onChange = (f) => { listeners.add(f); return () => listeners.delete(f); };

  const lastMsg = (room) => room.msgs[room.msgs.length - 1];
  const roomTitle = (room) => room.name || (room.members ? room.members.map(U.personName).join(', ') : U.personName(room.with));
  function preview(m) {
    const c = m.content;
    if (typeof c === 'string') return c.split('\n')[0];
    if (c.fail) return c.text;
    if (c.photo) return '照片';
    if (c.sticker) return '表情';
    if (c.voice) return '语音消息';
    if (c.call) return c.call === 'missed' ? '未接语音通话' : '语音通话';
    if (c.link) return c.link.title;
    if (c.deleted) return '已删除的消息';
    if (c.sys) return c.sys;
    return '';
  }

  /* ---------- 图标 ---------- */
  const I = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/>',
    addChat: '<path d="M20 11.5c0 4-3.6 7-8 7-1 0-1.9-.1-2.7-.4L4.5 19.5l1.3-3.3C4.7 14.9 4 13.3 4 11.5c0-4 3.6-7 8-7s8 3 8 7z"/><path d="M12 8.5v6M9 11.5h6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5l1.4 1.1-1.8 3.1-1.7-.6a7.3 7.3 0 0 1-2 1.2l-.3 1.8h-3.6l-.3-1.8a7.3 7.3 0 0 1-2-1.2l-1.7.6-1.8-3.1 1.4-1.1a7 7 0 0 1 0-2.9L3.6 9.5l1.8-3.1 1.7.6a7.3 7.3 0 0 1 2-1.2L9.4 4h3.6l.3 1.8a7.3 7.3 0 0 1 2 1.2l1.7-.6 1.8 3.1-1.4 1.1a7 7 0 0 1 0 2.9z"/>',
    addFriend: '<circle cx="10" cy="8.5" r="3.6"/><path d="M3.5 19.5c.8-3.6 3.4-5.6 6.5-5.6 1.5 0 2.8.4 3.9 1.2M18 13v6M15 16h6"/>',
    person: '<circle cx="12" cy="8.3" r="4" class="nofill"/><path d="M4.5 20.5c.9-4.1 3.9-6.4 7.5-6.4s6.6 2.3 7.5 6.4z"/>',
    bubble: '<path d="M20.5 11.5c0 4.2-3.8 7.5-8.5 7.5-1 0-2-.2-2.9-.5L4 20.5l1.4-3.7C4.2 15.5 3.5 13.6 3.5 11.5 3.5 7.3 7.3 4 12 4s8.5 3.3 8.5 7.5z"/>',
    dots: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14c.9 1.3 2.1 2 3.5 2s2.6-.7 3.5-2"/><circle cx="9.3" cy="10" r=".6"/><circle cx="14.7" cy="10" r=".6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    img: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-9 8.5"/>',
    mute: '<path d="M5 9h3l4-4v14l-4-4H5z" fill="currentColor"/>',
    call: '<path d="M20 16.2v2.6a1.8 1.8 0 0 1-2 1.8 17.6 17.6 0 0 1-7.7-2.7 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 2.3 4.8 1.8 1.8 0 0 1 4.1 3h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.8.3 1.6.6 2.4a1.8 1.8 0 0 1-.4 1.9L7.6 9.9a14.3 14.3 0 0 0 5.3 5.3l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.4.6a1.8 1.8 0 0 1 1.7 1.9z"/>',
    video: '<rect x="3" y="6.5" width="12.5" height="11" rx="2"/><path d="M15.5 10.5l5.5-3v9l-5.5-3"/>',
  };
  const ico = (k, cls = 'k-ico') => h('span', { class: cls, html: `<svg viewBox="0 0 24 24">${I[k]}</svg>` });

  function groupAvatar(room, size) {
    const g = h('div', { class: 'av av-group', style: `width:${size}px;height:${size}px` });
    room.members.slice(0, 4).forEach((id) => g.append(U.avatar(id, size / 2)));
    return g;
  }
  const roomAvatar = (room, size) => (room.members ? groupAvatar(room, size) : U.avatar(room.with, size));

  /* ============================================================
   * 应用挂载
   * ============================================================ */
  function mount(win, ctx) {
    const stack = [];
    let tab = 'chats';
    const cleanups = [];

    const root = h('div', { class: 'page k-page' });
    win.append(root);
    stack.push({ el: root, tone: 'dark' });
    ctx.setTone('dark');

    function renderRoot() {
      root.innerHTML = '';
      if (tab === 'friends') root.append(...friendsView());
      else if (tab === 'chats') root.append(...chatsView());
      else root.append(...moreView());
      root.append(tabBar());
    }

    function tabBar() {
      const n = totalUnread();
      const t = (id, icon, label) => h('button', { class: 'k-tab' + (tab === id ? ' on' : ''), 'aria-label': label, onclick: () => { if (tab !== id) { tab = id; U.sound.tap(); renderRoot(); if (id === 'chats') maybeLive(); } } },
        h('span', { html: `<svg viewBox="0 0 24 24">${I[icon]}</svg>` }),
        id === 'chats' && n ? h('span', { class: 'k-tbadge' }, n > 99 ? '99+' : n) : null);
      return h('nav', { class: 'k-tabs' }, t('friends', 'person', '好友'), t('chats', 'bubble', '聊天'), t('more', 'dots', '更多'));
    }

    /* ----- 好友 ----- */
    function friendsView() {
      const list = h('div', { class: 'k-scroll' });
      list.append(h('div', { class: 'k-me' }, U.avatar('me', 60),
        h('div', null, h('div', { class: 'k-name' }, S.me.name), S.me.status ? h('div', { class: 'k-status' }, S.me.status) : null)));
      const friends = ['hs', 'nj', 'yg', 'jm', 'th', 'jk', 'gm'].sort((a, b) => U.personName(a).localeCompare(U.personName(b), 'zh'));
      list.append(h('div', { class: 'k-sec' }, `好友 ${friends.length}`));
      friends.forEach((id) => list.append(friendRow(id)));
      list.append(h('div', { class: 'k-sec' }, '频道 1'));
      list.append(friendRow('ts'));
      return [h('header', { class: 'k-head' }, h('h1', null, '好友'), h('div', { class: 'k-icons' }, ico('search'), ico('addFriend'), ico('gear'))), list];
    }
    function friendRow(id) {
      const p = S.people[id];
      return h('button', { class: 'k-row', onclick: () => openProfile(id) }, U.avatar(id, 44),
        h('div', { class: 'k-mid' }, h('div', { class: 'k-name' }, p.name), p.status ? h('div', { class: 'k-st' }, p.status) : null));
    }

    /* ----- 聊天列表 ----- */
    function chatsView() {
      const list = h('div', { class: 'k-scroll' });
      const sorted = [...rooms].sort((a, b) => cmpP(lastMsg(b).p, lastMsg(a).p));
      sorted.forEach((r) => {
        const lm = lastMsg(r), n = unreadCount(r);
        const row = h('button', { class: 'k-row', 'data-room': r.id, onclick: () => openRoom(r.id) },
          roomAvatar(r, 48),
          h('div', { class: 'k-mid' },
            h('div', { class: 'k-name' }, h('span', null, roomTitle(r)), r.members ? h('em', null, r.members.length + 1) : null,
              r.channel ? h('span', { html: '<svg class="k-mute" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4zM16 9l5 6M21 9l-5 6" stroke="#c4c4c4" stroke-width="1.6" fill="#c4c4c4"/></svg>' }) : null),
            h('div', { class: 'k-prev' }, preview(lm))),
          h('div', { class: 'k-side' }, h('span', { class: 'k-time' }, U.listDate(lm.p)), n ? h('span', { class: 'k-unread' }, n) : null));
        list.append(row);
      });
      return [h('header', { class: 'k-head' }, h('h1', null, '聊天'), h('div', { class: 'k-icons' }, ico('search'), ico('addChat'), ico('gear'))), list];
    }

    /* ----- 更多 ----- */
    function moreView() {
      const list = h('div', { class: 'k-scroll' },
        h('div', { class: 'k-me' }, U.avatar('me', 52), h('div', null, h('div', { class: 'k-name' }, S.me.name), h('div', { class: 'k-status' }, '我的资料'))),
        h('div', { class: 'k-more-list' },
          h('div', null, '公告', h('span', null, '')),
          h('div', null, '通知', h('span', null, '开')),
          h('div', null, '隐私', h('span', null, '')),
          h('div', null, '版本信息', h('span', null, '9.7.5'))));
      return [h('header', { class: 'k-head' }, h('h1', null, '更多'), h('div', { class: 'k-icons' }, ico('search'), ico('gear'))), list];
    }

    /* ----- 个人资料 ----- */
    function openProfile(id) {
      U.sound.tap();
      const p = S.people[id];
      const sheet = h('div', { class: 'page k-profile sheet-in' },
        h('div', { class: 'kp-bg', style: (A.profileBg && A.profileBg[id]) ? `background-image:url("${A.profileBg[id]}")` : '' }),
        h('div', { class: 'kp-top' }, h('button', { 'aria-label': '关闭', onclick: () => closeSheet() }, h('span', { html: `<svg viewBox="0 0 24 24">${I.close}</svg>` })), h('span')),
        h('div', { class: 'kp-main' }, U.avatar(id, 96), h('div', { class: 'kp-name' }, p.name), h('div', { class: 'kp-status' }, p.status || '')),
        h('div', { class: 'kp-actions' },
          h('button', { onclick: () => { closeSheet(true); const r = rooms.find((x) => x.with === id); if (r) openRoom(r.id); } }, h('span', { html: `<svg viewBox="0 0 24 24">${I.bubble}</svg>` }), '聊天'),
          p.channel ? null : h('button', { disabled: true }, h('span', { html: `<svg viewBox="0 0 24 24">${I.call}</svg>` }), '语音通话'),
          p.channel ? null : h('button', { disabled: true }, h('span', { html: `<svg viewBox="0 0 24 24">${I.video}</svg>` }), '视频通话')));
      win.append(sheet);
      ctx.setTone('light');
      function closeSheet(instant) {
        ctx.setTone('dark');
        if (instant) { sheet.remove(); return; }
        sheet.classList.remove('sheet-in'); sheet.classList.add('sheet-out');
        setTimeout(() => sheet.remove(), 280);
      }
    }

    /* ----- 聊天室 ----- */
    function openRoom(id, instant) {
      const room = roomById(id);
      if (!room) return;
      if (!instant) U.sound.tap();
      const firstUnread = room.msgs.find(isUnread);
      const page = h('div', { class: 'page k-room' + (instant ? '' : ' push-in'), 'data-room': id });
      const others = () => totalUnread() - unreadCount(room);
      const backCount = h('span', null, others() || '');
      const head = h('header', { class: 'kr-head' },
        h('button', { class: 'kr-back', 'aria-label': '返回', onclick: () => pop() }, h('span', { html: `<svg viewBox="0 0 24 24">${I.back}</svg>` }), backCount),
        h('div', { class: 'kr-title' }, roomTitle(room), room.members ? h('em', null, room.members.length + 1) : null),
        h('div', { class: 'kr-icons' }, h('span', { html: `<svg viewBox="0 0 24 24">${I.search}</svg>` }), h('span', { html: `<svg viewBox="0 0 24 24">${I.menu}</svg>` })));
      const msgs = h('div', { class: 'kr-msgs' });
      renderMsgs(msgs, room, firstUnread && firstUnread.id);
      // 输入框：可以打字，但这部手机发不出去（网络不通），会显示发送失败
      const field = h('input', { class: 'kri-text', type: 'text', enterkeyhint: 'send', autocomplete: 'off', 'aria-label': '输入消息' });
      const sendBtn = h('button', { class: 'kri-send', type: 'button', 'aria-label': '发送', html: '<svg viewBox="0 0 24 24"><path d="M12 19V6M6.5 11.5L12 6l5.5 5.5"/></svg>' });
      const hash = h('span', { class: 'kri-hash' }, '#');
      const syncBtn = () => { const has = field.value.trim().length > 0; sendBtn.style.display = has ? '' : 'none'; hash.style.display = has ? 'none' : ''; };
      const send = () => {
        const text = field.value.trim(); if (!text) return;
        field.value = ''; syncBtn();
        const key = `${U.pad(S.now.m)}-${U.pad(S.now.d)} ${U.pad(S.now.hh)}:${U.pad(S.now.mm)}`;
        const m = { id: `${room.id}-x${Date.now()}`, roomId: room.id, p: U.parse(key), from: 'me', content: { fail: true, text } };
        room.msgs.push(m);
        renderMsgs(msgs, room, null, m.id);
        msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });
        emit();
      };
      field.addEventListener('input', syncBtn);
      field.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); } });
      sendBtn.addEventListener('click', send);
      const input = h('div', { class: 'kr-input' },
        h('span', { class: 'kri-plus', html: `<svg viewBox="0 0 24 24">${I.plus}</svg>` }),
        h('div', { class: 'kri-field' }, field, h('span', { html: `<svg viewBox="0 0 24 24">${I.smile}</svg>` })),
        hash, sendBtn);
      syncBtn();
      if (room.channel) input.style.display = 'none';
      page.append(head, msgs, input);
      const under = stack[stack.length - 1];
      win.append(page);
      if (!instant) { under.el.classList.add('under'); }
      else under.el.style.visibility = 'hidden';
      stack.push({ el: page, room, tone: 'dark' });
      requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; });
      setTimeout(() => { markRead(room); }, instant ? 0 : 400);
      const off = onChange(() => { backCount.textContent = others() || ''; });
      page._off = off;
      edgeSwipe(page);
    }

    function pop() {
      if (stack.length < 2) return;
      U.sound.tap();
      const top = stack.pop(), under = stack[stack.length - 1];
      top.el._off && top.el._off();
      top.el.classList.remove('push-in'); top.el.classList.add('push-out');
      under.el.style.visibility = '';
      under.el.classList.remove('under'); under.el.classList.add('under-back');
      setTimeout(() => { top.el.remove(); under.el.classList.remove('under-back'); }, 320);
      if (stack.length === 1) renderRoot();
    }

    function edgeSwipe(page) {
      let sx = null, dx = 0;
      page.addEventListener('pointerdown', (e) => {
        const r = page.getBoundingClientRect();
        if (e.clientX - r.left < 24) { sx = e.clientX; dx = 0; page.setPointerCapture(e.pointerId); }
      });
      page.addEventListener('pointermove', (e) => {
        if (sx == null) return;
        dx = Math.max(0, e.clientX - sx) / (window.__scale || 1);
        page.style.transform = `translateX(${dx}px)`;
      });
      const end = () => {
        if (sx == null) return;
        sx = null;
        page.style.transition = 'transform .25s';
        if (dx > 110) { page.style.transform = ''; page.style.transition = ''; pop(); }
        else { page.style.transform = ''; setTimeout(() => (page.style.transition = ''), 260); }
      };
      page.addEventListener('pointerup', end); page.addEventListener('pointercancel', end);
    }

    /* ----- 实时消息 ----- */
    function maybeLive() {
      const g = roomById('group');
      if (liveDone() >= g.live.length || liveScheduled) return;
      liveScheduled = true;
      const step = () => {
        const i = liveDone();
        if (i >= g.live.length || S.now.d > 21) return;
        // 实时消息用“现在”的时间
        const nowKey = `${U.pad(S.now.m)}-${U.pad(S.now.d)} ${U.pad(S.now.hh)}:${U.pad(S.now.mm)}`;
        const m = { ...toMsg('group', [nowKey, ...g.live[i].slice(1)], i, 'live'), unread: true };
        U.store.set('liveTimes', [...U.store.get('liveTimes', []).slice(0, i), nowKey]);
        g.msgs.push(m);
        U.store.set('liveDone', i + 1);
        if (current && current.isVisible()) current.deliver(m);
        else {
          emit();
          U.banner({ appId: 'chat', title: roomTitle(g), text: `${U.personName(m.from)}：${preview(m)}`, onOpen: () => window.Phone.openApp('chat', { room: m.roomId }) });
        }
        if (i + 1 < g.live.length) setTimeout(step, 1600);
      };
      setTimeout(step, 2600);
    }
    function deliver(m) {
      const top = stack[stack.length - 1];
      const room = roomById(m.roomId);
      if (top.room && top.room.id === m.roomId && ctx.isVisible()) {
        const box = top.el.querySelector('.kr-msgs');
        const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
        renderMsgs(box, room, null, m.id);
        if (nearBottom) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
        readIds.add(m.id); U.store.set('readIds', [...readIds]);
        U.sound.msg();
        emit();
        return;
      }
      emit();
      if (stack.length === 1 && tab === 'chats' && ctx.isVisible()) {
        renderRoot();
        const row = root.querySelector(`[data-room="${m.roomId}"]`);
        row && row.classList.add('flash');
        U.sound.msg();
        return;
      }
      U.banner({ appId: 'chat', title: room.members ? roomTitle(room) : U.personName(m.from), text: (room.members ? U.personName(m.from) + '：' : '') + preview(m), onOpen: () => window.Phone.openApp('chat', { room: m.roomId }) });
    }

    current = { deliver, isVisible: ctx.isVisible };
    renderRoot();
    if (ctx.args && ctx.args.room) openRoom(ctx.args.room, true);
    else maybeLive();

    // 外部回调
    const off = onChange(() => { if (stack.length === 1) renderRoot(); });
    cleanups.push(off);
    return {
      back: () => { if (stack.length > 1) { pop(); return true; } return false; },
      openRoom: (id) => { while (stack.length > 1) { const t = stack.pop(); t.el._off && t.el._off(); t.el.remove(); } stack[0].el.style.visibility = ''; stack[0].el.classList.remove('under'); renderRoot(); openRoom(id, true); },
      destroy: () => { if(playing){playing.a.pause();playing.el.classList.remove('on');playing=null;} cleanups.forEach((f) => f()); stack.forEach((s) => s.el._off && s.el._off()); current = null; },
    };
  }

  function cmpP(a, b) { return a.t - b.t; }

  /* ---------- 消息渲染 ---------- */
  function renderMsgs(box, room, unreadFromId, arrivingId) {
    box.innerHTML = '';
    let lastDay = null;
    const ms = room.msgs;
    ms.forEach((m, i) => {
      const day = `${m.p.y}-${m.p.m}-${m.p.d}`;
      if (day !== lastDay) {
        box.append(h('div', { class: 'kd-date' }, h('span', null, h('span', { html: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="1.8">${I.cal}</svg>` }), U.fullDate(m.p))));
        lastDay = day;
      }
      if (m.id === unreadFromId) box.append(h('div', { class: 'kd-newline' }, '以下为新消息'));
      const c = m.content;
      if (c && c.sys) { box.append(h('div', { class: 'kd-sys' }, h('span', null, c.sys))); return; }

      const prev = ms[i - 1], next = ms[i + 1];
      const sameRun = (a, b) => a && b && a.from === b.from && a.p.key === b.p.key && !(a.content && a.content.sys) && !(b.content && b.content.sys) && b.id !== unreadFromId;
      const first = !sameRun(prev, m);
      const last = !sameRun(m, next);
      const mine = m.from === 'me';

      let bubble;
      if (typeof c === 'string') {
        const at = c.match(/^@(\S+)\s?([\s\S]*)$/);
        bubble = at ? h('div', { class: 'bub' }, h('span', { class: 'k-at' }, '@' + at[1]), ' ' + at[2])
                    : h('div', { class: 'bub' + (room.channel ? ' channel' : '') }, c);
      }
      else if (c.fail) bubble = h('div', { class: 'bub' }, c.text);
      else if (c.deleted) bubble = h('div', { class: 'bub deleted' }, h('span', { html: `<svg viewBox="0 0 24 24">${I.info}</svg>` }), '已删除的消息。');
      else if (c.photo) bubble = photoEl(c.photo, m, room);
      else if (c.sticker) bubble = stickerEl(c.sticker);
      else if (c.voice) bubble = voiceEl(c);
      else if (c.call) bubble = h('div', { class: 'bub kcall' }, h('span', { html: `<svg viewBox="0 0 24 24">${I.call}</svg>` }), c.call === 'missed' ? '未接语音通话' : `语音通话 ${c.dur}`);
      else if (c.link) bubble = h('div', { class: 'klink' }, h('div', { class: 'kl-thumb', html: `<svg viewBox="0 0 24 24">${I.img}</svg>` }), h('div', { class: 'kl-body' }, h('div', { class: 'kl-title' }, c.link.title), h('div', { class: 'kl-site' }, c.link.site)));

      const meta = c && c.fail ? failMark(m, room, box)
        : h('div', { class: 'km-meta' }, m.u ? h('span', { class: 'km-u' }, m.u) : null, last ? h('span', null, U.ampm(m.p)) : null);
      const line = h('div', { class: 'km-line' }, bubble, meta);
      const row = h('div', { class: 'km' + (mine ? ' me' : '') + (first ? ' first tail' : '') + (m.id === arrivingId ? ' arrive' : '') });
      if (mine) row.append(h('div', { class: 'km-col' }, line));
      else {
        row.append(h('div', { class: 'km-av' }, first ? U.avatar(m.from, 40) : null));
        row.append(h('div', { class: 'km-col' }, first ? h('div', { class: 'km-name' }, U.personName(m.from)) : null, line));
      }
      box.append(row);
    });
  }

  // 发送失败：红色感叹号，点开可以重发（还是失败）或删除
  function failMark(m, room, box) {
    const btn = h('button', { class: 'km-fail', type: 'button', 'aria-label': '发送失败', html: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 16.5h.01"/></svg>' });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const old = document.querySelector('.kf-menu'); if (old) old.remove();
      const close = () => menu.remove();
      const menu = h('div', { class: 'kf-menu' },
        h('div', { class: 'kf-box' },
          h('div', { class: 'kf-t' }, '消息发送失败'),
          h('button', { onclick: () => { close(); U.sound.tap(); btn.classList.add('kf-spin'); setTimeout(() => { btn.classList.remove('kf-spin'); U.sound.wrong && U.sound.wrong(); }, 1200); } }, '重新发送'),
          h('button', { onclick: () => { close(); const i = room.msgs.indexOf(m); if (i >= 0) room.msgs.splice(i, 1); renderMsgs(box, room); emit(); } }, '删除'),
          h('button', { class: 'kf-cancel', onclick: close }, '取消')));
      menu.addEventListener('click', (ev) => { if (ev.target === menu) close(); });
      window.Phone.screen.append(menu);
    });
    return h('div', { class: 'km-meta' }, btn);
  }

  function photoEl(slot, m, room) {
    const src = A.chatPhotos && A.chatPhotos[slot];
    if (!src) {
      return h('div', { class: 'kphoto-exp' }, h('span', { html: `<svg viewBox="0 0 24 24">${I.img}</svg>` }), '照片已过保存期限');
    }
    return h('div', { class: 'kphoto', onclick: () => window.Phone.viewImage(src, U.personName(m.from), `${m.p.y}年${m.p.m}月${m.p.d}日 ${U.ampm(m.p)}`) }, h('img', { src, alt: '' }));
  }

  function stickerEl(slot) {
    const src = A.stickers && A.stickers[slot];
    if (src) return h('img', { class: 'ksticker', src, alt: '表情' });
    return h('div', { class: 'ksticker-empty', html: `<svg viewBox="0 0 24 24">${I.smile}</svg>` });
  }
  let playing = null;
  function voiceEl(c) {
    const src = A.voices && A.voices[c.voice];
    const icon = h('span', { class: 'kv-play', html: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>' });
    const bars = h('span', { class: 'kv-bars' }, ...Array.from({ length: 14 }, (_, i) => h('i', { style: `height:${[5,9,13,8,15,11,6,12,16,9,7,13,8,5][i]}px` })));
    const el = h('button', { class: 'bub kvoice' + (src ? '' : ' empty'), type: 'button' }, icon, bars, h('span', { class: 'kv-dur' }, c.dur));
    el.addEventListener('click', () => {
      if (!src) { el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge'); return; }
      if (playing) { playing.a.pause(); playing.el.classList.remove('on'); if (playing.el === el) { playing = null; return; } }
      const a = new Audio(src); a.play().catch(() => {});
      el.classList.add('on'); playing = { a, el };
      a.onended = () => { el.classList.remove('on'); playing = null; };
    });
    return el;
  }

  /* ---------- 对外：锁屏通知、角标 ---------- */
  function notifications() {
    const out = [];
    rooms.forEach((r) => {
      if (r.channel) return; // 频道已静音
      r.msgs.filter(isUnread).forEach((m) => out.push({
        app: 'chat', target: { room: r.id }, p: m.p,
        title: r.members ? roomTitle(r) : U.personName(m.from),
        text: (r.members ? U.personName(m.from) + '：' : '') + preview(m),
      }));
    });
    return out;
  }

  /* 剧情事件推送的新消息 */
  let evSeq = 0;
  function pushMessage(roomId, raw, silent) {
    const room = roomById(roomId); if (!room) return;
    const m = { ...toMsg(roomId, raw, evSeq++, 'ev'), unread: true };
    room.msgs.push(m);
    if (silent) { emit(); return; }
    if (current && current.isVisible()) current.deliver(m);
    else {
      emit();
      U.banner({ appId: 'chat', title: room.members ? roomTitle(room) : U.personName(m.from), text: (room.members ? U.personName(m.from) + '：' : '') + preview(m), onOpen: () => window.Phone.openApp('chat', { room: roomId }) });
    }
  }
  window.Chat = { mount, totalUnread, notifications, onChange, pushMessage };
})();
