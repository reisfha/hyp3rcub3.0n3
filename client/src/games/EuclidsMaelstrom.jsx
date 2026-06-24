import { useState, useEffect, useRef, useCallback } from 'react';

const T = { FLOOR: 0, WALL: 1, PORTAL: 2, GEM: 3, EXIT: 4 };
const D = { N: [0,-1], S: [0,1], E: [1,0], W: [-1,0] };
const PCOLORS = ['#ff00aa','#00ff88','#ff6600','#9944ff','#ffcc00','#00f0ff'];

const LEVELS = [
  { rooms: 2, grid: 5, gems: 1, portals: 0, rewires: 0 },
  { rooms: 3, grid: 5, gems: 1, portals: 0, rewires: 0 },
  { rooms: 3, grid: 5, gems: 1, portals: 1, rewires: 0 },
  { rooms: 3, grid: 5, gems: 1, portals: 0, rewires: 1 },
  { rooms: 3, grid: 5, gems: 2, portals: 1, rewires: 1 },
  { rooms: 4, grid: 5, gems: 2, portals: 1, rewires: 1 },
  { rooms: 4, grid: 5, gems: 2, portals: 2, rewires: 2 },
  { rooms: 4, grid: 5, gems: 3, portals: 2, rewires: 2 },
  { rooms: 4, grid: 7, gems: 2, portals: 2, rewires: 2 },
  { rooms: 5, grid: 7, gems: 3, portals: 2, rewires: 2 },
  { rooms: 5, grid: 7, gems: 3, portals: 3, rewires: 3 },
  { rooms: 5, grid: 7, gems: 3, portals: 3, rewires: 3 },
  { rooms: 6, grid: 7, gems: 3, portals: 3, rewires: 3 },
  { rooms: 6, grid: 7, gems: 4, portals: 3, rewires: 4 },
  { rooms: 6, grid: 7, gems: 4, portals: 4, rewires: 4 },
  { rooms: 6, grid: 7, gems: 4, portals: 4, rewires: 4 },
  { rooms: 7, grid: 7, gems: 4, portals: 4, rewires: 5 },
  { rooms: 7, grid: 7, gems: 5, portals: 4, rewires: 5 },
  { rooms: 7, grid: 7, gems: 5, portals: 5, rewires: 5 },
  { rooms: 8, grid: 7, gems: 5, portals: 5, rewires: 6 },
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

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

function getLanding(dir, N) {
  const m = Math.floor(N / 2);
  switch (dir) {
    case 'E': return { lx: 1, ly: m };       // player walks east → lands near west wall
    case 'W': return { lx: N-2, ly: m };      // player walks west → lands near east wall
    case 'S': return { lx: m, ly: 1 };         // player walks south → lands near north wall
    case 'N': return { lx: m, ly: N-2 };       // player walks north → lands near south wall
    default: return { lx: 1, ly: 1 };
  }
}

function generateLevel(config, seed) {
  const rng = mulberry32(seed);
  const N = config.grid;
  const MID = Math.floor(N / 2);
  const rooms = [];

  const createGrid = () => {
    const g = Array(N).fill(null).map(() => Array(N).fill(T.FLOOR));
    for (let i = 0; i < N; i++) {
      g[0][i] = T.WALL; g[N-1][i] = T.WALL;
      g[i][0] = T.WALL; g[i][N-1] = T.WALL;
    }
    const pillars = randInt(1, Math.max(1, Math.floor((N-2)*(N-2)*0.1)), rng);
    for (let p = 0; p < pillars; p++) {
      const px = randInt(1, N-2, rng), py = randInt(1, N-2, rng);
      if (g[py][px] === T.FLOOR) g[py][px] = T.WALL;
    }
    return g;
  };

  for (let i = 0; i < config.rooms; i++) {
    rooms.push({
      id: i,
      grid: createGrid(),
      doors: { N: null, S: null, E: null, W: null },
      portals: [],
      gems: [],
      exit: null,
      start: null,
    });
  }

  const cols = Math.ceil(Math.sqrt(config.rooms));
  const rewired = new Set();

  // Build natural connections on a virtual grid
  for (let i = 0; i < config.rooms; i++) {
    const gx = i % cols, gy = Math.floor(i / cols);
    // East→West connections (same row)
    if (gx + 1 < cols && i + 1 < config.rooms) {
      const doorY = randInt(1, N-2, rng);
      // Room i: door on east wall (N-1, doorY)
      rooms[i].grid[doorY][N-1] = T.FLOOR;
      const landing = getLanding('E', N);
      rooms[i].doors.E = { to: i+1, lx: landing.lx, ly: landing.ly };
      // Room i+1: door on west wall (0, doorY)
      rooms[i+1].grid[doorY][0] = T.FLOOR;
      const landingW = getLanding('W', N);
      rooms[i+1].doors.W = { to: i, lx: landingW.lx, ly: landingW.ly };
    }
    // North→South connections (same column)
    if (gy + 1 < Math.ceil(config.rooms / cols) && i + cols < config.rooms) {
      const doorX = randInt(1, N-2, rng);
      // Room i: door on south wall (doorX, N-1)
      rooms[i].grid[N-1][doorX] = T.FLOOR;
      const landing = getLanding('S', N);
      rooms[i].doors.S = { to: i+cols, lx: landing.lx, ly: landing.ly };
      // Room i+cols: door on north wall (doorX, 0)
      rooms[i+cols].grid[0][doorX] = T.FLOOR;
      const landingN = getLanding('N', N);
      rooms[i+cols].doors.N = { to: i, lx: landingN.lx, ly: landingN.ly };
    }
  }

  // Apply rewires: replace natural connections with non-Euclidean ones
  for (let w = 0; w < config.rewires; w++) {
    const candidates = [];
    rooms.forEach(r => {
      Object.entries(r.doors).forEach(([dir, door]) => {
        if (door && !rewired.has(`${r.id}:${dir}`)) candidates.push({ room: r, dir, door });
      });
    });
    if (candidates.length === 0) break;
    const pick = candidates[randInt(0, candidates.length - 1, rng)];
    const targets = rooms.filter(r => r.id !== pick.room.id && r.id !== pick.door.to);
    if (targets.length === 0) continue;
    const target = targets[randInt(0, targets.length - 1, rng)];
    const landing = getLanding(pick.dir, N);
    pick.room.doors[pick.dir] = { to: target.id, lx: landing.lx, ly: landing.ly };
    rewired.add(`${pick.room.id}:${pick.dir}`);
    // Ensure landing tile in target is walkable
    if (target.grid[landing.ly] && target.grid[landing.ly][landing.lx] === T.WALL) {
      target.grid[landing.ly][landing.lx] = T.FLOOR;
    }
  }

  // Place portals
  const placedPortalRooms = new Set();
  for (let p = 0; p < config.portals; p++) {
    const valid = rooms.filter(r => !placedPortalRooms.has(r.id) && r.id !== 0);
    if (valid.length < 2) break;
    const r1 = valid[randInt(0, valid.length - 1, rng)];
    placedPortalRooms.add(r1.id);
    const valid2 = valid.filter(r => !placedPortalRooms.has(r.id));
    if (valid2.length === 0) break;
    const r2 = valid2[randInt(0, valid2.length - 1, rng)];
    placedPortalRooms.add(r2.id);
    const findFloor = room => {
      const tiles = [];
      for (let y = 1; y < N-1; y++) for (let x = 1; x < N-1; x++) {
        if (room.grid[y][x] === T.FLOOR) tiles.push({x,y});
      }
      return tiles.length > 0 ? tiles[randInt(0, tiles.length - 1, rng)] : {x:MID,y:MID};
    };
    const t1 = findFloor(r1), t2 = findFloor(r2);
    r1.portals.push({ x: t1.x, y: t1.y, to: r2.id, lx: t2.x, ly: t2.y, pairId: p });
    r2.portals.push({ x: t2.x, y: t2.y, to: r1.id, lx: t1.x, ly: t1.y, pairId: p });
    r1.grid[t1.y][t1.x] = T.PORTAL;
    r2.grid[t2.y][t2.x] = T.PORTAL;
  }

  // Place gems
  let placedGems = 0;
  while (placedGems < config.gems) {
    const ri = randInt(1, config.rooms - 1, rng);
    const rm = rooms[ri];
    const candidates = [];
    for (let y = 1; y < N-1; y++) for (let x = 1; x < N-1; x++) {
      if (rm.grid[y][x] === T.FLOOR) candidates.push({x,y});
    }
    if (candidates.length === 0) continue;
    const pos = candidates[randInt(0, candidates.length - 1, rng)];
    if (rm.portals.some(p => p.x === pos.x && p.y === pos.y)) continue;
    rm.gems.push({ x: pos.x, y: pos.y, collected: false });
    rm.grid[pos.y][pos.x] = T.GEM;
    placedGems++;
  }

  // Place exit in last room
  const exitRoom = rooms[rooms.length - 1];
  const exitCandidates = [];
  for (let y = 1; y < N-1; y++) for (let x = 1; x < N-1; x++) {
    if (exitRoom.grid[y][x] === T.FLOOR) exitCandidates.push({x,y});
  }
  if (exitCandidates.length > 0) {
    const pos = exitCandidates[randInt(0, exitCandidates.length - 1, rng)];
    exitRoom.exit = { x: pos.x, y: pos.y };
    exitRoom.grid[pos.y][pos.x] = T.EXIT;
  }

  // Player start
  rooms[0].start = { x: 1, y: 1 };

  return rooms;
}

export default function EuclidsMaelstrom({ onScore }) {
  const canvasRef = useRef(null);
  const roomsRef = useRef([]);
  const crRef = useRef(0);
  const pxRef = useRef(1);
  const pyRef = useRef(1);
  const faceRef = useRef('E');
  const gemsRef = useRef(0);
  const totalGemsRef = useRef(0);
  const scoreRef = useRef(0);
  const lvlRef = useRef(0);
  const lvlDoneRef = useRef(false);
  const gameDoneRef = useRef(false);
  const dirQRef = useRef(null);
  const animRef = useRef(0);

  const [level, setLevel] = useState(1);
  const [gemsCollected, setGemsCollected] = useState(0);
  const [totalGems, setTotalGems] = useState(0);
  const [score, setScore] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [canvasSize, setCanvasSize] = useState(340);

  const forceUpdate = useCallback(() => {
    const i = lvlRef.current;
    setLevel(i + 1);
    setGemsCollected(gemsRef.current);
    setTotalGems(totalGemsRef.current);
    setScore(scoreRef.current);
    setLevelComplete(lvlDoneRef.current);
    setGameComplete(gameDoneRef.current);
    const cfg = LEVELS[Math.min(i, LEVELS.length - 1)];
    setCanvasSize(cfg.grid === 5 ? 340 : 420);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const N = roomsRef.current.length > 0 ? roomsRef.current[0].grid.length : 5;
    const MID = Math.floor(N / 2);
    const PAD = N === 5 ? 24 : 12;
    const TILE = Math.floor((canvas.width - PAD * 2) / N);
    const room = roomsRef.current[crRef.current];
    if (!room) return;

    const time = animRef.current * 0.2;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const px = PAD + x * TILE, py = PAD + y * TILE;
        const tile = room.grid[y][x];
        const cx = px + TILE/2, cy = py + TILE/2;

        if (tile === T.WALL) {
          ctx.fillStyle = '#12122a';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = '#1a1a4a';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, TILE, TILE);
        } else if (tile === T.PORTAL) {
          ctx.fillStyle = '#0a0a1a';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = '#111133';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, TILE, TILE);

          const portal = room.portals.find(p => p.x === x && p.y === y);
          const color = PCOLORS[portal ? portal.pairId % PCOLORS.length : 0];
          const pulse = 0.7 + 0.3 * Math.sin(time + (portal ? portal.pairId * 1.5 : 0));
          const r = TILE * 0.35 * pulse;

          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.shadowBlur = 20;
          ctx.shadowColor = color;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.globalAlpha = 0.4 + 0.2 * Math.sin(time + 1 + (portal ? portal.pairId * 1.5 : 0));
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (tile === T.GEM) {
          ctx.fillStyle = '#0a0a1a';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = '#111133';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, TILE, TILE);

          const gem = room.gems.find(g => g.x === x && g.y === y && !g.collected);
          if (gem) {
            const s = TILE * 0.22;
            const spark = 0.8 + 0.2 * Math.sin(time * 2 + x * 3 + y * 7);
            ctx.beginPath();
            ctx.moveTo(cx, cy - s);
            ctx.lineTo(cx + s * 0.6, cy);
            ctx.lineTo(cx, cy + s);
            ctx.lineTo(cx - s * 0.6, cy);
            ctx.closePath();
            ctx.fillStyle = '#ffdd00';
            ctx.shadowBlur = 12 * spark;
            ctx.shadowColor = '#ffdd00';
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.beginPath();
            ctx.moveTo(cx, cy - s * 0.4);
            ctx.lineTo(cx + s * 0.3, cy);
            ctx.lineTo(cx, cy + s * 0.4);
            ctx.lineTo(cx - s * 0.3, cy);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255,255,200,0.5)';
            ctx.fill();
          }
        } else if (tile === T.EXIT) {
          ctx.fillStyle = '#0a0a1a';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = '#111133';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, TILE, TILE);

          const pulse = 0.7 + 0.3 * Math.sin(time * 1.5);
          ctx.beginPath();
          ctx.arc(cx, cy, TILE * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = '#00ff88';
          ctx.shadowBlur = 20 * pulse;
          ctx.shadowColor = '#00ff88';
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#fff';
          ctx.font = `${TILE * 0.45}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', cx, cy + 1);
        } else {
          ctx.fillStyle = '#0a0a1a';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = '#0f0f25';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, TILE, TILE);
        }
      }
    }

    // Door indicators (small arrows at door positions)
    for (const [dir, door] of Object.entries(room.doors)) {
      if (!door) continue;
      let dx, dy;
      if (dir === 'N') { dx = MID; dy = 0; }
      else if (dir === 'S') { dx = MID; dy = N - 1; }
      else if (dir === 'E') { dx = N - 1; dy = MID; }
      else { dx = 0; dy = MID; }

      const dpx = PAD + dx * TILE, dpy = PAD + dy * TILE;
      ctx.fillStyle = '#0d0d20';
      ctx.fillRect(dpx, dpy, TILE, TILE);

      const acx = dpx + TILE/2, acy = dpy + TILE/2;
      ctx.fillStyle = '#334';
      const as = TILE * 0.15;
      ctx.beginPath();
      if (dir === 'N') { ctx.moveTo(acx, acy - as); ctx.lineTo(acx + as, acy + as); ctx.lineTo(acx - as, acy + as); }
      else if (dir === 'S') { ctx.moveTo(acx, acy + as); ctx.lineTo(acx + as, acy - as); ctx.lineTo(acx - as, acy - as); }
      else if (dir === 'E') { ctx.moveTo(acx + as, acy); ctx.lineTo(acx - as, acy - as); ctx.lineTo(acx - as, acy + as); }
      else { ctx.moveTo(acx - as, acy); ctx.lineTo(acx + as, acy - as); ctx.lineTo(acx + as, acy + as); }
      ctx.closePath();
      ctx.fill();
    }

    // Player
    if (!lvlDoneRef.current && !gameDoneRef.current) {
      const ppx = PAD + pxRef.current * TILE + TILE/2;
      const ppy = PAD + pyRef.current * TILE + TILE/2;
      const s = TILE * 0.28;

      ctx.save();
      ctx.translate(ppx, ppy);
      let angle = 0;
      if (faceRef.current === 'N') angle = -Math.PI/2;
      else if (faceRef.current === 'S') angle = Math.PI/2;
      else if (faceRef.current === 'W') angle = Math.PI;
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(-s * 0.7, -s * 0.65);
      ctx.lineTo(-s * 0.3, 0);
      ctx.lineTo(-s * 0.7, s * 0.65);
      ctx.closePath();
      ctx.fillStyle = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f0ff';
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.moveTo(s * 0.5, 0);
      ctx.lineTo(-s * 0.2, -s * 0.3);
      ctx.lineTo(-s * 0.1, 0);
      ctx.lineTo(-s * 0.2, s * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }, []);

  const tryMove = useCallback((dir) => {
    if (lvlDoneRef.current || gameDoneRef.current) return;
    const room = roomsRef.current[crRef.current];
    if (!room) return;
    const N = room.grid.length;
    const dx = D[dir][0], dy = D[dir][1];
    const nx = pxRef.current + dx, ny = pyRef.current + dy;
    faceRef.current = dir;

    if (nx < 0 || nx >= N || ny < 0 || ny >= N) {
      const door = room.doors[dir];
      if (door) {
        crRef.current = door.to;
        pxRef.current = door.lx;
        pyRef.current = door.ly;
        faceRef.current = dir;
        forceUpdate();
      }
      return;
    }

    if (room.grid[ny][nx] === T.WALL) return;

    if (room.grid[ny][nx] === T.PORTAL) {
      const portal = room.portals.find(p => p.x === nx && p.y === ny);
      if (portal) {
        crRef.current = portal.to;
        pxRef.current = portal.lx;
        pyRef.current = portal.ly;
        forceUpdate();
        return;
      }
    }

    if (room.grid[ny][nx] === T.GEM) {
      const gem = room.gems.find(g => g.x === nx && g.y === ny && !g.collected);
      if (gem) {
        gem.collected = true;
        gemsRef.current++;
        scoreRef.current += 100;
        onScore?.(scoreRef.current);
        room.grid[ny][nx] = T.FLOOR;
        forceUpdate();
      }
    }

    if (room.grid[ny][nx] === T.EXIT) {
      if (gemsRef.current >= totalGemsRef.current) {
        scoreRef.current += 500 * (lvlRef.current + 1);
        lvlDoneRef.current = true;
        onScore?.(scoreRef.current);
        forceUpdate();
        return;
      }
    }

    pxRef.current = nx;
    pyRef.current = ny;
    forceUpdate();
  }, [onScore, forceUpdate]);

  const initLevel = useCallback((lvl) => {
    const config = LEVELS[lvl];
    const rooms = generateLevel(config, lvl + 1);
    roomsRef.current = rooms;
    crRef.current = 0;
    pxRef.current = rooms[0].start.x;
    pyRef.current = rooms[0].start.y;
    faceRef.current = 'E';
    gemsRef.current = 0;
    totalGemsRef.current = config.gems;
    lvlDoneRef.current = false;
    gameDoneRef.current = false;
    forceUpdate();
    requestAnimationFrame(() => draw());
  }, [draw, forceUpdate]);

  const nextLevel = useCallback((e) => {
    if (e) e.stopPropagation();
    const next = lvlRef.current + 1;
    if (next >= LEVELS.length) {
      gameDoneRef.current = true;
      forceUpdate();
      return;
    }
    lvlRef.current = next;
    initLevel(next);
  }, [initLevel, forceUpdate]);

  const restart = useCallback((e) => {
    if (e) e.stopPropagation();
    lvlRef.current = 0;
    scoreRef.current = 0;
    initLevel(0);
  }, [initLevel]);

  // Game loop + render loop
  useEffect(() => {
    const interval = setInterval(() => {
      animRef.current++;
      if (dirQRef.current && !lvlDoneRef.current && !gameDoneRef.current) {
        tryMove(dirQRef.current);
        dirQRef.current = null;
      }
      draw();
    }, 100);
    return () => clearInterval(interval);
  }, [tryMove, draw]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (lvlDoneRef.current || gameDoneRef.current) return;
      const keyMap = { ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'W', ArrowRight: 'E', w: 'N', s: 'S', a: 'W', d: 'E' };
      const d = keyMap[e.key];
      if (d) {
        dirQRef.current = d;
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Init
  useEffect(() => {
    initLevel(0);
  }, [initLevel]);

  return (
    <div className="builtin-game euclid-game">
      <div className="euclid-hud">
        <span className="euclid-level">Level {level}/20</span>
        <span className="euclid-gems">Gems: {gemsCollected}/{totalGems}</span>
        <span className="euclid-score">Score: {score}</span>
      </div>
      <canvas ref={canvasRef} width={canvasSize} height={canvasSize} className="game-canvas" />
      <div className="game-controls-hint">WASD / Arrow Keys</div>

      {levelComplete && !gameComplete && (
        <div className="game-overlay" onClick={nextLevel}>
          <h2>Level {level} Complete!</h2>
          <p>Score: {score}</p>
          <button className="btn-primary" onClick={nextLevel}>Next Level</button>
        </div>
      )}
      {gameComplete && (
        <div className="game-overlay" onClick={restart}>
          <h2>You Escaped the Maelstrom!</h2>
          <p>Final Score: {score}</p>
          <button className="btn-primary" onClick={restart}>Play Again</button>
        </div>
      )}
    </div>
  );
}
