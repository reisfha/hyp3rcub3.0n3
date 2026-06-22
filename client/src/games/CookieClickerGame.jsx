import { useState, useEffect, useRef } from 'react';

export default function CookieClickerGame({ onScore }) {
  const [cookies, setCookies] = useState(0);
  const [mult, setMult] = useState(1);
  const scoreRef = useRef(0);

  const click = () => {
    const nc = cookies + mult;
    setCookies(nc);
    scoreRef.current = Math.floor(nc);
    onScore?.(Math.floor(nc));
  };

  const buyUpgrade = (cost, m) => {
    if (cookies < cost) return;
    setCookies(c => c - cost);
    setMult(m => m + m);
  };

  useEffect(() => {
    const iv = setInterval(() => {
      const auto = Math.floor(mult / 2);
      if (auto > 0) {
        setCookies(c => c + auto);
        scoreRef.current += auto;
        onScore?.(scoreRef.current);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [mult, onScore]);

  return (
    <div className="builtin-game cookie-game">
      <div className="cookie-count">{Math.floor(cookies)} 🍪</div>
      <div className="cookie-clicker-main">
        <button className="cookie-btn" onClick={click}>
          <div className="cookie-circle">🍪</div>
        </button>
      </div>
      <div className="game-controls-hint">Click the cookie!</div>
      <div className="cookie-upgrades">
        <button className="cookie-upgrade" onClick={() => buyUpgrade(50, 1)} disabled={cookies < 50}>
          🚀 Double click power — 50 🍪
        </button>
        <button className="cookie-upgrade" onClick={() => buyUpgrade(200, 2)} disabled={cookies < 200}>
          🔥 Triple click power — 200 🍪
        </button>
      </div>
    </div>
  );
}
