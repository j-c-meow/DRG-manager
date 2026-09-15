# -*- coding: utf-8 -*-
import io
q = io.open('资料/动画资源清单.md', encoding='utf-8').read()
i = q.find('drinks')
print('drinks @', i)
print(q[max(0, i-300):i+1400])
print('==== len', len(q))
