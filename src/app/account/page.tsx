'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  User,
  Package,
  MapPin,
  Heart,
  Settings,
  LogOut,
  ShoppingBag,
  Loader2,
  Trash2,
  Clock,
  Truck,
  FileText,
  ChevronRight,
  Undo2,
  Eye,
  EyeOff,
  Plus,
  X,
  MapPinned,
  Edit3,
  Check,
} from 'lucide-react';
import { useWishlistStore } from '@/lib/store/wishlist';
import { useCartStore } from '@/lib/store/cart';
import { useUser } from '@/hooks/use-user';
import { AuthorLoader } from '@/components/ui/AuthorLoader';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { getPrimaryProductImage } from '@/lib/shop/media-helpers';

type AccountTab = 'profile' | 'orders' | 'addresses' | 'wishlist' | 'settings';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

// ─── Indian States list ──────────────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// ─── Address form type ───────────────────────────────────────────────────────
interface AddressFormData {
  id?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
  label: string;
}

const emptyAddressForm: AddressFormData = {
  fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', isDefault: false, label: 'Home',
};

// ─── Address type from API ───────────────────────────────────────────────────
interface AddressData {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
  label: string;
  country: string;
}

// ─── Order status stage mapping ──────────────────────────────────────────────
function getOrderStage(status: string): number {
  const s = status.toUpperCase();
  if (['PENDING', 'CONFIRMED', 'PACKED'].includes(s)) return 1;
  if (['SHIPPED', 'OUT_FOR_DELIVERY'].includes(s)) return 2;
  if (s === 'DELIVERED') return 3;
  return 0; // CANCELLED / REFUNDED
}

/** Resolve display image for an order item — snapshot first, then product fallback */
function resolveItemDisplayImage(item: any): string | null {
  if (item.imageUrl) return item.imageUrl;

  const images = item.product?.images;
  if (!images || images.length === 0) return null;

  const itemColor = item.color || item.variant?.color;
  if (itemColor) {
    const colorMatch = images.find(
      (img: any) => img.color && img.color.toLowerCase() === itemColor.toLowerCase()
    );
    if (colorMatch) return colorMatch.url;
  }

  const primary = images.find((img: any) => img.isPrimary);
  if (primary) return primary.url;

  return getPrimaryProductImage(images) || images[0]?.url || null;
}

// ─── Sidebar nav item config ─────────────────────────────────────────────────
const tabs = [
  { id: 'profile' as AccountTab, label: 'Profile', icon: User },
  { id: 'orders' as AccountTab, label: 'Orders', icon: Package },
  { id: 'addresses' as AccountTab, label: 'Addresses', icon: MapPin },
  { id: 'wishlist' as AccountTab, label: 'Wishlist', icon: Heart },
  { id: 'settings' as AccountTab, label: 'Settings', icon: Settings },
];

export default function AccountPage() {
  const { user, loading, signOut, refreshUser } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlistStore();
  const addToCart = useCartStore((state) => state.addItem);

  // Read ?tab= from URL on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'orders', 'addresses', 'wishlist', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam as AccountTab);
    }
  }, [searchParams]);

  // Scroll to top on every tab change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profileName, setProfileName] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    if (user) {
      const n = user.user_metadata?.name || user.user_metadata?.full_name || '';
      setProfileName(n);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user || !profileName.trim()) return;
    const previousName = user.user_metadata?.name || user.user_metadata?.full_name || '';
    setSaveStatus('saving');

    try {
      // 1. Update Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: profileName.trim(), name: profileName.trim() },
      });
      if (authError) throw authError;

      // 2. Update the User table in the database
      try {
        await fetch('/api/auth/update-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: profileName.trim() }),
        });
      } catch {
        // DB update failure is non-critical — auth metadata is source of truth
      }

      // 3. Refresh auth context → sidebar "LOGGED IN AS" updates
      await refreshUser();

      // 4. Show success state
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      // Revert on failure
      setProfileName(previousName);
      setSaveStatus('error');
      toast.error('Failed to update name');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // ── Password change state ─────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // ── Orders state ──────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [failedOrderId, setFailedOrderId] = useState<string | null>(null);
  const [isFilingReturn, setIsFilingReturn] = useState(false);
  const [returnReason, setReturnReason] = useState("Size misfit");
  const [returnNote, setReturnNote] = useState("");
  const [returnItems, setReturnItems] = useState<Record<string, { checked: boolean; quantity: number }>>({});

  // ── Addresses state ───────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>(emptyAddressForm);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [addressFormErrors, setAddressFormErrors] = useState<Record<string, string>>({});

  const mapsEnabled = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Fetch orders
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      fetchOrders();
    } else {
      setSelectedOrder(null);
      setIsFilingReturn(false);
    }
  }, [activeTab]);

  // Fetch addresses
  useEffect(() => {
    if (activeTab === 'addresses' && user) {
      fetchAddresses();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const res = await fetch('/api/orders');
      console.log('[ORDERS] Response status:', res.status);

      // Auth failure — user not authenticated on server side
      if (res.status === 401) {
        console.warn('[ORDERS] Unauthorized — session may have expired');
        // Show empty state rather than error (user might just need to re-login)
        setOrders([]);
        return;
      }

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('[ORDERS] Server error:', res.status, errorBody);
        setOrdersError('We couldn\'t load your orders.');
        return;
      }

      const json = await res.json();
      console.log('[ORDERS] Response:', { success: json.success, count: json.data?.length });

      if (json.success) {
        setOrders(json.data || []);
      } else {
        // API returned an error object
        console.error('[ORDERS] API error:', json.message || json.code);
        setOrdersError('We couldn\'t load your orders.');
      }
    } catch (err) {
      console.error('[ORDERS] Fetch error:', err);
      setOrdersError('We couldn\'t load your orders.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchOrderDetail = async (orderId: string) => {
    setLoadingOrderDetail(true);
    setDetailError(null);
    setFailedOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(json.data);
        setFailedOrderId(null);
        const initialReturnState: Record<string, { checked: boolean; quantity: number }> = {};
        json.data.items.forEach((item: any) => {
          initialReturnState[item.id] = { checked: false, quantity: 1 };
        });
        setReturnItems(initialReturnState);
      } else {
        setDetailError('Unable to load order details. Please retry.');
      }
    } catch {
      setDetailError('Unable to load order details. Please retry.');
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await fetch('/api/addresses');
      console.log('[ADDRESSES] Response status:', res.status);

      if (res.status === 401) {
        console.warn('[ADDRESSES] Unauthorized — session may have expired');
        setAddresses([]);
        return;
      }

      if (!res.ok) {
        console.error('[ADDRESSES] Server error:', res.status);
        toast.error('Failed to load addresses');
        return;
      }

      const json = await res.json();
      console.log('[ADDRESSES] Response:', { success: json.success, count: json.data?.length });

      if (json.success) {
        const uniqueAddresses: any[] = [];
        const normalizeStr = (s: string | null | undefined) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
        const normalizePhoneNum = (s: string | null | undefined) => (s || '').replace(/\s+/g, '');

        const isDuplicateAddress = (addr1: any, addr2: any) => {
          return (
            normalizeStr(addr1.fullName) === normalizeStr(addr2.fullName) &&
            normalizePhoneNum(addr1.phone) === normalizePhoneNum(addr2.phone) &&
            normalizeStr(addr1.line1) === normalizeStr(addr2.line1) &&
            normalizeStr(addr1.line2) === normalizeStr(addr2.line2) &&
            normalizeStr(addr1.city) === normalizeStr(addr2.city) &&
            normalizeStr(addr1.state) === normalizeStr(addr2.state) &&
            normalizePhoneNum(addr1.postalCode) === normalizePhoneNum(addr2.postalCode) &&
            normalizeStr(addr1.country || 'India') === normalizeStr(addr2.country || 'India')
          );
        };

        (json.data || []).forEach((addr: any) => {
          if (!uniqueAddresses.some(u => isDuplicateAddress(u, addr))) {
            uniqueAddresses.push(addr);
          }
        });

        setAddresses(uniqueAddresses);
      } else {
        console.error('[ADDRESSES] API error:', json.message || json.code);
      }
    } catch (err) {
      console.error('[ADDRESSES] Fetch error:', err);
      toast.error('Failed to load addresses');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleFileReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const itemsToReturn = Object.entries(returnItems)
      .filter(([_, value]) => value.checked)
      .map(([itemId, value]) => ({
        orderItemId: itemId,
        quantity: value.quantity,
      }));

    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          reason: returnReason,
          note: returnNote,
          items: itemsToReturn,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsFilingReturn(false);
        fetchOrderDetail(selectedOrder.id);
      } else {
        throw new Error(json.message || "Failed to file return request");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
      } else {
        setNewPassword('');
      }
    } catch {
      toast.error('Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ── Address handlers ──────────────────────────────────────────────────────
  const validateAddressForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!addressForm.fullName.trim()) errors.fullName = 'Name is required';
    if (!addressForm.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(addressForm.phone.trim())) errors.phone = 'Enter 10-digit number';
    if (!addressForm.line1.trim()) errors.line1 = 'Address is required';
    if (!addressForm.city.trim()) errors.city = 'City is required';
    if (!addressForm.state) errors.state = 'State is required';
    if (!addressForm.postalCode.trim()) errors.postalCode = 'PIN code is required';
    else if (!/^\d{6}$/.test(addressForm.postalCode.trim())) errors.postalCode = 'Enter 6-digit PIN';
    setAddressFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = async () => {
    if (!validateAddressForm()) return;
    setSavingAddress(true);
    try {
      const isEdit = !!editingAddressId;
      const payload = {
        ...(isEdit ? { id: editingAddressId } : {}),
        label: addressForm.label || 'Home',
        fullName: addressForm.fullName,
        phone: addressForm.phone,
        line1: addressForm.line1,
        line2: addressForm.line2 || null,
        city: addressForm.city,
        state: addressForm.state,
        postalCode: addressForm.postalCode,
        isDefault: addressForm.isDefault,
      };

      console.log('[ADDRESS] Saving payload:', payload);

      const res = await fetch('/api/addresses', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('[ADDRESS] Response status:', res.status);

      if (res.status === 401) {
        toast.error('Session expired. Please sign in again.');
        return;
      }

      const json = await res.json();
      console.log('[ADDRESS] Response body:', json);

      if (json.success) {
        // Optimistic: add/update in list
        if (isEdit) {
          setAddresses(prev => prev.map(a => a.id === editingAddressId ? json.data : a));
        } else {
          setAddresses(prev => [...prev, json.data]);
        }
        // If set as default, unset others locally
        if (json.data.isDefault) {
          setAddresses(prev => prev.map(a => a.id === json.data.id ? a : { ...a, isDefault: false }));
        }
        setShowAddressForm(false);
        setEditingAddressId(null);
        setAddressForm(emptyAddressForm);
        setAddressFormErrors({});
      } else {
        console.error('[ADDRESS] Save failed:', json.message || json.code);
        toast.error(json.message || 'Failed to save address');
      }
    } catch (err) {
      console.error('[ADDRESS] Save error:', err);
      toast.error('Failed to save address. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setDeletingAddressId(id);
    // Optimistic removal
    const prev = [...addresses];
    setAddresses(a => a.filter(addr => addr.id !== id));
    try {
      const res = await fetch('/api/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!json.success) {
        setAddresses(prev); // revert
        toast.error('Failed to delete address');
      }
    } catch {
      setAddresses(prev); // revert
      toast.error('Failed to delete address');
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const res = await fetch('/api/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      });
      const json = await res.json();
      if (json.success) {
        setAddresses(prev => prev.map(a => a.id === id ? { ...a, isDefault: true } : { ...a, isDefault: false }));
      } else {
        toast.error(json.message || 'Failed to update default address');
      }
    } catch {
      toast.error('Failed to update default address');
    }
  };

  const handleEditAddress = (addr: AddressData) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      id: addr.id,
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
      label: addr.label,
    });
    setShowAddressForm(true);
    setAddressFormErrors({});
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          if (data.results && data.results[0]) {
            const components = data.results[0].address_components;
            let line1 = '';
            let city = '';
            let state = '';
            let pincode = '';

            components.forEach((comp: any) => {
              if (comp.types.includes('street_number') || comp.types.includes('route') || comp.types.includes('sublocality_level_1') || comp.types.includes('sublocality')) {
                line1 += (line1 ? ', ' : '') + comp.long_name;
              }
              if (comp.types.includes('locality')) {
                city = comp.long_name;
              }
              if (comp.types.includes('administrative_area_level_1')) {
                state = comp.long_name;
              }
              if (comp.types.includes('postal_code')) {
                pincode = comp.long_name;
              }
            });

            setAddressForm(prev => ({
              ...prev,
              line1: line1 || prev.line1,
              city: city || prev.city,
              state: state || prev.state,
              postalCode: pincode || prev.postalCode,
            }));
          }
        } catch {
          toast.error('Failed to fetch location details');
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        toast.error('Location access denied');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (loading) {
    return <AuthorLoader fullscreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ background: '#0A0A0A' }}>
        <div className="text-center">
          <p className="mb-6 text-sm" style={{ color: '#888' }}>Please sign in to access your account</p>
          <Link href="/login" style={{
            display: 'inline-block',
            background: 'transparent',
            border: '1px solid #C8956C',
            color: '#C8956C',
            padding: '12px 32px',
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontFamily: 'inherit',
            transition: 'all 0.25s ease',
          }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email;
  const userEmail = user.email;
  const userImage = user.user_metadata?.avatar_url;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Account Page: Luxury Editorial Dark ─────────────────── */
        .acc-root {
          min-height: 100vh;
          padding-top: 88px;
          background: #0A0A0A;
          color: #F5F0E8;
        }
        .acc-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 48px 24px 64px;
        }

        /* ── Welcome Header ───────────────────────────────────────── */
        .acc-header-label {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #B8A07A;
          display: block;
          margin-bottom: 10px;
          font-family: var(--font-jost), 'Jost', sans-serif;
        }
        .acc-header-email {
          font-size: clamp(20px, 3.5vw, 28px);
          font-weight: 300;
          color: #F5F0E8;
          letter-spacing: 0.02em;
          line-height: 1.2;
          margin: 0;
          font-family: var(--font-jost), 'Jost', sans-serif;
        }

        /* ── Layout ────────────────────────────────────────────────── */
        .acc-layout {
          display: flex;
          gap: 40px;
          margin-top: 48px;
          align-items: flex-start;
        }

        /* ── Sidebar ───────────────────────────────────────────────── */
        .acc-sidebar {
          width: 220px;
          flex-shrink: 0;
        }
        .acc-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .acc-nav-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          background: transparent;
          border: 1px solid #2A2A2A;
          border-left: 3px solid transparent;
          border-radius: 2px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: background 0.18s ease, border-left-color 0.18s ease;
          color: #888;
          text-decoration: none;
        }
        .acc-nav-card:hover {
          background: #161616;
          color: #F5F0E8;
        }
        .acc-nav-card.active {
          background: #141414;
          border-left-color: #C8956C;
          color: #F5F0E8;
        }
        .acc-nav-label {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-family: var(--font-jost), 'Jost', sans-serif;
          font-weight: 500;
        }
        .acc-nav-icon {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
        }
        .acc-nav-badge {
          margin-left: auto;
          font-size: 9px;
          font-weight: 700;
          background: #C8956C;
          color: #0A0A0A;
          padding: 2px 6px;
          letter-spacing: 0;
          border-radius: 1px;
        }
        .acc-nav-separator {
          height: 1px;
          background: #1E1E1E;
          margin: 8px 0;
        }
        .acc-nav-card.signout {
          color: #8B2020;
        }
        .acc-nav-card.signout:hover {
          background: #160D0D;
          color: #c0342a;
        }

        /* ── Content Area ──────────────────────────────────────────── */
        .acc-content {
          flex: 1;
          min-width: 0;
        }
        .acc-section-label {
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #B8A07A;
          font-family: var(--font-jost), 'Jost', sans-serif;
          display: block;
          margin-bottom: 28px;
        }

        /* ── Dark Cards ────────────────────────────────────────────── */
        .acc-card {
          background: #111111;
          border: 1px solid #222;
          border-radius: 2px;
          padding: 28px 28px;
        }
        .acc-card + .acc-card {
          margin-top: 16px;
        }
        .acc-card-title {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #F5F0E8;
          font-family: var(--font-jost), 'Jost', sans-serif;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid #1E1E1E;
        }

        /* ── Inputs ────────────────────────────────────────────────── */
        .acc-input {
          width: 100%;
          background: #0D0D0D;
          border: 1px solid #333;
          border-radius: 2px;
          padding: 13px 16px;
          color: #F5F0E8;
          font-size: 14px;
          font-family: var(--font-jost), 'Jost', sans-serif;
          outline: none;
          transition: border-color 0.18s;
          box-sizing: border-box;
        }
        .acc-input::placeholder {
          color: #555;
        }
        .acc-input:focus {
          border-color: #555;
        }
        .acc-input:disabled {
          color: #555;
          cursor: not-allowed;
        }
        .acc-input-wrap {
          position: relative;
        }
        .acc-input-wrap .acc-input {
          padding-right: 44px;
        }
        .acc-input-eye {
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
        .acc-input-eye:hover {
          color: #F5F0E8;
        }
        .acc-label {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #888;
          font-family: var(--font-jost), 'Jost', sans-serif;
          display: block;
          margin-bottom: 8px;
        }
        .acc-field {
          margin-bottom: 16px;
        }
        .acc-field-error {
          font-size: 11px;
          color: #CF4444;
          margin-top: 4px;
        }

        /* ── Select dropdown ──────────────────────────────────────── */
        .acc-select {
          width: 100%;
          background: #0D0D0D;
          border: 1px solid #333;
          border-radius: 2px;
          padding: 13px 16px;
          color: #F5F0E8;
          font-size: 14px;
          font-family: var(--font-jost), 'Jost', sans-serif;
          outline: none;
          transition: border-color 0.18s;
          appearance: none;
          box-sizing: border-box;
        }
        .acc-select:focus { border-color: #555; }

        /* ── Buttons ───────────────────────────────────────────────── */
        .acc-btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #C8956C;
          color: #C8956C;
          background: transparent;
          padding: 12px 28px;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-family: var(--font-jost), 'Jost', sans-serif;
          font-weight: 500;
          cursor: pointer;
          border-radius: 0;
          transition: background 0.22s ease, color 0.22s ease;
          text-decoration: none;
        }
        .acc-btn-outline:hover:not(:disabled) {
          background: #C8956C;
          color: #0A0A0A;
        }
        .acc-btn-outline:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .acc-btn-danger {
          display: inline-block;
          border: 1px solid #8B2020;
          color: #8B2020;
          background: transparent;
          padding: 12px 28px;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-family: var(--font-jost), 'Jost', sans-serif;
          font-weight: 500;
          cursor: pointer;
          border-radius: 0;
          transition: background 0.22s ease, color 0.22s ease;
        }
        .acc-btn-danger:hover {
          background: #8B2020;
          color: #F5F0E8;
        }
        .acc-btn-saved {
          border-color: #4CAF50 !important;
          color: #4CAF50 !important;
        }

        /* ── Danger Zone ───────────────────────────────────────────── */
        .acc-card-danger {
          background: #111111;
          border: 1px solid #222;
          border-top: 1px solid #8B2020;
          border-radius: 2px;
          padding: 28px 28px;
          margin-top: 16px;
        }
        .acc-danger-title {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8B2020;
          font-family: var(--font-jost), 'Jost', sans-serif;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .acc-danger-desc {
          font-size: 13px;
          color: #666;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        /* ── Profile Card ──────────────────────────────────────────── */
        .acc-avatar {
          width: 52px;
          height: 52px;
          border-radius: 2px;
          background: #1E1E1E;
          border: 1px solid #2A2A2A;
          color: #C8956C;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
          overflow: hidden;
          flex-shrink: 0;
        }
        .acc-profile-name {
          font-size: 15px;
          font-weight: 500;
          color: #F5F0E8;
        }
        .acc-profile-email {
          font-size: 12px;
          color: #666;
          margin-top: 3px;
        }
        .acc-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        /* ── Orders ────────────────────────────────────────────────── */
        .acc-order-card {
          background: #111;
          border: 1px solid #1E1E1E;
          border-left: 3px solid #B8A07A;
          border-radius: 2px;
          padding: 24px;
          cursor: pointer;
          transition: border-color 0.18s ease;
          margin-bottom: 12px;
        }
        .acc-order-card:hover {
          border-color: #444;
          border-left-color: #C8956C;
        }
        .acc-order-num {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #C8956C;
          font-weight: 600;
        }
        .acc-order-date {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
        }
        .acc-status-pill {
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 1px;
        }
        .acc-status-delivered { background: rgba(74,222,128,0.08); color: #4ade80; border: 1px solid rgba(74,222,128,0.15); }
        .acc-status-cancelled { background: rgba(139,32,32,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.15); }
        .acc-status-default { background: rgba(250,204,21,0.08); color: #facc15; border: 1px solid rgba(250,204,21,0.15); }
        .acc-status-paid { background: rgba(74,222,128,0.08); color: #4ade80; border: 1px solid rgba(74,222,128,0.15); }

        /* ── 3-Stage Order Tracker ─────────────────────────────────── */
        .acc-tracker {
          display: flex;
          align-items: center;
          padding: 16px 0 4px;
        }
        .acc-tracker-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }
        .acc-tracker-dot.completed {
          background: #B8A07A;
        }
        .acc-tracker-dot.active {
          background: #F5F0E8;
          animation: trackerPulse 1.5s ease-in-out infinite;
        }
        .acc-tracker-dot.upcoming {
          background: transparent;
          border: 1px solid #333;
        }
        @keyframes trackerPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245,240,232,0.3); }
          50% { transform: scale(1.3); box-shadow: 0 0 8px 2px rgba(245,240,232,0.15); }
        }
        .acc-tracker-line {
          flex: 1;
          height: 2px;
        }
        .acc-tracker-line.completed {
          background: #B8A07A;
        }
        .acc-tracker-line.upcoming {
          background: #222;
        }
        .acc-tracker-labels {
          display: flex;
          justify-content: space-between;
          padding: 0;
        }
        .acc-tracker-label {
          font-family: var(--font-barlow-condensed, 'Barlow Condensed'), sans-serif;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #666;
          text-align: center;
          flex: 1;
        }
        .acc-tracker-label.active-label {
          color: #F5F0E8;
          font-weight: 600;
        }
        .acc-tracker-label.completed-label {
          color: #B8A07A;
        }
        .acc-tracker-label:first-child { text-align: left; }
        .acc-tracker-label:last-child { text-align: right; }

        /* ── Address Cards ─────────────────────────────────────────── */
        .acc-address-card {
          background: #111;
          border: 1px solid #1E1E1E;
          border-radius: 2px;
          padding: 20px;
          margin-bottom: 12px;
        }
        .acc-address-default-badge {
          font-family: var(--font-barlow-condensed, 'Barlow Condensed'), sans-serif;
          font-size: 9px;
          letter-spacing: 0.2em;
          color: #B8A07A;
          border: 1px solid #B8A07A;
          padding: 2px 8px;
          text-transform: uppercase;
          font-weight: 600;
        }

        /* ── Addresses / Empty States ──────────────────────────────── */
        .acc-empty {
          background: #111;
          border: 1px solid #222;
          border-radius: 2px;
          padding: 72px 24px;
          text-align: center;
        }
        .acc-empty-icon {
          width: 44px;
          height: 44px;
          color: #333;
          margin: 0 auto 20px;
        }
        .acc-empty-title {
          font-size: 14px;
          font-weight: 500;
          color: #F5F0E8;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .acc-empty-sub {
          font-size: 12px;
          color: #555;
          margin-bottom: 28px;
        }

        /* ── Wishlist Grid ─────────────────────────────────────────── */
        .acc-wishlist-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        /* ── Tracking Banner ───────────────────────────────────────── */
        .acc-tracking-banner {
          background: rgba(200,149,108,0.06);
          border: 1px solid rgba(200,149,108,0.18);
          border-radius: 2px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #C8956C;
          margin-bottom: 20px;
        }

        /* ── Order Detail Grid ─────────────────────────────────────── */
        .acc-detail-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 20px;
        }
        .acc-detail-card {
          background: #111;
          border: 1px solid #222;
          border-radius: 2px;
          padding: 22px;
        }
        .acc-detail-section-head {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #C8956C;
          font-weight: 600;
          padding-bottom: 12px;
          border-bottom: 1px solid #1A1A1A;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ── Timeline ──────────────────────────────────────────────── */
        .acc-timeline {
          border-left: 1px solid #222;
          padding-left: 18px;
          margin-left: 6px;
        }
        .acc-timeline-dot {
          position: absolute;
          left: -24px;
          top: 2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0A0A0A;
          border: 2px solid #C8956C;
        }
        .acc-timeline-item {
          position: relative;
          padding-bottom: 16px;
        }

        /* ── Return Form ───────────────────────────────────────────── */
        .acc-return-form {
          background: #0D0D0D;
          border: 1px solid rgba(200,149,108,0.2);
          border-radius: 2px;
          padding: 24px;
          margin-top: 16px;
        }

        /* ── Checkbox ──────────────────────────────────────────────── */
        .acc-checkbox-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .acc-checkbox-wrap input[type="checkbox"] {
          accent-color: #C8956C;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        /* ── Address Form Overlay ──────────────────────────────────── */
        .acc-address-form-card {
          background: #111;
          border: 1px solid #1E1E1E;
          border-radius: 2px;
          padding: 28px;
          margin-bottom: 20px;
        }

        /* ── Mobile: bottom tab bar ────────────────────────────────── */
        @media (max-width: 767px) {
          .acc-inner { padding: 28px 16px 100px; }
          .acc-layout { flex-direction: column; margin-top: 28px; gap: 0; }
          .acc-sidebar { display: none; }
          .acc-content { width: 100%; }
          .acc-mobile-tabs {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: #0F0F0F;
            border-top: 1px solid #222;
            display: flex;
            z-index: 50;
            padding-bottom: env(safe-area-inset-bottom);
          }
          .acc-mobile-tab {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 10px 4px;
            border: none;
            background: none;
            cursor: pointer;
            color: #555;
            transition: color 0.15s;
            border-top: 2px solid transparent;
          }
          .acc-mobile-tab.active {
            color: #C8956C;
            border-top-color: #C8956C;
          }
          .acc-mobile-tab-label {
            font-size: 8px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          .acc-wishlist-grid { grid-template-columns: repeat(2, 1fr); }
          .acc-detail-grid { grid-template-columns: 1fr; }
          .acc-grid-2 { grid-template-columns: 1fr; }
        }
        @media (min-width: 768px) {
          .acc-mobile-tabs { display: none; }
        }
      `}} />

      <div className="acc-root">
        <div className="acc-inner">
          {/* ── Welcome Header ───────────────────────────────────── */}
          <div>
            <span className="acc-header-label">My Account</span>
            <h1 className="acc-header-email">{userName as string}</h1>
          </div>

          <div className="acc-layout">
            {/* ── Sidebar ─────────────────────────────────────────── */}
            <aside className="acc-sidebar">
              <nav className="acc-nav">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); window.scrollTo(0, 0); }}
                    className={`acc-nav-card${activeTab === tab.id ? ' active' : ''}`}
                    id={`acc-nav-${tab.id}`}
                  >
                    <tab.icon className="acc-nav-icon" strokeWidth={1.5} />
                    <span className="acc-nav-label">{tab.label}</span>
                    {tab.id === 'wishlist' && wishlistItems.length > 0 && (
                      <span className="acc-nav-badge">{wishlistItems.length}</span>
                    )}
                  </button>
                ))}
                <div className="acc-nav-separator" />
                <button
                  onClick={handleSignOut}
                  className="acc-nav-card signout"
                  id="acc-nav-signout"
                >
                  <LogOut className="acc-nav-icon" strokeWidth={1.5} />
                  <span className="acc-nav-label">Sign Out</span>
                </button>
              </nav>
            </aside>

            {/* ── Content ─────────────────────────────────────────── */}
            <div className="acc-content">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >

                {/* ══════════════════════════════════════════════════ */}
                {/* ── Profile Tab ─────────────────────────────────── */}
                {/* ══════════════════════════════════════════════════ */}
                {activeTab === 'profile' && (
                  <div>
                    <span className="acc-section-label">Profile Information</span>
                    <div className="acc-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div className="acc-avatar">
                          {userImage
                            ? <img src={userImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontFamily: 'var(--font-jost)' }}>{(profileName)?.[0]?.toUpperCase() || 'A'}</span>
                          }
                        </div>
                        <div>
                          <p className="acc-profile-name">{profileName || userName as string}</p>
                          <p className="acc-profile-email">{userEmail}</p>
                        </div>
                      </div>

                      <div className="acc-grid-2">
                        <div className="acc-field">
                          <label className="acc-label">Name</label>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="acc-input"
                            placeholder="Your full name"
                          />
                        </div>
                        <div className="acc-field">
                          <label className="acc-label">Email</label>
                          <input
                            type="email"
                            defaultValue={userEmail || ''}
                            disabled
                            className="acc-input"
                          />
                        </div>
                      </div>

                      <button
                        className={`acc-btn-outline ${saveStatus === 'saved' ? 'acc-btn-saved' : ''}`}
                        style={{ marginTop: '8px' }}
                        onClick={handleSaveProfile}
                        disabled={saveStatus === 'saving' || !profileName.trim()}
                      >
                        {saveStatus === 'saving' && (
                          <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />
                        )}
                        {saveStatus === 'saved' && (
                          <Check style={{ width: '14px', height: '14px' }} />
                        )}
                        {saveStatus === 'idle' && 'Save Changes'}
                        {saveStatus === 'saving' && 'Saving...'}
                        {saveStatus === 'saved' && 'Saved'}
                        {saveStatus === 'error' && 'Failed — Retry'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════ */}
                {/* ── Orders Tab ──────────────────────────────────── */}
                {/* ══════════════════════════════════════════════════ */}
                {activeTab === 'orders' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <span className="acc-section-label" style={{ marginBottom: 0 }}>
                        {selectedOrder ? 'Order Detail' : 'Order History'}
                      </span>
                      {selectedOrder && (
                        <button
                          onClick={() => { setSelectedOrder(null); setIsFilingReturn(false); }}
                          style={{ fontSize: '11px', color: '#C8956C', letterSpacing: '0.12em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          ← Back
                        </button>
                      )}
                    </div>

                    {loadingOrders ? (
                      <div style={{ padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <AuthorLoader size={80} />
                        <p style={{ fontSize: '10px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '8px' }}>Loading orders...</p>
                      </div>
                    ) : ordersError ? (
                      <div className="acc-empty" style={{ padding: '80px 24px' }}>
                        <div style={{ width: '60px', height: '1px', background: '#1E1E1E', margin: '0 auto 32px' }} />
                        <h2 style={{
                          fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed'), sans-serif",
                          fontSize: '18px',
                          fontWeight: 600,
                          color: '#F5F0E8',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          margin: '0 0 12px',
                        }}>
                          Something went wrong.
                        </h2>
                        <p style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '12px',
                          color: '#666',
                          fontWeight: 300,
                          lineHeight: 1.6,
                          margin: '0 0 28px',
                        }}>
                          {ordersError}
                        </p>
                        <button onClick={fetchOrders} className="acc-btn-outline">
                          Try Again
                        </button>
                      </div>
                    ) : !selectedOrder ? (
                      orders.length === 0 ? (
                        /* ── ORDERS EMPTY STATE — Editorial ─────────── */
                        <div className="acc-empty" style={{ padding: '80px 24px' }}>
                          <div style={{ width: '60px', height: '1px', background: '#1E1E1E', margin: '0 auto 32px' }} />
                          <h2 style={{
                            fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed'), sans-serif",
                            fontSize: '22px',
                            fontWeight: 600,
                            color: '#F5F0E8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            margin: '0 0 4px',
                          }}>
                            Nothing to show.
                          </h2>
                          <h2 style={{
                            fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed'), sans-serif",
                            fontSize: '22px',
                            fontWeight: 600,
                            color: '#B8A07A',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            margin: '0 0 16px',
                          }}>
                            Yet.
                          </h2>
                          <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '13px',
                            color: '#666',
                            fontWeight: 300,
                            lineHeight: 1.6,
                            margin: '0 0 32px',
                          }}>
                            Your orders will live here<br />
                            once you make your first purchase.
                          </p>
                          <div style={{ width: '60px', height: '1px', background: '#1E1E1E', margin: '0 auto 32px' }} />
                          <Link href="/collections" className="acc-btn-outline">
                            Shop the Collection →
                          </Link>
                        </div>
                      ) : (
                        /* ── ORDER LIST WITH 3-STAGE TRACKER ────────── */
                        <div>
                          {orders.map((order) => {
                            const stage = getOrderStage(order.status);
                            const isCancelled = ['CANCELLED', 'REFUNDED'].includes(order.status);
                            return (
                              <div key={order.id} className="acc-order-card" onClick={() => fetchOrderDetail(order.id)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                  <div>
                                    <p className="acc-order-num">{order.orderNumber}</p>
                                    <p className="acc-order-date">
                                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                    </p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '14px', color: '#F5F0E8', fontWeight: 500 }}>₹{(order.total / 100).toLocaleString()}</p>
                                    {isCancelled && (
                                      <span className="acc-status-pill acc-status-cancelled" style={{ marginTop: '4px', display: 'inline-block' }}>
                                        {order.status}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Items summary */}
                                <div style={{ marginBottom: isCancelled ? '0' : '4px' }}>
                                  {order.items.map((item: any) => (
                                    <div key={item.id} style={{ fontSize: '12px', marginBottom: '2px' }}>
                                      <span style={{ color: '#F5F0E8' }}>{item.productName}</span>
                                      <span style={{ color: '#555' }}> × {item.quantity}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* 3-Stage Tracker — only for non-cancelled */}
                                {!isCancelled && (
                                  <>
                                    <div className="acc-tracker">
                                      <div className={`acc-tracker-dot ${stage >= 1 ? (stage === 1 ? 'active' : 'completed') : 'upcoming'}`} />
                                      <div className={`acc-tracker-line ${stage >= 2 ? 'completed' : 'upcoming'}`} />
                                      <div className={`acc-tracker-dot ${stage >= 2 ? (stage === 2 ? 'active' : 'completed') : 'upcoming'}`} />
                                      <div className={`acc-tracker-line ${stage >= 3 ? 'completed' : 'upcoming'}`} />
                                      <div className={`acc-tracker-dot ${stage >= 3 ? 'completed' : 'upcoming'}`} />
                                    </div>
                                    <div className="acc-tracker-labels">
                                      <span className={`acc-tracker-label ${stage === 1 ? 'active-label' : stage > 1 ? 'completed-label' : ''}`}>Ready to Dispatch</span>
                                      <span className={`acc-tracker-label ${stage === 2 ? 'active-label' : stage > 2 ? 'completed-label' : ''}`}>Out for Delivery</span>
                                      <span className={`acc-tracker-label ${stage === 3 ? 'active-label completed-label' : ''}`}>Delivered</span>
                                    </div>
                                  </>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                  <span style={{ fontSize: '10px', color: '#B8A07A', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                    View Details →
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      /* ── ORDER DETAIL VIEW ────────────────────────── */
                      <div>
                        {loadingOrderDetail ? (
                          <div style={{ padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <AuthorLoader size={80} />
                            <p style={{ fontSize: '10px', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '8px' }}>Loading detail...</p>
                          </div>
                        ) : detailError ? (
                          <div className="acc-empty" style={{ padding: '80px 24px' }}>
                            <div style={{ width: '60px', height: '1px', background: '#1E1E1E', margin: '0 auto 32px' }} />
                            <h2 style={{
                              fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed'), sans-serif",
                              fontSize: '18px',
                              fontWeight: 600,
                              color: '#F5F0E8',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              margin: '0 0 12px',
                            }}>
                              Something went wrong.
                            </h2>
                            <p style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '12px',
                              color: '#666',
                              fontWeight: 300,
                              lineHeight: 1.6,
                              margin: '0 0 28px',
                            }}>
                              {detailError}
                            </p>
                            <button onClick={() => failedOrderId && fetchOrderDetail(failedOrderId)} className="acc-btn-outline">
                              Try Again
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* 3-Stage Tracker in detail view */}
                            {!['CANCELLED', 'REFUNDED'].includes(selectedOrder.status) && (() => {
                              const stage = getOrderStage(selectedOrder.status);
                              return (
                                <div className="acc-card" style={{ marginBottom: '20px' }}>
                                  <div className="acc-tracker">
                                    <div className={`acc-tracker-dot ${stage >= 1 ? (stage === 1 ? 'active' : 'completed') : 'upcoming'}`} />
                                    <div className={`acc-tracker-line ${stage >= 2 ? 'completed' : 'upcoming'}`} />
                                    <div className={`acc-tracker-dot ${stage >= 2 ? (stage === 2 ? 'active' : 'completed') : 'upcoming'}`} />
                                    <div className={`acc-tracker-line ${stage >= 3 ? 'completed' : 'upcoming'}`} />
                                    <div className={`acc-tracker-dot ${stage >= 3 ? 'completed' : 'upcoming'}`} />
                                  </div>
                                  <div className="acc-tracker-labels">
                                    <span className={`acc-tracker-label ${stage === 1 ? 'active-label' : stage > 1 ? 'completed-label' : ''}`}>Ready to Dispatch</span>
                                    <span className={`acc-tracker-label ${stage === 2 ? 'active-label' : stage > 2 ? 'completed-label' : ''}`}>Out for Delivery</span>
                                    <span className={`acc-tracker-label ${stage === 3 ? 'active-label completed-label' : ''}`}>Delivered</span>
                                  </div>
                                </div>
                              );
                            })()}

                            {['CANCELLED', 'REFUNDED'].includes(selectedOrder.status) && (
                              <div style={{ marginBottom: '20px' }}>
                                <span className="acc-status-pill acc-status-cancelled" style={{ fontSize: '11px', padding: '6px 14px' }}>
                                  {selectedOrder.status}
                                </span>
                              </div>
                            )}

                            {selectedOrder.trackingNumber && (
                              <div className="acc-tracking-banner">
                                <Truck style={{ width: '16px', height: '16px', flexShrink: 0 }} strokeWidth={1.5} />
                                <div>
                                  <p style={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Shipped via {selectedOrder.courierName}</p>
                                  <p style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>AWB: <span style={{ fontFamily: 'monospace', color: '#F5F0E8' }}>{selectedOrder.trackingNumber}</span></p>
                                </div>
                              </div>
                            )}

                            <div className="acc-detail-grid">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="acc-detail-card">
                                  <p className="acc-detail-section-head">Items Ordered</p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {selectedOrder.items.map((item: any) => {
                                      const displayImage = resolveItemDisplayImage(item);
                                      return (
                                        <div key={item.id} style={{ display: 'flex', gap: '16px', padding: '16px 0', borderBottom: '1px solid #1A1A1A', fontSize: '12px', alignItems: 'center' }}>
                                          <div style={{ position: 'relative', width: '56px', height: '70px', flexShrink: 0, background: '#0A0A0A', overflow: 'hidden', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            {displayImage ? (
                                              <Image
                                                src={displayImage}
                                                alt={item.productName}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                sizes="56px"
                                              />
                                            ) : (
                                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#555', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                                                No Img
                                              </div>
                                            )}
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F5F0E8', fontWeight: 600, margin: 0 }} className="truncate">{item.productName}</p>
                                            <p style={{ fontSize: '10px', color: '#555', marginTop: '4px', marginBottom: 0 }}>{item.color ? `${item.color}` : ''}{item.size ? ` · Size ${item.size}` : ''}{!item.color && !item.size ? 'Base SKU' : ''}</p>
                                          </div>
                                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <p style={{ color: '#F5F0E8', fontWeight: 500, margin: 0 }}>₹{(item.totalPrice / 100).toLocaleString()}</p>
                                            <p style={{ fontSize: '10px', color: '#555', marginTop: '4px', marginBottom: 0 }}>{item.quantity} × ₹{(item.unitPrice / 100).toLocaleString()}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                      { label: 'Subtotal', val: `₹${(selectedOrder.subtotal / 100).toLocaleString()}` },
                                      selectedOrder.discount > 0 ? { label: 'Discount', val: `-₹${(selectedOrder.discount / 100).toLocaleString()}`, accent: true } : null,
                                      selectedOrder.shippingFee > 0 ? { label: 'Shipping', val: `₹${(selectedOrder.shippingFee / 100).toLocaleString()}` } : null,
                                      selectedOrder.tax > 0 ? { label: 'GST Tax', val: `₹${(selectedOrder.tax / 100).toLocaleString()}` } : null,
                                    ].filter(Boolean).map((row: any) => (
                                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: '#666' }}>{row.label}</span>
                                        <span style={{ color: row.accent ? '#4ade80' : '#888' }}>{row.val}</span>
                                      </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, borderTop: '1px solid #1A1A1A', paddingTop: '12px', marginTop: '4px' }}>
                                      <span style={{ color: '#F5F0E8' }}>Total</span>
                                      <span style={{ color: '#F5F0E8' }}>₹{(selectedOrder.total / 100).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>

                                {selectedOrder.address && (
                                  <div className="acc-detail-card">
                                    <p className="acc-detail-section-head">Delivery Destination</p>
                                    <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.8 }}>
                                      <p style={{ color: '#F5F0E8', fontWeight: 500, marginBottom: '4px' }}>{selectedOrder.address.fullName}</p>
                                      <p>{selectedOrder.address.line1}</p>
                                      {selectedOrder.address.line2 && <p>{selectedOrder.address.line2}</p>}
                                      <p>{selectedOrder.address.city}, {selectedOrder.address.state} — {selectedOrder.address.postalCode}</p>
                                      <p>{selectedOrder.address.country}</p>
                                      <p style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '11px' }}>Contact: {selectedOrder.address.phone}</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="acc-detail-card">
                                  <p className="acc-detail-section-head">Order Actions</p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <a
                                      href={`/api/orders/${selectedOrder.id}/invoice`}
                                      target="_blank"
                                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 0', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.03)', border: '1px solid #2A2A2A', color: '#F5F0E8', textDecoration: 'none', transition: 'background 0.15s', borderRadius: '1px' }}
                                    >
                                      <FileText style={{ width: '14px', height: '14px' }} strokeWidth={1.5} />
                                      Download Invoice
                                    </a>
                                    {selectedOrder.status === 'DELIVERED' &&
                                      (!selectedOrder.returnRequests || selectedOrder.returnRequests.length === 0) &&
                                      Math.floor((Date.now() - new Date(selectedOrder.createdAt).getTime()) / 86400000) <= 7 && (
                                        <button
                                          onClick={() => setIsFilingReturn(!isFilingReturn)}
                                          className="acc-btn-outline"
                                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                          <Undo2 style={{ width: '14px', height: '14px' }} strokeWidth={1.5} />
                                          {isFilingReturn ? 'Cancel' : 'Request Return'}
                                        </button>
                                      )}
                                  </div>
                                </div>

                                <div className="acc-detail-card">
                                  <p className="acc-detail-section-head"><Clock style={{ width: '12px', height: '12px' }} strokeWidth={1.5} />Status History</p>
                                  <div className="acc-timeline">
                                    {selectedOrder.statusHistory?.map((history: any) => (
                                      <div key={history.id} className="acc-timeline-item">
                                        <span className="acc-timeline-dot" />
                                        <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F5F0E8', fontWeight: 600 }}>{history.status}</p>
                                        <p style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>
                                          {new Date(history.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {selectedOrder.returnRequests && selectedOrder.returnRequests.length > 0 && (
                                  <div className="acc-detail-card">
                                    <p className="acc-detail-section-head">Return Request</p>
                                    {selectedOrder.returnRequests.map((req: any) => (
                                      <div key={req.id} style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {[
                                          { label: 'Status', val: req.status },
                                          { label: 'Reason', val: req.reason },
                                          req.refundAmount ? { label: 'Refund', val: formatPrice(req.refundAmount) } : null,
                                        ].filter(Boolean).map((row: any) => (
                                          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#555' }}>{row.label}</span>
                                            <span style={{ color: '#F5F0E8', fontWeight: 500 }}>{row.val}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {isFilingReturn && (
                              <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                onSubmit={handleFileReturnSubmit}
                                className="acc-return-form"
                                style={{ marginTop: '16px' }}
                              >
                                <p style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8956C', marginBottom: '16px', fontWeight: 600 }}>File Return Request</p>
                                <p style={{ fontSize: '10px', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Select items to return:</p>
                                <div style={{ borderBottom: '1px solid #1A1A1A', marginBottom: '16px' }}>
                                  {selectedOrder.items.map((item: any) => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #1A1A1A' }}>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                        <input
                                          type="checkbox"
                                          checked={returnItems[item.id]?.checked || false}
                                          onChange={(e) => setReturnItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], checked: e.target.checked } }))}
                                          style={{ accentColor: '#C8956C', width: '14px', height: '14px' }}
                                        />
                                        <div>
                                          <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F5F0E8', fontWeight: 600 }}>{item.productName}</p>
                                          <p style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>Size: {item.size || 'Base'} | Color: {item.color || 'Base'}</p>
                                        </div>
                                      </label>
                                      {returnItems[item.id]?.checked && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{ fontSize: '10px', color: '#666' }}>Qty:</span>
                                          <select
                                            value={returnItems[item.id]?.quantity || 1}
                                            onChange={(e) => setReturnItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], quantity: parseInt(e.target.value) } }))}
                                            style={{ background: '#0A0A0A', border: '1px solid #333', padding: '4px 8px', color: '#F5F0E8', fontSize: '12px', outline: 'none', borderRadius: '1px' }}
                                          >
                                            {[...Array(item.quantity)].map((_, i) => (
                                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="acc-grid-2" style={{ marginBottom: '16px' }}>
                                  <div className="acc-field">
                                    <label className="acc-label">Reason for Return *</label>
                                    <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="acc-input">
                                      <option value="Size misfit">Size misfit</option>
                                      <option value="Color not as expected">Color not as expected</option>
                                      <option value="Damaged product">Damaged product</option>
                                      <option value="Item incorrect">Item incorrect</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                  <div className="acc-field">
                                    <label className="acc-label">Additional Notes</label>
                                    <input type="text" value={returnNote} onChange={(e) => setReturnNote(e.target.value)} placeholder="Explain the issue..." className="acc-input" />
                                  </div>
                                </div>
                                <button type="submit" className="acc-btn-outline" style={{ width: '100%' }}>Submit Return Request</button>
                              </motion.form>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════ */}
                {/* ── Addresses Tab ───────────────────────────────── */}
                {/* ══════════════════════════════════════════════════ */}
                {activeTab === 'addresses' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <span className="acc-section-label" style={{ marginBottom: 0 }}>Saved Addresses</span>
                      {!showAddressForm && (
                        <button
                          className="acc-btn-outline"
                          style={{ padding: '8px 18px', fontSize: '10px' }}
                          onClick={() => {
                            setAddressForm(emptyAddressForm);
                            setEditingAddressId(null);
                            setShowAddressForm(true);
                            setAddressFormErrors({});
                          }}
                        >
                          <Plus style={{ width: '12px', height: '12px' }} /> Add New
                        </button>
                      )}
                    </div>

                    {/* ── Address Form ──────────────────────────────── */}
                    <AnimatePresence>
                      {showAddressForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="acc-address-form-card"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <p style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8956C', fontWeight: 600 }}>
                              {editingAddressId ? 'Edit Address' : 'Add New Address'}
                            </p>
                            <button onClick={() => { setShowAddressForm(false); setEditingAddressId(null); setAddressFormErrors({}); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                              <X style={{ width: '18px', height: '18px' }} />
                            </button>
                          </div>

                          {/* Location button — only if Google Maps key is configured */}
                          {mapsEnabled && (
                            <button
                              type="button"
                              onClick={handleUseCurrentLocation}
                              disabled={geoLoading}
                              className="acc-btn-outline"
                              style={{ width: '100%', marginBottom: '20px', padding: '10px', fontSize: '10px' }}
                            >
                              {geoLoading ? (
                                <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />
                              ) : (
                                <MapPinned style={{ width: '14px', height: '14px' }} />
                              )}
                              {geoLoading ? 'Fetching location...' : '📍 Use current location'}
                            </button>
                          )}

                          <div className="acc-grid-2">
                            <div className="acc-field">
                              <label className="acc-label">Full Name *</label>
                              <input
                                type="text"
                                value={addressForm.fullName}
                                onChange={(e) => setAddressForm(p => ({ ...p, fullName: e.target.value }))}
                                className="acc-input"
                                placeholder="Ram Sharma"
                              />
                              {addressFormErrors.fullName && <p className="acc-field-error">{addressFormErrors.fullName}</p>}
                            </div>
                            <div className="acc-field">
                              <label className="acc-label">Phone Number *</label>
                              <input
                                type="tel"
                                value={addressForm.phone}
                                onChange={(e) => setAddressForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                className="acc-input"
                                placeholder="9876543210"
                                maxLength={10}
                              />
                              {addressFormErrors.phone && <p className="acc-field-error">{addressFormErrors.phone}</p>}
                            </div>
                          </div>

                          <div className="acc-field">
                            <label className="acc-label">Address Line 1 *</label>
                            <input
                              type="text"
                              value={addressForm.line1}
                              onChange={(e) => setAddressForm(p => ({ ...p, line1: e.target.value }))}
                              className="acc-input"
                              placeholder="Building, House, Street"
                            />
                            {addressFormErrors.line1 && <p className="acc-field-error">{addressFormErrors.line1}</p>}
                          </div>

                          <div className="acc-field">
                            <label className="acc-label">Address Line 2 <span style={{ color: '#555', fontWeight: 300 }}>(Optional)</span></label>
                            <input
                              type="text"
                              value={addressForm.line2}
                              onChange={(e) => setAddressForm(p => ({ ...p, line2: e.target.value }))}
                              className="acc-input"
                              placeholder="Landmark, Area"
                            />
                          </div>

                          <div className="acc-grid-2">
                            <div className="acc-field">
                              <label className="acc-label">City *</label>
                              <input
                                type="text"
                                value={addressForm.city}
                                onChange={(e) => setAddressForm(p => ({ ...p, city: e.target.value }))}
                                className="acc-input"
                                placeholder="Mumbai"
                              />
                              {addressFormErrors.city && <p className="acc-field-error">{addressFormErrors.city}</p>}
                            </div>
                            <div className="acc-field">
                              <label className="acc-label">State *</label>
                              <select
                                value={addressForm.state}
                                onChange={(e) => setAddressForm(p => ({ ...p, state: e.target.value }))}
                                className="acc-select"
                              >
                                <option value="">Select State</option>
                                {INDIAN_STATES.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              {addressFormErrors.state && <p className="acc-field-error">{addressFormErrors.state}</p>}
                            </div>
                          </div>

                          <div className="acc-grid-2">
                            <div className="acc-field">
                              <label className="acc-label">PIN Code *</label>
                              <input
                                type="text"
                                value={addressForm.postalCode}
                                onChange={(e) => setAddressForm(p => ({ ...p, postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                className="acc-input"
                                placeholder="400053"
                                maxLength={6}
                              />
                              {addressFormErrors.postalCode && <p className="acc-field-error">{addressFormErrors.postalCode}</p>}
                            </div>
                            <div className="acc-field" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '16px' }}>
                              <label className="acc-checkbox-wrap">
                                <input
                                  type="checkbox"
                                  checked={addressForm.isDefault}
                                  onChange={(e) => setAddressForm(p => ({ ...p, isDefault: e.target.checked }))}
                                />
                                <span style={{ fontSize: '12px', color: '#888' }}>Set as default address</span>
                              </label>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button
                              type="button"
                              onClick={handleSaveAddress}
                              disabled={savingAddress}
                              className="acc-btn-outline"
                            >
                              {savingAddress ? (
                                <><Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> Saving...</>
                              ) : editingAddressId ? 'Update Address' : 'Save Address'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowAddressForm(false); setEditingAddressId(null); setAddressFormErrors({}); }}
                              style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '12px 24px', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── Address List ──────────────────────────────── */}
                    {loadingAddresses ? (
                      <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center' }}>
                        <AuthorLoader size={60} />
                      </div>
                    ) : addresses.length === 0 && !showAddressForm ? (
                      <div className="acc-empty">
                        <MapPin className="acc-empty-icon" strokeWidth={1.2} />
                        <p className="acc-empty-title">No addresses saved</p>
                        <p className="acc-empty-sub">Save your shipping addresses for a seamless checkout flow.</p>
                      </div>
                    ) : (
                      <div>
                        {addresses.map((addr) => (
                          <div key={addr.id} className="acc-address-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5F0E8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {addr.fullName}
                              </p>
                              {addr.isDefault && (
                                <span className="acc-address-default-badge">DEFAULT</span>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>+91 {addr.phone}</p>
                            <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.6 }}>
                              {addr.line1}
                              {addr.line2 ? `, ${addr.line2}` : ''}<br />
                              {addr.city}, {addr.state} — {addr.postalCode}
                            </p>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '14px' }}>
                              <button
                                onClick={() => handleEditAddress(addr)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#B8A07A', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                              >
                                <Edit3 style={{ width: '12px', height: '12px' }} /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                disabled={deletingAddressId === addr.id}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#8B2020', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, opacity: deletingAddressId === addr.id ? 0.4 : 1 }}
                              >
                                <Trash2 style={{ width: '12px', height: '12px' }} /> Delete
                              </button>
                              {!addr.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#B8A07A', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                                >
                                  <Check style={{ width: '12px', height: '12px' }} /> Set as Default
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Wishlist Tab ─────────────────────────────────── */}
                {activeTab === 'wishlist' && (
                  <div>
                    <span className="acc-section-label">Wishlist ({wishlistItems.length})</span>
                    {wishlistItems.length === 0 ? (
                      <div className="acc-empty">
                        <Heart className="acc-empty-icon" strokeWidth={1.2} />
                        <p className="acc-empty-title">A curated void</p>
                        <p className="acc-empty-sub">Keep track of elements you want to bring into your space.</p>
                        <Link href="/shop" className="acc-btn-outline" style={{ marginTop: '12px' }}>Browse Collection</Link>
                      </div>
                    ) : (
                      <div className="acc-wishlist-grid">
                        {wishlistItems.map((item) => (
                          <div key={item.productId} className="group relative">
                            <Link href={`/product/${item.slug}`}>
                              <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#141414', marginBottom: '10px' }}>
                                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="(max-width:768px)50vw,33vw" style={{ transition: 'transform 0.5s ease' }} />
                              </div>
                              <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F5F0E8', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                              <p style={{ fontSize: '13px', fontWeight: 500, color: '#C8956C' }}>₹{(item.salePrice ?? item.price).toLocaleString()}</p>
                            </Link>
                            <button
                              onClick={() => removeWishlistItem(item.productId)}
                              style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(4px)', border: '1px solid #2A2A2A', borderRadius: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', transition: 'color 0.15s, background 0.15s' }}
                              aria-label="Remove from wishlist"
                            >
                              <Trash2 style={{ width: '13px', height: '13px' }} strokeWidth={1.5} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Settings Tab ─────────────────────────────────── */}
                {activeTab === 'settings' && (
                  <div>
                    <span className="acc-section-label">Account Settings</span>

                    {/* Change Password Card */}
                    <div className="acc-card">
                      <p className="acc-card-title">Change Password</p>
                      <form onSubmit={handlePasswordChange}>
                        <div className="acc-field">
                          <label className="acc-label">New Password</label>
                          <div className="acc-input-wrap">
                            <input
                              id="acc-new-password"
                              type={showPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Min 8 characters"
                              className="acc-input"
                            />
                            <button
                              type="button"
                              className="acc-input-eye"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label="Toggle password visibility"
                            >
                              {showPassword
                                ? <EyeOff style={{ width: '15px', height: '15px' }} strokeWidth={1.5} />
                                : <Eye style={{ width: '15px', height: '15px' }} strokeWidth={1.5} />
                              }
                            </button>
                          </div>
                        </div>
                        <button
                          id="acc-update-password-btn"
                          type="submit"
                          disabled={isChangingPassword || newPassword.length < 8}
                          className="acc-btn-outline"
                        >
                          {isChangingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Mobile Bottom Tab Bar ─────────────────────────────────── */}
        <div className="acc-mobile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); window.scrollTo(0, 0); }}
              className={`acc-mobile-tab${activeTab === tab.id ? ' active' : ''}`}
              id={`acc-mobile-tab-${tab.id}`}
            >
              <tab.icon style={{ width: '18px', height: '18px' }} strokeWidth={1.5} />
              <span className="acc-mobile-tab-label">{tab.label}</span>
            </button>
          ))}
          <button
            onClick={handleSignOut}
            className="acc-mobile-tab"
            id="acc-mobile-tab-signout"
            style={{ color: '#8B2020' }}
          >
            <LogOut style={{ width: '18px', height: '18px' }} strokeWidth={1.5} />
            <span className="acc-mobile-tab-label">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
