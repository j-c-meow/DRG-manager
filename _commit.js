const { spawnSync } = require('child_process');
const run = (args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  console.log('git', args[0], '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 250));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', 'jiuduo 试玩 bug 修复：急行暂停冻结（切急行自动恢复流动）+ 在途任务时长模式转换 + 急行派遣费按原始时长（修造硝机根因）+ 预览同步 + drops 图标拆名查表 + log_manager_new 补键 + log 消毒 + 编年史口号削减 + 资源总览 icon 兜底 + idleReport rare 纯名']);
const p = run(['push']);
process.exit(p.status);
