
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Memoize storage key to prevent re-renders
  const storageKey = useMemo(() => {
    return user ? `emotifriend-conversation-${user.uid}` : null;
  }, [user]);

  // Load messages from localStorage when user is available
  useEffect(() => {
    if (storageKey) {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          setMessages(JSON.parse(stored));
        } else {
          // If no history, set initial message
          setMessages(getInitialMessages());
        }
      } catch (error) {
        console.error("Failed to parse messages from localStorage", error);
        setMessages(getInitialMessages());
      }
      setIsInitialized(true);
    } else {
      // If there's no user, we can show initial messages but don't mark as initialized for saving
      setMessages(getInitialMessages());
      setIsInitialized(false);
    }
  }, [storageKey]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    // Only save if the user is logged in and messages have been initialized
    if (isInitialized && storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (error) {
        console.error("Failed to save messages to localStorage", error);
      }
    }
  }, [messages, isInitialized, storageKey]);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const clearConversation = useCallback(() => {
    const initialMessages = getInitialMessages();
    setMessages(initialMessages);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(initialMessages));
      } catch (error) {
        console.error("Failed to clear messages in localStorage", error);
      }
    }
  }, [storageKey]);

  const history = messages.map(msg => `${msg.sender}: ${msg.text}`);

  return { messages, addMessage, history, clearConversation, setMessages };
}
