'use client'

import { useEffect, useState } from 'react'

/** Returns a live-updating HH:MM:SS string since the given start timestamp. */
export function useSessionDuration(startTs: number): string {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const total = Math.max(0, Math.floor((now - startTs) / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
