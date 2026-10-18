import React from 'react';
import { PowerUpType } from '../game/types';
import { Volume2, VolumeX, Pause, Play, RotateCcw, BookOpen, Trophy } from 'lucide-react';

interface GameHUDProps {
  score: number;
  combo: number;
  multiplier: number;
  lives: number;
  maxLives?: number;
  levelId: number;
  levelName: string;
  isMuted: boolean;
  isPaused: boolean;
  activePowerUps: { type: PowerUpType; remaining: number }[];
  onToggleMute: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onOpenDeployGuide: () => void;
  onOpenLeaderboard: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  combo,
  multiplier,
  lives,
  maxLives = 3,
  levelId,
  levelName,
  isMuted,
  isPaused,
  activePowerUps,
  onToggleMute,
  onTogglePause,
  onRestart,
  onOpenDeployGuide,
  onOpenLeaderboard,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* Top Bar Cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Left Cluster: Score, Combo & Multiplier */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">SCORE</span>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white tabular-nums drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Combo & Multiplier streak bar */}
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition ${
              combo > 1 ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' : 'bg-slate-900/60 text-slate-500'
            }`}>
              COMBO {combo}x
            </div>
            {combo > 1 && (
              <span className="text-[11px] font-mono text-cyan-300 font-semibold tabular-nums">
                ({multiplier.toFixed(1)}x BONUS)
              </span>
            )}
          </div>
        </div>

        {/* Center Cluster: Stage Title */}
        <div className="hidden md:flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">CURRENT SECTOR</span>
          <span className="text-sm font-mono font-bold text-cyan-300 tracking-wider">
            {levelName}
          </span>
        </div>

        {/* Right Cluster: Vitality Sockets (Hearts) & Utility Controls */}
        <div className="flex flex-col items-end gap-2">
          {/* Vitality Sockets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 mr-1">VITALITY</span>
            {Array.from({ length: Math.max(3, maxLives) }).map((_, i) => {
              const isFilled = i < lives;
              return (
                <svg
                  key={i}
                  viewBox="0 0 24 24"
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isFilled ? 'text-cyan-400 scale-100 drop-shadow-[0_0_6px_#00f0ff]' : 'text-slate-800 scale-90'
                  }`}
                  fill={isFilled ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              );
            })}
          </div>

          {/* Utility Icon Buttons (Pointer-events: auto) */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Deploy Guide Button */}
            <button
              onClick={onOpenDeployGuide}
              title="Cloudflare & GitHub 部署架構指南 [D]"
              className="p-1.5 rounded-lg border border-orange-500/40 bg-orange-950/70 hover:bg-orange-900/60 text-orange-300 transition"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Leaderboard Button */}
            <button
              onClick={onOpenLeaderboard}
              title="全球排行榜 [L]"
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-amber-300 transition"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* Mute Button */}
            <button
              onClick={onToggleMute}
              title="切換音效 [M]"
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Pause Button */}
            <button
              onClick={onTogglePause}
              title="暫停遊戲 [P / Esc]"
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition"
            >
              {isPaused ? <Play className="w-4 h-4 text-green-400" /> : <Pause className="w-4 h-4 text-slate-300" />}
            </button>

            {/* Restart Button */}
            <button
              onClick={onRestart}
              title="重新開始 [R]"
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Powerups Dock (Bottom-Left) */}
      <div className="flex flex-wrap items-center gap-2 mb-2 pointer-events-auto">
        {activePowerUps.map((p) => {
          const colors: Record<string, string> = {
            laser: 'border-emerald-500/50 bg-emerald-950/70 text-emerald-300',
            fireball: 'border-orange-500/50 bg-orange-950/70 text-orange-300',
            expander: 'border-cyan-500/50 bg-cyan-950/70 text-cyan-300',
            sticky: 'border-teal-500/50 bg-teal-950/70 text-teal-300',
            slow: 'border-purple-500/50 bg-purple-950/70 text-purple-300',
            shield: 'border-blue-500/50 bg-blue-950/70 text-blue-300',
          };
          const names: Record<string, string> = {
            laser: 'LASER CANNON',
            fireball: 'FIREBALL PENETRATE',
            expander: 'EXPANDED PADDLE',
            sticky: 'MAGNETIC GRIP',
            slow: 'TIME DILATION',
            shield: 'DEFENSE BARRIER',
          };

          return (
            <div
              key={p.type}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-bold ${
                colors[p.type] || 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              <span>{names[p.type] || p.type.toUpperCase()}</span>
              <span className="tabular-nums px-1.5 py-0.2 rounded bg-black/40 text-[10px]">
                {p.remaining}s
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
