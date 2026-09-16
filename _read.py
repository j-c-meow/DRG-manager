# -*- coding: utf-8 -*-
import io
s = io.open('资料/开局剧情TEXT键块.js', encoding='utf-8').read()
print('len:', len(s))
print(s[:3000])
