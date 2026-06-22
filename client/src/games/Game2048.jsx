import { useState, useEffect, useRef, useCallback } from 'react';

const createBoard = () => Array(4).fill(null).map(() => Array(4).fill(0));
const addTile = (b) => {
  const zeros = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!b[r][c]) zeros.push([r, c]);
  if (!zeros.length) return b;
  const [r, c] = zeros[Math.floor(Math.random() * zeros.length)];
  b[r][c] = Math.random() < 0.9 ? 2 : 4;
  return b;
};

const slide = (row) => {
  let arr = row.filter(v => v);
  let score = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) { arr[i] *= 2; score += arr[i]; arr.splice(i + 1, 1); }
  }
  while (arr.length < 4) arr.push(0);
  return { arr, score };
};

const rotate = (b) => b[0].map((_, i) => b.map(r => r[i]).reverse());
const move = (b, d) => {
  let board = b.map(r => [...r]);
  for (let i = 0; i < d; i++) board = rotate(board);
  let totalScore = 0;
  for (let r = 0; r < 4; r++) {
    const { arr, score } = slide(board[r]);
    board[r] = arr;
    totalScore += score;
  }
  for (let i = 0; i < (4 - d) % 4; i++) board = rotate(board);
  return { board, totalScore };
};

export default function Game2048({ onScore }) {
  const [board, setBoard] = useState(() => addTile(addTile(createBoard())));
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const scoreRef = useRef(0);

  const hasMoves = (b) => {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      if (!b[r][c]) return true;
      if (c < 3 && b[r][c] === b[r][c + 1]) return true;
      if (r < 3 && b[r][c] === b[r + 1][c]) return true;
    }
    return false;
  };

  const handleKey = useCallback((e) => {
    const dirMap = { ArrowUp: 1, ArrowDown: 3, ArrowLeft: 2, ArrowRight: 0, w: 1, s: 3, a: 2, d: 0 };
    const d = dirMap[e.key];
    if (d === undefined) return;
    e.preventDefault();
    const old = JSON.stringify(board);
    const res = move(board, d);
    if (JSON.stringify(res.board) === old) return;
    const nb = addTile(res.board);
    setBoard(nb);
    const ns = scoreRef.current + res.totalScore;
    scoreRef.current = ns;
    setScore(ns);
    onScore?.(ns);
    if (nb.some(r => r.some(v => v >= 2048))) setWon(true);
    if (!hasMoves(nb)) setLost(true);
  }, [board, onScore]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const restart = () => {
    const nb = addTile(addTile(createBoard()));
    setBoard(nb);
    setScore(0);
    scoreRef.current = 0;
    setWon(false);
    setLost(false);
    onScore?.(0);
  };

  const colors = { 0: '#1a1a2e', 2: '#2a2a4e', 4: '#3a3a6e', 8: '#ff00aa', 16: '#ff3377', 32: '#ff0055', 64: '#cc0044', 128: '#00f0ff', 256: '#00ccdd', 512: '#0099bb', 1024: '#006699', 2048: '#ffcc00' };

  return (
    <div className="builtin-game">
      <div className="game-score">Score: {score}</div>
      <div className="board-2048">
        {board.map((row, r) => row.map((v, c) => (
          <div key={`${r}-${c}`} className="tile-2048" style={{ background: colors[v] || '#ffcc00', color: v <= 4 ? '#888' : '#fff', fontSize: v >= 1000 ? 20 : 28 }}>
            {v || ''}
          </div>
        )))}
      </div>
      {(won || lost) && (
        <div className="game-overlay">
          <h2>{won ? 'You Win!' : 'Game Over'}</h2>
          <p>Score: {score}</p>
          <button className="btn-primary" onClick={restart}>Play Again</button>
        </div>
      )}
      <div className="game-controls-hint">WASD / Arrow Keys</div>
    </div>
  );
}
