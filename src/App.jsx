import { useState, useCallback, useRef } from 'react';
import Grid from './components/Grid';
import ColorPalette from './components/ColorPalette';
import SymbolPalette, { CABLE_SYMBOLS } from './components/SymbolPalette';
import Toolbar from './components/Toolbar';
import './App.css';

const DEFAULT_WIDTH = 50;
const DEFAULT_HEIGHT = 50;
const DEFAULT_COLOR = '#FFFFFF'; // Hvit
const CELL_WIDTH = 20;
const CELL_HEIGHT = 15; // 4:3 ratio
const LABEL_SIZE = 24; // Space for row/column labels

function createEmptyGrid(width, height, color = DEFAULT_COLOR) {
  return Array(height).fill(null).map(() => 
    Array(width).fill(null).map(() => ({ color, symbol: 'knit' }))
  );
}

function App() {
  const [gridWidth, setGridWidth] = useState(DEFAULT_WIDTH);
  const [gridHeight, setGridHeight] = useState(DEFAULT_HEIGHT);
  const [grid, setGrid] = useState(() => createEmptyGrid(DEFAULT_WIDTH, DEFAULT_HEIGHT));
  const [selectedColor, setSelectedColor] = useState('#000080'); // Marineblå
  const [recentColors, setRecentColors] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('knit');
  const [topToBottom, setTopToBottom] = useState(true);
  const [showThickLines, setShowThickLines] = useState(true);
  const gridRef = useRef(null);

  const handleNewPattern = useCallback(() => {
    setGrid(createEmptyGrid(gridWidth, gridHeight));
  }, [gridWidth, gridHeight]);

  const handleClear = useCallback(() => {
    setGrid(createEmptyGrid(grid[0].length, grid.length));
  }, [grid]);

  const handleExport = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const gridW = grid[0].length * CELL_WIDTH;
    const gridH = grid.length * CELL_HEIGHT;
    
    canvas.width = gridW + LABEL_SIZE;
    canvas.height = gridH + LABEL_SIZE;

    // Fill background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid cells
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = colIndex * CELL_WIDTH;
        const y = rowIndex * CELL_HEIGHT;
        
        // Draw cell background
        ctx.fillStyle = cell.color;
        ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);
        
        // Draw cell border
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);
      });
    });

    // Draw symbols (second pass to draw on top of backgrounds)
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = colIndex * CELL_WIDTH;
        const y = rowIndex * CELL_HEIGHT;
        
        // Check if it's a cable symbol
        const cable = CABLE_SYMBOLS.find(c => c.id === cell.symbol);
        if (cable) {
          drawCableOnCanvas(ctx, cell.symbol, x, y, cable.width * CELL_WIDTH, CELL_HEIGHT, CELL_WIDTH);
        } else if (!cell.symbol?.startsWith('_cable_')) {
          // Draw single-cell symbol
          drawSymbolOnCanvas(ctx, cell.symbol, x, y, CELL_WIDTH, CELL_HEIGHT);
        }
      });
    });

    // Draw column numbers at bottom
    ctx.fillStyle = '#888';
    ctx.font = grid[0].length > 60 ? '8px sans-serif' : '10px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < grid[0].length; i++) {
      ctx.fillText(
        String(topToBottom ? i + 1 : grid[0].length - i),
        i * CELL_WIDTH + CELL_WIDTH / 2,
        gridH + LABEL_SIZE - 6
      );
    }

    // Draw row numbers on right
    ctx.textAlign = 'left';
    for (let i = 0; i < grid.length; i++) {
      ctx.fillText(
        String(topToBottom ? i + 1 : grid.length - i),
        gridW + 4,
        i * CELL_HEIGHT + CELL_HEIGHT / 2 + 3
      );
    }

    // Draw thick vertical lines every 10 columns
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    const numVLines = Math.floor((grid[0].length - 1) / 10);
    for (let i = 1; i <= numVLines; i++) {
      const k = i * 10;
      const pos = topToBottom ? k : grid[0].length - k;
      ctx.beginPath();
      ctx.moveTo(pos * CELL_WIDTH, 0);
      ctx.lineTo(pos * CELL_WIDTH, gridH);
      ctx.stroke();
    }

    // Draw thick horizontal lines every 10 rows
    const numHLines = Math.floor((grid.length - 1) / 10);
    for (let i = 1; i <= numHLines; i++) {
      const k = i * 10;
      const pos = topToBottom ? k : grid.length - k;
      ctx.beginPath();
      ctx.moveTo(0, pos * CELL_HEIGHT);
      ctx.lineTo(gridW, pos * CELL_HEIGHT);
      ctx.stroke();
    }

    // Download the image
    const link = document.createElement('a');
    link.download = `strikkeoppskrift-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [grid, topToBottom]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>✦ Strikkedesigner</h1>
        <p>Design dine egne strikkemønstre</p>
      </header>
      
      <main className="app-main">
        <aside className="sidebar left-sidebar">
          <ColorPalette
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            recentColors={recentColors}
            setRecentColors={setRecentColors}
          />
          <SymbolPalette
            selectedSymbol={selectedSymbol}
            setSelectedSymbol={setSelectedSymbol}
          />
        </aside>
        
        <section className="canvas-area" ref={gridRef}>
          <Grid
            width={grid[0].length}
            height={grid.length}
            grid={grid}
            setGrid={setGrid}
            selectedColor={selectedColor}
            selectedSymbol={selectedSymbol}
            cellWidth={CELL_WIDTH}
            cellHeight={CELL_HEIGHT}
            topToBottom={topToBottom}
            showThickLines={showThickLines}
          />
        </section>
        
        <aside className="sidebar right-sidebar">
          <Toolbar
            gridWidth={gridWidth}
            setGridWidth={setGridWidth}
            gridHeight={gridHeight}
            setGridHeight={setGridHeight}
            onClear={handleClear}
            onExport={handleExport}
            onNewPattern={handleNewPattern}
            topToBottom={topToBottom}
            setTopToBottom={setTopToBottom}
            showThickLines={showThickLines}
            setShowThickLines={setShowThickLines}
          />
        </aside>
      </main>
      
      <footer className="app-footer">
        <p>Klikk og dra for å male • Bredde × Høyde: {grid[0].length} × {grid.length} masker</p>
      </footer>
      </div>
  );
}

// Helper function to draw single-cell symbols on canvas for export
function drawSymbolOnCanvas(ctx, symbolId, x, y, width, height) {
  const strokeColor = '#333';
  const strokeWidth = 1.2;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const p = 2; // padding

  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';

  switch (symbolId) {
    case 'purl':
      // Filled dot in center
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(width, height) / 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    
    case 'no-stitch':
      // Gray filled square
      ctx.fillStyle = '#999';
      ctx.fillRect(x, y, width, height);
      break;
    
    case 'm1r':
      // Vertical stem with diagonal from middle to upper-left
      ctx.beginPath();
      ctx.moveTo(cx, y + height - p - 1);
      ctx.lineTo(cx, y + p + 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x + p + 2, y + p + 1);
      ctx.stroke();
      break;
    
    case 'm1l':
      // Vertical stem with diagonal from middle to upper-right
      ctx.beginPath();
      ctx.moveTo(cx, y + height - p - 1);
      ctx.lineTo(cx, y + p + 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x + width - p - 2, y + p + 1);
      ctx.stroke();
      break;
    
    case 'm1rp':
      // Like m1l but with a small circle to the right of stem
      ctx.beginPath();
      ctx.moveTo(cx, y + height - p - 1);
      ctx.lineTo(cx, y + p + 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x + width - p - 2, y + p + 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + width - p - 4, cy + 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    
    case 'm1lp':
      // Like m1r but with a small filled circle to the left
      // Vertical stem
      ctx.beginPath();
      ctx.moveTo(x + cx, y + height - p - 1);
      ctx.lineTo(x + cx, y + p + 1);
      ctx.stroke();
      // Diagonal from middle to upper-left
      ctx.beginPath();
      ctx.moveTo(x + cx, cy);
      ctx.lineTo(x + p + 2, y + p + 1);
      ctx.stroke();
      // Small filled circle to the left of stem
      ctx.beginPath();
      ctx.arc(x + p + 4, cy + 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    
    case 'k2tog':
      // Right-leaning decrease /
      ctx.beginPath();
      ctx.moveTo(x + p + 1, y + height - p - 1);
      ctx.lineTo(x + width - p - 1, y + p + 1);
      ctx.stroke();
      break;
    
    case 'ssk':
      // Left-leaning decrease \
      ctx.beginPath();
      ctx.moveTo(x + p + 1, y + p + 1);
      ctx.lineTo(x + width - p - 1, y + height - p - 1);
      ctx.stroke();
      break;
    
    case 'yo':
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(width, height) / 3, 0, Math.PI * 2);
      ctx.stroke();
      break;
    
    default:
      break;
  }
}

// Helper function to draw cable symbols on canvas for export
function drawCableOnCanvas(ctx, symbolId, x, y, totalWidth, h, cellWidth) {
  const strokeColor = '#1a1a1a';
  const strokeWidth = 1.5;
  const padding = 2;

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';

  switch (symbolId) {
    case 'c1-1-r':
      {
        const cableCy = h / 2;
        const leftCenterX = cellWidth / 2;
        const rightVertexX = cellWidth + padding;
        // Left cell: diagonal + line from bottom-left to center
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + cellWidth - padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + padding, y + h - padding);
        ctx.lineTo(x + leftCenterX, y + cableCy);
        ctx.stroke();
        // Right cell: diagonal + line from top-right to center
        ctx.beginPath();
        ctx.moveTo(x + cellWidth + padding, y + padding);
        ctx.lineTo(x + totalWidth - padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + padding);
        ctx.lineTo(x + cellWidth + cellWidth / 2, y + cableCy);
        ctx.stroke();
      }
      break;
    
    case 'c1-1-l':
      {
        const cableCy = h / 2;
        const leftCenterX = cellWidth / 2;
        const rightCenterX = cellWidth + cellWidth / 2;
        // Left cell: diagonal + line from top-left to center
        ctx.beginPath();
        ctx.moveTo(x + cellWidth - padding, y + padding);
        ctx.lineTo(x + padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + leftCenterX, y + cableCy);
        ctx.stroke();
        // Right cell: diagonal + line from bottom-right to center
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + padding);
        ctx.lineTo(x + cellWidth + padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + h - padding);
        ctx.lineTo(x + rightCenterX, y + cableCy);
        ctx.stroke();
      }
      break;
    
    case 'c2-2-r':
      // Like c2-1-l but 4 cells, diagonals span 2 cells each
      {
        const c22rCy = h / 2;
        const c22rLeftCenterX = cellWidth / 2;
        const c22rRightShapeStart = cellWidth * 2;
        const c22rRightCenterX = cellWidth * 3 + cellWidth / 2;
        // Left shape (cells 0-1): diagonal + line
        ctx.beginPath();
        ctx.moveTo(x + padding, y + h - padding);
        ctx.lineTo(x + cellWidth * 2 - padding, y + padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + c22rLeftCenterX, y + c22rCy);
        ctx.stroke();
        // Right shape (cells 2-3): diagonal + line
        ctx.beginPath();
        ctx.moveTo(x + c22rRightShapeStart + padding, y + h - padding);
        ctx.lineTo(x + totalWidth - padding, y + padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + h - padding);
        ctx.lineTo(x + c22rRightCenterX, y + c22rCy);
        ctx.stroke();
      }
      break;
    
    case 'c2-2-l':
      // Like c2-1-r but 4 cells, diagonals span 2 cells each
      {
        const c22lCy = h / 2;
        const c22lLeftCenterX = cellWidth / 2;
        const c22lRightShapeStart = cellWidth * 2;
        const c22lRightCenterX = cellWidth * 3 + cellWidth / 2;
        // Left shape (cells 0-1): diagonal + line
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + cellWidth * 2 - padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + padding, y + h - padding);
        ctx.lineTo(x + c22lLeftCenterX, y + c22lCy);
        ctx.stroke();
        // Right shape (cells 2-3): diagonal + line
        ctx.beginPath();
        ctx.moveTo(x + c22lRightShapeStart + padding, y + padding);
        ctx.lineTo(x + totalWidth - padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + padding);
        ctx.lineTo(x + c22lRightCenterX, y + c22lCy);
        ctx.stroke();
      }
      break;
    
    case 'c3-3-r':
      // Like c2-2-r but 6 cells, diagonals span 3 cells each
      {
        const c33rCy = h / 2;
        const c33rLeftCenterX = cellWidth * 1.5;
        const c33rRightShapeStart = cellWidth * 3;
        const c33rRightCenterX = cellWidth * 4.5;
        // Left shape (cells 0-2): diagonal + line
        ctx.beginPath();
        ctx.moveTo(x + padding, y + h - padding);
        ctx.lineTo(x + cellWidth * 3 - padding, y + padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + c33rLeftCenterX, y + c33rCy);
        ctx.stroke();
        // Right shape (cells 3-5): diagonal + line
        ctx.beginPath();
        ctx.moveTo(x + c33rRightShapeStart + padding, y + h - padding);
        ctx.lineTo(x + totalWidth - padding, y + padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + h - padding);
        ctx.lineTo(x + c33rRightCenterX, y + c33rCy);
        ctx.stroke();
      }
      break;
    
    case 'c3-3-l':
      // Like c2-2-l but 6 cells, diagonals span 3 cells each
      {
        const c33lCy = h / 2;
        const c33lLeftCenterX = cellWidth * 1.5;
        const c33lRightShapeStart = cellWidth * 3;
        const c33lRightCenterX = cellWidth * 4.5;
        // Left shape (cells 0-2): diagonal + line
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + cellWidth * 3 - padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + padding, y + h - padding);
        ctx.lineTo(x + c33lLeftCenterX, y + c33lCy);
        ctx.stroke();
        // Right shape (cells 3-5): diagonal + line
        ctx.beginPath();
        ctx.moveTo(x + c33lRightShapeStart + padding, y + padding);
        ctx.lineTo(x + totalWidth - padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + padding);
        ctx.lineTo(x + c33lRightCenterX, y + c33lCy);
        ctx.stroke();
      }
      break;
    
    // Add other cable types as needed with similar pattern
    case 'c2-1-r':
      // Same as c1-1-r but 3 cells (middle cell blank)
      {
        const c21rCy = h / 2;
        const c21rLeftCenterX = cellWidth / 2;
        const c21rRightCellStart = cellWidth * 2;
        const c21rRightCenterX = c21rRightCellStart + cellWidth / 2;
        // Left cell: diagonal + line from bottom-left to center
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + cellWidth - padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + padding, y + h - padding);
        ctx.lineTo(x + c21rLeftCenterX, y + c21rCy);
        ctx.stroke();
        // Right cell: diagonal + line from top-right to center
        ctx.beginPath();
        ctx.moveTo(x + c21rRightCellStart + padding, y + padding);
        ctx.lineTo(x + totalWidth - padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + padding);
        ctx.lineTo(x + c21rRightCenterX, y + c21rCy);
        ctx.stroke();
      }
      break;
    
    case 'c2-1-l':
      // Same as c1-1-l but 3 cells (middle cell blank)
      {
        const c21lCy = h / 2;
        const c21lLeftCenterX = cellWidth / 2;
        const c21lRightCellStart = cellWidth * 2;
        const c21lRightCenterX = c21lRightCellStart + cellWidth / 2;
        // Left cell: diagonal top-right to bottom-left + line from top-left to center
        ctx.beginPath();
        ctx.moveTo(x + cellWidth - padding, y + padding);
        ctx.lineTo(x + padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + c21lLeftCenterX, y + c21lCy);
        ctx.stroke();
        // Right cell: diagonal top-right to bottom-left + line from bottom-right to center
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + padding);
        ctx.lineTo(x + c21lRightCellStart + padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + h - padding);
        ctx.lineTo(x + c21lRightCenterX, y + c21lCy);
        ctx.stroke();
      }
      break;
    
    case 'c1-2-r':
      // Like c2-1-l but first cell has circle instead of line
      {
        const c12rCy = h / 2;
        const c12rRightCellStart = cellWidth * 2;
        const c12rRightCenterX = c12rRightCellStart + cellWidth / 2;
        // Left cell: diagonal top-right to bottom-left + small black circle
        ctx.beginPath();
        ctx.moveTo(x + cellWidth - padding, y + padding);
        ctx.lineTo(x + padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + padding + 4, y + padding + 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Right cell: diagonal top-right to bottom-left + line from bottom-right to center
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + padding);
        ctx.lineTo(x + c12rRightCellStart + padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + totalWidth - padding, y + h - padding);
        ctx.lineTo(x + c12rRightCenterX, y + c12rCy);
        ctx.stroke();
      }
      break;
    
    case 'c1-2-l':
      // Like c2-1-r but right cell has circle instead of line
      {
        const c12lCy = h / 2;
        const c12lLeftCenterX = cellWidth / 2;
        const c12lRightCellStart = cellWidth * 2;
        // Left cell: diagonal top-left to bottom-right + line from bottom-left to center
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + cellWidth - padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + padding, y + h - padding);
        ctx.lineTo(x + c12lLeftCenterX, y + c12lCy);
        ctx.stroke();
        // Right cell: diagonal top-left to bottom-right + small black circle
        ctx.beginPath();
        ctx.moveTo(x + c12lRightCellStart + padding, y + padding);
        ctx.lineTo(x + totalWidth - padding, y + h - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + totalWidth - padding - 4, y + padding + 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    
    case 'c1-2-1-r':
    case 'c1-2-1-l':
      // Simplified versions for 4 cell cables
      const lines = symbolId.includes('-r') ? 
        [[0, h-padding, totalWidth, padding], [0, padding, totalWidth, h-padding]] :
        [[0, padding, totalWidth, h-padding], [0, h-padding, totalWidth, padding]];
      lines.forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x + x1 + padding, y + y1);
        ctx.lineTo(x + x2 - padding, y + y2);
        ctx.stroke();
      });
      break;
    
    default:
      break;
  }
}

export default App;
