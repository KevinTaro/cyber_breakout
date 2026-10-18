export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type BrickType =
  | 'standard'
  | 'heavy'      // 2 hits
  | 'armored'    // 3 hits
  | 'bomb'       // Explodes adjacent bricks
  | 'laser'      // Drops laser powerup
  | 'multiball'  // Drops multiball powerup
  | 'fireball'   // Drops fireball powerup
  | 'expander'   // Widens paddle
  | 'shield'     // Adds bottom safety barrier
  | 'sticky'     // Catches ball
  | 'slow'       // Slow motion
  | 'unbreakable'; // Hazard / obstacle

export interface Brick {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: BrickType;
  maxHp: number;
  hp: number;
  color: string;
  glowColor: string;
  points: number;
  cracked?: boolean;
}

export type PowerUpType =
  | 'multiball'
  | 'laser'
  | 'fireball'
  | 'expander'
  | 'shrink'
  | 'shield'
  | 'sticky'
  | 'slow'
  | 'life';

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  type: PowerUpType;
  color: string;
  label: string;
  iconName: string;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  isFireball: boolean;
  trail: { x: number; y: number; alpha: number }[];
  stuckToPaddle?: boolean;
  stuckOffsetX?: number;
}

export interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
  baseWidth: number;
  vx: number;
  lastX: number;
  hasLaser: boolean;
  laserCooldown: number;
  isSticky: boolean;
}

export interface LaserBeam {
  id: string;
  x: number;
  y: number;
  vy: number;
  w: number;
  h: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface LevelData {
  id: number;
  name: string;
  theme: string;
  subtitle: string;
  accentColor: string;
  cols: number;
  rows: number;
  layout: (BrickType | null)[][];
}

export interface LeaderboardEntry {
  id: string;
  player: string;
  score: number;
  level: number;
  maxCombo: number;
  date: string;
  difficulty: Difficulty;
  isCloud?: boolean;
}

export interface RunMetrics {
  score: number;
  level: number;
  maxCombo: number;
  currentCombo: number;
  comboTimer: number;
  bricksDestroyed: number;
  totalBricks: number;
  shotsFired: number;
  hits: number;
  startTime: number;
  clearTime: number;
  isVictory: boolean;
}
