'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, User, Menu, X, LogOut, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useUIStore } from '@/lib/store/ui';
import { useUser } from '@/hooks/use-user';
import AuthorLogo from '@/components/common/AuthorLogo';

const AUTH_PATHS = ['/login', '/register', '/reset-password', '/update-password'];

export default function Navbar() {
  const { user, signOut } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  const { isMobileMenuOpen, isSearchOpen, openMobileMenu, closeMobileMenu, openSearch, closeAllOverlays } = useUIStore();
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const openCart = useCartStore((state) => state.openCart);
  const isCartOpen = useCartStore((state) => state.isOpen);

  const [mounted, setMounted] = useState(false);

  // 2c: Track scroll direction to hide/show "My Account / Logged in as" block
  const [sidebarHeaderVisible, setSidebarHeaderVisible] = useState(true);

  // Single consolidated scroll handler with rAF throttle
  const rafRef = useRef<number | null>(null);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      if (rafRef.current !== null) return; // Already scheduled
      rafRef.current = requestAnimationFrame(() => {
        const current = window.scrollY;
        const wasScrolled = current > 50;
        const shouldShow = current <= 20;

        // Batch state updates — only set when value actually changes
        setIsScrolled((prev) => (prev !== wasScrolled ? wasScrolled : prev));
        setShowHeader((prev) => (prev !== shouldShow ? shouldShow : prev));

        // Sidebar header visibility: hide on scroll down, show on scroll up
        if (current > lastScrollRef.current && current > 60) {
          setSidebarHeaderVisible(false);
        } else {
          setSidebarHeaderVisible(true);
        }
        lastScrollRef.current = current;
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Close mobile menu on route change and restore body scroll
  useEffect(() => {
    closeMobileMenu();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Body scroll lock and pointer events when any overlay is open
  useEffect(() => {
    const isAnyOpen = isMobileMenuOpen || isSearchOpen || isCartOpen;
    if (isAnyOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('pointer-events-none');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('pointer-events-none');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('pointer-events-none');
    };
  }, [isMobileMenuOpen, isSearchOpen, isCartOpen]);

  // Hide navbar entirely on auth/split-screen pages
  if (AUTH_PATHS.includes(pathname)) return null;

  const handleSignOut = async () => {
    closeMobileMenu();
    await signOut();
    router.push('/');
    router.refresh();
  };

  // 2b: Get first name for display
  const getDisplayName = () => {
    if (!user) return '';
    const fullName = user.user_metadata?.name || user.user_metadata?.full_name;
    if (fullName) {
      return fullName.split(' ')[0];
    }
    // Fallback: email prefix before @
    return user.email?.split('@')[0] || '';
  };

  // Main navigation items — cleaned up
  const mainNav = [
    {
      name: 'Shop',
      href: '/shop',
      dropdown: [
        { name: 'T-Shirts', href: '/shop/tshirts' },
        { name: 'Tops', href: '/shop/tops' },
        { name: 'Sweatpants', href: '/shop/sweatpants' },
      ],
    },
    {
      name: 'About',
      href: '/about',
      dropdown: [
        { name: 'Our Story', href: '/about' },
        { name: 'Shipping', href: '/shipping' },
        { name: 'Returns', href: '/returns' },
        { name: 'Contact', href: '/contact' },
      ],
    },
  ];

  const isHomepage = pathname === '/';
  const isHeaderActive = isScrolled || !isHomepage;

  const textColorClass = isHeaderActive ? 'text-black' : 'text-white';
  const textHoverClass = isHeaderActive ? 'hover:text-neutral-500' : 'hover:text-neutral-300';
  const iconColorClass = isHeaderActive ? 'text-black' : 'text-white';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[9999] transition-transform duration-300 ease-out ${
          isCartOpen
            ? '-translate-y-full pointer-events-none'
            : isMobileMenuOpen
              ? 'translate-y-0 pointer-events-none'
              : `${showHeader ? 'translate-y-0' : '-translate-y-full'} pointer-events-auto`
        } ${
          isHeaderActive ? 'bg-white border-b border-neutral-100' : 'bg-transparent'
        }`}
        style={{
          transition: 'transform 300ms ease-out, background-color 0.5s ease, border-color 0.5s ease',
          willChange: 'transform, background-color',
        }}
      >

        <div className="section-padding">
          <nav className="flex items-center justify-between h-14 md:h-16 relative">
            
            {/* Left Main Menu (Desktop) */}
            <div className="hidden md:flex items-center gap-8 flex-1">
              {mainNav.map((link) => {
                if (link.dropdown) {
                  return (
                    <div key={link.name} className="relative group py-2">
                      <Link
                        href={link.href}
                        className={`text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors duration-300 flex items-center gap-1 ${textColorClass} ${textHoverClass}`}
                      >
                        {link.name}
                        <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" />
                      </Link>
                      
                      {/* Hover Dropdown Menu */}
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-neutral-100 py-2 shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-[opacity,visibility,transform] duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                        {link.dropdown.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="block px-4 py-2 text-[10px] uppercase tracking-wider text-black hover:bg-neutral-50 hover:text-neutral-600 transition-colors font-medium"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors duration-300 ${textColorClass} ${textHoverClass}`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Toggle button */}
            <button
              onClick={openMobileMenu}
              className="md:hidden p-2 -ml-2"
              aria-label="Open menu"
            >
              <Menu className={`w-5 h-5 ${iconColorClass}`} />
            </button>

            {/* Centered Brand Name Logo */}
            <AuthorLogo
              variant={isHeaderActive ? "dark" : "light"}
              className="absolute left-1/2 -translate-x-1/2"
            />

            {/* Right Icons Bar — 2d: Wishlist icon REMOVED */}
            <div className={`flex items-center gap-1 md:gap-3 flex-1 justify-end ${isMobileMenuOpen ? 'pointer-events-none' : 'pointer-events-auto'}`}>

              {/* Search button */}
              <button
                onClick={openSearch}
                className="p-2"
                aria-label="Search"
              >
                <Search className={`w-[17px] h-[17px] transition-colors ${iconColorClass}`} />
              </button>

              {/* User Account link */}
              {user ? (
                <Link href="/account" className="p-2 hidden sm:block" aria-label="Account">
                  <User className={`w-[17px] h-[17px] transition-colors ${iconColorClass}`} />
                </Link>
              ) : (
                <Link href={`/login?returnTo=${encodeURIComponent(pathname)}`} className="p-2 hidden sm:block" aria-label="Account">
                  <User className={`w-[17px] h-[17px] transition-colors ${iconColorClass}`} />
                </Link>
              )}

              {/* Cart Drawer Toggle button */}
              <button onClick={openCart} className="p-2 relative" aria-label="Cart">
                <ShoppingBag className={`w-[17px] h-[17px] transition-colors ${iconColorClass}`} />
                {mounted && cartItemCount > 0 && (
                  <motion.span
                    key={cartItemCount}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [1.4, 0.9, 1], opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute top-0.5 right-0.5 w-3.5 h-3.5 text-[8px] font-bold rounded-full bg-black text-white flex items-center justify-center border border-white"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Single Overlay Backdrop */}
      <AnimatePresence>
        {(isMobileMenuOpen || isSearchOpen || isCartOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 right-0 bottom-0"
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              top: '0px',
              height: '100dvh',
              zIndex: isMobileMenuOpen ? 9998 : isCartOpen ? 9997 : 9000,
            }}
            onClick={(e) => {
              e.stopPropagation();
              closeAllOverlays();
            }}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer Navigation Menu — Redesigned */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-[9999] flex flex-col font-sans"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header — Close button pinned at navbar height */}
            <div
              className="flex items-center justify-end px-6 flex-shrink-0"
              style={{ height: '56px' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeMobileMenu();
                }}
                className="p-2 -mr-2 z-[10000] relative"
                style={{ pointerEvents: 'auto' }}
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

              {/* Auth-aware block — Sign In / My Account, sits directly below close button */}
              <div
                style={{
                  transition: 'transform 0.3s ease, opacity 0.25s ease',
                  transform: sidebarHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
                  opacity: sidebarHeaderVisible ? 1 : 0,
                  overflow: 'hidden',
                  maxHeight: sidebarHeaderVisible ? '200px' : '0px',
                }}
              >
                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between px-6 py-4"
                      style={{ borderBottom: '1px solid #1E1E1E', fontSize: '16px', fontWeight: 500, color: '#C8956C', textTransform: 'uppercase' as const, letterSpacing: '0.12em', textDecoration: 'none' }}
                    >
                      My Account
                      <ChevronRight className="w-4 h-4" style={{ color: '#C8956C' }} />
                    </Link>
                    {/* Logged-in user info — first name, styled */}
                    <div className="px-6 py-3.5 bg-neutral-50 border-b border-neutral-100">
                      <p className="text-[9px] text-neutral-400 uppercase tracking-widest">Logged in as</p>
                      <p style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#0A0A0A',
                        fontFamily: "'Barlow Condensed', var(--font-barlow-condensed), sans-serif",
                        marginTop: '2px',
                        letterSpacing: '0.05em',
                      }}>
                        {getDisplayName()}
                      </p>
                    </div>
                  </>
                ) : (
                  <Link
                    href={`/login?returnTo=${encodeURIComponent(pathname)}`}
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid #1E1E1E', fontSize: '16px', fontWeight: 500, color: '#C8956C', textTransform: 'uppercase' as const, letterSpacing: '0.12em', textDecoration: 'none' }}
                  >
                    Sign In
                    <ArrowRight className="w-4 h-4" style={{ color: '#C8956C' }} />
                  </Link>
                )}
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-10">
                
                {/* SHOP Section */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-5">
                    Shop
                  </h3>
                  <div className="flex flex-col gap-4">
                    <Link
                      href="/shop/tshirts"
                      onClick={closeMobileMenu}
                      className="text-sm text-black hover:text-neutral-500 transition-colors duration-200 tracking-wide"
                    >
                      T-Shirts
                    </Link>
                    <Link
                      href="/shop/tops"
                      onClick={closeMobileMenu}
                      className="text-sm text-black hover:text-neutral-500 transition-colors duration-200 tracking-wide"
                    >
                      Tops
                    </Link>
                    <Link
                      href="/shop/sweatpants"
                      onClick={closeMobileMenu}
                      className="text-sm text-black hover:text-neutral-500 transition-colors duration-200 tracking-wide"
                    >
                      Sweatpants
                    </Link>
                  </div>
                </div>

                {/* ABOUT Section */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-5">
                    About
                  </h3>
                  <div className="flex flex-col gap-4">
                    <Link
                      href="/about"
                      onClick={closeMobileMenu}
                      className="text-sm text-black hover:text-neutral-500 transition-colors duration-200 tracking-wide"
                    >
                      Our Story
                    </Link>
                    <Link
                      href="/shipping"
                      onClick={closeMobileMenu}
                      className="text-sm text-black hover:text-neutral-500 transition-colors duration-200 tracking-wide"
                    >
                      Shipping
                    </Link>
                    <Link
                      href="/returns"
                      onClick={closeMobileMenu}
                      className="text-sm text-black hover:text-neutral-500 transition-colors duration-200 tracking-wide"
                    >
                      Returns
                    </Link>
                    <Link
                      href="/contact"
                      onClick={closeMobileMenu}
                      className="text-sm text-black hover:text-neutral-500 transition-colors duration-200 tracking-wide"
                    >
                      Contact
                    </Link>
                  </div>
                </div>

                {/* 2a: Bottom section — Sign Out only (no duplicate My Account or Sign In) */}
                {user && (
                  <div className="border-t border-neutral-100 pt-8 flex flex-col gap-4">
                    <button 
                      onClick={handleSignOut} 
                      className="text-sm font-medium text-neutral-400 hover:text-red-500 transition-colors duration-200 tracking-wide text-left flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}