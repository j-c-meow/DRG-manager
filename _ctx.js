const fs = require('fs');
const g = fs.readFileSync('游戏.html', 'utf8');
const cut = (tag, fn, len) => {
  const i = g.indexOf(fn);
  console.log('=== ' + tag + ' @' + (g.slice(0, i).split('\n').length) + ' ===');
  console.log(g.slice(i, i + len).replace(/\n+/g, '\n'));
};
cut('settle 弹窗标题区', 'function settle', 2600);
