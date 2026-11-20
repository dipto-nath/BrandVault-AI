export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-[#1E2540] selection:bg-[#E3EAFA] selection:text-[#2F4FB3]">
      {children}
    </div>
  );
}
