import React, { useEffect } from 'react';
import { GameStats } from '../types';
import { Trophy, RotateCcw, Award, CheckCircle2, XCircle, Flame, Target, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { sounds } from '../audio';

interface GameOverModalProps {
  stats: GameStats;
  highScore: number;
  onRestart: () => void;
  onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScore,
  onRestart,
  onGoHome,
}) => {
  useEffect(() => {
    sounds.playGameOver(stats.isNewHighScore);
  }, [stats.isNewHighScore]);

  const handleRestart = () => {
    sounds.playButtonClick();
    onRestart();
  };

  const handleHome = () => {
    sounds.playButtonClick();
    onGoHome();
  };

  return (
    <div
      id="game-over-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl text-center flex flex-col items-center gap-3.5 sm:gap-4 my-auto"
      >
        {/* Celebration Header */}
        <div className="flex flex-col items-center">
          {stats.isNewHighScore ? (
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black uppercase tracking-wider mb-1"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              🎉 NEW BEST RECORD! 🎉
            </motion.div>
          ) : (
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">
              Time's Up! (समय समाप्त)
            </span>
          )}

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Game Over
          </h2>
        </div>

        {/* Final Score Display */}
        <div className="w-full py-3 px-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Final Score (अंतिम स्कोर)
          </span>
          <span
            className={`text-4xl sm:text-5xl font-black tabular-nums my-0.5 ${
              stats.score > 0 ? 'text-emerald-400' : 'text-slate-300'
            }`}
          >
            {stats.score}
          </span>

          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>All-time Best: </span>
            <span className="font-bold tabular-nums text-amber-300">{highScore}</span>
          </div>
        </div>

        {/* Performance Breakdown Grid */}
        <div className="w-full grid grid-cols-2 gap-2 text-left">
          {/* Target Catches */}
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Target Hits</div>
              <div className="text-xs sm:text-sm font-black text-white tabular-nums">
                {stats.targetCatches} <span className="text-[10px] text-emerald-400 font-normal">(+{stats.targetCatches * 10})</span>
              </div>
            </div>
          </div>

          {/* Wrong Catches */}
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 flex-shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Wrong Hits</div>
              <div className="text-xs sm:text-sm font-black text-white tabular-nums">
                {stats.wrongCatches} <span className="text-[10px] text-rose-400 font-normal">(-{stats.wrongCatches * 5})</span>
              </div>
            </div>
          </div>

          {/* Max Streak */}
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Max Streak</div>
              <div className="text-xs sm:text-sm font-black text-white tabular-nums">
                x{stats.maxCombo}
              </div>
            </div>
          </div>

          {/* Accuracy */}
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 flex-shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Accuracy</div>
              <div className="text-xs sm:text-sm font-black text-white tabular-nums">
                {stats.accuracy}%
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Play Again & Main Menu */}
        <div className="w-full flex flex-col sm:flex-row gap-2 mt-1">
          <motion.button
            id="btn-play-again"
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:opacity-90"
          >
            <RotateCcw className="w-4 h-4" />
            PLAY AGAIN
          </motion.button>

          <motion.button
            id="btn-gameover-home"
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleHome}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer active:opacity-90 transition-colors"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
