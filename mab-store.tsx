'use client'

/*
 * MAB Control - Global application store.
 * Single source of runtime truth for the UI: server info, pairing, the
 * connected phone, paired devices, live stats, recent activity and settings.
 * Subscribes to the native engine when running inside Electron; degrades to a
 * local-only state in browser preview (never fabricating a connection).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import {
  getEngineMode,
  getNative,
  guessLocalHost,
  storage,
  type EngineMode,
  type ServerInfo,
} from './native-bridge'
import { buildPairingUri, type ConnectionState } from './protocol'
import { DEFAULT_SETTINGS, type Settings } from './settings'
import { logger } from './logger'

export interface PairedDevice {
  id: string
  name: string
  ip: string
  os: string
  connType: string
  lastSeen: number
  trusted: boolean
}

export interface ConnectedPhone {
  id: string
  name: string
  ip: string
  os: string
  since: number
}

export interface Pairing {
  token: string
  expiresAt: number
}

export interface Stats {
  filesTransferred: number
  bytesUp: number
  bytesDown: number
  uploadSpeed: number
  downloadSpeed: number
  sessionStart: number
}

export type ActivityKind =
  | 'connect'
  | 'disconnect'
  | 'file'
  | 'control'
  | 'error'
  | 'info'

export interface ActivityEntry {
  id: string
  ts: number
  kind: ActivityKind
  message: string
}

interface State {
  engine: EngineMode
  ready: boolean
  deviceName: string
  server: ServerInfo
  pairing: Pairing
  connection: ConnectionState
  phone: ConnectedPhone | null
  devices: PairedDevice[]
  stats: Stats
  activity: ActivityEntry[]
  settings: Settings
}

type Action =
  | { type: 'HYDRATE'; payload: Partial<State> }
  | { type: 'SET_SERVER'; payload: ServerInfo }
  | { type: 'SET_DEVICE_NAME'; payload: string }
  | { type: 'SET_PAIRING'; payload: Pairing }
  | { type: 'SET_CONNECTION'; payload: ConnectionState }
  | { type: 'SET_PHONE'; payload: ConnectedPhone | null }
  | { type: 'SET_DEVICES'; payload: PairedDevice[] }
  | { type: 'PATCH_STATS'; payload: Partial<Stats> }
  | { type: 'ADD_ACTIVITY'; payload: ActivityEntry }
  | { type: 'SET_SETTINGS'; payload: Settings }

function uid(prefix = ''): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return prefix ? `${prefix}-${rnd}` : rnd
}

function freshPairing(ttlMin: number): Pairing {
  return {
    token: uid('tok').replace(/-/g, '').slice(0, 24),
    expiresAt: Date.now() + ttlMin * 60_000,
  }
}

const initialState: State = {
  engine: 'browser',
  ready: false,
  deviceName: 'MAB PC',
  server: { running: false, ip: null, port: DEFAULT_SETTINGS.connection.port, hostname: null },
  pairing: freshPairing(DEFAULT_SETTINGS.security.tokenTtlMin),
  connection: 'disconnected',
  phone: null,
  devices: [],
  stats: {
    filesTransferred: 0,
    bytesUp: 0,
    bytesDown: 0,
    uploadSpeed: 0,
    downloadSpeed: 0,
    sessionStart: Date.now(),
  },
  activity: [],
  settings: DEFAULT_SETTINGS,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, ready: true }
    case 'SET_SERVER':
      return { ...state, server: action.payload }
    case 'SET_DEVICE_NAME':
      return { ...state, deviceName: action.payload }
    case 'SET_PAIRING':
      return { ...state, pairing: action.payload }
    case 'SET_CONNECTION':
      return { ...state, connection: action.payload }
    case 'SET_PHONE':
      return { ...state, phone: action.payload }
    case 'SET_DEVICES':
      return { ...state, devices: action.payload }
    case 'PATCH_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } }
    case 'ADD_ACTIVITY':
      return { ...state, activity: [action.payload, ...state.activity].slice(0, 40) }
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload }
    default:
      return state
  }
}

interface StoreValue extends State {
  pairingUri: string
  setDeviceName: (name: string) => void
  regeneratePairing: () => void
  addActivity: (kind: ActivityKind, message: string) => void
  addDevice: (d: Omit<PairedDevice, 'id' | 'lastSeen'>) => void
  removeDevice: (id: string) => void
  renameDevice: (id: string, name: string) => void
  connectDevice: (id: string) => void
  disconnect: () => void
  updateSettings: (next: Settings) => void
  startServer: () => Promise<void>
  stopServer: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function MabProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  const addActivity = useCallback((kind: ActivityKind, message: string) => {
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: { id: uid('act'), ts: Date.now(), kind, message },
    })
    logger.info('activity', `${kind}: ${message}`)
  }, [])

  const persistDevices = useCallback((devices: PairedDevice[]) => {
    void storage.set('devices', devices)
  }, [])

  // Hydrate from local storage + native engine on mount.
  useEffect(() => {
    let disposed = false
    const native = getNative()
    const engine = getEngineMode()

    async function boot() {
      const [deviceName, devices, settings] = await Promise.all([
        storage.get<string>('deviceName', 'MAB PC'),
        storage.get<PairedDevice[]>('devices', []),
        storage.get<Settings>('settings', DEFAULT_SETTINGS),
      ])

      let server: ServerInfo = {
        running: false,
        ip: engine === 'desktop' ? null : guessLocalHost(),
        port: settings.connection.port,
        hostname: null,
      }

      if (native) {
        try {
          server = await native.getServerInfo()
          logger.info('engine', `Desktop engine v${native.version} detected`)
        } catch (e) {
          logger.error('engine', `Failed to read server info: ${String(e)}`)
        }
      } else {
        logger.info('engine', 'Running in browser preview (no native engine)')
      }

      if (disposed) return
      dispatch({
        type: 'HYDRATE',
        payload: {
          engine,
          deviceName,
          devices,
          settings,
          server,
          pairing: freshPairing(settings.security.tokenTtlMin),
        },
      })
    }
    void boot()

    // Subscribe to live engine events (connection + stats + server) on desktop.
    let unsub: (() => void) | undefined
    if (native) {
      unsub = native.onEvent('mab:ui', (raw) => {
        const evt = raw as { kind: string; data?: unknown }
        switch (evt.kind) {
          case 'server':
            dispatch({ type: 'SET_SERVER', payload: evt.data as ServerInfo })
            break
          case 'connection':
            dispatch({
              type: 'SET_CONNECTION',
              payload: (evt.data as { state: ConnectionState }).state,
            })
            break
          case 'phone':
            dispatch({ type: 'SET_PHONE', payload: evt.data as ConnectedPhone | null })
            break
          case 'stats':
            dispatch({ type: 'PATCH_STATS', payload: evt.data as Partial<Stats> })
            break
          default:
            break
        }
      })
    }

    return () => {
      disposed = true
      unsub?.()
    }
  }, [])

  const pairingUri = useMemo(
    () =>
      buildPairingUri({
        ip: state.server.ip ?? guessLocalHost(),
        port: state.server.port ?? DEFAULT_SETTINGS.connection.port,
        token: state.pairing.token,
        name: state.deviceName,
      }),
    [state.server.ip, state.server.port, state.pairing.token, state.deviceName],
  )

  const setDeviceName = useCallback((name: string) => {
    dispatch({ type: 'SET_DEVICE_NAME', payload: name })
    void storage.set('deviceName', name)
  }, [])

  const regeneratePairing = useCallback(() => {
    const p = freshPairing(stateRef.current.settings.security.tokenTtlMin)
    dispatch({ type: 'SET_PAIRING', payload: p })
    logger.info('pairing', 'Generated new temporary pairing token')
  }, [])

  const addDevice = useCallback(
    (d: Omit<PairedDevice, 'id' | 'lastSeen'>) => {
      const next = [
        ...stateRef.current.devices,
        { ...d, id: uid('dev'), lastSeen: Date.now() },
      ]
      dispatch({ type: 'SET_DEVICES', payload: next })
      persistDevices(next)
      addActivity('info', `Paired device: ${d.name}`)
    },
    [addActivity, persistDevices],
  )

  const removeDevice = useCallback(
    (id: string) => {
      const dev = stateRef.current.devices.find((d) => d.id === id)
      const next = stateRef.current.devices.filter((d) => d.id !== id)
      dispatch({ type: 'SET_DEVICES', payload: next })
      persistDevices(next)
      if (stateRef.current.phone?.id === id) {
        dispatch({ type: 'SET_PHONE', payload: null })
        dispatch({ type: 'SET_CONNECTION', payload: 'disconnected' })
      }
      addActivity('info', `Removed device: ${dev?.name ?? id}`)
    },
    [addActivity, persistDevices],
  )

  const renameDevice = useCallback(
    (id: string, name: string) => {
      const next = stateRef.current.devices.map((d) =>
        d.id === id ? { ...d, name } : d,
      )
      dispatch({ type: 'SET_DEVICES', payload: next })
      persistDevices(next)
    },
    [persistDevices],
  )

  const connectDevice = useCallback(
    (id: string) => {
      const dev = stateRef.current.devices.find((d) => d.id === id)
      if (!dev) return
      const native = getNative()
      if (!native) {
        addActivity(
          'error',
          'Cannot open a control session in browser preview — run the desktop app.',
        )
        dispatch({ type: 'SET_CONNECTION', payload: 'error' })
        return
      }
      dispatch({ type: 'SET_CONNECTION', payload: 'connecting' })
      addActivity('connect', `Connecting to ${dev.name}...`)
    },
    [addActivity],
  )

  const disconnect = useCallback(() => {
    const native = getNative()
    native?.stopServer?.()
    dispatch({ type: 'SET_PHONE', payload: null })
    dispatch({ type: 'SET_CONNECTION', payload: 'disconnected' })
    addActivity('disconnect', 'Session ended')
  }, [addActivity])

  const updateSettings = useCallback((next: Settings) => {
    dispatch({ type: 'SET_SETTINGS', payload: next })
    void storage.set('settings', next)
    logger.info('settings', 'Settings saved')
  }, [])

  const startServer = useCallback(async () => {
    const native = getNative()
    if (!native) {
      addActivity(
        'error',
        'Server engine unavailable in browser preview — launch the MAB Control desktop app.',
      )
      return
    }
    try {
      const info = await native.startServer(stateRef.current.settings.connection.port)
      dispatch({ type: 'SET_SERVER', payload: info })
      addActivity('info', `Server listening on ${info.ip}:${info.port}`)
    } catch (e) {
      addActivity('error', `Failed to start server: ${String(e)}`)
    }
  }, [addActivity])

  const stopServer = useCallback(async () => {
    const native = getNative()
    await native?.stopServer?.()
    dispatch({
      type: 'SET_SERVER',
      payload: { ...stateRef.current.server, running: false },
    })
    addActivity('info', 'Server stopped')
  }, [addActivity])

  const value: StoreValue = {
    ...state,
    pairingUri,
    setDeviceName,
    regeneratePairing,
    addActivity,
    addDevice,
    removeDevice,
    renameDevice,
    connectDevice,
    disconnect,
    updateSettings,
    startServer,
    stopServer,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useMab(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useMab must be used within <MabProvider>')
  return ctx
}
