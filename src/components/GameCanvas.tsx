import React, { useEffect, useRef, useCallback } from 'react';
import {
  GameColorName,
  GAME_COLORS,
  COLOR_KEYS,
  ShapeType,
  FallingItem,
  Particle,
  FloatingText,
} from '../types';
import { sounds } from '../audio';

interface GameCanvasProps {
  isPlaying: boolean;
  isPaused: boolean;
  targetColor: GameColorName;
  timeLeft: number;
  onScoreChange: (delta: number, isTarget: boolean) => void;
  combo: number;
  difficultyMultiplier?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  isPlaying,
  isPaused,
  targetColor,
  timeLeft,
  onScoreChange,
  combo,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mutable Game Loop State
  const stateRef = useRef({
    basketX: 0,
    basketTargetX: 0,
    basketWidth: 100,
    basketHeight: 34,
    items: [] as FallingItem[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    shake: 0,
    nextItemId: 1,
    nextTextId: 1,
    lastSpawnTime: 0,
    spawnInterval: 950,
    width: 600,
    height: 700,
    keys: { left: false, right: false },
    currentTargetColor: targetColor,
    isHovering: false,
  });

  // Keep targetColor synchronized with ref for 60fps loop
  useEffect(() => {
    stateRef.current.currentTargetColor = targetColor;
  }, [targetColor]);

  // Adjust difficulty and spawn frequency as time elapses (from 60s down to 0s)
  const elapsed = Math.max(0, 60 - timeLeft);
  const speedScale = 1 + (elapsed / 60) * 0.9; // scales up to ~1.9x speed at end
  const currentSpawnInterval = Math.max(450, 950 - (elapsed / 60) * 450);

  useEffect(() => {
    stateRef.current.spawnInterval = currentSpawnInterval;
  }, [currentSpawnInterval]);

  // Handle Resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      if (w > 0 && h > 0) {
        stateRef.current.width = w;
        stateRef.current.height = h;
        // Responsive basket width
        const responsiveBasketWidth = Math.min(120, Math.max(75, w * 0.22));
        stateRef.current.basketWidth = responsiveBasketWidth;

        if (stateRef.current.basketX === 0) {
          stateRef.current.basketX = w / 2;
          stateRef.current.basketTargetX = w / 2;
        }

        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = w * dpr;
          canvas.height = h * dpr;
        }
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused]);

  // Pointer / Touch Handling
  const handlePointerMove = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    stateRef.current.basketTargetX = Math.max(
      stateRef.current.basketWidth / 2,
      Math.min(rect.width - stateRef.current.basketWidth / 2, relativeX)
    );
  }, []);

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused) return;
    handlePointerMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused) return;
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused) return;
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  // Helper to spawn floating text
  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    stateRef.current.floatingTexts.push({
      id: stateRef.current.nextTextId++,
      x,
      y,
      text,
      color,
      alpha: 1.0,
      scale: 1.2,
      life: 0,
    });
  };

  // Helper to spawn explosion particles
  const addParticles = (x: number, y: number, colorHex: string, count: number = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 5;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: 2.5 + Math.random() * 3.5,
        color: colorHex,
        alpha: 1,
        life: 0,
        maxLife: 25 + Math.random() * 15,
      });
    }
  };

  // Helper to draw geometric shapes
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    shape: ShapeType,
    colorHex: string,
    rotation: number,
    pulse: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const effRadius = radius * (1 + Math.sin(pulse) * 0.06);

    ctx.shadowBlur = 12;
    ctx.shadowColor = colorHex;

    if (shape === 'circle') {
      // 3D Glossy Sphere
      const grad = ctx.createRadialGradient(
        -effRadius * 0.3,
        -effRadius * 0.3,
        effRadius * 0.1,
        0,
        0,
        effRadius
      );
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.3, colorHex);
      grad.addColorStop(1, '#111827');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, effRadius, 0, Math.PI * 2);
      ctx.fill();

      // Top specular highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(-effRadius * 0.3, -effRadius * 0.35, effRadius * 0.35, effRadius * 0.2, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === 'star') {
      // 5-pointed Star
      ctx.fillStyle = colorHex;
      ctx.beginPath();
      const points = 5;
      const innerRadius = effRadius * 0.5;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? effRadius : innerRadius;
        const a = (i * Math.PI) / points - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (shape === 'diamond') {
      // Diamond
      ctx.fillStyle = colorHex;
      ctx.beginPath();
      ctx.moveTo(0, -effRadius * 1.1);
      ctx.lineTo(effRadius * 0.9, 0);
      ctx.lineTo(0, effRadius * 1.1);
      ctx.lineTo(-effRadius * 0.9, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (shape === 'hexagon') {
      // Hexagon
      ctx.fillStyle = colorHex;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = Math.cos(a) * effRadius;
        const py = Math.sin(a) * effRadius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (shape === 'heart') {
      // Heart
      ctx.fillStyle = colorHex;
      ctx.beginPath();
      const topCurveHeight = effRadius * 0.6;
      ctx.moveTo(0, effRadius * 0.4);
      ctx.bezierCurveTo(0, 0, -effRadius, -topCurveHeight, -effRadius, -effRadius * 0.4);
      ctx.bezierCurveTo(-effRadius, -effRadius, 0, -effRadius * 0.8, 0, -effRadius * 0.3);
      ctx.bezierCurveTo(0, -effRadius * 0.8, effRadius, -effRadius, effRadius, -effRadius * 0.4);
      ctx.bezierCurveTo(effRadius, -topCurveHeight, 0, 0, 0, effRadius * 0.8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  // Main Canvas Rendering & Physics Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const canvas = canvasRef.current;
      const state = stateRef.current;

      if (canvas) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        if (ctx && state.width > 0 && state.height > 0) {
          ctx.save();
          ctx.scale(dpr, dpr);

          // Apply screen shake if active
          if (state.shake > 0) {
            const shakeOffsetX = (Math.random() - 0.5) * state.shake;
            const shakeOffsetY = (Math.random() - 0.5) * state.shake;
            ctx.translate(shakeOffsetX, shakeOffsetY);
            state.shake = Math.max(0, state.shake - dt * 30);
          }

          // Clear background (Atmospheric dark theme with subtle grid pattern)
          ctx.fillStyle = '#0F172A'; // Slate 900
          ctx.fillRect(0, 0, state.width, state.height);

          // Draw subtle background grid
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.lineWidth = 1;
          const gridSize = 40;
          for (let x = 0; x < state.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, state.height);
            ctx.stroke();
          }
          for (let y = 0; y < state.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(state.width, y);
            ctx.stroke();
          }

          // Top ambient light matching target color
          const activeTarget = GAME_COLORS[state.currentTargetColor] || GAME_COLORS.RED;
          const ambientGrad = ctx.createLinearGradient(0, 0, 0, 180);
          ambientGrad.addColorStop(0, `${activeTarget.hex}22`);
          ambientGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = ambientGrad;
          ctx.fillRect(0, 0, state.width, 180);

          // Update Basket Position (Smooth lerp + Keyboard support)
          if (isPlaying && !isPaused) {
            if (state.keys.left) {
              state.basketTargetX = Math.max(
                state.basketWidth / 2,
                state.basketTargetX - 600 * dt
              );
            }
            if (state.keys.right) {
              state.basketTargetX = Math.min(
                state.width - state.basketWidth / 2,
                state.basketTargetX + 600 * dt
              );
            }

            // Smooth interpolation
            state.basketX += (state.basketTargetX - state.basketX) * Math.min(1, 18 * dt);
          }

          // Spawn Falling Items
          if (isPlaying && !isPaused) {
            if (time - state.lastSpawnTime > state.spawnInterval) {
              state.lastSpawnTime = time;

              // Choose color: 42% chance target color, 58% other random colors for challenge
              const isTargetSpawn = Math.random() < 0.42;
              let chosenColor: GameColorName;
              if (isTargetSpawn) {
                chosenColor = state.currentTargetColor;
              } else {
                const otherColors = COLOR_KEYS.filter((c) => c !== state.currentTargetColor);
                chosenColor = otherColors[Math.floor(Math.random() * otherColors.length)];
              }

              // Shape variety
              const shapes: ShapeType[] = ['circle', 'circle', 'star', 'diamond', 'hexagon', 'heart'];
              const chosenShape = shapes[Math.floor(Math.random() * shapes.length)];
              const radius = 17 + Math.random() * 6;
              const spawnX = radius + 15 + Math.random() * (state.width - radius * 2 - 30);
              const baseSpeed = (175 + Math.random() * 90) * speedScale;

              state.items.push({
                id: state.nextItemId++,
                x: spawnX,
                y: -radius - 10,
                radius,
                colorName: chosenColor,
                shape: chosenShape,
                speed: baseSpeed,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 3,
                pulsePhase: Math.random() * Math.PI * 2,
                isBonus: Math.random() < 0.08,
              });
            }
          }

          const basketY = state.height - 65;
          const basketHalfW = state.basketWidth / 2;
          const basketLeft = state.basketX - basketHalfW;
          const basketRight = state.basketX + basketHalfW;
          const basketTop = basketY;
          const basketBottom = basketY + state.basketHeight;

          // Update & Draw Falling Items
          const remainingItems: FallingItem[] = [];

          for (let i = 0; i < state.items.length; i++) {
            const item = state.items[i];

            if (isPlaying && !isPaused) {
              item.y += item.speed * dt;
              item.rotation += item.rotationSpeed * dt;
              item.pulsePhase += dt * 4;
            }

            const colorDef = GAME_COLORS[item.colorName] || GAME_COLORS.RED;

            // Collision Detection with Basket Opening
            // Check if ball touches top of basket
            const isColliding =
              item.y + item.radius >= basketTop &&
              item.y - item.radius <= basketBottom &&
              item.x + item.radius >= basketLeft &&
              item.x - item.radius <= basketRight;

            if (isColliding && isPlaying && !isPaused) {
              const isTarget = item.colorName === state.currentTargetColor;

              if (isTarget) {
                // Correct target catch: +10 points (plus combo streak bonuses)
                const pointGain = 10;
                onScoreChange(pointGain, true);
                sounds.playCatch(item.isBonus, combo);
                addParticles(item.x, basketTop, colorDef.hex, 22);

                const bonusText = combo >= 3 ? `+${pointGain} (x${combo + 1})` : `+${pointGain}`;
                addFloatingText(item.x, basketTop - 15, bonusText, '#4ADE80');
              } else {
                // Wrong color caught: -5 points
                onScoreChange(-5, false);
                sounds.playWrong();
                state.shake = 12;
                addParticles(item.x, basketTop, '#EF4444', 16);
                addFloatingText(item.x, basketTop - 15, '-5', '#F87171');
              }
              // Item caught, do not keep
              continue;
            }

            // If item fell off screen: Clean disappearance with NO penalty
            if (item.y - item.radius > state.height + 20) {
              // Missed ball -> 0 penalty, clean removal
              continue;
            }

            // Draw Item
            drawShape(
              ctx,
              item.x,
              item.y,
              item.radius,
              item.shape,
              colorDef.hex,
              item.rotation,
              item.pulsePhase
            );

            remainingItems.push(item);
          }
          state.items = remainingItems;

          // Draw Basket / Catcher
          const targetGlow = activeTarget.hex;

          // Basket Shadow/Glow underneath
          ctx.save();
          ctx.shadowColor = targetGlow;
          ctx.shadowBlur = 18;

          // Basket Main Body (Sleek futuristic cyber bowl)
          const bW = state.basketWidth;
          const bH = state.basketHeight;
          const bX = state.basketX - bW / 2;
          const bY = basketY;

          // Basket Gradient
          const basketGrad = ctx.createLinearGradient(bX, bY, bX, bY + bH);
          basketGrad.addColorStop(0, '#1E293B');
          basketGrad.addColorStop(0.5, '#0F172A');
          basketGrad.addColorStop(1, '#020617');

          ctx.fillStyle = basketGrad;
          ctx.beginPath();
          // Rounded trapezoid / modern curved container
          ctx.moveTo(bX + 8, bY);
          ctx.lineTo(bX + bW - 8, bY);
          ctx.quadraticCurveTo(bX + bW, bY, bX + bW - 4, bY + 12);
          ctx.lineTo(bX + bW - 14, bY + bH);
          ctx.quadraticCurveTo(bX + bW - 16, bY + bH + 4, bX + bW - 24, bY + bH + 4);
          ctx.lineTo(bX + 24, bY + bH + 4);
          ctx.quadraticCurveTo(bX + 16, bY + bH + 4, bX + 14, bY + bH);
          ctx.lineTo(bX + 4, bY + 12);
          ctx.quadraticCurveTo(bX, bY, bX + 8, bY);
          ctx.closePath();
          ctx.fill();

          // Basket Outer Border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Glowing Catch Rim (Highlights the current Target Color)
          ctx.beginPath();
          ctx.moveTo(bX + 4, bY + 2);
          ctx.lineTo(bX + bW - 4, bY + 2);
          ctx.strokeStyle = targetGlow;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.shadowColor = targetGlow;
          ctx.shadowBlur = 14;
          ctx.stroke();

          // Inner laser pulse on basket
          ctx.beginPath();
          ctx.moveTo(bX + 14, bY + 14);
          ctx.lineTo(bX + bW - 14, bY + 14);
          ctx.strokeStyle = `${targetGlow}66`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Center target color crystal emblem inside basket
          ctx.beginPath();
          ctx.arc(state.basketX, bY + bH / 2 + 2, 5, 0, Math.PI * 2);
          ctx.fillStyle = targetGlow;
          ctx.shadowColor = targetGlow;
          ctx.shadowBlur = 8;
          ctx.fill();

          ctx.restore();

          // Update & Draw Particles
          const remainingParticles: Particle[] = [];
          for (let p of state.particles) {
            if (isPlaying && !isPaused) {
              p.x += p.vx;
              p.y += p.vy;
              p.vy += 0.15; // Gravity
              p.life += 1;
              p.alpha = Math.max(0, 1 - p.life / p.maxLife);
            }

            if (p.life < p.maxLife) {
              ctx.save();
              ctx.globalAlpha = p.alpha;
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
              remainingParticles.push(p);
            }
          }
          state.particles = remainingParticles;

          // Update & Draw Floating Score Texts
          const remainingTexts: FloatingText[] = [];
          for (let ft of state.floatingTexts) {
            if (isPlaying && !isPaused) {
              ft.y -= 1.8;
              ft.life += 1;
              ft.alpha = Math.max(0, 1 - ft.life / 35);
            }

            if (ft.life < 35) {
              ctx.save();
              ctx.globalAlpha = ft.alpha;
              ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
              ctx.fillStyle = ft.color;
              ctx.shadowColor = '#000000';
              ctx.shadowBlur = 4;
              ctx.textAlign = 'center';
              ctx.fillText(ft.text, ft.x, ft.y);
              ctx.restore();
              remainingTexts.push(ft);
            }
          }
          state.floatingTexts = remainingTexts;

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isPaused, onScoreChange, combo, speedScale]);

  // Touch button controls for mobile
  const moveBasketLeft = () => {
    stateRef.current.basketTargetX = Math.max(
      stateRef.current.basketWidth / 2,
      stateRef.current.basketTargetX - 75
    );
  };

  const moveBasketRight = () => {
    stateRef.current.basketTargetX = Math.min(
      stateRef.current.width - stateRef.current.basketWidth / 2,
      stateRef.current.basketTargetX + 75
    );
  };

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className="relative w-full h-full min-h-[260px] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 select-none touch-none cursor-ew-resize bg-slate-900"
    >
      <canvas
        ref={canvasRef}
        id="game-main-canvas"
        className="w-full h-full block"
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
        onTouchStart={onTouchStart}
      />

      {/* On-screen touch controls for mobile */}
      {isPlaying && !isPaused && (
        <div className="md:hidden absolute bottom-3 inset-x-0 flex justify-between px-5 pointer-events-none z-10">
          <button
            id="mobile-ctrl-left"
            type="button"
            className="pointer-events-auto w-14 h-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-600 text-white font-bold text-xl flex items-center justify-center shadow-lg active:scale-95 active:bg-slate-700"
            onClick={moveBasketLeft}
            aria-label="Move Left"
          >
            ←
          </button>
          <button
            id="mobile-ctrl-right"
            type="button"
            className="pointer-events-auto w-14 h-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-600 text-white font-bold text-xl flex items-center justify-center shadow-lg active:scale-95 active:bg-slate-700"
            onClick={moveBasketRight}
            aria-label="Move Right"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};
