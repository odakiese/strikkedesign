import { useState, useRef } from 'react';
import './ImageUpload.css';

export default function ImageUpload({ onImageProcessed, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [maxWidth, setMaxWidth] = useState(50);
  const [maxHeight, setMaxHeight] = useState(50);
  const [colorCount, setColorCount] = useState(0); // 0 = unlimited
  const [resultSize, setResultSize] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
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

  // Simple color distance function
  const colorDistance = (c1, c2) => {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  };

  // K-means++ initialization for better starting centroids
  const initializeCentroids = (colors, numColors) => {
    // K-means++ for better initialization
    const centroids = [];
    
    // Always include white as first centroid (background color)
    centroids.push({ r: 255, g: 255, b: 255 });
    
    if (numColors === 1) {
      // For 1 color, find the average of non-white pixels
      const nonWhiteColors = colors.filter(c => {
        const brightness = (c.r + c.g + c.b) / 3;
        return brightness < 240; // Not near-white
      });
      
      if (nonWhiteColors.length > 0) {
        const avg = {
          r: Math.round(nonWhiteColors.reduce((sum, c) => sum + c.r, 0) / nonWhiteColors.length),
          g: Math.round(nonWhiteColors.reduce((sum, c) => sum + c.g, 0) / nonWhiteColors.length),
          b: Math.round(nonWhiteColors.reduce((sum, c) => sum + c.b, 0) / nonWhiteColors.length)
        };
        centroids.push(avg);
      } else {
        // All white image, add a default dark color
        centroids.push({ r: 0, g: 0, b: 0 });
      }
      return centroids;
    }

    // Pick remaining centroids with k-means++ (farthest from existing)
    while (centroids.length < numColors + 1) { // +1 because white is always included
      let maxDist = 0;
      let farthestColor = colors[0];
      
      colors.forEach(color => {
        let minDistToCentroid = Infinity;
        centroids.forEach(centroid => {
          const dist = colorDistance(color, centroid);
          if (dist < minDistToCentroid) {
            minDistToCentroid = dist;
          }
        });
        if (minDistToCentroid > maxDist) {
          maxDist = minDistToCentroid;
          farthestColor = color;
        }
      });
      
      centroids.push({ ...farthestColor });
    }
    
    return centroids;
  };

  // K-means clustering for color quantization
  const quantizeColors = (pixels, width, height, numColors) => {
    // Collect all colors
    const colors = [];
    for (let i = 0; i < pixels.length; i += 4) {
      colors.push({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
    }

    // Initialize centroids using k-means++
    let centroids = initializeCentroids(colors, numColors);
    const totalCentroids = centroids.length; // white + numColors

    // Run k-means iterations
    for (let iter = 0; iter < 20; iter++) {
      // Assign colors to nearest centroid
      const clusters = Array(totalCentroids).fill(null).map(() => []);
      
      colors.forEach(color => {
        let minDist = Infinity;
        let closestIdx = 0;
        centroids.forEach((centroid, idx) => {
          const dist = colorDistance(color, centroid);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
          }
        });
        clusters[closestIdx].push(color);
      });

      // Update centroids (but keep white fixed at index 0)
      centroids = clusters.map((cluster, idx) => {
        if (idx === 0) return { r: 255, g: 255, b: 255 }; // Keep white fixed
        if (cluster.length === 0) return centroids[idx];
        const avg = {
          r: Math.round(cluster.reduce((sum, c) => sum + c.r, 0) / cluster.length),
          g: Math.round(cluster.reduce((sum, c) => sum + c.g, 0) / cluster.length),
          b: Math.round(cluster.reduce((sum, c) => sum + c.b, 0) / cluster.length)
        };
        return avg;
      });
    }

    // Map each pixel to nearest centroid
    const quantized = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const i = (y * width + x);
        const color = colors[i];
        
        let minDist = Infinity;
        let closestCentroid = centroids[0];
        centroids.forEach(centroid => {
          const dist = colorDistance(color, centroid);
          if (dist < minDist) {
            minDist = dist;
            closestCentroid = centroid;
          }
        });
        
        row.push(closestCentroid);
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
      
      if (colorCount >= 1) {
        // Quantize colors to specified number
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

        {resultSize && (
          <div className="result-size">
            Resultat: <strong>{resultSize.width} × {resultSize.height}</strong> masker
            {colorCount > 0 && <span> med hvit + {colorCount} farger</span>}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Avbryt
          </button>
          <button 
            className="btn-generate" 
            onClick={handleGenerate}
            disabled={!preview}
          >
            ✨ Generer mønster
          </button>
        </div>
      </div>
    </div>
  );
}
