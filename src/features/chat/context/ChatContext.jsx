import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import usePubNub from '../hooks/usePubNub';

const ChatContext = createContext();

import { useAuth } from '@/context/AuthContext';

export const ChatProvider = ({ children }) => {
  const pubnub = usePubNub();
  const { user } = useAuth(); // Consume user from AuthContext

  const [isTyping, setIsTyping] = useState(false);
  
  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error' // or 'success'
  });

  const showError = useCallback((message) => {
    setModal({
        isOpen: true,
        title: 'Error',
        message,
        type: 'error'
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Update PubNub UUID if user exists on mount/refresh
  useEffect(() => {
    if (user && pubnub) {
       pubnub.setUUID(user.id);
    }
  }, [user, pubnub]);

  const [currentChannel, setCurrentChannel] = useState(null);

  const value = useMemo(() => ({
    pubnub,
    user,
    // setUser is managed by AuthContext now
    currentChannel,
    setCurrentChannel,
    isTyping,
    setIsTyping,
    modal,
    showError,
    closeModal
  }), [pubnub, user, currentChannel, isTyping, modal, showError, closeModal]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
