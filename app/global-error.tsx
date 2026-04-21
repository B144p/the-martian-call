'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="h-full flex items-center justify-center bg-background text-foreground font-mono text-sm">
        <div className="flex flex-col items-center gap-4">
          <p className="text-destructive">A critical error occurred.</p>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
