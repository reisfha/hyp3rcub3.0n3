import { useState, useRef, useEffect } from 'react';

export default function EmulatorGame({ onScore }) {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [romLoaded, setRomLoaded] = useState(false);
  const [romName, setRomName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [emulatorType, setEmulatorType] = useState('');

  const handleRomUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    let type = '';

    if (fileName.endsWith('.nes')) {
      type = 'NES';
    } else if (fileName.endsWith('.smc') || fileName.endsWith('.sfc')) {
      type = 'SNES';
    } else if (fileName.endsWith('.gb') || fileName.endsWith('.gbc')) {
      type = 'GameBoy';
    } else if (fileName.endsWith('.gba')) {
      type = 'GameBoy Advance';
    } else if (fileName.endsWith('.z64') || fileName.endsWith('.n64')) {
      type = 'Nintendo 64';
    } else {
      alert('Unsupported ROM format. Supported: .nes, .smc, .sfc, .gb, .gbc, .gba, .z64, .n64');
      return;
    }

    setRomName(file.name);
    setEmulatorType(type);
    setRomLoaded(true);
    setIsRunning(true);
    onScore?.(100); // Award points for loading ROM
  };

  const handleReset = () => {
    setRomLoaded(false);
    setRomName('');
    setEmulatorType('');
    setIsRunning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onScore?.(0);
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="emulator-container">
      <div className="emulator-header">
        <h2>🕹️ Retro Game Emulator</h2>
        <p className="emulator-subtitle">Load your favorite ROM files and play classic games!</p>
      </div>

      <div className="emulator-controls">
        <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
          📁 Load ROM
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".nes,.smc,.sfc,.gb,.gbc,.gba,.z64,.n64"
          onChange={handleRomUpload}
          style={{ display: 'none' }}
        />

        {romLoaded && (
          <>
            <button 
              className="btn-secondary" 
              onClick={togglePause}
              style={{ background: isRunning ? 'rgba(255,0,170,0.3)' : 'rgba(0,240,255,0.3)' }}
            >
              {isRunning ? '⏸️ Pause' : '▶️ Resume'}
            </button>
            <button className="btn-secondary" onClick={handleReset}>
              🔄 Reset
            </button>
          </>
        )}
      </div>

      {romLoaded ? (
        <div className="emulator-display">
          <div className="emulator-info">
            <div className="info-row">
              <span className="info-label">ROM:</span>
              <span className="info-value">{romName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Emulator:</span>
              <span className="info-value">{emulatorType}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value" style={{ color: isRunning ? '#00f0ff' : '#ff00aa' }}>
                {isRunning ? '▶️ Running' : '⏸️ Paused'}
              </span>
            </div>
          </div>

          <div className="emulator-canvas-wrapper">
            <canvas ref={canvasRef} className="emulator-canvas" />
            <div className="emulator-placeholder">
              <div className="placeholder-text">
                <p style={{ fontSize: 14, marginBottom: 8 }}>🎮 {emulatorType} Emulator</p>
                <p style={{ fontSize: 12, color: '#999' }}>
                  {romLoaded ? (isRunning ? 'Now playing...' : 'Paused') : 'Load a ROM to start'}
                </p>
              </div>
            </div>
          </div>

          <div className="emulator-instructions">
            <h3>🎮 Controls</h3>
            <div className="controls-grid">
              <div className="control-item">
                <kbd>Arrow Keys</kbd>
                <span>Move</span>
              </div>
              <div className="control-item">
                <kbd>Z</kbd>
                <span>A Button</span>
              </div>
              <div className="control-item">
                <kbd>X</kbd>
                <span>B Button</span>
              </div>
              <div className="control-item">
                <kbd>Enter</kbd>
                <span>Start</span>
              </div>
              <div className="control-item">
                <kbd>Space</kbd>
                <span>Select</span>
              </div>
              <div className="control-item">
                <kbd>R</kbd>
                <span>Reset Game</span>
              </div>
            </div>
          </div>

          <div className="emulator-supported">
            <h3>✅ Supported Formats</h3>
            <ul>
              <li><strong>NES:</strong> Nintendo Entertainment System (.nes)</li>
              <li><strong>SNES:</strong> Super Nintendo (.smc, .sfc)</li>
              <li><strong>GameBoy:</strong> Original & Color (.gb, .gbc)</li>
              <li><strong>GBA:</strong> Game Boy Advance (.gba)</li>
              <li><strong>N64:</strong> Nintendo 64 (.z64, .n64)</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="emulator-empty">
          <div className="empty-icon">🕹️</div>
          <h3>No ROM Loaded</h3>
          <p>Click "Load ROM" to select a game file from your computer.</p>
          <p className="empty-hint">
            Supported formats: NES, SNES, GameBoy, GBA, Nintendo 64
          </p>
          <div className="empty-disclaimer">
            <strong>⚠️ Note:</strong> Ensure you own the games you emulate. 
            Emulation is for personal use and preservation of classic games.
          </div>
        </div>
      )}
    </div>
  );
}
