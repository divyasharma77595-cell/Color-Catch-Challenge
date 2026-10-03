import React, { useEffect } from 'react';
import { GAME_COLORS, COLOR_KEYS } from '../types';
import { Play, Trophy, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { sounds } from '../audio';

interface StartScreenProps {
  highScore: number;
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ highScore, onStart }) => {
  const handleStart = () => {
    sounds.playButtonClick();
    onStart();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      id="start-screen-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl text-center flex flex-col items-center gap-3 sm:gap-4 my-auto"
      >
        {/* Header with Mini Logo + Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-400 to-blue-500 p-0.5 shadow-lg flex-shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 animate-pulse" />
              <div className="absolute top-1 left-1.5 w-2 h-2 rounded-full bg-red-500" />
              <div className="absolute bottom-1 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
            </div>
          </div>

          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
              Colour Catcher
            </h1>
            <p className="text-xs font-semibold text-emerald-400 mt-1">
              कलर कैचर — Catch Target Color!
            </p>
          </div>
        </div>

        {/* High Score Badge */}
        {highScore > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Best Score:</span>
            <span className="font-extrabold text-amber-300 tabular-nums">{highScore}</span>
          </div>
        )}

        {/* Rules Cards (Compact for Mobile) */}
        <div className="w-full bg-slate-950/70 rounded-xl p-3 sm:p-3.5 border border-slate-800/80 text-left space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
              ✓
            </span>
            <div>
              <strong className="text-emerald-400">Target Color:</strong> Top wala color catch karein (<span className="text-emerald-300 font-bold">+10 pts</span>)
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
              ✕
            </span>
            <div>
              <strong className="text-rose-400">Wrong Colors:</strong> Galat color se bachein (<span className="text-rose-300 font-bold">-5 pts</span>)
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
              ○
            </span>
            <div>
              <strong className="text-blue-300">Miss:</strong> Ball chhutne par koi penalty nahi
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
              ⏱
            </span>
            <div>
              <strong className="text-amber-400">60 Seconds Round</strong> (Speed fast hoti jayegi!)
            </div>
          </div>
        </div>

        {/* Available Color Dots */}
        <div className="flex items-center justify-center gap-2 py-0.5">
          {COLOR_KEYS.map((k) => (
            <span
              key={k}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-sm ring-1 ring-white/20"
              style={{ backgroundColor: GAME_COLORS[k].hex }}
              title={GAME_COLORS[k].label}
            />
          ))}
        </div>

        {/* Mobile / Desktop Control Tip */}
        <p className="text-[11px] text-slate-400 leading-tight">
          📱 <b>Touch/Drag</b> se basket slide karein ya <b>← / → keys</b> use karein
        </p>

        {/* Prominent Start Button - Ultra Visible on All Screens */}
        <motion.button
          id="btn-start-game"
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          animate={{ scale: [1, 1.025, 1] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          onClick={handleStart}
          className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-base sm:text-lg tracking-wide shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer active:opacity-90"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          START GAME (शुरू करें)
        </motion.button>
      </motion.div>
    </div>
  );
};
