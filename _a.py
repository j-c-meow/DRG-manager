# -*- coding: utf-8 -*-
import io
s = io.open('游戏.html', encoding='utf-8').read()
def cut(tag, pat, ln=300):
    i = s.find(pat)
    print('===', tag, '===')
    if i >= 0: print(s[i:i+ln])
    else: print('NOT FOUND:', pat)
cut('settle 危5', '危险 5 任务', 200)
cut('settle 团灭救援', '团灭救援', 200)
cut('settle 卡尔彩蛋', 'S.flags.karl && Math.random', 250)
cut('marketSell', 'function marketSell', 500)
cut('tick 主循环', 'worldAdvance(gm, false);', 300)
cut('renderRig 朵蕾妲行', '镇台之宝', 300)
cut('resolveEvent catA', "c === 'catA'", 300)
cut('market 卡片', "data-mb=", 250)
