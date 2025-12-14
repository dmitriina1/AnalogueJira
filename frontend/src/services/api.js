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

export const usersAPI = {
  getUsers: () => api.get('/users'),
  searchProjectUsers: (projectId, query) => 
    api.get(`/projects/${projectId}/users/search?q=${encodeURIComponent(query)}`),
};

export const userAPI = {
  getAssignedCardsCount: () => api.get('/user/assigned-cards-count'),
};

export const notificationsAPI = {
  // Создать уведомление о назначении
  createAssignmentNotification: (data) => 
    api.post('/notifications/assignment', data),

  // Создать уведомление об упоминании
  createMentionNotification: (data) => 
    api.post('/notifications/mention', data),
  
  // Получить уведомления пользователя
  getNotifications: () => 
    api.get('/notifications'),
  
  // Отметить уведомление как прочитанное
  markAsRead: (notificationId) => 
    api.post(`/notifications/${notificationId}/read`),
  
  // Получить количество непрочитанных уведомлений
  getUnreadCount: () => 
    api.get('/notifications/unread-count'),

  getMentions: () => 
    api.get('/user/mentions')
};

export const boardsAPI = {
  getBoard: (id) => api.get(`/boards/${id}`),
  getProjectBoards: (projectId) => api.get(`/projects/${projectId}/boards`),
  createBoard: (projectId, boardData) => api.post(`/projects/${projectId}/boards`, boardData),
  // ДОБАВЬТЕ ЭТИ МЕТОДЫ:
  createList: (boardId, listData) => api.post(`/boards/${boardId}/lists`, listData),
  deleteList: (listId) => api.delete(`/lists/${listId}`),
};
// Добавьте эти методы в существующий файл
export const cardsAPI = {
  createCard: (listId, data) => api.post(`/lists/${listId}/cards`, data),
  updateCard: (cardId, data) => api.put(`/cards/${cardId}`, data),
  getCard: (cardId) => api.get(`/cards/${cardId}`),
  assignUser: (cardId, userId) => api.post(`/cards/${cardId}/assignees`, { user_id: userId }),
  removeAssignee: (cardId, userId) => api.delete(`/cards/${cardId}/assignees/${userId}`),
};

export const labelsAPI = {
  getProjectLabels: (projectId) => api.get(`/projects/${projectId}/labels`),
  createLabel: (projectId, data) => api.post(`/projects/${projectId}/labels`, data),
  addLabelToCard: (cardId, labelId) => api.post(`/cards/${cardId}/labels`, { label_id: labelId }),
  removeLabelFromCard: (cardId, labelId) => api.delete(`/cards/${cardId}/labels/${labelId}`),
};

export const checklistsAPI = {
  createChecklist: (cardId, data) => api.post(`/cards/${cardId}/checklists`, data),
  updateChecklist: (checklistId, data) => api.put(`/checklists/${checklistId}`, data),
  deleteChecklist: (checklistId) => api.delete(`/checklists/${checklistId}`),
  createChecklistItem: (checklistId, data) => api.post(`/checklists/${checklistId}/items`, data),
  updateChecklistItem: (itemId, data) => api.put(`/checklists/items/${itemId}`, data),
  deleteChecklistItem: (itemId) => api.delete(`/checklists/items/${itemId}`),
};

export const commentsAPI = {
  addComment: (cardId, text) => api.post(`/cards/${cardId}/comments`, { text }),
};


// В api.js добавьте:
export const invitationsAPI = {
  getInvitations: () => api.get('/invitations'),
  createInvitation: (projectId, data) => api.post(`/projects/${projectId}/invitations`, data),
  getInvitationByToken: (token) => api.get(`/invitations/${token}`),
  acceptInvitation: (token) => api.post(`/invitations/${token}/accept`),
  registerAndAcceptInvitation: (token, data) => api.post(`/invitations/${token}/register-accept`, data),
  viewProjectByToken: (token) => api.get(`/invitations/${token}/view`), // Добавьте этот метод
   rejectInvitation: (invitationId) => api.post(`/invitations/${invitationId}/reject`),
};


export default api;