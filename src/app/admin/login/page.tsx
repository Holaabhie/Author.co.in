"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/admin";
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "MARKETING", "SUPPORT", "VIEWER"];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        toast.error(authError.message === "Invalid login credentials" 
          ? "Invalid email or password" 
          : authError.message
        );
        setIsLoading(false);
        return;
      }

      if (authData?.user) {
        // 2. Fetch UserRole to verify admin privileges
        const { data: roleData, error: roleError } = await supabase
          .from("UserRole")
          .select("role")
          .eq("userId", authData.user.id)
          .in("role", ADMIN_ROLES)
          .limit(1)
          .maybeSingle();

        if (roleError) {
          console.error("Role lookup error:", roleError);
          await supabase.auth.signOut();
          toast.error("An error occurred while verifying privileges");
          setIsLoading(false);
          return;
        }

        if (!roleData) {
          // Not authorized - sign them out immediately
          await supabase.auth.signOut();
          toast.error("Unauthorized: You do not have admin access");
          setIsLoading(false);
          return;
        }

        // 3. Welcome message and redirect
        /* success toast removed */
        const target = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/admin";
        router.push(target);
        router.refresh();
      }
    } catch (err) {
      console.error("Login catch error:", err);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-login-body {
          font-family: 'Inter', sans-serif;
          background-color: #050505;
          color: #F5F0EB;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        /* Ambient background glow */
        .admin-bg-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(200, 191, 182, 0.05) 0%, rgba(0, 0, 0, 0) 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 0;
          pointer-events: none;
        }

        .admin-login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(20, 20, 20, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          padding: 40px;
          position: relative;
          z-index: 1;
        }

        .admin-header-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #F5F0EB;
          text-align: center;
        }

        .admin-header-subtitle {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #C8BFB6;
          text-align: center;
          margin-top: 4px;
          font-weight: 500;
        }

        .admin-input-group {
          margin-bottom: 20px;
        }

        .admin-label {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #8A8A8A;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .admin-input {
          width: 100%;
          background: rgba(10, 10, 10, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 14px;
          font-size: 16px; /* Prevents auto-zoom on mobile iOS */
          color: #F5F0EB;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        @media (min-width: 768px) {
          .admin-input {
            font-size: 13px;
          }
        }

        .admin-input:focus {
          border-color: rgba(200, 191, 182, 0.4);
          background: rgba(15, 15, 15, 0.9);
        }

        .admin-submit-btn {
          width: 100%;
          background: #C8BFB6;
          color: #050505;
          border: none;
          padding: 14px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s, transform 0.1s;
        }

        .admin-submit-btn:hover:not(:disabled) {
          background: #E5DFD9;
        }

        .admin-submit-btn:active:not(:disabled) {
          transform: scale(0.99);
        }

        .admin-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .admin-back-link {
          display: block;
          text-align: center;
          font-size: 11px;
          color: #8A8A8A;
          text-decoration: none;
          margin-top: 24px;
          transition: color 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .admin-back-link:hover {
          color: #C8BFB6;
        }

        .admin-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(200, 191, 182, 0.08);
          border: 1px solid rgba(200, 191, 182, 0.15);
          border-radius: 4px;
          padding: 8px 12px;
          margin-bottom: 24px;
        }

        .admin-badge-text {
          font-size: 11px;
          color: #C8BFB6;
          letter-spacing: 0.05em;
        }
      `}} />

      <div className="admin-login-body">
        <div className="admin-bg-glow" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="admin-login-card"
        >
          {/* Logo / Brand Name */}
          <div className="mb-6 flex flex-col items-center">
            <h1 className="admin-header-title" id="admin-login-title">
              Author Co.
            </h1>
            <p className="admin-header-subtitle">
              Internal Control Panel
            </p>
          </div>

          {/* Secure Badge */}
          <div className="admin-badge">
            <Lock className="w-3.5 h-3.5 text-author-cream" />
            <span className="admin-badge-text font-medium">Secure Administrator Access</span>
          </div>

          <form onSubmit={handleLogin} noValidate>
            <div className="admin-input-group">
              <label htmlFor="admin-email" className="admin-label">
                Security Identity (Email)
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="identity@author.co.in"
                required
                className="admin-input"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="admin-password" className="admin-label">
                Access Passcode (Password)
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="admin-input"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={isLoading || !email || !password}
              className="admin-submit-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Identity...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Authenticate
                </>
              )}
            </button>
          </form>

          <Link href="/" className="admin-back-link">
            ← Return to Public Terminal
          </Link>
        </motion.div>
      </div>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="admin-login-body">
        <style dangerouslySetInnerHTML={{ __html: `
          .admin-login-body {
            font-family: 'Inter', sans-serif;
            background-color: #050505;
            color: #F5F0EB;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            padding: 24px;
          }
        `}} />
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8BFB6' }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: '#C8BFB6', opacity: 0.5 }}>Loading Secure Access...</span>
        </div>
      </div>
    }>
      <AdminLoginPageContent />
    </Suspense>
  );
}
