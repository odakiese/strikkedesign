import { useState, useRef } from 'react';
import './ImageUpload.css';

// Yarn colors for custom palette selection
const YARN_COLORS = [
  { name: 'Hvit', hex: '#FFFFFF' },
  { name: 'Kremhvit', hex: '#FFFDD0' },
  { name: 'Lys grå', hex: '#C0C0C0' },
  { name: 'Mellomgrå', hex: '#808080' },
  { name: 'Koksgrå', hex: '#36454F' },
  { name: 'Svart', hex: '#1a1a1a' },
  { name: 'Marineblå', hex: '#000080' },
  { name: 'Kongeblå', hex: '#4169E1' },
  { name: 'Himmelblå', hex: '#87CEEB' },
  { name: 'Dus rosa', hex: '#FFB6C1' },
  { name: 'Bringebær', hex: '#E30B5C' },
  { name: 'Burgunder', hex: '#800020' },
  { name: 'Rust', hex: '#B7410E' },
  { name: 'Terrakotta', hex: '#E2725B' },
  { name: 'Sennep', hex: '#FFDB58' },
  { name: 'Honning', hex: '#EB9605' },
  { name: 'Skoggrønn', hex: '#228B22' },
  { name: 'Jadegrønn', hex: '#00A86B' },
  { name: 'Dus mint', hex: '#98FF98' },
  { name: 'Lavendel', hex: '#E6E6FA' },
  { name: 'Plomme', hex: '#8E4585' },
  { name: 'Korall', hex: '#FF7F50' },
  { name: 'Kamel', hex: '#C19A6B' },
  { name: 'Sjokolade', hex: '#7B3F00' },
];

export default function ImageUpload({ onImageProcessed, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [maxWidth, setMaxWidth] = useState(50);
  const [maxHeight, setMaxHeight] = useState(50);
  const [colorCount, setColorCount] = useState(3);
  const [resultSize, setResultSize] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [paletteMode, setPaletteMode] = useState('auto'); // 'auto' or 'custom'
  const [customPalette, setCustomPalette] = useState([]); // Array of hex colors
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      
      // Calculate result size
      const img = new Image();
      img.onload = () => {
        setOriginalSize({ width: img.width, height: img.height });
        calculateResultSize(img.width, img.height, maxWidth, maxHeight);
      };
      img.src = url;
    }
  };

  const calculateResultSize = (imgWidth, imgHeight, maxW, maxH) => {
    const aspectRatio = imgWidth / imgHeight;
    let resultW, resultH;
    
    if (imgWidth / maxW > imgHeight / maxH) {
      // Width is the constraint
      resultW = maxW;
      resultH = Math.round(maxW / aspectRatio);
    } else {
      // Height is the constraint
      resultH = maxH;
      resultW = Math.round(maxH * aspectRatio);
    }
    
    setResultSize({ width: resultW, height: resultH });
  };

  const handleMaxWidthChange = (value) => {
    const newMax = Math.max(1, Math.min(200, parseInt(value) || 1));
    setMaxWidth(newMax);
    if (preview) {
      const img = new Image();
      img.onload = () => calculateResultSize(img.width, img.height, newMax, maxHeight);
      img.src = preview;
    }
  };

  const handleMaxHeightChange = (value) => {
    const newMax = Math.max(1, Math.min(200, parseInt(value) || 1));
    setMaxHeight(newMax);
    if (preview) {
      const img = new Image();
      img.onload = () => calculateResultSize(img.width, img.height, maxWidth, newMax);
      img.src = preview;
    }
  };

  const handleColorCountChange = (value) => {
    const count = Math.max(0, Math.min(50, parseInt(value) || 0));
    setColorCount(count);
  };

  // Custom palette functions
  const addToCustomPalette = (hex) => {
    if (!customPalette.includes(hex)) {
      setCustomPalette([...customPalette, hex]);
    }
  };

  const removeFromCustomPalette = (hex) => {
    setCustomPalette(customPalette.filter(c => c !== hex));
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Simple quantization using custom palette
  const quantizeWithCustomPalette = (pixels, width, height, palette) => {
    const paletteRgb = palette.map(hexToRgb);
    const quantized = [];
    
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const pixel = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
        
        // Find nearest palette color
        let minDist = Infinity;
        let closestColor = paletteRgb[0];
        paletteRgb.forEach(p => {
          const dist = colorDistance(pixel, p);
          if (dist < minDist) {
            minDist = dist;
            closestColor = p;
          }
        });
        
        row.push(closestColor);
      }
      quantized.push(row);
    }
    
    return quantized;
  };

  // Simple color distance function
  const colorDistance = (c1, c2) => {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  };

  // Get color saturation (how "colorful" it is - high for red, low for grey)
  const getColorSaturation = (c) => {
    const max = Math.max(c.r, c.g, c.b);
    const min = Math.min(c.r, c.g, c.b);
    if (max === 0) return 0;
    return (max - min) / max;
  };

  // Find distinct colors using TWO-PASS approach
  const findDistinctColors = (colors, numColors) => {
    // ===== PASS 1: Find MAIN colors using large buckets =====
    const mainBuckets = {};
    const largeBucketSize = 60;
    
    colors.forEach(c => {
      const key = `${Math.floor(c.r/largeBucketSize)*largeBucketSize},${Math.floor(c.g/largeBucketSize)*largeBucketSize},${Math.floor(c.b/largeBucketSize)*largeBucketSize}`;
      if (!mainBuckets[key]) {
        mainBuckets[key] = { count: 0, totalR: 0, totalG: 0, totalB: 0 };
      }
      mainBuckets[key].count++;
      mainBuckets[key].totalR += c.r;
      mainBuckets[key].totalG += c.g;
      mainBuckets[key].totalB += c.b;
    });
    
    let mainColors = Object.values(mainBuckets).map(data => ({
      r: Math.round(data.totalR / data.count),
      g: Math.round(data.totalG / data.count),
      b: Math.round(data.totalB / data.count),
      count: data.count,
      saturation: getColorSaturation({
        r: Math.round(data.totalR / data.count),
        g: Math.round(data.totalG / data.count),
        b: Math.round(data.totalB / data.count)
      })
    }));
    
    // ===== PASS 2: Hunt for SATURATED colors using small buckets =====
    const satBuckets = {};
    const smallBucketSize = 25;
    
    colors.forEach(c => {
      const sat = getColorSaturation(c);
      if (sat > 0.35) { // Only track saturated pixels
        const key = `${Math.floor(c.r/smallBucketSize)*smallBucketSize},${Math.floor(c.g/smallBucketSize)*smallBucketSize},${Math.floor(c.b/smallBucketSize)*smallBucketSize}`;
        if (!satBuckets[key]) {
          satBuckets[key] = { count: 0, totalR: 0, totalG: 0, totalB: 0 };
        }
        satBuckets[key].count++;
        satBuckets[key].totalR += c.r;
        satBuckets[key].totalG += c.g;
        satBuckets[key].totalB += c.b;
      }
    });
    
    let saturatedColors = Object.values(satBuckets).map(data => ({
      r: Math.round(data.totalR / data.count),
      g: Math.round(data.totalG / data.count),
      b: Math.round(data.totalB / data.count),
      count: data.count,
      saturation: getColorSaturation({
        r: Math.round(data.totalR / data.count),
        g: Math.round(data.totalG / data.count),
        b: Math.round(data.totalB / data.count)
      })
    })).filter(c => c.count >= 3); // Need at least 3 pixels
    
    // Sort main colors by frequency, saturated by saturation
    mainColors.sort((a, b) => b.count - a.count);
    saturatedColors.sort((a, b) => b.saturation - a.saturation);
    
    // ===== BUILD PALETTE =====
    const palette = [{ r: 255, g: 255, b: 255 }]; // White background
    
    // Add main colors (skip white and grey)
    for (const c of mainColors) {
      if (palette.length >= numColors) break; // Leave room for saturated color
      
      // Skip near-white
      if (c.r > 220 && c.g > 220 && c.b > 220) continue;
      
      // Skip grey (anti-aliasing)
      const brightness = (c.r + c.g + c.b) / 3;
      if (c.saturation < 0.12 && brightness > 40 && brightness < 210) continue;
      
      // Check distinct
      const isDup = palette.some(p => colorDistance(p, c) < 70);
      if (!isDup) {
        // Snap to clean colors
        if (c.r < 50 && c.g < 50 && c.b < 50) {
          palette.push({ r: 0, g: 0, b: 0 }); // Pure black
        } else if (c.saturation < 0.3 && c.r > 150) {
          palette.push({ r: 235, g: 210, b: 175 }); // Clean beige
        } else {
          palette.push({ r: c.r, g: c.g, b: c.b });
        }
      }
    }
    
    // ALWAYS reserve last slot for most saturated color (like red tongue!)
    if (saturatedColors.length > 0 && palette.length <= numColors) {
      const mostSaturated = saturatedColors[0];
      const isDup = palette.some(p => colorDistance(p, mostSaturated) < 50);
      if (!isDup) {
        // Snap red colors to clean red
        if (mostSaturated.r > mostSaturated.g && mostSaturated.r > mostSaturated.b) {
          palette.push({ r: 205, g: 50, b: 50 }); // Clean red
        } else {
          palette.push({ r: mostSaturated.r, g: mostSaturated.g, b: mostSaturated.b });
        }
      }
    }
    
    // Fill remaining with main colors if needed
    for (const c of mainColors) {
      if (palette.length >= numColors + 1) break;
      const isDup = palette.some(p => colorDistance(p, c) < 70);
      if (!isDup && c.r < 220) {
        palette.push({ r: c.r, g: c.g, b: c.b });
      }
    }
    
    // If we don't have enough colors, add black as fallback
    while (palette.length < numColors + 1) {
      palette.push({ r: 0, g: 0, b: 0 });
    }
    
    return palette;
  };

  // Color quantization using distinct color finding
  const quantizeColors = (pixels, width, height, numColors) => {
    // Collect all colors
    const colors = [];
    for (let i = 0; i < pixels.length; i += 4) {
      colors.push({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
    }

    // Find the most distinct colors in the image
    const palette = findDistinctColors(colors, numColors);

    // Map each pixel to nearest palette color (with smart anti-aliasing handling)
    const quantized = [];
    
    // Find which palette colors are "special" (black, white, saturated)
    const blackInPalette = palette.find(p => p.r < 30 && p.g < 30 && p.b < 30);
    const whiteInPalette = palette.find(p => p.r > 240 && p.g > 240 && p.b > 240);
    const redInPalette = palette.find(p => p.r > 150 && p.g < 100 && p.b < 100);
    
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const i = (y * width + x);
        const color = colors[i];
        const brightness = (color.r + color.g + color.b) / 3;
        const saturation = getColorSaturation(color);
        
        let closestColor;
        
        // Rule 1: Very dark pixels → black (even if brownish/reddish)
        if (brightness < 60 && blackInPalette) {
          closestColor = blackInPalette;
        }
        // Rule 2: Very light pixels → white
        else if (brightness > 230 && whiteInPalette) {
          closestColor = whiteInPalette;
        }
        // Rule 3: Only assign to RED if it's actually bright and saturated red
        else if (redInPalette && saturation > 0.4 && color.r > 150 && color.r > color.g * 1.5 && color.r > color.b * 1.5) {
          closestColor = redInPalette;
        }
        // Rule 4: Everything else → find nearest by color distance
        else {
          let minDist = Infinity;
          closestColor = palette[0];
          palette.forEach(p => {
            // Skip red for non-saturated pixels
            if (redInPalette && p === redInPalette && saturation < 0.35) return;
            
            const dist = colorDistance(color, p);
            if (dist < minDist) {
              minDist = dist;
              closestColor = p;
            }
          });
        }
        
        row.push(closestColor);
      }
      quantized.push(row);
    }

    return quantized;
  };

  const handleGenerate = () => {
    if (!preview || !resultSize) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = resultSize.width;
      canvas.height = resultSize.height;
      
      // Fill with white background first (for transparent images like SVGs)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, resultSize.width, resultSize.height);
      
      // Draw image scaled to result size
      ctx.drawImage(img, 0, 0, resultSize.width, resultSize.height);
      
      // Get pixel data
      const imageData = ctx.getImageData(0, 0, resultSize.width, resultSize.height);
      const pixels = imageData.data;
      
      // Convert to grid format
      const newGrid = [];
      
      if (paletteMode === 'custom' && customPalette.length > 0) {
        // Use custom palette
        const quantized = quantizeWithCustomPalette(pixels, resultSize.width, resultSize.height, customPalette);
        
        for (let y = 0; y < resultSize.height; y++) {
          const row = [];
          for (let x = 0; x < resultSize.width; x++) {
            const color = quantized[y][x];
            const hex = rgbToHex(color.r, color.g, color.b);
            row.push({ color: hex, symbol: 'knit' });
          }
          newGrid.push(row);
        }
      } else if (colorCount >= 1) {
        // Auto-detect colors with specified count
        const quantized = quantizeColors(pixels, resultSize.width, resultSize.height, colorCount);
        
        for (let y = 0; y < resultSize.height; y++) {
          const row = [];
          for (let x = 0; x < resultSize.width; x++) {
            const color = quantized[y][x];
            const hex = rgbToHex(color.r, color.g, color.b);
            row.push({ color: hex, symbol: 'knit' });
          }
          newGrid.push(row);
        }
      } else {
        // No quantization (0 = unlimited), use original colors
        for (let y = 0; y < resultSize.height; y++) {
          const row = [];
          for (let x = 0; x < resultSize.width; x++) {
            const i = (y * resultSize.width + x) * 4;
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const hex = rgbToHex(r, g, b);
            row.push({ color: hex, symbol: 'knit' });
          }
          newGrid.push(row);
        }
      }
      
      onImageProcessed(newGrid, resultSize.width, resultSize.height);
      onClose();
    };
    img.src = preview;
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  return (
    <div className="image-upload-overlay" onClick={onClose}>
      <div className="image-upload-modal" onClick={e => e.stopPropagation()}>
        <h2>📷 Last opp bilde</h2>
        
        <div className="upload-area">
          {preview ? (
            <div className="preview-container">
              <img src={preview} alt="Preview" className="image-preview" />
            </div>
          ) : (
            <div 
              className="drop-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="drop-icon">🖼️</span>
              <p>Klikk for å velge bilde</p>
              <p className="drop-hint">eller dra og slipp</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {preview && (
          <>
            {originalSize && (
              <div className="image-info">
                Originalstørrelse: {originalSize.width} × {originalSize.height} px
                <span className="aspect-ratio">
                  (forhold: {(originalSize.width / originalSize.height).toFixed(2)})
                </span>
              </div>
            )}
            <button 
              className="change-image-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Velg annet bilde
            </button>
          </>
        )}

        <div className="size-controls">
          <div className="size-input">
            <label>Maks bredde:</label>
            <input
              type="number"
              value={maxWidth}
              onChange={(e) => handleMaxWidthChange(e.target.value)}
              min="1"
              max="200"
            />
            <span>masker</span>
          </div>
          <div className="size-input">
            <label>Maks høyde:</label>
            <input
              type="number"
              value={maxHeight}
              onChange={(e) => handleMaxHeightChange(e.target.value)}
              min="1"
              max="200"
            />
            <span>omganger</span>
          </div>
        </div>

        <div className="palette-mode-section">
          <label className="section-label">Fargevalg:</label>
          <div className="palette-mode-toggle">
            <button 
              className={`mode-btn ${paletteMode === 'auto' ? 'active' : ''}`}
              onClick={() => setPaletteMode('auto')}
            >
              🎨 Auto-detekter
            </button>
            <button 
              className={`mode-btn ${paletteMode === 'custom' ? 'active' : ''}`}
              onClick={() => setPaletteMode('custom')}
            >
              🧶 Velg farger
            </button>
          </div>
        </div>

        {paletteMode === 'auto' ? (
          <div className="color-control">
            <div className="size-input">
              <label>Antall farger:</label>
              <input
                type="number"
                value={colorCount}
                onChange={(e) => handleColorCountChange(e.target.value)}
                min="0"
                max="50"
                placeholder="0"
              />
              <span className="color-hint">{colorCount === 0 ? '(alle farger)' : `(hvit + ${colorCount} farger)`}</span>
            </div>
          </div>
        ) : (
          <div className="custom-palette-section">
            <label className="section-label">Velg dine garnfarger:</label>
            
            {/* Selected colors */}
            {customPalette.length > 0 && (
              <div className="selected-colors">
                <span className="selected-label">Valgte farger ({customPalette.length}):</span>
                <div className="selected-colors-list">
                  {customPalette.map(hex => {
                    const color = YARN_COLORS.find(c => c.hex === hex);
                    return (
                      <div key={hex} className="selected-color-item">
                        <span 
                          className="color-dot" 
                          style={{ backgroundColor: hex }}
                          title={color?.name || hex}
                        />
                        <button 
                          className="remove-color-btn"
                          onClick={() => removeFromCustomPalette(hex)}
                          title="Fjern farge"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Available yarn colors */}
            <div className="yarn-colors-grid">
              {YARN_COLORS.map(color => (
                <button
                  key={color.hex}
                  className={`yarn-color-btn ${customPalette.includes(color.hex) ? 'selected' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => customPalette.includes(color.hex) 
                    ? removeFromCustomPalette(color.hex) 
                    : addToCustomPalette(color.hex)
                  }
                  title={color.name}
                />
              ))}
            </div>
            
            {/* Custom color picker */}
            <div className="custom-color-picker">
              <label>Egendefinert farge:</label>
              <div className="custom-color-input">
                <input
                  type="color"
                  id="customColorInput"
                  defaultValue="#FF0000"
                />
                <button 
                  className="add-custom-color-btn"
                  onClick={() => {
                    const input = document.getElementById('customColorInput');
                    if (input && !customPalette.includes(input.value.toUpperCase())) {
                      addToCustomPalette(input.value.toUpperCase());
                    }
                  }}
                >
                  + Legg til
                </button>
              </div>
            </div>
            
            {customPalette.length === 0 && (
              <p className="palette-hint">Klikk på fargene over eller legg til egne farger</p>
            )}
          </div>
        )}

        {resultSize && (
          <div className="result-size">
            Resultat: <strong>{resultSize.width} × {resultSize.height}</strong> masker
            {paletteMode === 'custom' && customPalette.length > 0 && (
              <span> med {customPalette.length} valgte farger</span>
            )}
            {paletteMode === 'auto' && colorCount > 0 && (
              <span> med hvit + {colorCount} farger</span>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Avbryt
          </button>
          <button 
            className="btn-generate" 
            onClick={handleGenerate}
            disabled={!preview || (paletteMode === 'custom' && customPalette.length === 0)}
          >
            ✨ Generer mønster
          </button>
        </div>
      </div>
    </div>
  );
}
