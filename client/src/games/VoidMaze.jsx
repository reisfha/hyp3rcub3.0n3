import { useState, useEffect, useRef, useCallback } from 'react';

const TILE = 48;
const COLS = 10;
const ROWS = 8;
const W = COLS * TILE;
const H = ROWS * TILE;
const GRAVITY = 0.45;
const JUMP_VEL = -7.5;
const MOVE_SPEED = 2.5;
const PW = 18;
const PH = 34;

const LEVELS = [
  { roomsX: 2, roomsY: 4, layers: 2, seed: 1 },
  { roomsX: 2, roomsY: 4, layers: 2, seed: 2 },
  { roomsX: 2, roomsY: 4, layers: 3, seed: 3 },
  { roomsX: 2, roomsY: 4, layers: 3, seed: 4 },
  { roomsX: 3, roomsY: 4, layers: 3, seed: 5 },
  { roomsX: 3, roomsY: 4, layers: 3, seed: 6 },
  { roomsX: 3, roomsY: 4, layers: 4, seed: 7 },
  { roomsX: 3, roomsY: 4, layers: 4, seed: 8 },
  { roomsX: 3, roomsY: 5, layers: 4, seed: 9 },
  { roomsX: 3, roomsY: 5, layers: 4, seed: 10 },
  { roomsX: 4, roomsY: 4, layers: 4, seed: 11 },
  { roomsX: 4, roomsY: 4, layers: 4, seed: 12 },
  { roomsX: 4, roomsY: 5, layers: 4, seed: 13 },
  { roomsX: 4, roomsY: 5, layers: 4, seed: 14 },
  { roomsX: 4, roomsY: 5, layers: 5, seed: 15 },
  { roomsX: 4, roomsY: 5, layers: 5, seed: 16 },
  { roomsX: 4, roomsY: 5, layers: 5, seed: 17 },
  { roomsX: 4, roomsY: 6, layers: 5, seed: 18 },
  { roomsX: 4, roomsY: 6, layers: 5, seed: 19 },
  { roomsX: 5, roomsY: 5, layers: 6, seed: 20 },
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

function generateRoom(seed, hasExit, edges) {
  const rng = mulberry32(seed);
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  for (let x = 0; x < COLS; x++) {
    if (edges.bottom) {
      if (rng() > 0.75) grid[ROWS - 1][x] = 1;
    } else {
      grid[ROWS - 1][x] = 1;
    }
  }
  if (!edges.bottom) {
    const g = Math.floor(rng() * (COLS - 2)) + 1;
    grid[ROWS - 1][g] = 0;
  }

  if (edges.top) {
    for (let x = 0; x < COLS; x++) {
      if (rng() < 0.35) grid[0][x] = 1;
    }
  } else {
    for (let x = 0; x < COLS; x++) grid[0][x] = 1;
  }

  if (edges.left) {
    for (let y = 1; y < ROWS - 1; y++) {
      if (rng() < 0.45) grid[y][0] = 1;
    }
  } else {
    for (let y = 0; y < ROWS; y++) grid[y][0] = 1;
  }

  if (edges.right) {
    for (let y = 1; y < ROWS - 1; y++) {
      if (rng() < 0.45) grid[y][COLS - 1] = 1;
    }
  } else {
    for (let y = 0; y < ROWS; y++) grid[y][COLS - 1] = 1;
  }

  const platCount = Math.floor(rng() * 4) + 2;
  for (let i = 0; i < platCount; i++) {
    const x = Math.floor(rng() * (COLS - 3)) + 1;
    const y = Math.floor(rng() * 5) + 1;
    const w = Math.floor(rng() * 3) + 2;
    for (let j = 0; j < w && x + j < COLS - 1; j++) {
      grid[y][x + j] = 1;
    }
  }

  if (hasExit) {
    const candidates = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (grid[y][x] === 0 && (y === ROWS - 1 || grid[y + 1][x] === 1)) {
          candidates.push({ x, y });
        }
      }
    }
    if (candidates.length > 0) {
      const e = candidates[Math.floor(rng() * candidates.length)];
      grid[e.y][e.x] = 2;
    }
  }

  return grid;
}

function generateLevel(cfg) {
  const rng = mulberry32(cfg.seed);
  const exitPos = { x: Math.floor(rng() * cfg.roomsX), y: Math.floor(rng() * cfg.roomsY) };
  const exitLayer = Math.floor(rng() * cfg.layers);
  const rooms = {};
  const currentLayers = {};

  for (let ry = 0; ry < cfg.roomsY; ry++) {
    for (let rx = 0; rx < cfg.roomsX; rx++) {
      const key = `${rx},${ry}`;
      currentLayers[key] = 0;
      rooms[key] = [];
      const edges = {
        left: rx > 0,
        right: rx < cfg.roomsX - 1,
        top: ry > 0,
        bottom: ry < cfg.roomsY - 1,
      };
      for (let l = 0; l < cfg.layers; l++) {
        const layerSeed = cfg.seed * 1000 + rx * 100 + ry * 10 + l;
        const hasExit = rx === exitPos.x && ry === exitPos.y && l === exitLayer;
        rooms[key].push(generateRoom(layerSeed, hasExit, edges));
      }
    }
  }

  return { rooms, cfg, exitPos, exitLayer, currentLayers };
}

function collides(grid, px, py) {
  const x1 = Math.floor(px / TILE);
  const y1 = Math.floor(py / TILE);
  const x2 = Math.floor((px + PW - 1) / TILE);
  const y2 = Math.floor((py + PH - 1) / TILE);
  for (let ty = y1; ty <= y2; ty++) {
    for (let tx = x1; tx <= x2; tx++) {
      if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return true;
      if (grid[ty][tx] === 1) return true;
    }
  }
  return false;
}

export default function VoidMaze({ onScore }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const gRef = useRef(null);
  const animRef = useRef(null);

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const forceUpdate = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    setLevel(g.level + 1);
    setScore(g.score);
    setLevelComplete(g.lvlDone);
    setGameComplete(g.gameDone);
  }, []);

  const initLevel = useCallback((lvl) => {
    const cfg = LEVELS[Math.min(lvl, LEVELS.length - 1)];
    const world = generateLevel(cfg);
    const key = '0,0';
    const grid = world.rooms[key][0];
    grid[ROWS - 1][2] = 1;
    gRef.current = {
      ...world,
      level: lvl,
      score: gRef.current ? gRef.current.score : 0,
      lvlDone: false,
      gameDone: false,
      player: { x: TILE * 2, y: (ROWS - 1) * TILE - PH, vx: 0, vy: 0 },
      roomPos: { x: 0, y: 0 },
      grounded: true,
      grid,
      flashTimer: 0,
    };
    forceUpdate();
  }, [forceUpdate]);

  const nextLevel = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    const next = g.level + 1;
    if (next >= LEVELS.length) {
      g.lvlDone = false;
      g.gameDone = true;
      forceUpdate();
      return;
    }
    g.score += 500 * (g.level + 1);
    onScore?.(g.score);
    initLevel(next);
  }, [initLevel, forceUpdate, onScore]);

  const restart = useCallback(() => {
    const s = gRef.current ? gRef.current.score : 0;
    initLevel(0);
    if (gRef.current) gRef.current.score = s;
  }, [initLevel]);

  useEffect(() => { initLevel(0); }, []);

  const keys = {};

  useEffect(() => {
    const hk = (e) => {
      keys[e.key] = e.type === 'keydown';
      if (['w', 'a', 's', 'd', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', hk);
    window.addEventListener('keyup', hk);
    return () => { window.removeEventListener('keydown', hk); window.removeEventListener('keyup', hk); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;

    const loop = () => {
      const g = gRef.current;
      if (!g) { animRef.current = requestAnimationFrame(loop); return; }
      const p = g.player;

      if (!g.lvlDone && !g.gameDone && g.flashTimer === 0) {
        let mx = 0;
        if (keys['a'] || keys['ArrowLeft']) mx = -MOVE_SPEED;
        if (keys['d'] || keys['ArrowRight']) mx = MOVE_SPEED;

        if ((keys['w'] || keys[' '] || keys['ArrowUp']) && g.grounded) {
          p.vy = JUMP_VEL;
          g.grounded = false;
        }

        p.vx = mx;
        p.vy += GRAVITY;
        if (p.vy > 12) p.vy = 12;

        let nx = p.x + p.vx;
        if (collides(g.grid, nx, p.y)) {
          if (p.vx > 0) nx = Math.floor((nx + PW) / TILE) * TILE - PW;
          else nx = Math.ceil(nx / TILE) * TILE;
          p.vx = 0;
        }
        p.x = nx;

        let ny = p.y + p.vy;
        if (collides(g.grid, p.x, ny)) {
          if (p.vy > 0) {
            ny = Math.floor((ny + PH) / TILE) * TILE - PH;
            g.grounded = true;
          } else {
            ny = Math.ceil(ny / TILE) * TILE;
          }
          p.vy = 0;
        }
        p.y = ny;

        if (p.y + PH > H + 8) {
          g.flashTimer = 4;
        } else if (p.x < -8) {
          if (g.roomPos.x > 0) {
            const oldKey = `${g.roomPos.x},${g.roomPos.y}`;
            g.currentLayers[oldKey] = (g.currentLayers[oldKey] + 1) % g.cfg.layers;
            g.roomPos.x--;
            const nk = `${g.roomPos.x},${g.roomPos.y}`;
            g.grid = g.rooms[nk][g.currentLayers[nk]];
            p.x = W - TILE - 4;
            g.flashTimer = 4;
          } else {
            p.x = 0;
          }
        } else if (p.x + PW > W + 8) {
          if (g.roomPos.x < g.cfg.roomsX - 1) {
            const oldKey = `${g.roomPos.x},${g.roomPos.y}`;
            g.currentLayers[oldKey] = (g.currentLayers[oldKey] + 1) % g.cfg.layers;
            g.roomPos.x++;
            const nk = `${g.roomPos.x},${g.roomPos.y}`;
            g.grid = g.rooms[nk][g.currentLayers[nk]];
            p.x = TILE + 4;
            g.flashTimer = 4;
          } else {
            p.x = W - PW;
          }
        } else if (p.y < -8) {
          if (g.roomPos.y > 0) {
            const oldKey = `${g.roomPos.x},${g.roomPos.y}`;
            g.currentLayers[oldKey] = (g.currentLayers[oldKey] + 1) % g.cfg.layers;
            g.roomPos.y--;
            const nk = `${g.roomPos.x},${g.roomPos.y}`;
            g.grid = g.rooms[nk][g.currentLayers[nk]];
            p.y = H - TILE - 4;
            g.flashTimer = 4;
          } else {
            p.y = 0;
          }
        } else if (p.y > H + 8) {
          if (g.roomPos.y < g.cfg.roomsY - 1) {
            const oldKey = `${g.roomPos.x},${g.roomPos.y}`;
            g.currentLayers[oldKey] = (g.currentLayers[oldKey] + 1) % g.cfg.layers;
            g.roomPos.y++;
            const nk = `${g.roomPos.x},${g.roomPos.y}`;
            g.grid = g.rooms[nk][g.currentLayers[nk]];
            p.y = TILE + 4;
            g.flashTimer = 4;
          } else {
            p.y = H - PH;
            p.vy = 0;
          }
        }

        const px = Math.floor((p.x + PW / 2) / TILE);
        const py = Math.floor((p.y + PH / 2) / TILE);
        if (px >= 0 && px < COLS && py >= 0 && py < ROWS && g.grid[py][px] === 2 && !g.lvlDone) {
          g.lvlDone = true;
          forceUpdate();
        }
      }

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      if (g.flashTimer > 0) {
        g.flashTimer--;
        ctx.fillStyle = `rgba(255,255,255,${g.flashTimer / 4})`;
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (g.grid[y][x] === 1) {
              ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
            } else if (g.grid[y][x] === 2) {
              ctx.fillStyle = '#fff';
              const cx = x * TILE + TILE / 2;
              const cy = y * TILE + TILE / 2;
              ctx.beginPath();
              ctx.moveTo(cx, cy - 5);
              ctx.lineTo(cx + 4, cy);
              ctx.lineTo(cx, cy + 5);
              ctx.lineTo(cx - 4, cy);
              ctx.closePath();
              ctx.fill();
            }
          }
        }

        ctx.fillStyle = '#fff';
        ctx.fillRect(p.x, p.y, PW, PH);
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const g = gRef.current;
  const roomLabel = g
    ? `${g.roomPos.x},${g.roomPos.y} L${(g.currentLayers[`${g.roomPos.x},${g.roomPos.y}`] ?? 0) + 1}`
    : '';

  return (
    <div className="builtin-game void-maze" style={{ alignItems: 'center' }}>
      <div className="void-maze-hud" style={{ justifyContent: 'center', gap: 20 }}>
        <span className="void-maze-level">Level {level}/{LEVELS.length}</span>
        <span className="void-maze-score">Score: {score}</span>
        <span className="void-maze-zone">Room {roomLabel}</span>
      </div>
      <div ref={wrapperRef} className="void-maze-canvas-wrapper"
           style={{ width: W, height: H, flex: 'none', borderRadius: 4 }}>
        <canvas ref={canvasRef} style={{ display: 'block', imageRendering: 'pixelated' }} />
      </div>
      {levelComplete && !gameComplete && (
        <div className="game-overlay" onClick={nextLevel}>
          <h2>Room {roomLabel} Clear!</h2>
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
