
"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { app } from '@/lib/firebase';
import { BrainCircuit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';

const PhoneLoginForm = dynamic(() => import('@/components/auth/phone-login-form'), { ssr: false });


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);


  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Logged in successfully!' });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="flex items-center gap-2 mb-8">
        <BrainCircuit className="w-10 h-10 text-primary"/>
        <h1 className="text-4xl font-bold">EmotiFriend</h1>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to access your EmotiFriend.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4 mt-4">
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-input" />
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-input" />
                <Button type="submit" className="w-full">Login with Email</Button>
                </form>
            </TabsContent>
            <TabsContent value="phone">
                <PhoneLoginForm />
            </TabsContent>
            </Tabs>
            <p className="mt-4 text-center text-sm">
            Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign Up</Link>
            </p>
        </CardContent>
      </Card>
    </main>
  );
}
