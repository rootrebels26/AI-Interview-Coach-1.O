import axios from 'axios';

// Support Vercel deployment connecting to Render backend URL
const rawBackend = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '';
const baseURL = rawBackend ? `${rawBackend.replace(/\/$/, '')}/api/interview` : '/api/interview';

const api = axios.create({
  baseURL,
  timeout: 60000,
});


export const interviewApi = {
  // Analyze uploaded resume
  analyseResume: async (formData) => {
    return api.post('/analyse-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Start interview session
  startInterview: async (payload) => {
    return api.post('/start', payload);
  },

  // Request next question in the 6-question sequence
  nextQuestion: async (payload) => {
    return api.post('/next-question', payload);
  },

  // Evaluate single answer with weighted rubric
  evaluateAnswer: async (payload) => {
    return api.post('/evaluate-answer', payload);
  },

  // Generate comprehensive final feedback report
  finalReport: async (payload) => {
    return api.post('/final-report', payload);
  },

  // Conclude interview and check report eligibility
  concludeInterview: async (payload) => {
    return api.post('/conclude', payload);
  },

  // Multi-turn conversational interview turn (Gemini-style interactive chat)
  converse: async (payload) => {
    return api.post('/converse', payload);
  },

  // Instant non-advancing technical hint popup
  getHint: async (payload) => {
    return api.post('/hint', payload);
  },

  // Voice transcription fallback if audio blob submitted
  transcribe: async (formData) => {
    return api.post('/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Health check
  checkHealth: async () => {
    return axios.get('/health');
  },
};

export default interviewApi;
