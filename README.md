# Deep Rock Galactic Mini Game

《深岩银河》非商业粉丝网页游戏，包含两个互通模式：

- **管理模式**：运营 17 号钻台、派遣矿工、升级设施与处理事件。
- **实时任务**：直接控制矿工下矿，完成采矿、战斗、补给与撤离；结果回写管理存档。

## Development

```bash
npm install
npm run dev
```

打开 Wrangler 输出的本地地址。管理模式位于 `/`，独立实时模式位于 `/realtime/`。

## Build

```bash
npm run build
```

静态发布物生成到 `dist/`。页面源码位于 `src/pages/`，管理端按 `game-data`、`state`、`missions`、`realtime-bridge`、`ui`、`main` 拆分在 `src/manager/`，实时玩法位于 `src/realtime/`，静态资源位于 `public/assets/`。

## Controls

- 移动：`WASD`
- 瞄准 / 射击：鼠标 / 左键
- 挖掘：右键
- 交互 / 存矿：`E`
- 照明弹：`F`
- 呼叫补给：`V`
- 呼叫撤离：`R`
- 职业工具：`Q` / `X`

管理任务板中的“实时下矿”会锁定所选矿工并扣除硝石。完成或失败后返回管理端，奖励、士气和任务统计只结算一次。

## License

本项目是非商业粉丝作品，与 Ghost Ship Games 无关。《Deep Rock Galactic》相关美术、音频、角色和商标归 Ghost Ship Games 所有。合并的参考项目源码许可见 `THIRD_PARTY_LICENSE.txt`。
