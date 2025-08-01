
"use client";

import { useRef, useEffect } from 'react';
import type { Message } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Mic, Video, Square, X, PlayCircle, Languages, Trash2, FileAudio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ChatInterfaceProps = {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  onVoiceRecording: () => void;
  onVoiceFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFacialAnalysis: () => void;
  isListening: boolean;
  isCapturingFace: boolean;
  onPlayAudio: (audioDataUri: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  onClearChat: () => void;
};

const MessageBubble = ({ msg, onPlayAudio }: { msg: Message, onPlayAudio: (audioDataUri: string) => void }) => {
  const isUser = msg.sender === 'user';
  return (
    <div
      className={cn(
        "flex items-end gap-2 my-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl shadow-md",
          "flex items-center gap-2",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-lg"
            : "bg-card text-card-foreground rounded-bl-lg border"
        )}
      >
        <p className="text-base whitespace-pre-wrap">{msg.text}</p>
        {!isUser && msg.audioDataUri && (
          <Button size="icon" variant="ghost" className="shrink-0 w-8 h-8 rounded-full" onClick={() => onPlayAudio(msg.audioDataUri!)}>
            <PlayCircle className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export function ChatInterface({
  messages,
  onSendMessage,
  isThinking,
  onVoiceRecording,
  onVoiceFileUpload,
  onFacialAnalysis,
  isListening,
  isCapturingFace,
  onPlayAudio,
  language,
  onLanguageChange,
  onClearChat,
}: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSend = () => {
    if (textareaRef.current && textareaRef.current.value.trim()) {
      onSendMessage(textareaRef.current.value.trim());
      textareaRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const isInputDisabled = isThinking || isListening || isCapturingFace;
  const languages = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Japanese'];

  return (
    <div className="flex flex-col flex-grow w-full bg-primary/10 rounded-t-2xl shadow-inner overflow-hidden mt-4">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="flex flex-col">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} onPlayAudio={onPlayAudio} />
          ))}
          {isThinking && <MessageBubble msg={{ id: 'thinking', sender: 'ai', text: '...', timestamp: Date.now() }} onPlayAudio={() => {}} />}
        </div>
      </ScrollArea>
      <div className="p-4 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="relative flex items-center gap-2">
           <Button
              size="icon"
              variant="ghost"
              onClick={onClearChat}
              disabled={isThinking}
              className="text-primary hover:text-primary/80"
              aria-label="Clear Chat"
            >
              <Trash2 size={20} />
            </Button>
          <Textarea
            ref={textareaRef}
            placeholder={isListening ? "Listening..." : "Type your feelings here..."}
            className="flex-grow pr-32 bg-input shadow-sm resize-none"
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={isInputDisabled}
          />
          <div className="absolute right-2 flex items-center gap-1">
             <Button
                size="icon"
                variant="ghost"
                onClick={onVoiceRecording}
                disabled={isThinking || isCapturingFace}
                className={cn("text-primary hover:text-primary/80", isListening && "text-destructive animate-pulse")}
                aria-label={isListening ? "Stop voice recording" : "Start voice recording"}
              >
                {isListening ? <Square size={20} /> : <Mic size={20} />}
              </Button>
              <Label htmlFor="voice-upload" className={cn(isInputDisabled && "opacity-50 cursor-not-allowed")}>
                <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    disabled={isInputDisabled}
                    className="text-primary hover:text-primary/80"
                    aria-label="Upload voice file"
                >
                    <span>
                        <FileAudio size={20} />
                    </span>
                </Button>
              </Label>
              <input id="voice-upload" type="file" accept="audio/*" className="hidden" onChange={onVoiceFileUpload} disabled={isInputDisabled} />
              <Button
                size="icon"
                variant="ghost"
                onClick={onFacialAnalysis}
                disabled={isThinking || isListening}
                className={cn("text-primary hover:text-primary/80", isCapturingFace && "text-destructive animate-pulse")}
                aria-label={isCapturingFace ? "Stop facial analysis" : "Start facial analysis"}
              >
                {isCapturingFace ? <X size={20} /> : <Video size={20} />}
              </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" disabled={isInputDisabled} className="text-primary hover:text-primary/80" aria-label="Select language">
                  <Languages size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {languages.map((lang) => (
                  <DropdownMenuItem key={lang} onSelect={() => onLanguageChange(lang)}>{lang}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isInputDisabled}
              className="bg-accent hover:bg-accent/90"
              aria-label="Send message"
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
