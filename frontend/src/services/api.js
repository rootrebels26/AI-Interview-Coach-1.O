// Central Axios client and API wrappers used by frontend pages.
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            if (window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
        }

        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    deleteUser: (userId) => api.delete(`/auth/user/${userId}`),
};

export const chatAPI = {
    interact: (messages, subject = 'general', company = 'General', behavior = null) => api.post('/chat/interact', { messages, subject, company, behavior }),
    save: (conversation, subject = 'general') => api.post('/chat/save', { conversation, subject }),
};

export const resumeAPI = {
    analyze: (formData) => api.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getAllHistory: () => api.get('/resume/admin/all'),
    deleteResume: (id) => api.delete(`/resume/admin/${id}`),
};

export const feedbackAPI = {
    generate: (id) => api.post(`/feedback/generate/${id}`),
    getHistory: () => api.get('/feedback/history'),
    getAllHistory: () => api.get('/feedback/admin/all'),
    getAdminUsers: () => api.get('/feedback/admin/users'),
    getUserHistory: (userId) => api.get(`/feedback/admin/user/${userId}/history`),
    getAnalytics: () => api.get('/feedback/admin/analytics'),
    getPublicStats: () => api.get('/feedback/public/stats'),
    getProgress: () => api.get('/feedback/progress'),
    deleteInterview: (id) => api.delete(`/feedback/interview/${id}`),
};

export default api;
