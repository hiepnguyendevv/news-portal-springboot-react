  import React, { createContext, useState, useContext, useEffect } from 'react';
  import { newsAPI, setAccessToken } from '../services/api';

  const AuthContext = createContext();  
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
      // 1. Chạy duy nhất 1 lần khi tải trang
      restoreSessionOnLoad();

      // 2. Lắng nghe sự kiện logout từ api.js
      const handleAuthFailure = () => {
        forceLogout();
      };
      window.addEventListener("auth-failed", handleAuthFailure);
    
      return () => {
          window.removeEventListener("auth-failed", handleAuthFailure);
    };
    }, []);


    const restoreSessionOnLoad = async () => {
      try {
        setLoading(true);
        const response = await newsAPI.restoreSession();
        
        const { accessToken } = response.data;
        setAccessToken(accessToken);

        // Lấy thông tin user
        const userRes = await newsAPI.getCurrentUser();
        setUser(userRes.data);
        setIsAuthenticated(true);

      } catch (error) {
        // Nếu lỗi -> Coi như là khách
        console.log("Phiên đăng nhập không tồn tại.");
        forceLogout();
      } finally {
        setLoading(false);
      }
    };

    const forceLogout = () => {
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      // Nếu muốn chuyển hướng cứng về trang login:
      // window.location.href = "/login";
    };

    const refreshUser = async () => {
      try {
        const response = await newsAPI.getCurrentUser();
        const userData = response.data;

        if (userData.status !== 'ACTIVE') {
            await logout(); 
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
        setAccessToken(token);
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

        setAccessToken(token);
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } catch (error) {
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
        return { 
          success: false, 
          error: error.response?.data?.error || 'Đăng ký thất bại' 
        };
      }
    };

    const logout = async () => {
      try {
        await newsAPI.logout(); 
      } catch (e) {
        console.error("Logout error", e);
      } finally {
        forceLogout();
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
        {!loading && children}
      </AuthContext.Provider>
    );
  };