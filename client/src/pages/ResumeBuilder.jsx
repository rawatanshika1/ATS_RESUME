import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowUpRight, BriefcaseBusiness, Check, ChevronDown, ChevronUp, CirclePlus, ClipboardCheck, GraduationCap, LoaderCircle, Sparkles, Trash2, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import ResumePreview from '../components/ResumePreview';
import { useToast } from '../context/ToastContext';
import { emptyResume, resumeTemplates, resumeToText } from '../data/resumeTemplates';

const listSections = [
  { key: 'experience', title: 'Experience', icon: BriefcaseBusiness, itemLabel: 'position', fields: [{ key: 'role', label: 'Job title', placeholder: 'e.g. Product Designer' }, { key: 'company', label: 'Company', placeholder: 'Company name' }, { key: 'location', label: 'Location', placeholder: 'City, Country' }, { key: 'startDate', label: 'Start date', placeholder: 'MM/YYYY' }, { key: 'endDate', label: 'End date', placeholder: 'Present' }, { key: 'description', label: 'What did you accomplish?', placeholder: 'Share your responsibilities, achievements, and measurable impact.', multiline: true }] },
  { key: 'projects', title: 'Projects', icon: ClipboardCheck, itemLabel: 'project', fields: [{ key: 'name', label: 'Project name', placeholder: 'Project title' }, { key: 'link', label: 'Link', placeholder: 'https://...' }, { key: 'description', label: 'What did you build?', placeholder: 'Describe your contribution, tools, and results.', multiline: true }] },
  { key: 'education', title: 'Education', icon: GraduationCap, itemLabel: 'education', fields: [{ key: 'degree', label: 'Degree or qualification', placeholder: 'e.g. B.S. Computer Science' }, { key: 'school', label: 'School', placeholder: 'University or institution' }, { key: 'location', label: 'Location', placeholder: 'City, Country' }, { key: 'startDate', label: 'Start date', placeholder: 'YYYY' }, { key: 'endDate', label: 'End date', placeholder: 'YYYY' }, { key: 'description', label: 'Details (optional)', placeholder: 'Relevant coursework, honors, or activities.', multiline: true }] },
  { key: 'certifications', title: 'Certifications', icon: ClipboardCheck, itemLabel: 'certification', fields: [{ key: 'name', label: 'Certification', placeholder: 'Certification name' }, { key: 'issuer', label: 'Issuing organization', placeholder: 'Organization' }, { key: 'date', label: 'Date', placeholder: 'Month YYYY' }] }
];

const freshResume = (templateId) => ({
  ...emptyResume,
  templateId: resumeTemplates.some((template) => template.id === templateId) ? templateId : emptyResume.templateId,
  personalInfo: { ...emptyResume.personalInfo },
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: []
});

const fromSavedResume = (saved) => {
  const sections = saved.sections || {};
  return {
    ...freshResume(saved.templateId),
    title: saved.title || '',
    templateId: saved.templateId || emptyResume.templateId,
    ...sections,
    personalInfo: { ...emptyResume.personalInfo, ...sections.personalInfo },
    skills: (sections.skills || []).map((skill) => typeof skill === 'string' ? skill : skill.name || skill.skill || '').filter(Boolean),
    experience: sections.experience || [],
    projects: sections.projects || [],
    education: sections.education || [],
    certifications: sections.certifications || []
  };
};

const toResumePayload = (resume) => ({
  title: resume.title,
  templateId: resume.templateId,
  sections: {
    personalInfo: resume.personalInfo,
    summary: resume.summary,
    skills: resume.skills,
    experience: resume.experience,
    projects: resume.projects,
    education: resume.education,
    certifications: resume.certifications
  }
});

const ResumeBuilder = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const selectedTemplate = searchParams.get('template');
  const [resume, setResume] = useState(() => location.state?.draft
    ? { ...freshResume(location.state.draft.templateId), ...location.state.draft }
    : freshResume(selectedTemplate));
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('form');
  const [openSections, setOpenSections] = useState({ personalInfo: true, summary: true, skills: true, experience: true });
  const [atsJobDescription, setAtsJobDescription] = useState('');
  const [atsJobTitle, setAtsJobTitle] = useState('');
  const [atsMode, setAtsMode] = useState('general');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAction, setAiAction] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState('');
  const [bulletSelection, setBulletSelection] = useState('');
  const [coverLetterTone, setCoverLetterTone] = useState('formal');
  const [resumeId, setResumeId] = useState(id || null);
  const previewRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const bulletOptions = ['experience', 'projects'].flatMap((section) => (
    resume[section].flatMap((entry, entryIndex) => (
      String(entry.description || '').split(/\r?\n/).map((line, lineIndex) => ({
        id: `${section}-${entryIndex}-${lineIndex}`,
        section,
        entryIndex,
        lineIndex,
        text: line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()
      })).filter((bullet) => bullet.text)
    ))
  ));
  const selectedBullet = bulletOptions.find((bullet) => bullet.id === bulletSelection);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    if (location.state?.draft) {
      setResume({
        ...freshResume(selectedTemplate || location.state.draft.templateId),
        ...location.state.draft,
        templateId: selectedTemplate || location.state.draft.templateId
      });
      setResumeId(id);
      setLoading(false);
      return () => { cancelled = true; };
    }
    const loadResume = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/resumes/${id}`);
        if (!cancelled) {
          setResume({
            ...fromSavedResume(response.data.data),
            templateId: selectedTemplate || response.data.data.templateId
          });
          setResumeId(id);
        }
      } catch (error) {
        showToast(error.response?.data?.message || 'Could not load this resume.', 'error');
        navigate('/builder');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadResume();
    return () => { cancelled = true; };
  }, [id, location.state, navigate, selectedTemplate, showToast]);

  const updateField = (field, value) => setResume((current) => ({ ...current, [field]: value }));
  const updatePersonal = (field, value) => setResume((current) => ({ ...current, personalInfo: { ...current.personalInfo, [field]: value } }));
  const updateEntry = (section, index, field, value) => setResume((current) => ({
    ...current,
    [section]: current[section].map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry)
  }));
  const addEntry = (section) => setResume((current) => ({ ...current, [section]: [...current[section], {}] }));
  const removeEntry = (section, index) => setResume((current) => ({ ...current, [section]: current[section].filter((_, entryIndex) => entryIndex !== index) }));
  const toggleSection = (section) => setOpenSections((current) => ({ ...current, [section]: !current[section] }));

  const saveResume = async () => {
    if (!resume.title.trim()) {
      showToast('Give your resume a name before saving.', 'error');
      document.getElementById('resume-title')?.focus();
      return false;
    }
    try {
      setSaving(true);
      const response = resumeId
        ? await axiosClient.put(`/resumes/${resumeId}`, toResumePayload(resume))
        : await axiosClient.post('/resumes', toResumePayload(resume));
      const saved = response.data.data;
      const savedId = saved._id || saved.id;
      setResume(fromSavedResume(saved));
      setResumeId(savedId);
      if (!resumeId && savedId) navigate(`/builder/${savedId}`, { replace: true });
      showToast('Resume saved.', 'success');
      return true;
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not save your resume. Please try again.', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    if (!resume.personalInfo.fullName?.trim()) {
      showToast('Add your name before downloading your resume.', 'error');
      return;
    }
    setDownloadingPdf(true);
    try {
      const { downloadResumePdf } = await import('../utils/downloadResumePdf');
      downloadResumePdf(resume);
      showToast('Your selectable-text PDF is downloading.', 'success');
    } catch (error) {
      console.error('Resume PDF export failed:', error);
      showToast('Could not create the PDF. Please try again.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const applyAts = async (event) => {
    event.preventDefault();
    const resumeText = resumeToText(resume);
    const resumeValues = [
      resume.personalInfo.fullName,
      resume.summary,
      ...resume.skills,
      ...resume.experience.flatMap((entry) => Object.values(entry)),
      ...resume.projects.flatMap((entry) => Object.values(entry)),
      ...resume.education.flatMap((entry) => Object.values(entry)),
      ...resume.certifications.flatMap((entry) => Object.values(entry))
    ];
    if (!resumeText || !resumeValues.some((value) => String(value || '').trim())) {
      showToast('Add some resume details before running an ATS check.', 'error');
      return;
    }
    if (atsJobDescription.trim().length < 20) {
      showToast('Paste a job description with at least 20 characters.', 'error');
      return;
    }
    try {
      setAnalyzing(true);
      const response = await axiosClient.post('/analyses/text', {
        resumeText,
        jobDescription: atsJobDescription.trim(),
        jobTitle: atsJobTitle.trim() || resume.title.trim() || 'Target Position',
        mode: atsMode
      });
      showToast('ATS analysis complete.', 'success');
      navigate(`/result/${response.data.data._id}`);
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not analyze this resume right now.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateAiContent = async (action) => {
    const resumeText = resumeToText({ ...resume, personalInfo: {} });
    const hasResumeContent = [
      resume.summary,
      ...resume.skills,
      ...resume.experience.flatMap((entry) => Object.values(entry)),
      ...resume.projects.flatMap((entry) => Object.values(entry)),
      ...resume.education.flatMap((entry) => Object.values(entry)),
      ...resume.certifications.flatMap((entry) => Object.values(entry))
    ].some((value) => String(value || '').trim());
    if (!hasResumeContent) {
      showToast('Add some resume details before using an AI writing tool.', 'error');
      return;
    }
    if (action !== 'improveBullet' && atsJobDescription.trim().length < 20) {
      showToast('Paste a job description with at least 20 characters to use this tool.', 'error');
      return;
    }
    if (action === 'improveBullet' && !selectedBullet) {
      showToast('Select a resume bullet to improve.', 'error');
      return;
    }

    try {
      setAiLoading(action);
      setAiAction(action);
      setAiResult(null);
      const response = await axiosClient.post('/resumes/ai', {
        action,
        resumeText,
        jobDescription: atsJobDescription.trim(),
        ...(action === 'improveBullet' ? { bullet: selectedBullet.text } : {}),
        ...(action === 'coverLetter' ? { tone: coverLetterTone } : {})
      });
      setAiResult(response.data.data);
      showToast('AI suggestions are ready. Review them before applying.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not generate AI suggestions right now.', 'error');
    } finally {
      setAiLoading('');
    }
  };

  const applyBulletRewrite = (rewrite) => {
    if (!selectedBullet) return;
    updateEntry(selectedBullet.section, selectedBullet.entryIndex, 'description', (resume[selectedBullet.section][selectedBullet.entryIndex].description || '')
      .split(/\r?\n/)
      .map((line, index) => {
        if (index !== selectedBullet.lineIndex) return line;
        const prefix = line.match(/^\s*(?:[-*•]|\d+[.)])\s*/)?.[0] || '';
        return `${prefix}${rewrite}`;
      })
      .join('\n'));
    setAiResult(null);
    showToast('Bullet rewrite applied to your resume.', 'success');
  };

  if (loading) return <div className="resume-state"><LoaderCircle className="resume-spinner" size={25} /><p>Loading your resume...</p></div>;

  return (
    <section className="resume-workspace resume-editor">
      <div className="editor-toolbar">
        <div className="editor-heading">
          <Link className="resume-back-link" to="/builder"><ArrowLeft size={15} /> My resumes</Link>
          <label className="sr-only" htmlFor="resume-title">Resume name</label>
          <input id="resume-title" className="resume-title-input" value={resume.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Untitled resume" maxLength={100} />
        </div>
        <div className="editor-actions">
          <Link className="editor-template-link" to="/builder/templates" state={{ draft: resume, resumeId }}>Change template <ArrowUpRight size={14} /></Link>
          <button className="button button-outline" type="button" onClick={downloadPdf} disabled={downloadingPdf}>{downloadingPdf ? <LoaderCircle className="resume-spinner" size={16} /> : <ArrowDownToLine size={16} />}{downloadingPdf ? 'Preparing...' : 'Download PDF'}</button>
          <button className="button button-primary editor-save-button" type="button" onClick={saveResume} disabled={saving}>
            {saving ? <LoaderCircle className="resume-spinner" size={16} /> : <Check size={16} />} {saving ? 'Saving...' : 'Save resume'}
          </button>
        </div>
      </div>

      <div className="editor-tabs" role="tablist" aria-label="Resume editor view">
        <button type="button" role="tab" aria-selected={activeTab === 'form'} className={activeTab === 'form' ? 'active' : ''} onClick={() => setActiveTab('form')}>Edit details</button>
        <button type="button" role="tab" aria-selected={activeTab === 'preview'} className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')}>Live preview</button>
      </div>

      <div className={`editor-layout ${activeTab === 'preview' ? 'mobile-preview-active' : ''}`}>
        <div className="editor-form-column">
          <section className="editor-card">
            <button type="button" className="editor-section-heading" aria-expanded={openSections.personalInfo} onClick={() => toggleSection('personalInfo')}>
              <span className="editor-section-icon"><UserRound size={17} /></span><span className="editor-section-title"><span>Personal information</span><small>How employers can reach you</small></span>{openSections.personalInfo ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
            {openSections.personalInfo && <div className="editor-fields">
              <EditorField label="Full name" value={resume.personalInfo.fullName} onChange={(value) => updatePersonal('fullName', value)} placeholder="Your name" />
              <div className="editor-field-row"><EditorField label="Email" type="email" value={resume.personalInfo.email} onChange={(value) => updatePersonal('email', value)} placeholder="you@example.com" /><EditorField label="Phone" type="tel" value={resume.personalInfo.phone} onChange={(value) => updatePersonal('phone', value)} placeholder="+1 (555) 123-4567" /></div>
              <EditorField label="Location" value={resume.personalInfo.location} onChange={(value) => updatePersonal('location', value)} placeholder="City, Country" />
              <div className="editor-field-row"><EditorField label="LinkedIn" value={resume.personalInfo.linkedin} onChange={(value) => updatePersonal('linkedin', value)} placeholder="linkedin.com/in/you" /><EditorField label="Website" value={resume.personalInfo.website} onChange={(value) => updatePersonal('website', value)} placeholder="yourwebsite.com" /></div>
            </div>}
          </section>

          <section className="editor-card">
            <button type="button" className="editor-section-heading" aria-expanded={openSections.summary} onClick={() => toggleSection('summary')}>
              <span className="editor-section-icon"><Sparkles size={17} /></span><span className="editor-section-title"><span>Objective / summary</span><small>A short introduction to your experience</small></span>{openSections.summary ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
            {openSections.summary && <div className="editor-fields"><EditorField label="Professional summary" multiline value={resume.summary} onChange={(value) => updateField('summary', value)} placeholder="Describe your experience, strengths, and what you bring to your next role." /><span className="field-hint">{resume.summary.length}/1,200 characters</span></div>}
          </section>

          <section className="editor-card">
            <button type="button" className="editor-section-heading" aria-expanded={openSections.skills} onClick={() => toggleSection('skills')}>
              <span className="editor-section-icon"><Sparkles size={17} /></span><span className="editor-section-title"><span>Skills</span><small>Separate each skill with a comma</small></span>{openSections.skills ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
            {openSections.skills && <div className="editor-fields"><EditorField label="Skills" multiline value={resume.skills.join(', ')} onChange={(value) => updateField('skills', value.split(/[,;\n]/).map((skill) => skill.trim()).filter(Boolean))} placeholder="Project management, Figma, User research, Communication" /><div className="resume-chips">{resume.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>}
          </section>

          {listSections.map(({ key, title, icon: Icon, itemLabel, fields }) => (
            <section className="editor-card" key={key}>
              <button type="button" className="editor-section-heading" aria-expanded={openSections[key]} onClick={() => toggleSection(key)}>
                <span className="editor-section-icon"><Icon size={17} /></span><span className="editor-section-title"><span>{title}</span><small>{resume[key].length ? `${resume[key].length} ${resume[key].length === 1 ? 'entry' : 'entries'}` : 'Add relevant details'}</small></span>{openSections[key] ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
              {openSections[key] && <div className="editor-fields">
                {resume[key].map((entry, index) => <div className="repeatable-entry" key={`${key}-${index}`}>
                  <div className="repeatable-entry-top"><span>{itemLabel} {index + 1}</span><button type="button" className="remove-entry-button" aria-label={`Remove ${itemLabel} ${index + 1}`} onClick={() => removeEntry(key, index)}><Trash2 size={14} /> Remove</button></div>
                  <div className="editor-field-grid">{fields.map((field) => <EditorField key={field.key} label={field.label} placeholder={field.placeholder} multiline={field.multiline} fieldId={`${key}-${index}-${field.key}`} value={entry[field.key] || ''} onChange={(value) => updateEntry(key, index, field.key, value)} />)}</div>
                </div>)}
                <button type="button" className="add-entry-button" onClick={() => addEntry(key)}><CirclePlus size={16} /> Add {itemLabel}</button>
              </div>}
            </section>
          ))}
        </div>

        <aside className="editor-preview-column">
          <div className="preview-panel-heading"><div><span className="section-kicker">Live preview</span><h3>{resumeTemplates.find((item) => item.id === resume.templateId)?.name || 'Classic'} template</h3></div><span className="preview-live-dot"><span /> Live</span></div>
          <div className="resume-preview-stage"><ResumePreview resume={resume} previewRef={previewRef} /></div>
          <form className="ats-apply-card" onSubmit={applyAts}>
            <div className="ats-apply-heading"><span><Sparkles size={17} /></span><div><h3>Check your ATS match</h3><p>Compare this resume to a job description.</p></div></div>
            <EditorField label="Job title (optional)" value={atsJobTitle} onChange={setAtsJobTitle} placeholder="e.g. Product Designer" />
            <label className="editor-label" htmlFor="ats-mode">Analysis focus</label>
            <select id="ats-mode" className="editor-input" value={atsMode} onChange={(event) => setAtsMode(event.target.value)}>
              <option value="general">General</option><option value="fresher">Fresher / graduate</option><option value="internship">Internship</option><option value="linkedin">LinkedIn</option>
            </select>
            <EditorField label="Job description" multiline value={atsJobDescription} onChange={setAtsJobDescription} placeholder="Paste the job description here (at least 20 characters)." />
            <button type="submit" className="button button-primary ats-apply-button" disabled={analyzing}>{analyzing ? <LoaderCircle className="resume-spinner" size={16} /> : <Sparkles size={16} />}{analyzing ? 'Checking your match...' : 'Apply ATS'}</button>
          </form>
          <section className="ats-apply-card ai-tools-card">
            <div className="ats-apply-heading"><span><Sparkles size={17} /></span><div><h3>AI career tools</h3><p>Use the job description above where relevant. Suggestions never change your resume until you apply them.</p></div></div>
            <div className="editor-field">
              <label className="editor-label" htmlFor="ai-bullet">Bullet to improve</label>
              <select id="ai-bullet" className="editor-input" value={bulletSelection} onChange={(event) => setBulletSelection(event.target.value)}>
                <option value="">Select a bullet from experience or projects</option>
                {bulletOptions.map((bullet) => <option key={bullet.id} value={bullet.id}>{bullet.text}</option>)}
              </select>
            </div>
            <button type="button" className="button button-outline ai-tool-button" onClick={() => generateAiContent('improveBullet')} disabled={Boolean(aiLoading) || !selectedBullet}>
              {aiLoading === 'improveBullet' ? <LoaderCircle className="resume-spinner" size={15} /> : <Sparkles size={15} />} Improve bullet
            </button>
            <button type="button" className="button button-outline ai-tool-button" onClick={() => generateAiContent('tailor')} disabled={Boolean(aiLoading)}>
              {aiLoading === 'tailor' ? <LoaderCircle className="resume-spinner" size={15} /> : <Sparkles size={15} />} Tailor summary & skills
            </button>
            <div className="editor-field">
              <label className="editor-label" htmlFor="cover-letter-tone">Cover letter tone</label>
              <select id="cover-letter-tone" className="editor-input" value={coverLetterTone} onChange={(event) => setCoverLetterTone(event.target.value)}>
                <option value="formal">Formal</option><option value="friendly">Friendly</option><option value="concise">Concise</option>
              </select>
            </div>
            <button type="button" className="button button-outline ai-tool-button" onClick={() => generateAiContent('coverLetter')} disabled={Boolean(aiLoading)}>
              {aiLoading === 'coverLetter' ? <LoaderCircle className="resume-spinner" size={15} /> : <Sparkles size={15} />} Generate cover letter
            </button>
            <button type="button" className="button button-outline ai-tool-button" onClick={() => generateAiContent('interviewQuestions')} disabled={Boolean(aiLoading)}>
              {aiLoading === 'interviewQuestions' ? <LoaderCircle className="resume-spinner" size={15} /> : <Sparkles size={15} />} Prepare interview questions
            </button>
            <button type="button" className="button button-outline ai-tool-button" onClick={() => generateAiContent('skillRoadmap')} disabled={Boolean(aiLoading)}>
              {aiLoading === 'skillRoadmap' ? <LoaderCircle className="resume-spinner" size={15} /> : <Sparkles size={15} />} Build skill-gap roadmap
            </button>
            {aiResult && <div className="ai-result-panel" aria-live="polite">
              {aiAction === 'improveBullet' && <><h4>Three stronger options</h4>{aiResult.rewrites.map((rewrite, index) => <div className="ai-result-item" key={`${index}-${rewrite}`}><p>{rewrite}</p><button type="button" className="ai-apply-button" onClick={() => applyBulletRewrite(rewrite)}>Apply rewrite</button></div>)}</>}
              {aiAction === 'tailor' && <><h4>Tailored summary</h4><p>{aiResult.summary}</p><button type="button" className="ai-apply-button" onClick={() => { updateField('summary', aiResult.summary); showToast('Tailored summary applied.', 'success'); }}>Apply summary</button><h4>Supported skills</h4><div className="resume-chips">{aiResult.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><button type="button" className="ai-apply-button" onClick={() => { updateField('skills', aiResult.skills); showToast('Tailored skills applied.', 'success'); }}>Replace skills</button></>}
              {aiAction === 'coverLetter' && <><h4>Cover letter</h4><p className="ai-cover-letter">{aiResult.coverLetter}</p></>}
              {aiAction === 'interviewQuestions' && <><h4>Technical questions ({aiResult.technicalQuestions.length})</h4>{aiResult.technicalQuestions.map((item, index) => <div className="ai-result-item" key={`technical-${index}`}><span>{index + 1}. {item.question}</span><p><span>Tip:</span> {item.answerTip}</p></div>)}<h4>HR questions ({aiResult.hrQuestions.length})</h4>{aiResult.hrQuestions.map((item, index) => <div className="ai-result-item" key={`hr-${index}`}><span>{index + 1}. {item.question}</span><p><span>Tip:</span> {item.answerTip}</p></div>)}</>}
              {aiAction === 'skillRoadmap' && <><h4>Prioritized learning roadmap</h4>{aiResult.roadmap.length ? aiResult.roadmap.map((item, index) => <div className="ai-result-item" key={`${item.keyword}-${index}`}><span>{item.keyword} <span className={`ai-priority priority-${item.priority}`}>{item.priority}</span></span><p>{item.gap}</p><p><span>Next step:</span> {item.action}</p><small>{item.timeframe}</small></div>) : <p>No significant skill gaps were identified from this resume and job description.</p>}</>}
            </div>}
          </section>
          <div className="editor-note"><Check size={14} /> Single-column layout, standard fonts, and text-based sections.</div>
        </aside>
      </div>
    </section>
  );
};

function EditorField({ label, value, onChange, placeholder, multiline = false, type = 'text', fieldId }) {
  const id = fieldId || `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="editor-field">
      <label className="editor-label" htmlFor={id}>{label}</label>
      {multiline
        ? <textarea id={id} className="editor-input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} />
        : <input id={id} className="editor-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}
    </div>
  );
}

export default ResumeBuilder;
