/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BreakoutEngine } from './game/engine';
import { Difficulty, GameState, LeaderboardEntry, LevelData, PowerUpType, RunMetrics } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { DefeatModal, PauseModal, VictoryModal } from './components/StatusModals';
import { DeploymentModal } from './components/DeploymentModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { LevelEditorModal } from './components/LevelEditorModal';
import { sound } from './game/audio';
import { createBricksFromLayout } from './game/levels';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BreakoutEngine | null>(null);

  // High-level game state
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [lives, setLives] = useState<number>(3);
  const [levelId, setLevelId] = useState<number>(1);
  const [levelName, setLevelName] = useState<string>('STAGE 01 // NEON GENESIS');
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());
  const [activePowerUps, setActivePowerUps] = useState<{ type: PowerUpType; remaining: number }[]>([]);

  // Modals state
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isLevelEditorOpen, setIsLevelEditorOpen] = useState<boolean>(false);

  // Victory / Defeat snapshots
  const [victoryMetrics, setVictoryMetrics] = useState<RunMetrics | null>(null);
  const [defeatMetrics, setDefeatMetrics] = useState<RunMetrics | null>(null);

  // High Scores & Local Storage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('breakout_highscore');
      return saved ? parseInt(saved, 10) : 15000;
    } catch {
      return 15000;
    }
  });

  const [localScores, setLocalScores] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('breakout_leaderboard_local');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      { id: '1', player: 'CYBER_ACE', score: 32400, level: 4, maxCombo: 24, date: '2026-10-18', difficulty: 'normal' },
      { id: '2', player: 'PADDLE_ZERO', score: 21800, level: 3, maxCombo: 18, date: '2026-10-17', difficulty: 'normal' },
      { id: '3', player: 'NEO_GHOST', score: 14200, level: 2, maxCombo: 12, date: '2026-10-16', difficulty: 'easy' },
    ];
  });

  // Track global difficulty & level
  const difficultyRef = useRef<Difficulty>('normal');
  const levelIdxRef = useRef<number>(0);

  // Initialize Canvas Engine once
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BreakoutEngine(canvasRef.current, {
      onScoreUpdate: (newScore, newCombo, newMult) => {
        setScore(newScore);
        setCombo(newCombo);
        setMultiplier(newMult);
        setHighScore((prev) => {
          if (newScore > prev) {
            try {
              localStorage.setItem('breakout_highscore', String(newScore));
            } catch {
              // ignore
            }
            return newScore;
          }
          return prev;
        });
      },
      onLivesUpdate: (newLives) => setLives(newLives),
      onLevelUpdate: (id, name) => {
        setLevelId(id);
        setLevelName(name);
      },
      onStateChange: (state) => setGameState(state),
      onVictory: (metrics) => setVictoryMetrics(metrics),
      onDefeat: (metrics) => setDefeatMetrics(metrics),
      onPowerUpsUpdate: (powerups) => setActivePowerUps(powerups),
    });

    engineRef.current = engine;

    // Check ?autostart=1 query parameter as mandated by ultra_mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.newGame('normal', 0);
    } else {
      document.body.dataset.state = 'title';
    }

    return () => {
      engine.destroy();
    };
  }, []);

  // Keyboard shortcut listener for utility modals
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState === 'playing' || gameState === 'title') {
        if (e.key === 'd' || e.key === 'D') {
          setIsDeployGuideOpen((prev) => !prev);
        } else if (e.key === 'l' || e.key === 'L') {
          setIsLeaderboardOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  // Actions
  const handleStartGame = (diff: Difficulty, lvlIndex: number, isEndless?: boolean) => {
    difficultyRef.current = diff;
    levelIdxRef.current = lvlIndex;
    if (engineRef.current) {
      if (isEndless) {
        engineRef.current.difficulty = diff;
        engineRef.current.startLevel(0, true, 1);
      } else {
        engineRef.current.newGame(diff, lvlIndex);
      }
    }
  };

  const handleNextLevel = () => {
    setVictoryMetrics(null);
    if (engineRef.current) {
      if (engineRef.current.isEndless) {
        engineRef.current.startLevel(0, true, engineRef.current.endlessWave + 1);
      } else {
        const nextIdx = engineRef.current.currentLevelIndex + 1;
        levelIdxRef.current = nextIdx;
        engineRef.current.startLevel(nextIdx, false, 1);
      }
    }
  };

  const handleRestartLevel = () => {
    setVictoryMetrics(null);
    setDefeatMetrics(null);
    if (engineRef.current) {
      engineRef.current.startLevel(
        engineRef.current.currentLevelIndex,
        engineRef.current.isEndless,
        engineRef.current.endlessWave
      );
    }
  };

  const handleHome = () => {
    setVictoryMetrics(null);
    setDefeatMetrics(null);
    setGameState('title');
    document.body.dataset.state = 'title';
    if (engineRef.current) {
      engineRef.current.state = 'title';
    }
  };

  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.togglePause();
    }
  };

  const handleSubmitScore = async (playerTag: string) => {
    const finalScore = victoryMetrics?.score || defeatMetrics?.score || score;
    const finalCombo = victoryMetrics?.maxCombo || defeatMetrics?.maxCombo || combo;
    const finalLevel = levelId;

    const newEntry: LeaderboardEntry = {
      id: `score_${Date.now()}`,
      player: playerTag.toUpperCase(),
      score: finalScore,
      level: finalLevel,
      maxCombo: finalCombo,
      date: new Date().toISOString().split('T')[0],
      difficulty: difficultyRef.current,
    };

    // Save locally
    const updated = [newEntry, ...localScores].sort((a, b) => b.score - a.score).slice(0, 30);
    setLocalScores(updated);
    try {
      localStorage.setItem('breakout_leaderboard_local', JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Attempt edge post to /api/leaderboard (Cloudflare Pages Functions)
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
    } catch {
      // Offline / standalone fallback, ignore network failure
    }
  };

  const handlePlayCustomLevel = (customLevel: LevelData) => {
    setIsLevelEditorOpen(false);
    if (engineRef.current) {
      engineRef.current.difficulty = difficultyRef.current;
      engineRef.current.state = 'playing';
      document.body.dataset.state = 'playing';
      engineRef.current.currentLevelIndex = 999;
      engineRef.current.isEndless = false;
      engineRef.current.startLevel(0, false, 1);
      // Replace with custom bricks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engineRef.current as any).bricks = createBricksFromLayout(customLevel, 800, 650);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center font-mono select-none">
      {/* Game Stage Container */}
      <div className="relative w-full h-full max-w-5xl max-h-[850px] aspect-[800/650] flex items-center justify-center overflow-hidden border border-slate-900 shadow-2xl">
        {/* Isolated Canvas 2D Surface */}
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          className="w-full h-full object-contain cursor-crosshair"
        />

        {/* HUD Overlay (Playing & Paused) */}
        {gameState !== 'title' && (
          <GameHUD
            score={score}
            combo={combo}
            multiplier={multiplier}
            lives={lives}
            levelId={levelId}
            levelName={levelName}
            isMuted={isMuted}
            isPaused={gameState === 'paused'}
            activePowerUps={activePowerUps}
            onToggleMute={handleToggleMute}
            onTogglePause={handleTogglePause}
            onRestart={handleRestartLevel}
            onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          />
        )}

        {/* Title Screen Overlay */}
        {gameState === 'title' && (
          <TitleScreen
            onStart={handleStartGame}
            onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenLevelEditor={() => setIsLevelEditorOpen(true)}
            highScore={highScore}
          />
        )}

        {/* Status Modals: Pause, Victory, Defeat */}
        {gameState === 'paused' && (
          <PauseModal
            onResume={handleTogglePause}
            onRestart={handleRestartLevel}
            onHome={handleHome}
          />
        )}

        {gameState === 'gameover' && victoryMetrics && (
          <VictoryModal
            metrics={victoryMetrics}
            onNextLevel={handleNextLevel}
            onRestart={handleRestartLevel}
            onHome={handleHome}
            onSubmitScore={handleSubmitScore}
          />
        )}

        {gameState === 'gameover' && defeatMetrics && (
          <DefeatModal
            metrics={defeatMetrics}
            bestScore={highScore}
            onRetry={handleRestartLevel}
            onHome={handleHome}
            onSubmitScore={handleSubmitScore}
          />
        )}
      </div>

      {/* Cloudflare & GitHub Deployment Guide Modal */}
      <DeploymentModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />

      {/* Hall of Fame Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        localScores={localScores}
      />

      {/* Custom Level Designer Modal */}
      <LevelEditorModal
        isOpen={isLevelEditorOpen}
        onClose={() => setIsLevelEditorOpen(false)}
        onPlayCustomLevel={handlePlayCustomLevel}
      />
    </div>
  );
}
