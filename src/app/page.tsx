
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, Emotion, AnalysisResult, Gender } from '@/lib/types';
import { useConversation } from '@/hooks/use-conversation';
import { getAdaptiveResponse, performFacialAnalysis, performTextAnalysis, performVoiceAnalysis, getAudioResponse, performTranslation, performSpeechToText, generateAvatar, generateTalkingVideo } from '@/lib/actions';
import { Avatar } from '@/components/emotifriend/avatar';
import { SupportLinks } from '@/components/emotifriend/support-links';
import { EmotionStatus } from '@/components/emotifriend/emotion-status';
import { ChatInterface } from '@/components/emotifriend/chat-interface';
import { GenderSelector } from '@/components/emotifriend/gender-selector';
import { useToast } from "@/hooks/use-toast";

const defaultAvatars: Record<Gender, string> = {
    female: "https://placehold.co/192x192.png",
    male: "https://placehold.co/192x192.png",
}

export default function Home() {
  const { messages, addMessage, history, clearConversation } = useConversation();
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("English");
  const [gender, setGender] = useState<Gender>('female');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { toast } = useToast();

  const cleanupMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsListening(false);
    setIsCapturingFace(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  const handlePlayAudio = (audioDataUri: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioDataUri;
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    }
  };

  const handleSendMessage = async (text: string) => {
    if (isThinking) return;

    setIsThinking(true);
    setCurrentEmotion('thinking');
    setVideoUrl(null); // Clear previous video
    addMessage({ text, sender: 'user' });

    try {
      let translatedText = text;
      if (language !== 'English') {
        const translationResult = await performTranslation(text, language);
        translatedText = translationResult.translatedText;
      }

      const textAnalysis = await performTextAnalysis(translatedText);
      setAnalysisResult(prev => ({ ...prev, text: textAnalysis.sentiment }));

      const combinedEmotion = textAnalysis.sentiment; 

      const response = await getAdaptiveResponse({
        emotion: combinedEmotion,
        userInput: translatedText,
        pastConversations: history,
      });

      const currentAvatar = avatarUrl || defaultAvatars[gender];

      // Generate talking video
      const videoResponse = await generateTalkingVideo({
          avatarDataUri: currentAvatar,
          text: response.response,
      });
      setVideoUrl(videoResponse.videoDataUri);
      
      addMessage({ text: response.response, sender: 'ai' });
      
      const userEmotion = mapSentimentToEmotion(combinedEmotion);
      setCurrentEmotion(userEmotion);

    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "I'm having trouble thinking right now. Please try again later.",
      });
      setCurrentEmotion('sad');
    } finally {
      setIsThinking(false);
    }
  };
  
  const mapSentimentToEmotion = (sentiment: string): Emotion => {
    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes('sad') || lowerSentiment.includes('negative') || lowerSentiment.includes('lonely') || lowerSentiment.includes('distress')) return 'sad';
    if (lowerSentiment.includes('happy') || lowerSentiment.includes('positive') || lowerSentiment.includes('smiling')) return 'happy';
    if (lowerSentiment.includes('angry')) return 'angry';
    return 'neutral';
  }

  const handleVoiceAnalysis = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop();
      cleanupMedia();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      setIsListening(true);
      setCurrentEmotion('listening');

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setIsThinking(true);
          try {
            const [voiceAnalysisResult, speechToTextResult] = await Promise.all([
                performVoiceAnalysis(base64Audio),
                performSpeechToText(base64Audio),
            ]);

            setAnalysisResult(prev => ({ ...prev, voice: voiceAnalysisResult.emotion }));
            const emotion = mapSentimentToEmotion(voiceAnalysisResult.emotion);
            setCurrentEmotion(emotion);
            
            await handleSendMessage(speechToTextResult.transcript);
            
          } catch(e) {
             toast({ variant: "destructive", title: "Voice Analysis Failed", description: "I couldn't understand the audio. Please try again." });
             setCurrentEmotion('sad');
          } finally {
            setIsThinking(false);
          }
        };
      };

      recorder.start();

      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 5000); // Record for 5 seconds

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({ variant: "destructive", title: "Microphone Access Denied", description: "Please allow microphone access in your browser settings." });
      cleanupMedia();
    }
  };

  const handleFacialAnalysis = async () => {
    if (isCapturingFace) {
      cleanupMedia();
      return;
    }

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
      setIsCapturingFace(true);
      setCurrentEmotion('listening');
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.onloadedmetadata = () => {
           setTimeout(captureAndAnalyze, 500);
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({ variant: "destructive", title: "Camera Access Denied", description: "Please allow camera access in your browser settings." });
      cleanupMedia();
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;
    setIsThinking(true);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');
    
    try {
      const result = await performFacialAnalysis(photoDataUri);
      setAnalysisResult(prev => ({ ...prev, face: result.emotionalState }));
      const emotion = mapSentimentToEmotion(result.emotionalState);
      setCurrentEmotion(emotion);
    } catch(e) {
      toast({ variant: "destructive", title: "Facial Analysis Failed", description: "I couldn't analyze the image. Please try again." });
      setCurrentEmotion('sad');
    } finally {
      setIsThinking(false);
      cleanupMedia();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsThinking(true);
      setCurrentEmotion('thinking');
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoDataUri = reader.result as string;
        try {
          toast({ title: "Generating new avatar...", description: "This might take a moment."});
          const result = await generateAvatar({ photoDataUri });
          setAvatarUrl(result.avatarDataUri);
          toast({ title: "Avatar updated!", description: "Your new avatar is ready."});
        } catch (error) {
          console.error("Avatar generation failed:", error);
          toast({ variant: "destructive", title: "Avatar Generation Failed", description: "I couldn't create an avatar from that image. Please try another one." });
        } finally {
          setIsThinking(false);
          setCurrentEmotion('neutral');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearChat = () => {
    clearConversation();
    setCurrentEmotion('neutral');
    setAnalysisResult({});
    setVideoUrl(null);
    toast({ title: "Chat cleared", description: "The conversation has been reset." });
  };


  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 overflow-hidden">
      <div className="w-full max-w-2xl mx-auto flex flex-col h-full">
        <header className="w-full py-4">
          <h1 className="text-4xl font-headline text-center text-primary-foreground/80">EmotiFriend</h1>
          <SupportLinks />
          <GenderSelector gender={gender} onGenderChange={setGender} />
        </header>

        <div className="flex-shrink-0 flex justify-center items-center py-6">
          <Avatar
            emotion={isThinking ? 'thinking' : currentEmotion}
            avatarUrl={avatarUrl}
            videoUrl={videoUrl}
            onAvatarUpload={handleAvatarUpload}
            gender={gender}
          />
        </div>
        
        <EmotionStatus result={analysisResult} />

        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isThinking={isThinking}
          onVoiceAnalysis={handleVoiceAnalysis}
          onFacialAnalysis={handleFacialAnalysis}
          isListening={isListening}
          isCapturingFace={isCapturingFace}
          onPlayAudio={handlePlayAudio}
          language={language}
          onLanguageChange={setLanguage}
          onClearChat={handleClearChat}
        />
        <video ref={videoRef} autoPlay playsInline className="hidden" />
        <audio ref={audioRef} className="hidden" />
      </div>
    </main>
  );
}
