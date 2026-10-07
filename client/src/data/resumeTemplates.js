export const resumeTemplates = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'A clean, dependable format that keeps the focus on your experience.',
    style: 'template-classic'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'A contemporary resume with crisp headings and generous whitespace.',
    style: 'template-modern'
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'A space-conscious layout for experienced professionals.',
    style: 'template-compact'
  },
  {
    id: 'elegant',
    name: 'Executive',
    description: 'A polished, understated layout for your next leadership role.',
    style: 'template-elegant'
  }
];

export const emptyResume = {
  title: '',
  templateId: 'classic',
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: ''
  },
  summary: '',
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: []
};

export function resumeToText(resume) {
  const { personalInfo = {}, summary = '', skills = [], experience = [], projects = [], education = [], certifications = [] } = resume;
  const lines = [
    personalInfo.fullName,
    [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin, personalInfo.website].filter(Boolean).join(' | '),
    '',
    'SUMMARY',
    summary,
    '',
    'SKILLS',
    skills.join(', ')
  ];

  const appendEntries = (heading, entries, fields) => {
    lines.push('', heading);
    entries.forEach((entry) => {
      lines.push(fields.map((field) => entry[field]).filter(Boolean).join(' | '));
      if (entry.description) lines.push(entry.description);
    });
  };

  appendEntries('EXPERIENCE', experience, ['role', 'company', 'location', 'startDate', 'endDate']);
  appendEntries('PROJECTS', projects, ['name', 'link']);
  appendEntries('EDUCATION', education, ['degree', 'school', 'location', 'startDate', 'endDate']);
  appendEntries('CERTIFICATIONS', certifications, ['name', 'issuer', 'date']);

  return lines.filter((line) => line !== undefined && line !== null).join('\n').trim();
}
