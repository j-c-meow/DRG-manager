const { spawnSync } = require('child_process');
const run = (args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  console.log('git', args[0], '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 250));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', 'v1.9.1：B 核算退回 R1 修复（急行禁挂机券+切换自动取消，堵硝石负数洞）+ dm_* 23 键注入接线（TEXT 371 键）+ 16 款酒图标对号 + 抽酒动画 + 黑墨菱酒补漏 + 减字二期P1（showDetail 详情弹窗/Header/名册/任务板图标化）']);
const p = run(['push']);
process.exit(p.status);
