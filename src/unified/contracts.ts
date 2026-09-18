export type MissionResolution = 'simulated' | 'direct';
export type DispatchPace = 'idle' | 'rush';
export type MissionOutcome = 'success' | 'failed' | 'abandoned';

export interface MissionDefinition {
  id: string;
  type: string;
  biome: string;
  hazard: number;
  rewards: Record<string, number>;
  clause?: unknown;
}

export interface MinerSnapshot {
  id: string;
  cls: string;
  name: string;
  level: number;
}

export interface DirectMissionRequest {
  version: 2;
  id: string;
  createdAt: number;
  seed: number;
  resolution: 'direct';
  mission: MissionDefinition & { realtimeBiome: string };
  miner: MinerSnapshot;
}

export interface MissionResult {
  version: 2;
  requestId: string;
  missionId: string;
  minerId: string;
  finishedAt: number;
  outcome: MissionOutcome;
  win: boolean;
  failReason: string;
  time: number;
  credits: number;
  xp: number;
  deposited: Record<string, number>;
  stats: {
    kills: number;
    waves: number;
    downs: number;
    dug: number;
    mined: Record<string, number>;
  };
}

export interface RealtimeState {
  requestId: string;
  missionId: string;
  minerId: string;
  mission: MissionDefinition;
  nitraSpent: number;
  startedAt: number;
  resolution: 'direct';
}

export interface UnifiedSaveState {
  v: number;
  schemaVersion?: number;
  nitra: number;
  board: MissionDefinition[];
  miners: Array<{ id: string; cls: string; state: string; morale: number }>;
  realtime: RealtimeState | null;
  settledRealtime?: Record<string, number>;
  [key: string]: unknown;
}
