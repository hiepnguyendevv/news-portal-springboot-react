import axios from "axios";
 const API_URL = "http://localhost:8080/api";

 const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
 });

 export const newsAPI = {
    getAllNews: async () => api.get("/news"),
    getNewsById: async (id) => api.get(`/news/${id}`), 

    getPublishedNews: async () => api.get("/news/published"),
    importSampleData: async () => api.post("/news/import-data"),
    addSampleNews: async () => api.post("/news/add-sample"),
    clearAllData: async () => api.post("/news/clear-all-data"),
    getNewsByCategory: async (category) => api.get(`/news/category/${category}`),
    getNewsByCategorySlug: async (slug) => api.get(`/news/category/slug/${slug}`),
    searchNews: async (keyword) => api.get(`/news/search?keyword=${encodeURIComponent(keyword)}`),
   
    
    //Category
    getAllCategory: async () => api.get("/category"),
    getCategoryBySlug: async (slug) => api.get(`/category/slug/${slug}`),
 }; 

 export default api;
