export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="absolute inset-0 border-2 border-author-grey rounded-full" />
          <div className="absolute inset-0 border-2 border-author-cream border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-xs font-heading uppercase tracking-[0.3em] text-author-mid animate-pulse">
          Loading
        </p>
      </div>
    </div>
  );
}
