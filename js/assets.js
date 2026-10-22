/* ============================================================
 * 素材槽位表
 * 把文件放进 assets/ 对应文件夹，在这里填上路径即可，例如：
 *   lock: 'assets/wallpaper/lock.jpg'
 * 留空（null）的位置会显示占位，不会报错。
 * 每个槽位后面的注释是建议放什么。
 * ============================================================ */
window.ASSETS = {
  sounds: { message: 'assets/sounds/katalk.mp3', alarm: 'assets/sounds/departure-alarm.wav' },
  /* ---------- 壁纸（竖图，建议至少 1170×2532） ---------- */
  wallpaper: {
    lock: 'assets/wallpaper/lock.jpg', // 锁屏：七个人在海边的画面（MV 截图）
    home: 'assets/wallpaper/home.jpg', // 桌面：没有人物的空镜，海 / 铁轨 / 黄昏街道，别太花，不挡图标
  },

  /* ---------- 应用图标（商标全部在这里，方图即可，会自动裁圆角） ---------- */
  icons: {
    chat:     { label: 'KakaoTalk',    src: 'assets/icons/chat.svg' },
    phone:    { label: '电话',          src: 'assets/icons/phone.svg' },
    messages: { label: '信息',          src: 'assets/icons/messages.svg' },
    safari:   { label: 'Safari浏览器',  src: 'assets/icons/safari.svg' },
    camera:   { label: '相机',          src: 'assets/icons/camera.svg' },
    photos:   { label: '照片',          src: 'assets/icons/photos.svg' },
    notes:    { label: '备忘录',        src: 'assets/icons/notes.svg' },
    calendar: { label: '日历',          src: null },
    clock:    { label: '时钟',          src: null },
    maps:     { label: '地图',          src: 'assets/icons/maps.svg' },
    settings: { label: '设置',          src: 'assets/icons/settings.svg' },
    weather:  { label: '天气',          src: null },
  },

  /* ---------- 头像（方图） ---------- */
  avatars: {
    me: 'assets/avatars/me.jpg', // 硕珍：不爱露脸，建议风景或车窗外的照片
    nj: 'assets/avatars/nj.jpg', // 南俊：书 / 夜里的加油站灯
    yg: 'assets/avatars/yg.jpg', // 玧其：钢琴琴键，或干脆不设
    hs: 'assets/avatars/hs.jpg', // 号锡：笑脸自拍或汉堡店工作照
    jm: 'assets/avatars/jm.jpg', // 智旻：天空（刚出院，从屋顶拍的）
    th: 'assets/avatars/th.jpg', // 泰亨：涂鸦墙
    jk: 'assets/avatars/jk.jpg', // 柾国：自己画的速写
    gm: null, // 外婆：花或教会
    ts: 'assets/avatars/ts.svg', // Two Star 汉堡：店铺标志（虚构店铺，已做好）
  },

  /* ---------- 资料页背景图（点开好友资料时显示） ---------- */
  profileBg: {
    me: null, nj: null, yg: null, hs: null, jm: null, th: null, jk: null, gm: null, ts: null,
  },

  /* ---------- 聊天里的图片 ---------- */
  chatPhotos: {
    // 新群
    g_rooftop: 'assets/chat/g_rooftop.jpg',    // 5/16 号锡：智旻在屋塔房晒太阳（屋顶、城市俯瞰）
    g_burger: 'assets/chat/g_burger.jpg',     // 5/18 号锡：店里的新品汉堡
    // 旧群
    o_beach_2019: 'assets/chat/o_beach_2019.jpg', // 2019/6/12 硕珍：手机拍的海边合照（对应拍立得那天）
    o_flowerpot: 'assets/chat/o_flowerpot.jpg',  // 2019/6/25 硕珍：仓库教室窗台上的花盆
    o_graduation: 'assets/chat/o_graduation.jpg', // 2022/2/18 号锡：毕业照
    // 私聊
    d_jk_sketch: 'assets/chat/d_jk_sketch.jpg',  // 5/17 柾国：画的速写，问“像你吗”
    d_jm_view: 'assets/chat/d_jm_view.jpg',    // 5/16 智旻（上午11点）：从屋顶拍的白天城市 / 江对岸的公寓
    d_gm_flower: 'assets/chat/d_gm_flower.jpg',  // 5/8 外婆：教会给的康乃馨
  },

  /* ---------- 表情（png / gif，透明背景最好） ---------- */
  stickers: {
    st_hs_pout: 'assets/stickers/st_hs_pout.png',  // 5/18 号锡：抱手赌气的小松鼠
    st_jk_hi: 'assets/stickers/st_jk_hi.png',    // 2019 柾国：害羞打招呼
    st_th_xmas: 'assets/stickers/st_th_xmas.png',  // 2019 泰亨：圣诞
  },

  /* ---------- 语音消息（mp3 / m4a） ---------- */
  voices: {
    v_hs_wakeup: null, // 5/21 号锡：“都早点睡！三点半我挨个打电话！智旻我直接叫醒！”
    v_gm_1: null,      // 5/11 外婆：早上的嘱咐（吃饭、天冷、去教会）
  },

  /* ---------- 相册 ----------
   * 按时间先后排列。src 为空时显示空位。place 是点开照片时显示的地点（飞机上那张没有定位）。
   * note 只是给你的备注，不会显示在页面上。 */
  album: [
    { src: 'assets/photos/a01_polaroid.jpg', date: '2019-06-12 15:40', place: '江陵市', note: '海边七人拍立得（翻拍）' },
    { src: 'assets/chat/o_beach_2019.jpg', date: '2019-06-12 15:52', place: '江陵市', note: '七个人的合照（和旧群里发的是同一张）' },
    { src: 'assets/chat/o_flowerpot.jpg', date: '2019-06-25 16:08', place: '松州市', note: '仓库教室窗台上的花盆（和旧群里发的是同一张）' },
    { src: 'assets/photos/a02_piano.jpg', date: '2019-11-07 17:30', place: '松州市', note: '仓库教室 钢琴 / 逆光的背影' },
    { src: 'assets/photos/a03_la1.jpg', date: '2021-08-09 18:12', place: '马里布', note: '洛杉矶的海（没有人）' },
    { src: 'assets/photos/a04_la2.jpg', date: '2021-08-09 18:20', place: '马里布', note: '洛杉矶的海 2' },
    { src: 'assets/photos/a05_la3.jpg', date: '2021-08-09 18:31', place: '马里布', note: '洛杉矶的海 3 / 阴天' },
    { src: 'assets/photos/a06_window.jpg', date: '2021-12-25 09:02', place: '大熊湖', note: '外婆家的窗 / 圣诞' },
    { src: 'assets/photos/a07_plane.jpg', date: '2022-02-01 16:40', note: '飞机舷窗 / 云' },
    { src: 'assets/photos/a08_container.jpg', date: '2022-04-11 21:10', place: '松州市', note: '夜里亮着灯的集装箱（从车里拍）' },
    { src: 'assets/photos/a09_bird.jpg', date: '2022-05-02 23:40', place: '松州市', note: '钢琴后面受伤的鸟' },
    { src: 'assets/photos/a10_lounge.jpg', date: '2022-05-16 00:58', place: '松州市', note: '医院一楼休息室：桌上的蜡烛、零食和汽水，拍糊了也行' },
    { src: 'assets/photos/a11_film.jpg', date: '2022-05-21 14:25', place: '松州市', note: '两盒拍立得相纸' },
  ],
};
