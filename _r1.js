/* R1 复核（B 临时脚本） */
const s = require('fs').readFileSync('游戏.html', 'utf8');
const line = i => s.slice(0, i).split('\n').length;
function show(name, pat, ctx) {
  const m = s.match(pat);
  console.log((m ? 'HIT  ' : 'none ') + name + (m ? '  @L' + line(m.index) : ''));
  if (m && ctx) console.log('      ' + s.slice(m.index, m.index + ctx).replace(/\n/g, ' | '));
}
console.log('== dm_* 注入状态 ==');
const keys = (s.match(/dm_[a-z_]+/g) || []);
const uniq = new Set(keys);
console.log('dm_ 引用=' + keys.length + ' 唯一键=' + uniq.size);
console.log('== R1: toggleAuto / autoPlayStep ==');
show('toggleAuto rush gate', /function toggleAuto[\s\S]{0,400}?rush/, 300);
const i = s.indexOf('function autoPlayStep');
console.log('--- autoPlayStep 全文 ---');
console.log(s.slice(i, i + 1000));
