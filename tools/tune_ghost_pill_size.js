import fs from 'fs';

console.log('--- Tuning Ghost Pill Sizes to Refined Compact Micro Dimensions ---');

const oldCss = `    .btn-ghost-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 34px;
      padding: 0 13px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      color: #284C7C;
      background-color: #F8FBFF;
      border: 1px solid #D9E7F5;
      text-decoration: none !important;
      cursor: pointer;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
      white-space: nowrap;
      line-height: 1;
      position: relative;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      box-shadow: none;
    }

    .btn-ghost-pill:hover {
      background-color: #EBF4FE;
      border-color: #C5DBF0;
      color: #0F172A;
    }

    .btn-ghost-pill:active {
      background-color: #E1EFFD;
      border-color: #B4D3EC;
      color: #0F172A;
      transform: scale(0.97);
    }

    .btn-ghost-pill:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(40, 76, 124, 0.15);
    }

    /* Expanding touch area to guarantee >= 44x44px touch target on touch devices */
    .btn-ghost-pill::after {
      content: '';
      position: absolute;
      top: -5px;
      bottom: -5px;
      left: -4px;
      right: -4px;
    }

    .btn-ghost-pill-sm {
      height: 32px;
      padding: 0 12px;
      font-size: 12.5px;
      gap: 5px;
    }`;

const newCss = `    .btn-ghost-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4.5px;
      height: 26px;
      padding: 0 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      color: #284C7C;
      background-color: #F8FBFF;
      border: 1px solid #D9E7F5;
      text-decoration: none !important;
      cursor: pointer;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
      white-space: nowrap;
      line-height: 1;
      position: relative;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      box-shadow: none;
    }

    .btn-ghost-pill:hover {
      background-color: #EBF4FE;
      border-color: #C5DBF0;
      color: #0F172A;
    }

    .btn-ghost-pill:active {
      background-color: #E1EFFD;
      border-color: #B4D3EC;
      color: #0F172A;
      transform: scale(0.97);
    }

    .btn-ghost-pill:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(40, 76, 124, 0.15);
    }

    /* Expanding touch area to guarantee >= 44x44px touch target on touch devices */
    .btn-ghost-pill::after {
      content: '';
      position: absolute;
      top: -9px;
      bottom: -9px;
      left: -6px;
      right: -6px;
    }

    .btn-ghost-pill-sm {
      height: 24px;
      padding: 0 8px;
      font-size: 10.5px;
      gap: 3.5px;
    }`;

const filesToUpdateCss = [
  'frontend/public/mobile_app_preview.html',
  'frontend/public/mobile_home_pure.html',
  'tools/build_perfect_preview_html.js',
  'frontend/src/styles/partials/base.css'
];

filesToUpdateCss.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('height: 34px;')) {
    content = content.replace(oldCss, newCss);
    // Also if base.css has different indentation:
    content = content.replaceAll('height: 34px;', 'height: 26px;');
    content = content.replaceAll('padding: 0 13px;', 'padding: 0 10px;');
    content = content.replaceAll('font-size: 13px;', 'font-size: 11px;');
    content = content.replaceAll('gap: 6px;', 'gap: 4.5px;');
    content = content.replaceAll('height: 32px;', 'height: 24px;');
    content = content.replaceAll('padding: 0 12px;', 'padding: 0 8px;');
    content = content.replaceAll('font-size: 12.5px;', 'font-size: 10.5px;');
    content = content.replaceAll('top: -5px;\n      bottom: -5px;\n      left: -4px;\n      right: -4px;', 'top: -9px;\n      bottom: -9px;\n      left: -6px;\n      right: -6px;');
    content = content.replaceAll('top: -5px;\n  bottom: -5px;\n  left: -4px;\n  right: -4px;', 'top: -9px;\n  bottom: -9px;\n  left: -6px;\n  right: -6px;');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated CSS in', f);
  }
});

// Update SVG icons inside .btn-ghost-pill in HTML files from w-3.5 h-3.5 to w-3 h-3 (12px)
['frontend/public/mobile_app_preview.html', 'frontend/public/mobile_home_pure.html'].forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replaceAll('<svg class="w-3.5 h-3.5 rtl:rotate-180"', '<svg class="w-3 h-3 rtl:rotate-180"');
  content = content.replaceAll('<svg class="w-3.5 h-3.5 text-[#284C7C]"', '<svg class="w-3 h-3 text-[#284C7C]"');
  content = content.replaceAll('<svg id="tech1-arrow" class="w-3.5 h-3.5', '<svg id="tech1-arrow" class="w-3 h-3');
  content = content.replaceAll('<svg id="tech2-arrow" class="w-3.5 h-3.5', '<svg id="tech2-arrow" class="w-3 h-3');
  content = content.replaceAll('<svg id="tech${idx}-arrow" class="w-3.5 h-3.5', '<svg id="tech${idx}-arrow" class="w-3 h-3');
  fs.writeFileSync(f, content, 'utf8');
  console.log('Updated SVG icons in', f);
});

// Also update React components inline styles:
// ExerciseLogCard.jsx
let exCard = fs.readFileSync('frontend/src/pages/ClientInteractiveApp/components/ExerciseLogCard.jsx', 'utf8');
exCard = exCard.replaceAll("height: '32px'", "height: '24px'");
exCard = exCard.replaceAll("padding: '0 12px'", "padding: '0 8px'");
exCard = exCard.replaceAll("fontSize: '0.72rem'", "fontSize: '0.67rem'");
fs.writeFileSync('frontend/src/pages/ClientInteractiveApp/components/ExerciseLogCard.jsx', exCard, 'utf8');

// WorkoutTab.jsx
let wkTab = fs.readFileSync('frontend/src/pages/ClientInteractiveApp/components/WorkoutTab.jsx', 'utf8');
wkTab = wkTab.replaceAll("height: '34px'", "height: '28px'");
wkTab = wkTab.replaceAll("padding: '0 13px'", "padding: '0 10px'");
wkTab = wkTab.replaceAll("fontSize: '0.75rem'", "fontSize: '0.7rem'");
wkTab = wkTab.replaceAll("fontSize: '0.74rem'", "fontSize: '0.7rem'");
fs.writeFileSync('frontend/src/pages/ClientInteractiveApp/components/WorkoutTab.jsx', wkTab, 'utf8');

// MealsTab.jsx
let mealsTab = fs.readFileSync('frontend/src/pages/ClientInteractiveApp/components/MealsTab.jsx', 'utf8');
mealsTab = mealsTab.replaceAll("height: '32px'", "height: '24px'");
mealsTab = mealsTab.replaceAll("padding: '0 12px'", "padding: '0 8px'");
mealsTab = mealsTab.replaceAll("fontSize: '0.72rem'", "fontSize: '0.67rem'");
fs.writeFileSync('frontend/src/pages/ClientInteractiveApp/components/MealsTab.jsx', mealsTab, 'utf8');

console.log('--- Ghost pill size tuning completed successfully ---');
