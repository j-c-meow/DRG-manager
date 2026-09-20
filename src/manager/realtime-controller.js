'use strict';
/* ---------------- UNIFIED REALTIME MISSION ---------------- */
let realtimeGameOpen = false;
let realtimeBgmContext = null;
let pendingRealtimeResult = null;

function isRealtimeGameOpen(){
  return realtimeGameOpen;
}

function realtimeSeed(m){
  let h = 2166136261;
  const text = m.id+'|'+m.biome+'|'+m.hazard;
  for(let i=0;i<text.length;i++){ h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h>>>0) || 1;
}

function realtimeCost(m){
  return 30 + 10*(m.hazard-1);
}

function openRealtime(mid){
  if(S.realtime){ showPendingRealtime(); return; }
  const m = S.board.find(x=>x.id===mid);
  /* 采矿探险 / 执勤护送 / 定点提取 / 搜救行动 / 就地精炼 / 消灭任务都可实时下场（三期放开 refi/elim） */
  if(!m || LIVE_TYPES.indexOf(m.type) < 0) return;
  /* 终局强制实时（危5）：清账行动期间的危5任务走专用编队入口，不经单人选人 */
  if(isForcedFinaleMission(m)){ openFinaleRealtime(mid); return; }
  const t = mtypeById(m.type);
  const isEscort = m.type === 'escort';
  const isPoint = m.type === 'point';
  const isSalv = m.type === 'salv';
  const isRefi = m.type === 'refi';
  const isElim = m.type === 'elim';
  const liveTitle = isEscort ? L('实时护送') : isPoint ? L('实时定点提取') : isSalv ? L('实时搜救')
    : isRefi ? L('实时精炼') : isElim ? L('实时消灭') : L('实时下矿');
  const liveDesc = isEscort
    ? L('直接操控 1 名矿工护送朵蕾妲掘进机：护车、两处停车加油与终点心石防守。胜利按任务基础报酬和实战表现结算；朵蕾妲被摧毁或矿工倒地不起则失败。')
    : isPoint
      ? L('直接操控 1 名矿工定点提取：跟随信标按住左键钻采矿结，把矿块搬回莫莉入库（每入库 1 块引来一小波虫潮）；携带矿块时移速降低且只能用副手武器。配额完成后撤离即胜。')
      : isSalv
        ? L('直接操控 1 名矿工搜救：找回 4 条矿骡腿装上残骸（每装 1 条刷防御虫），再长按互动键修复矿骡 3 秒；运腿与修复期间压力十足。修好后撤离即胜。')
        : isRefi
          ? L('直接操控 1 名矿工就地精炼：从精炼单元领取管道段（一次一段，携带时移速 -20% 且只能用副手武器），到远处油井按 E 铺设管线并安装泵；泵自动抽油汇入精炼单元，但虫子会专门啃泵——停摆后长按互动键修理。集齐原油配额即胜。')
          : isElim
            ? L('直接操控 1 名矿工消灭任务：直捣竞技场中心长按破茧，唤醒无畏机甲。装甲态只有腹部发光弱点吃伤害（×3），弱点随时间换位，它还会召唤小虫；血量过半进入狂暴（移速/攻速 +30%，新增酸弹三连）。击杀即胜。')
            : L('直接操控 1 名矿工完成采矿、虫潮与撤离。胜利按任务基础报酬和实战表现结算；失败无任务报酬。');
  const idle = S.miners.filter(x=>x.state==='idle' && x.morale>=25)
    .sort((a,b)=>Number(b.cls===t.best)-Number(a.cls===t.best) || b.lv-a.lv);
  const cost = realtimeCost(m);
  let html = '<h3 style="color:var(--amber)">▶ '+liveTitle+' · '+L(biomeById(m.biome).name)+'</h3>'+
    '<div class="note">'+liveDesc+'</div>'+
    '<div class="meta">'+L('危险等级 ')+'★'.repeat(m.hazard)+L('　出舱补给 -')+cost+L(' 硝石（持有 ')+Math.floor(S.nitra)+L('）')+'</div>'+
    '<h3 class="sec">'+L('选择主控矿工')+'</h3>';
  if(!idle.length) html += '<div class="note">'+L('没有士气 ≥25 的空闲矿工。')+'</div>';
  idle.forEach((mn,i)=>{
    const fit = mn.cls===t.best ? ' <span style="color:var(--green)">'+L('✔ 任务适配')+'</span>' : '';
    html += '<label class="row" style="cursor:pointer"><input type="radio" name="rt-miner" data-rt-miner="'+mn.id+'" '+(i===0?'checked':'')+'>'+
      minerName(mn)+' · '+L(CLASSES[mn.cls].name)+' Lv.'+mn.lv+fit+'</label>';
  });
  html += '<button class="btn live" id="rt-start" style="width:100%;margin-top:8px" '+(!idle.length || S.nitra<cost?'disabled':'')+'>'+L('进入洞穴')+'</button>';
  showModal(html, false);
  const start = $('#rt-start');
  if(start) start.onclick = () => {
    const selected = $('#modal-box').querySelector('[data-rt-miner]:checked');
    const miner = selected && S.miners.find(x=>x.id===selected.dataset.rtMiner);
    if(miner) startRealtimeMission(m, miner, cost);
  };
}

/* ---------------- 终局强制实时（危5，用户 09-19 拍板） ----------------
   清账行动（战役 id=finale）进行期间的危 5 任务＝终局任务：不允许普通挂机派遣，
   board 卡与派遣弹窗都会被导向这里——自动编队（最多 4 名最适矿工，主控=任务适配
   优先、等级次之），不经挂机派遣路径（不抽出发酒、不占派遣位）。
   胜=全队按实战表现结算并推进战役；败/召回=任务回板可重试，不卡死战役进度。 */
/* ---------------- 终局强制实时（危5，用户 09-19 拍板） ----------------
   最终战役（c10 集团大单，最后一战）进行期间的危 5 任务＝终局任务：不允许普通挂机派遣，
   board 卡与派遣弹窗都会被导向这里——自动编队（最多 4 名最适矿工，主控=任务适配
   优先、等级次之），不经挂机派遣路径（不抽出发酒、不占派遣位）。
   胜=全队按实战表现结算并推进战役；败/召回=任务回板可重试，不卡死战役进度。
   09-20 修复：原判定检查战役 id==='finale'——CAMPAIGNS 里没有这个 id，判定永远为假，
   强制终局从未生效。改为按「当前战役是最后一个」判定。 */
function isForcedFinaleMission(m){
  const lastCamp = CAMPAIGNS && CAMPAIGNS[CAMPAIGNS.length-1];
  return !!(m && S.campaign && lastCamp && CAMPAIGNS[S.campaign.ci] === lastCamp && m.hazard >= 5);
}

function openFinaleRealtime(mid){
  if(S.realtime){ showPendingRealtime(); return; }
  const m = S.board.find(x=>x.id===mid);
  if(!m || !isForcedFinaleMission(m)) return;
  const t = mtypeById(m.type);
  const cost = realtimeCost(m);
  /* 自动编队：空闲且士气 ≥25 → 任务适配优先、等级次之，最多 4 人 */
  const squad = S.miners.filter(x=>x.state==='idle' && x.morale>=25)
    .sort((a,b)=>Number(b.cls===t.best)-Number(a.cls===t.best) || b.lv-a.lv)
    .slice(0, 4);
  const names = squad.map(minerName).join('、');
  let html = '<h3 style="color:var(--red)">▶ '+L('终局任务 · 必须亲自下场')+' · '+L(biomeById(m.biome).name)+'</h3>'+
    '<div class="note">'+L('清账行动的终局任务不接受挂机派遣：管理层必须亲自进入洞穴。系统将自动编入最多 4 名最适矿工，胜利后按实战表现结算并推进战役；失败后任务回到任务板，可重新编队再战。')+'</div>'+
    '<div class="meta">'+L('危险等级 ')+'★'.repeat(m.hazard)+L('　出舱补给 -')+cost+L(' 硝石（持有 ')+Math.floor(S.nitra)+L('）')+'</div>'+
    '<h3 class="sec">'+L('终局编队已就绪')+'</h3>'+
    (squad.length ? '<div class="note">'+names+'</div>' : '<div class="note">'+L('没有可出勤的矿工（需空闲且士气 ≥25）。')+'</div>')+
    '<button class="btn live" id="finale-go" style="width:100%;margin-top:8px" '+(!squad.length || S.nitra<cost?'disabled':'')+'>'+L('进入洞穴')+'</button>';
  showModal(html, false);
  const go = $('#finale-go');
  if(go) go.onclick = () => startFinaleMission(m, squad, cost);
}

function startFinaleMission(m, squad, cost){
  if(!squad || !squad.length) return;
  const lead = squad[0];   /* 主控 = 队首（任务适配优先、等级最高） */
  const requestId = 'rt'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  let request;
  try{
    request = DRGUnified.domain.startDirectMission(S, {
      requestId,
      seed:realtimeSeed(m),
      mission:Object.assign({}, m, {rewards:Object.assign({}, m.r)}),
      miner:{id:lead.id, cls:lead.cls, name:minerName(lead), level:lead.lv},
      nitraCost:cost,
      now:Date.now(),
      minerIds:squad.map(x=>x.id),
      finale:true,
    });
  }catch(error){
    log(L('终局任务启动失败：')+(error && error.message || error), 'bad');
    closeModal(true);
    return;
  }
  DRG.integration.setRequest(request);
  log(L('▶ 终局任务：')+minerName(lead)+L(' 领队（')+squad.map(minerName).join(L('、'))+L('）亲自进入 ')+L(biomeById(m.biome).name)+L('。胜则全队即刻结算，败则任务回板再战。'), 'gold');
  save();
  openRealtimeGame();
}

function realtimeShell(){
  return {
    root: document.getElementById('realtime-shell'),
    host: document.getElementById('realtime-app'),
    title: document.getElementById('realtime-shell-title'),
    style: document.getElementById('realtime-style'),
  };
}

function requestForPending(){
  if(!S || !S.realtime) return null;
  const pending = S.realtime;
  const m = pending.mission;
  const miner = S.miners.find(x=>x.id===pending.minerId);
  if(!m || !miner) return null;
  return {
    version:2,
    id:pending.requestId,
    createdAt:pending.startedAt,
    seed:realtimeSeed(m),
    resolution:'direct',
    mission:{
      id:m.id, type:m.type, biome:m.biome, hazard:m.hazard,
      rewards:m.r, r:m.r, clause:m.clause||null,
      realtimeBiome:REALTIME_BIOMES[m.biome]||'crystalline',
    },
    miner:{id:miner.id, cls:miner.cls, name:minerName(miner), level:miner.lv},
  };
}

function clearRealtimeBridge(){
  pendingRealtimeResult = null;
  if(window.DRG && DRG.integration) DRG.integration.clear();
}

function pauseManagerBgm(){
  if(typeof BGM === 'undefined') return;
  realtimeBgmContext = BGM.ctx || realtimeBgmContext || 'main';
  BGM.stop();
}

function resumeManagerBgm(){
  if(typeof BGM === 'undefined' || BGM.muted) return;
  BGM.play(realtimeBgmContext || 'main');
}

function settleManagerRealtimeAbsence(){
  if(!S) return;
  const now = Date.now();
  const dt = (now - S.lastReal) / 1000;
  if(dt > 60){
    worldAdvance(Math.min(dt, 48 * 3600) * CFG.RATE * CFG.OFFLINE_EFF, true);
    log(L('离线报告：实时下矿期间，钻台以 10% 效率运转了 ')+(dt/3600).toFixed(1)+L(' 小时。'), 'sys');
  }
  S.lastReal = now;
}

function openRealtimeGame(){
  if(!S || !S.realtime || !window.DRG || !DRG.integration) return;
  const shell = realtimeShell();
  if(!shell.root || !shell.host) return;
  const request = requestForPending();
  if(!request) return;
  closeModal(true);
  if(!DRG.integration.request || DRG.integration.request.id !== request.id){
    DRG.integration.setRequest(request);
  }
  if(shell.title) shell.title.textContent = L(biomeById(S.realtime.mission.biome).name);
  if(shell.style) shell.style.disabled = false;
  shell.root.hidden = false;
  shell.root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('realtime-open');
  realtimeGameOpen = true;
  pauseManagerBgm();
  DRGUnified.runtime.setVisible(true);
  DRG.integration.setVisible(true);
  DRG.integration.launch();
  shell.host.focus();
}

function closeRealtimeGame(){
  const shell = realtimeShell();
  const wasOpen = realtimeGameOpen;
  if(window.DRG && DRG.integration) DRG.integration.setVisible(false);
  DRGUnified.runtime.setVisible(false);
  if(shell.root){
    shell.root.hidden = true;
    shell.root.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('realtime-open');
  realtimeGameOpen = false;
  if(shell.style) shell.style.disabled = true;
  if(wasOpen){
    settleManagerRealtimeAbsence();
    resumeManagerBgm();
  }
}

function finishRealtimeMission(){
  const summary = consumeRealtimeResult();
  if(!summary) return;
  closeRealtimeGame();
  renderAll();
  showRealtimeSummary(summary);
  save();
}

/* 实时介入（用户 09-19 拍板）：挂机中的采矿探险派遣可随时亲自下场——
   不再扣硝石（出发时已付）、派遣冻结（paused），胜=该派遣按原班人马立即结算，
   败/召回=解除冻结继续挂机。领域入口 startDirectMissionFromDep（domain.ts） */
function interveneRealtime(depId){
  if(!S || isRealtimeGameOpen()) return;
  if(S.realtime){ showPendingRealtime(); return; }
  const d = S.deps.find(x=>x.id===depId);
  if(!d || d.paused){ log(L('该派遣当前无法介入（事件待处理或已暂停）。'), 'bad'); return; }
  const miner = S.miners.find(x=>x.id===d.minerIds[0]);
  if(!miner) return;
  const requestId = 'rt'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  let request;
  try{
    request = DRGUnified.domain.startDirectMissionFromDep(S, {
      requestId,
      seed:realtimeSeed(d.m),
      depId:d.id,
      minerId:miner.id,
      now:Date.now(),
    });
  }catch(error){
    log(L('实时介入失败：')+(error && error.message || error), 'bad');
    return;
  }
  DRG.integration.setRequest(request);
  log('▶ '+minerName(miner)+L(' 亲自介入【')+L(biomeById(d.m.biome).name)+L('】派遣：洞穴内见真章，胜则全队即刻结算归队。'), 'gold');
  save();
  openRealtimeGame();
}

function startRealtimeMission(m, miner, cost){
  const requestId = 'rt'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  let request;
  try{
    request = DRGUnified.domain.startDirectMission(S, {
      requestId,
      seed:realtimeSeed(m),
      mission:Object.assign({}, m, {rewards:Object.assign({}, m.r)}),
      miner:{id:miner.id, cls:miner.cls, name:minerName(miner), level:miner.lv},
      nitraCost:cost,
      now:Date.now(),
    });
  }catch(error){
    log(L('实时任务启动失败：')+(error && error.message || error), 'bad');
    closeModal(true);
    return;
  }
  DRG.integration.setRequest(request);
  log('▶ '+minerName(miner)+L(' 已进入实时任务：')+L(biomeById(m.biome).name)+L('，危险 ')+m.hazard+L('。'), 'gold');
  save();
  openRealtimeGame();
}

function showPendingRealtime(){
  if(!S.realtime) return;
  const p = S.realtime;
  const m = p.mission;
  const miner = S.miners.find(x=>x.id===p.minerId);
  showModal('<h3 style="color:var(--amber)">'+L('实时任务仍在进行')+'</h3>'+
    '<div class="note">'+(miner?minerName(miner):L('矿工'))+' · '+(m?L(biomeById(m.biome).name):L('未知矿区'))+L('。继续会回到当前洞穴进度；刷新后会以同一种子重新开始。召回按失败处理且不退补给。')+'</div>'+
    '<button class="btn live" id="rt-resume" style="width:100%;margin-top:10px">'+L('继续实时任务')+'</button>'+
    '<button class="btn warn" id="rt-recall" style="width:100%;margin-top:6px">'+L('召回矿工')+'</button>', false);
  $('#rt-resume').onclick = openRealtimeGame;
  $('#rt-recall').onclick = recallRealtime;
}

function recallRealtime(){
  if(!S.realtime) return;
  const dep = S.realtime.depId ? S.deps.find(x=>x.id===S.realtime.depId) : null;
  if(dep){
    /* 介入模式召回：不退补给（本就未扣），矿工归队继续该派遣，士气 -15 */
    const miner = S.miners.find(x=>x.id===S.realtime.minerId);
    if(miner) miner.morale = clamp(miner.morale-15, 10, 100);
    dep.paused = false;
    S.realtime = null;
    pendingRealtimeResult = null;
    if(window.DRG && DRG.integration) DRG.integration.clear();
    log(L('实时介入已召回：')+(miner?minerName(miner):L('矿工'))+L(' 归队，士气 -15。派遣恢复自动推进。'), 'bad');
    clearRealtimeBridge();
    closeRealtimeGame();
    closeModal(true);
    renderAll();
    save();
    return;
  }
  const pending = S.realtime;
  const wasFinale = !!pending.finale;
  const mission = pending.mission;
  DRGUnified.domain.abortDirectMission(S, 15);
  if(wasFinale){
    /* 终局召回：任务回板可重试，不许卡死战役进度 */
    if(!S.board.some(x=>x.id===mission.id)) S.board.push(mission);
    log(L('终局任务已召回：全队归队（士气 -15），任务回到任务板——整理装备后再战。'), 'bad');
  } else {
    S.stats.realtimeFailed = (S.stats.realtimeFailed||0) + 1;
    log(L('实时任务已中止：矿工被紧急召回，士气 -15，出舱补给不退。'), 'bad');
  }
  clearRealtimeBridge();
  closeRealtimeGame();
  closeModal(true);
  renderAll();
  save();
}

function consumeRealtimeResult(explicitResult){
  if(!S || !S.realtime) return null;
  const result = explicitResult || pendingRealtimeResult || (DRG.integration && DRG.integration.takeResult());
  if(!result || !DRGUnified.domain.canSettleMission(S, result)) return null;
  const pending = S.realtime;
  const m = pending.mission;
  const miner = S.miners.find(x=>x.id===pending.minerId);
  if(!m || !miner) return null;
  /* 终局强制实时：结算/归队对象是整个随行小队 */
  const squadIds = pending.minerIds && pending.minerIds.length ? pending.minerIds : [miner.id];
  /* 介入模式：结算对象是原派遣单本身 */
  const dep = pending.depId ? S.deps.find(x=>x.id===pending.depId) : null;
  const summary = {win:!!result.win, result, mission:m, miner:minerName(miner), gain:{}, intervene:!!dep, finale:!!pending.finale && !dep};
  try{
    if(result.win){
      const before = {credits:S.credits, nitra:S.nitra, morkite:S.morkite, moil:S.moil, gold:S.gold};
      const kills = Number(result.stats && result.stats.kills)||0;
      const gold = Number(result.deposited && result.deposited.gold)||0;
      const performance = clamp(0.85 + Math.min(kills,60)/300 + Math.min(gold,60)/600, 0.85, 1.15);
      if(dep){
        /* 派遣按原班人马（含酒buff/适配/精英加成）立即结算并移除 */
        settle(dep, false, performance);
        S.deps = S.deps.filter(x=>x!==dep);
      }else{
        /* 终局/单人实时：小队全员按实战表现结算 */
        const best = mtypeById(m.type).best;
        settle({
          id:'live-'+pending.requestId, m, hc:squadIds.length, minerIds:squadIds,
          fitN:squadIds.filter(id=>{ const mm=S.miners.find(x=>x.id===id); return mm && mm.cls===best; }).length,
          modEff:squadModEffects(squadIds),
          bonus:1, rewardBonus:1, morkiteBuff:1, mode:'realtime', nitraSpent:pending.nitraSpent,
        }, false, performance);
      }
      summary.performance = performance;
      Object.keys(before).forEach(k=>{ summary.gain[k] = Math.round((S[k]||0)-before[k]); });
      S.stats.realtimeWon = (S.stats.realtimeWon||0) + 1;
    }else if(dep){
      /* 介入失败：派遣解除冻结继续挂机，矿工归队（保持 mission 态），士气 -15 */
      dep.paused = false;
      miner.morale = clamp(miner.morale-15, 10, 100);
      S.stats.realtimeFailed = (S.stats.realtimeFailed||0) + 1;
      log(L('实时介入失败：')+minerName(miner)+L(' 归队，士气 -15。派遣恢复自动推进。'), 'bad');
    }else{
      /* 失败：小队全员归队；终局任务回板可重试 */
      squadIds.forEach(id=>{
        const mn = S.miners.find(x=>x.id===id);
        if(mn){ mn.state = 'idle'; mn.morale = clamp(mn.morale-15, 10, 100); }
      });
      S.stats.realtimeFailed = (S.stats.realtimeFailed||0) + 1;
      if(pending.finale){
        if(!S.board.some(x=>x.id===m.id)) S.board.push(m);
        log(L('终局任务失败：')+squadIds.length+L(' 人小队已归队（士气 -15）。任务回到任务板——可重新编队再战。')+(result.failReason?' '+result.failReason:''), 'bad');
      }else{
        log(L('实时任务失败：')+minerName(miner)+L(' 已归队，士气 -15。')+(result.failReason?' '+result.failReason:''), 'bad');
      }
    }
    DRGUnified.domain.markMissionSettled(S, result.requestId, result.finishedAt);
    S.realtime = null;
    pendingRealtimeResult = null;
    DRG.integration.clear();
    save();
    return summary;
  }catch(error){
    pendingRealtimeResult = result;
    throw error;
  }
}

function showRealtimeSummary(summary){
  const r = summary.result;
  const elapsed = Math.max(0, Math.round(r.time||0));
  const elapsedText = Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0');
  const outcome = summary.win ? (summary.intervene?L('介入成功 · 派遣完成'):L('任务完成'))
    : summary.intervene ? L('介入失败 · 派遣继续')
    : summary.finale ? L('终局失败 · 任务回板可重试')
    : L('任务失败');
  let reward = '<div class="note">'+L('本次没有管理终端报酬。')+'</div>';
  if(summary.win){
    const g = summary.gain;
    reward = '<div class="meta">'+L('结算倍率 ×')+summary.performance.toFixed(2)+'</div>'+
      '<div class="row"><span>'+L('代币')+'</span><b>+'+fmt(Math.max(0,g.credits||0))+'</b></div>'+
      '<div class="row"><span>'+L('墨菱石')+'</span><b>+'+fmt(Math.max(0,g.morkite||0))+'</b></div>'+
      '<div class="row"><span>'+L('硝石')+'</span><b>+'+fmt(Math.max(0,g.nitra||0))+'</b></div>';
  }
  showModal('<h3 style="color:'+(summary.win?'var(--green)':'var(--red)')+'">'+L('▶ 实时任务 · ')+outcome+'</h3>'+
    '<div class="note">'+summary.miner+L('｜用时 ')+elapsedText+L('｜击杀 ')+((r.stats&&r.stats.kills)||0)+L('｜倒地 ')+((r.stats&&r.stats.downs)||0)+'</div>'+
    '<h3 class="sec">'+L('入库结果')+'</h3>'+reward+
    '<button class="btn pri" style="width:100%;margin-top:8px" onclick="closeModal(true)">'+L('确认入库')+'</button>', false);
}

const realtimeCloseButton = document.getElementById('realtime-shell-close');
if(realtimeCloseButton){
  realtimeCloseButton.addEventListener('click', () => {
    closeRealtimeGame();
    renderAll();
    showPendingRealtime();
    save();
  });
}

window.addEventListener('drg:realtime-complete', event => {
  if(!S || !S.realtime || !event.detail || event.detail.requestId !== S.realtime.requestId) return;
  pendingRealtimeResult = event.detail;
  const title = realtimeShell().title;
  if(title) title.textContent = L(biomeById(S.realtime.mission.biome).name)+L(' · 任务完成');
});

window.addEventListener('drg:realtime-return', finishRealtimeMission);
