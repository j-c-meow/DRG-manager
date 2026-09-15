# -*- coding: utf-8 -*-
import io
# 数值核算的 18 行变化内容
import subprocess
d = subprocess.run(['git', 'diff', '--', '资料/双模式数值核算.md'], capture_output=True).stdout.decode('utf-8', 'replace')
lines = [l for l in d.split('\n') if (l.startswith('+') or l.startswith('-')) and not l.startswith('+++') and not l.startswith('---')]
print('=== 数值核算 diff ===')
for l in lines: print(l[:200])
# 交接文档里找今天新指派 A 的条目
s = io.open('交接文档.md', encoding='utf-8').read()
print('=== 指派：A / 指派：A（主会话）最近条目 ===')
import re
for m in re.finditer(r'- 【[^】]*】【指派：A[^】]*】[^\n]{0,200}', s):
    print(m.group(0)[:240])
    print('---')
