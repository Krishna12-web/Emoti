
"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAuth, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();
  const auth = getAuth();
  const router = useRouter();

  // This is a global object for reCAPTCHA
  if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
    (window as any).recaptchaVerifier = null;
  }
  
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response: any) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
          });
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: 'Account created successfully!' });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Signup Failed', description: error.message });
    }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, `+${phone}`, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
        toast({ title: 'OTP Sent!', description: 'Please check your phone for the OTP.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to send OTP', description: error.message });
      }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await confirmationResult.confirm(otp);
      toast({ title: 'Account created and logged in successfully!' });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: error.message });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-headline text-center text-primary-foreground/80 mb-8">Join EmotiFriend</h1>
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <form onSubmit={handleEmailSignup} className="space-y-4 mt-4">
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-input" />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-input" />
              <Button type="submit" className="w-full">Sign Up with Email</Button>
            </form>
          </TabsContent>
          <TabsContent value="phone">
            {!otpSent ? (
              <form onSubmit={handlePhoneSignup} className="space-y-4 mt-4">
                <Input type="tel" placeholder="Phone Number with country code" value={phone} onChange={(e) => setPhone(e.target.value)} required className="bg-input" />
                <Button type="submit" className="w-full">Send OTP</Button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerify} className="space-y-4 mt-4">
                <Input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required className="bg-input" />
                <Button type="submit" className="w-full">Verify OTP & Sign Up</Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
        <p className="mt-4 text-center">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Log In</Link>
        </p>
      </div>
      <div id="recaptcha-container"></div>
    </main>
  );
}

// Extend the Window interface
declare global {
    interface Window {
        recaptchaVerifier: any;
        confirmationResult: any;
    }
}
