"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Settings,
  ChevronLeft,
  Menu,
  BarChart3,
  Layers,
  Paintbrush,
  Image as ImageIcon,
  FileText,
  Undo2,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/returns", label: "Returns", icon: Undo2 },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/brands", label: "Brands", icon: Paintbrush },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/cms", label: "CMS", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen pt-16 md:pt-20 flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 64 }}
        className="fixed left-0 top-16 md:top-20 bottom-0 bg-author-charcoal border-r border-white/5 z-40 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          {sidebarOpen && (
            <span className="font-heading text-sm font-semibold uppercase tracking-wider text-author-cream">
              Admin
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-author-cream/10 text-author-cream"
                    : "text-author-mid hover:text-author-white hover:bg-white/5"
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-heading uppercase tracking-wider text-xs">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-white/5">
            <Link
              href="/"
              className="text-xs text-author-mid hover:text-author-white transition-colors font-heading uppercase tracking-wider"
            >
              ← Back to Store
            </Link>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 256 : 64 }}
      >
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
