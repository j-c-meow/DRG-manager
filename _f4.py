# -*- coding: utf-8 -*-
import io
FN = '游戏.html'
s = io.open(FN, encoding='utf-8').read()
old = """  let cost = dispatchCost(m, hc, modEff, dur);
  if(S.mode === 'rush'){ cost = Math.round(cost * 4); }   /* 急行：硝石 ×4（节奏限制器） */"""
new = """  let cost = dispatchCost(m, hc, modEff, dur);
  cost = Math.round(cost * (S.difficulty.nitra||1));
  if(S.mode === 'rush'){ cost = Math.round(cost * 4); }   /* 急行：硝石 ×4（节奏限制器） */"""
assert s.count(old) == 1
s = s.replace(old, new)
io.open(FN, 'w', encoding='utf-8', newline='').write(s)
print('nitra difficulty wired')
