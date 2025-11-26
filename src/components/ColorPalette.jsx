import './ColorPalette.css';

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

// Check if a color is already in the preset colors
const isPresetColor = (hex) => {
  return YARN_COLORS.some(c => c.hex.toLowerCase() === hex.toLowerCase());
};

export default function ColorPalette({ selectedColor, setSelectedColor, recentColors, setRecentColors }) {
  
  const handleCustomColorChange = (e) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
    
    // Only add to recent if it's not a preset color
    if (!isPresetColor(newColor)) {
      setRecentColors(prev => {
        // Remove if already exists
        const filtered = prev.filter(c => c.toLowerCase() !== newColor.toLowerCase());
        // Add to beginning, keep only last 5
        return [newColor, ...filtered].slice(0, 5);
      });
    }
  };

  return (
    <div className="color-palette">
      <h3>Garnfarger</h3>
      <div className="color-grid">
        {YARN_COLORS.map((color) => (
          <button
            key={color.hex}
            className={`color-swatch ${selectedColor === color.hex ? 'selected' : ''}`}
            style={{ backgroundColor: color.hex }}
            onClick={() => setSelectedColor(color.hex)}
            title={color.name}
          />
        ))}
      </div>
      
      {recentColors.length > 0 && (
        <div className="recent-colors">
          <label>Nylige farger:</label>
          <div className="recent-color-grid">
            {recentColors.map((color) => (
              <button
                key={color}
                className={`color-swatch small ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="custom-color">
        <label htmlFor="custom-color">Egendefinert:</label>
        <input
          type="color"
          id="custom-color"
          value={selectedColor}
          onChange={handleCustomColorChange}
        />
      </div>
    </div>
  );
}
