/*
 * MAB Control - Native bridge
 * ---------------------------
 * The same Next.js UI runs in two hosts:
 *   1. Inside the Electron desktop app, where `window.mab` is injected by
 *      electron/preload.js and exposes the real native services (server,
 *      input, capture, discovery, storage).
 *   2. In a plain browser (e.g. the v0 preview) where no native engine
 *      exists. In that case we degrade honestly: network-dependent values
 *      are unknown ("—") and local settings persist via localStorage.
 *
 * Nothing here fabricates a connection or fake device state.
 */

export type EngineMode = 'desktop' | 'browser'

export interface ServerInfo {
  running: boolean
  ip: string | null
  port: number | null
  hostname: string | null
}

export interface NativeApi {
  version: string
  getServerInfo(): Promise<ServerInfo>
  startServer(port: number): Promise<ServerInfo>
  stopServer(): Promise<void>
  regeneratePairingToken(): Promise<{ token: string; expiresAt: number }>
  /** Inject an input/system command on the local machine (desktop only). */
  sendControl(type: string, payload?: Record<string, unknown>): Promise<boolean>
  storageGet<T>(key: string): Promise<T | null>
  storageSet(key: string, value: unknown): Promise<void>
  onEvent(channel: string, cb: (payload: unknown) => void): () => void
}

/** Returns the injected native API, or null when running in a browser. */
export function getNative(): NativeApi | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { mab?: NativeApi }).mab ?? null
}

export function getEngineMode(): EngineMode {
  return getNative() ? 'desktop' : 'browser'
}

/**
 * Local persistence abstraction. Uses the native store when available
 * (electron-store on desktop), otherwise localStorage in the browser.
 */
export const storage = {
  async get<T>(key: string, fallback: T): Promise<T> {
    const native = getNative()
    try {
      if (native) {
        const v = await native.storageGet<T>(key)
        return v ?? fallback
      }
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(`mab:${key}`)
        return raw ? (JSON.parse(raw) as T) : fallback
      }
    } catch {
      /* ignore corrupt values */
    }
    return fallback
  },
  async set(key: string, value: unknown): Promise<void> {
    const native = getNative()
    try {
      if (native) {
        await native.storageSet(key, value)
        return
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`mab:${key}`, JSON.stringify(value))
      }
    } catch {
      /* storage may be unavailable */
    }
  },
}

/**
 * Dispatch a control command. On desktop it is injected by the native engine.
 * Returns true when actually delivered, false in browser preview.
 */
export async function sendControl(
  type: string,
  payload?: Record<string, unknown>,
): Promise<boolean> {
  const native = getNative()
  if (!native) return false
  try {
    return await native.sendControl(type, payload)
  } catch {
    return false
  }
}

/** Best-effort local network hint used only for display in browser preview. */
export function guessLocalHost(): string {
  if (typeof window === 'undefined') return 'localhost'
  return window.location.hostname || 'localhost'
}
