import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkCircleRectCollision,
  calculatePaddleReflection,
  calculateScore,
  applyBrickDamage,
  checkLevelClear,
  calculateGrade
} from './rules.ts';
import type { Brick } from './types.ts';

test('checkCircleRectCollision detects direct hit and calculates normal', () => {
  // Ball at (50, 45) with radius 10 hitting a rect at (40, 50, 40, 20)
  const result = checkCircleRectCollision(50, 45, 10, 40, 50, 40, 20);
  assert.equal(result.hit, true);
  assert.equal(result.normalY, -1); // Hit from the top
});

test('checkCircleRectCollision detects misses outside radius', () => {
  const result = checkCircleRectCollision(10, 10, 5, 100, 100, 40, 20);
  assert.equal(result.hit, false);
});

test('calculatePaddleReflection returns upward velocity with correct angle bias', () => {
  // Center hit
  const centerReflection = calculatePaddleReflection(100, 100, 80, 0, 10);
  assert.ok(centerReflection.vy < 0, 'vy must be upward');
  assert.ok(Math.abs(centerReflection.vx) < 1, 'vx should be near zero for center hit without spin');

  // Right edge hit
  const rightReflection = calculatePaddleReflection(135, 100, 80, 0, 10);
  assert.ok(rightReflection.vy < 0);
  assert.ok(rightReflection.vx > 0, 'vx should be positive when hitting right side');

  // Left edge hit
  const leftReflection = calculatePaddleReflection(65, 100, 80, 0, 10);
  assert.ok(leftReflection.vy < 0);
  assert.ok(leftReflection.vx < 0, 'vx should be negative when hitting left side');
});

test('calculateScore scales with combo and difficulty', () => {
  const base = 100;
  const score1 = calculateScore(base, 1, 'normal');
  const scoreCombo = calculateScore(base, 5, 'normal');
  const scoreHard = calculateScore(base, 5, 'hard');

  assert.equal(score1, 100);
  assert.ok(scoreCombo > score1, 'Score with combo should exceed base');
  assert.ok(scoreHard > scoreCombo, 'Hard difficulty should multiply score higher');
});

test('applyBrickDamage handles standard vs heavy vs unbreakable', () => {
  const standardBrick: Brick = {
    id: 'b1',
    x: 0,
    y: 0,
    w: 40,
    h: 20,
    type: 'standard',
    maxHp: 1,
    hp: 1,
    color: '#00f',
    glowColor: '#00f',
    points: 100
  };

  const heavyBrick: Brick = {
    id: 'b2',
    x: 0,
    y: 0,
    w: 40,
    h: 20,
    type: 'heavy',
    maxHp: 2,
    hp: 2,
    color: '#f00',
    glowColor: '#f00',
    points: 200
  };

  const unbreakableBrick: Brick = {
    id: 'b3',
    x: 0,
    y: 0,
    w: 40,
    h: 20,
    type: 'unbreakable',
    maxHp: 999,
    hp: 999,
    color: '#888',
    glowColor: '#888',
    points: 0
  };

  // Standard hit
  const res1 = applyBrickDamage(standardBrick, 1);
  assert.equal(res1.destroyed, true);
  assert.equal(res1.remainingHp, 0);
  assert.equal(res1.pointsAwarded, 100);

  // Heavy brick first hit
  const res2 = applyBrickDamage(heavyBrick, 1);
  assert.equal(res2.destroyed, false);
  assert.equal(res2.remainingHp, 1);
  assert.equal(res2.pointsAwarded, 60);

  // Unbreakable brick hit
  const res3 = applyBrickDamage(unbreakableBrick, 1);
  assert.equal(res3.destroyed, false);
  assert.equal(res3.pointsAwarded, 0);
});

test('checkLevelClear validates when all breakable bricks have hp <= 0', () => {
  const bricks: Brick[] = [
    { id: '1', x: 0, y: 0, w: 10, h: 10, type: 'standard', maxHp: 1, hp: 0, color: '', glowColor: '', points: 10 },
    { id: '2', x: 0, y: 0, w: 10, h: 10, type: 'unbreakable', maxHp: 1, hp: 1, color: '', glowColor: '', points: 0 }
  ];
  assert.equal(checkLevelClear(bricks), true);

  bricks[0].hp = 1;
  assert.equal(checkLevelClear(bricks), false);
});

test('calculateGrade grades performance according to accuracy, combo, time', () => {
  assert.equal(calculateGrade(95, 25, 45, 90), 'S');
  assert.equal(calculateGrade(75, 12, 70, 90), 'A');
  assert.equal(calculateGrade(50, 4, 150, 90), 'C');
});
