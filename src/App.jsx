import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ChatProvider, useChat } from '@/features/chat/context/ChatContext';
import LoginScreen from '@/features/auth/components/LoginScreen';
import ChatLayout from '@/layouts/ChatLayout';
import GlobalErrorModal from '@/components/ui/GlobalErrorModal'; // New Import
import './index.css';

// Separation component to use the context
// Global Modal Container
const AppContent = () => {
    const { modal, closeModal } = useChat();

    return (
         <GlobalErrorModal 
            isOpen={modal.isOpen} 
            title={modal.title} 
            message={modal.message} 
            type={modal.type}
            onClose={closeModal}
        />
    );
};

const App = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <Routes>
            <Route path="/login" element={<LoginRoute />} />
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><ChatLayout /></ProtectedRoute>}>
                 <Route path="channel/:channelId" element={<div />} /> {/* Param placeholder */}
                 <Route path="dm/:channelId" element={<div />} /> {/* Param placeholder */}
            </Route>
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AppContent />
      </ChatProvider>
    </AuthProvider>
  );
};

// Wrapper components to handle auth logic cleanly
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

const LoginRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return null; // Or spinner
    return user ? <Navigate to="/" replace /> : <LoginScreen />;
};

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
    );
    return user ? children : <Navigate to="/login" replace />;
};

export default App;
