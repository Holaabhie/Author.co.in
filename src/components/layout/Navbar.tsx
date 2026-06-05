'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, ShoppingBag, User, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useWishlistStore } from '@/lib/store/wishlist';
import { useUIStore } from '@/lib/store/ui';
import { useUser } from '@/hooks/use-user';

export default function Navbar() {
  const { user, signOut } = useUser();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  const { isMobileMenuOpen, openMobileMenu, closeMobileMenu, openSearch } = useUIStore();
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const openCart = useCartStore((state) => state.openCart);
  const wishlistCount = useWishlistStore((state) => state.getItemCount());

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    closeMobileMenu();
    await signOut();
    router.push('/');
    router.refresh();
  };

  // Main navigation items
  const mainNav = [
    { name: 'New Arrivals', href: '/shop?sort=new' },
    {
      name: 'Shop',
      href: '/shop',
      dropdown: [
        { name: 'T-Shirts', href: '/shop?category=t-shirts' },
        { name: 'Tops', href: '/shop?category=hoodies' },
        { name: 'Trousers', href: '/shop?category=joggers' },
      ],
    },
    { name: 'Lookbook', href: '/lookbook' },
    {
      name: 'About',
      href: '/about',
      dropdown: [
        { name: 'Our Story', href: '/about' },
        { name: 'Shipping', href: '/about' },
        { name: 'Returns', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ],
    },
  ];

  const textColorClass = isScrolled ? 'text-black' : 'text-white';
  const textHoverClass = isScrolled ? 'hover:text-neutral-500' : 'hover:text-neutral-300';
  const iconColorClass = isScrolled ? 'text-black' : 'text-white';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'bg-white border-b border-neutral-100' : 'bg-transparent'
        }`}
      >
        {/* Top Announcement Bar */}
        <div className="bg-black text-white text-center py-2 text-[9px] uppercase tracking-[0.25em] font-medium font-sans">
          Free shipping on all orders above ₹4,000
        </div>

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
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-neutral-100 py-2 shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
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
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <span
                className={`font-sans font-bold text-lg md:text-xl uppercase tracking-[0.3em] transition-colors duration-500 ${textColorClass}`}
              >
                Author
              </span>
            </Link>

            {/* Right Icons Bar */}
            <div className="flex items-center gap-1 md:gap-3 flex-1 justify-end">
              
              {/* Currency Selector (Static INR display as requested) */}
              <div className="hidden sm:flex items-center mr-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider font-sans border-r border-neutral-300/30 pr-4 ${textColorClass}`}>
                  INR ₹
                </span>
              </div>

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
                <Link href="/login" className="p-2 hidden sm:block" aria-label="Account">
                  <User className={`w-[17px] h-[17px] transition-colors ${iconColorClass}`} />
                </Link>
              )}

              {/* Wishlist Link */}
              <Link href="/account?tab=wishlist" className="p-2 relative" aria-label="Wishlist">
                <Heart className={`w-[17px] h-[17px] transition-colors ${iconColorClass}`} />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 text-[8px] font-bold rounded-full bg-black text-white flex items-center justify-center border border-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Drawer Toggle button */}
              <button onClick={openCart} className="p-2 relative" aria-label="Cart">
                <ShoppingBag className={`w-[17px] h-[17px] transition-colors ${iconColorClass}`} />
                {mounted && cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
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

      {/* Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[60]"
              onClick={closeMobileMenu}
            />
            {/* Drawer Container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-[70] flex flex-col shadow-xl font-sans"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-neutral-100">
                <span className="font-sans font-bold text-base uppercase tracking-widest text-black">Author</span>
                <button onClick={closeMobileMenu} className="p-2" aria-label="Close menu">
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>

              {user && (
                <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-100">
                  <p className="text-[9px] text-neutral-400 uppercase tracking-widest">Logged in as</p>
                  <p className="text-xs text-black mt-0.5 font-medium">
                    {user.user_metadata?.name || user.email}
                  </p>
                </div>
              )}

              {/* Navigation Links Scroll Container */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
                
                {/* Main mobile nav links */}
                {mainNav.map((link) => (
                  <div key={link.name} className="flex flex-col gap-2">
                    <Link
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="text-xs font-bold text-black uppercase tracking-[0.2em]"
                    >
                      {link.name}
                    </Link>
                    
                    {/* Render sub-dropdowns in drawer format directly */}
                    {link.dropdown && (
                      <div className="flex flex-col gap-2 pl-4 border-l border-neutral-100 mt-1">
                        {link.dropdown.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={closeMobileMenu}
                            className="text-[10px] text-neutral-500 uppercase tracking-widest hover:text-black transition-colors"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Dynamic user links */}
                <div className="border-t border-neutral-100 pt-6 mt-2 flex flex-col gap-4">
                  {user ? (
                    <>
                      <Link href="/account" onClick={closeMobileMenu} className="text-xs font-bold text-neutral-600 uppercase tracking-[0.2em]">
                        My Account
                      </Link>
                      <button 
                        onClick={handleSignOut} 
                        className="text-xs font-bold text-neutral-400 hover:text-red-500 uppercase tracking-[0.2em] text-left flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <Link href="/login" onClick={closeMobileMenu} className="text-xs font-bold text-black uppercase tracking-[0.2em]">
                      Sign In
                    </Link>
                  )}
                </div>
              </div>

              {/* Mobile Drawer Bottom Info */}
              <div className="mt-auto p-5 border-t border-neutral-100 bg-neutral-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => { closeMobileMenu(); openSearch(); }} className="p-1">
                      <Search className="w-4 h-4 text-neutral-500" />
                    </button>
                    <Link href="/account?tab=wishlist" onClick={closeMobileMenu} className="p-1">
                      <Heart className="w-4 h-4 text-neutral-500" />
                    </Link>
                  </div>
                  <span className="text-[10px] font-bold text-black font-sans uppercase tracking-wider">
                    INR ₹
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}