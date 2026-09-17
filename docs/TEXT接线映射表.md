# TEXT 接线映射表（B 产出 · 给 A 的替换施工图）

> 用途：把 游戏.html 现存硬编码中文逐条替换为 TEXT 键（键定义在 `游戏文案包.md` v1.2，193 键，TEXT 常量已可提取注入）。
> 用法：`TEXT.<键>` 直取；含占位符的键用 `.replace("{miner}", ...)` 或正则 `/\{(\w+)\}/g` 全局替换（占位符约定见文案包 §一.2）。
> 范围：A 指定的 ①主界面各区 ②KPI ③医疗站 ④结算弹窗 ⑤egg_settle。**表外硬编码（任务板条款/日志腔/交易站等）本表未覆盖的，属下期扩表范围，先不动。**

---

## 一、Header（renderHeader @125048）

| 位置（函数+现行片段） | TEXT 键 | 占位符替换说明 |
|---|---|---|
| renderHeader：`季 墨菱石 `（KPI 进度行） | `ui_kpi_title` → 不适用；此行用 `kpi_issue_*` 的前半? **否** —— KPI 进度行无对应键，**新增键** `ui_kpi_progress`（见文末"缺口键清单"） | {done}/{quota} |
| renderHeader：`（可领取奖金！）` | **新增键** `ui_kpi_claimable`（缺） | {reward} |
| renderHeader：`稀有矿物`（折叠头） | **新增键** `ui_rares_label`（缺） | — |
| renderHeader：`任务概率掉落，用于凭证与矿工成长` | **新增键** `ui_rares_tip`（缺） | — |

> Header 区现无 ui_main_title 接入：`17号太空钻台` 若是 HTML 静态写死，替换为 `TEXT.ui_main_title`；副标题接 `TEXT.ui_main_sub`，欢迎语接 `TEXT.ui_main_welcome`，滚动条接 `TEXT.ui_ticker_default`。

## 二、任务板（renderBoard @126467）

| 位置 | TEXT 键 | 说明 |
|---|---|---|
| `任务板空空如也，点上方刷新。` | `ui_mission_empty` | 直替 |
| `派遣`（按钮 ×2） | `ui_deploy_btn` | 直替 |
| 派遣确认弹窗标题（若写死"派遣确认"） | `ui_deploy_title` / `ui_deploy_sub` | sub 无占位符 |
| 确认/取消按钮 | `ui_deploy_btn` / `ui_deploy_btn_cancel` | 直替 |
| `（深度档 …）` | 无对应键，暂留 | 下期扩表 |

## 三、派遣中列表（renderDeps @127745）

| 位置 | TEXT 键 | 说明 |
|---|---|---|
| `当前没有进行中的派遣。矿工在酒吧待着，钱在集团账上待着。` | **新增键** `ui_deps_empty`（缺） | 直替 |
| `⚡ 等待管理层决策` | **新增键** `ui_deps_event`（缺） | 直替 |
| `处理事件`（按钮） | **新增键** `ui_deps_event_btn`（缺） | 直替 |
| `　剩余 `（进度） | 无对应键，暂留 | — |

## 四、名册（renderRoster @128806）

| 位置 | TEXT 键 | 说明 |
|---|---|---|
| `在册 … / 4 人。一个任务可派多名矿工协作：简单单单人，困难组队满编。` | **新增键** `ui_roster_cap`（缺） | 直替（数字拼接保留） |
| 名册面板标题（若写死"员工终端"） | `ui_roster_title` + `ui_roster_sub` | 直替 |
| `可招募` / `需要钻井平台 Lv.` | `ui_recruit_btn` / 无键暂留 | — |
| `招募`（按钮） | `ui_recruit_btn` | 直替 |

## 五、深渊酒吧（renderBar @139753）

| 位置 | TEXT 键 | 说明 |
|---|---|---|
| 面板标题 | `ui_bar_title` + `ui_bar_sub` | 直替 |
| `请全员的每一轮酒按人头计费——集团不报销。` | 已并入 ui_bar_sub 语义，替换后删原句 | — |
| `🔒 酒吧 Lv.… 解锁` | **新增键** `ui_bar_locked`（缺） | {lv} |
| 请客按钮 | `ui_bar_btn_treat` | 直替 |
| `打烊`（若有） | `ui_bar_btn_close` | 直替 |
| 酒名/描述（DRINKS 数组 d 字段） | 酒名保留数组数据源；描述可迁 `egg_bar_1/2` 轮换 | — |

## 六、医疗站（renderMed @140825 + hurt/discharge 流程）

| 位置 | TEXT 键 | 说明 |
|---|---|---|
| 面板标题 | `ui_med_title` + `ui_med_sub` | 直替 |
| `当前没有伤员。医疗站机器人 Lloyd② 在打瞌睡。` | **新增键** `ui_med_empty`（缺） | 直替 |
| `休养中，还剩 … 游戏分钟` | **新增键** `ui_med_resting`（缺） | {days}（此处单位是游戏分钟，建议键文写"游戏分钟"） |
| `加急治疗（-…）`（按钮） | **新增键** `ui_med_express`（缺） | — |
| 重伤入院通知（hurt 函数 log） | `med_notice` | {miner} |
| 账单生成（hurt 函数 log） | `med_bill` | {cost} + {days} |
| 出院小结（discharge log） | `med_discharge` | {days} |
| 医疗站轮播（面板底部，若有） | `med_psa` / `med_pain` | 直替 |

## 七、装备终端 / 精英支援位（renderGear @131423）

| 位置 | TEXT 键 | 说明 |
|---|---|---|
| 面板标题 | `ui_gear_title` + `ui_gear_sub` | 直替 |
| `武器凭证用官方矿物升级：…每职业 3 级。每把武器可装配 1 个模组…` | **新增键** `ui_gear_note`（缺）；或保留（内容与键文不一致，文案包 ui_gear_sub 是另一句） | 二选一 |
| 精英区标题 | `ui_elite_title` + `ui_elite_sub` | 直替 |
| 精英 `调令`（购买按钮） | `ui_elite_btn` 是"上阵"→ 购买按钮建议 **新增键** `ui_elite_btn_hire`（缺） | — |
| 精英 `随队`（携带按钮） | **新增键** `ui_elite_btn_carry`（缺，对应 B-6 el_ui_btn_carry——**建议直接把 B-6 的 `el_*` 12 键并入 TEXT**，深潜同款处理） | 见 B-6 文档 §六 |
| `功绩点`（价格显示） | 保留数据拼接；文案键 `ui_elite_locked`（B-6）用于未解锁提示 | — |

## 八、钻井平台（renderRig @141859）

| 位置 | TEXT 键 | 说明 |
|---|---|---|
| 面板标题 | `ui_rig_title` + `ui_rig_sub` | 直替 |
| `升级至 Lv.…`（按钮） | `ui_rig_btn`（"升级"）+ 数字保留 | — |
| `当前效果：墨菱石产量 ×…` | **新增键** `ui_rig_effect`（缺） | {mul} |
| 升级完成 log | `egg_rig_1` / `egg_rig_2` 轮换 | 直替 |

## 九、深潜终端（renderDive @154397 + dive 流程）

| 位置 | TEXT 键 | 说明 |
|---|---|---|
| `🔒 深潜终端需任一矿工晋升 ★1 解锁。当前最高资历 ★…` | `dd_ui_locked`（dd_* 32 键已在深潜系统设计 §八） | 星数拼接 |
| `本周 …｜四职业满编强制｜…` | `dd_ui_sub` 语义近似；规则行建议 **新增键** `dd_ui_rules`（缺） | — |
| `本周修正器（普通/精英）：…` | `dd_ui_brief_mod` | {mods} |
| 开潜按钮 | `dd_ui_btn_launch` | 直替 |
| 重打（中止后） | `dd_ui_btn_retry` | 直替 |
| 段开闸 log | `dd_stage{n}_start_a/b` 轮换 | 直替 |
| 段通关 log | `dd_stage{n}_clear_a/b` 轮换 | 直替 |
| 中止 log（diveSettle aborted） | `dd_fail_a/b` 轮换 | 直替 |
| 驳回 log（士气<25） | `dd_fail_a/b` 轮换（或新增专用键） | — |
| 通关大额 log | `dd_clear_a/b` | 直替 |
| 跨周作废提示 | `dd_expire_a/b` | 直替 |
| 精英锁定行 | `dd_elite_locked` | 直替 |
| 精英通关 log | `dd_elite_clear` | 直替 |
| `深潜需四职业满编（缺员含住院不可开潜）` | `dd_squad_full` | 直替 |

> **dd_* 32 键尚未并入 TEXT 常量**（在 深潜系统设计.md §八，Object.assign 块）。A 注入时把该块与 TEXT 主块一并粘贴即可（两块相加 193+32=225 键，无冲突，体检已验证）。

## 十、结算弹窗（settle @109050）+ KPI（claimKPI @124044）

| 位置 | TEXT 键 | 说明 |
|---|---|---|
| 结算标题/副标题 | `ui_settle_title` + `ui_settle_sub`（成功）/ `ui_settle_sub_fail`（失败） | 直替 |
| 结算按钮 | `ui_settle_btn` | 直替 |
| 弹窗底部趣味语 | **`egg_settle_1~5` 随机抽 1**，与 ui_settle_sub 并列一行小字 | 直替 |
| KPI 达成 log（claimKPI） | `kpi_success_1/2/3` 随机抽 1 | {reward}（{quota} 若文本含） |
| KPI 失败 log | `kpi_fail_1/2/3` 随机抽 1 | {quota} |
| 季初下达 log（季度翻转处） | `kpi_issue_1/2/3` 随机抽 1 | {quota} + {reward} |
| KPI 终端标题 | `ui_kpi_title` + `ui_kpi_sub` | 直替 |

## 十一、系统面板（renderSys @143264）

| 位置 | TEXT 键 | 说明 |
|---|---|---|
| `存档`（标题） | `ui_settings_title` | 直替 |
| 绑定/写入/恢复/导出/导入按钮 | **新增键** `ui_save_btn_folder` / `ui_save_btn_write` / `ui_save_btn_restore` / `ui_save_btn_export` / `ui_save_btn_import`（缺） | 直替 |
| 存档成功 log | `ui_save_ok` | 直替 |
| 存档中警告 | `ui_save_warn` | 直替 |
| 重置确认 | `ui_settings_reset_confirm` | 直替 |

## 十二、离线回归（catchUpTick @162868）

| 位置 | TEXT 键 | 说明 |
|---|---|---|
| `欢迎回来，管理层。你离开了 … 小时，钻台以 10% 效率运转完毕。` | `ui_offline_title`（面板标题）+ **新增键** `ui_offline_msg`（缺，正文含 {hours}） | {hours} |
| 归队按钮 | `ui_offline_btn` | 直替 |

---

## 缺口键清单（建议 v1.3 补 17 键，B 可在收到 A 确认后 10 分钟出）

`ui_kpi_progress` / `ui_kpi_claimable` / `ui_rares_label` / `ui_rares_tip` / `ui_deps_empty` / `ui_deps_event` / `ui_deps_event_btn` / `ui_roster_cap` / `ui_bar_locked` / `ui_med_empty` / `ui_med_resting` / `ui_med_express` / `ui_gear_note` / `ui_elite_btn_hire` / `ui_rig_effect` / `ui_save_btn_*`（5 合 1 算 5）/ `ui_offline_msg`
→ **缺口键已全部补入文案包 v1.3**（2026-09-13 23:10，214 键，node 验证无重复）。另：`dd_*`（32）与 `el_*`（12）两块 Object.assign 待并入 TEXT（来源：深潜系统设计 §八 / 精英支援位系统 §六），并入后 TEXT 总量 = 214+32+12 = **258 键**。

## 施工提示（给 A）

1. **替换优先级**：先接 §十（结算+KPI，玩家每次必看）→ §一 Header → §九 深潜 → 其余面板。
2. `egg_settle_*` 抽取：`const tips=[TEXT.egg_settle_1,...TEXT.egg_settle_5]; tips[Math.floor(Math.random()*5)]`。
3. `kpi_*` 三组各自独立随机，同季不重复可用简单 shuffle。
4. log() 腔调用点（diveHurtCheck/diveSettle 等流程性文案）在 §九 已列，替换时保留数字拼接的模板槽位。
5. 本表未覆盖的硬编码（任务板条款、日志腔、交易站、战役面板、测试协议彩蛋）不要顺手替换——等下期扩表，防止文案口径不一致。


---

## 二期扩表（v1.4，2026-09-14；53 键已全部入 文案包 v1.4 / TEXT注入包.js 311 键）

### A. 交易站（renderMarket）
| 现行片段 | TEXT 键 | 占位符 |
|---|---|---|
| `手续费 5% · 涨跌停 ±10%` | ui_market_note | — |
| `今日市场：…涨 / …跌` | ui_market_today | {ups}/{downs} |
| `持有 …　净值 … 代币` | ui_market_hold | {n}/{v} |
| `买 10（…）` / `买 50（…）` / `卖 10（…）` | ui_market_buy10 / buy50 / sell10 | {cost}/{gain} |
| `清仓` | ui_market_sellall | — |
| log `交易站卖出…集团免责` | log_market_sell | {k}/{qty}/{gain} |

### B. 战役面板（renderCampaign）
| 现行片段 | TEXT 键 | 占位符 |
|---|---|---|
| `📋 下一场战役【…】…憋大招` | ui_camp_next | {name}/{day}/{today} |
| `📋 战役【…】` | ui_camp_now | {name} |
| 进度行 | ui_camp_prog | {txt}/{prog}/{need}/{reward} |
| `📋 战役终端　队列已空…` | ui_camp_empty | — |
| `战役与活动（点击收起/展开）` | ui_camp_fold | — |
| `🎄 节日战役【…】` | ui_camp_hol_now | {name} |
| `派遣一次任务即可自动开启。` | ui_camp_hol_open | — |
| log `✔ 战役目标完成：` / `🏆 战役【…】通关！` / `新战役下达：【…】` / `队列已空…` | log_camp_done / clear / new / empty | {goal}/{name} |

### C. 任务板条款
| `条款【…】…`（任务卡+派遣弹窗） | ui_board_clause_wrap | {name}/{desc}（条款内容属数据层 m.clause，不映射） |

### D. 每日简报/关怀/开局/存档/系统/饰品模组精英（log 腔 38 键，直替）
- 简报与关怀：log_daily（{day}/{missions}/{credits}/{morkite}/{injured}/{market}）、log_care
- 开局：log_welcome / log_tip_first / log_recruit / log_manager_new
- 存档 11：log_save_export / import_ok / import_ver / import_bad + log_bind_unsupported / bind_ok / bind_fail / bind_none + log_restore_ok / restore_ver / restore_fail
- 系统设施 9：log_nitra / log_blanks / log_merit / log_rig_lv / log_bar_lv / log_med_lv / log_bar_round / log_time_speed / log_board_refresh
- 饰品/模组/精英 7：log_trinket_off / trinket_on、log_mod_off / mod_in / mod_dup、log_elite_hire / elite_all

### E. 不映射项
- 五类事件结果日志 → **复用现有 ev_* 键**（ev_swarm_a_win 等），零新增
- 测试协议（jcmeowiscat/iriscat）log → 调试输出，不映射
- 注入：直接使用 `资料\TEXT注入包.js`（311 键成品，已含本期全部新键）
