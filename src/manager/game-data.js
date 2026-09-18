'use strict';
/* =========================================================
 * 深岩银河 · 17号钻台管理终端
 * 粉丝非商用二创 | 管理模式入口 | 数据驱动
 * 文案素材：官方本地化文本与社区整理内容
 * ========================================================= */

/* ---------------- CONFIG ---------------- */
const CFG = {
  SAVE_KEY: 'drg_mgr_v02',
  RATE: 1,             // 用户拍板：现实 1 秒 = 游戏 1 分钟（挂机节奏；×60/×600 仍可加速）
  OFFLINE_EFF: 0.1,    // 离线效率 10%
  HAZ: [1, 1.33, 1.67, 2, 2.33],
  HC_FAC: [1, 0.74, 0.645, 0.51],      // 1~4人 时长缩短
  HC_YIELD: [1, 1.6, 2.1, 2.5],        // 1~4人 总产出加成（分摊前）
  HIRE_BASE: 200, HIRE_MUL: 1.15,      /* 数值表 §〇 拍板值（v1.5 对齐回调） */
  RIG_MAX: 10,                          /* 紧急修复：此前未定义导致钻井平台永远无法升级（玩家卡关） */
  KPI_FIRST: 500, KPI_MUL: 1.6, KPI_BONUS: 800,
};

const REALTIME_BIOMES = DRG_SHARED.realtimeBiomeByManagerId;
const BIOMES = DRG_SHARED.managerBiomes.map(b => ({
  id:b.id, name:b.name, tier:b.tier, pair:Array.from(b.pair),
}));

const MTYPES = [
  {id:'exp',   name:'采矿探险', rig:1, min:360, r:{credits:220, morkite:70,  nitra:30},            best:'scout'},
  {id:'point', name:'定点提取', rig:1, min:240, r:{credits:180, morkite:45,  gold:2},              best:'scout'},
  {id:'refi',  name:'就地精炼', rig:2, min:480, r:{credits:300, moil:45,     nitra:45},            best:'engineer'},
  {id:'escort',name:'执勤护送', rig:7, min:400, r:{credits:280, gold:3,      nitra:25},            best:'gunner'},
  {id:'salv',  name:'搜救行动', rig:4, min:300, r:{credits:240, morkite:50,  gold:1},              best:'driller'},
  {id:'elim',  name:'消灭任务', rig:4, min:320, r:{credits:260, morkite:30,  gold:3},              best:'gunner'},
];

const CLASSES = {
  scout:   {name:'侦察兵', short:'侦察', rig:1, combat:1.0,  mine:1.2,  best:1,
            w:['深核 GK2 突击步枪','M1000 经典型步枪','DRAK-25 电浆卡宾枪'], lic:{m:'玉石',   q:[25,60]}},
  engineer:{name:'工程师', short:'工程', rig:2, combat:1.15, mine:1.0,  best:1,
            w:['"疣猪" 210 自动霰弹枪','LOK-1 智能步枪','「百万」伏特微型冲锋枪'],        lic:{m:'吸铁石', q:[25,60]}},
  gunner:  {name:'枪手',   short:'枪手', rig:4, combat:1.4,  mine:0.85, best:1,
            w:['"铅暴" 转管机枪','"雷暴云砧" 重型双管机炮','"飓风" 制导火箭系统'], lic:{m:'蜂母石', q:[25,60]}},
  driller: {name:'钻机手', short:'钻机', rig:6, combat:1.25, mine:1.1,  best:1,
            w:['CRSPR 火焰喷射器','急冻喷射炮','蚀泥喷射泵'],                 lic:{m:'乌玛石', q:[25,60]}},
};
const RIG_LADDER = [
  [2, '解锁：工程师 + 就地精炼 + 深渊酒吧'],
  [3, '解锁：危险等级 2'],
  [4, '解锁：枪手 + 搜救行动/消灭任务 + 装备终端'],
  [5, '解锁：危险等级 3'],
  [6, '解锁：钻机手 + 黑墨菱酒上架'],
  [7, '解锁：危险等级 4 + 执勤护送'],
  [9, '解锁：危险等级 5'],
  [10, '解锁：精英支援位购买资格'],
];
const SECOND_LIC = {scout:'妙绝珠', engineer:'乌玛石', gunner:'铜矿', driller:'玉石'};

/* ---------------- 战役系统 ---------------- */
const CAMPAIGNS = [
  {id:'c1', name:'管理层入职培训', steps:[
    {type:'mission', target:'exp', need:2, txt:'完成 2 次采矿探险'},
    {type:'mineral', target:'morkite', need:80, txt:'上缴 80 墨菱石'}],
   rw:{credits:300, nitra:60}, rwTxt:'300 代币 + 硝石×60'},
  {id:'c2', name:'深渊酒吧开业', steps:[
    {type:'mission', target:'refi', need:2, txt:'完成 2 次就地精炼'},
    {type:'rare', need:10, txt:'掉落稀有矿物 10 块'}],
   rw:{recruit:'engineer', rare_bismor:10}, rwTxt:'免费招募工程师 + 蜂母石×10'},
  {id:'c3', name:'挖更深一点', steps:[
    {type:'hazard', target:2, need:3, txt:'完成 3 次危险 ≥2 的任务'}],
   rw:{credits:500, gold:5}, rwTxt:'500 代币 + 黄金×5'},
  {id:'c4', name:'枪手上岗', steps:[
    {type:'mission', target:'elim', need:1, txt:'完成 1 次消灭任务'},
    {type:'hazard', target:2, need:2, txt:'完成 2 次危险 ≥2 的任务'}],
   rw:{recruit:'gunner', credits:400}, rwTxt:'免费招募枪手 + 400 代币'},
  {id:'c5', name:'装备热身', steps:[
    {type:'license', need:1, txt:'升级 1 次任意武器凭证'}],
   rw:{credits:300, rare_magnite:10}, rwTxt:'300 代币 + 吸铁石×10'},
  {id:'c6', name:'猎虫执照', steps:[
    {type:'elite', need:1, txt:'猎杀 1 只精英异虫'}],
   rw:{credits:600, rare_jadiz:10}, rwTxt:'600 代币 + 玉石×10'},
  {id:'c7', name:'深处有动静', steps:[
    {type:'mission', target:'salv', need:1, txt:'完成 1 次搜救行动'},
    {type:'rare', need:20, txt:'掉落稀有矿物 20 块'}],
   rw:{recruit:'driller', rare_umanite:20}, rwTxt:'免费招募钻机手 + 乌玛石×20'},
  {id:'c8', name:'矿物大单', steps:[
    {type:'mineral', target:'morkite', need:400, txt:'上缴 400 墨菱石'}],
   rw:{credits:800, rare_enor:10}, rwTxt:'800 代币 + 妙绝珠×10'},
  {id:'c9', name:'猎虫老手', steps:[
    {type:'elite', need:3, txt:'猎杀精英异虫 3 只'},
    {type:'hazard', target:3, need:2, txt:'完成 2 次危险 ≥3 的任务'}],
   rw:{gold:20, rare_hollomite:30}, rwTxt:'黄金×20 + 容和石×30'},
  {id:'c10', name:'集团大单', steps:[
    {type:'kpi', need:1, txt:'达成 1 次季度 KPI'},
    {type:'hazard', target:4, need:3, txt:'完成 3 次危险 ≥4 的任务'}],
   rw:{credits:2000, rare_jadiz:20}, rwTxt:'2,000 代币 + 玉石×20'},
];
/* 主线战役按游戏日渐进解锁（时间线：慢慢解开才有沉浸感） */
/* ---------------- 日期与编年史系统（B-7）----------------
   游戏第 1 天 = DRG 1.0 发售日 2020-05-13；日期是 gameDay 的纯函数，旧档零迁移 */
const CHRONICLE = {
  epoch: "2020-05-13",
  finaleDate: "2026-09-14",
  jumpOnCampaignClear: true,
  sleepButtons: { day1: true, week7: { cost: 500 } },
  endless: { rotateFestivals: true, campaignDifficultyPerLoop: 1.08 },
  nodes: [
    { date:"2020-05-13", id:"launch",  name:"正式发售",     kind:"origin",   camp:0 },
    { date:"2021-05-13", id:"anniv1",  name:"一周年",       kind:"anniv",    camp:1 },
    { date:"2021-11-04", id:"s1",      name:"第一赛季",     kind:"season",   camp:2 },
    { date:"2022-04-28", id:"s2",      name:"第二赛季",     kind:"season",   camp:3 },
    { date:"2023-02-09", id:"s3",      name:"第三赛季",     kind:"season",   camp:4 },
    { date:"2023-11-02", id:"s4",      name:"第四赛季",     kind:"season",   camp:5 },
    { date:"2024-06-13", id:"s5",      name:"第五赛季",     kind:"season",   camp:6 },
    { date:"2025-09-04", id:"s6",      name:"第六赛季",     kind:"season",   camp:7 },
    { date:"2026-02-10", id:"lunar",   name:"春节（终场）", kind:"festival", camp:8 },
    { date:"2026-09-14", id:"finale",  name:"清账行动",     kind:"finale",   camp:9 }
  ]
};
const EPOCH_MS = Date.parse(CHRONICLE.epoch + "T00:00:00Z");
function dayToDate(day){ return new Date(EPOCH_MS + (day-1)*86400000); }
function dateOfStr(day){
  const d = dayToDate(day);
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth()+1).padStart(2,'0') + '-' + String(d.getUTCDate()).padStart(2,'0');
}
function dateToDay(str){ return Math.round((Date.parse(str + "T00:00:00Z") - EPOCH_MS)/86400000) + 1; }
CHRONICLE.nodes.forEach(n => { n.day = dateToDay(n.date); });
function lastNode(day){ let r = null; for(const n of CHRONICLE.nodes){ if(day >= n.day) r = n; } return r; }
function nextNode(day){ for(const n of CHRONICLE.nodes){ if(n.day > day) return n; } return null; }
function isEndless(){ return gameDay() > dateToDay(CHRONICLE.finaleDate); }
/* 编年史节点播报（每日简报/跳跃/睡觉后调用；跨多个节点只报最新一个） */
function chronicleTick(){
  S.chronicle = S.chronicle || { lastNode: '' };
  const nd = lastNode(gameDay());
  if(nd && nd.id !== S.chronicle.lastNode){
    S.chronicle.lastNode = nd.id;
    if(nd.kind === 'anniv'){
      log(TEXT.ch_node_anniv.replace('{years}', Math.max(1, Math.round((nd.day-1)/365))), 'gold');
    } else if(nd.kind === 'finale'){
      log(TEXT.ch_finale_open, 'gold');
    } else if(nd.kind !== 'origin'){
      log(TEXT.ch_node_season.replace('{name}', L(nd.name)), 'gold');
    }
  }
  if(!S.flags.chEndless && isEndless()){
    S.flags.chEndless = true;
    log(TEXT.ch_finale_endless, 'gold');
  }
}

/* 终局战役「清账行动」（B-7 §三/§6-5 默认规则：保证金=累计账单×0.5，完成返还×3）+ 无尽程序化战役 */
function buildFinaleCampaign(){
  const fee = Math.min(Math.max(Math.round((S.stats.billsTotal||0) * 0.5), 2000), 8000);   /* 保底 2000，封顶 8000 */
  return { id:'finale', name:'清账行动', fee: fee, steps:[
    {type:'mission', target:'elim', need:5, txt:'完成 5 次消灭任务'},
    {type:'hazard',  target:5, need:3, txt:'完成 3 次危险 5 任务'},
    {type:'mineral', target:'morkite', need:3000, txt:'上缴 3000 墨菱石'} ],
    rw:{}, rwTxt:'退还保证金 ×3 + 编年史收官' };
}
function buildEndlessCampaign(loop){
  const mul = Math.pow(CHRONICLE.endless.campaignDifficultyPerLoop || 1.08, loop);
  const t = ['exp','point','refi','salv','elim','escort'][Math.floor(Math.random()*6)];
  const tn = mtypeById(t) ? mtypeById(t).name : t;
  const c = Math.round(1200*mul), mk = Math.round(500*mul), gd = Math.round(8*mul);
  return { id:'endless'+loop, name:'无尽委托 · 第 '+(loop+1)+' 轮', enName:'Endless Contract · Round '+(loop+1), endless:true, steps:[
    {type:'mission', target:t, need:4, txt:L('完成 4 次')+L(tn)},
    {type:'hazard',  target:5, need:2, txt:L('完成 2 次危险 5 任务')} ],
    rw:{credits:c, morkite:mk, gold:gd}, rwTxt: fmt(c)+L(' 代币 + ')+L('墨菱石')+'×'+fmt(mk)+' + '+L('黄金')+'×'+gd };
}
function ensureCampaignQueue(){
  const c = S.campaign; if(!c) return;
  if(c.ci < CAMPAIGNS.length) return;
  const finNode = CHRONICLE.nodes.find(n => n.id === 'finale');
  const openDay = (finNode ? finNode.day : 2316) - 30;   /* 编年史最后 30 天开启 */
  if(!S.flags.finaleDone && gameDay() >= openDay){
    CAMPAIGNS.push(buildFinaleCampaign());
  } else if(isEndless()){
    CAMPAIGNS.push(buildEndlessCampaign(c.loop||0));
  }
}
/* 节日战役：按现实月份联动（对齐原作 live event 日历，pak 内 7 个 Holiday_ 文件夹一一对应） */
const HOLIDAYS = [
  {id:'lunar',   name:'农历新年', win:[1,20,3,10],  fest:'fest_lunar',   rw:{credits:800,  rare_hollomite:30}, rwTxt:'800 代币 + 容和石×30', steps:[{kind:'missions', need:5, txt:'节日期间完成 5 次派遣'}]},
  {id:'anniv',   name:'集团周年庆', win:[2,26,3,16],  fest:'fest_anniv',   rw:{credits:1000, gold:15},          rwTxt:'1,000 代币 + 黄金×15', steps:[{kind:'missions', need:6, txt:'节日期间完成 6 次派遣'}]},
  {id:'egg',     name:'春日猎蛋', win:[3,31,4,24],  fest:'fest_egg',     rw:{credits:700,  rare_jadiz:15},    rwTxt:'700 代币 + 玉石×15', steps:[{kind:'missions', need:4, txt:'节日期间完成 4 次派遣'}]},
  {id:'beach',   name:'夏日沙滩派对', win:[8,1,8,15], fest:'fest_beach',   rw:{credits:700, rare_croppa:15},  rwTxt:'700 代币 + 铜矿×15', steps:[{kind:'missions', need:5, txt:'节日期间完成 5 次派遣'}]},
  {id:'oktober', name:'啤酒节',   win:[9,23,10,7],  fest:'fest_oktoberfest', rw:{credits:800,  rare_bismor:15},   rwTxt:'800 代币 + 蜂母石×15', steps:[{kind:'missions', need:4, txt:'节日期间完成 4 次派遣'}]},
  {id:'hallow',  name:'万圣惊魂夜', win:[10,24,11,7], fest:'fest_hallow',  rw:{credits:900,  rare_enor:15},     rwTxt:'900 代币 + 妙绝珠×15', steps:[{kind:'missions', need:4, txt:'节日期间完成 4 次派遣'},{kind:'elite', need:1, txt:'猎杀 1 只精英异虫'}]},
  {id:'xmas',    name:'圣诞尤节', win:[12,19,1,7],  fest:'fest_xmas',    rw:{credits:900,  rare_umanite:15},  rwTxt:'900 代币 + 乌玛石×15', steps:[{kind:'missions', need:5, txt:'节日期间完成 5 次派遣'}]},
];
function holidayForNow(){
  /* B-7：节日档期判据=编年史日期（游戏日逐日对应现实日历）；无尽模式按年自动循环 */
  const now = dayToDate(gameDay());
  const mdNum = (now.getUTCMonth()+1)*100 + now.getUTCDate();
  const year = now.getUTCFullYear();
  for(const h of HOLIDAYS){
    let [sm, sd, em, ed] = h.win;
    const s = sm*100+sd, e = em*100+ed;
    const inWin = (s <= e) ? (mdNum >= s && mdNum <= e) : (mdNum >= s || mdNum <= e);
    if(inWin){
      const key = h.id + '-' + year;
      if((S.holidayDone||{})[key]) return null;
      return {key, h};
    }
  }
  return null;
}
/* ---------------- 矿物交易市场（每日 ±10% 涨跌停，5% 手续费） ---------------- */
const TRADEABLES = [
  {k:'morkite',   name:'墨菱石', base:3},
  {k:'moil',      name:'墨菱油', base:4},
  {k:'gold',      name:'黄金',   base:8},
  {k:'jadiz',     name:'玉石',   base:14},
  {k:'umanite',   name:'乌玛石', base:10},
  {k:'croppa',    name:'铜矿',   base:7},
  {k:'enor',      name:'妙绝珠', base:15},
  {k:'magnite',   name:'吸铁石', base:11},
  {k:'bismor',    name:'蜂母石', base:9},
  {k:'hollomite', name:'容和石', base:4},
];
const TRADE_FEE = 0.05;   // 交易手续费
const DAY_CAP = 0.10;     // 单日涨跌停 ±10%
const TIPS = [
  '硝石是派遣的命脉。任务会带回硝石，但满编队永远嫌不够。',
  '危险等级越高报酬系数越高——前提是，活着回来。',
  '完成三提石任务可得空白模组，锻造台 3 选 1 抽卡。10 抽内必出 T1 毕业档。',
  '抽到重复模组会触发免费重抽。集团管这叫"用户关怀"。',
  '士气低于 25 的矮人会拒绝下矿。深渊酒吧一轮就管用——但要花钱。',
  '红糖可以在医疗站抵扣账单。集团：先抢救，后收费。',
  '市场有涨有跌。追涨杀跌之前，先想想你的 KPI。',
  '墨菱石既是钻井平台的升级材料，也是 KPI 指标。抛售之前想清楚。',
  '本终端对烧伤不予理赔。谢谢配合。',
  '晋升会重置等级，但晋升框加成永久生效。集团鼓励长期奋斗。',
  '精英异虫掉好东西——但也真的会还手。',
  '离线期间钻台以 10% 效率运转。集团认为这已经很慷慨了。',
  '任务指挥的每句"祝你好运"都是字面意思：剩下的看运气。',
  '挖到手软，赚到盆满。今天也要安全地把矿骡装满。',
];
function campProgress(kind, match, amount){
  const c = S.campaign; if(!c) return;
  const camp = CAMPAIGNS[c.ci]; if(!camp) return;
  /* 时间线门（B-7）：战役解锁改编年史节点驱动（游戏日=现实日历日） */
  const cnd0 = CHRONICLE.nodes[c.ci];
  const needDay = cnd0 ? cnd0.day : 1;
  if(gameDay() < needDay) return;
  /* 清账行动入场保证金（激活即冻结一次） */
  if(camp.fee && !camp.feeCharged){
    const charge = Math.min(camp.fee, S.credits);
    S.credits -= charge; camp.feeCharged = true;
    log(L('【清账行动】保证金 ')+fmt(charge)+L(' 代币已冻结。六年旧账，今日清算——完成返还 ×3。'), 'sys');
  }
  const st = camp.steps[c.si]; if(!st || st.type !== kind) return;
  if(kind === 'mission' && st.target !== match) return;
  if(kind === 'hazard' && match < st.target) return;
  c.prog = Math.min(st.need, c.prog + (amount||1));
  if(c.prog >= st.need){
    c.si++; c.prog = 0;
    log(TEXT.log_camp_done.replace('{goal}', st.txt), 'good');
    if(c.si >= camp.steps.length){
      const parts = [];
      const rw = camp.rw||{};
      if(rw.credits){ S.credits += rw.credits; parts.push(rw.credits+L(' 代币')); }
      if(rw.nitra){ S.nitra += rw.nitra; parts.push(L('硝石×')+rw.nitra); }
      if(rw.gold){ S.gold += rw.gold; parts.push(L('黄金×')+rw.gold); }
      if(rw.recruit){
        S.recruited[rw.recruit] = true;
        if(S.miners.some(m=>m.cls===rw.recruit)){
          S.credits += 300;
          parts.push(L('重复招募折算 300 代币'));
          log(L('该职业已有在册员工，集团把招募奖金折成了 300 代币——感谢你帮财务省了一笔。'), 'sys');
        } else {
          const m = newMiner(rw.recruit); S.miners.push(m);
          parts.push(L('免费招募 ')+minerName(m));
        }
      }
      Object.entries(rw).forEach(([k,v])=>{
        if(k.startsWith('rare_')){
          const key = k.slice(5);
          const mm = Object.keys(MKEY).find(name => MKEY[name] === key);
          if(mm){ S.rare[mm] += v; parts.push(L(mm)+'×'+v); }
          else log(L('【战役】奖励反查失败：rare_')+key+L(' 不在 MKEY 表，该笔奖励未发放——请核对战役表键名。'), 'sys');
        }
      });
      if(camp.id === 'finale'){
        S.flags.finaleDone = true;
        if(camp.fee && camp.feeCharged){
          const back = Math.round(camp.fee * 3);
          S.credits += back; parts.push('保证金退还 ×3（'+fmt(back)+' 代币）');
          log(L('【编年史】账清了。Rock and Stone——17号钻台的账本，从今天起是干净的。'), 'gold');
        }
      }
      if(camp.endless){ S.campaign.loop = (S.campaign.loop||0) + 1; }
      log(TEXT.log_camp_clear.replace('{name}', L(camp.name))+L(' 奖励：')+parts.join(L('、')), 'gold');
      c.ci++; c.si = 0; c.prog = 0;
      /* B-7 跳跃机制：完成战役链 → 快进至下一编年史节点（跳过天数按日均折算入账；节日/赛季节点不跳过——跳跃目标即下一节点） */
      if(CHRONICLE.jumpOnCampaignClear && !isEndless()){
        const nn = nextNode(gameDay());
        if(nn){
          const skip = nn.day - gameDay();
          if(skip > 0){
            /* B 反馈①：跳跃用 offline worldAdvance 真推派遣（深潜/任务不再冻结；已暂停的事件保持等玩家） */
            worldAdvance(skip * 1440, true);
            S.lastReal = Date.now();
            const pkgC = skip * 120, pkgN = skip * 25;
            S.credits += pkgC; S.nitra += pkgN;
            log(TEXT.ch_jump_brief.replace('{days}', skip)+L('（折算入账 ')+fmt(pkgC)+L(' 代币 + ')+fmt(pkgN)+L(' 硝石）'), 'sys');
          }
        }
      }
      chronicleTick();
      ensureCampaignQueue();
      const nxt = CAMPAIGNS[c.ci];
      if(nxt) log(TEXT.log_camp_new.replace('{name}', L(nxt.name))+L(' 集团永不满足。'), 'sys');
      else log(L('战役队列已空。集团正在起草新的大单。'), 'sys');
    }
  }
}

/* 酒吧 v1.6 改版（B 退回项④，数值表 §3.5）：士气制 → 原作功能性 buff 制；一次派遣带 1 款，后饮覆盖 */
/* ---------------- 矿骡升级线（四系统补充设计 §四） ---------------- */
const MULE_UPGRADES = [
  {lv:2, cost:{'玉石':30, '乌玛石':30}, name:'自动收集', txt:'任务结算时矿骡自动拾取遗漏——墨菱石产出 +20%'},
  {lv:3, cost:{'玉石':60, '乌玛石':60, '蜂母石':30}, name:'超载运输', txt:'矿骡多背了一倍——硝石返还 +50%'},
];

/* ---------------- 酒吧 v2：抽酒制（执行单 §一，用户拍板） ---------------- */
const DRINK_POOL = [
  {name:'油头精酿',        en:'Oily Oaf Brew',        rarity:'常见', w:50, icon:'assets/anim/drinks/drink_01.png',     buff:{yield:10},                txt:'全队产出 +10%'},
  {name:'叶子情人特调',    en:"Leaf Lover's Special", rarity:'常见', w:50, icon:'assets/anim/drinks/drink_02.png',   buff:{healNow:1, medBill:-30},  txt:'轻伤全愈 + 账单 -30%'},
  {name:'黑墨菱酒',        en:'Dark Morkite Ale',     rarity:'少见', w:30, icon:'assets/anim/drinks/drink_04.png', buff:{morkite:25},              txt:'主矿物产出 +25%'},
  {name:'隧道老鼠',        en:'Tunnel Rat',           rarity:'常见', w:50, icon:'assets/anim/drinks/drink_05.png',     buff:{durMul:0.9},              txt:'任务时长 -10%'},
  {name:'亚肯黑啤',        en:'Arken Blackout',       rarity:'常见', w:50, icon:'assets/anim/drinks/drink_06.png', buff:{moraleHit:-5},            txt:'士气 -5%（喝多了）', bad:1},
  {name:'红岩爆破手',      en:'Red Rock Blaster',     rarity:'少见', w:30, icon:'assets/anim/drinks/drink_03.png',     buff:{shield:1},                txt:'重伤判定免除 1 例'},
  {name:'昏迷黑啤',        en:'Blackout Stout',       rarity:'少见', w:30, icon:'assets/anim/drinks/drink_07.png', buff:{autoEvents:1},            txt:'本次派遣无法手动操作（喝倒了，自动接管）', bad:1},
  {name:'虫洞特酿',        en:'Wormhole Special',     rarity:'少见', w:30, icon:'assets/anim/drinks/drink_08.png',   buff:{evSucc:10},               txt:'事件成功率 +10%'},
  {name:'氧气助推',        en:'Oxygen Boost',         rarity:'少见', w:30, icon:'assets/anim/drinks/drink_09.png',     buff:{rareBoost:8},             txt:'稀有掉落 +8%'},
  {name:'碎颅者麦酒',      en:'Skull Crusher Ale',    rarity:'精英', w:15, icon:'assets/anim/drinks/drink_10.png',     buff:{checkT:15},               txt:'事件检定 +15%'},
  {name:'杀手黑啤',        en:'Slayer Stout',         rarity:'精英', w:15, icon:'assets/anim/drinks/drink_11.png', buff:{yield:20},                txt:'全队产出 +20%'},
  {name:'仲裁者黑啤',      en:'Arbitrator',           rarity:'精英', w:15, icon:'assets/anim/drinks/drink_12.png',   buff:{medBill:-40},             txt:'医疗账单 -40%'},
  {name:'岩石甜心',        en:'Rocky Mountain',       rarity:'精英', w:15, icon:'assets/anim/drinks/drink_13.png',     buff:{xpPer:20},                txt:'全队 XP +20/任务'},
  {name:'麦芽星果特调',    en:'Malt Star',            rarity:'精英', w:15, icon:'assets/anim/drinks/drink_14.png',   buff:{xpPer:30},                txt:'全队 XP +30/任务'},
  {name:'昏迷黑啤·特浓',   en:'Blackout Stout ×',     rarity:'传说', w:5,  icon:'assets/anim/drinks/drink_15.png', buff:{autoEvents:1, durMul:1.2}, txt:'无法操作 + 时长 +20%（彻底喝倒了）', bad:1},
  {name:'🎰 神秘特调',     en:'Mystery Special',      rarity:'传说', w:5,  icon:'assets/anim/drinks/drink_16.png',     buff:{mystery:1},               txt:'随机复制本池任一效果'},
];
const REROLL_COST = 150;   /* 酒吧「再抽一轮」价格 */
function rollDrink(){
  const tot = DRINK_POOL.reduce((a, x) => a + x.w, 0);
  let r = Math.random() * tot, pickD = DRINK_POOL[0];
  for(const x of DRINK_POOL){ r -= x.w; if(r <= 0){ pickD = x; break; } }
  let eff = pickD.buff;
  if(eff.mystery){
    const pool2 = DRINK_POOL.filter(x => !x.buff.mystery);
    pickD = pool2[Math.floor(Math.random() * pool2.length)];
    eff = pickD.buff;
    log(L('🎰 神秘特调开出了「') + L(pickD.name) + L('」的效果！'), 'sys');
  }
  return Object.assign({ dname: pickD.name, rarity: pickD.rarity, icon: pickD.icon, bad: pickD.bad || 0, txt: pickD.txt }, eff);
}
function applyDrinkImmediate(db){
  S.stats.barDrinks = (S.stats.barDrinks||0) + 1;
  if(db.autoEvents) S.flags.blackoutDrunk = true;
  if(db.mystery) S.flags.mysteryDrunk = true;
  if(db.healNow){
    let healed = 0;
    S.miners.forEach(m => { if(m.state === 'med'){ m.state = 'idle'; m.medUntil = 0; healed++; } });
    if(healed) log(L('叶子情人特调下肚，') + healed + L(' 名伤员当场满血归队。'), 'good');
  }
  if(db.moraleHit) S.miners.forEach(m => m.morale = clamp(m.morale + db.moraleHit, 0, 100));
}
function rerollDrink(){
  if(S.fac.bar < 1) return;
  if(S.credits < REROLL_COST){ log(L('再抽一轮要 ') + REROLL_COST + L(' 代币，财务部拒绝预支。'), 'bad'); return; }
  S.credits -= REROLL_COST;
  S.activeDrinkBuff = rollDrink();
  const db = S.activeDrinkBuff;
  log(L('🍻 再抽一轮：「') + L(db.dname) + L('」（') + L(db.rarity) + L('）') + L(db.txt) + L('。'), db.bad ? 'bad' : 'gold');
  applyDrinkImmediate(db);
  showModal('<h3 style="color:var(--amber)">'+L('🎲 再抽一轮')+'</h3>' + animDiv('drink_draw', 96, 132) +
    '<div class="meta">'+L('「')+'<b style="color:var(--amber)">' + L(db.dname) + '</b>'+L('」（') + L(db.rarity) + L('）') + L(db.txt) + '</div>' +
    '<button class="btn pri" style="width:100%;margin-top:6px" onclick="closeModal(true)">'+L('干杯')+'</button>', false);
  renderAll(); save();
}

const RARES = ['玉石','乌玛石','铜矿','妙绝珠','吸铁石','蜂母石','容和石'];

const NAMES_EGG = [
  '📍 洞穴深处传来一声悠长的号角。有老矿工发誓，那是卡尔在吹。管理层表示：无可奉告。',
  '📍 本次任务的洞穴岩壁上发现一行刻字："卡尔到此一挖"。考古价值：无。纪念意义：满级。',
];

/* 稀有矿物 → 图标槽位 */
const MKEY = {'玉石':'jadiz','乌玛石':'umanite','铜矿':'croppa','妙绝珠':'enor','吸铁石':'magnite','蜂母石':'bismor','容和石':'hollomite'};
/* 优化 #1：任务类型 → 官方简报横幅（salv 的解包文件名带 age） */
const MIS_BANNER = {exp:'mis_exp', point:'mis_point', refi:'mis_refi', escort:'mis_escort', salv:'mis_salvage', elim:'mis_elim'};
function resIcon(k){
  const map = {nitra:'res_nitra', morkite:'res_morkite', moil:'res_morkite', gold:'res_gold'};
  if(map[k]) return '<img class="cicon" src="assets/icons/'+map[k]+'.png">';
  if(k === 'credits') return '◈';
  return MKEY[k] ? '<img class="cicon" src="assets/icons/res_'+MKEY[k]+'.png">' : '◆';
}
function costChip(name,n){ return '<span class="costchip"><img src="assets/icons/res_'+MKEY[name]+'.png">'+n+'</span>'; }
function costHtml(uc){ return costChip(uc.m1,uc.q1)+'<span class="costchip">+</span>'+costChip(uc.m2,uc.q2)+'<span class="costchip"><b>'+uc.c+'</b>'+L(' 代币')+'</span>'; }
function ic(key, cls){
  return '<img class="'+(cls||'cicon')+'" src="assets/icons/'+key+'.png" onerror="this.remove()">';
}

/* 武器模组全池（B-3 产出）—— 三提石抽卡 3 选 1 数据源，主会话负责实装 */


/* 三提石抽卡规则（用户拍板 2026-09-13）：
   pool=all：99 条模组全池公平抽取，无预留/无 planned；
   duplicate=freeReroll：抽到已有模组 → 免费重抽 1 次，不折算 credits；
   pity：连续 9 抽未出顶级档(tier T1)，第 10 抽的三选一强制含 ≥1 条 T1，触发后计数清零 */



/* 武器模组全池（B-3 产出）—— 三提石抽卡 3 选 1 数据源，主会话负责实装 */


/* 三提石抽卡规则（用户拍板 2026-09-13）：
   pool=all：99 条模组全池公平抽取，无预留/无 planned；
   duplicate=freeReroll：抽到已有模组 → 免费重抽 1 次，不折算 credits；
   pity：连续 9 抽未出顶级档(tier T1)，第 10 抽的三选一强制含 ≥1 条 T1，触发后计数清零 */


/* ---------------- 武器模组全池（B-3 v1.2 主手 99 条 + 副手二期 54 条 = 153 条） + 抽卡配置 ----------------
   副手 9 把（scout: jury/zhukov/nishanka；gunner: bulldog/brt7/armskore；driller: subata/plasmacharger/colette）
   移植自旧版单文件 OFF_POOLS（15a780e 扩池），tier 已按 3a178b4 对齐 166 攻略（29 处修正后的最终数据态）；
   engineer 副手 pgl/breachcutter/sharddif 的 19 条在 B-3 v1.2 时已入池，未重复。 */
/* 武器模组全池（B-3 产出）—— 三提石抽卡 3 选 1 数据源，主会话负责实装 */
const WEAPON_MODS = {
  scout: {
    gk2: { zh: "深核 GK2 突击步枪", mods: [
      { id:"gk2_compact_ammo", name_zh:"压缩弹药", name_en:"Compact Ammo", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-10 }, desc:"弹匣更粗更长，后勤组少跑一趟。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"玉石", qty:25, credits:300 } },
      { id:"gk2_gas_rerouting", name_zh:"气压重导", name_en:"Gas Rerouting", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ yield:5, duration:-5 }, desc:"枪机供气顺畅，清虫和挖矿一样快。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"玉石", qty:25, credits:350 } },
      { id:"gk2_bullets_of_mercy", name_zh:"仁慈超度", name_en:"Bullets of Mercy", rarity:"balanced", tier:"T1", s6raw:"T0.5", inferred:false, effect:{ eventSuccess:15, yield:8, duration:5 }, desc:"对带异常状态的虫补刀有奇效。超度，但要收费。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"玉石", qty:45, credits:650 } },
      { id:"gk2_burst_fire", name_zh:"点射扳机", name_en:"Burst Fire", rarity:"balanced", tier:"T3", s6raw:null, inferred:true, effect:{ yield:10, supplyCost:-5 }, desc:"三发点射省子弹，也省射速——省到矮人打瞌睡。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"玉石", qty:40, credits:550 } },
      { id:"gk2_ai_stability", name_zh:"智能稳定", name_en:"AI Stability Engine", rarity:"balanced", tier:"T3", s6raw:null, inferred:true, effect:{ eventSuccess:10, morale:-2 }, desc:"AI 替你压枪，顺便替你扣绩效：它嫌你打得太慢。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"玉石", qty:40, credits:550 } },
      { id:"gk2_homebrew_powder", name_zh:"自制火药", name_en:"Homebrew Powder", rarity:"unstable", tier:"T3", s6raw:null, inferred:true, effect:{ yield:30, medBill:50 }, desc:"威力看运气，看检测报告不如看天。炸膛算工伤吗？算。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"妙绝珠", qty:60, credits:1000 } },
      { id:"gk2_overclocked_firing", name_zh:"超频撞针", name_en:"Overclocked Firing Mechanism", rarity:"unstable", tier:"T3", s6raw:null, inferred:true, effect:{ eventSuccess:10, supplyCost:15 }, desc:"射速快到枪管冒烟，硝石消耗也跟着冒烟。", unlock:{ weaponUp:5, hazard:3 }, cost:{ mineral:"妙绝珠", qty:65, credits:1100 } },
      { id:"gk2_electrifying_reload", name_zh:"电击装填", name_en:"Electrifying Reload", rarity:"unstable", tier:"T3", s6raw:"T2", inferred:false, effect:{ eventSuccess:18, supplyCost:15 }, desc:"换弹时放倒一片，可惜换下来的弹匣也一起放倒了。", unlock:{ weaponUp:5, hazard:3 }, cost:{ mineral:"妙绝珠", qty:70, credits:1200 } }
    ]},
    m1000: { zh: "M1000 经典型步枪", mods: [
      { id:"m1000_hoverclock", name_zh:"专注悬停", name_en:"Hoverclock", rarity:"clean", tier:"T1", s6raw:null, inferred:true, effect:{ eventSuccess:8, yield:5 }, desc:"瞄准瞬间人悬在半空。物理学家已提离职。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"玉石", qty:25, credits:300 } },
      { id:"m1000_minimal_clips", name_zh:"精简弹夹", name_en:"Minimal Clips", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-10, duration:-5 }, desc:"弹夹精简，换弹飞快。断舍离的第一枪。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"玉石", qty:25, credits:300 } },
      { id:"m1000_active_stability", name_zh:"主动稳定", name_en:"Active Stability System", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:6, yield:5 }, desc:"移动瞄准不打飘，走位派狂喜。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"玉石", qty:25, credits:350 } },
      { id:"m1000_hipster", name_zh:"腰射潮人", name_en:"Hipster", rarity:"clean", tier:"T1", s6raw:"T0", inferred:false, effect:{ supplyCost:-15, yield:5 }, desc:"备弹近乎翻倍，杀伤略降——潮人不在乎伤害，在乎排面。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"玉石", qty:30, credits:400 } },
      { id:"m1000_supercooling", name_zh:"过冷枪膛", name_en:"Supercooling Chamber", rarity:"balanced", tier:"T2", s6raw:"T1", inferred:false, effect:{ yield:15, eventSuccess:8, supplyCost:10 }, desc:"瞄准射击伤害翻倍还带倍率，就是备弹少得像集团福利。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"妙绝珠", qty:50, credits:750 } },
      { id:"m1000_electrocuting_focus", name_zh:"电击瞄准", name_en:"Electrocuting Focus Shots", rarity:"unstable", tier:"T3", s6raw:null, inferred:true, effect:{ eventSuccess:20, supplyCost:15 }, desc:"每发瞄准弹附带电疗。虫子痛并麻痹着。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"妙绝珠", qty:60, credits:1100 } },
      { id:"m1000_marked_for_death", name_zh:"死亡标记", name_en:"Marked for Death", rarity:"unstable", tier:"T1", s6raw:"T0.5", inferred:false, effect:{ eventSuccess:12, rareDrop:8, morale:-5 }, desc:"标记的虫多挨 55% 伤害，标记你的人多挨 100% 骂。", unlock:{ weaponUp:5, hazard:3 }, cost:{ mineral:"妙绝珠", qty:75, credits:1400 } }
    ]},
    drak: { zh: "DRAK-25 电浆卡宾枪", mods: [
      { id:"drak_aggressive_venting", name_zh:"暴力散热", name_en:"Aggressive Venting", rarity:"clean", tier:"T2", s6raw:"T1", inferred:false, effect:{ eventSuccess:8 }, desc:"过热时向前喷一圈火，虫子排队领烫伤。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"玉石", qty:25, credits:300 } },
      { id:"drak_thermal_liquid_coolant", name_zh:"液冷散热", name_en:"Thermal Liquid Coolant", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ duration:-5, supplyCost:-5 }, desc:"冷却液管到枪管，射到天荒地老。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"玉石", qty:25, credits:350 } },
      { id:"drak_impact_deflection", name_zh:"弹跳电浆", name_en:"Impact Deflection", rarity:"balanced", tier:"T3", s6raw:null, inferred:true, effect:{ yield:8, eventSuccess:6, duration:5 }, desc:"电浆会弹墙。好看，弹到自己人时更好看。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"玉石", qty:40, credits:550 } },
      { id:"drak_conductive_thermals", name_zh:"恒温电导", name_en:"Conductive Thermals", rarity:"balanced", tier:"T1", s6raw:"T0", inferred:false, effect:{ eventSuccess:12, yield:5, supplyCost:5 }, desc:"火冰电三修，虫子叫它\"天气异常\"。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"玉石", qty:50, credits:750 } },
      { id:"drak_rewiring_mod", name_zh:"模块重调", name_en:"Rewiring Mod", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-20, duration:5 }, desc:"过热时电池回弹，省硝石，但要站着等它充能。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"玉石", qty:50, credits:700 } },
      { id:"drak_overtuned_accelerator", name_zh:"爆能电浆", name_en:"Overtuned Particle Accelerator", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ yield:12, supplyCost:8 }, desc:"单发伤害显著提升，电池：我谢谢您。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"妙绝珠", qty:50, credits:800 } },
      { id:"drak_shield_battery", name_zh:"护盾协能", name_en:"Shield Battery Booster", rarity:"unstable", tier:"T1", s6raw:"T0", inferred:false, effect:{ yield:25, medBill:40 }, desc:"满盾伤害爆炸，过热护盾即失效——矮人管这叫\"赌命节奏\"。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"妙绝珠", qty:75, credits:1300 } },
      { id:"drak_thermal_exhaust", name_zh:"废热回导", name_en:"Thermal Exhaust Feedback", rarity:"unstable", tier:"T1", s6raw:"T0", inferred:false, effect:{ yield:30, morale:-5 }, desc:"枪管越热打越疼，抱着它睡觉的矮人有意见。", unlock:{ weaponUp:5, hazard:3 }, cost:{ mineral:"妙绝珠", qty:80, credits:1400 } }
    ]},
    /* —— 以下副手池移植自旧版单文件（15a780e 扩池，tier 已按 3a178b4 对齐 166 攻略）—— */
    jury: { zh: "应急霰弹枪", mods: [
      { id:"jury_compact_shells", name_zh:"压缩弹壳", name_en:"Compact Shells", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ supplyCost:-10 }, desc:"弹壳紧凑装填，后勤组少跑一趟。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"玉石", qty:20, credits:300 } },
      { id:"jury_stuffed_shells", name_zh:"填充弹壳", name_en:"Stuffed Shells", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ yield:10 }, desc:"塞得满满的，产量自然上来。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"玉石", qty:25, credits:400 } },
      { id:"jury_shaped_shells", name_zh:"异形弹壳", name_en:"Shaped Shells", rarity:"balanced", tier:"T2", s6raw:null, inferred:false, effect:{ rareDrop:15 }, desc:"弹壳异形成型，稀有矿见得更多。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"乌玛石", qty:30, credits:500 } },
      { id:"jury_jumbo_shells", name_zh:"超大弹壳", name_en:"Jumbo Shells", rarity:"balanced", tier:"T1", s6raw:null, inferred:false, effect:{ yield:18, supplyCost:8 }, desc:"壳大劲足，就是费硝石。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"乌玛石", qty:35, credits:550 } },
      { id:"jury_double_barrel", name_zh:"双管齐下", name_en:"Double Barrel", rarity:"balanced", tier:"T1", s6raw:null, inferred:false, effect:{ yield:25, supplyCost:10 }, desc:"两管一起轰，账单也一起轰。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"妙绝珠", qty:50, credits:700 } },
      { id:"jury_special_powder", name_zh:"特殊火药", name_en:"Special Powder", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:30, morale:-5 }, desc:"集团违禁火药，产出惊人，人事部皱眉。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"妙绝珠", qty:50, credits:800 } }
    ] },
    zhukov: { zh: "朱可夫 NUK17 双持冲锋枪", mods: [
      { id:"zhukov_minimal_magazines", name_zh:"精简弹匣", name_en:"Minimal Magazines", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ supplyCost:-12 }, desc:"轻装上阵，硝石省着花。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"玉石", qty:20, credits:300 } },
      { id:"zhukov_custom_casings", name_zh:"定制弹壳", name_en:"Custom Casings", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ yield:10 }, desc:"手工定制，品质溢价。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"玉石", qty:25, credits:400 } },
      { id:"zhukov_cryo_minelets", name_zh:"冰冻陷阱", name_en:"Cryo Minelets", rarity:"balanced", tier:"T1", s6raw:null, inferred:false, effect:{ eventSuccess:12 }, desc:"冻一地冰碴，虫子脚下打滑。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"乌玛石", qty:30, credits:500 } },
      { id:"zhukov_gas_recycling", name_zh:"热气回收", name_en:"Gas Recycling", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:15, supplyCost:-10 }, desc:"废气循环利用，财务部起立鼓掌。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"妙绝珠", qty:40, credits:600 } },
      { id:"zhukov_embedded_detonators", name_zh:"内置起爆", name_en:"Embedded Detonators", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:28, medBill:35 }, desc:"弹头内嵌雷管——医疗部表示已读。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"妙绝珠", qty:50, credits:800 } }
    ] },
    nishanka: { zh: "尼桑卡 X-80「闪电鲨」战术弩", mods: [
      { id:"nishanka_quick_fire", name_zh:"速射模式", name_en:"Quick Fire", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ morale:3 }, desc:"拉栓都快，士气跟着利索。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"玉石", qty:20, credits:300 } },
      { id:"nishanka_bodkin_points", name_zh:"乘胜锥击", name_en:"Bodkin Points", rarity:"clean", tier:"T1", s6raw:null, inferred:false, effect:{ rareDrop:15 }, desc:"锥头凿岩，稀有矿更容易露头。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"玉石", qty:25, credits:450 } },
      { id:"nishanka_cryo_bolt", name_zh:"冰冻弩箭", name_en:"Cryo Bolt", rarity:"balanced", tier:"T1", s6raw:null, inferred:false, effect:{ eventSuccess:12 }, desc:"一箭冻住场面。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"乌玛石", qty:30, credits:500 } },
      { id:"nishanka_fire_bolt", name_zh:"火焰弩箭", name_en:"Fire Bolt", rarity:"balanced", tier:"T3", s6raw:null, inferred:false, effect:{ yield:12 }, desc:"带火市的箭，结算带劲。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"乌玛石", qty:30, credits:500 } },
      { id:"nishanka_the_specialist", name_zh:"行家里手", name_en:"The Specialist", rarity:"balanced", tier:"T2", s6raw:null, inferred:false, effect:{ eventSuccess:15, yield:10 }, desc:"老手出手，又稳又赚。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"妙绝珠", qty:45, credits:650 } },
      { id:"nishanka_trifork_volley", name_zh:"一箭三连", name_en:"Trifork Volley", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:25, supplyCost:12 }, desc:"三叉齐射，硝石烧得像烟花。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"妙绝珠", qty:50, credits:800 } }
    ] }
  },
  engineer: {
    warthog: { zh: "\"疣猪\" 210 自动霰弹枪", mods: [
      { id:"warthog_lightweight_mags", name_zh:"轻量弹匣", name_en:"Light-Weight Magazines", rarity:"clean", tier:"T2", s6raw:"T1", inferred:false, effect:{ supplyCost:-10, duration:-5 }, desc:"轻了半公斤，矮人的腰表示感谢。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"吸铁石", qty:25, credits:300 } },
      { id:"warthog_mini_shells", name_zh:"迷你霰弹", name_en:"Mini Shells", rarity:"clean", tier:"T3", s6raw:"T3", inferred:false, effect:{ supplyCost:-25, yield:-8 }, desc:"弹药基数翻三倍，单发杀伤看天。舍本逐末奖得主。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"吸铁石", qty:20, credits:250 } },
      { id:"warthog_magnetic_pellet", name_zh:"磁力势阱", name_en:"Magnetic Pellet Alignment", rarity:"balanced", tier:"T2", s6raw:"T1", inferred:false, effect:{ yield:10, eventSuccess:8, duration:5 }, desc:"弹丸列队飞行，弱点伤害+30%，强迫症福音。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"吸铁石", qty:45, credits:600 } },
      { id:"warthog_pump_action", name_zh:"泵动改造", name_en:"Pump Action", rarity:"balanced", tier:"T2", s6raw:"T1", inferred:false, effect:{ yield:15, duration:5 }, desc:"一发两倍弹丸还带穿透，射速慢？重剑无锋。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"吸铁石", qty:50, credits:700 } },
      { id:"warthog_stunner", name_zh:"眩晕打击", name_en:"Stunner", rarity:"unstable", tier:"T2", s6raw:"T1", inferred:false, effect:{ eventSuccess:18, supplyCost:10 }, desc:"概率眩晕所有部位，打晕的虫额外+30% 伤害。礼貌击晕。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"乌玛石", qty:60, credits:1100 } },
      { id:"warthog_cycle_overload", name_zh:"循环过载", name_en:"Cycle Overload", rarity:"unstable", tier:"T2", s6raw:"T1", inferred:false, effect:{ yield:20, eventSuccess:5, supplyCost:12 }, desc:"伤害射速双提升，扩散也\"提升\"——贴脸才是归宿。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"乌玛石", qty:65, credits:1150 } }
    ]},
    lok1: { zh: "LOK-1 智能步枪", mods: [
      { id:"lok1_eraser", name_zh:"威胁肃清", name_en:"Eraser", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:8 }, desc:"锁定目标数+33%，弹匣+12。橡皮擦擦掉一窝。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"吸铁石", qty:25, credits:300 } },
      { id:"lok1_armor_break", name_zh:"破甲模块", name_en:"Armor Break Module", rarity:"clean", tier:"T3", s6raw:null, inferred:true, effect:{ yield:5, eventSuccess:4 }, desc:"满锁定时专啃硬壳。甲虫的噩梦，别的虫表示无感。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"吸铁石", qty:25, credits:300 } },
      { id:"lok1_neuro_lasso", name_zh:"神经套索", name_en:"Neuro-Lasso", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:12, duration:-5 }, desc:"锁定即减速，锁得越多跑得越慢。套索，但讲道理很文明。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"吸铁石", qty:40, credits:550 } },
      { id:"lok1_executioner", name_zh:"死刑宣判", name_en:"Executioner", rarity:"clean", tier:"T1", s6raw:"T0.5", inferred:false, effect:{ yield:15, eventSuccess:8, supplyCost:8 }, desc:"满锁定弱点伤害+50%。法官、陪审团和刽子手都是这把枪。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"吸铁石", qty:45, credits:650 } },
      { id:"lok1_seeker_rounds", name_zh:"夺命凶弹", name_en:"Seeker Rounds", rarity:"balanced", tier:"T3", s6raw:"T3", inferred:false, effect:{ eventSuccess:10, supplyCost:15 }, desc:"弹无虚发绕墙打，就是射得慢——慢工出细活，细活误工期。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"乌玛石", qty:50, credits:750 } },
      { id:"lok1_explosive_chemical", name_zh:"连\"锁\"爆弹", name_en:"Explosive Chemical Rounds", rarity:"balanced", tier:"T1", s6raw:"T0", inferred:false, effect:{ eventSuccess:15, yield:8, supplyCost:10 }, desc:"三重锁定的虫会炸，连锁反应。化学课代表犯罪现场。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"乌玛石", qty:55, credits:800 } },
      { id:"lok1_smart_trigger", name_zh:"\"大聪明\"扳机系统™", name_en:"Smяt Trigger OS™", rarity:"unstable", tier:"T3", s6raw:null, inferred:true, effect:{ duration:-15, morale:-5 }, desc:"全自动锁定射击，只锁 2 个目标。聪明，但只聪明一点。™", unlock:{ weaponUp:5, hazard:3 }, cost:{ mineral:"乌玛石", qty:70, credits:1200 } }
    ]},
    sharddif: { zh: "心石聚能炮", mods: [
      { id:"shard_efficiency", name_zh:"效率调整", name_en:"Efficiency Tweaks", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-10, duration:-5 }, desc:"弹药与蓄能双双+50%。性价比本身就是一种暴力。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"吸铁石", qty:25, credits:300 } },
      { id:"shard_auto_beam", name_zh:"自动光控", name_en:"Automated Beam Controller", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ duration:-10, supplyCost:5 }, desc:"光束全自动扫射，工程可以去泡咖啡了。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"吸铁石", qty:40, credits:600 } },
      { id:"shard_feedback_loop", name_zh:"反馈循环", name_en:"Feedback Loop", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ yield:12, eventSuccess:6, supplyCost:5 }, desc:"持续照射伤害滚雪球。越长越猛，像公司的 KPI。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"乌玛石", qty:50, credits:700 } },
      { id:"shard_plastcrete", name_zh:"聚能爆炸", name_en:"Plastcrete Catalyst", rarity:"balanced", tier:"T2", s6raw:"T1", inferred:false, effect:{ eventSuccess:15, yield:8, supplyCost:5 }, desc:"对着自家平台开火有奇效。请勿对自家平台开火（并引用免责条款）。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"乌玛石", qty:50, credits:750 } },
      { id:"shard_volatile_reactor", name_zh:"熔火核心", name_en:"Volatile Impact Reactor", rarity:"unstable", tier:"T1", s6raw:"T0", inferred:false, effect:{ yield:22, eventSuccess:12, rareDrop:8, duration:10 }, desc:"光束犁出岩浆带，路过的虫都熟了。撤离队：谁修的路？！", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"乌玛石", qty:75, credits:1400 } },
      { id:"shard_overdrive", name_zh:"聚能过载", name_en:"Overdrive Booster", rarity:"unstable", tier:"T1", s6raw:"T1", inferred:false, effect:{ yield:35, medBill:50 }, desc:"换弹触发 2.5 倍伤害，代价是站桩打空整管能量。医师建议：别站虫堆里。", unlock:{ weaponUp:5, hazard:3 }, cost:{ mineral:"乌玛石", qty:85, credits:1500 } }
    ]},
    pgl: { zh: "深核40毫米便携式榴弹发射器", mods: [
      { id:"pgl_clean_sweep", name_zh:"大扫除", name_en:"Clean Sweep", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:10 }, desc:"溅射+10/+0.5m，零负面。字面意义的大扫除。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"吸铁石", qty:25, credits:300 } },
      { id:"pgl_pack_rat", name_zh:"仓鼠", name_en:"Pack Rat", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-15 }, desc:"备弹+2。仓鼠过冬，榴弹过夜。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"吸铁石", qty:25, credits:300 } },
      { id:"pgl_compact_rounds", name_zh:"压缩弹药", name_en:"Compact Rounds", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-20, eventSuccess:-5 }, desc:"备弹+5，威力小缩水。浓缩的都是精华，压缩的不算。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"吸铁石", qty:30, credits:400 } },
      { id:"pgl_rj250", name_zh:"RJ250 化合物", name_en:"RJ250 Compound", rarity:"balanced", tier:"T1", s6raw:"T0.5", inferred:false, effect:{ duration:-10, morale:5 }, desc:"满配可火箭跳，备弹×1.7。矮人的腿表示强烈抗议，矮人的心表示真香。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"乌玛石", qty:50, credits:750 } },
      { id:"pgl_fat_boy", name_zh:"胖男孩", name_en:"Fat Boy", rarity:"unstable", tier:"T1", s6raw:"T0", inferred:false, effect:{ yield:30, eventSuccess:20, morale:10, medBill:50, supplyCost:20 }, desc:"40mm 弹头里的战术核武，附带 15 秒辐射区。集团规定：引爆前请背对蘑菇云摆好姿势。", unlock:{ weaponUp:5, hazard:4 }, cost:{ mineral:"吸铁石", qty:90, credits:2000 } },
      { id:"pgl_hyper_propellant", name_zh:"超推进剂", name_en:"Hyper Propellant", rarity:"unstable", tier:"T2", s6raw:"T1", inferred:false, effect:{ eventSuccess:25, yield:-10, supplyCost:10 }, desc:"弹速+350%、全部伤害转为直击汽化。打点即蒸发，溅射是什么？不认识。", unlock:{ weaponUp:5, hazard:3 }, cost:{ mineral:"乌玛石", qty:80, credits:1400 } }
    ]}
  },
  gunner: {
    leadstorm: { zh: "\"铅暴\" 转管机枪", mods: [
      { id:"leadstorm_thinned_drum", name_zh:"超薄鼓壁", name_en:"Thinned Drum Walls", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-15 }, desc:"弹鼓削薄多塞 300 发。质检部拒绝置评。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"蜂母石", qty:25, credits:300 } },
      { id:"leadstorm_compact_feed", name_zh:"紧凑送弹", name_en:"Compact Feed Mechanism", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-20, duration:-5 }, desc:"备弹+800，射速-2。稳，就像集团的社保承诺。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"蜂母石", qty:30, credits:400 } },
      { id:"leadstorm_oomph", name_zh:"多转快点，小妞！", name_en:"A Little More Oomph!", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ yield:8 }, desc:"+1 伤害、更快起转。官方译名自带任务指挥腔。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"蜂母石", qty:40, credits:550 } },
      { id:"leadstorm_exhaust_vector", name_zh:"排气引导", name_en:"Exhaust Vectoring", rarity:"balanced", tier:"T3", s6raw:null, inferred:true, effect:{ yield:10, eventSuccess:-5 }, desc:"伤害+2，扩散×2.5。指哪打哪是不可能的，指哪打一片。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"蜂母石", qty:40, credits:550 } },
      { id:"leadstorm_rotary_overdrive", name_zh:"转轮过载", name_en:"Rotary Overdrive", rarity:"balanced", tier:"T1", s6raw:"T0.5", inferred:false, effect:{ duration:-10, eventSuccess:10, morale:-3 }, desc:"永不过热，冷却剂 12 发畅饮。烫手的不是枪，是绩效。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"蜂母石", qty:50, credits:700 } },
      { id:"leadstorm_burning_hell", name_zh:"烈火地狱", name_en:"Burning Hell", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:12, supplyCost:5 }, desc:"过热排气向前喷火铺路，枪口过热都成了战术。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"蜂母石", qty:50, credits:750 } },
      { id:"leadstorm_bullet_hell", name_zh:"子弹地狱", name_en:"Bullet Hell", rarity:"unstable", tier:"T2", s6raw:"T1", inferred:false, effect:{ eventSuccess:15, yield:8, supplyCost:15 }, desc:"75% 弹丸跳弹。洞穴里下起金属雨，保险不理赔。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"铜矿", qty:65, credits:1200 } },
      { id:"leadstorm_lead_storm", name_zh:"铅弹风暴", name_en:"Lead Storm", rarity:"unstable", tier:"T2", s6raw:"T1", inferred:false, effect:{ yield:25, rareDrop:8, medBill:40 }, desc:"+4 伤害，但开火即钉死原地。人枪合一，直到虫贴脸。", unlock:{ weaponUp:5, hazard:3 }, cost:{ mineral:"铜矿", qty:80, credits:1500 } }
    ]},
    thunderhead: { zh: "\"雷暴云砧\" 重型双管机炮", mods: [
      { id:"thunderhead_composite_drums", name_zh:"复合弹鼓", name_en:"Composite Drums", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-12 }, desc:"备弹+110、换弹-0.5s。朴实无华的集团工艺。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"蜂母石", qty:25, credits:300 } },
      { id:"thunderhead_combat_mobility", name_zh:"战斗机动", name_en:"Combat Mobility", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ duration:-8, morale:2 }, desc:"移速+35%、弹匣减半。背着它也能小跑，矮人体脂率警告。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"蜂母石", qty:25, credits:350 } },
      { id:"thunderhead_splintering", name_zh:"破片弹药", name_en:"Splintering Shells", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ yield:8, eventSuccess:6 }, desc:"溅射范围+0.3m。波及面更广，像年终考评。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"蜂母石", qty:40, credits:600 } },
      { id:"thunderhead_carpet_bomber", name_zh:"地毯轰炸", name_en:"Carpet Bomber", rarity:"balanced", tier:"T1", s6raw:"T0.5", inferred:false, effect:{ yield:15, eventSuccess:10, rareDrop:5, supplyCost:8 }, desc:"溅射×1.35、半径×1.45。所过之处，寸虫不生，矿也松了。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"蜂母石", qty:50, credits:750 } },
      { id:"thunderhead_big_bertha", name_zh:"大贝莎", name_en:"Big Bertha", rarity:"balanced", tier:"T2", s6raw:"T1", inferred:false, effect:{ yield:15, supplyCost:10 }, desc:"伤害+12、弹道收紧。贝莎小姐的问候，队友的背影记得让开。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"铜矿", qty:50, credits:750 } },
      { id:"thunderhead_neurotoxin", name_zh:"毒素载荷", name_en:"Neurotoxin Payload", rarity:"unstable", tier:"T1", s6raw:"T0.5", inferred:false, effect:{ eventSuccess:20, yield:10, supplyCost:12 }, desc:"50% 概率挂神经毒素，全队减益光环。虫医警告：别吸入。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"铜矿", qty:70, credits:1300 } },
      { id:"thunderhead_mortar", name_zh:"迫击炮弹", name_en:"Mortar Rounds", rarity:"unstable", tier:"T1", s6raw:"T0.5", inferred:false, effect:{ eventSuccess:18, yield:15, supplyCost:15, morale:-3 }, desc:"抛物线曲射，溅射×7。曲射炮下无掩体，也没有安静的午休。", unlock:{ weaponUp:5, hazard:3 }, cost:{ mineral:"铜矿", qty:85, credits:1500 } }
    ]},
    hurricane: { zh: "\"飓风\" 制导火箭系统", mods: [
      { id:"hurricane_fragmentation", name_zh:"破片飞弹", name_en:"Fragmentation Missiles", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ yield:6, eventSuccess:4 }, desc:"溅射+2/+0.5m。制导火箭也想不通为什么要加伤害，但加了。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"蜂母石", qty:25, credits:300 } },
      { id:"hurricane_overtuned_feed", name_zh:"过载供弹", name_en:"Overtuned Feed Mechanism", rarity:"clean", tier:"T2", s6raw:"T1", inferred:false, effect:{ duration:-5, yield:5 }, desc:"弹速+20%、射速+1。上弹口的弹簧换成了集团特供的愤怒。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"蜂母石", qty:30, credits:400 } },
      { id:"hurricane_rocket_barrage", name_zh:"火箭弹幕", name_en:"Rocket Barrage", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:8, duration:-5 }, desc:"射速×3、备弹+216、取消制导。下雨了，下的是火箭。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"蜂母石", qty:30, credits:400 } },
      { id:"hurricane_minelayer", name_zh:"布雷系统", name_en:"Minelayer System", rarity:"balanced", tier:"T3", s6raw:null, inferred:true, effect:{ eventSuccess:10, duration:5 }, desc:"火箭落地变地雷。提前量是艺术，踩雷是意外。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"蜂母石", qty:40, credits:600 } },
      { id:"hurricane_salvo", name_zh:"齐射模块", name_en:"Salvo Module", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:12, yield:8, supplyCost:8 }, desc:"蓄力九连发齐射。一次把话说完，一次把弹打光。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"蜂母石", qty:50, credits:700 } },
      { id:"hurricane_plasma_burster", name_zh:"贯穿爆破", name_en:"Plasma Burster Missiles", rarity:"balanced", tier:"T1", s6raw:"T0", inferred:false, effect:{ yield:18, eventSuccess:10, supplyCost:12 }, desc:"多段爆破穿透弹体。虫：我到底被炸了几次？", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"铜矿", qty:55, credits:800 } },
      { id:"hurricane_jet_fuel", name_zh:"疾速飞弹", name_en:"Jet Fuel Homebrew", rarity:"unstable", tier:"T2", s6raw:null, inferred:true, effect:{ yield:25, supplyCost:15 }, desc:"直击×2.5、出膛即极速。配方是自制燃料，安全部泪目。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"铜矿", qty:70, credits:1250 } },
      { id:"hurricane_cluster", name_zh:"集束轰炸", name_en:"Cluster Charges", rarity:"unstable", tier:"T1", s6raw:"T0.5", inferred:false, effect:{ yield:20, eventSuccess:15, rareDrop:5, supplyCost:15 }, desc:"每枚弹再炸七个子弹头。邦邦两下，全场结账。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"铜矿", qty:80, credits:1450 } }
    ]},
    /* —— 副手池（同 scout 段注释：移植自 15a780e，tier 按 3a178b4 对齐）—— */
    bulldog: { zh: "「斗牛犬」重型左轮手枪", mods: [
      { id:"bulldog_homebrew_powder", name_zh:"自制火药", name_en:"Homebrew Powder", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ supplyCost:-12 }, desc:"土法火药，财务部不敢细问。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"吸铁石", qty:20, credits:300 } },
      { id:"bulldog_chain_hit", name_zh:"连锁打击", name_en:"Chain Hit", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ rareDrop:12 }, desc:"弹头连跳，稀有矿被点名。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"吸铁石", qty:25, credits:450 } },
      { id:"bulldog_six_shooter", name_zh:"六连射手", name_en:"Six Shooter", rarity:"balanced", tier:"T2", s6raw:null, inferred:false, effect:{ eventSuccess:10 }, desc:"六发点射，场面稳得住。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"蜂母石", qty:30, credits:500 } },
      { id:"bulldog_elephant_rounds", name_zh:"巨象弹药", name_en:"Elephant Rounds", rarity:"balanced", tier:"T2", s6raw:null, inferred:false, effect:{ yield:15, morale:-3 }, desc:"后坐力堪比象踢，腰子遭罪。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"蜂母石", qty:35, credits:550 } },
      { id:"bulldog_magic_bullets", name_zh:"魔法子弹", name_en:"Magic Bullets", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:22, supplyCost:-15 }, desc:"弹药凭空补充，科学拒绝评论。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"乌玛石", qty:45, credits:700 } },
      { id:"bulldog_volatile_bullets", name_zh:"易燃子弹", name_en:"Volatile Bullets", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:30, medBill:40 }, desc:"一颗引爆一颗，工伤率同步暴涨。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"乌玛石", qty:50, credits:800 } }
    ] },
    brt7: { zh: "BRT7 连发手枪", mods: [
      { id:"brt7_compact_casings", name_zh:"紧凑弹壳", name_en:"Compact Casings", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ supplyCost:-10 }, desc:"紧凑省料，账面好看。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"吸铁石", qty:20, credits:300 } },
      { id:"brt7_full_chamber_seal", name_zh:"全腔密封", name_en:"Full Chamber Seal", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ yield:10 }, desc:"密封到位，弹道更实在。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"吸铁石", qty:25, credits:400 } },
      { id:"brt7_compact_mags", name_zh:"紧凑弹匣", name_en:"Compact Mags", rarity:"balanced", tier:"T1", s6raw:null, inferred:false, effect:{ rareDrop:8 }, desc:"小弹匣翻找快，顺手捡矿。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"蜂母石", qty:25, credits:400 } },
      { id:"brt7_electro_minelets", name_zh:"电击陷阱", name_en:"Electro Minelets", rarity:"balanced", tier:"T3", s6raw:null, inferred:false, effect:{ eventSuccess:12 }, desc:"落地带电，虫潮都礼貌。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"蜂母石", qty:30, credits:500 } },
      { id:"brt7_micro_flechettes", name_zh:"微型镖弹", name_en:"Micro Flechettes", rarity:"balanced", tier:"T2", s6raw:null, inferred:false, effect:{ rareDrop:15 }, desc:"钢针细雨，专敲稀有矿。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"乌玛石", qty:30, credits:550 } },
      { id:"brt7_lead_spray", name_zh:"铅弹散射", name_en:"Lead Spray", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:18, morale:-4 }, desc:"铅雨泼面，矿工骂骂咧咧但认了。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"乌玛石", qty:40, credits:650 } },
      { id:"brt7_experimental_rounds", name_zh:"实验弹药", name_en:"Experimental Rounds", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:25, medBill:30 }, desc:"实验批号，效果与工伤俱佳。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"乌玛石", qty:50, credits:800 } }
    ] },
    armskore: { zh: "「武装核心」电磁手炮", mods: [
      { id:"armskore_backfeeding_module", name_zh:"返补模块", name_en:"Backfeeding Module", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ supplyCost:-14 }, desc:"余能回充，硝石账单瘦身。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"吸铁石", qty:25, credits:450 } },
      { id:"armskore_the_mole", name_zh:"鼹鼠", name_en:"The Mole", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ eventSuccess:12 }, desc:"钻地弹道，洞穴里横着走。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"蜂母石", qty:25, credits:450 } },
      { id:"armskore_ultra_magnetic_coils", name_zh:"超磁线圈", name_en:"Ultra-Magnetic Coils", rarity:"balanced", tier:"T1", s6raw:null, inferred:false, effect:{ yield:14 }, desc:"超磁储能，单发更值钱。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"蜂母石", qty:30, credits:500 } },
      { id:"armskore_triple_tech_chambers", name_zh:"三重连射", name_en:"Triple-Tech Chambers", rarity:"clean", tier:"T1", s6raw:null, inferred:false, effect:{ yield:16, rareDrop:8 }, desc:"三技术集于一身，实在。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"乌玛石", qty:40, credits:650 } },
      { id:"armskore_hellfire", name_zh:"地狱烈焰", name_en:"Hellfire", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:24, morale:-5 }, desc:"枪口喷地狱，矿工说像加班。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"乌玛石", qty:50, credits:800 } },
      { id:"armskore_re_atomizer", name_zh:"原子重组", name_en:"Re-atomizer", rarity:"unstable", tier:"T2", s6raw:null, inferred:false, effect:{ yield:26, medBill:30 }, desc:"原子级重组，重组成账单。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"乌玛石", qty:50, credits:800 } }
    ] }
  },
  driller: {
    crspr: { zh: "CRSPR 火焰喷射器", mods: [
      { id:"crspr_lighter_tanks", name_zh:"轻量油罐", name_en:"Lighter Tanks", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-8 }, desc:"油罐+75。轻装上阵，火照常喷。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"乌玛石", qty:25, credits:300 } },
      { id:"crspr_sticky_additive", name_zh:"黏性助剂", name_en:"Sticky Additive", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:6, duration:-5 }, desc:"火胶更黏，虫跑不掉也扑不灭。万能胶部门年终加班。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"乌玛石", qty:25, credits:350 } },
      { id:"crspr_compact_valves", name_zh:"紧凑阀门", name_en:"Compact Feed Valves", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-10, duration:5 }, desc:"油罐+100、射程-2m。火力更足，就是得贴着喷——贴着，懂？", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"乌玛石", qty:40, credits:550 } },
      { id:"crspr_fuel_diffuser", name_zh:"燃油流扩散器", name_en:"Fuel Stream Diffuser", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:8, yield:5, supplyCost:5 }, desc:"射程+5m。隔两个身位开始烧烤，虫的米其林远距离体验。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"乌玛石", qty:45, credits:600 } },
      { id:"crspr_face_melter", name_zh:"物理熔穿", name_en:"Face Melter", rarity:"balanced", tier:"T3", s6raw:"T2", inferred:false, effect:{ yield:15, morale:-5 }, desc:"伤害+4、流速+1.8、射程-3m。字面意义的贴脸开大，勇气可嘉。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"玉石", qty:50, credits:700 } },
      { id:"crspr_sticky_fuel", name_zh:"黏性燃油", name_en:"Sticky Fuel", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:10, supplyCost:5 }, desc:"火胶 DPS+10、持续+6s。着火时间比集团合同还长。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"玉石", qty:50, credits:700 } },
      { id:"crspr_scorching_tide", name_zh:"灼热浪潮", name_en:"Scorching Tide", rarity:"unstable", tier:"T1", s6raw:"T0", inferred:false, effect:{ yield:25, eventSuccess:12, supplyCost:20 }, desc:"蓄力横喷八向火浪。一条街的虫一起熟，油耗也一起熟。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"玉石", qty:75, credits:1350 } }
    ]},
    cryo: { zh: "急冻喷射炮", mods: [
      { id:"cryo_thermal_efficiency", name_zh:"改良热效率", name_en:"Improved Thermal Efficiency", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ supplyCost:-8 }, desc:"罐容+25%、压力更稳。制冷界的省电模式。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"乌玛石", qty:25, credits:300 } },
      { id:"cryo_tuned_cooler", name_zh:"制冷调整", name_en:"Tuned Cooler", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:8 }, desc:"冻结功率+1。虫子表示这天气不对劲。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"乌玛石", qty:25, credits:350 } },
      { id:"cryo_flow_expansion", name_zh:"流量扩充", name_en:"Flow Rate Expansion", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ duration:-5 }, desc:"流速+0.8。冻得快，化得也快，手速要跟上。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"乌玛石", qty:25, credits:350 } },
      { id:"cryo_crystal_nucleation", name_zh:"冰气凝棘", name_en:"Crystal Nucleation", rarity:"balanced", tier:"T2", s6raw:"T1", inferred:false, effect:{ eventSuccess:10, yield:6, supplyCost:5 }, desc:"燃料落点结出冰晶阵。地刺免费安装，物业不管。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"乌玛石", qty:45, credits:600 } },
      { id:"cryo_ice_spear", name_zh:"冰锥", name_en:"Ice Spear", rarity:"balanced", tier:"T1", s6raw:"T0", inferred:false, effect:{ eventSuccess:18, yield:8, supplyCost:10 }, desc:"换弹射出冰锥（350 动能+150 爆炸）。急冻炮学会了标枪。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"玉石", qty:55, credits:750 } },
      { id:"cryo_ice_storm", name_zh:"冰刃风暴", name_en:"Ice Storm", rarity:"balanced", tier:"T3", s6raw:"T3", inferred:false, effect:{ yield:20, eventSuccess:-8 }, desc:"伤害×2 但冻结力大减。砍得动，冻不住，冰风暴变风暴。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"玉石", qty:55, credits:700 } },
      { id:"cryo_snowball", name_zh:"雪球", name_en:"Snowball", rarity:"unstable", tier:"T2", s6raw:"T1", inferred:false, effect:{ eventSuccess:15, supplyCost:15 }, desc:"换弹丢出爆裂雪球。打雪仗冠军的毕业装备。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"玉石", qty:70, credits:1200 } }
    ]},
    sludge: { zh: "蚀泥喷射泵", mods: [
      { id:"sludge_ag_mixture", name_zh:"让泥浆飞", name_en:"AG Mixture", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ duration:-5, eventSuccess:4 }, desc:"弹速+30%、重力×0.25。让泥浆飞一会儿。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"乌玛石", qty:25, credits:300 } },
      { id:"sludge_disperser", name_zh:"蚀泥迸裂", name_en:"Disperser Compound", rarity:"clean", tier:"T1", s6raw:"T0", inferred:false, effect:{ eventSuccess:12, yield:8, rareDrop:5 }, desc:"蓄能弹+6 枚破片。性价比怪：无瑕之躯，T0 之魂。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"乌玛石", qty:30, credits:400 } },
      { id:"sludge_hydrogen_ion", name_zh:"蚀骨泥潭", name_en:"Hydrogen Ion Additive", rarity:"balanced", tier:"T2", s6raw:"T1", inferred:false, effect:{ yield:10, eventSuccess:6, duration:5 }, desc:"直击伤害+0.5、减速更强。泥潭里的虫在做慢动作回放。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"乌玛石", qty:45, credits:600 } },
      { id:"sludge_combustive_goo", name_zh:"泥浆炸裂", name_en:"Combustive Goo Mix", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:12, yield:6, supplyCost:8 }, desc:"泥浆可被点燃爆炸。配方表已提交工会，工会已读不回。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"玉石", qty:50, credits:700 } },
      { id:"sludge_blast", name_zh:"霰射泥浆", name_en:"Sludge Blast", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:10, yield:8, supplyCost:6 }, desc:"蓄能变霰弹轰脸。泥浆泵的近身解决方案，酸爽。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"玉石", qty:50, credits:700 } },
      { id:"sludge_volatile_impact", name_zh:"即蚀刑乐", name_en:"Volatile Impact Mixture", rarity:"unstable", tier:"T2", s6raw:null, inferred:true, effect:{ yield:22, eventSuccess:10, supplyCost:12 }, desc:"溅射×2、腐蚀减半。名字听着像刑罚，效果确实是。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"玉石", qty:70, credits:1250 } },
      { id:"sludge_goo_bomber", name_zh:"黏液轰炸", name_en:"Goo Bomber Special", rarity:"unstable", tier:"T2", s6raw:"T1", inferred:false, effect:{ yield:18, eventSuccess:8, supplyCost:10 }, desc:"飞行途中持续掉破片。弹道所至，寸草不生。特调，堂食无座。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"玉石", qty:70, credits:1200 } }
    ]},
    breachcutter: { zh: "等离子切割器", mods: [
      { id:"bc_lightweight_cases", name_zh:"轻量匣壁", name_en:"Light-weight Cases", rarity:"clean", tier:"T3", s6raw:null, inferred:true, effect:{ supplyCost:-8 }, desc:"备弹+3、装填-0.2 秒。后勤部史上唯一零意见的改造。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"吸铁石", qty:25, credits:300 } },
      { id:"bc_roll_control", name_zh:"旋转控制", name_en:"Roll Control", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:8 }, desc:"按住扳机就能拐弯的等离子束。物理老师的头发又少了几根。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"吸铁石", qty:25, credits:350 } },
      { id:"bc_stronger_current", name_zh:"强化电浆流", name_en:"Stronger Plasma Current", rarity:"clean", tier:"T2", s6raw:null, inferred:true, effect:{ yield:10 }, desc:"单纯的+50 威力，没有任何花样。集团最欣赏这种诚实。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"吸铁石", qty:30, credits:400 } },
      { id:"bc_return_to_sender", name_zh:"冷血追命", name_en:"Return to Sender", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:10, yield:5 }, desc:"弹束会自己拐回来补刀。虫：都结束了吧？——没有。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"吸铁石", qty:45, credits:600 } },
      { id:"bc_high_voltage", name_zh:"高压转接", name_en:"High Voltage Crossover", rarity:"balanced", tier:"T2", s6raw:null, inferred:true, effect:{ eventSuccess:15, supplyCost:8 }, desc:"光束带电，弹匣缩水六成。电疗效果好，就是费电。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"乌玛石", qty:50, credits:700 } },
      { id:"bc_spinning_death", name_zh:"死亡圆舞", name_en:"Spinning Death", rarity:"unstable", tier:"T3", s6raw:null, inferred:true, effect:{ yield:18, eventSuccess:-8, supplyCost:-10 }, desc:"弹束原地旋转两圈半，覆盖全场，就是转得慢。杀阵很美，节奏很慢。", unlock:{ weaponUp:4, hazard:3 }, cost:{ mineral:"乌玛石", qty:70, credits:1200 } },
      { id:"bc_inferno", name_zh:"地狱火", name_en:"Inferno", rarity:"unstable", tier:"T1", s6raw:"T0", inferred:false, effect:{ yield:25, eventSuccess:15, medBill:40, supplyCost:15 }, desc:"官方说明：以减弱直接伤害和护甲破坏为代价，换取射线经过之处横尸遍野，寸草不生。会计部补充：账单也一样。", unlock:{ weaponUp:5, hazard:3 }, cost:{ mineral:"乌玛石", qty:85, credits:1500 } }
    ]},
    /* —— 副手池（同 scout 段注释：移植自 15a780e，tier 按 3a178b4 对齐）—— */
    subata: { zh: "苏巴特 120 半自动手枪", mods: [
      { id:"subata_homebrew_powder", name_zh:"自制火药", name_en:"Homebrew Powder", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ supplyCost:-12 }, desc:"钻机部土方，省钱有一手。", unlock:{ weaponUp:0, hazard:1 }, cost:{ mineral:"铜矿", qty:20, credits:300 } },
      { id:"subata_oversized_magazine", name_zh:"超大弹匣", name_en:"Oversized Magazine", rarity:"clean", tier:"T1", s6raw:null, inferred:false, effect:{ yield:10 }, desc:"弹匣管饱，产出跟涨。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"铜矿", qty:25, credits:400 } },
      { id:"subata_chain_hit", name_zh:"连锁打击", name_en:"Chain Hit", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ rareDrop:12 }, desc:"串联弹道，稀有矿排队露头。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"蜂母石", qty:25, credits:450 } },
      { id:"subata_tranquilizer_rounds", name_zh:"镇定弹药", name_en:"Tranquilizer Rounds", rarity:"balanced", tier:"T1", s6raw:null, inferred:false, effect:{ morale:4 }, desc:"镇静弹一响，矿工心态稳了。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"容和石", qty:30, credits:500 } },
      { id:"subata_explosive_reload", name_zh:"爆破装填", name_en:"Explosive Reload", rarity:"balanced", tier:"T1", s6raw:null, inferred:false, effect:{ yield:14 }, desc:"换弹都带爆破，讲究。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"蜂母石", qty:30, credits:550 } },
      { id:"subata_automatic_fire", name_zh:"全自动射击", name_en:"Automatic Fire", rarity:"unstable", tier:"T2", s6raw:null, inferred:false, effect:{ yield:25, supplyCost:10 }, desc:"全自动烧硝石，手速对齐流水线。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"妙绝珠", qty:50, credits:800 } }
    ] },
    plasmacharger: { zh: "实验性等离子蓄能手枪", mods: [
      { id:"plasmacharger_energy_rerouting", name_zh:"能量重导", name_en:"Energy Rerouting", rarity:"clean", tier:"T1", s6raw:null, inferred:false, effect:{ supplyCost:-12 }, desc:"能量改线，成本改低。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"铜矿", qty:25, credits:400 } },
      { id:"plasmacharger_magnetic_cooling_unit", name_zh:"磁力制冷", name_en:"Magnetic Cooling Unit", rarity:"clean", tier:"T1", s6raw:null, inferred:false, effect:{ morale:4 }, desc:"枪不烫手，矿工暖心。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"蜂母石", qty:25, credits:450 } },
      { id:"plasmacharger_heat_pipe", name_zh:"热导管", name_en:"Heat Pipe", rarity:"balanced", tier:"T1", s6raw:null, inferred:false, effect:{ yield:12 }, desc:"余热变现，绿色经济。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"蜂母石", qty:30, credits:500 } },
      { id:"plasmacharger_persistent_plasma", name_zh:"长时电浆", name_en:"Persistent Plasma", rarity:"balanced", tier:"T1", s6raw:null, inferred:false, effect:{ eventSuccess:14, yield:8 }, desc:"电浆挂机时间长，事件全接住。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"容和石", qty:40, credits:650 } },
      { id:"plasmacharger_overcharger", name_zh:"超载充能", name_en:"Overcharger", rarity:"unstable", tier:"T2", s6raw:null, inferred:false, effect:{ yield:20, supplyCost:8 }, desc:"超载一时爽，硝石火葬场。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"妙绝珠", qty:40, credits:650 } },
      { id:"plasmacharger_heavy_hitter", name_zh:"沉重打击", name_en:"Heavy Hitter", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:24, medBill:30 }, desc:"一击沉重，医疗部沉重。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"妙绝珠", qty:50, credits:800 } }
    ] },
    colette: { zh: "柯莱特微波烹调者", mods: [
      { id:"colette_liquid_cooling_system", name_zh:"液冷系统", name_en:"Liquid Cooling System", rarity:"clean", tier:"T1", s6raw:null, inferred:false, effect:{ morale:4 }, desc:"微波炉带液冷，厨房安全生产。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"铜矿", qty:25, credits:400 } },
      { id:"colette_super_focus_lens", name_zh:"超聚镜头", name_en:"Super Focus Lens", rarity:"clean", tier:"T2", s6raw:null, inferred:false, effect:{ rareDrop:12 }, desc:"聚波成针，专挑稀有矿下嘴。", unlock:{ weaponUp:1, hazard:1 }, cost:{ mineral:"蜂母石", qty:25, credits:450 } },
      { id:"colette_diffusion_ray", name_zh:"扩散射线", name_en:"Diffusion Ray", rarity:"balanced", tier:"T1", s6raw:null, inferred:false, effect:{ eventSuccess:12 }, desc:"波及全场，事件稳收。", unlock:{ weaponUp:2, hazard:1 }, cost:{ mineral:"容和石", qty:30, credits:500 } },
      { id:"colette_mega_power_supply", name_zh:"超级电容", name_en:"Mega Power Supply", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:20, supplyCost:8 }, desc:"电容超级，账单也超级。", unlock:{ weaponUp:2, hazard:2 }, cost:{ mineral:"妙绝珠", qty:40, credits:650 } },
      { id:"colette_blistering_necrosis", name_zh:"脓包坏死", name_en:"Blistering Necrosis", rarity:"unstable", tier:"T1", s6raw:null, inferred:false, effect:{ yield:24, medBill:30 }, desc:" microwave 熟透，医疗部熟读合同。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"妙绝珠", qty:50, credits:800 } },
      { id:"colette_gamma_contamination", name_zh:"伽马污染", name_en:"Gamma Contamination", rarity:"unstable", tier:"T2", s6raw:null, inferred:false, effect:{ yield:26, morale:-5 }, desc:"伽马管够，体检管够。", unlock:{ weaponUp:3, hazard:2 }, cost:{ mineral:"容和石", qty:50, credits:800 } }
    ] }
  }
};

/* 三提石抽卡规则（用户拍板 2026-09-13）：
   pool=all：99 条模组全池公平抽取，无预留、无特殊标记；
   duplicate=freeReroll：抽到已有模组 → 免费重抽 1 次，不折算 credits；
   pity：连续 9 抽未出顶级档(tier T1)，第 10 抽的三选一强制含 ≥1 条 T1，触发后计数清零 */
const MOD_GACHA = { pool: "all", duplicate: "freeReroll", pity: { counter: 10, guarantee: "T1" } };


/* 武器模组全池（B-3 产出）—— 三提石抽卡 3 选 1 数据源，主会话负责实装 */


/* 三提石抽卡规则（用户拍板 2026-09-13）：
   pool=all：99 条模组全池公平抽取，无预留、无特殊标记；
   duplicate=freeReroll：抽到已有模组 → 免费重抽 1 次，不折算 credits；
   pity：连续 9 抽未出顶级档(tier T1)，第 10 抽的三选一强制含 ≥1 条 T1，触发后计数清零 */


/* 模组索引与效果聚合 */
const MOD_INDEX = {};
Object.entries(WEAPON_MODS).forEach(([cls, ws]) => Object.entries(ws).forEach(([wid, w]) => {
  w.mods.forEach(m => { MOD_INDEX[m.id] = {...m, cls, weaponId: wid, weaponZh: w.zh}; });
}));
const WEAPON_IDS = {
  scout:['gk2','m1000','drak'],
  engineer:['warthog','lok1','sharddif'],
  gunner:['leadstorm','thunderhead','hurricane'],
  driller:['crspr','cryo','sludge'],
};

/* ---------------- 武器携带 v2（B-6 §十）：主手+副手双槽，凭证=解锁进度，每把武器独立升 5 级 ---------------- */
const WEAPON_SET = {
  scout:   { main:['gk2','m1000','drak'],                          off:['jury','zhukov','nishanka'] },
  engineer:{ main:['warthog','lok1','voltar'],                     off:['pgl','breachcutter','sharddif'] },
  gunner:  { main:['leadstorm','thunderhead','hurricane'],         off:['bulldog','brt7','armskore'] },
  driller: { main:['crspr','cryo','sludge'],                       off:['subata','plasmacharger','colette'] },
};
const WEAPON_ZH = {
  voltar:'「百万」伏特微型冲锋枪', jury:'应急霰弹枪', zhukov:'朱可夫 NUK17 双持冲锋枪', nishanka:'尼桑卡 X-80「闪电鲨」战术弩',
  bulldog:'「斗牛犬」重型左轮手枪', brt7:'BRT7 连发手枪', armskore:'「武装核心」电磁手炮',
  subata:'苏巴特 120 半自动手枪', plasmacharger:'实验性等离子蓄能手枪', colette:'柯莱特微波烹调者'
};
const WEAPON_ZH_ALL = {};
Object.entries(WEAPON_MODS).forEach(([, ws]) => Object.entries(ws).forEach(([wid, w]) => { WEAPON_ZH_ALL[wid] = w.zh; }));
function weaponZh(wid){ if(currentLang() === 'en' && typeof WEAPON_EN !== 'undefined' && WEAPON_EN[wid]) return WEAPON_EN[wid]; return WEAPON_ZH_ALL[wid] || WEAPON_ZH[wid] || wid; }
/* 图标路径表（清单 §13.1：21 张 wiki 图标 + 3 张 C 手绘在 assets/weapons/） */
const WICONS = {
  scout:   { main:['assets/icons/w_scout_1.png','assets/icons/w_scout_2.png','assets/icons/w_scout_3.png'], off:['assets/icons/w_scout_s2.png','assets/icons/w_scout_s1.png','assets/icons/w_scout_s3.png'] },
  engineer:{ main:['assets/icons/w_eng_1.png','assets/icons/w_eng_2.png','assets/weapons/w_eng_voltaic.png'], off:['assets/icons/w_eng_gren.png','assets/weapons/w_eng_breach.png','assets/icons/w_eng_3.png'] },
  gunner:  { main:['assets/icons/w_gun_1.png','assets/icons/w_gun_2.png','assets/icons/w_gun_3.png'], off:['assets/icons/w_gun_s1.png','assets/icons/w_gun_s2.png','assets/weapons/w_gun_coilgun.png'] },
  driller: { main:['assets/icons/w_drill_1.png','assets/icons/w_drill_2.png','assets/icons/w_drill_3.png'], off:['assets/icons/w_drill_s1.png','assets/icons/w_drill_s2.png','assets/icons/w_drill_s3.png'] }
};
function ensureWeaponV2(){
  if(!S.wlv) S.wlv = {};
  if(!S.slot) S.slot = {};
  Object.keys(WEAPON_SET).forEach(cls => {
    if(!S.wlv[cls]) S.wlv[cls] = {};
    if(!S.slot[cls]) S.slot[cls] = { main: Math.max(0, Math.min(S.licenses[cls]-1, 2)), off: Math.max(0, Math.min(S.licenses[cls]-1, 2)) };
    WEAPON_SET[cls].main.concat(WEAPON_SET[cls].off).forEach(wid => { if(S.wlv[cls][wid] === undefined) S.wlv[cls][wid] = 0; });
  });
}
function weaponUpCost(cls, lv){
  const L = CLASSES[cls].lic;
  return { c: Math.round(250 * Math.pow(1.7, lv)), m1: L.m, q1: 6 + 6*lv, m2: SECOND_LIC[cls], q2: 5 + 4*lv };
}
function buyWeaponUpgrade(cls, pool, idx){
  ensureWeaponV2();
  const wid = WEAPON_SET[cls][pool][idx];
  if(idx >= S.licenses[cls]) return;
  const lv = S.wlv[cls][wid] || 0;
  if(lv >= 5) return;
  const c = weaponUpCost(cls, lv);
  if((S.rare[c.m1]||0) < c.q1 || (S.rare[c.m2]||0) < c.q2 || S.credits < c.c) return;
  S.credits -= c.c; S.rare[c.m1] -= c.q1; S.rare[c.m2] -= c.q2;
  S.wlv[cls][wid] = lv + 1;
  log(weaponZh(wid)+L(' 升级至 Lv.')+(lv+1)+L('/5！'), 'gold');
  renderAll(); save();
}
/* 武器升级 disabled 时显示具体缺口 */
function wupDisText(cls, i){
  const L = CLASSES[cls].lic;
  const parts = [];
  const mName = L.m, mNeed = L.q[i] || L.q[L.q.length-1];
  if((S.rare[mName]||0) < mNeed) parts.push(L(mName)+'×'+(mNeed-(S.rare[mName]||0)));
  if(S.credits < 250) parts.push(L('代币不足'));
  return parts.length ? parts.join(' + ') : '';
}
const EFF_NAMES = {yield:'产出', duration:'时长', eventSuccess:'事件成功率', rareDrop:'稀有掉落', morale:'士气', supplyCost:'硝石消耗', medBill:'医疗账单'};
function currentWeaponId(cls){ ensureWeaponV2(); return WEAPON_SET[cls].main[S.slot[cls].main]; }
function offWeaponId(cls){ ensureWeaponV2(); return WEAPON_SET[cls].off[S.slot[cls].off]; }
function equippedModFor(cls){
  const mid = (S.equipped||{})[cls];
  if(!mid) return null;
  const mod = MOD_INDEX[mid];
  if(!mod || mod.weaponId !== currentWeaponId(cls)) return null;
  return mod;
}
function equippedOffModFor(cls){
  const mid = (S.equippedOff||{})[cls];
  if(!mid) return null;
  const mod = MOD_INDEX[mid];
  if(!mod || mod.weaponId !== offWeaponId(cls)) return null;
  return mod;
}
function squadModEffects(minerIds){
  const agg = {yield:0, duration:0, eventSuccess:0, rareDrop:0, morale:0, supplyCost:0, medBill:0};
  const seen = {};
  minerIds.forEach(id => {
    const m = S.miners.find(x=>x.id===id); if(!m) return;
    if(seen[m.cls]) return; seen[m.cls] = true;
    const e = equippedModFor(m.cls);
    if(e && e.effect) for(const k in agg) agg[k] += (e.effect[k]||0);
    const eo = equippedOffModFor(m.cls);
    if(eo && eo.effect) for(const k in agg) agg[k] += (eo.effect[k]||0);
  });
  /* 饰品全队加成（B-5：squad scope） */
  const tr = trinketEffect();
  if(tr) for(const k in agg) agg[k] += (tr[k]||0);
  return agg;
}
function effectText(eff){
  return Object.entries(eff).map(([k,v]) => {
    const unit = k === 'morale' ? '' : '%';
    return L(EFF_NAMES[k]) + ' ' + (v>0?'+':'') + v + unit;
  }).join(L('，'));
}
/* 饰品索引与全队效果（B-5：effectScope squad，同名唯一） */
const TRINKET_INDEX = {};
let trinketIndexReady = false;
function ensureTrinketIndex(){
  if(trinketIndexReady) return;
  if(typeof TRINKETS !== 'undefined' && TRINKETS.pool) TRINKETS.pool.forEach(t => { TRINKET_INDEX[t.id] = t; });
  trinketIndexReady = true;
}
function equippedTrinket(){
  ensureTrinketIndex();
  const id = S.trinketEq;
  return (id && TRINKET_INDEX[id]) ? TRINKET_INDEX[id] : null;
}
function trinketEffect(){
  const t = equippedTrinket();
  return (t && t.effect) ? t.effect : {};
}
function awardRandomTrinket(why){
  ensureTrinketIndex();
  const pool = TRINKETS.pool;
  const t = pool[Math.floor(Math.random()*pool.length)];
  S.trinkets[t.id] = (S.trinkets[t.id]||0) + 1;
  if(String(why).includes('节日')){
    log(TEXT.tr_drop_festival.replace('{name}', t.name_zh), 'gold');
  } else if(String(why).includes('饰品箱')){
    log(TEXT.tr_box_open+'【'+t.name_zh+'】已入库。', 'gold');
  } else {
    log(TEXT.tr_drop_relic.replace('{name}', t.name_zh), 'gold');
  }
}




/* ---------------- 精英支援位（B-6 产出） ---------------- */
const ELITE_UNITS = {
  unlockRig: 10,
  currency: "merit",
  carry: { max: 1, supplyCost: 10, diveAllowed: true },
  rescue: { enabled: true, requiresIdleElite: true, salvage: 0.5, medBill: -50, medHours: -25 },
  rewind: { perWeek: 1 },
  units: [
    { id:"guardian", name_zh:"守护者", name_en:"Guardian", price:20, effect:{ medBill:-30, medHours:-30 }, desc:"排斥力场一开，虫子的牙签扎不透护盾。" },
    { id:"spotter", name_zh:"歼察员", name_en:"Spotter", price:30, effect:{ eventSuccess:10, reveal:true }, desc:"揭敌镖弹先飞一步，选项成功率明码标价。" },
    { id:"falconer", name_zh:"驭鹰者", name_en:"Falconer", price:30, effect:{ rareDrop:15 }, desc:"无人机盘旋一圈，连矿脉私房钱都报出来。" },
    { id:"slicer", name_zh:"切割者", name_en:"Slicer", price:45, effect:{ combatSuccess:25, failPenalty:0.5 }, desc:"等离子剑开路。战斗失败？剑和腰带了谁，账单找谁——找一半。" },
    { id:"retcon", name_zh:"回溯者", name_en:"Retcon", price:60, effect:{ rewindPerWeek:1 }, desc:"锚点回溯：把一次失败从时间线上划掉。" }
  ]
};
/* ---------------- 社区梗事件（B-1 §7） ---------------- */
const MEME_EVENTS = {
  slotChance: 0.35,
  pool: [
    { id:'ev_mushroom',  w:20 },
    { id:'ev_wererich',  w:20 },
    { id:'ev_barrel',    w:14 },
    { id:'ev_molly',     w:10 },
    { id:'ev_doretta',   w:8,  require:'escort' },
    { id:'ev_slogan',    w:8 },
    { id:'ev_karlstory', w:6 },
    { id:'ev_tipc',      w:6,  require:'bar' },
    { id:'ev_leaflover', w:6,  require:'bar' },
    { id:'ev_goldbug',   w:2 },
  ],
};

/* ---------------- 深潜系统（B-4） ---------------- */
/* 每周深潜系统（B-4 产出）—— 主会话负责实装；修正器 desc 可直接上 UI */
const WEEKLY_DIVE = {
  unlock:  { normal: { anyStars: 1 }, elite: { anyStars: 3 } },  // 普通=任一★≥1；精英=任一★≥3（对齐原作）
  refresh: { mode: 'isoWeek', resetDay: 1, invalidateUnfinished: true, variants: ['normal', 'elite'] },  // 种子 = ISO 周号 ×10 + 变体号
  squad:   { min: 4, max: 4, forceAllClasses: true, serialStages: true },   // 强制四职业满编（用户拍板 2026-09-13）
  settle:  { missionPayRate: 1.0, kpiCounts: true, worstCase: 'medBill' },   // 全额结算（用户拍板：周常限次=高奖励）

  /* 双轨（用户拍板 2026-09-13）：每阶段 1 个连续长任务；durMul ×2.5；每关通关即发 1 份阶段奖励（共 3 份）+ 通关大额 1 份；
     fit = 契合职业当关加成（强制四职业满编的亮点位） */
  stages: {
    normal: [   // 普通深潜：危4 → 危5 → 危5+
      { id: 1, name: '深潜 · 第一段', missions: [{ type: '采矿探险' }], fit: { cls: 'scout', yield: 10 },
        hazard: 4, hazardBonus: 2.0, durMul: 2.5, evDensity: [40, 40, 20],
        rewards: { blankMod: 1, credits: 400,  morkite: 200, merit: 1, rare: 0 } },
      { id: 2, name: '深潜 · 第二段', missions: [{ type: '消灭任务' }], fit: { cls: 'gunner', eventSuccess: 10 },
        hazard: 5, hazardBonus: 2.33, durMul: 2.5, evDensity: [35, 40, 25],
        rewards: { blankMod: 1, credits: 700,  morkite: 350, merit: 2, rare: 6 } },
      { id: 3, name: '深潜 · 第三段', missions: [{ type: '执勤护送' }], fit: { cls: 'driller', duration: -10 },
        hazard: 5, hazardBonus: 2.66, durMul: 2.5,
        evDensity: [35, 40, 25], forceFirstEvent: true,
        rewards: { blankMod: 2, credits: 1100, morkite: 550, merit: 3, rare: 10 } }
    ],
    elite: [    // 精英深潜：危5 → 危5+ → 危5++（全程超档，解锁=任一矿工 ≥3★）
      { id: 1, name: '精英深潜 · 第一段', missions: [{ type: '定点提取' }], fit: { cls: 'scout', yield: 10 },
        hazard: 5, hazardBonus: 2.33, durMul: 2.5, evDensity: [30, 40, 30],
        rewards: { blankMod: 1, credits: 600,  morkite: 300, merit: 2, rare: 8 } },
      { id: 2, name: '精英深潜 · 第二段', missions: [{ type: '消灭任务' }], fit: { cls: 'gunner', eventSuccess: 10 },
        hazard: 5, hazardBonus: 2.66, durMul: 2.5, evDensity: [30, 40, 30],
        rewards: { blankMod: 1, credits: 1000, morkite: 450, merit: 2, rare: 10 } },
      { id: 3, name: '精英深潜 · 第三段', missions: [{ type: '就地精炼' }], fit: { cls: 'engineer', duration: -10 },
        hazard: 5, hazardBonus: 3.0, durMul: 2.5,
        evDensity: [25, 40, 35], forceFirstEvent: true,
        rewards: { blankMod: 1, credits: 1600, morkite: 700, merit: 3, rare: 12 } }
    ]
  },

  completionBonus: {
    normal: { blankMod: 1, credits: 2000, morkite: 800, merit: 4 },
    elite:  { blankMod: 1, credits: 3000, morkite: 1200, merit: 4 }
    // 淬炼保底已删除（用户拍板：10 抽必出 T1 是唯一保底）；深潜奖励从优——周常限次=高回报（用户拍板）
  },

  failRule: { stageHeavyInjuries: 2, moraleFloor: 25 },

  // 精英深潜已转正为 stages.elite / completionBonus.elite / modifiers.perWeek.elite（用户拍板 2026-09-13）

  modifiers: {
    perWeek: { normal: { buff: 1, debuff: 2 }, elite: { buff: 1, debuff: 3 } },   // 精英多抽 1 条减益（不重复）
    pool: [
      /* —— 增益 / 中性（7）—— */
      { id: 'mod_goldrush',    name_zh: '淘金热潮',   name_en: 'Gold Rush',   kind: 'buff',   w: 10, official: true,
        icon: 'MisMap_Mutator_GoldRush', effect: { payMul: 2.0 },
        desc: '任务区域内黄金矿脉异常富饶。我们发财了！——财务部对这句话的翻译是：深潜订单加价 100%。' },
      { id: 'mod_richminerals', name_zh: '富矿层',    name_en: 'Rich in Minerals', kind: 'buff', w: 10, official: false,
        icon: 'MisMap_Mutator_RichInMinerals', effect: { morkiteMul: 1.5 },
        desc: '本层墨菱石储量远超申报单。勘测部表示报告没写错，是矿脉太敬业。（名称待核）' },
      { id: 'mod_lowgravity',  name_zh: '低倍重力',   name_en: 'Low Gravity', kind: 'mixed',  w: 8, official: true,
        icon: 'MisMap_Mutator_LowGravity', effect: { duration: -15, checkT: 0.3 },
        desc: '引力紊乱：所有人蹦得又高又远——包括虫。工期缩短 15%，精英虫更难缠。' },
      { id: 'mod_doublexp',    name_zh: '双倍经验',   name_en: 'Double XP',   kind: 'buff',   w: 8, official: true,
        icon: 'MisMap_Mutator_XXXP', effect: { xpMul: 2.0 },
        desc: '本周下潜经历按双倍计入培训档案。人事部：这也是一种绩效。' },
      { id: 'mod_weakspot',    name_zh: '弱点打击',   name_en: 'Weakspot',    kind: 'buff',   w: 7, official: false,
        icon: 'MisMap_Mutator_Weakspot', effect: { eventSuccess: 10 },
        desc: '打弱点格外疼——对所有事件检定 +10%。打哪儿哪疼，这是天赋。（名称待核）' },
      { id: 'mod_oxygenrich',  name_zh: '富氧空气',   name_en: 'Oxygen Rich', kind: 'buff',   w: 5, official: false,
        icon: 'MisMap_Mutator_OxygenRich', effect: { duration: -10, morale: 2 },
        desc: '空气格外提神：工期 -10%，士气 +2/任务。副作用是嗓音变得格外搞笑。（名称待核）' },
      { id: 'mod_extermination', name_zh: '灭虫合同', name_en: 'Extermination Contract', kind: 'buff', w: 5, official: false,
        icon: 'MisMap_Mutator_ExterminationContract', effect: { payMul: 1.3, morale: 3 },
        desc: '杀虫如赚钱，死虫子早该爆金币——官方原话，本次合同照办：产出 +30%，士气 +3/任务。（名称待核）' },
      /* —— 减益（9）—— */
      { id: 'mod_leechden',    name_zh: '水蛭丛生',   name_en: 'Cave Leech Cluster', kind: 'debuff', w: 10, official: true,
        icon: 'MisMap_Warning_CaveLeechDen', effect: { evW: { leech: 3 } },
        desc: '收手吧矿工，洞里全是洞穴水蛭——官方原话。水蛭事件权重 ×3，请总是抬头观察。' },
      { id: 'mod_swarmageddon', name_zh: '蜂拥浩劫',  name_en: 'Swarmageddon', kind: 'debuff', w: 10, official: true,
        icon: 'MisMap_Warning_Swarmageddon', effect: { evW: { swarm: 2 }, checkT: 0.5 },
        desc: '准备迎接海啸般的蜂拥异虫吧！虫潮权重 ×2 且更难硬刚（T+0.5）。' },
      { id: 'mod_exploder',    name_zh: '自爆群袭',   name_en: 'Exploder Infestation', kind: 'debuff', w: 9, official: true,
        icon: 'MisMap_Warning_ExploderInfestation', effect: { evW: { swarm: 2 }, medBill: 25 },
        desc: '源源不断的自爆异虫群。医疗站已按账单 +25% 预订了额外的纱布。' },
      { id: 'mod_mactera',     name_zh: '异虫蝇瘟疫', name_en: 'Mactera Plague', kind: 'debuff', w: 9, official: true,
        icon: 'MisMap_Warning_MacteraCave', effect: { evW: { elite: 2 }, checkT: 0.3 },
        desc: '主要威胁来自空中。精英虫权重 ×2、T+0.3——请把照明弹的预算花在刀刃上。' },
      { id: 'mod_regen',       name_zh: '虫群再生',   name_en: 'Regenerative Bugs', kind: 'debuff', w: 8, official: true,
        icon: 'MisMap_Warning_RegenerativeEnemies', effect: { eventSuccess: -10 },
        desc: '几秒不打，虫血回满。所有事件检定 -10%：别停手，也别手抖。' },
      { id: 'mod_lethal',      name_zh: '致命虫群',   name_en: 'Lethal Enemies', kind: 'debuff', w: 8, official: true,
        icon: 'MisMap_Warning_LethalEnemies', effect: { medBill: 50, medHoursMul: 1.25 },
        desc: '虫的近手伤害大幅上涨。医疗账单 +50%、住院时间 +25%——账单比虫子更疼，本周双倍兑现。' },
      { id: 'mod_haunted',     name_zh: '幽魂不散',   name_en: 'Haunted Cave', kind: 'debuff', w: 7, official: true,
        icon: 'MisMap_Warning_HauntedCave', effect: { morale: -5 },
        desc: '检测到无法归档的声源。士气 -5/任务：不是怕，是"高度警觉"，人事部坚持用后者。' },
      { id: 'mod_nooxygen',    name_zh: '低氧区',     name_en: 'No Oxygen',   kind: 'debuff', w: 6, official: false,
        icon: 'MisMap_Warning_NoOxygen', effect: { supplyCost: 25 },
        desc: '呼吸要靠矿骡的氧气瓶。补给硝石 +25%（60→75/人）：频繁回补给点，运费照涨。（名称待核）' },
      { id: 'mod_rival',       name_zh: '强敌来袭',   name_en: 'Rival Incursion', kind: 'debuff', w: 5, official: true,
        icon: 'MisMap_Warning_RivalIncursion', effect: { checkT: 0.5, voucherOnEliteKill: 1 },
        desc: '传感器侦测到强敌机器人出没。精英虫 T+0.5，但猎杀成功额外 +1 武器凭证——风险与绩效成正比。' }
    ]
  }
};



/* ---------------- 饰品系统（B-5） ---------------- */
/* 饰品系统（B-5 产出）——主会话负责实装；效果键沿用 B-3 七键 */
const TRINKETS = {
  slotsPerMiner: 1,                 // 每矿工 1 槽（官方栏位词：面部饰品）
  effectScope: "squad",             // 全队结算加成；同名不可重复佩戴
  duplicate: "freeReroll",          // 沿用 B-3 抽卡规则
  pool: [
    /* —— 节日装饰物（稀有，festival）—— */
    { id:"tr_elf",      name_zh:"圣诞小精灵", name_en:"Yuletide Elf", series:"festival", rarity:"rare", fest:"xmas",  effect:{ supplyCost:-8 }, desc:"小精灵很能干，一个人干了三个人的活——包括喝酒。" },
    { id:"tr_dragon",   name_zh:"新年龙龙",   name_en:"Lunar Festival Dragon", series:"festival", rarity:"rare", fest:"lunar", effect:{ yield:8 }, desc:"龙年舞龙，财源滚滚。财务部难得没有反对。" },
    { id:"tr_horse",    name_zh:"新年小马",   name_en:"Lunar Festival Horse", series:"festival", rarity:"rare", fest:"lunar", effect:{ duration:-5 }, desc:"小马跑得快，全队跟着快。" },
    { id:"tr_rabbit",   name_zh:"春节兔子装饰", name_en:"Lunar Festival Rabbit", series:"festival", rarity:"rare", fest:"lunar", effect:{ rareDrop:5 }, desc:"兔子繁殖率高，矿苗也跟着涨。" },
    { id:"tr_snake",    name_zh:"新年蛇蛇",   name_en:"Lunar Festival Snake", series:"festival", rarity:"rare", fest:"lunar", effect:{ eventSuccess:5 }, desc:"蛇的直觉，专挑软土下铲。" },
    { id:"tr_poolfloat",name_zh:"泳池玩具",   name_en:"Pool Float", series:"festival", rarity:"rare", fest:"beach", effect:{ morale:4 }, desc:"夏日限定。漂在矿骡水壶里，莫名解压。" },
    { id:"tr_springbny",name_zh:"机械春日兔兔", name_en:"Mechanical Spring Bunny", series:"festival", rarity:"rare", fest:"easter", effect:{ rareDrop:5 }, desc:"上发条的兔子，刨地比镐子还快。" },
    /* —— 节日头饰（史诗，festival）—— */
    { id:"tr_partyhat", name_zh:"派对帽", name_en:"Party Hat", series:"festival", rarity:"epic", fest:"easter", effect:{ morale:4, yield:5 }, desc:"戴上它，加班都像联欢会。" },
    { id:"tr_summerhat",name_zh:"夏日帽", name_en:"Summer Hat", series:"festival", rarity:"epic", fest:"beach", effect:{ duration:-8 }, desc:"遮阳、透气、离岗理由排行第一。" },
    { id:"tr_eggshat",  name_zh:"精美头饰", name_en:"Eggsquisite Hat", series:"festival", rarity:"epic", fest:"easter", effect:{ rareDrop:8 }, desc:"复活节限定。eggsquisite：官方拼的，我们不敢改。" },
    { id:"tr_beerhat",  name_zh:"啤酒节头饰", name_en:"Oktoberfestive Hat", series:"festival", rarity:"epic", fest:"oktober", effect:{ supplyCost:-10 }, desc:"酒量 +0，运量 +10。巴伐利亚皮裤不包退。" },
    { id:"tr_spookyhat",name_zh:"恐怖的万圣节头饰", name_en:"Horrific Halloween Headwear", series:"festival", rarity:"epic", fest:"halloween", effect:{ eventSuccess:10 }, desc:"官方全名。虫子看了都愣半秒——足够开一枪了。" },
    { id:"tr_yuletide", name_zh:"圣诞节风格头饰", name_en:"Yuletide Hat", series:"festival", rarity:"epic", fest:"xmas", effect:{ morale:6 }, desc:"毛绒绒的，专为季节性生产力波动提供官方理由。" },
    /* —— 周年奖杯（史诗，anniversary）—— */
    { id:"tr_trophy5",  name_zh:"五周年奖杯", name_en:"5 Year Anniversary Trophy", series:"anniversary", rarity:"epic", fest:"anniv", effect:{ eventSuccess:8 }, desc:"五周年限定。前四年都在填这个坑。" },
    { id:"tr_trophy6",  name_zh:"六周年奖杯", name_en:"6 Year Anniversary Trophy", series:"anniversary", rarity:"epic", fest:"anniv", effect:{ eventSuccess:8 }, desc:"六周年限定。坑还在挖，但灯装好了。" },
    { id:"tr_trophy7",  name_zh:"七周年奖杯", name_en:"7 Year Anniversary Trophy", series:"anniversary", rarity:"epic", fest:"anniv", effect:{ eventSuccess:8 }, desc:"七周年限定。财务部说这叫'长期主义'。" },
    { id:"tr_trophy8",  name_zh:"八周年奖杯", name_en:"8 Year Anniversary Trophy", series:"anniversary", rarity:"epic", fest:"anniv", effect:{ eventSuccess:8 }, desc:"八周年限定。奖杯比原来的钻台模型还重。" },
    /* —— 时装系（少见，fashion，饰品箱/链路图）—— */
    { id:"tr_sunglass", name_zh:"太阳镜", name_en:"Sunglasses", series:"fashion", rarity:"uncommon", effect:{ morale:2 }, desc:"洞穴里没太阳，但态度要有。", nameTBD:true },
    { id:"tr_sleeveless",name_zh:"无袖上装", name_en:"Sleeveless", series:"fashion", rarity:"uncommon", effect:{ duration:-3 }, desc:"省下的布料都换成了工期。", nameTBD:true },
    { id:"tr_pickpend", name_zh:"镐头挂件", name_en:"Pickaxe Pendant", series:"fashion", rarity:"uncommon", effect:{ yield:4 }, desc:"把祖传镐头挂在胸前——迷信？这叫企业文化。", nameTBD:true }
    /* —— 传说档：镀金变体不单列条目，运行时按“当季节日饰品 ×2 效果 + 前缀'镀金·'”生成 —— */
  ],
  gilded: { prefix:"镀金·", multiplier:2, chanceNormalDive:0.10, eliteDive:true },   // 传说档生成规则（待拍板 §7-1）
  calendar: {                                                                       // 节日战役档期（现实月份）
    "1":"lunar",  "2":"lunar",  "3":"easter",   "4":"easter",
    "6":"beach",  "7":"beach",  "8":"beach",    "9":"oktober",
    "10":"halloween", "11":"xmas", "12":"xmas", "anniv":"anniv"
  }
};



/* ---------------- 像素动画帧数据（会话 C v2） ----------------
   矮人 96x96/帧；接线方式见本清单第 0 节（名册实时头像框） */
const ANIM = {
  /* 四职业状态头像（名册头像框 / 派遣卡片） */
  dwarf_scout_idle:     { src:'assets/anim/dwarf_scout_idle.png',     frameW:96, frameH:96, frames:4, fps:3,  loop:true,  anchor:'bottom-center' },
  dwarf_scout_walk:     { src:'assets/anim/dwarf_scout_walk.png',     frameW:96, frameH:96, frames:6, fps:8,  loop:true,  anchor:'bottom-center' },
  dwarf_scout_dig:      { src:'assets/anim/dwarf_scout_dig.png',      frameW:96, frameH:96, frames:7, fps:10, loop:true,  anchor:'bottom-center' },
  dwarf_scout_med:      { src:'assets/anim/dwarf_scout_med.png',      frameW:96, frameH:96, frames:4, fps:3,  loop:true,  anchor:'bottom-center' },
  dwarf_engineer_idle:  { src:'assets/anim/dwarf_engineer_idle.png',  frameW:96, frameH:96, frames:4, fps:3,  loop:true,  anchor:'bottom-center' },
  dwarf_engineer_walk:  { src:'assets/anim/dwarf_engineer_walk.png',  frameW:96, frameH:96, frames:6, fps:8,  loop:true,  anchor:'bottom-center' },
  dwarf_engineer_dig:   { src:'assets/anim/dwarf_engineer_dig.png',   frameW:96, frameH:96, frames:7, fps:10, loop:true,  anchor:'bottom-center' },
  dwarf_engineer_med:   { src:'assets/anim/dwarf_engineer_med.png',   frameW:96, frameH:96, frames:4, fps:3,  loop:true,  anchor:'bottom-center' },
  dwarf_gunner_idle:    { src:'assets/anim/dwarf_gunner_idle.png',    frameW:96, frameH:96, frames:4, fps:3,  loop:true,  anchor:'bottom-center' },
  dwarf_gunner_walk:    { src:'assets/anim/dwarf_gunner_walk.png',    frameW:96, frameH:96, frames:6, fps:8,  loop:true,  anchor:'bottom-center' },
  dwarf_gunner_dig:     { src:'assets/anim/dwarf_gunner_dig.png',     frameW:96, frameH:96, frames:7, fps:10, loop:true,  anchor:'bottom-center' },
  dwarf_gunner_med:     { src:'assets/anim/dwarf_gunner_med.png',     frameW:96, frameH:96, frames:4, fps:3,  loop:true,  anchor:'bottom-center' },
  dwarf_driller_idle:   { src:'assets/anim/dwarf_driller_idle.png',   frameW:96, frameH:96, frames:4, fps:3,  loop:true,  anchor:'bottom-center' },
  dwarf_driller_walk:   { src:'assets/anim/dwarf_driller_walk.png',   frameW:96, frameH:96, frames:6, fps:8,  loop:true,  anchor:'bottom-center' },
  dwarf_driller_dig:    { src:'assets/anim/dwarf_driller_dig.png',    frameW:96, frameH:96, frames:7, fps:10, loop:true,  anchor:'bottom-center' },
  dwarf_driller_med:    { src:'assets/anim/dwarf_driller_med.png',    frameW:96, frameH:96, frames:4, fps:3,  loop:true,  anchor:'bottom-center' },

  /* 场景动画 */
  swarm_banner:         { src:'assets/anim/swarm_banner.png',         frameW:288, frameH:96,  frames:8, fps:8,  loop:true,  anchor:'top-left' },
  forge_card_flip:      { src:'assets/anim/forge_card_flip.png',      frameW:96,  frameH:132, frames:8, fps:10, loop:false, anchor:'top-left' },
  lloyd_pour:           { src:'assets/anim/lloyd_pour.png',           frameW:96,  frameH:96,  frames:8, fps:6,  loop:true,  anchor:'bottom-center' },
  medbay_discharge:     { src:'assets/anim/medbay_discharge.png',     frameW:144, frameH:96,  frames:8, fps:6,  loop:false, anchor:'bottom-left' },
  dive_descend:         { src:'assets/anim/dive_descend.png',         frameW:60,  frameH:120, frames:8, fps:10, loop:true,  anchor:'top-center' },
  doretta_head:         { src:'assets/anim/doretta_head.png',         frameW:120, frameH:84,  frames:6, fps:8,  loop:true,  anchor:'center' },
  karl_silhouette:      { src:'assets/anim/karl_silhouette.png',      frameW:120, frameH:96,  frames:4, fps:4,  loop:true,  anchor:'center' },

  /* 社区梗事件头图（C 二期 ×9，288×96×6帧；ev_doretta 复用 doretta_head 不在此列） */
  meme_mushroom:        { src:'assets/anim/meme_mushroom.png',        frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  meme_wererich:        { src:'assets/anim/meme_wererich.png',        frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  meme_barrel:          { src:'assets/anim/meme_barrel.png',          frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  meme_molly:           { src:'assets/anim/meme_molly.png',           frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  meme_tipc:            { src:'assets/anim/meme_tipc.png',            frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  meme_slogan:          { src:'assets/anim/meme_slogan.png',          frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  meme_karlstory:       { src:'assets/anim/meme_karlstory.png',       frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  meme_leaflover:       { src:'assets/anim/meme_leaflover.png',       frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  meme_goldbug:         { src:'assets/anim/meme_goldbug.png',         frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  fest_oktoberfest:     { src:'assets/anim/fest_oktoberfest.png',     frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  swarm_alert_icon:     { src:'assets/anim/swarm_alert_icon.png',     frameW:72,  frameH:72, frames:4, fps:4, loop:true, anchor:'center' },

  /* 节日战役横幅全集（C §9 ×8，288×96×6帧；按编年史档期取用，fest_roguecore=无尽常驻） */
  fest_lunar:           { src:'assets/anim/fest_lunar.png',           frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  fest_anniv:           { src:'assets/anim/fest_anniv.png',           frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  fest_egg:             { src:'assets/anim/fest_egg.png',             frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  fest_beach:           { src:'assets/anim/fest_beach.png',           frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  fest_hallow:          { src:'assets/anim/fest_hallow.png',          frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  fest_xmas:            { src:'assets/anim/fest_xmas.png',            frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  fest_roguecore:       { src:'assets/anim/fest_roguecore.png',       frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  evt_rich:             { src:'assets/anim/evt_rich.png',             frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  evt_leech:            { src:'assets/anim/evt_leech.png',            frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  evt_break:            { src:'assets/anim/evt_break.png',            frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },
  evt_elite:            { src:'assets/anim/evt_elite.png',            frameW:288, frameH:96, frames:6, fps:6, loop:true, anchor:'top-left' },

  /* 社区彩蛋事件头图（B 设计 × C 绘制：lcyf166 到访=静态单帧；黑脸小猫=6 帧循环） */
  lcyf166_avatar:       { src:'assets/anim/lcyf166_avatar.png',       frameW:96,  frameH:96, frames:1, fps:1, loop:false, anchor:'center' },
  cat_face:             { src:'assets/anim/cat_face.png',             frameW:96,  frameH:96, frames:6, fps:4, loop:true,  anchor:'center' },
  drink_draw:           { src:'assets/anim/drink_draw.png',           frameW:96,  frameH:132, frames:8, fps:8, loop:true, anchor:'center' }
};



/* ---------------- 界面文案 ---------------- */
/* 管理模式所需的界面、事件、深潜与精英支援文案集中维护于此。 */

const TEXT = {

  /* ================= 1. ui_* 界面文案（56 条） ================= */

  // —— 主界面抬头 ——
  ui_main_title: "17号太空钻台", // 官方原文直用（SPACE RIG 17）
  ui_main_sub: "深岩银河集团 /// 管理层终端 // 权限等级：柠檬", // 官方原文仿写（权限等级：柠檬为官方梗）
  ui_main_welcome: "挖到手软，赚到盆满！今天也要安全地把矿骡装满。", // 官方口号直用+仿写续写
  ui_ticker_default: "上头命令：停止跳舞，回去工作！", // 官方原文直用

  // —— 任务终端（任务板）——
  ui_mission_title: "任务终端", // 官方原文直用
  ui_mission_sub: "报价即成交，恕不议价——这可不是礼品店。", // 官方原文改写（交易终端语料）
  ui_mission_btn_refresh: "刷新列表", // 仿写
  ui_mission_hazard: "危险等级", // 仿写
  ui_mission_empty: "任务板暂无订单。任务指挥表示：虫子也要按流程上班，请稍候再刷。", // 仿写自任务指挥腔

  // —— 派遣确认 ——
  ui_deploy_title: "派遣确认", // 仿写
  ui_deploy_sub: "请在本次点击中，展现出配得上这份薪水的判断力。", // 仿写自任务指挥腔
  ui_deploy_btn: "派遣", // 仿写
  ui_deploy_btn_cancel: "再想想", // 仿写

  // —— 招募 ——
  ui_recruit_title: "招募矿工", // 仿写
  ui_recruit_sub: "注意！新矿工正在空降接近！", // 官方原文直用
  ui_recruit_btn: "招募", // 仿写

  // —— 召回 ——
  ui_recall_title: "召回小队", // 仿写
  ui_recall_btn: "召回", // 仿写
  ui_recall_confirm: "确认召回？已完成部分按比例折算。集团尊重你的决定，并已同步计算好它的损失。", // 仿写自PSA体

  // —— 结算弹窗 ——
  ui_settle_title: "结算报告", // 仿写
  ui_settle_sub: "干得好，队员们！管理层对你们的表现十分满意！", // 官方原文直用
  ui_settle_sub_fail: "任务指挥提醒：管理层就在我背后盯着呢……下次，把矿带回来。", // 官方原文直用+仿写续写
  ui_settle_btn: "签收", // 仿写

  // —— 名册（员工终端）——
  ui_roster_title: "员工终端", // 官方原文直用
  ui_roster_sub: "矿工！最卑微的也是最崇高的！——以及人力资源报表上最贵的一栏。", // 官方原文直用+仿写续写

  // —— 士气栏 ——
  ui_morale_label: "士气", // 仿写
  ui_morale_low: "士气低迷：产出打折，并已开始拒绝义务加班。集团建议：请客。", // 仿写自PSA体
  ui_morale_high: "士气高涨：员工满意度报告连续三年公开，本季度数据同样喜人。", // 官方原文改写

  // —— 深渊酒吧 ——
  ui_bar_title: "深渊酒吧", // 官方原文直用
  ui_bar_sub: "劳埃德当值。营业至全员尽兴为止，醉酒下矿除外。", // 官方名词直用+PSA体仿写
  ui_bar_btn_treat: "请一轮", // 仿写
  ui_bar_btn_close: "打烊", // 仿写

  // —— 医疗站 ——
  ui_med_title: "医疗站", // 官方原文直用
  ui_med_sub: "先抢救，后收费；收费标准不接受抢救。", // 仿写自PSA体
  ui_med_btn: "办理出院", // 仿写

  // —— 装备终端 ——
  ui_gear_title: "装备终端", // 官方原文直用
  ui_gear_sub: "集团资源不应当肆意挥霍——请挥霍得更有性价比。", // 官方原文改写（PSA语料）
  ui_gear_btn: "升级凭证", // 仿写

  // —— 钻井平台（升级）——
  ui_rig_title: "钻井平台升级", // 仿写
  ui_rig_sub: "每向下一层，集团的财报就好看一分，你也算出了一分力。", // 仿写自PSA体
  ui_rig_btn: "升级", // 仿写

  // —— 精英支援位 ——
  ui_elite_title: "精英支援位", // 仿写
  ui_elite_sub: "复拓者：冲锋陷阵，杀出重围。", // 官方原文直用
  ui_elite_btn: "上阵", // 仿写
  ui_elite_locked: "未解锁：需功绩点与战役进度双重认证。", // 仿写（功绩点为官方译名）

  // —— 关键绩效指标终端 ——
  ui_kpi_title: "关键绩效指标终端", // 官方原文直用
  ui_kpi_sub: "配额不会因为你不看它而消失。", // 仿写自PSA体

  // —— 离线回归结算（归队简报）——
  ui_offline_title: "归队简报", // 仿写
  ui_offline_sub: "欢迎归队。你不在的这段时间，钻台由矿骡代管，它管得不三不四。", // 仿写自矿骡语料
  ui_offline_btn: "归队", // 仿写

  // —— 存档提示 ——
  ui_save_ok: "进度已存入矿骡随身货舱。矿骡比你想的可靠。", // 仿写自矿骡语料
  ui_save_warn: "存档中。请勿断电，矿骡不喜欢被拔电源。", // 仿写自PSA体

  // —— 设置 ——
  ui_settings_title: "设置", // 仿写
  ui_settings_sub: "全部参数均已由管理层为你优化完毕，改动后果自负。", // 仿写自PSA体
  ui_settings_btn_reset: "重置存档", // 仿写
  ui_settings_reset_confirm: "重置将清空全部进度。确定再来一遍？矿工们刚习惯你的管理风格。", // 仿写自任务指挥腔

  /* ================= 2. med_* 医疗站文案（5 条） ================= */

  med_notice: "重伤通知书：{miner} 在作业中遭遇洞穴水蛭热情拥吻，现已转入医疗站。请管理层放心：在深岩银河，没有抢救不回来的员工，只有等不到批复的账单。", // 仿写自PSA体
  med_bill: "住院账单：{cost} 代币，按 {days} 天计费。温馨提示：红糖属集团资产，病房属有偿服务，疼痛免费自取。", // 仿写自PSA体
  med_discharge: "出院小结：诊断为全身性虫咬与轻度挤压，均不构成请假理由。医嘱：休养 {days} 天，多喝红糖，少接虫多的单。", // 仿写自PSA体
  med_psa: "医疗站广播：本站全体员工均可抢救，无一例外。这是集团的核心竞争力之一。", // 仿写自PSA体（全员可抢救设定）
  med_pain: "病房留言板：虫子疼一下，账单疼到发薪日。医疗账单比虫子更疼——以上留言获全体病友一致好评。", // 自嘲式调侃（用户钦定梗）

  /* ================= 3. ev_* 事件通讯文案（34 条） ================= */
  /* 钉死骨架 24 条（与数值表一一对应）+ 辅助键 10 条（title/desc，可选） */

  // —— 3.1 虫潮 ev_swarm（A 硬刚 / B 固守矿骡）——
  ev_swarm_title: "虫潮来袭！", // 官方原文直用
  ev_swarm_desc: "发现虫潮！干掉它们，矿工们！——任务指挥原话。管理层补充：无论怎么选，弹药费照单全收。", // 官方原文直用+仿写续写
  ev_swarm_a_btn: "正面硬刚", // 仿写
  ev_swarm_a_win: "让它们尝尝矮人的厉害！{miner} 一马当先，虫潮清空，全部产出完好入库，管理层十分满意。", // 官方原文直用开头
  ev_swarm_a_fail: "硬刚失利，有人被禁卫异虫拍进了岩壁。全员转运医疗站——人一个不少，账单也一个不少。", // 仿写自官方警报语料（全员可抢救）
  ev_swarm_b_btn: "固守矿骡", // 仿写
  ev_swarm_b_result: "全队收缩至矿骡防线：装填、蹲下、默念口号。产出按合同保底折算，矿骡装甲的划痕计入本季度折旧。", // 仿写自任务指挥腔

  // —— 3.2 富矿脉 ev_richvein（A 延时开采 / B 放弃矿脉）——
  ev_richvein_title: "检测到富矿脉！", // 仿写自官方警报腔
  ev_richvein_desc: "矿脉储量远超申报单。任务指挥：好好好，知道你发财了——快点干活吧，管理层就在我背后盯着呢！", // 官方原文直用
  ev_richvein_a_btn: "延时开采", // 仿写
  ev_richvein_a_win: "延时开采大获成功，产出远超申报量。你们的加班已被记作“自愿”，奖金却是真金白银。", // 仿写自任务指挥腔
  ev_richvein_a_fail: "追加开采惊动了洞顶，局部塌方，设备与骨头一起受了伤。伤员已转医疗站，矿照装，班照加。", // 仿写自PSA体
  ev_richvein_b_btn: "放弃矿脉", // 仿写
  ev_richvein_b_result: "按单收工，稳字当头。管理层表示理解，并已把这条矿脉写进了别人的排班表。", // 仿写自任务指挥腔

  // —— 3.3 洞穴水蛭 ev_leech（A 立即救援 / B 暂缓处置=重伤入院）——
  ev_leech_title: "头顶有洞穴水蛭！！", // 官方原文直用
  ev_leech_desc: "{miner} 被洞穴水蛭缠住，正被拖向洞顶。知识点：洞穴水蛭不怕你的原因是你更怕它们。请当机立断。", // 官方原文直用
  ev_leech_a_btn: "立即救援", // 仿写
  ev_leech_a_win: "救援成功！{miner} 平安落地，只损失了半截胡子和一点自尊。绳索与火药损耗计入耗材。", // 仿写自任务指挥腔
  ev_leech_a_fail: "救援慢了半拍。{miner} 落地时膝盖先行着地，已转运医疗站。放心，人肯定还你，账单先到。", // 仿写自PSA体
  ev_leech_b_btn: "暂缓处置", // 仿写
  ev_leech_b_result: "已按流程登记、排期处理。在等待排期期间，{miner} 被水蛭全程招待，现重伤入住医疗站——全员可抢救，账单不可豁免。", // 仿写自PSA体

  // —— 3.4 设备故障 ev_breakdown（A 紧急维修 / B 带故障作业，均单一结果）——
  ev_breakdown_title: "注意！设备故障！", // 仿写自官方警报腔
  ev_breakdown_desc: "钻头过热，矿骡闹情绪。官方维修手册第一页写道：如果空降舱无法启动——就正对钻头来上一好脚。", // 官方原文直用
  ev_breakdown_a_btn: "紧急维修", // 仿写
  ev_breakdown_a_result: "紧急维修完成，零件费与误工时已计入本次任务成本。维修工留言：能修的叫故障，修不起的叫预算。", // 仿写自PSA体
  ev_breakdown_b_btn: "带故障作业", // 仿写
  ev_breakdown_b_result: "设备在呻吟中坚持生产，产出打折，噪音超标，折旧提前兑现。管理层将此操作记录为“乐观运维”。", // 仿写自PSA体

  // —— 3.5 精英虫 ev_elite（A 猎杀 / B 绕行规避）——
  ev_elite_title: "小心！精英虫过来了！", // 仿写自官方警报腔
  ev_elite_desc: "检测到高价值大型目标：击杀奖励丰厚，挨打概率同样丰厚。管理层不做决定，只做期待。", // 仿写自任务指挥腔
  ev_elite_a_btn: "猎杀", // 仿写
  ev_elite_a_win: "猎杀成功！我们发财了！大额黄金落袋，矿骡的超载警报响了一路，整个回程都在演奏。", // 官方原文直用（"我们发财了"）
  ev_elite_a_fail: "猎杀失败，队伍被打散后重整。伤员已转医疗站，剩余产出照常带回。建议下次换个职业再会会它。", // 仿写自任务指挥腔
  ev_elite_b_btn: "绕行规避", // 仿写
  ev_elite_b_result: "全队静默绕行，无人受伤，也无人立功，产出略减。管理层点评：谨慎也是绩效，只是不发奖金。", // 仿写自任务指挥腔

  /* ================= 4. kpi_* KPI 季度配额公告（9 条） ================= */

  // —— 下达（季初抽 1 条）——
  kpi_issue_1: "全体矿工请注意：本季度墨菱石配额已下达——{quota}。达成可获奖金 {reward}。任务顺序你们都熟：采集墨菱石，装进矿骡，一起回来。小事一桩，赶快动身吧。", // 官方原文直用（开头+结尾）
  kpi_issue_2: "公共服务通告：本季度配额 {quota}，奖金 {reward}。这不是请求，这是排班表。", // 仿写自PSA体
  kpi_issue_3: "深岩银河集团：齐心协力，共铸未来。具体而言：先共铸 {quota} 单位墨菱石，再谈未来。", // 官方标语直用+仿写续写

  // —— 达成（季末抽 1 条）——
  kpi_success_1: "季度配额达成！管理层刚刚批准了你们的绩效奖励 {reward}——原计划是双倍，财务部投了反对票。", // 官方原文改写（双倍绩效奖励语料）
  kpi_success_2: "配额 {quota} 达成，奖金 {reward} 已入账。你为深岩银河集团的财富做出了贡献，管理层向你致敬。", // 官方原文直用（结尾句）
  kpi_success_3: "达成通知：本季度目标圆满完成，全体员工获 {reward} 奖金，外加一句迟到但真诚的“干得好”。", // 仿写自任务指挥腔

  // —— 失败（季末抽 1 条）——
  kpi_fail_1: "季度配额未达成。管理层深表遗憾，并通知：下一季度配额不会因此减少——只会更多。", // 仿写自任务指挥腔
  kpi_fail_2: "公共服务通告：本季度指标缺口已记入台账。深岩银河集团不是做慈善的，但集团也绝不放弃任何一名员工——医疗站与下一次配额都在等你。", // 官方原文仿写（晋升条款语料）
  kpi_fail_3: "任务指挥提醒：管理层就在我背后盯着呢。本季度 {quota} 未完成，绩效评分已扣。建议流程：喝酒，复盘，下季挖回来。", // 官方原文直用+仿写续写

  /* ================= 5. karl_* "卡尔"隐藏彩蛋（2 条） ================= */
  /* 触发建议：深渊酒吧深夜时段 / 员工终端随机翻档，低概率，纯氛围，无奖励 */

  karl_bar_toast: "深夜的深渊酒吧，不知谁对着空气举了杯：“敬卡尔。”劳埃德默默多倒了一杯，没有人问为什么。", // 仿写自社区梗（传说矮人卡尔）
  karl_record: "人事档案最底层压着一页旧纸：卡尔，传奇矿工，无编号，无照片，无考勤记录。管理层批注：查无此人，继续挖矿。", // 仿写自社区梗

  /* ================= 6. egg_* 彩蛋文案（15 条） ================= */

  // —— 加载提示 ——
  egg_load_1: "流程你们应该都熟悉了：采集墨菱石，把它们装进矿骡，然后一起回来。小事一桩，赶快动身吧。", // 官方原文直用
  egg_load_2: "加载中。矿骡正在横穿洞穴，请勿催促，它不吃这套。", // 仿写自矿骡语料
  egg_load_3: "小贴士：红糖能续命，但续不了工期。", // 仿写自PSA体
  egg_load_4: "防范洞穴水蛭，请牢记“三个总是”：总是抬头观察，总是照亮前路，总是立即清除。", // 官方原文直用（删节版）

  // —— 免责 / 辟谣公告 ——
  egg_insurance_1: "免责声明：本钻台保险不覆盖岩壁挤压、虫咬、坠落，以及“被矿骡挡路导致的情绪损失”。", // 仿写自PSA体
  egg_insurance_2: "公共服务通告：任何有关发射井内有隐藏房间的流言，都是没有依据的。请停止寻找。", // 官方原文直用+仿写续写

  // —— 日常 PSA ——
  egg_psa_1: "公共服务通告：管理层再度强调，醉酒下矿违反集团规定！——祝今晚饮用愉快。", // 官方原文直用+仿写续写
  egg_psa_2: "公共服务通告：个人卫生很重要。请每隔 30 天至少洗一次澡。这是硬性指标。", // 官方原文直用+仿写续写

  // —— 钻井平台升级通告 ——
  egg_rig_1: "钻井平台升级完成。深岩银河集团：齐心协力，共铸未来。", // 官方原文直用
  egg_rig_2: "钻井平台已抵达新地层。管理层向你致敬，并向该地质层致以诚挚歉意。", // 官方原文改写（"管理层向你致敬"）

  // —— 酒吧面板 ——
  egg_bar_1: "深渊酒吧今日主推：黑墨菱酒——让矮人欲罢不能！", // 官方原文直用
  egg_bar_2: "（小声）我能来杯叶子情人特调吗？——该员工已被登记参加下周的“企业文化再教育”。", // 官方原文直用+仿写续写

  // —— 其他 ——
  egg_slogan: "只要你喊口号，四海皆是兄弟。挖到手软，赚到盆满！", // 官方原文直用
  egg_molly: "矿工心声：平时莫莉烦得我脑壳疼。现在她不在了——我还真挺想她！集团提醒：莫莉属集团资产，请勿投入过多感情。", // 官方原文直用+仿写续写
  egg_career: "匿名意见箱：你们是不是也觉得，咱这工作纯属找罪受？——该意见已转交心理测评部门，谢谢来信。", // 官方原文直用+仿写续写

  /* ================= 7. ev_*(梗) 社区梗事件扩展包（v1.1，10 事件 × 6 键） ================= */
  /* 社区梗素材已核实出处；全部为确定性二选一事件。 */

  // —— 7.1 蘑菇打卡潮（梗：蘑菇 MUSHROOM!，官方彩蛋语音）——
  ev_mushroom_title: "检测到巨型荧光蘑菇！", // 仿写自官方警报腔
  ev_mushroom_desc: "激光笔的光柱在洞穴里交汇成人造极光。任务指挥沉默片刻，问：“这影响工期吗？”——影响，但方式很快乐。", // 仿写自任务指挥腔
  ev_mushroom_a_btn: "全员围观", // 仿写
  ev_mushroom_a_result: "全体矿工围着蘑菇齐喊“蘑菇！”，声浪掀翻了三顶安全帽。工期顺延，士气暴涨。财务部备注：快乐也是产量，可惜不入账。", // 仿写自社区梗
  ev_mushroom_b_btn: "设为景点", // 仿写
  ev_mushroom_b_result: "公告：即日起该蘑菇列为“17号钻台自然奇观”，参观需预约，拍照收费。信用点到账，士气微降——矿工们只是没抢到首日门票。", // 仿写自社区梗

  // —— 7.2 发财仪式（梗：We're Rich! 官方语音连喊文化）——
  ev_wererich_title: "发现压缩黄金！", // 仿写自官方警报腔
  ev_wererich_desc: "全体矿工已在黄金前列队，激光笔蓄势待发。财务部提醒：对同一块黄金喊“我们发财了”，并不能改变它的账面价值。", // 官方语音直用+仿写
  ev_wererich_a_btn: "默许仪式", // 仿写
  ev_wererich_a_result: "呼喊持续了十分钟，声调越来越激动，最后由任务指挥亲自收尾：“好了好了，够了。”全员干劲十足，士气大涨。", // 官方语音直用（Alright, that's enough 官方自嘲）
  ev_wererich_b_btn: "工时优先", // 仿写
  ev_wererich_b_result: "广播：“你们现在是富有，还是我扣了奖金之后富有？继续干活。”黄金足额上缴，士气下滑。矿工们把下一块黄金的位置瞒报了。", // 仿写自任务指挥腔

  // —— 7.3 监桶人突击检查（梗：踢酒桶成就“你就是任务控制官酗酒的原因”）——
  ev_barrel_title: "发射井发现异物！", // 仿写自官方成就语
  ev_barrel_desc: "三个空酒桶正被悄悄踢向即将起飞的空投舱。任务控制官的语气前所未有地疲惫：“酒桶是用来配合采矿的，不是给你这么玩的。”", // 官方成就原文仿写
  ev_barrel_a_btn: "睁只眼闭只眼", // 仿写
  ev_barrel_a_result: "空投舱起飞时传来滚筒般的回响。任务控制官沉默了整整十秒，然后说：“货舱清单我就不改了。”士气大涨。", // 仿写自任务指挥腔
  ev_barrel_b_btn: "配合执法", // 仿写
  ev_barrel_b_result: "缴获清单：空酒桶 ×25。任务控制官罕见地表达了感谢，并请全体不要问他办公室里为什么也放着一个。士气小降，秩序小升。", // 仿写自官方成就语

  // —— 7.4 小费机预算案（梗：劳埃德/TIP-C 打赏机，5 信用点毫无收益）——
  ev_tipc_title: "TIP-C 小费机预算申请", // 仿写自PSA体
  ev_tipc_desc: "深渊酒吧的打赏机 TIP-C 提交预算申请：每期 5 信用点，可触发一句对劳埃德的感谢。备注：毫无实际收益。会计部已看晕。", // 仿写自官方设定
  ev_tipc_a_btn: "批准基金", // 仿写
  ev_tipc_a_result: "会计部质问这 5 信用点的报销用途。你批复：“员工关系。”士气上升，劳埃德的显示屏罕见地闪了一下，像是在笑。", // 仿写自PSA体
  ev_tipc_b_btn: "当场驳回", // 仿写
  ev_tipc_b_result: "申请被驳回。劳埃德的显示屏打出两个字：“理解。”你总觉得那是嘲讽。本周酒吧服务态度冷淡，士气小降。", // 仿写自官方设定

  // —— 7.5 叛徒的酒杯（梗：叶子情人特调，官方设定“为讨好管理层而加”）——
  ev_leaflover_title: "解酒剂采购提案", // 仿写自PSA体
  ev_leaflover_desc: "后勤部提议采购一批叶子情人特调——唯一的速效解酒剂。设定补充：据说是为了讨好管理层才加的。工会已提前写好抗议信。", // 官方设定直用+仿写
  ev_leaflover_a_btn: "照单采购", // 仿写
  ev_leaflover_a_result: "采购单备注：绿得很健康。工会回函：绿得很叛徒。宿醉出勤率大涨，士气下滑，抗议信按惯例归档进“员工热情”卷宗。", // 仿写自社区梗
  ev_leaflover_b_btn: "拒绝进货", // 仿写
  ev_leaflover_b_result: "你把样品倒进了花盆。花盆第二天长出了公会旗。士气大涨，次日全员迟到两小时，理由栏整齐写着“宿醉，但清白”。", // 仿写自社区梗

  // —— 7.6 朵蕾妲的头（梗：护送掘进机朵蕾妲，搬头回舱的官方仪式感）——
  ev_doretta_title: "执勤护送：朵蕾妲报废", // 仿写自官方警报腔
  ev_doretta_desc: "掘进机朵蕾妲在钻取心石时殉爆，头颅完整脱落。没有任何规章要求把它搬回空投舱。也没有任何规章能阻止他们。", // 仿写自官方设定
  ev_doretta_a_btn: "停工搬头", // 仿写
  ev_doretta_a_result: "全队抬着朵蕾妲的头走了四公里。工期顺延，士气暴涨，纪念品“朵蕾妲的头”已入列钻台收藏。管理层批注：账面亏损，士气盈利。", // 仿写自社区梗
  ev_doretta_b_btn: "心石优先", // 仿写
  ev_doretta_b_result: "准时交付，财务部表扬了本季度护送效率。酒吧角落从此多了一台没人认领的钻头，天天有人去擦。士气下降。", // 仿写自社区梗

  // —— 7.7 卡尔故事会（梗：卡尔，全游戏唯一有名字的矮人）——
  ev_karlstory_title: "深夜酒会申请：卡尔专场", // 仿写自社区梗
  ev_karlstory_desc: "老矿工们申请通宵讲卡尔传奇。注意：第 41 个版本里，他徒手拆了一台无畏虫。没人纠正讲述者，因为没人敢。", // 仿写自社区梗
  ev_karlstory_a_btn: "批准通宵", // 仿写
  ev_karlstory_a_result: "故事会通宵进行，士气暴涨。次日全员迟到，考勤理由栏写着同一句话：“为了卡尔。”法务部提示：该理由无法驳斥。", // 仿写自社区梗（For Karl! 官方语音）
  ev_karlstory_b_btn: "改成教材", // 仿写
  ev_karlstory_b_result: "卡尔故事改编为新人安全教材，第 3 页标题：“卡尔就是不看安全手册的下场。”培训效率上升，老矿工暴怒，当晚酒吧没人跟你碰杯。", // 仿写自社区梗

  // —— 7.8 口号响应条例（梗：Rock and Stone 回应义务，不回喊=异端）——
  ev_slogan_title: "员工守则修订案：口号条", // 仿写自PSA体
  ev_slogan_desc: "提案背景：矿道里出现“喊口号无人回应”事件 ×17，士气数据骤降。修订案两条路线，请管理层拍板。", // 仿写自PSA体
  ev_slogan_a_btn: "强制回应", // 仿写
  ev_slogan_a_result: "守则第 7 条修订：任何员工听到口号必须在 1.5 秒内回应，违者视为异端（法务部要求注明：非法律意义上的）。士气上升，作业节奏变慢。", // 仿写自社区梗
  ev_slogan_b_btn: "静默试点", // 仿写
  ev_slogan_b_result: "静默作业试点当班，矿道里只剩镐声，和某种更深重的悲伤。效率上升，士气大降，收到 17 份联名投诉——按条编号，无一重复。", // 仿写自社区梗

  // —— 7.9 莫莉迷航（梗：矿骡莫莉，官方 PSA“矿骡非宠物”被联名驳回）——
  ev_molly_title: "矿骡“莫莉”失联", // 官方名词直用
  ev_molly_desc: "莫莉选择了“最短路径”，路径下方是三条虫道。它头顶的指示灯看起来毫无悔意。官方手册提示：矿骡既没有知觉，也不是宠物。", // 官方 PSA 直用+仿写
  ev_molly_a_btn: "等它绕路", // 仿写
  ev_molly_a_result: "莫莉用时两小时穿越虫道归队，矿物完好率 100%，全队心态完好率 60%。工期顺延，士气持平——没人舍得骂它。", // 仿写自社区梗
  ev_molly_b_btn: "全员追骡", // 仿写
  ev_molly_b_result: "全队抄近路追莫莉，手动搬矿提前完工。有人崴了脚，医疗账单小额一张。莫莉在悬崖上看着你们，像看一台旧型号洗衣机。", // 仿写自社区梗

  // —— 7.10 追捕金色掠夺虫（梗：金色掠夺虫，全队弃任务追虫名场面）——
  ev_goldbug_title: "发现金色掠夺虫！", // 官方名词直用
  ev_goldbug_desc: "浑身金光，价值不菲，全队的瞳孔同时放大。任务指挥提醒：本次任务的目标不是它。全队回答：本次任务的目标就是它。", // 仿写自社区梗
  ev_goldbug_a_btn: "全员追捕", // 仿写
  ev_goldbug_a_result: "追捕持续了 11 分钟，它从头到尾跑得比季度 KPI 快。最终落网，黄金大额入账，工期顺延。它到最后一秒都很闪。", // 仿写自社区梗
  ev_goldbug_b_btn: "按律挖矿", // 仿写
  ev_goldbug_b_result: "无人行动。矿道里安静得可怕，每个人都在假装没听见那声金灿灿的“咕”。进度正常，士气微降，当班记录写满欲言又止的省略号。", // 仿写自社区梗

  // —— v1.1 结算趣味语池（egg_settle_*，结算弹窗随机抽 1 条）——
  egg_settle_1: "本次任务共标记蘑菇 47 次，实际产量不受影响，但快乐产量爆表。", // 仿写自社区梗
  egg_settle_2: "本次任务中“为了卡尔！”共出现 63 次。卡尔先生（若存在）的版权费问题，法务部仍在研究。", // 仿写自社区梗
  egg_settle_3: "本次任务总结会以一段即兴舞蹈结束。安全顾问选择不看。", // 仿写自社区梗
  egg_settle_4: "设备终端旁“修好我”的牌子已更换为第 8 块。采购部问是谁在换，没人回答。", // 仿写自社区梗（朵蕾妲）
  egg_settle_5: "本月激光笔标记 4,102 次：黄金 39%（伴随口号），蘑菇 41%（伴随更响口号），任务目标 20%（无人理会）。", // 仿写自社区梗

  /* ================= 8. anim_* 动画 alt/title 文案（v1.2，7 条，会话C 申请+B 审核） ================= */
  /* 配合 assets\anim\ 精灵图：roster 三态作名册头像 title，其余作动画容器的 alt/caption */

  anim_roster_idle: "在酒吧待命。酒钱记账上。", // 仿写
  anim_roster_mission: "在下面干活。挖到手软，赚到盆满。", // 官方口号直用
  anim_roster_med: "全员可抢救：人没事，但账单是真的。", // 仿写自PSA体
  anim_swarm_banner_alt: "虫潮警报：洞穴地面正在震动", // 仿写自官方警报腔
  anim_lloyd_alt: "劳埃德当值，生啤永不缺货", // 仿写
  anim_doretta_alt: "朵蕾妲的头——她还活着，只是有点歪", // 仿写自社区梗
  anim_karl_alt: "有人在那道暖光里站着。管理层表示：无可奉告。", // 仿写自社区梗

  /* ================= 9. ui_* v1.3 缺口键（21 条，配合 TEXT 接线映射表） ================= */
  /* 管理界面缺口文案；占位符：{done}/{quota2}/{cur}/{lv}/{mul}/{depth}/{slots}/{cap}/{hours} */

  ui_kpi_progress: "本季墨菱石：{done}/{quota2}", // 减字二期：幽默尾句移入帮助页
  ui_kpi_claimable: "奖金已到账可领！集团从不拖欠——除了工资、报销和这份。", // 仿写
  ui_rares_label: "稀有矿物", // 直替
  ui_rares_tip: "任务概率掉落，用于凭证与矿工成长。", // 直替
  ui_deps_empty: "当前没有进行中的派遣。矿工在酒吧待着，钱在集团账上待着。", // 仿写自PSA体
  ui_deps_event: "⚡ 等待管理层决策", // 仿写
  ui_deps_event_btn: "处理事件", // 仿写
  ui_roster_cap: "在册 {cur}/4 人。一个任务可派多名矿工协作：简单单单人，困难组队满编。", // 仿写自任务指挥腔
  ui_bar_locked: "🔒 酒吧 Lv.{lv} 解锁。配额之外的第一笔投资，永远是酒。", // 仿写
  ui_med_empty: "当前没有伤员。医疗站机器人 Lloyd② 在打瞌睡。", // 仿写
  ui_med_resting: "休养中，还剩 {days} 游戏分钟。账单已到，人还在路上。", // 仿写自PSA体
  ui_med_express: "加急治疗（-{days} 分钟）", // 仿写
  ui_gear_note: "武器凭证用官方矿物升级：提升战斗力与稀有矿物掉落。每职业 3 级。每把武器可装配 1 个模组（模组靠三提石任务抽卡获取）。", // 仿写自PSA体
  ui_elite_btn_hire: "调令", // 仿写
  ui_rig_effect: "当前效果：墨菱石产量 ×{mul}｜深度档解锁 {depth}/5｜并行派遣 {slots} 队｜单队人数上限 {cap}", // 仿写
  ui_save_btn_folder: "绑定本地存档文件夹", // 仿写
  ui_save_btn_write: "立即写入文件夹", // 仿写
  ui_save_btn_restore: "从文件夹恢复", // 仿写
  ui_save_btn_export: "导出存档文件", // 仿写
  ui_save_btn_import: "导入存档文件", // 仿写
  ui_offline_msg: "欢迎回来，管理层。你离开了 {hours} 小时，钻台以 10% 效率运转完毕。", // 仿写自PSA体

  /* ================= 10. v1.4 二期接线键（46 条：交易站/战役面板/条款/日志腔） ================= */
  /* 交易站、战役面板、条款与日志文案。 */

  // —— 交易站（renderMarket）——
  ui_market_note: "手续费 5% · 涨跌停 ±10%", // 直替
  ui_market_today: "今日市场：{ups} 涨 / {downs} 跌", // 直替
  ui_market_hold: "持有 {n}　净值 {v} 代币", // 直替
  ui_market_buy10: "买 10（{cost}）", // 直替
  ui_market_buy50: "买 50（{cost}）", // 直替
  ui_market_sell10: "卖 10（{gain}）", // 直替
  ui_market_sellall: "清仓", // 直替
  log_market_sell: "交易站卖出 {k}×{qty}，入账 {gain} 代币。市场有风险，集团免责。", // 官方原文直用

  // —— 战役面板（renderCampaign）——
  ui_camp_next: "📋 下一场战役【{name}】　将于游戏第 {day} 天解锁（当前第 {today} 天）。集团在憋大招。", // 直替
  ui_camp_now: "📋 战役【{name}】", // 直替
  ui_camp_prog: "{txt}（{prog}/{need}）　奖励：{reward}", // 直替
  ui_camp_empty: "📋 战役终端　战役队列已空，集团正在起草新的大单。", // 直替
  ui_camp_fold: "战役与活动（点击收起/展开）", // 直替
  ui_camp_hol_now: "🎄 节日战役【{name}】", // 直替
  ui_camp_hol_open: "派遣一次任务即可自动开启。", // 直替
  log_camp_done: "✔ 战役目标完成：{goal}", // 拼接说明：后接目标名
  log_camp_clear: "🏆 战役【{name}】通关！奖励已发放。", // 新增措辞（原为拼接，可调）
  log_camp_new: "新战役下达：【{name}】", // 直替
  log_camp_empty: "战役队列已空。集团正在起草新的大单。", // 直替

  // —— 任务板条款（renderBoard，条款内容属数据层不映射）——
  ui_board_clause_wrap: "条款【{name}】{desc}", // 直替（{name}=条款名，{desc}=条款描述）

  // —— 每日简报与关怀 ——
  log_daily: "【每日简报 D{day}】昨日：派遣 {missions} 次 · 入账 {credits} 代币 · 墨菱石 +{morkite} · 重伤 {injured} 人。市场：{market}", // 直替
  log_care: "【集团关怀计划】检测到钻台物资短缺。紧急预支 200 代币 + 40 硝石（将从下期绩效中扣除）。", // 直替

  // —— 开局/招聘 ——
  log_welcome: "欢迎上任，管理层。集团对 17 号钻台的唯一要求是：产量。", // 直替
  log_tip_first: "提示：先在任务板接一张低危险的单子，人派得越多越稳，但分钱的人也多。", // 直替
  log_recruit: "新员工入职：{name}（{cls}，绿胡子）。合同条款他没细看，我们也没细说。", // 直替
  log_manager_new: "新一届管理层入职。前一届管理层的去向属于敏感话题。", // 直替

  // —— 存档与文件夹（log 腔）——
  log_save_export: "存档已导出为文件。", // 直替
  log_save_import_ok: "存档导入成功。", // 直替
  log_save_import_ver: "导入失败：存档版本不对。", // 直替
  log_save_import_bad: "导入失败：文件损坏。", // 直替
  log_bind_unsupported: "当前浏览器不支持绑定文件夹（建议 Chrome / Edge）。", // 直替
  log_bind_ok: "存档文件夹已绑定【{path}】", // 直替
  log_bind_fail: "存档文件夹写入失败：{err}", // 直替
  log_bind_none: "尚未绑定存档文件夹。", // 直替
  log_restore_ok: "已从存档文件夹恢复进度。", // 直替
  log_restore_ver: "文件夹里的存档版本不对。", // 直替
  log_restore_fail: "读取文件夹存档失败（可能还没存过）。", // 直替

  // —— 系统与设施（log 腔）——
  log_nitra: "硝石告急，集团紧急空投了一批补给——记账上，别客气。", // 新增措辞（原拼接待核）
  log_blanks: "✦ 三提石任务完成：空白模组 +{n}", // 直替
  log_merit: "功绩点 +{n}。绩效系统今天转得格外勤快。", // 新增措辞（原为拼接，可调）
  log_rig_lv: "钻井平台升级至 Lv.{lv}。深度档与派遣队列同步扩容。", // 新增措辞（原为拼接，可调）
  log_bar_lv: "深渊酒吧扩建至 Lv.{lv}。劳埃德擦了擦杯子。", // 新增措辞（原为拼接，可调）
  log_med_lv: "医疗站升级至 Lv.{lv}。账单打折，友情不打折。", // 新增措辞（原为拼接，可调）
  log_bar_round: "管理层在深渊酒吧请了全员一轮【{drink}】。", // 直替
  log_time_speed: "时间加速切换为 ×{n}。", // 直替
  log_board_refresh: "任务板已手动刷新。集团发来了新一批任务单。", // 直替

  // —— 饰品/模组/精英（log 腔）——
  log_trinket_off: "饰品已取下，放回陈列柜。", // 直替
  log_trinket_on: "已佩戴饰品【{name}】。", // 直替
  log_mod_off: "已卸下模组（保留在仓库）。", // 直替
  log_mod_in: "模组入库：【{name}】", // 直替
  log_mod_dup: "抽到重复的【{name}】，已按集团规定免费重抽一次。", // 直替+规则对齐
  log_elite_hire: "调令生效：【{name}】加入 17 号钻台。", // 直替
  log_elite_all: "五名复拓者全部到齐。管理层点评：这不再是派遣，这是降维打击。", // 直替

  // —— 五类事件结果日志：**不新增键，复用现有 ev_* 对应键**（如 ev_swarm_a_win/ev_leech_b_result）——
  // —— 测试协议（jcmeowiscat/iriscat）的 log 属调试输出，不映射 ——

};

Object.assign(TEXT, {

// —— 界面 ——
dd_ui_title: "深潜终端", // 官方原文直用
dd_ui_sub: "每周更新一次。集团把最深的那口井标成了红色——红色代表优先，也代表预算已批准。", // 仿写自PSA体
dd_ui_btn_launch: "开始阶段", // 仿写
dd_ui_btn_retry: "重打阶段", // 仿写
dd_ui_locked: "深潜终端未解锁：需至少 1 名矿工获得晋升资历★。井很深，资历要够——这是集团少数讲究逻辑的规定。", // 仿写自任务指挥腔
dd_ui_lockdone: "本周深潜已通关，战果锁定入库，下周一 0 点自动换新。在那之前请移步任务板：普通订单的虫子并不会因为深潜就请假。", // 仿写自PSA体
dd_ui_brief_mod: "本周修正器已加载：{mods}。集团祝您好运，并已悄悄为医疗站追加了预算。", // 仿写自PSA体

// —— 阶段开闸（1/2/3 各 2 版）——
dd_stage1_start_a: "深潜阶段 1/3 开闸。本次下潜时长超出常规合同，加班费按'自愿'处理。祝下潜愉快。", // 仿写自任务指挥腔
dd_stage1_start_b: "阶段 1/3：探杆已触底。任务指挥提醒：深潜没有中途的空降舱，只有下潜、归队和账单三种结局——前两种归你，第三种归财务。", // 仿写自任务指挥腔
dd_stage2_start_a: "阶段 2/3 开闸：深度已超出图表标注范围。地质部表示地图画到这就结束了，祝你们在'这里'一切顺利。", // 仿写自任务指挥腔
dd_stage2_start_b: "阶段 2/3 已开闸。虫群的欢迎仪式规模超出预期——官方文件写的是'中等偏上'。", // 仿写自警报腔
dd_stage3_start_a: "最终阶段 3/3：本周修正器全部生效。集团对你们的信心与本次下潜的深度成正比。挖到手软，赚到盆满！", // 官方口号直用+仿写
dd_stage3_start_b: "最终阶段开闸。任务指挥原话：'把该挖的挖回来，把该活的带回来。'管理层补充：这两件事的顺序可以商量。", // 官方原文仿写

// —— 阶段通关（各 2 版）——
dd_stage1_clear_a: "阶段 1/3 完成，产出已入库。深潜报告抄送管理层，批复栏只有两个字：'继续'。", // 仿写自任务指挥腔
dd_stage1_clear_b: "阶段 1/3 达成，空白模组已随产出下发。距离真正的深渊还差两段——字面意义上的。", // 仿写自任务指挥腔
dd_stage2_clear_a: "阶段 2/3 完成。产出刷新了本钻台单周纪录，旧纪录保持者已申请重新核算。", // 仿写自任务指挥腔
dd_stage2_clear_b: "阶段 2/3 达成。最后一层的虫已经听见钻头声了。它们不喜欢这个声音，我们喜欢。", // 仿写自警报腔
dd_stage3_clear_a: "第三段完成！深潜全通，产出全额入库。全体参潜矿工记入光荣榜，病历归档速度同创新高。", // 仿写自PSA体
dd_stage3_clear_b: "第三段达成。本周深潜正式完结：三段全清，账单照付，模组照发——集团的 fairness 大体如此。", // 仿写自PSA体

// —— 通关大奖励 / 失败 / 跨周作废（各 2 版）——
dd_clear_a: "深潜通关！大额奖励已入账，集团贺信附言：'深挖的回报，值得装进每一个模组。'空白模组已到货，请移步锻造台。", // 仿写自官方语料
dd_clear_b: "本周深潜通关！医疗站预订的下周床位已全部取消——这是管理层能想到的最高表扬。挖到手软，赚到盆满！", // 官方口号直用+仿写
dd_fail_a: "阶段中止，小队全员撤回（伤员走医疗通道，账单已生成）。已完成阶段的奖励照发——集团不承认失败，只承认'阶段性重打'。", // 仿写自PSA体
dd_fail_b: "本阶段中止。人员全部回收，无一例外——这是集团的核心竞争力。重打不扣奖金，只扣面子。", // 仿写自PSA体
dd_expire_a: "上周深潜档案已封存：未通关进度按集团规定作废。别难过，本周的更深、更长、更值得。", // 仿写自任务指挥腔
dd_expire_b: "深潜周期已重置：跨周进度不予保留——这是深潜的规矩，也是财报的规矩。新一周修正器已加载。", // 仿写自PSA体

// —— 彩蛋 ——
dd_egg_1: "深潜小贴士：深潜的'深'指的是深度，不是薪水。薪水的'深'在财报的另一页。", // 自嘲式
dd_egg_2: "公共服务通告：深潜期间请注意头顶。注意不到的时候，请相信队友会注意——这就是团队的含义。", // 官方"留意头顶"梗仿写
dd_egg_3: "深潜简报结尾固定栏目：我们发财了。——官方规定重复三遍即视为动员成功。", // 官方原话直用+仿写
dd_elite_locked: "精英深潜未解锁：需任一矿工资历★达到 3。普通的井你已挖穿，更深处的那一口，集团只留给戴三颗星的矮人。", // 仿写自任务指挥腔
dd_elite_clear: "精英深潜通关！本周最深的井已被三颗星填平。大额奖励与空白模组已入账——请把安全帽也放进光荣榜。", // 仿写自PSA体
dd_squad_full: "深潜小队需四职业满编——四人四镐，一个都不能少。缺的那位？医疗站正在办理出院。", // 仿写自任务指挥腔（强制满编提示）
dd_mod_banner: "本周修正器：", // 仿写（前缀键，与 {mods} 拼接）

});

Object.assign(TEXT, {

el_ui_title: "精英支援位", // 官方原文直用
el_ui_sub: "复拓者：冲锋陷阵，杀出重围。雇他们比雇你贵，值不值你自己算。", // 官方原文直用+仿写
el_ui_btn_hire: "调令", // 仿写
el_ui_btn_carry: "随队", // 仿写
el_ui_locked: "精英支援位未解锁：需钻井平台 Lv10。复拓者只认毕业钻台的调令——先把四职业练满再说。", // 仿写
el_ui_need_merit: "功绩点不足。深潜、KPI 与危 5 任务都在给功绩点充值——集团从不做慈善，但做积分。", // 仿写自官方功绩点语料
el_carry_msg: "{elite} 已随队下潜。人力报表多了一行，虫子的灭绝速度也多了一档。", // 仿写自任务指挥腔
el_guardian: "守护者在场：医疗账单全面打折。第一次受伤不心疼——第二次就习惯了。", // 仿写
el_rewind_used: "回溯者发动锚点：本次失败已从时间线上划除。剩余回溯次数：{left}。", // 仿写自RC回溯语料
el_all_owned: "五名复拓者全部到齐。管理层点评：这不再是派遣，这是降维打击。", // 仿写自复拓者口号
el_relic_use: "本次任务附加匠器：{relic}。复拓者的私藏，用一次少一次——省着点。", // 仿写
el_rescue_msg: "团灭警报解除：{elite} 把所有人从棺材价账单里捞了出来。产出保住一半，账单砍掉一半——这就是精英的价值。", // 仿写自任务指挥腔

});

Object.assign(TEXT, {

  /* ================= 12. ch_* 编年史（8 条，B-7 产出） ================= */
  ch_ui_title: "编年史", // 直替
  ch_ui_sub: "第 {day} 天 · {date}", // 减字二期：口号移帮助页
  ch_node_season: "【编年史】{name} 上线。当季武器与战役已同步集团数据库。", // 仿写
  ch_node_anniv: "【编年史】深岩银河 {years} 周年。周年庆战役开放——奖杯按年份编号，集齐是一种执念。", // 仿写
  ch_jump_brief: "季度简报：本季度波澜不惊，集团很满意。时间快进 {days} 天，工资照发。", // 仿写自PSA体
  ch_finale_open: "编年史最后一页：清账行动开始。六年的账，一次算清。", // 仿写
  ch_finale_endless: "编年史·完。从今天起没有剧本了，管理层——挖到天荒地老。挖到手软，赚到盆满！", // 官方口号直用+仿写
  ch_lock_hint: "编年史按现实发售日期推进：先来的先挖，后来的还在集团数据库里排队。" // 仿写

});

Object.assign(TEXT, {

  /* ================= 13. tr_* 饰品终端（12 条，B-5 产出） ================= */
  tr_ui_title: "饰品终端", // 官方栏位词直用（面部饰品）
  tr_ui_sub: "面部饰品栏：集团唯一允许员工把财产挂在脸上的地方。", // 仿写自官方栏位词+PSA体
  tr_ui_btn_equip: "佩戴", // 仿写
  tr_ui_btn_unequip: "取下", // 仿写
  tr_slot_full: "该矿工已佩戴饰品。装新拆旧——集团尊重你的选择，也记下了你的犹豫。", // 仿写自PSA体
  tr_drop_relic: "深潜末关回报：{name}！已存入饰品终端——官方规定此刻应有三秒钟的安静。", // 仿写自官方深潜语料
  tr_drop_festival: "节日战役结算：{name} 已入库。限量款，过期不候——这是集团少有的温柔。", // 仿写自PSA体
  tr_box_open: "饰品箱开启！内含一件随机时装物品——绩效奖励系统，感谢你的高绩效。", // 官方原文直用+仿写
  tr_linktree_buy: "数据节点已兑换。饰品链路图进度推进——购物流，也是进度流。", // 官方原文仿写
  tr_equip_msg: "{miner} 佩戴了 {name}。绩效报表上这是一行数据，在酒吧里这是一个故事。", // 仿写自任务指挥腔
  tr_season_banner: "当期节日战役：{festival}——限定饰品，错过再等一年（或等集团回溯，别指望）。", // 仿写自赛季语料
  tr_lock_hint: "饰品从深潜末关、节日战役与饰品箱掉落。好东西不进商店——这是集团数一数二的浪漫。" // 仿写自PSA体

});

Object.assign(TEXT, {

// —— 界面 ——
dd_ui_title: "深潜终端", // 官方原文直用
dd_ui_sub: "每周更新一次。集团把最深的那口井标成了红色——红色代表优先，也代表预算已批准。", // 仿写自PSA体
dd_ui_btn_launch: "开始阶段", // 仿写
dd_ui_btn_retry: "重打阶段", // 仿写
dd_ui_locked: "深潜终端未解锁：需至少 1 名矿工获得晋升资历★。井很深，资历要够——这是集团少数讲究逻辑的规定。", // 仿写自任务指挥腔
dd_ui_lockdone: "本周深潜已通关，战果锁定入库，下周一 0 点自动换新。在那之前请移步任务板：普通订单的虫子并不会因为深潜就请假。", // 仿写自PSA体
dd_ui_brief_mod: "本周修正器已加载：{mods}。集团祝您好运，并已悄悄为医疗站追加了预算。", // 仿写自PSA体

// —— 阶段开闸（1/2/3 各 2 版）——
dd_stage1_start_a: "深潜阶段 1/3 开闸。本次下潜时长超出常规合同，加班费按'自愿'处理。祝下潜愉快。", // 仿写自任务指挥腔
dd_stage1_start_b: "阶段 1/3：探杆已触底。任务指挥提醒：深潜没有中途的空降舱，只有下潜、归队和账单三种结局——前两种归你，第三种归财务。", // 仿写自任务指挥腔
dd_stage2_start_a: "阶段 2/3 开闸：深度已超出图表标注范围。地质部表示地图画到这就结束了，祝你们在'这里'一切顺利。", // 仿写自任务指挥腔
dd_stage2_start_b: "阶段 2/3 已开闸。虫群的欢迎仪式规模超出预期——官方文件写的是'中等偏上'。", // 仿写自警报腔
dd_stage3_start_a: "最终阶段 3/3：本周修正器全部生效。集团对你们的信心与本次下潜的深度成正比。挖到手软，赚到盆满！", // 官方口号直用+仿写
dd_stage3_start_b: "最终阶段开闸。任务指挥原话：'把该挖的挖回来，把该活的带回来。'管理层补充：这两件事的顺序可以商量。", // 官方原文仿写

// —— 阶段通关（各 2 版）——
dd_stage1_clear_a: "阶段 1/3 完成，产出已入库。深潜报告抄送管理层，批复栏只有两个字：'继续'。", // 仿写自任务指挥腔
dd_stage1_clear_b: "阶段 1/3 达成，空白模组已随产出下发。距离真正的深渊还差两段——字面意义上的。", // 仿写自任务指挥腔
dd_stage2_clear_a: "阶段 2/3 完成。产出刷新了本钻台单周纪录，旧纪录保持者已申请重新核算。", // 仿写自任务指挥腔
dd_stage2_clear_b: "阶段 2/3 达成。最后一层的虫已经听见钻头声了。它们不喜欢这个声音，我们喜欢。", // 仿写自警报腔
dd_stage3_clear_a: "第三段完成！深潜全通，产出全额入库。全体参潜矿工记入光荣榜，病历归档速度同创新高。", // 仿写自PSA体
dd_stage3_clear_b: "第三段达成。本周深潜正式完结：三段全清，账单照付，模组照发——集团的 fairness 大体如此。", // 仿写自PSA体

// —— 通关大奖励 / 失败 / 跨周作废（各 2 版）——
dd_clear_a: "深潜通关！大额奖励已入账，集团贺信附言：'深挖的回报，值得装进每一个模组。'空白模组已到货，请移步锻造台。", // 仿写自官方语料
dd_clear_b: "本周深潜通关！医疗站预订的下周床位已全部取消——这是管理层能想到的最高表扬。挖到手软，赚到盆满！", // 官方口号直用+仿写
dd_fail_a: "阶段中止，小队全员撤回（伤员走医疗通道，账单已生成）。已完成阶段的奖励照发——集团不承认失败，只承认'阶段性重打'。", // 仿写自PSA体
dd_fail_b: "本阶段中止。人员全部回收，无一例外——这是集团的核心竞争力。重打不扣奖金，只扣面子。", // 仿写自PSA体
dd_expire_a: "上周深潜档案已封存：未通关进度按集团规定作废。别难过，本周的更深、更长、更值得。", // 仿写自任务指挥腔
dd_expire_b: "深潜周期已重置：跨周进度不予保留——这是深潜的规矩，也是财报的规矩。新一周修正器已加载。", // 仿写自PSA体

// —— 彩蛋 ——
dd_egg_1: "深潜小贴士：深潜的'深'指的是深度，不是薪水。薪水的'深'在财报的另一页。", // 自嘲式
dd_egg_2: "公共服务通告：深潜期间请注意头顶。注意不到的时候，请相信队友会注意——这就是团队的含义。", // 官方"留意头顶"梗仿写
dd_egg_3: "深潜简报结尾固定栏目：我们发财了。——官方规定重复三遍即视为动员成功。", // 官方原话直用+仿写
dd_elite_locked: "精英深潜未解锁：需任一矿工资历★达到 3。普通的井你已挖穿，更深处的那一口，集团只留给戴三颗星的矮人。", // 仿写自任务指挥腔
dd_elite_clear: "精英深潜通关！本周最深的井已被三颗星填平。大额奖励与空白模组已入账——请把安全帽也放进光荣榜。", // 仿写自PSA体
dd_squad_full: "深潜小队需四职业满编——四人四镐，一个都不能少。缺的那位？医疗站正在办理出院。", // 仿写自任务指挥腔（强制满编提示）
dd_mod_banner: "本周修正器：", // 仿写（前缀键，与 {mods} 拼接）

});

Object.assign(TEXT, {

el_ui_title: "精英支援位", // 官方原文直用
el_ui_sub: "复拓者：冲锋陷阵，杀出重围。雇他们比雇你贵，值不值你自己算。", // 官方原文直用+仿写
el_ui_btn_hire: "调令", // 仿写
el_ui_btn_carry: "随队", // 仿写
el_ui_locked: "精英支援位未解锁：需钻井平台 Lv10。复拓者只认毕业钻台的调令——先把四职业练满再说。", // 仿写
el_ui_need_merit: "功绩点不足。深潜、KPI 与危 5 任务都在给功绩点充值——集团从不做慈善，但做积分。", // 仿写自官方功绩点语料
el_carry_msg: "{elite} 已随队下潜。人力报表多了一行，虫子的灭绝速度也多了一档。", // 仿写自任务指挥腔
el_guardian: "守护者在场：医疗账单全面打折。第一次受伤不心疼——第二次就习惯了。", // 仿写
el_rewind_used: "回溯者发动锚点：本次失败已从时间线上划除。剩余回溯次数：{left}。", // 仿写自RC回溯语料
el_all_owned: "五名复拓者全部到齐。管理层点评：这不再是派遣，这是降维打击。", // 仿写自复拓者口号
el_relic_use: "本次任务附加匠器：{relic}。复拓者的私藏，用一次少一次——省着点。", // 仿写
el_rescue_msg: "团灭警报解除：{elite} 把所有人从棺材价账单里捞了出来。产出保住一半，账单砍掉一半——这就是精英的价值。", // 仿写自任务指挥腔

}); // TEXT 结束，共 193 条
 // TEXT 结束，共 193 条

/* ================= ev_lcyf_* / ev_cat_* 社区彩蛋事件 ================= */
Object.assign(TEXT, {

/* lcyf166 到访（护送专属，8 键） */
ev_lcyf_title: "矿业顾问到访",
ev_lcyf_desc: "一位穿着黄色雨靴的矮人从空投舱里滚了出来。「大家好啊，我是lcyf166！」——管理层注：此人是集团认证的第三方矿业效率顾问，人事部档案查无此人。",
ev_lcyf_a_btn: "听他的",
ev_lcyf_a_result: "lcyf166 掏出终端按了两下，任务时长直接砍半。「开挂节约时间，不开浪费时间。」他说完就走了。管理层决定不追问原理。",
ev_lcyf_b_btn: "v他50",
ev_lcyf_b_result: "你 v 了 lcyf166 50 代币。他满意地点点头，在你耳边悄悄说了一个关于连锁核弹的秘密。从此以后，只要工程师在场，虫潮就是经验包。",
ev_lcyf_unlock_hint: "需要同时持有连「锁」爆弹 + 胖男孩两把模组才可解锁此选项。",
ev_lcyf_avatar_alt: "一位穿着黄色雨靴的矿业顾问。他说他叫 lcyf166。",

/* 黑脸小猫参上（寒曦月璃，9 键） */
ev_cat_title: "黑脸小猫参上",
ev_cat_desc: "一只超大的黑脸小猫蹲在矿道拐角，眯着眼看你们。它开口了：「抖S腹黑超大只的黑脸小猫，参上♪ 我最喜欢导管了——其实是减CD啦。」它从尾巴下面抽出一本厚得离谱的笔记本，翻开新的一页，磨了磨爪子。「现在，让我看看……谁来过、干了什么、欠了什么。都写在本本上了哦～」",
ev_cat_a_btn: "递上小红糖",
ev_cat_a_result: "小猫舔了舔红糖，眯起眼睛发出呼噜声。全队士气大振——毕竟连死神经纪人都伺候好了，还有什么虫子好怕的？",
ev_cat_b_btn: "绕道走",
ev_cat_b_result: "你们假装没看见。小猫在笔记本上慢慢写了一行字。没人敢回头看第二眼。",
ev_cat_grudge: "小猫用尾巴在笔记本上画了个圈。「记下了哦。」",
ev_cat_grudge_max: "黑脸小猫在笔记本上写了什么……下次深潜感觉会不太妙。",
ev_cat_avatar_alt: "一只超大的黑脸小猫，正在写笔记。",

}); /* 彩蛋事件 17 键结束 */

/* ================= 开局剧情与解锁机制文案 ================= */
Object.assign(TEXT, {
  /* —— 序章三屏（st_*）—— */
  st_note_title: "储物柜里的便签",
  st_note_body: "接手的兄弟：吧台第二层有我私藏的叶子情人，别让劳埃德知道。五级任务的钱有五级的道理——等我回来一起喝。\n——前任职员 卡尔",
  st_brief_title: "集团人事简报 · 第 4471 号",
  st_brief_body: "五级风险任务【藤络树洞 · 深层】执行小队于任务周期内失去联络。按集团惯例，暂定性为失踪，薪资照发至下季度。集团欢迎新任管理层上任 17 号钻台，并预祝工作顺利。",
  st_takeover_title: "新任管理层上任",
  st_takeover_body: "17 号钻台现有资产：一座钻井平台、一份没人敢接的危5 遗单，和一群等着开饭的合同。重建产能，顺便查清楚卡尔遇到了什么——顺序随你。",
  st_start_btn: "把钻台重新开起来",
  st_skip: "跳过序章 ≫",
  /* —— 演出派遣（卡尔的遗单）—— */
  st_mission_name: "卡尔的遗单",
  st_mission_tag: "危5 · 藤络树洞 · 剧情单（仅限卡尔）",
  st_comms_title: "最后一次通讯",
  st_comms_body: "藤络树洞 620 米层，通讯开始断续。卡尔的声音很稳：「管理层，测得矿脉异常——你说，集团会给我们这种小队发抚恤金吗？」",
  st_comms_a: "「卡尔，立刻回撤！」",
  st_comms_b: "「保持静默，保存氧气。」",
  st_lost_title: "通讯中断",
  st_lost_body: "【任务周期结束】卡尔的遗单（危5 · 藤络树洞）：无信号返回。集团已将其状态更新为：失联（暂定）。薪资账户冻结，私藏的酒由劳埃德代为保管。",
  st_prologue_done_log: "序章结束。目标：把产能重建起来——顺便，查清楚卡尔到底遇到了什么。",
  /* —— 卡尔踪迹线（karl_*）—— */
  karl_bar_clue: "吧台底面有一行刻字：「K 在此喝过最后一杯。劳埃德，账挂卡尔名下。」——他打算回来的。",
  karl_gear_clue: "储物柜最深处压着一只旧空白模组，标签是卡尔的字迹：「给接盘的新管理层。别浪费在 PGL 上。」（空白模组 ×1 已放入你的库存）",
  karl_dive_clue: "深潜声呐档案新增一条：深层岩壁有周期性敲击信号，摩斯码翻译过来是——「ROCK AND STONE」。",
  karl_help_title: "寻找卡尔（线索 {n}/3）",
  karl_finale_title: "清账行动 · 尾声",
  karl_finale_body: "你在藤络树洞最深处找到一台还在录制的终端。最后一条日志：「下面还有更深处。这里的矿脉会唱歌，虫子居然会排队。我继续往下看看，别找我——找也找不到。Rock and Stone，替我把酒喝完。」签名：卡尔",
  karl_endless_signal: "周年深夜，声呐又录到那段敲击声。这次多了半句：「……酒不错。」",
  log_manager_new: "重置完毕。管理层已换人，钻台重新开张——上一任的遗物已清空。", // 补：重置存档后日志（此前 undefined）
  /* —— 解锁机制（un_*）—— */
  un_locked_toast: "{name} 尚未解锁。条件：{cond}",
  un_need_campaign: "完成战役【{name}】",
  un_need_rig: "钻井平台 Lv.{n}",
  un_need_credits: "代币不足（还差 {n}）",
  un_buy_btn: "重建 · {cost} 代币",
  un_lic_btn: "办理牌照 · {cost} 代币",
  un_done_toast: "【{name}】解锁：{gift}",
  un_market_gift: "牌照生效——集团为新客户准备了每种矿物 ×10 的起始仓",
  un_kpi_toast: "集团财务部：鉴于钻台重建进度达标，季度 KPI 考核自本季起生效。配额不会自己长，但财报会。",
  un_karl_count_log: "【寻找卡尔】线索 {n}/3 已记录。"
});

/* 设施解锁配置（B-9 §二总表的机器可读版，A 的锁定门读这里）
   rig=平台门槛 campaign=战役门槛 cost=一次性购买费（0=免费）
   gift=解锁赠品 key（A 实装时按 key 发放） */
const FACILITIES = {
  kpi:    { name: "季度 KPI 考核", rig: 2, campaign: "c1", cost: 0,   gift: null },
  bar:    { name: "深渊酒吧",       rig: 2, campaign: "c2", cost: 600, gift: "karl_bar" },
  market: { name: "交易站",         rig: 3, campaign: "c3", cost: 500, gift: "market_starter" },
  med:    { name: "医疗站",         rig: 3, campaign: "c3", cost: 600, gift: null },
  gear:   { name: "装备终端",       rig: 4, campaign: "c4", cost: 0,   gift: "karl_gear" }
};



/* ================= 双模式文案 ================= */
Object.assign(TEXT, {
  dm_mode_idle: "挂机",
  dm_mode_rush: "急行",
  dm_toast_rush: "⚡ 急行模式：任务时长 ÷30（10 秒级）、产出 ×0.35、硝石 ×4、时间延长选项付费、深潜与时间控制停用。",
  dm_toast_idle: "🛌 挂机模式：正常流速，任务收益全额，时间延长选项返还硝石。",
  dm_rush_dive_lock: "⚠ 急行模式不开放深潜。切回挂机模式后可正常下潜。",
  dm_nitra_tag: "硝石 +{n}",
  dm_nitra_short: "（急行：额外消耗 {n} 硝石）",
  dm_idle_refund: "（挂机：返还派遣硝石 {n}）",
  dm_auto_on: "🤖 挂机券激活：未来 3 小时自动派遣与决策。休眠舱仍可叠加使用。",
  dm_auto_off: "挂机模式已手动取消。",
  dm_auto_rush_lock: "挂机券只在挂机模式可用——急行没有托管，决策请亲自来。",
  dm_report_title: "📊 托管收益面板",
  dm_report_empty: "暂无托管收益——挂机券生效期间完成的任务会自动累计到这里。",
  dm_report_scope: "统计范围：挂机券生效期间的自动派遣与决策。",
  dm_report_sign: "签收",
  dm_report_missions: "完成任务",
  dm_report_credits: "代币净收",
  dm_report_morkite: "墨菱石",
  dm_report_moil: "墨菱油",
  dm_report_nitra: "硝石",
  dm_report_med: "医疗支出",
  dm_report_events: "托管自动决策事件",
  dm_report_expire: "🤖 挂机券到期——收益面板已生成，点 📊 可随时查看。"
});




