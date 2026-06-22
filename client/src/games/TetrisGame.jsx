import { useState, useEffect, useRef, useCallback } from 'react';

const COLS = 10, ROWS = 20, SIZE = 24;
const PIECES = [
  [[1,1,1,1]], [[1,1],[1,1]], [[1,0],[1,0],[1,1]], [[0,1],[0,1],[1,1]],
  [[1,1,0],[0,1,1]], [[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]
];
const COLORS = ['#00f0ff','#ffcc00','#ff00aa','#00ff88','#ff6600','#9944ff','#ff3333'];

const createBoard = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

export default function TetrisGame({ onScore }) {
  const [board, setBoard] = useState(createBoard);
  const [piece, setPiece] = useState({ shape: PIECES[0], color: COLORS[0], x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const scoreRef = useRef(0);
  const boardRef = useRef(createBoard());
  const pieceRef = useRef(null);
  const deadRef = useRef(false);

  const randomPiece = () => ({
    shape: PIECES[Math.floor(Math.random() * PIECES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    x: 3, y: 0
  });

  const collide = (b, p, dx = 0, dy = 0) => {
    for (let r = 0; r < p.shape.length; r++) for (let c = 0; c < p.shape[r].length; c++) {
      if (!p.shape[r][c]) continue;
      const nx = p.x + c + dx, ny = p.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && b[ny][nx]) return true;
    }
    return false;
  };

  const merge = (b, p) => {
    const nb = b.map(r => [...r]);
    for (let r = 0; r < p.shape.length; r++) for (let c = 0; c < p.shape[r].length; c++) {
      if (p.shape[r][c] && p.y + r >= 0) nb[p.y + r][p.x + c] = p.color;
    }
    return nb;
  };

  const clearRows = (b) => {
    let cleared = 0;
    const nb = b.filter(row => { const full = row.every(v => v); if (full) cleared++; return !full; });
    while (nb.length < ROWS) nb.unshift(Array(COLS).fill(0));
    return { board: nb, cleared };
  };

  const tick = useCallback(() => {
    if (deadRef.current) return;
    const p = pieceRef.current || randomPiece();
    if (collide(boardRef.current, p, 0, 1)) {
      const merged = merge(boardRef.current, p);
      const { board: cleared, cleared: lines } = clearRows(merged);
      boardRef.current = cleared;
      const pts = [0, 100, 300, 500, 800][lines] || 0;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      onScore?.(scoreRef.current);
      setBoard(cleared);
      const np = randomPiece();
      if (collide(cleared, np, 0, 0)) { deadRef.current = true; setDead(true); return; }
      pieceRef.current = np;
      setPiece(np);
    } else {
      const np = { ...p, y: p.y + 1 };
      pieceRef.current = np;
      setPiece(np);
    }
  }, [onScore]);

  useEffect(() => {
    pieceRef.current = piece;
  }, [piece]);

  useEffect(() => {
    if (dead) return;
    const iv = setInterval(tick, 400);
    return () => clearInterval(iv);
  }, [dead, tick]);

  useEffect(() => {
    const handleKey = (e) => {
      if (deadRef.current) return;
      const p = { ...pieceRef.current };
      if (e.key === 'ArrowLeft' && !collide(boardRef.current, p, -1, 0)) p.x--;
      if (e.key === 'ArrowRight' && !collide(boardRef.current, p, 1, 0)) p.x++;
      if (e.key === 'ArrowDown' && !collide(boardRef.current, p, 0, 1)) p.y++;
      if (e.key === 'ArrowUp') {
        const rot = p.shape[0].map((_, i) => p.shape.map(r => r[i]).reverse());
        if (!collide(boardRef.current, { ...p, shape: rot })) p.shape = rot;
      }
      if (e.key === ' ') while (!collide(boardRef.current, p, 0, 1)) p.y++;
      pieceRef.current = p;
      setPiece(p);
      e.preventDefault();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const restart = () => {
    const nb = createBoard();
    boardRef.current = nb;
    setBoard(nb);
    const np = randomPiece();
    pieceRef.current = np;
    setPiece(np);
    setScore(0);
    scoreRef.current = 0;
    setDead(false);
    deadRef.current = false;
  };

  return (
    <div className="builtin-game tetris-game">
      <div className="game-score">Score: {score}</div>
      <div className="tetris-board">
        {board.map((row, r) => row.map((v, c) => (
          <div key={`${r}-${c}`} className="tetris-cell" style={{
            background: v || (piece && r >= piece.y && r < piece.y + piece.shape.length && c >= piece.x && c < piece.x + piece.shape[0].length && piece.shape[r - piece.y]?.[c - piece.x] ? piece.color : '#0a0a1a'),
            boxShadow: v ? `0 0 4px ${v}` : 'none'
          }} />
        ))).flat()}
      </div>
      {dead && <div className="game-overlay"><h2>Game Over</h2><p>Score: {score}</p><button className="btn-primary" onClick={restart}>Play Again</button></div>}
      <div className="game-controls-hint">← → ↓ rotate: ↑, drop: Space</div>
    </div>
  );
}
