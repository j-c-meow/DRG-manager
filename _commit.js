const { spawnSync } = require('child_process');
const run = (args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  console.log('git', args[0], '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 200));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', '夜间试玩bug单 F1/F2 修复：挂机券单人开局自动接单（门槛≥2→≥1）+ 托管事件决策改 autoResolveEvent 内部调用（去 DOM 依赖）']);
const p = run(['push']);
process.exit(p.status);
