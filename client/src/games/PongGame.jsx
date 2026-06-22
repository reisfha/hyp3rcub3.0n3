import { useState, useEffect, useRef } from 'react';

const W = 600, H = 400, PADDLE_H = 80, PADDLE_W = 10, BALL_R = 6;

export default function PongGame({ onScore }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const state = {
      left: { y: H / 2 - PADDLE_H / 2 }, right: { y: H / 2 - PADDLE_H / 2 },
      ball: { x: W / 2, y: H / 2, dx: 4, dy: 3 },
      score: { left: 0, right: 0 },
      running: true, dead: false
    };

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      const keys = state.keys || {};
      if (keys['w']) state.left.y = Math.max(0, state.left.y - 5);
      if (keys['s']) state.left.y = Math.min(H - PADDLE_H, state.left.y + 5);
      if (keys['ArrowUp']) state.right.y = Math.max(0, state.right.y - 5);
      if (keys['ArrowDown']) state.right.y = Math.min(H - PADDLE_H, state.right.y + 5);

      const b = state.ball;
      b.x += b.dx; b.y += b.dy;
      if (b.y - BALL_R < 0 || b.y + BALL_R > H) b.dy = -b.dy;

      if (b.x - BALL_R < PADDLE_W && b.y > state.left.y && b.y < state.left.y + PADDLE_H) { b.dx = Math.abs(b.dx); }
      if (b.x + BALL_R > W - PADDLE_W && b.y > state.right.y && b.y < state.right.y + PADDLE_H) { b.dx = -Math.abs(b.dx); }

      if (b.x < 0) { state.score.right++; state.ball = { x: W/2, y: H/2, dx: -4, dy: 3 }; onScore?.(state.score.right); }
      if (b.x > W) { state.score.left++; state.ball = { x: W/2, y: H/2, dx: 4, dy: 3 }; onScore?.(state.score.left); }

      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 8;
      ctx.fillRect(0, state.left.y, PADDLE_W, PADDLE_H);
      ctx.fillRect(W - PADDLE_W, state.right.y, PADDLE_W, PADDLE_H);
      ctx.shadowBlur = 0;
      ctx.setLineDash([5, 5]); ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI*2);
      ctx.fillStyle = '#ff00aa'; ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '24px Orbitron';
      ctx.fillText(`${state.score.left}  ${state.score.right}`, W/2 - 40, 30);

      requestAnimationFrame(loop);
    };

    const handleKey = (e) => { if (!state.keys) state.keys = {}; state.keys[e.key] = e.type === 'keydown'; };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    loop();
    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKey); };
  }, [onScore]);

  return <div className="builtin-game"><canvas ref={canvasRef} width={W} height={H} className="game-canvas" /><div className="game-controls-hint">Player 1: W/S | Player 2: ↑/↓</div></div>;
}
