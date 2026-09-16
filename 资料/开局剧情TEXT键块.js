/* =========================================================
 * B-9 开局剧情与解锁机制 TEXT 键块（B 交付 · 2026-09-16）共 34 键
 * 配套设计文档：资料\开局剧情与解锁机制设计.md
 * A 注入方式：整块粘贴到 游戏.html 的 TEXT 定义之后（与其他并入块相同）；
 *   FACILITIES 常量单独声明，供设施锁定门读取。
 * 注入后全库 371+34=405 键。node --check 通过；st_/karl_/un_ 前缀无冲突；雷区自查 0 命中。
 * ========================================================= */
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
  med:    { name: "医疗站",         rig: 2, campaign: "c3", cost: 600, gift: null },
  gear:   { name: "装备终端",       rig: 4, campaign: "c5", cost: 0,   gift: "karl_gear" }
};
