const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/src');

const replacements = [
  { from: /bg-\[\#050B14\]/g, to: 'bg-slate-50' },
  { from: /bg-\[\#0D1322\]/g, to: 'bg-white' },
  { from: /bg-slate-900\/50/g, to: 'bg-slate-50' },
  { from: /bg-slate-900/g, to: 'bg-slate-50' },
  { from: /bg-slate-800/g, to: 'bg-slate-100' },
  { from: /hover:bg-slate-800/g, to: 'hover:bg-slate-200' },
  { from: /hover:bg-slate-700/g, to: 'hover:bg-slate-300' },
  { from: /text-white/g, to: 'text-slate-900' },
  { from: /text-slate-300/g, to: 'text-slate-700' },
  { from: /text-slate-400/g, to: 'text-slate-600' },
  { from: /border-slate-800/g, to: 'border-slate-200' },
  { from: /border-slate-700/g, to: 'border-slate-300' },
  { from: /hover:text-white/g, to: 'hover:text-slate-900' },
  // Specific tweaks
  { from: /shadow-xl/g, to: 'shadow-md shadow-slate-200/50' },
  { from: /shadow-lg/g, to: 'shadow-sm shadow-slate-200/50' },
  { from: /shadow-\[0_0_20px_rgba\(245,158,11,0\.05\)\]/g, to: 'shadow-md shadow-amber-100' }
];

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      replacements.forEach(rule => {
        content = content.replace(rule.from, rule.to);
      });
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated theme for: ${file}`);
      }
    }
  });
}

processDirectory(directoryPath);
console.log('Theme switch to Light Mode complete.');
