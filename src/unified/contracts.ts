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
  /** 实时介入来源的派遣单 id（介入模式：胜=该派遣直接结算，败/召回=派遣恢复挂机） */
  depId?: string;
}

/** 派遣单最小快照（管理端 S.deps 元素，介入模式用） */
export interface DepSnapshot {
  id: string;
  m: MissionDefinition;
  minerIds: string[];
  paused?: boolean | null;
  [key: string]: unknown;
}

export interface UnifiedSaveState {
  v: number;
  schemaVersion?: number;
  nitra: number;
  board: MissionDefinition[];
  miners: Array<{ id: string; cls: string; state: string; morale: number }>;
  realtime: RealtimeState | null;
  settledRealtime?: Record<string, number>;
  deps?: DepSnapshot[];
  [key: string]: unknown;
}
