/* B 第9轮验收临时脚本：双模式 §9 静态断言（跑完可删） */
const s = require('fs').readFileSync('游戏.html', 'utf8');
let fail = 0;
function has(name, pat) {
  const m = s.match(pat);
  if (!m) fail++;
  console.log((m ? 'OK   ' : 'MISS ') + name + (m ? '  @L' + s.slice(0, m.index).split('\n').length : ''));
}
console.log('== 0 通用 ==');
has('雷区(875)', /875/);
console.log('== 1 常数层 ==');
has("S.mode 默认 idle (newGame)", /mode:'idle', idleReport:null/);
has('load 迁移 S.mode', /if\(!S\.mode\) S\.mode = 'idle'/);
has('load 迁移 idleReport', /S\.idleReport === undefined\) S\.idleReport = null/);
has('rush dur ÷30 ≥6', /rush'\)\{ dur = Math\.max\(6, Math\.round\(dur \/ 30\)\)/);
has('rush 硝石 ×4', /rush'\)\{ cost = Math\.round\(cost \* 4\)/);
has('d.mode 派遣锁定', /mode:\(S\.mode\|\|'idle'\), nitraSpent:cost/);
has('产出 ×0.35 credits', /gain\.credits = Math\.round\(gain\.credits \* 0\.35\)/);
has('产出 ×0.35 morkite', /gain\.morkite = Math\.round\(gain\.morkite \* 0\.35\)/);
has('稀有掉率 ×0.6', /d\.mode === 'rush' \? 0\.6 : 1/);
has('硝石返还在乘区外(双模式同额)', /gain\.nitra \+= Math\.round\(\(50 \+ 40\*d\.hc\) \* \(0\.8 \+ 0\.2\*m\.hazard\)\)/);
has('价目 stay120', /nitroDis\(120\)/);
has('价目 bunker100', /nitroDis\(100\)/);
has('价目 save80+slow80', /nitroDis\(80\)/);
has('挂机返还 50%', /Math\.round\(\(d\.nitraSpent \|\| 0\) \* 0\.5\)/);
has('深潜 rush 拦截文案', /急行模式不开放深潜|切回挂机模式/);
has('spd-chip rush 隐藏', /spdChip\.style\.display = \(S\.mode === 'rush'\)/);
has('isDive 在 rush 乘区前 return', /if\(d\.isDive\)[\s\S]{0,600}?gain\.credits = Math\.round\(gain\.credits \* 0\.35\)/);
console.log('== 2 R1 挂机券 gate ==');
has('toggleAuto rush gate(dm_auto_rush_lock 或等价)', /auto_rush_lock|挂机券只在挂机模式/);
has('autoPlayStep 预检 dispatchCost', /const cost = dispatchCost\(m, ids\.length/);
has('autoPlayStep nitra 预检', /S\.nitra >= cost\) doDispatch/);
console.log('== 3 TEXT ==');
has('dm_mode_rush 键已注入', /dm_mode_rush/);
console.log((fail === 0 ? '\n全部通过' : '\nMISS ' + fail + ' 项'));
