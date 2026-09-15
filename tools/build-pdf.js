const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PDF = path.join(ROOT, 'LA_Project_Portfolio_2026.pdf');
const TARGET_URL = 'http://localhost:3000/lookbook.html';

console.log('Generating PDF portfolio from:', TARGET_URL);
console.log('Target output:', OUTPUT_PDF);

const cmd = `"${EDGE_PATH}" --headless --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw --print-to-pdf="${OUTPUT_PDF}" "${TARGET_URL}"`;

exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }

  if (fs.existsSync(OUTPUT_PDF)) {
    const stats = fs.statSync(OUTPUT_PDF);
    console.log(`✓ PDF successfully generated! File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
  } else {
    console.error('PDF file not found after generation.');
    process.exit(1);
  }
});
