/* 系统应用：备忘录、电话、信息、日历、地图、Safari、照片、时钟、设置、相机 */
(function () {
  const S = window.STORY, A = window.ASSETS, U = window.UI, { h } = U;
  const P = (window.APPS = window.APPS || {});
  const svg = (inner, extra = '') => h('span', { html: `<svg viewBox="0 0 24 24" ${extra}>${inner}</svg>`, style: 'display:contents' });
  const CHEV = '<svg class="i-chev" viewBox="0 0 8 13"><path d="M1.5 1.5l5 5-5 5"/></svg>';
  const BACK = '<svg viewBox="0 0 13 21"><path d="M11 2L2.5 10.5 11 19"/></svg>';
  const SEARCH = '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></svg>';

  /* ---------- 页面栈 ---------- */
  function Nav(win, ctx, tone) {
    const stack = [];
    const api = {
      root(el) { el.classList.add('page'); win.append(el); stack.push(el); ctx.setTone(tone(el)); return el; },
      push(el) {
        U.sound.tap();
        el.classList.add('page', 'push-in');
        const under = stack[stack.length - 1];
        under.classList.add('under');
        win.append(el); stack.push(el); ctx.setTone(tone(el));
        swipe(el);
        return el;
      },
      pop() {
        if (stack.length < 2) return false;
        U.sound.tap();
        const top = stack.pop(), under = stack[stack.length - 1];
        top.classList.remove('push-in'); top.classList.add('push-out');
        under.classList.remove('under'); under.classList.add('under-back');
        ctx.setTone(tone(under));
        setTimeout(() => { top.remove(); under.classList.remove('under-back'); }, 320);
        top._onPop && top._onPop();
        return true;
      },
      get depth() { return stack.length; },
      top: () => stack[stack.length - 1],
    };
    function swipe(page) {
      let sx = null, dx = 0;
      page.addEventListener('pointerdown', (e) => { const r = page.getBoundingClientRect(); if (e.clientX - r.left < 24) { sx = e.clientX; dx = 0; } });
      page.addEventListener('pointermove', (e) => { if (sx == null) return; dx = Math.max(0, (e.clientX - sx) / (window.__scale || 1)); page.style.transform = `translateX(${dx}px)`; });
      const end = () => { if (sx == null) return; sx = null; page.style.transform = ''; if (dx > 110) api.pop(); };
      page.addEventListener('pointerup', end); page.addEventListener('pointercancel', end);
    }
    return api;
  }
  const navBar = (nav, backLabel, title, actions) => h('div', { class: 'i-nav' },
    backLabel != null ? h('button', { class: 'i-back', onclick: () => nav.pop() }, h('span', { html: BACK, style: 'display:contents' }), backLabel) : h('span'),
    title ? h('div', { class: 'i-title' }, title) : null,
    h('div', { class: 'i-act' }, actions || null));
  const searchBar = (ph) => h('div', { class: 'i-search' }, h('span', { html: `<svg viewBox="0 0 24 24">${SEARCH}</svg>`, style: 'display:contents' }), ph || '搜索');
  const iosDate = (p) => { // 列表里用的日期
    const dd = U.dayDiff(p);
    if (dd === 0) return `${U.pad(p.hh)}:${U.pad(p.mm)}`;
    if (dd === 1) return '昨天';
    if (dd < 7) return U.WD[new Date(p.y, p.m - 1, p.d).getDay()];
    return `${String(p.y).slice(2)}/${p.m}/${p.d}`;
  };
  const fullStamp = (p) => `${p.y}年${p.m}月${p.d}日 ${U.pad(p.hh)}:${U.pad(p.mm)}`;
  const contact = (id) => S.contacts.find((c) => c.id === id);

  /* ============================================================
   * 备忘录
   * ============================================================ */
  P.notes = { mount(win, ctx) {
    const nav = Nav(win, ctx, () => 'dark');
    const notes = S.notes.map((n) => ({ ...n, p: U.parse(n.at) })).sort((a, b) => b.p.t - a.p.t);
    function section(p) {
      const dd = U.dayDiff(p);
      if (dd === 0) return '今天';
      if (dd === 1) return '昨天';
      if (dd < 7) return '前 7 天';
      if (dd < 30) return '前 30 天';
      if (p.y === S.now.y) return `${p.m}月`;
      return `${p.y}年`;
    }
    const root = h('div', { class: 'ios notes' });
    root.append(navBar(nav, '文件夹', null, h('span', { html: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="16" cy="12" r=".8"/></svg>', style: 'display:contents' })));
    root.querySelector('.i-back').onclick = () => {};
    root.append(h('div', { class: 'i-large' }, '备忘录'), searchBar());
    const sc = h('div', { class: 'i-scroll' });
    let cur = null, grp = null;
    notes.forEach((n) => {
      const sec = section(n.p);
      if (sec !== cur) { cur = sec; sc.append(h('div', { class: 'i-sec-h big' }, sec)); grp = h('div', { class: 'i-group' }); sc.append(grp); }
      const lines = n.body.split('\n').filter((l) => l.trim());
      grp.append(h('button', { class: 'i-row n-row', onclick: () => open(n) },
        h('div', { class: 'i-main' }, h('div', { class: 'i-t' }, lines[0] || '新备忘录'),
          h('div', { class: 'i-s' }, h('span', null, iosDate(n.p)), lines[1] || '无附加文本'))));
    });
    sc.append(h('div', { style: 'height:20px' }));
    root.append(sc, h('div', { class: 'i-foot' }, `${notes.length}个备忘录`, h('span', { class: 'i-foot-r', html: '<svg viewBox="0 0 24 24"><path d="M4 20h16M15.5 4.5l4 4L9 19H5v-4z"/></svg>' })));
    nav.root(root);

    function open(n) {
      const lines = n.body.split('\n');
      const body = h('div', { class: 'note-body' }, h('span', { class: 'nb-title' }, lines[0]), lines.slice(1).join('\n'));
      if (n.id === 'say') body.append(h('span', { class: 'note-cursor' }));
      const pg = h('div', { class: 'ios white note-page' },
        navBar(nav, '备忘录', null, [h('span', { html: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 12v8h14v-8"/></svg>', style: 'display:contents' }), h('span', { html: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="16" cy="12" r=".8"/></svg>', style: 'display:contents' })]),
        h('div', { class: 'i-scroll' }, h('div', { class: 'note-date' }, fullStamp(n.p)), body));
      nav.push(pg);
      window.Events && window.Events.onNoteOpened(n.id);
    }
    return { back: () => nav.pop() };
  } };

  /* ============================================================
   * 电话
   * ============================================================ */
  const PINYIN = { fa: 'F', hs: 'H', jh: 'J', nj: 'N', th: 'T', gm: 'W', yg: 'Y', jk: 'Z', jm: 'Z' };
  const ICON_PHONE = '<path d="M20 16.2v2.6a1.8 1.8 0 0 1-2 1.8 17.6 17.6 0 0 1-7.7-2.7 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 2.3 4.8 1.8 1.8 0 0 1 4.1 3h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.8.3 1.6.6 2.4a1.8 1.8 0 0 1-.4 1.9L7.6 9.9a14.3 14.3 0 0 0 5.3 5.3l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.4.6a1.8 1.8 0 0 1 1.7 1.9z"/>';
  P.phone = { mount(win, ctx, opts = {}) {
    const nav = Nav(win, ctx, () => 'dark');
    let tab = 'recents', filter = 'all';
    const root = h('div', { class: 'ios white phone-app' });
    nav.root(root);
    const fmtDur = (s) => (s >= 60 ? `${Math.floor(s / 60)}分${s % 60}秒` : `${s}秒`);
    function render() {
      root.innerHTML = '';
      if (tab === 'recents') recents();
      else if (tab === 'contacts') contacts();
      else if (tab === 'keypad') keypad();
      else if (tab === 'fav') fav();
      else voicemail();
      root.append(tabs());
      // 看过最近通话，未接来电标记为已看
      if (tab === 'recents') { S.calls.forEach((c) => (c.seen = true)); window.Phone.refresh(); }
    }
    function tabs() {
      const t = (id, label, icon) => h('button', { class: 'i-tab' + (tab === id ? ' on' : ''), onclick: () => { tab = id; U.sound.tap(); render(); } }, h('span', { html: `<svg viewBox="0 0 24 24">${icon}</svg>`, style: 'display:contents' }), label);
      return h('nav', { class: 'i-tabs' },
        t('fav', '个人收藏', '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>'),
        t('recents', '最近通话', '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>'),
        t('contacts', '通讯录', '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1-3.5 3.8-5.3 7-5.3s6 1.8 7 5.3"/>'),
        t('keypad', '拨号键盘', '<g fill="currentColor" stroke="none"><circle cx="6" cy="5" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="18" cy="5" r="1.6"/><circle cx="6" cy="11" r="1.6"/><circle cx="12" cy="11" r="1.6"/><circle cx="18" cy="11" r="1.6"/><circle cx="6" cy="17" r="1.6"/><circle cx="12" cy="17" r="1.6"/><circle cx="18" cy="17" r="1.6"/><circle cx="12" cy="22" r="1.4"/></g>'),
        t('vm', '语音留言', '<circle cx="7" cy="12" r="3.5"/><circle cx="17" cy="12" r="3.5"/><path d="M7 15.5h10"/>'));
    }
    function recents() {
      const seg = h('div', { class: 'i-seg' },
        h('button', { class: filter === 'all' ? 'on' : '', onclick: () => { filter = 'all'; render(); } }, '全部'),
        h('button', { class: filter === 'missed' ? 'on' : '', onclick: () => { filter = 'missed'; render(); } }, '未接来电'));
      root.append(h('div', { class: 'i-nav' }, h('span'), h('div', { style: 'position:absolute;left:0;right:0;display:flex;justify-content:center' }, seg), h('div', { class: 'i-act' }, '编辑')));
      root.append(h('div', { class: 'i-large' }, '最近通话'));
      const g = h('div', { class: 'i-group', style: '--inset:52px' });
      const list = S.calls.map((c) => ({ c, p: U.parse(c[0]) })).sort((a, b) => b.p.t - a.p.t).filter((x) => filter === 'all' || x.c[2] === 'missed');
      list.forEach(({ c, p }) => {
        const ct = contact(c[1]);
        const name = ct ? ct.name : c[1];
        const sub = ct ? '移动电话' : (S.numberLabels[c[1]] || '未知');
        g.append(h('button', { class: 'i-row', onclick: () => ct && openContact(ct) },
          h('span', { class: 'rc-ico', html: c[2] === 'out' ? '<svg viewBox="0 0 24 24"><path d="M6 18L18 6M9 6h9v9" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>' : '' }),
          h('div', { class: 'i-main' }, h('div', { class: 'i-t rc-name' + (c[2] === 'missed' ? ' missed' : '') }, name), h('div', { class: 'i-s' }, sub)),
          h('div', { class: 'i-r' }, iosDate(p), h('span', { class: 'i-info' }, 'i'))));
      });
      root.append(h('div', { class: 'i-scroll' }, g));
    }
    function contacts() {
      root.append(navBar(nav, null, null, h('span', { html: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>', style: 'display:contents' })));
      root.append(h('div', { class: 'i-large' }, '通讯录'), searchBar());
      const sc = h('div', { class: 'i-scroll' });
      sc.append(h('div', { class: 'i-row', style: 'padding:6px 16px 14px' }, h('div', { class: 'contact-hero', style: 'flex-direction:row;gap:12px;padding:0' }, h('div', { class: 'ch-av', style: 'width:56px;height:56px;font-size:22px' }, '金'),
        h('div', null, h('div', { style: 'font-size:20px;font-weight:600' }, S.me.name), h('div', { class: 'i-s' }, '我的名片')))));
      const sorted = [...S.contacts].sort((a, b) => (PINYIN[a.id] || 'Z').localeCompare(PINYIN[b.id] || 'Z') || a.name.localeCompare(b.name, 'zh'));
      let cur = null, g = null;
      sorted.forEach((c) => {
        const L = PINYIN[c.id] || '#';
        if (L !== cur) { cur = L; sc.append(h('div', { class: 'i-sec-h', style: 'padding:10px 16px 4px' }, L)); g = h('div', { class: 'i-group', style: 'margin:0' }); sc.append(g); }
        g.append(h('button', { class: 'i-row', onclick: () => openContact(c) }, h('div', { class: 'i-main' }, h('div', { class: 'i-t', style: 'font-weight:600' }, c.name))));
      });
      sc.append(h('div', { class: 'i-empty', style: 'padding:20px' }, `${S.contacts.length}位联系人`));
      root.append(sc);
    }
    function openContact(c) {
      const calls = S.calls.filter((x) => x[1] === c.id).map((x) => ({ x, p: U.parse(x[0]) })).sort((a, b) => b.p.t - a.p.t);
      const act = (label, icon) => h('div', null, h('span', { html: `<svg viewBox="0 0 24 24">${icon}</svg>`, style: 'display:contents' }), label);
      const pg = h('div', { class: 'ios phone-app' },
        navBar(nav, tab === 'contacts' ? '通讯录' : '最近通话', null, '编辑'),
        h('div', { class: 'i-scroll' },
          h('div', { class: 'contact-hero' }, h('div', { class: 'ch-av' }, c.name[0]), h('div', { class: 'ch-name' }, c.name)),
          h('div', { class: 'contact-actions' },
            act('信息', '<path d="M20 11.5c0 4-3.6 7-8 7-1 0-1.9-.1-2.7-.4L4.5 19.5l1.3-3.3C4.7 14.9 4 13.3 4 11.5c0-4 3.6-7 8-7s8 3 8 7z"/>'),
            act('呼叫', ICON_PHONE), act('视频', '<rect x="3" y="6.5" width="12.5" height="11" rx="2"/><path d="M15.5 10.5l5.5-3v9l-5.5-3"/>'),
            act('邮件', '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>')),
          calls.length ? h('div', { class: 'i-group', style: 'margin-bottom:12px' },
            h('div', { class: 'i-row', style: 'display:block' },
              h('div', { style: 'font-size:15px;font-weight:600;margin-bottom:4px' }, `${calls[0].p.m}月${calls[0].p.d}日`),
              calls.map(({ x, p }) => h('div', { style: 'display:flex;justify-content:space-between;font-size:15px;padding:2px 0' + (x[2] === 'missed' ? ';color:#ff3b30' : '') },
                h('span', null, `${U.pad(p.hh)}:${U.pad(p.mm)}  ${x[2] === 'in' ? '呼入通话' : x[2] === 'out' ? '呼出通话' : '未接来电'}`),
                h('span', { style: 'color:var(--sub)' }, x[3] ? fmtDur(x[3]) : ''))))) : null,
          h('div', { class: 'i-group' }, h('div', { class: 'i-row', style: 'display:block' }, h('div', { style: 'font-size:13px' }, '移动电话'), h('div', { style: 'color:var(--tint);margin-top:2px' }, c.phone)))));
      nav.push(pg);
    }
    function keypad() {
      let num = '';
      const disp = h('div', { class: 'kp-num' }, '');
      const keys = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
      root.append(h('div', { class: 'keypad' }, disp,
        h('div', { class: 'kp-grid' }, keys.map(([k, l]) => h('button', { class: 'kp-k', onclick: () => { U.sound.tap(); if (num.length < 15) { num += k; disp.textContent = num; } } }, h('b', null, k), h('small', null, l)))),
        h('button', { class: 'kp-call', 'aria-label': '呼叫', onclick: (e) => { e.currentTarget.animate([{ transform: 'scale(.9)' }, { transform: 'scale(1)' }], 200); } }, h('span', { html: `<svg viewBox="0 0 24 24">${ICON_PHONE}</svg>`, style: 'display:contents' }))));
    }
    function fav() {
      root.append(navBar(nav, null, null, h('span', { html: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>', style: 'display:contents' })));
      root.append(h('div', { class: 'i-large' }, '个人收藏'));
      const g = h('div', { class: 'i-group' });
      g.append(h('button', { class: 'i-row', onclick: () => openContact(contact('gm')) }, h('div', { class: 'i-main' }, h('div', { class: 'i-t', style: 'font-weight:600' }, '外婆'), h('div', { class: 'i-s' }, '移动电话')), h('span', { class: 'i-info' }, 'i')));
      root.append(h('div', { class: 'i-scroll' }, g));
    }
    function voicemail() {
      root.append(navBar(nav, null, null, null), h('div', { class: 'i-large' }, '语音留言'), h('div', { class: 'i-empty' }, '无语音留言'));
    }
    if (opts.tab) tab = opts.tab;
    render();
    return { back: () => nav.pop() };
  } };

  /* ============================================================
   * 信息
   * ============================================================ */
  P.messages = { mount(win, ctx) {
    const nav = Nav(win, ctx, () => 'dark');
    const read = new Set(U.store.get('readSms', []));
    const threads = S.sms.map((t) => ({ ...t, isPerson: t.id === 'jh', ms: t.messages.map((m, i) => ({ id: `${t.id}-${i}`, p: U.parse(m[0]), from: m[1], text: m[2], unread: m[3] && m[3].unread })) }))
      .sort((a, b) => b.ms[b.ms.length - 1].p.t - a.ms[a.ms.length - 1].p.t);
    const root = h('div', { class: 'ios white sms' });
    nav.root(root);
    function render() {
      root.innerHTML = '';
      root.append(navBar(nav, null, null, h('span', { html: '<svg viewBox="0 0 24 24"><path d="M4 20h16M15.5 4.5l4 4L9 19H5v-4z"/></svg>', style: 'display:contents' })));
      root.querySelector('.i-nav').prepend(h('span', { style: 'color:var(--tint);font-size:17px;padding-left:8px' }, '编辑'));
      root.append(h('div', { class: 'i-large' }, '信息'), searchBar());
      const g = h('div', { class: 'i-group', style: '--inset:76px' });
      threads.forEach((t) => {
        const last = t.ms[t.ms.length - 1];
        const un = t.ms.some((m) => m.unread && !read.has(m.id));
        const isPerson = t.isPerson;
        g.append(h('button', { class: 'i-row', style: 'align-items:flex-start;padding-left:22px', onclick: () => open(t) },
          un ? h('span', { class: 's-dot', style: 'position:absolute;left:7px;top:28px' }) : null,
          h('div', { class: 's-av' }, isPerson ? t.name[0] : h('span', { html: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4"/><path d="M4 21c1.2-4.2 4.4-6.4 8-6.4s6.8 2.2 8 6.4z"/></svg>', style: 'display:contents' })),
          h('div', { class: 'i-main' },
            h('div', { style: 'display:flex;justify-content:space-between;gap:8px' }, h('span', { class: 's-name' }, t.name), h('span', { class: 'i-s', style: 'margin:0;display:flex;gap:4px;align-items:center' }, iosDate(last.p), h('span', { html: CHEV }))),
            h('div', { class: 'i-s', style: 'white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical' }, last.text))));
      });
      root.append(h('div', { class: 'i-scroll' }, g));
    }
    function open(t) {
      t.ms.forEach((m) => read.add(m.id)); U.store.set('readSms', [...read]); window.Phone.refresh();
      const box = h('div', { class: 'st-msgs' });
      let lastT = 0;
      t.ms.forEach((m) => {
        if (m.p.t - lastT > 3600e3) box.append(h('div', { class: 'st-stamp' }, `${m.p.m}月${m.p.d}日 ${U.WD[new Date(m.p.y, m.p.m - 1, m.p.d).getDay()]} ${U.pad(m.p.hh)}:${U.pad(m.p.mm)}`));
        lastT = m.p.t;
        box.append(h('div', { class: 'st-b ' + (m.from === 'me' ? 'me' : 'them') }, m.text));
      });
      const back = h('button', { class: 'i-back', onclick: () => { nav.pop(); render(); } }, h('span', { html: BACK, style: 'display:contents' }));
      const pg = h('div', { class: 'ios white sms sms-thread', style: 'padding-top:54px' },
        h('div', { class: 'st-head' }, back, h('div', { class: 's-av sms' }, t.isPerson ? t.name[0] : h('span', { html: '<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><circle cx="12" cy="9" r="4"/><path d="M4 21c1.2-4.2 4.4-6.4 8-6.4s6.8 2.2 8 6.4z"/></svg>' })), h('div', { class: 'st-name' }, t.name + ' ›')),
        box, h('div', { class: 'st-input' }, h('div', null, '短信')));
      nav.push(pg);
      requestAnimationFrame(() => (box.scrollTop = box.scrollHeight));
    }
    render();
    return { back: () => { const r = nav.pop(); if (r) setTimeout(render, 330); return r; } };
  } };

  /* ============================================================
   * 日历
   * ============================================================ */
  P.calendar = { mount(win, ctx) {
    const nav = Nav(win, ctx, () => 'dark');
    let ym = { y: S.now.y, m: S.now.m };
    let sel = { y: S.now.y, m: S.now.m, d: S.now.d };
    const root = h('div', { class: 'ios cal' });
    nav.root(root);
    function eventsOn(y, m, d) {
      const key = `${y}-${U.pad(m)}-${U.pad(d)}`;
      const dt = new Date(y, m - 1, d);
      const out = S.events.filter((e) => e[0] === key);
      S.events.filter((e) => e[0].startsWith('weekly-')).forEach((e) => {
        const wd = Number(e[0].split('-')[1]);
        if (dt.getDay() === wd && dt >= new Date(2022, 1, 6) && dt <= new Date(2022, 8, 30)) out.push(e);
      });
      return out.sort((a, b) => (a[1] === '全天' ? -1 : b[1] === '全天' ? 1 : a[1].localeCompare(b[1])));
    }
    function render() {
      root.innerHTML = '';
      const first = new Date(ym.y, ym.m - 1, 1).getDay();
      const days = new Date(ym.y, ym.m, 0).getDate();
      const move = (k) => { ym.m += k; if (ym.m < 1) { ym.m = 12; ym.y--; } if (ym.m > 12) { ym.m = 1; ym.y++; } U.sound.tap(); render(); };
      root.append(h('div', { class: 'i-nav' }, h('button', { class: 'i-back' }, h('span', { html: BACK, style: 'display:contents' }), `${ym.y}年`), h('div', { class: 'i-act' },
        h('span', { html: `<svg viewBox="0 0 24 24">${SEARCH}</svg>`, style: 'display:contents' }), h('span', { html: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>', style: 'display:contents' }))));
      root.append(h('div', { class: 'c-month' }, `${ym.m}月`, h('div', { class: 'c-arrows' },
        h('button', { 'aria-label': '上个月', onclick: () => move(-1), html: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>' }),
        h('button', { 'aria-label': '下个月', onclick: () => move(1), html: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>' }))));
      root.append(h('div', { class: 'c-wd' }, ['日', '一', '二', '三', '四', '五', '六'].map((w) => h('span', null, w))));
      const grid = h('div', { class: 'c-grid' });
      for (let i = 0; i < first; i++) grid.append(h('div', { class: 'c-d', style: 'border-top-color:transparent' }));
      for (let d = 1; d <= days; d++) {
        const wd = (first + d - 1) % 7;
        const isToday = ym.y === S.now.y && ym.m === S.now.m && d === S.now.d;
        const isSel = ym.y === sel.y && ym.m === sel.m && d === sel.d;
        grid.append(h('button', { class: 'c-d' + (wd === 0 || wd === 6 ? ' wkend' : '') + (isToday ? ' today' : '') + (isSel ? ' sel' : ''), onclick: () => { sel = { y: ym.y, m: ym.m, d }; U.sound.tap(); render(); } },
          h('span', null, d), eventsOn(ym.y, ym.m, d).length ? h('i') : null));
      }
      const list = h('div', { class: 'c-list' });
      const evs = eventsOn(sel.y, sel.m, sel.d);
      list.append(h('div', { class: 'i-sec-h', style: 'padding:8px 16px 4px;text-transform:none' }, `${sel.y}年${sel.m}月${sel.d}日 ${U.WD[new Date(sel.y, sel.m - 1, sel.d).getDay()]}`));
      if (!evs.length) list.append(h('div', { class: 'c-none' }, '无日程'));
      evs.forEach((e) => {
        const c = S.calendars[e[3]];
        list.append(h('div', { class: 'c-ev' }, h('div', { class: 'c-time' }, e[1]), h('span', { class: 'c-bar', style: `background:${c.color}` }), h('div', null, h('div', null, e[2]), h('div', { class: 'c-cal' }, c.name))));
      });
      root.append(h('div', { class: 'i-scroll' }, grid, list));
      // 左右滑动换月
      let sx = null;
      grid.addEventListener('pointerdown', (e) => (sx = e.clientX));
      grid.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 60) move(dx < 0 ? 1 : -1); });
    }
    render();
    return { back: () => nav.pop() };
  } };

  /* ============================================================
   * 地图（虚构城市松州的简图）
   * ============================================================ */
  const MAP_SVG = `<svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
    <rect width="390" height="844" fill="#ece7dc"/>
    <path d="M-20 520 C 80 470, 140 560, 220 520 S 360 430, 420 470 L 420 560 C 350 520, 290 610, 210 600 S 60 560, -20 610 Z" fill="#aad3f2"/>
    <text x="250" y="545" font-size="13" fill="#5b8fbf" font-style="italic" transform="rotate(-10 250 545)">杨智川</text>
    <path d="M30 80 q40 -20 80 10 t60 40 l-20 50 q-40 10 -80 -20 z" fill="#cfe5c3"/>
    <path d="M250 640 q50 -10 90 30 l-10 60 q-60 10 -90 -30 z" fill="#cfe5c3"/>
    <g stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round">
      <path d="M-10 300 L 400 260"/><path d="M120 -10 L 160 470"/><path d="M300 -10 L 260 470"/><path d="M-10 420 L 400 380"/>
      <path d="M160 600 L 120 860"/><path d="M200 640 L 400 700"/>
    </g>
    <g stroke="#fff" stroke-width="4" fill="none"><path d="M-10 180 L 400 150"/><path d="M40 -10 L 70 470"/><path d="M360 100 L 210 470"/></g>
    <path d="M-10 350 L 400 320" stroke="#9a9a9a" stroke-width="3" stroke-dasharray="10 6" fill="none"/>
    <path d="M200 340 L 215 640" stroke="#9a9a9a" stroke-width="3" stroke-dasharray="10 6" fill="none"/>
    <g font-size="12" fill="#6b6b6b">
      <text x="178" y="328">松州站</text><text x="60" y="240">中央洞</text><text x="300" y="215">永山洞</text>
      <text x="40" y="720">文贤市</text><text x="240" y="420">再开发区</text>
    </g>
    <circle cx="190" cy="250" r="9" fill="#fff"/><circle cx="190" cy="250" r="6" fill="#0a84ff"/>
  </svg>`;
  const PIN_POS = { '杨智加油站': [205, 300], '小公园': [95, 205], '草花树木园 区间车站': [330, 110], '庆日医院': [250, 180], '坡下汽车旅馆': [262, 440], '中央洞 再开发区 3号楼': [282, 400], 'Café 杨智川': [150, 470], '自助洗车': [320, 260], '松州站 货运铁路': [120, 345], '家': [80, 120], '外婆家': [195, 250] };
  P.maps = { mount(win, ctx) {
    const root = h('div', { class: 'ios maps page' });
    win.append(root); ctx.setTone('dark');
    const canvas = h('div', { class: 'm-canvas', html: MAP_SVG });
    const pinLayer = h('div', { style: 'position:absolute;inset:0;pointer-events:none' });
    const sheet = h('div', { class: 'm-sheet' });
    root.append(canvas, pinLayer, sheet);
    const toggle = () => sheet.classList.toggle('min');
    function drop(name) {
      const pos = PIN_POS[name]; if (!pos) return;
      pinLayer.innerHTML = '';
      pinLayer.append(h('div', { style: `position:absolute;left:${pos[0] / 390 * 100}%;top:${pos[1] / 844 * 100}%;transform:translate(-50%,-100%);animation:arrive .3s`, html: '<svg width="32" height="42" viewBox="0 0 32 42"><path d="M16 41s14-15 14-25A14 14 0 0 0 2 16c0 10 14 25 14 25z" fill="#ff3b30" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="#fff"/></svg>' }));
      sheet.classList.add('min');
    }
    const pinI = '<svg viewBox="0 0 24 24"><path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.6" fill="#8e8e93"/></svg>';
    sheet.append(h('div', { class: 'm-grab', onclick: toggle }), searchBar('搜索地图'),
      h('div', { class: 'i-sec-h', style: 'padding:6px 16px 6px;text-transform:none;font-size:15px;font-weight:600;color:#000' }, '个人收藏'),
      h('div', { class: 'm-fav' }, S.places.favorites.map((f, i) => h('div', { onclick: () => drop(f.name), style: 'cursor:pointer' },
        h('span', { class: 'mf-i', style: `background:${i ? '#5856d6' : '#007aff'}`, html: i ? '<svg viewBox="0 0 24 24"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/></svg>' }), f.name, h('small', null, f.sub))),
        h('div', null, h('span', { class: 'mf-i', style: 'background:#e5e5ea', html: '<svg viewBox="0 0 24 24" style="fill:none;stroke:#007aff;stroke-width:2.4"><path d="M12 6v12M6 12h12"/></svg>' }), '添加', h('small', null, ' '))));
    const g = h('div', { class: 'i-group', style: '--inset:58px' });
    S.places.recents.forEach(([at, name, sub]) => {
      const p = U.parse(at);
      g.append(h('button', { class: 'i-row', onclick: () => drop(name) }, h('span', { class: 'm-pin', html: pinI }),
        h('div', { class: 'i-main' }, h('div', { class: 'i-t' }, name), h('div', { class: 'i-s' }, [sub, `${p.m}月${p.d}日`].filter(Boolean).join(' · ')))));
    });
    sheet.append(h('div', { class: 'i-sec-h', style: 'padding:14px 16px 6px;text-transform:none;font-size:15px;font-weight:600;color:#000;display:flex;justify-content:space-between' }, '最近', h('span', { style: 'color:#007aff;font-weight:400' }, '更多')),
      h('div', { class: 'i-scroll', style: 'padding-bottom:40px' }, g));
    canvas.addEventListener('click', () => sheet.classList.add('min'));
    return { back: () => false };
  } };

  /* ============================================================
   * Safari 浏览器
   * ============================================================ */
  P.safari = { mount(win, ctx) {
    const nav = Nav(win, ctx, () => 'dark');
    const tools = (canBack) => h('div', { class: 'sf-tools' },
      h('button', { class: canBack ? '' : 'off', onclick: () => canBack && nav.pop(), html: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>' }),
      h('button', { class: 'off', html: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>' }),
      h('button', { html: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 12v8h14v-8"/></svg>' }),
      h('button', { html: '<svg viewBox="0 0 24 24"><path d="M5 4h14v16l-7-4.5L5 20z"/></svg>' }),
      h('button', { html: '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="12" height="13" rx="2"/><path d="M8 7V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-3"/></svg>' }));
    const bar = (text, canBack) => h('div', { class: 'sf-bar' }, h('div', { class: 'sf-url' }, h('span', { html: `<svg viewBox="0 0 24 24">${SEARCH}</svg>`, style: 'display:contents' }), h('span', { class: 'sf-q' }, text)), tools(canBack));
    const root = h('div', { class: 'ios saf' });
    const items = S.searches.map((s) => ({ ...s, p: U.parse(s.at) })).sort((a, b) => b.p.t - a.p.t);
    const sc = h('div', { class: 'i-scroll' });
    sc.append(h('div', { class: 'i-large', style: 'font-size:28px' }, '历史记录'));
    let cur = null, g = null;
    items.forEach((it) => {
      const dd = U.dayDiff(it.p);
      const sec = dd === 0 ? '今天' : dd === 1 ? '昨天' : `${it.p.m}月${it.p.d}日 ${U.WD[new Date(it.p.y, it.p.m - 1, it.p.d).getDay()]}`;
      if (sec !== cur) { cur = sec; sc.append(h('div', { class: 'i-sec-h', style: 'text-transform:none' }, sec)); g = h('div', { class: 'i-group' }); sc.append(g); }
      g.append(h('button', { class: 'i-row', onclick: () => open(it) }, h('div', { class: 'i-main' }, h('div', { class: 'i-t' }, `${it.q} - 搜索`), h('div', { class: 'i-s' }, 'search.songju.kr'))));
    });
    sc.append(h('div', { style: 'height:24px' }));
    root.append(sc, bar('搜索或输入网站名称', false));
    nav.root(root);
    function open(it) {
      const body = h('div', { class: 'i-scroll', style: 'background:#f2f2f7' }, h('div', { class: 'sr-head' }, `“${it.q}” 的搜索结果`),
        it.results.map(([t, site, d]) => h('div', { class: 'sr' }, h('div', { class: 'sr-site' }, site), h('div', { class: 'sr-t' }, t), d ? h('div', { class: 'sr-d' }, d) : null)));
      nav.push(h('div', { class: 'ios saf' }, body, bar(it.q, true)));
    }
    return { back: () => nav.pop() };
  } };

  /* ============================================================
   * 照片
   * ============================================================ */
  P.photos = { mount(win, ctx) {
    const nav = Nav(win, ctx, () => 'dark');
    const list = (A.album || []).map((x, i) => ({ ...x, i, p: U.parse(x.date) })).sort((a, b) => a.p.t - b.p.t);
    const root = h('div', { class: 'ios white photos' });
    const sc = h('div', { class: 'i-scroll' });
    if (!list.length) sc.append(h('div', { class: 'i-empty' }, '没有照片或视频'));
    let cur = null, grid = null;
    list.forEach((x, idx) => {
      const key = `${x.p.y}-${x.p.m}`;
      if (key !== cur) { cur = key; sc.append(h('div', { class: 'p-month' }, `${x.p.y}年${x.p.m}月`)); grid = h('div', { class: 'p-grid' }); sc.append(grid); }
      grid.append(h('div', { class: 'p-cell' + (x.src ? '' : ' empty'), onclick: () => view(idx) }, x.src ? h('img', { src: x.src, alt: '', loading: 'lazy' }) : null));
    });
    sc.append(h('div', { class: 'p-count' }, `${list.length}张照片`));
    root.append(h('div', { class: 'p-head', style: 'padding-top:6px' }, h('h1', null, '图库'), h('span', { style: 'color:var(--tint)' }, '选择')), sc,
      h('nav', { class: 'i-tabs' }, [['图库', '<rect x="4" y="4" width="16" height="16" rx="3"/>', true], ['为你推荐', '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>'], ['相簿', '<rect x="3" y="7" width="14" height="13" rx="2"/><path d="M7 4h12a2 2 0 0 1 2 2v10"/>'], ['搜索', SEARCH]].map(([l, ic, on]) => h('span', { class: 'i-tab' + (on ? ' on' : '') }, h('span', { html: `<svg viewBox="0 0 24 24">${ic}</svg>`, style: 'display:contents' }), l))));
    nav.root(root);
    requestAnimationFrame(() => (sc.scrollTop = sc.scrollHeight));
    function view(idx) {
      U.sound.tap();
      let i = idx;
      const img = h('div', { class: 'pv-img' });
      const title = h('div', { class: 'pv-t' });
      const pv = h('div', { class: 'pv' },
        h('div', { class: 'pv-top' }, h('button', { class: 'i-back', style: 'color:#007aff;display:flex;align-items:center;font-size:17px', onclick: () => close() }, h('span', { html: BACK.replace('<svg', '<svg style="width:13px;height:21px;fill:none;stroke:#007aff;stroke-width:2.6;margin-right:4px"'), style: 'display:contents' }), '图库'), title, h('span', { style: 'color:#007aff;font-size:17px;padding-right:8px' }, '编辑')),
        img,
        h('div', { class: 'pv-bot' }, h('span', { html: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 12v8h14v-8"/></svg>' }), h('span', { html: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/></svg>' }), h('span', { html: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg>' }), h('span', { html: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>' })));
      function paint() {
        const x = list[i];
        title.innerHTML = '';
        if (x.place) title.append(x.place, h('small', null, `${x.p.y}年${x.p.m}月${x.p.d}日 ${U.pad(x.p.hh)}:${U.pad(x.p.mm)}`));
        else title.append(`${x.p.y}年${x.p.m}月${x.p.d}日`, h('small', null, `${U.pad(x.p.hh)}:${U.pad(x.p.mm)}`));
        img.innerHTML = '';
        img.append(x.src ? h('img', { src: x.src, alt: '' }) : h('div', { class: 'pv-empty', html: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-9 8.5"/></svg>' }));
      }
      const go = (k) => { const n = i + k; if (n >= 0 && n < list.length) { i = n; paint(); } };
      let sx = null;
      img.addEventListener('pointerdown', (e) => (sx = e.clientX));
      img.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); else pv.classList.toggle('dark'); });
      const key = (e) => { if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'Escape') { e.stopPropagation(); close(); } };
      document.addEventListener('keydown', key, true);
      function close() { document.removeEventListener('keydown', key, true); pv.remove(); }
      paint();
      win.append(pv);
      pv._close = close;
    }
    return { back: () => { const pv = win.querySelector('.pv'); if (pv) { pv._close(); return true; } return nav.pop(); } };
  } };

  /* ============================================================
   * 时钟
   * ============================================================ */
  P.clock = { mount(win, ctx) {
    const nav = Nav(win, ctx, () => 'light');
    let tab = 'alarm', sw = null;
    const root = h('div', { class: 'ios dark clock-app' });
    nav.root(root);
    function render() {
      root.innerHTML = '';
      if (sw && sw.timer && tab !== 'sw') { /* 后台继续 */ }
      if (tab === 'world') world();
      else if (tab === 'alarm') alarm();
      else if (tab === 'sw') stopwatch();
      else timer();
      const t = (id, l, ic) => h('button', { class: 'i-tab' + (tab === id ? ' on' : ''), onclick: () => { tab = id; U.sound.tap(); render(); } }, h('span', { html: `<svg viewBox="0 0 24 24">${ic}</svg>`, style: 'display:contents' }), l);
      root.append(h('nav', { class: 'i-tabs' }, t('world', '世界时钟', '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.3 3.4 5.2 3.4 8.5s-1.1 6.2-3.4 8.5c-2.3-2.3-3.4-5.2-3.4-8.5S9.7 5.8 12 3.5z"/>'),
        t('alarm', '闹钟', '<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2 1.5M5 4L3 6M19 4l2 2"/>'), t('sw', '秒表', '<circle cx="12" cy="13" r="7.5"/><path d="M12 13V9M10 3h4"/>'), t('timer', '计时器', '<circle cx="12" cy="12" r="8"/><path d="M12 7v5"/>')));
    }
    function world() {
      root.append(h('div', { class: 'i-nav' }, h('span', { style: 'color:var(--tint);font-size:17px;padding-left:8px' }, '编辑'), h('div', { class: 'i-act' }, '+')), h('div', { class: 'i-large' }, '世界时钟'));
      const sc = h('div', { class: 'i-scroll' });
      S.worldClocks.forEach((c) => {
        const d = new Date(S.now.y, S.now.m - 1, S.now.d, S.now.hh + c.offset, S.now.mm);
        const dayDelta = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(S.now.y, S.now.m - 1, S.now.d)) / 864e5);
        const day = dayDelta === 0 ? '今天' : dayDelta < 0 ? '昨天' : '明天';
        sc.append(h('div', { class: 'wc-row' }, h('div', { class: 'wc-main' }, h('div', { class: 'wc-sub' }, `${day}，${c.offset ? (c.offset > 0 ? '+' : '') + c.offset + '小时' : '+0小时'}`), h('div', { class: 'wc-c' }, c.city)),
          h('div', { class: 'wc-t' }, `${U.pad(d.getHours())}:${U.pad(d.getMinutes())}`)));
      });
      root.append(sc);
    }
    function alarm() {
      root.append(h('div', { class: 'i-nav' }, h('span', { style: 'color:var(--tint);font-size:17px;padding-left:8px' }, '编辑'), h('div', { class: 'i-act', style: 'font-size:28px;font-weight:300' }, '+')), h('div', { class: 'i-large' }, '闹钟'));
      const sc = h('div', { class: 'i-scroll' });
      sc.append(h('div', { class: 'i-sec-h', style: 'text-transform:none;font-size:17px;font-weight:600;color:#fff;padding:12px 16px 6px;border-bottom:.5px solid var(--sep)' }, '睡眠 | 起床闹钟'));
      sc.append(h('div', { class: 'al-row off' }, h('div', { class: 'al-main' }, h('div', { class: 'al-l', style: 'color:var(--sub)' }, '无闹钟')), h('span', { style: 'color:var(--tint);font-size:15px;background:#1c1c1e;padding:6px 12px;border-radius:14px' }, '设置')));
      sc.append(h('div', { class: 'i-sec-h', style: 'text-transform:none;font-size:17px;font-weight:600;color:#fff;padding:16px 16px 6px' }, '其他'));
      S.alarms.forEach((a) => {
        const tg = h('button', { class: 'tog' + (a.on ? ' on' : ''), 'aria-label': '开关', onclick: () => { a.on = !a.on; U.sound.tap(); U.store.set('alarms', S.alarms.map((x) => x.on)); render(); } });
        const [hh, mm] = a.time.split(':');
        sc.append(h('div', { class: 'al-row' + (a.on ? '' : ' off') }, h('div', { class: 'al-main' }, h('div', { class: 'al-t' }, `${hh}:${mm}`), h('div', { class: 'al-l' }, a.label)), tg));
      });
      root.append(sc);
    }
    function stopwatch() {
      sw = sw || { ms: 0, start: 0, timer: null };
      const t = h('div', { class: 'sw-t' });
      const fmt = (ms) => `${U.pad(Math.floor(ms / 60000))}:${U.pad(Math.floor(ms / 1000) % 60)}.${U.pad(Math.floor(ms / 10) % 100)}`;
      const cur = () => sw.ms + (sw.timer ? performance.now() - sw.start : 0);
      const tick = () => { t.textContent = fmt(cur()); };
      tick();
      const s = h('button', { class: 'sw-s' + (sw.timer ? ' run' : '') }, sw.timer ? '停止' : '启动');
      const l = h('button', { class: 'sw-l' }, sw.timer ? '计次' : '复位');
      s.onclick = () => { if (sw.timer) { sw.ms = cur(); clearInterval(sw.timer); sw.timer = null; } else { sw.start = performance.now(); sw.timer = setInterval(() => { const el = root.querySelector('.sw-t'); if (el) el.textContent = fmt(cur()); }, 33); } render(); };
      l.onclick = () => { if (!sw.timer) { sw.ms = 0; render(); } };
      root.append(h('div', { class: 'sw' }, t, h('div', { class: 'sw-btns' }, l, s)));
    }
    function timer() {
      root.append(h('div', { class: 'sw' }, h('div', { class: 'sw-t', style: 'font-size:64px' }, '0小时 15分钟'), h('div', { class: 'sw-btns' }, h('button', { class: 'sw-l' }, '取消'), h('button', { class: 'sw-s' }, '启动'))));
    }
    render();
    return { back: () => false, destroy: () => { if (sw && sw.timer) clearInterval(sw.timer); } };
  } };

  /* ============================================================
   * 设置
   * ============================================================ */
  P.settings = { mount(win, ctx) {
    const nav = Nav(win, ctx, () => 'dark');
    const ic = (bg, inner) => h('span', { class: 'i-ico', style: `background:${bg}`, html: `<svg viewBox="0 0 24 24">${inner}</svg>` });
    const row = (icon, label, right, onclick) => h('button', { class: 'i-row', style: '--inset:58px', onclick }, icon, h('div', { class: 'i-main' }, h('div', { class: 'i-t' }, label)), h('div', { class: 'i-r' }, right || '', h('span', { html: CHEV })));
    const root = h('div', { class: 'ios settings' });
    const avSrc = A.avatars && A.avatars.me;
    root.append(h('div', { class: 'i-nav' }), h('div', { class: 'i-large' }, '设置'), searchBar());
    root.append(h('div', { class: 'i-scroll' },
      h('div', { class: 'i-group' }, h('button', { class: 'i-row' }, h('div', { class: 'st-prof', style: 'padding:0;flex:1' }, h('div', { class: 'st-av' }, avSrc ? h('img', { src: avSrc, alt: '' }) : '金'), h('div', null, h('div', { class: 'st-n' }, S.me.name), h('div', { class: 'st-s' }, '账户、云端、媒体与购买项目'))), h('span', { html: CHEV }))),
      h('div', { style: 'height:28px' }),
      h('div', { class: 'i-group' },
        h('div', { class: 'i-row', style: '--inset:58px' }, ic('#ff9500', '<path d="M3 15l7-2 4-9 2 1-2 9 6 3-1 2-6-2-4 6-2-1 2-6-5 1z"/>'), h('div', { class: 'i-main' }, '飞行模式'), h('span', { class: 'tog' })),
        row(ic('#007aff', '<path d="M4 9.5a11.5 11.5 0 0 1 16 0M7 12.6a7.2 7.2 0 0 1 10 0M10 15.6a3 3 0 0 1 4 0"/>'), '无线局域网', 'KIM_5G'),
        row(ic('#007aff', '<path d="M7 7l10 10-5 4V3l5 4L7 17"/>'), '蓝牙', '打开'),
        row(ic('#34c759', '<path d="M6 18V14M10 18v-6M14 18V9M18 18V6"/>'), '蜂窝网络', '')),
      h('div', { style: 'height:28px' }),
      h('div', { class: 'i-group' },
        row(ic('#ff3b30', '<rect x="5" y="4" width="14" height="16" rx="3"/><circle cx="16" cy="7" r="2" fill="#fff"/>'), '通知'),
        row(ic('#ff2d55', '<path d="M5 10h3l5-4v12l-5-4H5z"/><path d="M16 9a4 4 0 0 1 0 6"/>'), '声音与触感', '', () => soundSettings()),
        row(ic('#5856d6', '<path d="M17 15.5A7 7 0 0 1 8.5 7a7 7 0 1 0 8.5 8.5z"/>'), '专注模式'),
        row(ic('#5856d6', '<path d="M12 4v8l5 3"/><circle cx="12" cy="12" r="8"/>'), '屏幕使用时间')),
      h('div', { style: 'height:28px' }),
      h('div', { class: 'i-group' },
        row(ic('#8e8e93', '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'), '通用', '', () => general()),
        row(ic('#007aff', '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>'), '显示与亮度'),
        row(ic('#34aadc', '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M5 15l4-4 4 4 2-2 4 4"/>'), '墙纸'),
        row(ic('#34c759', '<rect x="3" y="8" width="16" height="9" rx="2"/><path d="M21 11v3"/>'), '电池'),
        row(ic('#007aff', '<path d="M12 3c3 2 6 2 7 2 0 8-3 13-7 15-4-2-7-7-7-15 1 0 4 0 7-2z"/>'), '隐私与安全性')),
      h('div', { style: 'height:40px' })));
    nav.root(root);
    function soundSettings() {
      const mute=h('button',{class:'tog'+(!U.sound.muted?' on':''),'aria-label':'播放声音','aria-pressed':String(!U.sound.muted),onclick:()=>{U.sound.setMuted(!U.sound.muted);mute.classList.toggle('on',!U.sound.muted);mute.setAttribute('aria-pressed',String(!U.sound.muted));}},'');
      const slider=h('input',{type:'range',min:0,max:1,step:.05,value:U.sound.volume,'aria-label':'提示音音量',style:'width:100%;accent-color:#007aff',oninput:e=>U.sound.setVolume(e.target.value)});
      let previewTimer;
      const stopPreview=()=>{clearTimeout(previewTimer);U.sound.stop('alarm');U.sound.stop('ring');};
      const page=h('div',{class:'ios settings'},navBar(nav,'设置','声音与触感'),h('div',{class:'i-scroll'},
        h('div',{class:'i-group',style:'margin-top:24px'},h('div',{class:'i-row'},h('div',{class:'i-main'},'播放声音'),mute),h('div',{class:'i-row'},slider)),
        h('div',{class:'i-group',style:'margin-top:24px'},
          row(ic('#fee500','<path d="M4 6h16v10H9l-5 4z"/>'),'试听 카톡', '',()=>{stopPreview();U.sound.msg();}),
          row(ic('#ff9500','<circle cx="12" cy="12" r="8"/>'),'试听闹钟','',()=>{stopPreview();U.sound.alarm();previewTimer=setTimeout(stopPreview,5000);}),
          row(ic('#8e8e93','<path d="M6 6h12v12H6z"/>'),'停止试听','',stopPreview)),
        h('p',{style:'padding:8px 24px;color:#777;font-size:12px;line-height:1.8'},'消息提示音：카톡。闹钟与来电跟随此处音量。请先点击页面启用声音。')));
      page._onPop=stopPreview;nav.push(page);
    }
    function general() {
      const info = (k, v) => h('div', { class: 'i-row' }, h('div', { class: 'i-main' }, k), h('div', { class: 'i-r' }, v));
      nav.push(h('div', { class: 'ios settings' }, navBar(nav, '设置', '关于本机'), h('div', { class: 'i-scroll' }, h('div', { style: 'height:20px' }),
        h('div', { class: 'i-group' }, info('名称', S.deviceName), info('软件版本', '15.4.1'), info('型号名称', '—')),
        h('div', { style: 'height:28px' }),
        h('div', { class: 'i-group' }, info('歌曲', '214'), info('视频', '3'), info('照片', String((A.album || []).length)), info('容量', '128 GB'), info('可用容量', '41.2 GB')),
        h('div', { style: 'height:420px' }),
        h('p', { style: 'text-align:center;color:#b3b3b8;font-size:11px;line-height:1.7;padding:0 24px 40px' }, 'made by 霹雳小猫', h('br'), '《花样年华》同人作品 · 非官方'))));
    }
    return { back: () => nav.pop(), destroy: () => { U.sound.stop('alarm'); U.sound.stop('ring'); } };
  } };

  /* ============================================================
   * 相机
   * ============================================================ */
  P.camera = { mount(win, ctx) {
    ctx.setTone('light');
    const view = h('div', { class: 'cam-view' });
    win.append(h('div', { class: 'ios cam page' },
      h('div', { class: 'cam-top', html: '<svg viewBox="0 0 24 24"><path d="M13 3L6 13h5l-1 8 7-10h-5z"/></svg><svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>' }),
      view,
      h('div', { class: 'cam-modes' }, h('span', null, '慢动作'), h('span', null, '视频'), h('span', { class: 'on' }, '照片'), h('span', null, '人像'), h('span', null, '全景')),
      h('div', { class: 'cam-bot' }, h('span', { class: 'cam-thumb' }), h('button', { class: 'cam-shut', 'aria-label': '拍照', onclick: () => { view.classList.remove('flash'); void view.offsetWidth; view.classList.add('flash'); U.sound.tap(); } }, h('span')), h('span', { class: 'cam-flip', html: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/></svg>' }))));
    return { back: () => false };
  } };
})();
