
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
  const { messages, addMessage, history, clearConversation, setMessages } = useConversation();
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("English");
  const [gender, setGender] = useState<Gender>('female');
  const [isMuted, setIsMuted] = useState(false);
  
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
  
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handlePlayAudio = (audioDataUri: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioDataUri;
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    }
  };

  const handleToolCalls = (toolCalls: any[]) => {
    for (const call of toolCalls) {
        const { name, input } = call.toolRequest;
        if (name === 'changeLanguage') {
            setLanguage(input.language);
            toast({ title: "Language Updated", description: `Switched to ${input.language}.` });
        } else if (name === 'changeVoiceGender') {
            setGender(input.gender);
            toast({ title: "Voice Updated", description: `Switched to ${input.gender} voice.` });
        }
    }
  }

  const handleSendMessage = async (text: string) => {
    if (isThinking) return;

    setIsThinking(true);
    setCurrentEmotion('thinking');
    setVideoUrl(null);
    
    const userMessage: Omit<Message, 'id'| 'timestamp'> = { text, sender: 'user' };
    addMessage(userMessage);

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

      if (response.toolCalls) {
        handleToolCalls(response.toolCalls);
      }
      
      const aiMessage: Omit<Message, 'id' | 'timestamp'> = { text: response.response, sender: 'ai' };
      addMessage(aiMessage);

      // Immediately play audio
      getAudioResponse({ text: response.response, voice: gender }).then(audioResponse => {
          handlePlayAudio(audioResponse.audioDataUri);
          setMessages(currentMessages => currentMessages.map(msg => 
              (msg.text === response.response && msg.sender === 'ai' && !msg.audioDataUri) 
              ? {...msg, audioDataUri: audioResponse.audioDataUri} 
              : msg
          ));
      }).catch(audioError => {
          console.error("Audio generation failed:", audioError);
          const errorMessage = (audioError as Error).message || "";
          let errorDescription = "Could not generate audio for the response.";
          if (errorMessage.includes("429")) {
              errorDescription = "I've talked a lot today and my voice needs a rest. Audio is temporarily unavailable due to daily limits, but we can still chat!"
          }
          toast({
              variant: "destructive",
              title: "Audio Generation Failed",
              description: errorDescription,
          });
      });
      
      const currentAvatar = avatarUrl || defaultAvatars[gender];

      // Generate video in the background
      generateTalkingVideo({
          avatarDataUri: currentAvatar,
          text: response.response,
      }).then(videoResponse => {
          setVideoUrl(videoResponse.videoDataUri);
      }).catch(videoError => {
        const errorMessage = (videoError as Error).message || "Could not generate video.";
          console.error("Video generation failed:", videoError);
          if (!errorMessage.includes('billing')) {
            toast({
              variant: "destructive",
              title: "Video Generation Failed",
              description: "Could not generate video. Playing audio instead.",
            });
          }
      });
      
      const userEmotion = mapSentimentToEmotion(combinedEmotion);
      setCurrentEmotion(userEmotion);

    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = (error as Error).message || "";
      let errorDescription = "I'm having trouble thinking right now. Please try again later.";
      if (errorMessage.includes("429")) {
          errorDescription = "I've talked a lot today and my voice needs a rest. Audio is temporarily unavailable due to daily limits, but we can still chat!"
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: errorDescription,
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

  const processAudioForAnalysis = async (base64Audio: string) => {
    setIsThinking(true);
    try {
        const [voiceAnalysisResult, speechToTextResult] = await Promise.all([
            performVoiceAnalysis(base64Audio),
            performSpeechToText(base64Audio),
        ]);

        setAnalysisResult(prev => ({ 
            ...prev, 
            voice: {
                emotion: voiceAnalysisResult.emotion,
                pitch: voiceAnalysisResult.pitch,
                tone: voiceAnalysisResult.tone,
                rhythm: voiceAnalysisResult.rhythm,
            } 
        }));
        const emotion = mapSentimentToEmotion(voiceAnalysisResult.emotion);
        setCurrentEmotion(emotion);
        
        await handleSendMessage(speechToTextResult.transcript);
        
    } catch(e) {
        toast({ variant: "destructive", title: "Voice Analysis Failed", description: "I couldn't understand the audio. Please try again." });
        setCurrentEmotion('sad');
        setIsThinking(false);
    }
  }

  const handleVoiceRecording = async () => {
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
          await processAudioForAnalysis(base64Audio);
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

  const handleVoiceFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        await processAudioForAnalysis(base64Audio);
      };
      reader.readAsDataURL(file);
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
      if (result.gender !== 'unknown') {
        setGender(result.gender);
        toast({ title: "Voice Updated", description: `Switched to ${result.gender} voice.`});
      }
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
          toast({ title: "Analyzing photo and generating avatar...", description: "This might take a moment."});
          
          const [avatarResult, facialAnalysisResult] = await Promise.all([
            generateAvatar({ photoDataUri }),
            performFacialAnalysis(photoDataUri)
          ]);
          
          setAvatarUrl(avatarResult.avatarDataUri);
          toast({ title: "Avatar updated!", description: "Your new avatar is ready."});
          
          if (facialAnalysisResult.gender !== 'unknown') {
            setGender(facialAnalysisResult.gender);
            toast({ title: "Voice Updated", description: `AI voice has been set to ${facialAnalysisResult.gender}.`});
          }
          setAnalysisResult(prev => ({...prev, face: facialAnalysisResult.emotionalState}));
          setCurrentEmotion(mapSentimentToEmotion(facialAnalysisResult.emotionalState));

        } catch (error) {
          console.error("Avatar generation or analysis failed:", error);
          toast({ variant: "destructive", title: "Oops!", description: "I couldn't create an avatar or analyze the image. Please try another one." });
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
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(prev => !prev)}
          />
        </div>
        
        <EmotionStatus result={analysisResult} />

        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isThinking={isThinking}
          onVoiceRecording={handleVoiceRecording}
          onVoiceFileUpload={handleVoiceFileUpload}
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

    
