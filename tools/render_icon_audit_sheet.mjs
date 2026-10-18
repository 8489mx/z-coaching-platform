import fs from 'fs';
import path from 'path';

const html = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');
const data = JSON.parse(fs.readFileSync('tools/audit_report.json', 'utf8'));

// Build an HTML visual contact sheet of all icons
let sheetHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>Icon Audit Contact Sheet</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F2F2F7; padding: 24px; color: #1C1C1E; }
  h1 { font-size: 22px; font-weight: 800; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .card { background: #fff; border-radius: 14px; padding: 12px; display: flex; align-items: center; gap: 14px; border: 1px solid #E5E5EA; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .icon-box { width: 44px; height: 44px; border-radius: 10px; background: #F8F9FA; border: 1px solid #E9ECEF; display: flex; align-items: center; justify-content: center; shrink-0; }
  .meta { flex: 1; min-width: 0; font-size: 11px; }
  .line { font-weight: bold; color: #007AFF; font-size: 12px; }
  .ctx { color: #48484A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
  .cls { font-family: monospace; color: #8E8E93; font-size: 10px; margin-top: 2px; }
  .status { display: inline-block; padding: 2px 6px; border-radius: 6px; font-size: 9.5px; font-weight: bold; margin-top: 4px; }
  .status-warn { background: #FFF3CD; color: #856404; }
  .status-ok { background: #D4EDDA; color: #155724; }
</style>
</head>
<body>
<h1>فحص وتدقيق كافة أيقونات التطبيق (126 أيقونة)</h1>
<div class="grid">
`;

data.allIcons.forEach(icon => {
  const isLine1970 = icon.lineNo >= 1968 && icon.lineNo <= 1975;
  const hasH01 = icon.body.includes('h.01') || icon.body.includes('h0') || icon.body.includes('v.01');
  const missingLinecap = (icon.attrs.includes('stroke=') || icon.body.includes('stroke=')) && (!icon.attrs.includes('stroke-linecap=') && !icon.body.includes('stroke-linecap='));
  const isTiny = icon.cls.match(/\bw-2(\.5)?\b|\bw-3\b/);
  
  const isWarn = isLine1970 || hasH01 || (missingLinecap && icon.body.includes('<path'));
  
  sheetHtml += `
  <div class="card">
    <div class="icon-box" style="color: #007AFF;">
      <svg ${icon.attrs}>${icon.body}</svg>
    </div>
    <div class="meta">
      <div class="line">أيقونة #${icon.count} (السطر ${icon.lineNo})</div>
      <div class="ctx">${icon.post.replace(/<[^>]*>/g, '').trim().substring(0, 30) || icon.pre.replace(/<[^>]*>/g, '').trim().slice(-30)}</div>
      <div class="cls">${icon.cls}</div>
      ${isWarn ? `<span class="status status-warn">تحتاج تصحيح</span>` : `<span class="status status-ok">سليمة</span>`}
    </div>
  </div>
  `;
});

sheetHtml += `
</div>
</body>
</html>
`;

fs.writeFileSync('frontend/public/icon_audit_sheet.html', sheetHtml);
console.log('Created frontend/public/icon_audit_sheet.html');
