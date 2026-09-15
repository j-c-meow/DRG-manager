const { spawnSync } = require('child_process');
const run = (args, opts) => {
  const r = spawnSync('git', args, Object.assign({ encoding: 'utf8' }, opts));
  console.log('git', args.join(' '), '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 300));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', 'v1.8：时间系统修复（双进度源统一/浮点封顶/结算异常保底/战役双计数/深潜死代码/卖10文案）+ 双模式设计方案文档 + B/C 分工单']);
const p = run(['push'], { timeout: 180000 });
process.exit(p.status);
