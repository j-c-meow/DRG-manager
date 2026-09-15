# PWA 手机素材（会话 C 交付 · 2026-09-13）

全部素材取自游戏内已有官方提取件（`assets/icons/class_*.png` 官方职业徽章），无新画造型。单张均 ≤100KB。

| 文件 | 尺寸 | 用途 |
|---|---|---|
| `icon-192.png` | 192×192 | manifest `"icons"` 项（Android/桌面） |
| `icon-512.png` | 512×512 | manifest `"icons"` 项 + 启动画面源 |
| `apple-touch-icon-180.png` | 180×180 | iOS `<link rel="apple-touch-icon">`（附赠） |
| `splash.png` | 1920×1080 | 游戏内加载/启动屏（可做 PWA `background_color` 上的居中图或 loading div） |

## A 接线参考

`manifest.webmanifest`（与 游戏.html 同目录或路径相应调整）：

```json
{
  "name": "深岩银河 · 17号钻台管理终端",
  "short_name": "17号钻台",
  "start_url": "./游戏.html",
  "display": "standalone",
  "background_color": "#0c1116",
  "theme_color": "#0c1116",
  "icons": [
    { "src": "assets/pwa/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "assets/pwa/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

`游戏.html <head>` 增补：

```html
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="assets/pwa/apple-touch-icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="17号钻台">
```

说明：
- 图标四象限即官方四职业徽章，象限底色 = 各职业官方主色极暗版；`purpose: "any maskable"` 已按安全区设计（徽章居中，圆形裁切只切到象限底色不切徽章主体）。
- 启动画面口号 **"挖到手软，赚到盆满！"** 为 Rock and Stone! 官方中文（locres 61 处直证）。
- 再生成：`D:\SPSS\Python3\python.exe assets\anim\_tools\gen_pwa.py`（可重跑）。
