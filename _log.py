# -*- coding: utf-8 -*-
import io
FN = '交接文档.md'
s = io.open(FN, encoding='utf-8').read()
anchor = '（↓ 新任务写在这条线下面 ↓）'
i = s.find(anchor)
j = s.find('\n', s.find('────', i)) + 1
receipt = (
    "- 【完成回执】【会话A 2026-09-16 03:20 夜巡】**夜间试玩 bug 单 F1/F2 修复完成**：\n"
    "  F1（P2）：autoPlayStep 派遣门槛 idle.length >= 2 → **>= 1**——单人开局（或战役赠员前）挂机券现在会真实接单，符合\"所有空闲矿工自动接单\"规格；e2e 单人开局实测自动派出。\n"
    "  F2（P3）：托管事件决策弃用 DOM 点击路径（showEventModal + .opt.pri click），改为直接调 autoResolveEvent 内部映射（经典事件→稳妥项、meme→A 项）——无头/类名变更都不再影响托管；e2e 实测虫潮事件无弹窗直接按稳妥项解决、挂机收益面板事件计数正常。\n"
    "  node --check 过；雷区干净。B 的数值体感观察（nitra 无头堆积/急行+跳跃刷编年史阀）留待早间复核，未动参数。\n"
)
s2 = s[:j] + receipt + s[j:]
io.open(FN, 'w', encoding='utf-8').write(s2)
print('logged', len(s2))
