'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, ArrowRight, Loader2, Check, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Handle PKCE flow: Supabase sends the recovery token via URL hash fragment
  // The onAuthStateChange listener handles the PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true);
        } else if (event === 'SIGNED_IN' && session) {
          setSessionReady(true);
        }
      }
    );

    // Also check if we already have a session (page refresh case)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setSessionReady(true);
      } else {
        // Give the auth state change listener a moment to fire
        setTimeout(() => {
          supabase.auth.getUser().then(({ data: { user: retryUser } }) => {
            if (retryUser) {
              setSessionReady(true);
            } else {
              setSessionError(true);
            }
          });
        }, 2000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setIsSuccess(true);
        toast.success('Password updated successfully!');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Session error — invalid or expired link
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-16 section-padding">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="text-center mb-10">
            <Link href="/">
              <span className="font-heading text-3xl font-bold tracking-[0.3em] uppercase">
                Author
              </span>
            </Link>
          </div>
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="font-heading text-xl font-semibold uppercase tracking-wider mb-2">
            Invalid Reset Link
          </h1>
          <p className="text-author-mid text-sm mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/reset-password"
            className="inline-block bg-author-cream text-author-black px-8 py-3 font-heading text-sm uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors"
          >
            Request New Link
          </Link>
        </motion.div>
      </div>
    );
  }

  // Loading state while checking session
  if (!sessionReady && !sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-16">
        <Loader2 className="w-6 h-6 animate-spin text-author-cream" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-16 section-padding">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/">
            <span className="font-heading text-3xl font-bold tracking-[0.3em] uppercase">
              Author
            </span>
          </Link>
          <h1 className="font-heading text-xl font-semibold uppercase tracking-wider mt-6">
            {isSuccess ? 'Password Updated' : 'Set New Password'}
          </h1>
        </div>

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-sm text-author-light">
              Your password has been updated. Redirecting to sign in...
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-author-mid mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-author-cream/40 transition-colors placeholder:text-author-mid/40"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-author-mid hover:text-author-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-author-mid mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-author-cream/40 transition-colors placeholder:text-author-mid/40"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                {[
                  { label: 'At least 8 characters', valid: passwordChecks.length },
                  { label: 'One uppercase letter', valid: passwordChecks.uppercase },
                  { label: 'One number', valid: passwordChecks.number },
                  { label: 'Passwords match', valid: passwordChecks.match },
                ].map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-xs">
                    {check.valid ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-author-mid" />
                    )}
                    <span className={check.valid ? 'text-green-400' : 'text-author-mid'}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              className="w-full bg-author-cream text-author-black py-3.5 font-heading text-sm uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Update Password <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
