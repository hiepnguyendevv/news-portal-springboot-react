import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import Navbar from './components/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Home from './pages/Home';
import NewsDetail from './pages/NewsDetail';
import Category from './pages/Category';
import Search from './pages/Search';
import Login from './pages/Login';
import Signup from './pages/SignUp';
import Profile from './pages/Profile';
import UpdateProfile from './pages/UpdateProfile';
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
import AdminRoute from './components/AdminRoute';
import GuestRoute from './components/GuestRoute';
import CommentManagement from './pages/admin/CommentManagement';

import MyNews from './pages/MyNews';
import CreateMyNews from './pages/CreateMyNews';
import EditMyNews from './pages/EditMyNews';
import SavedNews from './pages/SavedNews';
import OAuth2Callback from './components/OAuth2Callback';
import LiveNews from './pages/LiveNews';
import LiveNewsCreate from './pages/admin/LiveNewsCreate';
import LiveNewsDashboard from './pages/admin/LiveNewsDashboard';
import WebSocketTest from './pages/WebSocketTest';
function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main className="main-content">
          <Routes>
          {/* <Route path="/live/:newsId" element={<LivedNews />} /> */}
          {/* <Route path="/live/:newsId" element={<LiveNews />} /> */}
            <Route path="/websocket-test" element={<WebSocketTest />} />
            <Route path="/" element={<Home />} />
            <Route path="/:slugWithId" element={<NewsDetail />} />
            <Route path="/category/:category" element={<Category />} />
            <Route path="/search" element={<Search />} />

            <Route path="/login" element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            } />
            <Route path="/oauth2/callback" element={<OAuth2Callback />} />
            <Route path="/signup" element={
              <GuestRoute>
                <Signup />
              </GuestRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/profile/edit" element={
              <ProtectedRoute>
                <UpdateProfile />
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

            <Route path="/saved" element={
              <ProtectedRoute>
                <SavedNews />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            
            {/* Admin sub-routes */}
            <Route path="/admin/news" element={
              <AdminRoute>
                <NewsManagement />
              </AdminRoute>
            } />
            
            <Route path="/admin/news/create" element={
              <AdminRoute>
                <CreateNews />
              </AdminRoute>
            } />
            
            <Route path="/admin/comments" element={
              <AdminRoute>
                <CommentManagement />
              </AdminRoute>} 
            />
            <Route path="/admin/news/edit/:newsId" element={
              <AdminRoute>
                <EditNews />
              </AdminRoute>
            } />

            <Route path="/admin/live-news/:newsId" element={
              <AdminRoute>
                <LiveNewsDashboard />
              </AdminRoute>
            } />
            
            <Route path="/admin/users" element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            } />
            
            <Route path="/admin/users/create" element={
              <AdminRoute>
                <CreateUser />
              </AdminRoute>
            } />
            
            <Route path="/admin/users/edit/:id" element={
              <AdminRoute>
                <EditUser />
              </AdminRoute>
            } />
            
            <Route path="/admin/categories" element={
              <AdminRoute>
                <CategoryManagement />
              </AdminRoute>
            } />

              <Route path="/admin/live-news/create" element={
                <AdminRoute>
                  <LiveNewsCreate />
                </AdminRoute>
              } />
              

              {/* <Route path="/admin/live-news/:newsId" element={
                <AdminRoute>
                  <LiveNewsDashboard />
                </AdminRoute>
              } />  
             */}
            <Route path="/admin/categories/create" element={
              <AdminRoute>
                <CreateCategory />
              </AdminRoute>
            } />
            
            <Route path="/admin/categories/edit/:id" element={
              <AdminRoute>
                <EditCategory />
              </AdminRoute>
            } />
            
          </Routes>
        </main>
        <ToastContainer
          position="bottom-right"
          autoClose={1000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
