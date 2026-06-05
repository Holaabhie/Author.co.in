'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setIsSent(true);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            Reset Password
          </h1>
          <p className="text-author-mid text-sm mt-2">
            {isSent
              ? 'Check your email for the reset link'
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {isSent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-author-light mb-1">
                We&apos;ve sent a password reset link to
              </p>
              <p className="text-author-cream font-medium">{email}</p>
            </div>
            <p className="text-xs text-author-mid">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSent(false)}
                className="text-author-cream hover:underline"
              >
                try again
              </button>
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-author-mid hover:text-author-cream transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </motion.div>
        ) : (
          <>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-heading uppercase tracking-wider text-author-mid mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-author-cream/40 transition-colors placeholder:text-author-mid/40"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-author-cream text-author-black py-3.5 font-heading text-sm uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send Reset Link <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-author-mid mt-8">
              Remember your password?{' '}
              <Link href="/login" className="text-author-cream hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
