import { GRID_SIZE, CELL_STATE, SHIP_TYPES } from '../constants';

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

export const initializeGrid = (): Cell[][] => {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ state: CELL_STATE.EMPTY, shipId: null }))
  );
};

export const isValidPlacement = (
  grid: Cell[][],
  ship: Ship,
  startRow: number,
  startCol: number,
  isVertical: boolean,
): boolean => {
  const { length } = ship;

  if (isVertical) {
    if (startRow + length > GRID_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (grid[startRow + i][startCol].state !== CELL_STATE.EMPTY) return false;
      // Check surrounding cells for buffer zone
      for (let r = Math.max(0, startRow + i - 1); r <= Math.min(GRID_SIZE - 1, startRow + i + 1); r++) {
        for (let c = Math.max(0, startCol - 1); c <= Math.min(GRID_SIZE - 1, startCol + 1); c++) {
          if (grid[r][c].shipId !== null && grid[r][c].shipId !== ship.name) {
            // Check if it's an existing ship from the same placement attempt
            let isOverlapWithCurrentShip = false;
            for(let k=0; k<length; k++) {
              if(r === startRow + k && c === startCol) {
                isOverlapWithCurrentShip = true;
                break;
              }
            }
            if (!isOverlapWithCurrentShip) return false;
          }
        }
      }
    }
  } else {
    if (startCol + length > GRID_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (grid[startRow][startCol + i].state !== CELL_STATE.EMPTY) return false;
      // Check surrounding cells for buffer zone
      for (let r = Math.max(0, startRow - 1); r <= Math.min(GRID_SIZE - 1, startRow + 1); r++) {
        for (let c = Math.max(0, startCol + i - 1); c <= Math.min(GRID_SIZE - 1, startCol + i + 1); c++) {
          if (grid[r][c].shipId !== null && grid[r][c].shipId !== ship.name) {
            // Check if it's an existing ship from the same placement attempt
            let isOverlapWithCurrentShip = false;
            for(let k=0; k<length; k++) {
              if(r === startRow && c === startCol + k) {
                isOverlapWithCurrentShip = true;
                break;
              }
            }
            if (!isOverlapWithCurrentShip) return false;
          }
        }
      }
    }
  }

  return true;
};

export const placeShip = (
  currentGrid: Cell[][],
  ship: Ship,
  startRow: number,
  startCol: number,
  isVertical: boolean,
): { grid: Cell[][]; positions: { row: number; col: number }[] } | null => {
  if (!isValidPlacement(currentGrid, ship, startRow, startCol, isVertical)) {
    return null;
  }

  const newGrid = currentGrid.map((row) => [...row]);
  const positions: { row: number; col: number }[] = [];

  for (let i = 0; i < ship.length; i++) {
    const row = isVertical ? startRow + i : startRow;
    const col = isVertical ? startCol : startCol + i;
    newGrid[row][col] = { state: CELL_STATE.SHIP, shipId: ship.name };
    positions.push({ row, col });
  }

  return { grid: newGrid, positions };
};


export const checkHitAndSunk = (
  currentGrid: Cell[][],
  currentShips: Ship[],
  row: number,
  col: number,
  boardId: string, // Use this to determine if it's player or AI board
): { newGrid: Cell[][]; newShips: Ship[]; hit: boolean; sunkShip: Ship | null } => {
  const newGrid = currentGrid.map((r) => [...r]);
  const newShips = currentShips.map((s) => ({ ...s, positions: s.positions.map(p => ({...p})) }));
  let hit = false;
  let sunkShip: Ship | null = null;

  const targetCell = newGrid[row][col];

  if (targetCell.state === CELL_STATE.SHIP) {
    hit = true;
    targetCell.state = CELL_STATE.HIT;

    const shipIndex = newShips.findIndex((s) => s.name === targetCell.shipId);
    if (shipIndex !== -1) {
      newShips[shipIndex].hits++;
      if (newShips[shipIndex].hits === newShips[shipIndex].length) {
        newShips[shipIndex].sunk = true;
        sunkShip = newShips[shipIndex];
        // Mark all parts of the sunk ship as SUNK state
        newShips[shipIndex].positions.forEach((pos) => {
          newGrid[pos.row][pos.col].state = CELL_STATE.SUNK;
        });
      }
    }
  } else if (targetCell.state === CELL_STATE.EMPTY) {
    targetCell.state = CELL_STATE.MISS;
  }
  // If it was already HIT or SUNK, state doesn't change
  // We should ideally prevent shooting at already hit/missed cells at the UI level

  return { newGrid, newShips, hit, sunkShip };
};

export const checkGameOver = (ships: Ship[]): boolean => {
  return ships.every((ship) => ship.sunk);
};

export const generateRandomPlacement = (grid: Cell[][], shipsToPlace: Ship[]): { grid: Cell[][]; ships: Ship[] } => {
  let tempGrid = grid.map(row => row.map(cell => ({...cell})));
  const placedShips: Ship[] = JSON.parse(JSON.stringify(shipsToPlace)); // Deep copy

  for (const ship of placedShips) {
    let placed = false;
    while (!placed) {
      const isVertical = Math.random() < 0.5;
      const startRow = Math.floor(Math.random() * GRID_SIZE);
      const startCol = Math.floor(Math.random() * GRID_SIZE);

      const placementResult = placeShip(tempGrid, ship, startRow, startCol, isVertical);
      if (placementResult) {
        tempGrid = placementResult.grid;
        ship.positions = placementResult.positions;
        ship.isVertical = isVertical;
        placed = true;
      }
    }
  }
  return { grid: tempGrid, ships: placedShips };
};

export const findUnshotCells = (gridSize: number, shotCells: { row: number; col: number }[]): { row: number; col: number }[] => {
  const allCells: { row: number; col: number }[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      allCells.push({ row: r, col: c });
    }
  }

  // Filter out cells that have already been shot
  return allCells.filter(cell =>
    !shotCells.some(shot => shot.row === cell.row && shot.col === cell.col)
  );
};