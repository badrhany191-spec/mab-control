/*
 * MAB Control - Network Protocol (canonical, versioned)
 * -----------------------------------------------------
 * Single source of truth for the message protocol shared between the
 * Windows/desktop server (Electron main) and the phone client (PWA / Android).
 *
 * UMD module: usable via CommonJS `require()` in Node and as a global
 * `window.MABProtocol` in the browser. The Next.js UI mirrors these
 * constants/types in `lib/protocol.ts` (keep both in sync).
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.MABProtocol = factory()
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const PROTOCOL_VERSION = 1

  // Socket.IO event channels
  const CHANNEL = {
    CONTROL: 'mab:control', // input + system commands (phone -> pc)
    STREAM: 'mab:stream', // desktop/camera signalling + frames
    FILE: 'mab:file', // file transfer chunks
    STATE: 'mab:state', // server -> client state/status
    PAIR: 'mab:pair', // pairing handshake
    SYSTEM: 'mab:system', // ping/pong/heartbeat/errors
  }

  // Message `type` values grouped by domain
  const MSG = {
    // pairing / session
    PAIR_REQUEST: 'pair_request',
    PAIR_ACCEPT: 'pair_accept',
    PAIR_REJECT: 'pair_reject',
    DEVICE_INFO: 'device_info',

    // system
    PING: 'ping',
    PONG: 'pong',
    ERROR: 'error',
    ACK: 'ack',

    // mouse
    MOUSE_MOVE: 'mouse_move', // relative dx/dy (touchpad)
    MOUSE_MOVE_ABS: 'mouse_move_abs', // absolute normalized x/y (desktop tap)
    MOUSE_DOWN: 'mouse_down',
    MOUSE_UP: 'mouse_up',
    MOUSE_CLICK: 'mouse_click',
    MOUSE_SCROLL: 'mouse_scroll',

    // keyboard
    KEY_DOWN: 'keyboard_down',
    KEY_UP: 'keyboard_up',
    KEY_TYPE: 'keyboard_type', // type a unicode string

    // media / volume
    VOLUME_UP: 'volume_up',
    VOLUME_DOWN: 'volume_down',
    MUTE: 'mute',
    MEDIA_PLAY_PAUSE: 'media_play_pause',
    MEDIA_NEXT: 'media_next',
    MEDIA_PREV: 'media_prev',

    // presentation
    SLIDE_NEXT: 'slide_next',
    SLIDE_PREV: 'slide_prev',
    PRESENT_START: 'present_start',

    // power (require confirmation)
    POWER_LOCK: 'power_lock',
    POWER_SLEEP: 'power_sleep',
    POWER_RESTART: 'power_restart',
    POWER_SHUTDOWN: 'power_shutdown',

    // desktop streaming
    SCREEN_START: 'screen_start',
    SCREEN_STOP: 'screen_stop',
    SCREEN_FRAME: 'screen_frame',
    SCREEN_CONFIG: 'screen_config',
    SCREEN_DISPLAYS: 'screen_displays',
    SCREEN_STATS: 'screen_stats',

    // camera
    CAMERA_START: 'camera_start',
    CAMERA_STOP: 'camera_stop',
    CAMERA_FRAME: 'camera_frame',

    // audio
    AUDIO_START: 'audio_start',
    AUDIO_STOP: 'audio_stop',
    AUDIO_CHUNK: 'audio_chunk',

    // gamepad
    GAMEPAD_CONNECT: 'gamepad_connect',
    GAMEPAD_DISCONNECT: 'gamepad_disconnect',
    GAMEPAD_STATE: 'gamepad_state',

    // clipboard
    CLIPBOARD_SET: 'clipboard_set',
    CLIPBOARD_GET: 'clipboard_get',
    CLIPBOARD_SYNC: 'clipboard_sync',

    // file transfer (chunked / streamed)
    FILE_START: 'file_start',
    FILE_CHUNK: 'file_chunk',
    FILE_COMPLETE: 'file_complete',
    FILE_CANCEL: 'file_cancel',
    FILE_ACK: 'file_ack',
  }

  const CONNECTION_STATE = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error',
  }

  const MOUSE_BUTTON = { LEFT: 'left', RIGHT: 'right', MIDDLE: 'middle' }

  const QUALITY = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CUSTOM: 'custom' }

  // Recommended chunk size for file streaming (256 KB)
  const FILE_CHUNK_SIZE = 256 * 1024

  /** Build a well-formed protocol envelope. */
  function createMessage(type, payload) {
    return Object.assign(
      { v: PROTOCOL_VERSION, type: type, timestamp: Date.now() },
      payload || {},
    )
  }

  /** Encode the QR pairing deep link. Contains only ip/port + a temporary token. */
  function buildPairingUri({ ip, port, token, name }) {
    const params = new URLSearchParams({
      ip: String(ip),
      port: String(port),
      token: String(token),
      name: String(name || 'MAB PC'),
      v: String(PROTOCOL_VERSION),
    })
    return `mab://pair?${params.toString()}`
  }

  /** Parse a pairing deep link back into its parts. Returns null when invalid. */
  function parsePairingUri(uri) {
    try {
      if (!uri || typeof uri !== 'string') return null
      const cleaned = uri.replace(/^mab:\/\//i, 'https://mab.local/')
      const url = new URL(cleaned)
      const ip = url.searchParams.get('ip')
      const port = url.searchParams.get('port')
      const token = url.searchParams.get('token')
      if (!ip || !port || !token) return null
      return {
        ip,
        port: Number(port),
        token,
        name: url.searchParams.get('name') || 'MAB PC',
        v: Number(url.searchParams.get('v') || PROTOCOL_VERSION),
      }
    } catch {
      return null
    }
  }

  /** Minimal runtime validation for inbound messages. */
  function isValidMessage(msg) {
    return (
      msg &&
      typeof msg === 'object' &&
      typeof msg.type === 'string' &&
      msg.v === PROTOCOL_VERSION
    )
  }

  return {
    PROTOCOL_VERSION,
    CHANNEL,
    MSG,
    CONNECTION_STATE,
    MOUSE_BUTTON,
    QUALITY,
    FILE_CHUNK_SIZE,
    createMessage,
    buildPairingUri,
    parsePairingUri,
    isValidMessage,
  }
})
