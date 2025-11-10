  import React, { createContext, useState, useContext, useEffect } from 'react';
  import { newsAPI, setAccessToken } from '../services/api';

  const AuthContext = createContext();
  let isCheckingAuthStatus = false;
  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };

  export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);


    useEffect(() => {
      checkAuthStatus();
      // Lắng nghe sự kiện "auth-failed" từ api.js
      const handleAuthFailure = () => {
        setUser(null);
        setIsAuthenticated(false);
        // Có thể redirect về /login ở đây
        window.location.href = '/login';
      };
      window.addEventListener("auth-failed", handleAuthFailure);
    
      return () => {
          window.removeEventListener("auth-failed", handleAuthFailure);
    };
    }, []);

    // DÁN VÀO FILE: AuthContext.js

    const checkAuthStatus = async () => {
      if (isCheckingAuthStatus) {
        console.log("=== DEBUG: checkAuthStatus - Đã có request đang chạy, bỏ qua. ===");
        return;
      }
      try {
        isCheckingAuthStatus = true; // Đặt cờ: BẮT ĐẦU KIỂM TRA
        console.log("=== DEBUG: checkAuthStatus - Bắt đầu (Gọi Refresh) ===");
        
        // 1. GỌI /refresh TRƯỚC TIÊN
        // Hàm này sẽ dùng HttpOnly cookie để lấy AT mới
        const response = await newsAPI.refreshToken(); // [cite: 90, 258]
        const { accessToken } = response.data; // [cite: 91]
        
        // 2. Lưu Access Token mới vào bộ nhớ
        setAccessToken(accessToken); // 
        
        console.log("=== DEBUG: checkAuthStatus - Đã có AT mới ===");

        // 3. Bây giờ mới gọi refreshUser (để lấy thông tin user)
        // refreshUser() sẽ gọi getCurrentUser() với AT mới
        await refreshUser(); // [cite: 92, 281]
        
        console.log("=== DEBUG: checkAuthStatus - Hoàn thành ===");

      } catch (error) {
        // Nếu refreshToken thất bại (cookie hết hạn/không có) -> là bình thường, user chưa login
        console.log("=== DEBUG: checkAuthStatus - Không thể refresh (chưa login) ===");
        setUser(null);
        setIsAuthenticated(false); // [cite: 94]
      }
      // Dù thành công hay thất bại, cũng phải kết thúc loading
      setLoading(false);
    };

    const refreshUser = async () => {
      try {
        // getCurrentUser giờ sẽ tự động dùng AT mới (nhờ interceptor)
        const response = await newsAPI.getCurrentUser();
        const userData = response.data;

        if (userData.status !== 'ACTIVE') {
            // Nếu user bị khóa, thực hiện logout
            await logout(); // Gọi hàm logout mới
            return false;
        }
        
        setUser(userData);
        setIsAuthenticated(true);
        return true;
    } catch (e) {
        setUser(null);
        setIsAuthenticated(false);
        return false;
    }
    };

    const oauth2Login = async (token,userData) => {
      try {
        // Giả sử 'token' ở đây là Access Token
        setAccessToken(token); // LƯU VÀO BỘ NHỚ
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
    } catch (error) {
        return { success: false, error: 'Đăng nhập thất bại' };
    }
    };

    const login = async (credentials) => {
      try {
        const response = await newsAPI.login(credentials);
        const { token, ...userData } = response.data;
        
        // Lưu token vào localStorage
        // localStorage.setItem('token', token);
        setAccessToken(token);
        
        // Set user state
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } catch (error) {
        console.error('Login error:', error);
        return { 
          success: false, 
          error: error.response?.data?.error || 'Đăng nhập thất bại' 
        };
      }
    };

    const signup = async (userData) => {
      try {
        const response = await newsAPI.signup(userData);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Signup error:', error);
        return { 
          success: false, 
          error: error.response?.data?.error || 'Đăng ký thất bại' 
        };
      }
    };

    const logout = async () => {
      try {
        // 1. GỌI API LOGOUT ĐỂ HỦY RT TRÊN SERVER
        await newsAPI.logout(); 
    } catch (error) {
        console.error("Lỗi khi logout trên server:", error);
    } finally {
        // 2. DỌN DẸP BỘ NHỚ (KHÔNG PHẢI LOCALSTORAGE)
        setAccessToken(null); // XÓA AT TRONG BỘ NHỚ
        setUser(null);
        setIsAuthenticated(false);
        
        // 3. XÓA LOCALSTORAGE (NẾU CÓ CÁI CŨ)
        localStorage.removeItem('token'); 
    }
    };

    const value = {
      user,
      isAuthenticated,
      loading,
      login,
      signup,
      logout,
      oauth2Login,
      refreshUser
    };

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  };