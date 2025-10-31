export const GRID_SIZE = 10; // 10x10 grid

export const SHIP_TYPES = [
  { name: "Lotniskowiec", length: 5 }, // Carrier
  { name: "Pancernik", length: 4 }, // Battleship
  { name: "Niszczyciel", length: 3 }, // Destroyer
  { name: "Okręt Podwodny", length: 3 }, // Submarine
  { name: "Kanonierka", length: 2 }, // Patrol Boat
];

export const CELL_STATE = {
  EMPTY: "empty",
  SHIP: "ship",
  HIT: "hit",
  MISS: "miss",
  SUNK: "sunk",
};

export const GAME_PHASE = {
  SETUP: "setup",
  PLAYER_TURN: "player_turn",
  AI_TURN: "ai_turn",
  GAME_OVER: "game_over",
};

export const PLAYER_BOARD_ID = 'player-board';
export const AI_BOARD_ID = 'ai-board';

export const CELL_COLORS = {
  EMPTY: 'bg-blue-100 dark:bg-blue-900 border-gray-300 dark:border-gray-700',
  SHIP: 'bg-gray-700 dark:bg-gray-500 border-gray-800 dark:border-gray-400',
  MISS: 'bg-blue-300 dark:bg-blue-700 border-blue-400 dark:border-blue-600',
  HIT: 'bg-red-500 dark:bg-red-600 border-red-600 dark:border-red-700',
  SUNK: 'bg-red-700 dark:bg-red-800 border-red-800 dark:border-red-900',
  HOVER: 'hover:bg-blue-200 dark:hover:bg-blue-800',
  DISABLED_HOVER: 'cursor-not-allowed',
};