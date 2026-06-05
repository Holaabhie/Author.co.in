"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APP_ERROR]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 section-padding">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="font-heading text-2xl font-bold uppercase tracking-wider mb-3">
          Something Went Wrong
        </h2>
        <p className="text-author-mid text-sm mb-8">
          We encountered an unexpected error. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-author-cream text-author-black px-6 py-3 font-heading text-sm uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="border border-white/10 px-6 py-3 font-heading text-sm uppercase tracking-[0.2em] hover:bg-white/5 transition-colors text-center"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
