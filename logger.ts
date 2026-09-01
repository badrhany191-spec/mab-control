/*
 * MAB Control - LoggingService
 * Levels: DEBUG | INFO | WARNING | ERROR. Each entry carries a timestamp,
 * module and message. Buffers recent entries for the UI and supports export.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

export interface LogEntry {
  id: string
  ts: number
  level: LogLevel
  module: string
  message: string
}

type Listener = (entries: LogEntry[]) => void

const MAX_ENTRIES = 500

class LoggingService {
  private entries: LogEntry[] = []
  private listeners = new Set<Listener>()

  private push(level: LogLevel, moduleName: string, message: string) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      level,
      module: moduleName,
      message,
    }
    this.entries = [...this.entries.slice(-(MAX_ENTRIES - 1)), entry]
    // Mirror to the console for developers.
    const line = `[${level}] [${moduleName}] ${message}`
    if (level === 'ERROR') console.error('[v0]', line)
    else if (level === 'WARNING') console.warn('[v0]', line)
    else console.log('[v0]', line)
    this.listeners.forEach((l) => l(this.entries))
  }

  debug(m: string, msg: string) {
    this.push('DEBUG', m, msg)
  }
  info(m: string, msg: string) {
    this.push('INFO', m, msg)
  }
  warn(m: string, msg: string) {
    this.push('WARNING', m, msg)
  }
  error(m: string, msg: string) {
    this.push('ERROR', m, msg)
  }

  getAll(): LogEntry[] {
    return this.entries
  }

  clear() {
    this.entries = []
    this.listeners.forEach((l) => l(this.entries))
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l)
    l(this.entries)
    return () => this.listeners.delete(l)
  }

  /** Export all logs as a plain-text blob string. */
  export(): string {
    return this.entries
      .map(
        (e) =>
          `${new Date(e.ts).toISOString()} [${e.level}] [${e.module}] ${e.message}`,
      )
      .join('\n')
  }
}

export const logger = new LoggingService()
