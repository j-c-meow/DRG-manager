const fs = require('fs');
function dump(f, pats) {
  const t = fs.readFileSync(f, 'utf8').split('\n');
  const out = [];
  t.forEach((l, i) => {
    for (const p of pats) {
      if (l.includes(p)) { out.push(f + ' ' + (i + 1) + ': ' + l.trim().slice(0, 220)); break; }
    }
  });
  return out;
}
const hits = [].concat(
  dump('src/manager/game-data.js', ['REALTIME_BIOMES', 'mtypeById', "'point'", "'salv'", 'mis_point', 'mis_salv', 'MIS_BANNER', 'MTYPE']),
  dump('src/realtime/autopilot.js', ['type', 'escort', 'quota']),
  dump('src/manager/missions.js', ["'point'", "'salv'", "'exp'", "'escort'", 'mtypeById']),
  dump('scripts/build.mjs', ['realtime', 'cp(']),
  dump('src/pages/manager.html', ['scripts/realtime', 'scripts/app.js', 'realtime-shell']),
  dump('src/realtime/shell.html', ['script', 'assets/realtime']),
  dump('src/unified/definitions.ts', ["'point'", "'salv'", 'type']),
  dump('src/unified/domain.ts', ['startDirectMission', "'point'", "'salv'", 'type'])
);
fs.writeFileSync('_tmp_hits.txt', hits.join('\n'));
console.log('hits', hits.length);
