/*
 * MAB Control - Protocol constants/types for the Next.js UI.
 * Mirrors the canonical runtime in `shared/protocol/protocol.js`.
 * Keep both files in sync when the protocol changes.
 */

export const PROTOCOL_VERSION = 1

export const CHANNEL = {
  CONTROL: 'mab:control',
  STREAM: 'mab:stream',
  FILE: 'mab:file',
  STATE: 'mab:state',
  PAIR: 'mab:pair',
  SYSTEM: 'mab:system',
} as const

export const MSG = {
  PAIR_REQUEST: 'pair_request',
  PAIR_ACCEPT: 'pair_accept',
  PAIR_REJECT: 'pair_reject',
  DEVICE_INFO: 'device_info',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
  ACK: 'ack',
  MOUSE_MOVE: 'mouse_move',
  MOUSE_MOVE_ABS: 'mouse_move_abs',
  MOUSE_DOWN: 'mouse_down',
  MOUSE_UP: 'mouse_up',
  MOUSE_CLICK: 'mouse_click',
  MOUSE_SCROLL: 'mouse_scroll',
  KEY_DOWN: 'keyboard_down',
  KEY_UP: 'keyboard_up',
  KEY_TYPE: 'keyboard_type',
  VOLUME_UP: 'volume_up',
  VOLUME_DOWN: 'volume_down',
  MUTE: 'mute',
  MEDIA_PLAY_PAUSE: 'media_play_pause',
  MEDIA_NEXT: 'media_next',
  MEDIA_PREV: 'media_prev',
  SLIDE_NEXT: 'slide_next',
  SLIDE_PREV: 'slide_prev',
  PRESENT_START: 'present_start',
  POWER_LOCK: 'power_lock',
  POWER_SLEEP: 'power_sleep',
  POWER_RESTART: 'power_restart',
  POWER_SHUTDOWN: 'power_shutdown',
  SCREEN_START: 'screen_start',
  SCREEN_STOP: 'screen_stop',
  SCREEN_FRAME: 'screen_frame',
  SCREEN_CONFIG: 'screen_config',
  SCREEN_DISPLAYS: 'screen_displays',
  SCREEN_STATS: 'screen_stats',
  CAMERA_START: 'camera_start',
  CAMERA_STOP: 'camera_stop',
  CAMERA_FRAME: 'camera_frame',
  AUDIO_START: 'audio_start',
  AUDIO_STOP: 'audio_stop',
  AUDIO_CHUNK: 'audio_chunk',
  GAMEPAD_CONNECT: 'gamepad_connect',
  GAMEPAD_DISCONNECT: 'gamepad_disconnect',
  GAMEPAD_STATE: 'gamepad_state',
  CLIPBOARD_SET: 'clipboard_set',
  CLIPBOARD_GET: 'clipboard_get',
  CLIPBOARD_SYNC: 'clipboard_sync',
  FILE_START: 'file_start',
  FILE_CHUNK: 'file_chunk',
  FILE_COMPLETE: 'file_complete',
  FILE_CANCEL: 'file_cancel',
  FILE_ACK: 'file_ack',
} as const

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

export const CONNECTION_STATE: Record<string, ConnectionState> = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
}

export const QUALITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CUSTOM: 'custom',
} as const

export const FILE_CHUNK_SIZE = 256 * 1024

export function buildPairingUri(opts: {
  ip: string
  port: number
  token: string
  name?: string
}): string {
  const params = new URLSearchParams({
    ip: opts.ip,
    port: String(opts.port),
    token: opts.token,
    name: opts.name ?? 'MAB PC',
    v: String(PROTOCOL_VERSION),
  })
  return `mab://pair?${params.toString()}`
}
