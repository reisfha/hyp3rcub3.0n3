import { useState, useEffect, useRef, useCallback } from 'react';

const SIZE = 20;
const TILE = 20;
const W = SIZE * TILE;
const INIT = [{ x: 10, y: 10 }];

export default function SnakeGame({ onScore }) {
  const [snake, setSnake] = useState(INIT);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const [dead, setDead] = useState(false);
  const dirRef = useRef(dir);
  const deadRef = useRef(false);
  const scoreRef = useRef(0);

  const placeFood = useCallback((s) => {
    let f;
    do { f = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) }; }
    while (s.some(p => p.x === f.x && p.y === f.y));
    return f;
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      const keyMap = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, w: { x: 0, y: -1 }, s: { x: 0, y: 1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 } };
      const nd = keyMap[e.key];
      if (nd && (nd.x !== -dirRef.current.x || nd.y !== -dirRef.current.y)) {
        dirRef.current = nd;
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (dead) return;
    const interval = setInterval(() => {
      setSnake(prev => {
        if (deadRef.current) return prev;
        const head = { x: prev[0].x + dirRef.current.x, y: prev[0].y + dirRef.current.y };
        if (head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE || prev.some(p => p.x === head.x && p.y === head.y)) {
          deadRef.current = true;
          setDead(true);
          return prev;
        }
        const ate = head.x === food.x && head.y === food.y;
        const newSnake = [head, ...prev];
        if (!ate) newSnake.pop();
        if (ate) {
          scoreRef.current += 10;
          onScore?.(scoreRef.current);
          setFood(placeFood(newSnake));
        }
        return newSnake;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [dead, food, placeFood, onScore]);

  const restart = () => {
    const init = INIT;
    setSnake(init);
    setDir({ x: 1, y: 0 });
    dirRef.current = { x: 1, y: 0 };
    setFood({ x: 15, y: 10 });
    setDead(false);
    deadRef.current = false;
    scoreRef.current = 0;
    onScore?.(0);
  };

  return (
    <div className="builtin-game">
      <canvas width={W} height={W} className="game-canvas" style={{ width: W, height: W }}>
        {(() => {
          const ctx = document.createElement('canvas').getContext('2d');
          return null;
        })()}
      </canvas>
      <svg width={W} height={W} className="game-svg">
        <rect x="0" y="0" width={W} height={W} fill="#0a0a1a" rx="4" />
        {snake.map((p, i) => (
          <rect key={i} x={p.x * TILE + 1} y={p.y * TILE + 1} width={TILE - 2} height={TILE - 2} rx="3" fill={i === 0 ? '#00f0ff' : '#0088aa'} />
        ))}
        <rect x={food.x * TILE + 2} y={food.y * TILE + 2} width={TILE - 4} height={TILE - 4} rx="4" fill="#ff00aa" />
      </svg>
      {dead && <div className="game-overlay"><h2>Game Over</h2><p>Score: {scoreRef.current}</p><button className="btn-primary" onClick={restart}>Play Again</button></div>}
      <div className="game-controls-hint">WASD / Arrow Keys</div>
    </div>
  );
}
