import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20 section-padding">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-8xl md:text-9xl font-bold text-gradient mb-4">
          404
        </h1>
        <h2 className="font-heading text-xl font-semibold uppercase tracking-wider mb-3">
          Page Not Found
        </h2>
        <p className="text-author-mid text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-author-cream text-author-black px-8 py-3 font-heading text-sm uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors text-center"
          >
            Go Home
          </Link>
          <Link
            href="/shop"
            className="border border-white/10 px-8 py-3 font-heading text-sm uppercase tracking-[0.2em] hover:bg-white/5 transition-colors text-center"
          >
            Shop All
          </Link>
        </div>
      </div>
    </div>
  );
}
