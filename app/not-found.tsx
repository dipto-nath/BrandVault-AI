import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F4EC] text-[#16203A] p-4 font-sans text-center">
      <h2 className="font-serif text-3xl font-bold mb-2">Page not found</h2>
      <p className="text-sm text-[#5B6477] mb-6">The page you were looking for does not exist.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-[10px] bg-[#16203A] text-white text-sm font-medium hover:bg-[#111A30] transition-colors"
      >
        Return home
      </Link>
    </div>
  );
}
