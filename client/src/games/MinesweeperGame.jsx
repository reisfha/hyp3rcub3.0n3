import { useState, useCallback } from 'react';

const ROWS = 9, COLS = 9, MINES = 10;

const initBoard = () => {
  const board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null).map(() => ({ mine: false, revealed: false, flagged: false, adjacent: 0 })));
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
    if (!board[r][c].mine) { board[r][c].mine = true; placed++; }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (board[r][c].mine) continue;
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) count++;
    }
    board[r][c].adjacent = count;
  }
  return board;
};

const reveal = (board, r, c) => {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c].revealed || board[r][c].flagged) return;
  board[r][c].revealed = true;
  if (board[r][c].adjacent === 0 && !board[r][c].mine) {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) reveal(board, r + dr, c + dc);
  }
};

export default function MinesweeperGame({ onScore }) {
  const [board, setBoard] = useState(initBoard);
  const [dead, setDead] = useState(false);
  const [won, setWon] = useState(false);

  const checkWin = useCallback((b) => {
    const revealed = b.flat().filter(c => c.revealed).length;
    const total = ROWS * COLS;
    if (revealed === total - MINES) { setWon(true); onScore?.(100); return true; }
    return false;
  }, [onScore]);

  const handleClick = (r, c) => {
    if (dead || won) return;
    const b = board.map(row => row.map(cell => ({ ...cell })));
    if (b[r][c].flagged) return;
    if (b[r][c].mine) { b[r][c].revealed = true; setDead(true); setBoard(b); return; }
    reveal(b, r, c);
    setBoard(b);
    checkWin(b);
  };

  const handleRightClick = (e, r, c) => {
    e.preventDefault();
    if (dead || won) return;
    const b = board.map(row => row.map(cell => ({ ...cell })));
    if (b[r][c].revealed) return;
    b[r][c].flagged = !b[r][c].flagged;
    setBoard(b);
  };

  const restart = () => { setBoard(initBoard()); setDead(false); setWon(false); };

  return (
    <div className="builtin-game">
      <div className="board-minesweeper">
        {board.map((row, r) => row.map((cell, c) => (
          <div key={`${r}-${c}`} className={`ms-cell ${cell.revealed ? 'revealed' : ''} ${cell.mine && cell.revealed ? 'mine' : ''}`}
            onClick={() => handleClick(r, c)} onContextMenu={(e) => handleRightClick(e, r, c)}
          >
            {cell.revealed ? (cell.mine ? '💣' : cell.adjacent || '') : (cell.flagged ? '🚩' : '')}
          </div>
        ))).flat()}
      </div>
      {(dead || won) && <div className="game-overlay"><h2>{dead ? '💥 Game Over' : '🎉 You Win!'}</h2><button className="btn-primary" onClick={restart}>Play Again</button></div>}
      <div className="game-controls-hint">Left click to reveal, Right click to flag</div>
    </div>
  );
}
