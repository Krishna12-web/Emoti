
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { app } from '@/lib/firebase';


declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}


export default function PhoneSignupForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);


  useEffect(() => {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {
                // reCAPTCHA solved
            },
        });
    }
  }, [auth]);

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const appVerifier = window.recaptchaVerifier!;
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        window.confirmationResult = confirmationResult;
        setOtpSent(true);
        toast({ title: 'OTP Sent!', description: 'Please check your phone for the OTP.' });
      } catch (error: any) {
        console.error("Phone Signup Error:", error);
        toast({ variant: 'destructive', title: 'Failed to send OTP', description: error.message });
         // Reset reCAPTCHA
        window.recaptchaVerifier?.render().then((widgetId) => {
            grecaptcha.reset(widgetId);
        });
      }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirmationResult) {
        toast({ variant: 'destructive', title: 'Verification failed', description: 'Please try sending the OTP again.' });
        return;
    }
    try {
      const userCredential = await window.confirmationResult.confirm(otp);
      await updateProfile(userCredential.user, { displayName: name });
      toast({ title: 'Account created and logged in successfully!' });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: error.message });
    }
  };

    return (
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
    );
}
