'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setName('');
    setEmail('');
    setMessage('');
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-white text-black font-sans">
      <section className="section-padding py-16 md:py-24 border-b border-black/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold">
              Get in Touch
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight text-neutral-900 mt-2">
              Contact Support
            </h1>
            <p className="text-sm md:text-base text-neutral-500 max-w-2xl mx-auto leading-relaxed mt-4">
              Need assistance with an order, sizing, or shipment? Reach out to our customer support team below.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding py-16 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Info Details */}
        <div className="lg:col-span-5 space-y-8">
          <h2 className="font-heading text-2xl font-bold uppercase tracking-wider text-neutral-900">
            Support Info
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Our support desk is active from Monday to Saturday, 10:00 AM to 6:00 PM IST. We strive to respond to all email inquiries within 24 hours.
          </p>

          <div className="space-y-4 text-xs text-neutral-700">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-neutral-800 shrink-0" />
              <a href="mailto:shopauthor.co@gmail.com" className="hover:underline">shopauthor.co@gmail.com</a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-neutral-800 shrink-0" />
              <a href="tel:+919076252241" className="hover:underline">+91 9076252241</a>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-neutral-800 mt-0.5 shrink-0" />
              <span className="leading-relaxed">
                No. 7, Arjun Bharwad Chl,<br />
                Sant Mirabai Road,<br />
                Ghartanpada, Rawalpada,<br />
                Dahisar East, Mumbai,<br />
                Maharashtra, 400068
              </span>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-neutral-50 p-8 rounded-lg border border-neutral-100">
          {isSubmitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto">
                <Send className="w-5 h-5 text-neutral-800" />
              </div>
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-neutral-900">Message Sent</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Thank you for contacting us. Our support team will review your message and reply via email within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-neutral-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-black rounded-sm transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-neutral-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-black rounded-sm transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">
                  Message / Inquiry
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full bg-white border border-neutral-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-black rounded-sm transition-colors resize-none"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white h-11 text-[11px] uppercase tracking-[0.25em] font-bold flex items-center justify-center gap-2 hover:bg-neutral-900 transition-colors rounded-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
