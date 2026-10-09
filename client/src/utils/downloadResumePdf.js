import { jsPDF } from 'jspdf';

const templates = {
  classic: { font: 'helvetica', margin: 52, spacing: 1, centered: true },
  modern: { font: 'helvetica', margin: 52, spacing: 1, centered: false },
  compact: { font: 'helvetica', margin: 43, spacing: 0.82, centered: false },
  elegant: { font: 'times', margin: 54, spacing: 1.08, centered: true }
};

const readCssColor = (property) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(property).trim();
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  if (!match) throw new Error(`Invalid resume color token: ${property}`);
  const rgb = Number.parseInt(match[1], 16);
  return [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255];
};

export function createResumePdf(resume) {
  const template = templates[resume.templateId] || templates.classic;
  const accent = readCssColor('--resume-accent');
  const bodyText = readCssColor('--resume-text');
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - template.margin * 2;
  let y = template.margin;

  const ensureRoom = (height) => {
    if (y + height > pageHeight - template.margin) {
      doc.addPage();
      y = template.margin;
    }
  };

  const writeText = (value, { size = 11, style = 'normal', color = bodyText, gap = 0, indent = 0, align } = {}) => {
    if (!value) return;
    doc.setFont(template.font, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(value), contentWidth - indent);
    const lineHeight = size * 1.42 * template.spacing;
    ensureRoom(lines.length * lineHeight + gap);
    doc.text(lines, template.margin + indent, y + size, {
      baseline: 'alphabetic',
      ...(align ? { align } : {})
    });
    y += lines.length * lineHeight + gap;
  };

  const addSection = (title, entries) => {
    if (!entries.length) return;
    y += 8 * template.spacing;
    ensureRoom(26);
    writeText(title, { size: 11, color: accent, gap: 3 });
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.55);
    doc.line(template.margin, y, pageWidth - template.margin, y);
    y += 5 * template.spacing;
    entries.forEach((entry) => writeText(entry, { size: 11, gap: 4 * template.spacing }));
  };

  const { personalInfo = {}, summary = '', skills = [], experience = [], projects = [], education = [], certifications = [] } = resume;
  const fullName = personalInfo.fullName || 'Your name';
  doc.setFont(template.font, 'normal');
  doc.setFontSize(21);
  doc.setTextColor(...accent);
  const nameAlign = template.centered ? 'center' : 'left';
  doc.text(fullName, template.centered ? pageWidth / 2 : template.margin, y + 21, { align: nameAlign });
  y += 29;

  const contacts = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin, personalInfo.website].filter(Boolean);
  if (contacts.length) {
    doc.setFont(template.font, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...bodyText);
    const lines = doc.splitTextToSize(contacts.join('  |  '), contentWidth);
    doc.text(lines, template.centered ? pageWidth / 2 : template.margin, y + 8, { align: template.centered ? 'center' : 'left' });
    y += lines.length * 11 + 6;
  }
  doc.setDrawColor(...accent);
  doc.setLineWidth(resume.templateId === 'modern' ? 1.4 : 0.65);
  doc.line(template.margin, y, pageWidth - template.margin, y);
  y += 5;

  addSection('Professional summary', summary.trim() ? [summary.trim()] : []);
  addSection('Skills', skills.length ? [skills.join('  |  ')] : []);
  addSection('Experience', experience.filter((entry) => Object.values(entry).some(Boolean)).map((entry) => {
    const heading = [entry.role, entry.company, entry.location, [entry.startDate, entry.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' | ');
    return [heading, entry.description].filter(Boolean).join('\n');
  }));
  addSection('Projects', projects.filter((entry) => Object.values(entry).some(Boolean)).map((entry) => [entry.name, entry.link, entry.description].filter(Boolean).join('\n')));
  addSection('Education', education.filter((entry) => Object.values(entry).some(Boolean)).map((entry) => {
    const heading = [entry.degree, entry.school, entry.location, [entry.startDate, entry.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' | ');
    return [heading, entry.description].filter(Boolean).join('\n');
  }));
  addSection('Certifications', certifications.filter((entry) => Object.values(entry).some(Boolean)).map((entry) => [entry.name, entry.issuer, entry.date].filter(Boolean).join(' | ')));

  const filenameBase = (resume.title || fullName || 'resume')
    .normalize('NFKD')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'resume';
  return { doc, filename: `${filenameBase}.pdf` };
}

export function downloadResumePdf(resume) {
  const { doc, filename } = createResumePdf(resume);
  doc.save(filename);
}
