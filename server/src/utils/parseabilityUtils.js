const sectionHeadingPattern = /^\s*(?:professional\s+)?(?:summary|objective|profile|experience|work\s+experience|employment|education|skills|technical\s+skills|projects|certifications|certificates|achievements|awards|publications|volunteer(?:\s+experience)?)\s*:?\s*$/im;
const actionVerbs = new Set([
  'achieved', 'automated', 'built', 'collaborated', 'created', 'delivered', 'designed',
  'developed', 'directed', 'drove', 'engineered', 'established', 'implemented',
  'improved', 'increased', 'launched', 'led', 'managed', 'optimized', 'organized',
  'reduced', 'resolved', 'spearheaded', 'streamlined', 'transformed'
]);
const commonMisspellings = new Set([
  'teh', 'recieve', 'recieved', 'seperate', 'definately', 'occured',
  'accomodate', 'responsibile', 'experiance', 'managment', 'acheived', 'succesful'
]);

const item = (id, label, status, detail) => ({ id, label, status, detail });

const checkParseability = (resumeText) => {
  const text = typeof resumeText === 'string' ? resumeText : '';
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const words = text.match(/\b[\w'-]+\b/g) || [];
  const bullets = lines.filter((line) => /^(?:[-*•]|\d+[.)])\s+/.test(line));
  const contactEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const contactPhone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);
  const metrics = text.match(/(?:\b\d+(?:[.,]\d+)?\s*(?:%|percent\b|x\b|k\b|m\b|million\b|billion\b|hours?\b|days?\b|weeks?\b|months?\b|years?\b)|\$\s?\d|\b\d+\s+(?:users|customers|clients|projects|people|employees|requests|transactions)\b)/gi) || [];
  const actionBulletCount = bullets.filter((line) => {
    const firstWord = line.replace(/^(?:[-*•]|\d+[.)])\s+/, '').match(/[A-Za-z]+/);
    return firstWord && actionVerbs.has(firstWord[0].toLowerCase());
  }).length;
  const likelyColumns = lines.filter((line) => (
    (line.match(/\t/g) || []).length >= 2 ||
    (line.match(/\s{3,}/g) || []).length >= 2
  )).length >= 2;
  const dateFormats = new Set([
    ...(text.match(/\b(?:0?[1-9]|1[0-2])[/-]\d{2,4}\b/g) || []).map(() => 'numeric-month-year'),
    ...(text.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{4}\b/gi) || []).map(() => 'named-month-year'),
    ...(text.match(/\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current)\b/gi) || []).map(() => 'year-range')
  ]);
  const doubledWord = /\b([a-z]+)\s+\1\b/i.test(text);
  const hasCommonMisspelling = [...commonMisspellings].some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text));

  const headings = lines.filter((line) => sectionHeadingPattern.test(line));
  const headingStatus = headings.length >= 3 ? 'pass' : headings.length > 0 ? 'warn' : 'fail';
  const contactStatus = contactEmail && contactPhone ? 'pass' : contactEmail || contactPhone ? 'warn' : 'fail';
  const lengthStatus = words.length >= 200 && words.length <= 1000
    ? 'pass'
    : words.length >= 100 && words.length <= 1200 ? 'warn' : 'fail';
  const bulletStatus = bullets.length >= 2 ? 'pass' : bullets.length === 1 ? 'warn' : 'fail';
  const metricsStatus = metrics.length >= 2 ? 'pass' : metrics.length === 1 ? 'warn' : 'fail';
  const actionStatus = bullets.length > 0 && actionBulletCount / bullets.length >= 0.5
    ? 'pass'
    : actionBulletCount > 0 ? 'warn' : 'fail';
  const consistencyStatus = hasCommonMisspelling || doubledWord
    ? 'warn'
    : dateFormats.size > 1 ? 'warn' : 'pass';

  return [
    item('headings', 'Standard section headings', headingStatus, `${headings.length} recognizable standard section heading${headings.length === 1 ? '' : 's'} found.`),
    item('contact', 'Contact information present', contactStatus, contactEmail && contactPhone
      ? 'Email and phone number detected.'
      : contactEmail || contactPhone ? 'Only an email or phone number was detected.' : 'No email address or phone number detected.'),
    item('length', 'Resume length', lengthStatus, `${words.length} words detected; a concise, role-relevant resume is usually easiest to scan.`),
    item('layout', 'No tables or columns', likelyColumns ? 'warn' : 'pass', likelyColumns
      ? 'Aligned text or tabular columns may not parse consistently in ATS software.'
      : 'No obvious column or table-like text layout detected.'),
    item('bullets', 'Bullet quality', bulletStatus, bullets.length >= 2
      ? `${bullets.length} bullet points detected.`
      : bullets.length === 1 ? 'Only one bullet point detected; use concise bullets for relevant accomplishments.' : 'No standard bullet points detected.'),
    item('metrics', 'Metrics usage', metricsStatus, metrics.length >= 2
      ? `${metrics.length} potential measurable outcomes detected.`
      : metrics.length === 1 ? 'One potential measurable outcome detected; add more only where accurate.' : 'No obvious metrics detected; add measurable outcomes only when you can support them.'),
    item('action-verbs', 'Action verbs', actionStatus, bullets.length
      ? `${actionBulletCount} of ${bullets.length} bullets start with a recognized action verb.`
      : 'Add accomplishment bullets beginning with clear action verbs.'),
    item('spelling', 'Spelling and consistency', consistencyStatus, hasCommonMisspelling || doubledWord
      ? 'Possible spelling error or repeated word detected; proofread the resume.'
      : dateFormats.size > 1 ? 'Mixed date formats detected; use one consistent format.' : 'No common spelling or date-format consistency warnings detected.')
  ];
};

module.exports = { checkParseability };
