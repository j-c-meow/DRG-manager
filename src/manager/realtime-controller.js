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
  /* 采矿探险 + 执勤护送都可实时下场 */
  if(!m || (m.type !== 'exp' && m.type !== 'escort')) return;
  const t = mtypeById(m.type);
  const isEscort = m.type === 'escort';
  const idle = S.miners.filter(x=>x.state==='idle' && x.morale>=25)
    .sort((a,b)=>Number(b.cls===t.best)-Number(a.cls===t.best) || b.lv-a.lv);
  const cost = realtimeCost(m);
  let html = '<h3 style="color:var(--amber)">▶ '+(isEscort?'实时护送':'实时下矿')+' · '+biomeById(m.biome).name+'</h3>'+
    '<div class="note">'+(isEscort
      ?'直接操控 1 名矿工护送朵蕾妲掘进机：护车、两处停车加油与终点心石防守。胜利按任务基础报酬和实战表现结算；朵蕾妲被摧毁或矿工倒地不起则失败。'
      :'直接操控 1 名矿工完成采矿、虫潮与撤离。胜利按任务基础报酬和实战表现结算；失败无任务报酬。')+'</div>'+
    '<div class="meta">危险等级 '+'★'.repeat(m.hazard)+'　出舱补给 -'+cost+' 硝石（持有 '+Math.floor(S.nitra)+'）</div>'+
    '<h3 class="sec">选择主控矿工</h3>';
  if(!idle.length) html += '<div class="note">没有士气 ≥25 的空闲矿工。</div>';
  idle.forEach((mn,i)=>{
    const fit = mn.cls===t.best ? ' <span style="color:var(--green)">✔ 任务适配</span>' : '';
    html += '<label class="row" style="cursor:pointer"><input type="radio" name="rt-miner" data-rt-miner="'+mn.id+'" '+(i===0?'checked':'')+'>'+
      minerName(mn)+' · '+CLASSES[mn.cls].name+' Lv.'+mn.lv+fit+'</label>';
  });
  html += '<button class="btn live" id="rt-start" style="width:100%;margin-top:8px" '+(!idle.length || S.nitra<cost?'disabled':'')+'>进入洞穴</button>';
  showModal(html, false);
  const start = $('#rt-start');
  if(start) start.onclick = () => {
    const selected = $('#modal-box').querySelector('[data-rt-miner]:checked');
    const miner = selected && S.miners.find(x=>x.id===selected.dataset.rtMiner);
    if(miner) startRealtimeMission(m, miner, cost);
  };
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
    log('离线报告：实时下矿期间，钻台以 10% 效率运转了 '+(dt/3600).toFixed(1)+' 小时。', 'sys');
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
  if(shell.title) shell.title.textContent = biomeById(S.realtime.mission.biome).name;
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
  if(!d || d.paused){ log('该派遣当前无法介入（事件待处理或已暂停）。', 'bad'); return; }
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
    log('实时介入失败：'+(error && error.message || error), 'bad');
    return;
  }
  DRG.integration.setRequest(request);
  log('▶ '+minerName(miner)+' 亲自介入【'+biomeById(d.m.biome).name+'】派遣：洞穴内见真章，胜则全队即刻结算归队。', 'gold');
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
    log('实时任务启动失败：'+(error && error.message || error), 'bad');
    closeModal(true);
    return;
  }
  DRG.integration.setRequest(request);
  log('▶ '+minerName(miner)+' 已进入实时任务：'+biomeById(m.biome).name+'，危险 '+m.hazard+'。', 'gold');
  save();
  openRealtimeGame();
}

function showPendingRealtime(){
  if(!S.realtime) return;
  const p = S.realtime;
  const m = p.mission;
  const miner = S.miners.find(x=>x.id===p.minerId);
  showModal('<h3 style="color:var(--amber)">实时任务仍在进行</h3>'+
    '<div class="note">'+(miner?minerName(miner):'矿工')+' · '+(m?biomeById(m.biome).name:'未知矿区')+'。继续会回到当前洞穴进度；刷新后会以同一种子重新开始。召回按失败处理且不退补给。</div>'+
    '<button class="btn live" id="rt-resume" style="width:100%;margin-top:10px">继续实时任务</button>'+
    '<button class="btn warn" id="rt-recall" style="width:100%;margin-top:6px">召回矿工</button>', false);
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
    log('实时介入已召回：'+(miner?minerName(miner):'矿工')+' 归队，士气 -15。派遣恢复自动推进。', 'bad');
    clearRealtimeBridge();
    closeRealtimeGame();
    closeModal(true);
    renderAll();
    save();
    return;
  }
  DRGUnified.domain.abortDirectMission(S, 15);
  S.stats.realtimeFailed = (S.stats.realtimeFailed||0) + 1;
  log('实时任务已中止：矿工被紧急召回，士气 -15，出舱补给不退。', 'bad');
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
  /* 介入模式：结算对象是原派遣单本身 */
  const dep = pending.depId ? S.deps.find(x=>x.id===pending.depId) : null;
  const summary = {win:!!result.win, result, mission:m, miner:minerName(miner), gain:{}, intervene:!!dep};
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
        settle({
          id:'live-'+pending.requestId, m, hc:1, minerIds:[miner.id],
          fitN:miner.cls===mtypeById(m.type).best?1:0, modEff:squadModEffects([miner.id]),
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
      log('实时介入失败：'+minerName(miner)+' 归队，士气 -15。派遣恢复自动推进。', 'bad');
    }else{
      miner.state = 'idle';
      miner.morale = clamp(miner.morale-15, 10, 100);
      S.stats.realtimeFailed = (S.stats.realtimeFailed||0) + 1;
      log('实时任务失败：'+minerName(miner)+' 已归队，士气 -15。'+(result.failReason?' '+result.failReason:''), 'bad');
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
  const outcome = summary.win ? (summary.intervene?'介入成功 · 派遣完成':'任务完成') : (summary.intervene?'介入失败 · 派遣继续':'任务失败');
  let reward = '<div class="note">本次没有管理终端报酬。</div>';
  if(summary.win){
    const g = summary.gain;
    reward = '<div class="meta">结算倍率 ×'+summary.performance.toFixed(2)+'</div>'+
      '<div class="row"><span>代币</span><b>+'+fmt(Math.max(0,g.credits||0))+'</b></div>'+
      '<div class="row"><span>墨菱石</span><b>+'+fmt(Math.max(0,g.morkite||0))+'</b></div>'+
      '<div class="row"><span>硝石</span><b>+'+fmt(Math.max(0,g.nitra||0))+'</b></div>';
  }
  showModal('<h3 style="color:'+(summary.win?'var(--green)':'var(--red)')+'">▶ 实时任务 · '+outcome+'</h3>'+
    '<div class="note">'+summary.miner+'｜用时 '+elapsedText+'｜击杀 '+((r.stats&&r.stats.kills)||0)+'｜倒地 '+((r.stats&&r.stats.downs)||0)+'</div>'+
    '<h3 class="sec">入库结果</h3>'+reward+
    '<button class="btn pri" style="width:100%;margin-top:8px" onclick="closeModal(true)">确认入库</button>', false);
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
  if(title) title.textContent = biomeById(S.realtime.mission.biome).name+' · 任务完成';
});

window.addEventListener('drg:realtime-return', finishRealtimeMission);
