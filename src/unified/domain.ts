import { SAVE_SCHEMA_VERSION, realtimeBiomeByManagerId } from './definitions';
import type { DirectMissionRequest, MissionDefinition, MissionResult, UnifiedSaveState } from './contracts';

interface StartDirectMissionInput {
  requestId: string;
  seed: number;
  mission: MissionDefinition;
  miner: { id: string; cls: string; name: string; level: number };
  nitraCost: number;
  now: number;
}

export function migrateSave<T extends UnifiedSaveState>(state: T): T {
  state.schemaVersion = SAVE_SCHEMA_VERSION;
  state.settledRealtime ??= {};
  if (state.realtime && !state.realtime.resolution) state.realtime.resolution = 'direct';
  return state;
}

export function startDirectMission(state: UnifiedSaveState, input: StartDirectMissionInput): DirectMissionRequest {
  if (state.realtime) throw new Error('已有实时任务正在进行');
  const missionIndex = state.board.findIndex(item => item.id === input.mission.id);
  if (missionIndex < 0) throw new Error('任务已不在任务板');
  const miner = state.miners.find(item => item.id === input.miner.id);
  if (!miner || miner.state !== 'idle' || miner.morale < 25) throw new Error('矿工当前不可出勤');
  if (state.nitra < input.nitraCost) throw new Error('硝石不足');

  const realtimeBiome = realtimeBiomeByManagerId[input.mission.biome as keyof typeof realtimeBiomeByManagerId] ?? 'crystalline';
  const request: DirectMissionRequest = {
    version: 2,
    id: input.requestId,
    createdAt: input.now,
    seed: input.seed,
    resolution: 'direct',
    mission: { ...input.mission, realtimeBiome },
    miner: { ...input.miner },
  };

  state.nitra -= input.nitraCost;
  miner.state = 'mission';
  state.realtime = {
    requestId: request.id,
    missionId: input.mission.id,
    minerId: miner.id,
    mission: structuredClone(input.mission),
    nitraSpent: input.nitraCost,
    startedAt: input.now,
    resolution: 'direct',
  };
  state.board.splice(missionIndex, 1);
  return request;
}

export function canSettleMission(state: UnifiedSaveState, result: MissionResult): boolean {
  return !!state.realtime
    && state.realtime.requestId === result.requestId
    && !state.settledRealtime?.[result.requestId];
}

export function markMissionSettled(state: UnifiedSaveState, requestId: string, settledAt = Date.now()): void {
  state.settledRealtime ??= {};
  state.settledRealtime[requestId] = settledAt;
  const ids = Object.keys(state.settledRealtime);
  if (ids.length > 64) {
    ids.sort((a, b) => state.settledRealtime![a] - state.settledRealtime![b]);
    for (const id of ids.slice(0, ids.length - 64)) delete state.settledRealtime[id];
  }
}

export function abortDirectMission(state: UnifiedSaveState, moralePenalty = 15): string | null {
  if (!state.realtime) return null;
  const requestId = state.realtime.requestId;
  const miner = state.miners.find(item => item.id === state.realtime!.minerId);
  if (miner) {
    miner.state = 'idle';
    miner.morale = Math.max(10, Math.min(100, miner.morale - moralePenalty));
  }
  state.realtime = null;
  return requestId;
}
