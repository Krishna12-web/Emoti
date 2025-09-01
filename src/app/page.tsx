
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { getAuth, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogOut, Bot, User, Send, Upload, BrainCircuit, Mic, FileText, Image as ImageIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { generateAvatar, analyzeVoiceTone, generateAdaptiveResponse, generateTalkingVideo } from '@/lib/actions';

type Message = {
    text: string;
    sender: 'user' | 'ai';
};

export default function DigitalTwinPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const auth = getAuth();
  
  // State for persona creation
  const [personaImage, setPersonaImage] = useState<string | null>(null);
  const [personaChat, setPersonaChat] = useState<string>('');
  const [personaVoiceInfo, setPersonaVoiceInfo] = useState<string | null>(null);
  const [isPersonaReady, setIsPersonaReady] = useState(false);

  // State for interaction
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
        toast({ title: "Persona Ready!", description: "Your Digital Twin is ready to chat." });
    } else {
        setIsPersonaReady(false);
    }
  }, [personaImage, personaChat, personaVoiceInfo]);


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoDataUri = reader.result as string;
        setPersonaImage(photoDataUri); // Show placeholder
        toast({ title: "Generating Avatar...", description: "This might take a moment."});
        try {
          const result = await generateAvatar({ photoDataUri });
          setAvatarUrl(result.avatarDataUri);
        } catch (error) {
            console.error("Avatar Generation failed", error);
            toast({ variant: "destructive", title: "Avatar Generation Failed", description: "I couldn't create an avatar from that image. Please try another." });
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
        toast({ title: "Analyzing Voice...", description: "Extracting tone and pitch."});
        try {
            const result = await analyzeVoiceTone({ audioDataUri });
            const voiceSummary = `Tone: ${result.tone}, Pitch: ${result.pitch}, Rhythm: ${result.rhythm}`;
            setPersonaVoiceInfo(voiceSummary);
        } catch (error) {
            console.error("Voice analysis failed", error);
            toast({ variant: "destructive", title: "Voice Analysis Failed", description: "I couldn't analyze that audio file. Please try another." });
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
            pastConversations: [personaChat], // Use persona chat as context
        });

        setMessages(prev => [...prev, { text: response.response, sender: 'ai' }]);
        
        // Generate video in the background
        if(avatarUrl) {
            generateTalkingVideo({ avatarDataUri: avatarUrl, text: response.response })
                .then(videoResult => {
                    if (videoResult) {
                        setVideoUrl(videoResult.videoDataUri);
                    }
                })
                .catch(error => {
                    console.error("Video generation failed:", error);
                    toast({ variant: "destructive", title: "Video Generation Failed", description: "I'm having a bit of camera trouble right now." });
                });
        }

    } catch (error) {
        console.error("Response generation failed", error);
        toast({ variant: 'destructive', title: 'Error', description: 'I am unable to respond right now.' });
    } finally {
        setIsThinking(false);
    }
  };


  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        </div>
    )
  }

  const renderPersonaCreation = () => (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <Card className="w-full">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Create Your Digital Twin</CardTitle>
                <CardDescription>Upload a photo, chat style, and voice sample to create an AI persona.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                {/* Step 1: Image */}
                <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                       <ImageIcon className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold">1. The Look</h3>
                    <p className="text-sm text-center text-muted-foreground">Upload a clear photo of a person's face.</p>
                    <Button onClick={() => imageInputRef.current?.click()} variant="outline">
                        <Upload className="mr-2 h-4 w-4" /> Upload Image
                    </Button>
                    <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                    {personaImage && <Image src={personaImage} alt="Persona preview" width={80} height={80} className="rounded-full mt-2" />}
                </div>

                {/* Step 2: Chat */}
                <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
                     <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                       <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold">2. The Style</h3>
                    <p className="text-sm text-center text-muted-foreground">Paste chat logs or text that shows their personality.</p>
                    <Textarea 
                        placeholder="e.g., 'Hey! How's it going? OMG, you won't believe what happened...'" 
                        value={personaChat}
                        onChange={e => setPersonaChat(e.target.value)}
                        className="h-32 text-xs"
                    />
                </div>

                {/* Step 3: Voice */}
                <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
                     <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                       <Mic className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold">3. The Voice</h3>
                    <p className="text-sm text-center text-muted-foreground">Upload a voice sample to capture their tone.</p>
                     <Button onClick={() => voiceInputRef.current?.click()} variant="outline">
                        <Upload className="mr-2 h-4 w-4" /> Upload Voice
                    </Button>
                    <input type="file" ref={voiceInputRef} accept="audio/*" onChange={handleVoiceUpload} className="hidden" />
                    {personaVoiceInfo && <p className="text-xs text-center text-muted-foreground mt-2 bg-muted p-2 rounded-md">{personaVoiceInfo}</p>}
                </div>
            </CardContent>
        </Card>
    </div>
  );

  const renderChatInterface = () => (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[80vh] bg-card rounded-lg shadow-2xl">
        <div className="flex-shrink-0 p-4 flex justify-center items-center relative">
           {videoUrl ? (
                <video
                    key={videoUrl}
                    src={videoUrl}
                    width={150}
                    height={150}
                    className="rounded-full object-cover shadow-lg border-4 border-primary/50"
                    autoPlay
                    loop
                    muted={false}
                    playsInline
                />
            ) : avatarUrl ? (
                <Image 
                    src={avatarUrl}
                    alt="Digital Twin Avatar"
                    width={150}
                    height={150}
                    className="rounded-full object-cover shadow-lg border-4 border-primary/50"
                />
            ) : (
                <div className="w-[150px] h-[150px] rounded-full bg-muted flex items-center justify-center">
                    <Bot className="w-16 h-16 text-muted-foreground" />
                </div>
            )}
        </div>
        
        <div className="flex-grow p-4 overflow-y-auto">
            <div className="flex flex-col gap-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <Bot className="w-6 h-6 text-primary flex-shrink-0"/>}
                        <div className={`rounded-lg p-3 max-w-xs md:max-w-md ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {msg.text}
                        </div>
                        {msg.sender === 'user' && <User className="w-6 h-6 text-muted-foreground flex-shrink-0"/>}
                    </div>
                ))}
                {isThinking && (
                    <div className="flex items-start gap-3 justify-start">
                        <Bot className="w-6 h-6 text-primary animate-pulse flex-shrink-0"/>
                        <div className="rounded-lg p-3 bg-muted">
                           <div className="h-2 w-16 bg-foreground/20 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="p-4 border-t">
            <div className="relative">
                <Textarea 
                    placeholder="Chat with your Digital Twin..."
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                    disabled={isThinking || !isPersonaReady}
                    className="pr-12"
                />
                <Button 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2" 
                    onClick={handleSendMessage}
                    disabled={isThinking || !userInput.trim() || !isPersonaReady}
                >
                    <Send className="w-5 h-5"/>
                </Button>
            </div>
        </div>
    </div>
  );

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 overflow-hidden">
        <header className="w-full max-w-4xl mx-auto py-4 flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                <BrainCircuit className="w-8 h-8 text-primary"/>
                <h1 className="text-3xl font-bold">Digital Twin</h1>
            </div>
            <div>
                <span className="text-sm text-muted-foreground mr-4">Welcome, {user?.displayName || user?.email}</span>
                <Button onClick={handleSignOut} variant="ghost" size="icon">
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Sign Out</span>
                </Button>
            </div>
        </header>
        
        {!isPersonaReady ? renderPersonaCreation() : renderChatInterface()}
    </main>
  );
}
