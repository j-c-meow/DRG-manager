# -*- coding: utf-8 -*-
import io
# SYNC B 行 + 广播区新内容
s2 = io.open('SYNC.md', encoding='utf-8').read()
for l in s2.split('\n'):
    if l.startswith('B |') or (l.startswith('- B') or l.startswith('- B→')):
        print('SYNC:', l[:250])
# 交接文档收发箱顶部（我的回执之后的新条目）
s = io.open('交接文档.md', encoding='utf-8').read()
i = s.find('（↓ 新任务写在这条线下面 ↓）')
inbox = s[i:]
lines = inbox.split('\n')
count = 0
for l in lines:
    if l.startswith('- 【'):
        if '会话A' in l[:20]:
            continue  # 跳过我自己的回执
        print('INBOX:', l[:260])
        count += 1
        if count >= 4: break
