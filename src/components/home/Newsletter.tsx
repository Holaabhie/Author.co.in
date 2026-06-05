"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <section className="section-spacing bg-ink">
      <div className="section-padding">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className="section-label mb-4 block">Stay Connected</span>
            <h2 className="section-title text-white text-2xl md:text-3xl mb-4">
              Join the <em>Story</em>
            </h2>
            <p className="text-muted text-sm leading-relaxed mb-10 max-w-md mx-auto">
              Subscribe for exclusive drops, early access, and behind-the-scenes content. No spam, just stories worth reading.
            </p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-white/80 section-label"
              >
                Welcome to the narrative
              </motion.div>
            ) : (
              <div 
                className="flex flex-col sm:flex-row gap-0 max-w-[440px] mx-auto border border-white/15"
                onClick={handleSubmit}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Your email address"
                  className="flex-1 bg-transparent border-0 px-5 py-4 text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-warm text-ink px-8 py-4 text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Subscribe <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}