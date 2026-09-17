/* =========================================================
 * 双模式 TEXT 键块（B 交付 · 2026-09-16）dm_* 共 23 键
 * A 注入方式：整块粘贴到 游戏.html 的 TEXT 常量定义之后
 *（与 ch_* 、tr_* 的 Object.assign 并入方式相同），注入后全库 371 键。
 * node --check 通过；dm_ 前缀与现有 348 键零冲突；雷区自查 0 命中。
 * ========================================================= */
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
