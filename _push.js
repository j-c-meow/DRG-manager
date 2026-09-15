const { spawnSync } = require('child_process');
const run = (args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  console.log('git', args[0], '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 300));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', 'v1.8.1：BGM 默认静音修复（init 未调用）+ 武器图标 24 把全换 wiki 官方线稿（统一白色描线风，含替 3 张手绘）+ 锻造台仓库模组文字墙删除 + C 前端美化任务下达']);
const p = run(['push']);
process.exit(p.status);
