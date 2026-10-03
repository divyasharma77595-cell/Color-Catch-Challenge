import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameColorName, COLOR_KEYS, GameStats, GameStatus } from './types';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { sounds } from './audio';

const ROUND_DURATION_SECONDS = 60;
const COLOR_CHANGE_INTERVAL = 14; // Target changes every ~14 seconds
const STORAGE_HIGH_SCORE_KEY = 'colour_catcher_high_score';

export default function App() {
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(ROUND_DURATION_SECONDS);
  const [targetColor, setTargetColor] = useState<GameColorName>('RED');
  const [nextColorAlert, setNextColorAlert] = useState<{
    active: boolean;
    nextColor: GameColorName | null;
    countdown: number;
  }>({ active: false, nextColor: null, countdown: 0 });
  const [combo, setCombo] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Detailed statistics
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    targetCatches: 0,
    wrongCatches: 0,
    maxCombo: 0,
    currentCombo: 0,
    accuracy: 100,
    isNewHighScore: false,
  });

  const nextColorRef = useRef<GameColorName | null>(null);

  // Load high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HIGH_SCORE_KEY);
      if (saved) {
        setHighScore(parseInt(saved, 10) || 0);
      }
    } catch {
      // ignore
    }
  }, []);

  // Background Music Lifecycle Management
  useEffect(() => {
    if (gameStatus === 'playing') {
      const speedMultiplier = 1.0 + (Math.max(0, 60 - timeLeft) / 60) * 0.28;
      sounds.startBGM(speedMultiplier);
      sounds.updateBgmTempo(speedMultiplier);
    } else if (gameStatus === 'paused') {
      sounds.pauseBGM();
    } else {
      sounds.stopBGM();
    }

    return () => {
      if (gameStatus !== 'playing') {
        sounds.stopBGM();
      }
    };
  }, [gameStatus, timeLeft]);

  // Handle Score changes from GameCanvas
  const handleScoreChange = useCallback((delta: number, isTarget: boolean) => {
    setScore((prevScore) => {
      const newScore = Math.max(0, prevScore + delta);
      return newScore;
    });

    setStats((prev) => {
      const newTarget = isTarget ? prev.targetCatches + 1 : prev.targetCatches;
      const newWrong = !isTarget ? prev.wrongCatches + 1 : prev.wrongCatches;
      const newCombo = isTarget ? prev.currentCombo + 1 : 0;
      const newMaxCombo = Math.max(prev.maxCombo, newCombo);
      const total = newTarget + newWrong;
      const accuracy = total > 0 ? Math.round((newTarget / total) * 100) : 100;

      return {
        ...prev,
        targetCatches: newTarget,
        wrongCatches: newWrong,
        currentCombo: newCombo,
        maxCombo: newMaxCombo,
        accuracy,
      };
    });

    if (isTarget) {
      setCombo((c) => c + 1);
    } else {
      setCombo(0);
    }
  }, []);

  // Timer & Game Loop Engine
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }

        const newTime = prev - 1;

        // Play countdown tick sound in last 10 seconds
        if (newTime <= 10 && newTime > 0) {
          sounds.playCountdownTick(newTime <= 3);
        }

        // Check if we should warn or trigger Target Color switch
        const timeElapsed = ROUND_DURATION_SECONDS - newTime;
        const cycleProgress = timeElapsed % COLOR_CHANGE_INTERVAL;

        // 3 seconds before next color switch: activate alert
        if (cycleProgress === COLOR_CHANGE_INTERVAL - 3) {
          setTargetColor((currentColor) => {
            const available = COLOR_KEYS.filter((c) => c !== currentColor);
            const next = available[Math.floor(Math.random() * available.length)];
            nextColorRef.current = next;
            setNextColorAlert({
              active: true,
              nextColor: next,
              countdown: 3,
            });
            return currentColor;
          });
        } else if (cycleProgress === COLOR_CHANGE_INTERVAL - 2) {
          setNextColorAlert((curr) => ({ ...curr, countdown: 2 }));
        } else if (cycleProgress === COLOR_CHANGE_INTERVAL - 1) {
          setNextColorAlert((curr) => ({ ...curr, countdown: 1 }));
        } else if (cycleProgress === 0 && nextColorRef.current) {
          const next = nextColorRef.current;
          setTargetColor(next);
          sounds.playTargetChange();
          setNextColorAlert({ active: false, nextColor: null, countdown: 0 });
          nextColorRef.current = null;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus]);

  // Start a new game
  const startGame = () => {
    sounds.playButtonClick();
    setScore(0);
    setTimeLeft(ROUND_DURATION_SECONDS);
    setTargetColor('RED');
    setCombo(0);
    setNextColorAlert({ active: false, nextColor: null, countdown: 0 });
    setStats({
      score: 0,
      targetCatches: 0,
      wrongCatches: 0,
      maxCombo: 0,
      currentCombo: 0,
      accuracy: 100,
      isNewHighScore: false,
    });
    setGameStatus('playing');
  };

  // Return to Main Menu / Home
  const goHome = () => {
    sounds.stopBGM();
    setGameStatus('idle');
    setScore(0);
    setTimeLeft(ROUND_DURATION_SECONDS);
    setCombo(0);
    setNextColorAlert({ active: false, nextColor: null, countdown: 0 });
  };

  // End Game & calculate record
  const endGame = () => {
    sounds.stopBGM();
    setGameStatus('gameover');
    setScore((finalScore) => {
      let isNewRecord = false;
      if (finalScore > highScore) {
        isNewRecord = true;
        setHighScore(finalScore);
        try {
          localStorage.setItem(STORAGE_HIGH_SCORE_KEY, finalScore.toString());
        } catch {
          // ignore
        }
      }

      setStats((prev) => ({
        ...prev,
        score: finalScore,
        isNewHighScore: isNewRecord,
      }));

      return finalScore;
    });
  };

  // Controls
  const togglePause = () => {
    if (gameStatus === 'playing') {
      setGameStatus('paused');
    } else if (gameStatus === 'paused') {
      setGameStatus('playing');
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
  };

  return (
    <main
      id="colour-catcher-app"
      className="h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-1.5 sm:p-3 md:p-5 overflow-hidden"
    >
      <div className="w-full max-w-xl h-full flex flex-col items-center justify-between gap-1.5 sm:gap-2.5 relative">
        {/* Game HUD Bar */}
        <GameHUD
          score={score}
          highScore={highScore}
          timeLeft={timeLeft}
          targetColor={targetColor}
          nextColorAlert={nextColorAlert}
          combo={combo}
          isPaused={gameStatus === 'paused'}
          isMuted={isMuted}
          onTogglePause={togglePause}
          onToggleMute={toggleMute}
          onGoHome={goHome}
        />

        {/* Playfield Canvas Container */}
        <div className="relative w-full flex-1 min-h-0 flex flex-col">
          <GameCanvas
            isPlaying={gameStatus === 'playing'}
            isPaused={gameStatus === 'paused'}
            targetColor={targetColor}
            timeLeft={timeLeft}
            onScoreChange={handleScoreChange}
            combo={combo}
          />

          {/* Start Screen Overlay */}
          {gameStatus === 'idle' && (
            <StartScreen highScore={highScore} onStart={startGame} />
          )}

          {/* Pause Modal Overlay */}
          {gameStatus === 'paused' && (
            <PauseModal
              onResume={togglePause}
              onRestart={startGame}
              onGoHome={goHome}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />
          )}

          {/* Game Over Modal Overlay */}
          {gameStatus === 'gameover' && (
            <GameOverModal
              stats={stats}
              highScore={highScore}
              onRestart={startGame}
              onGoHome={goHome}
            />
          )}
        </div>
      </div>
    </main>
  );
}
