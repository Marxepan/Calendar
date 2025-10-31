import React, { useState, useEffect, useCallback } from 'react';
import { GAME_PHASE, GRID_SIZE, SHIP_TYPES, CELL_STATE, PLAYER_BOARD_ID, AI_BOARD_ID } from './constants';
import {
  initializeGrid,
  placeShip,
  checkHitAndSunk,
  checkGameOver,
  generateRandomPlacement,
  findUnshotCells,
} from './utils/gameLogic';
import ShipPlacement from './components/ShipPlacement';
import GameArena from './components/GameArena';

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

const App: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<string>(GAME_PHASE.SETUP);
  const [playerGrid, setPlayerGrid] = useState<Cell[][]>(() => initializeGrid());
  const [aiGrid, setAiGrid] = useState<Cell[][]>(() => initializeGrid());
  const [playerShips, setPlayerShips] = useState<Ship[]>(
    SHIP_TYPES.map((s) => ({ ...s, positions: [], hits: 0, sunk: false, isVertical: false })),
  );
  const [aiShips, setAiShips] = useState<Ship[]>(
    SHIP_TYPES.map((s) => ({ ...s, positions: [], hits: 0, sunk: false, isVertical: false })),
  );
  const [message, setMessage] = useState<string>('Rozmieść swoje statki na planszy!'); // Place your ships on the board!
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState<string>(PLAYER_BOARD_ID); // Player starts
  const [playerShots, setPlayerShots] = useState<{ row: number; col: number }[]>([]);
  const [aiShots, setAiShots] = useState<{ row: number; col: number }[]>([]);
  const [aiAvailableShots, setAiAvailableShots] = useState<{ row: number; col: number }[]>([]);

  // Initialize AI available shots
  useEffect(() => {
    setAiAvailableShots(findUnshotCells(GRID_SIZE, []));
  }, []);

  // Handle AI placing ships
  useEffect(() => {
    if (gamePhase === GAME_PHASE.SETUP) {
      let newAiGrid = initializeGrid();
      const newAiShips: Ship[] = JSON.parse(JSON.stringify(SHIP_TYPES.map((s) => ({ ...s, positions: [], hits: 0, sunk: false, isVertical: false }))));
      newAiShips.forEach((ship) => {
        let placed = false;
        while (!placed) {
          const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
          const row = Math.floor(Math.random() * GRID_SIZE);
          const col = Math.floor(Math.random() * GRID_SIZE);
          const placementResult = placeShip(newAiGrid, ship, row, col, orientation === 'vertical');
          if (placementResult) {
            newAiGrid = placementResult.grid;
            ship.positions = placementResult.positions;
            ship.isVertical = orientation === 'vertical';
            placed = true;
          }
        }
      });
      setAiGrid(newAiGrid);
      setAiShips(newAiShips);
    }
  }, [gamePhase]);

  // AI Turn Logic
  useEffect(() => {
    if (gamePhase === GAME_PHASE.AI_TURN) {
      setMessage("Tura AI..."); // AI's Turn...
      const timer = setTimeout(() => {
        handleAiTurn();
      }, 1500); // 1.5 seconds delay for AI turn
      return () => clearTimeout(timer);
    }
  }, [gamePhase, aiAvailableShots, playerGrid, playerShips]); // Added playerGrid, playerShips as dependencies for AI hit logic

  const handlePlayerShipsPlaced = useCallback((newPlayerGrid: Cell[][], newPlayerShips: Ship[]) => {
    setPlayerGrid(newPlayerGrid);
    setPlayerShips(newPlayerShips);
    setGamePhase(GAME_PHASE.PLAYER_TURN);
    setMessage('Rozpocznij bitwę! Strzelaj do statków AI!'); // Start the battle! Shoot AI ships!
  }, []);

  const handlePlayerShot = useCallback(
    (row: number, col: number) => {
      if (gamePhase !== GAME_PHASE.PLAYER_TURN) return;

      if (playerShots.some((shot) => shot.row === row && shot.col === col)) {
        setMessage('Już strzeliłeś w to miejsce! Wybierz inne pole.'); // You already shot here! Choose another cell.
        return;
      }

      setPlayerShots((prev) => [...prev, { row, col }]);

      const { newGrid, newShips, hit, sunkShip } = checkHitAndSunk(
        aiGrid,
        aiShips,
        row,
        col,
        AI_BOARD_ID, // Mark on AI's board
      );

      setAiGrid(newGrid);
      setAiShips(newShips);

      const isGameOver = checkGameOver(newShips);
      if (isGameOver) {
        setGamePhase(GAME_PHASE.GAME_OVER);
        setMessage('Wygrałeś/aś! Wszystkie statki AI zostały zatopione!'); // You won! All AI ships sunk!
        return;
      }

      if (hit) {
        if (sunkShip) {
          setMessage(`Trafienie! Zatopiłeś/aś ${sunkShip.name}! Masz kolejny ruch!`); // Hit! You sunk a [Ship Name]! You have another move!
        } else {
          setMessage('Trafienie! Masz kolejny ruch!'); // Hit! You have another move!
        }
        // Player gets another turn, so no state change for gamePhase or currentPlayerTurn
      } else {
        setMessage('Pudło! Tura AI.'); // Miss! AI's Turn.
        // Switch turn after a short delay to show result
        setTimeout(() => {
          setCurrentPlayerTurn(AI_BOARD_ID);
          setGamePhase(GAME_PHASE.AI_TURN);
        }, 1000);
      }
    },
    [gamePhase, aiGrid, aiShips, playerShots],
  );

  const handleAiTurn = useCallback(() => {
    // Filter out already shot cells
    const remainingShots = aiAvailableShots.filter(
      (coord) => !aiShots.some((shot) => shot.row === coord.row && shot.col === coord.col),
    );

    if (remainingShots.length === 0) {
      console.error('AI has no available shots!');
      return; // Should not happen in a valid game
    }

    const shotIndex = Math.floor(Math.random() * remainingShots.length);
    const { row, col } = remainingShots[shotIndex];

    setAiShots((prev) => [...prev, { row, col }]);
    setAiAvailableShots(remainingShots.filter((_, i) => i !== shotIndex));

    const { newGrid, newShips, hit, sunkShip } = checkHitAndSunk(
      playerGrid,
      playerShips,
      row,
      col,
      PLAYER_BOARD_ID, // Mark on player's board
    );

    setPlayerGrid(newGrid);
    setPlayerShips(newShips);

    const isGameOver = checkGameOver(newShips);
    if (isGameOver) {
      setGamePhase(GAME_PHASE.GAME_OVER);
      setMessage('AI wygrało! Twoje statki zostały zatopione!'); // AI won! Your ships sunk!
      return;
    }

    if (hit) {
      if (sunkShip) {
        setMessage(`AI trafia! AI zatopiło twój ${sunkShip.name}! AI ma kolejny ruch!`); // AI hits! AI sunk your [Ship Name]! AI has another move!
      } else {
        setMessage('AI trafia! AI ma kolejny ruch!'); // AI hits! AI has another move!
      }
      // AI gets another turn, re-trigger AI turn after a delay
      setTimeout(() => {
        // No change in gamePhase or currentPlayerTurn, just re-trigger AI's action
        setGamePhase(GAME_PHASE.AI_TURN); // This will re-trigger the useEffect for AI_TURN
      }, 1500); // Delay for AI to "think" for its next shot
    } else {
      setMessage('AI pudłuje! Twoja tura!'); // AI misses! Your turn!
      // Switch turn after a short delay
      setTimeout(() => {
        setCurrentPlayerTurn(PLAYER_BOARD_ID);
        setGamePhase(GAME_PHASE.PLAYER_TURN);
      }, 1000);
    }
  }, [playerGrid, playerShips, aiShots, aiAvailableShots, gamePhase]);

  const handleRestartGame = useCallback(() => {
    setGamePhase(GAME_PHASE.SETUP);
    setPlayerGrid(initializeGrid());
    setAiGrid(initializeGrid());
    setPlayerShips(SHIP_TYPES.map((s) => ({ ...s, positions: [], hits: 0, sunk: false, isVertical: false })));
    setAiShips(SHIP_TYPES.map((s) => ({ ...s, positions: [], hits: 0, sunk: false, isVertical: false })));
    setMessage('Rozmieść swoje statki na planszy!'); // Place your ships on the board!
    setCurrentPlayerTurn(PLAYER_BOARD_ID);
    setPlayerShots([]);
    setAiShots([]);
    setAiAvailableShots(findUnshotCells(GRID_SIZE, [])); // Reset AI's available shots
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-8 sm:mb-12">
        Battleship!
      </h1>
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 sm:p-8 w-full mx-auto">
        <p className="text-lg text-center font-semibold mb-6 text-gray-800 dark:text-gray-200" aria-live="polite">
          {message}
        </p>

        {gamePhase === GAME_PHASE.SETUP ? (
          <ShipPlacement
            playerGrid={playerGrid}
            setPlayerGrid={setPlayerGrid}
            playerShips={playerShips}
            setPlayerShips={setPlayerShips}
            onShipsPlaced={handlePlayerShipsPlaced}
            setMessage={setMessage}
          />
        ) : (
          <GameArena
            playerGrid={playerGrid}
            aiGrid={aiGrid}
            onPlayerShot={handlePlayerShot}
            currentPlayerTurn={currentPlayerTurn}
            gamePhase={gamePhase}
            playerShips={playerShips}
            aiShips={aiShips}
          />
        )}

        {(gamePhase === GAME_PHASE.GAME_OVER || (gamePhase === GAME_PHASE.PLAYER_TURN && playerShips.every(s => s.positions.length > 0)) || (gamePhase === GAME_PHASE.AI_TURN && aiShips.every(s => s.positions.length > 0))) &&
          gamePhase !== GAME_PHASE.SETUP && (
            <div className="mt-8 text-center">
              <button
                onClick={handleRestartGame}
                className="px-6 py-3 bg-indigo-500 text-white font-bold rounded-lg shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition duration-300"
              >
                Zagraj Ponownie?
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default App;