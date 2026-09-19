'use strict';
/* ---------------- MISSION BOARD ---------------- */
function genMission(typeId){
  const pool = unlockedBiomes();
  const b = pick(pool);
  const types = MTYPES.filter(x=>S.rigLv >= (x.rig||1));
  const t = (typeId && types.find(x=>x.id===typeId)) || pick(types);
  const hzMax = clamp(1 + Math.floor(S.rigLv/2), 1, 5);
  const hazard = irnd(1, hzMax);
  const mul = CFG.HAZ[hazard-1] * rnd(0.9, 1.15) * (1 + 0.1*(b.tier-1));
  const r = {};
  Object.entries(t.r).forEach(([k,v]) => {
    r[k] = k==='morkite' ? Math.round(v * CFG.HAZ[hazard-1] * (1+0.1*(b.tier-1)) * rigYield() * rnd(0.9,1.15))
         : Math.round(v * mul);
  });
  let clause = null;
  if(Math.random() < 0.3){
    clause = pick([
      {id:'gold2',   name:'富金矿脉', d:'黄金产出 ×2'},
      {id:'night',   name:'夜班赶工', d:'代币 +20%，时长 +10%'},
      {id:'thin',    name:'轻装上阵', d:'硝石消耗 ×1.5，全部产出 +20%'},
    ]);
  }
  const trit = Math.random() < 0.14;
  return {id:'ms'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
          biome:b.id, type:t.id, hazard, r, clause, trit,
          min: Math.round(t.min * rnd(0.92,1.08) * (trit?1.25:1))};
}
function genBoard(){
  S.board = [genMission('exp')];
  for(let i=1;i<6;i++) S.board.push(genMission());
  S.boardAt = S.gm;
}

/* ---------------- DISPATCH ---------------- */
function missionDur(m, hc, modEff){
  const dur = m.min * (1 + 0.15*(m.hazard-1)) * CFG.HC_FAC[hc-1] * (m.clause && m.clause.id==='night' ? 1.1 : 1)
            * (1 + ((modEff && modEff.duration) || 0)/100);
  return Math.max(60, Math.round(dur));
}
function dispatchCost(m, hc, modEff, dur){
  const durFactor = (dur || 240) / 240;   /* B 设计：硝石随时长走（基准 240 游戏分） */
  return Math.round(60 * hc * durFactor * (m.clause && m.clause.id==='thin' ? 1.5 : 1) * (1 + ((modEff && modEff.supplyCost) || 0)/100));
}

function openDispatch(mid){
  const m = S.board.find(x=>x.id===mid); if(!m) return;
  const t = mtypeById(m.type);
  const idle = S.miners.filter(x=>x.state==='idle' && x.morale>=25);
  const defaultMinerId = idle.length ? idle[0].id : '';
  let html = '<h3 style="color:var(--amber)">'+L(t)+' · '+L(biomeById(m.biome))+'</h3>';
  html += '<div class="note">'+L('危险等级 ')+'★'.repeat(m.hazard)+L('　报酬系数 ×')+CFG.HAZ[m.hazard-1]+'</div>';
  html += '<div class="meta">'+L('产出：')+Object.entries(m.r).map(([k,v])=>'<span class="costchip">'+(resIcon(k)==='◈'?'◈':resIcon(k))+'<b>'+v+'</b></span>').join('')+(m.clause?'<span class="costchip" title="'+m.clause.name+'：'+m.clause.d+'">⚠ '+m.clause.name+'</span>':'')+'</div>';
  html += '<h3 class="sec">'+L('选择出勤矿工')+'</h3>';
  if(!S.miners.length){
    html += '<div class="note">'+L('名册中没有矿工，请先招募矿工。')+'</div>';
  } else if(!idle.length){
    html += '<div class="note">'+L('当前没有可派遣矿工；任务中、医疗中或士气低于 25 的矿工不能出勤。')+'</div>';
  }
  html += '<div class="dispatch-miner-list">';
  S.miners.forEach(mn=>{
    const ready = mn.state==='idle' && mn.morale>=25;
    const fit = mn.cls===t.best ? L(' · 任务适配') : '';
    const stateText = mn.state==='mission' ? L('任务中') : mn.state==='med' ? L('医疗中') : mn.morale<25 ? L('士气过低') : L('可派遣');
    html += '<label class="dispatch-miner-option'+(ready?'':' is-disabled')+'">'+
      '<input type="checkbox" data-miner="'+mn.id+'" '+(mn.id===defaultMinerId?'checked':'')+' '+(ready?'':'disabled')+'>'+
      '<span class="dispatch-miner-copy"><b>'+minerName(mn)+' · '+L(CLASSES[mn.cls].name)+' Lv.'+mn.lv+'</b>'+
      '<span>'+stateText+L(' · 士气 ')+mn.morale+'/100'+fit+'</span></span></label>';
  });
  html += '</div>';
  const capN = hcCap();
  html += '<div class="note" id="dp-cap">'+L('已默认选择首名可用矿工；小队上限 ')+capN+L(' 人。')+'</div>';
  html += '<div class="meta" id="dp-summary"></div>';
  html += '<button class="btn pri" id="dp-go" style="width:100%" disabled>'+L('派遣')+'</button>';
  showModal(html);
  const update = () => {
    let ids = [...$('#modal-box').querySelectorAll('input[data-miner]:checked')].map(x=>x.dataset.miner);
    if(ids.length > hcCap()){
      ids = ids.slice(0, hcCap());
      $('#modal-box').querySelectorAll('input[data-miner]:checked').forEach(x=>{
        if(!ids.includes(x.dataset.miner)) x.checked = false;
      });
    }
    const hc = ids.length;
    const modEff = squadModEffects(ids);
    let dur = missionDur(m, hc, modEff);
    if(S.nextDurMul) dur = Math.max(60, Math.round(dur * S.nextDurMul));   /* 预览含小猫 -10%（实际派遣时消耗） */
    if(S.mode === 'rush'){ dur = Math.max(6, Math.round(dur / 30)); }
    let pCost = dispatchCost(m, hc, modEff, dur);
    if(S.mode === 'rush'){ pCost = Math.round(dispatchCost(m, hc, modEff, Math.max(60, Math.round(dur * 30))) * 4); }
    else { pCost = dispatchCost(m, hc, modEff, dur); }
    const cost = pCost;
    const fitN = ids.filter(id => { const mm = S.miners.find(x=>x.id===id); return mm && mm.cls===t.best; }).length;
    const fitTxt = fitN ? (L('　适配矿工 ×')+fitN+L('（产出 +')+(fitN*8)+L('%）')) : '';
    const modTxt = (modEff.duration || modEff.supplyCost || modEff.yield || modEff.eventSuccess) ?
      (L('　模组：')+effectText(modEff)) : '';
    const short = Math.max(0, cost - Math.floor(S.nitra));
    const loanFee = Math.round(short * 3);
    const loanTxt = short > 0 ? (L('　⚠ 硝石缺口 ')+short+L('，可赊账（记账 ')+loanFee+L(' 代币）')) : '';
    $('#dp-summary').innerHTML = hc === 0 ? L('至少选择 1 名矿工。')
      : (L('小队 ')+hc+L(' 人　用时约 ')+fmtDur(dur)+L('　补给 -')+cost+L(' 硝石（持有 ')+Math.floor(S.nitra)+L('）')+fitTxt+modTxt+loanTxt);
    const go = $('#dp-go');
    go.dataset.ids = ids.join(',');
    go.dataset.fit = String(fitN);
    go.dataset.loan = String(short);
    if(hc === 0){ go.disabled = true; go.textContent = L('派遣'); return; }
    if(short > 0){
      go.disabled = S.credits < loanFee;
      go.textContent = go.disabled ? L('硝石不足') : L('赊账派遣（补 ')+loanFee+L(' 代币）');
    } else {
      go.disabled = false;
      go.textContent = L('派遣');
    }
  };
  $('#modal-box').querySelectorAll('input[data-miner]').forEach(x=>{ x.onchange = update; });
  update();
  $('#dp-go').onclick = () => {
    const ids = $('#dp-go').dataset.ids.split(',').filter(Boolean);
    doDispatch(m, ids, parseInt($('#dp-go').dataset.fit || '0'), $('#dp-go').dataset.loan);
  };
}
function doDispatch(m, ids, fitN, loanStr){
  const hc = ids.length;
  const modEff = squadModEffects(ids);
  /* 酒吧 v2 抽酒制：派遣出发前白送一轮酒；「再抽一轮」的结果也在本派遣生效 */
  if(!S.activeDrinkBuff){
    S.activeDrinkBuff = rollDrink();
    const db0 = S.activeDrinkBuff;
    log(L('🍻 出发酒：「') + L(db0.dname) + L('」（') + L(db0.rarity) + L('）') + L(db0.txt) + L('。'), db0.bad ? 'bad' : 'sys');
    applyDrinkImmediate(db0);
  }
  let drinkShield = 0, morkiteBuff = 1, durMulD = 1, evSuccD = 0, rareBoostD = 0, checkTD = 0, xpPerD = 0, autoEventsD = false;
  const db = S.activeDrinkBuff;
  if(db){
    if(db.yield) modEff.yield = (modEff.yield||0) + db.yield;
    if(db.medBill) modEff.medBill = (modEff.medBill||0) + db.medBill;
    if(db.shield) drinkShield = db.shield;
    if(db.morkite) morkiteBuff = 1 + db.morkite/100;
    if(db.durMul) durMulD = db.durMul;
    if(db.evSucc) modEff.eventSuccess = (modEff.eventSuccess||0) + db.evSucc;
    if(db.rareBoost) rareBoostD = db.rareBoost / 100;
    if(db.checkT) modEff.checkT = (modEff.checkT||0) + db.checkT;
    if(db.xpPer) xpPerD = db.xpPer;
    if(db.autoEvents) autoEventsD = true;
    S.activeDrinkBuff = null;
  }
  let dur = missionDur(m, hc, modEff);
  if(S.nextDurMul){ dur = Math.max(60, Math.round(dur * S.nextDurMul)); S.nextDurMul = null; }   /* 黑脸小猫 A 选项：下次派遣 -10% */
  if(durMulD !== 1){ dur = Math.max(60, Math.round(dur * durMulD)); }   /* 酒吧：隧道老鼠 -10% / 特浓黑啤 +20% */
  if(S.mode === 'rush'){ dur = Math.max(6, Math.round(dur / 30)); }   /* 急行：时长 ÷30，10 秒级 */
  let cost = dispatchCost(m, hc, modEff, dur);
  /* 数值复核：急行派遣费按原始时长算（÷30 前的），否则 ×4 乘在已缩短的时长上=急行免费+倒赚硝石 */
  if(S.mode === 'rush'){ cost = Math.round(dispatchCost(m, hc, modEff, Math.max(60, Math.round(dur * 30))) * 4); }
  cost = Math.round(cost * ((S.difficulty && S.difficulty.nitra) || 1));
  if(S.nitra >= cost){
    S.nitra -= cost;
  } else {
    /* 赊账派遣：3:1 利率，代币扣到零为止（集团记账，不会真让你闲着） */
    const short = cost - Math.floor(S.nitra);
    const fee = Math.round(short * 3);
    S.credits = Math.max(0, S.credits - fee);
    S.nitra = 0;
    log(TEXT.log_nitra, 'bad');
  }
  ids.forEach(id => { const mn = S.miners.find(x=>x.id===id); if(mn) mn.state = 'mission'; });
  const names = ids.map(id => minerName(S.miners.find(x=>x.id===id))).join('、');
  S.deps.push({id:'d'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    mid:m.id, m, cls:'mixed', fitN:fitN||0, hc, minerIds:ids, modEff, drinkShield, morkiteBuff,
    start:S.gm, dur, done:0, evt1:false, evt2:false, paused:null, bonus:1,
    rareBoost:(rareBoostD||0), xpPer:(xpPerD||0), autoEvents:autoEventsD, mode:(S.mode||'idle'), nitraSpent:cost});
  S.board = S.board.filter(x=>x.id!==m.id);
  log(L(mtypeById(m.type))+L('【')+L(biomeById(m.biome))+L('】派遣 ')+hc+L(' 人小队（')+names+L('），预计 ')+fmtDur(dur)+L('。'), '');
  /* 社区彩蛋（B 设计 ev_lcyf166）：执勤护送（非深潜）派遣开始时 30% 概率到访 */
  const dep0 = S.deps[S.deps.length-1];
  if(m.type === 'escort' && !dep0.isDive && Math.random() < 0.3) startEvent(dep0, 'lcyf166');
  closeModal(true); renderAll(); save();
}
function teamPower(d){
  let p = 0;
  const best = d.m ? mtypeById(d.m.type).best : '';
  d.minerIds.forEach(id=>{
    const m = S.miners.find(x=>x.id===id); if(!m) return;
    p += CLASSES[m.cls].combat * (1 + 0.22*(m.lv-1) + 0.35*(S.licenses[m.cls]-1)) * (1 + 0.08*(m.stars||0)) * (m.cls===best ? 1.15 : 1);
    if(S.wlv && S.wlv[m.cls]){ ensureWeaponV2(); p *= 1 + 0.03*(((S.wlv[m.cls][currentWeaponId(m.cls)]||0)) + ((S.wlv[m.cls][offWeaponId(m.cls)]||0))); }
  });
  p *= (1 + 0.12*(d.hc-1));
  const team = d.minerIds.map(id=>S.miners.find(x=>x.id===id)).filter(Boolean);
  const avgM = team.reduce((a,x)=>a+x.morale,0)/Math.max(1,team.length);
  if(avgM >= 70) p *= 1.1;
  if(avgM < 30) p *= 0.7;
  return p;
}
function maybeEvent(d, ratio){
  if(d.paused) return;
  if(S.difficulty && (S.difficulty.ev||1) !== 1 && Math.random() > (S.difficulty.ev||1)) return;
  if(ratio >= 0.4 && !d.evt1){ d.evt1 = true; rollEvent(d, 1); }
  else if(ratio >= 0.7 && !d.evt2){ d.evt2 = true; rollEvent(d, 2); }
  else if(ratio >= 0.85 && !d.evt3 && d.finaleBoss){ d.evt3 = true; rollEvent(d, 3); }
  /* 社区梗事件槽：35% 概率独立追加（确定性二选一） */
  if(ratio >= 0.55 && !d.memeDone && Math.random() < MEME_EVENTS.slotChance){
    d.memeDone = true;
    rollMemeEvent(d);
  }
}
function rollMemeEvent(d){
  const pool = MEME_EVENTS.pool.filter(p => {
    if(p.require === 'escort') return d.m.type === 'escort';
    if(p.require === 'bar') return S.fac.bar >= 1;
    return true;
  });
  const total = pool.reduce((a,x)=>a+x.w, 0);
  let r = Math.random()*total, picked = pool[0];
  for(const x of pool){ r -= x.w; if(r <= 0){ picked = x; break; } }
  startMemeEvent(d, picked.id);
}
function startMemeEvent(d, id){
  /* id 形如 ev_mushroom（MEME_EVENTS.pool 原样），TEXT 键 = id+'_'+后缀，勿再拼 ev_ 前缀 */
  d.paused = {id: 'meme_' + id, meme: true, memeId: id};
  const biome = biomeById(d.m.biome).name;
  const T = (typeof TEXT !== 'undefined') ? TEXT : {};
  const title = T[id+'_title'] || L('奇怪的事件');
  const desc = T[id+'_desc'] || '';
  const aBtn = T[id+'_a_btn'] || L('选项 A');
  const bBtn = T[id+'_b_btn'] || L('选项 B');
  /* 头图：ev_doretta 用场景立绘，其余按事件 id 取 C 二期 meme_* 头图 */
  const animPre = (id === 'ev_doretta') ? animDiv('doretta_head', 100, 70) : animDiv(id.replace(/^ev_/, 'meme_'), 288, 96);
  let html = animPre + desc;
  if(!S.flags.memeSeen){
    S.flags.memeSeen = true;
    html += '<div class="note">'+L('【首次提示】社区怪谈事件没有失败判定——两个选项都只是口味问题，放心选。')+'</div>';
  }
  const opts = '<button class="opt btn pri" data-c="memeA">'+aBtn+'</button>'+
               '<button class="opt btn" data-c="memeB">'+bBtn+'</button>';
  d.paused.html = html; d.paused.opts = opts;
  log('【'+title+'】'+String(desc).replace(/<[^>]+>/g,''), '');
  if($('#modal').style.display === 'flex' && $('#modal-box').dataset.dep === d.id) return;
  showEventModal(d);
}
function nitroTag(n){ return (S.mode||'idle') === 'rush' ? ' <span class="nitra-tag">' + TEXT.dm_nitra_tag.replace('{n}', n) + '</span>' : ''; }
function nitroDis(n){ return ((S.mode||'idle') === 'rush' && S.nitra < n) ? ' disabled' : ''; }
function eventNitroAdjust(d, base){
  /* 时长类选项的硝石调整：急行=按价目付费；挂机=返还派遣硝石 50% */
  if(d.mode === 'rush'){
    S.nitra = Math.max(0, S.nitra - base);
    return TEXT.dm_nitra_short.replace('{n}', base);
  }
  const refund = Math.round((d.nitraSpent || 0) * 0.5);
  if(refund > 0){ S.nitra += refund; return TEXT.dm_idle_refund.replace('{n}', refund); }
  return '';
}
function autoResolveEvent(d){
  if(!d.paused) return;
  const p = d.paused;
  const c = p.meme ? 'memeA' : ({swarm:'hold', rich:'stay', leech:'save', break:'fast', elite:'fight', cat:'catA', lcyf166:'lcyfA'})[p.id];
  if(S.autoUntil && Date.now() < S.autoUntil){
    const R = S.idleReport || (S.idleReport = {credits:0, missions:0, morkite:0, moil:0, nitra:0, rare:{}, events:0, med:0});
    R.events++;
  }
  if(c) resolveEvent(d, c);
}
function rollEvent(d, idx){
  const evW = (d.modEff && d.modEff.evW) || null;   /* 深潜修正器：事件权重修正（B 退回项） */
  const deck = [
    {id:'swarm', w:3}, {id:'rich', w:2}, {id:'leech', w: d.minerIds.length ? 2 : 0},
    {id:'break', w:1.5}, {id:'elite', w: d.m.hazard>=3 ? 1.2 : 0},
    {id:'cat', w:3},   /* 黑脸小猫参上（B 设计 ev_cat）：与五类事件同池，权重 +3 */
  ];
  if(evW) deck.forEach(x => { x.w *= evW[x.id] || 1; });
  const total = deck.reduce((a,x)=>a+x.w,0);
  let r = Math.random()*total, ev = deck[0];
  for(const x of deck){ r -= x.w; if(r <= 0){ ev = x; break; } }
  startEvent(d, ev.id);
}
function startEvent(d, id){
  d.paused = {id};
  const biome = biomeById(d.m.biome).name;
  const HZ = CFG.HAZ[d.m.hazard-1];
  const eliteEB = (S.elite && S.elite.carry === 'spotter') ? 10 : (S.elite && S.elite.carry === 'slicer') ? 10 : 0;
  const eliteCB = (S.elite && S.elite.carry === 'slicer') ? 15 : 0; /* 切割者战斗额外加成 */
  let html = '', opts = '';
  if(id === 'swarm'){
    const p0 = clamp(teamPower(d) / (teamPower(d) + 1.5*HZ), 0.05, 0.98);
    const es = ((d.modEff && d.modEff.eventSuccess) || 0) + eliteEB + eliteCB;
    /* 检定加成：深潜修正器 checkT 直接加到成功率（B 退回项） */
    const ct = (d.modEff && d.modEff.checkT) || 0;
    const p = clamp(p0 + es/100 + ct, 0.05, 0.98);
    d.paused.p = p;
    html = animDiv('swarm_banner', 240, 80) + animDiv('evt_swarm', 288, 96) + TEXT.ev_swarm_desc;
    opts = '<button class="opt btn pri" data-c="hold">'+TEXT.ev_swarm_a_btn+L('（成功概率 ')+(p*100).toFixed(0)+L('%：奖励 +20%，士气 +10；失败：1 人重伤入院，任务继续）')+'</button>'+
           '<button class="opt btn" data-c="bunker"'+nitroDis(100)+'>'+TEXT.ev_swarm_b_btn+L('（无风险，任务时长 +25%）')+nitroTag(100)+'</button>';
  } else if(id === 'rich'){
    html = animDiv('evt_rich', 288, 96) + TEXT.ev_richvein_desc;
    opts = '<button class="opt btn pri" data-c="stay"'+nitroDis(120)+'>'+TEXT.ev_richvein_a_btn+L('（主矿物 ×1.6，稀有掉落 +50%，时长 +30%）')+nitroTag(120)+'</button>'+
           '<button class="opt btn" data-c="leave">'+TEXT.ev_richvein_b_btn+L('（额外 +30 代币勘测报偿）')+'</button>';
  } else if(id === 'leech'){
    const victim = pick(d.minerIds);
    d.paused.victim = victim;
    const HZv = CFG.HAZ[d.m.hazard-1];
    d.paused.bill = Math.round(250*HZv);
    d.paused.heal = Math.round(90*HZv);
    html = animDiv('evt_leech', 288, 96) + TEXT.ev_leech_desc.replace('{miner}', minerName(S.miners.find(x=>x.id===victim)));
    opts = '<button class="opt btn pri" data-c="save"'+nitroDis(80)+'>'+TEXT.ev_leech_a_btn+L('（任务时长 +20%，无伤归队，全队士气 +5）')+nitroTag(80)+'</button>'+
           '<button class="opt btn warn" data-c="delay">'+TEXT.ev_leech_b_btn+L('（重伤入院：账单 ')+d.paused.bill+L(' 代币 + 休养 ')+d.paused.heal+L(' 游戏小时；全队士气 -15；任务继续）')+'</button>';
  } else if(id === 'break'){
    html = animDiv('evt_break', 288, 96) + TEXT.ev_breakdown_desc;
    opts = '<button class="opt btn pri" data-c="fast">'+TEXT.ev_breakdown_a_btn+L('（-')+Math.round(80*HZ)+L(' 代币，时长 +5%）')+'</button>'+
           '<button class="opt btn warn" data-c="slow"'+nitroDis(80)+'>'+TEXT.ev_breakdown_b_btn+L('（免费，时长 +20%，')+[10,15,20,25,30][d.m.hazard-1]+L('% 概率 1 人轻伤）')+'</button>';
  } else if(id === 'elite'){
    const p0 = clamp(teamPower(d) / (teamPower(d) + 2.0*HZ), 0.05, 0.98);
    const es = ((d.modEff && d.modEff.eventSuccess) || 0) + eliteEB + eliteCB;
    /* 检定加成：深潜修正器 checkT 直接加到成功率（B 退回项） */
    const ct = (d.modEff && d.modEff.checkT) || 0;
    const p = clamp(p0 + es/100 + ct, 0.05, 0.98);
    d.paused.p = p;
    html = animDiv('evt_elite', 288, 96) + TEXT.ev_elite_desc;
    opts = '<button class="opt btn pri" data-c="fight">'+TEXT.ev_elite_a_btn+L('（成功概率 ')+(p*100).toFixed(0)+L('%：黄金 ×2 + 大量稀有矿物；失败：1 人轻伤，时长 +10%）')+'</button>'+
           '<button class="opt btn" data-c="avoid">'+TEXT.ev_elite_b_btn+L('（无事发生）')+'</button>';
  } else if(id === 'cat'){
    /* 黑脸小猫参上（B 设计 ev_cat）：A 讨好 / B 绕道走（记仇值系统） */
    const g = S.catGrudge || 0;
    html = animDiv('cat_face', 96, 96) + (TEXT.ev_cat_desc || '') +
      (g > 0 ? '<div class="note">'+L('（记仇值 ')+g+'/3'+(g>=3?L('——小猫已经在深潜简报上动笔了'):'')+L('）')+'</div>' : '');
    opts = '<button class="opt btn pri" data-c="catA">'+(TEXT.ev_cat_a_btn || L('递上小红糖'))+L('（全队士气 +15，下次派遣时长 -10%，记仇 -1）')+'</button>'+
           '<button class="opt btn" data-c="catB">'+(TEXT.ev_cat_b_btn || L('绕道走'))+L('（无事发生，记仇 +1）')+'</button>';
  } else if(id === 'lcyf166'){
    /* lcyf166 到访（B 设计 ev_lcyf166）：A 听他的 / B v他50（需双模组解锁） */
    const ownsCombo = (S.modsOwned && (S.modsOwned['lok1_explosive_chemical']||0) > 0 && (S.modsOwned['pgl_fat_boy']||0) > 0);
    const blessOn = S.flags.lcyf166_bless;
    html = animDiv('lcyf166_avatar', 96, 96) + (TEXT.ev_lcyf_desc || '') +
      (blessOn ? '<div class="note">'+L('（他的祝福已生效：工程师在队的虫潮，报酬 ×2）')+'</div>' : '');
    opts = '<button class="opt btn pri" data-c="lcyfA">'+(TEXT.ev_lcyf_a_btn || L('听他的'))+L('（本次任务时长 -50%）')+'</button>';
    if(ownsCombo){
      const canPay = S.credits >= 50;
      opts += '<button class="opt btn" data-c="lcyfB"'+(canPay && !blessOn ? '' : ' disabled')+'>'+(TEXT.ev_lcyf_b_btn || L('v他50'))+
        L('（-50 代币，永久：工程师在队时虫潮报酬 ×2、任务多耗 80 硝石）')+(blessOn ? L('——已 v 过') : (canPay ? '' : L('——代币不足')))+'</button>';
    } else {
      opts += '<div class="note">🔒 '+(TEXT.ev_lcyf_unlock_hint || '')+'</div>';
    }
  }
  d.paused.html = html; d.paused.opts = opts;
  const evTitle5 = {swarm:'ev_swarm_title', rich:'ev_richvein_title', leech:'ev_leech_title', break:'ev_breakdown_title', elite:'ev_elite_title'}[id];
  if(id === 'cat' || id === 'lcyf166'){
    const evT = {cat:'ev_cat', lcyf166:'ev_lcyf'}[id];
    log(L('【')+(TEXT[evT+'_title']||L('社区彩蛋'))+L('】')+String(html).replace(/<[^>]+>/g,''), '');
  } else {
    log(L('【警报】')+(evTitle5 ? TEXT[evTitle5] : L('派遣事件'))+L('【')+biome+L('】：')+html.replace(/<[^>]+>/g,''), 'bad');
  }
  if($('#modal').style.display === 'flex' && $('#modal-box').dataset.dep === d.id) return;
  showEventModal(d);
}
function showEventModal(d){
  const p = d.paused;
  $('#modal-box').dataset.dep = d.id;
  const evtIcon = {swarm:'evt_swarm', leech:'evt_leech', rich:'res_morkiteseed', break:'misc_matrix', elite:'evt_goldrush', cat:'misc_matrix', lcyf166:'misc_droppod'}[p.id] || 'misc_droppod';
  const html = '<h3 style="color:var(--amber)">'+ic(evtIcon,'wicon')+L(' ⚡ 派遣事件 · ')+L(biomeById(d.m.biome))+'</h3><p style="margin:8px 0">'+p.html+'</p>'+p.opts;
  showModal(html, true);
  $('#modal-box').querySelectorAll('[data-c]').forEach(btn=>{
    btn.onclick = () => resolveEvent(d, btn.dataset.c);
  });
}
function resolveEvent(d, c){
  if(!d.paused) return;   // 防重入：残留弹窗的重复点击直接忽略
  const p = d.paused;
  const HZ = CFG.HAZ[d.m.hazard-1];
  const team = d.minerIds.map(id=>S.miners.find(x=>x.id===id)).filter(Boolean);
  const hurt = (min) => {
    const m = S.miners.find(x=>x.id===min); if(!m) return;
    if(d.drinkShield > 0){
      d.drinkShield--;
      m.morale = clamp(m.morale + 4, 0, 100);
      log(minerName(m)+L(' 突进虫群却毫发无伤——红岩爆破手的酒劲还在。'), 'good');
      return;
    }
    const mbMul = 1 + ((d.modEff && d.modEff.medBill) || 0)/100;
    const guardianOn = S.elite && S.elite.carry === 'guardian';
    const gDisc = guardianOn ? 0.7 : 1;
    const bill = Math.round(250 * HZ * mbMul * gDisc * (1 - 0.1*S.fac.medbay));
    S.credits -= bill;
    m.state = 'med'; m.medUntil = S.gm + Math.round(90 * HZ * gDisc * (1 - 0.1*S.fac.medbay));
    S.stats.inj = (S.stats.inj||0) + 1;
    S.dayStats.injured = (S.dayStats.injured||0) + 1;
    d.medBillsPaid = (d.medBillsPaid||0) + bill;
    S.stats.billsTotal = (S.stats.billsTotal||0) + bill;   /* 清账行动基数 */
    d.hurtIds = (d.hurtIds||[]).concat(min);
    d.minerIds = d.minerIds.filter(x=>x!==min);
    if(d.isDive) diveHurtCheck(d);
    log(TEXT.med_notice.replace('{miner}', minerName(m)), 'bad');
    log(TEXT.med_bill.replace('{cost}', bill).replace('{days}', Math.max(1, Math.round((m.medUntil-S.gm)/1440)))+L('（')+(guardianOn?L('守护者折扣 -30%，'):'')+L('预计休养 ')+Math.round(90*HZ*gDisc*(1-0.1*S.fac.medbay)/60)+L(' 现实分钟）'), 'bad');
  };
  if(p.id === 'swarm'){
    if(c === 'hold'){
      if(Math.random() < p.p){
        /* lcyf166 的祝福（B 设计）：bless + 工程师在队 → 报酬 ×2、额外耗 80 硝石 */
        const blessOn = S.flags.lcyf166_bless && team.some(m => m.cls === 'engineer');
        if(blessOn){
          d.rewardBonus = (d.rewardBonus||1) * 2;
          S.nitra = Math.max(0, S.nitra - 80);
          team.forEach(m => { m.morale = clamp(m.morale+10,0,100); m.xp += 10 + (m.lv||1) * 2; });
          log(L('虫潮被顶回去了——lcyf166 的连锁核弹洗了地，报酬 ×2！代价：补给多烧掉 80 硝石。'), 'gold');
        } else {
          d.rewardBonus = (d.rewardBonus||1) * 1.2;
          team.forEach(m => { m.morale = clamp(m.morale+10,0,100); m.xp += 10 + (m.lv||1) * 2; });   /* 事件成功 +10 XP */
          log(TEXT.ev_swarm_a_win.replace('{miner}', minerName(pick(team))), 'good');
        }
      } else {
        const v = pick(d.minerIds); if(v) hurt(v, HZ);
        team.forEach(m => m.morale = clamp(m.morale-15,0,100));
        if(!d.minerIds.length) d.bonus = (d.bonus||1) * 0.3;
        log(TEXT.ev_swarm_a_fail, 'bad');
      }
    } else {
      d.dur += Math.round(d.dur * 0.25);
      log(TEXT.ev_swarm_b_result + eventNitroAdjust(d, 100), '');
    }
  } else if(p.id === 'rich'){
    if(c === 'stay'){
      d.mineralMul = (d.mineralMul||1) * 1.6;
      d.rareBoost = (d.rareBoost||0) + 0.5;
      d.dur += Math.round(d.dur * 0.3);
      log(TEXT.ev_richvein_a_win + eventNitroAdjust(d, 120), 'good');
    } else {
      S.credits += 30;
      log(TEXT.ev_richvein_b_result, '');
    }
  } else if(p.id === 'leech'){
    if(c === 'save'){
      d.dur += Math.round(d.dur * 0.2);
      team.forEach(m => m.morale = clamp(m.morale+5,0,100));
      log(TEXT.ev_leech_a_win.replace('{miner}', minerName(S.miners.find(x=>x.id===p.victim))) + eventNitroAdjust(d, 80), 'good');
    } else {
      hurt(p.victim, HZ);
      team.forEach(m => m.morale = clamp(m.morale-15,0,100));
      if(!d.minerIds.length) d.bonus = (d.bonus||1) * 0.5;
      log(TEXT.ev_leech_b_result.replace('{miner}', minerName(S.miners.find(x=>x.id===p.victim))), 'bad');
    }
  } else if(p.id === 'break'){
    if(c === 'fast'){
      const fee = Math.round(80*HZ); S.credits -= fee;
      d.dur += Math.round(d.dur * 0.05);
      log(TEXT.ev_breakdown_a_result, '');
    } else {
      d.dur += Math.round(d.dur * 0.2);
      const hcChance = [10,15,20,25,30][d.m.hazard-1] || 20;
      if(Math.random()*100 < hcChance){ const v = pick(d.minerIds); if(v) hurt(v, HZ); }
      log(TEXT.ev_breakdown_b_result + eventNitroAdjust(d, 80), '');
    }
  } else if(p.id === 'elite'){
    if(c === 'fight'){
      if(Math.random() < p.p){
        d.goldX2 = true;
        d.rareBonus = true;
        S.credits += Math.round(100*HZ);
        team.forEach(m => { m.morale = clamp(m.morale+10,0,100); m.xp += 10 + (m.lv||1) * 2; });   /* 事件成功 +10 XP */
        campProgress('elite', '', 1);
        holidayProgress('elite', 1);
        S.merit = (S.merit||0) + 1;
        log(TEXT.ev_elite_a_win, 'gold');
      } else {
        const v = pick(d.minerIds); if(v) hurt(v, HZ);
        d.dur += Math.round(d.dur * 0.1);
        log(TEXT.ev_elite_a_fail, 'bad');
      }
    } else {
      log(TEXT.ev_elite_b_result, '');
    }
  } else if(p.id === 'cat'){
    /* 黑脸小猫参上（B 设计 ev_cat）：A 讨好 / B 记仇 */
    S.flags.catSeen = true;
    if(c === 'catA'){
      team.forEach(m => m.morale = clamp(m.morale+15, 0, 100));
      S.nextDurMul = 0.9;   /* 下次派遣时长 -10%（doDispatch 消费） */
      S.catGrudge = Math.max(0, (S.catGrudge||0) - 1);
      S.flags.catPet = (S.flags.catPet||0) + 1;
      log(TEXT.ev_cat_a_result, 'good');
    } else {
      S.catGrudge = (S.catGrudge||0) + 1;
      log(TEXT.ev_cat_b_result, '');
      log(TEXT.ev_cat_grudge + ((S.catGrudge||0) >= 3 ? ' ' + TEXT.ev_cat_grudge_max : ''), '');
    }
  } else if(p.id === 'lcyf166'){
    /* lcyf166 到访（B 设计 ev_lcyf166）：A 时长砍半 / B v50 永久祝福 */
    if(c === 'lcyfA'){
      d.dur = Math.max(60, Math.round(d.dur * 0.5));
      log(TEXT.ev_lcyf_a_result, 'good');
    } else if(c === 'lcyfB'){
      S.credits -= 50;
      S.flags.lcyf166_bless = true;
      log(TEXT.ev_lcyf_b_result, 'gold');
    }
  } else if(p.meme){
    /* 社区梗事件：确定性效果（B-1 §7.2），结果文案取 TEXT */
    const T = (typeof TEXT !== 'undefined') ? TEXT : {};
    const id = p.memeId;
    const showRes = (key) => {
      const txt = T[id+'_'+key];
      if(txt) log(txt, '');
    };
    if(c === 'memeA'){
      showRes('a_result');
      switch(id){
        case 'ev_mushroom':   d.dur += Math.round(d.dur*0.2); team.forEach(m => m.morale = clamp(m.morale+12,10,100)); break;
        case 'ev_wererich':   d.dur += Math.round(d.dur*0.15); team.forEach(m => m.morale = clamp(m.morale+12,10,100)); d.rewardBonus = (d.rewardBonus||1)*1.05; break;
        case 'ev_barrel':     team.forEach(m => m.morale = clamp(m.morale+12,10,100)); d.rewardBonus = (d.rewardBonus||1)*0.95; break;
        case 'ev_tipc':       team.forEach(m => m.morale = clamp(m.morale+10,10,100)); S.credits -= 5*d.hc; break;
        case 'ev_leaflover':  d.dur = Math.max(60, Math.round(d.dur*0.85)); team.forEach(m => m.morale = clamp(m.morale-8,10,100)); break;
        case 'ev_doretta':    d.dur += Math.round(d.dur*0.25); team.forEach(m => m.morale = clamp(m.morale+15,10,100)); break;
        case 'ev_karlstory':  team.forEach(m => m.morale = clamp(m.morale+15,10,100)); d.dur += Math.round(d.dur*0.1); break;
        case 'ev_slogan':     team.forEach(m => m.morale = clamp(m.morale+10,10,100)); d.dur += Math.round(d.dur*0.1); break;
        case 'ev_molly':      d.dur += Math.round(d.dur*0.2); d.mineralMul = (d.mineralMul||1)*1.1; break;
        case 'ev_goldbug':    S.credits += Math.round(150*HZ); d.dur += Math.round(d.dur*0.15); break;
      }
    } else {
      showRes('b_result');
      switch(id){
        case 'ev_mushroom':   S.credits += Math.round(50*HZ); team.forEach(m => m.morale = clamp(m.morale-5,10,100)); break;
        case 'ev_wererich':   S.credits += Math.round(60*HZ); team.forEach(m => m.morale = clamp(m.morale-8,10,100)); break;
        case 'ev_barrel':     S.credits += Math.round(30*HZ); team.forEach(m => m.morale = clamp(m.morale-5,10,100)); break;
        case 'ev_tipc':       team.forEach(m => m.morale = clamp(m.morale-5,10,100)); break;
        case 'ev_leaflover':  team.forEach(m => m.morale = clamp(m.morale+15,10,100)); d.dur += Math.round(d.dur*0.1); break;
        case 'ev_doretta':    d.rewardBonus = (d.rewardBonus||1)*1.1; team.forEach(m => m.morale = clamp(m.morale-10,10,100)); break;
        case 'ev_karlstory':  team.forEach(m => m.morale = clamp(m.morale-8,10,100)); break;
        case 'ev_slogan':     d.rewardBonus = (d.rewardBonus||1)*1.08; team.forEach(m => m.morale = clamp(m.morale-12,10,100)); break;
        case 'ev_molly':      d.dur = Math.max(60, Math.round(d.dur*0.9)); if(Math.random() < 0.3){ const v = pick(d.minerIds); if(v) hurt(v, HZ); } break;
        case 'ev_goldbug':    team.forEach(m => m.morale = clamp(m.morale-4,10,100)); break;
      }
    }
  }
  d.paused = null;
  closeModal(true); renderAll(); save();
}

/* ---------------- SETTLEMENT ---------------- */
function settle(d, offline, forceMul){
  let team = d.minerIds.map(id=>S.miners.find(x=>x.id===id)).filter(Boolean);
  const m = d.m;
  const mul = (d.bonus||1) * (d.rewardBonus||1) * (forceMul||1);
  const clsFit = 1 + 0.08*(d.fitN||0);
  if(!team.length){
    /* 团灭处理：回溯者 > 空闲精英救援 > 无人机兜底（B-6 §3.4） */
    const wk = isoWeek();
    const retconOwned = (S.elite.owned||[]).includes('retcon');
    const idleElite = (S.elite.owned||[]).find(id => id !== S.elite.carry);
    if(retconOwned && S.elite.rewindWeek !== wk && d.hurtIds && d.hurtIds.length){
      /* 回溯者：整单回滚——重伤取消、账单全退、正常结算 */
      d.hurtIds.forEach(id => {
        const m2 = S.miners.find(x=>x.id===id);
        if(m2){ m2.state='idle'; m2.medUntil=0; d.minerIds.push(id); }
      });
      S.credits += (d.medBillsPaid||0);
      S.elite.rewindWeek = wk;
      log(L('⟲ 回溯者发动锚点：本次团灭已从时间线上划除，账单全免。本周回溯已用 1/1。'), 'gold');
      team = d.minerIds.map(id=>S.miners.find(x=>x.id===id)).filter(Boolean);
    } else if(idleElite){
      /* 精英救援：产出保 50%，账单退一半，治疗时长 -25% */
      const refund = Math.round((d.medBillsPaid||0) * 0.5);
      S.credits += refund;
      S.flags.wipeRescued = true;
      d.hurtIds.forEach(id => {
        const m2 = S.miners.find(x=>x.id===id);
        if(m2 && m2.state==='med') m2.medUntil = Math.max(S.gm, m2.medUntil - Math.round((m2.medUntil - S.gm) * 0.25));
      });
      const g = Math.round((m.r.credits||0) * 0.5);
      S.credits += g;
      S.stats.missions = (S.stats.missions||0) + 1;
      const en = ELITE_UNITS.units.find(x=>x.id===idleElite);
      log(L('🛡 团灭救援：【')+(en?L(en):L('精英'))+L('】把所有人从棺材价账单里捞了出来。产出保住 50%（+')+g+L(' 代币），账单退还 ')+refund+L('，治疗提速 25%。'), 'gold');
      S.kpi.done += 0;
      return;
    } else {
      const g = Math.round((m.r.credits||0) * 0.3);
      S.credits += g;
      S.stats.missions = (S.stats.missions||0) + 1;
      log((offline?L('【离线结算】'):'⚠ ')+L('任务中止：')+L(mtypeById(m.type))+L('【')+L(biomeById(m.biome))+L('】全员退出战斗序列，无人机只抢回了 ')+g+L(' 代币的矿袋。'), 'bad');
      S.kpi.done += 0;
      return;
    }
  }
  /* 深潜派遣：专用结算（阶段奖励+修正器+契合+失败规则），不走通用管线 */
  if(d.isDive){
    team.forEach(mn=>{
      mn.missions++;
      mn.xp += 60 + m.hazard * 15 + mn.lv * 2;   /* 执行单：深潜 60+h×15+lv×2 */
      while(mn.xp >= mn.lv*30 && mn.lv < 25){ mn.xp -= mn.lv*30; mn.lv++; }
      mn.morale = clamp(mn.morale + 4, 0, 100);
      mn.state = 'idle';
    });
    diveSettle(d);
    S.stats.missions = (S.stats.missions||0) + 1;
    return;
  }
  let gain = {credits:0, morkite:0, moil:0, nitra:0, gold:0};
  Object.entries(m.r).forEach(([k,v])=>{
    let x = v * mul * clsFit;
    if(k === 'morkite') x *= rigYield() * (1 + 0.1*(d.hc-1)) * (d.mineralMul||1) * (d.morkiteBuff||1);
    if(k === 'moil') x *= (d.mineralMul||1);
    if(k === 'gold' && d.goldX2) x *= 2;
    gain[k] = Math.round(x);
  });
  /* 公共副产物硝石：净收入保证为正，防止硝石死锁 */
  gain.nitra += Math.round((50 + 40*d.hc) * (0.8 + 0.2*m.hazard) * ((S.muleLv||1) >= 3 ? 1.5 : 1));   /* 矿骡 Lv3 超载运输：返还 +50% */
  /* 武器模组：产出加成 */
  const me = d.modEff || {};
  const yMul = 1 + (me.yield||0)/100;
  ['morkite','moil','gold'].forEach(k => { if(gain[k]) gain[k] = Math.round(gain[k]*yMul); });
  if((S.muleLv||1) >= 2 && gain.morkite){ gain.morkite = Math.round(gain.morkite * 1.2); }   /* 矿骡 Lv2 自动收集 */
  if(d.mode === 'rush'){
    gain.credits = Math.round(gain.credits * 0.35);
    gain.credits = Math.round(gain.credits * ((S.difficulty && S.difficulty.yield) || 1));
    gain.morkite = Math.round(gain.morkite * 0.35);
    if(gain.moil) gain.moil = Math.round(gain.moil * 0.35);
    if(gain.gold) gain.gold = Math.round(gain.gold * 0.35);
  }
  /* 战役钩子（修复：原在此处与下方各计一次，导致一次任务双计战役进度——只保留下方完整版） */
  S.credits += gain.credits; S.nitra += gain.nitra||0;
  S.morkite += gain.morkite; S.moil += gain.moil||0; S.gold += gain.gold||0;
  S.kpi.done += gain.morkite;
  /* （深潜阶段推进在 diveSettle 内处理；此处原有一段不可达的 isDive 残留块已删） */
  /* 稀有矿物副产物 */
  const b = biomeById(m.biome);
  const avgLv = team.length ? team.reduce((a,x)=>a+x.lv,0)/team.length : 1;
  const avgLic = team.length ? team.reduce((a,x)=>a+S.licenses[x.cls],0)/team.length : 1;
  const avgStars = team.length ? team.reduce((a,x)=>a+(x.stars||0),0)/team.length : 0;
  const scoutN = team.filter(x=>x.cls==='scout').length;
  const falconerB = (S.elite && S.elite.carry === 'falconer') ? 0.15 : 0;
  const dropP = clamp((0.45 + 0.04*avgLv + 0.08*(avgLic-1) + 0.06*avgStars + 0.1*scoutN + (me.rareDrop||0)/100 + falconerB + (d.rareBoost||0)) * (d.mode === 'rush' ? 0.6 : 1), 0, 0.95);
  const drops = [];
  let dropTotal = 0;
  if(d.rareBonus || Math.random() < dropP){
    const mm = pick(b.pair);
    const q = (d.rareBonus ? 2:1) + irnd(0,2) + Math.floor(avgLv/4);
    S.rare[mm] += q;
    drops.push(mm+'×'+q);
    dropTotal += q;
  }
  if(d.rareBonus){
    const mm2 = b.pair.find(x=>!drops[0] || !drops[0].startsWith(x));
    if(mm2){ const q2 = irnd(1,3); S.rare[mm2] += q2; drops.push(mm2+'×'+q2); dropTotal += q2; }
  }
  /* 战役钩子：任务/矿物/掉落 */
  campProgress('mission', m.type, 1);
  campProgress('biome', b.id, 1);
  campProgress('hazard', m.hazard, 1);
  campProgress('mineral', 'morkite', gain.morkite);
  campProgress('rare', '', dropTotal);
  S.dayStats.missions++;
  S.dayStats.credits += gain.credits;
  S.dayStats.morkite += gain.morkite;
  if(m.hazard >= 5 && !d.isDive){ gainMerit(1, L('危险 5 任务')); S.flags.hz5Done = true; }
  holidayProgress('missions', 1);
  if(d.m && d.m.trit){
    const n = 1 + (m.hazard >= 3 ? 1 : 0);
    S.blanks = (S.blanks||0) + n;
    log(TEXT.log_blanks.replace('{n}', n)+L(' 到装备终端的锻造台抽模组！'), 'gold');
  if(Math.random() < 0.25) awardRandomTrinket('饰品箱');  /* B-5：三提石饰品箱 25% */
  }
  /* 经验与士气 */
  team.forEach(mn=>{
    mn.missions++;
    mn.xp += 30 + m.hazard * 15 + mn.lv * 2;   /* 执行单：30+h×15+lv×2 */
    while(mn.xp >= mn.lv*30 && mn.lv < 25){ mn.xp -= mn.lv*30; mn.lv++; }
    mn.morale = clamp(mn.morale + 6, 0, 100);
    mn.state = 'idle';
  });
  if(me.morale) team.forEach(m => m.morale = clamp(m.morale + me.morale, 10, 100));
  S.stats.missions = (S.stats.missions||0) + 1;
  /* 终局 Boss：卡尔结局 */
  if(d.finaleBoss){
    if(S.campaign && CAMPAIGNS[S.campaign.ci] && CAMPAIGNS[S.campaign.ci].id === 'finale'){
      S.campaign.prog = 1;
      S.campaign.si++;
      S.campaign.prog = 0;
      if(S.campaign.si >= CAMPAIGNS[S.campaign.ci].steps.length){
        log(L('🏆 清账行动全部完成。编年史收官。'), 'gold');
        S.campaign.ci++; S.campaign.si = 0;
        S.flags.finaleDone = true;
      }
    }
    showModal('<h3 style="color:var(--gold)">'+L('🏆 清账行动 · 完成')+'</h3>'+
      '<div style="display:flex;gap:8px;align-items:flex-start;margin:10px 0">'+
      '<div class="wcell epic" style="width:60px;height:60px;"><img src="assets/anim/karl_silhouette.png" style="width:48px;height:48px;"></div>'+
      '<div class="note" style="flex:1;white-space:pre-line;line-height:1.7">'+TEXT.karl_finale_body+'</div></div>'+
      '<div class="note" style="margin:6px 0">'+L('Rock and Stone，管理层。17 号钻台的账本，从今天起是干净的。')+'</div>'+
      '<button class="btn pri" style="width:100%" onclick="closeModal(true);renderAll()">Rock and Stone</button>', true);
    log(L('🏆 清账行动完成。编年史收官——Day 2316 之后，无尽模式开启。'), 'gold');
  }
  if(!d.hurtIds || d.hurtIds.length === 0){ S.flags.streak = (S.flags.streak||0) + 1; }
  else { S.flags.streak = 0; }
  /* 托管收益面板：挂机券生效期间自动累计 */
  if(S.autoUntil && Date.now() < S.autoUntil){
    const R = S.idleReport || (S.idleReport = {credits:0, missions:0, morkite:0, moil:0, nitra:0, rare:{}, events:0, med:0});
    R.credits += gain.credits; R.missions++;
    R.morkite += gain.morkite||0; R.moil += gain.moil||0; R.nitra += gain.nitra||0;
    (drops||[]).forEach(x => { const nm = x.split('×')[0]; R.rare[nm] = (R.rare[nm]||0) + parseInt(x.split('×')[1]||1); });
    R.med += d.medBillsPaid || 0;
  }
  log((offline?L('【离线结算】'):'✅ ')+L('任务完成：')+L(mtypeById(m.type))+L('【')+L(b)+L('】 代币+')+gain.credits+
      L('，墨菱石+')+(gain.morkite||0)+(gain.moil?(L('，墨菱油+')+gain.moil):'')+(gain.gold?(L('，黄金+')+gain.gold):'')+
      (drops.length?(L('，稀有矿物：')+drops.join(L('、'))):''), 'good');
  /* 结算尾部趣味语（映射表 §十：egg_settle_1~5 随机抽 1） */
  if(!offline) log(TEXT['egg_settle_'+(1+Math.floor(Math.random()*5))], 'sys');
  /* 优化 #3：战利品逐条弹出 */
  if(!offline){
    const rows = [lootRowHTML('', L('代币'), '+'+fmt(gain.credits))];
    if(gain.morkite) rows.push(lootRowHTML('res_morkite', L('墨菱石'), '+'+fmt(gain.morkite)));
    if(gain.moil) rows.push(lootRowHTML('res_morkite', L('墨菱油'), '+'+fmt(gain.moil)));
    if(gain.gold) rows.push(lootRowHTML('res_gold', L('黄金'), '+'+fmt(gain.gold)));
    if(gain.nitra) rows.push(lootRowHTML('res_nitra', L('硝石'), '+'+fmt(gain.nitra)));
    (drops||[]).forEach(d=>{ const nm=d.split('×')[0]; rows.push(lootRowHTML('res_'+(MKEY[nm]||''), d, '+')); });
    showLootToast(rows);
  }
  /* 卡尔彩蛋 */
  if(!S.flags.karl && Math.random() < 0.02){
    S.flags.karl = true;
    S.flags.karlCount = (S.flags.karlCount||0) + 1;
    log(pick(NAMES_EGG), 'gold');
  }
}

/* 优化 #3：战利品 toast */
function lootRowHTML(icon, label, v){
  return '<span style="display:flex;align-items:center;gap:5px;">'+(icon?'<img class="cicon" src="assets/icons/'+icon+'.png">':'◈')+'<span>'+label+'</span><b style="color:var(--amber);margin-left:6px;">'+v+'</b></span>';
}
function showLootToast(rows){
  let t = document.getElementById('lootToast');
  if(!t){ t = document.createElement('div'); t.id = 'lootToast'; document.body.appendChild(t); }
  t.innerHTML = '<div class="note" style="margin-bottom:4px;">'+L('📦 战利品入库')+'</div>' + rows.map((r,i)=>'<div class="loot" style="animation-delay:'+(i*0.12)+'s">'+r+'</div>').join('');
  t.style.display = 'block';
  clearTimeout(showLootToast._tm);
  showLootToast._tm = setTimeout(()=>{ t.style.display = 'none'; }, 4500);
}
function renderFullLog(){
  const lg = document.getElementById('log');
  if(lg) lg.innerHTML = S.log.map(l=>'<div class="l '+l.c+'">['+l.t+'] '+l.m+'</div>').join('');
  const more = document.getElementById('log-more');
  if(more) more.remove();
}
/* ---------------- BGM 背景音乐系统（B-8） ---------------- */
const BGM = {
  audio: null, ctx: null, vol: 0.25, muted: true,
  tracks: { main: 'assets/audio/bgm_main.mp3', bar: 'assets/audio/bgm_bar.mp3' },
  icon(){ return this.muted ? '\u{1F507}' : '\u{1F3B5}'; },
  init(){
    try{ const saved = localStorage.getItem('drg_bgm_muted'); this.muted = saved === null ? true : saved === '1'; }catch(e){}
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.volume = this.vol;
    document.addEventListener('click', () => { if(!this.ctx) this.play('main'); }, { once: true });
    /* 多标签同步：别的标签改了静音，本页跟随（storage 事件只在非改动标签触发） */
    window.addEventListener('storage', e => {
      if(e.key !== 'drg_bgm_muted') return;
      const m = e.newValue === '1';
      if(m === this.muted) return;
      this.muted = m;
      if(m){ if(this.audio) this.audio.pause(); }
      else { this.ctx = null; this.play('main'); }
      const b = document.getElementById('btn-bgm'); if(b) b.textContent = this.icon();
    });
  },
  play(ctx){
    if(this.muted) return;
    if(this.ctx === ctx && this.audio && !this.audio.paused) return;
    if(this.audio){ this.audio.pause(); }
    this.ctx = ctx;
    this.audio = new Audio(this.tracks[ctx]);
    this.audio.loop = true;
    this.audio.volume = 0;
    this.audio.play().catch(()=>{});
    const target = this.vol;
    const fade = setInterval(() => {
      if(this.audio && this.audio.volume < target){
        this.audio.volume = Math.min(target, this.audio.volume + 0.02);
      } else { clearInterval(fade); }
    }, 100);
  },
  stop(){ if(this.audio){ this.audio.pause(); this.audio = null; this.ctx = null; } },
  toggleMute(){
    this.muted = !this.muted;
    if(this.muted){ if(this.audio) this.audio.pause(); }
    else { this.ctx = null; this.play(this.ctx || 'main'); }
    try{ localStorage.setItem('drg_bgm_muted', this.muted ? '1' : '0'); }catch(e){}
    return this.muted;
  }
};

/* 挂机模式（用户方案：挂机券 3 小时自动游玩）：自动事件决策 + 自动派遣空闲矿工 */
function showIdleReport(){
  const R = S.idleReport;
  let rows = '';
  if(!R || !R.missions){
    rows = '<div class="note">' + TEXT.dm_report_empty + '</div>';
  } else {
    rows = lootRowHTML('', TEXT.dm_report_missions, R.missions + L(' 次')) +
      lootRowHTML('', TEXT.dm_report_credits, '+' + fmt(R.credits)) +
      (R.morkite ? lootRowHTML('res_morkite', TEXT.dm_report_morkite, '+' + fmt(R.morkite)) : '') +
      (R.moil ? lootRowHTML('res_morkite', TEXT.dm_report_moil, '+' + fmt(R.moil)) : '') +
      (R.nitra ? lootRowHTML('res_nitra', TEXT.dm_report_nitra, '+' + fmt(R.nitra)) : '') +
      Object.keys(R.rare).slice(0, 12).map(k => lootRowHTML('', k, '×' + R.rare[k])).join('') +
      (R.med ? lootRowHTML('', TEXT.dm_report_med, '-' + fmt(R.med)) : '') +
      lootRowHTML('', TEXT.dm_report_events, R.events + L(' 次'));
  }
  showModal('<h3 style="color:var(--amber)">' + TEXT.dm_report_title + '</h3><div style="display:flex;flex-direction:column;gap:6px;margin:10px 0;">' + rows + '</div><div class="note">' + TEXT.dm_report_scope + '</div><button class="btn pri" style="width:100%" onclick="closeModal(true)">' + TEXT.dm_report_sign + '</button>', false);
}
function autoPlayStep(){
  if(S.autoUntil && Date.now() > S.autoUntil && !S._idleReportShown){
    S._idleReportShown = true;
    log(TEXT.dm_report_expire, 'sys');
    showIdleReport();
  }
  if(!S.autoUntil || Date.now() > S.autoUntil) return;
  S.deps.forEach(d => {
    if(d.paused){
      autoResolveEvent(d);   /* F2 修复：直接内部决策（事件→稳妥项映射），不再依赖 DOM 弹窗按钮 */
    }
  });
  const idle = S.miners.filter(x => x.state==='idle' && x.morale>=25);
  if(idle.length >= 1 && S.board.length){   /* F1 修复：单人开局也要自动接单（规格=所有空闲矿工） */
    const m = S.board.slice().sort((a,b)=>a.hazard-b.hazard)[0];
    const capN = hcCap();
    const ids = idle.slice(0, capN).map(x=>x.id);
    const cost = dispatchCost(m, ids.length, null, missionDur(m, ids.length, null));
    if(S.nitra >= cost) doDispatch(m, ids, 0, '0');
  }
}
/* ---------------- WORLD ADVANCE ---------------- */
function worldAdvance(gm, offline){
  if(worldAdvance._in){ S.gm += gm; return; }   /* 嵌套调用（战役跳跃等）只推时钟，统一由外层结算 */
  worldAdvance._in = true;
  try{ worldAdvanceBody(gm, offline); } finally { worldAdvance._in = false; }
}
function worldAdvanceBody(gm, offline){
  let remain = gm;
  // 自适应步长：跨度再大也不超过 ~4 万次迭代，同时保证事件阈值照常触发
  const step = Math.max(1, Math.ceil(remain / (offline ? 40000 : 20)));   /* 在线细分触发事件，离线大步 */
  let guard = 0;
  while(remain > 0 && guard < 200000){
    const adv = Math.min(step, remain);
    remain -= adv; S.gm += adv; guard++;
    /* 派遣推进 */
    const completed = [];
    for(let depIndex = 0; depIndex < S.deps.length; depIndex++){
      const d = S.deps[depIndex];
      if(d.finished) continue;   /* 防嵌套推进后重复结算 */
      if(d.paused){
        if(d.autoEvents){ autoResolveEvent(d); continue; }
        if(!offline){
          const md = document.getElementById('modal');
          if(!(md.style.display === 'flex' && document.getElementById('modal-box').dataset.dep === d.id)) showEventModal(d);   /* 防每秒重建弹窗（卡死元凶） */
        }
        continue;
      }
      if(d.kind === 'prologue'){
        d.done = Math.min(d.dur, (d.done||0) + adv);
        if(!d.karlEventFired && d.done / d.dur >= 0.55){
          d.karlEventFired = true;
          showModal('<h3 style="color:var(--amber)">'+TEXT.st_comms_title+'</h3><div class="note" style="margin:10px 0">'+TEXT.st_comms_body+'</div>'+
            '<div class="row" style="gap:6px"><button class="btn" style="flex:1" id="pg-a">'+TEXT.st_comms_a+'</button>'+
            '<button class="btn" style="flex:1" id="pg-b">'+TEXT.st_comms_b+'</button></div>', true);
          $('#pg-a').onclick = $('#pg-b').onclick = () => {
            showModal('<h3 style="color:var(--red)">'+TEXT.st_lost_title+'</h3><div class="note" style="margin:10px 0">'+TEXT.st_lost_body+'</div>'+
              '<button class="btn pri" style="width:100%" id="pg-fin">'+L('接班')+'</button>', true);
            $('#pg-fin').onclick = () => {
              S.flags.prologueDone = true;
              S.deps = S.deps.filter(x => x !== d);
              closeModal(true);   /* 序章结束日志已由 endPrologue 打过，此处不再重复 */
              renderAll(); save();
            };
          };
          continue;
        }
        if(d.done >= d.dur && !d.karlEventFired){
          S.deps = S.deps.filter(x=>x!==d);
          endPrologue();
        }
        continue;
      }
      const remainingBeforeAdvance = Math.max(0, d.dur - (d.done || 0));
      d.done = Math.min(d.dur, (d.done || 0) + adv);   /* 封顶防浮点残差卡死 */
      if(d.done >= d.dur){
        d.finished = true;   /* 先标记防嵌套推进后重复结算 */
        completed.push({d, offset:remainingBeforeAdvance, order:depIndex});
        continue;
      }
      if(!offline){
        if(d.finaleBoss){
          /* 终局 Boss：事件密度 ×2 */
          const extra = 0.3;
          if(!d.evt1 && d.done/d.dur >= 0.3){ d.evt1 = true; rollEvent(d, 1); }
          else if(!d.evt2 && d.done/d.dur >= 0.6){ d.evt2 = true; rollEvent(d, 2); }
          else if(!d.evt3 && d.done/d.dur >= 0.85 && Math.random() < extra + 0.35){ d.evt3 = true; rollEvent(d, 3); }
        }
        else maybeEvent(d, d.done / d.dur);
      }
    }
    /* 同一步内可能有多单归队：必须按实际归队时刻结算，不能按数组/派遣顺序。 */
    completed.sort((a,b) => a.offset-b.offset || a.order-b.order);
    for(const {d} of completed){
      try{ settle(d, offline); }
      catch(err){
        try{ d.minerIds.forEach(id => { const mn = S.miners.find(x=>x.id===id); if(mn && mn.state==='mission') mn.state = 'idle'; }); }catch(e2){}
        log(L('⚠ 结算异常（已保底处理，矿工已归队，不影响存档）：')+(err && err.message || err), 'bad');
        console.error('settle error', err, d);
      }
    }
    if(S.deps.some(d=>d.finished)){
      S.deps = S.deps.filter(d=>!d.finished);
      /* 若弹窗对应的派遣已被结算，关掉孤儿弹窗 */
      const m = document.getElementById('modal');
      if(m.style.display !== 'none'){
        const id = document.getElementById('modal-box').dataset.dep;
        if(id && !S.deps.some(x=>x.id===id)) closeModal(true);
      }
    }
    /* 医疗站 */
    S.miners.forEach(m=>{
      if(m.state === 'med' && S.gm >= m.medUntil){ m.state = 'idle'; m.morale = clamp(m.morale+5,0,100); }
      /* 士气漂移：派遣中缓慢下降，空闲缓慢回升（酒吧等级加速回升） */
      const perHour = (m.state==='mission' ? -2 : (1 + S.fac.bar));
      m.mAcc = (m.mAcc||0) + adv/60;
      while(m.mAcc >= 1){ m.mAcc -= 1; m.morale = clamp(m.morale + perHour, 10, 100); }
    });
    /* 任务板刷新 */
    if(S.gm - S.boardAt >= 2880){ genBoard(); log(L('任务板已刷新：集团发来了新一批任务单。'), 'sys'); }
    /* 节日活动自动开启（每 tick 判一次即可，holidayForNow 内部建 Date 较贵） */
    const hol = holidayForNow();
    if(hol && !S.holidayAct){
      S.holidayAct = {key:hol.key, id:hol.h.id, si:0, prog:0};
      log(L('节日活动开启：【')+L(hol.h.name)+L('】！节日战役同步开放，完成派遣推进活动进度。'), 'gold');
    }
    /* 日期滚动：市场波动 + 每日简报 */
    while(S.lastDay < gameDay()){
      S.lastDay++;
      marketDayUpdate();
      dailyBrief(S.lastDay);
    }
  }
}

/* 市场每日波动：±10% 涨跌停 + 轻微均值回归 */
function marketDayUpdate(){
  TRADEABLES.forEach(t=>{
    const old = S.market.prices[t.k] || t.base;
    const drift = (t.base - old)/t.base * 0.15;
    let chg = clamp(rnd(-DAY_CAP, DAY_CAP) + drift, -DAY_CAP, DAY_CAP);
    S.market.prev[t.k] = old;
    S.market.prices[t.k] = Math.max(1, Math.round(old * (1 + chg)));
  });
}
/* 每日简报 */
function dailyBrief(d){
  const ds = S.dayStats||{missions:0, credits:0, morkite:0, injured:0};
  let up = null, down = null;
  TRADEABLES.forEach(t=>{
    const p = S.market.prices[t.k], pv = S.market.prev[t.k];
    if(!pv) return;
    const c = (p-pv)/pv;
    if(!up || c > up.c) up = {name:t.name, c};
    if(!down || c < down.c) down = {name:t.name, c};
  });
  const tip = TIPS[(d-1 + 3) % TIPS.length];
  /* 钻台每日自动产硝石 + 集团关怀防死锁 */
  S.nitra += 25;
  if(S.credits < 100 && S.nitra < 60){
    S.credits += 200; S.nitra += 40;
    log(TEXT.log_care, 'sys');
  }
  log(TEXT.log_daily.replace('{day}', d).replace('{missions}', ds.missions).replace('{credits}', fmt(ds.credits))
      .replace('{morkite}', fmt(ds.morkite)).replace('{injured}', ds.injured)
      .replace('{market}', (up?L(up.name)+L('领涨，'):'')+(down?L(down.name)+L('领跌。'):''))+L('今日提示：')+L(tip), 'sys');
  chronicleTick();
  S.dayStats = {missions:0, credits:0, morkite:0, injured:0};
}

/* 节日战役进度推进（kind: missions/elite） */
function holidayProgress(kind, amount){
  if(!S.holidayAct) return;
  const hd = HOLIDAYS.find(h => h.id === S.holidayAct.id);
  if(!hd) { S.holidayAct = null; return; }
  const st = hd.steps[S.holidayAct.si]; if(!st || st.kind !== kind) return;
  S.holidayAct.prog += amount;
  if(S.holidayAct.prog >= st.need){
    S.holidayAct.si++; S.holidayAct.prog = 0;
    if(S.holidayAct.si >= hd.steps.length){
      const rw = hd.rw||{};
      const parts = [];
      if(rw.credits){ S.credits += rw.credits; parts.push(rw.credits+L(' 代币')); }
      if(rw.gold){ S.gold += rw.gold; parts.push(L('黄金×')+rw.gold); }
      Object.entries(rw).forEach(([k,v])=>{
        if(k.startsWith('rare_')){
          const key = k.slice(5);
          const mm = Object.keys(MKEY).find(n => MKEY[n] === key);
          if(mm){ S.rare[mm] += v; parts.push(L(mm)+'×'+v); }
        }
      });
      log(L('🎄 节日战役【')+L(hd.name)+L('】通关！奖励：')+parts.join(L('、')), 'gold');
      S.holidayDone[hd.key] = true;
      S.holidayAct = null;
      awardRandomTrinket(hd.name + ' 节日战役');
    }
  }
}

/* ---------------- FACILITIES ---------------- */
function rigCost(){
  const lv = S.rigLv;
  const mo = Math.round(120 * Math.pow(1.9, lv-1));
  const oi = lv >= 3 ? Math.round(60 * Math.pow(1.9, lv-3)) : 0;
  return {mo, oi};
}
function upgradeMule(){
  const mule = MULE_UPGRADES.find(x => x.lv === (S.muleLv||1) + 1);
  if(!mule) return;
  for(const [k, v] of Object.entries(mule.cost)){
    if((S.rare[k]||0) < v){ log(L('矿骡升级缺料：') + L(k) + '×' + v + L('。'), 'bad'); return; }
  }
  Object.entries(mule.cost).forEach(([k, v]) => S.rare[k] -= v);
  S.muleLv = mule.lv;
  log(L('Pack骡升级完成：Lv.') + S.muleLv + ' ' + L(mule.name) + L('——') + L(mule.txt) + L('。矿骡表示车斗里终于像样了。'), 'gold');
  renderAll(); save();
}
function upgradeRig(){
  if(S.rigLv >= CFG.RIG_MAX) return;
  const c = rigCost();
  if(S.morkite < c.mo || S.moil < c.oi) return;
  S.morkite -= c.mo; S.moil -= c.oi; S.rigLv++;
  log(TEXT.log_rig_lv.replace('{lv}', S.rigLv)+TEXT['egg_rig_'+(1+Math.floor(Math.random()*2))], 'gold');
  renderAll(); save();
}
function barCost(){ return {c: Math.round(600*Math.pow(1.9, S.fac.bar-1)), bismor: 8*S.fac.bar}; }
function upgradeBar(){
  if(S.fac.bar >= 4) return;
  const c = barCost();
  if(S.credits < c.c || S.rare['蜂母石'] < c.bismor) return;
  S.credits -= c.c; S.rare['蜂母石'] -= c.bismor; S.fac.bar++;
  log(TEXT.log_bar_lv.replace('{lv}', S.fac.bar), 'gold');
  renderAll(); save();
}
function medCost(){ return {c: Math.round(500*Math.pow(1.9, S.fac.medbay)), pearl: 6*(S.fac.medbay+1)}; }
function upgradeMed(){
  if(S.fac.medbay >= 3) return;
  const c = medCost();
  if(S.credits < c.c || S.rare['妙绝珠'] < c.pearl) return;
  S.credits -= c.c; S.rare['妙绝珠'] -= c.pearl; S.fac.medbay++;
  log(TEXT.log_med_lv.replace('{lv}', S.fac.medbay), 'gold');
  renderAll(); save();
}
function licenseCost(cls){
  const t = S.licenses[cls];
  if(t >= 3) return null;
  const L = CLASSES[cls].lic;
  return {m1:L.m, q1:L.q[t-1], m2:SECOND_LIC[cls], q2:L.q[t-1], c: 300*Math.pow(2.2, t-1)};
}
function buyLicense(cls){
  const c = licenseCost(cls); if(!c) return;
  if(S.credits < c.c || S.rare[c.m1] < c.q1 || S.rare[c.m2] < c.q2) return;
  S.credits -= c.c; S.rare[c.m1] -= c.q1; S.rare[c.m2] -= c.q2;
  S.licenses[cls]++;
  campProgress('license', '', 1);
  log(L(CLASSES[cls].name)+L(' 凭证升级：主手解锁 ')+weaponZh(WEAPON_SET[cls].main[S.licenses[cls]-1])+L('，副手解锁 ')+weaponZh(WEAPON_SET[cls].off[S.licenses[cls]-1])+L('！'), 'gold');
  renderAll(); save();
}
function hireCost(){ return Math.round(CFG.HIRE_BASE * Math.pow(CFG.HIRE_MUL, S.miners.length - 1)); }
function recruit(cls){
  const C = CLASSES[cls];
  if(S.rigLv < C.rig){ log(L('钻井平台等级不足，尚未解锁')+L(C.name)+L('。'), 'bad'); return; }
  if(S.miners.some(m=>m.cls===cls)) return;
  const c = hireCost();
  if(S.credits < c) return;
  S.credits -= c;
  S.recruited[cls] = true;
  const m = newMiner(cls);
  S.miners.push(m);
  log(TEXT.log_recruit.replace('{name}', minerName(m)).replace('{cls}', C.name), '');
  renderAll(); save();
}
/* 晋升框：官方晋升阶梯（铜→银→金→铂→祖母绿→蓝宝石→钻石→红），红3 之后只显示额外晋升次数 */
const FRAMES = ['铜1','铜2','铜3','银1','银2','银3','金1','金2','金3','铂1','铂2','铂3','祖母绿1','祖母绿2','祖母绿3','蓝宝石1','蓝宝石2','蓝宝石3','钻石1','钻石2','钻石3','红1','红2','红3'];
const FRAME_COLORS = {'铜':'#b87333','银':'#c0c0c0','金':'#ffd700','铂':'#e5e4e2','祖母绿':'#50c878','蓝宝石':'#4f86f7','钻石':'#eaf6ff','红':'#ff3b30'};
function frameOf(stars){
  if(!stars || stars <= 0) return null;
  if(stars <= FRAMES.length) return FRAMES[stars-1];
  return L('红3 · 额外晋升 ×') + (stars - FRAMES.length);
}
function frameHtml(stars){
  const f = frameOf(stars); if(!f) return '';
  const col = FRAME_COLORS[f.replace(/[0-9]/g,'').replace(/ · .*/,'')] || 'var(--gold)';
  return '<span style="border:1px solid '+col+';color:'+col+';padding:0 4px;border-radius:2px;font-size:11px;">'+ic('promo_star')+f+'</span> ';
}
function promoteCost(m){ return Math.round(800 * Math.pow(1.9, m.stars)); }
function promoteMiner(id){
  const m = S.miners.find(x=>x.id===id);
  if(!m || m.lv < 25) return;
  const c = promoteCost(m);
  if(S.credits < c) return;
  S.credits -= c;
  m.stars++; m.lv = 1; m.xp = 0; m.morale = 100; m.state = 'idle';
  log(minerName(m)+L(' 晋升完成！授予晋升框【')+L(frameOf(m.stars))+L('】，战斗力与寻矿直觉永久提升。集团贺词：欢迎回到第 1 级——挖到手软，赚到盆满！'), 'gold');
  renderAll(); save();
}
function hire(){
  const c = hireCost();
  if(S.credits < c) return;
  S.credits -= c;
  const cls = pick(Object.keys(CLASSES));
  const m = newMiner(cls);
  S.miners.push(m);
  log(TEXT.log_recruit.replace('{name}', minerName(m)).replace('{cls}', CLASSES[cls].name), '');
  renderAll(); save();
}
/* 旧 buyDrink（四酒单版）已随酒吧 v2 抽酒制移除 */
function gainMerit(n, why){
  S.merit = (S.merit||0) + n;
  log(TEXT.log_merit.replace('{n}', n)+L('（')+why+L('）。当前：')+S.merit, 'gold');
}
function claimKPI(){
  if(S.kpi.done < S.kpi.quota) return;
  const bonus = Math.round(1500 * S.kpi.term);   /* 执行单：800→1500×term */
  const rarePick = RARES[Math.floor(Math.random() * RARES.length)];
  S.rare[rarePick] = (S.rare[rarePick] || 0) + 10;
  S.credits += bonus;
  let overTxt = '';
  if(S.kpi.done > S.kpi.quota * 1.5){
    S.credits += 500;
    S.blanks = (S.blanks || 0) + 1;
    overTxt = L(' 超额完成！追加 500 代币 + 空白模组×1。');
  }
  log(L('季度分红稀有矿物：') + L(rarePick) + '×10'+L('。'), 'gold');
  campProgress('kpi', '', 1);
  gainMerit(5, L('季度 KPI 达成'));
  const rep = t => t.replace('{reward}', fmt(bonus)).replace('{quota}', fmt(S.kpi.quota));
  log(rep(TEXT['kpi_success_'+(1+Math.floor(Math.random()*3))]) + overTxt, 'gold');
  S.kpi.term++; S.kpi.quota = Math.round(S.kpi.quota * CFG.KPI_MUL); S.kpi.done = 0;
  const nBonus = Math.round(CFG.KPI_BONUS * S.kpi.term);
  const rep2 = t => t.replace('{quota}', fmt(S.kpi.quota)).replace('{reward}', fmt(nBonus));
  log(rep2(TEXT['kpi_issue_'+(1+Math.floor(Math.random()*3))]), 'sys');
  renderAll(); save();
}
function treatNow(){
  const inMed = S.miners.filter(m=>m.state==='med');
  if(!inMed.length) return;
  const speedup = (2 - S.fac.medbay*0.25);
  inMed.forEach(m=>{ m.medUntil = Math.max(S.gm, m.medUntil - 60); });
  const bill = 120 * inMed.length;
  S.credits = Math.max(0, S.credits - bill);
  log(L('为 ')+inMed.length+L(' 名伤员支付加急治疗费 ')+bill+L(' 代币，恢复时间减半。'), '');
  renderAll(); save();
}

