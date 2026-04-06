import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const chatApi = axios.create({ baseURL: `${API_BASE}/chat` });

chatApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const chatbotAPI = {
  init: (sessionKey) => chatApi.post('/init/', { session_key: sessionKey }),
  sendMessage: (sessionId, message) => chatApi.post('/message/', { session_id: sessionId, message }),
  escalate: (data) => chatApi.post('/escalate/', data),
  rate: (sessionId, rating, comment) => chatApi.post('/rate/', { session_id: sessionId, rating, comment }),
  getFAQ: (search) => chatApi.get('/faq/', { params: search ? { search } : {} }),
  markFAQHelpful: (faqId, helpful) => chatApi.post(`/faq/${faqId}/helpful/`, { helpful }),
};

const adminChatApi = axios.create({ baseURL: `${API_BASE}/chat` });
adminChatApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const adminChatbotAPI = {
  getConfig: () => adminChatApi.get('/admin/config/'),
  updateConfig: (data) => adminChatApi.patch('/admin/config/', data),
  getStats: () => adminChatApi.get('/admin/stats/'),
  getSessions: (params) => adminChatApi.get('/admin/sessions/', { params }),
  getSession: (id) => adminChatApi.get(`/admin/sessions/${id}/`),
  closeSession: (id) => adminChatApi.post(`/admin/sessions/${id}/close/`),
  replyToSession: (id, message) => adminChatApi.post(`/admin/sessions/${id}/reply/`, { message }),
  getFAQs: (params) => adminChatApi.get('/admin/faqs/', { params }),
  createFAQ: (data) => adminChatApi.post('/admin/faqs/', data),
  updateFAQ: (id, data) => adminChatApi.patch(`/admin/faqs/${id}/`, data),
  deleteFAQ: (id) => adminChatApi.delete(`/admin/faqs/${id}/`),
  getCategories: () => adminChatApi.get('/admin/faq-categories/'),
  createCategory: (data) => adminChatApi.post('/admin/faq-categories/', data),
  getQuickReplies: () => adminChatApi.get('/admin/quick-replies/'),
  createQuickReply: (data) => adminChatApi.post('/admin/quick-replies/', data),
  updateQuickReply: (id, data) => adminChatApi.patch(`/admin/quick-replies/${id}/`, data),
  deleteQuickReply: (id) => adminChatApi.delete(`/admin/quick-replies/${id}/`),
};
