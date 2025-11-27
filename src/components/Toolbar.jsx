import './Toolbar.css';

export default function Toolbar({ 
  gridWidth, 
  setGridWidth, 
  gridHeight, 
  setGridHeight, 
  onClear, 
  onExport,
  onNewPattern,
  onOpenImageUpload,
  onOpenSweaterGenerator,
  topToBottom,
  setTopToBottom,
  showThickLines,
  setShowThickLines
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Mønsterstørrelse</h3>
        <div className="size-inputs">
          <div className="input-group">
            <label htmlFor="width">Bredde (masker):</label>
            <input
              type="number"
              id="width"
              min="5"
              max="200"
              value={gridWidth}
              onChange={(e) => setGridWidth(Math.max(5, Math.min(200, parseInt(e.target.value) || 5)))}
            />
          </div>
          <div className="input-group">
            <label htmlFor="height">Høyde (omganger):</label>
            <input
              type="number"
              id="height"
              min="5"
              max="200"
              value={gridHeight}
              onChange={(e) => setGridHeight(Math.max(5, Math.min(200, parseInt(e.target.value) || 5)))}
            />
          </div>
          <button className="btn btn-primary" onClick={onNewPattern}>
            Nytt mønster
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Visning</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={topToBottom}
            onChange={(e) => setTopToBottom(e.target.checked)}
          />
          <span>Ovenfra og ned</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showThickLines}
            onChange={(e) => setShowThickLines(e.target.checked)}
          />
          <span>Vis tykke linjer</span>
        </label>
      </div>
      
      <div className="toolbar-section">
        <h3>Importer</h3>
        <button className="btn btn-image" onClick={onOpenImageUpload}>
          📷 Last opp bilde
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Lag oppskrift</h3>
        <button className="btn btn-sweater" onClick={onOpenSweaterGenerator}>
          🧶 Lag genser-oppskrift
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Handlinger</h3>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={onClear}>
            🗑️ Tøm alt
          </button>
          <button className="btn btn-accent" onClick={onExport}>
            💾 Lagre som bilde
          </button>
        </div>
      </div>

      <div className="toolbar-section shortcuts-section">
        <h3>Hurtigtaster</h3>
        <div className="shortcuts-list">
          <div className="shortcut"><kbd>Shift</kbd> + dra → Marker område</div>
          <div className="shortcut"><kbd>⌘C</kbd> → Kopier markering</div>
          <div className="shortcut"><kbd>Shift</kbd> + klikk → Velg hvor du limer inn</div>
          <div className="shortcut"><kbd>⌘V</kbd> → Lim inn</div>
          <div className="shortcut"><kbd>⌘</kbd><kbd>Shift</kbd><kbd>V</kbd> → Lim inn speilvendt</div>
          <div className="shortcut"><kbd>⌘Z</kbd> → Angre</div>
          <div className="shortcut"><kbd>⌘Y</kbd> → Gjør om</div>
          <div className="shortcut"><kbd>Esc</kbd> → Fjern markering</div>
        </div>
      </div>
    </div>
  );
}
