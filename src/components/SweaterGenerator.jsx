import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import sweaterSvg from '../assets/sweater.svg';
import './SweaterGenerator.css';

// Crewneck template based on Mathildagenseren construction
const CREWNECK_TEMPLATE = {
  name: 'Rundhalsgenser',
  description: 'Klassisk genser strikket ovenfra og ned',
  gauge: { stitches: 15, rows: 20, size: 10 }, // per 10cm
  sizes: {
    S: {
      bust: 114,
      length: 60,
      sleeveLength: 42,
      backCastOn: 84,
      shortRowStart: 27,
      firstTurn: 24,
      shoulderAfterInc: 32,
      neckCastOn: 20,
      bodyTotal: 176,
      neckPickup: 72,
      sleevePickup: 64,
      sleeveAfterDec: 50,
      backLength: 26,
      shoulderLength: 8,
      frontBeforeJoin: 16,
      bodyBeforeEdge: 45,
      sleeveBeforeEdge: 39,
      shortRowRepeats: 7
    },
    M: {
      bust: 128,
      length: 65,
      sleeveLength: 44,
      backCastOn: 92,
      shortRowStart: 31,
      firstTurn: 28,
      shoulderAfterInc: 36,
      neckCastOn: 20,
      bodyTotal: 192,
      neckPickup: 74,
      sleevePickup: 66,
      sleeveAfterDec: 50,
      backLength: 27,
      shoulderLength: 8,
      frontBeforeJoin: 17,
      bodyBeforeEdge: 50,
      sleeveBeforeEdge: 41,
      shortRowRepeats: 8
    },
    L: {
      bust: 138,
      length: 70,
      sleeveLength: 46,
      backCastOn: 98,
      shortRowStart: 34,
      firstTurn: 31,
      shoulderAfterInc: 39,
      neckCastOn: 20,
      bodyTotal: 204,
      neckPickup: 76,
      sleevePickup: 68,
      sleeveAfterDec: 52,
      backLength: 28,
      shoulderLength: 8,
      frontBeforeJoin: 18,
      bodyBeforeEdge: 55,
      sleeveBeforeEdge: 43,
      shortRowRepeats: 9
    }
  }
};

// Helper to format sizes as "S (M) L"
const formatSizes = (s, m, l) => `${s} (${m}) ${l}`;

export default function SweaterGenerator({ grid, onClose }) {
  const [patternName, setPatternName] = useState('Min genser');
  const [distanceFromNeck, setDistanceFromNeck] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef(null);

  const sizes = CREWNECK_TEMPLATE.sizes;
  const patternWidth = grid[0]?.length || 0;
  const patternHeight = grid.length || 0;

  // Calculate pattern placement
  const stitchesPerCm = CREWNECK_TEMPLATE.gauge.stitches / CREWNECK_TEMPLATE.gauge.size;
  const rowsPerCm = CREWNECK_TEMPLATE.gauge.rows / CREWNECK_TEMPLATE.gauge.size;
  const patternWidthCm = patternWidth / stitchesPerCm;
  const patternHeightCm = patternHeight / rowsPerCm;

  // Generate grid cells as HTML table
  const generateGridHTML = () => {
    const cellSize = Math.min(12, 400 / Math.max(patternWidth, patternHeight));
    let html = `<table style="border-collapse: collapse; margin: 20px auto;">`;
    
    for (let row = 0; row < patternHeight; row++) {
      html += '<tr>';
      for (let col = 0; col < patternWidth; col++) {
        const cell = grid[row][col];
        const symbol = cell.symbol && cell.symbol !== 'knit' && !cell.symbol.startsWith('_cable_') ? '×' : '';
        html += `<td style="width: ${cellSize}px; height: ${cellSize}px; background: ${cell.color}; border: 1px solid #ccc; text-align: center; font-size: ${cellSize * 0.6}px;">${symbol}</td>`;
      }
      html += '</tr>';
    }
    html += '</table>';
    return html;
  };

  const generatePDF = () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const textWidth = pageWidth - margin * 2;
      let y = 20;
      
      // Frontend colors
      const accentColor = { r: 139, g: 92, b: 246 }; // #8b5cf6 purple
      const accentLight = { r: 237, g: 233, b: 254 }; // light purple bg
      const textPrimary = { r: 26, g: 26, b: 26 };
      const textMuted = { r: 100, g: 100, b: 100 };
      
      // Helper to check page break
      const checkPageBreak = (neededSpace) => {
        if (y + neededSpace > 280) {
          doc.addPage();
          y = 20;
        }
      };
      
      // Helper for sections with styled header
      const addSection = (title, content) => {
        const lines = doc.splitTextToSize(content, textWidth);
        checkPageBreak(lines.length * 4 + 20);
        
        // Section title with accent underline
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textPrimary.r, textPrimary.g, textPrimary.b);
        doc.text(title, margin, y);
        
        // Accent underline
        doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
        doc.setLineWidth(1);
        doc.line(margin, y + 2, margin + doc.getTextWidth(title), y + 2);
        y += 10;
        
        // Content
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textPrimary.r, textPrimary.g, textPrimary.b);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 12;
      };
      
      // Title with accent color
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
      doc.text(patternName, pageWidth / 2, y, { align: 'center' });
      y += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
      doc.text(`Størrelser S (M) L — ${CREWNECK_TEMPLATE.name}`, pageWidth / 2, y, { align: 'center' });
      y += 15;
      
      // Info box with accent background
      doc.setFillColor(accentLight.r, accentLight.g, accentLight.b);
      doc.roundedRect(margin, y - 5, textWidth, 45, 3, 3, 'F');
      
      // Border
      doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y - 5, textWidth, 45, 3, 3, 'S');
      
      doc.setFontSize(10);
      doc.setTextColor(textPrimary.r, textPrimary.g, textPrimary.b);
      doc.text(`Genserens overvidde: ${formatSizes(sizes.S.bust, sizes.M.bust, sizes.L.bust)} cm`, margin + 5, y + 3);
      doc.text(`Genserens lengde: ${formatSizes(sizes.S.length, sizes.M.length, sizes.L.length)} cm (eller ønsket lengde)`, margin + 5, y + 10);
      doc.text(`Ermelengde: ${formatSizes(sizes.S.sleeveLength, sizes.M.sleeveLength, sizes.L.sleeveLength)} cm (eller ønsket lengde)`, margin + 5, y + 17);
      doc.text(`Strikkefasthet: ${CREWNECK_TEMPLATE.gauge.stitches} m x ${CREWNECK_TEMPLATE.gauge.rows} omganger = ${CREWNECK_TEMPLATE.gauge.size} x ${CREWNECK_TEMPLATE.gauge.size} cm`, margin + 5, y + 24);
      doc.text('Veiledende pinner: rundpinne 4,5 mm og 5 mm (80 cm + 40 cm)', margin + 5, y + 31);
      doc.text('Garn: ca. 500-700g. Eksempel Hillesvåg ullvarefabrikk Luna', margin + 5, y + 38);
      y += 55;
      
      addSection('Konstruksjon', 
        `Genseren strikkes ovenfra og ned. Først strikkes øverste del av bakstykket med vendepinner. Det plukkes opp masker i begge sider som former skuldrene, som deretter samles til forstykke. Bolen strikkes videre rundt med mønster på forsiden, og avsluttes med vrangbord. Det plukkes opp masker til halskant og til slutt ermer, som strikkes med fellinger og vrangbord.\n\nNår det står "vend" i oppskriften, skal du vende med teknikken German short rows.`);
      
      addSection('Økninger', 
        `Øk høyre – stikk venstre pinne inn under tråden mellom to masker bakfra og strikk tråden rett.\n\nØk venstre – stikk venstre pinne inn under tråden mellom to masker forfra og strikk tråden vridd rett.\n\nPS: Det kan være vanskelig å få mønsteret til å bli helt jevnt mens du strikker. Jeg anbefaler at du stryker genseren med et dampstrykejern når du er ferdig å strikke. Da vil mønsteret jevne seg ut og bli penere.`);
      
      addSection('Bakstykket', 
        `Legg opp ${formatSizes(sizes.S.backCastOn, sizes.M.backCastOn, sizes.L.backCastOn)} m på pinne 5 mm (80 cm). Ryk tråden, og flytt de første ${formatSizes(sizes.S.shortRowStart, sizes.M.shortRowStart, sizes.L.shortRowStart)} m over fra venstre til høyre pinne uten å strikke dem. Legg til ny tråd, og strikk vrang til det er igjen ${formatSizes(sizes.S.shortRowStart, sizes.M.shortRowStart, sizes.L.shortRowStart)} m på pinnen. Vend. Du er nå på rettsiden. Strikk videre slik:\n\n1. pinne (rettsiden): strikk rett til det er igjen ${formatSizes(sizes.S.firstTurn, sizes.M.firstTurn, sizes.L.firstTurn)} m på pinnen. Vend.\n2. pinne (vrangside): strikk vrang til det er igjen ${formatSizes(sizes.S.firstTurn, sizes.M.firstTurn, sizes.L.firstTurn)} m på pinnen. Vend.\n\nFortsett å strikke vendepinner på bakstykket slik:\n1. pinne (rettside): strikk rett tom. 3 m etter siste vending. Vend.\n2. pinne (vrangside): strikk vrang tom. 3 m etter siste vending. Vend.\n\nGjenta disse to pinnene ${formatSizes(sizes.S.shortRowRepeats, sizes.M.shortRowRepeats, sizes.L.shortRowRepeats)} ganger. Siste gang du skal vende er det igjen ${formatSizes(3, 4, 4)} m på pinnen.\n\nStrikk så videre i glattstrikk fram og tilbake uten vendinger, til arbeidet måler ${formatSizes(sizes.S.backLength, sizes.M.backLength, sizes.L.backLength)} cm, målt på det lengste punktet. Ryk tråden og sett maskene på en maskeholder.`);
      
      addSection('Venstre skulder', 
        `Du skal nå strikke skuldrene. Plukk opp de ytterste ${formatSizes(sizes.S.shortRowStart, sizes.M.shortRowStart, sizes.L.shortRowStart)} m på venstre side av bakstykket fra rettsiden med pinne 5 mm (40 eller 80 cm). Start innerst ved halsen, og fortsett videre utover.\n\nStrikk fram og tilbake i glattstrikk (rett på rettsiden og vrang på vrangsiden) til skulderen måler ${sizes.S.shoulderLength} cm fra opplukkingskanten. Pass på å avslutte med en pinne fra vrangsiden.\n\nNå skal du strikke økninger for å danne halsåpningen. Strikk slik:\n1. pinne (rettsiden): strikk 2 m rett, øk venstre, strikk rett ut pinnen\n2. pinne (vrangsiden): strikk vrang over alle m\n\nStrikk disse to pinnene i alt 5 ganger. Du har nå ${formatSizes(sizes.S.shoulderAfterInc, sizes.M.shoulderAfterInc, sizes.L.shoulderAfterInc)} m på pinnen. Ryk tråden og sett maskene på en maskeholder mens du strikker den andre skulderen.`);
      
      addSection('Høyre skulder', 
        `Plukk opp de ytterste ${formatSizes(sizes.S.shortRowStart, sizes.M.shortRowStart, sizes.L.shortRowStart)} m på høyre side av skulderen fra rettsiden med pinne 5 mm (40 eller 80 cm). Start ytterst, og fortsett videre innover mot halsen.\n\nStrikk fram og tilbake i glattstrikk (rett på rettsiden og vrang på vrangsiden) til skulderen måler ${sizes.S.shoulderLength} cm fra opplukkingskanten. Pass på å avslutte med en pinne fra vrangsiden.\n\nNå skal du strikke økninger for å danne halsåpningen. Strikk slik:\n1. pinne (rettsiden): strikk rett til det gjenstår 2 m, øk høyre, strikk rett ut pinnen\n2. pinne (vrangsiden): strikk vrang over alle m\n\nStrikk disse to pinnene i alt 5 ganger. Du har nå ${formatSizes(sizes.S.shoulderAfterInc, sizes.M.shoulderAfterInc, sizes.L.shoulderAfterInc)} m på pinnen.`);
      
      addSection('Forstykket', 
        `Neste pinne er fra rettsiden. Nå skal venstre og høyre skulder samles for å danne forstykket. Strikk ${formatSizes(sizes.S.shoulderAfterInc, sizes.M.shoulderAfterInc, sizes.L.shoulderAfterInc)} m rett. Legg opp ${sizes.S.neckCastOn} m med løkkeopplegg. Strikk ${formatSizes(sizes.S.shoulderAfterInc, sizes.M.shoulderAfterInc, sizes.L.shoulderAfterInc)} m rett (maskene fra venstre skulder). Du har nå ${formatSizes(sizes.S.backCastOn, sizes.M.backCastOn, sizes.L.backCastOn)} m på pinnen til forstykket.\n\nStrikk ${distanceFromNeck} cm fram og tilbake i glattstrikk. Avslutt med en pinne på vrangsiden, slik at neste pinne er på rettsiden.\n\nNå skal du fortsette å strikke videre fram og tilbake i glattstrikk med mønster på både rettsiden og vrangsiden. Plasser mønsteret sentrert på forstykket.\n\nFortsett å strikke glattstrikk frem og tilbake med mønster etter diagrammet, på rettsiden og vrangsiden, til forstykket måler ${formatSizes(sizes.S.frontBeforeJoin, sizes.M.frontBeforeJoin, sizes.L.frontBeforeJoin)} cm (målt fra oppleggskanten foran på halsen). Pass på at du avslutter med en pinne fra vrangsiden.`);
      
      addSection('Bolen', 
        `Nå skal forstykket og bakstykket samles, for så å strikkes videre rundt. Strikk slik: strikk rett over forstykket (samtidig som du strikker mønster som før), legg opp 4 m med løkkeopplegg til ermehull, strikk rett over bakstykket, legg opp 4 m med løkkeopplegg til ermehull. Sett en markør i hver side av arbeidet, midt under ermene og med 2 oppleggsmasker på hver side av markørene.\n\nNå skal du ha ${formatSizes(sizes.S.bodyTotal, sizes.M.bodyTotal, sizes.L.bodyTotal)} m på pinnen.\n\nStrikk videre rundt i glattstrikk med mønster på forstykket. Når mønsteret er ferdig strikket, fortsetter du å strikke rundt med bunnfargen. Strikk til arbeidet måler ${formatSizes(sizes.S.bodyBeforeEdge, sizes.M.bodyBeforeEdge, sizes.L.bodyBeforeEdge)} cm (målt fra oppleggskanten foran på halsen) eller til 6 cm før ønsket lengde.\n\nBytt til pinne 4,5 mm og strikk 6 cm vrangbord (2 r, 2 vr). Fell av.`);
      
      addSection('Halskant', 
        `Start i nakken og plukk opp ${formatSizes(sizes.S.neckPickup, sizes.M.neckPickup, sizes.L.neckPickup)} m rundt halsåpningen med pinne 4,5 mm (40 cm). Strikk rundt i vrangbord til halskanten måler 6 cm. Fell av.`);
      
      addSection('Ermer', 
        `Samme prosedyre for begge ermer: start midt under ermet, og plukk opp ${formatSizes(sizes.S.sleevePickup, sizes.M.sleevePickup, sizes.L.sleevePickup)} m jevnt fordelt rundt ermehullet med pinne 5 mm (40 cm).\n\nStrikk videre rundt i glattstrikk samtidig som du strikker fellinger ved hver 5. cm. Omgangene med fellinger strikkes slik: Strikk 1 maske. Strikk 2 m rett sammen. Strikk til det gjenstår 3 m. Strikk 2 m vridd rett sammen. Strikk den siste m.\n\nStrikk til ermet måler ${formatSizes(sizes.S.sleeveBeforeEdge, sizes.M.sleeveBeforeEdge, sizes.L.sleeveBeforeEdge)} cm (eller 3 cm før ønsket lengde). Du har nå ca. ${formatSizes(sizes.S.sleeveAfterDec, sizes.M.sleeveAfterDec, sizes.L.sleeveAfterDec)} m på pinnen.\n\nBytt til rundpinne 4,5 mm (40 cm). Strikk vrangbord nederst på ermet slik:\n1. pinne: strikk vrang ut pinnen\n2. pinne: strikk rett ut pinnen\n\nStrikk disse to pinnene i alt 3 ganger. Strikk så en siste runde med vrang. Fell av.\n\nErmet måler nå ca. ${formatSizes(sizes.S.sleeveLength, sizes.M.sleeveLength, sizes.L.sleeveLength)} cm.`);
      
      // New page for pattern
      doc.addPage();
      y = 20;
      
      // Pattern title with accent color
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
      doc.text('Mønster', pageWidth / 2, y, { align: 'center' });
      y += 12;
      
      // Info box for pattern
      doc.setFillColor(accentLight.r, accentLight.g, accentLight.b);
      doc.roundedRect(margin, y - 3, textWidth, 18, 2, 2, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textPrimary.r, textPrimary.g, textPrimary.b);
      doc.text(`${patternWidth} masker × ${patternHeight} omganger`, pageWidth / 2, y + 4, { align: 'center' });
      doc.text('Plasser mønsteret sentrert på forstykket. Start nederst til høyre.', pageWidth / 2, y + 11, { align: 'center' });
      y += 25;
      
      // Draw the pattern grid
      const maxGridWidth = pageWidth - 30;
      const maxGridHeight = 200;
      const cellW = Math.min(maxGridWidth / patternWidth, maxGridHeight / patternHeight, 6);
      const cellH = cellW * 0.75; // 4:3 ratio
      const gridWidth = cellW * patternWidth;
      const gridHeight = cellH * patternHeight;
      const startX = (pageWidth - gridWidth) / 2;
      
      // Grid background shadow effect
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(startX + 2, y + 2, gridWidth, gridHeight, 2, 2, 'F');
      
      for (let row = 0; row < patternHeight; row++) {
        for (let col = 0; col < patternWidth; col++) {
          const cell = grid[row][col];
          const x = startX + col * cellW;
          const cellY = y + row * cellH;
          
          // Fill color
          const hex = cell.color.replace('#', '');
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          doc.setFillColor(r, g, b);
          doc.rect(x, cellY, cellW, cellH, 'F');
          
          // Border
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.1);
          doc.rect(x, cellY, cellW, cellH, 'S');
        }
      }
      
      // Outer border for the grid
      doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
      doc.setLineWidth(1);
      doc.rect(startX, y, gridWidth, gridHeight, 'S');
      
      // Footer with pattern name
      y += gridHeight + 15;
      doc.setFontSize(8);
      doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
      doc.text(`${patternName} — Generert med Strikkedesigner`, pageWidth / 2, y, { align: 'center' });
      
      // Save
      doc.save(`${patternName.replace(/\s+/g, '_')}.pdf`);
      
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Feil ved PDF-generering: ' + error.message);
    }
    
    setIsGenerating(false);
  };

  return (
    <div className="sweater-generator-overlay" onClick={onClose}>
      <div className="sweater-generator-modal" onClick={e => e.stopPropagation()}>
        <h2>🧶 Lag genser-oppskrift</h2>

        <div className="generator-content">
          {/* Left side - Settings */}
          <div className="generator-settings">
            <div className="setting-group">
              <label>Navn på oppskriften:</label>
              <input
                type="text"
                value={patternName}
                onChange={(e) => setPatternName(e.target.value)}
                placeholder="Min genser"
              />
            </div>

            <div className="setting-group">
              <label>Størrelser i oppskriften:</label>
              <div className="all-sizes-info">
                <div className="size-row"><strong>S:</strong> {sizes.S.bust} cm overvidde, {sizes.S.length} cm lengde</div>
                <div className="size-row"><strong>M:</strong> {sizes.M.bust} cm overvidde, {sizes.M.length} cm lengde</div>
                <div className="size-row"><strong>L:</strong> {sizes.L.bust} cm overvidde, {sizes.L.length} cm lengde</div>
              </div>
            </div>

            <div className="setting-group">
              <label>Avstand fra hals til mønster:</label>
              <div className="distance-input">
                <input
                  type="number"
                  value={distanceFromNeck}
                  onChange={(e) => setDistanceFromNeck(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  max="30"
                />
                <span>cm</span>
              </div>
            </div>

            <div className="pattern-info">
              <h4>Ditt mønster:</h4>
              <p>{patternWidth} masker × {patternHeight} omganger</p>
              <p>≈ {patternWidthCm.toFixed(1)} × {patternHeightCm.toFixed(1)} cm</p>
            </div>
          </div>

          {/* Right side - Preview */}
          <div className="generator-preview" ref={previewRef}>
            <h4>Forhåndsvisning (str. M)</h4>
            <div className="sweater-mockup">
              {(() => {
                // Size M measurements
                const bustCm = sizes.M.bust; // 128 cm full circumference
                const frontWidthCm = bustCm / 2; // 64 cm front panel
                const lengthCm = sizes.M.length; // 65 cm
                
                // The SVG sweater body area (approximate from the SVG)
                // SVG viewBox is 1000x1000, body is roughly centered
                const svgBodyWidth = 480; // approximate body width in SVG units
                const svgBodyHeight = 600; // approximate body height in SVG units
                const svgBodyTop = 180; // where the neckline ends
                const svgCenterX = 500; // center of SVG
                
                // Scale: SVG units per cm
                const scaleCm = svgBodyWidth / frontWidthCm;
                
                // Pattern dimensions in SVG units
                const patternW = patternWidthCm * scaleCm;
                const patternH = patternHeightCm * scaleCm;
                const patternX = svgCenterX - patternW / 2;
                const patternY = svgBodyTop + distanceFromNeck * scaleCm;
                
                return (
                  <svg viewBox="0 0 1000 1000" className="sweater-svg">
                    {/* Sweater image */}
                    <image 
                      href={sweaterSvg} 
                      x="0" 
                      y="0" 
                      width="1000" 
                      height="1000"
                      opacity="0.8"
                    />
                    
                    {/* Pattern placement overlay */}
                    <rect
                      x={patternX}
                      y={patternY}
                      width={Math.max(patternW, 20)}
                      height={Math.max(patternH, 20)}
                      fill="rgba(139, 92, 246, 0.25)"
                      stroke="#8b5cf6"
                      strokeWidth="4"
                      strokeDasharray="12,6"
                      rx="6"
                    />
                    
                    {/* Pattern dimensions label */}
                    {patternW > 60 && patternH > 40 && (
                      <text
                        x={patternX + patternW / 2}
                        y={patternY + patternH / 2 + 8}
                        textAnchor="middle"
                        fontSize="24"
                        fill="#7c3aed"
                        fontWeight="600"
                        fontFamily="DM Sans, sans-serif"
                      >
                        {patternWidthCm.toFixed(0)}×{patternHeightCm.toFixed(0)} cm
                      </text>
                    )}
                  </svg>
                );
              })()}
            </div>
            <p className="preview-note">
              Mønster: <strong>{patternWidthCm.toFixed(1)} × {patternHeightCm.toFixed(1)} cm</strong> — {distanceFromNeck} cm fra halsen
            </p>
          </div>
        </div>

        <div className="generator-actions">
          <button className="btn-cancel" onClick={onClose}>
            Avbryt
          </button>
          <button 
            className="btn-generate-pdf" 
            onClick={generatePDF}
            disabled={isGenerating || patternWidth === 0}
          >
            {isGenerating ? '⏳ Genererer...' : '📄 Last ned PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

