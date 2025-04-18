import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './pages/Dashboard';
import EssayBot from './pages/EssayBot';
import AITester from './pages/AITester';
import Profile from './pages/Profile';
import Calendar from './components/Calendar/Calendar';
import AuthGuard from './components/AuthGuard';
import MainLayout from './layouts/MainLayout';
// import './styles/index.css'; // Assuming you have a CSS file for global styles
// import './App.css';
import './App.css'
// import './styles/shared.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="page-wrapper">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <AuthGuard>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </AuthGuard>
            } />
            <Route path="/essaybot" element={
              <AuthGuard>
                <MainLayout>
                  <EssayBot />
                </MainLayout>
              </AuthGuard>
            } />
            <Route path="/aitester" element={
              <AuthGuard>
                <MainLayout>
                  <AITester />
                </MainLayout>
              </AuthGuard>
            } />
            <Route path="/profile" element={
              <AuthGuard>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </AuthGuard>
            } />
            <Route path="/calendar" element={
              <AuthGuard>
                <MainLayout>
                  <Calendar />
                </MainLayout>
              </AuthGuard>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
