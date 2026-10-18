import fs from 'fs';

const html = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');

// Match sections/screens
const screens = [
  { id: 'screen-today', name: 'Home / Today' },
  { id: 'screen-workout', name: 'Workout' },
  { id: 'screen-nutrition', name: 'Nutrition' },
  { id: 'screen-checkin', name: 'Check-in' },
  { id: 'screen-account', name: 'Account' },
  { id: 'floating-bottom-nav', name: 'Bottom Navigation' },
  { id: 'modal-swap-sheet', name: 'Food Swap Sheet' },
  { id: 'modal-exercise-alt-sheet', name: 'Workout Alternative Sheet' },
  { id: 'modal-policy', name: 'Policy Modal' },
  { id: 'modal-locked-food', name: 'Locked Food Modal' },
  { id: 'modal-lab-upload', name: 'Lab Upload Modal' }
];

const svgRegex = /<svg([^>]*)>([\s\S]*?)<\/svg>/g;
let match;
const allSvgs = [];

while ((match = svgRegex.exec(html)) !== null) {
  const startIndex = match.index;
  const attrs = match[1];
  const body = match[2].trim();
  
  // Find which screen or section contains this svg
  let currentScreen = 'Global / Other';
  for (const s of screens) {
    const sIdx = html.indexOf(`id="${s.id}"`);
    if (sIdx !== -1 && sIdx < startIndex) {
      currentScreen = s.name;
    }
  }

  // Check attributes
  const classMatch = attrs.match(/class="([^"]*)"/);
  const vbMatch = attrs.match(/viewBox="([^"]*)"/);
  const strokeMatch = attrs.match(/stroke="([^"]*)"/);
  const fillMatch = attrs.match(/fill="([^"]*)"/);
  const strokeWidthMatch = attrs.match(/stroke-width="([^"]*)"/);

  const cls = classMatch ? classMatch[1] : '';
  const vb = vbMatch ? vbMatch[1] : '';
  const stroke = strokeMatch ? strokeMatch[1] : '';
  const fill = fillMatch ? fillMatch[1] : '';
  const sw = strokeWidthMatch ? strokeWidthMatch[1] : '';

  // Get surrounding text context
  const pre = html.substring(Math.max(0, startIndex - 200), startIndex);
  const post = html.substring(startIndex + match[0].length, startIndex + match[0].length + 200);
  
  const lineNo = html.substring(0, startIndex).split('\n').length;

  allSvgs.push({
    lineNo,
    section: currentScreen,
    cls,
    vb,
    stroke,
    fill,
    sw,
    body: body.replace(/\s+/g, ' '),
    pre: pre.replace(/\s+/g, ' ').slice(-80),
    post: post.replace(/\s+/g, ' ').slice(0, 80)
  });
}

console.log(`Found ${allSvgs.length} SVGs in mobile_app_preview.html\n`);

// Group by section
const bySection = {};
for (const svg of allSvgs) {
  if (!bySection[svg.section]) bySection[svg.section] = [];
  bySection[svg.section].push(svg);
}

for (const [sec, list] of Object.entries(bySection)) {
  console.log(`=== ${sec} (${list.length} SVGs) ===`);
  list.forEach((s, idx) => {
    console.log(`  [${idx + 1}] Line ${s.lineNo}: cls="${s.cls}" vb="${s.vb}" sw="${s.sw}"`);
    console.log(`      Context: ...${s.pre.slice(-40)} [SVG] ${s.post.slice(0, 40)}...`);
    console.log(`      Body: ${s.body.substring(0, 70)}...`);
  });
  console.log('');
}
