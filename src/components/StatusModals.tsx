import React from 'react';
import { RunMetrics } from '../game/types';
import { calculateGrade } from '../game/rules';
import { Play, RotateCcw, Home, Trophy, Send, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onHome }) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80">
      <div className="w-full max-w-sm rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-6 shadow-2xl shadow-cyan-950/60 text-center font-mono">
        <h2 className="text-2xl font-black text-cyan-400 tracking-wider mb-2">SIMULATION PAUSED</h2>
        <p className="text-xs text-slate-400 mb-6">CORE THREAD SUSPENDED · PRESS [P] OR [ESC] TO RESUME</p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-500/20 transition"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME [P]</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-slate-300 border border-slate-700 bg-slate-800 hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART LEVEL [R]</span>
          </button>

          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs text-slate-400 hover:text-white transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>TITLE SCREEN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  metrics: RunMetrics;
  onNextLevel: () => void;
  onRestart: () => void;
  onHome: () => void;
  onSubmitScore?: (name: string) => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  metrics,
  onNextLevel,
  onRestart,
  onHome,
  onSubmitScore,
}) => {
  const [playerName, setPlayerName] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    // Trigger celebratory particle confetti
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#f59e0b', '#ec4899', '#10b981'],
      });
    } catch {
      // ignore
    }
  }, []);

  const accuracy = metrics.shotsFired > 0 ? Math.min(100, Math.round((metrics.hits / metrics.shotsFired) * 100)) : 100;
  const grade = calculateGrade(accuracy, metrics.maxCombo, metrics.clearTime, 90);

  const gradeColors: Record<string, string> = {
    S: 'text-amber-300 border-amber-400 bg-amber-950/40 shadow-amber-500/30',
    A: 'text-cyan-300 border-cyan-400 bg-cyan-950/40 shadow-cyan-500/30',
    B: 'text-purple-300 border-purple-400 bg-purple-950/40 shadow-purple-500/30',
    C: 'text-slate-400 border-slate-600 bg-slate-900/40 shadow-slate-500/10',
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && onSubmitScore) {
      onSubmitScore(playerName.trim());
      setSubmitted(true);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/50 bg-slate-900/95 p-6 shadow-2xl shadow-emerald-950/60 text-center font-mono my-auto">
        {/* Grade Badge */}
        <div className="flex items-center justify-center mb-3">
          <div
            className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-4xl font-black shadow-lg ${gradeColors[grade]}`}
          >
            {grade}
          </div>
        </div>

        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-300 tracking-wider">
          STAGE CLEARED!
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-5">SECTOR DECRYPTED · EDGE DATA SYNCED</p>

        {/* Tabular Mastery Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 text-left">
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">RUN SCORE</span>
            <span className="text-xl font-black text-amber-300 tabular-nums">
              {metrics.score.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">MAX COMBO</span>
            <span className="text-xl font-black text-cyan-300 tabular-nums">
              {metrics.maxCombo}x
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">CLEAR TIME</span>
            <span className="text-xl font-black text-white tabular-nums">
              {metrics.clearTime}s
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">BRICKS CLEARED</span>
            <span className="text-xl font-black text-emerald-300 tabular-nums">
              {metrics.bricksDestroyed}
            </span>
          </div>
        </div>

        {/* Leaderboard Submission Form */}
        {!submitted ? (
          <form onSubmit={handleScoreSubmit} className="flex gap-2 mb-5">
            <input
              type="text"
              maxLength={14}
              placeholder="ENTER PLAYER CALLSIGN"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!playerName.trim()}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SUBMIT</span>
            </button>
          </form>
        ) : (
          <div className="mb-5 py-2 px-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 text-xs flex items-center justify-center gap-2">
            <Award className="w-4 h-4" />
            <span>SCORE SUBMITTED TO LEADERBOARD!</span>
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex flex-col gap-2">
          <button
            data-start="true"
            onClick={onNextLevel}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/20 transition"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>NEXT STAGE [SPACE]</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onRestart}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REPLAY STAGE</span>
            </button>

            <button
              onClick={onHome}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>TITLE SCREEN</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DefeatModalProps {
  metrics: RunMetrics;
  bestScore: number;
  onRetry: () => void;
  onHome: () => void;
  onSubmitScore?: (name: string) => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  metrics,
  bestScore,
  onRetry,
  onHome,
  onSubmitScore,
}) => {
  const [playerName, setPlayerName] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const isNewRecord = metrics.score > bestScore;

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && onSubmitScore) {
      onSubmitScore(playerName.trim());
      setSubmitted(true);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-slate-900/95 p-6 shadow-2xl shadow-red-950/60 text-center font-mono my-auto">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 tracking-wider">
          SIMULATION TERMINATED
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-5">VITALITY DEPLETED · SIGNAL LOST</p>

        {isNewRecord && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-950/40 text-amber-300 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>NEW PERSONAL BEST RECORD!</span>
          </div>
        )}

        {/* Tabular Progress Metrics */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 text-left">
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">FINAL SCORE</span>
            <span className="text-xl font-black text-amber-300 tabular-nums">
              {metrics.score.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">STAGE REACHED</span>
            <span className="text-xl font-black text-cyan-300 tabular-nums">
              SECTOR 0{metrics.level}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">MAX COMBO</span>
            <span className="text-xl font-black text-white tabular-nums">
              {metrics.maxCombo}x
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">BRICKS BROKEN</span>
            <span className="text-xl font-black text-rose-300 tabular-nums">
              {metrics.bricksDestroyed}
            </span>
          </div>
        </div>

        {/* Leaderboard Submission Form */}
        {!submitted ? (
          <form onSubmit={handleScoreSubmit} className="flex gap-2 mb-5">
            <input
              type="text"
              maxLength={14}
              placeholder="ENTER PLAYER CALLSIGN"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!playerName.trim()}
              className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SUBMIT</span>
            </button>
          </form>
        ) : (
          <div className="mb-5 py-2 px-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs flex items-center justify-center gap-2">
            <Award className="w-4 h-4" />
            <span>SCORE RECORDED IN ARCHIVE!</span>
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex flex-col gap-2">
          <button
            data-start="true"
            onClick={onRetry}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-red-400 to-amber-300 hover:from-red-300 hover:to-amber-200 shadow-lg shadow-red-500/20 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>TRY AGAIN [SPACE]</span>
          </button>

          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs text-slate-400 hover:text-white transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>TITLE SCREEN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
