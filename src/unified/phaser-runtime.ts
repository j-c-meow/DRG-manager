import Phaser from 'phaser';

type LegacyGame = {
  initialized?: boolean;
  lastT: number;
  init(): void;
  resize(): void;
  step(now: number): void;
};

type LegacyRoot = Window & {
  DRG?: { game?: LegacyGame };
};

class MissionDriverScene extends Phaser.Scene {
  constructor(private readonly runtime: PhaserMissionRuntime) {
    super('MissionDriver');
  }

  update(time: number): void {
    const game = (window as LegacyRoot).DRG?.game;
    if (!game) return;
    if (!this.runtime.visible) {
      game.lastT = time;
      return;
    }
    game.step(time);
  }
}

export class PhaserMissionRuntime {
  private phaser: Phaser.Game | null = null;
  visible = false;

  attach(): void {
    if (this.phaser) return;
    const canvas = document.getElementById('game');
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('实时任务画布不存在');
    this.phaser = new Phaser.Game({
      type: Phaser.HEADLESS,
      width: 1,
      height: 1,
      audio: { noAudio: true },
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      scene: new MissionDriverScene(this),
    });
    /* 用户实录（09-19）：Phaser 4 对 config 传入的场景实例不保证自动 start——
       场景不 active 则 MissionDriver.update 永不触发，实时任务冻结在第 1 帧（黑屏/没反应）。
       READY 事件后显式启动驱动场景。 */
    const startDriver = (): void => {
      this.phaser?.scene.start('MissionDriver');
    };
    if (this.phaser.isBooted) startDriver();
    else this.phaser.events.once(Phaser.Core.Events.READY, startDriver);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    const game = (window as LegacyRoot).DRG?.game;
    if (visible) game?.init();
    if (!this.phaser) this.attach();
    if (visible) requestAnimationFrame(() => this.resize());
  }

  resize(): void {
    const host = document.getElementById('realtime-app');
    const game = (window as LegacyRoot).DRG?.game;
    if (!host || !game || !this.phaser) return;
    game.resize();
  }

  destroy(): void {
    this.phaser?.destroy(false);
    this.phaser = null;
    this.visible = false;
  }
}
