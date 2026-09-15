const { spawnSync } = require('child_process');
const run = (args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  console.log('git', args[0], '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 250));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', 'v1.9.2：四系统 P1 实装——成就系统40项（判定引擎+奖励+系统页成就墙）+ 矿骡升级线（Lv2自动收集/Lv3硝石返还+50%）+ 数值详情弹窗扩展（酒吧/交易站/深潜修正器）+ 清理临时文件']);
const p = run(['push']);
process.exit(p.status);
