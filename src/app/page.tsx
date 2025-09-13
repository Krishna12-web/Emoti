
"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getAuth, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogOut, Bot, User, Send, Upload, BrainCircuit, Mic, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { generateAvatar, analyzeVoiceTone, generateAdaptiveResponse, generateTalkingVideo } from '@/lib/actions';

type Message = {
    text: string;
    sender: 'user' | 'ai';
};

export default function EmotiFriendPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const auth = getAuth();
  
  const [personaImage, setPersonaImage] = useState<string | null>(null);
  const [personaChat, setPersonaChat] = useState<string>('');
  const [personaVoiceInfo, setPersonaVoiceInfo] = useState<string | null>(null);
  const [isPersonaReady, setIsPersonaReady] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Signed out successfully.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Sign Out Failed', description: error.message });
    }
  };

  useEffect(() => {
    if (personaImage && personaChat && personaVoiceInfo) {
        setIsPersonaReady(true);
        toast({
            title: "Your EmotiFriend is here!",
            description: "Time to start the conversation.",
        });
    } else {
        setIsPersonaReady(false);
    }
  }, [personaImage, personaChat, personaVoiceInfo, toast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoDataUri = reader.result as string;
        setPersonaImage(photoDataUri);
        toast({ title: "Crafting the look...", description: "This might take a moment."});
        try {
          const result = await generateAvatar({ photoDataUri });
          setAvatarUrl(result.avatarDataUri);
        } catch (error) {
            console.error("Avatar Generation failed", error);
            toast({ variant: "destructive", title: "Oh no!", description: "I couldn't create an avatar from that image. Please try another." });
            setPersonaImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const audioDataUri = reader.result as string;
        toast({ title: "Listening closely...", description: "Understanding the tone and pitch."});
        try {
            const result = await analyzeVoiceTone({ audioDataUri });
            const voiceSummary = `Tone: ${result.tone}, Pitch: ${result.pitch}, Rhythm: ${result.rhythm}`;
            setPersonaVoiceInfo(voiceSummary);
        } catch (error) {
            console.error("Voice analysis failed", error);
            toast({ variant: "destructive", title: "Hmm...", description: "I couldn't analyze that audio file. Please try another." });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSendMessage = async () => {
    if (!userInput.trim() || isThinking || !isPersonaReady) return;
    
    const newMessages: Message[] = [...messages, { text: userInput, sender: 'user' }];
    setMessages(newMessages);
    setUserInput('');
    setIsThinking(true);
    setVideoUrl(null);

    try {
        const response = await generateAdaptiveResponse({
            emotion: personaVoiceInfo || 'neutral',
            userInput: userInput,
            pastConversations: [personaChat],
        });

        setMessages(prev => [...prev, { text: response.response, sender: 'ai' }]);
        
        if(avatarUrl) {
            generateTalkingVideo({ avatarDataUri: avatarUrl, text: response.response })
                .then(videoResult => {
                    if (videoResult) {
                        setVideoUrl(videoResult.videoDataUri);
                    }
                })
                .catch(error => {
                    console.error("Video generation failed:", error);
                    toast({ variant: "destructive", title: "Camera Shy", description: "I'm having a bit of trouble with video right now." });
                });
        }

    } catch (error) {
        console.error("Response generation failed", error);
        toast({ variant: 'destructive', title: 'A quiet moment...', description: 'I am unable to respond right now.' });
    } finally {
        setIsThinking(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        </div>
    )
  }

  const renderPersonaCreation = () => (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center transition-opacity duration-500 ease-in-out">
        <Card className="w-full bg-card/80 backdrop-blur-sm border-none shadow-2xl shadow-primary/10">
            <CardHeader className="text-center p-8">
                <Sparkles className="mx-auto w-12 h-12 text-primary/80" />
                <CardTitle className="text-4xl font-bold mt-4">Bring Your EmotiFriend to Life</CardTitle>
                <CardDescription className="text-lg text-muted-foreground mt-2">
                    Let's create a friend. Share a photo, a bit of their personality, and how they sound.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
                <div className="flex flex-col items-center gap-4 p-6 bg-background/50 rounded-2xl">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
                       <ImageIcon className="w-10 h-10" />
                    </div>
                    <h3 className="font-semibold text-xl">1. The Look</h3>
                    <p className="text-sm text-center text-muted-foreground">A photo helps me see them.</p>
                    <Button onClick={() => imageInputRef.current?.click()} variant="secondary" className="mt-2">
                        <Upload className="mr-2 h-4 w-4" /> Upload Image
                    </Button>
                    <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                    {personaImage && <Image src={personaImage} alt="Persona preview" width={80} height={80} className="rounded-full mt-4 border-4 border-primary/20" />}
                </div>

                <div className="flex flex-col items-center gap-4 p-6 bg-background/50 rounded-2xl">
                     <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
                       <FileText className="w-10 h-10" />
                    </div>
                    <h3 className="font-semibold text-xl">2. The Style</h3>
                    <p className="text-sm text-center text-muted-foreground">Share how they express themselves.</p>
                    <Textarea 
                        placeholder="e.g., 'Hey! How's it going? OMG, you won't believe what happened...'"
                        value={personaChat}
                        onChange={e => setPersonaChat(e.target.value)}
                        className="h-32 text-sm bg-white/70"
                    />
                </div>

                <div className="flex flex-col items-center gap-4 p-6 bg-background/50 rounded-2xl">
                     <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
                       <Mic className="w-10 h-10" />
                    </div>
                    <h3 className="font-semibold text-xl">3. The Voice</h3>
                    <p className="text-sm text-center text-muted-foreground">A voice sample helps me hear them.</p>
                     <Button onClick={() => voiceInputRef.current?.click()} variant="secondary" className="mt-2">
                        <Upload className="mr-2 h-4 w-4" /> Upload Voice
                    </Button>
                    <input type="file" ref={voiceInputRef} accept="audio/*" onChange={handleVoiceUpload} className="hidden" />
                    {personaVoiceInfo && <p className="text-xs text-center text-muted-foreground mt-4 bg-muted p-3 rounded-lg">{personaVoiceInfo}</p>}
                </div>
            </CardContent>
        </Card>
    </div>
  );

  const renderChatInterface = () => (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[85vh] bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden border-none">
        <div className="flex-shrink-0 p-6 flex justify-center items-center relative">
           {videoUrl ? (
                <video
                    key={videoUrl}
                    src={videoUrl}
                    width={160}
                    height={160}
                    className="rounded-full object-cover shadow-lg border-4 border-primary/50"
                    autoPlay
                    loop
                    muted={false}
                    playsInline
                />
            ) : avatarUrl ? (
                <Image 
                    src={avatarUrl}
                    alt="EmotiFriend Avatar"
                    width={160}
                    height={160}
                    className="rounded-full object-cover shadow-lg border-4 border-primary/50"
                />
            ) : (
                <div className="w-[160px] h-[160px] rounded-full bg-muted flex items-center justify-center">
                    <Bot className="w-20 h-20 text-muted-foreground" />
                </div>
            )}
        </div>
        
        <div className="flex-grow p-6 overflow-y-auto">
            <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3 justify-start">
                    <Bot className="w-8 h-8 text-primary flex-shrink-0 mt-1"/>
                    <div className="rounded-lg p-4 bg-muted text-muted-foreground">
                        Hello! I'm ready to listen.
                    </div>
                </div>
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <Bot className="w-8 h-8 text-primary flex-shrink-0 mt-1"/>}
                        <div className={`rounded-lg p-4 max-w-xs md:max-w-md ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {msg.text}
                        </div>
                        {msg.sender === 'user' && <User className="w-8 h-8 text-muted-foreground flex-shrink-0 mt-1"/>}
                    </div>
                ))}
                {isThinking && (
                    <div className="flex items-start gap-3 justify-start">
                        <Bot className="w-8 h-8 text-primary animate-pulse flex-shrink-0 mt-1"/>
                        <div className="rounded-lg p-4 bg-muted">
                           <div className="h-2 w-16 bg-foreground/20 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="p-4 border-t bg-background/50">
            <div className="relative">
                <Textarea 
                    placeholder="Share your thoughts..."
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                    disabled={isThinking || !isPersonaReady}
                    className="pr-14 pl-4 py-3 text-base bg-white/70"
                />
                <Button 
                    size="icon" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={handleSendMessage}
                    disabled={isThinking || !userInput.trim() || !isPersonaReady}
                    variant="ghost"
                >
                    <Send className="w-6 h-6 text-primary"/>
                </Button>
            </div>
        </div>
    </div>
  );

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-foreground p-4 overflow-hidden">
        <header className="w-full max-w-4xl mx-auto py-4 flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <BrainCircuit className="w-9 h-9 text-primary/80"/>
                <h1 className="text-3xl font-bold tracking-tight">EmotiFriend</h1>
            </div>
            {user && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {user?.displayName || user?.email}</span>
                    <Button onClick={handleSignOut} variant="ghost" size="icon" className="rounded-full">
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Sign Out</span>
                    </Button>
                </div>
            )}
        </header>
        
        {!isPersonaReady ? renderPersonaCreation() : renderChatInterface()}
    </main>
  );
}
