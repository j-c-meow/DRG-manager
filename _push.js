const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
const run = (args, opts) => {
  const r = spawnSync('git', args, Object.assign({ encoding: 'utf8' }, opts));
  console.log('git', args.join(' '), '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 300));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', 'v1.7：三期文案接线（五经典事件 TEXT 30 键/交易买10卖10 修双重嵌套）+ 九项之⑤ Tab 角标（医疗站/锻造台/深潜）+ renderFullLog 去重']);
const p = run(['push'], { timeout: 180000 });
if (p.status !== 0) process.exit(1);
console.log('PUSH_OK');
