# AI Resume Analyzer (ATS Score) 🚀

An AI-powered Application Tracking System (ATS) Resume Analyzer built with the **MERN Stack** (MongoDB, Express, React, Node.js) and the official **Google Gemini 2.5 API SDK**.

---

## 🌟 Key Features

- **Responsive Career Workspace**: A welcoming landing page, personalized dashboard, light/dark theme, and mobile bottom navigation with a desktop sidebar.
- **Resume Builder**: Create and edit saved resumes with four ATS-friendly, single-column templates, live preview, selectable-text PDF downloads, and ATS analysis against a job description.
- **AI Career Tools**: Generate three fact-grounded bullet rewrites, tailor a resume summary and supported skills to a job description, create a tone-selected cover letter, prepare 10 technical and 5 HR interview questions with answer tips, and build a prioritized skill-gap learning roadmap. Suggestions only update the resume when explicitly applied.
- 📄 **PDF Text Extraction**: Parses text-based resumes up to 5 MB using `pdf-parse` with automatic rejection of scanned or unreadable files.
- 🎯 **ATS Scoring & Category Breakdown**: Generates overall score (0–100%) and individual sub-scores for Keyword Match, Skills Match, Experience Relevance, Formatting, and Education.
- **ATS Parseability & Report Sharing**: Checks common resume parsing criteria, highlights matched keywords against extracted resume text, compares two analyses with score deltas and history trends, and creates revocable read-only report links with optional expiry. Public links omit resume text, filenames, and job descriptions.
- 🏷️ **Matched vs. Missing Keywords**: Color-coded badges for matched keywords and missing keywords categorized by importance (**High**, **Medium**, **Low**) with location guidance.
- 💡 **Tailored Improvement Suggestions**: Detailed issue identification and recommendations with **1-click Copyable Example Rewrites**.
- 🔀 **4 Flexible Analysis Modes**:
  - `General`: Default ATS & recruiter scan for experienced roles.
  - `Fresher`: Focuses on Projects, Skills, and Education without work experience penalty.
  - `Internship`: Evaluates coursework, lab work, and internship-appropriate phrasing.
  - `LinkedIn`: Generates 3 optimized headlines, a tailored "About" summary rewrite, and top skills.
- 📊 **History Tracking & Trends**: Saves all past analyses linked to user accounts, with score-over-time trend visualization and paginated history.
- 🔐 **JWT Authentication & Security**: Password hashing with bcrypt, protected routes, rate limiting, and Helmet headers.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router v7, Tailwind CSS v4, Axios, Recharts, Framer Motion, jsPDF, Lucide Icons.
- **Backend**: Node.js, Express.js, Mongoose (MongoDB), Multer, Zod, Helmet, Express-Rate-Limit.
- **AI SDK**: Official `@google/genai`; the model is selected by the server's `GEMINI_MODEL` setting.
- **PDF Parser**: `pdf-parse`.

---

## 📂 Project Structure

```
Ats_resume_project/
├── README.md
├── client/                     # Vite React Frontend
│   ├── src/
│   │   ├── api/axiosClient.js  # Axios configuration with JWT interceptors
│   │   ├── components/         # Navigation, analysis visualizations, resume preview
│   │   ├── context/            # AuthContext & ToastContext
│   │   ├── pages/              # Auth, workspace, analysis, history, resume builder
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── server/                     # Node.js Express Backend
    ├── src/
    │   ├── config/db.js        # MongoDB Connection
    │   ├── controllers/        # authController, analysisController
    │   ├── middleware/         # authMiddleware, uploadMiddleware, rateLimiter, errorHandler
    │   ├── models/             # User.js, Analysis.js
    │   ├── prompts/            # general, fresher, internship & linkedin prompt templates
    │   ├── services/           # pdfService.js, geminiService.js
    │   ├── utils/              # scoreUtils.js (score clamping & JSON parsing)
    │   ├── tests/              # unitTests.test.js & testAuth.js
    │   ├── app.js
    │   └── server.js
    ├── .env.example
    └── package.json
```

---

## 🗝️ How to Get a Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API Key"** -> **"Create API Key"**.
4. Copy your API key and set it in your `server/.env` file:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `/server` directory (refer to `.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/ats_resume_analyzer
JWT_SECRET=replace_with_a_long_random_secret
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
CLIENT_URL=http://localhost:5173
```

---

## 🚀 Quick Start & Installation

### 1. Backend Setup

```bash
cd server
npm install
```

Start the backend server in development mode:
```bash
npm run dev
```

Run unit & integration tests:
```bash
npm test
```

### 2. Frontend Setup

```bash
cd client
npm install
```

Start the frontend development server:
```bash
npm run dev
```

Access the application in your browser at `http://localhost:5173`.

---

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Check API server status.

### Authentication
- `POST /api/auth/register` - Register a new user (`name`, `email`, `password`).
- `POST /api/auth/login` - Authenticate user & get JWT token.
- `GET /api/auth/me` - Get current authenticated user profile (`Bearer <token>`).

### Resume Analyses (Protected)
- `POST /api/analyses` - Upload PDF resume + Job Description + Mode -> Perform Gemini analysis & save report.
- `POST /api/analyses/text` - Analyze generated resume text against a Job Description and save the report.
- `GET /api/analyses` - Get paginated list of user's past analyses.
- `GET /api/analyses/:id` - Get single detailed analysis report.
- `DELETE /api/analyses/:id` - Delete an analysis record by ID.
- `POST /api/analyses/:id/share` - Create or replace a read-only report link (`expiresAt` ISO datetime optional).
- `DELETE /api/analyses/:id/share` - Revoke a report link.
- `GET /api/analyses/shared/:token` - Read the limited public report view for a valid share token.

### Resume Builder (Protected)
- `POST /api/resumes` - Save a resume (`title`, `templateId`, and structured `sections`).
- `GET /api/resumes` - List the signed-in user's saved resumes.
- `GET /api/resumes/:id` - Load a saved resume for editing.
- `PUT /api/resumes/:id` - Update a saved resume.
- `DELETE /api/resumes/:id` - Delete a saved resume.
- `POST /api/resumes/ai` - Generate resume writing suggestions. Accepts an `action` (`improveBullet`, `tailor`, `coverLetter`, `interviewQuestions`, or `skillRoadmap`) and `resumeText`; actions other than `improveBullet` also require a job description. Bullet rewrites require `bullet`; cover letters require `tone` (`formal`, `friendly`, or `concise`). Responses use structured JSON, and requests use the configured `GEMINI_MODEL`.

---

## 🧪 Testing

Run backend unit and resume API tests:
```bash
cd server
npm test
npm run test:resume
npm run test:analysis-text
npm run test:resume-ai
```

Resume PDF downloads use standard PDF fonts and selectable text.
