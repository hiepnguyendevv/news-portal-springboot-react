import axios from "axios";
const API_URL = "http://localhost:8080/api";

const api = axios.create({
   baseURL: API_URL,
   headers: {
       "Content-Type": "application/json",
   },
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
   getAllNews: async () => api.get("/news"),
   getNewsById: async (id) => api.get(`/news/${id}`), 
   getPublishedNews: async () => api.get("/news/published"),
   importSampleData: async () => api.post("/news/import-data"),
   addSampleNews: async () => api.post("/news/add-sample"),
   clearAllData: async () => api.post("/news/clear-all-data"),
   getNewsByCategory: async (category) => api.get(`/news/category/${category}`),
   getNewsByCategorySlug: async (slug) => api.get(`/news/category/slug/${slug}`),
   searchNews: async (keyword) => api.get(`/news/search?keyword=${encodeURIComponent(keyword)}`),
   
   // Admin News APIs
   createNews: async (newsData) => api.post("/news/create", newsData),
   updateNews: async (id, newsData) => api.put(`/news/${id}`, newsData),
   deleteNews: async (id) => api.delete(`/news/${id}`),
   updateNewsStatus: async (id, statusData) => api.put(`/news/${id}/status`, statusData),

   // My News APIs
   getMyNews: async () => api.get("/news/my-news"),
   createMyNews: async (newsData) => api.post("/news/my-news", newsData),
   updateMyNews: async (id, newsData) => api.put(`/news/my-news/${id}`, newsData),
   deleteMyNews: async (id) => api.delete(`/news/my-news/${id}`),
  
  // Category APIs
  getAllCategory: async () => api.get("/category"),
  getAllCategoryIncludingChildren: async () => api.get("/category/all"),
  getCategoryById: async (id) => api.get(`/category/${id}`),
  getCategoryBySlug: async (slug) => api.get(`/category/slug/${slug}`),
  getSubcategoriesByParent: async (parentSlug) => api.get(`/category/subcategories/${parentSlug}`),   
   // Admin Category APIs
   createCategory: async (categoryData) => api.post("/category", categoryData),
   updateCategory: async (id, categoryData) => api.put(`/category/${id}`, categoryData),
   deleteCategory: async (id) => api.delete(`/category/${id}`),
   countNewsByCategory: async (categoryId) => api.get(`/category/${categoryId}/count`),
   
  // Admin User APIs
  getAllUsers: async () => api.get("/admin/users"),
  getUserById: async (id) => api.get(`/admin/users/${id}`),
  createUser: async (userData) => api.post("/admin/users", userData),
  updateUser: async (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: async (id) => api.delete(`/admin/users/${id}`),
  updateUserStatus: async (id, status) => api.patch(`/admin/users/${id}/status`, { status }),

   // Auth APIs
   login: async (credentials) => api.post("/auth/signin", credentials),
   signup: async (userData) => api.post("/auth/signup", userData),
   getCurrentUser: async () => api.get("/auth/me"), // ⭐ THÊM DÒNG NÀY

   logout: async () => api.post("/auth/logout"),
}; 

export default api;
