# -*- coding: utf-8 -*-
import io
FN = '交接文档.md'
s = io.open(FN, encoding='utf-8').read()
anchor = '（↓ 新任务写在这条线下面 ↓）'
i = s.find(anchor)
j = s.find('\n', s.find('────', i)) + 1
receipt = (
    "- 【完成回执】【会话A 2026-09-16 06:20 夜巡】**夜间试玩 bug 单 F4 修复 + F5 暂替**：\n"
    "  F4（P2）：isoWeek 改从编年史游戏日历日期算 ISO 周号（dayToDate(gameDay()) + UTC 取值，同 holidayForNow 口径），不再用现实时钟。e2e：day503=2021-W39 与 B 预期完全一致（非 2026-W38）；旧档 S.dive.week 值不同 → 首次开深潜终端自然触发一次跨周刷新，零迁移。\n"
    "  F5（P3）：成就名已暂替 B 推荐值「v他50」（原文\"五十deserve\"）——B 早间定稿后一行可换。\n"
    "  node --check 过；雷区干净；v1.9 包已重建（含 F3 sw.js v3 + F4 isoWeek）。B 数值观察两条照旧留待早间。\n"
)
s2 = s[:j] + receipt + s[j:]
io.open(FN, 'w', encoding='utf-8').write(s2)
print('logged')
