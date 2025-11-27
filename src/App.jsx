import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Grid from './components/Grid';
import ColorPalette from './components/ColorPalette';
import SymbolPalette, { CABLE_SYMBOLS, KNITTING_SYMBOLS } from './components/SymbolPalette';
import Toolbar from './components/Toolbar';
import ImageUpload from './components/ImageUpload';
import SweaterGenerator from './components/SweaterGenerator';
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
  const [grid, setGridInternal] = useState(() => createEmptyGrid(DEFAULT_WIDTH, DEFAULT_HEIGHT));
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [selectedColor, setSelectedColor] = useState('#000080'); // Marineblå
  const [recentColors, setRecentColors] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('knit');
  const [topToBottom, setTopToBottom] = useState(true);
  const [showThickLines, setShowThickLines] = useState(true);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showSweaterGenerator, setShowSweaterGenerator] = useState(false);
  const [selection, setSelection] = useState(null); // { startRow, startCol, endRow, endCol }
  const [clipboard, setClipboard] = useState(null); // Copied cells data
  const [zoom, setZoom] = useState(1);
  const gridRef = useRef(null);
  const isUndoRedoAction = useRef(false);
  
  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
  const handleZoomReset = () => setZoom(1);

  // Wrapper for setGrid that saves history
  const setGrid = useCallback((newGridOrUpdater) => {
    if (isUndoRedoAction.current) {
      // Don't save history for undo/redo actions
      setGridInternal(newGridOrUpdater);
      return;
    }
    
    setGridInternal(prevGrid => {
      const newGrid = typeof newGridOrUpdater === 'function' 
        ? newGridOrUpdater(prevGrid) 
        : newGridOrUpdater;
      
      // Save current grid to history
      setHistory(prev => [...prev.slice(-50), prevGrid]); // Keep last 50 states
      setFuture([]); // Clear redo stack on new action
      
      return newGrid;
    });
  }, []);

  // Undo function
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    
    isUndoRedoAction.current = true;
    const previousGrid = history[history.length - 1];
    
    setHistory(prev => prev.slice(0, -1));
    setFuture(prev => [grid, ...prev]);
    setGridInternal(previousGrid);
    
    // Also update grid dimensions if they changed
    if (previousGrid.length !== grid.length || previousGrid[0]?.length !== grid[0]?.length) {
      setGridHeight(previousGrid.length);
      setGridWidth(previousGrid[0]?.length || DEFAULT_WIDTH);
    }
    
    setTimeout(() => { isUndoRedoAction.current = false; }, 0);
  }, [history, grid]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    
    isUndoRedoAction.current = true;
    const nextGrid = future[0];
    
    setFuture(prev => prev.slice(1));
    setHistory(prev => [...prev, grid]);
    setGridInternal(nextGrid);
    
    // Also update grid dimensions if they changed
    if (nextGrid.length !== grid.length || nextGrid[0]?.length !== grid[0]?.length) {
      setGridHeight(nextGrid.length);
      setGridWidth(nextGrid[0]?.length || DEFAULT_WIDTH);
    }
    
    setTimeout(() => { isUndoRedoAction.current = false; }, 0);
  }, [future, grid]);

  // Copy selected cells
  const handleCopy = useCallback(() => {
    if (!selection) return;
    
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    
    const copiedCells = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row = [];
      for (let c = minCol; c <= maxCol; c++) {
        row.push({ ...grid[r][c] });
      }
      copiedCells.push(row);
    }
    
    setClipboard(copiedCells);
  }, [selection, grid]);

  // Paste clipboard at selection start
  const handlePaste = useCallback(() => {
    if (!clipboard || !selection) return;
    
    const startRow = Math.min(selection.startRow, selection.endRow);
    const startCol = Math.min(selection.startCol, selection.endCol);
    
    const newGrid = grid.map((row, rowIndex) => 
      row.map((cell, colIndex) => {
        const pasteRow = rowIndex - startRow;
        const pasteCol = colIndex - startCol;
        
        if (pasteRow >= 0 && pasteRow < clipboard.length &&
            pasteCol >= 0 && pasteCol < clipboard[0].length) {
          return { ...clipboard[pasteRow][pasteCol] };
        }
        return cell;
      })
    );
    
    setGrid(newGrid);
  }, [clipboard, selection, grid, setGrid]);

  // Paste clipboard mirrored (horizontally flipped)
  const handlePasteMirrored = useCallback(() => {
    if (!clipboard || !selection) return;
    
    const startRow = Math.min(selection.startRow, selection.endRow);
    const startCol = Math.min(selection.startCol, selection.endCol);
    const clipboardWidth = clipboard[0].length;
    
    const newGrid = grid.map((row, rowIndex) => 
      row.map((cell, colIndex) => {
        const pasteRow = rowIndex - startRow;
        const pasteCol = colIndex - startCol;
        
        if (pasteRow >= 0 && pasteRow < clipboard.length &&
            pasteCol >= 0 && pasteCol < clipboardWidth) {
          // Mirror: take from the opposite side
          const mirroredCol = clipboardWidth - 1 - pasteCol;
          return { ...clipboard[pasteRow][mirroredCol] };
        }
        return cell;
      })
    );
    
    setGrid(newGrid);
  }, [clipboard, selection, grid, setGrid]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        if (selection) {
          e.preventDefault();
          handleCopy();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'v' && e.shiftKey) {
        if (clipboard && selection) {
          e.preventDefault();
          handlePasteMirrored();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'v' && !e.shiftKey) {
        if (clipboard && selection) {
          e.preventDefault();
          handlePaste();
        }
      } else if (e.key === 'Escape') {
        handleClearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleCopy, handlePaste, handlePasteMirrored, handleClearSelection, selection, clipboard]);

  const handleNewPattern = useCallback(() => {
    setGrid(createEmptyGrid(gridWidth, gridHeight));
  }, [gridWidth, gridHeight]);

  const handleClear = useCallback(() => {
    setGrid(createEmptyGrid(grid[0].length, grid.length));
  }, [grid]);

  // Swap all occurrences of one color with another
  const handleSwapColors = useCallback((fromColor, toColor) => {
    setGrid(prevGrid => {
      return prevGrid.map(row => 
        row.map(cell => ({
          ...cell,
          color: cell.color.toUpperCase() === fromColor.toUpperCase() ? toColor : cell.color
        }))
      );
    });
  }, [setGrid]);

  // Get all unique colors used in the grid
  const usedColors = useMemo(() => {
    const colors = new Set();
    grid.forEach(row => {
      row.forEach(cell => {
        colors.add(cell.color.toUpperCase());
      });
    });
    return Array.from(colors).sort();
  }, [grid]);

  const handleImageProcessed = useCallback((newGrid, newWidth, newHeight) => {
    setGridWidth(newWidth);
    setGridHeight(newHeight);
    setGrid(newGrid);
  }, []);

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

    // Download the main pattern image
    const timestamp = Date.now();
    const link = document.createElement('a');
    link.download = `strikkeoppskrift-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    // Find all unique symbols used in the grid (excluding 'knit' and cable parts)
    const usedSymbolIds = new Set();
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.symbol && cell.symbol !== 'knit' && !cell.symbol.startsWith('_cable_')) {
          usedSymbolIds.add(cell.symbol);
        }
      });
    });

    // If there are symbols used, create a legend image
    if (usedSymbolIds.size > 0) {
      const allSymbols = [...KNITTING_SYMBOLS, ...CABLE_SYMBOLS];
      const usedSymbols = allSymbols.filter(s => usedSymbolIds.has(s.id));

      if (usedSymbols.length > 0) {
        // Create legend canvas
        const legendCanvas = document.createElement('canvas');
        const legendCtx = legendCanvas.getContext('2d');
        
        const rowHeight = 45;
        const legendWidth = 600;
        const legendHeight = 60 + usedSymbols.length * rowHeight;
        
        legendCanvas.width = legendWidth;
        legendCanvas.height = legendHeight;

        // Fill background
        legendCtx.fillStyle = '#ffffff';
        legendCtx.fillRect(0, 0, legendWidth, legendHeight);

        // Draw title
        legendCtx.fillStyle = '#1a1a1a';
        legendCtx.font = 'bold 18px sans-serif';
        legendCtx.fillText('Symbolforklaring', 20, 35);

        // Draw each symbol
        usedSymbols.forEach((symbol, index) => {
          const y = 60 + index * rowHeight;
          
          // Calculate box width based on symbol width
          const symbolCells = symbol.width || 1;
          const boxWidth = symbolCells * 20;
          const textStartX = 20 + boxWidth + 15;
          
          // Draw symbol box background
          legendCtx.fillStyle = '#ffffff';
          legendCtx.fillRect(20, y, boxWidth, 30);
          legendCtx.strokeStyle = '#ccc';
          legendCtx.lineWidth = 1;
          legendCtx.strokeRect(20, y, boxWidth, 30);
          
          // Draw cell dividers for multi-cell symbols
          if (symbolCells > 1) {
            for (let i = 1; i < symbolCells; i++) {
              legendCtx.beginPath();
              legendCtx.moveTo(20 + i * 20, y);
              legendCtx.lineTo(20 + i * 20, y + 30);
              legendCtx.strokeStyle = '#ddd';
              legendCtx.stroke();
            }
          }

          // Draw the symbol
          const symbolY = y + (30 - 15) / 2;
          
          if (symbol.width && symbol.width > 1) {
            // Cable symbol
            drawCableOnCanvas(legendCtx, symbol.id, 20, symbolY, boxWidth, 15, 20);
          } else {
            // Single-cell symbol
            drawSymbolOnCanvas(legendCtx, symbol.id, 20, symbolY, 20, 15);
          }

          // Draw name and description on same line
          legendCtx.fillStyle = '#1a1a1a';
          legendCtx.font = '14px sans-serif';
          const nameText = symbol.name;
          legendCtx.fillText(nameText, textStartX, y + 20);
          
          // Add description after name
          const nameWidth = legendCtx.measureText(nameText).width;
          legendCtx.fillStyle = '#666';
          legendCtx.font = '12px sans-serif';
          const description = symbol.description ? ` – ${symbol.description}` : '';
          const maxWidth = legendWidth - textStartX - nameWidth - 10;
          let displayText = description;
          while (legendCtx.measureText(displayText).width > maxWidth && displayText.length > 0) {
            displayText = displayText.slice(0, -1);
          }
          if (displayText !== description && displayText.length > 0) displayText += '...';
          legendCtx.fillText(displayText, textStartX + nameWidth, y + 20);
        });

        // Download legend image
        setTimeout(() => {
          const legendLink = document.createElement('a');
          legendLink.download = `symbolforklaring-${timestamp}.png`;
          legendLink.href = legendCanvas.toDataURL('image/png');
          legendLink.click();
        }, 500);
      }
    }
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
            onSwapColors={handleSwapColors}
            usedColors={usedColors}
          />
          <SymbolPalette
            selectedSymbol={selectedSymbol}
            setSelectedSymbol={setSelectedSymbol}
          />
        </aside>
        
        <section className="canvas-area" ref={gridRef}>
          {/* Zoom controls - fixed position */}
          <div className="zoom-controls">
            <button onClick={handleZoomOut} title="Zoom ut" disabled={zoom <= 0.25}>−</button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} title="Zoom inn" disabled={zoom >= 3}>+</button>
            <button onClick={handleZoomReset} title="Tilbakestill zoom" className="zoom-reset">⟲</button>
          </div>
          
          <div className="grid-scroll-container">
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
              selection={selection}
              setSelection={setSelection}
              clipboard={clipboard}
              zoom={zoom}
            />
      </div>
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
            onOpenImageUpload={() => setShowImageUpload(true)}
            onOpenSweaterGenerator={() => setShowSweaterGenerator(true)}
            topToBottom={topToBottom}
            setTopToBottom={setTopToBottom}
            showThickLines={showThickLines}
            setShowThickLines={setShowThickLines}
          />
        </aside>
      </main>

      {showImageUpload && (
        <ImageUpload
          onImageProcessed={handleImageProcessed}
          onClose={() => setShowImageUpload(false)}
        />
      )}

      {showSweaterGenerator && (
        <SweaterGenerator
          grid={grid}
          onClose={() => setShowSweaterGenerator(false)}
        />
      )}
      
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
