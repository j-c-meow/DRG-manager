# BGM 背景音乐系统（B 产出 · 给 A 的施工单）

> 配乐文件在 `配乐文件\` 目录，已确认两首：
> - `主界面管理终端-矿业码头.mp3`（1.4MB）→ 主界面/派遣/名册等日常场景
> - `酒吧及节日活动用.mp3`（3.8MB）→ 深渊酒吧 tab 激活 / 节日战役横幅出现
> 设计原则：**单文件架构不破坏**——mp3 是外部资产（同 PNG），非外部库；HTML5 Audio API 零依赖。

---

## 一、文件搬移

```
配乐文件\主界面管理终端-矿业码头.mp3  →  assets\audio\bgm_main.mp3
配乐文件\酒吧及节日活动用.mp3        →  assets\audio\bgm_bar.mp3
```

（重命名英文小写，与现有 assets 规范一致。）

## 二、BGM 管理器（A 直接粘贴进 游戏.html script 末尾）

```js
/* ---------------- BGM 背景音乐系统（B-8） ---------------- */
const BGM = {
  audio: null,           // 当前播放的 Audio 对象
  ctx: null,             // 当前场景标识 'main' | 'bar'
  vol: 0.25,             // 默认音量（0~1）
  muted: false,          // 静音开关
  tracks: {
    main: 'assets/audio/bgm_main.mp3',
    bar:  'assets/audio/bgm_bar.mp3'
  },
  init(){
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.volume = this.vol;
    // 浏览器自动播放限制：首次用户交互后启动
    document.addEventListener('click', () => { if(!this.ctx) this.play('main'); }, { once: true });
  },
  play(ctx){
    if(this.muted) return;
    if(this.ctx === ctx && this.audio && !this.audio.paused) return; // 不重复
    if(this.audio){ this.audio.pause(); }
    this.ctx = ctx;
    this.audio = new Audio(this.tracks[ctx]);
    this.audio.loop = true;
    this.audio.volume = 0;               // 淡入
    this.audio.play().catch(()=>{});     // 忽略 autoplay 拦截
    const target = this.vol;
    const fade = setInterval(() => {
      if(this.audio && this.audio.volume < target){
        this.audio.volume = Math.min(target, this.audio.volume + 0.02);
      } else { clearInterval(fade); }
    }, 100);
  },
  stop(){
    if(this.audio){ this.audio.pause(); this.audio = null; this.ctx = null; }
  },
  toggleMute(){
    this.muted = !this.muted;
    if(this.muted){ if(this.audio) this.audio.pause(); }
    else { this.ctx = null; this.play(this.ctx || 'main'); }
    return this.muted;
  }
};
// 启动
BGM.init();
```

## 三、场景切换接线（A 在 renderAll / renderBar 内各加一行）

```js
// renderAll() 末尾追加（主界面场景）：
BGM.play('main');

// renderBar() 末尾追加（酒吧 tab 激活时切酒馆 BGM）：
BGM.play('bar');

// 离开酒吧 tab（切到其他 tab 时也走 renderAll → 自动回主界面曲）
// 节日战役横幅出现时（renderCampaign 内 fest 活跃时）：
BGM.play('bar');   // 节日用酒吧曲
```

## 四、静音按钮（header 加一个 chip）

```html
<!-- header 内加 -->
<button class="btn" id="btn-bgm" style="padding:3px 8px;font-size:12px;" title="音乐开关">🎵</button>
```

```js
// JS 事件绑定（EVENTS BINDING 区域追加）：
document.getElementById('btn-bgm').onclick = () => {
  const muted = BGM.toggleMute();
  document.getElementById('btn-bgm').textContent = muted ? '🔇' : '🎵';
};
```

## 五、验收要点（B 复验清单）

- [ ] 打开页面 → 首次点击后主界面 BGM 播放
- [ ] 切到深渊酒吧 tab → 切为酒吧 BGM（不重复从头开始）
- [ ] 切回名册/任务板 → 切回主界面 BGM
- [ ] 节日战役横幅出现 → 切为酒吧 BGM
- [ ] 🔇 按钮 → 全静音；再点恢复
- [ ] 手机端：iOS Safari 需要用户点击后才能播放（BGM.init 的 once 监听已处理）
- [ ] file:// 协议下 Audio 加载本地 mp3 无跨域问题（同目录相对路径）

## 六、体积与加载

| 文件 | 大小 | 加载策略 |
|---|---|---|
| bgm_main.mp3 | 1.4MB | 浏览器自动预加载（loop=true 触发预加载）；首播可能延迟 1-2 秒，可接受 |
| bgm_bar.mp3 | 3.8MB | 惰性加载（切到酒吧 tab 才 new Audio）；首切延迟 2-3 秒，可接受 |
| 总增量 | 5.2MB | zip 打包后压缩至 ~4.5MB；v1.0 包 1.73MB → 约 6.2MB，局域网/Netlify 均可接受 |

> 如嫌体积大可后续用 ffmpeg 转 OGG（通常减 40%），但首版不做——先跑通再优化。
