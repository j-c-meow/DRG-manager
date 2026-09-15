const { spawnSync } = require('child_process');
const run = (args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  console.log('git', args[0], '-> status', r.status);
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 300));
  return r;
};
run(['add', '-A']);
run(['commit', '-m', 'v1.9：执行单全量落实（XP lv×30/事件+lv×2/KPI 1500×term+超额/重复员工300）+ 酒吧抽酒制 v2（15款池+派遣白送+再抽一轮）+ 双模式实装（挂机⇄急行切换器/时长÷30/产出×0.35/硝石×4/事件硝石价目/收益面板/深潜急行禁用）']);
const p = run(['push']);
process.exit(p.status);
