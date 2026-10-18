import React from 'react';
import { Difficulty } from '../game/types';
import { PRESET_LEVELS } from '../game/levels';
import { Play, Flame, Sparkles, BookOpen, Trophy, Sliders, ShieldCheck } from 'lucide-react';

interface TitleScreenProps {
  onStart: (difficulty: Difficulty, levelIndex: number, isEndless?: boolean) => void;
  onOpenDeployGuide: () => void;
  onOpenLeaderboard: () => void;
  onOpenLevelEditor: () => void;
  highScore: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenDeployGuide,
  onOpenLeaderboard,
  onOpenLevelEditor,
  highScore,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<Difficulty>('normal');
  const [selectedLevel, setSelectedLevel] = React.useState<number>(0);
  const [isEndless, setIsEndless] = React.useState<boolean>(false);

  // Keyboard support for Enter or Space to start
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart(selectedDifficulty, selectedLevel, isEndless);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedDifficulty, selectedLevel, isEndless, onStart]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-y-auto bg-slate-950/85">
      {/* Top Banner / Cloudflare Badge */}
      <div className="w-full flex items-center justify-between max-w-4xl">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 text-xs font-mono tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
          <span>CLOUDFLARE EDGE SERVERLESS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDeployGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-xs font-semibold transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>CLOUDFLARE & GITHUB GUIDE</span>
          </button>
        </div>
      </div>

      {/* Center Lockup: Bespoke SVG Emblem & Title */}
      <div className="flex flex-col items-center text-center my-auto py-2">
        {/* SVG Title Emblem */}
        <div className="relative mb-2">
          <svg className="w-20 h-20 sm:w-28 sm:h-28 mx-auto drop-shadow-[0_0_25px_rgba(0,240,255,0.7)]" viewBox="0 0 100 100" fill="none">
            {/* Hexagon Outer Frame */}
            <polygon
              points="50,4 92,26 92,74 50,96 8,74 8,26"
              stroke="#00f0ff"
              strokeWidth="2.5"
              fill="rgba(0,240,255,0.08)"
            />
            {/* Inner Core Bricks Pattern */}
            <rect x="26" y="28" width="14" height="7" rx="1.5" fill="#f59e0b" />
            <rect x="43" y="28" width="14" height="7" rx="1.5" fill="#ec4899" />
            <rect x="60" y="28" width="14" height="7" rx="1.5" fill="#10b981" />

            <rect x="34" y="38" width="14" height="7" rx="1.5" fill="#00f0ff" />
            <rect x="52" y="38" width="14" height="7" rx="1.5" fill="#8b5cf6" />

            {/* Glowing Ball */}
            <circle cx="50" cy="56" r="5" fill="#ffffff" filter="drop-shadow(0 0 8px #00f0ff)" />
            {/* Paddle Base */}
            <rect x="28" y="72" width="44" height="6" rx="3" fill="#00f0ff" />
            {/* Reflected Laser lines */}
            <line x1="50" y1="56" x2="35" y2="72" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="2 2" />
          </svg>
        </div>

        <h1 className="text-3xl sm:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-amber-300 drop-shadow-[0_2px_12px_rgba(0,240,255,0.4)] font-mono">
          CYBER BREAKOUT
        </h1>
        <p className="mt-1 text-xs sm:text-sm tracking-widest text-cyan-300/80 font-mono">
          SERVERLESS BRICK BREAKER // CLOUDFLARE PAGES & WORKERS
        </p>

        {/* High Score Hero Pill */}
        <div className="mt-2.5 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-mono">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>RECORD BEST:</span>
          <span className="font-bold text-amber-200 tabular-nums text-sm">{highScore.toLocaleString()} PTS</span>
        </div>

        {/* Level / Mode Selection */}
        <div className="mt-4 flex flex-col items-center gap-2.5 w-full max-w-md">
          {/* Difficulty Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs w-full justify-center">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(d)}
                className={`flex-1 py-1 px-2 rounded-lg font-mono font-medium transition text-[11px] sm:text-xs ${
                  selectedDifficulty === d
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d === 'easy' ? 'CASUAL (4 LIVES)' : d === 'normal' ? 'STANDARD (3 LIVES)' : 'OVERCLOCK (2 LIVES)'}
              </button>
            ))}
          </div>

          {/* Mode Tabs: Preset Stages vs Endless Mode */}
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setIsEndless(false)}
              className={`flex-1 py-1.5 px-2.5 rounded-xl border text-[11px] sm:text-xs font-mono transition flex items-center justify-center gap-1.5 ${
                !isEndless
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-sm shadow-cyan-500/20'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>CAMPAIGN (5 SECTORS)</span>
            </button>
            <button
              onClick={() => setIsEndless(true)}
              className={`flex-1 py-1.5 px-2.5 rounded-xl border text-[11px] sm:text-xs font-mono transition flex items-center justify-center gap-1.5 ${
                isEndless
                  ? 'border-orange-400 bg-orange-950/40 text-orange-300 shadow-sm shadow-orange-500/20'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>ENDLESS WAVE MODE</span>
            </button>
          </div>

          {/* Stage Selector if in campaign mode */}
          {!isEndless && (
            <div className="flex items-center gap-1.5 w-full justify-between">
              {PRESET_LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevel(idx)}
                  className={`flex-1 py-1 rounded-lg border text-[10px] sm:text-xs font-mono transition ${
                    selectedLevel === idx
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  STAGE 0{idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary Start CTA Button */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            data-start="true"
            onClick={() => onStart(selectedDifficulty, selectedLevel, isEndless)}
            className="group relative flex items-center justify-center gap-2.5 px-8 sm:px-12 py-3 rounded-xl font-mono text-sm sm:text-base font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-300 hover:from-cyan-300 hover:to-amber-300 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
            <span className="tracking-widest">START GAME [SPACE]</span>
          </button>
        </div>

        {/* Sub Navigation: Leaderboard / Level Editor */}
        <div className="mt-3 flex items-center gap-2.5">
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-[11px] sm:text-xs font-mono transition"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>LEADERBOARD</span>
          </button>
          <button
            onClick={onOpenLevelEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-[11px] sm:text-xs font-mono transition"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>LEVEL DESIGNER</span>
          </button>
        </div>
      </div>

      {/* Footer Controls Hint */}
      <div className="text-center font-mono text-[10px] sm:text-xs text-slate-400 border-t border-slate-800/80 pt-2 w-full max-w-3xl">
        <span>KEYS: [A / D] or [← / →] Move · [Space] Launch / Fire · [P / Esc] Pause · [M] Mute · Touch & Mouse Drag</span>
      </div>
    </div>
  );
};
