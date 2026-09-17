# Deployment

项目构建为纯静态双入口游戏，不需要后端或数据库。

## Build

```bash
npm ci
npm run build
```

`dist/` 是唯一部署目录：

```text
dist/
├── index.html
├── realtime/index.html
├── scripts/
├── styles/
├── assets/
├── manifest.webmanifest
└── sw.js
```

## Cloudflare Workers

```bash
npm run deploy
```

部署配置位于 `wrangler.jsonc`，静态资源目录为 `dist/`。

## Other Static Hosts

先运行 `npm run build`，再把整个 `dist/` 发布到任意静态主机。主入口是 `/`，实时模式入口是 `/realtime/`。服务端必须让 `/realtime/` 返回 `realtime/index.html`。

## Save Data

管理模式和实时模式通过同源 `localStorage` 交换任务请求与结果。更换域名会产生新的存档空间；迁移前应在管理端导出存档。

## Updates

每次发布必须上传完整 `dist/`。Service Worker 缓存版本位于 `src/pwa/service-worker.js`；静态资源变化时同步递增版本。

## Copyright

本项目为非商业粉丝作品，与 Ghost Ship Games 无关。相关素材不得用于商业用途。
