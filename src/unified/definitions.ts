export const SAVE_SCHEMA_VERSION = 3;

export const realtimeBiomeByManagerId = Object.freeze({
  crystal: 'crystalline',
  salt: 'salt',
  fungus: 'fungus',
  sand: 'sandblasted',
  rad: 'radioactive',
  bio: 'biozone',
  glacial: 'glacial',
  bough: 'bough',
  magma: 'magma',
  azure: 'azure',
  ossuary: 'crystalline',
} as const);

export const realtimeHazards = Object.freeze([
  { lv: 1, name: '危险等级 1', dmgMul: 0.55, hpMul: 0.7, rate: 0.55, quota: 0.7, credit: 0.75, xp: 0.8 },
  { lv: 2, name: '危险等级 2', dmgMul: 0.8, hpMul: 0.9, rate: 0.8, quota: 0.85, credit: 1.0, xp: 1.0 },
  { lv: 3, name: '危险等级 3', dmgMul: 1.0, hpMul: 1.0, rate: 1.0, quota: 1.0, credit: 1.3, xp: 1.3 },
  { lv: 4, name: '危险等级 4', dmgMul: 1.3, hpMul: 1.35, rate: 1.35, quota: 1.15, credit: 1.7, xp: 1.7 },
  { lv: 5, name: '危险等级 5', dmgMul: 1.7, hpMul: 1.8, rate: 1.8, quota: 1.3, credit: 2.2, xp: 2.2 },
] as const);

export const managerBiomes = Object.freeze([
  { id: 'crystal', name: '水晶洞穴', tier: 1, pair: ['乌玛石', '铜矿'] },
  { id: 'salt', name: '盐坑', tier: 1, pair: ['容和石', '吸铁石'] },
  { id: 'fungus', name: '霉菌沼泽', tier: 2, pair: ['铜矿', '蜂母石'] },
  { id: 'sand', name: '飞沙走廊', tier: 2, pair: ['乌玛石', '吸铁石'] },
  { id: 'rad', name: '放射性禁区', tier: 3, pair: ['妙绝珠', '乌玛石'] },
  { id: 'bio', name: '密林丛原', tier: 3, pair: ['铜矿', '玉石'] },
  { id: 'glacial', name: '冰封岩层', tier: 4, pair: ['玉石', '妙绝珠'] },
  { id: 'bough', name: '藤络树洞', tier: 4, pair: ['蜂母石', '吸铁石'] },
  { id: 'magma', name: '熔岩之心', tier: 5, pair: ['吸铁石', '玉石'] },
  { id: 'azure', name: '蔚蓝花甸', tier: 5, pair: ['妙绝珠', '玉石'] },
  { id: 'ossuary', name: '栖骨深渊', tier: 5, pair: ['容和石', '蜂母石'] },
] as const);

export const realtimeBiomes = Object.freeze([
  { id: 'crystalline', name: '晶洞秘境', en: 'Crystalline Caverns', art: 'biome_crystalline', dirt: '#4b5a78', rock: '#33415a', hard: '#8b93a8', glow: '#7fd4ff', fog: '#0b1220', crystals: 1.6, tint: 2 },
  { id: 'salt', name: '盐晶矿坑', en: 'Salt Pits', art: 'biome_salt', dirt: '#8a8471', rock: '#6a6557', hard: '#c9c6b4', glow: '#ffe9b0', fog: '#181510', crystals: 0.7, tint: 5 },
  { id: 'fungus', name: '真菌沼泽', en: 'Fungus Bogs', art: 'biome_fungus', dirt: '#4e5f3d', rock: '#374630', hard: '#8fa07a', glow: '#a8ff6a', fog: '#0d1408', crystals: 0.9, tint: 1 },
  { id: 'radioactive', name: '辐射禁区', en: 'Radioactive Exclusion Zone', art: 'biome_radioactive', dirt: '#5e5f38', rock: '#43442a', hard: '#a8ab6c', glow: '#c6ff3a', fog: '#0f1008', crystals: 1.1, tint: 3 },
  { id: 'biozone', name: '茂密生态区', en: 'Dense Biozone', art: 'biome_biozone', dirt: '#46583a', rock: '#2f3f2b', hard: '#7d9668', glow: '#7dff9a', fog: '#08120b', crystals: 1.0, tint: 1 },
  { id: 'glacial', name: '冰川地层', en: 'Glacial Strata', art: 'biome_glacial', dirt: '#5d7488', rock: '#41556a', hard: '#b9d6e8', glow: '#a8e9ff', fog: '#0a1420', crystals: 1.3, tint: 6 },
  { id: 'magma', name: '岩浆核心', en: 'Magma Core', art: 'biome_magma', dirt: '#6b3524', rock: '#4a251b', hard: '#a3543a', glow: '#ff7a2a', fog: '#160805', crystals: 0.8, tint: 8 },
  { id: 'azure', name: '蔚蓝荒原', en: 'Azure Weald', art: 'biome_azure', dirt: '#40506e', rock: '#2c3a52', hard: '#8ba0c8', glow: '#66b8ff', fog: '#080f1a', crystals: 1.4, tint: 2 },
  { id: 'bough', name: '空心枝丫', en: 'Hollow Bough', art: 'biome_bough', dirt: '#5e452f', rock: '#43301f', hard: '#9c7a52', glow: '#ff9a5a', fog: '#120a05', crystals: 1.0, tint: 7 },
  { id: 'sandblasted', name: '风蚀走廊', en: 'Sandblasted Corridors', art: 'biome_sandblasted', dirt: '#8a713f', rock: '#68542f', hard: '#c8ab72', glow: '#ffd27a', fog: '#141005', crystals: 0.8, tint: 5 },
] as const);
