import { useRef, useState } from 'react';
import { renderSymbol, renderCableSymbol, getSymbolWidth, CABLE_SYMBOLS } from './SymbolPalette';
import './Grid.css';

export default function Grid({ 
  width = 50, 
  height = 50, 
  grid, 
  setGrid, 
  selectedColor,
  selectedSymbol = 'knit',
  cellWidth: baseCellWidth = 20,
  cellHeight: baseCellHeight = 15,
  topToBottom = true,
  showThickLines = true,
  selection,
  setSelection,
  clipboard,
  zoom = 1
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const svgRef = useRef(null);
  
  // Apply zoom to cell dimensions
  const cellWidth = baseCellWidth * zoom;
  const cellHeight = baseCellHeight * zoom;
  
  const handleCellClick = (row, col) => {
    // Get symbol info at click time
    const symWidth = getSymbolWidth(selectedSymbol);
    const isCableSymbol = CABLE_SYMBOLS.some(c => c.id === selectedSymbol);
    
    // For cables, check if there's enough space
    if (isCableSymbol && col + symWidth > width) {
      return; // Not enough space for cable
    }

    const newGrid = grid.map((r, ri) => {
      if (ri !== row) return r;
      
      return r.map((c, ci) => {
        if (isCableSymbol) {
          // Multi-cell cable symbol
          if (ci === col) {
            // Anchor cell - stores the symbol
            return { color: selectedColor, symbol: selectedSymbol };
          } else if (ci > col && ci < col + symWidth) {
            // Part of the cable - mark as continuation
            return { color: selectedColor, symbol: `_cable_${col}` };
          }
        } else if (ci === col) {
          // Single cell symbol
          return { color: selectedColor, symbol: selectedSymbol };
        }
        return c;
      });
    });
    setGrid(newGrid);
  };
  
  const isCable = CABLE_SYMBOLS.some(c => c.id === selectedSymbol);

  const handleMouseDown = (row, col, e) => {
    // Shift+click starts selection
    if (e.shiftKey) {
      setIsSelecting(true);
      setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
      return;
    }
    
    // Clear selection when painting
    if (selection) {
      setSelection(null);
    }
    
    // Only enable drag for non-cable symbols
    if (!isCable) {
      setIsDrawing(true);
    }
    handleCellClick(row, col);
  };

  const handleMouseEnter = (row, col) => {
    if (isSelecting) {
      setSelection(prev => prev ? { ...prev, endRow: row, endCol: col } : null);
      return;
    }
    if (isDrawing && !isCable) {
      handleCellClick(row, col);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsSelecting(false);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    setIsSelecting(false);
  };
  
  // Check if a cell is within the selection
  const isCellSelected = (row, col) => {
    if (!selection) return false;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  const LABEL_SIZE = 24;
  const TOP_PADDING = 16; // Space for center marker
  const gridWidth = width * cellWidth;
  const gridHeight = height * cellHeight;
  const totalWidth = gridWidth + LABEL_SIZE;
  const totalHeight = gridHeight + LABEL_SIZE + TOP_PADDING;

  // Find all cables to render them properly
  const getCableInfo = (row, col) => {
    const cell = grid[row][col];
    if (!cell.symbol) return null;
    
    // Check if this is a cable anchor
    const cable = CABLE_SYMBOLS.find(c => c.id === cell.symbol);
    if (cable) {
      return { isCableStart: true, symbol: cell.symbol, width: cable.width };
    }
    
    // Check if this is part of a cable (continuation)
    if (cell.symbol.startsWith('_cable_')) {
      return { isCablePart: true };
    }
    
    return null;
  };

  return (
    <div className="grid-container">
      <svg
        ref={svgRef}
        width={totalWidth}
        height={totalHeight}
        className="knitting-grid"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Center marker - triangle at top */}
        <polygon
          points={`${gridWidth / 2 - 10},0 ${gridWidth / 2 + 10},0 ${gridWidth / 2},15`}
          fill="#4169E1"
        />

        {/* Grid content shifted down for marker */}
        <g transform={`translate(0, ${TOP_PADDING})`}>
        
        {/* Pass 1: Cell backgrounds */}
        <g>
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <rect
                key={`bg-${rowIndex}-${colIndex}`}
                x={colIndex * cellWidth}
                y={rowIndex * cellHeight}
                width={cellWidth}
                height={cellHeight}
                fill={cell.color}
                stroke={isCellSelected(rowIndex, colIndex) ? "#4169E1" : "#2a2a2a"}
                strokeWidth={isCellSelected(rowIndex, colIndex) ? "2" : "0.5"}
                className="grid-cell"
                onMouseDown={(e) => handleMouseDown(rowIndex, colIndex, e)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
              />
            ))
          )}
        </g>
        
        {/* Selection overlay */}
        {selection && (
          <rect
            x={Math.min(selection.startCol, selection.endCol) * cellWidth}
            y={Math.min(selection.startRow, selection.endRow) * cellHeight}
            width={(Math.abs(selection.endCol - selection.startCol) + 1) * cellWidth}
            height={(Math.abs(selection.endRow - selection.startRow) + 1) * cellHeight}
            fill="rgba(65, 105, 225, 0.2)"
            stroke="#4169E1"
            strokeWidth="2"
            strokeDasharray="4,2"
            style={{ pointerEvents: 'none' }}
          />
        )}
        
        {/* Pass 2: Symbols (rendered on top of all backgrounds) */}
        <g style={{ pointerEvents: 'none' }}>
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const cableInfo = getCableInfo(rowIndex, colIndex);
              
              // Single-cell symbol
              if (cell.symbol && cell.symbol !== 'knit' && !cableInfo) {
                return (
                  <g 
                    key={`sym-${rowIndex}-${colIndex}`}
                    transform={`translate(${colIndex * cellWidth}, ${rowIndex * cellHeight})`}
                  >
                    {renderSymbol(cell.symbol, cellWidth, cellHeight)}
                  </g>
                );
              }
              
              // Cable symbol - only render from anchor cell
              if (cableInfo?.isCableStart) {
                const cableTotalWidth = cableInfo.width * cellWidth;
                return (
                  <g 
                    key={`cable-${rowIndex}-${colIndex}`}
                    transform={`translate(${colIndex * cellWidth}, ${rowIndex * cellHeight})`}
                  >
                    {/* White background to hide grid lines */}
                    <rect 
                      x={1} 
                      y={1} 
                      width={cableTotalWidth - 2} 
                      height={cellHeight - 2} 
                      fill={cell.color || '#FFFFFF'}
                      stroke="none"
                    />
                    {renderCableSymbol(cableInfo.symbol, cableTotalWidth, cellHeight, cellWidth)}
                  </g>
                );
              }
              
              return null;
            })
          )}
        </g>

        {/* Column numbers at bottom */}
        <g transform={`translate(0, ${gridHeight})`}>
          {Array.from({ length: width }, (_, i) => (
            <text
              key={`col-${i}`}
              x={i * cellWidth + cellWidth / 2}
              y={LABEL_SIZE - 6}
              textAnchor="middle"
              className="grid-label"
              fontSize={width > 60 ? "8" : "10"}
            >
              {topToBottom ? i + 1 : width - i}
            </text>
          ))}
        </g>

        {/* Row numbers on right */}
        <g transform={`translate(${gridWidth}, 0)`}>
          {Array.from({ length: height }, (_, i) => (
            <text
              key={`row-${i}`}
              x={4}
              y={i * cellHeight + cellHeight / 2 + 3}
              textAnchor="start"
              className="grid-label"
              fontSize={height > 60 ? "8" : "10"}
            >
              {topToBottom ? i + 1 : height - i}
            </text>
          ))}
        </g>

        {/* Thick vertical lines every 10 columns */}
        {showThickLines && (
          <g>
            {Array.from({ length: Math.floor((width - 1) / 10) }, (_, i) => {
              const k = (i + 1) * 10;
              const pos = topToBottom ? k : width - k;
              return (
                <line
                  key={`vline-${i}`}
                  x1={pos * cellWidth}
                  y1={0}
                  x2={pos * cellWidth}
                  y2={gridHeight}
                  stroke="#888"
                  strokeWidth="2"
                />
              );
            })}
          </g>
        )}

        {/* Thick horizontal lines every 10 rows */}
        {showThickLines && (
          <g>
            {Array.from({ length: Math.floor((height - 1) / 10) }, (_, i) => {
              const k = (i + 1) * 10;
              const pos = topToBottom ? k : height - k;
              return (
                <line
                  key={`hline-${i}`}
                  x1={0}
                  y1={pos * cellHeight}
                  x2={gridWidth}
                  y2={pos * cellHeight}
                  stroke="#888"
                  strokeWidth="2"
                />
              );
            })}
          </g>
        )}
        </g>
      </svg>
    </div>
  );
}
