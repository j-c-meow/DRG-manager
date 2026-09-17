# -*- coding: utf-8 -*-
"""Scan DRG/RC TSV files, parse broken multi-line rows, extract candidate lines per category."""
import io, re, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

FILES = [
    ("DRG", r"D:\模拟运营小游戏\资料\raw\DRG_文本全量_en_zh.tsv"),
    ("RC",  r"D:\模拟运营小游戏\资料\raw\RC_文本全量_en_zh.tsv"),
]
KEYRE = re.compile(r'^[0-9A-F]{32}$')
BANNED = ('猫八', '猫猫爱吃')

def parse(path):
    """Return list of [src, ns, key, en, zh]. Handles rows broken by raw newlines in en/zh."""
    recs = []
    with open(path, encoding='utf-8') as f:
        lines = f.read().split('\n')
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        parts = line.split('\t')
        if len(parts) >= 4:
            recs.append(['', parts[0], parts[1], parts[2], parts[3]])
            i += 1
            continue
        if len(parts) == 3 and parts[0] == '' and KEYRE.match(parts[1] or ''):
            key = parts[1]
            i += 1
            en_acc, zh_acc = [], []
            stage = 'en'  # en -> (zhstart|zh)
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
            recs.append(['', '', key, '\n'.join(en_acc), '\n'.join(zh_acc)])
            continue
        i += 1
    return recs

def clean(s):
    s = s.replace('\r', ' ').replace('\n', ' / ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

pool = []          # entries: dict(id, src, ns, en, zh)
seen = set()
for tag, path in FILES:
    for rec in parse(path):
        if len(rec) == 5:
            src, ns, key, en, zh = rec
        else:
            _, ns, key, en, zh = rec
            src = tag
        src = tag
        en, zh = clean(en), clean(zh)
        if not en or not zh:
            continue
        if any(b in zh for b in BANNED):
            continue
        k = (en, zh)
        if k in seen:
            continue
        seen.add(k)
        pool.append({'src': src, 'ns': ns, 'key': key, 'en': en, 'zh': zh})

print("pool size (deduped):", len(pool))

# ---------- category filters ----------
def has(e, pat, flags=re.I):
    return re.search(pat, e['en'], flags) is not None

cats = {}

# 1 Mission Control
c1 = [e for e in pool if has(e, r"miners!|alright,? miners|\battention\b|get to it\b|\bmanagement\b") and len(e['en']) <= 200]
cats['1'] = sorted(c1, key=lambda e: (len(e['en']), e['en']))

# 2 swarm / danger warnings
c2 = [e for e in pool if has(e, r"\bswarm|\bincoming\b|\bwarning\b|\bthreat\b") and len(e['en']) <= 220]
cats['2'] = sorted(c2, key=lambda e: (len(e['en']), e['en']))

# 3 events
c3 = {}
c3['caveleech'] = [e for e in pool if has(e, r"cave leech") and len(e['en']) <= 220]
c3['grabber']   = [e for e in pool if has(e, r"grabber") and len(e['en']) <= 220]
c3['lootbug']   = [e for e in pool if has(e, r"loot ?bug|huuli") and len(e['en']) <= 220]
c3['mule']      = [e for e in pool if has(e, r"M\.?U\.?L\.?E") and len(e['en']) <= 200]
c3['molly']     = [e for e in pool if has(e, r"\bMolly\b") and len(e['en']) <= 200]
cats['3'] = {k: sorted(v, key=lambda e: (len(e['en']), e['en'])) for k, v in c3.items()}

# 4 PSA
c4 = [e for e in pool if (has(e, r"\bPSA\b") or e['en'].startswith(('Management', ' management'))) and len(e['en']) <= 260]
cats['4'] = sorted(c4, key=lambda e: (len(e['en']), e['en']))

# 5 beer: names + descriptions
namepat = r"\b(ale|ales|stout|porter|lager|brew|brews|bock|pilsner|cider|weiss|weizen|mead|bitter|special brew)\b"
c5names = [e for e in pool if has(e, namepat) and len(e['en']) <= 55]
brew_ns = [e for e in pool if 'brew' in e['ns'].lower()]
c5desc = [e for e in pool if has(e, r"\b(bitter|ale|drink|drinks)\b") and 25 <= len(e['en']) <= 180]
cats['5'] = {'names': sorted(c5names, key=lambda e: (len(e['en']), e['en'])) + brew_ns,
             'desc': sorted(c5desc, key=lambda e: (len(e['en']), e['en']))}

# 6 rock and stone
c6 = [e for e in pool if has(e, r"rock and stone|rock[\w !]*stone") or '挖到手软' in e['zh']]
cats['6'] = sorted(c6, key=lambda e: (len(e['en']), e['en']))

# 7 promotion / termination
c7 = [e for e in pool if has(e, r"\bpromotion|\bpromoted|leave the company|termination|terminated|dismissal|fired\b") and len(e['en']) <= 240]
cats['7'] = sorted(c7, key=lambda e: (len(e['en']), e['en']))

# 8 space rig facilities
fac_terms = (r"space rig|medbay|medical|memorial hall|the forge|forge|equipment terminal|resource terminal"
             r"|terminal|jukebox|lloyd|launch bay|drop pod|drill pod|spaceport|undercroft|medstation"
             r"|advertising|assignment|career|holo|mapper|training|infirm")
c8 = [e for e in pool if has(e, fac_terms) and len(e['en']) <= 60]
c8long = [e for e in pool if has(e, fac_terms) and 60 < len(e['en']) <= 160]
cats['8'] = {'short': sorted(c8, key=lambda e: (len(e['en']), e['en'])),
             'long': sorted(c8long, key=lambda e: (len(e['en']), e['en']))}

# 9 rogue core terms
c9 = {}
for term, pat in [('reclaimer', r"reclaimer"), ('corespawn', r"core spawn|corespawn"),
                  ('ascension', r"ascension"), ('merit', r"\bmerit"), ('expenite', r"expenite")]:
    v = [e for e in pool if has(e, pat) and len(e['en']) <= 220]
    c9[term] = sorted(v, key=lambda e: (len(e['en']), e['en']))
cats['9'] = c9

# 10 misc punchy pool (for manual curation)
c10 = [e for e in pool if 12 <= len(e['en']) <= 90 and re.search(r'[!?]', e['en'])
       and not re.search(r'<|{|%|\bmod\b|setting|keybind|click|press|unlock|disabled|enable', e['en'], re.I)]
c10 = sorted(c10, key=lambda e: (len(e['en']), e['en']))
cats['10'] = c10[:500]

# ---------- write candidates ----------
out = io.StringIO()
def w(s=''):
    out.write(s + '\n')

gid = 0
idmap = {}  # (cat, sub, idx) -> global id
def dump(title, entries, cap):
    global gid
    w('#### ' + title + '  (candidates: %d)' % min(len(entries), cap))
    for i, e in enumerate(entries[:cap]):
        ns = e['ns'] if e['ns'] else '-'
        w('[#%05d] [%s|%s] (%d) %s ||| %s' % (gid, e['src'], ns, len(e['en']), e['en'], e['zh']))
        idmap[gid] = e
        gid += 1
    w()

w('POOL TOTAL: %d   (entries below carry global ids for selection)' % len(pool))
w()
w('#### CAT1 MissionControl')
dump('CAT1 mission-control', cats['1'], 300)
dump('CAT2 swarm-warning', cats['2'], 300)
dump('CAT3a cave-leech', cats['3']['caveleech'], 100)
dump('CAT3b grabber', cats['3']['grabber'], 100)
dump('CAT3c lootbug', cats['3']['lootbug'], 100)
dump('CAT3d MULE', cats['3']['mule'], 150)
dump('CAT3e Molly', cats['3']['molly'], 150)
dump('CAT4 PSA', cats['4'], 250)
dump('CAT5a beer-names', cats['5']['names'], 400)
dump('CAT5b beer-desc', cats['5']['desc'], 250)
dump('CAT6 rock-and-stone', cats['6'], 400)
dump('CAT7 promotion-termination', cats['7'], 250)
dump('CAT8a facility-short', cats['8']['short'], 400)
dump('CAT8b facility-desc', cats['8']['long'], 200)
dump('CAT9a reclaimer', cats['9']['reclaimer'], 60)
dump('CAT9b core-spawn', cats['9']['corespawn'], 60)
dump('CAT9c ascension', cats['9']['ascension'], 60)
dump('CAT9d merit', cats['9']['merit'], 60)
dump('CAT9e expenite', cats['9']['expenite'], 60)
dump('CAT10 misc-punchy', cats['10'], 500)

with open(r"D:\模拟运营小游戏\资料\素材候选.txt", 'w', encoding='utf-8') as f:
    f.write(out.getvalue())

print("candidate ids:", gid)
print("wrote candidates file")
print("counts: cat1=%d cat2=%d cat3=%s cat4=%d cat5n=%d cat5d=%d cat6=%d cat7=%d cat8s=%d cat8l=%d cat9=%s cat10=%d" % (
    len(cats['1']), len(cats['2']), {k: len(v) for k, v in cats['3'].items()}, len(cats['4']),
    len(cats['5']['names']), len(cats['5']['desc']), len(cats['6']), len(cats['7']),
    len(cats['8']['short']), len(cats['8']['long']), {k: len(v) for k, v in cats['9'].items()}, len(cats['10'])))
