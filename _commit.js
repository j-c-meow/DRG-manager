const { spawnSync } = require('child_process');
const run = (args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  console.log('git', args[0], '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 200));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', 'F4(P2) 修复：深潜 ISO 周号改用编年史游戏日历日期（同节日口径）+ F5 成就名暂替「v他50」（B 早间定稿）+ v1.9 包重建']);
const p = run(['push']);
process.exit(p.status);
