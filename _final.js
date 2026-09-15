const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
fs.appendFileSync('.gitignore', '__pycache__/\n');
const run = (args, opts) => {
  const r = spawnSync('git', args, Object.assign({ encoding: 'utf8' }, opts));
  console.log('git', args.join(' '), '-> status', r.status);
  if (r.stdout && r.stdout.trim()) console.log(r.stdout.trim().slice(0, 500));
  if (r.status !== 0 && r.stderr) console.log('STDERR:', r.stderr.trim().slice(0, 400));
  return r;
};
run(['add', '-A']);
const files = execSync('git ls-files -z', { maxBuffer: 1e8 }).toString('utf8').split('\0').filter(Boolean);
console.log('staged', files.length, '| pycache', files.filter(f => f.includes('__pycache__')).length, '| tmp', files.filter(f => f.startsWith('_')).length);
run(['commit', '-m', '深岩银河·17号钻台管理终端 v1.6：编年史/武器双槽/深潜双轨/精英支援位/酒吧buff/社区彩蛋事件(lcyf166+黑脸小猫)/任务板手机折叠/BGM/鸣谢栏']);
run(['remote', 'add', 'origin', 'https://github.com/j-c-meow/DRG-manager.git']);
run(['remote', '-v']);
console.log('--- PUSH (如弹出浏览器授权页请点击同意) ---');
const p = run(['push', '-u', 'origin', 'main'], { timeout: 280000 });
console.log(p.status === 0 ? 'PUSH_OK' : 'PUSH_FAILED');
