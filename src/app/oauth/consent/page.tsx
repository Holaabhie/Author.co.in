'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  User as UserIcon, 
  Mail, 
  ShoppingBag, 
  Terminal, 
  Database, 
  LineChart, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Settings,
  HelpCircle,
  AlertTriangle,
  Lock,
  LogOut,
  ChevronRight,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

// ── Icon Mapper for Client Apps ─────────────────────────────────────────────
function ClientIcon({ type, size = 24 }: { type: string; size?: number }) {
  switch (type) {
    case 'terminal':
      return <Terminal size={size} className="text-[#C8956C]" />;
    case 'database':
      return <Database size={size} className="text-[#C8956C]" />;
    case 'analytics':
      return <LineChart size={size} className="text-[#C8956C]" />;
    case 'store':
    default:
      return <ShoppingBag size={size} className="text-[#C8956C]" />;
  }
}

export default function OAuthConsentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // ── Query Parameters ──────────────────────────────────────────────────────
  const clientId = searchParams.get('client_id');
  const clientNameParam = searchParams.get('client_name');
  const redirectUriParam = searchParams.get('redirect_uri');
  const scopeParam = searchParams.get('scope') ?? 'profile email';
  const stateParam = searchParams.get('state') ?? '';

  // ── Authentication & Loading State ────────────────────────────────────────
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [actionTaken, setActionTaken] = useState<'approved' | 'denied' | null>(null);

  // ── Developer / Preview Drawer State ──────────────────────────────────────
  const isPreviewMode = !clientId || searchParams.get('preview') === 'true';
  const [showDevDrawer, setShowDevDrawer] = useState(isPreviewMode);
  
  // Customizable preview parameters
  const [previewClientName, setPreviewClientName] = useState(clientNameParam || 'Author CLI Developer Tool');
  const [previewClientIcon, setPreviewClientIcon] = useState('terminal');
  const [previewRedirectUri, setPreviewRedirectUri] = useState(redirectUriParam || 'http://localhost:8080/callback');
  const [previewScopes, setPreviewScopes] = useState<string[]>(
    scopeParam.split(/[\s,+]+/).filter(Boolean)
  );

  // ── Scope Descriptions Mapping ────────────────────────────────────────────
  const scopeMetadata: Record<string, { label: string; desc: string; icon: any }> = {
    profile: {
      label: 'Basic Profile',
      desc: 'Access your full name, avatar picture, and account identifier.',
      icon: UserIcon,
    },
    email: {
      label: 'Email Address',
      desc: 'Read your primary verified email address for communication.',
      icon: Mail,
    },
    orders: {
      label: 'Order History',
      desc: 'Access your purchase history, tracking details, and invoice information.',
      icon: ShoppingBag,
    },
    cart: {
      label: 'Cart Management',
      desc: 'Read and sync items currently in your shopping cart.',
      icon: ShoppingBag,
    },
  };

  // Check user session
  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          // Store current path to redirect back after login
          const callbackPath = window.location.pathname + window.location.search;
          toast.error('Please sign in to authorize this application.');
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
        } else {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Error checking authentication status:', err);
        toast.error('Auth verification failed.');
      } finally {
        setIsAuthLoading(false);
      }
    }
    checkUser();
  }, [router, supabase]);

  // Set document title
  useEffect(() => {
    document.title = 'Authorize Application | AUTHOR';
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    setIsSubmitting(true);
    setActionTaken('approved');
    
    // Simulate security check and code exchange
    await new Promise((resolve) => setTimeout(resolve, 1800));
    
    const finalRedirectUri = isPreviewMode ? previewRedirectUri : redirectUriParam;
    const finalState = isPreviewMode ? 'preview_state_xyz' : stateParam;
    const authCode = `auth_code_${Math.random().toString(36).substring(2, 12)}`;
    
    setIsSubmitting(false);
    setSubmitSuccess(true);

    // Redirect after a brief success animation delay
    setTimeout(() => {
      if (finalRedirectUri) {
        const redirectUrl = new URL(finalRedirectUri);
        redirectUrl.searchParams.set('code', authCode);
        if (finalState) redirectUrl.searchParams.set('state', finalState);
        window.location.href = redirectUrl.toString();
      } else {
        console.log(`Success! Mock Auth Code: ${authCode}`);
      }
    }, 1500);
  };

  const handleDeny = async () => {
    setIsSubmitting(true);
    setActionTaken('denied');
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const finalRedirectUri = isPreviewMode ? previewRedirectUri : redirectUriParam;
    const finalState = isPreviewMode ? 'preview_state_xyz' : stateParam;
    
    setIsSubmitting(false);
    setSubmitError(true);
    toast.error('Access request denied.');

    setTimeout(() => {
      if (finalRedirectUri) {
        const redirectUrl = new URL(finalRedirectUri);
        redirectUrl.searchParams.set('error', 'access_denied');
        if (finalState) redirectUrl.searchParams.set('state', finalState);
        window.location.href = redirectUrl.toString();
      } else {
        router.push('/');
      }
    }, 1200);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    window.location.reload();
  };

  const toggleScope = (scopeKey: string) => {
    if (previewScopes.includes(scopeKey)) {
      setPreviewScopes(previewScopes.filter((s) => s !== scopeKey));
    } else {
      setPreviewScopes([...previewScopes, scopeKey]);
    }
  };

  // Loading state visualizer
  if (isAuthLoading) {
    return (
      <div className="flex min-height-screen items-center justify-center bg-[#050505] text-[#F5F0E8]" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="relative mb-4 flex justify-center">
            <div className="h-12 w-12 rounded-full border-2 border-[#C8956C]/20 border-t-[#C8956C] animate-spin" />
            <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#C8956C]" size={20} />
          </div>
          <p className="font-barlow text-sm uppercase tracking-[0.2em] text-[#B8A07A]">Verifying Authorization Session...</p>
        </div>
      </div>
    );
  }

  // Active client details
  const activeClientName = isPreviewMode ? previewClientName : (clientNameParam || 'External Application');
  const activeScopes = isPreviewMode ? previewScopes : scopeParam.split(/[\s,+]+/).filter(Boolean);
  const activeRedirect = isPreviewMode ? previewRedirectUri : redirectUriParam;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .oauth-page {
          font-family: 'Jost', sans-serif;
          background: radial-gradient(circle at 50% 50%, #15110d 0%, #050505 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
          color: #F5F0E8;
        }

        /* Ambient grid pattern */
        .oauth-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(200, 149, 108, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200, 149, 108, 0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          background-position: center center;
          pointer-events: none;
        }

        .oauth-card {
          width: 100%;
          max-width: 520px;
          background: rgba(15, 15, 15, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(184, 160, 122, 0.15);
          padding: 40px;
          position: relative;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(200, 149, 108, 0.03);
          z-index: 10;
        }

        .font-barlow {
          font-family: 'Barlow Condensed', sans-serif;
        }

        .oauth-connection-svg {
          width: 100%;
          height: 60px;
        }

        .connection-dash {
          stroke-dasharray: 8, 8;
          animation: connectionFlow 1.5s linear infinite;
        }

        @keyframes connectionFlow {
          to {
            stroke-dashoffset: -16;
          }
        }

        .glow-pulse {
          animation: pulseGlow 2.5s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(200, 149, 108, 0.2));
            opacity: 0.8;
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(200, 149, 108, 0.6));
            opacity: 1;
          }
        }

        /* Switch toggle styles for Drawer */
        .drawer-switch {
          position: relative;
          display: inline-block;
          width: 38px;
          height: 20px;
        }

        .drawer-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .switch-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: #222;
          transition: .3s;
          border: 1px solid #333;
        }

        .switch-slider:before {
          position: absolute;
          content: "";
          height: 12px;
          width: 12px;
          left: 3px;
          bottom: 3px;
          background-color: #888;
          transition: .3s;
        }

        input:checked + .switch-slider {
          background-color: rgba(200, 149, 108, 0.2);
          border-color: #C8956C;
        }

        input:checked + .switch-slider:before {
          transform: translateX(18px);
          background-color: #C8956C;
        }
      `}} />

      <div className="oauth-page">
        {/* Ambient background effects */}
        <div className="oauth-grid" />
        <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-[#C8956C]/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-black blur-[120px] pointer-events-none" />

        {/* ── MAIN DIALOG CARD ────────────────────────────────────────────────── */}
        <motion.div 
          className="oauth-card border-t-2 border-t-[#C8956C]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[#222] pb-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-[#C8956C]/10 border border-[#C8956C]/30">
                <Shield className="text-[#C8956C]" size={18} />
              </div>
              <div>
                <span className="font-barlow text-xs uppercase tracking-[0.3em] text-[#B8A07A] font-semibold">Author Access Gateway</span>
                <h1 className="font-barlow text-lg uppercase tracking-[0.05em] text-white font-bold leading-tight">Authorize Application</h1>
              </div>
            </div>
            {isPreviewMode && (
              <span className="px-2 py-0.5 border border-[#C8956C]/40 text-[#C8956C] font-barlow text-[10px] tracking-wider uppercase font-semibold">
                Preview Mode
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!submitSuccess && !submitError ? (
              <motion.div
                key="consent-form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Visual Connection Nodes */}
                <div className="bg-[#0D0D0D] border border-[#1E1E1E] p-6 mb-8 flex items-center justify-between relative overflow-hidden">
                  {/* Background flare */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 bg-[#C8956C]/5 blur-[24px] pointer-events-none" />

                  {/* Left: User Node */}
                  <div className="flex flex-col items-center justify-center z-10 w-24">
                    <div className="h-16 w-16 bg-[#1A1A1A] border border-[#333] flex items-center justify-center relative shadow-lg">
                      {user?.email ? (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#1C1814] to-[#0A0A0A] font-barlow text-xl font-bold text-[#C8956C]">
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <UserIcon className="text-gray-500" size={24} />
                      )}
                      <div className="absolute -bottom-1.5 -right-1.5 h-5 w-5 bg-green-500 border-2 border-[#0D0D0D] rounded-full flex items-center justify-center" title="Logged in">
                        <div className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
                      </div>
                    </div>
                    <span className="font-barlow text-[10px] tracking-wider uppercase text-[#888] mt-3 truncate w-full text-center">
                      {user?.email?.split('@')[0] || 'You'}
                    </span>
                  </div>

                  {/* Center: Glowing Connection Line */}
                  <div className="flex-1 px-4 relative flex items-center justify-center">
                    <svg className="oauth-connection-svg" viewBox="0 0 100 40">
                      {/* Connection path */}
                      <path 
                        d="M 10 20 L 90 20" 
                        stroke="rgba(200, 149, 108, 0.15)" 
                        strokeWidth="2" 
                        fill="none" 
                      />
                      {/* Flowing animated dash path */}
                      <path 
                        d="M 10 20 L 90 20" 
                        stroke="#C8956C" 
                        strokeWidth="2.5" 
                        fill="none" 
                        className="connection-dash" 
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#C8956C]/10 border border-[#C8956C]/30 px-2 py-0.5 rounded-full z-10 flex items-center gap-1">
                      <Lock size={10} className="text-[#C8956C]" />
                      <span className="text-[8px] font-barlow tracking-wider uppercase font-semibold text-[#B8A07A]">SSL</span>
                    </div>
                  </div>

                  {/* Right: Client App Node */}
                  <div className="flex flex-col items-center justify-center z-10 w-24">
                    <div className="h-16 w-16 bg-[#1A1A1A] border border-[#C8956C]/40 glow-pulse flex items-center justify-center relative shadow-lg">
                      <ClientIcon type={previewClientIcon} size={28} />
                    </div>
                    <span className="font-barlow text-[10px] tracking-wider uppercase text-[#C8956C] mt-3 truncate w-full text-center font-bold">
                      {activeClientName}
                    </span>
                  </div>
                </div>

                {/* Information Callout */}
                <p className="text-sm text-gray-300 leading-relaxed mb-6 font-light">
                  <strong className="text-white font-medium">{activeClientName}</strong> is requesting authorization to connect to your <strong className="text-white font-medium">AUTHOR</strong> account. This application will be granted permission to access the details listed below.
                </p>

                {/* Requested Scopes Section */}
                <div className="mb-8">
                  <h3 className="font-barlow text-xs uppercase tracking-[0.2em] text-[#B8A07A] font-semibold mb-4 flex items-center gap-2">
                    <span>Requested Access Scopes</span>
                    <span className="h-[1px] flex-1 bg-[#222]" />
                  </h3>
                  
                  {activeScopes.length === 0 ? (
                    <div className="border border-dashed border-[#333] p-4 text-center text-sm text-gray-500 font-light">
                      No specific scopes requested. Standard basic profile read-access will apply.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeScopes.map((scopeKey) => {
                        const meta = scopeMetadata[scopeKey.trim().toLowerCase()] || {
                          label: `Scope: ${scopeKey}`,
                          desc: `Access permission linked to ${scopeKey} context.`,
                          icon: HelpCircle,
                        };
                        const ScopeIcon = meta.icon;

                        return (
                          <div 
                            key={scopeKey} 
                            className="flex items-start gap-4 p-3.5 bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#C8956C]/20 transition-all duration-300 group"
                          >
                            <div className="h-8 w-8 flex items-center justify-center bg-[#1A1A1A] border border-[#2A2A2A] group-hover:border-[#C8956C]/30 transition-colors">
                              <ScopeIcon size={16} className="text-gray-400 group-hover:text-[#C8956C] transition-colors" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-white tracking-wide">{meta.label}</h4>
                                <span className="text-[9px] font-barlow uppercase tracking-wider text-[#C8956C] bg-[#C8956C]/5 px-1.5 py-0.5 border border-[#C8956C]/10 font-bold">
                                  Required
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 font-light mt-1 leading-normal">{meta.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Logged in account footer block */}
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-4 mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-[#222] border border-[#333] flex items-center justify-center font-barlow text-sm font-bold text-gray-300">
                      {user?.email?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[9px] font-barlow tracking-wider uppercase text-gray-500 font-semibold block leading-none">Signed in as</span>
                      <span className="text-xs text-gray-300 font-light truncate max-w-[200px] block mt-1">{user?.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#222] hover:border-red-950 hover:bg-red-950/20 text-xs text-gray-400 hover:text-red-400 transition-all duration-300"
                    title="Log out"
                  >
                    <LogOut size={12} />
                    <span className="font-barlow tracking-wider uppercase font-semibold">Switch Account</span>
                  </button>
                </div>

                {/* Disclaimer */}
                <p className="text-[11px] text-gray-500 text-center font-light leading-relaxed mb-8">
                  By clicking <strong className="text-gray-400 font-medium">Authorize</strong>, you grant this application permission to access your data in accordance with their privacy policy and terms. You can revoke this access at any time in your Account Settings.
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                  <button
                    id="oauth-deny-btn"
                    onClick={handleDeny}
                    disabled={isSubmitting}
                    className="flex-1 py-4 border border-[#333] hover:border-red-950 hover:bg-red-950/20 text-xs text-gray-400 hover:text-red-400 transition-all duration-300 font-barlow font-bold uppercase tracking-[0.25em]"
                  >
                    {isSubmitting && actionTaken === 'denied' ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-red-400/20 border-t-red-400" />
                    ) : (
                      'Cancel'
                    )}
                  </button>
                  <button
                    id="oauth-approve-btn"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-[#C8956C] text-black hover:bg-[#d4a07a] active:bg-[#b58057] transition-all duration-300 font-barlow font-bold uppercase tracking-[0.25em] shadow-lg shadow-[#C8956C]/10 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && actionTaken === 'approved' ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    ) : (
                      <>
                        <span>Authorize</span>
                        <ArrowRight size={14} className="stroke-[2.5px]" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : submitSuccess ? (
              /* ── SUCCESS SCREEN ────────────────────────────────────────────── */
              <motion.div
                key="success-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="relative inline-block mb-6">
                  <div className="h-20 w-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="text-green-500" size={40} />
                  </div>
                  {/* Glowing success ring */}
                  <div className="absolute top-0 left-0 h-full w-full border border-green-500 rounded-full animate-ping opacity-25" />
                </div>
                <h2 className="font-barlow text-2xl font-bold uppercase tracking-wider text-white mb-2">Access Authorized</h2>
                <p className="text-sm text-gray-400 max-w-[340px] mx-auto font-light leading-relaxed mb-6">
                  Secure access token created successfully. Transferring authorization credentials to the client application...
                </p>
                
                <div className="inline-flex items-center gap-2 bg-[#0D0D0D] border border-[#222] px-4 py-2 text-xs text-gray-500 rounded">
                  <span className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-barlow uppercase tracking-wider font-semibold">Redirecting to {new URL(activeRedirect || 'http://localhost').hostname}...</span>
                </div>
              </motion.div>
            ) : (
              /* ── ERROR/DENIED SCREEN ────────────────────────────────────────── */
              <motion.div
                key="error-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="h-20 w-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="text-red-500" size={40} />
                </div>
                <h2 className="font-barlow text-2xl font-bold uppercase tracking-wider text-white mb-2">Request Denied</h2>
                <p className="text-sm text-gray-400 max-w-[340px] mx-auto font-light leading-relaxed mb-6">
                  The authorization request has been declined. Returning to the client application...
                </p>
                
                <div className="inline-flex items-center gap-2 bg-[#0D0D0D] border border-[#222] px-4 py-2 text-xs text-gray-500 rounded">
                  <span className="inline-block h-2 w-2 bg-red-500 rounded-full" />
                  <span className="font-barlow uppercase tracking-wider font-semibold">Redirecting client...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── DEVELOPER DEMO DRAWER ───────────────────────────────────────────── */}
        {isPreviewMode && (
          <>
            {/* Drawer trigger button on page (bottom-right) */}
            <div className="absolute bottom-6 right-6 z-30">
              <button 
                id="dev-drawer-toggle"
                onClick={() => setShowDevDrawer(!showDevDrawer)}
                className="flex items-center gap-2 px-4 py-3 bg-[#1A1A1A] border border-[#C8956C]/40 hover:border-[#C8956C] text-xs text-[#C8956C] shadow-2xl transition-all duration-300 font-barlow tracking-wider uppercase font-semibold"
              >
                <Settings size={14} className={showDevDrawer ? 'animate-spin' : ''} />
                <span>Developer Console</span>
              </button>
            </div>

            {/* Slide-out Drawer */}
            <AnimatePresence>
              {showDevDrawer && (
                <motion.div 
                  className="fixed top-0 right-0 w-80 h-full bg-[#0A0A0A] border-l border-[#222] shadow-2xl z-40 p-6 overflow-y-auto flex flex-col justify-between"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                >
                  <div>
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between border-b border-[#222] pb-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Settings size={16} className="text-[#C8956C]" />
                        <h3 className="font-barlow text-sm font-bold uppercase tracking-wider text-white">OAuth Live Customizer</h3>
                      </div>
                      <button 
                        onClick={() => setShowDevDrawer(false)}
                        className="text-gray-500 hover:text-white text-xs font-semibold px-2 py-1 hover:bg-[#1E1E1E]"
                      >
                        Hide
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-400 font-light leading-relaxed mb-6">
                      Use this panel to simulate different client configurations and immediately verify how the authorization interface behaves.
                    </p>

                    {/* App Config Fields */}
                    <div className="space-y-4">
                      {/* Client Name */}
                      <div>
                        <label className="block font-barlow text-[10px] tracking-wider uppercase text-gray-500 font-semibold mb-1.5">Client Application Name</label>
                        <input 
                          type="text" 
                          value={previewClientName}
                          onChange={(e) => setPreviewClientName(e.target.value)}
                          className="w-full bg-[#111] border border-[#222] text-xs text-white px-3 py-2 outline-none focus:border-[#C8956C]"
                        />
                      </div>

                      {/* Icon Style */}
                      <div>
                        <label className="block font-barlow text-[10px] tracking-wider uppercase text-gray-500 font-semibold mb-1.5">Client Icon Style</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['store', 'terminal', 'database', 'analytics'].map((iconType) => (
                            <button
                              key={iconType}
                              onClick={() => setPreviewClientIcon(iconType)}
                              className={`py-1.5 bg-[#111] border text-[10px] uppercase font-barlow font-bold tracking-wider ${
                                previewClientIcon === iconType 
                                  ? 'border-[#C8956C] text-[#C8956C]' 
                                  : 'border-[#222] text-gray-500 hover:border-[#333]'
                              }`}
                            >
                              {iconType}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Redirect URI */}
                      <div>
                        <label className="block font-barlow text-[10px] tracking-wider uppercase text-gray-500 font-semibold mb-1.5">Callback/Redirect URI</label>
                        <input 
                          type="text" 
                          value={previewRedirectUri}
                          onChange={(e) => setPreviewRedirectUri(e.target.value)}
                          className="w-full bg-[#111] border border-[#222] text-xs text-white px-3 py-2 outline-none focus:border-[#C8956C] font-mono text-[10px]"
                        />
                      </div>

                      {/* Scope Selectors */}
                      <div>
                        <label className="block font-barlow text-[10px] tracking-wider uppercase text-gray-500 font-semibold mb-2">Requested Scopes</label>
                        <div className="space-y-2 bg-[#111] border border-[#222] p-3">
                          {Object.keys(scopeMetadata).map((scopeKey) => {
                            const isChecked = previewScopes.includes(scopeKey);
                            return (
                              <label key={scopeKey} className="flex items-center justify-between cursor-pointer group">
                                <span className="text-xs text-gray-400 group-hover:text-white capitalize transition-colors">
                                  {scopeKey}
                                </span>
                                <span className="drawer-switch">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => toggleScope(scopeKey)}
                                  />
                                  <span className="switch-slider" />
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Drawer Footer Status */}
                  <div className="border-t border-[#222] pt-4 mt-6">
                    <div className="bg-[#111] border border-[#222] p-3 flex items-start gap-2.5">
                      <Info size={14} className="text-[#C8956C] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-barlow uppercase font-bold text-[#C8956C] tracking-wide block">Testing Integration</span>
                        <p className="text-[10px] text-gray-500 font-light mt-0.5 leading-relaxed">
                          Redirects will exchange code securely or report access denied. Check browser URL after submitting.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </>
  );
}
