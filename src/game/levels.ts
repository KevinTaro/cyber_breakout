import { BrickType, LevelData, Brick } from './types';

export const BRICK_COLORS: Record<BrickType, { base: string; glow: string; points: number; hp: number }> = {
  standard: { base: '#00f0ff', glow: '#00f0ff88', points: 100, hp: 1 },
  heavy: { base: '#f59e0b', glow: '#f59e0b88', points: 200, hp: 2 },
  armored: { base: '#ef4444', glow: '#ef444488', points: 300, hp: 3 },
  bomb: { base: '#ec4899', glow: '#ec4899aa', points: 250, hp: 1 },
  laser: { base: '#10b981', glow: '#10b981aa', points: 150, hp: 1 },
  multiball: { base: '#8b5cf6', glow: '#8b5cf6aa', points: 150, hp: 1 },
  fireball: { base: '#f97316', glow: '#f97316aa', points: 180, hp: 1 },
  expander: { base: '#06b6d4', glow: '#06b6d4aa', points: 120, hp: 1 },
  shield: { base: '#3b82f6', glow: '#3b82f6aa', points: 140, hp: 1 },
  sticky: { base: '#14b8a6', glow: '#14b8a6aa', points: 130, hp: 1 },
  slow: { base: '#a855f7', glow: '#a855f7aa', points: 110, hp: 1 },
  unbreakable: { base: '#64748b', glow: '#47556944', points: 0, hp: 999 },
};

export const PRESET_LEVELS: LevelData[] = [
  {
    id: 1,
    name: 'STAGE 01 // NEON GENESIS',
    theme: 'Cyber City Entry',
    subtitle: '入門核心：熟悉雷射與多球系統',
    accentColor: '#00f0ff',
    cols: 10,
    rows: 6,
    layout: [
      ['standard', 'standard', 'standard', 'standard', 'multiball', 'multiball', 'standard', 'standard', 'standard', 'standard'],
      ['standard', 'laser', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'laser', 'standard'],
      ['heavy', 'standard', 'expander', 'standard', 'standard', 'standard', 'standard', 'expander', 'standard', 'heavy'],
      ['heavy', 'heavy', 'standard', 'standard', 'shield', 'shield', 'standard', 'standard', 'heavy', 'heavy'],
      ['standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard'],
      ['laser', null, 'standard', 'standard', null, null, 'standard', 'standard', null, 'laser'],
    ],
  },
  {
    id: 2,
    name: 'STAGE 02 // PRISM CITADEL',
    theme: 'Crystalline Fortress',
    subtitle: '稜鏡碉堡：連鎖炸彈與烈焰穿透球',
    accentColor: '#f59e0b',
    cols: 10,
    rows: 7,
    layout: [
      [null, 'heavy', 'heavy', 'bomb', 'fireball', 'fireball', 'bomb', 'heavy', 'heavy', null],
      ['heavy', 'standard', 'standard', 'heavy', 'standard', 'standard', 'heavy', 'standard', 'standard', 'heavy'],
      ['armored', 'standard', 'bomb', 'standard', 'sticky', 'sticky', 'standard', 'bomb', 'standard', 'armored'],
      ['heavy', 'multiball', 'standard', 'heavy', 'standard', 'standard', 'heavy', 'standard', 'multiball', 'heavy'],
      [null, 'heavy', 'laser', 'standard', 'shield', 'shield', 'standard', 'laser', 'heavy', null],
      [null, null, 'heavy', 'heavy', 'standard', 'standard', 'heavy', 'heavy', null, null],
      [null, null, null, 'armored', 'slow', 'slow', 'armored', null, null, null],
    ],
  },
  {
    id: 3,
    name: 'STAGE 03 // CYBER MATRIX',
    theme: 'Quantum Grid Overdrive',
    subtitle: '量子網絡：重裝甲磚塊與避障考驗',
    accentColor: '#ec4899',
    cols: 10,
    rows: 7,
    layout: [
      ['armored', 'unbreakable', 'armored', 'bomb', 'multiball', 'laser', 'bomb', 'armored', 'unbreakable', 'armored'],
      ['heavy', 'armored', 'heavy', 'standard', 'fireball', 'shield', 'standard', 'heavy', 'armored', 'heavy'],
      ['standard', 'heavy', 'bomb', 'standard', 'expander', 'sticky', 'standard', 'bomb', 'heavy', 'standard'],
      ['unbreakable', 'standard', 'standard', 'armored', 'standard', 'standard', 'armored', 'standard', 'standard', 'unbreakable'],
      ['standard', 'heavy', 'laser', 'standard', 'slow', 'slow', 'standard', 'laser', 'heavy', 'standard'],
      ['heavy', 'armored', 'heavy', 'standard', 'bomb', 'bomb', 'standard', 'heavy', 'armored', 'heavy'],
      ['armored', null, 'armored', null, 'multiball', 'fireball', null, 'armored', null, 'armored'],
    ],
  },
  {
    id: 4,
    name: 'STAGE 04 // PULSE REACTOR',
    theme: 'Fusion Core Meltdown',
    subtitle: '聚變核心：密集爆破引爆多重連擊',
    accentColor: '#10b981',
    cols: 10,
    rows: 8,
    layout: [
      ['bomb', 'heavy', 'bomb', 'heavy', 'bomb', 'bomb', 'heavy', 'bomb', 'heavy', 'bomb'],
      ['heavy', 'armored', 'armored', 'laser', 'shield', 'shield', 'laser', 'armored', 'armored', 'heavy'],
      ['bomb', 'armored', 'unbreakable', 'multiball', 'standard', 'standard', 'multiball', 'unbreakable', 'armored', 'bomb'],
      ['heavy', 'laser', 'standard', 'fireball', 'sticky', 'sticky', 'fireball', 'standard', 'laser', 'heavy'],
      ['bomb', 'armored', 'unbreakable', 'standard', 'expander', 'expander', 'standard', 'unbreakable', 'armored', 'bomb'],
      ['heavy', 'armored', 'armored', 'slow', 'bomb', 'bomb', 'slow', 'armored', 'armored', 'heavy'],
      ['bomb', 'heavy', 'bomb', 'heavy', 'bomb', 'bomb', 'heavy', 'bomb', 'heavy', 'bomb'],
      [null, 'multiball', null, 'laser', null, null, 'laser', null, 'multiball', null],
    ],
  },
  {
    id: 5,
    name: 'STAGE 05 // VOID MONOLITH',
    theme: 'Singularity Apex',
    subtitle: '終焉奇點：終極黑客巔峰對決',
    accentColor: '#8b5cf6',
    cols: 10,
    rows: 8,
    layout: [
      ['unbreakable', 'armored', 'armored', 'armored', 'bomb', 'bomb', 'armored', 'armored', 'armored', 'unbreakable'],
      ['armored', 'heavy', 'laser', 'heavy', 'fireball', 'fireball', 'heavy', 'laser', 'heavy', 'armored'],
      ['armored', 'unbreakable', 'heavy', 'multiball', 'sticky', 'sticky', 'multiball', 'heavy', 'unbreakable', 'armored'],
      ['bomb', 'heavy', 'standard', 'expander', 'shield', 'shield', 'expander', 'standard', 'heavy', 'bomb'],
      ['armored', 'laser', 'heavy', 'bomb', 'fireball', 'fireball', 'bomb', 'heavy', 'laser', 'armored'],
      ['heavy', 'unbreakable', 'armored', 'heavy', 'slow', 'slow', 'heavy', 'armored', 'unbreakable', 'heavy'],
      ['armored', 'heavy', 'bomb', 'armored', 'multiball', 'multiball', 'armored', 'bomb', 'heavy', 'armored'],
      ['unbreakable', null, 'laser', null, 'shield', 'shield', null, 'laser', null, 'unbreakable'],
    ],
  },
];

/**
 * Generate procedural endless wave
 */
export function generateProceduralLevel(wave: number): LevelData {
  const cols = 10;
  const rows = Math.min(9, 5 + Math.floor(wave / 2));
  const layout: (BrickType | null)[][] = [];

  const types: BrickType[] = ['standard', 'heavy', 'laser', 'multiball', 'bomb', 'fireball', 'expander', 'shield'];
  if (wave >= 3) types.push('armored', 'sticky');
  if (wave >= 5) types.push('unbreakable');

  for (let r = 0; r < rows; r++) {
    const row: (BrickType | null)[] = [];
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.15 && r > 2) {
        row.push(null);
        continue;
      }
      const rand = Math.random();
      if (rand < 0.45) {
        row.push('standard');
      } else if (rand < 0.65) {
        row.push(wave > 1 ? 'heavy' : 'standard');
      } else if (rand < 0.78) {
        row.push(wave > 2 ? 'armored' : 'heavy');
      } else if (rand < 0.85) {
        row.push('bomb');
      } else {
        const specialIndex = Math.floor(Math.random() * (types.length - 3)) + 2;
        row.push(types[specialIndex] || 'multiball');
      }
    }
    layout.push(row);
  }

  return {
    id: 100 + wave,
    name: `INFINITY // WAVE ${wave.toString().padStart(2, '0')}`,
    theme: 'Infinite Edge Protocol',
    subtitle: `第 ${wave} 波無盡邊緣數據湧流`,
    accentColor: ['#00f0ff', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6'][wave % 5],
    cols,
    rows,
    layout,
  };
}

/**
 * Convert level matrix into positioned Brick entities for the canvas
 */
export function createBricksFromLayout(
  level: LevelData,
  arenaWidth: number,
  arenaHeight: number
): Brick[] {
  const bricks: Brick[] = [];
  const paddingX = 24;
  const paddingTop = 70;
  const gap = 8;

  const totalGapX = (level.cols - 1) * gap;
  const availableWidth = arenaWidth - paddingX * 2;
  const brickW = Math.floor((availableWidth - totalGapX) / level.cols);
  const brickH = 24;

  level.layout.forEach((row, rIdx) => {
    row.forEach((type, cIdx) => {
      if (!type) return;

      const info = BRICK_COLORS[type];
      const x = paddingX + cIdx * (brickW + gap);
      const y = paddingTop + rIdx * (brickH + gap);

      bricks.push({
        id: `b_${rIdx}_${cIdx}_${Date.now()}_${Math.random()}`,
        x,
        y,
        w: brickW,
        h: brickH,
        type,
        maxHp: info.hp,
        hp: info.hp,
        color: info.base,
        glowColor: info.glow,
        points: info.points,
      });
    });
  });

  return bricks;
}
