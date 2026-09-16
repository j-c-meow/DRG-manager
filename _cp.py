# -*- coding: utf-8 -*-
import io
s = io.open('游戏.html', encoding='utf-8').read()
i = s.find("if(camp.id === 'finale'){")
print(s[i:i+700])
