'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 font-mono text-sm">
      <p className="text-destructive">Something went wrong.</p>
      <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
        Try again
      </button>
    </div>
  )
}
