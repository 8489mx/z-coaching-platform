import fs from 'fs';

const html = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');

const svgRegex = /<svg([^>]*)>([\s\S]*?)<\/svg>/g;
let match;
let count = 0;
const issues = [];
const allIcons = [];

while ((match = svgRegex.exec(html)) !== null) {
  count++;
  const attrs = match[1];
  const body = match[2].trim();
  const index = match.index;
  const lineNo = html.substring(0, index).split('\n').length;
  
  const classMatch = attrs.match(/class="([^"]*)"/);
  const cls = classMatch ? classMatch[1] : '';

  // Get surrounding text
  const pre = html.substring(Math.max(0, index - 150), index).replace(/\s+/g, ' ');
  const post = html.substring(index + match[0].length, index + match[0].length + 150).replace(/\s+/g, ' ');

  allIcons.push({ count, lineNo, cls, attrs, body, pre, post });

  // 1. Missing viewBox
  if (!attrs.includes('viewBox')) {
    issues.push({ count, lineNo, cls, reason: 'Missing viewBox', detail: attrs });
  }

  // 2. Stroke without linecap when using path or line
  if (attrs.includes('stroke=') && !attrs.includes('stroke-linecap')) {
    issues.push({ count, lineNo, cls, reason: 'Stroke without stroke-linecap', detail: body.substring(0, 60) });
  }

  // 3. Dot with h.01 without stroke-linecap="round"
  if (body.includes('h.01') || body.includes('h0') || body.includes('v.01')) {
    if (!attrs.includes('stroke-linecap="round"') && !attrs.includes("stroke-linecap='round'")) {
      issues.push({ count, lineNo, cls, reason: 'h.01/v.01 dot without stroke-linecap=round (renders square/invisible)', detail: body });
    }
  }

  // 4. Overly tiny icons: w-2.5 or w-3 with complex paths
  if (cls.match(/\bw-2(\.5)?\b|\bw-3\b/)) {
    issues.push({ count, lineNo, cls, reason: 'Tiny icon (<=12px)', detail: `${cls} -> ${body.substring(0, 60)}` });
  }

  // 5. Empty or suspicious SVG body
  if (body.length < 5) {
    issues.push({ count, lineNo, cls, reason: 'Empty or nearly empty SVG body', detail: body });
  }
}

fs.writeFileSync('tools/audit_report.json', JSON.stringify({ total: count, issues, allIcons }, null, 2));

console.log(`Total SVGs: ${count}`);
console.log(`Potential Issues Found: ${issues.length}`);
issues.forEach(iss => {
  console.log(`- [#${iss.count} Line ${iss.lineNo}] [${iss.reason}] ${iss.cls} -> ${iss.detail}`);
});
