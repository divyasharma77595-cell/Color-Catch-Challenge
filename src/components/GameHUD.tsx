import React from 'react';
import { GameColorName, GAME_COLORS } from '../types';
import { Volume2, VolumeX, Pause, Play, Trophy, Flame, Clock, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameHUDProps {
  score: number;
  highScore: number;
  timeLeft: number;
  targetColor: GameColorName;
  nextColorAlert: { active: boolean; nextColor: GameColorName | null; countdown: number };
  combo: number;
  isPaused: boolean;
  isMuted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onGoHome: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  highScore,
  timeLeft,
  targetColor,
  nextColorAlert,
  combo,
  isPaused,
  isMuted,
  onTogglePause,
  onToggleMute,
  onGoHome,
}) => {
  const activeColorDef = GAME_COLORS[targetColor] || GAME_COLORS.RED;
  const isTimeUrgent = timeLeft <= 10;
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / 60) * 100));

  return (
    <header id="game-hud-header" className="w-full flex flex-col gap-1.5 sm:gap-2 z-20 flex-shrink-0">
      {/* Top Bar with Score, Timer, Best, Controls */}
      <div className="flex items-center justify-between gap-1.5 px-2 sm:px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-md">
        {/* Left Side: Home Back Button & Score */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="hud-btn-home"
            type="button"
            onClick={onGoHome}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center justify-center"
            title="Main Menu / Back (वापस जाएं)"
            aria-label="Back to Main Menu"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Score
            </span>
            <motion.span
              key={score}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`text-xl sm:text-2xl font-black tabular-nums leading-tight ${
                score >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {score}
            </motion.span>
          </div>

          {/* Combo Multiplier */}
          <AnimatePresence>
            {combo >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="hidden xs:flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] sm:text-xs font-bold shadow-sm"
              >
                <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
                <span>x{combo}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Timer Center */}
        <div className="flex items-center gap-1.5">
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono font-bold text-sm sm:text-base transition-colors ${
              isTimeUrgent
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-200'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isTimeUrgent ? 'text-rose-400' : 'text-slate-400'}`} />
            <span className="tabular-nums">{timeLeft}s</span>
          </div>
        </div>

        {/* High Score & Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {highScore > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300 text-[11px] sm:text-xs">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="font-bold text-amber-400 tabular-nums">{highScore}</span>
            </div>
          )}

          {/* Sound Mute Button */}
          <button
            id="hud-btn-mute"
            type="button"
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Pause Button */}
          <button
            id="hud-btn-pause"
            type="button"
            onClick={onTogglePause}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title={isPaused ? 'Resume Game' : 'Pause Game'}
            aria-label="Toggle Pause"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-linear rounded-full ${
            isTimeUrgent ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
          }`}
          style={{ width: `${timerPercentage}%` }}
        />
      </div>

      {/* Target Color Banner */}
      <div className="relative w-full flex items-center justify-center">
        <motion.div
          key={targetColor}
          initial={{ scale: 0.94, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-slate-900/95 border-2 shadow-lg backdrop-blur-md"
          style={{
            borderColor: activeColorDef.hex,
            boxShadow: `0 0 20px ${activeColorDef.glow}`,
          }}
        >
          <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-300">
            Target Color:
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full inline-block shadow-md ring-2 ring-white/40 animate-pulse flex-shrink-0"
              style={{ backgroundColor: activeColorDef.hex }}
            />
            <span
              className="text-base sm:text-lg font-black tracking-wide"
              style={{ color: activeColorDef.hex }}
            >
              {activeColorDef.label}
            </span>
          </div>
        </motion.div>

        {/* Color Switch Warning Banner */}
        <AnimatePresence>
          {nextColorAlert.active && nextColorAlert.nextColor && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.9 }}
              className="absolute -bottom-6 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[11px] shadow-lg flex items-center gap-1 z-30"
            >
              <span>⚡ Color switching in {nextColorAlert.countdown}s!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
