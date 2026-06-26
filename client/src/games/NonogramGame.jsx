import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const PATTERNS = [
  { rows: [
    '.##.##.',
    '#######',
    '.#####.',
    '..###..',
    '...#...',
  ]},
  { rows: [
    '.###.',
    '#...#',
    '#.#.#',
    '#...#',
    '.###.',
  ]},
  { rows: [
    '..#..',
    '..#..',
    '#####',
    '..#..',
    '..#..',
  ]},
  { rows: [
    '..#..',
    '.###.',
    '#####',
    '.###.',
    '..#..',
  ]},
  { rows: [
    '..###..',
    '.#...#.',
    '#.#.#.#',
    '#.....#',
    '#.###.#',
    '.#...#.',
  ]},
  { rows: [
    '..#..',
    '.###.',
    '#####',
    '..#..',
    '..#..',
    '..#..',
  ]},
  { rows: [
    '..#####..',
    '.##...##.',
    '##.....##',
    '##.......',
    '##.......',
    '##.....##',
    '.##...##.',
    '..#####..',
  ]},
  { rows: [
    '...###...',
    '..#####..',
    '.##...##.',
    '##.#.#.##',
    '##.....##',
    '##.#.#.##',
    '.##...##.',
    '..#####..',
    '...###...',
  ]},
  { rows: [
    '.##.##.',
    '#######',
    '##...##',
    '#.#.#.#',
    '#.....#',
    '.#####.',
  ]},
];

function parsePattern(p) {
  return { h: p.rows.length, w: p.rows[0].length, data: p.rows.map(r => [...r].map(ch => ch === '#' ? 1 : 0)) };
}

function generateGrid(size) {
  const pool = PATTERNS.map(parsePattern).filter(p => p.h <= size && p.w <= size);
  const pat = pool[Math.random() * pool.length | 0];
  const g = Array.from({ length: size }, () => Array(size).fill(0));
  const ro = (size - pat.h) >> 1, co = (size - pat.w) >> 1;
  for (let r = 0; r < pat.h; r++)
    for (let c = 0; c < pat.w; c++)
      g[ro + r][co + c] = pat.data[r][c];

  const noiseD = size <= 8 ? 0.12 : size <= 14 ? 0.10 : 0.08;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (g[r][c] === 0 && Math.random() < noiseD) g[r][c] = 1;

  for (let r = 0; r < size; r++) {
    const f = g[r].filter(v => v).length;
    if (f === 0) g[r][Math.random() * size | 0] = 1;
    if (f === size) g[r][Math.random() * size | 0] = 0;
  }
  for (let c = 0; c < size; c++) {
    let f = 0;
    for (let r = 0; r < size; r++) f += g[r][c];
    if (f === 0) g[Math.random() * size | 0][c] = 1;
    if (f === size) g[Math.random() * size | 0][c] = 0;
  }

  function clueGroups(arr) {
    const groups = []; let i = 0; const n = arr.length;
    while (i < n) { while (i < n && !arr[i]) i++; if (i >= n) break; const s = i; while (i < n && arr[i]) i++; groups.push([s, i]); }
    return groups;
  }
  function gapsBetween(groups) {
    const gaps = [];
    for (let i = 1; i < groups.length; i++) gaps.push([groups[i - 1][1], groups[i][0]]);
    return gaps;
  }
  for (let iter = 0; iter < 2; iter++) {
    for (let r = 0; r < size; r++) {
      const groups = clueGroups(g[r]);
      if (groups.length >= 4) {
        const gaps = gapsBetween(groups);
        if (gaps.length) { const [lo, hi] = gaps[Math.random() * gaps.length | 0]; for (let c = lo; c < hi; c++) g[r][c] = 1; }
      }
    }
    for (let c = 0; c < size; c++) {
      const col = g.map(row => row[c]);
      const groups = clueGroups(col);
      if (groups.length >= 4) {
        const gaps = gapsBetween(groups);
        if (gaps.length) { const [lo, hi] = gaps[Math.random() * gaps.length | 0]; for (let r = lo; r < hi; r++) g[r][c] = 1; }
      }
    }
  }
  return { grid: g };
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
  const [solution, setSolution] = useState(() => generateGrid(10).grid);
  const [grid, setGrid] = useState(() => initGrid(10));
  const [won, setWon] = useState(false);
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const solutionRef = useRef(solution);

  const { rowClues, colClues } = useMemo(() => getClues(solution), [solution]);
  const maxRowLen = Math.max(...rowClues.map(c => c.length), 1);
  const maxColLen = Math.max(...colClues.map(c => c.length), 1);

  const rowDone = useMemo(() => {
    const sol = solutionRef.current;
    return grid.map((row, r) => row.every((cell, c) =>
      sol[r][c] === 1 ? cell === 1 : cell !== 1
    ));
  }, [grid]);
  const colDone = useMemo(() => {
    const sol = solutionRef.current;
    return Array.from({ length: size }, (_, c) =>
      grid.every((row, r) =>
        sol[r][c] === 1 ? row[c] === 1 : row[c] !== 1
      )
    );
  }, [grid, size]);

  useEffect(() => {
    if (won) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [won, size, solution]);

  useEffect(() => {
    if (won) {
      setTimeout(() => alert(`Puzzle Complete!\nTime: ${fmt(elapsed)}`), 50);
    }
  }, [won, elapsed]);

  const newPuzzle = useCallback((s) => {
    const { grid: sol } = generateGrid(s);
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

  const [vp, setVp] = useState(() => Math.min(window.innerWidth - 80, window.innerHeight - 120, 800));
  useEffect(() => {
    const onResize = () => setVp(Math.min(window.innerWidth - 80, window.innerHeight - 120, 800));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const cellSize = Math.max(18, Math.min(50, Math.floor(vp / (size + 1))));
  const clueCellW = size <= 15 ? Math.max(16, Math.floor(cellSize * 0.6)) : Math.max(12, Math.floor(cellSize * 0.45));
  const clueCellH = size <= 15 ? Math.max(14, Math.floor(cellSize * 0.55)) : Math.max(10, Math.floor(cellSize * 0.4));
  const clueFont = Math.max(8, clueCellH - 4);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const filled = grid.flat().filter(c => c === 1).length;

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 12, userSelect: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: '#aaa' }}>Size:</span>
        <input type="range" min="5" max="25" value={size}
          onChange={e => handleSizeChange(Number(e.target.value))}
          style={{ width: 100, accentColor: '#3388ee' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#eee', minWidth: 50 }}>{size}×{size}</span>
        <button className="btn-primary" style={{ padding: '2px 10px', fontSize: 12 }}
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
                color: colDone[ci] ? '#4caf50' : v === 0 ? '#444' : '#6af',
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
                color: rowDone[ri] ? '#4caf50' : v === 0 ? '#444' : '#6af',
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
    </div>
  );
}
