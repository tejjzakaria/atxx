export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: "#f0f5f4",
        backgroundImage: "radial-gradient(#c8deda 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {children}
    </div>
  );
}
