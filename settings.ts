/* MAB Control - Settings model + defaults (persisted locally). */

export interface Settings {
  general: {
    startWithWindows: boolean
    startMinimized: boolean
    language: 'en' | 'ar'
    notifications: boolean
  }
  connection: {
    port: number
    discovery: boolean
    autoReconnect: boolean
    timeoutSec: number
  }
  security: {
    requireConfirmation: boolean
    encryption: boolean
    tokenTtlMin: number
  }
  display: {
    quality: 'low' | 'medium' | 'high' | 'custom'
    fps: 15 | 30 | 60
    hardwareAcceleration: boolean
    resolution: 'auto' | '720p' | '1080p'
  }
  audio: {
    quality: 'low' | 'medium' | 'high'
    volume: number
  }
  camera: {
    resolution: '720p' | '1080p'
    fps: 15 | 30 | 60
  }
  gaming: {
    sensitivity: number
    deadZone: number
    profile: 'Xbox' | 'Racing' | 'FPS' | 'Custom'
  }
  storage: {
    downloadLocation: string
    keepTempFiles: boolean
  }
  clipboardSync: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  general: {
    startWithWindows: false,
    startMinimized: false,
    language: 'en',
    notifications: true,
  },
  connection: {
    port: 8757,
    discovery: true,
    autoReconnect: true,
    timeoutSec: 10,
  },
  security: {
    requireConfirmation: true,
    encryption: true,
    tokenTtlMin: 5,
  },
  display: {
    quality: 'high',
    fps: 30,
    hardwareAcceleration: true,
    resolution: 'auto',
  },
  audio: {
    quality: 'high',
    volume: 80,
  },
  camera: {
    resolution: '1080p',
    fps: 30,
  },
  gaming: {
    sensitivity: 50,
    deadZone: 10,
    profile: 'Xbox',
  },
  storage: {
    downloadLocation: 'Downloads/MAB Control',
    keepTempFiles: false,
  },
  clipboardSync: true,
}

export const APP_VERSION = '1.0.0'
export const APP_BUILD = '2025.01'
