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

function showCredits(){
  showModal(
    '<div class="credits-sheet">'+
      '<p class="credits-kicker">PROJECT CREDITS</p>'+
      '<h3>'+L('制作与鸣谢')+'</h3>'+
      '<dl>'+
        '<div><dt>'+L('创意及开发')+'</dt><dd>j-c-meow</dd></div>'+
        '<div><dt>'+L('部署和技术指导')+'</dt><dd>iriscat</dd></div>'+
        '<div><dt>'+L('技术指导')+'</dt><dd>jiuduo、深岩银河汉化组</dd></div>'+
        '<div><dt>'+L('测试')+'</dt><dd>iris 群、Cat Ship Games 群友</dd></div>'+
        '<div><dt>'+L('素材支持')+'</dt><dd>lcyf166、寒曦月璃、Ghost Ship Games、Deep Rock Galactic Wiki</dd></div>'+
        '<div><dt>'+L('参考项目')+'</dt><dd><a href="https://github.com/Flora233333/deep-rock-galactic-html" target="_blank" rel="noopener noreferrer">DS / Flora233333 · deep-rock-galactic-html</a></dd></div>'+
      '</dl>'+
      '<p class="credits-note">'+L('非商业粉丝作品，与 Ghost Ship Games 无隶属关系。游戏名称、美术、音频及商标归原权利人所有。')+'</p>'+
      '<div class="credits-actions"><button class="btn pri" onclick="closeModal(true)">返回管理终端</button></div>'+
    '</div>',
    true
  );
}

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
    rows.push('<div class="row"><span style="flex:1">'+(r.icon?ic(r.icon):'◈')+' '+L(r.name)+'</span><b>'+fmt(S[r.k]||0)+'</b></div>');
  });
  rows.push('<div class="row"><span style="flex:1">'+L('功绩点')+'</span><b>'+(S.merit||0)+'</b></div>');
  rows.push('<div class="row"><span style="flex:1">'+L('空白模组')+'</span><b>'+(S.blanks||0)+'</b></div>');
  rows.push('<h3 class="sec">'+L('稀有矿物（含市场价）')+'</h3>');
  TRADEABLES.forEach(t=>{
    const p = S.market.prices[t.k] || t.base;
    rows.push('<div class="row"><span style="flex:1">'+(MKEY[t.name] ? ic('res_'+MKEY[t.name]) : '◇')+' '+L(t.name)+'</span><span>'+L('持有 <b>')+fmt(S[t.k]||0)+'</b>'+L('　市价 <b>')+p+'</b></span></div>');
  });
  showModal('<h3 style="color:var(--amber)">'+L('资源总览')+'</h3><div style="margin-top:8px;">'+rows.join('')+'</div>'+
    '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn" onclick="closeModal(true)">'+L('关闭')+'</button></div>', true);
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
    cells.push('<div data-trdet="'+t.id+'" style="width:52px;height:52px;border:1px solid '+trRarityColor(t.rarity)+';border-radius:3px;position:relative;display:flex;align-items:center;justify-content:center;background:#0a0e12;flex:none;cursor:pointer;" title="'+L(t)+L('（点击看详情）')+'">'+
      '<img src="assets/trinkets/'+t.id+'.png" style="width:36px;image-rendering:pixelated">'+
      (n>1 ? '<span style="position:absolute;right:2px;bottom:1px;font-size:10px;color:var(--txt);">×'+n+'</span>' : '')+'</div>');
  });
  const trGrid = cells.length
    ? '<div style="display:flex;flex-wrap:wrap;gap:6px;">'+cells.join('')+'</div>'
    : '<div class="note">'+L('还没有饰品。深潜末关、节日战役与饰品箱会掉。')+'</div>';
  const modRows = slice.map(mid => {
    const m = MOD_INDEX[mid], n = S.modsOwned[mid];
    return '<div class="row"><span style="flex:1"><img src="assets/trinkets/mod_filled.png" style="width:20px;image-rendering:pixelated;vertical-align:middle"> '+L(m)+
      '　<span class="note">'+weaponZh(m.weaponId)+'｜'+m.tier+'</span></span>'+(n>1?'<b>×'+n+'</b>':'')+'</div>';
  }).join('');
  const modBox = modRows
    ? modRows
    : '<div class="note">'+L('模组柜空空如也。接三提石任务（✦ 标记）赚空白模组，来锻造台抽卡。')+'</div>';
  const pager = pages > 1
    ? '<div class="row" style="justify-content:center;gap:8px;margin-top:6px;"><button class="btn" data-whpg="-1" '+(whPage===0?'disabled':'')+'>'+L('◀ 上一页')+'</button><span class="note">'+L('第 ')+(whPage+1)+' / '+pages+L(' 页（共 ')+mods.length+L(' 个模组）')+'</span><button class="btn" data-whpg="1" '+(whPage>=pages-1?'disabled':'')+'>'+L('下一页 ▶')+'</button></div>'
    : '';
  showModal('<div style="display:flex;align-items:center;justify-content:space-between;">'+
    '<h3 style="color:var(--amber);margin:0;">'+L('📦 仓库')+'</h3>'+
    '<button class="btn" onclick="closeModal(true)">'+L('✕ 关闭')+'</button></div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;">'+
    '<div style="flex:1;min-width:260px;"><h3 class="sec">'+L('饰品格（全队佩戴）')+'</h3>'+trGrid+
    '<div class="note" style="margin-top:6px;">'+L('空白模组')+' ×'+(S.blanks||0)+L(' → 装备终端锻造台可抽卡。')+'</div></div>'+
    '<div style="flex:1;min-width:260px;"><h3 class="sec">'+L('模组柜（第 ')+(whPage+1)+L(' 页）')+'</h3>'+modBox+pager+'</div>'+
    '</div>'+
    '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn" onclick="closeModal(true)">'+L('关闭')+'</button></div>', true);
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
  const rn = L({uncommon:'少见', rare:'稀有', epic:'史诗', legendary:'传说'}[t.rarity]) || t.rarity;
  showModal('<h3 style="color:var(--amber)">'+L(t)+' <span class="note">'+(t.name_en||'')+'</span></h3>'+
    '<div class="meta">'+rn+(t.fest?'｜'+t.fest:'')+'｜'+effectText(t.effect||{})+'</div>'+
    '<p class="note">'+L(t.desc||'')+'</p>'+
    '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn" onclick="renderWarehouse()">'+L('← 返回仓库')+'</button></div>', true);
}
/* 日志放大弹窗 */
function showLogModal(){
  const items = S.log.slice(0, 60).map(l=>'<div class="l '+l.c+'">['+l.t+'] '+l.m+'</div>').join('');
  showModal('<h3 style="color:var(--amber)">'+L('管理终端日志（近 60 条）')+'</h3>'+
    '<div style="max-height:60vh;overflow-y:auto;border:1px solid var(--line);padding:8px;font-size:12px;line-height:1.7;">'+items+'</div>'+
    '<div class="row" style="justify-content:center;margin-top:10px;"><button class="btn" onclick="closeModal(true)">'+L('关闭')+'</button></div>', true);
}

/* —— 起名系统（用户 09-19 拍板）——
   开局登记管理层代号；称呼位由 log() 里的 applyMgrTitle 统一升级为「管理层·代号」。
   黑名单（用户指定，案底：剽窃游戏攻略、攻击 Mod 作者与难度代码作者）：命中即弹窗拉黑。 */
const NAME_BLACKLIST = ['月饼02', 'iceisbing', '迪克少校'];
function nameBlacklisted(name){
  const norm = (name||'').trim().toLowerCase().replace(/\s+/g,'');
  if(!norm) return false;
  return NAME_BLACKLIST.some(b => norm.includes(b.toLowerCase().replace(/\s+/g,'')));
}
function showNameRegistration(){
  showModal('<h3 style="color:var(--amber)">入职登记 · 代号核验</h3>'+
    '<div class="note" style="margin:8px 0">集团规定：每位管理层须登记专属代号。此后董事会与全钻台将以「管理层·代号」称呼您。（留空则只称"管理层"）</div>'+
    '<input id="reg-name" class="opt" style="text-align:center" maxlength="12" placeholder="例如：铁心、老矿灯" autocomplete="off" spellcheck="false">'+
    '<div class="row" style="margin-top:10px"><button class="btn pri" id="reg-go" style="width:100%">登记完成</button></div>', true);
  const inp = document.getElementById('reg-name');
  if(inp) inp.focus();
  $('#reg-go').onclick = () => {
    const name = (document.getElementById('reg-name').value||'').trim().slice(0,12);
    if(nameBlacklisted(name)){
      log('【人事系统】代号核验失败：「'+name+'」已列入永不录用黑名单（案底：剽窃游戏攻略、攻击 Mod 作者与难度代码作者）。', 'bad');
      showModal('<h3 style="color:var(--red)">⛔ 代号核验未通过</h3>'+
        '<div class="note" style="margin:8px 0">人事档案提示：「<b style="color:var(--red)">'+name+'</b>」已被集团列入【永不录用】黑名单。<br>案底：剽窃游戏攻略、攻击 Mod 作者与难度代码作者。</div>'+
        '<div class="note" style="margin:8px 0;color:var(--amber)">请更换一个体面的代号重新登记。</div>'+
        '<div class="row"><button class="btn pri" id="reg-again" style="width:100%">重新登记</button></div>', true);
      $('#reg-again').onclick = showNameRegistration;
      return;
    }
    S.managerName = name;
    S.flags.nameChosen = true;
    closeModal(true);
    log(name ? ('代号登记完成：从今天起，您就是 '+mgrTitle()+'。欢迎加入 17 号钻台。') : '跳过代号登记。集团将继续称呼您为管理层。', 'gold');
    renderAll(); save();
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  window.__initErr = null;
  try{
  let realtimeSummary = null;
  loadFold();
  BGM.init();   /* 修复：此前 init 从未调用，BGM 默认无声（首次任意点击即响） */
  if(!load()){
    newGame();
    /* 首次进入先选语言、选完再进序章——否则选择器会在首次 renderAll 后顶掉序章弹窗（09-19 实测） */
    if(localStorage.getItem('drg_lang') === null && typeof showLangChooser === 'function'){
      showLangChooser(() => playPrologue());
    } else {
      playPrologue();
    }
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
  /* 老档未选过语言的（序章早已结束，无弹窗可顶）：进游戏后补一次语言选择 */
  if(S.flags.prologueDone && localStorage.getItem('drg_lang') === null && typeof showLangChooser === 'function') showLangChooser();
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
    renderHeader();
    log(L(speed === 0 ? '时间暂停。钻台进入待机。' : '时间继续流动。开始采掘。'), 'sys');
  };
  $('#btn-refresh').onclick = () => { genBoard(); log(TEXT.log_board_refresh, 'sys'); renderAll(); boardBtnSync(); };
  $('#btn-kpi').onclick = claimKPI;
  /* 任务板按钮自适应（C 补丁）：手机≤700px=折叠/展开，桌面端=简洁/详细 */
  const isMobile = () => window.innerWidth <= 700;
  function boardBtnSync(){
    const b = $('#btn-board-compact');
    if(isMobile()){
      b.textContent = FOLD.boardFolded ? L('展开') : L('折叠');
      $('#board').classList.toggle('folded', FOLD.boardFolded);
      $('#boardFoldSummary').classList.toggle('on', FOLD.boardFolded);
      if(FOLD.boardFolded) $('#boardFoldSummary').textContent = L('任务板已折叠 · ')+S.board.length+L(' 个任务，点击展开');
    } else {
      b.textContent = FOLD.boardCompact ? L('详细') : L('简洁');
      $('#board').classList.remove('folded');
      $('#boardFoldSummary').classList.remove('on');
    }
  }
  $('#btn-board-compact').onclick = () => {
    if(isMobile()){ FOLD.boardFolded = !FOLD.boardFolded; saveFold(); boardBtnSync(); return; }
    FOLD.boardCompact = !FOLD.boardCompact; saveFold();
    $('#btn-board-compact').textContent = FOLD.boardCompact ? L('详细') : L('简洁');
    renderBoard();
  };
  $('#boardFoldSummary').onclick = () => { FOLD.boardFolded = false; saveFold(); boardBtnSync(); };
  window.addEventListener('resize', boardBtnSync);
  boardBtnSync();
  /* 底部页签栏停靠：≤700px 或触屏主输入（pointer:coarse，覆盖 iPhone"请求桌面网站"把布局
     撑到 ~980px 的情形）时，把 #tabs 移到 body 直下固定底部；桌面还原原位（事件监听随节点保留） */
  const tabsEl = document.getElementById('tabs');
  const tabsHome = tabsEl.parentElement, tabsNext = tabsEl.nextSibling;
  function dockTabs(){
    const dock = window.matchMedia('(max-width:700px)').matches || window.matchMedia('(pointer:coarse)').matches;
    document.body.classList.toggle('tabs-docked', dock);
    if(dock && tabsEl.parentElement !== document.body) document.body.appendChild(tabsEl);
    else if(!dock && tabsEl.parentElement !== tabsHome) tabsHome.insertBefore(tabsEl, tabsNext);
  }
  dockTabs();
  window.addEventListener('resize', dockTabs);
  window.addEventListener('orientationchange', dockTabs);
  const mqDock7 = window.matchMedia('(max-width:700px)'), mqDockC = window.matchMedia('(pointer:coarse)');
  if(mqDock7.addEventListener) mqDock7.addEventListener('change', dockTabs);
  if(mqDockC.addEventListener) mqDockC.addEventListener('change', dockTabs);
  /* 起名：序章已结束的老档，进游戏时补一次代号登记（新档由 endPrologue 触发） */
  if(S.flags.prologueDone && !S.flags.nameChosen) showNameRegistration();
  $('#btn-log-modal').onclick = showLogModal;
  $('#btn-res-overview').onclick = showResourceOverview;
  $('#logMini').onclick = () => { FOLD.log = false; saveFold(); applyLogFold(); };
  document.querySelectorAll('#tabs .tab').forEach(t=>{
    t.onclick = () => {
      const facKey = {bar:'bar', market:'market', med:'med', gear:'gear'}[t.dataset.tab];
      if(facKey && !facUnlocked(facKey)){
        const f = FACILITIES[facKey];
        const canBuy = S.rigLv>=f.rig && S.campaign.ci > CAMPAIGNS.findIndex(x=>x.id===f.campaign) && S.credits>=f.cost;
        showModal('<h3 style="color:var(--amber)">🔒 '+L(f.name)+'</h3><div class="note" style="margin:10px 0">'+facCondText(facKey)+'</div>'+
          '<button class="btn pri" style="width:100%" id="fac-buy" '+(canBuy?'':'disabled')+'>'+L('重建 · ')+f.cost+L(' 代币')+'</button>'+
          '<button class="btn" style="width:100%;margin-top:4px" onclick="closeModal(true)">'+L('稍后再说')+'</button>', false);
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
  /* PWA：本地 Wrangler 开发必须绕过旧离线包；生产环境继续注册 Service Worker。 */
  const localDev = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
  if ('serviceWorker' in navigator && localDev) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => Promise.all(registrations.map(registration => registration.unregister())));
    if ('caches' in window) {
      caches.keys()
        .then(keys => Promise.all(keys.filter(key => key.startsWith('drg-rig-')).map(key => caches.delete(key))));
    }
  } else if ('serviceWorker' in navigator && location.protocol !== 'file:' && !/MicroMessenger/i.test(navigator.userAgent)) {
    const buildVersion = document.querySelector('meta[name="drg-build-version"]')?.content;
    navigator.serviceWorker.register('sw.js' + (buildVersion ? '?v=' + encodeURIComponent(buildVersion) : ''));
  }
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
    if(S.mode === 'rush' && speed === 0){ speed = 1; renderHeader(); }
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
  if(chipCr) chipCr.onclick = () => showDetail(L('代币'), [
    {label:L('当前存量'), value:fmt(S.credits)},
    {label:L('下季 KPI 奖金'), value:fmt(Math.round(1500 * (S.kpi.term + 1)))},
    {label:L('重复招募折算'), value:'300'+L(' 代币')},
  ]);
  const chipNi = document.getElementById('chip-nitra');
  if(chipNi) chipNi.onclick = () => showDetail(L('硝石'), [
    {label:L('当前存量'), value:fmt(S.nitra)},
    {label:L('每日产出'), value:'+25'},
    {label:L('派遣消耗'), value:'60×'+L('人数×时长系数') + (S.mode === 'rush' ? L('（急行 ×4）') : '')},
    {label:L('集团关怀'), value:(S.credits < 100 && S.nitra < 60) ? L('生效中') : L('未触发')},
  ]);
  /* B-8：音乐开关 */
  const bgmBtn = document.getElementById('btn-bgm');
  if(bgmBtn){
    bgmBtn.textContent = BGM.icon();
    bgmBtn.onclick = () => { BGM.toggleMute(); bgmBtn.textContent = BGM.icon(); };
  }
  const settingsBtn = document.getElementById('btn-settings');
  if(settingsBtn) settingsBtn.onclick = () => {
    const sysTab = document.querySelector('#tabs .tab[data-tab="sys"]');
    if(sysTab) sysTab.click();
    document.querySelector('.roster-panel')?.scrollIntoView({behavior:'smooth', block:'start'});
  };
  const creditsBtn = document.getElementById('btn-credits');
  if(creditsBtn) creditsBtn.onclick = showCredits;
  const renameBtn = document.getElementById('btn-rename');
  if(renameBtn) renameBtn.onclick = showNameRegistration;   /* 起名系统：随时改代号 */
  /* 语言切换按钮：显示目标语言（中文界面显示 EN，英文界面显示 中） */
  const langBtn = document.getElementById('btn-lang');
  if(langBtn){
    langBtn.textContent = (currentLang() === 'en') ? '中' : 'EN';
    langBtn.onclick = () => {
      const next = (currentLang() === 'en') ? 'zh' : 'en';
      langBtn.textContent = (next === 'en') ? '中' : 'EN';
      applyLang(next);
    };
  }
  window.addEventListener('beforeunload', save);
  }catch(initErr){ window.__initErr = (initErr.stack || initErr.message); renderAll(); }
});
