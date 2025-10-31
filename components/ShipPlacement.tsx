import React, { useState, useCallback } from 'react';
import { GRID_SIZE, CELL_STATE, CELL_COLORS } from '../constants';
import { isValidPlacement, placeShip } from '../utils/gameLogic';

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

interface ShipPlacementProps {
  playerGrid: Cell[][];
  setPlayerGrid: React.Dispatch<React.SetStateAction<Cell[][]>>;
  playerShips: Ship[];
  setPlayerShips: React.Dispatch<React.SetStateAction<Ship[]>>;
  onShipsPlaced: (grid: Cell[][], ships: Ship[]) => void;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

const ShipPlacement: React.FC<ShipPlacementProps> = ({
  playerGrid,
  setPlayerGrid,
  playerShips,
  setPlayerShips,
  onShipsPlaced,
  setMessage,
}) => {
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [isVertical, setIsVertical] = useState<boolean>(false);
  const [hoverPreview, setHoverPreview] = useState<{ row: number; col: number }[]>([]);
  const [isValidPreview, setIsValidPreview] = useState<boolean>(true);

  const letters = Array.from({ length: GRID_SIZE }, (_, i) => String.fromCharCode(65 + i));

  const handleShipSelect = useCallback((ship: Ship) => {
    if (!ship.positions.length) { // Only select if not already placed
      setSelectedShip(ship);
      setMessage(`Wybrałeś ${ship.name} (długość: ${ship.length}). Kliknij na planszę, aby umieścić.`);
    }
  }, [setMessage]);

  const handleRotate = useCallback(() => {
    setIsVertical((prev) => !prev);
    if (selectedShip) {
      // Recalculate preview if a ship is selected and hovered
      // This is a bit tricky without actual hover coordinates,
      // so we might need to rely on the next mouseOver for a perfect update.
      setMessage(`Orientacja: ${!isVertical ? 'Pionowa' : 'Pozioma'}`);
    }
  }, [isVertical, selectedShip, setMessage]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!selectedShip) {
        setMessage('Najpierw wybierz statek do umieszczenia.');
        return;
      }

      if (!isValidPlacement(playerGrid, selectedShip, row, col, isVertical)) {
        setMessage('Nieprawidłowe miejsce! Statki nie mogą nachodzić na siebie ani być zbyt blisko.');
        return;
      }

      const placementResult = placeShip(playerGrid, selectedShip, row, col, isVertical);
      if (placementResult) {
        setPlayerGrid(placementResult.grid);
        setPlayerShips((prevShips) =>
          prevShips.map((s) =>
            s.name === selectedShip.name
              ? { ...s, positions: placementResult.positions, isVertical: isVertical }
              : s
          )
        );
        setSelectedShip(null); // Deselect after placing
        setMessage(`Umieściłeś ${selectedShip.name}. Umieść pozostałe statki.`);
      } else {
        setMessage('Nie można umieścić statku w tym miejscu. Spróbuj ponownie.');
      }
    },
    [selectedShip, playerGrid, isVertical, setPlayerGrid, setPlayerShips, setMessage]
  );

  const handleMouseOver = useCallback((row: number, col: number) => {
    if (!selectedShip) return;

    const previewCoords: { row: number; col: number }[] = [];
    let valid = true;

    for (let i = 0; i < selectedShip.length; i++) {
      const r = isVertical ? row + i : row;
      const c = isVertical ? col : col + i;

      if (r >= GRID_SIZE || c >= GRID_SIZE || r < 0 || c < 0) {
        valid = false;
        break;
      }
      previewCoords.push({ row: r, col: c });
    }

    if (valid && !isValidPlacement(playerGrid, selectedShip, row, col, isVertical)) {
      valid = false;
    }

    setHoverPreview(previewCoords);
    setIsValidPreview(valid);
  }, [selectedShip, isVertical, playerGrid]);

  const handleMouseLeave = useCallback(() => {
    setHoverPreview([]);
    setIsValidPreview(true);
  }, []);

  const allShipsPlaced = playerShips.every((ship) => ship.positions.length > 0);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Twoja Plansza</h3>
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

          {playerGrid.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {/* Row Headers (1, 2, 3...) */}
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                {rowIndex + 1}
              </div>
              {row.map((cell, colIndex) => {
                const isPreview = hoverPreview.some(
                  (p) => p.row === rowIndex && p.col === colIndex
                );
                const cellClass = cell.state === CELL_STATE.SHIP ? CELL_COLORS.SHIP : CELL_COLORS.EMPTY;
                const previewClass = isPreview
                  ? isValidPreview
                    ? 'bg-green-400 opacity-75'
                    : 'bg-red-400 opacity-75'
                  : '';

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10
                      border border-gray-300 dark:border-gray-700
                      flex items-center justify-center
                      ${cellClass} ${previewClass}
                      transition-colors duration-200 ease-in-out
                      ${selectedShip ? 'cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800' : 'cursor-default'}
                    `}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onMouseOver={() => handleMouseOver(rowIndex, colIndex)}
                    onMouseLeave={handleMouseLeave}
                    disabled={!selectedShip}
                    aria-label={`Komórka ${letters[colIndex]}${rowIndex + 1}, stan: ${cell.state}`}
                  >
                    {/* Visual indicators for already placed ships */}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-none w-full md:w-64 mt-8 md:mt-0 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Statki do Umieszczenia</h3>
        <div className="space-y-3">
          {playerShips.map((ship) => (
            <button
              key={ship.name}
              onClick={() => handleShipSelect(ship)}
              className={`
                w-full p-3 rounded-md text-left font-medium
                ${ship.positions.length > 0
                  ? 'bg-green-500 text-white cursor-not-allowed opacity-70'
                  : selectedShip?.name === ship.name
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'}
                transition duration-200 ease-in-out
              `}
              disabled={ship.positions.length > 0}
              aria-pressed={selectedShip?.name === ship.name}
            >
              {ship.name} (dł. {ship.length})
              {ship.positions.length > 0 && ' - Umieszczony'}
            </button>
          ))}
        </div>
        <div className="mt-6">
          <button
            onClick={handleRotate}
            className="w-full px-4 py-2 bg-yellow-500 text-white font-bold rounded-md shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-300"
            aria-label={`Zmień orientację na ${isVertical ? 'poziomą' : 'pionową'}`}
          >
            Obróć Statek ({isVertical ? 'Pionowo' : 'Poziomo'})
          </button>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => onShipsPlaced(playerGrid, playerShips)}
            className={`
              w-full px-6 py-3 bg-indigo-500 text-white font-bold rounded-lg shadow-md
              ${allShipsPlaced ? 'hover:bg-indigo-600' : 'opacity-50 cursor-not-allowed'}
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75
              transition duration-300
            `}
            disabled={!allShipsPlaced}
          >
            Rozpocznij Bitwę!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShipPlacement;