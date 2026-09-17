'use strict';
/* ---------------- REALTIME MISSION BRIDGE ---------------- */
let realtimeGameOpen = false;
let realtimeBgmContext = null;

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
  if(!m || m.type !== 'exp') return;
  const t = mtypeById(m.type);
  const idle = S.miners.filter(x=>x.state==='idle' && x.morale>=25)
    .sort((a,b)=>Number(b.cls===t.best)-Number(a.cls===t.best) || b.lv-a.lv);
  const cost = realtimeCost(m);
  let html = '<h3 style="color:var(--amber)">▶ 实时下矿 · '+biomeById(m.biome).name+'</h3>'+
    '<div class="note">直接操控 1 名矿工完成采矿、虫潮与撤离。胜利按任务基础报酬和实战表现结算；失败无任务报酬。</div>'+
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


function realtimeUrl(){
  const url = new URL(REALTIME_BRIDGE.PATH, location.href);
  url.searchParams.set('embedded', '1');
  if(typeof S !== 'undefined' && S && S.realtime){
    url.searchParams.set('request', S.realtime.requestId);
  }
  return url.href;
}


function clearRealtimeBridge(){
  try{
    localStorage.removeItem(REALTIME_BRIDGE.REQUEST_KEY);
    localStorage.removeItem(REALTIME_BRIDGE.RESULT_KEY);
  }catch(e){}
}

function realtimeShell(){
  return {
    root: document.getElementById('realtime-shell'),
    frame: document.getElementById('realtime-frame'),
    title: document.getElementById('realtime-shell-title')
  };
}

function postRealtimeVisibility(visible){
  const frame = realtimeShell().frame;
  if(!frame || !frame.contentWindow) return;
  frame.contentWindow.postMessage({
    type: 'drg:realtime-visibility',
    visible: !!visible,
    requestId: S && S.realtime ? S.realtime.requestId : null
  }, location.origin);
}

function pauseManagerBgm(){
  if(typeof BGM === 'undefined') return;
  realtimeBgmContext = BGM.ctx || realtimeBgmContext || 'main';
  BGM.stop();
  setTimeout(() => { if(realtimeGameOpen) BGM.stop(); }, 0);
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
  if(!S || !S.realtime) return;
  const shell = realtimeShell();
  if(!shell.root || !shell.frame) return;
  closeModal(true);
  const requestId = S.realtime.requestId;
  const reuseFrame = shell.frame.dataset.requestId === requestId;
  if(!reuseFrame){
    shell.frame.dataset.requestId = requestId;
    shell.frame.src = realtimeUrl();
  }
  if(shell.title) shell.title.textContent = biomeById(S.realtime.mission.biome).name;
  shell.root.hidden = false;
  shell.root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('realtime-open');
  realtimeGameOpen = true;
  pauseManagerBgm();
  if(reuseFrame) postRealtimeVisibility(true);
  shell.frame.focus();
}

function closeRealtimeGame(destroyFrame){
  const shell = realtimeShell();
  const wasOpen = realtimeGameOpen;
  if(wasOpen) postRealtimeVisibility(false);
  if(shell.root){
    shell.root.hidden = true;
    shell.root.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('realtime-open');
  realtimeGameOpen = false;
  if(wasOpen){
    settleManagerRealtimeAbsence();
    resumeManagerBgm();
  }
  if(destroyFrame && shell.frame){
    shell.frame.src = 'about:blank';
    delete shell.frame.dataset.requestId;
  }
}

function finishRealtimeMission(){
  const summary = consumeRealtimeResult();
  if(!summary) return;
  closeRealtimeGame(true);
  renderAll();
  showRealtimeSummary(summary);
  save();
}

function startRealtimeMission(m, miner, cost){
  const requestId = 'rt'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const request = {
    version:1,
    id:requestId,
    createdAt:Date.now(),
    seed:realtimeSeed(m),
    mission:{
      id:m.id, type:m.type, biome:m.biome, realtimeBiome:REALTIME_BIOMES[m.biome]||'crystalline',
      hazard:m.hazard, rewards:m.r, clause:m.clause||null,
    },
    miner:{id:miner.id, cls:miner.cls, name:minerName(miner), level:miner.lv},
  };
  try{
    localStorage.setItem(REALTIME_BRIDGE.REQUEST_KEY, JSON.stringify(request));
    localStorage.removeItem(REALTIME_BRIDGE.RESULT_KEY);
  }catch(e){
    log('实时任务启动失败：浏览器拒绝写入任务交接数据。', 'bad');
    closeModal(true);
    return;
  }
  S.nitra -= cost;
  miner.state = 'mission';
  S.realtime = {
    requestId, missionId:m.id, minerId:miner.id, mission:JSON.parse(JSON.stringify(m)),
    nitraSpent:cost, startedAt:Date.now(),
  };
  S.board = S.board.filter(x=>x.id!==m.id);
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
  const miner = S.miners.find(x=>x.id===S.realtime.minerId);
  if(miner){ miner.state='idle'; miner.morale=clamp(miner.morale-15,10,100); }
  S.stats.realtimeFailed = (S.stats.realtimeFailed||0) + 1;
  log('实时任务已中止：矿工被紧急召回，士气 -15，出舱补给不退。', 'bad');
  S.realtime = null;
  clearRealtimeBridge();
  closeRealtimeGame(true);
  closeModal(true);
  renderAll();
  save();
}
function consumeRealtimeResult(){
  if(!S.realtime) return null;
  let result = null;
  try{ result = JSON.parse(localStorage.getItem(REALTIME_BRIDGE.RESULT_KEY)||'null'); }catch(e){}
  if(!result || result.requestId !== S.realtime.requestId) return null;
  const pending = S.realtime;
  const m = pending.mission;
  const miner = S.miners.find(x=>x.id===pending.minerId);
  if(!m || !miner) return null;
  const summary = {win:!!result.win, result, mission:m, miner:minerName(miner), gain:{}};
  if(result.win){
    const before = {credits:S.credits, nitra:S.nitra, morkite:S.morkite, moil:S.moil, gold:S.gold};
    const kills = Number(result.stats && result.stats.kills)||0;
    const gold = Number(result.deposited && result.deposited.gold)||0;
    const performance = clamp(0.85 + Math.min(kills,60)/300 + Math.min(gold,60)/600, 0.85, 1.15);
    settle({
      id:'live-'+pending.requestId, m, hc:1, minerIds:[miner.id],
      fitN:miner.cls===mtypeById(m.type).best?1:0, modEff:squadModEffects([miner.id]),
      bonus:1, rewardBonus:1, morkiteBuff:1, mode:'realtime', nitraSpent:pending.nitraSpent,
    }, false, performance);
    summary.performance = performance;
    Object.keys(before).forEach(k=>{ summary.gain[k] = Math.round((S[k]||0)-before[k]); });
    S.stats.realtimeWon = (S.stats.realtimeWon||0) + 1;
  }else{
    miner.state = 'idle';
    miner.morale = clamp(miner.morale-15,10,100);
    S.stats.realtimeFailed = (S.stats.realtimeFailed||0) + 1;
    log('实时任务失败：'+minerName(miner)+' 已归队，士气 -15。'+(result.failReason?' '+result.failReason:''), 'bad');
  }
  S.realtime = null;
  clearRealtimeBridge();
  save();
  return summary;
}
function showRealtimeSummary(summary){
  const r = summary.result;
  const elapsed = Math.max(0, Math.round(r.time||0));
  const elapsedText = Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0');
  const outcome = summary.win ? '任务完成' : '任务失败';
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
    closeRealtimeGame(false);
    renderAll();
    showPendingRealtime();
    save();
  });
}

window.addEventListener('message', event => {
  const shell = realtimeShell();
  if(!shell.frame || event.source !== shell.frame.contentWindow || event.origin !== location.origin) return;
  const data = event.data;
  if(!data || typeof data !== 'object' || !S || !S.realtime) return;
  if(data.requestId !== S.realtime.requestId) return;
  if(data.type === 'drg:realtime-ready'){
    postRealtimeVisibility(realtimeGameOpen);
    return;
  }
  if(data.type === 'drg:realtime-complete'){
    if(shell.title) shell.title.textContent = biomeById(S.realtime.mission.biome).name+' · 任务完成';
    return;
  }
  if(data.type === 'drg:realtime-return') finishRealtimeMission();
});

