# -*- coding: utf-8 -*-
import io, os, time, datetime
now = datetime.datetime.now()
print('NOW:', now.strftime('%m-%d %H:%M'))
deadline = (now.hour > 8) or (now.hour == 8 and now.minute >= 30)
if deadline:
    print('DEADLINE_REACHED')
print('=== 最近 25 分钟内修改的 md ===')
hits = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', '__pycache__', 'raw')]
    for f in files:
        if f.endswith('.md'):
            p = os.path.join(root, f)
            age = (time.time() - os.path.getmtime(p)) / 60
            if age < 25:
                t = datetime.datetime.fromtimestamp(time.time() - age * 60).strftime('%H:%M')
                hits.append((t, p, os.path.getsize(p)))
                print(t, p, os.path.getsize(p), 'B')
if not hits:
    print('(none)')
