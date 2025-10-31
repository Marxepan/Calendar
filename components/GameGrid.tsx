import React from 'react';
import { GRID_SIZE, CELL_STATE, CELL_COLORS } from '../constants';

interface Cell {
  state: string;
  shipId: string | null;
}

interface GameGridProps {
  grid: Cell[][];
  onCellClick: (row: number, col: number) => void;
  isPlayerTurn: boolean; // Is it current player's turn?
  isPlayerBoard: boolean; // Is this the player's own board (shows ships)?
  gamePhase: string; // Current game phase to disable clicks when not in player's turn
}

const getCellClass = (cell: Cell, isPlayerBoard: boolean): string => {
  switch (cell.state) {
    case CELL_STATE.EMPTY:
      return CELL_COLORS.EMPTY;
    case CELL_STATE.SHIP:
      return isPlayerBoard ? CELL_COLORS.SHIP : CELL_COLORS.EMPTY; // Only show player's own ships
    case CELL_STATE.MISS:
      return CELL_COLORS.MISS;
    case CELL_STATE.HIT:
      return CELL_COLORS.HIT;
    case CELL_STATE.SUNK:
      return CELL_COLORS.SUNK;
    default:
      return CELL_COLORS.EMPTY;
  }
};

const GameGrid: React.FC<GameGridProps> = ({
  grid,
  onCellClick,
  isPlayerTurn,
  isPlayerBoard,
  gamePhase,
}) => {
  const letters = Array.from({ length: GRID_SIZE }, (_, i) => String.fromCharCode(65 + i)); // A, B, C...

  const isClickable = !isPlayerBoard && isPlayerTurn && gamePhase === 'player_turn';

  const handleCellClick = (row: number, col: number) => {
    if (isClickable && grid[row][col].state !== CELL_STATE.HIT && grid[row][col].state !== CELL_STATE.MISS && grid[row][col].state !== CELL_STATE.SUNK) {
      onCellClick(row, col);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-[auto_repeat(10,minmax(0,1fr))] gap-px">
        {/* Column Headers (A, B, C...) */}
        <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300"></div>
        {letters.map((letter) => (
          <div
            key={letter}
            className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300"
          >
            {letter}
          </div>
        ))}

        {grid.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {/* Row Headers (1, 2, 3...) */}
            <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
              {rowIndex + 1}
            </div>
            {row.map((cell, colIndex) => {
              const cellClass = getCellClass(cell, isPlayerBoard);
              const isCellAlreadyShot = cell.state === CELL_STATE.HIT || cell.state === CELL_STATE.MISS || cell.state === CELL_STATE.SUNK;
              const cellHoverClass = isClickable && !isCellAlreadyShot ? CELL_COLORS.HOVER : CELL_COLORS.DISABLED_HOVER;

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10
                    border border-gray-300 dark:border-gray-700
                    flex items-center justify-center
                    relative
                    ${cellClass} ${cellHoverClass}
                    transition-colors duration-200 ease-in-out
                  `}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  disabled={!isClickable || isCellAlreadyShot}
                  aria-label={`${isPlayerBoard ? 'Twoja plansza' : 'Plansza AI'}, ${letters[colIndex]}${rowIndex + 1}, stan: ${cell.state === CELL_STATE.SHIP && !isPlayerBoard ? CELL_STATE.EMPTY : cell.state}`}
                >
                  {cell.state === CELL_STATE.MISS && (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white dark:bg-gray-300"></div>
                  )}
                  {(cell.state === CELL_STATE.HIT || cell.state === CELL_STATE.SUNK) && (
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4 text-white dark:text-gray-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default GameGrid;