import { managerBiomes, realtimeBiomeByManagerId, realtimeBiomes, realtimeHazards, SAVE_SCHEMA_VERSION } from './definitions';
import { abortDirectMission, canSettleMission, markMissionSettled, migrateSave, startDirectMission, startDirectMissionFromDep } from './domain';
import { PhaserMissionRuntime } from './phaser-runtime';
import type { MissionResult } from './contracts';

const runtime = new PhaserMissionRuntime();

const definitions = Object.freeze({
  managerBiomes,
  realtimeBiomeByManagerId,
  realtimeBiomes,
  realtimeHazards,
  saveSchemaVersion: SAVE_SCHEMA_VERSION,
});

const unified = Object.freeze({
  definitions,
  domain: Object.freeze({
    migrateSave,
    startDirectMission,
    startDirectMissionFromDep,
    canSettleMission,
    markMissionSettled,
    abortDirectMission,
  }),
  runtime,
  completeMission(result: MissionResult): void {
    window.dispatchEvent(new CustomEvent<MissionResult>('drg:realtime-complete', { detail: result }));
  },
  returnToManager(): void {
    window.dispatchEvent(new CustomEvent('drg:realtime-return'));
  },
});

declare global {
  interface Window {
    __DRG_PHASER_DRIVER: boolean;
    DRGUnified: typeof unified;
    DRG_SHARED: typeof definitions;
  }
}

window.__DRG_PHASER_DRIVER = true;
window.DRGUnified = unified;
window.DRG_SHARED = definitions;

window.addEventListener('load', () => {
  runtime.attach();
}, { once: true });
