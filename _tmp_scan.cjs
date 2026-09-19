const fs = require('fs');
function dump(f, pats) {
  const t = fs.readFileSync(f, 'utf8').split('\n');
  const out = [];
  t.forEach((l, i) => {
    for (const p of pats) {
      if (l.includes(p)) { out.push(f + ' ' + (i + 1) + ': ' + l.trim().slice(0, 200)); break; }
    }
  });
  return out;
}
const hits = [].concat(
  dump('src/manager/game-data.js', ['REALTIME_BIOMES', 'mtypeById', "'point'", "'salv'", 'mis_point', 'mis_salv']),
  dump('src/realtime/autopilot.js', ['type', 'escort']),
  dump('index.html', ['scripts/realtime', 'scripts/app']),
  dump('src/realtime/shell.html', ['script']),
  dump('src/manager/missions.js', ["'point'", "'salv'", 'exp', 'escort'])
);
fs.writeFileSync('_tmp_hits.txt', hits.join('\n'));
console.log('written', hits.length);
