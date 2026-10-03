import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { sounds } from '../audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onGoHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onGoHome,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div
      id="pause-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-center flex flex-col items-center gap-3.5 my-auto"
      >
        <h3 className="text-xl sm:text-2xl font-black text-white">Game Paused</h3>
        <p className="text-xs text-slate-400">Take a breath! Catch your target when ready.</p>

        <div className="w-full flex flex-col gap-2 mt-1">
          {/* Resume */}
          <button
            id="btn-pause-resume"
            type="button"
            onClick={() => {
              sounds.playButtonClick();
              onResume();
            }}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Resume Game
          </button>

          {/* Sound Toggle */}
          <button
            id="btn-pause-sound"
            type="button"
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            {isMuted ? 'Sound: Off' : 'Sound: On'}
          </button>

          {/* Restart */}
          <button
            id="btn-pause-restart"
            type="button"
            onClick={() => {
              sounds.playButtonClick();
              onRestart();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart Round
          </button>

          {/* Back to Home Screen */}
          <button
            id="btn-pause-home"
            type="button"
            onClick={() => {
              sounds.playButtonClick();
              onGoHome();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 border border-rose-500/30 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Main Menu (वापस जाएं)
          </button>
        </div>
      </motion.div>
    </div>
  );
};
