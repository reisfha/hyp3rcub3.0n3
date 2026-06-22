import { useState, useEffect, useRef } from 'react';

const W = 448, H = 496, TILE = 28;
const COLS = 16, ROWS = 16;

const MAP = [
  '################',
  '#............#.#',
  '#.####.####.#.#',
  '#o####.####...#',
  '#.............#',
  '#.####.##.####.#',
  '#.....#.....#.#',
  '###.##.#.##.#.#',
  '#.....#.....#.#',
  '#.##.#####.##.#',
  '#.##.......##.#',
  '#.##.##.##.##.#',
  '#....##.##....#',
  '#o###########o#',
  '#..............#',
  '################'
];

export default function PacmanGame({ onScore }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const state = {
      pacman: { x: 1 * TILE + TILE/2, y: 1 * TILE + TILE/2, r: 10, dir: {x:1,y:0}, nextDir: {x:1,y:0}, mouth: 0 },
      ghosts: [
        { x: 7*TILE + TILE/2, y: 7*TILE + TILE/2, r: 10, dir: {x:-1,y:0}, color: '#ff0000', frightened: false },
        { x: 8*TILE + TILE/2, y: 7*TILE + TILE/2, r: 10, dir: {x:1,y:0}, color: '#ffb8ff', frightened: false },
        { x: 7*TILE + TILE/2, y: 8*TILE + TILE/2, r: 10, dir: {x:0,y:1}, color: '#00ffff', frightened: false },
        { x: 8*TILE + TILE/2, y: 8*TILE + TILE/2, r: 10, dir: {x:0,y:-1}, color: '#ffb852', frightened: false }
      ],
      dots: [],
      score: 0,
      dead: false,
      running: true,
      keys: {}
    };

    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (MAP[r]?.[c] === '.') state.dots.push({ x: c * TILE + TILE/2, y: r * TILE + TILE/2, eaten: false, big: false });
      if (MAP[r]?.[c] === 'o') state.dots.push({ x: c * TILE + TILE/2, y: r * TILE + TILE/2, eaten: false, big: true });
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const isWall = (x, y) => {
      const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
      return MAP[r]?.[c] === '#';
    };

    const canMove = (x, y, dir, r) => {
      const nx = x + dir.x * 2, ny = y + dir.y * 2;
      return !isWall(nx + (dir.x ? 0 : r), ny + (dir.y ? 0 : r));
    };

    const loop = () => {
      const p = state.pacman;
      if (state.keys['ArrowLeft']) p.nextDir = {x:-1,y:0};
      if (state.keys['ArrowRight']) p.nextDir = {x:1,y:0};
      if (state.keys['ArrowUp']) p.nextDir = {x:0,y:-1};
      if (state.keys['ArrowDown']) p.nextDir = {x:0,y:1};

      if (canMove(p.x, p.y, p.nextDir, p.r)) p.dir = p.nextDir;
      if (canMove(p.x, p.y, p.dir, p.r)) { p.x += p.dir.x * 2; p.y += p.dir.y * 2; }
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;

      state.dots.forEach(d => {
        if (!d.eaten && Math.hypot(p.x - d.x, p.y - d.y) < 14) {
          d.eaten = true;
          state.score += d.big ? 50 : 10;
          onScore?.(state.score);
          if (d.big) state.ghosts.forEach(g => g.frightened = true);
        }
      });

      state.ghosts.forEach(g => {
        const dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
        const possible = dirs.filter(d => !(d.x === -g.dir.x && d.y === -g.dir.y) && canMove(g.x, g.y, d, g.r));
        if (possible.length && Math.random() < 0.1) g.dir = possible[Math.floor(Math.random() * possible.length)];
        if (canMove(g.x, g.y, g.dir, g.r)) { g.x += g.dir.x; g.y += g.dir.y; }
        if (Math.hypot(p.x - g.x, p.y - g.y) < 16) {
          if (g.frightened) { g.x = 7*TILE + TILE/2; g.y = 7*TILE + TILE/2; g.frightened = false; state.score += 200; }
          else state.dead = true;
        }
      });

      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (MAP[r]?.[c] === '#') { ctx.fillStyle = '#2121de'; ctx.shadowColor = '#2121de'; ctx.shadowBlur = 4; ctx.fillRect(c*TILE, r*TILE, TILE, TILE); ctx.shadowBlur = 0; }
      }
      state.dots.forEach(d => {
        if (d.eaten) return;
        ctx.fillStyle = '#ffb8ae'; ctx.shadowColor = '#ffb8ae'; ctx.shadowBlur = d.big ? 8 : 2;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.big ? 5 : 2, 0, Math.PI*2); ctx.fill();
      });
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffff00'; ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 10;
      ctx.beginPath();
      const a = Math.atan2(p.dir.y, p.dir.x);
      ctx.arc(p.x, p.y, p.r, a + 0.2, a + Math.PI*2 - 0.2);
      ctx.lineTo(p.x, p.y); ctx.fill();
      ctx.shadowBlur = 0;
      state.ghosts.forEach(g => {
        ctx.fillStyle = g.frightened ? '#2121de' : g.color; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI, false); ctx.lineTo(g.x - g.r, g.y); ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.fillStyle = '#fff'; ctx.font = '16px Rajdhani'; ctx.fillText(`Score: ${state.score}`, 10, H - 10);

      if (state.dead) { ctx.fillStyle = '#ff00aa'; ctx.font = '28px Orbitron'; ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 10; ctx.fillText('GAME OVER', W/2-90, H/2); ctx.shadowBlur = 0; }
      requestAnimationFrame(loop);
    };

    const handleKey = (e) => { state.keys[e.key] = e.type === 'keydown'; };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    loop();

    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKey); state.running = false; };
  }, [onScore]);

  return <div className="builtin-game"><canvas ref={canvasRef} width={W} height={H} className="game-canvas" /><div className="game-controls-hint">Arrow Keys to move</div></div>;
}
