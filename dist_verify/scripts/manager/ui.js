'use strict';
/* ---------------- RENDER ---------------- */
function resName(k){
  return L({credits:'代币', morkite:'墨菱石', moil:'墨菱油', nitra:'硝石', gold:'黄金'}[k] || k);
}
function fmtDur(gm){
  if(gm < 120) return gm+L(' 游戏分钟');
  return (gm/60).toFixed(1)+L(' 游戏小时');
}
/* ---------------- 成就系统（四系统补充设计 §一，40 项） ---------------- */
const ACHIEVEMENTS = [
  /* 入门 8 */
  {id:'ach_dispatch1',  name:'初次派遣',   grp:'入门', rw:{credits:50},  ck:()=>S.stats.missions>=1},
  {id:'ach_scout3',     name:'侦察兵入门', grp:'入门', rw:{credits:50},  ck:()=>S.miners.some(m=>m.cls==='scout'&&m.lv>=3)},
  {id:'ach_drink1',     name:'第一杯酒',   grp:'入门', rw:{credits:30},  ck:()=>(S.stats.barDrinks||0)>=1},
  {id:'ach_star1',      name:'第一颗星',   grp:'入门', rw:{credits:100}, ck:()=>S.miners.some(m=>(m.stars||0)>=1)},
  {id:'ach_mod1',       name:'第一件模组', grp:'入门', rw:{credits:50},  ck:()=>Object.keys(S.modsOwned||{}).some(k=>S.modsOwned[k]>0)},
  {id:'ach_trinket1',   name:'第一颗饰品', grp:'入门', rw:{credits:50},  ck:()=>Object.keys(S.trinkets||{}).length>=1},
  {id:'ach_ch7',        name:'编年史开篇', grp:'入门', rw:{credits:50},  ck:()=>gameDay()>=7},
  {id:'ach_wiperescue', name:'团灭初体验', grp:'入门', rw:{credits:100}, ck:()=>!!S.flags.wipeRescued},
  /* 进阶 10 */
  {id:'ach_4cls',       name:'满编作战',   grp:'进阶', rw:{credits:200}, ck:()=>Object.keys(CLASSES).every(c=>S.miners.some(m=>m.cls===c))},
  {id:'ach_hz5',        name:'危5首通',    grp:'进阶', rw:{credits:200}, rare:20, ck:()=>!!S.flags.hz5Done},
  {id:'ach_diven',      name:'深潜首通',   grp:'进阶', rw:{blank:2},     ck:()=>!!(S.dive&&S.dive.normal&&S.dive.normal.done)},
  {id:'ach_divee',      name:'精英首通',   grp:'进阶', rw:{blank:2, merit:5}, ck:()=>!!(S.dive&&S.dive.elite&&S.dive.elite.done)},
  {id:'ach_missions10', name:'十连派遣',   grp:'进阶', rw:{credits:100}, ck:()=>S.stats.missions>=10},
  {id:'ach_mod10',      name:'模组收藏家', grp:'进阶', rw:{credits:100}, ck:()=>Object.keys(S.modsOwned||{}).filter(k=>S.modsOwned[k]>0).length>=10},
  {id:'ach_trinket10',  name:'饰品鉴赏家', grp:'进阶', rw:{credits:100}, ck:()=>Object.keys(S.trinkets||{}).length>=10},
  {id:'ach_bar20',      name:'酒保常客',   grp:'进阶', rw:{credits:100}, ck:()=>(S.stats.barDrinks||0)>=20},
  {id:'ach_ch100',      name:'编年史百日', grp:'进阶', rw:{credits:200}, ck:()=>gameDay()>=100},
  {id:'ach_cat5',       name:'猫的好朋友', grp:'进阶', rw:{credits:150}, ck:()=>(S.flags.catPet||0)>=5 && (S.catGrudge||0)===0},
  /* 精通 10 */
  {id:'ach_weapon5',    name:'武器大师',   grp:'精通', rw:{credits:300}, rare:20, ck:()=>Object.values(S.wlv||{}).some(pools=>Object.values(pools).some(v=>v>=5))},
  {id:'ach_modt1',      name:'模组毕业',   grp:'精通', rw:{credits:300}, ck:()=>['scout','engineer','gunner','driller'].some(cls=>{ const a=equippedModFor(cls), b=equippedOffModFor(cls); return [a,b].some(id=>id && MOD_INDEX[id] && MOD_INDEX[id].tier==='T1'); })},
  {id:'ach_rig10',      name:'平台全满',   grp:'精通', rw:{merit:10},    ck:()=>S.rigLv>=10},
  {id:'ach_ch120',      name:'编年史双百', grp:'精通', rw:{credits:300}, ck:()=>gameDay()>=120},
  {id:'ach_fest4',      name:'节日全制霸', grp:'精通', rw:{credits:500}, ck:()=>{ const ids=(S.holidayDone&&Object.keys(S.holidayDone)||[]).map(k=>k.split('-')[0]); return new Set(ids).size>=4; }},
  {id:'ach_trade5000',  name:'交易大亨',   grp:'精通', rw:{credits:300}, ck:()=>(S.stats.tradeProfit||0)>=5000},
  {id:'ach_cat10',      name:'猫的知己',   grp:'精通', rw:{credits:300}, ck:()=>(S.flags.catPet||0)>=10 && (S.catGrudge||0)===0},
  {id:'ach_streak10',   name:'零伤亡十连', grp:'精通', rw:{credits:500}, ck:()=>(S.flags.streak||0)>=10},
  {id:'ach_rich10000',  name:'富甲一方',   grp:'精通', rw:{credits:200}, ck:()=>S.credits>=10000},
  {id:'ach_lv25',       name:'满级矿工',   grp:'精通', rw:{credits:500}, ck:()=>S.miners.some(m=>m.lv>=25)},
  /* 大师 8 */
  {id:'ach_ch2316',     name:'编年史·完',  grp:'大师', rw:{credits:1000, merit:10}, ck:()=>gameDay()>=2316},
  {id:'ach_weapon24',   name:'武器全满',   grp:'大师', rw:{credits:1000}, ck:()=>allWeaponsMax()},
  {id:'ach_modall',     name:'模组全图鉴', grp:'大师', rw:{merit:50},    ck:()=>Object.keys(S.modsOwned||{}).filter(k=>S.modsOwned[k]>0).length>=99},
  {id:'ach_trinketall', name:'饰品全图鉴', grp:'大师', rw:{merit:30},    ck:()=>Object.keys(S.trinkets||{}).length >= (typeof TRINKETS!=='undefined' ? TRINKETS.pool.length : 24)},
  {id:'ach_elite5',     name:'精英全员',   grp:'大师', rw:{merit:20},    ck:()=>(S.elite.owned||[]).length >= ELITE_UNITS.units.length},
  {id:'ach_diveboth',   name:'深潜双通',   grp:'大师', rw:{blank:5},     ck:()=>!!(S.dive.normal.done && S.dive.elite.done)},
  {id:'ach_streak50',   name:'无伤五十连', grp:'大师', rw:{credits:800}, ck:()=>(S.flags.streak||0)>=50},
  {id:'ach_idle24',     name:'挂机大师',   grp:'大师', rw:{credits:500}, ck:()=>(S.stats.idleSecs||0)>=86400},
  /* 隐藏 4 */
  {id:'ach_karl3',      name:'卡尔的遗产', grp:'隐藏', rw:{credits:500, merit:10}, ck:()=>(S.flags.karlCount||0)>=3},
  {id:'ach_v50',        name:'v他50',grp:'隐藏', rw:{credits:50},  ck:()=>!!S.flags.lcyf166_bless},
  {id:'ach_blackout',   name:'断片初体验', grp:'隐藏', rw:{credits:100}, ck:()=>!!S.flags.blackoutDrunk},
  {id:'ach_mystery',    name:'神秘莫测',   grp:'隐藏', rw:{credits:150}, ck:()=>!!S.flags.mysteryDrunk},
];
function facUnlocked(key){ return !!(S.unlocked && S.unlocked[key]); }
function facCondText(key){
  const f = FACILITIES[key]; if(!f) return '';
  const conds = [];
  conds.push(TEXT.un_need_rig.replace('{n}', f.rig));
  const ci = CAMPAIGNS.findIndex(x => x.id === f.campaign);
  if(ci >= 0){
    const done = S.campaign.ci > ci;
    conds.push(done ? '✅ ' + L(CAMPAIGNS[ci].name) : TEXT.un_need_campaign.replace('{name}', L(CAMPAIGNS[ci].name)));
  }
  if(f.cost > 0) conds.push(S.credits >= f.cost ? TEXT.un_buy_btn.replace('{cost}', f.cost) : TEXT.un_need_credits.replace('{n}', f.cost - S.credits));
  return conds.join('　');
}
function tryUnlockFacility(key){
  const f = FACILITIES[key]; if(!f) return false;
  if(S.rigLv < f.rig) return false;
  const ci = CAMPAIGNS.findIndex(x => x.id === f.campaign);
  if(ci >= 0 && S.campaign.ci <= ci) return false;
  if(S.credits < f.cost) return false;
  S.credits -= f.cost;
  S.unlocked[key] = true;
  const gifts = [];
  if(key === 'market'){ RARES.forEach(rr => S.rare[rr] = (S.rare[rr]||0) + 10); gifts.push(TEXT.un_market_gift); }
  if(f.gift === 'karl_gear'){ S.blanks = (S.blanks||0) + 1; S.flags.karlCount = (S.flags.karlCount||0) + 1; gifts.push(TEXT.karl_gear_clue); }
  if(f.gift === 'karl_bar'){ S.flags.karlCount = (S.flags.karlCount||0) + 1; gifts.push(TEXT.karl_bar_clue); }
  log(L('【') + L(f.name) + L('】解锁！') + gifts.join(' '), 'gold');
  return true;
}

function allWeaponsMax(){
  return Object.keys(WEAPON_SET).every(cls => WEAPON_SET[cls].main.concat(WEAPON_SET[cls].off).every(wid => ((S.wlv[cls]||{})[wid]||0) >= 5));
}
function checkAchievements(){
  if(!S || !S.stats) return;
  if(!S.achievements) S.achievements = {};
  ACHIEVEMENTS.forEach(a=>{
    if(S.achievements[a.id]) return;
    let ok = false;
    try{ ok = a.ck(); }catch(e){ return; }
    if(ok){
      S.achievements[a.id] = true;
      const parts = [];
      const rw = a.rw || {};
      if(rw.credits){ S.credits += rw.credits; parts.push(L('代币')+'+'+rw.credits); }
      if(rw.rare){ RARES.forEach(rr => S.rare[rr] = (S.rare[rr]||0) + rw.rare); parts.push(L('稀有矿物全族')+'+'+rw.rare); }
      if(rw.blank){ S.blanks = (S.blanks||0) + rw.blank; parts.push(L('空白模组')+'+'+rw.blank); }
      if(rw.merit){ S.merit = (S.merit||0) + rw.merit; parts.push(L('功绩点')+'+'+rw.merit); }
      log(L('🏆 成就达成【')+L(a.name)+L('】')+(parts.length ? L('（')+parts.join(L('，'))+L('）') : ''), 'gold');
    }
  });
}

function renderHeader(){
  const spdChip = document.getElementById('spd-chip');
  if(spdChip) spdChip.style.display = (S.mode === 'rush') ? 'none' : '';
  const pauseBtnSync = document.getElementById('btn-pause');
  if(pauseBtnSync){
    const want = speed === 0
      ? '<span class="play-glyph" aria-hidden="true"></span><b>'+L('继续')+'</b>'
      : '<span class="pause-glyph" aria-hidden="true"></span><b>'+L('暂停')+'</b>';
    if(pauseBtnSync.innerHTML !== want) pauseBtnSync.innerHTML = want;
  }
  const modeChip = document.getElementById('mode-chip');
  if(modeChip){
    const rush = S.mode === 'rush';
    modeChip.classList.toggle('rush', rush);
    const ml = modeChip.querySelector('.mlabel');
    if(ml) ml.textContent = rush ? TEXT.dm_mode_rush : TEXT.dm_mode_idle;
    modeChip.style.borderColor = rush ? 'var(--amber)' : '';
  }
  const autoChip = document.getElementById('auto-chip');
  if(autoChip){
    const autoOn = S.autoUntil && Date.now() < S.autoUntil;
    autoChip.style.display = autoOn ? 'flex' : 'none';
    if(autoOn){
      const leftMin = Math.ceil((S.autoUntil - Date.now()) / 60000);
      document.getElementById('auto-left').textContent = leftMin >= 60 ? (leftMin/60).toFixed(1)+'h' : leftMin+L('分');
    }
  }
  $('#r-credits').textContent = fmt(S.credits);
  $('#r-nitra').textContent = fmt(S.nitra);
  const clockParts = clockStr().split(' ');
  $('#clock').textContent = clockParts[0] || 'D1';
  const timeEl = document.getElementById('clock-time');
  if(timeEl) timeEl.textContent = clockParts[1] || '08:00';
  const dateEl = document.getElementById('clock-date');
  if(dateEl){
    const week = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'].map(L);
    const gameDate = dayToDate(gameDay());
    dateEl.textContent = dateOfStr(gameDay()) + '　' + week[gameDate.getUTCDay()];
  }
  const pct = clamp(S.kpi.done/S.kpi.quota*100, 0, 100);
  const claimable = S.kpi.done >= S.kpi.quota;
  const termEl = document.getElementById('kpi-term');
  if(termEl) termEl.textContent = (currentLang() === 'en') ? 'Q'+S.kpi.term : '第'+S.kpi.term+'季';
  $('#kpi-txt').textContent = fmt(S.kpi.done)+' / '+fmt(S.kpi.quota);
  $('#kpi-bar').style.width = pct+'%';
  $('#btn-kpi').style.display = claimable ? 'inline-block' : 'none';
  const ra = document.getElementById('rares');
  const rareChips = RARES.map(r =>
    '<span class="chip">' + ic('res_' + MKEY[r]) + '<span>' + L(r) + '</span><b>' + fmt(S.rare[r]) + '</b></span>').join('');
  ra.innerHTML = '<div class="rare-label"><span>'+L('稀有矿物')+'</span><small>RESOURCE</small></div>'+
    '<div class="rare-list">'+rareChips+
    '<span class="chip"><img src="assets/trinkets/mod_blank.png" alt=""><span>'+L('空白模组')+'</span><b>'+fmt(S.blanks||0)+'</b></span></div>'+
    '<span class="rare-tip">'+L('这些珍贵的资源，是人类迈向深空的基石。')+'</span>';
}
function renderBoard(){
  if(window.innerWidth <= 700 && FOLD.boardFolded && S.miners.some(m => m.state === 'idle')){
    FOLD.boardFolded = false;
    const bd = $('#board'); if(bd) bd.classList.remove('folded');
    const sum = $('#boardFoldSummary'); if(sum) sum.classList.remove('on');
    const btn = $('#btn-board-compact'); if(btn) btn.textContent = L('折叠');
  }
  const missionDescriptions = {
    exp:'探索水晶洞穴，开采矿脉资源。',
    point:'在指定区域建立临时开采点。',
    refi:'铺设管线并提炼地下墨菱油。',
    escort:'护送钻探设备深入岩层核心。',
    salv:'回收失联小队与遗留设备。',
    elim:'定位巢穴并清除高危目标。',
  };
  let html = '';
  if(S.board.some(x=>x.kind==='prologue')){
    html += '<div class="mcard compact-card" style="border-color:var(--gold)">'+
      '<span class="nm" style="flex:1">'+TEXT.st_mission_name+' <span class="note">'+TEXT.st_mission_tag+'</span></span>'+
      '<button class="btn pri" id="btn-karl-dispatch">'+L('派遣卡尔')+'</button></div>';
  }
  if(!S.board.length){
    html = '<div class="board-empty"><img src="assets/img/w_pickaxe.png" alt="矿镐"><strong>'+TEXT.ui_mission_empty+'</strong></div>';
  }
  if(S.campaign && CAMPAIGNS[S.campaign.ci]){
    const cst = CAMPAIGNS[S.campaign.ci].steps[S.campaign.si];
    if(cst && cst.type === 'mission'){
      const mtG2 = mtypeById(cst.target);
      if(mtG2 && mtG2.rig > S.rigLv){
        html += '<div class="mcard compact-card" style="border-color:var(--amber)"><span class="meta">'+L('战役需要「')+L(mtG2.name)+L('」，请先将钻井平台升级至 Lv.')+mtG2.rig+L('。')+'</span></div>';
      }
    }
  }
  S.board.forEach(m=>{
    if(m.kind === 'prologue') return;
    const b = biomeById(m.biome), t = mtypeById(m.type);
    if(FOLD.boardCompact){
      html += '<div class="mcard compact-card">'+
        '<span class="nm" style="flex:1">'+t.name+' · '+b.name+' <span class="hz">'+'★'.repeat(m.hazard)+'</span>'+
        (m.clause?' <span class="note">'+L('【')+L(m.clause.name)+L('】')+'</span>':'')+'</span>'+
        ((m.type==='exp'||m.type==='escort')?'<button class="btn live" data-live="'+m.id+'">'+(m.type==='escort'?L('实时护送'):L('实时下矿'))+'</button>':'')+
        '<button class="btn pri" data-disp="'+m.id+'">'+L('派遣小队')+'</button></div>';
      return;
    }
    const rewards = Object.entries(m.r).map(([k,v])=>
      '<span class="yield-item">'+resIcon(k)+'<span>×'+v+'</span></span>').join('');
    html += '<article class="mcard mission-card">'+
      '<div class="mission-cover">'+
        '<img src="assets/icons/missions/'+(MIS_BANNER[m.type]||('mis_'+m.type))+'.png" alt="">'+
        '<span class="hazard-chip">'+L('危险等级 ')+m.hazard+'</span></div>'+
      '<div class="mission-copy">'+
        '<div class="t"><span class="nm">'+t.name+'</span><span class="mission-biome">'+b.name+'</span></div>'+
        '<div class="mission-description">'+L(missionDescriptions[m.type]||'执行集团指派的深层采掘任务。')+'</div>'+
        '<div class="meta"><span class="yield-label">'+L('预计产出：')+'</span>'+rewards+
          '<span class="detail-toggle" data-detbtn>'+L('详情 ›')+'</span></div>'+
        '<div class="det" style="display:none">'+L('深度档 ')+b.tier+L(' · 建议职业：')+
          (t.best?(CLASSES[t.best]?L(CLASSES[t.best].name):L(t.best)):L('任意'))+
          (m.clause?' · '+L(m.clause.name)+L('：')+L(m.clause.d):'')+'</div>'+
        '<div class="mission-actions"><button class="btn pri" data-disp="'+m.id+'">'+L('派遣小队')+'</button>'+
          ((m.type==='exp'||m.type==='escort')?'<button class="btn live" data-live="'+m.id+'">'+(m.type==='escort'?L('实时护送'):L('实时下矿'))+'</button>':'')+
        '</div></div></article>';
  });
  $('#board').innerHTML = html;
  const kb = $('#btn-karl-dispatch');
  if(kb) kb.onclick = () => {
    if(S.deps.some(d=>d.kind==='prologue')) return;
    const km = S.board.find(x=>x.kind==='prologue'); if(!km) return;
    S.board = S.board.filter(x=>x!==km);
    S.deps.push({id:'karl'+Date.now().toString(36), mid:km.id, m:{type:'exp', biome:km.biome, hazard:5, r:{}},
      cls:'mixed', fitN:0, hc:1, minerIds:[], modEff:{}, drinkShield:0, morkiteBuff:1,
      start:S.gm, dur:240, done:0, evt1:false, evt2:false, paused:null, bonus:1, mode:'idle',
      kind:'prologue', karlEventFired:false});
    log(L('卡尔背起行囊：「帮我把遗单清了，管理层。」——他一个人走进了电梯。'), '');
    renderAll(); save();
  };
  $('#board').querySelectorAll('[data-detbtn]').forEach(el=>{
    el.onclick = () => {
      const det = el.closest('.mcard').querySelector('.det');
      if(det){ det.style.display = det.style.display==='none' ? 'block' : 'none'; el.textContent = det.style.display==='none' ? L('详情 ›') : L('收起 ⌃'); }
    };
  });
  $('#board').querySelectorAll('[data-disp]').forEach(el=>{
    el.onclick = () => openDispatch(el.dataset.disp);
  });
  $('#board').querySelectorAll('[data-live]').forEach(el=>{
    el.onclick = () => openRealtime(el.dataset.live);
  });
}
function renderDeps(){
  let html = '';
  if(S.realtime){
    const p = S.realtime, m = p.mission, miner = S.miners.find(x=>x.id===p.minerId);
    html += '<div class="dep realtime"><div class="t"><span class="nm">'+L('实时任务 · ')+L(biomeById(m.biome))+'</span>'+
      '<span class="hz">'+'★'.repeat(m.hazard)+'</span></div>'+
      '<div class="meta">'+(miner?minerName(miner):L('矿工'))+L(' 正在等待你的直接指挥')+'</div>'+
      '<div class="mission-actions"><button class="btn live" data-rt-resume>'+L('继续任务')+'</button>'+
      '<button class="btn warn" data-rt-recall>'+L('召回')+'</button></div></div>';
  }
  if(!S.deps.length && !S.realtime){
    html = '<div class="dispatch-empty"><div class="dispatch-holo-wrap"><img class="dispatch-holo" src="assets/img/w_pickaxe.png" alt="矿镐"></div>'+
      '<strong>'+L('当前没有进行中的派遣任务')+'</strong>'+
      '<p>'+L('派遣矿工前往未知的深处，挖掘属于集团的财富。')+'</p>'+
      '<button class="btn pri" data-select-mission>'+L('选择任务并派遣')+'</button></div>';
  }
  const depsSorted = S.deps.slice().sort((a,b)=>(b.paused?1:0)-(a.paused?1:0));
  depsSorted.forEach(d=>{
    const done = clamp(d.done || 0, 0, d.dur);
    const pct = clamp(done/d.dur*100, 0, 100).toFixed(1);
    const team = d.minerIds.map(id=>minerName(S.miners.find(x=>x.id===id))).join('、');
    const remainTxt = d.paused ? L('待管理层决策') : fmtDur(Math.ceil(Math.max(0, d.dur-done)));
    const cls0 = d.minerIds.length ? ((S.miners.find(x=>x.id===d.minerIds[0])||{}).cls || 'scout') : 'scout';
    /* 矿道矿脉点位：按任务 id 播种，同一任务稳定、不同任务错落（硝/金交替嵌在未挖掘岩壁里，挖到即消失） */
    let hs = 0; for(let j=0;j<d.id.length;j++) hs = (hs*31 + d.id.charCodeAt(j))>>>0;
    const mPos = [12+hs%16, 34+(hs>>>4)%18, 58+(hs>>>8)%16, 82+(hs>>>12)%14];
    html += '<div class="dep'+(d.paused?' evt':'')+'" data-dep="'+d.id+'" data-biome="'+d.m.biome+'">'+
      '<div class="t"><span class="nm">'+mtypeById(d.m.type).name+' · '+biomeById(d.m.biome).name+'</span>'+
      '<span class="hz">'+'★'.repeat(d.m.hazard)+'</span></div>'+
      '<div class="meta">'+team+L('　剩余 ')+remainTxt+'</div>'+
      '<div class="prog" style="--m1:'+mPos[0]+'%;--m2:'+mPos[1]+'%;--m3:'+mPos[2]+'%;--m4:'+mPos[3]+'%"><i style="width:'+pct+'%"></i>'+
      '<span class="digger anim-spr" data-anim="dwarf_'+cls0+'_dig" style="left:'+pct+'%;width:24px;height:24px;"></span></div>'+
      /* 实时介入（用户 09-19 拍板）：挂机中的采矿探险/执勤护送随时亲自下场 */
      ((d.m.type==='exp'||d.m.type==='escort') && !d.paused ? '<div style="margin-top:5px"><button class="btn live" data-rt-dep="'+d.id+'" style="width:100%">⚡ 实时介入 · 亲自下场</button></div>':'')+
      (d.paused?'<div class="evtbox"><div class="q">'+TEXT.ui_deps_event+'</div><button class="btn warn" data-ev="'+d.id+'">'+TEXT.ui_deps_event_btn+'</button></div>':'')+
      '</div>';
  });
  $('#deps').innerHTML = html;
  $('#deps').querySelectorAll('[data-rt-dep]').forEach(el=>{
    el.onclick = () => interveneRealtime(el.dataset.rtDep);
  });
  const selectMission = $('#deps').querySelector('[data-select-mission]');
  if(selectMission) selectMission.onclick = () => {
    let missions = S.board.filter(m => m && m.type);
    if(!missions.length){
      genBoard();
      renderBoard();
      missions = S.board.filter(m => m && m.type);
    }
    if(!missions.length) return;
    const choices = missions.map(m => {
      const biome = biomeById(m.biome);
      const type = mtypeById(m.type);
      return '<button class="btn opt mission-select-option" data-select-dispatch="'+m.id+'">'+
        '<b>'+L(type)+'</b><span>'+L(biome)+L(' · 危险等级 ')+m.hazard+'</span></button>';
    }).join('');
    showModal('<h3 class="mission-select-title">'+L('选择派遣任务')+'</h3>'+
      '<p class="note">'+L('选择任务后继续配置矿工与补给。')+'</p>'+
      '<div class="mission-select-list">'+choices+'</div>', false);
    $('#modal-box').querySelectorAll('[data-select-dispatch]').forEach(option => {
      option.onclick = () => {
        const missionId = option.dataset.selectDispatch;
        closeModal(true);
        openDispatch(missionId);
      };
    });
  };
  $('#deps').querySelectorAll('[data-ev]').forEach(el=>{
    el.onclick = () => { const d = S.deps.find(x=>x.id===el.dataset.ev); if(d) showEventModal(d); };
  });
  const resume = $('#deps').querySelector('[data-rt-resume]');
  if(resume) resume.onclick = openRealtimeGame;
  const recall = $('#deps').querySelector('[data-rt-recall]');
  if(recall) recall.onclick = showPendingRealtime;
}
function renderRoster(){
  const roleEnglish = {scout:'SCOUT', engineer:'ENGINEER', gunner:'GUNNER', driller:'DRILLER'};
  let html = '';
  Object.keys(CLASSES).forEach(c=>{
    const C = CLASSES[c];
    const hired = S.miners.some(m=>m.cls===c);
    const rigOk = S.rigLv >= C.rig;
    html += '<section class="roster-unit">'+
      '<div class="roster-title role-'+c+'">'+ic('class_'+c)+
      '<div class="role-copy"><strong>'+C.name+'</strong><small>'+roleEnglish[c]+'</small></div>'+
      '<span class="roster-level">Lv.'+S.licenses[c]+'</span></div>';
    if(!hired){
      html += '<div class="miner locked-card"><div class="locked-avatar"></div>'+
        '<div class="locked-copy"><b>'+L('未解锁')+'</b><span>'+L('建议先升级钻井平台以招募该职业。')+'</span></div>'+
        (rigOk ? '<button class="btn pri" data-recruit="'+c+'">'+L('招募 · ')+hireCost()+'</button>' : '')+
        '</div></section>';
      return;
    }
    S.miners.filter(m=>m.cls===c).forEach(m=>{
      const st = m.state==='idle' ? '<span class="miner-status st-idle">'+L('空闲')+'</span>'
               : m.state==='mission' ? '<span class="miner-status st-mission">'+L('任务中')+'</span>'
               : '<span class="miner-status st-med">'+L('医疗中')+'</span>';
      const promo = (m.lv >= 25 && m.state==='idle')
        ? '<button class="btn pri" data-promo="'+m.id+'">'+L('晋升')+'</button>' : '';
      html += '<div class="miner"><div class="roster-member">'+avatarHtml(m.cls, m.state)+
        '<div class="miner-info" data-minfo="'+m.id+'">'+
          '<div class="miner-name-line">'+frameHtml(m.stars)+'<b>'+minerName(m)+'</b>'+st+'</div>'+
          '<div class="miner-meta">Lv.'+(m.lv>=25?'25 MAX':m.lv)+' · '+L(C.w[S.licenses[c]-1])+' · '+L('任务 ')+m.missions+'</div>'+
          '<div class="morale-line"><span>'+L('士气')+'</span><span class="mbar"><i data-mid="'+m.id+'" style="width:'+m.morale+'%;background:'+
            (m.morale>=60?'var(--green)':m.morale>=30?'var(--amber)':'var(--red)')+'"></i></span><span class="note">'+Math.floor(m.morale)+'/100</span></div>'+
        '</div><div class="kit-slots" aria-hidden="true"><span class="kit-slot">PRI</span><span class="kit-slot">SEC</span><span class="kit-slot">KIT</span></div>'+
        promo+'<span class="roster-chevron">›</span></div></div>';
    });
    html += '</section>';
  });
  html += '<div class="roster-note">'+L('士气低于 25 时矿工会拒绝下矿；25 级可申请晋升。')+'</div>';
  $('#side').innerHTML = html;
  $('#side').querySelectorAll('[data-promo]').forEach(el=>{
    el.onclick = () => promoteMiner(el.dataset.promo);
  });
  $('#side').querySelectorAll('[data-minfo]').forEach(el=>{
    el.onclick = () => { const mm = S.miners.find(x=>x.id===el.dataset.minfo); if(mm) minerDetail(mm); };
  });
  $('#side').querySelectorAll('[data-recruit]').forEach(el=>{
    el.onclick = () => recruit(el.dataset.recruit);
  });
}
function renderGear(){
  let html = '<div class="row"><button class="btn" onclick="showWarehouse()">'+L('📦 仓库')+'</button><span class="note" style="flex:1">'+L('模组、饰品与空白模组的总仓库。')+'</span></div>'+
    '<div class="note" data-gearfold style="cursor:pointer;color:var(--teal)">'+L('▸ 携带规则与升级详情')+'</div><div data-gearrule style="display:none"><div class="note">'+L('每职业 3 级，每把武器 1 个模组槽。抽到重复模组自动折算 30% 造价的代币。')+'</div></div>';
  /* 精英支援位（B-6）：功绩点购买 + 随队选择 */
  if(S.rigLv >= ELITE_UNITS.unlockRig){
    html += '<h3 class="sec">'+L('复拓者 · 精英支援位')+L('（功绩点 ')+S.merit+L('）')+'</h3>';
    ELITE_UNITS.units.forEach(u => {
      const owned = (S.elite.owned||[]).includes(u.id);
      const carried = S.elite.carry === u.id;
      if(owned){
        html += '<div class="row"><span style="flex:1"><b style="color:var(--teal)">'+L(u)+'</b> <span class="note">'+L(u.desc)+'</span></span>'+
          '<button class="btn '+(carried?'warn':'pri')+'" data-carry="'+u.id+'">'+(carried?L('召回'):TEXT.el_ui_btn_carry)+'</button></div>';
      } else {
        html += '<div class="row"><span style="flex:1">🔒 <b>'+L(u)+'</b> <span class="note">'+L(u.desc)+L('｜')+u.price+L(' 功绩点')+'</span></span>'+
          '<button class="btn" data-hire-elite="'+u.id+'" '+(S.merit >= u.price ? '' : 'disabled')+'>'+TEXT.el_ui_btn_hire+'</button></div>';
      }
    });
    html += '<div class="note">'+L('功绩点来源：深潜（每周最多 10）+ 季度 KPI +5 + 危5 任务 +1 + 精英虫 +1。空闲精英每游戏日收集 1 个匠器（下阶段开放）。')+'</div>';
  } else {
    html += '<div class="note">'+TEXT.el_ui_locked.replace('Lv10', 'Lv10（当前 Lv.'+S.rigLv+'）')+'</div>';
  }
  /* 饰品（B-5）：全队佩戴 */
  html += '<h3 class="sec">'+TEXT.tr_ui_title+'</h3><div class="note">'+TEXT.tr_ui_sub+'</div>';
  const eqTr = equippedTrinket();
  html += eqTr ? '<div class="row"><span style="flex:1"><img src="assets/trinkets/'+eqTr.id+'.png" style="width:28px;image-rendering:pixelated;vertical-align:middle"> '+L('已佩戴：')+L(eqTr)+L('（')+effectText(eqTr.effect||{})+L('）')+'</span>'+
    '<button class="btn" id="btn-uneq-tr">'+TEXT.tr_ui_btn_unequip+'</button></div>'
    : '<div class="note">'+TEXT.tr_lock_hint+'</div>';
  const ownedTr = Object.keys(S.trinkets||{});
  if(ownedTr.length){
    ownedTr.forEach(id => {
      if(S.trinketEq === id) return;
      const t = TRINKET_INDEX[id];
      if(!t) return;
      html += '<div class="row"><span style="flex:1"><img src="assets/trinkets/'+t.id+'.png" style="width:28px;image-rendering:pixelated;vertical-align:middle"> ['+L(t)+L('｜')+L(t.desc)+']'+
        ((S.trinkets[id]||0)>1?' <span class="note">×'+S.trinkets[id]+'</span>':'')+'</span>'+
        '<button class="btn" data-eq-tr="'+id+'">'+TEXT.tr_ui_btn_equip+'</button></div>';
    });
  } else if(!eqTr) {
    html += '<div class="note">'+L('来源见帮助页。')+'</div>';
  }
  /* 锻造台：空白模组抽卡 */
  html += '<h3 class="sec">'+L('锻造台 · 模组抽卡')+'</h3><div class="wrow">'+
    '<div class="wcell epic">'+animDiv('forge_card_flip', 36, 50)+'</div>'+
    '<div style="flex:1;min-width:0;"><b style="color:var(--amber)">'+L('空白模组 ')+(S.blanks||0)+L(' 个')+'</b> <span class="tag">'+L('3 选 1')+'</span>'+
    '<div class="note">'+L('✦ 三提石任务获取 · 重复自动折 30%')+'</div></div>'+
    '<button class="btn pri" id="btn-draw" style="flex:none" '+((S.blanks||0) >= 1 ? '' : 'disabled')+'>'+L('抽卡')+'</button></div>';
  /* 仓库模组清单文字墙已删（用户 09-15 拍板）：模组一览去📦仓库看 */
  Object.keys(CLASSES).forEach(c=>{
    ensureWeaponV2();
    const t = S.licenses[c], c2 = licenseCost(c);
    html += '<h3 class="sec">'+L(CLASSES[c].name)+L(' · ')+L('凭证')+' Lv.'+t+'/3'+L('（两池前 ')+t+L(' 把已解锁）')+'</h3>';
    /* 武器携带 v2：主手池 / 副手池 双列 */
    [['main','主手池'],['off','副手池']].forEach(pair => {
      const pool = pair[0], ptxt = pair[1];
      html += '<div class="row" style="font-weight:bold;color:var(--teal);">'+L(ptxt)+'</div>';
      WEAPON_SET[c][pool].forEach((wid,i)=>{
        const unlocked = i < t;
        const carrying = S.slot[c][pool] === i;
        const lv = S.wlv[c][wid]||0;
        const uc = weaponUpCost(c, lv);
        const canUp = unlocked && lv<5 && S.credits>=uc.c && S.rare[uc.m1]>=uc.q1 && S.rare[uc.m2]>=uc.q2;
        const costChips = (unlocked && lv<5) ? '<div class="row" style="margin:3px 0 0;">'+costHtml(uc)+(S.credits<uc.c?'<span class="note">'+L('（代币不足）')+'</span>':'')+'</div>' : '';
        const tagCarry = carrying ? '<span class="tag tag-carry">'+(pool==='main'?L('携带中'):L('副手携带中'))+'</span>' : '';
        const lvTag = unlocked ? ' <span class="note">Lv.'+lv+'/5</span>' : '';
        if(!unlocked){
          html += '<div class="wrow locked"><img class="wicon2" src="'+WICONS[c][pool][i]+'">'+
            '<div style="flex:1;min-width:0;">🔒 '+weaponZh(wid)+' <span class="note">'+L('凭证 Lv.')+(i+1)+L(' 解锁')+'</span></div></div>';
        } else {
          html += '<div class="wrow"><img class="wicon2" src="'+WICONS[c][pool][i]+'">'+
            '<div style="flex:1;min-width:0;">'+
              '<div><b'+(carrying?' style="color:var(--amber)"':'')+'>'+weaponZh(wid)+'</b> '+tagCarry+lvTag+
              (lv>=5?' <span class="tag">'+L('满级')+'</span>':'')+'</div>'+costChips+
            '</div>'+
            '<div style="flex:none;display:flex;flex-direction:column;gap:4px;">'+
              (carrying ? '' : '<button class="btn" data-carryw="'+c+':'+pool+':'+i+'">'+L('携带')+'</button>')+
              (lv<5 ? '<button class="btn'+(canUp?' pri':'')+'" data-wup="'+c+':'+pool+':'+i+'" '+(canUp?'':'disabled')+'>'+(canUp?L('升级'):L('缺料'))+'</button>' : '')+
            '</div></div>';
        }
        const modPool = WEAPON_MODS[c] && WEAPON_MODS[c][wid];
        if(unlocked && modPool){
          const ownedForW = Object.keys(S.modsOwned||{}).filter(id => MOD_INDEX[id] && MOD_INDEX[id].weaponId===wid);
          const eqId = pool==='main' ? (S.equipped||{})[c] : (S.equippedOff||{})[c];
          const eqMod = eqId && MOD_INDEX[eqId] && MOD_INDEX[eqId].weaponId === wid ? MOD_INDEX[eqId] : null;
          if(eqMod) html += '<div class="row"><span style="flex:1">　'+L('已装配：')+L(eqMod)+L('（')+effectText(eqMod.effect)+L('）')+'</span><button class="btn" data-unequip2="'+c+':'+pool+'">'+L('卸下')+'</button></div>';
          if(!eqMod && !ownedForW.length) html += '<div class="row"><span class="note" style="flex:1">　'+L('模组：暂未抽到该武器的模组——锻造台全池抽卡随机产出。')+'</span></div>';
          ownedForW.forEach(id => {
            if(eqId === id) return;
            const mod = MOD_INDEX[id];
            html += '<div class="row"><span style="flex:1">　['+L(mod)+L('｜')+L({clean:'无瑕',balanced:'均衡',unstable:'不稳定'}[mod.rarity])+L('｜')+mod.tier+']</span>'+
              '<button class="btn" data-equip2="'+c+':'+pool+':'+id+'">'+L('装备')+'</button></div>';
          });
        }
      });
    });
    if(c2){
      html += '<div class="row"><span style="flex:1">'+L('凭证升级至 ')+'Lv.'+(t+1)+L('：')+L(c2.m1)+'×'+c2.q1+' + '+L(c2.m2)+'×'+c2.q2+' + '+c2.c+L(' 代币')+L('（')+L('两池各解锁下一把')+L('）')+'</span>'+
        '<button class="btn" data-lic="'+c+'" '+(S.credits>=c2.c && S.rare[c2.m1]>=c2.q1 && S.rare[c2.m2]>=c2.q2?'':'disabled')+'>'+L('升级')+'</button></div>';
    } else html += '<div class="note">'+L('已达最高凭证。')+'</div>';
  });
  $('#side').innerHTML = html;
  $('#side').querySelectorAll('[data-lic]').forEach(el=>{ el.onclick = () => buyLicense(el.dataset.lic); });
  $('#side').querySelectorAll('[data-wup]').forEach(el=>{
    el.onclick = () => { const [cls, pool, idx] = el.dataset.wup.split(':'); buyWeaponUpgrade(cls, pool, parseInt(idx)); };
  });
  $('#side').querySelectorAll('[data-carryw]').forEach(el=>{
    el.onclick = () => {
      const [cls, pool, idx] = el.dataset.carryw.split(':');
      if(parseInt(idx) >= S.licenses[cls]) return;
      S.slot[cls][pool] = parseInt(idx);
      log(L(CLASSES[cls].name)+' '+L((pool==='main'?'主手':'副手')+'槽已换装：')+weaponZh(WEAPON_SET[cls][pool][idx]), 'good');
      renderAll(); save();
    };
  });
  $('#side').querySelectorAll('[data-equip2]').forEach(el=>{
    el.onclick = () => {
      const [cls, pool, mid] = el.dataset.equip2.split(':');
      if(pool === 'main'){ S.equipped[cls] = mid; } else { S.equippedOff = S.equippedOff || {}; S.equippedOff[cls] = mid; }
      log(L((pool==='main'?'主手':'副手'))+L('武器装配模组【')+L(MOD_INDEX[mid])+'】。', 'good');
      renderAll(); save();
    };
  });
  $('#side').querySelectorAll('[data-unequip2]').forEach(el=>{
    el.onclick = () => {
      const [cls, pool] = el.dataset.unequip2.split(':');
      if(pool === 'main'){ S.equipped[cls] = null; } else { S.equippedOff[cls] = null; }
      log(TEXT.log_mod_off, '');
      renderAll(); save();
    };
  });
  $('#side').querySelectorAll('[data-equip]').forEach(el=>{
    el.onclick = () => {
      const [cls, mid] = el.dataset.equip.split(':');
      S.equipped[cls] = mid;
      log(L(CLASSES[cls].name)+' '+L(CLASSES[cls].w[S.licenses[cls]-1])+L(' 装配了模组【')+L(MOD_INDEX[mid])+'】。', 'good');
      renderAll(); save();
    };
  });
  $('#side').querySelectorAll('[data-unequip]').forEach(el=>{
    el.onclick = () => {
      const cls = el.dataset.unequip;
      S.equipped[cls] = null;
      log(TEXT.log_mod_off, '');
      renderAll(); save();
    };
  });
  const bd = $('#btn-draw');
  if(bd) bd.onclick = drawMods;
  const gf = $('#side').querySelector('[data-gearfold]');
  if(gf) gf.onclick = () => {
    const box = $('#side').querySelector('[data-gearrule]');
    if(box){ const open = box.style.display === 'none'; box.style.display = open ? 'block' : 'none'; gf.textContent = open ? '▾ 携带规则与升级详情' : '▸ 携带规则与升级详情'; }
  };
  /* 饰品佩戴/取下 */
  const ut = $('#btn-uneq-tr');
  if(ut) ut.onclick = () => { S.trinketEq = null; log(TEXT.log_trinket_off, ''); renderAll(); save(); };
  $('#side').querySelectorAll('[data-eq-tr]').forEach(el=>{
    el.onclick = () => {
      S.trinketEq = el.dataset.eqTr;
      const t = TRINKET_INDEX[S.trinketEq];
      log(TEXT.log_trinket_on.replace('{name}', L(t))+'：'+effectText(t.effect||{}), 'good');
      renderAll(); save();
    };
  });
  /* 精英购买/随队 */
  $('#side').querySelectorAll('[data-hire-elite]').forEach(el=>{
    el.onclick = () => {
      const u = ELITE_UNITS.units.find(x=>x.id===el.dataset.hireElite);
      if(!u || S.merit < u.price || S.rigLv < ELITE_UNITS.unlockRig) return;
      S.merit -= u.price;
      S.elite.owned = S.elite.owned||[];
      S.elite.owned.push(u.id);
      log(TEXT.log_elite_hire.replace('{name}', L(u))+' '+L(u.desc), 'gold');
      if(S.elite.owned.length >= ELITE_UNITS.units.length) log(L('五名复拓者全部到齐。管理层点评：这不再是派遣，这是降维打击。'), 'gold');
      renderAll(); save();
    };
  });
  $('#side').querySelectorAll('[data-carry]').forEach(el=>{
    el.onclick = () => {
      const id = el.dataset.carry;
      S.elite.carry = (S.elite.carry === id) ? null : id;
      const u = ELITE_UNITS.units.find(x=>x.id===id);
      log(S.elite.carry ? L('【')+L(u)+L('】已编入随队名单，下次派遣一同下潜。') : L('【')+L(u)+L('】已召回休整，转为收集匠器。'), '');
      renderAll(); save();
    };
  });
}
/* 锻造台抽卡：空白模组 → 全池随机 3 选 1。规则（MOD_GACHA）：重复模组免费重抽 1 次；10 抽内保底 T1 */
function drawMods(){
  if((S.blanks||0) < 1) return;
  S.blanks--;
  S.drawSinceT1 = (S.drawSinceT1||0) + 1;
  S.rerolled = false;
  roll3Options();
}
function roll3Options(){
  const pool = Object.values(MOD_INDEX);
  const forceT1 = (S.drawSinceT1||0) >= (MOD_GACHA.pity ? MOD_GACHA.pity.counter : 10);
  const picks = [];
  const used = {};
  let guard = 0;
  while(picks.length < 3 && guard < 800){
    guard++;
    let m = pool[Math.floor(Math.random()*pool.length)];
    if(forceT1 && picks.length === 0){
      const t1 = pool.filter(x=>x.tier === 'T1');
      if(t1.length) m = pick(t1);
    }
    if(used[m.id]) continue;
    used[m.id] = true;
    picks.push(m);
  }
  const rarName = {clean:'无瑕', balanced:'均衡', unstable:'不稳定'};
  const pityNote = forceT1 ? '<div class="note">'+L('保底机制：本次必含 T1 毕业档。')+'</div>' : '';
  showModal('<h3 style="color:var(--amber)">'+animDiv('forge_card_flip', 48, 66)+L('锻造台 · 模组抽取')+'</h3>'+
    '<p class="note">'+L('空白模组已插入锻造台。全池 3 选 1，选定后不可反悔——集团合同精神。')+pityNote+'</p>' +
    picks.map(m =>
      '<div class="mcard"><div class="t"><span class="nm">'+L(m)+'</span>'+
      '<span class="hz">'+L(rarName[m.rarity])+L('｜')+m.tier+'</span></div>'+
      '<div class="meta">'+weaponZh(m.weaponId)+L('｜')+effectText(m.effect||{})+'</div>'+
      '<div class="meta">'+L(m.desc)+'</div>'+
      '<button class="btn pri" data-pick="'+m.id+'">'+L('选这个（')+weaponZh(m.weaponId)+L('）')+'</button></div>').join(''), true);
  $('#modal-box').querySelectorAll('[data-pick]').forEach(btn=>{
    btn.onclick = () => {
      const mid = btn.dataset.pick;
      const mod = MOD_INDEX[mid];
      if(S.modsOwned[mid]){
        /* 重复模组：免费重抽 1 次 */
        if(!S.rerolled){
          S.rerolled = true;
          log(TEXT.log_mod_dup.replace('{name}', L(mod)), '');
          roll3Options();
          return;
        }
      }
      S.modsOwned[mid] = (S.modsOwned[mid]||0) + 1;
      if(mod.tier === 'T1') S.drawSinceT1 = 0;
      S.rerolled = false;
      log(TEXT.log_mod_in.replace('{name}', L(mod))+L('（')+weaponZh(mod.weaponId)+L('）。到装备终端装配。'), 'gold');
      closeModal(true); renderAll(); save();
    };
  });
}
function renderBar(){
  let html = '<div style="display:flex;gap:8px;align-items:center;">'+animDiv('lloyd_pour', 48, 48)+
    '<span class="note">'+L('酒吧 Lv.')+S.fac.bar+'</span></div>'+
    '<div class="meta">'+L('待生效酒 buff：')+(S.activeDrinkBuff ? L(S.activeDrinkBuff.dname)+L('（下一次派遣消耗）') : L('无——请客喝酒后自动挂上。'))+'</div>';
    const db = S.activeDrinkBuff;
  const RCOL = {'常见':'var(--dim)','少见':'var(--green)','精英':'var(--amber)','传说':'var(--gold)'};
  html += '<div class="meta">'+L('待生效酒：') + (db
      ? ('<span data-barinfo="1" style="cursor:pointer;border-bottom:1px dotted var(--dim)"><img src="'+db.icon+'" style="width:20px;height:28px;image-rendering:pixelated;vertical-align:-8px;margin-right:4px;"><b style="color:'+(RCOL[db.rarity]||'var(--txt)')+'">'+L('「')+L(db.dname)+L('」')+'</b>'+L('（')+L(db.rarity)+L('）')+L(db.txt)+L(' —— 下一次派遣消耗</span>'))
      : L('下一次派遣出发时自动白送一轮')) + '</div>';
  html += '<div class="row"><button class="btn pri" id="btn-reroll" style="flex:1" '+(S.fac.bar<1||S.credits<REROLL_COST?'disabled':'')+'>'+L('🎲 再抽一轮（')+REROLL_COST+L(' 代币）')+'</button></div>';
  html += '<div class="meta" style="margin-top:4px;">'+L('酒池 ')+DRINK_POOL.length+L(' 款：') + DRINK_POOL.map(d =>
    '<span style="color:'+(RCOL[d.rarity]||'var(--txt)')+'"><img src="'+d.icon+'" style="width:14px;height:20px;image-rendering:pixelated;vertical-align:-5px;">'+L(d.name)+'</span>'
  ).join(L('、')) + L('。') + '</div>';
  if(S.fac.bar < 4){
    const c = barCost();
    html += '<div class="row"><span style="flex:1">'+L('扩建酒吧至 Lv.')+(S.fac.bar+1)+L('：')+c.c+L(' 代币 + ')+L('蜂母石')+'×'+c.bismor+'</span>'+
      '<button class="btn" id="btn-bar" '+(S.credits>=c.c&&S.rare['蜂母石']>=c.bismor?'':'disabled')+'>'+L('扩建')+'</button></div>';
  }
  $('#side').innerHTML = html;
  const rr = $('#btn-reroll'); if(rr) rr.onclick = rerollDrink;
  const binfo = $('#side [data-barinfo]'); if(binfo) binfo.onclick = () => { const db = S.activeDrinkBuff; if(db) showDetail(L(db.dname), [{label:L('稀有度'), value:L(db.rarity)}, {label:L('效果'), value:L(db.txt)}, {label:L('来源'), value:L('酒吧抽酒')}]); };
  const bb = $('#btn-bar'); if(bb) bb.onclick = upgradeBar;
}
function renderMed(){
  let html = '<div style="display:flex;gap:8px;align-items:center;">'+animDiv('medbay_discharge', 72, 48)+
    '<span class="note">'+L('医疗站 Lv.')+S.fac.medbay+'</span></div>';
  const inMed = S.miners.filter(m=>m.state==='med');
  if(!inMed.length) html += '<div class="note">'+TEXT.ui_med_empty+'</div>';
  inMed.forEach(m=>{
    html += '<div class="miner"><div><b>'+minerName(m)+'</b> <span class="st-med">'+
      TEXT.ui_med_resting.replace('{days}', Math.max(0,Math.ceil(m.medUntil-S.gm)))+'</span></div></div>';
  });
  if(inMed.length){
    html += '<div class="row"><button class="btn warn" id="btn-treat">'+TEXT.ui_med_express.replace('{days}', 60*inMed.length)+L('（-')+120*inMed.length+L(' 代币）')+'</button></div>';
  }
  if(S.fac.medbay < 3){
    const c = medCost();
    html += '<div class="row"><span style="flex:1">'+L('升级医疗站至 Lv.')+(S.fac.medbay+1)+L('：')+c.c+L(' 代币 + ')+L('妙绝珠')+'×'+c.pearl+'</span>'+
      '<button class="btn" id="btn-med" '+(S.credits>=c.c&&S.rare['妙绝珠']>=c.pearl?'':'disabled')+'>'+L('升级')+'</button></div>';
  }
  $('#side').innerHTML = html;
  const bt = $('#btn-treat'); if(bt) bt.onclick = treatNow;
  const bm = $('#btn-med'); if(bm) bm.onclick = upgradeMed;
}
function renderRig(){
  const c = rigCost();
  let html = '<h3 class="sec">'+L('钻井平台 Lv.')+S.rigLv+' / 10</h3>';
  html += '<div class="row">'+animDiv('doretta_head', 90, 63)+'<span style="flex:1" class="note">'+L('镇台之宝：朵蕾妲头雕——第一次护送任务后，工程部坚持把它焊在了钻台顶上。没人舍得拆。')+'</span></div>';
  html += '<div class="note">'+TEXT.ui_rig_effect.replace('{mul}', rigYield().toFixed(2))
    .replace('{depth}', rigTier()).replace('{slots}', depCap()).replace('{cap}', hcCap())+'</div>';
  /* 矿骡升级线 */
  {
    const mule = MULE_UPGRADES.find(x => x.lv === (S.muleLv||1) + 1);
    let mtxt = L('Pack骡 M.U.L.E. Lv.') + (S.muleLv||1) + (mule ? '' : L('（已满级）'));
    if(mule){
      const cs = Object.entries(mule.cost).map(([k, v]) => L(k) + '×' + v).join(' + ');
      const can = S.rare['玉石']>=mule.cost['玉石'] && S.rare['乌玛石']>=mule.cost['乌玛石'] && (!mule.cost['蜂母石'] || S.rare['蜂母石']>=mule.cost['蜂母石']);
      html += '<div class="row"><span style="flex:1">' + mtxt + ' → Lv.' + mule.lv + ' ' + L(mule.name) + L('（') + L(mule.txt) + L('）：') + cs + '</span>' +
        '<button class="btn" id="btn-mule" onclick="upgradeMule()" '+(can?'':'disabled')+'>'+L('升级')+'</button></div>';
    } else {
      html += '<div class="row"><span style="flex:1">' + mtxt + '</span></div>';
    }
  }
  if(S.rigLv < CFG.RIG_MAX){
    html += '<div class="row"><span style="flex:1">'+L('升级至 Lv.')+(S.rigLv+1)+
      L('：墨菱石×')+c.mo+(c.oi?(L(' + 墨菱油×')+c.oi):'')+'</span>'+
      '<button class="btn pri" id="btn-rig" '+(S.morkite>=c.mo&&S.moil>=c.oi?'':'disabled')+'>'+TEXT.ui_rig_btn+'</button></div>';
    html += '<div class="note">'+L('下一级：墨菱石产量再 +15%')+(rigTier()<5 && (S.rigLv+1-1)%2===0?L('，解锁新深度档'):'')+L('。')+'</div>';
  } else html += '<div class="note">'+L('钻井平台已满级。集团发来贺电："终于把本钱挖回来了。"')+'</div>';
  html += '<h3 class="sec">'+L('生物群系解锁进度')+'</h3>';
  BIOMES.forEach(b=>{
    const ok = b.tier <= rigTier();
    html += '<div class="row"><span style="flex:1;'+(ok?'':'color:var(--dim);')+'">'+(ok?'✔':'🔒')+' '+
      L(b.name)+L('（深度档 ')+b.tier+L('｜稀有矿物：')+b.pair.map(x=>L(x)).join('/')+L('）')+'</span></div>';
  });
  html += '<h3 class="sec">'+L('解锁阶梯')+'</h3>';
  RIG_LADDER.forEach(([lv, txt])=>{
    const ok = S.rigLv >= lv;
    html += '<div class="row"><span style="flex:1;'+(ok?'color:var(--green);':'color:var(--dim);')+'">'+(ok?'✔':'🔒')+' Lv.'+lv+L('：')+L(txt)+'</span></div>';
  });
  html += '<div class="note">'+L('稀有矿物是任务的额外掉落，矿工等级与凭证越高掉得越多。')+'</div>';
  $('#side').innerHTML = html;
  const br = $('#btn-rig'); if(br) br.onclick = upgradeRig;
}
function renderSys(){
  let html = '<h3 class="sec">'+TEXT.ui_settings_title+'</h3>';
  html += '<div class="row"><button class="btn" id="btn-bind">'+TEXT.ui_save_btn_folder+'</button>'+
    '<button class="btn" id="btn-wfolder">'+TEXT.ui_save_btn_write+'</button>'+
    '<button class="btn" id="btn-rfolder">'+TEXT.ui_save_btn_restore+'</button></div>';
  html += '<div class="row"><button class="btn" id="btn-exp">'+TEXT.ui_save_btn_export+'</button>'+
    '<button class="btn" id="btn-imp">'+TEXT.ui_save_btn_import+'</button>'+
    '<button class="btn warn" id="btn-reset">'+L('重置存档（重新开局）')+'</button></div>';
  /* B-7 休眠舱：可选跳日（配置门控） */
  if(CHRONICLE.sleepButtons.day1 || CHRONICLE.sleepButtons.week7){
    html += '<h3 class="sec">'+L('休眠舱')+'</h3><div class="row">';
    if(CHRONICLE.sleepButtons.day1) html += '<button class="btn" id="btn-sleep1">'+L('睡一天（+1 日，当日无任务收益）')+'</button>';
    if(CHRONICLE.sleepButtons.week7) html += '<button class="btn" id="btn-sleep7">'+L('睡一周（')+CHRONICLE.sleepButtons.week7.cost+L(' 代币）')+'</button>';
    html += '</div>';
  }
  html += '<div class="note">'+L('自动存档保存在浏览器里；绑定文件夹后（Chrome/Edge），每次存档同步写入 drg_save.json，方便备份和传给朋友。')+'</div>';
  /* 成就墙（四系统补充设计 §一） */
  {
    const done = Object.keys(S.achievements||{}).length;
    html += '<h3 class="sec">'+L('成就 ') + done + '/' + ACHIEVEMENTS.length + '</h3>';
    ['入门','进阶','精通','大师','隐藏'].forEach(g => {
      const list = ACHIEVEMENTS.filter(a => a.grp === g);
      const got = list.filter(a => S.achievements[a.id]);
      html += '<div class="note"><b>' + L(g) + '</b> ' + got.length + '/' + list.length + L('：') +
        list.map(a => '<span style="color:' + (S.achievements[a.id] ? 'var(--gold)' : 'var(--dim)') + '">' + (S.achievements[a.id] ? '★' : '☆') + L(a.name) + '</span>').join(L('、')) + '</div>';
    });
  }
  html += '<div class="row" style="gap:6px;"><button class="btn" style="flex:1" onclick="showMemorial()">'+L('🏛 纪念堂')+'</button>'+
    '<button class="btn" style="flex:1" onclick="showDifficulty()">'+L('⚙ 难度终端')+'</button></div>';
  html += '<h3 class="sec">'+L('统计')+'</h3>';
  html += '<div class="note">'+L('完成任务 ')+(S.stats.missions||0)+L(' 次｜重伤 ')+(S.stats.inj||0)+L(' 人次｜游戏时间 ')+clockStr()+'</div>';
  {
    /* 隐藏彩蛋 1/3=卡尔剪影 2/3=lcyf166 祝福 3/3=黑脸小猫（社区彩蛋事件） */
    const eggN = (S.flags.karl?1:0) + (S.flags.lcyf166_bless?1:0) + (S.flags.catSeen?1:0);
    html += '<div class="note">'+L('隐藏彩蛋：已发现 ')+eggN+'/3</div>';
    if(S.flags.karl) html += animDiv('karl_silhouette', 80, 64)+'<span class="note">'+L('"...敬卡尔。"——没有人问为什么。')+'</span><br>';
    if(S.flags.lcyf166_bless) html += '<span class="note">'+L('"开挂节约时间，不开浪费时间。"——某位矿业顾问的祝福还在生效。')+'</span><br>';
    if(S.flags.catSeen) html += '<span class="note">'+L('黑脸小猫的本本上，记着这个钻台的名字。（当前记仇值 ')+(S.catGrudge||0)+L('/3）')+'</span>';
  }
  /* 测试协议输入 */
  html += '<h3 class="sec">'+L('测试协议')+'</h3>';
  html += '<div class="row"><input id="cheat-input" type="text" placeholder="'+L('输入测试码')+'" style="flex:1;padding:5px 8px;border:1px solid var(--line);background:var(--panel2);color:var(--txt);border-radius:3px;">'+
    '<button class="btn warn" id="btn-cheat">'+L('执行')+'</button></div>';
  html += '<div class="note">'+L('输入测试码并点击执行。效果：全模组解锁、资源注满、四职业满编、精英全员、深潜刷新。')+'</div>';
  $('#side').innerHTML = html;
  $('#btn-bind').onclick = bindFolder;
  $('#btn-wfolder').onclick = writeFolderSave;
  $('#btn-rfolder').onclick = restoreFolderSave;
  $('#btn-exp').onclick = exportSave;
  $('#btn-imp').onclick = importSave;
  $('#btn-reset').onclick = () => {
    showModal('<h3 style="color:var(--amber)">'+L('确认重置？')+'</h3><p style="margin:8px 0" class="note">'+TEXT.ui_settings_reset_confirm+'</p>'+
      '<button class="btn warn" id="btn-reset-yes">'+L('确认重开')+'</button> <button class="btn" id="btn-reset-no">'+L('我再想想')+'</button>');
    $('#btn-reset-yes').onclick = () => {
      localStorage.removeItem(CFG.SAVE_KEY);
      newGame(); lastSig = ''; renderAll(); save();
      closeModal(true);
      log(TEXT.log_manager_new, 'sys');
    };
    $('#btn-reset-no').onclick = () => closeModal(true);
  };
  /* 测试协议绑定必须留在 renderSys 内：innerHTML 重渲染会抹掉旧绑定 */
  const runCheat = () => {
    const inp = document.getElementById('cheat-input');
    if(!inp) return;
    const val = inp.value.trim().toLowerCase();
    if(!val) return;
    if(val === 'jcmeowiscat' || val === 'iriscat'){
      doCheat(val === 'jcmeowiscat' ? 'JCMEOW' : 'IRIS');
      inp.value = '';
    } else {
      log(L('无效测试码：')+val+L('。集团不认识这个暗号。'), 'bad');
      /* log() 只写数组不渲染；这里保留输入框内容便于改错，只刷新日志面板 */
      const lg = document.getElementById('log');
      if(lg) lg.innerHTML = S.log.map(l=>'<div class="l '+l.c+'">['+l.t+'] '+l.m+'</div>').join('');
    }
  };
  const cheatBtn = document.getElementById('btn-cheat');
  if(cheatBtn) cheatBtn.onclick = runCheat;
  const cheatInput = document.getElementById('cheat-input');
  if(cheatInput) cheatInput.onkeydown = e => { if(e.key === 'Enter') runCheat(); };
  /* B-7 休眠舱跳日 */
  const s1btn = document.getElementById('btn-sleep1');
  if(s1btn) s1btn.onclick = () => {
    worldAdvance(1440, true);   /* offline：派遣照常推进，事件弹窗不打扰 */
    log(TEXT.ch_jump_brief.replace('{days}', 1), 'sys');
    chronicleTick(); renderAll(); save();
  };
  const s7btn = document.getElementById('btn-sleep7');
  if(s7btn) s7btn.onclick = () => {
    const cost = CHRONICLE.sleepButtons.week7.cost;
    if(S.credits < cost){ log(L('代币不足，集团休假申请被驳回。休眠舱也是要收费的。'), 'bad'); return; }
    S.credits -= cost;
    worldAdvance(7*1440, true);
    log(TEXT.ch_jump_brief.replace('{days}', 7)+'（-'+cost+' 代币）', 'sys');
    chronicleTick(); renderAll(); save();
  };
}
function renderSide(){
  ({roster:renderRoster, gear:renderGear, bar:renderBar, med:renderMed, market:renderMarket, dive:renderDive, rig:renderRig, help:renderHelp, sys:renderSys})[curTab]();
}
function renderAll(){
  if(typeof updateTabBadges === 'function') try{ updateTabBadges(); }catch(e){}
  renderHeader(); renderBoard(); renderDeps(); renderSide(); renderCampaign();
  /* 虫潮预警条：任一派遣悬挂虫潮事件时在主界面顶部示警 */
  const sa = document.getElementById('swarmalert');
  if(sa) sa.style.display = S.deps.some(d=>d.paused && d.paused.id === 'swarm') ? 'flex' : 'none';
  /* 优化 #5：Tab 角标（医疗站=伤员数 / 装备终端=空白模组数 / 深潜=本周未打） */
  const bdef = {
    med: S.miners.filter(m=>m.state==='med').length,
    gear: (S.blanks||0),
    dive: (S.dive && S.dive.normal && !S.dive.normal.done) ? '!' : ''
  };
  Object.keys(bdef).forEach(tab=>{
    const t = document.querySelector('#tabs .tab[data-tab="'+tab+'"]'); if(!t) return;
    let b = t.querySelector('.badge');
    if(bdef[tab] !== '' && bdef[tab] !== 0){
      if(!b){ b = document.createElement('span'); b.className = 'badge'; t.appendChild(b); }
      b.textContent = bdef[tab];
      if(tab === 'med'){ b.style.background = 'var(--red)'; b.style.color = '#fff'; }
      else { b.style.background = 'var(--amber)'; b.style.color = '#0a0e12'; }
    } else if(b){ b.remove(); }
  });
  const lg = $('#log');
  /* 减字规则3：默认只渲染最近 5 条，其余合并为展开行 */
  const shown = S.log.slice(0, 5).map(l=>'<div class="l '+l.c+'">['+l.t+'] '+l.m+'</div>').join('');
  const restN = Math.max(0, S.log.length - 5);
  lg.innerHTML = shown + (restN > 0 ? '<div class="note" id="log-more" style="cursor:pointer;color:var(--teal);padding:3px 6px;" onclick="renderFullLog()">'+L('……例行 ')+restN+L(' 条（点击展开）')+'</div>' : '');
  lastSig = stateSig();
}
/* 签名渲染：状态没变化就不重建 DOM，避免按钮被周期性重绘吃掉点击 */
let lastSig = '';
function stateSig(){
  return [S.credits,S.nitra,S.morkite,S.moil,S.gold,S.rigLv,S.kpi.term,Math.floor(S.kpi.done),
    S.board.map(b=>b.id).join(','),
    S.deps.map(d=>d.id+':'+(d.paused?d.paused.id:'-')+':'+d.dur).join(';'),
    S.miners.map(m=>m.id+m.lv+m.state+Math.round(m.morale/5)+Math.floor(m.xp)).join(';'),
    JSON.stringify(S.rare), S.licenses.scout,S.licenses.engineer,S.licenses.gunner,S.licenses.driller,
    S.fac.bar,S.fac.medbay,S.log.length, S.flags.karl?1:0, curTab,
    'B'+(S.blanks||0), Object.keys(S.modsOwned||{}).sort().join(','),
    Object.entries(S.equipped||{}).map(([k,v])=>k+':'+v).join(','),
    'C'+S.campaign.ci+':'+S.campaign.si+':'+Math.floor(S.campaign.prog),
    'M'+S.market.day+':'+Object.values(S.market.prices).join('/'),
    'R'+(S.recruited.scout?1:0)+(S.recruited.engineer?1:0)+(S.recruited.gunner?1:0)+(S.recruited.driller?1:0)].join('|');
}
function marketBuy(k, qty){
  const p = S.market.prices[k]; if(!p) return;
  if(qty === 'max'){ const u = Math.ceil(p*1.05); qty = Math.max(0, Math.floor(S.credits/u)); }
  if(qty <= 0){ log('代币不足，买不起最小单位。', 'bad'); return; }
  const cost = Math.ceil(p*qty*(1+TRADE_FEE));
  if(S.credits < cost) return;
  S.credits -= cost; S[k] = (S[k]||0) + qty;
  log('交易站买入 '+k+'×'+qty+'，花费 '+cost+' 代币（含 5% 手续费）。集团感谢你的信任。', '');
  renderAll(); save();
}
/* ---------------- 深潜系统（B-4 双轨 WEEKLY_DIVE 版） ---------------- */
function isoWeek(){
  /* F4 修复：周号从编年史游戏日历日期算（同 holidayForNow 口径），不再用现实时钟——
     否则游戏内日期与现实漂移后深潜周永不翻页。统一用 UTC 取值防时区偏移。 */
  const d = dayToDate(gameDay());
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
  return t.getUTCFullYear() + '-W' + String(wk).padStart(2,'0');
}
function bestStars(){ let m = 0; S.miners.forEach(x=>{ if((x.stars||0) > m) m = x.stars; }); return m; }
function allRecruited(){ return Object.keys(CLASSES).every(c => S.recruited[c]); }
function allIdle(){ return S.miners.filter(m => m.state==='idle' && m.morale>=25); }
function allIdleOf(classes){ return S.miners.filter(m => classes.includes(m.cls) && m.state==='idle' && m.morale>=25); }
const DIVE_TYPE_ID = {'采矿探险':'exp','消灭任务':'elim','执勤护送':'escort','定点提取':'point','就地精炼':'refi','搜救行动':'salv'};
function ensureDiveWeek(){
  const wk = isoWeek();
  if(S.dive.week !== wk){
    S.dive.week = wk;
    S.dive.normal = {stage:0, done:false};
    S.dive.elite = {stage:0, done:false};
    /* 修正器周抽：普通 1增益+2减益；精英 1增益+3减益（权重抽取，不重复） */
    S.dive.modifiers = {};
    ['normal','elite'].forEach(v => {
      const cfg = WEEKLY_DIVE.modifiers.perWeek[v];
      const pool = WEEKLY_DIVE.modifiers.pool;
      const picked = [];
      const kinds = { buff: cfg.buff, debuff: cfg.debuff };
      Object.keys(kinds).forEach(kind => {
        for(let n=0; n<kinds[kind]; n++){
          const avail = pool.filter(m => m.kind===kind && !picked.includes(m.id));
          if(!avail.length) continue;
          const total = avail.reduce((a,x)=>a+x.w,0);
          let r = Math.random()*total, p = avail[0];
          for(const x of avail){ r -= x.w; if(r <= 0){ p = x; break; } }
          picked.push(p.id);
        }
      });
      S.dive.modifiers[v] = picked;
    });
    log(TEXT['dd_expire_' + (Math.random() < 0.5 ? 'a' : 'b')], 'sys');   /* F7：键名是 dd_expire_a/b，非数字 */
  }
}
function diveModifiers(variant){ ensureDiveWeek(); return (S.dive.modifiers||{})[variant] || []; }
function diveModEffect(variant, key){
  let v = 0;
  diveModifiers(variant).forEach(id => {
    const m = WEEKLY_DIVE.modifiers.pool.find(x=>x.id===id);
    if(m && m.effect && m.effect[key] !== undefined){
      const val = m.effect[key];
      v = (key==='payMul' || key==='morkiteMul') ? (v || 1) * val : v + val;
    }
  });
  return v;
}
function diveCanStart(variant){
  const need = WEEKLY_DIVE.unlock[variant].anyStars;
  if(bestStars() < need) return L('需任一矿工晋升 ★')+need;
  const idle = allIdle();
  const classes = new Set(idle.map(m=>m.cls));
  if(!allRecruited() || classes.size < 4 || idle.length < 4) return L('需四职业满编且全员空闲');
  return null;
}
function startDiveStage(variant, stage){
  ensureDiveWeek();
  const gate = diveCanStart(variant);
  if(gate){ log(L('深潜开潜失败：')+gate+L('。'), 'bad'); return; }
  const dv = S.dive[variant];
  if(dv.done || dv.stage !== stage) return;
  const st = WEEKLY_DIVE.stages[variant][stage];
  if(!st) return;
  const typeName = st.missions[0].type;
  const typeId = DIVE_TYPE_ID[typeName] || 'exp';
  /* 时长：任务基础时长 ×危险系数 ×2.5（满编 0.51 已含在系数内按 B-1 口径）；契合/修正器时长加成 */
  const fitDur = st.fit.duration ? (1 + st.fit.duration/100) : 1;
  const modDur = 1 + (diveModEffect(variant,'duration')||0)/100;
  const dur = Math.max(60, Math.round(300 * 1.6 * CFG.HC_FAC[3] * st.durMul * fitDur * modDur));
  const team = [];
  Object.keys(CLASSES).forEach(c => {
    const m = S.miners.find(x => x.cls===c && x.state==='idle' && x.morale>=25);
    if(m) team.push(m);
  });
  if(team.length < 4){ log(TEXT.dd_squad_full, 'bad'); return; }
  team.forEach(m => m.state = 'mission');
  let mods = diveModifiers(variant);
  /* 黑脸小猫记仇（B 设计 ev_cat）：记仇值≥3 时本段额外抽 1 条减益，触发后归零（一次性） */
  if((S.catGrudge||0) >= 3){
    S.catGrudge = 0;
    const debuffs = WEEKLY_DIVE.modifiers.pool.filter(x => x.kind==='debuff' && !mods.includes(x.id));
    if(debuffs.length){
      const total = debuffs.reduce((a,x)=>a+x.w,0);
      let r = Math.random()*total, ex = debuffs[0];
      for(const x of debuffs){ r -= x.w; if(r <= 0){ ex = x; break; } }
      mods = mods.concat(ex.id);
    }
    log(TEXT.ev_cat_grudge_max, 'bad');
  }
  /* B 退回项修复：修正器效果全量并入 modEff（数值累加、evW 按事件 id 相乘）。
     payMul/morkiteMul 由 diveSettle 直读 diveMods，不在此处理；medHours 消费端待 B 定单位后接 */
  const modEff = {eventSuccess: st.fit.eventSuccess||0, checkT: 0, medBill: 0, medHours: 0, medHoursMul: 1, evW: {}};
  mods.forEach(id => {
    const mm = WEEKLY_DIVE.modifiers.pool.find(x=>x.id===id);
    if(!mm || !mm.effect) return;
    const e = mm.effect;
    modEff.eventSuccess += e.eventSuccess||0;
    modEff.checkT += e.checkT||0;
    modEff.medBill += e.medBill||0;
    modEff.medHours += e.medHours||0;
    modEff.medHoursMul *= (e.medHoursMul||1);
    Object.keys(e.evW||{}).forEach(k => { modEff.evW[k] = (modEff.evW[k]||1) * e.evW[k]; });
  });
  S.deps.push({id:'dd'+Date.now().toString(36), mid:'dive_'+variant+'_'+stage,
    m:{type:typeId, biome:'glacial', hazard:st.hazard,
       r:{credits:st.rewards.credits, morkite:st.rewards.morkite, merit:st.rewards.merit, blankMod:st.rewards.blankMod, rare:st.rewards.rare||0}},
    cls:'dive', fitN:0, hc:4, minerIds:team.map(m=>m.id),
    diveFit: st.fit, diveHazardBonus: st.hazardBonus, diveMods: mods,
    modEff,
    forceFirstEvent: !!st.forceFirstEvent,
    start:S.gm, dur, done:0, isDive:true, diveVariant:variant, diveStage:stage,
    evt1:false, evt2:false, evt3:false, paused:null, bonus:1});
  if(st.forceFirstEvent){ const dep = S.deps[S.deps.length-1]; dep.evt1 = true; rollEvent(dep, 1); }
  log(TEXT['dd_stage'+(stage+1)+'_start_'+(Math.random()<0.5?'a':'b')], 'gold');
  renderAll(); save();
}
/* 深潜阶段失败规则（B-4）：本段累计重伤 ≥2 → 中止重打；结算后平均士气 <25 → 同 */
function diveHurtCheck(d){
  if(!d.isDive) return;
  d.diveInj = (d.diveInj||0) + 1;
  const limit = WEEKLY_DIVE.failRule.stageHeavyInjuries;
  if(d.diveInj >= limit && !d.diveAborted){
    d.diveAborted = true;
    log(TEXT['dd_fail_'+(Math.random()<0.5?'a':'b')], 'bad');
  }
}
function diveSettle(d){
  const dv = S.dive[d.diveVariant];
  if(d.diveAborted){
    /* 中止：不发阶段奖励，伤员照常入院，阶段保留重打 */
    log(L('深潜第 ')+(d.diveStage+1)+L(' 段中止。')+TEXT['dd_fail_'+(Math.random()<0.5?'a':'b')], 'bad');
    return;
  }
  const avgM = d.minerIds.length ? d.minerIds.reduce((a,id)=>{ const m=S.miners.find(x=>x.id===id); return a + (m?m.morale:0); },0)/d.minerIds.length : 0;
  if(avgM < WEEKLY_DIVE.failRule.moraleFloor){
    log(L('深潜第 ')+(d.diveStage+1)+L(' 段结算驳回：全队平均士气 ')+Math.round(avgM)+L(' 低于 ')+WEEKLY_DIVE.failRule.moraleFloor+L('。')+TEXT['dd_fail_'+(Math.random()<0.5?'a':'b')], 'bad');
    return;
  }
  /* 阶段奖励（含契合职业与修正器加成） */
  const rw = {};
  const payMul = diveModEffect(d.diveVariant,'payMul') || 1;
  const mkMul = diveModEffect(d.diveVariant,'morkiteMul') || 1;
  const fitYield = (d.diveFit && d.diveFit.yield) ? 1 + d.diveFit.yield/100 : 1;
  Object.keys(d.m.r).forEach(k => { rw[k] = d.m.r[k]; });
  if(rw.credits) rw.credits = Math.round(rw.credits * payMul);
  if(rw.morkite) rw.morkite = Math.round(rw.morkite * mkMul * fitYield);
  const parts = [];
  if(rw.credits){ S.credits += rw.credits; parts.push(rw.credits+L(' 代币')); }
  if(rw.morkite){ S.morkite += rw.morkite; S.kpi.done += rw.morkite; parts.push(L('墨菱石×')+rw.morkite); }
  if(rw.blankMod){ S.blanks = (S.blanks||0) + rw.blankMod; parts.push(L('空白模组×')+rw.blankMod); }
  if(rw.merit){ S.merit = (S.merit||0) + rw.merit; parts.push(L('功绩点×')+rw.merit); }
  if(rw.rare){
    const b = biomeById(d.m.biome);
    const mm = pick(b ? b.pair : RARES);
    S.rare[mm] += rw.rare; parts.push(L(mm)+'×'+rw.rare);
  }
  log(TEXT['dd_stage'+(d.diveStage+1)+'_clear_'+(Math.random()<0.5?'a':'b')]+L('（奖励：')+parts.join(L('、'))+L('）'), 'gold');
  /* 修正器奖励加成（淘金热潮等已在结算管线中处理 payMul/morkiteMul） */
  if(dv){
    if(dv.stage === d.diveStage) dv.stage++;
    if(dv.stage >= 3 && !dv.done){
      dv.done = true;
      if(!S.flags.karlDiveClue){ S.flags.karlDiveClue = true; S.flags.karlCount = (S.flags.karlCount||0) + 1; log(TEXT.karl_dive_clue, 'gold'); }
      const cb = WEEKLY_DIVE.completionBonus[d.diveVariant];
      if(cb){
        const cp = [];
        if(cb.credits){ S.credits += cb.credits; cp.push(cb.credits+L(' 代币')); }
        if(cb.morkite){ S.morkite += cb.morkite; S.kpi.done += cb.morkite; cp.push(L('墨菱石×')+cb.morkite); }
        if(cb.blankMod){ S.blanks = (S.blanks||0) + cb.blankMod; cp.push(L('空白模组×')+cb.blankMod); }
        if(cb.merit){ S.merit = (S.merit||0) + cb.merit; cp.push(L('功绩点×')+cb.merit); }
        awardRandomTrinket((d.diveVariant==='normal'?'深潜':'精英深潜')+'通关');
        log(d.diveVariant==='elite'
          ? TEXT.dd_elite_clear+L('（奖励：')+cp.join(L('、'))+L('）')
          : TEXT['dd_clear_'+(Math.random()<0.5?'a':'b')]+L('（奖励：')+cp.join(L('、'))+L('）'), 'gold');
      }
      campProgress('dive', '', 1);
    }
  }
}
function renderDive(){
  ensureDiveWeek();
  const unlocked = bestStars() >= 1;
  let html = '';
  if(!unlocked){
    html = '<div class="note">'+TEXT.dd_ui_locked+L(' 当前最高资历 ★')+bestStars()+L('。')+'</div>';
    $('#side').innerHTML = html; return;
  }
  const wk = isoWeek();
  html += '<div style="display:flex;gap:8px;align-items:center;">'+animDiv('dive_descend', 40, 80)+
    '<div><div class="note">'+L('本周 ')+wk+'</div></div></div>';
  /* 修正器展示 */
  ['normal','elite'].forEach(v => {
    if(v==='elite' && bestStars() < 3) return;
    const mods = diveModifiers(v);
    if(mods.length){
      html += '<div class="meta">'+TEXT.dd_ui_brief_mod.replace('{mods}',
        mods.map(id => { const m = WEEKLY_DIVE.modifiers.pool.find(x=>x.id===id);
          return m ? L(m) : id; }).join(L('、')))+'</div>';
    }
  });
  [['normal','⛏ 普通深潜（危4→5→5+）',1],['elite','⚔ 精英深潜（危5→5+→5++）',3]].forEach(([variant, title, needStars]) => {
    if(bestStars() < needStars){ html += '<div class="note">'+TEXT.dd_elite_locked+'</div>'; return; }
    const dv = S.dive[variant];
    html += '<h3 class="sec">'+L(title)+L('｜')+(dv.done ? L('✅ 已通关') : L('第 ')+(dv.stage+1)+L('/3 段'))+'</h3>';
    WEEKLY_DIVE.stages[variant].forEach((st, i) => {
      const cleared = dv.stage > i;
      const active = dv.stage === i && !dv.done;
      const fitName = CLASSES[st.fit.cls].name;
      html += '<div class="miner"><div class="mtop"><div>'+(cleared?'✅ ':'')+L('第 ')+(i+1)+L(' 段：')+L(st.missions[0].type)
        +L('（危')+st.hazard+L('｜契合 ')+L(fitName)+L('）')+'</div>'+
        (active ? '<button class="btn pri" data-dive="'+variant+':'+i+'">'+TEXT.dd_ui_btn_launch+'</button>' : cleared ? '<span class="st-idle">'+L('已通关')+'</span>' : '<span class="note">🔒</span>')+
        '</div><div class="note">'+L('奖励：空白模组×')+st.rewards.blankMod+' + '+st.rewards.credits+L(' 代币 + 功绩点×')+st.rewards.merit+'</div></div>';
    });
  });
  html += '<div class="note">'+L('每周一 0 点刷新。')+'</div>';
  html += '<div class="row"><button class="btn" id="btn-dive-mods" style="flex:1">'+L('查看本周修正器')+'</button></div>';
  if(S.mode === 'rush') html = '<div class="note" style="color:var(--amber)">' + TEXT.dm_rush_dive_lock + '</div>' + html;
  $('#side').innerHTML = html;
  const bmods = $('#btn-dive-mods'); if(bmods) bmods.onclick = () => {
    const rows = [];
    ['normal','elite'].forEach(v => {
      diveModifiers(v).forEach(id => {
        const mm = WEEKLY_DIVE.modifiers.pool.find(x => x.id === id);
        if(mm) rows.push({label:(v === 'normal' ? L('普通 · ') : L('精英 · ')) + (L(mm) || mm.id), value:L(mm.desc || '')});
      });
    });
    showDetail(L('本周修正器'), rows.length ? rows : [{label:L('本周无修正器记录'), value:'—'}]);
  };
  $('#side').querySelectorAll('[data-dive]').forEach(el=>{
    el.onclick = () => {
      if(S.mode === 'rush'){ log(TEXT.dm_rush_dive_lock, 'bad'); return; }
      startDiveStage(...el.dataset.dive.split(':').map((v,i)=> i===1 ? parseInt(v) : v));
    };
  });
}
function renderHelp(){
  let html = '<div class="note">'+L('管理层速查手册。所有规则详情都在这里，面板里不再重复解释。')+'</div>';
  html += '<div class="note" style="color:var(--gold)">🔍 ' + TEXT.karl_help_title.replace('{n}', Math.min(3, S.flags.karlCount||0)) + '</div>';
  html += '<h3 class="sec">'+L('核心循环')+'</h3><div class="note">'+L('任务板接单 → 选职业派 1~4 人 → 途中处理事件 → 结算收益 → 升级钻井平台/装备/矿工 → 接更贵的单。')+'</div>';
  html += '<h3 class="sec">'+L('双层经济')+'</h3><div class="note"><b style="color:var(--amber)">'+L('墨菱石/墨菱油')+'</b>'+L('（任务主产物）只喂钻井平台升级线，提升产量/深度/派遣位。<br>')+
    '<b style="color:var(--gold)">'+L('稀有矿物')+'</b>'+L('（玉石/乌玛石/铜矿/妙绝珠/吸铁石/蜂母石/容和石）任务概率掉落，喂矿工成长与武器凭证。矿工越强掉落越多。</div>');
  html += '<h3 class="sec">'+L('士气与深渊酒吧')+'</h3><div class="note">'+L('士气 0-100。低于 25 拒绝下矿。空闲每小时恢复（酒吧等级加速）。<b>深渊酒吧请一轮酒</b>：从 16 款酒池随机抽取一款，全员士气 +40（个别酒有副作用，可付费再抽一轮换口味）。重伤入院全队 -15。')+'</div>';
  html += '<h3 class="sec">'+L('晋升系统')+'</h3><div class="note">'+L('矿工 25 级满级 → 付费晋升：等级回到 1，晋升框与加成（+8%/★ 战斗力和掉落）永久保留。<br>晋升阶梯（每档 3 级）：铜→银→金→铂→祖母绿→蓝宝石→钻石→红，红 3 之后显示"额外晋升 ×N"。<br>晋升费：800 × 1.9^资历 代币。')+'</div>';
  html += '<h3 class="sec">'+L('武器与模组')+'</h3><div class="note">'+L('新武器通过战役任务解锁。每把武器可升级 5 次，只能装 1 个模组。<br>模组获取：任务板偶尔刷出<b>三提石任务</b>（✦ 标记）→ 完成得空白模组 → 锻造台 3 选 1 抽卡。重复免费重抽 1 次，10 抽保底 T1。')+'</div>';
  html += '<h3 class="sec">'+L('深潜')+'</h3><div class="note">'+L('每周刷新（周一 0 点），三段连续任务。解锁：任一矿工 ≥1★。精英深潜：≥3★。<br>强制四职业满编（缺员含住院不可开潜）。失败可重打当前段（重伤 ≥2 或士气 <25 → 阶段中止）。<br>通关奖励含空白模组和功绩点。')+'</div>';
  html += '<h3 class="sec">'+L('精英支援位')+'</h3><div class="note">'+L('钻井平台 Lv10 解锁。用功绩点购买五名异动核心复拓者：<br>守护者（账单-30%）/ 歼察员（检定+10%）/ 驭鹰者（掉落+15%）/ 切割者（战斗+25%）/ 回溯者（每周回滚一次）。<br>每次派遣最多带 1 名，不占四职业名额。功绩点来源：深潜 / KPI / 危5 / 精英虫。')+'</div>';
  html += '<h3 class="sec">'+L('交易站')+'</h3><div class="note">'+L('矿物每日 ±10% 涨跌停，手续费 5%。低买高卖。墨菱石既是升级材料也是 KPI 指标也是商品——抛售前想清楚。')+'</div>';
  html += '<h3 class="sec">'+L('稀有矿物对照')+'</h3><div class="note">'+L('玉石=侦察主矿｜乌玛石=钻机主矿｜铜矿=枪手副矿｜妙绝珠=侦察副矿｜吸铁石=工程主矿｜蜂母石=枪手副矿｜容和石=低价值常见料。')+'</div>';
  html += '<h3 class="sec">'+L('隐藏内容')+'</h3><div class="note">'+L('据说有个叫卡尔的矮人。集团档案查无此人。')+'</div>';
  $('#side').innerHTML = html;
}
let sellArm = '', sellArmAt = 0;
function renderMarket(){
  let html = '<div class="note">'+TEXT.ui_market_note+'</div>';
  let ups = 0, downs = 0;
  TRADEABLES.forEach(t=>{
    const p = S.market.prices[t.k], pv = S.market.prev[t.k];
    if(p && pv){ const c = (p-pv)/pv; if(c > 0.001) ups++; else if(c < -0.001) downs++; }
  });
  html += '<div class="meta">'+TEXT.ui_market_today.replace('{ups}', (ups||0)).replace('{downs}', (downs||0))+'</div>';
  TRADEABLES.forEach(t=>{
    const p = S.market.prices[t.k] || t.base;
    const pv = S.market.prev[t.k] || p;
    const chg = pv ? Math.round((p-pv)/pv*1000)/10 : 0;
    const held = S[t.k]||0;
    const chgColor = chg > 0 ? 'var(--red)' : chg < 0 ? 'var(--green)' : 'var(--dim)';
    html += '<div class="mcard"><div class="t"><span class="nm" data-mdetail="'+t.k+'" style="cursor:pointer;border-bottom:1px dotted var(--dim)">'+t.name+'</span><span>'+
      p+L(' 代币 ')+'<span style="color:'+chgColor+'">'+(chg>0?'+':'')+chg.toFixed(1)+'%</span></span></div>'+
      '<div class="meta">'+TEXT.ui_market_hold.replace('{n}', held).replace('{v}', Math.round(held*p))+'</div>'+
      '<div class="row"><button class="btn" data-mb="'+t.k+':10">'+TEXT.ui_market_buy10.replace('{cost}', Math.ceil(p*10*1.05))+'</button>'+
      '<button class="btn" data-mb="'+t.k+':50">'+TEXT.ui_market_buy50.replace('{cost}', Math.ceil(p*50*1.05))+'</button>'+
      '<button class="btn" data-mb="'+t.k+':max">'+L('买 max（')+Math.max(0,Math.floor(S.credits/Math.ceil(p*1.05)))+L('）')+'</button>'+
      '<button class="btn" data-ms="'+t.k+':10">'+TEXT.ui_market_sell10.replace('{gain}', Math.floor(p*10*0.95))+'</button>'+
      '<button class="btn" data-ms="'+t.k+':all">'+TEXT.ui_market_sellall+'</button></div></div>';
  });
  $('#side').innerHTML = html;
  $('#side').querySelectorAll('[data-mdetail]').forEach(el=>{
    el.onclick = () => {
      const t = TRADEABLES.find(x => x.k === el.dataset.mdetail); if(!t) return;
      const p = S.market.prices[t.k] || t.base, base = t.base, held = S[t.k]||0;
      const chg = base ? Math.round((p-base)/base*1000)/10 : 0;
      showDetail(L(t), [
        {label:L('当前价'), value:p + L(' 代币')},
        {label:L('基准价'), value:base + L(' 代币')},
        {label:L('相对基准'), value:(chg>0?'+':'') + chg.toFixed(1) + '%'},
        {label:L('持有量'), value:held},
        {label:L('持仓净值'), value:fmt(Math.round(held*p)) + L(' 代币')},
      ]);
    };
  });
  $('#side').querySelectorAll('[data-mb]').forEach(el=>{
    el.onclick = () => { const [k, q] = el.dataset.mb.split(':');
      if(q === 'max'){ const p = S.market.prices[k] || 1; const u = Math.ceil(p*1.05); const qm = Math.max(0, Math.floor(S.credits/u)); marketBuy(k, qm); }
      else marketBuy(k, parseInt(q)); };
  });
  $('#side').querySelectorAll('[data-ms]').forEach(el=>{
    el.onclick = () => { const [k, q] = el.dataset.ms.split(':');
      if(q === 'all'){
        if(sellArm === k && Date.now()-sellArmAt < 4000){ sellArm = ''; marketSell(k, 999999); }
        else { const tn = (TRADEABLES.find(x=>x.k===k)||{}).name || k; sellArm = k; sellArmAt = Date.now(); el.textContent = L('确认清仓 ')+L(tn)+L('？再点一次'); el.style.borderColor = 'var(--red)'; }
        return;
      }
      marketSell(k, parseInt(q)); };
  });
}
function marketSell(k, qty){
  const have = S[k]||0; qty = Math.min(qty, have);
  if(qty <= 0) return;
  const gain = Math.floor(p2(S.market.prices[k]) * qty * (1-TRADE_FEE));
  S.credits += gain; S[k] -= qty;
  S.stats.tradeProfit = (S.stats.tradeProfit||0) + gain;
  log(TEXT.log_market_sell.replace('{k}', k).replace('{qty}', qty).replace('{gain}', gain), 'good');
  renderAll(); save();
}
function p2(v){ return v; }
function renderCampaign(){
  const el = document.getElementById('campbar'); if(!el) return;
  const c = S.campaign;
  ensureCampaignQueue();
  const camp = CAMPAIGNS[c.ci];
  const hol = holidayForNow();
  let title = L('等待新的主线任务');
  let detail = L('集团任务队列正在同步。');
  let pct = 0;
  let finale = '';
  if(camp){
    const st = camp.steps[c.si];
    const cnd = CHRONICLE.nodes[c.ci];
    const locked = cnd ? gameDay() < cnd.day : false;
    title = L('战役【')+L(camp)+L('】');
    if(locked){
      detail = L('将在 D')+cnd.day+' · '+cnd.date+L(' 解锁。')+TEXT.ch_lock_hint;
    } else if(st){
      pct = clamp(c.prog/st.need*100, 0, 100);
      detail = L(st.txt)+L('（')+Math.floor(c.prog)+'/'+st.need+L('）')+'<span class="reward">'+L('奖励：')+L(camp.rwTxt)+'</span>';
      const mtG = mtypeById(st.target);
      if(mtG && mtG.rig > S.rigLv) detail += '<span class="reward">'+L('需钻井平台 Lv.')+mtG.rig+'</span>';
    }
    if(camp.id === 'finale' && c.si === 3){
      finale = '<button class="btn warn" onclick="showFinaleBoss()">'+L('终局突入')+'</button>';
    }
  }
  if(hol) detail += '<span class="reward">'+L('当期节日：')+L(hol.h.name)+'</span>';
  el.innerHTML = '<div class="campaign-inner"><div class="campaign-emblem" aria-hidden="true"></div>'+
    '<div class="campaign-content"><div class="campaign-kicker"><b>'+L('主线任务')+'</b><span>D'+gameDay()+' · '+dateOfStr(gameDay())+'</span></div>'+
    '<div class="campaign-title">'+title+'</div><div class="campaign-detail">'+detail+'</div>'+
    '<div class="bar"><i style="width:'+pct+'%"></i></div>'+finale+'</div></div>';
}
function updateTabBadges(){
  const set = (name, n) => {
    const tab = document.querySelector('.tab[data-tab="'+name+'"]'); if(!tab) return;
    let b = tab.querySelector('.tb');
    if(!b){ b = document.createElement('span'); b.className = 'tb'; tab.appendChild(b); }
    if(n > 0){ b.textContent = n > 99 ? '99+' : String(n); b.classList.add('on'); }
    else b.classList.remove('on');
  };
  set('med', S.miners.filter(m => m.state === 'med').length);
  set('gear', S.blanks || 0);
  let diveN = 0;
  try{
    ensureDiveWeek();
    const bs = bestStars();
    if(bs >= 1 && !S.dive.normal.done) diveN = 1;
    if(bs >= 3 && !S.dive.elite.done) diveN = 1;
  }catch(e){}
  set('dive', diveN);
}
function renderIfChanged(){
  try{ checkAchievements(); }catch(e){}
  const sig = stateSig();
  if(sig !== lastSig){
    lastSig = sig;
    renderBoard(); renderDeps(); renderSide(); renderCampaign();
    $('#log').innerHTML = S.log.map(l=>'<div class="l '+l.c+'">['+l.t+'] '+l.m+'</div>').join('');
  }
  /* 轻量更新：进度条/士气条与时钟/货币数字 */
  renderHeader();
  document.querySelectorAll('#deps .dep').forEach(card=>{
    const d = S.deps.find(x=>x.id===card.dataset.dep); if(!d) return;
    const pct = clamp(d.done||0, 0, d.dur)/d.dur*100;
    const bar = card.querySelector('.prog > i');
    if(bar) bar.style.width = pct.toFixed(1)+'%';
    const dig = card.querySelector('.digger');
    if(dig) dig.style.left = pct.toFixed(1)+'%';
  });
  S.miners.forEach(m=>{
    const bar = document.querySelector('.mbar > i[data-mid="'+m.id+'"]');
    if(bar){
      bar.style.width = m.morale+'%';
      bar.style.background = m.morale>=60?'var(--green)':m.morale>=30?'var(--amber)':'var(--red)';
    }
  });
  tickStages(performance.now());
}
/* 名册头像框：静态肖像 img（C v3，renderRoster 里按状态换 src，永不闪） */
function avatarHtml(cls, state){
  const p = 'assets/anim/portrait_' + cls + (state==='med' ? '_med' : '') + '.png';
  return '<div class="avat' + (state==='mission'?' mission':state==='med'?' med':'') +
         '"><img src="'+p+'" alt=""></div>';
}
/* 动画展示位：全局时钟逐帧（innerHTML 重渲染不重启） */
function tickStages(now){
  document.querySelectorAll('.anim-spr').forEach(el=>{
    const a = (typeof ANIM !== 'undefined') && ANIM[el.dataset.anim]; if(!a) return;
    const f = Math.floor(now/1000*a.fps) % a.frames;
    const w = parseInt(el.style.width) || 72;
    const h = parseInt(el.style.height) || 72;
    const s = h / a.frameH;
    el.style.backgroundImage = 'url('+a.src+')';
    el.style.backgroundSize = (a.frameW*a.frames*s)+'px '+(a.frameH*s)+'px';
    el.style.backgroundPosition = (-f*a.frameW*s)+'px 0';
  });
}
/* 逐帧驱动（rAF 节流 ~20fps，移植自 c4e4daa）：150ms 定时器在窗口被遮挡时会被浏览器降到 1Hz，
   矮人挥镐/走路动画会冻成一秒一跳的定格——rAF 不受此类降频影响。
   tickStages 的帧位是时间戳的纯函数（frame=floor(now/1000*fps)%frames），与 main.js 留守的 150ms
   定时器（名册 8fps 兜底线）双驱动不会加速任何动画，仅提高采样密度；名册视觉节奏不变。 */
(function(){
  let last = 0;
  function animLoop(now){
    if(now - last >= 50){ last = now; try{ tickStages(now); }catch(e){} }
    requestAnimationFrame(animLoop);
  }
  requestAnimationFrame(animLoop);
})();
/* 通用动画组件：插入后由 tickStages 驱动 */
function animDiv(animId, w, h){
  return '<div class="anim-spr" data-anim="'+animId+'" style="width:'+w+'px;height:'+h+'px;'+
    'image-rendering:pixelated;background-repeat:no-repeat;background:#0a0e12;'+
    'border:1px solid var(--line);border-radius:3px;flex:none;"></div>';
}

/* ---------------- 数值详情弹窗（减字二期 · B 设计） ---------------- */
function spawnKarlMission(){
  const km = {id:'karl0', biome: S.board.length && S.board[0] ? S.board[0].biome : 'crystal', hazard:5, r:{}, kind:'prologue'};
  S.board.unshift(km);
}
function playPrologue(){
  const scr1 = '<h3 style="color:var(--amber)">' + TEXT.st_note_title + '</h3><div class="note" style="white-space:pre-line;margin:10px 0">' + TEXT.st_note_body + '</div>' +
    '<div class="row" style="gap:6px"><button class="btn" style="flex:1" id="pg-next">'+L('下一页')+'</button><button class="btn" id="pg-skip" style="flex:none">' + TEXT.st_skip + '</button></div>';
  const scr2 = '<h3 style="color:var(--red)">' + TEXT.st_brief_title + '</h3><div class="note" style="white-space:pre-line;margin:10px 0">' + TEXT.st_brief_body + '</div>' +
    '<div class="row" style="gap:6px"><button class="btn" style="flex:1" id="pg-next">'+L('下一页')+'</button><button class="btn" id="pg-skip" style="flex:none">' + TEXT.st_skip + '</button></div>';
  const scr3 = '<h3 style="color:var(--gold)">' + TEXT.st_takeover_title + '</h3><div class="note" style="white-space:pre-line;margin:10px 0">' + TEXT.st_takeover_body + '</div>' +
    '<div class="row" style="gap:6px"><button class="btn" style="flex:1" id="pg-next">' + TEXT.st_start_btn + '</button><button class="btn" id="pg-skip" style="flex:none">' + TEXT.st_skip + '</button></div>';
  showModal(scr1, true);
  const goEnd = () => endPrologue();
  const go3 = () => { showModal(scr3, true);
    $('#pg-next').onclick = goEnd;
    $('#pg-skip').onclick = goEnd; };
  const go2 = () => { showModal(scr2, true);
    $('#pg-next').onclick = go3;
    $('#pg-skip').onclick = goEnd; };
  $('#pg-next').onclick = go2;
  $('#pg-skip').onclick = goEnd;
}
function endPrologue(){
  closeModal(true);
  if(!S.flags.prologueDone) spawnKarlMission();  /* R2：卡尔遗单入板（仅序章首次收尾） */
  S.flags.prologueDone = true;
  log(TEXT.st_prologue_done_log, 'gold');
  renderAll(); save();
  /* 起名（用户 09-19 拍板）：序章收尾后弹出代号登记（showNameRegistration 定义在 main.js） */
  if(typeof showNameRegistration === 'function' && !S.flags.nameChosen) setTimeout(showNameRegistration, 500);
}

function showMemorial(){
  const tabs = ['编年史档案','武器图鉴','饰品陈列柜','成就墙'];
  const tab = S.memorialTab || 0;
  let body = '';
  if(tab === 0){
    CHRONICLE.nodes.forEach(n => {
      const reached = gameDay() >= n.day;
      body += '<div class="drow"><span class="dlabel" style="color:'+(reached?'var(--amber)':'var(--dim)')+'">'+(reached?'★':'☆')+' D'+n.day+' · '+n.name+'</span><span class="dvalue">'+(reached?L('已到达'):'D'+n.day)+'</span></div>';
    });
    body += '<div class="note" style="margin-top:6px">'+L('今日：D')+gameDay()+' · '+dateOfStr(gameDay())+L('（终点 D2316，之后转无尽）')+'</div>';
  } else if(tab === 1){
    Object.keys(WEAPON_SET).forEach(cls => {
      body += '<div class="note" style="margin:6px 0 2px;color:var(--teal)">'+L(CLASSES[cls].name)+'</div>';
      ['main','off'].forEach(pool => {
        WEAPON_SET[cls][pool].forEach((wid,i)=>{
          const unlocked = i < S.licenses[cls];
          const lv = unlocked ? (S.wlv[cls][wid]||0) : 0;
          let modTxt = '';
          if(unlocked){
            const eq = pool === 'main' ? equippedModFor(cls) : equippedOffModFor(cls);
            const slotIdx = pool === 'main' ? S.slot[cls].main : S.slot[cls].off;
            if(eq && slotIdx === i) modTxt = ' ·'+L('【')+L(eq)+' '+(eq.tier||'')+L('】');
          }
          body += '<div class="drow"'+(unlocked?'':' style="opacity:.45"')+'>'+
            '<img class="cicon" src="'+WICONS[cls][pool][i]+'">'+
            '<span class="dlabel">'+(unlocked?weaponZh(wid):'🔒 '+weaponZh(wid))+'</span>'+
            '<span class="dvalue">'+(unlocked ? 'Lv.'+lv+'/5'+modTxt : L('未解锁'))+'</span></div>';
        });
      });
    });
  } else if(tab === 2){
    const owned = Object.keys(S.trinkets||{});
    if(!owned.length) body = '<div class="note">'+L('陈列柜空空如也——深潜与节日战役会掉落饰品。')+'</div>';
    owned.forEach(id => {
      const t = TRINKET_INDEX[id];
      if(!t) return;
      body += '<div class="drow"><img class="cicon" src="assets/trinkets/'+t.id+'.png"><span class="dlabel">'+L(t)+'</span><span class="dvalue">×'+(S.trinkets[id]||1)+'</span></div>';
    });
  } else {
    ACHIEVEMENTS.forEach(a => {
      const got = S.achievements[a.id];
      body += '<div class="drow"><span class="dlabel" style="color:'+(got?'var(--gold)':'var(--dim)')+'">'+(got?'★':'☆')+' '+L(a.name)+' <span class="note">['+L(a.grp)+']</span></span><span class="dvalue">'+(got?L('已达成'):'')+'</span></div>';
    });
  }
  const tabBtns = tabs.map((t,i) => '<button class="btn'+(i===tab?' pri':'')+'" style="flex:1;font-size:11px;padding:4px 2px" onclick="S.memorialTab='+i+';showMemorial()">'+L(t)+'</button>').join('');
  showModal('<h3 style="color:var(--amber)">'+L('🏛 纪念堂')+'</h3><div class="row" style="margin:8px 0">'+tabBtns+'</div>'+
    '<div style="max-height:55vh;overflow-y:auto;margin:6px 0;">'+body+'</div>'+
    '<button class="btn pri" style="width:100%" onclick="closeModal(true)">'+L('关闭')+'</button>', false);
}
function showDifficulty(){
  const D = S.difficulty;
  const presets = [['危1',{hz:1,nitra:1,ev:1,morale:1,yield:1,market:1}],['危2',{hz:1.2,nitra:1,ev:1,morale:1,yield:1,market:1}],['危3',{hz:1.5,nitra:1,ev:1.2,morale:1.2,yield:1,market:1}],['危4',{hz:2,nitra:1.2,ev:1.5,morale:1.5,yield:1.2,market:1.3}],['危5',{hz:3,nitra:1.5,ev:2,morale:2,yield:1.5,market:1.5}]];
  const defs = [
    ['hz','危险系数',0.5,3,0.1],['nitra','硝石消耗',0.5,3,0.1],['ev','事件频率',0.5,3,0.1],
    ['morale','士气衰减',0.5,2,0.1],['yield','产出倍率',0.5,3,0.1],['market','市场波动',0.5,2,0.1],
  ];
  let html = '<h3 style="color:var(--amber)">'+L('⚙ 自定义难度终端')+'</h3>';
  html += '<div class="row" style="flex-wrap:wrap;gap:4px">' + presets.map((p,i)=>'<button class="btn" style="flex:1;font-size:11px;padding:3px 2px" data-dpre="'+i+'">'+L(p[0])+'</button>').join('') + '</div>';
  defs.forEach(d => {
    const v = D[d[0]] || 1;
    html += '<div class="row" style="margin:8px 0 2px"><span style="flex:1">'+L(d[1])+'</span><b style="color:var(--amber)" id="dv-'+d[0]+'">×'+v.toFixed(1)+'</b></div>'+
      '<input type="range" min="'+d[2]+'" max="'+d[4]+'" step="'+d[3]+'" value="'+v+'" style="width:100%" data-dkey="'+d[0]+'">';
  });
  html += '<div class="note" style="margin:8px 0">'+L('难度越高产出越高（产出滑条自我平衡）。改动即时生效并入档。')+'</div>'+
    '<button class="btn pri" style="width:100%" onclick="closeModal(true)">'+L('完成')+'</button>';
  showModal(html, false);
  $('#modal-box').querySelectorAll('[data-dkey]').forEach(inp => {
    inp.oninput = () => {
      S.difficulty[inp.dataset.dkey] = parseFloat(inp.value);
      const dv = $('#modal-box').querySelector('#dv-'+inp.dataset.dkey);
      if(dv) dv.textContent = '×' + parseFloat(inp.value).toFixed(1);
      save();
    };
  });
  $('#modal-box').querySelectorAll('[data-dpre]').forEach(btn => {
    btn.onclick = () => {
      const p = presets[parseInt(btn.dataset.dpre)];
      if(p && p[1]) S.difficulty = Object.assign({}, p[1]);
      showDifficulty();
    };
  });
}

function showDetail(title, rows){
  let html = '<h3 style="color:var(--amber)">' + title + '</h3>';
  (rows || []).forEach(r => {
    html += '<div class="drow">'
      + (r.icon ? '<img class="cicon" src="assets/icons/' + r.icon + '.png">' : '')
      + '<span class="dlabel">' + r.label + '</span>'
      + '<span class="dvalue">' + r.value + '</span></div>';
  });
  html += '<button class="btn pri" style="width:100%;margin-top:8px" onclick="closeModal(true)">'+L('关闭')+'</button>';
  showModal(html, false);
}
function minerDetail(m){
  const need = m.lv * 30;
  const st = m.state === 'idle' ? L('空闲')
    : m.state === 'mission' ? L('任务中')
    : L('医疗站（剩余 ') + Math.max(0, Math.ceil(m.medUntil - S.gm)) + L(' 游戏分钟）');
  const dep = S.deps.find(x => x.minerIds.includes(m.id));
  const depTxt = dep ? (L(mtypeById(dep.m.type)) + L('【') + L(biomeById(dep.m.biome)) + L('】剩余 ') + Math.ceil(Math.max(0, dep.dur - dep.done)) + L(' 游戏分')) : '—';
  const cls = CLASSES[m.cls];
  showDetail(minerName(m), [
    {label:L('等级'), value:'Lv.' + m.lv + L('（XP ') + Math.floor(m.xp) + '/' + need + L('）')},
    {label:L('职业 / 凭证'), value:L(cls.name) + ' · Lv.' + S.licenses[m.cls]},
    {label:L('任务次数'), value:m.missions + L(' 次')},
    {label:L('晋升'), value:(frameOf(m.stars)?L(frameOf(m.stars)):'') + L('（产出加成 +') + (m.stars*8) + L('%）')},
    {label:L('士气'), value:m.morale + '/100'},
    {label:L('状态'), value:st},
    {label:L('当前派遣'), value:depTxt},
  ]);
}

