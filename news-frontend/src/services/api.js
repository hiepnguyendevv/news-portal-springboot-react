import axios from "axios";
const API_URL = "/api";

const api = axios.create({
   baseURL: API_URL,
   headers: {
       "Content-Type": "application/json",
   },
   withCredentials: true, // Quan trọng: gửi cookie
});

// Request interceptor để thêm JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để handle token expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const newsAPI = {
   // News APIs
   getNewsById: async (id) => api.get(`/news/${id}`), 
   getPublishedNews: async () => api.get("/news/published"),
   getPublishedNewsPaged: async (page = 0, size = 12) => {
     return api.get(`/news/published/paged?page=${page}&size=${size}`);
   },
   importSampleData: async () => api.post("/news/import-data"),
   addSampleNews: async () => api.post("/news/add-sample"),
   clearAllData: async () => api.post("/news/clear-all-data"),
   getNewsByCategory: async (category) => api.get(`/news/category/${category}`),
   getNewsByCategorySlug: async (slug) => api.get(`/news/category/slug/${slug}`),
   searchNews: async (keyword) => api.get(`/news/search?keyword=${encodeURIComponent(keyword)}`),
   
   // Admin News APIs
  getAllNews: async (page = 0, size = 20) => api.get(`/admin/news?page=${page}&size=${size}`),
  adminSearchNews: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page !== undefined) params.append('page', filters.page);
    if (filters.size !== undefined) params.append('size', filters.size);
    if (filters.filter) params.append('filter', filters.filter);
    if (filters.category) params.append('category', filters.category);
    if (filters.q) params.append('q', filters.q);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    return api.get(`/admin/news/search?${params.toString()}`);
  },
   createNews: async (newsData) => api.post("/admin/news", newsData),
   updateNews: async (id, newsData) => api.put(`/admin/news/${id}`, newsData),
   deleteNews: async (id) => api.delete(`/admin/news/${id}`),
   updateNewsStatus: async (id, statusData) => api.put(`/admin/news/${id}/status`, statusData),
   bulkDeleteNews: async (newsIds) => api.delete(`/admin/news/bulk?${newsIds.map(id => `newsIds=${id}`).join('&')}`),
   bulkApproveNews: async (newsIds) => api.put(`/admin/news/bulk/approve?${newsIds.map(id => `newsIds=${id}`).join('&')}`),

   // My News APIs
   getMyNews: async () => api.get("/news/my-news"),
   createMyNews: async (newsData) => api.post("/news/my-news", newsData),
   updateMyNews: async (id, newsData) => api.put(`/news/my-news/${id}`, newsData),
   deleteMyNews: async (id) => api.delete(`/news/my-news/${id}`),
  submitMyNews: async (id) => api.post(`/news/my-news/${id}/submit`),
 
  // Notifications APIs
  getMyNotifications: async () => api.get('/notifications'),
  getUnreadCount: async () => api.get('/notifications/unread-count'),
  markNotificationAsRead: async (id) => api.post(`/notifications/${id}/read`),
  
  // Category APIs
  getAllCategory: async () => api.get("/category"),
  getAllCategoryIncludingChildren: async () => api.get("/category/all"),
  getCategoryById: async (id) => api.get(`/category/${id}`),
  getCategoryBySlug: async (slug) => api.get(`/category/slug/${slug}`),
  getSubcategoriesByParent: async (parentSlug) => api.get(`/category/subcategories/${parentSlug}`),   
   // Admin Category APIs
   createCategory: async (categoryData) => api.post("/admin/category", categoryData),
   updateCategory: async (id, categoryData) => api.put(`/admin/category/${id}`, categoryData),
   deleteCategory: async (id) => api.delete(`/admin/category/${id}`),
   bulkDeleteCategories: async (categoryIds) => api.delete(`/admin/category/bulk?${categoryIds.map(id => `categoryIds=${id}`).join('&')}`),
   countNewsByCategory: async (categoryId) => api.get(`/category/${categoryId}/count`),
   
  // Admin User APIs
  getAllUsers: async () => api.get("/admin/users"),
  getUserById: async (id) => api.get(`/admin/users/${id}`),
  createUser: async (userData) => api.post("/admin/users", userData),
  updateUser: async (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: async (id) => api.delete(`/admin/users/${id}`),
  updateUserStatus: async (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
  bulkDeleteUsers: async (userIds) => api.delete(`/admin/users/bulk?${userIds.map(id => `userIds=${id}`).join('&')}`),
  bulkUpdateUserStatus: async (userIds, status) => api.patch(`/admin/users/bulk/status?${userIds.map(id => `userIds=${id}`).join('&')}&status=${status}`),

   // Auth APIs
   login: async (credentials) => api.post("/auth/signin", credentials),
   signup: async (userData) => api.post("/auth/signup", userData),
   getCurrentUser: async () => api.get("/auth/me"), 
   logout: async () => api.post("/auth/logout"),
  // Profile APIs (current user)
  updateMyProfile: async (payload) => api.put('/auth/me', payload),

  //google login APIs
  googleLogin: async () => api.get('/oauth2/callback'),

  incrementViewCount: async (id) => api.post(`/news/${id}/view`),
  getNewsByViewCountDesc: async (page = 0, size = 20) => api.get(`/news/view-desc?page=${page}&size=${size}`),
  getNewsByViewCountAsc: async (page = 0, size = 20) => api.get(`/news/view-asc?page=${page}&size=${size}`),

  // Tags APIs
  getAllTags: async () => api.get('/tags'),
  

  //Bookmarked News APIs
  toggleBookmark: async (id,bookmarked) => {
    return bookmarked ? api.delete(`/news/${id}/bookmark`) : api.post(`/news/${id}/bookmark`);
  },
  
  isBookmarked: async (id) => api.get(`/news/${id}/bookmark/status`),
  getMyBookmark: async (page = 0 , size = 12) => api.get(`/me/bookmark?page=${page}&size=${size}`),

  // Comment APIs
  getComments: async (newsId) => api.get(`/comments?newsId=${newsId}`),
  getReplies: async (parentId) => api.get(`/comments/${parentId}/replies`),
  addComment: async (newsId, content, parentId) => api.post(`/comments`, {newsId, content, parentId}),
  deleteComment: async (commentId) => api.delete(`/comments/${commentId}`),
  likeComment: async (commentId) => api.post(`/comments/${commentId}/like`),
  unlikeComment: async (commentId) => api.delete(`/comments/${commentId}/like`),
  hasUserLikedComment: async (commentId) => api.get(`/comments/${commentId}/like`),
  getMyComments: async (page = 0, size = 10) => api.get(`/me/comments?page=${page}&size=${size}`),

  //Admin Comment APIs
  getAllComments: async (page = 0, size = 100) => api.get(`/admin/comment?page=${page}&size=${size}`),
  adminDeleteComment: async (commentId) => api.delete(`/admin/comment/${commentId}`),
  restoreComment: async (commentId) => api.put(`/admin/comment/${commentId}/restore`),
  softDeleteComment: async (commentId) => api.delete(`/admin/comment/${commentId}/soft-delete`),
  getCommentById: async (commentId, page = 0, size = 10) => api.get(`/admin/comment/${commentId}?page=${page}&size=${size}`),
  searchComment: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.content) params.append('content', filters.content);
    if (filters.author) params.append('author', filters.author);
    if (filters.news) params.append('news', filters.news);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.size) params.append('size', filters.size);
    
    console.log('Search comment API call with params:', params.toString());
    return api.get(`/admin/comment/search?${params.toString()}`);
  },
  //
  //Live News APIs
  deleteLiveEntry: async (entryId) => api.delete(`/live-content/${entryId}`),
}; 

export default api;
