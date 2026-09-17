# -*- coding: utf-8 -*-
"""Generate 文案素材库.md from the two official-localization TSVs.
Selection is by candidate id (see 素材候选.txt) or by exact en text (for entries
discovered in the supplement probe that were not dumped into the candidate file).
"""
import io, re, sys

OUT = r"D:\模拟运营小游戏\资料\文案素材库.md"
CAND = r"D:\模拟运营小游戏\资料\素材候选.txt"

FILES = [
    ("DRG", r"D:\模拟运营小游戏\资料\raw\DRG_文本全量_en_zh.tsv"),
    ("RC",  r"D:\模拟运营小游戏\资料\raw\RC_文本全量_en_zh.tsv"),
]
KEYRE = re.compile(r'^[0-9A-F]{32}$')
BANNED = ('猫八', '猫猫爱吃')

def parse(path):
    recs = []
    with open(path, encoding='utf-8') as f:
        lines = f.read().split('\n')
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        parts = line.split('\t')
        if len(parts) >= 4:
            recs.append([parts[0], parts[1], parts[2], parts[3]])
            i += 1
            continue
        if len(parts) == 3 and parts[0] == '' and KEYRE.match(parts[1] or ''):
            key = parts[1]
            i += 1
            en_acc, zh_acc = [], []
            stage = 'en'
            while i < n:
                l2 = lines[i]
                p2 = l2.split('\t')
                if len(p2) >= 4:
                    break
                if len(p2) == 3 and p2[0] == '' and KEYRE.match(p2[1] or ''):
                    break
                if stage == 'en':
                    if len(p2) >= 2:
                        en_acc.append(p2[0])
                        if p2[1] != '':
                            zh_acc.append(p2[1])
                            stage = 'zh'
                        else:
                            stage = 'zhstart'
                    else:
                        en_acc.append(l2)
                else:
                    zh_acc.append(l2)
                i += 1
            recs.append(['', key, '\n'.join(en_acc), '\n'.join(zh_acc)])
            continue
        i += 1
    return recs

def clean(s):
    s = s.replace('\r', ' ').replace('\n', ' / ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# ---- rebuild pool ----
pool = []
seen = set()
for tag, path in FILES:
    for ns, key, en, zh in parse(path):
        en, zh = clean(en), clean(zh)
        if not en or not zh:
            continue
        if any(b in zh for b in BANNED):
            continue
        k = (en, zh)
        if k in seen:
            continue
        seen.add(k)
        pool.append({'src': tag, 'ns': ns, 'en': en, 'zh': zh})

# ---- id -> entry, from candidates file ----
idmap = {}
line_re = re.compile(r'^\[#(\d+)\] \[([^|\]]+)\|([^\]]*)\] \(\d+\) (.*) \|\|\| (.*)$')
with open(CAND, encoding='utf-8') as f:
    for l in f:
        m = line_re.match(l.rstrip('\n'))
        if m:
            gid = int(m.group(1))
            idmap[gid] = {'src': m.group(2), 'ns': m.group(3), 'en': m.group(4).strip(), 'zh': m.group(5).strip()}

def md(s):
    s = re.sub(r'<[^<>]*>', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def get(item):
    if isinstance(item, int):
        e = idmap[item]
    else:
        hits = [p for p in pool if p['en'] == item]
        if not hits:
            raise SystemExit('NOT FOUND: %r' % item)
        e = hits[0]
    return e

def render(item):
    e = get(item)
    ns = e['ns'] if e['ns'] and e['ns'] != '-' else ''
    tag = e['src'] if not ns else '%s·%s' % (e['src'], ns)
    return '- [%s] 【en】%s ｜【zh】%s' % (tag, md(e['en']), md(e['zh'])), e

# ---------------- selection ----------------
S = []  # (heading, intro, items)

S.append((
 '一、任务指挥台词（Mission Control 风格）',
 '用于任务简报、任务播报、成就/失败结算弹窗与老板（管理层）口吻的系统通知。播报腔+职场压榨梗，适合做全局通知栏与任务开始/结束的语音条。',
 [8, 1, 28, 35, 37, 38, 39, 45, 47, 48, 49, 50, 55, 21, 32, 54, 67, 70, 73, 77,
  91, 101, 104, 120, 130, 152, 164, 168, 178, 180, 137, 139, 142, 147, 61, 59,
  90, 98, 118, 124]))

S.append((
 '二、虫潮与危险警告',
 '用于虫潮来袭、事件警报、倒计时警示等高强度提示场景；短促、可大喊，适合做红色横幅与警报音效文案。',
 [245, 258, 264, 270, 272, 277, 282, 286, 289, 291, 293, 294, 302, 303, 305,
  306, 322, 337, 365, 374, 377, 380, 396, 400, 418]))

S.append((
 '三、事件素材：洞穴水蛭 / 捕手蝇 / 掠夺虫 / 矿骡 M.U.L.E. / 莫莉 Molly',
 '用于随机事件与决策弹窗：矿工被水蛭/捕手抓住时的"救援还是放弃"抉择、掠夺虫掉落彩蛋、矿骡遗失/维修事件。每小节括注了用途。',
 [
  # cave leech (8)
  524, 536, 540, 542, 544, 545, 546, 550,
  # grabber (7)
  551, 552, 555, 556, 559, 560, 561,
  # lootbug (10)
  562, 564, 565, 566, 567, 571, 585, 591, 595, 597,
  # M.U.L.E. (10)
  600, 612, 614, 616, 624, 627, 640, 648, 658, 663,
  # Molly (10)
  749, 750, 751, 756, 758, 759, 764, 777, 780, 783,
 ]))

S.append((
 '四、公司公告体（PSA / 管理层公文体）',
 '用于管理层公告栏、每日贴士、登顶推送与邮件通知。官方 PSA 的精髓是：一本正经的公文腔 + 离谱的太空矿工日常 + 最后必署名 Management。仿写时保持"冷漠关怀+推卸责任"的语感。',
 [794, 796, 799, 801, 804, 808, 809, 812, 816, 821, 823, 826, 838, 842, 848]))

S.append((
 '五、深渊酒吧：酒名与酒话',
 '酒名用于酒吧/商店物品表，酒话用于点单、喝醉状态（画面摇晃）与酒吧事件。叶子情人特调（Leaf Lover\'s Special）是"叛徒酒"梗，可做惩罚道具。酿造原料可做酒吧升级材料。',
 [
  # names
  852, 853, 854, 855, 856, 858, 859, 860, 862, 863, 867, 2039,
  "Dark Morkite", "Leaf Lover's Special", "Pots O' Gold", "Canary Dew",
  "Toothgrinder", "Rocky Mountain", "Randoweisser", "Underhill Deluxe",
  "Malt Rockbearer", "The Abyss Bar",
  # descriptions & orders
  873, 881, 883, 884, 889, 891, 898, 900, 902, 932, 957, 958,
  964, 965, 966, 967, 1218, 1351, 1462, 1488, 1548, 1455, 1266, 1547, 802,
  "(whispering) Can I have a Leaf Lover's Special?",
  "One Leaf Lover - and can I get it thinned with some water?",
  "Last one to finish is a pointy eared leaf lover!",
  "What are you, a bloody leaf lover?",
  "A round of Golden Pots, please.",
  "Round of Rodents, please!",
  "A round of Underhills, please!",
  # brewing ingredients
  907, 909, 910, 911,
 ]))

S.append((
 '六、口号系统：Rock and Stone（挖到手软，赚到盆满）',
 '官方中文将 Rock and Stone 定译为"挖到手软，赚到盆满"。用于点赞/打招呼按钮、结算法语、登录欢迎语。矮人对口号的执念本身就是笑点，可做连喊彩蛋。',
 [970, 969, 972, 974, 975, 976, 979, 980, 983, 984, 988, 992, 995, 999, 1000,
  1001, 1002, 1011, 1013, 1014, 1015, 1017, 1019, 1021, 1023, 1024, 1027, 1032, 1033]))

S.append((
 '七、晋升、辞退与退休',
 '晋升文案用于员工升级仪式与晋升终端；"离开公司/退休/被开除"文案是管理层辞退信的最佳仿写模板——先致哀、再算账、最后 Rock and Stone。',
 # promotion & leaving (15)
 [1059, 1067, 1071, 1081, 1089, 1096, 1098, 1099, 1105, 1097, 1118, 1110, 1125, 1138, 1035,
  # retirement / fired extras
  "Fires", "Pensioner's Delight", "Retirement, here I come, ready or not!",
  "Whew... only 139 more years 'til I can retire!",
  "I am deducting the cost of that missile from your paycheck. There goes your retirement.",
  "Congratulations, Miner! You have fullfilled your duties to Deep Rock Galactic, and you are free to retire when you wish it. Be proud - very few dwarves live long enough to experience this."]))

S.append((
 '八、设施与终端名（太空钻台 Space Rig）',
 '用于主基地/空间站界面、建筑解锁列表与场景指引。 terminal 类名词可直接映射为游戏里的功能建筑；纪念堂、深渊酒吧适合做仪式感场景。',
 [1153, 1162, 1145, 1167, 1154, 1148, 1149, 1157, 1200, 1186, 1206, 1181, 1179,
  1381, 1401, 1382, 1378, 1594, 1327, 1433, 1636, 1346, 1321, 1434, 1423, 1767,
  230, 1587, 1486]))

S.append((
 '九、异动核心专属（Rogue Core / RC）',
 '复拓者（Reclaimer）称呼、核生兽（Core Spawn）怪名、战镐升铸（Ascension）晋升仪式、功绩点（Merit）与菁砚石（Expenite）货币。用于续作风格的进阶系统、新怪图鉴与二级货币。',
 [
  # Reclaimer (12)
  1653, 1655, 1658, 1665, 1666, 1669, 1672, 1674, 1677, 1689, 1700, 1702,
  # Core Spawn (10 + 4 creature names)
  1709, 1712, 1722, 1725, 1748, 1749, 1751, 1754, 1755, 1761, 1706, 1707, 1714, 1727,
  # Ascension (12)
  1763, 1767, 1768, 1770, 1782, 1796, 1797, 1800, 1802, 1806, 1813, 1815,
  # Merit (7, 全部有效条目)
  1816, 1817, 1819, 1820, 1821, 1822,
  "While workplace safety is our top priority, the greatest benefit of these Security Cameras is to protect the Company against internal losses and wage theft. All Reclaimers are bound by Contract Clause \u00a7208 to never disclose any data that may or may not be present on these devices, under penalty of demerit, pay reduction and eventual imprisonment.",
  # Expenite (12)
  1823, 1826, 1830, 1832, 1844, 1852, 1861, 1864, 1868, 1873, 1877, 1881,
 ]))

S.append((
 '十、杂项金句与彩蛋',
 '从两万余条语料里捞出来的短金句：公司标语、酒话醉话、官僚冷笑话与 AI 碎碎念。适合做加载提示、新闻滚动条、成就名与随机彩蛋。',
 [1270, 1281, 1313, 1361, 1599, 1627, 1546, 1454, 1620, 1612, 429, 493, 517,
  1027, 620, 698, 780, 1435, 1465, 62]))

# ---------------- write ----------------
out = io.StringIO()
w = out.write
w('# DRG 模拟运营小游戏 · 文案素材库\n\n')
w('> **使用说明**：本素材库全部摘自《深岩银河：幸存的矮人们》(Deep Rock Galactic, 下称 DRG) 与《深岩银河：异动核心》(Rogue Core, 下称 RC) 的**游戏官方本地化文本**（由官方 locres 提取的中英对照表，两份共约 3.5 万行，去重后 %d 组），仅供本项目（DRG 题材模拟运营网页游戏）内部撰写文案时参考引用，请勿用于其他商业用途。\n>\n' % len(pool))
w('> - 条目格式：`[来源·命名空间] 【en】英文原文 ｜【zh】官方中文`。`DRG` / `RC` 为出处游戏，其后为引擎命名空间（无则省略）。\n')
w('> - `{Person}`、`{Resource}`、`{value}` 等为游戏内占位符，使用时请自行替换。\n')
w('> - 文本尽量保留原味（含醉话、错拼、语气词）；原文中的着色标记（如 `<highlight>`）已剔除。\n')
w('> - 每节开头的"用途建议"为本项目整理，其余中英文本均为官方原文。\n\n')
w('目录：%s\n\n' % ' ／ '.join(h.split('、')[0] + '、' + re.sub(r'（.*?）', '', h).split('、', 1)[1] for h, _, _ in S))

counts = []
for idx, (heading, intro, items) in enumerate(S, 1):
    w('## %s\n\n' % heading)
    w('**用途建议**：%s\n\n' % intro)
    used = set()
    n = 0
    for it in items:
        line, e = render(it)
        key = (e['en'], e['zh'])
        if key in used:
            continue
        used.add(key)
        w(line + '\n')
        n += 1
    w('\n')
    counts.append((heading, n))

w('---\n\n')
w('## 收录统计\n\n')
w('| 类目 | 条数 |\n|---|---|\n')
for h, n in counts:
    w('| %s | %d |\n' % (h, n))
w('| **合计** | **%d** |\n' % sum(n for _, n in counts))

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(out.getvalue())

for h, n in counts:
    print('%d  %s' % (n, h))
print('TOTAL', sum(n for _, n in counts))
print('written:', OUT)
