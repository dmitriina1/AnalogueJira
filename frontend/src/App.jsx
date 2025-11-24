import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext'; // Добавляем LanguageProvider
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import { ThemeProvider } from './contexts/ThemeContext';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import ProjectsPage from './components/Projects/ProjectsPage';
import ProjectDetail from './components/Projects/ProjectDetail';
import BoardView from './components/Board/BoardView';
import InvitePage from './components/Auth/InvitePage';
import Settings from './components/Settings/Settings'; // Добавляем страницу настроек

// Обновленный ProtectedRoute с поддержкой guest-режима
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  // Разрешаем доступ если пользователь авторизован ИЛИ если это guest-режим проекта
  const isGuestProjectAccess = location.pathname.startsWith('/projects/') && 
                              new URLSearchParams(location.search).get('view_mode') === 'guest';
  
  if (user || isGuestProjectAccess) {
    return children;
  }
  
  return <Navigate to="/login" />;
};

// GuestRoute для страниц, доступных только неавторизованным пользователям
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  return !user ? children : <Navigate to="/dashboard" />;
};

// Layout с поддержкой guest-режима (скрывает sidebar/header для гостей)
const AdaptiveLayout = ({ children, isGuestMode }) => {
  if (isGuestMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    );
  }
  
  return <Layout>{children}</Layout>;
};

// Компонент-обертка для ProjectDetail с определением guest-режима
const ProjectDetailWrapper = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isGuestMode = queryParams.get('view_mode') === 'guest';
  
  return (
    <AdaptiveLayout isGuestMode={isGuestMode}>
      <ProjectDetail />
    </AdaptiveLayout>
  );
};

// Компонент-обертка для BoardView с определением guest-режима
const BoardViewWrapper = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isGuestMode = queryParams.get('view_mode') === 'guest';
  
  return (
    <AdaptiveLayout isGuestMode={isGuestMode}>
      <BoardView />
    </AdaptiveLayout>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider> 
      <LanguageProvider> {/* Оборачиваем все в LanguageProvider */}
        <AuthProvider>
          <div className="App">
            <Routes>
              <Route 
                path="/login" 
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <GuestRoute>
                    <Register />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProjectsPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:projectId" 
                element={
                  <ProtectedRoute>
                    <ProjectDetailWrapper />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/boards/:boardId" 
                element={
                  <ProtectedRoute>
                    <BoardViewWrapper />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route 
                path="/invite/:token" 
                element={
                  <GuestRoute>
                    <InvitePage />
                  </GuestRoute>
                } 
              />
            </Routes>
          </div>
        </AuthProvider>
      </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;