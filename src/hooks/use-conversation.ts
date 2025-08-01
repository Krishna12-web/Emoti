
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Message } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

const getInitialMessages = (): Message[] => {
  return [
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello, I\'m EmotiFriend. How are you feeling today?',
      timestamp: Date.now(),
    },
  ];
};

export function useConversation() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const getStorageKey = useCallback(() => {
    return user ? `emotifriend-conversation-${user.uid}` : null;
  }, [user]);

  useEffect(() => {
    const storageKey = getStorageKey();
    if (storageKey) {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          setMessages(JSON.parse(stored));
        } else {
          setMessages(getInitialMessages());
        }
      } catch (error) {
        console.error("Failed to parse messages from localStorage", error);
        setMessages(getInitialMessages());
      }
    } else {
      setMessages(getInitialMessages());
    }
    setIsInitialized(true);
  }, [getStorageKey]);

  useEffect(() => {
    const storageKey = getStorageKey();
    if (isInitialized && storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (error) {
        console.error("Failed to save messages to localStorage", error);
      }
    }
  }, [messages, isInitialized, getStorageKey]);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages(getInitialMessages());
    const storageKey = getStorageKey();
    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch (error) {
        console.error("Failed to clear messages from localStorage", error);
      }
    }
  }, [getStorageKey]);

  const history = messages.map(msg => `${msg.sender}: ${msg.text}`);

  return { messages, addMessage, history, clearConversation, setMessages };
}
