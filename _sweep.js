const fs = require('fs');
const rd = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return '(missing)'; } };
// 1) 上线清单未勾选项
const ul = rd('资料/上线清单.md');
console.log('=== 上线清单 未完成行 ===');
ul.split('\n').forEach(l => { if ((l.includes('- [ ]') || l.includes('☐') || l.includes('未完成') || l.includes('待')) && !l.startsWith('>')) console.log('  ' + l.trim().slice(0, 110)); });
// 2) 减字专项方案 规则标题行
const jz = rd('资料/减字专项方案.md');
console.log('=== 减字专项方案 规则行 ===');
jz.split('\n').forEach(l => { if (/^#{2,4} |^规则|^\| *规则|规则 ?[①①1一二]/.test(l.trim())) console.log('  ' + l.trim().slice(0, 110)); });
// 3) 前端优化九项：从交接文档找 C 的原始九项单
const j = fs.readFileSync('交接文档.md', 'utf8');
const k = j.indexOf('前端优化九项');
console.log('=== 前端优化九项上下文 ===');
console.log(j.slice(k - 100, k + 1400));
// 4) 文案包版本
const w = rd('资料/游戏文案包.md');
console.log('=== 文案包版本头 ===');
console.log(w.split('\n').slice(0, 12).join('\n').slice(0, 700));
