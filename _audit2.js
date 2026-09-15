const fs = require('fs');
const g = fs.readFileSync('游戏.html', 'utf8');
// 1) renderFullLog 重复定义位置与内容差异
const positions = [];
let idx = 0;
while ((idx = g.indexOf('function renderFullLog', idx)) !== -1) { positions.push(idx); idx += 10; }
console.log('renderFullLog 定义数:', positions.length, positions.map(p => g.slice(0, p).split('\n').length));
positions.forEach((p, i) => console.log('--- def' + (i + 1) + ' ---\n' + g.slice(p, p + 420).split('function renderFullLog')[1]?.slice(0, 380)));
// 2) 日志行渲染 class（renderFullLog 内部）
const logHtml = g.match(/logline|log-row|logline-class|class="log[^"]*"/g);
console.log('log相关class:', [...new Set(logHtml || [])].slice(0, 10));
// 3) renderBoard 任务卡现状（危N/徽章）
const rb = g.indexOf('function renderBoard');
console.log('=== renderBoard 前 600 字 ===');
console.log(g.slice(rb, rb + 600));
// 4) tabs HTML
const ti = g.indexOf('id="tabs"');
console.log('=== tabs HTML ===');
console.log(g.slice(ti - 100, ti + 500));
// 5) buyDrink 现状
const bd = g.indexOf('function buyDrink');
console.log('=== buyDrink ===');
console.log(g.slice(bd, bd + 500));
