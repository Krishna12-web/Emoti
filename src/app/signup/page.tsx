
"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { app } from '@/lib/firebase';
import { BrainCircuit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';

const PhoneSignupForm = dynamic(() => import('@/components/auth/phone-signup-form'), { 
  ssr: false,
  loading: () => <div className="space-y-4 mt-4"><div className="h-10 w-full bg-input rounded-md animate-pulse" /><div className="h-10 w-full bg-primary/50 rounded-md animate-pulse" /></div>
});

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);


  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Try to create account first
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      toast({ title: 'Account created successfully!' });
      router.push('/');
    } catch (error: any) {
      // If the account already exists, fall back to sign-in
      const code = error?.code as string | undefined;
      if (code === 'auth/email-already-in-use') {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          toast({ title: 'Signed in successfully!' });
          router.push('/');
          return;
        } catch (signinErr: any) {
          const msg = signinErr?.message || 'Unable to sign in with provided credentials.';
          toast({ variant: 'destructive', title: 'Sign in failed', description: msg });
          return;
        }
      }
      const msg = error?.message || 'Unable to create account.';
      toast({ variant: 'destructive', title: 'Signup Failed', description: msg });
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
            <CardTitle>Create an Account or Sign In</CardTitle>
            <CardDescription>Join or sign in to create your own AI personas.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
                <form onSubmit={handleEmailSignup} className="space-y-4 mt-4">
                <Input type="text" placeholder="Full Name (for new accounts)" value={name} onChange={(e) => setName(e.target.value)} className="bg-input" />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-input" />
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-input" />
                <Button type="submit" className="w-full">Sign Up or Sign In</Button>
                </form>
            </TabsContent>
            <TabsContent value="phone">
              <PhoneSignupForm />
            </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
