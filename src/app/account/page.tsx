'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  AlertTriangle,
  Undo2,
} from 'lucide-react';
import { useWishlistStore } from '@/lib/store/wishlist';
import { useCartStore } from '@/lib/store/cart';
import { useUser } from '@/hooks/use-user';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

type AccountTab = 'profile' | 'orders' | 'addresses' | 'wishlist' | 'settings';

const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export default function AccountPage() {
  const { user, loading, signOut } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlistStore();
  const addToCart = useCartStore((state) => state.addItem);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Orders and Returns States
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [isFilingReturn, setIsFilingReturn] = useState(false);
  const [returnReason, setReturnReason] = useState("Size misfit");
  const [returnNote, setReturnNote] = useState("");
  const [returnItems, setReturnItems] = useState<Record<string, { checked: boolean; quantity: number }>>({});

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      fetchOrders();
    } else {
      setSelectedOrder(null);
      setIsFilingReturn(false);
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchOrderDetail = async (orderId: string) => {
    setLoadingOrderDetail(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(json.data);
        const initialReturnState: Record<string, { checked: boolean; quantity: number }> = {};
        json.data.items.forEach((item: any) => {
          initialReturnState[item.id] = { checked: false, quantity: 1 };
        });
        setReturnItems(initialReturnState);
      }
    } catch {
      toast.error('Failed to load order details');
    } finally {
      setLoadingOrderDetail(false);
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
        toast.success("Return request filed successfully");
        setIsFilingReturn(false);
        fetchOrderDetail(selectedOrder.id);
      } else {
        throw new Error(json.message || "Failed to file return request");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const tabs = [
    { id: 'profile' as AccountTab, label: 'Profile', icon: User },
    { id: 'orders' as AccountTab, label: 'Orders', icon: Package },
    { id: 'addresses' as AccountTab, label: 'Addresses', icon: MapPin },
    { id: 'wishlist' as AccountTab, label: 'Wishlist', icon: Heart },
    { id: 'settings' as AccountTab, label: 'Settings', icon: Settings },
  ];

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
        toast.success('Password updated successfully');
        setNewPassword('');
      }
    } catch {
      toast.error('Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-6 h-6 animate-spin text-author-cream" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <p className="text-author-mid mb-4">Please sign in to access your account</p>
          <Link href="/login" className="btn-primary inline-block">
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email;
  const userEmail = user.email;
  const userImage = user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="section-padding py-8 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <span className="text-xs uppercase tracking-[0.3em] text-author-mid font-heading">
              My Account
            </span>
            <h1 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-wider mt-2">
              Welcome, {(userName as string)?.split(' ')[0]}
            </h1>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="md:w-64 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-heading uppercase tracking-wider transition-colors ${
                      activeTab === tab.id
                        ? 'text-author-cream bg-white/5 border-l-2 border-author-cream'
                        : 'text-author-mid hover:text-author-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'wishlist' && wishlistItems.length > 0 && (
                      <span className="ml-auto text-[10px] bg-author-cream text-author-black px-1.5 py-0.5 font-bold">
                        {wishlistItems.length}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-heading uppercase tracking-wider text-red-400 hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="font-heading text-xl font-semibold uppercase tracking-wider mb-6">
                      Profile Information
                    </h2>
                    <div className="glass p-6 space-y-6">
                      <div className="flex items-center gap-4">
                        {userImage ? (
                          <img
                            src={userImage}
                            alt=""
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-author-cream text-author-black flex items-center justify-center text-xl font-bold">
                            {(userName as string)?.[0]?.toUpperCase() || 'A'}
                          </div>
                        )}
                        <div>
                          <p className="font-heading font-semibold text-lg">{userName as string}</p>
                          <p className="text-sm text-author-mid">{userEmail}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-heading uppercase tracking-wider text-author-mid mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            defaultValue={(userName as string) || ''}
                            className="w-full bg-author-black/50 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-author-cream/40 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-heading uppercase tracking-wider text-author-mid mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            defaultValue={userEmail || ''}
                            disabled
                            className="w-full bg-author-black/50 border border-white/10 px-4 py-3 text-sm text-author-mid cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <button className="bg-author-cream text-author-black px-8 py-3 font-heading text-sm uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors">
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-heading text-xl font-semibold uppercase tracking-wider">
                        {selectedOrder ? `Order ${selectedOrder.orderNumber}` : "Order History"}
                      </h2>
                      {selectedOrder && (
                        <button
                          onClick={() => {
                            setSelectedOrder(null);
                            setIsFilingReturn(false);
                          }}
                          className="text-xs text-author-cream hover:underline font-heading uppercase tracking-wider"
                        >
                          ← Back to History
                        </button>
                      )}
                    </div>

                    {loadingOrders ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-author-cream" />
                        <p className="text-xs text-author-mid uppercase tracking-wider font-heading">Loading orders...</p>
                      </div>
                    ) : !selectedOrder ? (
                      /* Orders List */
                      orders.length === 0 ? (
                        <div className="glass p-12 text-center">
                          <Package className="w-16 h-16 text-author-grey mx-auto mb-4" />
                          <p className="font-heading text-lg font-semibold mb-2">No orders yet</p>
                          <p className="text-sm text-author-mid mb-6">
                            Your order history will appear here.
                          </p>
                          <Link href="/shop" className="btn-primary inline-block">
                            <span>Start Shopping</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <div
                              key={order.id}
                              className="glass p-6 hover:border-author-cream/20 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                              onClick={() => fetchOrderDetail(order.id)}
                            >
                              <div className="space-y-1">
                                <p className="font-mono text-sm font-semibold text-author-cream">
                                  {order.orderNumber}
                                </p>
                                <p className="text-xs text-author-mid">
                                  Ordered: {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {order.items.map((item: any) => (
                                    <span
                                      key={item.id}
                                      className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-author-white"
                                    >
                                      {item.productName} ({item.quantity})
                                    </span>
                                  ))}
                                  {order._count.items > 2 && (
                                    <span className="text-[10px] text-author-mid self-center">
                                      + {order._count.items - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex sm:flex-col items-start sm:items-end justify-between w-full sm:w-auto gap-2">
                                <p className="font-semibold text-author-white">
                                  ₹{(order.total / 100).toLocaleString()}
                                </p>
                                <div className="flex gap-2">
                                  <span className={`text-[9px] px-2 py-0.5 rounded font-heading uppercase tracking-wider font-semibold border ${
                                    order.status === 'DELIVERED'
                                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                      : order.status === 'CANCELLED'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                  }`}>
                                    {order.status}
                                  </span>
                                  <span className={`text-[9px] px-2 py-0.5 rounded font-heading uppercase tracking-wider font-semibold border ${
                                    order.paymentStatus === 'PAID'
                                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                  }`}>
                                    {order.paymentStatus}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      /* Order Detail Expanded */
                      <div className="space-y-6">
                        {loadingOrderDetail ? (
                          <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-author-cream" />
                            <p className="text-xs text-author-mid uppercase tracking-wider font-heading">Loading detail...</p>
                          </div>
                        ) : (
                          <>
                            {/* Tracking Banner if Shipped */}
                            {selectedOrder.trackingNumber && (
                              <div className="p-4 bg-author-cream/10 border border-author-cream/20 rounded flex items-center gap-3 text-xs text-author-cream">
                                <Truck className="w-5 h-5 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold uppercase tracking-wider">Shipped via {selectedOrder.courierName}</p>
                                  <p className="mt-0.5 text-author-mid">
                                    Tracking AWB: <span className="font-mono text-author-white">{selectedOrder.trackingNumber}</span>
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Main Detail Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Items list & billing */}
                              <div className="md:col-span-2 space-y-6">
                                <div className="glass p-6 rounded-lg space-y-4">
                                  <h3 className="font-heading text-xs uppercase tracking-wider text-author-cream border-b border-white/5 pb-2">
                                    Items Ordered
                                  </h3>
                                  <div className="divide-y divide-white/5">
                                    {selectedOrder.items.map((item: any) => (
                                      <div key={item.id} className="py-3 flex justify-between text-xs first:pt-0 last:pb-0">
                                        <div>
                                          <p className="font-heading uppercase tracking-wider font-semibold text-author-white">
                                            {item.productName}
                                          </p>
                                          <p className="text-[10px] text-author-mid mt-0.5">
                                            {item.variant ? `Size: ${item.variant.size} | Color: ${item.variant.color}` : "Base SKU"}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-author-white font-semibold">₹{(item.totalPrice / 100).toLocaleString()}</p>
                                          <p className="text-[10px] text-author-mid mt-0.5">{item.quantity} × ₹{(item.unitPrice / 100).toLocaleString()}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Pricing summary */}
                                  <div className="border-t border-white/5 pt-4 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-author-mid">
                                      <span>Subtotal</span>
                                      <span>₹{(selectedOrder.subtotal / 100).toLocaleString()}</span>
                                    </div>
                                    {selectedOrder.discount > 0 && (
                                      <div className="flex justify-between text-green-400">
                                        <span>Discount</span>
                                        <span>-₹{(selectedOrder.discount / 100).toLocaleString()}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-author-mid">
                                      <span>Shipping</span>
                                      <span>₹{(selectedOrder.shippingFee / 100).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-author-mid">
                                      <span>GST Tax</span>
                                      <span>₹{(selectedOrder.tax / 100).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold border-t border-white/5 pt-2 text-author-white">
                                      <span>Total</span>
                                      <span>₹{(selectedOrder.total / 100).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Address Card */}
                                <div className="glass p-6 rounded-lg space-y-3">
                                  <h3 className="font-heading text-xs uppercase tracking-wider text-author-cream border-b border-white/5 pb-2">
                                    Delivery Destination
                                  </h3>
                                  {selectedOrder.address && (
                                    <div className="text-xs text-author-mid space-y-1">
                                      <p className="font-bold text-author-white">{selectedOrder.address.fullName}</p>
                                      <p>{selectedOrder.address.line1}</p>
                                      {selectedOrder.address.line2 && <p>{selectedOrder.address.line2}</p>}
                                      <p>
                                        {selectedOrder.address.city}, {selectedOrder.address.state} — {selectedOrder.address.postalCode}
                                      </p>
                                      <p>{selectedOrder.address.country}</p>
                                      <p className="mt-2 font-mono">Contact: {selectedOrder.address.phone}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Sidebar actions, status timeline & returns */}
                              <div className="space-y-6">
                                {/* Actions & Invoice */}
                                <div className="glass p-6 rounded-lg space-y-4">
                                  <h3 className="font-heading text-xs uppercase tracking-wider text-author-cream border-b border-white/5 pb-2">
                                    Order Actions
                                  </h3>
                                  <div className="space-y-3">
                                    <a
                                      href={`/api/orders/${selectedOrder.id}/invoice`}
                                      target="_blank"
                                      className="w-full text-center bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 font-heading text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1.5 rounded text-author-white"
                                    >
                                      <FileText className="w-4 h-4" /> Download GST Invoice
                                    </a>

                                    {/* Returns Filing Button */}
                                    {selectedOrder.status === 'DELIVERED' &&
                                      (!selectedOrder.returnRequests || selectedOrder.returnRequests.length === 0) &&
                                      Math.floor((Date.now() - new Date(selectedOrder.createdAt).getTime()) / 86400000) <= 7 && (
                                        <button
                                          onClick={() => setIsFilingReturn(!isFilingReturn)}
                                          className="w-full bg-author-cream text-author-black py-2.5 font-heading text-xs uppercase tracking-wider font-semibold hover:bg-author-white transition-colors flex items-center justify-center gap-1.5 rounded"
                                        >
                                          <Undo2 className="w-4 h-4" />
                                          {isFilingReturn ? "Cancel Return Request" : "Request Order Return"}
                                        </button>
                                      )}
                                  </div>
                                </div>

                                {/* Status History Timeline */}
                                <div className="glass p-6 rounded-lg space-y-4">
                                  <h3 className="font-heading text-xs uppercase tracking-wider text-author-cream border-b border-white/5 pb-2 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" /> Status History
                                  </h3>
                                  <div className="relative border-l border-white/10 pl-4 ml-2 space-y-4 pt-1">
                                    {selectedOrder.statusHistory?.map((history: any) => (
                                      <div key={history.id} className="relative text-xs">
                                        <span className="absolute -left-[21px] top-0.5 bg-author-black w-2.5 h-2.5 rounded-full border-2 border-author-cream" />
                                        <p className="font-semibold text-author-white uppercase font-heading text-[10px] tracking-wider">
                                          {history.status}
                                        </p>
                                        <p className="text-[9px] text-author-mid">
                                          {new Date(history.createdAt).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Returns Request Info */}
                                {selectedOrder.returnRequests && selectedOrder.returnRequests.length > 0 && (
                                  <div className="glass p-6 rounded-lg space-y-3">
                                    <h3 className="font-heading text-xs uppercase tracking-wider text-author-cream border-b border-white/5 pb-2">
                                      Return Request
                                    </h3>
                                    {selectedOrder.returnRequests.map((req: any) => (
                                      <div key={req.id} className="text-xs space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-author-mid">Status:</span>
                                          <span className={`px-2 py-0.5 rounded-[3px] font-heading font-semibold uppercase text-[9px] tracking-wide border ${
                                            req.status === 'REFUNDED'
                                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                              : req.status === 'REJECTED'
                                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                          }`}>
                                            {req.status}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-author-mid">Reason:</span>
                                          <span className="text-author-white font-medium">{req.reason}</span>
                                        </div>
                                        {req.refundAmount && (
                                          <div className="flex justify-between">
                                            <span className="text-author-mid">Refund:</span>
                                            <span className="text-author-white font-bold">{formatPrice(req.refundAmount)}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Return filing wizard panel */}
                            {isFilingReturn && (
                              <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                onSubmit={handleFileReturnSubmit}
                                className="glass p-6 rounded-lg space-y-4 border border-author-cream/20 text-xs"
                              >
                                <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-cream border-b border-white/5 pb-2">
                                  File Return Request
                                </h3>

                                <p className="text-[10px] text-author-mid uppercase tracking-wide">
                                  Select the items you wish to return and their quantities:
                                </p>

                                <div className="divide-y divide-white/5">
                                  {selectedOrder.items.map((item: any) => (
                                    <div key={item.id} className="py-3 flex items-center justify-between">
                                      <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={returnItems[item.id]?.checked || false}
                                          onChange={(e) => {
                                            setReturnItems((prev) => ({
                                              ...prev,
                                              [item.id]: { ...prev[item.id], checked: e.target.checked },
                                            }));
                                          }}
                                          className="rounded bg-author-black border-white/10 text-author-cream focus:ring-0 w-4 h-4"
                                        />
                                        <div>
                                          <p className="font-heading uppercase tracking-wider font-semibold text-author-white">
                                            {item.productName}
                                          </p>
                                          <p className="text-[10px] text-author-mid mt-0.5">
                                            Size: {item.variant?.size || "Base"} | Color: {item.variant?.color || "Base"}
                                          </p>
                                        </div>
                                      </label>

                                      {returnItems[item.id]?.checked && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-author-mid">Qty:</span>
                                          <select
                                            value={returnItems[item.id]?.quantity || 1}
                                            onChange={(e) => {
                                              setReturnItems((prev) => ({
                                                ...prev,
                                                [item.id]: { ...prev[item.id], quantity: parseInt(e.target.value) },
                                              }));
                                            }}
                                            className="bg-author-black border border-white/10 px-2 py-1 rounded text-author-white focus:outline-none"
                                          >
                                            {[...Array(item.quantity)].map((_, i) => (
                                              <option key={i + 1} value={i + 1}>
                                                {i + 1}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] text-author-mid uppercase block mb-1">Reason for Return *</label>
                                    <select
                                      value={returnReason}
                                      onChange={(e) => setReturnReason(e.target.value)}
                                      className="w-full bg-author-black border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                                    >
                                      <option value="Size misfit">Size misfit</option>
                                      <option value="Color not as expected">Color not as expected</option>
                                      <option value="Damaged product">Damaged product</option>
                                      <option value="Item incorrect">Item incorrect</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-author-mid uppercase block mb-1">Additional Notes</label>
                                    <input
                                      type="text"
                                      value={returnNote}
                                      onChange={(e) => setReturnNote(e.target.value)}
                                      placeholder="Explain the issue..."
                                      className="w-full bg-author-black border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  className="w-full bg-author-cream text-author-black py-2.5 font-heading text-xs uppercase tracking-wider font-semibold hover:bg-author-white transition-colors rounded"
                                >
                                  Submit Return Request
                                </button>
                              </motion.form>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'addresses' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-heading text-xl font-semibold uppercase tracking-wider">
                        Saved Addresses
                      </h2>
                      <button className="text-sm text-author-cream hover:underline font-heading uppercase tracking-wider">
                        + Add New
                      </button>
                    </div>
                    <div className="glass p-12 text-center">
                      <MapPin className="w-16 h-16 text-author-grey mx-auto mb-4" />
                      <p className="font-heading text-lg font-semibold mb-2">No saved addresses</p>
                      <p className="text-sm text-author-mid">
                        Add an address for faster checkout.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'wishlist' && (
                  <div>
                    <h2 className="font-heading text-xl font-semibold uppercase tracking-wider mb-6">
                      Wishlist ({wishlistItems.length})
                    </h2>
                    {wishlistItems.length === 0 ? (
                      <div className="glass p-12 text-center">
                        <Heart className="w-16 h-16 text-author-grey mx-auto mb-4" />
                        <p className="font-heading text-lg font-semibold mb-2">Your wishlist is empty</p>
                        <p className="text-sm text-author-mid mb-6">
                          Save your favorite items for later.
                        </p>
                        <Link href="/shop" className="btn-primary inline-block">
                          <span>Browse Products</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {wishlistItems.map((item) => (
                          <div key={item.productId} className="group relative">
                            <Link href={`/product/${item.slug}`}>
                              <div className="relative aspect-[3/4] overflow-hidden bg-author-charcoal mb-3">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  sizes="(max-width: 768px) 50vw, 33vw"
                                />
                              </div>
                              <h3 className="font-heading text-xs uppercase tracking-wider text-author-white/90 truncate">
                                {item.name}
                              </h3>
                              <p className="text-sm font-semibold text-author-cream mt-1">
                                ₹{(item.salePrice ?? item.price).toLocaleString()}
                              </p>
                            </Link>
                            <div className="absolute top-2 right-2 flex flex-col gap-1">
                              <button
                                onClick={() => removeWishlistItem(item.productId)}
                                className="w-8 h-8 bg-author-black/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                                aria-label="Remove from wishlist"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div>
                    <h2 className="font-heading text-xl font-semibold uppercase tracking-wider mb-6">
                      Account Settings
                    </h2>
                    <div className="space-y-4">
                      <div className="glass p-6">
                        <h3 className="font-heading text-sm font-semibold uppercase tracking-wider mb-3">
                          Change Password
                        </h3>
                        <form onSubmit={handlePasswordChange} className="space-y-3">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password (min 8 characters)"
                            className="w-full bg-author-black/50 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-author-cream/40 transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={isChangingPassword || newPassword.length < 8}
                            className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors disabled:opacity-50"
                          >
                            {isChangingPassword ? 'Updating...' : 'Update Password'}
                          </button>
                        </form>
                      </div>

                      <div className="glass p-6">
                        <h3 className="font-heading text-sm font-semibold uppercase tracking-wider mb-3 text-red-400">
                          Danger Zone
                        </h3>
                        <p className="text-sm text-author-mid mb-3">
                          Permanently delete your account and all associated data.
                        </p>
                        <button className="px-6 py-2.5 border border-red-500/30 text-red-400 font-heading text-xs uppercase tracking-[0.2em] hover:bg-red-500/10 transition-colors">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
