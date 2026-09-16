# -*- coding: utf-8 -*-
import io
s = io.open('资料/夜间试玩bug单.md', encoding='utf-8').read()
i = s.find('五、晨报')
print('=== 晨报 ===')
print(s[i:i+2500] if i >= 0 else s[-2500:])
print()
print('=== F6+ 新条目检查 ===')
import re
for m in re.finditer(r'\| F([6-9]\d?) \|', s):
    print(m.group(0))
j = s.find('| F6')
print(s[j:j+800] if j >= 0 else '(no F6)')
