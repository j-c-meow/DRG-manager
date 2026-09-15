# -*- coding: utf-8 -*-
"""补丁⑥：成就系统（四系统补充设计 §一，40 项）+ 计数器埋点"""
import io
FN = '游戏.html'
s = io.open(FN, encoding='utf-8').read()
orig = len(s)

def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, 'ANCHOR FAIL (%d): %s' % (c, old[:90])
    s = s.replace(old, new)

# ---------- ① ACHIEVEMENTS 40 项 + 引擎（插在 renderHeader 前） ----------
ach = """/* ---------------- 成就系统（四系统补充设计 §一，40 项） ---------------- */
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
  {id:'ach_v50',        name:'五十deserve',grp:'隐藏', rw:{credits:50},  ck:()=>!!S.flags.lcyf166_bless},
  {id:'ach_blackout',   name:'断片初体验', grp:'隐藏', rw:{credits:100}, ck:()=>!!S.flags.blackoutDrunk},
  {id:'ach_mystery',    name:'神秘莫测',   grp:'隐藏', rw:{credits:150}, ck:()=>!!S.flags.mysteryDrunk},
];
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
      if(rw.credits){ S.credits += rw.credits; parts.push('代币+'+rw.credits); }
      if(rw.rare){ RARES.forEach(rr => S.rare[rr] = (S.rare[rr]||0) + rw.rare); parts.push('稀有矿物全族+'+rw.rare); }
      if(rw.blank){ S.blanks = (S.blanks||0) + rw.blank; parts.push('空白模组+'+rw.blank); }
      if(rw.merit){ S.merit = (S.merit||0) + rw.merit; parts.push('功绩点+'+rw.merit); }
      log('🏆 成就达成【'+a.name+'】'+(parts.length ? '（'+parts.join('，')+'）' : ''), 'gold');
    }
  });
}

function renderHeader(){"""
rep("""function renderHeader(){""", ach)

# ---------- ② 引擎调用：renderIfChanged ----------
rep("""function renderIfChanged(){""",
    """function renderIfChanged(){
  try{ checkAchievements(); }catch(e){}""")

# ---------- ③ 计数器埋点 ----------
rep("""function applyDrinkImmediate(db){
  if(db.healNow){""",
    """function applyDrinkImmediate(db){
  S.stats.barDrinks = (S.stats.barDrinks||0) + 1;
  if(db.autoEvents) S.flags.blackoutDrunk = true;
  if(db.mystery) S.flags.mysteryDrunk = true;
  if(db.healNow){""")

rep("""      S.credits += refund;""",
    """      S.credits += refund;
      S.flags.wipeRescued = true;""")

rep("""  if(m.hazard >= 5 && !d.isDive) gainMerit(1, '危险 5 任务');""",
    """  if(m.hazard >= 5 && !d.isDive){ gainMerit(1, '危险 5 任务'); S.flags.hz5Done = true; }""")

rep("""    S.flags.karl = true;
    log(pick(NAMES_EGG), 'gold');""",
    """    S.flags.karl = true;
    S.flags.karlCount = (S.flags.karlCount||0) + 1;
    log(pick(NAMES_EGG), 'gold');""")

rep("""      S.nextDurMul = 0.9;   /* 下次派遣时长 -10%（doDispatch 消费） */
      S.catGrudge = Math.max(0, (S.catGrudge||0) - 1);""",
    """      S.nextDurMul = 0.9;   /* 下次派遣时长 -10%（doDispatch 消费） */
      S.catGrudge = Math.max(0, (S.catGrudge||0) - 1);
      S.flags.catPet = (S.flags.catPet||0) + 1;""")

rep("""  const gain = Math.floor(p2(S.market.prices[k]) * qty * (1-TRADE_FEE));
  S.credits += gain; S[k] -= qty;""",
    """  const gain = Math.floor(p2(S.market.prices[k]) * qty * (1-TRADE_FEE));
  S.credits += gain; S[k] -= qty;
  S.stats.tradeProfit = (S.stats.tradeProfit||0) + gain;""")

# 连续无伤 streak：settle 主路径
rep("""  S.stats.missions = (S.stats.missions||0) + 1;
  /* 托管收益面板：挂机券生效期间自动累计 */""",
    """  S.stats.missions = (S.stats.missions||0) + 1;
  if(!d.hurtIds || d.hurtIds.length === 0){ S.flags.streak = (S.flags.streak||0) + 1; }
  else { S.flags.streak = 0; }
  /* 托管收益面板：挂机券生效期间自动累计 */""")

# 挂机时长统计（tick）
rep("""  acc += dt;
  if(acc >= 1){ acc = 0; renderIfChanged(); save(); }
}, 1000);""",
    """  if(S.autoUntil && Date.now() < S.autoUntil) S.stats.idleSecs = (S.stats.idleSecs||0) + dt;
  acc += dt;
  if(acc >= 1){ acc = 0; renderIfChanged(); save(); }
}, 1000);""")

io.open(FN, 'w', encoding='utf-8', newline='').write(s)
print('PATCH6 OK %d -> %d (+%d)' % (orig, len(s), len(s) - orig))
