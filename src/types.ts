export type GameColorName = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW' | 'PURPLE' | 'ORANGE';

export interface ColorDef {
  name: GameColorName;
  label: string;
  labelHi: string;
  hex: string;
  glow: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const GAME_COLORS: Record<GameColorName, ColorDef> = {
  RED: {
    name: 'RED',
    label: 'Red (लाल)',
    labelHi: 'लाल',
    hex: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.6)',
    bgClass: 'bg-red-500',
    textClass: 'text-red-500',
    borderClass: 'border-red-500',
  },
  BLUE: {
    name: 'BLUE',
    label: 'Blue (नीला)',
    labelHi: 'नीला',
    hex: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.6)',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-500',
    borderClass: 'border-blue-500',
  },
  GREEN: {
    name: 'GREEN',
    label: 'Green (हरा)',
    labelHi: 'हरा',
    hex: '#22C55E',
    glow: 'rgba(34, 197, 94, 0.6)',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-500',
    borderClass: 'border-emerald-500',
  },
  YELLOW: {
    name: 'YELLOW',
    label: 'Yellow (पीला)',
    labelHi: 'पीला',
    hex: '#EAB308',
    glow: 'rgba(234, 179, 8, 0.6)',
    bgClass: 'bg-amber-400',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-400',
  },
  PURPLE: {
    name: 'PURPLE',
    label: 'Purple (बैंगनी)',
    labelHi: 'बैंगनी',
    hex: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.6)',
    bgClass: 'bg-purple-500',
    textClass: 'text-purple-500',
    borderClass: 'border-purple-500',
  },
  ORANGE: {
    name: 'ORANGE',
    label: 'Orange (नारंगी)',
    labelHi: 'नारंगी',
    hex: '#F97316',
    glow: 'rgba(249, 115, 22, 0.6)',
    bgClass: 'bg-orange-500',
    textClass: 'text-orange-500',
    borderClass: 'border-orange-500',
  },
};

export const COLOR_KEYS: GameColorName[] = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'];

export type ShapeType = 'circle' | 'star' | 'diamond' | 'hexagon' | 'heart';

export interface FallingItem {
  id: number;
  x: number;
  y: number;
  radius: number;
  colorName: GameColorName;
  shape: ShapeType;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  pulsePhase: number;
  isBonus?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  life: number;
}

export interface GameStats {
  score: number;
  targetCatches: number;
  wrongCatches: number;
  maxCombo: number;
  currentCombo: number;
  accuracy: number;
  isNewHighScore: boolean;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';
