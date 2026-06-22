import { useState, useEffect, useRef } from 'react';

const W = 600, H = 200, GROUND = 170, DINO_SIZE = 30, OBSTACLE_W = 16, OBSTACLE_H = 30;

export default function DinoGame({ onScore }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const state = {
      dino: { x: 60, y: GROUND - DINO_SIZE, vy: 0, w: DINO_SIZE, h: DINO_SIZE },
      obstacles: [],
      score: 0,
      jumping: false,
      dead: false,
      running: false
    };

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const jump = () => { if (!state.dead && !state.jumping) { state.dino.vy = -10; state.jumping = true; state.running = true; } };

    const loop = () => {
      const d = state.dino;
      if (state.running && !state.dead) {
        d.vy += 0.6; d.y += d.vy;
        if (d.y >= GROUND - DINO_SIZE) { d.y = GROUND - DINO_SIZE; d.vy = 0; state.jumping = false; }
        state.obstacles.forEach(o => o.x -= 4);
        if (state.obstacles.length && state.obstacles[0].x < -OBSTACLE_W) state.obstacles.shift();
        if (state.obstacles.length === 0 || state.obstacles[state.obstacles.length - 1].x < W - 300 + Math.random() * 200) {
          state.obstacles.push({ x: W, w: OBSTACLE_W, h: OBSTACLE_H + Math.random() * 20 });
        }
        state.obstacles.forEach(o => {
          if (d.x < o.x + o.w && d.x + d.w > o.x && d.y < GROUND && d.y + d.h > GROUND - o.h) state.dead = true;
        });
        state.score++;
        onScore?.(Math.floor(state.score / 10));
      }
      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 4;
      ctx.fillRect(0, GROUND, W, 2);
      ctx.fillStyle = '#00f0ff'; ctx.shadowBlur = 8;
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.shadowBlur = 0;
      state.obstacles.forEach(o => {
        ctx.fillStyle = '#ff00aa'; ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 6;
        ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);
      });
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '14px Rajdhani';
      ctx.fillText(`Score: ${Math.floor(state.score / 10)}`, W - 100, 30);
      if (!state.running && !state.dead) { ctx.fillText('Press Space/Click to start', W / 2 - 80, 40); }
      requestAnimationFrame(loop);
    };

    const handleKey = (e) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } };
    const handleClick = () => jump();
    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', handleClick);
    loop();
    return () => { window.removeEventListener('keydown', handleKey); canvas.removeEventListener('click', handleClick); };
  }, [onScore]);

  return <div className="builtin-game"><canvas ref={canvasRef} width={W} height={H} className="game-canvas" /></div>;
}
