import { useState, useEffect, useRef } from 'react';

const W = 500, H = 500;

export default function AsteroidsGame({ onScore }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const state = {
      ship: { x: W/2, y: H/2, angle: 0, vx: 0, vy: 0, r: 15 },
      bullets: [],
      asteroids: [],
      score: 0,
      dead: false,
      keys: {},
      running: true
    };

    for (let i = 0; i < 5; i++) {
      const a = { x: Math.random() * W, y: Math.random() * H, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2, r: 20 + Math.random() * 20 };
      if (Math.hypot(a.x - state.ship.x, a.y - state.ship.y) < 100) continue;
      state.asteroids.push(a);
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const shoot = () => {
      if (state.dead) return;
      state.bullets.push({
        x: state.ship.x, y: state.ship.y,
        vx: Math.cos(state.ship.angle) * 6,
        vy: Math.sin(state.ship.angle) * 6,
        life: 60
      });
    };

    const wrap = (v, max) => ((v % max) + max) % max;

    const loop = () => {
      const s = state.ship;
      if (state.keys['ArrowLeft']) s.angle -= 0.05;
      if (state.keys['ArrowRight']) s.angle += 0.05;
      if (state.keys['ArrowUp']) { s.vx += Math.cos(s.angle) * 0.2; s.vy += Math.sin(s.angle) * 0.2; }
      s.x = wrap(s.x + s.vx, W); s.y = wrap(s.y + s.vy, H);
      s.vx *= 0.99; s.vy *= 0.99;

      state.bullets.forEach(b => { b.x = wrap(b.x + b.vx, W); b.y = wrap(b.y + b.vy, H); b.life--; });
      state.bullets = state.bullets.filter(b => b.life > 0);

      state.asteroids.forEach(a => { a.x = wrap(a.x + a.vx, W); a.y = wrap(a.y + a.vy, H); });

      state.bullets.forEach((b, bi) => {
        state.asteroids.forEach((a, ai) => {
          if (Math.hypot(b.x - a.x, b.y - a.y) < a.r + 3) {
            state.bullets.splice(bi, 1);
            state.asteroids.splice(ai, 1);
            state.score += 100;
            onScore?.(state.score);
            if (a.r > 20) {
              for (let i = 0; i < 2; i++) {
                state.asteroids.push({
                  x: a.x, y: a.y,
                  vx: (Math.random() - 0.5) * 3,
                  vy: (Math.random() - 0.5) * 3,
                  r: a.r / 2
                });
              }
            }
          }
        });
      });

      state.asteroids.forEach(a => {
        if (Math.hypot(s.x - a.x, s.y - a.y) < s.r + a.r) {
          state.dead = true;
        }
      });

      if (state.asteroids.length === 0 && !state.dead) {
        for (let i = 0; i < 5; i++) {
          state.asteroids.push({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            r: 20 + Math.random() * 20
          });
        }
      }

      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x + Math.cos(s.angle) * s.r, s.y + Math.sin(s.angle) * s.r);
      ctx.lineTo(s.x + Math.cos(s.angle + 2.5) * s.r, s.y + Math.sin(s.angle + 2.5) * s.r);
      ctx.lineTo(s.x + Math.cos(s.angle - 2.5) * s.r, s.y + Math.sin(s.angle - 2.5) * s.r);
      ctx.closePath(); ctx.stroke();
      ctx.shadowBlur = 0;

      state.bullets.forEach(b => { ctx.fillStyle = '#ff00aa'; ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 4; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill(); });
      ctx.shadowBlur = 0;
      state.asteroids.forEach(a => { ctx.strokeStyle = '#ff6600'; ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 4; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI*2); ctx.stroke(); });
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '16px Rajdhani'; ctx.fillText(`Score: ${state.score}`, 10, 25);
      if (state.dead) { ctx.fillStyle = '#ff00aa'; ctx.font = '28px Orbitron'; ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 10; ctx.fillText('GAME OVER', W/2-90, H/2); ctx.shadowBlur = 0; }
      requestAnimationFrame(loop);
    };

    const handleKey = (e) => {
      state.keys[e.key] = e.type === 'keydown';
      if (e.key === ' ' && e.type === 'keydown') { e.preventDefault(); shoot(); }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', (e) => { state.keys[e.key] = false; });
    loop();

    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKey); };
  }, [onScore]);

  return <div className="builtin-game"><canvas ref={canvasRef} width={W} height={H} className="game-canvas" /><div className="game-controls-hint">←→ rotate, ↑ thrust, Space shoot</div></div>;
}
