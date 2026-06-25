import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const PUZZLES = [
  {
    name: 'Heart', size: 5,
    solution: [
      [0,1,0,1,0],
      [1,1,1,1,1],
      [1,1,1,1,1],
      [0,1,1,1,0],
      [0,0,1,0,0],
    ],
  },
  {
    name: 'Arrow', size: 5,
    solution: [
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
  },
  {
    name: 'Cross', size: 5,
    solution: [
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,0,1,0,0],
      [0,1,0,1,0],
      [1,0,0,0,1],
    ],
  },
  {
    name: 'Smiley', size: 10,
    solution: [
      [0,1,1,1,1,1,1,1,1,0],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,0,0,0,1,0,1],
      [1,0,0,1,0,0,1,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,0,0,0,1,0,1],
      [1,0,0,1,1,1,1,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [0,1,1,1,1,1,1,1,1,0],
    ],
  },
  {
    name: 'Plus', size: 10,
    solution: [
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0],
    ],
  },
  {
    name: 'Diamond', size: 10,
    solution: [
      [0,0,0,0,0,0,0,0,1,0],
      [0,0,0,0,0,0,0,1,1,1],
      [0,0,0,0,0,0,1,1,1,1],
      [0,0,0,0,0,1,1,1,1,1],
      [0,0,0,0,1,1,1,1,1,1],
      [0,0,0,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,0,0,0,0],
      [1,1,1,1,1,0,0,0,0,0],
      [1,1,1,1,0,0,0,0,0,0],
    ],
  },
];

function getRowClues(solution) {
  return solution.map(row => {
    const clues = [];
    let count = 0;
    for (const cell of row) {
      if (cell) { count++; }
      else if (count > 0) { clues.push(count); count = 0; }
    }
    if (count > 0) clues.push(count);
    return clues.length ? clues : [0];
  });
}

function getColClues(solution) {
  const size = solution.length;
  const clues = [];
  for (let c = 0; c < size; c++) {
    const clue = [];
    let count = 0;
    for (let r = 0; r < size; r++) {
      if (solution[r][c]) { count++; }
      else if (count > 0) { clue.push(count); count = 0; }
    }
    if (count > 0) clue.push(count);
    clues.push(clue.length ? clue : [0]);
  }
  return clues;
}

function initGrid(size) {
  return Array(size).fill(null).map(() => Array(size).fill(0));
}

export default function NonogramGame({ onScore }) {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [grid, setGrid] = useState(() => initGrid(PUZZLES[0].solution.length));
  const [won, setWon] = useState(false);
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const puzzle = PUZZLES[puzzleIdx];
  const size = puzzle.solution.length;
  const rowClues = useMemo(() => getRowClues(puzzle.solution), [puzzle]);
  const colClues = useMemo(() => getColClues(puzzle.solution), [puzzle]);
  const maxRowClueLen = Math.max(...rowClues.map(c => c.length), 1);
  const maxColClueLen = Math.max(...colClues.map(c => c.length), 1);

  useEffect(() => {
    if (won) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [won, puzzleIdx]);

  useEffect(() => {
    setGrid(initGrid(size));
    setWon(false);
    startRef.current = Date.now();
    setElapsed(0);
  }, [puzzleIdx]);

  const checkWin = useCallback((g) => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const p = g[r][c];
        const s = puzzle.solution[r][c];
        if (s === 1 && p !== 1) return false;
        if (s === 0 && p === 1) return false;
      }
    }
    return true;
  }, [puzzle, size]);

  const handleCellClick = (r, c) => {
    if (won) return;
    setGrid(prev => {
      const cur = prev[r][c];
      const next = (cur === 1) ? 0 : 1;
      const g = prev.map(row => [...row]);
      g[r][c] = next;
      if (checkWin(g)) {
        setWon(true);
        const t = Math.floor((Date.now() - startRef.current) / 1000);
        setElapsed(t);
        onScore?.(Math.max(100, Math.floor(5000 / t)));
        return g;
      }
      return g;
    });
  };

  const handleRightClick = (e, r, c) => {
    e.preventDefault();
    if (won) return;
    setGrid(prev => {
      const cur = prev[r][c];
      const next = cur === -1 ? 0 : -1;
      const g = prev.map(row => [...row]);
      g[r][c] = next;
      return g;
    });
  };

  const onReset = () => {
    setGrid(initGrid(size));
    setWon(false);
    startRef.current = Date.now();
    setElapsed(0);
  };

  const cellSize = size <= 6 ? 38 : 28;
  const clueCellW = 22;
  const clueCellH = 20;

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const filled = grid.flat().filter(c => c === 1).length;

  return (
    <div className="builtin-game" style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#eee' }}>{puzzle.name}</span>
        <span style={{ color: '#777', fontSize: 12 }}>{puzzleIdx + 1}/{PUZZLES.length}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <button className="btn-primary" style={{ padding: '3px 10px', fontSize: 12 }}
          onClick={() => setPuzzleIdx(i => Math.max(0, i - 1))} disabled={puzzleIdx === 0}>◀ Prev</button>
        <button className="btn-primary" style={{ padding: '3px 10px', fontSize: 12 }}
          onClick={() => setPuzzleIdx(i => Math.min(PUZZLES.length - 1, i + 1))} disabled={puzzleIdx === PUZZLES.length - 1}>Next ▶</button>
        <button className="btn-primary" style={{ padding: '3px 10px', fontSize: 12 }} onClick={onReset}>↺ Reset</button>
      </div>

      <div style={{
        display: 'inline-grid',
        gridTemplateColumns: `${maxRowClueLen * clueCellW}px repeat(${size}, ${cellSize}px)`,
        gridTemplateRows: `${maxColClueLen * clueCellH}px repeat(${size}, ${cellSize}px)`,
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
            {Array.from({ length: maxColClueLen - clue.length }).map((_, i) => (
              <div key={`e-${i}`} style={{ height: clueCellH }} />
            ))}
            {clue.map((v, i) => (
              <div key={i} style={{
                height: clueCellH, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: v === 0 ? 10 : 12, fontWeight: 700, color: v === 0 ? '#444' : '#6af',
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
            {Array.from({ length: maxRowClueLen - clue.length }).map((_, i) => (
              <div key={`e-${i}`} style={{ width: clueCellW }} />
            ))}
            {clue.map((v, i) => (
              <div key={i} style={{
                width: clueCellW, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: v === 0 ? 10 : 12, fontWeight: 700, color: v === 0 ? '#444' : '#6af',
              }}>{v}</div>
            ))}
          </div>
        ))}

        {grid.map((row, ri) => row.map((cell, ci) => {
          let bg = '#0d0d20';
          if (cell === 1) bg = '#3388ee';
          if (cell === -1) bg = '#0d0d20';

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
                fontSize: cellSize >= 30 ? 16 : 12,
                color: '#ff5555',
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
          <button className="btn-primary" onClick={() => {
            if (puzzleIdx < PUZZLES.length - 1) {
              setPuzzleIdx(i => i + 1);
            } else {
              onReset();
            }
          }}>
            {puzzleIdx < PUZZLES.length - 1 ? 'Next Puzzle ▶' : 'Play Again ↺'}
          </button>
        </div>
      )}
    </div>
  );
}
