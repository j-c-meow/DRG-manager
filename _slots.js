const fs = require('fs');
const g = fs.readFileSync('游戏.html', 'utf8');
const show = (tag, pat, len) => {
  const i = g.indexOf(pat);
  if (i < 0) { console.log('=== ' + tag + ' === NOT FOUND: ' + pat); return; }
  console.log('=== ' + tag + ' @' + g.slice(0, i).split('\n').length + ' ===');
  console.log(g.slice(i, i + len));
};
show('upgradeRig log', 'function upgradeRig', 480);
show('trinket equip equip', 'function equipTrinket', 500);
show('market 按钮', '买 10', 300);
show('NAMES_EGG', 'NAMES_EGG', 400);
show('renderMed 尾部', 'function renderMed', 1400);
show('召回', "'召回'", 250);
show('手动存档按钮', 'btn-save', 300);
