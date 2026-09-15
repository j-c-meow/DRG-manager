/* 取 dm_* 锚点行号（B 临时脚本，跑完可删） */
const s = require('fs').readFileSync('游戏.html', 'utf8');
const lines = s.split('\n');
const pats = [
  ["renderHeader 模式名", "ml.textContent = rush ?"],
  ["toast rush", "急行模式：任务时长"],
  ["toast idle", "挂机模式：正常流速"],
  ["深潜拦截 note", "急行模式不开放深潜"],
  ["深潜拦截 log", "深潜是周常大单"],
  ["nitroTag", "function nitroTag"],
  ["eventNitroAdjust 急行", "额外消耗"],
  ["eventNitroAdjust 返还", "返还派遣硝石"],
  ["toggleAuto fn", "const toggleAuto"],
  ["auto off 文案", "挂机模式已手动取消"],
  ["auto on 文案", "挂机券激活"],
  ["report title", "托管收益面板"],
  ["report empty", "暂无托管收益"],
  ["report scope+sign", "统计范围"],
  ["report missions", "完成任务"],
  ["report expire", "挂机券到期"],
  ["mode-chip onclick", "S.mode = (S.mode === 'rush') ? 'idle' : 'rush'"],
  ["slotChance", "slotChance: 0.35"]
];
for (const [name, p] of pats) {
  const i = lines.findIndex(l => l.includes(p));
  console.log((i >= 0 ? 'L' + (i + 1) : 'MISS') + '  ' + name + '  (' + p + ')');
}
