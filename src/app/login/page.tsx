'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ── Google SVG Icon ───────────────────────────────────────────────────────────
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ── Facebook SVG Icon ─────────────────────────────────────────────────────────
function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

// ── Auth mode toggling ────────────────────────────────────────────────────────
type AuthMode = 'login' | 'register';
type PageView = 'auth' | 'check-inbox';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '/';
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>('login');
  const [view, setView] = useState<PageView>('auth');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Error states (inline — no toasts)
  const [loginError, setLoginError] = useState('');
  const [inputShake, setInputShake] = useState(false);

  // Resend email cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Helper to sanitize redirect targets
  const isSafeRedirect = (url: string) => url.startsWith('/') && !url.startsWith('//');

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Persist returnTo in sessionStorage on mount/searchParams change
  useEffect(() => {
    const returnToParam = searchParams.get('returnTo');
    if (returnToParam && isSafeRedirect(returnToParam)) {
      sessionStorage.setItem('returnTo', returnToParam);
    }
  }, [searchParams]);

  // Clear errors on any keystroke
  const clearErrors = () => {
    setLoginError('');
    setInputShake(false);
  };

  const triggerShake = (msg: string) => {
    setLoginError(msg);
    setInputShake(true);
    setTimeout(() => setInputShake(false), 500);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (password.length < 8) {
      triggerShake('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          triggerShake(
            error.message === 'Invalid login credentials'
              ? 'Incorrect email or password.'
              : error.message
          );
        } else if (data.user) {
          const storedReturnTo = sessionStorage.getItem('returnTo') || returnTo;
          sessionStorage.removeItem('returnTo');
          const target = isSafeRedirect(storedReturnTo) ? storedReturnTo : '/';
          
          console.log("returnTo", storedReturnTo);
          console.log("auth success");
          console.log("redirecting to", target);

          router.refresh();
          setTimeout(() => {
            router.push(target);
          }, 150);
        }
      } else {
        // Registration flow → send confirmation link email
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          triggerShake(
            error.message.includes('already registered')
              ? 'An account with this email already exists.'
              : error.message
          );
        } else if (data.user) {
          // Move to "Check Your Inbox" screen
          setView('check-inbox');
          setResendCooldown(30);
        }
      }
    } catch {
      triggerShake('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = useCallback(async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await supabase.auth.resend({
        type: 'signup',
        email,
      });
      setResendCooldown(30);
    } catch {
      // silently fail — user can retry
    } finally {
      setIsResending(false);
    }
  }, [email, resendCooldown, isResending, supabase.auth]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const storedReturnTo = sessionStorage.getItem('returnTo') || returnTo;
    const target = isSafeRedirect(storedReturnTo) ? storedReturnTo : '/';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`,
      },
    });
    if (error) {
      triggerShake('Failed to sign in with Google.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Shake Animation ──────────────────────────────────────── */
        @keyframes shake {
          0%   { transform: translateX(0); }
          15%  { transform: translateX(-8px); }
          30%  { transform: translateX(8px); }
          45%  { transform: translateX(-6px); }
          60%  { transform: translateX(6px); }
          75%  { transform: translateX(-3px); }
          90%  { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        .input-error {
          border: 1.5px solid #8B2020 !important;
          background: #120808 !important;
          animation: shake 0.45s cubic-bezier(0.36,0.07,0.19,0.97) both;
        }

        /* ── Error Fade In ─────────────────────────────────────────── */
        @keyframes errorFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .lp-inline-error {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 7px;
          animation: errorFadeIn 0.2s ease forwards;
        }
        .lp-inline-error-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #CF4444;
          flex-shrink: 0;
        }
        .lp-inline-error-text {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #CF4444;
          font-weight: 400;
        }

        /* ── Login Page Layout ─────────────────────────────────────── */
        .lp-root {
          display: flex;
          min-height: 100dvh;
          background: #0A0A0A;
          overflow: hidden;
        }

        /* ═══════════════ LEFT COLUMN ══════════════════════════════ */
        .lp-left {
          flex: 1;
          position: relative;
          overflow: hidden;
          display: block;
        }
        .lp-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
        }
        /* dark vignette overlay to make text legible */
        .lp-photo-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.35) 0%,
            rgba(0,0,0,0.05) 30%,
            rgba(0,0,0,0.05) 55%,
            rgba(0,0,0,0.65) 100%
          );
        }

        /* Top-left brand mark */
        .lp-brand-mark {
          position: absolute;
          top: 36px;
          left: 40px;
          font-family: 'Barlow Condensed', 'Jost', sans-serif;
          font-size: 10px;
          letter-spacing: 0.4em;
          color: #B8A07A;
          text-transform: uppercase;
          font-weight: 600;
          z-index: 2;
        }

        /* Bottom-left tagline block */
        .lp-tagline {
          position: absolute;
          bottom: 44px;
          left: 40px;
          z-index: 2;
        }
        .lp-tagline-sup {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 10px;
          letter-spacing: 0.3em;
          color: rgba(184,160,122,0.85);
          text-transform: uppercase;
          font-weight: 500;
          display: block;
          margin-bottom: 6px;
        }
        .lp-tagline-main {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(38px, 5vw, 52px);
          font-weight: 700;
          color: #F5F0E8;
          line-height: 0.95;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          margin: 0;
        }
        .lp-tagline-accent {
          color: #C8956C;
        }

        /* ═══════════════ RIGHT COLUMN ═════════════════════════════ */
        .lp-right {
          width: 480px;
          flex-shrink: 0;
          background: #0A0A0A;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 44px;
          min-height: 100dvh;
          overflow-y: auto;
          border-left: 1px solid #1A1A1A;
        }

        .lp-form-wrap {
          width: 100%;
          max-width: 360px;
          margin: 0 auto;
          padding: 56px 0;
        }

        /* ── Section label ──────────────────────────────────────── */
        .lp-est-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 10px;
          letter-spacing: 0.4em;
          color: #B8A07A;
          text-transform: uppercase;
          font-weight: 500;
          display: block;
          margin-bottom: 18px;
        }

        /* ── Heading ───────────────────────────────────────────── */
        .lp-heading {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #F5F0E8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1.1;
          margin: 0 0 28px 0;
        }

        /* ── Sub text ──────────────────────────────────────────── */
        .lp-sub {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: #666;
          margin: 0 0 36px 0;
          line-height: 1.5;
        }

        /* ── Mode tabs ─────────────────────────────────────────── */
        .lp-mode-tabs {
          display: flex;
          margin-bottom: 28px;
          border-bottom: 1px solid #1E1E1E;
        }
        .lp-mode-tab {
          flex: 1;
          background: none;
          border: none;
          padding: 10px 0 12px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 600;
          color: #444;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color 0.18s, border-color 0.18s;
        }
        .lp-mode-tab.active {
          color: #F5F0E8;
          border-bottom-color: #C8956C;
        }

        /* ── Form fields ───────────────────────────────────────── */
        .lp-field {
          margin-bottom: 14px;
        }
        .lp-label {
          display: block;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #555;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .lp-input {
          width: 100%;
          background: #0F0F0F;
          border: 1px solid #2A2A2A;
          border-radius: 0;
          padding: 13px 16px;
          font-family: 'Inter', sans-serif;
          font-size: 16px; /* Prevents auto-zoom on mobile iOS */
          font-weight: 300;
          color: #F5F0E8;
          outline: none;
          transition: border-color 0.18s;
          box-sizing: border-box;
        }
        @media (min-width: 768px) {
          .lp-input {
            font-size: 14px;
          }
        }
        .lp-input::placeholder {
          color: #B8A07A;
          opacity: 0.5;
        }
        .lp-input:focus {
          border-color: #444;
        }
        .lp-input-password-wrap {
          position: relative;
        }
        .lp-input-password-wrap .lp-input {
          padding-right: 44px;
        }
        .lp-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #555;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.15s;
        }
        .lp-eye-btn:hover {
          color: #B8A07A;
        }

        /* ── CTA button ────────────────────────────────────────── */
        .lp-btn-primary {
          width: 100%;
          background: #C8956C;
          color: #0A0A0A;
          border: none;
          border-radius: 0;
          padding: 14px 0;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          cursor: pointer;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.18s;
        }
        .lp-btn-primary:hover:not(:disabled) {
          background: #d4a07a;
        }
        .lp-btn-primary:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* ── Divider ───────────────────────────────────────────── */
        .lp-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 24px 0;
        }
        .lp-divider-line {
          flex: 1;
          height: 1px;
          background: #1E1E1E;
        }
        .lp-divider-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: #444;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        /* ── Social buttons ────────────────────────────────────── */
        .lp-social-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .lp-social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #222;
          background: transparent;
          border-radius: 0;
          padding: 12px 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #888;
          cursor: pointer;
          transition: border-color 0.18s, color 0.18s;
          white-space: nowrap;
        }
        .lp-social-btn:hover:not(:disabled) {
          border-color: #3A3A3A;
          color: #B8A07A;
        }
        .lp-social-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ── Footer note ───────────────────────────────────────── */
        .lp-footer-note {
          margin-top: 32px;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 300;
          color: #3A3A3A;
          line-height: 1.6;
          text-align: center;
        }
        .lp-footer-note a {
          color: #B8A07A;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .lp-footer-note a:hover {
          opacity: 0.75;
        }

        /* ── Forgot password link ──────────────────────────────── */
        .lp-forgot {
          display: block;
          text-align: right;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: #444;
          text-decoration: none;
          margin-top: 6px;
          transition: color 0.15s;
          font-weight: 300;
        }
        .lp-forgot:hover {
          color: #B8A07A;
        }

        /* ── Check Inbox — Logo ───────────────────────────────── */
        .lp-inbox-logo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #141414;
          border: 1px solid #2A2A2A;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 28px;
        }
        .lp-inbox-logo-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #C8956C;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        /* ── Check Inbox — Separator ──────────────────────────── */
        .lp-inbox-sep {
          width: 100%;
          height: 1px;
          background: #1E1E1E;
          margin: 28px 0;
        }

        /* ── Check Inbox — Resend button ──────────────────────── */
        .lp-resend-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #B8A07A;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 400;
          padding: 0;
          transition: opacity 0.15s;
        }
        .lp-resend-btn:hover:not(:disabled) {
          opacity: 0.75;
        }
        .lp-resend-btn:disabled {
          color: #555;
          cursor: not-allowed;
        }
        .lp-resend-cooldown {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #555;
          font-weight: 300;
        }

        /* ── Mobile Responsive ─────────────────────────────────── */
        @media (max-width: 767px) {
          .lp-root {
            flex-direction: column;
            min-height: 100dvh;
          }
          .lp-left {
            flex: none;
            height: 40vh;
            min-height: 260px;
          }
          .lp-right {
            width: 100%;
            border-left: none;
            border-top: 1px solid #1A1A1A;
            min-height: auto;
            flex: 1;
            padding: 0 24px;
          }
          .lp-form-wrap {
            padding: 36px 0 48px;
            max-width: 100%;
          }
          .lp-brand-mark {
            top: 20px;
            left: 20px;
          }
          .lp-tagline {
            bottom: 24px;
            left: 20px;
          }
          .lp-tagline-main {
            font-size: clamp(28px, 8vw, 40px);
          }
        }

        /* ── Tablet ─────────────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .lp-right {
            width: 400px;
            padding: 0 36px;
          }
        }
      `}} />

      <div className="lp-root">

        {/* ═══════════════════ LEFT COLUMN ═════════════════════════ */}
        <div className="lp-left">
          {/* Brand photo */}
          <img
            src="/hero-bg.png"
            alt="AUTHOR — Streetwear"
            className="lp-photo"
          />

          {/* Vignette */}
          <div className="lp-photo-overlay" />

          {/* Top-left: Brand mark */}
          <span className="lp-brand-mark">Author</span>

          {/* Bottom-left: Collection tagline */}
          <div className="lp-tagline">
            <p className="lp-tagline-main">
              Concrete{' '}
              <span className="lp-tagline-accent">Couture.</span>
            </p>
          </div>
        </div>

        {/* ═══════════════════ RIGHT COLUMN ════════════════════════ */}
        <div className="lp-right">
          <AnimatePresence mode="wait">
            {view === 'auth' ? (
              <motion.div
                key="auth-form"
                className="lp-form-wrap"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Section label */}
                <span className="lp-est-label">Author — Est. 2026</span>

                {/* Heading */}
                <h1 className="lp-heading">
                  {mode === 'login' ? 'Welcome' : 'Join Author'}
                </h1>


                {/* Mode tabs */}
                <div className="lp-mode-tabs" role="tablist">
                  <button
                    id="lp-tab-login"
                    role="tab"
                    aria-selected={mode === 'login'}
                    className={`lp-mode-tab${mode === 'login' ? ' active' : ''}`}
                    onClick={() => { setMode('login'); clearErrors(); }}
                  >
                    Sign In
                  </button>
                  <button
                    id="lp-tab-register"
                    role="tab"
                    aria-selected={mode === 'register'}
                    className={`lp-mode-tab${mode === 'register' ? ' active' : ''}`}
                    onClick={() => { setMode('register'); clearErrors(); }}
                  >
                    Create Account
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleEmailAuth} noValidate>

                  {/* Name field — only on register */}
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="lp-field"
                    >
                      <label htmlFor="lp-name" className="lp-label">Full Name</label>
                      <input
                        id="lp-name"
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); clearErrors(); }}
                        required={mode === 'register'}
                        autoComplete="name"
                        placeholder="Your name"
                        className="lp-input"
                      />
                    </motion.div>
                  )}

                  {/* Email */}
                  <div className="lp-field">
                    <label htmlFor="lp-email" className="lp-label">Email Address</label>
                    <input
                      id="lp-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearErrors(); }}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={`lp-input${inputShake ? ' input-error' : ''}`}
                    />
                    {/* Inline error message */}
                    {loginError && (
                      <div className="lp-inline-error">
                        <span className="lp-inline-error-dot" />
                        <span className="lp-inline-error-text">{loginError}</span>
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="lp-field">
                    <label htmlFor="lp-password" className="lp-label">Password</label>
                    <div className="lp-input-password-wrap">
                      <input
                        id="lp-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
                        required
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        placeholder="Min 8 characters"
                        className={`lp-input${inputShake ? ' input-error' : ''}`}
                      />
                      <button
                        type="button"
                        className="lp-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword
                          ? <EyeOff style={{ width: '16px', height: '16px' }} strokeWidth={1.5} />
                          : <Eye style={{ width: '16px', height: '16px' }} strokeWidth={1.5} />
                        }
                      </button>
                    </div>
                    {mode === 'login' && (
                      <Link href="/reset-password" className="lp-forgot">
                        Forgot password?
                      </Link>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    id="lp-submit-btn"
                    type="submit"
                    disabled={isLoading || !email || !password || (mode === 'register' && !name)}
                    className="lp-btn-primary"
                  >
                    {isLoading
                      ? <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                      : mode === 'login' ? 'Continue' : 'Create Account'
                    }
                  </button>
                </form>

                {/* OR Divider */}
                <div className="lp-divider">
                  <div className="lp-divider-line" />
                  <span className="lp-divider-text">Or</span>
                  <div className="lp-divider-line" />
                </div>

                {/* Social buttons */}
                <div className="lp-social-row">
                  <button
                    id="lp-google-btn"
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="lp-social-btn"
                    aria-label="Continue with Google"
                  >
                    {isGoogleLoading
                      ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />
                      : <GoogleIcon size={16} />
                    }
                    Google
                  </button>

                  <button
                    id="lp-facebook-btn"
                    type="button"
                    disabled
                    className="lp-social-btn"
                    aria-label="Continue with Facebook (coming soon)"
                    title="Coming soon"
                  >
                    <FacebookIcon size={16} />
                    Facebook
                  </button>
                </div>

                {/* Footer note */}
                <p className="lp-footer-note">
                  By continuing, you agree to our{' '}
                  <Link href="/terms">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy">Privacy Policy</Link>.
                  <br />
                  {mode === 'login'
                    ? <>No account? <button type="button" onClick={() => { setMode('register'); clearErrors(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B8A07A', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}>Create one →</button></>
                    : <>Have an account? <button type="button" onClick={() => { setMode('login'); clearErrors(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B8A07A', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}>Sign in →</button></>
                  }
                </p>
              </motion.div>
            ) : (
              /* ═══════════════════ CHECK YOUR INBOX VIEW ════════════════════ */
              <motion.div
                key="check-inbox-view"
                className="lp-form-wrap"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ textAlign: 'center' }}
              >
                {/* Author Co oval logo */}
                <div className="lp-inbox-logo">
                  <span className="lp-inbox-logo-text">A</span>
                </div>

                {/* Heading */}
                <h1 className="lp-heading" style={{ marginBottom: '16px', textAlign: 'center' }}>
                  Check Your Inbox
                </h1>

                {/* Subtitle with email */}
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: 300,
                  color: '#666',
                  lineHeight: 1.6,
                  margin: '0 0 8px 0',
                  textAlign: 'center',
                }}>
                  We sent a confirmation link to<br />
                  <strong style={{ color: '#B8A07A', fontWeight: 400 }}>{email}</strong>
                </p>

                {/* Instructions */}
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 300,
                  color: '#555',
                  lineHeight: 1.6,
                  margin: '0',
                  textAlign: 'center',
                }}>
                  Click the link in that email<br />
                  to activate your account.
                </p>

                {/* Separator */}
                <div className="lp-inbox-sep" />

                {/* Resend section */}
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 300,
                  color: '#555',
                  margin: '0 0 10px 0',
                  textAlign: 'center',
                }}>
                  Didn&apos;t receive it?
                </p>

                {resendCooldown > 0 ? (
                  <span className="lp-resend-cooldown">
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    className="lp-resend-btn"
                    onClick={handleResendEmail}
                    disabled={isResending}
                  >
                    {isResending ? 'Sending…' : 'Resend email →'}
                  </button>
                )}

                {/* Back to sign in */}
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 300,
                  color: '#3A3A3A',
                  margin: '24px 0 0 0',
                  textAlign: 'center',
                }}>
                  <button
                    type="button"
                    onClick={() => { setView('auth'); setMode('login'); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B8A07A', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
                  >
                    ← Back to Sign In
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </>
  );
}
