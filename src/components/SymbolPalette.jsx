import './SymbolPalette.css';

// Knitting symbols - single cell symbols
export const KNITTING_SYMBOLS = [
  { id: 'knit', name: 'r', symbol: 'knit', width: 1, description: 'r på r-siden, vr på vr-siden' },
  { id: 'purl', name: 'vr', symbol: 'purl', width: 1, description: 'vr på r-siden, r på vr-siden' },
  { id: 'no-stitch', name: 'ingen maske', symbol: 'no-stitch', width: 1, description: 'ingen maske' },
  { id: 'm1r', name: 'øk-v', symbol: 'm1r', width: 1, description: 'plukk opp tråden mellom to m forfra, og strikk tråden vridd r' },
  { id: 'm1l', name: 'øk-h', symbol: 'm1l', width: 1, description: 'plukk opp tråden mellom to m bakfra, og strikk tråden r' },
  { id: 'm1rp', name: 'øk-h-vr', symbol: 'm1rp', width: 1, description: 'plukk opp tråden mellom to m forfra, og strikk tråden vridd vr' },
  { id: 'm1lp', name: 'øk-v-vr', symbol: 'm1lp', width: 1, description: 'plukk opp tråden mellom to m bakfra, og strikk tråden vr' },
  { id: 'k2tog', name: 'fell-h', symbol: 'k2tog', width: 1, description: '2 r sammen' },
  { id: 'ssk', name: 'fell-v', symbol: 'ssk', width: 1, description: '2 m vridd r sammen eller ta to masker løst av som om de skuller strikkes vrang, strikk 2 m vridd r sammen' },
  { id: 'yo', name: 'kast', symbol: 'yo', width: 1, description: 'kast' },
];

// Multi-cell cable symbols
export const CABLE_SYMBOLS = [
  // 2-stitch cables (1/1)
  { id: 'c1-1-r', name: 'flett 1/1 foran', width: 2, description: 'før høyre p bak 1. m, og strikk 2. m r uten å la den ga av venstre p, strikk 1. m r og la begge gå av venstre p' },
  { id: 'c1-1-l', name: 'flett 1/1 bak', width: 2, description: 'før høyre p foran 1. m, og strikk 2. m r uten å la den gå av venstre p, strikk 1. m r og la begge gå av venstre p' },
  
  // 3-stitch cables
  { id: 'c2-1-r', name: 'flett 2/1 foran', width: 3, description: 'sett 2 m på hjelpep på forsiden av arb, strikk 1 r, strikk de 2 m på hjelpep r' },
  { id: 'c2-1-l', name: 'flett 1/2 bak', width: 3, description: 'sett 1 m på hjelpep på baksiden av arb, strikk 2 r, strikk m på hjelpep r' },
  { id: 'c1-2-r', name: 'flett 2/1 foran vrang', width: 3, description: 'sett 1 m på hjelpep på baksiden av arb, strikk 2 r, strikk m på hjelpep vr' },
  { id: 'c1-2-l', name: 'flett 1/2 bak vrang', width: 3, description: 'sett 2 m på hjelpep på forsiden av arb, strikk 1 vr, strikk m på hjelpep r' },
  
  // 4-stitch cables (2/2)
  { id: 'c2-2-r', name: 'flett 2/2 bak', width: 4, description: 'sett 2 m på hjelpep på baksiden av arb, strikk 2 r, strikk de 2 m på hjelpep r' },
  { id: 'c2-2-l', name: 'flett 2/2 foran', width: 4, description: 'sett 2 m på hjelpep på forsiden av arb, strikk 2 r, strikk de 2 m på hjelpep r' },
  
  // 6-stitch cables (3/3)
  { id: 'c3-3-r', name: 'flett 3/3 bak', width: 6, description: 'sett 3 m påhjelpep på baksiden av arb, strikk 3 r, strikk de 3 m på hjelpep r' },
  { id: 'c3-3-l', name: 'flett 3/3 foran', width: 6, description: 'sett 3 m på hjelpep på forsiden av arb, strikk 3 r, strikk de 3 m på hjelpep r' },
];

export const ALL_SYMBOLS = [...KNITTING_SYMBOLS, ...CABLE_SYMBOLS];

export function getSymbolWidth(symbolId) {
  const symbol = ALL_SYMBOLS.find(s => s.id === symbolId);
  return symbol ? symbol.width : 1;
}

// SVG paths for single-cell symbols
export function renderSymbol(symbolId, width, height) {
  const strokeColor = '#333';
  const strokeWidth = 1.2;
  const cx = width / 2;
  const cy = height / 2;
  const p = 2; // padding

  switch (symbolId) {
    case 'knit':
      // Empty cell - knit stitch (no symbol needed)
      return null;
    
    case 'purl':
      // Filled dot in center - purl stitch
      return (
        <circle
          cx={cx}
          cy={cy}
          r={Math.min(width, height) / 6}
          fill={strokeColor}
        />
      );
    
    case 'no-stitch':
      // Gray filled square - no stitch placeholder
      return (
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="#999"
        />
      );
    
    case 'm1r':
      // Vertical stem with diagonal going from middle to upper-left
      // "plukk opp tråden mellom to m forfra, og strikk tråden vridd r"
      return (
        <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
          {/* Vertical stem */}
          <line x1={cx} y1={height - p - 1} x2={cx} y2={p + 1} />
          {/* Diagonal from middle of stem to upper-left */}
          <line x1={cx} y1={cy} x2={p + 2} y2={p + 1} />
        </g>
      );
    
    case 'm1l':
      // Vertical stem with diagonal going from middle to upper-right (mirror of m1r)
      // "plukk opp tråden mellom to m bakfra, og strikk tråden r"
      return (
        <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
          {/* Vertical stem */}
          <line x1={cx} y1={height - p - 1} x2={cx} y2={p + 1} />
          {/* Diagonal from middle of stem to upper-right */}
          <line x1={cx} y1={cy} x2={width - p - 2} y2={p + 1} />
        </g>
      );
    
    case 'm1rp':
      // Like m1l (vertical stem + diagonal to upper-right) but with a small circle to the right
      // "plukk opp tråden mellom to m forfra, og strikk tråden vridd vr"
      return (
        <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
          {/* Vertical stem */}
          <line x1={cx} y1={height - p - 1} x2={cx} y2={p + 1} />
          {/* Diagonal from middle to upper-right */}
          <line x1={cx} y1={cy} x2={width - p - 2} y2={p + 1} />
          {/* Small filled circle to the right of stem, below the diagonal */}
          <circle cx={width - p - 4} cy={cy + 1} r={1.5} fill={strokeColor} />
        </g>
      );
    
    case 'm1lp':
      // Like m1r (vertical stem + diagonal to upper-left) but with a small filled circle
      // "plukk opp tråden mellom to m bakfra, og strikk tråden vr"
      return (
        <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
          {/* Vertical stem */}
          <line x1={cx} y1={height - p - 1} x2={cx} y2={p + 1} />
          {/* Diagonal from middle to upper-left */}
          <line x1={cx} y1={cy} x2={p + 2} y2={p + 1} />
          {/* Small filled circle to the left of stem, below the diagonal */}
          <circle cx={p + 4} cy={cy + 1} r={1.5} fill={strokeColor} />
        </g>
      );
    
    case 'k2tog':
      // Right-leaning decrease line /
      return (
        <line
          x1={p + 1}
          y1={height - p - 1}
          x2={width - p - 1}
          y2={p + 1}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      );
    
    case 'ssk':
      // Left-leaning decrease line \
      return (
        <line
          x1={p + 1}
          y1={p + 1}
          x2={width - p - 1}
          y2={height - p - 1}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      );
    
    case 'yo':
      return (
        <circle
          cx={cx}
          cy={cy}
          r={Math.min(width, height) / 3}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    
    default:
      return null;
  }
}

// Render multi-cell cable symbols
export function renderCableSymbol(symbolId, totalWidth, height, cellWidth) {
  const strokeColor = '#1a1a1a';
  const strokeWidth = 1.5;
  const padding = 2;
  const h = height;

  switch (symbolId) {
    // 1/1 cables (2 cells)
    case 'c1-1-r':
      // Right cable: two shapes, one in each cell
      {
        const cy = h / 2;
        // Left cell: meeting point is center of left cell (on the diagonal)
        const leftCenterX = cellWidth / 2;
        // Right cell vertex (left-middle of right cell)
        const rightVertexX = cellWidth + padding;
        
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            {/* Left cell: diagonal from top-left to bottom-right, with line from bottom-left meeting it */}
            <line x1={padding} y1={padding} x2={cellWidth - padding} y2={h - padding} />
            <line x1={padding} y1={h - padding} x2={leftCenterX} y2={cy} />
            
            {/* Right cell: diagonal from top-left to bottom-right, with line from top-right meeting it */}
            <line x1={cellWidth + padding} y1={padding} x2={totalWidth - padding} y2={h - padding} />
            <line x1={totalWidth - padding} y1={padding} x2={cellWidth + cellWidth / 2} y2={cy} />
          </g>
        );
      }
    
    case 'c1-1-l':
      // Left cable: two shapes, one in each cell
      {
        const cy = h / 2;
        // Left cell center
        const leftCenterX = cellWidth / 2;
        // Right cell center
        const rightCenterX = cellWidth + cellWidth / 2;
        
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            {/* Left cell: diagonal from top-right to bottom-left, with line from top-left to center */}
            <line x1={cellWidth - padding} y1={padding} x2={padding} y2={h - padding} />
            <line x1={padding} y1={padding} x2={leftCenterX} y2={cy} />
            
            {/* Right cell: diagonal from top-right to bottom-left, with line from bottom-right to center */}
            <line x1={totalWidth - padding} y1={padding} x2={cellWidth + padding} y2={h - padding} />
            <line x1={totalWidth - padding} y1={h - padding} x2={rightCenterX} y2={cy} />
          </g>
        );
      }
    
    // 2/1 cables (3 cells) - 2 stitches cross over 1
    case 'c2-1-r':
      // Same as c1-1-r but 3 cells (middle cell blank)
      {
        const cy = h / 2;
        const leftCenterX = cellWidth / 2;
        // Right cell starts at cellWidth * 2
        const rightCellStart = cellWidth * 2;
        const rightCenterX = rightCellStart + cellWidth / 2;
        
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            {/* Left cell (cell 0): diagonal + line from bottom-left to center */}
            <line x1={padding} y1={padding} x2={cellWidth - padding} y2={h - padding} />
            <line x1={padding} y1={h - padding} x2={leftCenterX} y2={cy} />
            
            {/* Middle cell (cell 1): blank */}
            
            {/* Right cell (cell 2): diagonal + line from top-right to center */}
            <line x1={rightCellStart + padding} y1={padding} x2={totalWidth - padding} y2={h - padding} />
            <line x1={totalWidth - padding} y1={padding} x2={rightCenterX} y2={cy} />
          </g>
        );
      }
    
    case 'c2-1-l':
      // Same as c1-1-l but 3 cells (middle cell blank)
      {
        const cy = h / 2;
        const leftCenterX = cellWidth / 2;
        // Right cell starts at cellWidth * 2
        const rightCellStart = cellWidth * 2;
        const rightCenterX = rightCellStart + cellWidth / 2;
        
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            {/* Left cell (cell 0): diagonal top-right to bottom-left + line from top-left to center */}
            <line x1={cellWidth - padding} y1={padding} x2={padding} y2={h - padding} />
            <line x1={padding} y1={padding} x2={leftCenterX} y2={cy} />
            
            {/* Middle cell (cell 1): blank */}
            
            {/* Right cell (cell 2): diagonal top-right to bottom-left + line from bottom-right to center */}
            <line x1={totalWidth - padding} y1={padding} x2={rightCellStart + padding} y2={h - padding} />
            <line x1={totalWidth - padding} y1={h - padding} x2={rightCenterX} y2={cy} />
          </g>
        );
      }
    
    // 1/2 cables (3 cells) - 1 stitch crosses over 2
    case 'c1-2-r':
      // Like c2-1-l but first cell has circle instead of line
      {
        const cy = h / 2;
        // Right cell starts at cellWidth * 2
        const rightCellStart = cellWidth * 2;
        const rightCenterX = rightCellStart + cellWidth / 2;
        
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            {/* Left cell (cell 0): diagonal top-right to bottom-left + small black circle */}
            <line x1={cellWidth - padding} y1={padding} x2={padding} y2={h - padding} />
            <circle cx={padding + 4} cy={padding + 4} r={1.5} fill={strokeColor} />
            
            {/* Middle cell (cell 1): blank */}
            
            {/* Right cell (cell 2): diagonal top-right to bottom-left + line from bottom-right to center */}
            <line x1={totalWidth - padding} y1={padding} x2={rightCellStart + padding} y2={h - padding} />
            <line x1={totalWidth - padding} y1={h - padding} x2={rightCenterX} y2={cy} />
          </g>
        );
      }
    
    case 'c1-2-l':
      // Like c2-1-r but right cell has circle instead of line
      {
        const cy = h / 2;
        const leftCenterX = cellWidth / 2;
        // Right cell starts at cellWidth * 2
        const rightCellStart = cellWidth * 2;
        
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            {/* Left cell (cell 0): diagonal top-left to bottom-right + line from bottom-left to center */}
            <line x1={padding} y1={padding} x2={cellWidth - padding} y2={h - padding} />
            <line x1={padding} y1={h - padding} x2={leftCenterX} y2={cy} />
            
            {/* Middle cell (cell 1): blank */}
            
            {/* Right cell (cell 2): diagonal top-left to bottom-right + small black circle */}
            <line x1={rightCellStart + padding} y1={padding} x2={totalWidth - padding} y2={h - padding} />
            <circle cx={totalWidth - padding - 4} cy={padding + 4} r={1.5} fill={strokeColor} />
          </g>
        );
      }
    
    // 2/2 cables (4 cells)
    case 'c2-2-r':
      // Like c2-1-l but 4 cells, diagonals span 2 cells each
      {
        const cy = h / 2;
        const leftCenterX = cellWidth / 2;
        // Right shape starts at cell 2
        const rightShapeStart = cellWidth * 2;
        const rightCenterX = cellWidth * 3 + cellWidth / 2;
        
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            {/* Left shape (cells 0-1): diagonal from bottom-left cell0 to top-right cell1 + line */}
            <line x1={padding} y1={h - padding} x2={cellWidth * 2 - padding} y2={padding} />
            <line x1={padding} y1={padding} x2={leftCenterX} y2={cy} />
            
            {/* Right shape (cells 2-3): diagonal from bottom-left cell2 to top-right cell3 + line */}
            <line x1={rightShapeStart + padding} y1={h - padding} x2={totalWidth - padding} y2={padding} />
            <line x1={totalWidth - padding} y1={h - padding} x2={rightCenterX} y2={cy} />
          </g>
        );
      }
    
    case 'c2-2-l':
      // Like c2-1-r but 4 cells, diagonals span 2 cells each
      {
        const cy = h / 2;
        const leftCenterX = cellWidth / 2;
        // Right shape starts at cell 2
        const rightShapeStart = cellWidth * 2;
        const rightCenterX = cellWidth * 3 + cellWidth / 2;
        
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            {/* Left shape (cells 0-1): diagonal from top-left cell0 to bottom-right cell1 + line */}
            <line x1={padding} y1={padding} x2={cellWidth * 2 - padding} y2={h - padding} />
            <line x1={padding} y1={h - padding} x2={leftCenterX} y2={cy} />
            
            {/* Right shape (cells 2-3): diagonal from top-left cell2 to bottom-right cell3 + line */}
            <line x1={rightShapeStart + padding} y1={padding} x2={totalWidth - padding} y2={h - padding} />
            <line x1={totalWidth - padding} y1={padding} x2={rightCenterX} y2={cy} />
          </g>
        );
      }
    
    // 1/2/1 cables (4 cells) - purl cable variations
    case 'c1-2-1-r':
      return (
        <g>
          <line x1={padding} y1={h - padding} x2={cellWidth * 3 - padding} y2={padding} 
                stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1={cellWidth + padding} y1={h - padding} x2={cellWidth * 2.3} y2={h * 0.5} 
                stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1={cellWidth * 0.7} y1={h * 0.5} x2={padding} y2={padding} 
                stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1={cellWidth * 3 + padding} y1={h - padding} x2={totalWidth - padding} y2={padding} 
                stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </g>
      );
    
    case 'c1-2-1-l':
      return (
        <g>
          <line x1={cellWidth + padding} y1={padding} x2={totalWidth - padding} y2={h - padding} 
                stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1={cellWidth * 2 + padding} y1={padding} x2={cellWidth * 3.3} y2={h * 0.5} 
                stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1={cellWidth * 2.7} y1={h * 0.5} x2={totalWidth - padding} y2={padding} 
                stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1={padding} y1={padding} x2={cellWidth - padding} y2={h - padding} 
                stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </g>
      );
    
    // 3/3 cables (6 cells)
    case 'c3-3-r':
      // Like c2-2-r but 6 cells, diagonals span 3 cells each
      {
        const cy = h / 2;
        const leftCenterX = cellWidth * 1.5; // center of cells 0-2
        // Right shape starts at cell 3
        const rightShapeStart = cellWidth * 3;
        const rightCenterX = cellWidth * 4.5; // center of cells 3-5
        
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            {/* Left shape (cells 0-2): diagonal from bottom-left cell0 to top-right cell2 + line */}
            <line x1={padding} y1={h - padding} x2={cellWidth * 3 - padding} y2={padding} />
            <line x1={padding} y1={padding} x2={leftCenterX} y2={cy} />
            
            {/* Right shape (cells 3-5): diagonal from bottom-left cell3 to top-right cell5 + line */}
            <line x1={rightShapeStart + padding} y1={h - padding} x2={totalWidth - padding} y2={padding} />
            <line x1={totalWidth - padding} y1={h - padding} x2={rightCenterX} y2={cy} />
          </g>
        );
      }
    
    case 'c3-3-l':
      // Like c2-2-l but 6 cells, diagonals span 3 cells each
      {
        const cy = h / 2;
        const leftCenterX = cellWidth * 1.5; // center of cells 0-2
        // Right shape starts at cell 3
        const rightShapeStart = cellWidth * 3;
        const rightCenterX = cellWidth * 4.5; // center of cells 3-5
        
        return (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
            {/* Left shape (cells 0-2): diagonal from top-left cell0 to bottom-right cell2 + line */}
            <line x1={padding} y1={padding} x2={cellWidth * 3 - padding} y2={h - padding} />
            <line x1={padding} y1={h - padding} x2={leftCenterX} y2={cy} />
            
            {/* Right shape (cells 3-5): diagonal from top-left cell3 to bottom-right cell5 + line */}
            <line x1={rightShapeStart + padding} y1={padding} x2={totalWidth - padding} y2={h - padding} />
            <line x1={totalWidth - padding} y1={padding} x2={rightCenterX} y2={cy} />
          </g>
        );
      }
    
    default:
      return null;
  }
}

export default function SymbolPalette({ selectedSymbol, setSelectedSymbol }) {
  return (
    <div className="symbol-palette">
      <h3>Symboler</h3>
      
      {/* Single-cell symbols */}
      <div className="symbol-section">
        <h4>Enkle masker</h4>
        <div className="symbol-grid">
          {KNITTING_SYMBOLS.map((sym) => (
            <button
              key={sym.id}
              className={`symbol-button ${selectedSymbol === sym.id ? 'selected' : ''}`}
              onClick={() => setSelectedSymbol(sym.id)}
              title={`${sym.name}: ${sym.description}`}
            >
              <svg width="28" height="21" viewBox="0 0 20 15">
                <rect x="0" y="0" width="20" height="15" fill="#FFFFFF" stroke="#ccc" strokeWidth="0.5" />
                {renderSymbol(sym.id, 20, 15)}
              </svg>
            </button>
          ))}
        </div>
      </div>
      
      {/* Cable symbols */}
      <div className="symbol-section">
        <h4>Fletter</h4>
        <div className="cable-grid">
          {CABLE_SYMBOLS.map((sym) => (
            <button
              key={sym.id}
              className={`symbol-button cable-button ${selectedSymbol === sym.id ? 'selected' : ''}`}
              onClick={() => setSelectedSymbol(sym.id)}
              title={`${sym.name}: ${sym.description}`}
            >
              <svg width={sym.width * 14} height="21" viewBox={`0 0 ${sym.width * 20} 15`}>
                {Array.from({ length: sym.width }, (_, i) => (
                  <rect 
                    key={i} 
                    x={i * 20} 
                    y="0" 
                    width="20" 
                    height="15" 
                    fill="#FFFFFF" 
                    stroke="#ccc" 
                    strokeWidth="0.5" 
                  />
                ))}
                {renderCableSymbol(sym.id, sym.width * 20, 15, 20)}
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
