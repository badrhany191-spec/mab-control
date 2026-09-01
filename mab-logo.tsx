export function MabLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="MAB Control logo" fill="none">
      <defs>
        <linearGradient id="mab-g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--primary) / 0.6)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#mab-g)" />
      <path
        d="M13 34V15.5c0-.4.48-.6.76-.32L24 25.5l10.24-10.32c.28-.28.76-.08.76.32V34"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
