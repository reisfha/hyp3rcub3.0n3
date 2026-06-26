import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

function clueCount(arr) {
  let c = 0, inRun = false;
  for (const v of arr) { if (v && !inRun) { c++; inRun = true; } else if (!v) inRun = false; }
  return c;
}

function squeeze(arr, max) {
  while (clueCount(arr) > max) {
    let best = -1, bestLen = Infinity, inGap = false, start = 0;
    for (let i = 0; i <= arr.length; i++) {
      if (i < arr.length && !arr[i] && i > 0 && arr[i - 1] && !inGap) { inGap = true; start = i; }
      else if ((i === arr.length || arr[i]) && inGap && i < arr.length && arr[i]) {
        const len = i - start;
        if (len < bestLen) { bestLen = len; best = start; }
        inGap = false;
      }
    }
    if (best < 0) break;
    for (let i = best; i < best + bestLen; i++) arr[i] = 1;
  }
}

function generateGrid(size) {
  const d = size <= 5 ? 0.4 : size <= 10 ? 0.35 : size <= 15 ? 0.3 : size <= 20 ? 0.28 : 0.25;
  const maxC = size <= 10 ? 3 : 99;
  const g = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      g[r][c] = Math.random() < d ? 1 : 0;
  for (let r = 0; r < size; r++) {
    const f = g[r].filter(v => v).length;
    if (!f) g[r][Math.random() * size | 0] = 1;
    if (f === size) g[r][Math.random() * size | 0] = 0;
  }
  for (let c = 0; c < size; c++) {
    let f = 0;
    for (let r = 0; r < size; r++) f += g[r][c];
    if (!f) g[Math.random() * size | 0][c] = 1;
    if (f === size) g[Math.random() * size | 0][c] = 0;
  }
  if (maxC < 99) {
    for (let r = 0; r < size; r++) squeeze(g[r], maxC);
    for (let c = 0; c < size; c++) {
      const col = g.map(row => row[c]);
      squeeze(col, maxC);
      for (let r = 0; r < size; r++) g[r][c] = col[r];
    }
  }
  return g;
}

function getClues(solution) {
  const size = solution.length;
  const rowClues = solution.map(row => {
    const c = []; let n = 0;
    for (const v of row) { if (v) n++; else if (n) { c.push(n); n = 0; } }
    if (n) c.push(n);
    return c.length ? c : [0];
  });
  const colClues = [];
  for (let c = 0; c < size; c++) {
    const clue = []; let n = 0;
    for (let r = 0; r < size; r++) { if (solution[r][c]) n++; else if (n) { clue.push(n); n = 0; } }
    if (n) clue.push(n);
    colClues.push(clue.length ? clue : [0]);
  }
  return { rowClues, colClues };
}

function initGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

export default function NonogramGame({ onScore }) {
  const [size, setSize] = useState(10);
  const [solution, setSolution] = useState(() => generateGrid(10));
  const [grid, setGrid] = useState(() => initGrid(10));
  const [won, setWon] = useState(false);
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const solutionRef = useRef(solution);

  const { rowClues, colClues } = useMemo(() => getClues(solution), [solution]);
  const maxRowLen = Math.max(...rowClues.map(c => c.length), 1);
  const maxColLen = Math.max(...colClues.map(c => c.length), 1);

  useEffect(() => {
    if (won) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [won, size, solution]);

  const newPuzzle = useCallback((s) => {
    const sol = generateGrid(s);
    solutionRef.current = sol;
    setSolution(sol);
    setGrid(initGrid(s));
    setWon(false);
    startRef.current = Date.now();
    setElapsed(0);
  }, []);

  const handleSizeChange = (s) => {
    setSize(s);
    newPuzzle(s);
  };

  const checkWin = useCallback((g) => {
    const sol = solutionRef.current;
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) {
        if (sol[r][c] === 1 && g[r][c] !== 1) return false;
        if (sol[r][c] === 0 && g[r][c] === 1) return false;
      }
    return true;
  }, [size]);

  const handleCellClick = (r, c) => {
    if (won) return;
    setGrid(prev => {
      const next = prev[r][c] === 1 ? 0 : 1;
      const g = prev.map(row => [...row]);
      g[r][c] = next;
      if (checkWin(g)) {
        setWon(true);
        const t = Math.floor((Date.now() - startRef.current) / 1000);
        setElapsed(t);
        onScore?.(Math.max(100, Math.floor(5000 / t)));
      }
      return g;
    });
  };

  const handleRightClick = (e, r, c) => {
    e.preventDefault();
    if (won) return;
    setGrid(prev => {
      const next = prev[r][c] === -1 ? 0 : -1;
      const g = prev.map(row => [...row]);
      g[r][c] = next;
      return g;
    });
  };

  const cellSize = Math.max(16, Math.min(40, Math.floor(340 / size)));
  const clueCellW = size <= 12 ? 22 : size <= 18 ? 17 : 13;
  const clueCellH = size <= 12 ? 20 : size <= 18 ? 15 : 12;
  const clueFont = size <= 12 ? 12 : size <= 18 ? 10 : 8;

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const filled = grid.flat().filter(c => c === 1).length;

  const sizePresets = [5, 10, 15, 20, 25];

  return (
    <div className="builtin-game" style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#aaa' }}>Size:</span>
        {sizePresets.map(s => (
          <button key={s}
            onClick={() => handleSizeChange(s)}
            className="btn-primary"
            style={{
              padding: '2px 8px', fontSize: 12,
              background: s === size ? '#3388ee' : undefined
            }}
          >{s}×{s}</button>
        ))}
        <button className="btn-primary" style={{ padding: '2px 10px', fontSize: 12, marginLeft: 4 }}
          onClick={() => newPuzzle(size)}>🎲 New</button>
        <button className="btn-primary" style={{ padding: '2px 10px', fontSize: 12 }}
          onClick={() => {
            setGrid(initGrid(size));
            setWon(false);
            startRef.current = Date.now();
            setElapsed(0);
          }}>↺ Reset</button>
      </div>

      <div style={{
        display: 'inline-grid',
        gridTemplateColumns: `${maxRowLen * clueCellW}px repeat(${size}, ${cellSize}px)`,
        gridTemplateRows: `${maxColLen * clueCellH}px repeat(${size}, ${cellSize}px)`,
        border: '2px solid #555',
        borderRadius: 4,
        overflow: 'hidden',
        background: '#0d0d20',
      }}>
        <div style={{ gridRow: 1, gridColumn: 1, background: '#12122a' }} />

        {colClues.map((clue, ci) => (
          <div key={`cc-${ci}`} style={{
            gridRow: 1, gridColumn: ci + 2,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            background: '#12122a',
            borderRight: '1px solid #2a2a4a', borderBottom: '1px solid #2a2a4a',
          }}>
            {Array.from({ length: maxColLen - clue.length }).map((_, i) => (
              <div key={`e-${i}`} style={{ height: clueCellH }} />
            ))}
            {clue.map((v, i) => (
              <div key={i} style={{
                height: clueCellH, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: v === 0 ? clueFont - 2 : clueFont, fontWeight: 700,
                color: v === 0 ? '#444' : '#6af',
                lineHeight: 1,
              }}>{v}</div>
            ))}
          </div>
        ))}

        {rowClues.map((clue, ri) => (
          <div key={`rc-${ri}`} style={{
            gridRow: ri + 2, gridColumn: 1,
            display: 'flex', flexDirection: 'row', justifyContent: 'flex-end',
            background: '#12122a',
            borderRight: '1px solid #2a2a4a', borderBottom: '1px solid #2a2a4a',
          }}>
            {Array.from({ length: maxRowLen - clue.length }).map((_, i) => (
              <div key={`e-${i}`} style={{ width: clueCellW }} />
            ))}
            {clue.map((v, i) => (
              <div key={i} style={{
                width: clueCellW, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: v === 0 ? clueFont - 2 : clueFont, fontWeight: 700,
                color: v === 0 ? '#444' : '#6af',
                lineHeight: 1,
              }}>{v}</div>
            ))}
          </div>
        ))}

        {grid.map((row, ri) => row.map((cell, ci) => {
          let bg = '#0d0d20';
          if (cell === 1) bg = '#3388ee';
          return (
            <div key={`g-${ri}-${ci}`}
              onClick={() => handleCellClick(ri, ci)}
              onContextMenu={(e) => handleRightClick(e, ri, ci)}
              style={{
                gridRow: ri + 2, gridColumn: ci + 2,
                width: cellSize, height: cellSize,
                borderRight: '1px solid #1e1e3a',
                borderBottom: '1px solid #1e1e3a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bg,
                cursor: 'pointer',
                transition: 'background 0.1s',
                fontSize: Math.max(8, cellSize - 6),
                color: '#ff5555',
                lineHeight: 1,
              }}
            >
              {cell === -1 && '✕'}
            </div>
          );
        }))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: '#aaa' }}>
        <span>⏱ {fmt(elapsed)}</span>
        <span>■ {filled}/{size * size}</span>
      </div>

      <div className="game-controls-hint">Left click to fill  ·  Right click to mark ✕</div>

      {won && (
        <div className="game-overlay">
          <h2>Puzzle Complete!</h2>
          <p>Time: {fmt(elapsed)}</p>
          <button className="btn-primary" onClick={() => newPuzzle(size)}>
            New Puzzle 🎲
          </button>
        </div>
      )}
    </div>
  );
}
