export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 bg-grid-dark">
      <div className="glass-card w-full max-w-md p-8 animate-fade-in">{children}</div>
    </div>
  )
}
