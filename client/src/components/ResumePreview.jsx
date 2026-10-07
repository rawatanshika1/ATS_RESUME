import React from 'react';
import { resumeTemplates } from '../data/resumeTemplates';

const formatPeriod = (start, end) => [start, end].filter(Boolean).join(' – ');

function ResumePreview({ resume, previewRef }) {
  const template = resumeTemplates.find((item) => item.id === resume.templateId) || resumeTemplates[0];
  const { personalInfo = {}, summary = '', skills = [], experience = [], projects = [], education = [], certifications = [] } = resume;
  const contact = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin, personalInfo.website].filter(Boolean);

  const hasEntries = (entries) => entries.some((entry) => Object.values(entry).some(Boolean));

  return (
    <article className={`resume-paper ${template.style}`} ref={previewRef} aria-label={`${template.name} resume preview`}>
      <header className="resume-paper-header">
        <h1>{personalInfo.fullName || 'Your name'}</h1>
        <p className="resume-contact">{contact.length ? contact.join('  |  ') : 'Email  |  Phone  |  Location'}</p>
      </header>

      {summary && <section className="resume-paper-section"><h2>Professional Summary</h2><p className="resume-summary">{summary}</p></section>}
      {skills.length > 0 && <section className="resume-paper-section"><h2>Skills</h2><p>{skills.join('  ·  ')}</p></section>}
      {hasEntries(experience) && <section className="resume-paper-section"><h2>Experience</h2>{experience.filter((item) => Object.values(item).some(Boolean)).map((item, index) => (
        <div className="resume-entry" key={`experience-${index}`}>
          <div className="resume-entry-heading"><strong>{item.role || 'Position'}</strong><span>{formatPeriod(item.startDate, item.endDate)}</span></div>
          <p className="resume-entry-subheading">{[item.company, item.location].filter(Boolean).join(' · ')}</p>
          {item.description && <p className="resume-entry-description">{item.description}</p>}
        </div>
      ))}</section>}
      {hasEntries(projects) && <section className="resume-paper-section"><h2>Projects</h2>{projects.filter((item) => Object.values(item).some(Boolean)).map((item, index) => (
        <div className="resume-entry" key={`project-${index}`}>
          <div className="resume-entry-heading"><strong>{item.name || 'Project'}</strong>{item.link && <span>{item.link}</span>}</div>
          {item.description && <p className="resume-entry-description">{item.description}</p>}
        </div>
      ))}</section>}
      {hasEntries(education) && <section className="resume-paper-section"><h2>Education</h2>{education.filter((item) => Object.values(item).some(Boolean)).map((item, index) => (
        <div className="resume-entry" key={`education-${index}`}>
          <div className="resume-entry-heading"><strong>{item.degree || 'Degree'}</strong><span>{formatPeriod(item.startDate, item.endDate)}</span></div>
          <p className="resume-entry-subheading">{[item.school, item.location].filter(Boolean).join(' · ')}</p>
          {item.description && <p className="resume-entry-description">{item.description}</p>}
        </div>
      ))}</section>}
      {hasEntries(certifications) && <section className="resume-paper-section"><h2>Certifications</h2>{certifications.filter((item) => Object.values(item).some(Boolean)).map((item, index) => (
        <div className="resume-entry" key={`certification-${index}`}>
          <div className="resume-entry-heading"><strong>{item.name || 'Certification'}</strong><span>{item.date}</span></div>
          {item.issuer && <p className="resume-entry-subheading">{item.issuer}</p>}
        </div>
      ))}</section>}
    </article>
  );
}

export default ResumePreview;
