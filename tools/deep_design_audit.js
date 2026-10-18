import fs from 'fs';

const html = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');

console.log('--- Checking for any remaining raw characters or un-styled elements ---');

// 1. Look for unstyled buttons or buttons with raw text icons like <, >, +, -, x, *
const rawChars = html.match(/<button[^>]*>[\s]*[+<>&*xX-][\s]*<\/button>/gi) || [];
console.log('Buttons with raw character icons:', rawChars);

// 2. Look for any remaining sharp corners (border-radius: 0 or rounded-none or sharp)
const sharpRadii = html.match(/rounded-\[0px\]|rounded-none|rounded-xs/gi) || [];
console.log('Sharp radii:', sharpRadii);

// 3. Look for buttons without active scale or tap highlight
const allButtons = html.match(/<button[\s\S]*?<\/button>/gi) || [];
console.log('Total buttons found:', allButtons.length);

// 4. Look for hard borders
const hardBorderHexes = ['#000000', '#111827', '#1f2937', '#374151', '#4b5563', '#6b7280'];
hardBorderHexes.forEach(hex => {
  const matches = (html.match(new RegExp(hex, 'gi')) || []).length;
  if (matches > 0) console.log(`Hex ${hex} matches:`, matches);
});

// 5. Look for inputs without rounded corners or with default styling
const inputs = html.match(/<input[^>]*>/gi) || [];
console.log('Inputs found:', inputs.length);
inputs.forEach(inp => console.log('Input:', inp));

// 6. Look for textareas
const textareas = html.match(/<textarea[^>]*>/gi) || [];
console.log('Textareas found:', textareas.length);
textareas.forEach(t => console.log('Textarea:', t));

// 7. Look for any badges or chips that might have dots or sharp corners
const badges = html.match(/class="[^"]*badge[^"]*"/gi) || [];
console.log('Badges found:', badges.length);

// 8. Inspect the workout screen exercises
console.log('--- Inspecting workout screen exercises 3, 4, etc. ---');
const exCards = html.match(/<!-- Exercise Card \d/gi) || [];
console.log('Exercise cards present:', exCards);

// 9. Inspect modals
const modalMatches = html.match(/id="modal-[^"]*"/gi) || [];
console.log('Modals found:', modalMatches);
