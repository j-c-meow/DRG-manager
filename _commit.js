const { spawnSync } = require('child_process');
const run = (args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  console.log('git', args[0], '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 200));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', 'F3(P1) 修复：SW 缓存版本 v2→v3 + HTML 网络优先策略（根治回头玩家被钉死旧版）+ v1.9 包重建']);
const p = run(['push']);
process.exit(p.status);
