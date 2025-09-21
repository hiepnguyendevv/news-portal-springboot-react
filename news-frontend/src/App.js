import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import Navbar from './components/Navbar';
import './App.css';
import Home from './pages/Home';
import NewsDetail from './pages/NewsDetail';
import Category from './pages/Category';
import Search from './pages/Search';
import Login from './pages/Login';
import Signup from './pages/SignUp';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import CreateNews from './pages/admin/CreateNews';
import NewsManagement from './pages/admin/NewsManagement';
import UserManagement from './pages/admin/UserManagement';
import CreateUser from './pages/admin/CreateUser';
import EditUser from './pages/admin/EditUser';
import CategoryManagement from './pages/admin/CategoryManagement';
import CreateCategory from './pages/admin/CreateCategory';
import EditCategory from './pages/admin/EditCategory';
import ProtectedRoute from './components/ProtectedRoute';
import EditNews from './pages/admin/EditNews';

// Chỉ import MyNews trước
import MyNews from './pages/MyNews';
import CreateMyNews from './pages/CreateMyNews';
import EditMyNews from './pages/EditMyNews';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/:slugWithId" element={<NewsDetail />} />
            <Route path="/category/:category" element={<Category />} />
            <Route path="/search" element={<Search />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Thêm route My News */}
            <Route path="/my-news" element={
              <ProtectedRoute>
                <MyNews />
              </ProtectedRoute>
            } />

            <Route path="/my-news/create" element={
              <ProtectedRoute>
                <CreateMyNews />
              </ProtectedRoute>
            } />
            
            <Route path="/my-news/edit/:id" element={
              <ProtectedRoute>
                <EditMyNews />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            
            {/* Admin sub-routes */}
            <Route path="/admin/news" element={
              <ProtectedRoute>
                <NewsManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/news/create" element={
              <ProtectedRoute>
                <CreateNews />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/news/edit/:id" element={
              <ProtectedRoute>
                <EditNews />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users/create" element={
              <ProtectedRoute>
                <CreateUser />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users/edit/:id" element={
              <ProtectedRoute>
                <EditUser />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/categories" element={
              <ProtectedRoute>
                <CategoryManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/categories/create" element={
              <ProtectedRoute>
                <CreateCategory />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/categories/edit/:id" element={
              <ProtectedRoute>
                <EditCategory />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
