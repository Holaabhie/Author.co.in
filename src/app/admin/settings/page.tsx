"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  FileText,
  Bell,
  Truck,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

interface InvoiceConfig {
  businessName: string;
  address: string;
  state: string;
  gstin: string;
  invoicePrefix: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

interface NotificationConfig {
  id?: string;
  type: string;
  channel: "EMAIL" | "WHATSAPP" | "SMS";
  isEnabled: boolean;
  template: string | null;
}

interface ShippingConfig {
  freeShippingThreshold: number; // in paise
  defaultShippingFee: number;    // in paise
  expressFee: number;            // in paise
  estimatedDays: { standard: string; express: string };
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"invoice" | "notifications" | "shipping">("invoice");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states - Invoice
  const [businessName, setBusinessName] = useState("");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [invoiceState, setInvoiceState] = useState("");
  const [gstin, setGstin] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("");
  const [cgstRate, setCgstRate] = useState("9");
  const [sgstRate, setSgstRate] = useState("9");
  const [igstRate, setIgstRate] = useState("18");

  // Form states - Shipping
  const [freeThresholdRs, setFreeThresholdRs] = useState("");
  const [defaultShippingFeeRs, setDefaultShippingFeeRs] = useState("");
  const [expressFeeRs, setExpressFeeRs] = useState("");
  const [standardDays, setStandardDays] = useState("");
  const [expressDays, setExpressDays] = useState("");

  // Form states - Notifications
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();

        if (json.success && json.data) {
          const { invoice, notifications: notifs, shipping } = json.data;

          if (invoice) {
            setBusinessName(invoice.businessName || "");
            setInvoiceAddress(invoice.address || "");
            setInvoiceState(invoice.state || "");
            setGstin(invoice.gstin || "");
            setInvoicePrefix(invoice.invoicePrefix || "");
            setCgstRate(invoice.cgstRate?.toString() || "9");
            setSgstRate(invoice.sgstRate?.toString() || "9");
            setIgstRate(invoice.igstRate?.toString() || "18");
          }

          if (shipping) {
            setFreeThresholdRs((shipping.freeShippingThreshold / 100).toString());
            setDefaultShippingFeeRs((shipping.defaultShippingFee / 100).toString());
            setExpressFeeRs((shipping.expressFee / 100).toString());
            setStandardDays(shipping.estimatedDays?.standard || "5-7 business days");
            setExpressDays(shipping.estimatedDays?.express || "2-3 business days");
          }

          if (Array.isArray(notifs)) {
            setNotifications(notifs);
          }
        }
      } catch (err) {
        console.error("Failed to load settings", err);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "invoice",
          businessName,
          address: invoiceAddress,
          state: invoiceState,
          gstin,
          invoicePrefix,
          cgstRate: parseFloat(cgstRate) || 0,
          sgstRate: parseFloat(sgstRate) || 0,
          igstRate: parseFloat(igstRate) || 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Invoice settings updated successfully");
      } else {
        throw new Error(json.message || "Failed to update invoice settings");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "shipping",
          freeShippingThreshold: Math.round((parseFloat(freeThresholdRs) || 0) * 100),
          defaultShippingFee: Math.round((parseFloat(defaultShippingFeeRs) || 0) * 100),
          expressFee: Math.round((parseFloat(expressFeeRs) || 0) * 100),
          estimatedDays: { standard: standardDays, express: expressDays },
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Shipping settings updated successfully");
      } else {
        throw new Error(json.message || "Failed to update shipping settings");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (index: number) => {
    const updatedNotifs = [...notifications];
    updatedNotifs[index].isEnabled = !updatedNotifs[index].isEnabled;
    setNotifications(updatedNotifs);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "notifications",
          notifications: [updatedNotifs[index]],
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to update notification toggles");
      }
      toast.success("Notification channel updated");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error updating toggle");
      // Rollback
      const reverted = [...notifications];
      reverted[index].isEnabled = !reverted[index].isEnabled;
      setNotifications(reverted);
    }
  };

  const tabs = [
    { id: "invoice", label: "Invoice Settings", icon: FileText },
    { id: "shipping", label: "Shipping & Fulfillment", icon: Truck },
    { id: "notifications", label: "Notifications Channels", icon: Bell },
  ];

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
        <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-author-cream" /> System Settings
        </h1>
        <p className="text-author-mid text-sm mt-1">
          Configure business details, shipping rates, and transactional notification preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 overflow-x-auto pb-px gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs uppercase tracking-wider font-heading border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? "border-author-cream text-author-cream font-semibold"
                : "border-transparent text-author-mid hover:text-author-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activeTab === "invoice" && (
          <form onSubmit={handleSaveInvoice} className="glass p-6 rounded-lg space-y-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-author-cream" /> Business Details & Tax
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">Registered Business Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Author Clothing Private Limited"
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>

              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">GSTIN Number *</label>
                <input
                  type="text"
                  required
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">State / Province *</label>
                <input
                  type="text"
                  required
                  value={invoiceState}
                  onChange={(e) => setInvoiceState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>

              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">Invoice Code Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="AUTH"
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded font-mono uppercase"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-[10px] text-author-mid uppercase block mb-1">Registered Business Address *</label>
              <textarea
                rows={3}
                required
                value={invoiceAddress}
                onChange={(e) => setInvoiceAddress(e.target.value)}
                placeholder="Complete office address..."
                className="w-full bg-author-charcoal border border-white/10 p-3 text-xs text-author-white focus:outline-none rounded resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs border-t border-white/5 pt-4">
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">CGST Rate (%)</label>
                <input
                  type="number"
                  value={cgstRate}
                  onChange={(e) => setCgstRate(e.target.value)}
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">SGST Rate (%)</label>
                <input
                  type="number"
                  value={sgstRate}
                  onChange={(e) => setSgstRate(e.target.value)}
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">IGST Rate (%)</label>
                <input
                  type="number"
                  value={igstRate}
                  onChange={(e) => setIgstRate(e.target.value)}
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={saving}
                className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Business Settings
              </button>
            </div>
          </form>
        )}

        {activeTab === "shipping" && (
          <form onSubmit={handleSaveShipping} className="glass p-6 rounded-lg space-y-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-author-cream" /> Shipping Rates & Estimates
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">Free Shipping Min Order (₹)</label>
                <input
                  type="number"
                  value={freeThresholdRs}
                  onChange={(e) => setFreeThresholdRs(e.target.value)}
                  placeholder="999"
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>

              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">Standard Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={defaultShippingFeeRs}
                  onChange={(e) => setDefaultShippingFeeRs(e.target.value)}
                  placeholder="49"
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>

              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">Express Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={expressFeeRs}
                  onChange={(e) => setExpressFeeRs(e.target.value)}
                  placeholder="149"
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-white/5 pt-4">
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">Standard Transit Time Text</label>
                <input
                  type="text"
                  value={standardDays}
                  onChange={(e) => setStandardDays(e.target.value)}
                  placeholder="e.g. 5-7 business days"
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>

              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">Express Transit Time Text</label>
                <input
                  type="text"
                  value={expressDays}
                  onChange={(e) => setExpressDays(e.target.value)}
                  placeholder="e.g. 2-3 business days"
                  className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={saving}
                className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Shipping Settings
              </button>
            </div>
          </form>
        )}

        {activeTab === "notifications" && (
          <div className="glass p-6 rounded-lg space-y-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-author-cream" /> Notification Channels Preferences
            </h2>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-author-mid text-xs">
                No notification templates found. They will be generated when alerts fire.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notif, idx) => (
                  <div key={notif.id || notif.type} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <p className="font-heading text-xs font-bold uppercase tracking-wider text-author-white">
                        {notif.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] text-author-mid uppercase tracking-wide mt-0.5">
                        Channel: {notif.channel}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleNotification(idx)}
                      className={`text-[10px] px-3 py-1 rounded-full font-heading font-semibold uppercase tracking-wider border transition-colors ${
                        notif.isEnabled
                          ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                      }`}
                    >
                      {notif.isEnabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
