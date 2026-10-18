import fs from 'fs';

let content = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');
content = content.split('/assets/food/').join('assets/food/');
fs.writeFileSync('frontend/public/mobile_app_preview.html', content, 'utf8');
console.log('Successfully updated /assets/food/ to assets/food/');
