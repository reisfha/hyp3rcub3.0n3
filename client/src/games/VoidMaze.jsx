import { useState, useEffect, useRef, useCallback } from 'react';

const LEVEL_CONFIGS = [
  { size: 13, seed: 1, shiftInterval: 5000, shiftChance: 0.05, fovRadius: 3.8 },
  { size: 13, seed: 2, shiftInterval: 4500, shiftChance: 0.07, fovRadius: 3.8 },
  { size: 15, seed: 3, shiftInterval: 4000, shiftChance: 0.09, fovRadius: 3.6 },
  { size: 15, seed: 4, shiftInterval: 3800, shiftChance: 0.11, fovRadius: 3.6 },
  { size: 17, seed: 5, shiftInterval: 3500, shiftChance: 0.13, fovRadius: 3.4 },
  { size: 17, seed: 6, shiftInterval: 3200, shiftChance: 0.15, fovRadius: 3.4 },
  { size: 19, seed: 7, shiftInterval: 3000, shiftChance: 0.17, fovRadius: 3.2 },
  { size: 19, seed: 8, shiftInterval: 2800, shiftChance: 0.19, fovRadius: 3.2 },
  { size: 21, seed: 9, shiftInterval: 2600, shiftChance: 0.21, fovRadius: 3.0 },
  { size: 21, seed: 10, shiftInterval: 2400, shiftChance: 0.23, fovRadius: 3.0 },
  { size: 23, seed: 11, shiftInterval: 2200, shiftChance: 0.26, fovRadius: 2.9 },
  { size: 23, seed: 12, shiftInterval: 2000, shiftChance: 0.29, fovRadius: 2.9 },
  { size: 25, seed: 13, shiftInterval: 1800, shiftChance: 0.32, fovRadius: 2.8 },
  { size: 25, seed: 14, shiftInterval: 1600, shiftChance: 0.35, fovRadius: 2.8 },
  { size: 27, seed: 15, shiftInterval: 1500, shiftChance: 0.37, fovRadius: 2.7 },
  { size: 27, seed: 16, shiftInterval: 1300, shiftChance: 0.40, fovRadius: 2.7 },
  { size: 29, seed: 17, shiftInterval: 1200, shiftChance: 0.42, fovRadius: 2.6 },
  { size: 29, seed: 18, shiftInterval: 1100, shiftChance: 0.45, fovRadius: 2.6 },
  { size: 31, seed: 19, shiftInterval: 1000, shiftChance: 0.48, fovRadius: 2.5 },
  { size: 33, seed: 20, shiftInterval: 800, shiftChance: 0.50, fovRadius: 2.4 },
];

function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMaze(size, seed) {
  const rng = mulberry32(seed);
  const grid = Array(size).fill(null).map(() => Array(size).fill(1));

  const carve = (x, y) => {
    grid[y][x] = 0;
    const dirs = shuffle([[0, -2], [0, 2], [-2, 0], [2, 0]], rng);
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && grid[ny][nx] === 1) {
        grid[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  };

  carve(1, 1);

  const loopCount = Math.floor(size * 0.15) + 2;
  for (let i = 0; i < loopCount; i++) {
    const x = 1 + 2 * Math.floor(rng() * ((size - 2) / 2));
    const y = 1 + 2 * Math.floor(rng() * ((size - 2) / 2));
    const dirs = shuffle([[0, -1], [0, 1], [-1, 0], [1, 0]], rng);
    for (const [dx, dy] of dirs) {
      const wx = x + dx, wy = y + dy;
      if (wx > 0 && wx < size - 1 && wy > 0 && wy < size - 1 && grid[wy][wx] === 1) {
        const nx = x + dx * 2, ny = y + dy * 2;
        if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && grid[ny][nx] === 0) {
          grid[wy][wx] = 0;
          break;
        }
      }
    }
  }

  const exit = { x: size - 2, y: size - 2 };
  grid[exit.y][exit.x] = 0;

  return { grid, start: { x: 1, y: 1 }, exit };
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export default function VoidMaze({ onScore }) {
  const canvasRef = useRef(null);
  const mazeRef = useRef(null);
  const playerRef = useRef({ x: 1, y: 1 });
  const levelRef = useRef(0);
  const scoreRef = useRef(0);
  const keysRef = useRef({});
  const shiftTimerRef = useRef(0);
  const lvlDoneRef = useRef(false);
  const gameDoneRef = useRef(false);
  const completedRef = useRef(false);

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const TILE = 32;

  const forceUpdate = useCallback(() => {
    const lvl = levelRef.current;
    setLevel(lvl + 1);
    setScore(scoreRef.current);
    setLevelComplete(lvlDoneRef.current);
    setGameComplete(gameDoneRef.current);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const m = mazeRef.current;
    if (!m) return;

    const cfg = LEVEL_CONFIGS[Math.min(levelRef.current, LEVEL_CONFIGS.length - 1)];
    const fovPixels = cfg.fovRadius * TILE;
    const p = playerRef.current;
    const offsetX = W / 2 - p.x * TILE;
    const offsetY = H / 2 - p.y * TILE;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < m.grid.length; y++) {
      for (let x = 0; x < m.grid[y].length; x++) {
        const sx = offsetX + x * TILE;
        const sy = offsetY + y * TILE;
        if (sx + TILE < 0 || sx > W || sy + TILE < 0 || sy > H) continue;

        if (m.grid[y][x] === 1) {
          ctx.fillStyle = '#181830';
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.strokeStyle = '#222244';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(sx, sy, TILE, TILE);

          const glow = 0.3 + 0.2 * Math.sin(x * 1.7 + y * 2.3 + Date.now() / 3000);
          ctx.fillStyle = `rgba(30, 30, 60, ${glow})`;
          ctx.fillRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
        } else {
          ctx.fillStyle = '#0a0a14';
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.strokeStyle = '#0f0f20';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(sx, sy, TILE, TILE);

          ctx.fillStyle = 'rgba(15, 15, 30, 0.3)';
          ctx.fillRect(sx + 2, sy + 2, TILE - 4, 1);
          ctx.fillRect(sx + 2, sy + 2, 1, TILE - 4);
        }
      }
    }

    if (m.exit && !lvlDoneRef.current) {
      const ex = offsetX + m.exit.x * TILE;
      const ey = offsetY + m.exit.y * TILE;
      const d = dist(p, m.exit);
      if (d < 2.5) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 600);
        ctx.fillStyle = `rgba(0, 255, 136, ${0.2 + 0.2 * pulse})`;
        ctx.fillRect(ex + 10, ey + 10, TILE - 20, TILE - 20);
        ctx.strokeStyle = `rgba(0, 255, 136, ${0.3 + 0.2 * pulse})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(ex + 8, ey + 8, TILE - 16, TILE - 16);
      }
    }

    if (!lvlDoneRef.current && !gameDoneRef.current) {
      const px = offsetX + p.x * TILE;
      const py = offsetY + p.y * TILE;

      ctx.save();
      ctx.translate(px, py);

      ctx.beginPath();
      ctx.arc(0, 0, TILE * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f0ff';
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(0, 0, TILE * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      ctx.restore();
    }

    const cx = W / 2;
    const cy = H / 2;

    const grad = ctx.createRadialGradient(cx, cy, fovPixels * 0.6, cx, cy, fovPixels);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.75, 'rgba(0,0,0,0)');
    grad.addColorStop(0.9, 'rgba(0,0,0,0.4)');
    grad.addColorStop(0.96, 'rgba(0,0,0,0.75)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }, []);

  const checkCollision = useCallback((x, y, grid) => {
    const r = 0.3;
    const checks = [
      { x: x - r, y: y - r },
      { x: x + r, y: y - r },
      { x: x - r, y: y + r },
      { x: x + r, y: y + r },
      { x: x, y: y },
    ];
    for (const c of checks) {
      const gx = Math.floor(c.x);
      const gy = Math.floor(c.y);
      if (gy < 0 || gy >= grid.length || gx < 0 || gx >= grid[0].length) return true;
      if (grid[gy][gx] === 1) return true;
    }
    return false;
  }, []);

  const tryMove = useCallback((dx, dy) => {
    if (lvlDoneRef.current || gameDoneRef.current) return;
    const m = mazeRef.current;
    if (!m) return;

    const p = playerRef.current;
    const speed = 0.08;
    const nx = p.x + dx * speed;
    const ny = p.y + dy * speed;

    if (dx !== 0) {
      if (!checkCollision(nx, p.y, m.grid)) p.x = nx;
    }
    if (dy !== 0) {
      if (!checkCollision(p.x, ny, m.grid)) p.y = ny;
    }

    if (m.exit && dist(p, m.exit) < 0.5 && !completedRef.current) {
      completedRef.current = true;
      lvlDoneRef.current = true;
      const bonus = 500 * (levelRef.current + 1);
      scoreRef.current += bonus;
      onScore?.(scoreRef.current);
      forceUpdate();
    }
  }, [checkCollision, onScore, forceUpdate]);

  const shiftMaze = useCallback(() => {
    if (lvlDoneRef.current || gameDoneRef.current) return;
    const m = mazeRef.current;
    if (!m) return;

    const cfg = LEVEL_CONFIGS[Math.min(levelRef.current, LEVEL_CONFIGS.length - 1)];
    const p = playerRef.current;
    const r = cfg.fovRadius + 0.5;
    let changed = false;

    for (let y = 1; y < m.grid.length - 1; y++) {
      for (let x = 1; x < m.grid[y].length - 1; x++) {
        const d = dist(p, { x, y });
        if (d > r && Math.random() < cfg.shiftChance) {
          const isStart = (x === m.start.x && y === m.start.y);
          const isExit = (x === m.exit.x && y === m.exit.y);
          if (!isStart && !isExit) {
            m.grid[y][x] = m.grid[y][x] === 1 ? 0 : 1;
            changed = true;
          }
        }
      }
    }

    if (changed) draw();
  }, [draw]);

  const initLevel = useCallback((lvl) => {
    const cfg = LEVEL_CONFIGS[Math.min(lvl, LEVEL_CONFIGS.length - 1)];
    const m = generateMaze(cfg.size, cfg.seed);
    mazeRef.current = m;
    playerRef.current = { x: m.start.x, y: m.start.y };
    levelRef.current = lvl;
    lvlDoneRef.current = false;
    gameDoneRef.current = false;
    completedRef.current = false;
    shiftTimerRef.current = 0;
    forceUpdate();
    requestAnimationFrame(() => draw());
  }, [draw, forceUpdate]);

  const nextLevel = useCallback(() => {
    const next = levelRef.current + 1;
    if (next >= LEVEL_CONFIGS.length) {
      gameDoneRef.current = true;
      forceUpdate();
      return;
    }
    initLevel(next);
  }, [initLevel, forceUpdate]);

  const restart = useCallback(() => {
    levelRef.current = 0;
    scoreRef.current = 0;
    initLevel(0);
  }, [initLevel]);

  useEffect(() => {
    const handleKey = (e) => {
      keysRef.current[e.key] = e.type === 'keydown';
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, []);

  useEffect(() => {
    let animId;
    const loop = () => {
      const ks = keysRef.current;
      let dx = 0, dy = 0;
      if (ks['ArrowLeft'] || ks['a']) dx = -1;
      if (ks['ArrowRight'] || ks['d']) dx = 1;
      if (ks['ArrowUp'] || ks['w']) dy = -1;
      if (ks['ArrowDown'] || ks['s']) dy = 1;
      if (dx !== 0 && dy !== 0) {
        const inv = 1 / Math.SQRT2;
        dx *= inv;
        dy *= inv;
      }
      if (dx !== 0 || dy !== 0) tryMove(dx, dy);

      const cfg = LEVEL_CONFIGS[Math.min(levelRef.current, LEVEL_CONFIGS.length - 1)];
      shiftTimerRef.current += 16;
      if (shiftTimerRef.current >= cfg.shiftInterval) {
        shiftTimerRef.current = 0;
        shiftMaze();
      }

      draw();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tryMove, shiftMaze, draw]);

  useEffect(() => {
    initLevel(0);
  }, [initLevel]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const size = Math.min(parent.clientWidth, 700);
      canvas.width = size;
      canvas.height = size;
      draw();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div className="builtin-game void-maze">
      <div className="void-maze-hud">
        <span className="void-maze-level">Level {level}/20</span>
        <span className="void-maze-score">Score: {score}</span>
      </div>
      <div className="void-maze-canvas-wrapper">
        <canvas ref={canvasRef} className="game-canvas" />
      </div>
      <div className="game-controls-hint">WASD / Arrow Keys to move &mdash; find the exit in the dark</div>

      {levelComplete && !gameComplete && (
        <div className="game-overlay" onClick={nextLevel}>
          <h2>Level {level} Complete!</h2>
          <p>Score: {score}</p>
          <button className="btn-primary" onClick={nextLevel}>Next Level</button>
        </div>
      )}
      {gameComplete && (
        <div className="game-overlay" onClick={restart}>
          <h2>The Void Consumed All</h2>
          <p>Final Score: {score}</p>
          <button className="btn-primary" onClick={restart}>Play Again</button>
        </div>
      )}
    </div>
  );
}
