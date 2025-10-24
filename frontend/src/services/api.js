import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth tokens if needed
api.interceptors.request.use((config) => {
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/login', { username, password }),
  register: (username, email, password) => api.post('/register', { username, email, password }),
  logout: () => api.post('/logout'),
  getCurrentUser: () => api.get('/user'),
};

export const projectsAPI = {
  getProjects: () => api.get('/projects'),
  createProject: (data) => api.post('/projects', data),
  getProject: (id) => api.get(`/projects/${id}`),
  getProjectMembers: (projectId) => api.get(`/projects/${projectId}/members`),
};

export const boardsAPI = {
  createBoard: (projectId, data) => api.post(`/projects/${projectId}/boards`, data),
  getBoard: (boardId) => api.get(`/boards/${boardId}`),
};

export const cardsAPI = {
  createCard: (listId, data) => api.post(`/lists/${listId}/cards`, data),
  updateCard: (cardId, data) => api.put(`/cards/${cardId}`, data),
  assignUser: (cardId, userId) => api.post(`/cards/${cardId}/assignees`, { user_id: userId }),
};

export const commentsAPI = {
  addComment: (cardId, text) => api.post(`/cards/${cardId}/comments`, { text }),
};

export const invitationsAPI = {
  getInvitations: () => api.get('/invitations'),
  inviteUser: (projectId, data) => api.post(`/projects/${projectId}/invitations`, data),
  acceptInvitation: (invitationId) => api.post(`/invitations/${invitationId}/accept`),
  rejectInvitation: (invitationId) => api.post(`/invitations/${invitationId}/reject`),
};


export default api;