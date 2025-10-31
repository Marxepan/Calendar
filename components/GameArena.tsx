import React from 'react';
import GameGrid from './GameGrid';
import { PLAYER_BOARD_ID, AI_BOARD_ID } from '../constants';

interface Ship {
  name: string;
  length: number;
  positions: { row: number; col: number }[];
  hits: number;
  sunk: boolean;
  isVertical?: boolean;
}

interface Cell {
  state: string;
  shipId: string | null;
}

interface GameArenaProps {
  playerGrid: Cell[][];
  aiGrid: Cell[][];
  onPlayerShot: (row: number, col: number) => void;
  currentPlayerTurn: string;
  gamePhase: string;
  playerShips: Ship[];
  aiShips: Ship[];
}

const GameArena: React.FC<GameArenaProps> = ({
  playerGrid,
  aiGrid,
  onPlayerShot,
  currentPlayerTurn,
  gamePhase,
  playerShips,
  aiShips,
}) => {
  const getShipsStatus = (ships: Ship[]) => {
    const totalShips = ships.length;
    const sunkShips = ships.filter(s => s.sunk).length;
    return `${sunkShips}/${totalShips} zatopionych`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 justify-center">
      {/* Player's Board */}
      <div className="flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Twoja Plansza ({getShipsStatus(playerShips)})
          {currentPlayerTurn === PLAYER_BOARD_ID && gamePhase !== 'game_over' && (
            <span className="ml-2 text-indigo-500 text-sm font-normal">(Twoja tura)</span>
          )}
        </h3>
        <GameGrid
          grid={playerGrid}
          onCellClick={() => {}} // Player cannot shoot at their own board
          isPlayerTurn={false} // Not the active board for shooting
          isPlayerBoard={true}
          gamePhase={gamePhase}
        />
      </div>

      {/* AI's Board */}
      <div className="flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Plansza AI ({getShipsStatus(aiShips)})
          {currentPlayerTurn === AI_BOARD_ID && gamePhase !== 'game_over' && (
            <span className="ml-2 text-red-500 text-sm font-normal">(Tura AI)</span>
          )}
        </h3>
        <GameGrid
          grid={aiGrid}
          onCellClick={onPlayerShot}
          isPlayerTurn={currentPlayerTurn === PLAYER_BOARD_ID}
          isPlayerBoard={false}
          gamePhase={gamePhase}
        />
      </div>
    </div>
  );
};

export default GameArena;