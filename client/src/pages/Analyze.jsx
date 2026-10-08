import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useToast } from '../context/ToastContext';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  X,
  Briefcase,
  GraduationCap,
  Award,
  Linkedin,
  Zap,
  FileCheck
} from 'lucide-react';

const Analyze = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [mode, setMode] = useState('general');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      showToast('Invalid file format. Please upload a PDF file.', 'error');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast('File size exceeds 5 MB limit. Please select a smaller PDF.', 'error');
      return;
    }
    setFile(selectedFile);
    showToast(`Uploaded ${selectedFile.name} successfully`, 'success');
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleLoadSampleJD = () => {
    setJobTitle('Full Stack Software Engineer');
    setJobDescription(
      `We are seeking a Full Stack Software Engineer proficient in React, Node.js, Express, and MongoDB (MERN stack). Key responsibilities include developing responsive web applications, building RESTful API endpoints, optimizing database performance, and collaborating in an Agile environment. Preferred qualifications: 2+ years of experience with modern JavaScript/TypeScript, Git, Docker, microservices, and AI API integrations (such as OpenAI or Google Gemini). Strong problem-solving abilities and writing clean, scalable code required.`
    );
    showToast('Loaded sample job description.', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please upload your resume PDF file.', 'error');
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      showToast('Please paste a valid job description (at least 20 characters).', 'error');
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysisStep(1);

      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription.trim());
      formData.append('jobTitle', jobTitle.trim());
      formData.append('mode', mode);

      // Step transition simulation
      setTimeout(() => setAnalysisStep(2), 1200);
      setTimeout(() => setAnalysisStep(3), 2800);

      const res = await axiosClient.post('/analyses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showToast('Resume analysis complete!', 'success');
      navigate(`/result/${res.data.data._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to complete analysis. Please try again.';
      showToast(msg, 'error');
    } finally {
      setAnalyzing(false);
      setAnalysisStep(1);
    }
  };

  const modesConfig = [
    {
      id: 'general',
      title: 'General ATS',
      desc: 'Standard ATS scan & recruiter analysis for experienced roles.',
      icon: Briefcase,
    },
    {
      id: 'fresher',
      title: 'Fresher / Graduate',
      desc: 'Emphasizes Projects & Skills without work experience penalty.',
      icon: GraduationCap,
    },
    {
      id: 'internship',
      title: 'Internship',
      desc: 'Weighs coursework, lab projects & enthusiasm for intern roles.',
      icon: Award,
    },
    {
      id: 'linkedin',
      title: 'LinkedIn Optimizer',
      desc: 'Adds 3 headline options, About section rewrite & top skills.',
      icon: Linkedin,
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 analyzer-page">
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span>Powered by Google Gemini</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-main">
          AI resume and ATS score analyzer
        </h1>
        <p className="text-muted text-sm sm:text-base mt-2">
          Upload your resume PDF and paste target job description to receive an instant match score, missing keywords, and tailored bullet rewrites.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Mode Selector */}
        <div className="glass-panel p-6 rounded-2xl border border-line">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-main flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-main text-xs font-medium">1</span>
              Select analysis mode
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modesConfig.map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  aria-pressed={isSelected}
                  className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-page border-primary'
                      : 'bg-surface border-line hover:border-line hover:bg-page'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-md ${isSelected ? 'bg-page text-primary' : 'bg-page text-muted'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                  <h3 className="font-medium text-main text-sm">{m.title}</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 & 3: File Upload & Job Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: PDF Dropzone */}
          <div className="glass-panel p-6 rounded-2xl border border-line flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-main flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-page border border-line text-primary text-xs font-medium">2</span>
                  Upload resume PDF
                </h2>
                <span className="text-xs text-muted">PDF only, max 5 MB</span>
              </div>

              {!file ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer min-h-[220px] ${
                    dragActive
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-line bg-surface hover:border-primary/30 hover:bg-page'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload-input"
                  />
                  <label htmlFor="resume-upload-input" className="cursor-pointer flex flex-col items-center">
                    <div className="w-14 h-14 rounded-lg bg-page border border-line text-primary flex items-center justify-center mb-4">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-medium text-main">
                      Drag and drop your resume PDF here or <span className="text-primary underline">browse</span>
                    </p>
                    <p className="text-xs text-muted mt-2">Text-based PDF format supported</p>
                  </label>
                </div>
              ) : (
                <div className="bg-surface border border-line rounded-lg p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-page text-primary flex items-center justify-center border border-line">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium text-main text-sm truncate max-w-[220px] sm:max-w-[280px]">
                        {file.name}
                      </h4>
                      <p className="text-xs text-muted mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 hover:bg-error/10 text-muted hover:text-error rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Job Title Input (Optional) */}
            <div className="mt-6">
              <label htmlFor="job-title" className="block text-xs font-medium  text-main mb-2">
                Job title or position (optional)
              </label>
              <input
                id="job-title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Developer, Data Analyst"
                className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-main placeholder-muted focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          {/* Right Column: Job Description Textarea */}
          <div className="glass-panel p-6 rounded-2xl border border-line flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-main flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-page border border-line text-primary text-xs font-medium">3</span>
                  Target job description
                </h2>
                <button
                  type="button"
                  onClick={handleLoadSampleJD}
                  className="text-xs text-primary hover:text-primary font-medium hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load sample JD
                </button>
              </div>

              <div className="relative">
                <label htmlFor="job-description" className="sr-only">Target job description</label>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={9}
                  placeholder="Paste the target job description requirements, responsibilities, and qualifications here..."
                  className="w-full p-4 bg-surface border border-line rounded-xl text-main placeholder-muted focus:outline-none focus:border-primary text-sm leading-relaxed resize-none"
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted font-mono">
                  {jobDescription.length} chars
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit CTA & Loading overlay */}
        <div className="text-center pt-2">
          <button
            type="submit"
            disabled={analyzing}
            className="button button-primary w-full sm:w-auto px-10 py-4 text-white text-base font-medium rounded-md transition-colors flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
          >
            {analyzing ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-line border-t-white rounded-full animate-spin" />
                <span>
                  {analysisStep === 1 && 'Extracting & Parsing PDF text...'}
                  {analysisStep === 2 && 'Evaluating ATS Match with Gemini AI...'}
                  {analysisStep === 3 && 'Finalizing Recommendations...'}
                </span>
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Analyze Resume Now</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Analyze;
