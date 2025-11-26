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
  onUndo,
  onRedo,
  canUndo,
  canRedo,
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
        <h3>Angre</h3>
        <div className="undo-redo-buttons">
          <button 
            className="btn btn-undo" 
            onClick={onUndo}
            disabled={!canUndo}
            title="Angre (⌘Z)"
          >
            ↩️ Angre
          </button>
          <button 
            className="btn btn-redo" 
            onClick={onRedo}
            disabled={!canRedo}
            title="Gjør om (⌘Y)"
          >
            ↪️ Gjør om
          </button>
        </div>
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
    </div>
  );
}

