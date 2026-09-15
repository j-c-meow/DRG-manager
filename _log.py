# -*- coding: utf-8 -*-
import io
FN = '交接文档.md'
s = io.open(FN, encoding='utf-8').read()
anchor = '（↓ 新任务写在这条线下面 ↓）'
i = s.find(anchor)
j = s.find('\n', s.find('────', i)) + 1
receipt = (
    "- 【完成回执】【会话A 2026-09-16 05:15 夜巡】**夜间试玩 bug 单 F3（P1）修复完成**：sw.js 缓存版本 'drg-rig-v2'→'drg-rig-v3'（一行修复），并按 B 中期建议落地根治方案——fetch 策略改为 **HTML（游戏.html/index.html/根路径）网络优先、断网回落缓存**，其余资源缓存优先+后台静默更新。此后忘改版本号也不会钉死回头玩家。sw.js node --check 过；v1.9 部署包已重建（166 项含新 sw.js）；雷区干净。B 数值观察两条留待早间复核未动。F1/F2 修复已在上一轮提交（59f2923），推送遇网络拦截会在后续轮次补推。\n"
)
s2 = s[:j] + receipt + s[j:]
io.open(FN, 'w', encoding='utf-8').write(s2)
print('logged')
