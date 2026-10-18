import fs from 'fs';

const html = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');

console.log('=== 1. Native Select Check ===');
const selects = html.match(/<select[\s\S]*?<\/select>/gi) || [];
console.log('Native selects found:', selects.length);

console.log('=== 2. Decorative Dots Check (rounded-full w-1.5 / w-2) ===');
const dots = html.match(/<span[^>]*class="[^"]*rounded-full[^"]*(?:w-1\.5|w-2|w-1)[^"]*"[^>]*><\/span>/gi) || [];
console.log('Status dots found:', dots.length);
dots.forEach(d => console.log(' - Dot:', d));

console.log('=== 3. Tiny / Sharp Corner Radius Check ===');
const sharpCorners = html.match(/rounded-(?:none|xs|sm|\[[0-4]px\])/gi) || [];
console.log('Sharp/tiny rounded found:', sharpCorners.length);

console.log('=== 4. Steppers & Stepper Buttons ===');
const stepOccurrences = html.match(/onclick="step[^"]*"/gi) || [];
console.log('Step onclick handlers:', stepOccurrences.length);

console.log('=== 5. Hard Dark Borders Check ===');
const hardBorders = html.match(/border-(?:gray|slate)-[4-9]00/gi) || [];
console.log('Hard dark borders found:', hardBorders.length);
hardBorders.forEach(b => console.log(' - Hard border:', b));

console.log('=== 6. Screen by Screen Review ===');
const screens = ['screen-today', 'screen-workout', 'screen-nutrition', 'screen-checkin', 'screen-account'];
screens.forEach(s => {
  const start = html.indexOf(`id="${s}"`);
  if (start !== -1) {
    const sectionChunk = html.substring(start, start + 30000);
    // find buttons without standard classes
    const btns = sectionChunk.match(/<button[\s\S]*?<\/button>/gi) || [];
    console.log(`Screen ${s}: total buttons = ${btns.length}`);
  }
});
