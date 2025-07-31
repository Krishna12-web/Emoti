"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Message } from '@/lib/types';

const STORAGE_KEY = 'emotifriend-conversation';

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        // Add a default welcome message if no history
        setMessages([
          {
            id: 'welcome',
            sender: 'ai',
            text: 'Hello, I\'m EmotiFriend. How are you feeling today?',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to parse messages from localStorage", error);
      // Handle potential JSON parsing errors
      setMessages([
          {
            id: 'welcome_error',
            sender: 'ai',
            text: 'Hello, I\'m EmotiFriend. How are you feeling today?',
            timestamp: Date.now(),
          },
        ]);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error("Failed to save messages to localStorage", error);
      }
    }
  }, [messages, isInitialized]);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const history = messages.map(msg => `${msg.sender}: ${msg.text}`);

  return { messages, addMessage, history };
}
