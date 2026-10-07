import React from 'react';
import { ArrowLeft, ArrowRight, Check, FileText } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ResumePreview from '../components/ResumePreview';
import { emptyResume, resumeTemplates } from '../data/resumeTemplates';

const ResumeTemplates = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const draft = location.state?.draft;
  const resumeId = location.state?.resumeId;
  const backPath = draft ? (resumeId ? `/builder/${resumeId}` : `/builder/new?template=${draft.templateId}`) : '/builder';

  const chooseTemplate = (templateId) => {
    const path = resumeId ? `/builder/${resumeId}` : '/builder/new';
    navigate(`${path}?template=${templateId}`, {
      state: draft ? { draft: { ...draft, templateId }, resumeId } : undefined
    });
  };

  return (
    <section className="resume-workspace">
      <div className="resume-page-heading">
        <div>
          <Link className="resume-back-link" to={backPath} state={draft ? { draft, resumeId } : undefined}><ArrowLeft size={15} /> {draft ? 'Back to editor' : 'My resumes'}</Link>
          <h2>Pick a starting point</h2>
          <p>Every template is designed to be easy to read and ATS friendly.</p>
        </div>
      </div>
      <div className="template-gallery">
        {resumeTemplates.map((template) => (
          <article className="template-card" key={template.id}>
            <div className="template-thumbnail">
              <ResumePreview resume={{ ...emptyResume, templateId: template.id, personalInfo: { ...emptyResume.personalInfo, fullName: 'Alex Morgan', email: 'alex.morgan@email.com', phone: '(555) 010-2345', location: 'New York, NY' }, summary: 'Results-driven professional with a track record of thoughtful, measurable impact.', skills: ['Project leadership', 'Communication', 'Research', 'Strategy'], experience: [{ role: 'Senior Project Manager', company: 'Northstar Studio', startDate: '2021', endDate: 'Present', description: 'Led cross-functional projects from discovery to launch, improving delivery time by 24%.' }], education: [{ degree: 'B.A. Business Administration', school: 'State University', startDate: '2014', endDate: '2018' }] }} />
            </div>
            <div className="template-card-info">
              <div className="template-card-title"><span className="template-card-icon"><FileText size={16} /></span><h3>{template.name}</h3><span className="template-ats"><Check size={12} /> ATS</span></div>
              <p>{template.description}</p>
              <button type="button" className="button button-primary template-select-button" onClick={() => chooseTemplate(template.id)}>
                Use this template <ArrowRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ResumeTemplates;
