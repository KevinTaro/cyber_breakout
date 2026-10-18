import React, { useState } from 'react';
import { BrickType, LevelData } from '../game/types';
import { BRICK_COLORS } from '../game/levels';
import { Play, Download, Upload, Trash2, X, Sliders } from 'lucide-react';

interface LevelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayCustomLevel: (levelData: LevelData) => void;
}

const ROWS = 7;
const COLS = 10;

const BRUSHES: { type: BrickType | 'empty'; label: string; color: string }[] = [
  { type: 'standard', label: 'STANDARD (1HP)', color: '#00f0ff' },
  { type: 'heavy', label: 'HEAVY (2HP)', color: '#f59e0b' },
  { type: 'armored', label: 'ARMORED (3HP)', color: '#ef4444' },
  { type: 'bomb', label: 'BOMB', color: '#ec4899' },
  { type: 'laser', label: 'LASER', color: '#10b981' },
  { type: 'multiball', label: 'TRI-BALL', color: '#8b5cf6' },
  { type: 'fireball', label: 'FIREBALL', color: '#f97316' },
  { type: 'expander', label: 'EXPAND', color: '#06b6d4' },
  { type: 'shield', label: 'SHIELD', color: '#3b82f6' },
  { type: 'sticky', label: 'STICKY', color: '#14b8a6' },
  { type: 'unbreakable', label: 'OBSTACLE', color: '#64748b' },
  { type: 'empty', label: 'ERASER', color: '#1e293b' },
];

export const LevelEditorModal: React.FC<LevelEditorModalProps> = ({
  isOpen,
  onClose,
  onPlayCustomLevel,
}) => {
  const [selectedBrush, setSelectedBrush] = useState<BrickType | 'empty'>('standard');
  const [stageName, setStageName] = useState('CUSTOM SECTOR // HACKER GRID');
  const [grid, setGrid] = useState<(BrickType | null)[][]>(() => {
    return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
  });

  if (!isOpen) return null;

  const handleCellClick = (r: number, c: number) => {
    const newGrid = grid.map((row, ri) =>
      row.map((cell, ci) => {
        if (ri === r && ci === c) {
          return selectedBrush === 'empty' ? null : selectedBrush;
        }
        return cell;
      })
    );
    setGrid(newGrid);
  };

  const handleClear = () => {
    setGrid(Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null)));
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(grid));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'custom_breakout_level.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
          setGrid(parsed);
        }
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handlePlay = () => {
    const customLevel: LevelData = {
      id: 999,
      name: stageName || 'CUSTOM SECTOR',
      theme: 'User Crafted Protocol',
      subtitle: 'Custom player-crafted level',
      accentColor: '#00f0ff',
      cols: COLS,
      rows: ROWS,
      layout: grid,
    };
    onPlayCustomLevel(customLevel);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 overflow-y-auto">
      <div className="relative w-full max-w-3xl flex flex-col rounded-2xl border border-purple-500/40 bg-slate-900 shadow-2xl shadow-purple-950/50 overflow-hidden text-slate-200 font-mono my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                LEVEL DESIGNER // CUSTOM MATRIX WORKSHOP
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Paint custom brick layouts · Instant test play · JSON export & import
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Name Input & Brush Palette */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              className="flex-1 w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              placeholder="關卡名稱..."
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出 JSON</span>
              </button>
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>匯入</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>
          </div>

          {/* Brushes */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-2 font-bold">
              選取磚塊筆刷:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {BRUSHES.map((b) => (
                <button
                  key={b.type}
                  onClick={() => setSelectedBrush(b.type)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition ${
                    selectedBrush === b.type
                      ? 'border-white bg-slate-800 text-white font-bold ring-2 ring-purple-500/50'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: b.color }} />
                  <span>{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Brick Grid */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-2 items-center">
            {grid.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-2 w-full justify-center">
                {row.map((cell, cIdx) => {
                  const info = cell ? BRICK_COLORS[cell] : null;
                  return (
                    <button
                      key={cIdx}
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      className="h-8 flex-1 rounded-sm border border-slate-800/80 transition transform active:scale-95 flex items-center justify-center text-[9px] font-bold"
                      style={{
                        backgroundColor: info ? info.base : 'rgba(255, 255, 255, 0.03)',
                        borderColor: info ? info.glow : 'rgba(255, 255, 255, 0.08)',
                        boxShadow: info ? `0 0 8px ${info.glow}` : 'none',
                        color: '#fff',
                      }}
                    >
                      {cell === 'bomb' ? '⚡' : cell === 'laser' ? '⫸' : cell === 'multiball' ? 'x3' : ''}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-xs">
          <span className="text-slate-400">點擊磚塊切換筆刷類型</span>
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold transition shadow-lg shadow-purple-500/20"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>立即試玩此關卡</span>
          </button>
        </div>
      </div>
    </div>
  );
};
