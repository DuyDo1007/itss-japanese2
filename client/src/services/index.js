import api from './api.js';

export const courseService = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getDirectoryData: () => api.get('/courses/directory/data'),
};

export const slideService = {
  getAll: () => api.get('/slides'),
  getById: (id) => api.get(`/slides/${id}`),
  create: (data) => api.post('/slides', data),
  update: (id, data) => api.put(`/slides/${id}`, data),
  delete: (id) => api.delete(`/slides/${id}`),

  /**
   * Gửi nội dung text hoặc file lên backend để phân tích thuật ngữ.
   * @param {string|null} text   - Nội dung paste trực tiếp
   * @param {File|null}   file   - File .txt / .md upload
   * @param {string}      title  - Tiêu đề slide (tuỳ chọn)
   */
  analyze: (text, file, title = '') => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (text) formData.append('content', text);
    formData.append('title', title);

    return api.post('/slides/analyze', formData);
  },
};

export const termService = {
  getAll: (params) => api.get('/terms', { params }),
  getById: (id) => api.get(`/terms/${id}`),
  create: (data) => api.post('/terms', data),
  update: (id, data) => api.put(`/terms/${id}`, data),
  delete: (id) => api.delete(`/terms/${id}`),
};

export const quizService = {
  generate: (slideId, options = {}) =>
    api.post('/quiz/generate', { slideId, count: 5, lang: 'vi', ...options }),
  check: (payload) => api.post('/quiz/check', payload),
};
