const fs = require('fs');
const g = fs.readFileSync('游戏.html', 'utf8');
// 1) .l 日志行 CSS（左色条？）
const cssL = g.match(/^\.l[ {.][^\n]*/gm) || g.match(/\.l\.(good|bad|sys|gold)[^{]*\{[^}]*\}/g);
console.log('=== .l 日志样式 ===');
console.log((cssL || ['(none)']).join('\n').slice(0, 800));
// 2) renderBoard 完整卡片标记（危N徽章 vs ★）
const rb = g.indexOf('function renderBoard');
const seg = g.slice(rb, rb + 2600);
console.log('=== renderBoard 卡片段 ===');
console.log(seg.slice(seg.indexOf('S.board.forEach'), seg.indexOf('S.board.forEach') + 1200));
// 3) 未使用的 TEXT 键（v1.4 扩表范围）
const gm = g.match(/<script>([\s\S]*)<\/script>/)[1];
const defined = [...new Set([...gm.matchAll(/(?:^|\n)\s*([A-Za-z_][A-Za-z0-9_]*):/gm)].map(x => x[1]))];
const used = new Set([...gm.matchAll(/TEXT\.([A-Za-z_][A-Za-z0-9_]*)/g)].map(x => x[1]));
const unused = defined.filter(k => !used.has(k));
console.log('=== 未接线 TEXT 键 ===', unused.length);
console.log(unused.join(', '));
// 4) 名册晋升长文是否还在名册
const rr = g.indexOf('function renderRoster');
const rseg = g.slice(rr, rr + 2200);
const ladderIn = rseg.includes('晋升') && (rseg.includes('阶梯') || rseg.length > 1800);
console.log('=== renderRoster 长度与晋升长文 ===');
console.log('renderRoster 段长度截取 2200, 含晋升长文提示?', /晋升.{0,40}(Lv|星|★)/.test(rseg));
const hp = g.indexOf('function renderHelp');
console.log('=== renderHelp 前 500 ===');
console.log(g.slice(hp, hp + 500));
