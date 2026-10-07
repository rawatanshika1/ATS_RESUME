import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, FilePlus2, FileText, LoaderCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useToast } from '../context/ToastContext';
import { resumeTemplates } from '../data/resumeTemplates';

const ResumeList = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadResumes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/resumes');
      setResumes(response.data.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not load your saved resumes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadResumes(); }, [loadResumes]);

  const deleteResume = async (resume) => {
    if (!window.confirm(`Delete "${resume.title || 'Untitled resume'}"? This cannot be undone.`)) return;
    try {
      await axiosClient.delete(`/resumes/${resume._id || resume.id}`);
      setResumes((items) => items.filter((item) => (item._id || item.id) !== (resume._id || resume.id)));
      showToast('Resume deleted.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not delete this resume.', 'error');
    }
  };

  return (
    <section className="resume-workspace">
      <div className="resume-page-heading">
        <div><span className="section-kicker">YOUR CAREER, YOUR STORY</span><h2>My resumes</h2><p>Build, refine, and keep every version ready for its next opportunity.</p></div>
        <Link className="button button-primary resume-new-button" to="/builder/templates"><FilePlus2 size={17} /> Create a resume</Link>
      </div>
      {loading ? <div className="resume-state"><LoaderCircle className="resume-spinner" size={25} /><p>Loading your resumes...</p></div> :
        resumes.length === 0 ? (
          <div className="resume-empty">
            <span className="resume-empty-icon"><FileText size={26} /></span>
            <h3>Your next resume starts here</h3>
            <p>Choose a clean, ATS-friendly template and build a resume that reflects your experience.</p>
            <Link className="button button-primary" to="/builder/templates">Explore templates <ArrowRight size={16} /></Link>
          </div>
        ) : (
          <div className="resume-list-grid">
            {resumes.map((resume) => {
              const template = resumeTemplates.find((item) => item.id === resume.templateId) || resumeTemplates[0];
              return (
                <article className="saved-resume-card" key={resume._id || resume.id}>
                  <button type="button" className="saved-resume-preview" onClick={() => navigate(`/builder/${resume._id || resume.id}`)} aria-label={`Edit ${resume.title || 'untitled resume'}`}>
                    <span className={`saved-resume-page ${template.style}`}><i /><i /><i /><i /><i /><i /></span>
                  </button>
                  <div className="saved-resume-info">
                    <div><h3>{resume.title || resume.sections?.personalInfo?.fullName || 'Untitled resume'}</h3><p>{template.name} · Updated {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()}</p></div>
                    <div className="saved-resume-actions">
                      <button className="icon-button" type="button" onClick={() => navigate(`/builder/${resume._id || resume.id}`)} aria-label="Edit resume"><Pencil size={15} /></button>
                      <button className="icon-button resume-delete-button" type="button" onClick={() => deleteResume(resume)} aria-label="Delete resume"><Trash2 size={15} /></button>
                      <button className="icon-button" type="button" aria-label="More options" onClick={() => navigate(`/builder/${resume._id || resume.id}`)}><MoreHorizontal size={17} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
    </section>
  );
};

export default ResumeList;
