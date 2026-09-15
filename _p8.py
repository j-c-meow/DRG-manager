# -*- coding: utf-8 -*-
import io
FN = '游戏.html'
s = io.open(FN, encoding='utf-8').read()
orig = len(s)
PAUSE = '\u23F8 暂停'   # ⏸ 暂停
RESUME = '\u25B6 继续'  # ▶ 继续

def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, 'ANCHOR FAIL (%d): %s' % (c, old[:90])
    s = s.replace(old, new)

# ---------- ① Header：时间组两个按钮 → 单个暂停/继续切换键 ----------
rep("""    <div class="chip" id="spd-chip">时间
      <button class="btn" data-spd="0">暂停</button>
      <button class="btn" data-spd="1">×1</button>
    </div>""",
    """    <div class="chip" id="spd-chip">
      <button class="btn" id="btn-pause" title="暂停 / 继续时间">""" + PAUSE + """</button>
    </div>""")

# ---------- ② 绑定：data-spd → 单键切换 ----------
rep("""  document.querySelectorAll('[data-spd]').forEach(b=>{
    b.onclick = () => { speed = parseInt(b.dataset.spd); document.querySelectorAll('[data-spd]').forEach(x=>{ x.classList.toggle('on', parseInt(x.dataset.spd)===speed); }); log(speed===0 ? '时间暂停。钻台进入待机——矿工们向你致谢。' : TEXT.log_time_speed.replace('{n}', speed), 'sys'); };
  });""",
    """  const pauseBtn = document.getElementById('btn-pause');
  if(pauseBtn) pauseBtn.onclick = () => {
    speed = (speed === 0) ? 1 : 0;
    pauseBtn.innerHTML = (speed === 0) ? '""" + RESUME + """' : '""" + PAUSE + """';
    log(speed === 0 ? '\u23F8 时间暂停。钻台进入待机——矿工们向你致谢。' : '\u25B6 时间继续流动。挖起来，矿工们！', 'sys');
  };""")

# ---------- ③ renderHeader：同步按钮状态（载入/其他改动后保持一致） ----------
rep("""  const spdChip = document.getElementById('spd-chip');
  if(spdChip) spdChip.style.display = (S.mode === 'rush') ? 'none' : '';""",
    """  const spdChip = document.getElementById('spd-chip');
  if(spdChip) spdChip.style.display = (S.mode === 'rush') ? 'none' : '';
  const pauseBtnSync = document.getElementById('btn-pause');
  if(pauseBtnSync){
    const want = (speed === 0) ? '""" + RESUME + """' : '""" + PAUSE + """';
    if(pauseBtnSync.innerHTML !== want) pauseBtnSync.innerHTML = want;
  }""")

io.open(FN, 'w', encoding='utf-8', newline='').write(s)
print('PATCH8 OK %d -> %d (+%d)' % (orig, len(s), len(s) - orig))
