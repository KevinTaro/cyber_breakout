import {
  Ball,
  Brick,
  Difficulty,
  GameState,
  LaserBeam,
  LevelData,
  Paddle,
  Particle,
  PowerUp,
  PowerUpType,
  RunMetrics,
} from './types';
import {
  applyBrickDamage,
  calculatePaddleReflection,
  calculateScore,
  checkCircleRectCollision,
  checkLevelClear,
} from './rules';
import { createBricksFromLayout, generateProceduralLevel, PRESET_LEVELS } from './levels';
import { sound } from './audio';

export interface EngineCallbacks {
  onScoreUpdate: (score: number, combo: number, multiplier: number) => void;
  onLivesUpdate: (lives: number) => void;
  onLevelUpdate: (level: number, levelName: string) => void;
  onStateChange: (state: GameState) => void;
  onVictory: (metrics: RunMetrics) => void;
  onDefeat: (metrics: RunMetrics) => void;
  onPowerUpsUpdate: (powerups: { type: PowerUpType; remaining: number }[]) => void;
}

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 650;
const MAX_PARTICLES = 350;

export class BreakoutEngine {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  // Game state
  public state: GameState = 'title';
  public difficulty: Difficulty = 'normal';
  public currentLevelIndex: number = 0;
  public isEndless: boolean = false;
  public endlessWave: number = 1;

  // Entities
  private paddle!: Paddle;
  private balls: Ball[] = [];
  private bricks: Brick[] = [];
  private powerUps: PowerUp[] = [];
  private lasers: LaserBeam[] = [];
  private particles: Particle[] = [];
  private particleIndex: number = 0;

  // Metrics & Stats
  private score: number = 0;
  private lives: number = 3;
  private combo: number = 0;
  private maxCombo: number = 0;
  private comboTimer: number = 0;
  private bricksDestroyed: number = 0;
  private totalBricksInLevel: number = 0;
  private shotsFired: number = 0;
  private hitsRecorded: number = 0;
  private runStartTime: number = 0;

  // Active power-up timers (seconds remaining)
  private activeTimers: Record<string, number> = {
    laser: 0,
    fireball: 0,
    expander: 0,
    sticky: 0,
    slow: 0,
    shield: 0,
  };

  // Juiciness & FX
  private hitstopTimer: number = 0;
  private screenShake: number = 0;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  // Input state
  private keysPressed: Set<string> = new Set();
  private mouseX: number = ARENA_WIDTH / 2;
  private isPointerControlled: boolean = false;
  private isMouseDown: boolean = false;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;

    // Set fixed virtual resolution for pixel-perfect physics
    this.canvas.width = ARENA_WIDTH;
    this.canvas.height = ARENA_HEIGHT;

    this.initParticlePool();
    this.resetPaddle();
    this.bindInputs();
  }

  private initParticlePool() {
    this.particles = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#fff',
        alpha: 0,
        decay: 1,
      });
    }
  }

  private spawnParticle(x: number, y: number, vx: number, vy: number, color: string, size: number, life: number) {
    const p = this.particles[this.particleIndex];
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.color = color;
    p.size = size;
    p.life = life;
    p.maxLife = life;
    p.alpha = 1;
    p.decay = 1 / life;
    this.particleIndex = (this.particleIndex + 1) % MAX_PARTICLES;
  }

  private burstParticles(x: number, y: number, color: string, count: number = 12, speed: number = 180) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const spd = (Math.random() * 0.7 + 0.3) * speed;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const life = Math.random() * 0.35 + 0.2;
      const size = Math.random() * 3 + 1.5;
      this.spawnParticle(x, y, vx, vy, color, size, life);
    }
  }

  private resetPaddle() {
    const baseWidth = 110;
    this.paddle = {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT - 38,
      w: baseWidth,
      h: 14,
      baseWidth,
      vx: 0,
      lastX: ARENA_WIDTH / 2,
      hasLaser: false,
      laserCooldown: 0,
      isSticky: false,
    };
  }

  private spawnBall(onPaddle: boolean = false): Ball {
    const baseSpeed = this.difficulty === 'hard' ? 440 : this.difficulty === 'easy' ? 320 : 380;
    const initialAngle = (Math.random() * 0.4 - 0.2) * Math.PI; // -36 deg to +36 deg
    return {
      id: `ball_${Date.now()}_${Math.random()}`,
      x: this.paddle.x,
      y: this.paddle.y - 12,
      vx: baseSpeed * Math.sin(initialAngle),
      vy: -baseSpeed * Math.cos(initialAngle),
      radius: 6.5,
      speed: baseSpeed,
      isFireball: this.activeTimers.fireball > 0,
      trail: [],
      stuckToPaddle: onPaddle,
      stuckOffsetX: 0,
    };
  }

  public startLevel(levelIndex: number = 0, isEndless: boolean = false, wave: number = 1) {
    this.state = 'playing';
    document.body.dataset.state = 'playing';
    this.currentLevelIndex = levelIndex;
    this.isEndless = isEndless;
    this.endlessWave = wave;

    this.resetPaddle();
    this.lasers = [];
    this.powerUps = [];

    // Reset powerup timers
    Object.keys(this.activeTimers).forEach(k => (this.activeTimers[k] = 0));

    let levelData: LevelData;
    if (isEndless) {
      levelData = generateProceduralLevel(wave);
    } else {
      const idx = Math.max(0, Math.min(PRESET_LEVELS.length - 1, levelIndex));
      levelData = PRESET_LEVELS[idx];
    }

    this.bricks = createBricksFromLayout(levelData, ARENA_WIDTH, ARENA_HEIGHT);
    this.totalBricksInLevel = this.bricks.filter(b => b.type !== 'unbreakable').length;
    this.bricksDestroyed = 0;
    this.runStartTime = Date.now();

    // Spawn initial ball stuck to paddle ready for player launch
    this.balls = [this.spawnBall(true)];

    this.callbacks.onStateChange('playing');
    this.callbacks.onLevelUpdate(levelData.id, levelData.name);
    this.callbacks.onLivesUpdate(this.lives);
    this.callbacks.onScoreUpdate(this.score, this.combo, 1);
    this.callbacks.onPowerUpsUpdate([]);

    if (!this.animationFrameId) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  public newGame(difficulty: Difficulty = 'normal', levelIndex: number = 0) {
    this.difficulty = difficulty;
    this.score = 0;
    this.lives = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 2 : 3;
    this.combo = 0;
    this.maxCombo = 0;
    this.shotsFired = 0;
    this.hitsRecorded = 0;
    this.startLevel(levelIndex, false, 1);
  }

  public pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      document.body.dataset.state = 'paused';
      this.callbacks.onStateChange('paused');
    }
  }

  public resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
      document.body.dataset.state = 'playing';
      this.lastTime = performance.now();
      this.callbacks.onStateChange('playing');
    }
  }

  public togglePause() {
    if (this.state === 'playing') {
      this.pause();
    } else if (this.state === 'paused') {
      this.resume();
    }
  }

  private launchStuckBalls() {
    let launched = false;
    this.balls.forEach(ball => {
      if (ball.stuckToPaddle) {
        ball.stuckToPaddle = false;
        const reflection = calculatePaddleReflection(
          ball.x,
          this.paddle.x,
          this.paddle.w,
          this.paddle.vx,
          ball.speed
        );
        ball.vx = reflection.vx;
        ball.vy = reflection.vy;
        launched = true;
      }
    });
    if (launched) {
      sound.playPaddleHit(0);
    }
  }

  private fireLasers() {
    if (this.activeTimers.laser <= 0 || this.paddle.laserCooldown > 0) return;

    this.shotsFired += 2;
    const halfW = this.paddle.w / 2 - 8;
    this.lasers.push(
      { id: `lz_${Date.now()}_1`, x: this.paddle.x - halfW, y: this.paddle.y - 4, vy: -680, w: 4, h: 14 },
      { id: `lz_${Date.now()}_2`, x: this.paddle.x + halfW, y: this.paddle.y - 4, vy: -680, w: 4, h: 14 }
    );
    this.paddle.laserCooldown = 0.22; // 4.5 shots per sec
    sound.playLaser();
    this.burstParticles(this.paddle.x - halfW, this.paddle.y, '#10b981', 3, 60);
    this.burstParticles(this.paddle.x + halfW, this.paddle.y, '#10b981', 3, 60);
  }

  private triggerBombExplosion(bombBrick: Brick) {
    sound.playBombExplosion();
    this.hitstopTimer = 0.08;
    this.screenShake = 14;
    this.burstParticles(bombBrick.x + bombBrick.w / 2, bombBrick.y + bombBrick.h / 2, '#ec4899', 32, 260);

    const bombRadius = bombBrick.w * 1.6;
    const bombCenterX = bombBrick.x + bombBrick.w / 2;
    const bombCenterY = bombBrick.y + bombBrick.h / 2;

    this.bricks.forEach(other => {
      if (other.id === bombBrick.id || other.hp <= 0 || other.type === 'unbreakable') return;
      const otherCenterX = other.x + other.w / 2;
      const otherCenterY = other.y + other.h / 2;
      const dist = Math.hypot(bombCenterX - otherCenterX, bombCenterY - otherCenterY);

      if (dist <= bombRadius) {
        const damageResult = applyBrickDamage(other, 3);
        other.hp = damageResult.remainingHp;
        if (damageResult.destroyed) {
          this.bricksDestroyed++;
          this.combo++;
          this.comboTimer = 2.4;
          this.score += calculateScore(damageResult.pointsAwarded, this.combo, this.difficulty);
          this.maybeDropPowerUp(other);
          this.burstParticles(otherCenterX, otherCenterY, other.color, 10, 140);
        }
      }
    });
  }

  private maybeDropPowerUp(brick: Brick) {
    let type: PowerUpType | null = null;

    if (brick.type === 'laser') type = 'laser';
    else if (brick.type === 'multiball') type = 'multiball';
    else if (brick.type === 'fireball') type = 'fireball';
    else if (brick.type === 'expander') type = 'expander';
    else if (brick.type === 'shield') type = 'shield';
    else if (brick.type === 'sticky') type = 'sticky';
    else if (brick.type === 'slow') type = 'slow';
    else {
      // Chance for random powerup
      const rand = Math.random();
      if (rand < 0.12) {
        const pool: PowerUpType[] = ['multiball', 'laser', 'fireball', 'expander', 'shield', 'sticky', 'slow'];
        if (this.lives < 3 && Math.random() < 0.25) pool.push('life');
        type = pool[Math.floor(Math.random() * pool.length)];
      }
    }

    if (!type) return;

    const colors: Record<PowerUpType, string> = {
      multiball: '#8b5cf6',
      laser: '#10b981',
      fireball: '#f97316',
      expander: '#06b6d4',
      shrink: '#f43f5e',
      shield: '#3b82f6',
      sticky: '#14b8a6',
      slow: '#a855f7',
      life: '#ec4899',
    };

    const labels: Record<PowerUpType, string> = {
      multiball: 'TRI-BALL',
      laser: 'LASER',
      fireball: 'FIREBALL',
      expander: 'EXPAND',
      shrink: 'SHRINK',
      shield: 'BARRIER',
      sticky: 'STICKY',
      slow: 'SLOW-MO',
      life: '+1 LIFE',
    };

    this.powerUps.push({
      id: `pwr_${Date.now()}_${Math.random()}`,
      x: brick.x + brick.w / 2 - 16,
      y: brick.y + brick.h / 2,
      w: 32,
      h: 16,
      vy: 130,
      type,
      color: colors[type],
      label: labels[type],
      iconName: type,
    });
  }

  private applyPowerUp(type: PowerUpType) {
    sound.playPowerUp();
    this.score += 250;

    switch (type) {
      case 'multiball': {
        // Clone up to 2 extra balls with diverged angles
        const existing = [...this.balls];
        existing.slice(0, 2).forEach(b => {
          const b1 = this.spawnBall(false);
          b1.x = b.x;
          b1.y = b.y;
          b1.vx = b.vx * 0.8 - b.vy * 0.4;
          b1.vy = b.vy * 0.8 + b.vx * 0.4;
          b1.isFireball = b.isFireball;

          const b2 = this.spawnBall(false);
          b2.x = b.x;
          b2.y = b.y;
          b2.vx = b.vx * 0.8 + b.vy * 0.4;
          b2.vy = b.vy * 0.8 - b.vx * 0.4;
          b2.isFireball = b.isFireball;

          this.balls.push(b1, b2);
        });
        break;
      }
      case 'laser':
        this.activeTimers.laser = 15;
        this.paddle.hasLaser = true;
        break;
      case 'fireball':
        this.activeTimers.fireball = 12;
        this.balls.forEach(b => (b.isFireball = true));
        break;
      case 'expander':
        this.activeTimers.expander = 18;
        this.paddle.w = this.paddle.baseWidth * 1.45;
        break;
      case 'shield':
        this.activeTimers.shield = 1; // 1 use or active state
        break;
      case 'sticky':
        this.activeTimers.sticky = 16;
        this.paddle.isSticky = true;
        break;
      case 'slow':
        this.activeTimers.slow = 10;
        break;
      case 'life':
        this.lives = Math.min(5, this.lives + 1);
        this.callbacks.onLivesUpdate(this.lives);
        break;
    }

    this.burstParticles(this.paddle.x, this.paddle.y, '#00f0ff', 20, 160);
  }

  private handleBallLoss() {
    this.lives--;
    this.combo = 0;
    this.comboTimer = 0;
    sound.playLifeLost();
    this.screenShake = 16;
    this.callbacks.onLivesUpdate(this.lives);
    this.callbacks.onScoreUpdate(this.score, 0, 1);

    if (this.lives <= 0) {
      this.state = 'gameover';
      document.body.dataset.state = 'gameover';
      sound.playGameOver();
      const metrics: RunMetrics = {
        score: this.score,
        level: this.currentLevelIndex + 1,
        maxCombo: this.maxCombo,
        currentCombo: 0,
        comboTimer: 0,
        bricksDestroyed: this.bricksDestroyed,
        totalBricks: this.totalBricksInLevel,
        shotsFired: this.shotsFired,
        hits: this.hitsRecorded,
        startTime: this.runStartTime,
        clearTime: Math.floor((Date.now() - this.runStartTime) / 1000),
        isVictory: false,
      };
      this.callbacks.onDefeat(metrics);
      this.callbacks.onStateChange('gameover');
    } else {
      // Re-spawn stuck ball
      this.resetPaddle();
      this.balls = [this.spawnBall(true)];
    }
  }

  private handleLevelVictory() {
    this.state = 'gameover';
    document.body.dataset.state = 'gameover';
    sound.playStageClear();

    const metrics: RunMetrics = {
      score: this.score,
      level: this.isEndless ? this.endlessWave : this.currentLevelIndex + 1,
      maxCombo: this.maxCombo,
      currentCombo: this.combo,
      comboTimer: 0,
      bricksDestroyed: this.bricksDestroyed,
      totalBricks: this.totalBricksInLevel,
      shotsFired: this.shotsFired,
      hits: this.hitsRecorded,
      startTime: this.runStartTime,
      clearTime: Math.floor((Date.now() - this.runStartTime) / 1000),
      isVictory: true,
    };

    this.callbacks.onVictory(metrics);
    this.callbacks.onStateChange('gameover');
  }

  private update(dt: number) {
    if (this.state !== 'playing') return;

    // Hitstop freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Time scale dilation for slow-motion powerup
    const timeScale = this.activeTimers.slow > 0 ? 0.65 : 1.0;
    const simDt = dt * timeScale;

    // Power-up countdowns
    let hasPowerupChange = false;
    const activeList: { type: PowerUpType; remaining: number }[] = [];

    Object.keys(this.activeTimers).forEach(key => {
      const pKey = key as PowerUpType;
      if (this.activeTimers[pKey] > 0) {
        this.activeTimers[pKey] -= dt;
        if (this.activeTimers[pKey] <= 0) {
          this.activeTimers[pKey] = 0;
          hasPowerupChange = true;
          // Revert effects
          if (pKey === 'expander') this.paddle.w = this.paddle.baseWidth;
          if (pKey === 'laser') this.paddle.hasLaser = false;
          if (pKey === 'sticky') this.paddle.isSticky = false;
          if (pKey === 'fireball') this.balls.forEach(b => (b.isFireball = false));
        } else {
          activeList.push({ type: pKey, remaining: Math.ceil(this.activeTimers[pKey]) });
        }
      }
    });

    if (hasPowerupChange || activeList.length > 0) {
      this.callbacks.onPowerUpsUpdate(activeList);
    }

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboTimer = 0;
        this.callbacks.onScoreUpdate(this.score, 0, 1);
      }
    }

    // Paddle motion
    const paddleSpeed = 680;
    let targetX = this.paddle.x;

    if (this.isPointerControlled) {
      targetX = this.mouseX;
    } else {
      if (this.keysPressed.has('ArrowLeft') || this.keysPressed.has('KeyA')) {
        targetX -= paddleSpeed * dt;
      }
      if (this.keysPressed.has('ArrowRight') || this.keysPressed.has('KeyD')) {
        targetX += paddleSpeed * dt;
      }
    }

    // Clamp paddle in arena
    const minX = this.paddle.w / 2;
    const maxX = ARENA_WIDTH - this.paddle.w / 2;
    targetX = Math.max(minX, Math.min(maxX, targetX));

    this.paddle.vx = (targetX - this.paddle.lastX) / Math.max(0.001, dt);
    this.paddle.lastX = targetX;
    this.paddle.x = targetX;

    // Laser firing
    if (this.paddle.laserCooldown > 0) {
      this.paddle.laserCooldown -= dt;
    }
    if (this.paddle.hasLaser && (this.keysPressed.has('Space') || this.isMouseDown)) {
      this.fireLasers();
    }

    // Laser updates
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y += l.vy * simDt;

      // Laser vs Bricks collision
      let hit = false;
      for (const b of this.bricks) {
        if (b.hp <= 0) continue;
        if (l.x >= b.x && l.x <= b.x + b.w && l.y >= b.y && l.y <= b.y + b.h) {
          hit = true;
          this.hitsRecorded++;
          const dmg = applyBrickDamage(b, 1);
          b.hp = dmg.remainingHp;
          sound.playBrickHit(620);
          this.burstParticles(l.x, l.y, b.color, 6, 120);

          if (dmg.destroyed) {
            this.bricksDestroyed++;
            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.comboTimer = 2.4;
            this.score += calculateScore(dmg.pointsAwarded, this.combo, this.difficulty);
            this.callbacks.onScoreUpdate(this.score, this.combo, Math.min(5, 1 + this.combo * 0.2));

            if (b.type === 'bomb') {
              this.triggerBombExplosion(b);
            } else {
              this.maybeDropPowerUp(b);
            }
          }
          break;
        }
      }

      if (hit || l.y < 0) {
        this.lasers.splice(i, 1);
      }
    }

    // Power-up movement and collection
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.y += p.vy * simDt;

      // Check collision with paddle
      const pBottom = p.y + p.h;
      const padTop = this.paddle.y - this.paddle.h / 2;
      const padBottom = this.paddle.y + this.paddle.h / 2;
      const padLeft = this.paddle.x - this.paddle.w / 2;
      const padRight = this.paddle.x + this.paddle.w / 2;

      if (pBottom >= padTop && p.y <= padBottom && p.x + p.w >= padLeft && p.x <= padRight) {
        this.applyPowerUp(p.type);
        this.powerUps.splice(i, 1);
        continue;
      }

      // Fell off bottom
      if (p.y > ARENA_HEIGHT + 30) {
        this.powerUps.splice(i, 1);
      }
    }

    // Ball motion & collisions
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];

      if (ball.stuckToPaddle) {
        ball.x = this.paddle.x + (ball.stuckOffsetX || 0);
        ball.y = this.paddle.y - this.paddle.h / 2 - ball.radius;
        continue;
      }

      // Record trail
      ball.trail.unshift({ x: ball.x, y: ball.y, alpha: 0.6 });
      if (ball.trail.length > (ball.isFireball ? 8 : 4)) {
        ball.trail.pop();
      }

      // Move ball
      ball.x += ball.vx * simDt;
      ball.y += ball.vy * simDt;

      // Wall reflections: Left & Right
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
        sound.playWallHit();
        this.burstParticles(ball.x, ball.y, '#00f0ff', 4, 80);
      } else if (ball.x + ball.radius >= ARENA_WIDTH) {
        ball.x = ARENA_WIDTH - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        sound.playWallHit();
        this.burstParticles(ball.x, ball.y, '#00f0ff', 4, 80);
      }

      // Wall reflection: Top ceiling
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
        sound.playWallHit();
        this.burstParticles(ball.x, ball.y, '#00f0ff', 4, 80);
      }

      // Bottom boundary / Shield / Death
      if (ball.y + ball.radius >= ARENA_HEIGHT) {
        if (this.activeTimers.shield > 0) {
          // Bottom force field bounce
          ball.y = ARENA_HEIGHT - ball.radius - 2;
          ball.vy = -Math.abs(ball.vy);
          this.activeTimers.shield = 0; // Consume shield
          sound.playShieldBounce();
          this.screenShake = 8;
          this.burstParticles(ball.x, ARENA_HEIGHT, '#3b82f6', 24, 200);
          continue;
        }

        // Lost this ball
        this.balls.splice(i, 1);
        if (this.balls.length === 0) {
          this.handleBallLoss();
          return;
        }
        continue;
      }

      // Paddle collision
      const padTop = this.paddle.y - this.paddle.h / 2;
      const padBottom = this.paddle.y + this.paddle.h / 2;
      const padLeft = this.paddle.x - this.paddle.w / 2;
      const padRight = this.paddle.x + this.paddle.w / 2;

      if (
        ball.vy > 0 &&
        ball.y + ball.radius >= padTop &&
        ball.y - ball.radius <= padBottom &&
        ball.x >= padLeft - 6 &&
        ball.x <= padRight + 6
      ) {
        if (this.activeTimers.sticky > 0) {
          ball.stuckToPaddle = true;
          ball.stuckOffsetX = ball.x - this.paddle.x;
          sound.playPaddleHit(0);
          continue;
        }

        const reflection = calculatePaddleReflection(
          ball.x,
          this.paddle.x,
          this.paddle.w,
          this.paddle.vx,
          ball.speed
        );
        ball.vx = reflection.vx;
        ball.vy = reflection.vy;
        ball.y = padTop - ball.radius;

        // Slight speed ramp up per paddle hit (up to +20%)
        ball.speed = Math.min(ball.speed * 1.01, 560);

        const impactPitch = (ball.x - this.paddle.x) / (this.paddle.w / 2);
        sound.playPaddleHit(impactPitch);
        this.burstParticles(ball.x, padTop, '#00f0ff', 6, 120);
      }

      // Prevent strictly horizontal trapping
      if (Math.abs(ball.vy) < 40) {
        ball.vy = ball.vy >= 0 ? 50 : -50;
      }

      // Brick collisions
      for (const brick of this.bricks) {
        if (brick.hp <= 0) continue;

        const col = checkCircleRectCollision(
          ball.x,
          ball.y,
          ball.radius,
          brick.x,
          brick.y,
          brick.w,
          brick.h
        );

        if (col.hit) {
          this.hitsRecorded++;

          // Normal ball deflects, fireball plows straight through!
          if (!ball.isFireball) {
            if (col.normalX !== 0) ball.vx = -ball.vx;
            if (col.normalY !== 0) ball.vy = -ball.vy;
          }

          const dmgAmount = ball.isFireball ? 3 : 1;
          const result = applyBrickDamage(brick, dmgAmount);
          brick.hp = result.remainingHp;

          sound.playBrickHit(520 + Math.min(600, this.combo * 40));

          if (result.destroyed) {
            this.bricksDestroyed++;
            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.comboTimer = 2.4;
            this.score += calculateScore(result.pointsAwarded, this.combo, this.difficulty);
            this.callbacks.onScoreUpdate(this.score, this.combo, Math.min(5, 1 + this.combo * 0.2));

            this.burstParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 14, 180);

            if (brick.type === 'bomb') {
              this.triggerBombExplosion(brick);
            } else {
              this.maybeDropPowerUp(brick);
            }

            // Check if level is cleared
            if (checkLevelClear(this.bricks)) {
              this.handleLevelVictory();
              return;
            }
          } else {
            // Damaged, cracked
            this.burstParticles(ball.x, ball.y, brick.color, 4, 90);
          }
          break; // One collision per ball tick
        }
      }
    }

    // Particle updates
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (p.life > 0) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, p.life * p.decay);
      }
    }
  }

  public render() {
    const ctx = this.ctx;
    ctx.save();

    // Apply screen shake
    if (this.screenShake > 0) {
      const shakeMag = this.screenShake * 0.6;
      ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
    }

    // Clear background with dark sci-fi aesthetic
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Draw background subtle grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < ARENA_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ARENA_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < ARENA_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA_WIDTH, y);
      ctx.stroke();
    }

    // Draw Bottom Force-Field Shield if active
    if (this.activeTimers.shield > 0) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, ARENA_HEIGHT - 3);
      ctx.lineTo(ARENA_WIDTH, ARENA_HEIGHT - 3);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Bricks
    for (const b of this.bricks) {
      if (b.hp <= 0) continue;

      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.glowColor;
      ctx.shadowBlur = b.type === 'bomb' ? 12 : 6;

      // Rounded rectangle for bricks
      const r = 3;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, r);
      ctx.fill();

      // Inner highlight line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Damaged/cracked overlay
      if (b.maxHp > 1 && b.hp < b.maxHp) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w * 0.3, b.y + 2);
        ctx.lineTo(b.x + b.w * 0.5, b.y + b.h * 0.6);
        ctx.lineTo(b.x + b.w * 0.7, b.y + b.h - 2);
        ctx.stroke();
      }

      // Bomb icon indicator
      if (b.type === 'bomb') {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', b.x + b.w / 2, b.y + b.h / 2);
      } else if (b.type === 'laser') {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('>>', b.x + b.w / 2, b.y + b.h / 2);
      } else if (b.type === 'multiball') {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x3', b.x + b.w / 2, b.y + b.h / 2);
      }

      ctx.restore();
    }

    // Draw Power-ups
    for (const p of this.powerUps) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, p.x + p.w / 2, p.y + p.h / 2);
      ctx.restore();
    }

    // Draw Lasers
    for (const l of this.lasers) {
      ctx.save();
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.fillRect(l.x - l.w / 2, l.y, l.w, l.h);
      ctx.restore();
    }

    // Draw Paddle
    ctx.save();
    const pad = this.paddle;
    const padTop = pad.y - pad.h / 2;
    const padLeft = pad.x - pad.w / 2;

    // Glowing core gradient
    const grad = ctx.createLinearGradient(padLeft, padTop, padLeft + pad.w, padTop);
    grad.addColorStop(0, '#00f0ff');
    grad.addColorStop(0.5, pad.hasLaser ? '#10b981' : '#38bdf8');
    grad.addColorStop(1, '#00f0ff');

    ctx.fillStyle = grad;
    ctx.shadowColor = pad.hasLaser ? '#10b981' : '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(padLeft, padTop, pad.w, pad.h, 7);
    ctx.fill();

    // Laser cannons attached to paddle
    if (pad.hasLaser) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(padLeft + 4, padTop - 6, 6, 6);
      ctx.fillRect(padLeft + pad.w - 10, padTop - 6, 6, 6);
    }

    // Paddle center notch
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pad.x - 2, padTop + 2, 4, pad.h - 4);
    ctx.restore();

    // Draw Balls & Trails
    for (const ball of this.balls) {
      // Trail
      for (const t of ball.trail) {
        ctx.save();
        ctx.fillStyle = ball.isFireball ? `rgba(249, 115, 22, ${t.alpha * 0.7})` : `rgba(0, 240, 255, ${t.alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Ball core
      ctx.save();
      ctx.fillStyle = ball.isFireball ? '#f97316' : '#ffffff';
      ctx.shadowColor = ball.isFireball ? '#ea580c' : '#00f0ff';
      ctx.shadowBlur = ball.isFireball ? 16 : 10;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (p.life > 0) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  private loop = (currentTime: number) => {
    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    const clampedDt = Math.min(rawDt, 0.05);

    if (this.state === 'playing') {
      this.update(clampedDt);
    }
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private bindInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    window.addEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysPressed.add(e.code);

    if (e.code === 'KeyP' || e.code === 'Escape') {
      this.togglePause();
    } else if (e.code === 'KeyM') {
      sound.toggleMute();
    } else if (e.code === 'Space') {
      if (this.state === 'playing') {
        this.launchStuckBalls();
        this.fireLasers();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysPressed.delete(e.code);
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = ARENA_WIDTH / rect.width;
    this.mouseX = (e.clientX - rect.left) * scaleX;
    this.isPointerControlled = true;
  };

  private handleMouseDown = () => {
    this.isMouseDown = true;
    if (this.state === 'playing') {
      this.launchStuckBalls();
      this.fireLasers();
    }
  };

  private handleMouseUp = () => {
    this.isMouseDown = false;
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = ARENA_WIDTH / rect.width;
      this.mouseX = (e.touches[0].clientX - rect.left) * scaleX;
      this.isPointerControlled = true;
    }
  };

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = ARENA_WIDTH / rect.width;
      this.mouseX = (e.touches[0].clientX - rect.left) * scaleX;
      this.isPointerControlled = true;
      this.launchStuckBalls();
      this.fireLasers();
    }
  };

  private handleBlur = () => {
    this.keysPressed.clear();
    this.isMouseDown = false;
  };

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('blur', this.handleBlur);
  }
}
