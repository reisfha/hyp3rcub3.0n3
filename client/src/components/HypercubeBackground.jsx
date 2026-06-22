import { useRef, useEffect } from 'react';

const V16 = [
  [-1,-1,-1,-1],[ 1,-1,-1,-1],[-1, 1,-1,-1],[ 1, 1,-1,-1],
  [-1,-1, 1,-1],[ 1,-1, 1,-1],[-1, 1, 1,-1],[ 1, 1, 1,-1],
  [-1,-1,-1, 1],[ 1,-1,-1, 1],[-1, 1,-1, 1],[ 1, 1,-1, 1],
  [-1,-1, 1, 1],[ 1,-1, 1, 1],[-1, 1, 1, 1],[ 1, 1, 1, 1],
];

const EDGES = [];
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    let diff = 0;
    for (let k = 0; k < 4; k++) {
      if (V16[i][k] !== V16[j][k]) diff++;
    }
    if (diff === 1) EDGES.push([i, j]);
  }
}

function rot4D(p, angle, plane) {
  const [a, b] = plane;
  const c = Math.cos(angle), s = Math.sin(angle);
  const v = [...p];
  const x = v[a] * c - v[b] * s;
  const y = v[a] * s + v[b] * c;
  v[a] = x;
  v[b] = y;
  return v;
}

function project4to3(p, d) {
  const w = p[3];
  const factor = d / (d + w);
  return [p[0] * factor, p[1] * factor, p[2] * factor];
}

function project3to2(p, fov) {
  const z = p[2] + 4;
  const factor = fov / z;
  return [p[0] * factor, p[1] * factor];
}

export default function HypercubeBackground({ color = '#00f0ff', opacity = 0.15, lineWidth = 1.5 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) * 0.08;

      t += 0.005;

      const projected = V16.map(v => {
        let p = rot4D(v, t, [0, 3]);
        p = rot4D(p, t * 0.7, [1, 3]);
        p = rot4D(p, t * 0.3, [2, 3]);
        const p3 = project4to3(p, 2.5);
        const p2 = project3to2(p3, 2.5);
        return { x: p2[0] * scale + cx, y: p2[1] * scale + cy, z: p3[2] };
      });

      const sortedEdges = EDGES.map(([i, j]) => ({
        i, j, z: (projected[i].z + projected[j].z) / 2
      })).sort((a, b) => a.z - b.z);

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      for (const e of sortedEdges) {
        const pi = projected[e.i];
        const pj = projected[e.j];

        const depthFactor = Math.max(0, Math.min(1, (e.z + 2) / 4));
        ctx.globalAlpha = opacity * (0.3 + 0.7 * depthFactor);

        ctx.beginPath();
        ctx.moveTo(pi.x, pi.y);
        ctx.lineTo(pj.x, pj.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [color, opacity, lineWidth]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
