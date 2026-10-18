import type { Ball, Brick, Paddle, Difficulty } from './types.ts';

/**
 * Circle to AABB (Axis-Aligned Bounding Box) intersection check
 */
export function checkCircleRectCollision(
  cx: number,
  cy: number,
  radius: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): { hit: boolean; normalX: number; normalY: number } {
  // Find closest point on rect to circle center
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));

  const distX = cx - closestX;
  const distY = cy - closestY;
  const distSquared = distX * distX + distY * distY;

  if (distSquared > radius * radius) {
    return { hit: false, normalX: 0, normalY: 0 };
  }

  // Calculate collision normal based on penetration depth
  // Left/Right vs Top/Bottom penetration
  const leftPen = cx + radius - rx;
  const rightPen = rx + rw - (cx - radius);
  const topPen = cy + radius - ry;
  const bottomPen = ry + rh - (cy - radius);

  const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);

  let normalX = 0;
  let normalY = 0;

  if (minPen === leftPen) {
    normalX = -1;
  } else if (minPen === rightPen) {
    normalX = 1;
  } else if (minPen === topPen) {
    normalY = -1;
  } else {
    normalY = 1;
  }

  return { hit: true, normalX, normalY };
}

/**
 * Calculate paddle deflection angle and new velocity based on impact position
 * and paddle motion spin
 */
export function calculatePaddleReflection(
  ballX: number,
  paddleX: number,
  paddleWidth: number,
  paddleVx: number,
  baseSpeed: number,
  maxBounceAngleRad: number = (65 * Math.PI) / 180
): { vx: number; vy: number } {
  // Relative impact point on paddle: -1 (left tip) to +1 (right tip)
  const relativeIntersect = ((ballX - paddleX) / (paddleWidth / 2));
  const clampedRel = Math.max(-1, Math.min(1, relativeIntersect));

  // Add paddle momentum spin (up to ±15% deflection bias)
  const spinFactor = Math.max(-0.25, Math.min(0.25, paddleVx * 0.02));
  const finalFactor = Math.max(-0.95, Math.min(0.95, clampedRel * 0.85 + spinFactor));

  const bounceAngle = finalFactor * maxBounceAngleRad;

  // vy is always directed upwards (negative Y in screen coords)
  const vx = baseSpeed * Math.sin(bounceAngle);
  const vy = -Math.abs(baseSpeed * Math.cos(bounceAngle));

  return { vx, vy };
}

/**
 * Calculate combo multiplier and points
 */
export function calculateScore(
  basePoints: number,
  currentCombo: number,
  difficulty: Difficulty
): number {
  const diffMultiplier = difficulty === 'hard' ? 1.5 : difficulty === 'easy' ? 0.8 : 1.0;
  // Multiplier caps at 5x
  const comboMultiplier = Math.min(5, 1 + (currentCombo - 1) * 0.2);
  return Math.round(basePoints * comboMultiplier * diffMultiplier);
}

/**
 * Process damage to a brick and determine if it breaks or cracks
 */
export function applyBrickDamage(
  brick: Brick,
  damage: number = 1
): { destroyed: boolean; remainingHp: number; pointsAwarded: number } {
  if (brick.type === 'unbreakable') {
    return { destroyed: false, remainingHp: brick.hp, pointsAwarded: 0 };
  }

  const remainingHp = Math.max(0, brick.hp - damage);
  const destroyed = remainingHp === 0;
  const pointsAwarded = destroyed ? brick.points : Math.round(brick.points * 0.3);

  return { destroyed, remainingHp, pointsAwarded };
}

/**
 * Check win condition (all breakable bricks cleared)
 */
export function checkLevelClear(bricks: Brick[]): boolean {
  return bricks.every(b => b.type === 'unbreakable' || b.hp <= 0);
}

/**
 * Determine performance rating (S / A / B / C) based on metrics
 */
export function calculateGrade(
  accuracy: number,
  maxCombo: number,
  clearSeconds: number,
  targetSeconds: number = 90
): 'S' | 'A' | 'B' | 'C' {
  let score = 0;
  if (accuracy >= 85) score += 40;
  else if (accuracy >= 70) score += 30;
  else score += 15;

  if (maxCombo >= 20) score += 35;
  else if (maxCombo >= 10) score += 25;
  else score += 10;

  if (clearSeconds <= targetSeconds) score += 25;
  else if (clearSeconds <= targetSeconds * 1.5) score += 15;
  else score += 5;

  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 55) return 'B';
  return 'C';
}
