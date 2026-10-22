/* 剧情事件：泰亨的来电 → 夜里过去 → 03:30 闹钟 → 5月22日的锁屏
 * 每一步只发生一次，进度保存在会话里。 */
(function () {
  const S = window.STORY, U = window.UI, { h } = U;
  const st = () => U.store.get('ev', {});
  const save = (patch) => U.store.set('ev', { ...st(), ...patch });
  let scheduled = false, afterCall = false;

  /* ---------- 刷新后恢复已经发生过的事 ---------- */
  function restore() {
    const e = st();
    if (e.call) {
      S.calls.push(Object.assign(['05-21 23:53', 'th', e.call === 'answered' ? 'in' : 'missed', e.call === 'answered' ? 6 : 0], { fresh: true, seen: true }));
      S.now.hh = 23; S.now.mm = 55;
    }
    if (e.msg) window.Chat.pushMessage('th', ['05-21 23:55', 'th', '…明天见'], true);
    if (e.end) applyEnding(true);
    window.Phone.setNow({});
    if(e.snoozeUntil && !e.end){window.Phone.setNow({d:22,hh:Math.floor((e.wakeMinutes-9)/60),mm:(e.wakeMinutes-9)%60});armSnooze();}
    else if (!e.end && allOpened()) scheduleMorning();

  }

  /* ---------- 触发条件 ---------- */
  function onNoteOpened(id) {
    if (id !== 'say' || st().call || scheduled) return;
    scheduled = true;
    setTimeout(incomingCall, 5000);
  }
  function onUnlock() {
    U.sound.unlockAudio();
  }

  /* ---------- 铃声（合成） ---------- */
  let ringTimer = null;
  function ring(on) {
    clearInterval(ringTimer);
    if (!on) { U.sound.stop('ring'); return; }
    const once = () => { if(document.hidden || U.sound.muted) return; U.sound.ring(); U.haptic([400, 200, 400]); };
    once(); ringTimer = setInterval(once, 2200);
  }

  /* ---------- 来电 ---------- */
  const PHONE = '<path d="M20 16.2v2.6a1.8 1.8 0 0 1-2 1.8 17.6 17.6 0 0 1-7.7-2.7 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 2.3 4.8 1.8 1.8 0 0 1 4.1 3h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.8.3 1.6.6 2.4a1.8 1.8 0 0 1-.4 1.9L7.6 9.9a14.3 14.3 0 0 0 5.3 5.3l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.4.6a1.8 1.8 0 0 1 1.7 1.9z"/>';
  function incomingCall() {
    if (st().call || st().end || S.now.d > 21 || document.querySelector('.fs-alarm')) return;
    window.Phone.setNow({ hh: 23, mm: 53 });
    const scr = window.Phone.screen;
    const prevTone = document.getElementById('statusbar').classList.contains('sb-dark') ? 'dark' : 'light';
    window.Phone.setTone('light');
    let decided = false, timeout;
    const ui = h('div', { class: 'fs-call', role: 'dialog', 'aria-label': '泰亨来电' },
      h('div', { class: 'fc-sub' }, '移动电话'),
      h('div', { class: 'fc-name' }, '泰亨'),
      h('div', { class: 'fc-btns' },
        h('button', { class: 'fc-no', onclick: () => finish('missed') }, h('span', { html: `<svg viewBox="0 0 24 24">${PHONE}</svg>` }), '拒绝'),
        h('button', { class: 'fc-yes', onclick: () => answer() }, h('span', { html: `<svg viewBox="0 0 24 24">${PHONE}</svg>` }), '接听')));
    scr.append(ui);
    ring(true);
    timeout = setTimeout(() => finish('missed'), 28000);

    function answer() {
      if (decided) return;
      decided = true; clearTimeout(timeout); ring(false); U.sound.tap();
      let s = 0;
      const timer = h('div', { class: 'fc-sub', style: 'margin-top:6px' }, '00:00');
      ui.innerHTML = '';
      const g = (l, ic) => h('div', null, h('i', { html: `<svg viewBox="0 0 24 24">${ic}</svg>` }), l);
      ui.append(h('div', { class: 'fc-name', style: 'margin-top:110px' }, '泰亨'), timer,
        h('div', { class: 'fc-grid' }, g('静音', '<path d="M9 9v3a3 3 0 0 0 5 2.2M15 10V6a3 3 0 0 0-6 0M5 11a7 7 0 0 0 11.7 5.2M19 11a7 7 0 0 1-.4 2.3M12 18v3M4 4l16 16"/>'), g('拨号键盘', '<circle cx="7" cy="6" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="17" cy="6" r="1"/><circle cx="7" cy="11" r="1"/><circle cx="12" cy="11" r="1"/><circle cx="17" cy="11" r="1"/><circle cx="7" cy="16" r="1"/><circle cx="12" cy="16" r="1"/><circle cx="17" cy="16" r="1"/>'), g('扬声器', '<path d="M5 10h3l5-4v12l-5-4H5z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 7a7 7 0 0 1 0 10"/>'),
          g('添加通话', '<path d="M12 5v14M5 12h14"/>'), g('视频通话', '<rect x="3" y="6.5" width="12.5" height="11" rx="2"/><path d="M15.5 10.5l5.5-3v9l-5.5-3"/>'), g('通讯录', '<circle cx="12" cy="9" r="3.5"/><path d="M5 20c1-3.5 3.8-5.3 7-5.3s6 1.8 7 5.3"/>')),
        h('button', { class: 'fc-end', 'aria-label':'挂断通话', onclick: () => end(), html: `<svg viewBox="0 0 24 24">${PHONE}</svg>` }));
      const iv = setInterval(() => { s++; timer.textContent = `00:${U.pad(s)}`; if (s >= 6) end(); }, 1000);
      let ended=false;
      function end() { if(ended)return;ended=true;clearInterval(iv); timer.textContent = '通话结束'; setTimeout(() => finish('answered', true), 900); }
    }

    function finish(kind) {
      if (ui._done) return; ui._done = true;
      decided = true; clearTimeout(timeout); ring(false);
      ui.style.transition = 'opacity .3s'; ui.style.opacity = '0';
      setTimeout(() => ui.remove(), 300);
      window.Phone.setTone(prevTone);
      S.calls.push(Object.assign(['05-21 23:53', 'th', kind === 'answered' ? 'in' : 'missed', kind === 'answered' ? 6 : 0], { fresh: true, seen: kind === 'answered' }));
      save({ call: kind });
      window.Phone.refresh();
      afterCall = true;
      setTimeout(() => {
        afterCall = false;
        if (st().end) return;
        window.Phone.setNow({ hh: 23, mm: 55 });
        window.Chat.pushMessage('th', ['05-21 23:55', 'th', '…明天见']);
        save({ msg: true });
      }, 7000);
    }
  }

  /* ---------- 结尾 ---------- */
  let snoozeTimer = null;
  function armSnooze() {
    clearTimeout(snoozeTimer);
    const until=st().snoozeUntil;if(!until || st().end)return;
    snoozeTimer=setTimeout(() => {save({snoozeUntil:null});ending(true);},Math.max(0,until-Date.now()));
  }
  /* 稍后提醒期间，锁屏最上面一直挂着这张卡，随时可以停掉 */
  function snoozeCard() {
    const e = st();
    if (!e.snoozeUntil || e.end) return null;
    const m = e.wakeMinutes || 219;
    const at = `${U.pad(Math.floor(m / 60))}:${U.pad(m % 60)}`;
    const stopIt = (ev) => {
      ev.stopPropagation();
      clearTimeout(snoozeTimer); U.sound.tap();
      save({ snoozeUntil: null });
      applyEnding(false, false, m - 8);
    };
    return h('div', { class: 'ncard snz-card' },
      h('div', { class: 'napp' }, U.iconEl('clock')),
      h('div', { class: 'nbody' },
        h('div', { class: 'nhead' }, h('span', null, '闹钟')),
        h('div', { class: 'ntext' }, `稍后提醒 · ${at}`)),
      h('button', { class: 'snz-stop', type: 'button', onclick: stopIt }, '停止'));
  }
  /* 桌面 + Dock 的 11 个应用各打开过一次后，夜就过去了（只触发一次） */
  const REQUIRED = ['calendar', 'photos', 'clock', 'maps', 'notes', 'chat', 'settings', 'phone', 'safari', 'messages', 'camera'];
  const opened = () => U.store.get('opened', []);
  const allOpened = () => REQUIRED.every((id) => opened().includes(id));
  let morningTimer = null;
  function onAppOpened(id) {
    if (!REQUIRED.includes(id) || st().end) return;
    if (!opened().includes(id)) U.store.set('opened', [...opened(), id]);
    if (allOpened()) scheduleMorning();
  }
  function scheduleMorning() {
    if (morningTimer || st().end || st().snoozeUntil) return;
    const tryNow = () => {
      // 来电进行中、或刚挂断还在等那条消息时，不打断
      if (document.querySelector('.fs-call') || afterCall) { morningTimer = setTimeout(tryNow, 1000); return; }
      morningTimer = null;
      ending();
    };
    morningTimer = setTimeout(tryNow, 3000);
  }
  function ending(snoozed = false) {
    if (st().end || document.querySelector('.fs-alarm')) return;
    const alarm = S.alarms.find((a) => a.time === '03:30');
    // 夜过去了
    document.querySelectorAll('.fs-call,.pv,.viewer').forEach((x) => x.remove());
    document.getElementById('banner-layer').innerHTML = '';
    window.Phone.closeApp(true);
    if (alarm && alarm.on) {
      const wakeMinutes = snoozed ? (st().wakeMinutes || 219) : 210;
      const wakeLabel = `${U.pad(Math.floor(wakeMinutes/60))}:${U.pad(wakeMinutes%60)}`;
      window.Phone.setNow({ d: 22, hh: Math.floor(wakeMinutes/60), mm: wakeMinutes%60 });
      window.Phone.lock();
      const scr = window.Phone.screen;
      U.sound.alarm();
      const stop = () => { U.sound.stop('alarm'); U.haptic(0); ui.remove(); applyEnding(false, false, wakeMinutes + 1); };
      const snooze = () => {
        U.sound.stop('alarm'); U.haptic(0); ui.remove();
        save({ snoozeUntil: Date.now() + 9*60*1000, wakeMinutes:wakeMinutes+9 });
        window.Phone.lock();
        U.banner({appId:'clock',title:alarm.label,text:'9分钟后再次提醒'});
        armSnooze();
      };
      const ui = h('div', { class: 'fs-alarm', role: 'dialog', 'aria-label': '闹钟' },
        h('div', { class: 'fa-in' }, h('div', { class: 'fa-time' }, wakeLabel), h('div', { class: 'fa-label' }, alarm.label),
          h('button', { class: 'fa-snooze', onclick: snooze }, '稍后提醒（9分钟）'),
          h('button', { class: 'fa-stop', onclick: stop }, '停止')));
      scr.append(ui);
      window.Phone.setTone('light');
    } else {
      window.Phone.setNow({ d: 22, hh: 3, mm: 41 });
      applyEnding(false, true);
    }
  }
  function applyEnding(silent, overslept, minute = 211) {
    const e = st();
    const push = (room, raw) => window.Chat.pushMessage(room, raw, true);
    push('nj', ['05-22 03:24', 'nj', '灯开着']);
    push('group', ['05-22 03:30', 'hs', '起床！！！！！！']);
    if (overslept || e.overslept) {
      ['05-22 03:34', '05-22 03:36', '05-22 03:39'].forEach((t) => S.calls.push(Object.assign([t, 'hs', 'missed', 0], { fresh: true })));
      push('hs', ['05-22 03:40', 'hs', '哥？？']);
    }
    if (!silent) {
      save({ end: true, overslept: !!overslept, snoozeUntil:null, endMinute:minute });
      window.Phone.setNow(overslept ? { d: 22, hh: 3, mm: 41 } : { d: 22, hh: Math.floor(minute/60), mm: minute%60 });
      window.Phone.lock();
      setTimeout(sleep, 7000);
    } else {
      window.Phone.setNow(e.overslept ? { d: 22, hh: 3, mm: 41 } : { d: 22, hh: Math.floor((e.endMinute || 211)/60), mm: (e.endMinute || 211)%60 });
    }
  }

  /* 屏幕熄灭：故事停在这里。点一下会重新亮起。 */
  function sleep() {
    if (window.Phone.mode !== 'lock' || document.querySelector('.screen-off')) return;
    const off = h('div', { class: 'screen-off' });
    off.addEventListener('click', () => { off.classList.add('wake'); setTimeout(() => off.remove(), 400); });
    window.Phone.screen.append(off);
  }

  /* 时钟能走到哪一分钟（d*1440 + 分钟）：来电前最多到 23:53，来电后可以过零点；
   * 稍后提醒期间跟着真实时间走到下一次响铃；结束后可以一直走 */
  function clockCap() {
    const e = st();
    if (document.querySelector('.fs-alarm')) return null;
    if (e.end) return 22 * 1440 + 23 * 60 + 59;
    if (e.snoozeUntil) return 22 * 1440 + (e.wakeMinutes || 219) - 1;
    if (!e.call) return 21 * 1440 + 23 * 60 + 53;   // 23:53 泰亨会打来
    return 22 * 1440 + 3 * 60 + 29;                 // 之后一直走，闹钟前一分钟为止
  }
  /* 每走一分钟检查一次：到 23:53 还没打来过，就自己打来 */
  function onMinute() {
    const e = st();
    if (e.call || scheduled || e.end || S.now.d !== 21) return;
    if (S.now.hh * 60 + S.now.mm >= 23 * 60 + 53) { scheduled = true; incomingCall(); }
  }

  document.addEventListener('visibilitychange',()=>{if(!document.hidden && document.querySelector('.fs-alarm'))U.sound.alarm();});
  window.Events = { onMinute, clockCap, snoozeCard, onNoteOpened, onUnlock, onAppOpened, restore, _call: incomingCall, _end: ending };
})();
