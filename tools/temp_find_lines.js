import fs from 'fs';
const content = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');
const lines = content.split('\n');

let start = -1;
let end = -1;
let modalStart = -1;
let modalEnd = -1;

lines.forEach((line, idx) => {
  if (line.includes('id="screen-nutrition"')) start = idx + 1;
  if (start !== -1 && end === -1 && line.includes('id="screen-checkin"')) end = idx + 1;
  if (line.includes('id="modal-swap-sheet"')) modalStart = idx + 1;
  if (modalStart !== -1 && modalEnd === -1 && line.includes('id="modal-exercise-alt-sheet"')) modalEnd = idx + 1;
});

console.log('screen-nutrition:', start, 'to', end);
console.log('modal-swap-sheet:', modalStart, 'to', modalEnd);
