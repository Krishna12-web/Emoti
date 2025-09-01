
"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAuth, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { app } from '@/lib/firebase';
import { BrainCircuit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
    }
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const auth = getAuth(app);
    if (!window.recaptchaVerifier) {
      if (document.getElementById('recaptcha-container')) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {
                // reCAPTCHA solved
            },
        });
      }
    }
  }, [isClient]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuth(app);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      toast({ title: 'Account created successfully!' });
      router.push('/');
    } catch (error: any)      {
      toast({ variant: 'destructive', title: 'Signup Failed', description: error.message });
    }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuth(app);
    const appVerifier = window.recaptchaVerifier;
    if (!appVerifier) {
        toast({ variant: 'destructive', title: 'reCAPTCHA not ready', description: "Please wait a moment and try again." });
        return;
    }
    
    try {
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
        const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
        toast({ title: 'OTP Sent!', description: 'Please check your phone for the OTP.' });
      } catch (error: any) {
        console.error("Phone Signup Error:", error);
        toast({ variant: 'destructive', title: 'Failed to send OTP', description: "Something went wrong. Make sure your phone number is correct and includes the country code." });
      }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
        toast({ variant: 'destructive', title: 'Verification failed', description: 'Please try sending the OTP again.' });
        return;
    }
    try {
      const userCredential = await confirmationResult.confirm(otp);
      await updateProfile(userCredential.user, { displayName: name });
      toast({ title: 'Account created and logged in successfully!' });
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
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>Join to create your own AI personas.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
                <form onSubmit={handleEmailSignup} className="space-y-4 mt-4">
                <Input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-input" />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-input" />
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-input" />
                <Button type="submit" className="w-full">Sign Up with Email</Button>
                </form>
            </TabsContent>
            <TabsContent value="phone">
                {isClient && (
                <>
                    {!otpSent ? (
                    <form onSubmit={handlePhoneSignup} className="space-y-4 mt-4">
                        <Input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-input" />
                        <Input type="tel" placeholder="Phone Number with country code" value={phone} onChange={(e) => setPhone(e.target.value)} required className="bg-input" />
                        <Button type="submit" className="w-full">Send OTP</Button>
                    </form>
                    ) : (
                    <form onSubmit={handleOtpVerify} className="space-y-4 mt-4">
                        <Input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required className="bg-input" />
                        <Button type="submit" className="w-full">Verify OTP & Sign Up</Button>
                    </form>
                    )}
                    <div id="recaptcha-container" className="mt-4"></div>
                </>
                )}
            </TabsContent>
            </Tabs>
            <p className="mt-4 text-center text-sm">
            Already have an account? <Link href="/login" className="text-primary hover:underline">Log In</Link>
            </p>
        </CardContent>
      </Card>
    </main>
  );
}
