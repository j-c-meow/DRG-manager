'use strict';
/* ---------------- STATE ---------------- */
let S = null;
let dirHandle = null;
let speed = 1;
let curTab = 'roster';
document.body.dataset.mtab = 'roster';
window.__DRG_MANAGER_SETTINGS = {
  load(){
    return S && S.realtimeProfile ? JSON.parse(JSON.stringify(S.realtimeProfile)) : null;
  },
  save(profile){
    if(!S) return;
    S.realtimeProfile = JSON.parse(JSON.stringify(profile));
    save();
  },
};
function migrateLegacyRealtimeStorage(){
  try{
    if(!S.realtimeProfile){
      const legacy = JSON.parse(localStorage.getItem('drg-html-save-v1') || 'null');
      if(legacy) S.realtimeProfile = legacy;
    }
    localStorage.removeItem('drg-html-save-v1');
    localStorage.removeItem('drg_realtime_request_v1');
    localStorage.removeItem('drg_realtime_result_v1');
  }catch(e){}
}

/* —— 管理层称呼系统（用户 09-19 拍板）——
   玩家开局登记代号后，日志/文案里"称呼位"的管理层自动升级为「管理层·代号」。
   只命中称呼位：管理层后紧跟标点/空白/串尾；复合词（如"管理层入职培训""管理层决策"）不受影响。 */
function mgrTitle(){
  return (S && S.managerName) ? ('管理层·' + S.managerName) : '管理层';
}
function applyMgrTitle(msg){
  if(!S || !S.managerName) return msg;
  return String(msg).replace(/管理层(?=[，。！？、；：…—!? ]|$)/g, mgrTitle());
}

function log(msg, cls){
  if(msg === undefined || msg === null) msg = L('（日志异常，已捕获）');
  msg = applyMgrTitle(msg);
  S.log.unshift({t:clockStr(), m:String(msg), c:cls||''});
  if(S.log.length > 80) S.log.length = 80;
}

function newMiner(cls){
  const n = S.nextNum[cls]++;
  return {id:'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), cls, num:n,
          lv:1, xp:0, morale:80, state:'idle', medUntil:0, missions:0, stars:0, mAcc:0};
}
function newGame(){
  S = {
    v:2, schemaVersion:3, gm:480, lastReal:Date.now(),   // 从 D1 08:00 开始
    difficulty:{hz:1, nitra:1, ev:1, morale:1, yield:1, market:1},   /* F6：新档必须初始化难度乘区，否则首派 TypeError */
    credits:500, nitra:150, morkite:0, moil:0, gold:0,
    rare:{'玉石':0,'乌玛石':0,'铜矿':0,'妙绝珠':0,'吸铁石':0,'蜂母石':0,'容和石':0},
    rigLv:1,
    fac:{bar:1, medbay:0, gear:1},
    licenses:{scout:1, engineer:1, gunner:1, driller:1},
    miners:[], nextNum:{scout:1, engineer:1, gunner:1, driller:1},
    board:[], boardAt:0,
    deps:[], evSeq:0,
    kpi:{term:1, quota:CFG.KPI_FIRST, done:0},
    campaign:{ci:0, si:0, prog:0},
    holidayAct:null, holidayDone:{},
    market:{day:0, prices:{}, prev:{}}, lastDay:1, dayStats:{missions:0, credits:0, morkite:0, injured:0},
    elite:{owned:[], carry:null, rewindWeek:''},
    merit:0,
    trinkets:{}, trinketEq:null,
    blanks:0, modsOwned:{}, equipped:{}, drawSinceT1:0, rerolled:false,
    dive:{week:'', normal:{stage:0, done:false}, elite:{locked:true, stage:0, done:false}, modifiers:[]},
    log:[], flags:{}, speed:1, stats:{missions:0, inj:0}, mode:'idle', idleReport:null, muleLv:1,
    managerName:'',   /* 玩家代号：开局登记后，称呼位升级为「管理层·代号」 */
    unlocked:{kpi:false, bar:false, market:false, med:false, gear:false},
    recruited:{scout:true, engineer:false, gunner:false, driller:false},
    realtime:null, settledRealtime:{}, realtimeProfile:null,
  };
  DRGUnified.domain.migrateSave(S);
  migrateLegacyRealtimeStorage();
  S.miners.push(newMiner('scout'));
  genBoard();
  log(TEXT.log_welcome, 'sys');
  log(TEXT.log_tip_first, 'sys');
}

/* ---------------- SAVE / LOAD ---------------- */
function serial(){ return JSON.stringify(S); }
function save(){
  try{ localStorage.setItem(CFG.SAVE_KEY, serial()); }catch(e){}
  writeFolderSave();
}
function load(){
  const raw = localStorage.getItem(CFG.SAVE_KEY);
  if(!raw) return false;
  try{
    const d = JSON.parse(raw);
    if(!d || d.v !== 2) return false;
    S = d;
    DRGUnified.domain.migrateSave(S);
    migrateLegacyRealtimeStorage();
    if(!S.recruited) S.recruited = {scout:true, engineer:true, gunner:true, driller:true};
    if(S.managerName === undefined) S.managerName = '';
    if(!S.stats) S.stats = {missions:0, inj:0};
    if(!S.campaign) S.campaign = {ci:0, si:0, prog:0};
    if(S.blanks === undefined){ S.blanks = 0; S.modsOwned = {}; S.equipped = {}; }
    if(S.drawSinceT1 === undefined){ S.drawSinceT1 = 0; S.rerolled = false; }
    if(!S.dive){ S.dive = {week:'', normal:{stage:0,done:false}, elite:{stage:0,done:false}, modifiers:[]}; }
    if(!S.holidayDone) S.holidayDone = {};
    if(S.holidayAct === undefined) S.holidayAct = null;
    if(!S.market){ S.market = {day:0, prices:{}, prev:{}}; S.lastDay = 1; S.dayStats = {missions:0, credits:0, morkite:0, injured:0}; }
    if(typeof S.gm !== 'number') S.gm = 480;
    if(typeof S.lastReal !== 'number') S.lastReal = Date.now();
    if(!S.mode) S.mode = 'idle';
    if(!S.muleLv) S.muleLv = 1;
    /* B-9 旧档兼容：无 unlocked 字段视为旧档 → 按现有进度自动补齐解锁 */
    if(!S.unlocked){
      S.unlocked = {kpi:true, bar:true, market:true, med:true, gear:true};
      if(S.fac.bar >= 1 || S.flags.prologueDone) {} /* 保持 */
    }
    if(S.flags.prologueDone === undefined) S.flags.prologueDone = (S.stats.missions > 0);
    if(!S.difficulty) S.difficulty = {hz:1, nitra:1, ev:1, morale:1, yield:1, market:1};
    if(S.memorialTab === undefined) S.memorialTab = 0;
    if(S.idleReport === undefined) S.idleReport = null;
    if(!S.flags) S.flags = {};
    if(!S.rare) S.rare = {};
    if(!S.nextNum) S.nextNum = {};
    RARES.forEach(r => { if(typeof S.rare[r] !== 'number') S.rare[r] = 0; });
    ensureWeaponV2();
    if(!S.chronicle) S.chronicle = {lastNode:''};
    /* 重复员工清理（历史 bug：战役招募奖励无守卫导致同职业多人；每职业保留星级/等级最高者） */
    if(Array.isArray(S.miners) && S.miners.length > 4){
      const best = {};
      S.miners.forEach(m => {
        const score = (m.stars||0)*10000 + (m.lv||1)*100;
        if(!best[m.cls] || score > ((best[m.cls].stars||0)*10000 + (best[m.cls].lv||1)*100)) best[m.cls] = m;
      });
      const kept = Object.values(best);
      if(kept.length < S.miners.length){
        S.miners = kept;
        S.miners.forEach(m => { if(m.state === 'mission') m.state = 'idle'; });
      }
    }
    if(S.drawSinceT1 === undefined){ S.drawSinceT1 = 0; S.rerolled = false; }
    if(!S.elite){ S.elite = {owned:[], carry:null, rewindWeek:''}; }
    if(S.merit === undefined) S.merit = 0;
    if(!S.trinkets){ S.trinkets = {}; S.trinketEq = null; }
    if(S.realtime === undefined) S.realtime = null;
    const assignedMinerIds = new Set((Array.isArray(S.deps) ? S.deps : []).flatMap(d => Array.isArray(d.minerIds) ? d.minerIds : []));
    if(S.realtime && S.realtime.minerId) assignedMinerIds.add(S.realtime.minerId);
    S.miners.forEach(m => {
      if(m.state === 'mission' && !assignedMinerIds.has(m.id)) m.state = 'idle';
    });
    if(S.realtimeProfile === undefined){
      S.realtimeProfile = S.realtimeOpts || null;
      delete S.realtimeOpts;
    }
    if(!Array.isArray(S.board)) S.board = [];
    if(!S.board.some(m => m && m.type === 'exp')) S.board.push(genMission('exp'));
    return true;
  }catch(e){ return false; }
}
function exportSave(){
  const blob = new Blob([serial()], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'drg_save_'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  log(TEXT.log_save_export, 'good');
}
function importSave(){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = () => {
      try{
        const d = JSON.parse(r.result);
        if(d && d.v === 2){ S = DRGUnified.domain.migrateSave(d); if(!S.difficulty) S.difficulty = {hz:1, nitra:1, ev:1, morale:1, yield:1, market:1}; if(S.flags.prologueDone === undefined) S.flags.prologueDone = ((S.stats && S.stats.missions) > 0); log(TEXT.log_save_import_ok, 'good'); renderAll(); }
        else log(TEXT.log_save_import_ver, 'bad');
      }catch(e){ log(TEXT.log_save_import_bad, 'bad'); }
    };
    r.readAsText(f);
  };
  inp.click();
}

/* 存档文件夹（Chrome/Edge File System Access API） */
function idb(){ return new Promise((res,rej)=>{
  const rq = indexedDB.open('drg-mgr', 1);
  rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
  rq.onsuccess = () => res(rq.result);
  rq.onerror = () => rej(rq.error);
});}
async function idbSet(k,v){ const db = await idb(); return new Promise((res,rej)=>{
  const tx = db.transaction('kv','readwrite'); tx.objectStore('kv').put(v,k);
  tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });}
async function idbGet(k){ const db = await idb(); return new Promise((res,rej)=>{
  const tx = db.transaction('kv','readonly'); const rq = tx.objectStore('kv').get(k);
  rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });}

async function bindFolder(){
  if(!window.showDirectoryPicker){
    log(TEXT.log_bind_unsupported, 'bad'); return;
  }
  try{
    dirHandle = await window.showDirectoryPicker({mode:'readwrite'});
    await idbSet('dir', dirHandle);
    await writeFolderSave();
    log(TEXT.log_bind_ok.replace('{path}', dirHandle.name), 'good');
    renderSide();
  }catch(e){ /* 用户取消 */ }
}
async function writeFolderSave(){
  if(!dirHandle) return;
  try{
    let perm = await dirHandle.queryPermission({mode:'readwrite'});
    if(perm !== 'granted') perm = await dirHandle.requestPermission({mode:'readwrite'});
    if(perm !== 'granted') return;
    const fh = await dirHandle.getFileHandle('drg_save.json', {create:true});
    const w = await fh.createWritable();
    await w.write(serial()); await w.close();
  }catch(e){ log(TEXT.log_bind_fail.replace('{err}', e.message), 'bad'); }
}
async function restoreFolderSave(){
  if(!dirHandle){ log(TEXT.log_bind_none, 'bad'); return; }
  try{
    const fh = await dirHandle.getFileHandle('drg_save.json');
    const t = await fh.getFile();
    const d = JSON.parse(await t.text());
    if(d && d.v === 2){ S = DRGUnified.domain.migrateSave(d); if(!S.difficulty) S.difficulty = {hz:1, nitra:1, ev:1, morale:1, yield:1, market:1}; if(S.flags.prologueDone === undefined) S.flags.prologueDone = ((S.stats && S.stats.missions) > 0); log(TEXT.log_restore_ok, 'good'); renderAll(); }
    else log(TEXT.log_restore_ver, 'bad');
  }catch(e){ log(TEXT.log_restore_fail, 'bad'); }
}

/* ---------------- UTIL ---------------- */
const $ = s => document.querySelector(s);
const fmt = n => Math.floor(n).toLocaleString('zh-CN');
const rnd = (a,b) => a + Math.random()*(b-a);
const irnd = (a,b) => Math.floor(rnd(a,b+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
function clockStr(){
  const total = Math.floor(S.gm) + 480;
  const day = Math.floor(total/1440) + 1;
  const hh = String(Math.floor(total%1440/60)).padStart(2,'0');
  const mm = String(Math.floor(total%60)).padStart(2,'0');
  return 'D'+day+' '+hh+':'+mm;
}
function gameDay(){ return Math.floor((S.gm + 480)/1440) + 1; }
function minerName(m){ return m ? (L(CLASSES[m.cls].short) + '-' + m.num) : L('神秘矮人'); }
function biomeById(id){ return BIOMES.find(b=>b.id===id); }
function mtypeById(id){ return MTYPES.find(m=>m.id===id); }
function unlockedBiomes(){ const t = rigTier(); return BIOMES.filter(b=>b.tier<=t); }
function rigTier(){ return clamp(1 + Math.floor((S.rigLv-1)/2), 1, 5); }
function hcCap(){ return clamp(1 + Math.ceil(S.rigLv/2), 2, 4); }
function depCap(){ return clamp(2 + Math.floor(S.rigLv/3), 2, 6); }
function rigYield(){ return 1 + 0.15*(S.rigLv-1); }
function idleMiners(cls){ return S.miners.filter(m=>m.cls===cls && m.state==='idle' && m.morale>=25); }

