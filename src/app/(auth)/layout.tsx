export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>AI Academy</h1>
          <p className="mt-2" style={{ color: 'var(--secondary)' }}>Jouw pad naar AI-expertise</p>
        </div>
        {children}
      </div>
    </div>
  )
}
