import { useState, useEffect, useRef } from 'react';

const W = 480, H = 360, PADDLE_W = 80, PADDLE_H = 12, BALL_R = 6;
const BRICK_ROWS = 5, BRICK_COLS = 8, BRICK_W = 52, BRICK_H = 18, BRICK_GAP = 4;

export default function BreakoutGame({ onScore }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const state = {
      paddle: { x: W / 2 - PADDLE_W / 2, y: H - 30 },
      ball: { x: W / 2, y: H - 45, dx: 3, dy: -3, r: BALL_R },
      bricks: [],
      score: 0,
      running: false,
      dead: false,
      keys: {}
    };

    for (let r = 0; r < BRICK_ROWS; r++) for (let c = 0; c < BRICK_COLS; c++) {
      state.bricks.push({ x: c * (BRICK_W + BRICK_GAP) + 20, y: r * (BRICK_H + BRICK_GAP) + 30, w: BRICK_W, h: BRICK_H, alive: true });
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    gameRef.current = state;

    const loop = () => {
      if (!state.running || state.dead) { if (state.dead) draw(); return; }
      const p = state.paddle;
      if (state.keys['ArrowLeft'] || state.keys['a']) p.x = Math.max(0, p.x - 5);
      if (state.keys['ArrowRight'] || state.keys['d']) p.x = Math.min(W - PADDLE_W, p.x + 5);
      const b = state.ball;
      b.x += b.dx; b.y += b.dy;
      if (b.x - b.r < 0 || b.x + b.r > W) b.dx = -b.dx;
      if (b.y - b.r < 0) b.dy = -b.dy;
      if (b.y + b.r > H) { state.dead = true; draw(); return; }
      if (b.y + b.r > p.y && b.y - b.r < p.y + PADDLE_H && b.x > p.x && b.x < p.x + PADDLE_W) {
        b.dy = -Math.abs(b.dy);
        const hit = (b.x - p.x - PADDLE_W / 2) / (PADDLE_W / 2);
        b.dx = hit * 4;
      }
      state.bricks.forEach(brick => {
        if (!brick.alive) return;
        if (b.x + b.r > brick.x && b.x - b.r < brick.x + brick.w && b.y + b.r > brick.y && b.y - b.r < brick.y + brick.h) {
          brick.alive = false;
          b.dy = -b.dy;
          state.score += 10;
          onScore?.(state.score);
        }
      });
      draw();
      requestAnimationFrame(loop);
    };

    const draw = () => {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 8;
      ctx.fillRect(state.paddle.x, state.paddle.y, PADDLE_W, PADDLE_H);
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#ff00aa'; ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 8;
      ctx.fill(); ctx.shadowBlur = 0;
      state.bricks.forEach(brick => {
        if (!brick.alive) return;
        ctx.fillStyle = ['#ff0055','#ff3377','#ff00aa','#00f0ff','#00ccdd'][Math.floor(brick.y / 60) % 5];
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 4;
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      });
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '14px Rajdhani';
      ctx.fillText(`Score: ${state.score}`, 10, H - 8);
    };

    const handleKey = (e) => {
      state.keys[e.key] = e.type === 'keydown';
      if (e.type === 'keydown' && !state.running) { state.running = true; loop(); }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', (e) => { state.keys[e.key] = false; });

    draw();

    return () => { window.removeEventListener('keydown', handleKey); state.running = false; };
  }, [onScore]);

  const restart = () => { window.location.reload(); };

  return (
    <div className="builtin-game">
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas" />
      <div className="game-controls-hint">A/D or Arrow Keys to move. Press any key to start.</div>
    </div>
  );
}
