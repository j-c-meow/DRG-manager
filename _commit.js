const { spawnSync } = require('child_process');
const run = (args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  console.log('git', args[0], '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 250));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', '暂停/继续单键改造：×1 按钮退役（加速历史残留），⏸/▶ 切换键带状态同步，急行模式整组隐藏不变']);
const p = run(['push']);
process.exit(p.status);
