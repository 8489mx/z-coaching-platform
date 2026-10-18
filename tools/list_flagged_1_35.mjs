import fs from 'fs';

const data = JSON.parse(fs.readFileSync('tools/audit_report.json', 'utf8'));

const flagged = data.allIcons.filter(icon => {
  const isLine1970 = icon.lineNo >= 1968 && icon.lineNo <= 1975;
  const missingLinecap = (icon.attrs.includes('stroke=') || icon.body.includes('stroke=')) && (!icon.attrs.includes('stroke-linecap=') && !icon.body.includes('stroke-linecap='));
  const isTiny = icon.cls.match(/\bw-2(\.5)?\b|\bw-3\b/);
  const hasH01 = icon.body.includes('h.01') || icon.body.includes('h0') || icon.body.includes('v.01');
  return isLine1970 || missingLinecap || isTiny || hasH01;
});

flagged.slice(0, 37).forEach((f, idx) => {
  console.log(`[${idx+1}] Line ${f.lineNo}: cls='${f.cls}'`);
  console.log(`     Context: ${f.pre.slice(-40)} ... ${f.post.slice(0, 40)}`);
  console.log(`     Body: ${f.body.substring(0, 80)}`);
});
