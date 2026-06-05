"use client";

export default function Marquee() {
  const text = "New Arrivals · SS26 Collection · Premium Streetwear · Free Shipping ₹999+ · Author Exclusives ·";

  return (
    <div className="bg-warm overflow-hidden py-4">
      <div className="animate-marquee whitespace-nowrap flex">
        <span className="section-label text-ink mx-4">{text}{text}</span>
      </div>
    </div>
  );
}