const { spawnSync } = require('child_process');
const run = (args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  console.log('git', args[0], '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 250));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', 'C 手机端布局四条补丁归档（任务板自动展开/矿道挖掘小人/日志减半/底部导航）+ B 数值核算归档 + A 临时文件清理']);
const p = run(['push']);
process.exit(p.status);
