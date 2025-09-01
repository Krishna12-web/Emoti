
"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { app } from '@/lib/firebase';
import { BrainCircuit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsClient(true);
  }, []);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        }
      });
    }
    return window.recaptchaVerifier;
  };

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

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const appVerifier = setupRecaptcha();
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      toast({ title: 'OTP Sent!', description: 'Please check your phone for the OTP.' });
    } catch (error: any) {
      console.error("Phone Signin Error:", error);
      toast({ variant: 'destructive', title: 'Failed to send OTP', description: error.message });
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirmationResult) {
      toast({ variant: 'destructive', title: 'Verification failed', description: 'Please try sending the OTP again.' });
      return;
    }
    try {
      await window.confirmationResult.confirm(otp);
      toast({ title: 'Logged in successfully!' });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: error.message });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="flex items-center gap-2 mb-8">
        <BrainCircuit className="w-10 h-10 text-primary"/>
        <h1 className="text-4xl font-bold">Digital Twin</h1>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to access your Digital Twin.</CardDescription>
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
                {isClient && ( // Only render this content on the client
                <>
                    {!otpSent ? (
                    <form onSubmit={handlePhoneLogin} className="space-y-4 mt-4">
                        <Input type="tel" placeholder="Phone Number with country code" value={phone} onChange={(e) => setPhone(e.target.value)} required className="bg-input" />
                        <Button type="submit" className="w-full">Send OTP</Button>
                    </form>
                    ) : (
                    <form onSubmit={handleOtpVerify} className="space-y-4 mt-4">
                        <Input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required className="bg-input" />
                        <Button type="submit" className="w-full">Verify OTP & Login</Button>
                    </form>
                    )}
                    <div id="recaptcha-container" className="mt-4"></div>
                </>
                )}
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
