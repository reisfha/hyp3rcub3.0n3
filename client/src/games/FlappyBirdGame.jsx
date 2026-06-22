import { useState, useEffect, useRef } from 'react';

const W = 400, H = 500, GRAVITY = 0.5, JUMP = -8, PIPE_W = 50, GAP = 140, SPEED = 3;

export default function FlappyBirdGame({ onScore }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const state = {
      bird: { x: 80, y: H / 2, vy: 0, r: 12 },
      pipes: [],
      score: 0,
      running: false,
      dead: false
    };

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    gameRef.current = state;

    const addPipe = () => {
      const topH = 50 + Math.random() * (H - GAP - 100);
      state.pipes.push({ x: W, top: topH, bottom: topH + GAP, scored: false });
    };

    const jump = () => { if (!state.dead) { state.bird.vy = JUMP; state.running = true; } };

    const loop = () => {
      const b = state.bird;
      if (state.running && !state.dead) {
        b.vy += GRAVITY; b.y += b.vy;
        if (b.y > H || b.y < 0) state.dead = true;
        state.pipes.forEach(p => { p.x -= SPEED; });
        if (state.pipes.length && state.pipes[0].x < -PIPE_W) state.pipes.shift();
        if (state.pipes.length === 0 || state.pipes[state.pipes.length - 1].x < W - 200) addPipe();
        state.pipes.forEach(p => {
          if (!p.scored && p.x + PIPE_W < b.x) { p.scored = true; state.score++; onScore?.(state.score); }
          if (b.x + b.r > p.x && b.x - b.r < p.x + PIPE_W) {
            if (b.y - b.r < p.top || b.y + b.r > p.bottom) state.dead = true;
          }
        });
      }
      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
      state.pipes.forEach(p => {
        ctx.fillStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 8;
        ctx.fillRect(p.x, 0, PIPE_W, p.top);
        ctx.fillRect(p.x, p.bottom, PIPE_W, H - p.bottom);
        ctx.shadowBlur = 0;
      });
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ff00aa'; ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 12;
      ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '20px Orbitron';
      ctx.fillText(state.score, W / 2 - 15, 40);
      if (!state.running && !state.dead) {
        ctx.fillStyle = '#fff'; ctx.font = '16px Rajdhani';
        ctx.fillText('Click/Tap to start', W / 2 - 60, H / 2 + 40);
      }
      if (state.dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ff00aa'; ctx.font = '28px Orbitron'; ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 10;
        ctx.fillText('GAME OVER', W / 2 - 90, H / 2 - 10);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = '16px Rajdhani';
        ctx.fillText('Score: ' + state.score, W / 2 - 30, H / 2 + 30);
        ctx.fillText('Click to restart', W / 2 - 50, H / 2 + 60);
      }
      requestAnimationFrame(loop);
    };

    const handleClick = () => {
      if (state.dead) { window.location.reload(); return; }
      jump();
    };
    const handleKey = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); handleClick(); }
    };

    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey);
    loop();

    return () => { canvas.removeEventListener('click', handleClick); window.removeEventListener('keydown', handleKey); state.running = false; };
  }, [onScore]);

  return (
    <div className="builtin-game">
      <canvas ref={canvasRef} width={W} height={H} className="game-canvas" />
    </div>
  );
}
