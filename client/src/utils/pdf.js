// Tiny dependency-free PDF writer (text only, Helvetica). Good enough for study notes and reports.
const W = 612;
const H = 792;
const M = 56;

const sanitize = (s) =>
  String(s)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/[^\x20-\x7E]/g, '');
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function wrap(text, max) {
  const words = text.split(/\s+/);
  const out = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      if (line) out.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out.length ? out : [''];
}

/**
 * lines: array of strings.
 *  '# Title'   -> large bold heading
 *  '## Header' -> bold sub heading
 *  '- item'    -> bullet
 *  ''          -> blank line
 */
export function buildPdf(title, lines) {
  const items = [];
  for (const raw of lines) {
    const l = sanitize(raw);
    if (l.startsWith('# ')) items.push(...wrap(l.slice(2), 52).map((t, i) => ({ f: 'F2', s: 20, t, gap: i ? 4 : 10, x: 0 })));
    else if (l.startsWith('## ')) items.push(...wrap(l.slice(3), 70).map((t, i) => ({ f: 'F2', s: 13, t, gap: i ? 2 : 12, x: 0 })));
    else if (l.startsWith('- ')) items.push(...wrap(l.slice(2), 80).map((t, i) => ({ f: 'F1', s: 11, t: i ? t : '- ' + t, gap: 3, x: i ? 20 : 8 })));
    else if (l === '') items.push({ f: 'F1', s: 11, t: '', gap: 4, x: 0 });
    else items.push(...wrap(l, 88).map((t) => ({ f: 'F1', s: 11, t, gap: 3, x: 0 })));
  }

  const pages = [[]];
  let y = H - M;
  for (const it of items) {
    const step = it.s + it.gap;
    if (y - step < M + 20) {
      pages.push([]);
      y = H - M;
    }
    y -= step;
    if (it.t) pages[pages.length - 1].push(`BT /${it.f} ${it.s} Tf ${M + it.x} ${y} Td (${esc(it.t)}) Tj ET`);
  }
  pages.forEach((ops, i) => ops.push(`BT /F1 9 Tf ${M} 30 Td (${esc(sanitize(`AptiLearn - ${title} - page ${i + 1} of ${pages.length}`))}) Tj ET`));

  const objs = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  const kids = pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ');
  objs[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  pages.forEach((ops, i) => {
    const stream = ops.join('\n');
    objs[5 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`;
    objs[6 + i * 2] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let n = 1; n < objs.length; n++) {
    offsets[n] = pdf.length;
    pdf += `${n} 0 obj\n${objs[n]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let n = 1; n < objs.length; n++) pdf += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}
