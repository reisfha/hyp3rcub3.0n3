import { useState, useEffect, useRef } from 'react';

const W = 400, H = 450;

export default function SpaceInvadersGame({ onScore }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const state = {
      player: { x: W / 2 - 20, y: H - 40, w: 40, h: 20 },
      bullets: [],
      enemies: [],
      enemyDir: 1,
      score: 0,
      keys: {},
      dead: false,
      running: true
    };

    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
      state.enemies.push({ x: c * 45 + 20, y: r * 35 + 30, w: 35, h: 25, alive: true });
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const shoot = () => { state.bullets.push({ x: state.player.x + 18, y: state.player.y, vy: -5 }); };

    const loop = () => {
      if (!state.running) return;
      if (state.keys['ArrowLeft']) state.player.x = Math.max(0, state.player.x - 4);
      if (state.keys['ArrowRight']) state.player.x = Math.min(W - 40, state.player.x + 4);
      if (state.keys[' ']) { state.keys[' '] = false; shoot(); }

      state.bullets.forEach(b => b.y += b.vy);
      state.bullets = state.bullets.filter(b => b.y > 0);

      let hitWall = false;
      state.enemies.forEach(e => {
        if (!e.alive) return;
        e.x += state.enemyDir * 1.5;
        if (e.x <= 0 || e.x + e.w >= W) hitWall = true;
      });
      if (hitWall) {
        state.enemyDir = -state.enemyDir;
        state.enemies.forEach(e => e.y += 10);
      }

      state.bullets.forEach((b, bi) => {
        state.enemies.forEach((e, ei) => {
          if (!e.alive) return;
          if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
            e.alive = false;
            state.bullets.splice(bi, 1);
            state.score += 10;
            onScore?.(state.score);
          }
        });
      });

      state.enemies.forEach(e => {
        if (!e.alive) return;
        if (e.y + e.h >= state.player.y && e.x < state.player.x + state.player.w && e.x + e.w > state.player.x) {
          state.dead = true;
        }
      });

      if (state.enemies.every(e => !e.alive)) state.running = false;

      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 8;
      ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);
      ctx.shadowBlur = 0;
      state.enemies.forEach(e => {
        if (!e.alive) return;
        ctx.fillStyle = '#ff00aa'; ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 6;
        ctx.fillRect(e.x, e.y, e.w, e.h);
      });
      ctx.shadowBlur = 0;
      state.bullets.forEach(b => { ctx.fillStyle = '#ffcc00'; ctx.fillRect(b.x, b.y, 4, 12); });
      ctx.fillStyle = '#fff'; ctx.font = '16px Rajdhani'; ctx.fillText(`Score: ${state.score}`, 10, 20);
      if (state.dead) { ctx.fillStyle = '#ff00aa'; ctx.font = '28px Orbitron'; ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 10; ctx.fillText('GAME OVER', W/2-90, H/2); ctx.shadowBlur = 0; }
      requestAnimationFrame(loop);
    };

    const handleKey = (e) => { state.keys[e.key] = e.type === 'keydown'; if (e.key === ' ' && e.type === 'keydown') e.preventDefault(); };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    loop();

    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKey); state.running = false; };
  }, [onScore]);

  return <div className="builtin-game"><canvas ref={canvasRef} width={W} height={H} className="game-canvas" /><div className="game-controls-hint">← → move, Space shoot</div></div>;
}
