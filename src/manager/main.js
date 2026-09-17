'use strict';
/* ---------------- MODAL ---------------- */
let modalLocked = false;
function showModal(html, lock){
  modalLocked = !!lock;
  $('#modal-box').innerHTML = html;
  $('#modal').style.display = 'flex';
}
function closeModal(force){
  if(modalLocked && !force) return;
  modalLocked = false;
  $('#modal').style.display = 'none';
}
$('#modal').addEventListener('click', e => { if(e.target.id === 'modal' && !modalLocked) closeModal(); });

/* ---------------- LOOP ---------------- */
let acc = 0;
setInterval(() => {
  if(!S) return;
  if(isRealtimeGameOpen()) return;
  const now = Date.now();
  const dt = Math.min((now - S.lastReal)/1000, 5);
  S.lastReal = now;
  const gm = dt * CFG.RATE * speed;
  worldAdvance(gm, false);
  autoPlayStep();
  autoPlayStep();
  autoPlayStep();
  if(S.autoUntil && Date.now() < S.autoUntil) S.stats.idleSecs = (S.stats.idleSecs||0) + dt;
  acc += dt;
  if(acc >= 1){ acc = 0; renderIfChanged(); save(); }
}, 1000);

/* 后台补算：标签页被浏览器节流/冻结时，回到前台按离线效率一次性补算 */
function catchUpTick(){
  if(!S) return;
  const now = Date.now();
  const dt = (now - S.lastReal)/1000;
  if(dt <= 1.5) return;
  const capped = Math.min(dt, 48*3600);
  worldAdvance(capped * CFG.RATE * CFG.OFFLINE_EFF, true);
  S.lastReal = now;
  log(TEXT.ui_offline_msg.replace('{hours}', (dt/3600).toFixed(1)), 'sys');
  renderAll(); save();
}
document.addEventListener('visibilitychange', () => { if(!document.hidden) setTimeout(catchUpTick, 60); });
window.addEventListener('focus', () => setTimeout(catchUpTick, 60));
window.addEventListener('beforeunload', save);
/* 动画专用快速 tick：名册展示位 8fps 需要 ~150ms 刷新（前台才跑） */
setInterval(() => { if(!document.hidden && S) tickStages(performance.now()); }, 150);

/* ---------------- EVENTS BINDING ---------------- */
/* 收纳折叠状态（独立于存档，localStorage 持久化） */
let FOLD = {camp:false, rares:true, log:false, boardCompact:false, boardFolded:false};
function loadFold(){
  try{
    const f = JSON.parse(localStorage.getItem('drg_fold_v1') || '{}');
    FOLD = Object.assign(FOLD, f);
  }catch(e){}
  /* 手机修复单·修4：窄屏首次进入默认展开稀有矿物（仅在玩家从未手动折叠过时生效） */
  if(window.innerWidth <= 700 && localStorage.getItem('drg_fold_v1') === null) FOLD.rares = false;
}
function saveFold(){
  try{ localStorage.setItem('drg_fold_v1', JSON.stringify(FOLD)); }catch(e){}
}
function applyLogFold(){
  const p = document.getElementById('logPanel'); if(!p) return;
  p.classList.toggle('folded', !!FOLD.log);
}
/* ---------------- 测试协议（测试码：jcmeowiscat / iriscat） ---------------- */
let cheatBuf = '';
function doCheat(code){
  if(!S) return;
  S.credits += 100000; S.nitra += 10000; S.morkite += 50000; S.moil += 20000; S.gold += 5000;
  RARES.forEach(r => S.rare[r] = (S.rare[r]||0) + 200);
  S.merit = (S.merit||0) + 500;
  S.blanks = (S.blanks||0) + 30;
  S.rigLv = 10;
  Object.keys(CLASSES).forEach(c => {
    S.recruited[c] = true;
    if(!S.miners.some(m=>m.cls===c)) S.miners.push(newMiner(c));
  });
  S.licenses = {scout:3, engineer:3, gunner:3, driller:3};
  Object.keys(WEAPON_MODS).forEach(cls => Object.keys(WEAPON_MODS[cls]).forEach(wid => {
    WEAPON_MODS[cls][wid].mods.forEach(m => { S.modsOwned[m.id] = 1; });
  }));
  S.elite = S.elite || {};
  S.elite.owned = ELITE_UNITS.units.map(u=>u.id);
  S.elite.carry = null;
  S.dive.week = '';
  S.miners.forEach(m => { m.morale = 100; m.state = (m.state==='med') ? 'idle' : m.state; m.medUntil = 0; m.stars = Math.max(m.stars||0, 24);   /* 红3满（B 退回项①） */ });
  S.campaign = {ci:0, si:0, prog:0};
  S.unlocked = {kpi:true, bar:true, market:true, med:true, gear:true};   /* F10：测试码=全解锁 */
  S.flags.prologueDone = true;
  log('【测试协议 '+code+'】权限溢出确认：全模组解锁、资源注满、精英全员到齐、深潜刷新。请勿告诉财务部。', 'gold');
  lastSig = ''; renderAll(); save();
}
document.addEventListener('keydown', e => {
  if(!e.key || e.key.length !== 1) return;
  if(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  cheatBuf = (cheatBuf + e.key.toLowerCase()).slice(-12);
  if(cheatBuf.endsWith('jcmeowiscat')){ cheatBuf=''; doCheat('JCMEOW'); }
  else if(cheatBuf.endsWith('iriscat')){ cheatBuf=''; doCheat('IRIS'); }
});

/* 资源总览弹窗：全部资源 + 市场价一屏看完 */
function showResourceOverview(){
  const rows = [];
  const mains = [
    {k:'credits', name:'代币', icon:null},
    {k:'nitra', name:'硝石', icon:'res_nitra'},
    {k:'morkite', name:'墨菱石', icon:'res_morkite'},
    {k:'moil', name:'墨菱油', icon:'res_morkite'},
    {k:'gold', name:'黄金', icon:'res_gold'},
  ];
  mains.forEach(r=>{
    rows.push('<div class="row"><span style="flex:1">'+(r.icon?ic(r.icon):'◈')+' '+r.name+'</span><b>'+fmt(S[r.k]||0)+'</b></div>');
  });
  rows.push('<div class="row"><span style="flex:1">功绩点</span><b>'+(S.merit||0)+'</b></div>');
  rows.push('<div class="row"><span style="flex:1">空白模组</span><b>'+(S.blanks||0)+'</b></div>');
  rows.push('<h3 class="sec">稀有矿物（含市场价）</h3>');
  TRADEABLES.forEach(t=>{
    const p = S.market.prices[t.k] || t.base;
    rows.push('<div class="row"><span style="flex:1">'+(MKEY[t.name] ? ic('res_'+MKEY[t.name]) : '◇')+' '+t.name+'</span><span>持有 <b>'+fmt(S[t.k]||0)+'</b>　市价 <b>'+p+'</b></span></div>');
  });
  showModal('<h3 style="color:var(--amber)">资源总览</h3><div style="margin-top:8px;">'+rows.join('')+'</div>'+
    '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn" onclick="closeModal(true)">关闭</button></div>', true);
}
/* 仓库面板（C §10.2）：饰品格 + 模组柜，纯展示 */
function trRarityColor(r){
  return {uncommon:'var(--dim)', rare:'var(--teal)', epic:'var(--amber)', legendary:'var(--red)'}[r] || 'var(--line)';
}
let whPage = 0;
function showWarehouse(){
  whPage = 0;
  renderWarehouse();
}
function renderWarehouse(){
  ensureTrinketIndex();
  const PER = 14;   /* 每页模组数（翻页式，防弹窗无限拉高） */
  const mods = Object.keys(S.modsOwned||{}).filter(mid => (S.modsOwned[mid]||0) > 0 && MOD_INDEX[mid]);
  const pages = Math.max(1, Math.ceil(mods.length / PER));
  if(whPage >= pages) whPage = pages - 1;
  if(whPage < 0) whPage = 0;
  const slice = mods.slice(whPage*PER, whPage*PER + PER);
  const cells = [];
  Object.keys(S.trinkets||{}).filter(id => TRINKET_INDEX[id] && (S.trinkets[id]||0) > 0).forEach(id => {
    const t = TRINKET_INDEX[id], n = S.trinkets[id];
    cells.push('<div data-trdet="'+t.id+'" style="width:52px;height:52px;border:1px solid '+trRarityColor(t.rarity)+';border-radius:3px;position:relative;display:flex;align-items:center;justify-content:center;background:#0a0e12;flex:none;cursor:pointer;" title="'+t.name_zh+'（点击看详情）">'+
      '<img src="assets/trinkets/'+t.id+'.png" style="width:36px;image-rendering:pixelated">'+
      (n>1 ? '<span style="position:absolute;right:2px;bottom:1px;font-size:10px;color:var(--txt);">×'+n+'</span>' : '')+'</div>');
  });
  const trGrid = cells.length
    ? '<div style="display:flex;flex-wrap:wrap;gap:6px;">'+cells.join('')+'</div>'
    : '<div class="note">还没有饰品。深潜末关、节日战役与饰品箱会掉。</div>';
  const modRows = slice.map(mid => {
    const m = MOD_INDEX[mid], n = S.modsOwned[mid];
    return '<div class="row"><span style="flex:1"><img src="assets/trinkets/mod_filled.png" style="width:20px;image-rendering:pixelated;vertical-align:middle"> '+m.name_zh+
      '　<span class="note">'+m.weaponZh+'｜'+m.tier+'</span></span>'+(n>1?'<b>×'+n+'</b>':'')+'</div>';
  }).join('');
  const modBox = modRows
    ? modRows
    : '<div class="note">模组柜空空如也。接三提石任务（✦ 标记）赚空白模组，来锻造台抽卡。</div>';
  const pager = pages > 1
    ? '<div class="row" style="justify-content:center;gap:8px;margin-top:6px;"><button class="btn" data-whpg="-1" '+(whPage===0?'disabled':'')+'>◀ 上一页</button><span class="note">第 '+(whPage+1)+' / '+pages+' 页（共 '+mods.length+' 个模组）</span><button class="btn" data-whpg="1" '+(whPage>=pages-1?'disabled':'')+'>下一页 ▶</button></div>'
    : '';
  showModal('<div style="display:flex;align-items:center;justify-content:space-between;">'+
    '<h3 style="color:var(--amber);margin:0;">📦 仓库</h3>'+
    '<button class="btn" onclick="closeModal(true)">✕ 关闭</button></div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;">'+
    '<div style="flex:1;min-width:260px;"><h3 class="sec">饰品格（全队佩戴）</h3>'+trGrid+
    '<div class="note" style="margin-top:6px;">空白模组 ×'+(S.blanks||0)+' → 装备终端锻造台可抽卡。</div></div>'+
    '<div style="flex:1;min-width:260px;"><h3 class="sec">模组柜（第 '+(whPage+1)+' 页）</h3>'+modBox+pager+'</div>'+
    '</div>'+
    '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn" onclick="closeModal(true)">关闭</button></div>', true);
  $('#modal-box').querySelectorAll('[data-whpg]').forEach(el=>{
    el.onclick = () => { whPage += parseInt(el.dataset.whpg); renderWarehouse(); };
  });
  $('#modal-box').querySelectorAll('[data-trdet]').forEach(el=>{
    el.onclick = () => showTrinketDetail(el.dataset.trdet);
  });
}
/* 饰品详情（仓库二期） */
function showTrinketDetail(id){
  const t = TRINKET_INDEX[id]; if(!t) return;
  const rn = {uncommon:'少见', rare:'稀有', epic:'史诗', legendary:'传说'}[t.rarity] || t.rarity;
  showModal('<h3 style="color:var(--amber)">'+t.name_zh+' <span class="note">'+(t.name_en||'')+'</span></h3>'+
    '<div class="meta">'+rn+(t.fest?'｜'+t.fest:'')+'｜'+effectText(t.effect||{})+'</div>'+
    '<p class="note">'+(t.desc||'')+'</p>'+
    '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn" onclick="renderWarehouse()">← 返回仓库</button></div>', true);
}
/* 日志放大弹窗 */
function showLogModal(){
  const items = S.log.slice(0, 60).map(l=>'<div class="l '+l.c+'">['+l.t+'] '+l.m+'</div>').join('');
  showModal('<h3 style="color:var(--amber)">管理终端日志（近 60 条）</h3>'+
    '<div style="max-height:60vh;overflow-y:auto;border:1px solid var(--line);padding:8px;font-size:12px;line-height:1.7;">'+items+'</div>'+
    '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn" onclick="closeModal(true)">关闭</button></div>', true);
}

document.addEventListener('DOMContentLoaded', async () => {
  window.__initErr = null;
  try{
  let realtimeSummary = null;
  loadFold();
  BGM.init();   /* 修复：此前 init 从未调用，BGM 默认无声（首次任意点击即响） */
  if(!load()){
    newGame();
    playPrologue();
  }
  else {
    realtimeSummary = consumeRealtimeResult();
    /* 离线结算 */
    const dt = Math.min((Date.now() - S.lastReal)/1000, 48*3600);
    if(dt > 60){
      const gm = dt * CFG.RATE * CFG.OFFLINE_EFF;
      worldAdvance(gm, true);
      log('离线报告：你离开了 '+ (dt/3600).toFixed(1) +' 小时，钻台以 10% 效率运转。', 'sys');
    }
    S.lastReal = Date.now();
  }
  applyLogFold();
  try{
    dirHandle = await idbGet('dir');
  }catch(e){}
  renderAll();
  if(realtimeSummary) showRealtimeSummary(realtimeSummary);
  /* 收纳折叠：全局委托（含动态渲染的折叠头） */
  document.addEventListener('click', e => {
    const h = e.target.closest('[data-fold]');
    if(!h) return;
    const key = h.dataset.fold;
    FOLD[key] = !FOLD[key];
    saveFold();
    if(key === 'log'){ applyLogFold(); return; }
    /* camp/rares：直接切 class，不重渲染（避免点击瞬间 DOM 被替换） */
    const box = h.closest('.foldbox');
    if(box) box.classList.toggle('folded', FOLD[key]);
  });
  const pauseBtn = document.getElementById('btn-pause');
  if(pauseBtn) pauseBtn.onclick = () => {
    speed = (speed === 0) ? 1 : 0;
    pauseBtn.innerHTML = (speed === 0) ? '▶ 继续' : '⏸ 暂停';
    log(speed === 0 ? '⏸ 时间暂停。钻台进入待机——矿工们向你致谢。' : '▶ 时间继续流动。挖起来，矿工们！', 'sys');
  };
  $('#btn-refresh').onclick = () => { genBoard(); log(TEXT.log_board_refresh, 'sys'); renderAll(); boardBtnSync(); };
  $('#btn-kpi').onclick = claimKPI;
  /* 任务板按钮自适应（C 补丁）：手机≤700px=折叠/展开，桌面端=简洁/详细 */
  const isMobile = () => window.innerWidth <= 700;
  function boardBtnSync(){
    const b = $('#btn-board-compact');
    if(isMobile()){
      b.textContent = FOLD.boardFolded ? '展开' : '折叠';
      $('#board').classList.toggle('folded', FOLD.boardFolded);
      $('#boardFoldSummary').classList.toggle('on', FOLD.boardFolded);
      if(FOLD.boardFolded) $('#boardFoldSummary').textContent = '任务板已折叠 · '+S.board.length+' 个任务，点击展开';
    } else {
      b.textContent = FOLD.boardCompact ? '详细' : '简洁';
      $('#board').classList.remove('folded');
      $('#boardFoldSummary').classList.remove('on');
    }
  }
  $('#btn-board-compact').onclick = () => {
    if(isMobile()){ FOLD.boardFolded = !FOLD.boardFolded; saveFold(); boardBtnSync(); return; }
    FOLD.boardCompact = !FOLD.boardCompact; saveFold();
    $('#btn-board-compact').textContent = FOLD.boardCompact ? '详细' : '简洁';
    renderBoard();
  };
  $('#boardFoldSummary').onclick = () => { FOLD.boardFolded = false; saveFold(); boardBtnSync(); };
  window.addEventListener('resize', boardBtnSync);
  boardBtnSync();
  $('#btn-log-modal').onclick = showLogModal;
  $('#btn-res-overview').onclick = showResourceOverview;
  $('#logMini').onclick = () => { FOLD.log = false; saveFold(); applyLogFold(); };
  document.querySelectorAll('#tabs .tab').forEach(t=>{
    t.onclick = () => {
      const facKey = {bar:'bar', market:'market', med:'med', gear:'gear'}[t.dataset.tab];
      if(facKey && !facUnlocked(facKey)){
        const f = FACILITIES[facKey];
        const canBuy = S.rigLv>=f.rig && S.campaign.ci > CAMPAIGNS.findIndex(x=>x.id===f.campaign) && S.credits>=f.cost;
        showModal('<h3 style="color:var(--amber)">🔒 '+f.name+'</h3><div class="note" style="margin:10px 0">'+facCondText(facKey)+'</div>'+
          '<button class="btn pri" style="width:100%" id="fac-buy" '+(canBuy?'':'disabled')+'>重建 · '+f.cost+' 代币</button>'+
          '<button class="btn" style="width:100%;margin-top:4px" onclick="closeModal(true)">稍后再说</button>', false);
        $('#fac-buy').onclick = () => {
          if(tryUnlockFacility(facKey)){ closeModal(true); renderAll(); }
          else log(TEXT.un_locked_toast.replace('{name}', f.name).replace('{cond}', facCondText(facKey)), 'bad');
        };
        return;
      }
      document.querySelectorAll('#tabs .tab').forEach(x=>x.classList.remove('on'));
      t.classList.add('on'); curTab = t.dataset.tab; renderSide();
      document.body.dataset.mtab = curTab;   /* F8：手机整视图切换 */
      /* B-8 场景切换（B 施工单）：酒吧 tab / 节日档期 = 酒吧曲，其余 = 主界面曲 */
      BGM.play((curTab === 'bar' || holidayForNow()) ? 'bar' : 'main');
    };
  });
  /* 手机修复单·修5：微信内置浏览器提示（PWA"添加到主屏幕"在微信内不可用） */
  if(/MicroMessenger/i.test(navigator.userAgent)){
    const wxbar = document.createElement('div');
    wxbar.style.cssText = 'margin:0 0 8px;padding:7px 10px;font-size:12px;background:#33270f;border:1px solid #7d5a42;border-radius:3px;color:var(--amber);display:flex;gap:8px;align-items:center;';
    wxbar.innerHTML = '<span style="flex:1;">微信内仅能试玩：无法"添加到主屏幕"，后台运行易被回收。建议点右上角菜单选"在浏览器打开"。</span>'+
      '<button class="btn" id="btn-wx-close">知道了</button>';
    const appEl = document.getElementById('app');
    appEl.insertBefore(wxbar, appEl.firstChild);
    document.getElementById('btn-wx-close').onclick = () => wxbar.remove();
  }
  /* 虫潮预警条小图标（C 二期 swarm_alert_icon，animDiv 一次注入，tickStages 全局驱动） */
  const sic = document.getElementById('swarmalert-ic');
  if(sic) sic.innerHTML = animDiv('swarm_alert_icon', 32, 32);
  /* PWA：Service Worker 注册（file:// 与微信 webview 自动跳过） */
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !/MicroMessenger/i.test(navigator.userAgent))
    navigator.serviceWorker.register('sw.js');
  /* 挂机券：3 小时自动游玩（自动事件决策 + 自动派遣空闲矿工） */
  const toggleAuto = () => {
    if(S.mode === 'rush'){ log(TEXT.dm_auto_rush_lock, 'bad'); return; }
    if(S.autoUntil && Date.now() < S.autoUntil){
      S.autoUntil = 0;
      log(TEXT.dm_auto_off, 'sys');
    } else {
      S.autoUntil = Date.now() + 3*3600*1000;
      S.idleReport = null; S._idleReportShown = false;
      log(TEXT.dm_auto_on, 'gold');
    }
    renderAll(); save();
  };
  const autoBtn = document.getElementById('btn-auto');
  if(autoBtn) autoBtn.onclick = toggleAuto;
  const autoChipBtn = document.getElementById('auto-chip');
  if(autoChipBtn) autoChipBtn.onclick = toggleAuto;
  const modeChipBtn = document.getElementById('mode-chip');
  if(modeChipBtn) modeChipBtn.onclick = () => {
    const oldMode = S.mode;
    S.mode = (S.mode === 'rush') ? 'idle' : 'rush';
    if(S.mode === 'rush' && S.autoUntil && Date.now() < S.autoUntil){ S.autoUntil = 0; log(TEXT.dm_auto_off, 'sys'); }   /* R1：券激活中切急行 → 自动取消 */
    /* 急行切换自动恢复时间流动（jiuduo：暂停+切急行=永远冻结） */
    if(S.mode === 'rush' && speed === 0){ speed = 1; const pb = document.getElementById('btn-pause'); if(pb) pb.innerHTML = '⏸ 暂停'; }
    /* 在途任务：时长按新模式比例转换（非序章/非深潜） */
    S.deps.forEach(d => {
      if(d.kind === 'prologue' || d.isDive || d.paused) return;
      const oldRush = (d.mode === 'rush');
      if(oldRush === (S.mode === 'rush')) return;
      const ratio = (S.mode === 'rush') ? (1/30) : 30;
      const pct = d.dur > 0 ? (d.done||0) / d.dur : 0;
      d.dur = Math.max(6, Math.round(d.dur * ratio));
      d.done = Math.round(d.dur * pct);
      d.mode = S.mode;
    });
    log(S.mode === 'rush' ? TEXT.dm_toast_rush : TEXT.dm_toast_idle, 'sys');
    renderAll(); save();
  };
  const irBtn = document.getElementById('btn-idle-report');
  if(irBtn) irBtn.onclick = showIdleReport;
  const chipCr = document.getElementById('chip-credits');
  if(chipCr) chipCr.onclick = () => showDetail('代币', [
    {label:'当前存量', value:fmt(S.credits)},
    {label:'下季 KPI 奖金', value:fmt(Math.round(1500 * (S.kpi.term + 1)))},
    {label:'重复招募折算', value:'300 代币'},
  ]);
  const chipNi = document.getElementById('chip-nitra');
  if(chipNi) chipNi.onclick = () => showDetail('硝石', [
    {label:'当前存量', value:fmt(S.nitra)},
    {label:'每日产出', value:'+25'},
    {label:'派遣消耗', value:'60×人数×时长系数' + (S.mode === 'rush' ? '（急行 ×4）' : '')},
    {label:'集团关怀', value:(S.credits < 100 && S.nitra < 60) ? '生效中' : '未触发'},
  ]);
  /* B-8：音乐开关 */
  const bgmBtn = document.getElementById('btn-bgm');
  if(bgmBtn){
    bgmBtn.textContent = BGM.icon();
    bgmBtn.onclick = () => { BGM.toggleMute(); bgmBtn.textContent = BGM.icon(); };
  }
  window.addEventListener('beforeunload', save);
  }catch(initErr){ window.__initErr = (initErr.stack || initErr.message); renderAll(); }
});
