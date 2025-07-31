export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  audioDataUri?: string;
};

export type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'listening' | 'thinking';

export type AnalysisResult = {
  text?: string;
  voice?: string;
  face?: string;
};
