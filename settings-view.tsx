'use client'

import { useState } from 'react'
import {
  Cog,
  Wifi,
  Monitor,
  Volume2,
  Camera,
  Gamepad2,
  ShieldCheck,
  HardDrive,
  ScrollText,
  Download,
} from 'lucide-react'
import { PageHeader, Panel, Field, Row, Select, Segmented, Toggle } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useMab } from '@/lib/mab-store'
import { DEFAULT_SETTINGS, type Settings } from '@/lib/settings'
import { logger } from '@/lib/logger'

const SECTIONS = [
  { id: 'general', label: 'General', icon: Cog },
  { id: 'connection', label: 'Connection', icon: Wifi },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'display', label: 'Display', icon: Monitor },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'logs', label: 'Logs', icon: ScrollText },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export function SettingsView() {
  const { settings, updateSettings, addActivity } = useMab()
  const [section, setSection] = useState<SectionId>('general')

  // Immutable section-scoped patch helper backed by the canonical updateSettings(full).
  function patch<K extends keyof Settings>(key: K, value: Partial<Settings[K]>) {
    updateSettings({
      ...settings,
      [key]: typeof settings[key] === 'object' ? { ...settings[key], ...value } : value,
    } as Settings)
  }

  function reset() {
    updateSettings(DEFAULT_SETTINGS)
    addActivity('info', 'Settings restored to defaults')
  }

  function exportLogs() {
    const blob = new Blob([logger.export()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mab-control-logs-${Date.now()}.log`
    a.click()
    URL.revokeObjectURL(url)
    addActivity('info', 'Exported debug logs')
  }

  const s = settings

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Settings"
        subtitle="Customize your MAB Control experience."
        actions={
          <Button variant="outline" size="sm" onClick={reset}>
            Reset to defaults
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-[210px_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon
            const activeSec = section === sec.id
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSection(sec.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeSec
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
                {sec.label}
              </button>
            )
          })}
        </nav>

        <Panel>
          {section === 'general' && (
            <div className="flex flex-col divide-y divide-border">
              <Row label="Start with Windows" hint="Launch MAB Control automatically at login.">
                <Toggle
                  checked={s.general.startWithWindows}
                  onChange={(v) => patch('general', { startWithWindows: v })}
                />
              </Row>
              <Row label="Start minimized" hint="Begin hidden in the system tray.">
                <Toggle
                  checked={s.general.startMinimized}
                  onChange={(v) => patch('general', { startMinimized: v })}
                />
              </Row>
              <Row label="Notifications" hint="Show connection and transfer notifications.">
                <Toggle
                  checked={s.general.notifications}
                  onChange={(v) => patch('general', { notifications: v })}
                />
              </Row>
              <Row label="Clipboard sync" hint="Sync copied text between PC and phone.">
                <Toggle
                  checked={s.clipboardSync}
                  onChange={(v) => updateSettings({ ...s, clipboardSync: v })}
                />
              </Row>
              <Row label="Language">
                <Select
                  value={s.general.language}
                  onChange={(v) => patch('general', { language: v })}
                  options={[
                    { label: 'English', value: 'en' },
                    { label: 'العربية', value: 'ar' },
                  ]}
                />
              </Row>
            </div>
          )}

          {section === 'connection' && (
            <div className="flex flex-col divide-y divide-border">
              <Row label="Server port" hint="TCP port the PC listens on for phone connections.">
                <input
                  type="number"
                  value={s.connection.port}
                  onChange={(e) => patch('connection', { port: Number(e.target.value) })}
                  className="h-8 w-28 rounded-lg border border-border bg-secondary/50 px-2.5 text-sm outline-none focus-visible:border-ring"
                />
              </Row>
              <Row label="Device discovery" hint="Advertise this PC over mDNS on the LAN.">
                <Toggle
                  checked={s.connection.discovery}
                  onChange={(v) => patch('connection', { discovery: v })}
                />
              </Row>
              <Row label="Auto reconnect" hint="Re-establish the session after a network drop.">
                <Toggle
                  checked={s.connection.autoReconnect}
                  onChange={(v) => patch('connection', { autoReconnect: v })}
                />
              </Row>
              <Row label="Connection timeout (s)">
                <input
                  type="number"
                  value={s.connection.timeoutSec}
                  onChange={(e) => patch('connection', { timeoutSec: Number(e.target.value) })}
                  className="h-8 w-28 rounded-lg border border-border bg-secondary/50 px-2.5 text-sm outline-none focus-visible:border-ring"
                />
              </Row>
            </div>
          )}

          {section === 'security' && (
            <div className="flex flex-col divide-y divide-border">
              <Row
                label="Require pairing confirmation"
                hint="Prompt on the PC before a new device may control it."
              >
                <Toggle
                  checked={s.security.requireConfirmation}
                  onChange={(v) => patch('security', { requireConfirmation: v })}
                />
              </Row>
              <Row label="Encrypt traffic" hint="AES-256-GCM per-session channel encryption.">
                <Toggle
                  checked={s.security.encryption}
                  onChange={(v) => patch('security', { encryption: v })}
                />
              </Row>
              <Row label="Pairing token lifetime (min)" hint="How long a QR pairing token stays valid.">
                <input
                  type="number"
                  value={s.security.tokenTtlMin}
                  onChange={(e) => patch('security', { tokenTtlMin: Number(e.target.value) })}
                  className="h-8 w-28 rounded-lg border border-border bg-secondary/50 px-2.5 text-sm outline-none focus-visible:border-ring"
                />
              </Row>
            </div>
          )}

          {section === 'display' && (
            <div className="flex flex-col divide-y divide-border">
              <Row label="Streaming quality">
                <Segmented
                  value={s.display.quality}
                  onChange={(v) => patch('display', { quality: v })}
                  options={[
                    { label: 'Low', value: 'low' },
                    { label: 'Med', value: 'medium' },
                    { label: 'High', value: 'high' },
                    { label: 'Custom', value: 'custom' },
                  ]}
                />
              </Row>
              <Row label="Frame rate">
                <Segmented
                  value={String(s.display.fps)}
                  onChange={(v) => patch('display', { fps: Number(v) as 15 | 30 | 60 })}
                  options={[
                    { label: '15', value: '15' },
                    { label: '30', value: '30' },
                    { label: '60', value: '60' },
                  ]}
                />
              </Row>
              <Row label="Resolution">
                <Select
                  value={s.display.resolution}
                  onChange={(v) => patch('display', { resolution: v })}
                  options={[
                    { label: 'Auto', value: 'auto' },
                    { label: '720p', value: '720p' },
                    { label: '1080p', value: '1080p' },
                  ]}
                />
              </Row>
              <Row
                label="Hardware acceleration"
                hint="Use the GPU encoder when available (H.264/H.265)."
              >
                <Toggle
                  checked={s.display.hardwareAcceleration}
                  onChange={(v) => patch('display', { hardwareAcceleration: v })}
                />
              </Row>
            </div>
          )}

          {section === 'audio' && (
            <div className="flex flex-col divide-y divide-border">
              <Row label="Audio quality">
                <Segmented
                  value={s.audio.quality}
                  onChange={(v) => patch('audio', { quality: v })}
                  options={[
                    { label: 'Low', value: 'low' },
                    { label: 'Med', value: 'medium' },
                    { label: 'High', value: 'high' },
                  ]}
                />
              </Row>
              <Row label={`Default volume (${s.audio.volume}%)`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={s.audio.volume}
                  onChange={(e) => patch('audio', { volume: Number(e.target.value) })}
                  className="mab-range w-40"
                  aria-label="Default volume"
                />
              </Row>
            </div>
          )}

          {section === 'camera' && (
            <div className="flex flex-col divide-y divide-border">
              <Row label="Resolution">
                <Select
                  value={s.camera.resolution}
                  onChange={(v) => patch('camera', { resolution: v })}
                  options={[
                    { label: '720p', value: '720p' },
                    { label: '1080p', value: '1080p' },
                  ]}
                />
              </Row>
              <Row label="Frame rate">
                <Segmented
                  value={String(s.camera.fps)}
                  onChange={(v) => patch('camera', { fps: Number(v) as 15 | 30 | 60 })}
                  options={[
                    { label: '15', value: '15' },
                    { label: '30', value: '30' },
                    { label: '60', value: '60' },
                  ]}
                />
              </Row>
            </div>
          )}

          {section === 'gaming' && (
            <div className="flex flex-col divide-y divide-border">
              <Row label="Controller profile">
                <Select
                  value={s.gaming.profile}
                  onChange={(v) => patch('gaming', { profile: v })}
                  options={[
                    { label: 'Xbox', value: 'Xbox' },
                    { label: 'Racing', value: 'Racing' },
                    { label: 'FPS', value: 'FPS' },
                    { label: 'Custom', value: 'Custom' },
                  ]}
                />
              </Row>
              <Row label={`Sensitivity (${s.gaming.sensitivity})`}>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={s.gaming.sensitivity}
                  onChange={(e) => patch('gaming', { sensitivity: Number(e.target.value) })}
                  className="mab-range w-40"
                  aria-label="Controller sensitivity"
                />
              </Row>
              <Row label={`Dead zone (${s.gaming.deadZone}%)`}>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={s.gaming.deadZone}
                  onChange={(e) => patch('gaming', { deadZone: Number(e.target.value) })}
                  className="mab-range w-40"
                  aria-label="Analog dead zone"
                />
              </Row>
            </div>
          )}

          {section === 'storage' && (
            <div className="flex flex-col divide-y divide-border">
              <Field label="Download location">
                <input
                  type="text"
                  value={s.storage.downloadLocation}
                  onChange={(e) => patch('storage', { downloadLocation: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus-visible:border-ring"
                />
              </Field>
              <div className="pt-3">
                <Row label="Keep temporary files" hint="Retain chunk cache after transfers complete.">
                  <Toggle
                    checked={s.storage.keepTempFiles}
                    onChange={(v) => patch('storage', { keepTempFiles: v })}
                  />
                </Row>
              </div>
            </div>
          )}

          {section === 'logs' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-pretty">
                MAB Control keeps a rolling debug log (INFO / WARNING / ERROR / DEBUG). Export it to
                share when troubleshooting connection or streaming issues.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={exportLogs}>
                  <Download className="size-3.5" /> Export logs
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    logger.clear()
                    addActivity('info', 'Debug log cleared')
                  }}
                >
                  Clear log
                </Button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
