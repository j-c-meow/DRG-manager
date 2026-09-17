# 饰品（Trinket）pak 资产调研报告

> 调研日期：2026-09-12 ｜ 工具：`repak.exe list`（只读清点，未解包、未修改任何游戏文件）
> 范围：DRG 主包 `FSD-WindowsNoEditor.pak`（109,868 个文件）、异动核心 `RogueCore-Windows.pak`（108,516 个文件）
> 明细清单：`资料\raw\饰品_pak清单_DRG.txt`（345 KB）、`资料\raw\饰品_pak清单_RC.txt`（137 KB）

---

## 一、核心结论

**两个 pak 里都不存在任何以 "trinket" 命名的资产**（全文大小写不敏感扫描，命中 0 条）。"饰品"在这两作内容里的实际载体是：

| 作品 | "饰品"实际对应体系 | 条目口径 |
|---|---|---|
| DRG | `Character/Vanity2/`（头饰/胡须/涂装等装饰）+ 节日活动 `GameElements/Holidays/` + `Art/Environments/Holiday_*` | Vanity2 共 2,562 个 .uasset，现役装饰约 662 个 |
| 异动核心(RC) | 局内"圣物" **Artifacts**（`Unlocks/Artifacts/` + `Icons_Artifacts/`），其余近似：Enhancements / Alterations / BioBoosters / HeadAccessory | Artifacts 定义 35 个（现役 22），图标 25 个 |

---

## 二、检索方法与原始命中

- 检索词 `trinket`（含 `trink` 词根，大小写不敏感）：DRG **0** 条，RC **0** 条。
- 辅助统计：`seasonal`（DRG 30 / RC 0）、`event`（DRG 3,096 / RC 1,430）、`season`（DRG 5,120 / RC 567 行，含大量 Season 字样 UI）。
- 另查 `charm/relic/amulet/talisman/idol/pendant/keychain/plush` 等候选词，命中的均为洞穴生物（AzureWeald 的 CombaCharm）、废弃站道具（Derelict）等无关内容。
- 每个游戏目录下除主包外仅有用户模组包 `*_Mods.pak`（本调研未涉及）。

## 三、目录结构表

### DRG（FSD-WindowsNoEditor.pak）

| 目录 | .uasset 数 | 内容 |
|---|---|---|
| `FSD/Content/Character/Vanity2/Headwear/InUse` | 161 | 头饰（现役） |
| `.../Vanity2/Armor/Paintjobs_Loose` | 391 | 护甲涂装（散件） |
| `.../Vanity2/Armor/Paintjobs_ArmorDefaults` | 245 | 护甲涂装（默认） |
| `.../Vanity2/Armor/InUse` | 81 | 护甲（现役） |
| `.../Vanity2/Beards/Moustaches/Sideburns/Eyebrows/.../InUse` | 110 | 胡须/髭/鬓角/眉/发色/肤色 |
| `.../Vanity2/Seasons/Season01…Season06` | 各 41~43，共 250 | 赛季装饰（含 Line / TreeOfVanity 子层） |
| `.../Vanity2/VictoryPoses/Released` | 41 | 胜利姿势 |
| `FSD/Content/GameElements/Holidays/` | 64 | 节日活动条目：Easter 23、Xmas 23、Halloween 11、Lunar_NewYear 5、Anniversary 2 |
| `FSD/Content/Art/Environments/Holiday_*` | 1,489 文件 | 7 个节日场景：Xmas 282、Anniversary 280、GreatEggHunt 247、BeachParty 218、LunarFestival 157、Oktoberfest 157、Halloween 148 |
| `FSD/Content/UI/Art/Icons/`（全部） | 1,154 | 图标库（icons_vanityshop 23、icons_gear 101、icons_overclocks 32 等） |
| `FSD/Content/UI/Menu_Seasons/` | 265 | 赛季 UI |
| `FSD/Content/GameElements/Seasons/` | 117 | 赛季玩法数据 |

### 异动核心（RogueCore-Windows.pak）

| 目录 | .uasset 数 | 内容 |
|---|---|---|
| `RogueCore/Content/Unlocks/Artifacts/InUse` | **22** | 现役圣物（Artifact_Bastion、Frenzy、GlassCannon、NuclearGaze、Symbiotic…） |
| `.../Unlocks/Artifacts/NotInUse` | 7 | 未启用（BloodAmmo、CursedMirror、RatBastard…） |
| `.../Unlocks/Artifacts/Prototypes` | 6 | 原型（各属性弹药弹） |
| `.../Unlocks/Artifacts/LogicBonus` | 49 | 圣物逻辑支持（BP_BXE_LogicUnlock_*、PAF_*、STE_*、Elementalist 属性组、CRV_ 曲线） |
| `RogueCore/Content/UI/Art/Icons/Icons_Artifacts/` | 28（=25 图标+3 边框） | 圣物图标；其中 14 个文件名拼写为 `Icon_Artifatcs_*`（官方笔误，检索时注意） |
| `.../Icons/Icons_Enhancements/` | 23 | 强化图标（AmmoPounch 同为官方笔误） |
| `.../Icons/Icons_Alterations/` | 9 | 修正（modifier）图标 |
| `.../Icons/Icons_BioBoosters/` | 58 | 生化强化图标 |
| `.../Icons/Icons_RiskVectors/` | 31 | 风险向量（难度修正）图标 |
| `RogueCore/Content/Character/Vanity2/`（全部） | 1,169 | 装饰体系；新增 `Paintjobs_Reclaimers`（246 文件）与 **`HeadAccessory/InUse` 19 个**（DRG 没有的"头部配件"槽位，最接近传统意义的饰品） |
| `.../GameElements/RewardGivers/Vanity/` | 34 文件 | 装饰箱/化妆箱 BP（VanityChest、CosmeticCrate） |
| `.../GameElements/Seasons/` | 2 | 仅 XP 曲线 + SeasonSettings，**无赛季饰品分组** |
| `.../UI/Menus/OLD_Menu_Seasons/` | 34 | 旧赛季 UI 残留 |

## 四、条目数估计（GameElements 下每个 .uasset ≈ 1 条目口径）

- **DRG trinket 口径：0 个**。若按"装饰件"口径：Vanity2 现役条目 ≈ 662（头饰 161 + 护甲 81 + 胡须系 110 + 赛季装饰 250 + 胜利姿势 41 + 肤发色 19+14）；节日活动条目 64 个。
- **RC trinket 口径：0 个**。最接近的 Artifacts：**现役 22 + 未启用 7 + 原型 6 = 35 个圣物定义**（图标覆盖 25 个）；HeadAccessory 19 个头部配件；BioBooster 图标对应约 50+ 个强化定义。
- 对比结论：**RC 没有独立的 "Trinket" 体系**；其"圣物/强化"类局内品数量（35+ 圣物）远小于 DRG 装饰库（2,562 个 .uasset），两者不可直接互换，是两套命名与目录都不同的体系。

## 五、图标资产（可后续 FModel 导出）

图标全部为 `.uasset + .uexp` 成对的 Texture2D（几乎无 `.ubulk`，mip 内嵌），**FModel 可直接导出为 PNG**。样例 10 条（真实路径）：

1. `RogueCore/Content/UI/Art/Icons/Icons_Artifacts/Icon_Artifact_AdrenalineBooster.uasset`
2. `RogueCore/Content/UI/Art/Icons/Icons_Artifacts/Icon_Artifact_Symbiotic.uasset`
3. `RogueCore/Content/UI/Art/Icons/Icons_Artifacts/Icon_Artifatcs_GlassCannon.uasset`（官方笔误 Artifatcs）
4. `RogueCore/Content/UI/Art/Icons/Icons_Enhancements/Icon_Enhancement_AmmoPounch.uasset`（官方笔误 Pounch）
5. `RogueCore/Content/UI/Art/Icons/Icons_Alterations/Icon_Alteration_DoubleExpenite.uasset`
6. `FSD/Content/UI/Art/Icons/Icons_VanityShop/Vanity_Icons_SunGlasses.uasset`
7. `FSD/Content/UI/Art/Icons/Icons_VanityShop/Vanity_Icons_PickAxe_Head.uasset`
8. `FSD/Content/UI/Art/Icons/Icons_VanityShop/Icon_Sleeveless.uasset`
9. `FSD/Content/UI/Art/Icons/Icons_Specials/`（奖章类，2 个）
10. `FSD/Content/UI/Art/Icons/Icons_Hologram/`（全息饰件，7 个）

## 六、活动/赛季分组线索

- **DRG 有完整节日/赛季分组**：`GameElements/Holidays/{Easter,Xmas,Halloween,Lunar_NewYear,Anniversary}`；场景层 `Holiday_Xmas / Holiday_Anniversary / Holiday_GreatEggHunt / Holiday_BeachParty / Holiday_LunarFestival / Holiday_Oktoberfest / Holiday_Halloween`；赛季装饰 `Vanity2/Seasons/Season01–06` + `UI/Menu_Seasons/Assets/Season01–05`。
- **RC 几乎没有**：仅太空站 `Art/Environments/SpaceRig/HolidayDecor/Holiday_Anniversary`（76 文件）与 2 个 GameElements/Seasons 数据文件；无按活动分组的饰品目录。

## 七、给主会话的建议（FModel 后续导图路径）

1. **RC 圣物图标整目录导出**：`RogueCore/Content/UI/Art/Icons/Icons_Artifacts/`（25 个图标 + 3 边框，一次拿全）；检索时记得兼容 `Icon_Artifatcs_` / `Icon_Artifact_` 两种拼写。
2. **RC 强化类图标**：`Icons_Enhancements/`、`Icons_Alterations/`、`Icons_BioBoosters/`、`Icons_RiskVectors/` 四个目录，可直接当"饰品/强化"图标素材库。
3. **RC 头部配件模型**：`RogueCore/Content/Character/Vanity2/HeadAccessory/InUse`（19 个 .uasset，含网格，可导出渲染图）。
4. **DRG 装饰图标**：`FSD/Content/UI/Art/Icons/Icons_VanityShop/` + `Icons_Gear/`；DRG 赛季装饰模型在 `Character/Vanity2/Seasons/Season01–06`。
5. 导出配置：两包均为 Oodle 压缩（FModel 需挂 `oo2core_9_win64.dll`，项目 `tools\` 已有副本）；DRG 用 FModel 内置 "Deep Rock Galactic" 预设即可，RC 建议手动指定 UE4.25+ 并把映射表 game 弄成 `RogueCore` 根（资产挂在 `RogueCore/Content/` 下）。
6. 若后续游戏更新真加入了 "Trinket" 命名资产（如新赛季/新活动），只需重跑 `repak list` + `findstr /i trinket` 即可增量核对。

---

*本报告与两份清单均由只读清点生成，未对游戏文件做任何解包、修改或移动。*
