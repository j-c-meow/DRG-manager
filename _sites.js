const fs = require('fs');
const g = fs.readFileSync('游戏.html', 'utf8');
const lines = g.split('\n');
const show = (tag, pat, before, after) => {
  const i = g.indexOf(pat);
  if (i < 0) { console.log('=== ' + tag + ' === NOT FOUND: ' + pat); return; }
  const ln = g.slice(0, i).split('\n').length;
  console.log('=== ' + tag + ' @' + ln + ' ===');
  console.log(lines.slice(ln - 1 - before, ln - 1 + after).join('\n'));
};
show('claimKPI', 'function claimKPI', 0, 16);
show('季初下达(季度翻转)', 'kpi.term', 2, 6);
show('renderRoster 标题', 'function renderRoster', 0, 6);
show('renderBar 标题', 'function renderBar', 0, 6);
show('renderMed 标题', 'function renderMed', 0, 6);
show('renderGear 标题', 'function renderGear', 0, 5);
show('renderRig 标题', 'function renderRig', 0, 8);
show('KPI 终端标题', '关键绩效', 2, 4);
show('save 提示', "function save(", 0, 8);
show('重置按钮', '重置存档', 2, 3);
show('出院 discharge', 'function discharge', 0, 12);
show('med psa/pain', '医疗站广播', 2, 4);
show('trinket equip', 'tr_equip', 1, 2);
show('camp fold', '战役与活动', 2, 3);
show('deploy modal', '选择出勤矿工', 3, 4);
